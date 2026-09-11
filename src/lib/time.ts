/**
 * Utility functions for handling Asia/Makassar (WITA - UTC+8) time calculations.
 */

export const TIMEZONE = 'Asia/Makassar';

/**
 * Returns YYYY-MM-DD string for today in Asia/Makassar (WITA)
 */
export function getTodayWITA(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/**
 * Returns YYYY-MM-DD string for tomorrow in Asia/Makassar (WITA)
 */
export function getTomorrowWITA(): string {
  const today = getTodayWITA();
  const [y, m, d] = today.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + 1, 12, 0, 0));
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * Returns current date & time formatted in Asia/Makassar timezone
 */
export function getMakassarTime(): {
  dateStr: string; // YYYY-MM-DD
  timeStr: string; // HH:mm:ss
  hhmm: string;    // HH:mm
  dayOfWeek: number; // 0 (Sun) - 6 (Sat)
  formattedFull: string;
  iso: string;
} {
  const now = new Date();
  
  // Formatters using Asia/Makassar timezone
  const dateFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const timeFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const dayOfWeekFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    weekday: 'short',
  });

  const fullFormatter = new Intl.DateTimeFormat('id-ID', {
    timeZone: TIMEZONE,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const dateStr = dateFormatter.format(now); // e.g. "2026-09-08"
  const timeStr = timeFormatter.format(now); // e.g. "08:15:30"
  const hhmm = timeStr.substring(0, 5);       // e.g. "08:15"

  const dayMap: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6
  };
  const dayNameShort = dayOfWeekFormatter.format(now);
  const dayOfWeek = dayMap[dayNameShort] ?? now.getDay();

  return {
    dateStr,
    timeStr,
    hhmm,
    dayOfWeek,
    formattedFull: fullFormatter.format(now),
    iso: now.toISOString(),
  };
}

/**
 * Format a YYYY-MM-DD date into Indonesian formatted date (e.g., "Selasa, 8 September 2026")
 */
export function formatIndonesianDate(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return dateStr;

  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/**
 * Check if today is an active work day based on settings and day of week
 */
export function isWorkDay(dayOfWeek: number, settings: {
  monday_enabled: boolean;
  tuesday_enabled: boolean;
  wednesday_enabled: boolean;
  thursday_enabled: boolean;
  friday_enabled: boolean;
  saturday_enabled: boolean;
  sunday_enabled: boolean;
}): boolean {
  switch (dayOfWeek) {
    case 1: return settings.monday_enabled;
    case 2: return settings.tuesday_enabled;
    case 3: return settings.wednesday_enabled;
    case 4: return settings.thursday_enabled;
    case 5: return settings.friday_enabled;
    case 6: return settings.saturday_enabled;
    case 0: return settings.sunday_enabled;
    default: return true;
  }
}

/**
 * Compares two HH:mm strings. Returns negative if a < b, 0 if equal, positive if a > b.
 */
export function compareHHMM(a: string, b: string): number {
  return a.localeCompare(b);
}
