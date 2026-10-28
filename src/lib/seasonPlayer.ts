export interface SeasonPlayerOverride {
  photoUrl?: string;
  number?: number;
}

export type PlayerSeasonDataMap = Record<string, SeasonPlayerOverride>;

/**
 * Safely parses the seasonData JSON string or object from Player
 */
export function parsePlayerSeasonData(seasonData: any): PlayerSeasonDataMap {
  if (!seasonData) return {};
  if (typeof seasonData === 'object' && !Array.isArray(seasonData)) {
    return seasonData as PlayerSeasonDataMap;
  }
  if (typeof seasonData === 'string') {
    try {
      const parsed = JSON.parse(seasonData);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as PlayerSeasonDataMap;
      }
    } catch {
      return {};
    }
  }
  return {};
}

/**
 * Resolves a player's photoUrl and number for a specific season (name or ID).
 * If an override exists for that season, it applies it.
 * Otherwise, falls back to player.photoUrl and player.number.
 */
export function resolvePlayerForSeason<T extends { photoUrl?: string | null; number?: number | null; seasonData?: any }>(
  player: T,
  seasonIdentifier?: string | null
): T {
  if (!player) return player;
  if (!seasonIdentifier) return player;

  const cleanSeason = String(seasonIdentifier).trim();
  if (!cleanSeason || cleanSeason === 'all') return player;

  const seasonMap = parsePlayerSeasonData(player.seasonData);
  const override = seasonMap[cleanSeason];

  if (!override) {
    return player;
  }

  return {
    ...player,
    photoUrl: override.photoUrl || player.photoUrl,
    number: typeof override.number === 'number' ? override.number : player.number,
  };
}
