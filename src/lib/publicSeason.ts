// Utility to manage the globally active public season in cookies and localStorage

export const PUBLIC_SEASON_COOKIE = 'public_season';

export function getClientPublicSeason(): string | null {
  if (typeof window === 'undefined') return null;
  const local = localStorage.getItem(PUBLIC_SEASON_COOKIE);
  if (local) return local;

  const cookieMatch = document.cookie.match(new RegExp(`(?:^|; )${PUBLIC_SEASON_COOKIE}=([^;]*)`));
  if (cookieMatch) {
    return decodeURIComponent(cookieMatch[1]);
  }
  return null;
}

export function setClientPublicSeason(seasonName: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PUBLIC_SEASON_COOKIE, seasonName);
  document.cookie = `${PUBLIC_SEASON_COOKIE}=${encodeURIComponent(seasonName)}; path=/; max-age=31536000; SameSite=Lax`;
  window.dispatchEvent(new CustomEvent('public_season_changed', { detail: { season: seasonName } }));
}
