import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { getAccounts, createAccount, updateAccount, deleteAccount } from '../api/api';
import ConfirmDialog from '../components/ConfirmDialog';
import { useCurrency } from '../context/CurrencyContext';

/* ── account type config ── */
const ACCOUNT_TYPES = [
  { value: 'cash',        label: 'Cash',            color: '#22c55e', bg: 'bg-green-50',   text: 'text-green-700',  border: 'border-green-200' },
  { value: 'bank',        label: 'Bank Account',    color: '#3b82f6', bg: 'bg-blue-50',    text: 'text-blue-700',   border: 'border-blue-200'  },
  { value: 'e-wallet',    label: 'E-Wallet',        color: '#8b5cf6', bg: 'bg-violet-50',  text: 'text-violet-700', border: 'border-violet-200'},
  { value: 'credit-card', label: 'Credit Card',     color: '#f43f5e', bg: 'bg-rose-50',    text: 'text-rose-700',   border: 'border-rose-200'  },
  { value: 'savings',     label: 'Savings Account', color: '#14b8a6', bg: 'bg-teal-50',    text: 'text-teal-700',   border: 'border-teal-200'  },
  { value: 'investment',  label: 'Investment',      color: '#f97316', bg: 'bg-orange-50',  text: 'text-orange-700', border: 'border-orange-200'},
  { value: 'other',       label: 'Other',           color: '#6b7280', bg: 'bg-gray-50',    text: 'text-gray-700',   border: 'border-gray-200'  },
];

const typeConfig = (value) => ACCOUNT_TYPES.find((t) => t.value === value) || ACCOUNT_TYPES[6];

/* ── type icon ── */
function AccountIcon({ type, size = 'md' }) {
  const sz = size === 'lg' ? 'w-7 h-7' : 'w-5 h-5';
  const icons = {
    cash:          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />,
    bank:          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />,
    'e-wallet':    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />,
    'credit-card': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />,
    savings:       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
    investment:    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />,
    other:         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />,
  };
  return (
    <svg className={sz} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {icons[type] || icons.other}
    </svg>
  );
}

