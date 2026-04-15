import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { getTransactions, getCategories } from '../api/api';
import TransactionList from '../components/TransactionList';
import TransactionModal from '../components/TransactionModal';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function Transactions() {
  const now = new Date();
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTx, setEditTx] = useState(null);

  const [filters, setFilters] = useState({
    type: '',
    category_id: '',
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  });

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    const params = {};
    if (filters.type) params.type = filters.type;
    if (filters.category_id) params.category_id = filters.category_id;
    if (filters.month) params.month = filters.month;
    if (filters.year) params.year = filters.year;
    const res = await getTransactions({ ...params, limit: 100 });
    setTransactions(res.data);
    setLoading(false);
  }, [filters]);

  useEffect(() => { loadTransactions(); }, [loadTransactions]);
  useEffect(() => { getCategories().then((r) => setCategories(r.data)); }, []);

  const handleSaved = () => {
    setShowModal(false);
    setEditTx(null);
    loadTransactions();
  };

  const currentYear = now.getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-sm text-gray-500 mt-0.5">{transactions.length} transactions found</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setShowModal(true)}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Transaction
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="label">Type</label>
            <select
              className="input"
              value={filters.type}
              onChange={(e) => setFilters((p) => ({ ...p, type: e.target.value }))}
            >
              <option value="">All types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
          <div>
            <label className="label">Category</label>
            <select
              className="input"
              value={filters.category_id}
              onChange={(e) => setFilters((p) => ({ ...p, category_id: e.target.value }))}
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Month</label>
            <select
              className="input"
              value={filters.month}
              onChange={(e) => setFilters((p) => ({ ...p, month: e.target.value }))}
            >
              <option value="">All months</option>
              {MONTHS.map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Year</label>
            <select
              className="input"
              value={filters.year}
              onChange={(e) => setFilters((p) => ({ ...p, year: e.target.value }))}
            >
              <option value="">All years</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <button
            className="btn-secondary text-sm"
            onClick={() => setFilters({ type: '', category_id: '', month: '', year: '' })}
          >
            Clear filters
          </button>
        </div>
      </div>

      {/* List */}
      <div className="card">
        <TransactionList
          transactions={transactions}
          onEdit={(t) => { setEditTx(t); setShowModal(true); }}
          onDeleted={loadTransactions}
          loading={loading}
        />
      </div>

      {/* Modal */}
      {showModal && (
        <TransactionModal
          transaction={editTx}
          onClose={() => { setShowModal(false); setEditTx(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
