// Currency configuration (gateway-agnostic, used across payment UI)
export const currencyConfig = {
  defaultCurrency: 'lkr',
  supportedCurrencies: ['lkr', 'usd', 'eur', 'gbp', 'cad', 'aud'],
  formatCurrency: (amount: number, currency: string = 'lkr') => {
    if (currency.toLowerCase() === 'lkr') {
      return `LKR ${amount.toLocaleString()}`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  },
};
