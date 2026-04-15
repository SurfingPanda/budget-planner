import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getCategories, createBudget } from '../api/api';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function getWeekRanges(month, year) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const monthName = MONTHS[month - 1];
  const ranges = [];
  for (let w = 1; w <= 5; w++) {
    const start = (w - 1) * 7 + 1;
    if (start > daysInMonth) break;
    const end = Math.min(w * 7, daysInMonth);
    ranges.push({ week: w, label: `Week ${w}  (${monthName} ${start}–${end})` });
  }
  return ranges;
}

export default function BudgetModal({ onClose, onSaved, month, year }) {
  const [categories,  setCategories]  = useState([]);
  const [periodType,  setPeriodType]  = useState('monthly');
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [form,        setForm]        = useState({ category_id: '', amount: '' });
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');

  const weekRanges = getWeekRanges(month, year);

  useEffect(() => {
    getCategories({ type: 'expense' }).then((r) => setCategories(r.data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.category_id) return setError('Select a category');
    if (!form.amount || Number(form.amount) <= 0) return setError('Enter a valid amount');

    setLoading(true);
    try {
      await createBudget({
        ...form,
        month,
        year,
        period_type: periodType,
        week: periodType === 'weekly' ? selectedWeek : 0,
      });
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">

        {/* header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Set Budget</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {/* Period toggle */}
          <div>
            <label className="label">Budget Period</label>
            <div className="flex rounded-xl border border-gray-200 overflow-hidden">
              {['monthly', 'weekly'].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriodType(p)}
                  className={`flex-1 py-2 text-sm font-medium transition-colors capitalize ${
                    periodType === p
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {p === 'monthly' ? (
                    <span className="flex items-center justify-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Monthly
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Weekly
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Week selector — only for weekly */}
          {periodType === 'weekly' && (
            <div>
              <label className="label">Select Week</label>
              <select
                className="input"
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(Number(e.target.value))}
              >
                {weekRanges.map(({ week, label }) => (
                  <option key={week} value={week}>{label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Category */}
          <div>
            <label className="label">Category</label>
            <select
              className="input"
              value={form.category_id}
              onChange={(e) => setForm((p) => ({ ...p, category_id: e.target.value }))}
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="label">
              {periodType === 'weekly' ? 'Weekly' : 'Monthly'} Limit ($)
            </label>
            <input
              className="input"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
            />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>
              {loading ? 'Saving...' : 'Set Budget'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
