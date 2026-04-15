import { useState, useEffect, useCallback } from 'react';
import { getBudgets, deleteBudget } from '../api/api';
import BudgetModal from '../components/BudgetModal';
import ConfirmDialog from '../components/ConfirmDialog';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function formatCurrency(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

function getWeekRanges(month, year) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const name = MONTHS_SHORT[month - 1];
  const ranges = [];
  for (let w = 1; w <= 5; w++) {
    const start = (w - 1) * 7 + 1;
    if (start > daysInMonth) break;
    const end = Math.min(w * 7, daysInMonth);
    ranges.push({ week: w, label: `Week ${w}`, range: `${name} ${start}–${end}` });
  }
  return ranges;
}

/* ── BudgetCard ── */
function BudgetCard({ budget, onDelete, periodType, week, month, year }) {
  const spent = parseFloat(budget.spent) || 0;
  const limit = parseFloat(budget.amount);
  const pct   = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
  const over  = spent > limit;

  let periodLabel = '';
  if (periodType === 'weekly') {
    const ranges = getWeekRanges(month, year);
    const wr = ranges.find((r) => r.week === week);
    periodLabel = wr ? wr.range : `Week ${week}`;
  } else {
    periodLabel = MONTHS[month - 1];
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
            style={{ backgroundColor: budget.color || '#6366f1' }}
          >
            {budget.category_name.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{budget.category_name}</p>
            <p className="text-xs text-gray-400">
              {formatCurrency(spent)} of {formatCurrency(limit)}
              <span className="ml-1.5 text-gray-300">·</span>
              <span className="ml-1.5">{periodLabel}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {over && (
            <span className="text-xs font-medium px-2 py-0.5 bg-red-100 text-red-600 rounded-full">
              Over budget
            </span>
          )}
          <button
            onClick={() => onDelete(budget.id)}
            className="text-gray-300 hover:text-red-500 transition-colors"
            title="Remove budget"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            backgroundColor: over ? '#f43f5e' : pct > 80 ? '#f97316' : budget.color || '#6366f1',
          }}
        />
      </div>

      <div className="flex justify-between mt-2 text-xs text-gray-400">
        <span>{pct.toFixed(0)}% used</span>
        <span className={over ? 'text-red-500 font-medium' : ''}>
          {over
            ? `${formatCurrency(spent - limit)} over`
            : `${formatCurrency(limit - spent)} left`}
        </span>
      </div>
    </div>
  );
}

/* ── Page ── */
export default function Budgets() {
  const now = new Date();
  const [month,      setMonth]      = useState(now.getMonth() + 1);
  const [year,       setYear]       = useState(now.getFullYear());
  const [periodType, setPeriodType] = useState('monthly');
  const [week,       setWeek]       = useState(1);
  const [budgets,    setBudgets]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  const weekRanges = getWeekRanges(month, year);

  // When month/year changes, clamp week to valid range
  useEffect(() => {
    if (week > weekRanges.length) setWeek(weekRanges.length);
  }, [month, year, weekRanges.length, week]);

  const loadBudgets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getBudgets({
        month,
        year,
        period_type: periodType,
        week: periodType === 'weekly' ? week : 0,
      });
      setBudgets(res.data);
    } finally {
      setLoading(false);
    }
  }, [month, year, periodType, week]);

  useEffect(() => { loadBudgets(); }, [loadBudgets]);

  const handleDeleteConfirm = async () => {
    await deleteBudget(pendingDelete);
    setPendingDelete(null);
    loadBudgets();
  };

  const totalBudget = budgets.reduce((s, b) => s + parseFloat(b.amount), 0);
  const totalSpent  = budgets.reduce((s, b) => s + parseFloat(b.spent || 0), 0);
  const currentYear = now.getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Budgets</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Set {periodType} spending limits per category
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Month + Year selectors */}
          <select className="input w-36" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {MONTHS.map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>
          <select className="input w-24" value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <button
            className="btn-primary flex items-center gap-2 whitespace-nowrap"
            onClick={() => setShowModal(true)}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Set Budget
          </button>
        </div>
      </div>

      {/* ── Period toggle ── */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Monthly / Weekly tabs */}
        <div className="flex rounded-xl border border-gray-200 overflow-hidden bg-white">
          {[
            { value: 'monthly', label: 'Monthly', icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )},
            { value: 'weekly', label: 'Weekly', icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            )},
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setPeriodType(tab.value)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${
                periodType === tab.value
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Week selector — only when Weekly is active */}
        {periodType === 'weekly' && (
          <div className="flex items-center gap-2 flex-wrap">
            {weekRanges.map(({ week: w, label, range }) => (
              <button
                key={w}
                onClick={() => setWeek(w)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  week === w
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                    : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <span className="font-semibold">{label}</span>
                <span className="ml-1.5 text-xs opacity-70">{range}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Overview cards ── */}
      {budgets.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card">
            <p className="text-sm text-gray-500">
              Total Budgeted <span className="text-gray-400 font-normal">({periodType})</span>
            </p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalBudget)}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-500">Total Spent</p>
            <p className={`text-2xl font-bold mt-1 ${totalSpent > totalBudget ? 'text-red-500' : 'text-gray-900'}`}>
              {formatCurrency(totalSpent)}
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-500">Remaining</p>
            <p className={`text-2xl font-bold mt-1 ${totalBudget - totalSpent < 0 ? 'text-red-500' : 'text-green-600'}`}>
              {formatCurrency(totalBudget - totalSpent)}
            </p>
          </div>
        </div>
      )}

      {/* ── Budget cards ── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card animate-pulse space-y-3">
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
              <div className="h-2 bg-gray-200 rounded-full" />
            </div>
          ))}
        </div>
      ) : budgets.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((b) => (
            <BudgetCard
              key={b.id}
              budget={b}
              onDelete={setPendingDelete}
              periodType={periodType}
              week={week}
              month={month}
              year={year}
            />
          ))}
        </div>
      ) : (
        <div className="card text-center py-16 text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="font-medium text-sm">
            No {periodType} budgets for{' '}
            {periodType === 'weekly'
              ? (() => { const wr = weekRanges.find(r => r.week === week); return wr ? wr.range : `Week ${week}`; })()
              : `${MONTHS[month - 1]} ${year}`}
          </p>
          <p className="text-xs mt-1">Click "Set Budget" to add a spending limit</p>
        </div>
      )}

      {/* ── Modals ── */}
      {showModal && (
        <BudgetModal
          month={month}
          year={year}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); loadBudgets(); }}
        />
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Remove Budget"
          message="Remove this budget limit? Your transactions won't be affected."
          confirmLabel="Yes, Remove"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}
