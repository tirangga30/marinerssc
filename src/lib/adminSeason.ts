// Utility to manage the globally active admin season in cookies and localStorage

export const ADMIN_SEASON_COOKIE = 'admin_season';

export function getClientAdminSeason(): string | null {
  if (typeof window === 'undefined') return null;
  const local = localStorage.getItem(ADMIN_SEASON_COOKIE);
  if (local) return local;

  const cookieMatch = document.cookie.match(new RegExp(`(?:^|; )${ADMIN_SEASON_COOKIE}=([^;]*)`));
  if (cookieMatch) {
    return decodeURIComponent(cookieMatch[1]);
  }
  return null;
}

export function setClientAdminSeason(seasonName: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ADMIN_SEASON_COOKIE, seasonName);
  document.cookie = `${ADMIN_SEASON_COOKIE}=${encodeURIComponent(seasonName)}; path=/; max-age=31536000; SameSite=Lax`;
  window.dispatchEvent(new CustomEvent('admin_season_changed', { detail: { season: seasonName } }));
}
