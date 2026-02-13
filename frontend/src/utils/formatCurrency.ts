export const formatCurrencyShort = (value: number | null | undefined): string => {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return '$0';
  }

  const absoluteAmount = Math.abs(amount);
  const formatCompact = (divisor: number, suffix: string): string => {
    const compactValue = amount / divisor;
    const formattedCompact = Number(compactValue.toFixed(1)).toString();
    return `$${formattedCompact}${suffix}`;
  };

  if (absoluteAmount >= 1_000_000_000) {
    return formatCompact(1_000_000_000, 'B');
  }

  if (absoluteAmount >= 1_000_000) {
    return formatCompact(1_000_000, 'M');
  }

  if (absoluteAmount >= 1_000) {
    return formatCompact(1_000, 'K');
  }

  if (!Number.isInteger(amount)) {
    return `$${amount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  }

  return `$${amount.toLocaleString('en-US')}`;
};
