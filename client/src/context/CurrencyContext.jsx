import { createContext, useContext, useState } from 'react';

export const CURRENCIES = [
  { code: 'USD', label: 'US Dollar',           symbol: '$'   },
  { code: 'EUR', label: 'Euro',                 symbol: '€'   },
  { code: 'GBP', label: 'British Pound',        symbol: '£'   },
  { code: 'PHP', label: 'Philippine Peso',      symbol: '₱'   },
  { code: 'JPY', label: 'Japanese Yen',         symbol: '¥'   },
  { code: 'CNY', label: 'Chinese Yuan',         symbol: 'CN¥' },
  { code: 'KRW', label: 'South Korean Won',     symbol: '₩'   },
  { code: 'INR', label: 'Indian Rupee',         symbol: '₹'   },
  { code: 'AUD', label: 'Australian Dollar',    symbol: 'A$'  },
  { code: 'CAD', label: 'Canadian Dollar',      symbol: 'C$'  },
  { code: 'SGD', label: 'Singapore Dollar',     symbol: 'S$'  },
  { code: 'HKD', label: 'Hong Kong Dollar',     symbol: 'HK$' },
  { code: 'TWD', label: 'Taiwan Dollar',        symbol: 'NT$' },
  { code: 'MYR', label: 'Malaysian Ringgit',    symbol: 'RM'  },
  { code: 'IDR', label: 'Indonesian Rupiah',    symbol: 'Rp'  },
  { code: 'THB', label: 'Thai Baht',            symbol: '฿'   },
  { code: 'VND', label: 'Vietnamese Dong',      symbol: '₫'   },
  { code: 'BRL', label: 'Brazilian Real',       symbol: 'R$'  },
  { code: 'MXN', label: 'Mexican Peso',         symbol: 'MX$' },
  { code: 'CHF', label: 'Swiss Franc',          symbol: 'CHF' },
];

const CurrencyContext = createContext(null);

export function CurrencyProvider({ children }) {
  const [currency, setCurrencyState] = useState(
    () => localStorage.getItem('bp_currency') || 'USD'
  );

  const setCurrency = (code) => {
    localStorage.setItem('bp_currency', code);
    setCurrencyState(code);
  };

  const formatCurrency = (n, opts = {}) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      ...opts,
    }).format(n || 0);

  // No-decimal variant for charts / compact display
  const formatCurrencyInt = (n) =>
    formatCurrency(n, { maximumFractionDigits: 0 });

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatCurrency, formatCurrencyInt, CURRENCIES }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => useContext(CurrencyContext);
