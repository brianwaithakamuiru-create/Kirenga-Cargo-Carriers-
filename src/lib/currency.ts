/**
 * Kenyan Shilling (KES / KSh) Operating Currency Helper
 * Formats currency values consistently throughout Kirenga Cargo Carriers
 * e.g. KSh 25,000.00, KSh 150,500.00, KSh 1,250,000.00
 */

export function formatKES(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'KSh 0.00';
  }
  const formatted = Math.abs(amount).toLocaleString('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return amount < 0 ? `-KSh ${formatted}` : `KSh ${formatted}`;
}

export function parseKES(value: string | number): number {
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  if (!value) return 0;
  const clean = value.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parsed;
}
