/**
 * ChartService: shapes raw data rows into Recharts-compatible format
 * and computes summary metrics.
 */

/**
 * Shape rows for Recharts based on chart type
 */
function shapeChartData(plan, rows) {
  const { chart_type, x_column, y_column, title } = plan;

  if (chart_type === 'pie') {
    // Pie chart: [{ name, value }]
    return rows.map(r => ({
      name: String(r.x),
      value: Number(r.y)
    }));
  }

  if (chart_type === 'scatter') {
    // Scatter: [{ x, y }]
    return rows.map(r => ({
      x: isNaN(r.x) ? r.x : Number(r.x),
      y: Number(r.y)
    }));
  }

  // Bar / Line: [{ name, [y_column]: value }]
  const yKey = y_column || 'value';
  return rows.map(r => ({
    name: String(r.x),
    [yKey]: Number(r.y)
  }));
}

/**
 * Compute summary metrics from the result rows
 */
function computeMetrics(rows, plan) {
  if (!rows || rows.length === 0) return [];

  const values = rows.map(r => Number(r.y)).filter(v => !isNaN(v));
  if (values.length === 0) return [];

  const total = values.reduce((a, b) => a + b, 0);
  const avg = total / values.length;
  const max = Math.max(...values);
  const min = Math.min(...values);

  // Find category with max value
  const maxRow = rows.find(r => Number(r.y) === max);
  const maxCategory = maxRow ? String(maxRow.x) : 'N/A';

  return [
    {
      label: `Total ${plan.y_column || 'Value'}`,
      value: formatNumber(total),
      icon: '📊',
      color: 'blue'
    },
    {
      label: `Average ${plan.y_column || 'Value'}`,
      value: formatNumber(avg),
      icon: '📈',
      color: 'green'
    },
    {
      label: `Max ${plan.y_column || 'Value'}`,
      value: formatNumber(max),
      icon: '🏆',
      color: 'purple'
    },
    {
      label: 'Top Performer',
      value: maxCategory,
      icon: '⭐',
      color: 'orange'
    }
  ];
}

function formatNumber(n) {
  if (isNaN(n)) return 'N/A';
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return Number(n.toFixed(2)).toLocaleString();
}

module.exports = { shapeChartData, computeMetrics };
