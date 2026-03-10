# 🚀 Conversational AI Business Intelligence Dashboard

> Upload a marketing dataset → Ask questions in plain English → Get instant interactive charts and insights powered by **Google Gemini**.

![Stack](https://img.shields.io/badge/Frontend-React%20%2B%20Vite%20%2B%20TailwindCSS-blue)
![Stack](https://img.shields.io/badge/Backend-Express.js-green)
![Stack](https://img.shields.io/badge/AI-Google%20Gemini-orange)
![Stack](https://img.shields.io/badge/Charts-Recharts-purple)

---

## 📁 Project Structure

```
bi-dashboard/
├── backend/           ← Express.js API (port 8000)
│   ├── server.js
│   ├── routes/        ← upload.js, query.js
│   ├── services/      ← geminiService.js, dataService.js, chartService.js
│   └── models/        ← db.js (SQLite via better-sqlite3)
├── frontend/          ← React + Vite (port 5173)
│   └── src/
│       ├── App.jsx
│       └── components/
│           ├── FileUpload.jsx
│           ├── ChatInterface.jsx
│           ├── Dashboard.jsx
│           ├── ChartRenderer.jsx
│           └── MetricCards.jsx
├── sample_dataset.csv ← Test data (50 rows, marketing campaigns)
└── README.md
```

---

## ⚙️ Prerequisites

- **Node.js 18+** installed
- **Google Gemini API Key** — [Get one here](https://aistudio.google.com/app/apikey)

---

## 🔧 Setup & Installation

### 1. Clone / Open the project

```bash
cd bi-dashboard
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create your `.env` file:
```bash
copy .env.example .env
```

Edit `backend/.env` and paste your API key:
```
GOOGLE_API_KEY=your_actual_api_key_here
PORT=8000
```

Start the backend:
```bash
npm run dev     # with nodemon (hot reload)
# OR
npm start       # production mode
```

✅ Backend running at: `http://localhost:8000`

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

✅ Frontend running at: `http://localhost:5173`

---

## 🎯 Usage

1. **Open** `http://localhost:5173` in your browser
2. **Upload** `sample_dataset.csv` (or your own marketing CSV/XLSX)
3. **Ask** any question about your data in the chat panel
4. **Explore** the generated interactive charts on the right panel

---

## 💬 Example Queries

| Question | Chart Type |
|----------|-----------|
| Show total revenue by marketing channel | Bar Chart |
| Which campaign type has the highest ROI? | Bar Chart |
| Show conversions by target audience | Bar Chart |
| Compare impressions vs clicks across channels | Scatter Plot |
| Show revenue trend over time | Line Chart |
| Which language gives the highest engagement score? | Bar Chart |
| Show revenue distribution by campaign type | Pie Chart |
| Show leads by customer segment | Pie Chart |
| Now filter this to only show WhatsApp campaigns | (follow-up) |
| Show only Hindi language campaigns | (follow-up) |

---

## 🔌 API Endpoints

### `POST /api/upload`
Upload a CSV or XLSX file.
```json
// FormData: { file: <file> }

// Response:
{
  "success": true,
  "columns": ["Campaign_ID", "Revenue", ...],
  "rowCount": 50,
  "message": "Dataset loaded successfully..."
}
```

### `POST /api/query`
Ask a natural language question.
```json
// Request:
{ "question": "Show total revenue by channel", "conversationHistory": [] }

// Response:
{
  "success": true,
  "chartType": "bar",
  "chartData": [{ "name": "Facebook", "Revenue": 115200 }, ...],
  "metrics": [{ "label": "Total Revenue", "value": "1.2M", "icon": "📊", "color": "blue" }],
  "title": "Total Revenue by Marketing Channel",
  "insight": "Facebook leads with the highest revenue contribution.",
  "filters": [],
  "sqlExecuted": "SELECT ...",
  "rowCount": 7
}
```

---

## 🗂️ Dataset Columns

| Column | Description |
|--------|-------------|
| Campaign_ID | Unique identifier |
| Campaign_Type | Email, Social Media, Influencer, Display, Search |
| Target_Audience | Demographic group |
| Duration | Campaign duration (days) |
| Channel_Used | Google Ads, Facebook, Instagram, WhatsApp, Twitter, YouTube |
| Impressions | Ad impressions |
| Clicks | Ad clicks |
| Leads | Leads generated |
| Conversions | Conversions achieved |
| Revenue | Revenue generated ($) |
| Acquisition_Cost | Cost to acquire customer ($) |
| ROI | Return on investment (%) |
| Language | Campaign language |
| Engagement_Score | Score 0–10 |
| Customer_Segment | Retail, Healthcare, Education, Technology |
| Date | Campaign date (YYYY-MM-DD) |

---

## 🧠 Architecture

```
User Question
     ↓
ChatInterface (React)
     ↓
POST /api/query (Express.js)
     ↓
geminiService → Gemini 2.0 Flash → { chart_type, x_column, y_column, aggregation, filters, ... }
     ↓
dataService → SQLite (better-sqlite3) → rows[]
     ↓
chartService → shaped Recharts data + metrics[]
     ↓
Dashboard + ChartRenderer (React + Recharts)
```

---

## 🛠️ Troubleshooting

| Issue | Fix |
|-------|-----|
| `GOOGLE_API_KEY` error | Make sure `backend/.env` has a valid key |
| Upload fails | Check file is CSV or XLSX, not empty |
| "No dataset loaded" | Upload a file before asking queries |
| Chart doesn't render | Check browser console for errors |
| `better-sqlite3` build error | Run `npm install --build-from-source` in backend |

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TailwindCSS 3 |
| Charts | Recharts 2 |
| Backend | Express.js 4 |
| AI | Google Gemini 2.0 Flash |
| Data | csv-parser + xlsx + better-sqlite3 |
| HTTP | Axios |
| Export | html2canvas |
