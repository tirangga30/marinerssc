/**
 * Timezone-safe date helper functions for Mariners SC
 * Guarantees all match dates & times are parsed and formatted in WIB (Asia/Jakarta, UTC+7)
 * regardless of whether the application is running locally or deployed on Vercel/VPS (UTC).
 */

export const WIB_TIMEZONE = 'Asia/Jakarta';

/**
 * Parses any date string or Date object, ensuring datetime-local inputs
 * without explicit timezone offset are parsed as WIB (+07:00).
 */
export function parseWibDate(dateInput: string | Date | null | undefined): Date {
  if (!dateInput) return new Date();
  if (dateInput instanceof Date) return dateInput;
  const str = String(dateInput).trim();
  if (str.includes('+') || str.endsWith('Z') || (str.includes('-') && str.length > 19)) {
    return new Date(str);
  }
  const formattedStr = str.length === 16 ? `${str}:00+07:00` : `${str}+07:00`;
  const parsed = new Date(formattedStr);
  return isNaN(parsed.getTime()) ? new Date(str) : parsed;
}

/**
 * Formats a Date object into 'YYYY-MM-DDTHH:mm' for <input type="datetime-local"> in WIB.
 */
export function formatDateForInput(dateInput: Date | string | null | undefined): string {
  if (!dateInput) return '';
  const d = parseWibDate(dateInput);
  if (isNaN(d.getTime())) return '';

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: WIB_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(d);
  const getPart = (type: string) => parts.find((p) => p.type === type)?.value || '00';
  let hour = getPart('hour');
  if (hour === '24') hour = '00';

  return `${getPart('year')}-${getPart('month')}-${getPart('day')}T${hour}:${getPart('minute')}`;
}

/**
 * Formats a date into localized WIB string for UI display.
 */
export function formatWibDate(
  dateInput: Date | string | null | undefined,
  options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }
): string {
  if (!dateInput) return '';
  const d = parseWibDate(dateInput);
  if (isNaN(d.getTime())) return '';

  return d.toLocaleDateString('id-ID', {
    ...options,
    timeZone: WIB_TIMEZONE,
  });
}

/**
 * Formats a time into 'HH:mm WIB' for UI display.
 */
export function formatWibTime(dateInput: Date | string | null | undefined): string {
  if (!dateInput) return '';
  const d = parseWibDate(dateInput);
  if (isNaN(d.getTime())) return '';

  const timeStr = d.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: WIB_TIMEZONE,
  }).replace('.', ':');

  return `${timeStr} WIB`;
}
