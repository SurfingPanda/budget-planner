import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { createTransaction, updateTransaction, getCategories, getAccounts, createLoan } from '../api/api';
import { format } from 'date-fns';

const ACCOUNT_ICONS = {
  cash:          'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
  bank:          'M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z',
  'e-wallet':    'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z',
  'credit-card': 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
  savings:       'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  investment:    'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
  other:         'M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z',
};

export default function TransactionModal({ onClose, onSaved, transaction }) {
  const isEdit = !!transaction;
  const [form, setForm] = useState({
    title: '', amount: '', type: 'expense',
    category_id: '', account_id: '', description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  });
  const [mode,       setMode]       = useState('expense'); // 'expense' | 'income' | 'loan'
  const [categories, setCategories] = useState([]);
  const [accounts,   setAccounts]   = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [loanForm,   setLoanForm]   = useState({
    name: '', principal_amount: '', is_recurring: false,
    monthly_payment: '', payment_day: '',
    start_date: format(new Date(), 'yyyy-MM-dd'), due_date: '',
  });
  const setLoan = (k, v) => setLoanForm((p) => ({ ...p, [k]: v }));

  // Keep transaction amount/date in sync with loan details
  useEffect(() => {
    if (mode === 'loan') {
      setForm((prev) => ({
        ...prev,
        amount: loanForm.principal_amount,
        date:   loanForm.start_date,
      }));
    }
  }, [mode, loanForm.principal_amount, loanForm.start_date]);

  useEffect(() => {
    if (isEdit) {
      setForm({
        title:       transaction.title,
        amount:      transaction.amount,
        type:        transaction.type,
        category_id: transaction.category_id || '',
        account_id:  transaction.account_id  || '',
        description: transaction.description || '',
        date:        transaction.date?.slice(0, 10) || format(new Date(), 'yyyy-MM-dd'),
      });
      setMode(transaction.type);
    }
  }, [transaction]);

  useEffect(() => {
    getCategories({ type: mode === 'income' ? 'income' : 'expense' }).then((r) => setCategories(r.data));
  }, [mode]);

  useEffect(() => {
    getAccounts().then((r) => setAccounts(r.data));
  }, []);

  const switchMode = (m) => {
    setMode(m);
    setForm((prev) => ({
      ...prev,
      type:        m === 'income' ? 'income' : 'expense',
      category_id: '',
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'type' ? { category_id: '' } : {}),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (mode === 'loan') {
      if (!loanForm.name.trim())         return setError('Loan name is required');
      if (!loanForm.principal_amount)    return setError('Principal amount is required');
      if (!loanForm.start_date)          return setError('Start date is required');
      if (loanForm.is_recurring && !loanForm.monthly_payment) return setError('Monthly payment is required for recurring loans');
      if (loanForm.is_recurring && !loanForm.payment_day)     return setError('Payment day is required for recurring loans');
    }
    const title = mode === 'loan'
      ? (form.title.trim() || `Loan — ${loanForm.name}`)
      : form.title.trim();
    if (!title) return setError('Title is required');
    const amount = mode === 'loan' ? loanForm.principal_amount : form.amount;
    if (!amount || isNaN(amount) || Number(amount) <= 0) return setError('Enter a valid amount');
    if (!form.date) return setError('Date is required');
    setLoading(true);
    try {
      if (mode === 'loan' && !isEdit) {
        await createLoan({
          ...loanForm,
          type:              'borrowed',
          remaining_balance: loanForm.principal_amount,
          account_id:        form.account_id || null,
        });
      }
      const payload = {
        ...form,
        title,
        amount,
        type:       mode === 'income' ? 'income' : 'expense',
        account_id: form.account_id || null,
        date:       mode === 'loan' ? loanForm.start_date : form.date,
      };
      if (isEdit) await updateTransaction(transaction.id, payload);
      else        await createTransaction(payload);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {isEdit ? 'Edit Transaction' : mode === 'loan' ? 'New Loan + Transaction' : 'Add Transaction'}
            </h2>
            {mode === 'loan' && (
              <p className="text-xs text-indigo-500 mt-0.5">Creates a loan record and logs the expense</p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">

          {/* ── LOAN MODE ── */}
          {mode === 'loan' ? (
            <>
              {/* Back to expense */}
              <button
                type="button"
                onClick={() => switchMode('expense')}
                className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to regular expense
              </button>

              {/* Loan details card */}
              <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-violet-50 overflow-hidden">
                {/* Card header */}
                <div className="flex items-center gap-2.5 px-4 py-3 bg-indigo-600">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-semibold text-white">Loan Details</span>
                </div>

                <div className="p-4 space-y-3">
                  {/* Loan name + amount in one row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 sm:col-span-1">
                      <label className="label">Loan Name</label>
                      <input className="input" value={loanForm.name}
                        onChange={(e) => setLoan('name', e.target.value)}
                        placeholder="e.g. Car Loan" />
                    </div>
                    <div>
                      <label className="label">Principal Amount</label>
                      <input className="input" type="number" min="0" step="0.01"
                        value={loanForm.principal_amount}
                        onChange={(e) => setLoan('principal_amount', e.target.value)}
                        placeholder="0.00" />
                    </div>
                  </div>

                  {/* Start date */}
                  <div>
                    <label className="label">Start Date</label>
                    <input className="input" type="date"
                      value={loanForm.start_date}
                      onChange={(e) => setLoan('start_date', e.target.value)} />
                  </div>

                  {/* Recurring toggle */}
                  <div className="flex items-center justify-between py-2.5 px-3 bg-white/80 rounded-xl border border-indigo-100">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Recurring monthly payment</p>
                      <p className="text-xs text-gray-400">Fixed payment each month</p>
                    </div>
                    <button type="button"
                      onClick={() => setLoan('is_recurring', !loanForm.is_recurring)}
                      className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${loanForm.is_recurring ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${loanForm.is_recurring ? 'translate-x-5' : ''}`} />
                    </button>
                  </div>

                  {/* Recurring fields */}
                  {loanForm.is_recurring && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="label">Monthly Payment</label>
                        <input className="input" type="number" min="0" step="0.01" placeholder="0.00"
                          value={loanForm.monthly_payment}
                          onChange={(e) => setLoan('monthly_payment', e.target.value)} />
                      </div>
                      <div>
                        <label className="label">Payment Day</label>
                        <input className="input" type="number" min="1" max="31" placeholder="e.g. 15"
                          value={loanForm.payment_day}
                          onChange={(e) => setLoan('payment_day', e.target.value)} />
                      </div>
                      <div className="col-span-2">
                        <label className="label">End Date <span className="text-gray-400 font-normal">(optional)</span></label>
                        <input className="input" type="date"
                          value={loanForm.due_date}
                          onChange={(e) => setLoan('due_date', e.target.value)} />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Account — labeled for loan context */}
              <div>
                <label className="label">Charged to Account</label>
                <p className="text-xs text-gray-400 mb-2">Payments will be credited back to this account</p>
                {accounts.length === 0 ? (
                  <div className="input bg-gray-50 text-gray-400 text-sm">No accounts yet</div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {accounts.map((a) => (
                      <button key={a.id} type="button"
                        onClick={() => setForm((p) => ({ ...p, account_id: p.account_id == a.id ? '' : a.id }))}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all text-left ${
                          form.account_id == a.id
                            ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                            : 'border-gray-100 text-gray-600 hover:border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                          style={{ color: form.account_id == a.id ? '#6366f1' : a.color || '#9ca3af' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d={ACCOUNT_ICONS[a.type] || ACCOUNT_ICONS.other}/>
                        </svg>
                        <div className="min-w-0">
                          <p className="truncate leading-tight">{a.name}</p>
                          <p className="text-xs text-gray-400 font-normal truncate">
                            ${parseFloat(a.current_balance ?? a.initial_balance).toLocaleString()}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Optional notes */}
              <div>
                <label className="label">Notes <span className="text-gray-400 font-normal">(optional)</span></label>
                <textarea className="input resize-none" name="description" value={form.description}
                  onChange={handleChange} rows={2} placeholder="Lender, purpose, etc." />
              </div>
            </>
          ) : (
            /* ── REGULAR EXPENSE / INCOME MODE ── */
            <>
              {/* Type toggle */}
              <div className="flex rounded-xl overflow-hidden border border-gray-200">
                {[
                  { key: 'expense', label: '- Expense', active: 'bg-red-500 text-white'   },
                  { key: 'income',  label: '+ Income',  active: 'bg-green-500 text-white' },
                ].map(({ key, label, active }) => (
                  <button key={key} type="button"
                    onClick={() => switchMode(key)}
                    className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                      mode === key ? active : 'bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Loan Payment toggle (expense only) */}
              {mode === 'expense' && (
                <button
                  type="button"
                  onClick={() => switchMode('loan')}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 hover:border-indigo-300 hover:bg-indigo-50 transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium text-indigo-700">Record as Loan?</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-600">
                      Track repayments
                    </span>
                  </div>
                  <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}

              {/* Title */}
              <div>
                <label className="label">Title</label>
                <input className="input" name="title" value={form.title}
                  onChange={handleChange} placeholder="e.g. Grocery shopping" />
              </div>

              {/* Amount + Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Amount</label>
                  <input className="input" name="amount" type="number" min="0" step="0.01"
                    value={form.amount} onChange={handleChange} placeholder="0.00" />
                </div>
                <div>
                  <label className="label">Date</label>
                  <input className="input" name="date" type="date"
                    value={form.date} onChange={handleChange} />
                </div>
              </div>

              {/* Account */}
              <div>
                <label className="label">Account</label>
                {accounts.length === 0 ? (
                  <div className="input bg-gray-50 text-gray-400 text-sm flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    No accounts yet — add one in the Accounts page
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {accounts.map((a) => (
                      <button key={a.id} type="button"
                        onClick={() => setForm((p) => ({ ...p, account_id: p.account_id == a.id ? '' : a.id }))}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all text-left ${
                          form.account_id == a.id
                            ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                            : 'border-gray-100 text-gray-600 hover:border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                          style={{ color: form.account_id == a.id ? '#6366f1' : a.color || '#9ca3af' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d={ACCOUNT_ICONS[a.type] || ACCOUNT_ICONS.other}/>
                        </svg>
                        <div className="min-w-0">
                          <p className="truncate leading-tight">{a.name}</p>
                          <p className="text-xs text-gray-400 font-normal truncate">
                            ${parseFloat(a.current_balance ?? a.initial_balance).toLocaleString()}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="label">Category</label>
                <select className="input" name="category_id" value={form.category_id} onChange={handleChange}>
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="label">Description <span className="text-gray-400 font-normal">(optional)</span></label>
                <textarea className="input resize-none" name="description" value={form.description}
                  onChange={handleChange} rows={2} placeholder="Add a note..." />
              </div>
            </>
          )}

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={loading}>
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Saving...
                </>
              ) : isEdit ? 'Update' : mode === 'loan' ? 'Add Loan & Record' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
