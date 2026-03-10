const express = require('express');
const { parseQuery } = require('../services/geminiService');
const { executeQuery, getColumns } = require('../services/dataService');
const { shapeChartData, computeMetrics } = require('../services/chartService');

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const { question, conversationHistory = [] } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ error: 'Please provide a question.' });
    }

    // Get available columns
    const columns = getColumns();
    if (columns.length === 0) {
      return res.status(400).json({
        error: 'No dataset loaded. Please upload a CSV or Excel file first.'
      });
    }

    // Step 1: Gemini parses the question into a structured plan
    const geminiResult = await parseQuery(question, columns, conversationHistory);
    if (!geminiResult.success) {
      return res.status(422).json({ error: geminiResult.error });
    }

    const plan = geminiResult.plan;
    console.log('📋 Query plan:', JSON.stringify(plan, null, 2));

    // Step 2: Execute the plan against SQLite
    let queryResult;
    try {
      queryResult = executeQuery(plan);
    } catch (dataErr) {
      return res.status(422).json({ error: dataErr.message });
    }

    // Step 3: Shape data for Recharts
    const chartData = shapeChartData(plan, queryResult.rows);

    // Step 4: Compute summary metrics
    const metrics = computeMetrics(queryResult.rows, plan);

    res.json({
      success: true,
      chartType: plan.chart_type,
      chartData,
      metrics,
      title: plan.title,
      insight: plan.insight,
      xColumn: queryResult.xColumn,
      yColumn: queryResult.yColumn,
      filters: plan.filters || [],
      sqlExecuted: queryResult.sql,
      rowCount: queryResult.rows.length
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
