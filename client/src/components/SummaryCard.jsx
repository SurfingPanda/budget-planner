export default function SummaryCard({ title, amount, icon, color, subtitle }) {
  const bgMap = {
    green:  'bg-green-50 text-green-600',
    red:    'bg-red-50 text-red-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    blue:   'bg-blue-50 text-blue-600',
  };
  const textMap = {
    green:  'text-green-600',
    red:    'text-red-500',
    indigo: 'text-indigo-600',
    blue:   'text-blue-600',
  };

  const displayAmount = typeof amount === 'number'
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
    : amount;

  return (
    <div className="card flex items-center gap-3 hover:shadow-md transition-shadow duration-200 p-3 sm:p-5">
      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${bgMap[color] || bgMap.indigo}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs sm:text-sm text-gray-500 font-medium leading-tight">{title}</p>
        <p className={`text-lg sm:text-2xl font-bold truncate ${textMap[color] || 'text-gray-900'}`}>
          {displayAmount}
        </p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">{subtitle}</p>}
      </div>
    </div>
  );
}
