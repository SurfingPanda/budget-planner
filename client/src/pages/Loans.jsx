import { useState, useEffect, useCallback } from 'react';
import { getLoans, createLoan, updateLoan, payOffLoan, payMonthLoan, deleteLoan } from '../api/api';
import ConfirmDialog from '../components/ConfirmDialog';
import { useCurrency } from '../context/CurrencyContext';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

const ORDINAL = (n) => {
  const s = ['th','st','nd','rd'], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

function getNextPaymentDate(payment_day) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = parseInt(payment_day);
  let year  = today.getFullYear();
  let month = today.getMonth();
  let candidate = new Date(year, month, day);
  if (candidate < today) {
    month += 1;
    candidate = new Date(year, month, day);
  }
  return candidate;
}

function getMonthOptions() {
  const now = new Date();
  const months = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    months.push({
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      short: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    });
  }
  return months;
}

const MONTH_OPTIONS = getMonthOptions();

/* ── Modal ── */
function LoanModal({ loan, onClose, onSaved }) {
  const editing = !!loan;
  const [form, setForm] = useState({
    name:              loan?.name              || '',
    type:              loan?.type              || 'borrowed',
    principal_amount:  loan?.principal_amount  || '',
    remaining_balance: loan?.remaining_balance || '',
    is_recurring:      loan?.is_recurring      ? true : false,
    monthly_payment:   loan?.monthly_payment   || '',
    payment_day:       loan?.payment_day       || '',
    start_date:        loan?.start_date ? loan.start_date.slice(0, 10) : '',
    due_date:          loan?.due_date   ? loan.due_date.slice(0, 10)   : '',
    notes:             loan?.notes             || '',
    status:            loan?.status            || 'active',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.principal_amount || !form.start_date) {
      setError('Name, amount, and start date are required.');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateLoan(loan.id, form);
      } else {
        await createLoan(form);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save loan.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/40 backdrop-blur-sm">
      <div className="flex min-h-full items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-t-2xl" />
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900">{editing ? 'Edit Loan' : 'Add Loan'}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && <p className="mb-4 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Loan Name</label>
              <input className="input w-full" placeholder="e.g. Car Loan, Personal Loan"
                value={form.name} onChange={(e) => set('name', e.target.value)} />
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'borrowed', label: 'Borrowed', desc: 'Money I owe', color: 'rose' },
                  { value: 'lent',     label: 'Lent',     desc: 'Money owed to me', color: 'emerald' },
                ].map((opt) => (
                  <button type="button" key={opt.value}
                    onClick={() => set('type', opt.value)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      form.type === opt.value
                        ? opt.color === 'rose'
                          ? 'border-rose-500 bg-rose-50'
                          : 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-semibold text-sm text-gray-900">{opt.label}</p>
                    <p className="text-xs text-gray-500">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Amounts */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Principal Amount</label>
                <input className="input w-full" type="number" min="0" step="0.01" placeholder="0.00"
                  value={form.principal_amount}
                  onChange={(e) => {
                    set('principal_amount', e.target.value);
                    if (!editing) set('remaining_balance', e.target.value);
                  }} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remaining Balance</label>
                <input className="input w-full" type="number" min="0" step="0.01" placeholder="0.00"
                  value={form.remaining_balance}
                  onChange={(e) => set('remaining_balance', e.target.value)} />
              </div>
            </div>

            {/* Recurring toggle */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-gray-900">Recurring monthly payment</p>
                <p className="text-xs text-gray-500">Has a fixed payment each month</p>
              </div>
              <button type="button" onClick={() => set('is_recurring', !form.is_recurring)}
                className={`relative w-11 h-6 rounded-full transition-colors ${form.is_recurring ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.is_recurring ? 'translate-x-5' : ''}`} />
              </button>
            </div>

            {/* Recurring fields */}
            {form.is_recurring && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Payment</label>
                  <input className="input w-full" type="number" min="0" step="0.01" placeholder="0.00"
                    value={form.monthly_payment}
                    onChange={(e) => set('monthly_payment', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Day of Month</label>
                  <input className="input w-full" type="number" min="1" max="31" placeholder="e.g. 15"
                    value={form.payment_day}
                    onChange={(e) => set('payment_day', e.target.value)} />
                </div>
              </div>
            )}

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input className="input w-full" type="date"
                  value={form.start_date} onChange={(e) => set('start_date', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date <span className="text-gray-400">(optional)</span></label>
                <input className="input w-full" type="date"
                  value={form.due_date} onChange={(e) => set('due_date', e.target.value)} />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes <span className="text-gray-400">(optional)</span></label>
              <textarea className="input w-full resize-none" rows={2} placeholder="Lender name, purpose, etc."
                value={form.notes} onChange={(e) => set('notes', e.target.value)} />
            </div>

            {/* Status (edit only) */}
            {editing && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select className="input w-full" value={form.status} onChange={(e) => set('status', e.target.value)}>
                  <option value="active">Active</option>
                  <option value="paid_off">Paid Off</option>
                </select>
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose} className="flex-1 btn-secondary">Cancel</button>
              <button type="submit" disabled={saving} className="flex-1 btn-primary disabled:opacity-60">
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Loan'}
              </button>
            </div>
          </form>
        </div>
      </div>
      </div>
    </div>
  );
}

/* ── Loan Card ── */
function LoanCard({ loan, onEdit, onPayMonth, onPayOff, onDelete }) {
  const { formatCurrency } = useCurrency();
  const isBorrowed = loan.type === 'borrowed';
  const principal  = parseFloat(loan.principal_amount);
  const remaining  = parseFloat(loan.remaining_balance);
  const paidPct    = principal > 0 ? Math.min(100, ((principal - remaining) / principal) * 100) : 100;
  const isPaidOff  = loan.status === 'paid_off';

  return (
    <div className={`card relative overflow-hidden ${isPaidOff ? 'opacity-60' : ''}`}>
      {/* side accent */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${isBorrowed ? 'bg-rose-400' : 'bg-emerald-400'}`} />

      <div className="pl-3">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isBorrowed ? 'bg-rose-100' : 'bg-emerald-100'}`}>
              <svg className={`w-5 h-5 ${isBorrowed ? 'text-rose-600' : 'text-emerald-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isBorrowed
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                }
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900">{loan.name}</p>
              <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                <span className={`whitespace-nowrap text-xs font-medium px-2 py-0.5 rounded-full ${isBorrowed ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {isBorrowed ? 'Borrowed' : 'Lent'}
                </span>
                {isPaidOff && (
                  <span className="whitespace-nowrap text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Paid Off</span>
                )}
                {!!loan.is_recurring && !isPaidOff && (
                  <span className="whitespace-nowrap text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                    Recurring · {ORDINAL(loan.payment_day)} of month
                  </span>
                )}
                {!!loan.is_recurring && !isPaidOff && loan.payment_day && (() => {
                  const next = getNextPaymentDate(loan.payment_day);
                  const today = new Date(); today.setHours(0,0,0,0);
                  const diff = Math.round((next - today) / 86400000);
                  const label = next.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  const urgent = diff <= 7;
                  return (
                    <span className={`whitespace-nowrap text-xs font-medium px-2 py-0.5 rounded-full ${urgent ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                      Next: {label}{diff === 0 ? ' · today' : diff === 1 ? ' · tomorrow' : diff <= 7 ? ` · ${diff}d` : ''}
                    </span>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {!isPaidOff && !!loan.is_recurring && loan.monthly_payment && (
              <button onClick={() => onPayMonth(loan)}
                title="Record this month's payment"
                className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
            )}
            {!isPaidOff && (
              <button onClick={() => onPayOff(loan)}
                title="Mark as fully paid off"
                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
            )}
            <button onClick={() => onEdit(loan)}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button onClick={() => onDelete(loan)}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Amounts */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Principal</p>
            <p className="text-sm font-bold text-gray-900">{formatCurrency(principal)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Remaining</p>
            <p className={`text-sm font-bold ${isPaidOff ? 'text-emerald-600' : isBorrowed ? 'text-rose-600' : 'text-emerald-600'}`}>
              {formatCurrency(remaining)}
            </p>
          </div>
          {!!loan.is_recurring && loan.monthly_payment && (
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Monthly</p>
              <p className="text-sm font-bold text-indigo-600">{formatCurrency(loan.monthly_payment)}</p>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>{paidPct.toFixed(0)}% paid off</span>
            <span>{formatCurrency(principal - remaining)} paid</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${isBorrowed ? 'bg-rose-400' : 'bg-emerald-400'}`}
              style={{ width: `${paidPct}%` }}
            />
          </div>
        </div>

        {/* Dates & notes */}
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span>Started {formatDate(loan.start_date)}</span>
          {loan.due_date && <span>Due {formatDate(loan.due_date)}</span>}
          {loan.notes && <span className="truncate italic">"{loan.notes}"</span>}
        </div>
      </div>
    </div>
  );
}

/* ── Page ── */
export default function Loans() {
  const { formatCurrency } = useCurrency();
  const [loans,      setLoans]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);
  const [editLoan,   setEditLoan]   = useState(null);
  const [confirm,    setConfirm]    = useState(null);
  const [filter,       setFilter]       = useState('active'); // 'all' | 'active' | 'paid_off'
  const [paymentMonth, setPaymentMonth] = useState(null);    // null | 'YYYY-MM'

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const res = await getLoans(params);
      setLoans(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const handlePayMonth = (loan) => {
    setConfirm({
      title: 'Record Monthly Payment?',
      message: `Deduct ${formatCurrency(loan.monthly_payment)} from "${loan.name}"'s remaining balance.`,
      onConfirm: async () => {
        await payMonthLoan(loan.id);
        setConfirm(null);
        load();
      },
    });
  };

  const handlePayOff = (loan) => {
    setConfirm({
      title: 'Mark as Paid Off?',
      message: `"${loan.name}" will be marked as fully paid off.`,
      onConfirm: async () => {
        await payOffLoan(loan.id);
        setConfirm(null);
        load();
      },
    });
  };

  const handleDelete = (loan) => {
    setConfirm({
      title: 'Delete Loan?',
      message: `"${loan.name}" will be permanently deleted.`,
      danger: true,
      onConfirm: async () => {
        await deleteLoan(loan.id);
        setConfirm(null);
        load();
      },
    });
  };

  /* summary numbers */
  const active     = loans.filter((l) => l.status === 'active');
  const totalOwed  = active.filter((l) => l.type === 'borrowed').reduce((s, l) => s + parseFloat(l.remaining_balance), 0);
  const totalLent  = active.filter((l) => l.type === 'lent').reduce((s, l) => s + parseFloat(l.remaining_balance), 0);

  /* month-filtered loans for display */
  const displayedLoans = paymentMonth
    ? loans.filter((l) => {
        if (!l.is_recurring || !l.payment_day) return false;
        // Parse selected month as a Date (first day of that month)
        const [selYear, selMonth] = paymentMonth.split('-').map(Number);
        const selDate = new Date(selYear, selMonth - 1, 1);
        // Loan must have started on or before the end of the selected month
        const startDate = l.start_date ? new Date(l.start_date) : null;
        if (startDate) {
          const startYM = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
          if (startYM > selDate) return false; // loan hasn't started yet this month
        }
        // Loan must not be fully due before the selected month
        if (l.due_date) {
          const due = new Date(l.due_date);
          const dueYM = new Date(due.getFullYear(), due.getMonth(), 1);
          if (dueYM < selDate) return false; // loan already ended
        }
        return true;
      })
    : loans;

  /* monthly due — scoped to selected month when filtered */
  const monthlyDue = paymentMonth
    ? displayedLoans.filter((l) => l.is_recurring && l.monthly_payment).reduce((s, l) => s + parseFloat(l.monthly_payment), 0)
    : active.filter((l) => l.is_recurring && l.monthly_payment).reduce((s, l) => s + parseFloat(l.monthly_payment), 0);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Loans</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track money borrowed and lent</p>
        </div>
        <button className="btn-primary flex items-center gap-2 shadow-md shadow-indigo-100"
          onClick={() => { setEditLoan(null); setShowModal(true); }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Loan
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Total Owed</p>
            <p className="text-xl font-bold text-rose-600">{formatCurrency(totalOwed)}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Total Lent Out</p>
            <p className="text-xl font-bold text-emerald-600">{formatCurrency(totalLent)}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">
              {paymentMonth
                ? `Payments Due · ${MONTH_OPTIONS.find((m) => m.value === paymentMonth)?.label}`
                : 'Monthly Payments Due'}
            </p>
            <p className="text-xl font-bold text-indigo-600">{formatCurrency(monthlyDue)}</p>
          </div>
        </div>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Status tabs */}
        <div className="flex gap-2">
          {[['active','Active'],['all','All'],['paid_off','Paid Off']].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === val ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* Month dropdown */}
        <div className="relative">
          <select
            value={paymentMonth || ''}
            onChange={(e) => setPaymentMonth(e.target.value || null)}
            className="appearance-none pl-3 pr-8 py-1.5 rounded-lg text-sm font-medium border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
          >
            <option value="">All Months</option>
            {MONTH_OPTIONS.map((m) => {
              const count = loans.filter((l) => {
                if (!l.is_recurring || !l.payment_day) return false;
                const [selYear, selMonth] = m.value.split('-').map(Number);
                const selDate = new Date(selYear, selMonth - 1, 1);
                if (l.start_date) {
                  const s = new Date(l.start_date);
                  if (new Date(s.getFullYear(), s.getMonth(), 1) > selDate) return false;
                }
                if (l.due_date) {
                  const d = new Date(l.due_date);
                  if (new Date(d.getFullYear(), d.getMonth(), 1) < selDate) return false;
                }
                return true;
              }).length;
              return (
                <option key={m.value} value={m.value}>
                  {m.label}{count > 0 ? ` (${count} payment${count > 1 ? 's' : ''})` : ''}
                </option>
              );
            })}
          </select>
          <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Loan list */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <svg className="w-6 h-6 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Loading…
        </div>
      ) : displayedLoans.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-gray-400">
          <svg className="w-12 h-12 opacity-30 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="font-medium text-sm">No loans found</p>
          <p className="text-xs mt-1">{paymentMonth ? 'No payments due this month' : 'Add a loan to start tracking'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedLoans.map((loan) => (
            <LoanCard
              key={loan.id}
              loan={loan}
              onEdit={(l) => { setEditLoan(l); setShowModal(true); }}
              onPayMonth={handlePayMonth}
              onPayOff={handlePayOff}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <LoanModal
          loan={editLoan}
          onClose={() => { setShowModal(false); setEditLoan(null); }}
          onSaved={() => { setShowModal(false); setEditLoan(null); load(); }}
        />
      )}

      {/* Confirm dialog */}
      {confirm && (
        <ConfirmDialog
          title={confirm.title}
          message={confirm.message}
          danger={confirm.danger}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
