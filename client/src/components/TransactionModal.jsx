import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { createTransaction, updateTransaction, getCategories, getAccounts } from '../api/api';
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
  const [categories, setCategories] = useState([]);
  const [accounts,   setAccounts]   = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');

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
    }
  }, [transaction]);

  useEffect(() => {
    getCategories({ type: form.type }).then((r) => setCategories(r.data));
  }, [form.type]);

  useEffect(() => {
    getAccounts().then((r) => setAccounts(r.data));
  }, []);

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
    if (!form.title.trim()) return setError('Title is required');
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) return setError('Enter a valid amount');
    if (!form.date) return setError('Date is required');
    setLoading(true);
    try {
      const payload = { ...form, account_id: form.account_id || null };
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
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Edit Transaction' : 'Add Transaction'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Type toggle */}
          <div className="flex rounded-xl overflow-hidden border border-gray-200">
            {['expense', 'income'].map((t) => (
              <button key={t} type="button"
                onClick={() => setForm((prev) => ({ ...prev, type: t, category_id: '' }))}
                className={`flex-1 py-2.5 text-sm font-semibold transition-colors capitalize ${
                  form.type === t
                    ? t === 'income' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                {t === 'income' ? '+ Income' : '- Expense'}
              </button>
            ))}
          </div>

          {/* title */}
          <div>
            <label className="label">Title</label>
            <input className="input" name="title" value={form.title}
              onChange={handleChange} placeholder="e.g. Grocery shopping" />
          </div>

          {/* amount + date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Amount ($)</label>
              <input className="input" name="amount" type="number" min="0" step="0.01"
                value={form.amount} onChange={handleChange} placeholder="0.00" />
            </div>
            <div>
              <label className="label">Date</label>
              <input className="input" name="date" type="date"
                value={form.date} onChange={handleChange} />
            </div>
          </div>

          {/* account selector */}
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
                  <button
                    key={a.id}
                    type="button"
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

          {/* category */}
          <div>
            <label className="label">Category</label>
            <select className="input" name="category_id" value={form.category_id} onChange={handleChange}>
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* description */}
          <div>
            <label className="label">Description (optional)</label>
            <textarea className="input resize-none" name="description" value={form.description}
              onChange={handleChange} rows={2} placeholder="Add a note..." />
          </div>

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
              ) : isEdit ? 'Update' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
