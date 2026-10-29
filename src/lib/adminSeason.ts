// Utility to manage the globally active admin season in cookies and localStorage

export const ADMIN_SEASON_COOKIE = 'admin_season';

export function getClientAdminSeason(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const local = localStorage.getItem(ADMIN_SEASON_COOKIE);
    if (local) return local;
  } catch {}

  try {
    const cookieMatch = document.cookie.match(new RegExp(`(?:^|; )${ADMIN_SEASON_COOKIE}=([^;]*)`));
    if (cookieMatch) {
      return decodeURIComponent(cookieMatch[1]);
    }
  } catch {}
  return null;
}

export function setClientAdminSeason(seasonName: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ADMIN_SEASON_COOKIE, seasonName);
  } catch {}
  try {
    document.cookie = `${ADMIN_SEASON_COOKIE}=${encodeURIComponent(seasonName)}; path=/; max-age=31536000; SameSite=Lax`;
    window.dispatchEvent(new CustomEvent('admin_season_changed', { detail: { season: seasonName } }));
  } catch {}
}
