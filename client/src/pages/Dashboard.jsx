import { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line, ReferenceLine,
} from 'recharts';
import { format } from 'date-fns';
import {
  getSummary, getMonthlyChart, getByCategory, getTransactions,
  getDailyChart, getAccounts, getBudgets,
} from '../api/api';
import SummaryCard from '../components/SummaryCard';
import TransactionList from '../components/TransactionList';
import TransactionModal from '../components/TransactionModal';
import InsightsPanel from '../components/InsightsPanel';
import { useCurrency } from '../context/CurrencyContext';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/* ── shared tooltips — rendered inside component so they can use the hook ── */
function useTooltips() {
  const { formatCurrency, formatCurrencyInt } = useCurrency();

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-sm">
        <p className="font-semibold text-gray-700 mb-2">{label}</p>
        {payload.map((p) => (
          <div key={p.name} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
            <p style={{ color: p.color }} className="font-medium">
              {p.name}: {formatCurrency(p.value)}
            </p>
          </div>
        ))}
      </div>
    );
  };

  const NetTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const val = payload[0]?.value ?? 0;
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-sm">
        <p className="font-semibold text-gray-700 mb-1">{label}</p>
        <p className={`font-bold ${val >= 0 ? 'text-indigo-600' : 'text-red-500'}`}>
          Net: {formatCurrency(val)}
        </p>
      </div>
    );
  };

  return { CustomTooltip, NetTooltip, formatCurrency, formatCurrencyInt };
}

/* ── empty state ── */
function EmptyChart({ message = 'No data yet', hint = 'Add a transaction to get started' }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
      <svg className="w-10 h-10 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
      <p className="text-sm font-medium">{message}</p>
      <p className="text-xs">{hint}</p>
    </div>
  );
}

