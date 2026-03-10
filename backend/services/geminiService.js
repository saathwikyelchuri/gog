const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

/**
 * Parse a natural language question into a structured query plan using Gemini.
 * @param {string} question - User's question
 * @param {string[]} columns - Available column names from dataset
 * @param {Array} conversationHistory - Previous Q&A pairs for follow-up context
 * @returns {Object} Structured plan: { chart_type, x_column, y_column, aggregation, group_by, filters, title, insight }
 */
async function parseQuery(question, columns, conversationHistory = []) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const systemContext = `You are an expert data analyst and visualization specialist. You analyze datasets and generate structured query plans.

Available dataset columns: ${columns.join(', ')}

Column descriptions for the marketing dataset:
- Campaign_ID: Unique identifier for each campaign
- Campaign_Type: Type of campaign (e.g., Email, Social Media, Influencer, Display, Search)
- Target_Audience: Demographic target (e.g., Men 18-24, Women 35-44)
- Duration: Duration of campaign in days
- Channel_Used: Marketing channel (e.g., Google Ads, Facebook, Instagram, WhatsApp, Twitter, YouTube)
- Impressions: Number of times the ad was shown
- Clicks: Number of clicks on the ad
- Leads: Number of leads generated
- Conversions: Number of conversions
- Revenue: Revenue generated from the campaign
- Acquisition_Cost: Cost to acquire a customer
- ROI: Return on investment percentage
- Language: Language of the campaign (e.g., English, Hindi, Spanish, French)
- Engagement_Score: Score from 0-10 indicating engagement level
- Customer_Segment: Customer segment (e.g., Retail, Healthcare, Education, Technology)
- Date: Date of the campaign record

Chart type selection rules - YOU MUST FOLLOW THESE STRICTLY:
1. "pie" - MUST USE this for any questions asking about "share", "distribution", "percentage", "breakdown", or "proportion" (e.g. "Share of revenue by channel").
2. "line" - MUST USE this for any questions asking about "trend", "over time", "history", or when 'Date'/'Duration' is the x-axis.
3. "scatter" - MUST USE this for any questions asking about "correlation", "relationship", or "scatter" between two numeric variables.
4. "bar" - USE ONLY for comparing distinct categories (e.g., "Which campaign...", "Top 5...", "Revenue by...").

Respond ONLY with valid JSON. No explanations, no markdown, no code blocks.`;

  const historyPrompt = conversationHistory.length > 0
    ? `\nConversation history for follow-up context:\n${conversationHistory.map((h, i) =>
        `Q${i + 1}: ${h.question}\nA${i + 1}: Chart showed ${h.chartType || 'unknown'} for ${h.title || 'unknown'}`
      ).join('\n')}\n`
    : '';

  const prompt = `${systemContext}${historyPrompt}

User question: "${question}"

Return a JSON object with exactly these fields:
{
  "chart_type": "bar|line|pie|scatter",
  "x_column": "column name for x-axis (category/time)",
  "y_column": "column name for y-axis (numeric value)",
  "aggregation": "sum|mean|count|max|min|none",
  "group_by": "column name to group (usually same as x_column)",
  "filters": [{"column": "column_name", "value": "filter_value"}],
  "title": "descriptive chart title",
  "insight": "one-sentence insight about what this chart reveals"
}

Rules:
- filters array is empty [] if no filtering needed
- For "Which X has highest Y" questions, use bar chart sorted by Y
- For trend questions use line chart with Date on x_column
- For distribution/share questions use pie chart
- For correlation use scatter
- aggregation is "none" only for scatter charts with raw data
- x_column and group_by are usually the same column`;

  // Retry up to 2 times on rate limit (429)
  let lastErr;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();

      // Extract JSON from response (handle if model wraps in markdown)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Gemini did not return valid JSON');

      const plan = JSON.parse(jsonMatch[0]);

      // Validate required fields
      const required = ['chart_type', 'x_column', 'y_column', 'aggregation', 'group_by', 'title', 'insight'];
      for (const field of required) {
        if (!plan[field]) throw new Error(`Gemini response missing field: ${field}`);
      }

      if (!plan.filters) plan.filters = [];

      return { success: true, plan };
    } catch (err) {
      lastErr = err;
      const is429 = err.message && err.message.includes('429');
      if (is429 && attempt < 2) {
        const wait = (attempt + 1) * 15000; // 15s, 30s
        console.log(`⏳ Rate limited, retrying in ${wait / 1000}s...`);
        await new Promise(r => setTimeout(r, wait));
        continue;
      }
      break;
    }
  }

  console.error('Gemini parsing error:', lastErr?.message);
  return {
    success: false,
    error: lastErr?.message?.includes('429')
      ? 'Gemini API rate limit reached. Please wait 30 seconds and try again.'
      : `Error: ${lastErr?.message} | Could not understand the question. Try rephrasing it or check if you're asking about available columns: ${columns.join(', ')}`
  };
}

module.exports = { parseQuery };
