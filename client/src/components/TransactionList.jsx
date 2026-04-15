import { useState } from 'react';
import { format } from 'date-fns';
import { deleteTransaction } from '../api/api';
import ConfirmDialog from './ConfirmDialog';

function formatCurrency(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

function formatDate(d) {
  try { return format(new Date(d), 'MMM d, yyyy'); } catch { return d; }
}

export default function TransactionList({ transactions, onEdit, onDeleted, loading }) {
  const [pendingDelete, setPendingDelete] = useState(null); // transaction object

  const handleDeleteConfirm = async () => {
    if (!pendingDelete) return;
    await deleteTransaction(pendingDelete.id);
    setPendingDelete(null);
    onDeleted();
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100">
            <div className="w-10 h-10 bg-gray-200 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="h-3 bg-gray-100 rounded w-1/4" />
            </div>
            <div className="h-5 bg-gray-200 rounded w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (!transactions.length) {
    return (
      <div className="text-center py-16 text-gray-400">
        <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="text-sm font-medium">No transactions found</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {transactions.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all group"
          >
            {/* avatar */}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold"
              style={{ backgroundColor: t.category_color || (t.type === 'income' ? '#22c55e' : '#f43f5e') }}
            >
              {(t.category_name || t.title).charAt(0).toUpperCase()}
            </div>

            {/* info */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{t.title}</p>
              <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5 flex-wrap">
                <span>{formatDate(t.date)}</span>
                {t.account_name && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                      </svg>
                      {t.account_name}
                    </span>
                  </>
                )}
                {t.category_name && (
                  <>
                    <span>·</span>
                    <span className="px-1.5 py-0.5 rounded-md text-white"
                      style={{ backgroundColor: t.category_color || '#6366f1' }}>
                      {t.category_name}
                    </span>
                  </>
                )}
              </div>
              {t.description && (
                <p className="text-xs text-gray-400 mt-0.5 truncate">{t.description}</p>
              )}
            </div>

            {/* amount */}
            <div className="text-right flex-shrink-0">
              <p className={`font-bold text-base ${t.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
              </p>
              <p className="text-xs text-gray-400 capitalize">{t.type}</p>
            </div>

            {/* action buttons — visible on hover */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <button
                onClick={() => onEdit(t)}
                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Edit"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              <button
                onClick={() => setPendingDelete(t)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* custom confirm dialog */}
      {pendingDelete && (
        <ConfirmDialog
          title="Delete Transaction"
          message={`Remove "${pendingDelete.title}" (${formatCurrency(pendingDelete.amount)})? This cannot be undone.`}
          confirmLabel="Yes, Delete"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </>
  );
}
