/**
 * InsightsPanel — generates and renders smart insights + alerts from financial data.
 * All insight logic lives here; Dashboard just passes raw data.
 */

const fmt = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

/* ── insight generators ─────────────────────────────────────────────────── */

function generateInsights({ summary, prevSummary, categoryData, prevCategoryData, budgets, dailyData }) {
  const insights = [];

  // 1. Total expense vs last month
  if (prevSummary && prevSummary.total_expense > 1 && summary.total_expense > 0) {
    const diff = summary.total_expense - prevSummary.total_expense;
    const pct  = Math.round(Math.abs((diff / prevSummary.total_expense) * 100));
    if (pct >= 5) {
      insights.push(
        diff > 0
          ? { type: 'warning', tag: 'Spending', text: `Your total spending is up ${pct}% compared to last month.` }
          : { type: 'success', tag: 'Spending', text: `Nice! Your total spending is down ${pct}% from last month.` }
      );
    }
  }

  // 2. Income vs last month
  if (prevSummary && prevSummary.total_income > 1 && summary.total_income > 0) {
    const diff = summary.total_income - prevSummary.total_income;
    const pct  = Math.round(Math.abs((diff / prevSummary.total_income) * 100));
    if (pct >= 10) {
      insights.push(
        diff > 0
          ? { type: 'success', tag: 'Income', text: `Your income increased by ${pct}% compared to last month.` }
          : { type: 'warning', tag: 'Income', text: `Your income dropped by ${pct}% compared to last month.` }
      );
    }
  }

  // 3. Per-category spending spikes / drops
  if (categoryData.length > 0 && prevCategoryData.length > 0) {
    categoryData.forEach((cat) => {
      const prev = prevCategoryData.find((p) => p.name === cat.name);
      if (!prev || prev.total < 5) return;
      const diff = cat.total - prev.total;
      const pct  = Math.round((diff / prev.total) * 100);
      if (pct >= 30 && diff > 15) {
        insights.push({
          type: 'warning',
          tag: cat.name,
          text: `You spent ${pct}% more on ${cat.name} this month (${fmt(cat.total)} vs ${fmt(prev.total)}).`,
        });
      } else if (pct <= -30 && Math.abs(diff) > 15) {
        insights.push({
          type: 'success',
          tag: cat.name,
          text: `You cut ${cat.name} spending by ${Math.abs(pct)}% this month (${fmt(cat.total)} vs ${fmt(prev.total)}).`,
        });
      }
    });
  }

  // 4. Budget alerts — over budget
  budgets.forEach((b) => {
    const spent = parseFloat(b.spent);
    const limit = parseFloat(b.amount);
    if (limit <= 0) return;
    const pct = (spent / limit) * 100;
    if (spent > limit) {
      insights.push({
        type: 'danger',
        tag: 'Over Budget',
        text: `${b.category_name} budget exceeded — you're ${fmt(spent - limit)} over your ${fmt(limit)} limit.`,
      });
    } else if (pct >= 85) {
      insights.push({
        type: 'warning',
        tag: 'Near Limit',
        text: `${b.category_name} is at ${pct.toFixed(0)}% of its budget. Only ${fmt(limit - spent)} remaining.`,
      });
    }
  });

  // 5. Expenses exceed income
  if (summary.total_income > 0 && summary.total_expense > summary.total_income) {
    insights.push({
      type: 'danger',
      tag: 'Cash Flow',
      text: `Your expenses exceed income by ${fmt(summary.total_expense - summary.total_income)} this month.`,
    });
  }

  // 6. Excellent savings rate
  if (summary.total_income > 0) {
    const rate = ((summary.total_income - summary.total_expense) / summary.total_income) * 100;
    if (rate >= 30) {
      insights.push({
        type: 'success',
        tag: 'Savings',
        text: `Excellent! You're saving ${rate.toFixed(0)}% of your income this month.`,
      });
    }
  }

  // 7. No income but has expenses
  if (summary.total_income === 0 && summary.total_expense > 0) {
    insights.push({
      type: 'info',
      tag: 'Heads Up',
      text: `No income recorded this month, but you've spent ${fmt(summary.total_expense)} so far.`,
    });
  }

  // 8. Biggest spending day
  if (dailyData.length > 0) {
    const maxDay = dailyData.reduce((a, b) => (a.expense > b.expense ? a : b));
    if (maxDay.expense > 0) {
      insights.push({
        type: 'info',
        tag: 'Activity',
        text: `Your highest spending day this month was day ${maxDay.day} with ${fmt(maxDay.expense)} in expenses.`,
      });
    }
  }

  // 9. No transactions at all
  if (summary.total_income === 0 && summary.total_expense === 0) {
    insights.push({
      type: 'info',
      tag: 'Getting Started',
      text: 'No transactions this month yet. Add one to start tracking your finances.',
    });
  }

  return insights;
}

/* ── visual config per type ─────────────────────────────────────────────── */

const TYPE_STYLES = {
  danger: {
    border: 'border-red-200',
    bg: 'bg-red-50',
    tag: 'bg-red-100 text-red-700',
    icon: (
      <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
    ),
  },
  warning: {
    border: 'border-orange-200',
    bg: 'bg-orange-50',
    tag: 'bg-orange-100 text-orange-700',
    icon: (
      <svg className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  success: {
    border: 'border-green-200',
    bg: 'bg-green-50',
    tag: 'bg-green-100 text-green-700',
    icon: (
      <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  info: {
    border: 'border-blue-200',
    bg: 'bg-blue-50',
    tag: 'bg-blue-100 text-blue-700',
    icon: (
      <svg className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
};

/* ── component ──────────────────────────────────────────────────────────── */

export default function InsightsPanel({ summary, prevSummary, categoryData, prevCategoryData, budgets, dailyData }) {
  const insights = generateInsights({ summary, prevSummary, categoryData, prevCategoryData, budgets, dailyData });

  // Sort: danger first, then warning, success, info
  const ORDER = { danger: 0, warning: 1, success: 2, info: 3 };
  insights.sort((a, b) => ORDER[a.type] - ORDER[b.type]);

  return (
    <div className="card">
      {/* header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-gray-900">Smart Insights</h2>
          {insights.filter((i) => i.type === 'danger' || i.type === 'warning').length > 0 && (
            <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold">
              {insights.filter((i) => i.type === 'danger' || i.type === 'warning').length}
            </span>
          )}
        </div>
        <span className="text-xs text-gray-400">vs last month</span>
      </div>

      {insights.length === 0 ? (
        <div className="flex items-center gap-3 py-3 text-sm text-gray-500">
          <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Everything looks great! No alerts this month.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {insights.map((insight, i) => {
            const s = TYPE_STYLES[insight.type];
            return (
              <div
                key={i}
                className={`flex items-start gap-2.5 p-3 rounded-xl border ${s.border} ${s.bg}`}
              >
                {s.icon}
                <div className="min-w-0">
                  <span className={`inline-block text-xs font-semibold px-1.5 py-0.5 rounded-md mb-1 ${s.tag}`}>
                    {insight.tag}
                  </span>
                  <p className="text-xs text-gray-700 leading-snug">{insight.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