export default function Dashboard() {
  const { CustomTooltip, NetTooltip, formatCurrency, formatCurrencyInt } = useTooltips();
  const now = new Date();
  const [month] = useState(now.getMonth() + 1);
  const [year]  = useState(now.getFullYear());

  const [summary,         setSummary]         = useState({ total_income: 0, total_expense: 0, balance: 0 });
  const [prevSummary,     setPrevSummary]     = useState(null);
  const [chartData,       setChartData]       = useState([]);
  const [categoryData,    setCategoryData]    = useState([]);
  const [prevCategoryData,setPrevCategoryData]= useState([]);
  const [dailyData,       setDailyData]       = useState([]);
  const [accounts,        setAccounts]        = useState([]);
  const [budgets,         setBudgets]         = useState([]);
  const [recentTx,        setRecentTx]        = useState([]);
  const [txLoading,       setTxLoading]       = useState(true);
  const [showModal,       setShowModal]       = useState(false);
  const [editTx,          setEditTx]          = useState(null);
  const [error,           setError]           = useState('');

  // compute previous month/year for comparisons
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear  = month === 1 ? year - 1 : year;

  const loadAll = useCallback(async () => {
    setTxLoading(true);
    setError('');
    try {
      const [s, prevS, chart, cat, prevCat, daily, accts, bdg, tx] = await Promise.all([
        getSummary({ month, year }),
        getSummary({ month: prevMonth, year: prevYear }),
        getMonthlyChart(),
        getByCategory({ month, year }),
        getByCategory({ month: prevMonth, year: prevYear }),
        getDailyChart({ month, year }),
        getAccounts(),
        getBudgets({ month, year }),
        getTransactions({ month, year, limit: 8 }),
      ]);

      setSummary(s.data);
      setPrevSummary(prevS.data);

      setChartData(
        chart.data.map((row) => ({
          ...row,
          name:    MONTH_NAMES[parseInt(row.month.split('-')[1]) - 1],
          income:  parseFloat(row.income),
          expense: parseFloat(row.expense),
          net:     parseFloat(row.income) - parseFloat(row.expense),
        }))
      );

      setCategoryData(cat.data.map((r) => ({ ...r, total: parseFloat(r.total) })));
      setPrevCategoryData(prevCat.data.map((r) => ({ ...r, total: parseFloat(r.total) })));

      setDailyData(
        daily.data.map((r) => ({
          day:     `${r.day}`,
          income:  parseFloat(r.income),
          expense: parseFloat(r.expense),
        }))
      );

      setAccounts(accts.data);
      setBudgets(bdg.data);
      setRecentTx(tx.data);
    } catch (err) {
      setError('Failed to load data. Please refresh.');
      console.error(err);
    } finally {
      setTxLoading(false);
    }
  }, [month, year, prevMonth, prevYear]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleSaved = () => {
    setShowModal(false);
    setEditTx(null);
    loadAll();
  };

  const savingsRate = summary.total_income > 0
    ? Math.max(0, ((summary.total_income - summary.total_expense) / summary.total_income) * 100).toFixed(0)
    : 0;

  const totalAccountsBalance = accounts.reduce((sum, a) => sum + parseFloat(a.current_balance || 0), 0);

  /* build cumulative net savings trend */
  const netTrend = chartData.map((d, i) => ({
    name: d.name,
    net:  d.net,
  }));

  /* top category total for progress bars */
  const maxCatTotal = categoryData.length > 0 ? categoryData[0].total : 1;

  /* max account balance for progress bars */
  const maxAcctBal = accounts.length > 0
    ? Math.max(...accounts.map((a) => Math.abs(parseFloat(a.current_balance || 0))), 1)
    : 1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">{format(now, 'MMMM yyyy')} overview</p>
        </div>
        <button
          className="btn-primary flex items-center gap-2 shadow-md shadow-indigo-100"
          onClick={() => { setEditTx(null); setShowModal(true); }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Transaction
        </button>
      </div>

      {/* error banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <SummaryCard
          title="Net Balance"
          amount={summary.balance}
          color={summary.balance >= 0 ? 'indigo' : 'red'}
          subtitle="Income minus expenses"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <SummaryCard
          title="Total Income"
          amount={summary.total_income}
          color="green"
          subtitle={format(now, 'MMMM yyyy')}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
            </svg>
          }
        />
        <SummaryCard
          title="Total Expenses"
          amount={summary.total_expense}
          color="red"
          subtitle={format(now, 'MMMM yyyy')}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
            </svg>
          }
        />
        <SummaryCard
          title="Savings Rate"
          amount={`${savingsRate}%`}
          color="blue"
          subtitle="Of income saved"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
        />
        <SummaryCard
          title="Accounts Balance"
          amount={totalAccountsBalance}
          color={totalAccountsBalance >= 0 ? 'green' : 'red'}
          subtitle="Net across all accounts"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          }
        />
      </div>

      {/* ── Smart Insights & Alerts ── */}
      <InsightsPanel
        summary={summary}
        prevSummary={prevSummary}
        categoryData={categoryData}
        prevCategoryData={prevCategoryData}
        budgets={budgets}
        dailyData={dailyData}
      />

      {/* ── Row 1: Income vs Expenses bar + Category donut ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        <div className="card md:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-gray-900">Income vs Expenses</h2>
            <span className="text-xs text-gray-400 font-medium">Last 6 months</span>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} barSize={20} barGap={4} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={1} />
                    <stop offset="100%" stopColor="#86efac" stopOpacity={0.8} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity={1} />
                    <stop offset="100%" stopColor="#fda4af" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `$${v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v}`} width={55} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc', radius: 6 }} />
                <Bar dataKey="income" name="Income" fill="url(#incomeGrad)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expense" name="Expense" fill="url(#expenseGrad)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[240px]"><EmptyChart /></div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-gray-900">By Category</h2>
            <span className="text-xs text-gray-400 font-medium">Expenses</span>
          </div>
          {categoryData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={categoryData} dataKey="total" nameKey="name"
                    cx="50%" cy="50%" outerRadius={80} innerRadius={48} paddingAngle={2}>
                    {categoryData.map((entry, i) => (
                      <Cell key={i} fill={entry.color || `hsl(${i * 45}, 70%, 60%)`} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-1.5 max-h-28 overflow-y-auto">
                {categoryData.slice(0, 5).map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: c.color || `hsl(${i * 45}, 70%, 60%)` }} />
                      <span className="text-gray-600 truncate">{c.name}</span>
                    </div>
                    <span className="font-semibold text-gray-800 ml-2 flex-shrink-0">{formatCurrencyInt(c.total)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[240px]">
              <EmptyChart message="No expenses yet" hint="Add an expense to see breakdown" />
            </div>
          )}
        </div>
      </div>

      {/* ── Row 2: Daily spending area + Account balances ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Daily spending area chart */}
        <div className="card md:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Daily Activity</h2>
              <p className="text-xs text-gray-400 mt-0.5">{format(now, 'MMMM yyyy')} — day by day</p>
            </div>
          </div>
          {dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={dailyData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="dailyIncomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="dailyExpenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                  label={{ value: 'Day', position: 'insideBottomRight', offset: -4, fontSize: 11, fill: '#d1d5db' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `$${v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v}`} width={55} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="income" name="Income"
                  stroke="#22c55e" strokeWidth={2} fill="url(#dailyIncomeGrad)" dot={false} />
                <Area type="monotone" dataKey="expense" name="Expense"
                  stroke="#f43f5e" strokeWidth={2} fill="url(#dailyExpenseGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px]">
              <EmptyChart message="No activity this month" hint="Transactions will appear here day by day" />
            </div>
          )}
        </div>

        {/* Account Balances */}
        <div className="card flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-gray-900">Account Balances</h2>
            <a href="/app/accounts" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
              Manage
            </a>
          </div>
          {accounts.length > 0 ? (
            <div className="space-y-3 flex-1 overflow-y-auto">
              {accounts.map((acct) => {
                const bal = parseFloat(acct.current_balance || 0);
                const pct = Math.min(100, (Math.abs(bal) / maxAcctBal) * 100);
                const isNeg = bal < 0;
                return (
                  <div key={acct.id}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: acct.color || '#6366f1' }} />
                        <span className="text-gray-700 font-medium truncate">{acct.name}</span>
                        <span className="text-xs text-gray-400 capitalize hidden sm:inline">{acct.type?.replace('-', ' ')}</span>
                      </div>
                      <span className={`font-bold flex-shrink-0 ml-2 text-xs ${isNeg ? 'text-red-500' : 'text-gray-900'}`}>
                        {formatCurrencyInt(bal)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: isNeg ? '#f43f5e' : (acct.color || '#6366f1'),
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2">
              <svg className="w-8 h-8 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <p className="text-xs font-medium">No accounts yet</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Row 3: Net Savings Trend + Top Categories ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Monthly net savings trend */}
        <div className="card md:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Monthly Net Savings</h2>
              <p className="text-xs text-gray-400 mt-0.5">Income minus expenses per month</p>
            </div>
          </div>
          {netTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={netTrend} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `$${v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v < -1000 ? `-${(Math.abs(v) / 1000).toFixed(1)}k` : v}`}
                  width={60} />
                <Tooltip content={<NetTooltip />} />
                <ReferenceLine y={0} stroke="#e5e7eb" strokeWidth={1.5} />
                <Line
                  type="monotone" dataKey="net" name="Net"
                  stroke="#6366f1" strokeWidth={2.5}
                  dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#6366f1' }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px]"><EmptyChart message="No data yet" hint="Net savings will show after transactions" /></div>
          )}
        </div>

        {/* Top Spending Categories */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-gray-900">Top Spending</h2>
            <span className="text-xs text-gray-400">{format(now, 'MMM yyyy')}</span>
          </div>
          {categoryData.length > 0 ? (
            <div className="space-y-3">
              {categoryData.slice(0, 6).map((c, i) => {
                const pct = Math.min(100, (c.total / maxCatTotal) * 100);
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-medium text-gray-500 w-4 text-center">{i + 1}</span>
                        <span className="text-gray-700 font-medium truncate">{c.name || 'Uncategorized'}</span>
                      </div>
                      <span className="font-bold text-gray-800 ml-2 flex-shrink-0">{formatCurrencyInt(c.total)}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: c.color || `hsl(${i * 42}, 68%, 58%)` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
              <svg className="w-8 h-8 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              </svg>
              <p className="text-xs font-medium">No expense categories yet</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Recent Transactions ── */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Recent Transactions</h2>
            <p className="text-xs text-gray-400 mt-0.5">{format(now, 'MMMM yyyy')}</p>
          </div>
          <a
            href="/app/transactions"
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 transition-colors"
          >
            View all
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
        <TransactionList
          transactions={recentTx}
          onEdit={(t) => { setEditTx(t); setShowModal(true); }}
          onDeleted={loadAll}
          loading={txLoading}
        />
      </div>

      {/* ── Modal ── */}
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