/* ── Account Modal ── */
function AccountModal({ account, onClose, onSaved }) {
  const isEdit = !!account;
  const [form, setForm] = useState({
    name: '', type: 'cash', initial_balance: '', color: '#6366f1',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  useEffect(() => {
    if (isEdit) setForm({
      name: account.name,
      type: account.type,
      initial_balance: account.initial_balance,
      color: account.color || '#6366f1',
    });
  }, [account]);

  // sync color to selected type
  const handleTypeChange = (val) => {
    const cfg = typeConfig(val);
    setForm((p) => ({ ...p, type: val, color: cfg.color }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) return setError('Account name is required');
    setLoading(true);
    try {
      if (isEdit) await updateAccount(account.id, form);
      else        await createAccount(form);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md"
        style={{ animation: 'scaleIn 0.2s cubic-bezier(0.34,1.56,0.64,1) both' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Edit Account' : 'Add Account'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* account type grid */}
          <div>
            <label className="label">Account Type</label>
            <div className="grid grid-cols-2 gap-2">
              {ACCOUNT_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => handleTypeChange(t.value)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                    form.type === t.value
                      ? `${t.bg} ${t.text} ${t.border}`
                      : 'border-gray-100 text-gray-500 hover:border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <span style={{ color: form.type === t.value ? t.color : '#9ca3af' }}>
                    <AccountIcon type={t.value} />
                  </span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* name */}
          <div>
            <label className="label">Account Name</label>
            <input
              className="input"
              placeholder={`e.g. ${
                form.type === 'bank' ? 'BDO Savings' :
                form.type === 'e-wallet' ? 'GCash' :
                form.type === 'credit-card' ? 'BPI Credit Card' : 'My Wallet'
              }`}
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            />
          </div>

          {/* initial balance */}
          <div>
            <label className="label">
              {isEdit ? 'Initial Balance ($)' : 'Starting Balance ($)'}
              <span className="text-gray-400 font-normal ml-1 text-xs">
                {isEdit ? '(used as base for balance calculation)' : '(current balance in this account)'}
              </span>
            </label>
            <input
              className="input"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={form.initial_balance}
              onChange={(e) => setForm((p) => ({ ...p, initial_balance: e.target.value }))}
            />
          </div>

          {/* color picker */}
          <div>
            <label className="label">Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.color}
                onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))}
                className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5"
              />
              <div className="flex gap-2">
                {['#6366f1','#22c55e','#3b82f6','#f43f5e','#f97316','#14b8a6','#8b5cf6'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, color: c }))}
                    className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${form.color === c ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Saving...
                </>
              ) : isEdit ? 'Save Changes' : 'Add Account'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

/* ── Account Card ── */
function AccountCard({ account, onEdit, onDelete }) {
  const { formatCurrency } = useCurrency();
  const cfg     = typeConfig(account.type);
  const balance = parseFloat(account.current_balance ?? account.initial_balance);
  const income  = parseFloat(account.income_total  || 0);
  const expense = parseFloat(account.expense_total || 0);
  const isNeg   = balance < 0;

  return (
    <div className="card hover:shadow-md transition-all duration-200 group relative overflow-hidden">
      {/* accent bar */}
      <div className="absolute top-0 left-0 w-1 h-full rounded-l-2xl" style={{ backgroundColor: account.color || cfg.color }} />

      <div className="pl-3">
        {/* top row */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${account.color || cfg.color}20` }}>
              <span style={{ color: account.color || cfg.color }}>
                <AccountIcon type={account.type} size="lg" />
              </span>
            </div>
            <div>
              <p className="font-semibold text-gray-900">{account.name}</p>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                {cfg.label}
              </span>
            </div>
          </div>

          {/* actions */}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onEdit(account)}
              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
              </svg>
            </button>
            <button onClick={() => onDelete(account)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          </div>
        </div>

        {/* balance */}
        <div className="mb-4">
          <p className="text-xs text-gray-400 mb-0.5">Current Balance</p>
          <p className={`text-3xl font-extrabold tracking-tight ${isNeg ? 'text-red-500' : 'text-gray-900'}`}>
            {formatCurrency(balance)}
          </p>
        </div>

        {/* income / expense stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-50 rounded-xl px-3 py-2">
            <p className="text-xs text-green-600 font-medium">Income</p>
            <p className="text-sm font-bold text-green-700">{formatCurrency(income)}</p>
          </div>
          <div className="bg-red-50 rounded-xl px-3 py-2">
            <p className="text-xs text-red-500 font-medium">Expenses</p>
            <p className="text-sm font-bold text-red-600">{formatCurrency(expense)}</p>
          </div>
        </div>

        {/* tx count */}
        <p className="text-xs text-gray-400 mt-3">
          {account.transaction_count || 0} transaction{account.transaction_count !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════ PAGE ══════════════════════════════════════ */
export default function Accounts() {
  const { formatCurrency } = useCurrency();
  const [accounts,      setAccounts]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [showModal,     setShowModal]     = useState(false);
  const [editAccount,   setEditAccount]   = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAccounts();
      // fetch income/expense totals per account
      setAccounts(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSaved = () => { setShowModal(false); setEditAccount(null); load(); };

  const handleDeleteConfirm = async () => {
    await deleteAccount(pendingDelete.id);
    setPendingDelete(null);
    load();
  };

  const totalBalance = accounts.reduce((s, a) => s + parseFloat(a.current_balance ?? a.initial_balance), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Accounts</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your cash, bank & e-wallet accounts</p>
        </div>
        <button className="btn-primary flex items-center gap-2 shadow-md shadow-indigo-100"
          onClick={() => { setEditAccount(null); setShowModal(true); }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
          </svg>
          Add Account
        </button>
      </div>

      {/* total net worth banner */}
      {accounts.length > 0 && (
        <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-indigo-200 text-sm font-medium">Total Net Worth</p>
            <p className="text-4xl font-extrabold mt-1">{formatCurrency(totalBalance)}</p>
            <p className="text-indigo-300 text-xs mt-1">Across {accounts.length} account{accounts.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {accounts.slice(0, 4).map((a) => (
              <div key={a.id} className="bg-white/10 backdrop-blur rounded-xl px-4 py-2 text-center min-w-[100px]">
                <p className="text-white/70 text-xs truncate max-w-[90px]">{a.name}</p>
                <p className="text-white font-bold text-sm mt-0.5">{formatCurrency(a.current_balance)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* account cards grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card animate-pulse space-y-4">
              <div className="flex gap-3">
                <div className="w-11 h-11 bg-gray-200 rounded-xl"/>
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-4 bg-gray-200 rounded w-1/2"/>
                  <div className="h-3 bg-gray-100 rounded w-1/3"/>
                </div>
              </div>
              <div className="h-8 bg-gray-200 rounded w-2/3"/>
              <div className="grid grid-cols-2 gap-2">
                <div className="h-12 bg-gray-100 rounded-xl"/>
                <div className="h-12 bg-gray-100 rounded-xl"/>
              </div>
            </div>
          ))}
        </div>
      ) : accounts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((a) => (
            <AccountCard
              key={a.id}
              account={a}
              onEdit={(acc) => { setEditAccount(acc); setShowModal(true); }}
              onDelete={setPendingDelete}
            />
          ))}
        </div>
      ) : (
        <div className="card text-center py-20">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">No accounts yet</h3>
          <p className="text-sm text-gray-400 mb-5">Add your cash, bank accounts, and e-wallets to get started.</p>
          <button className="btn-primary mx-auto flex items-center gap-2 w-fit"
            onClick={() => setShowModal(true)}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
            </svg>
            Add your first account
          </button>
        </div>
      )}

      {/* modals */}
      {showModal && (
        <AccountModal
          account={editAccount}
          onClose={() => { setShowModal(false); setEditAccount(null); }}
          onSaved={handleSaved}
        />
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Delete Account"
          message={`Delete "${pendingDelete.name}"? Transactions linked to it won't be deleted but will lose the account link.`}
          confirmLabel="Yes, Delete"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}
