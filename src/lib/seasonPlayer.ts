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
  let override = seasonMap[cleanSeason];

  // Seamless fallback for renamed seasons between 2026 and 2027
  if (cleanSeason === '2026' && (!override || !override.photoUrl) && seasonMap['2027']?.photoUrl) {
    override = {
      ...(override || {}),
      photoUrl: seasonMap['2027'].photoUrl,
      number: typeof override?.number === 'number' ? override.number : seasonMap['2027'].number,
    };
  } else if (cleanSeason === '2027' && (!override || !override.photoUrl) && seasonMap['2026']?.photoUrl) {
    override = {
      ...(override || {}),
      photoUrl: seasonMap['2026'].photoUrl,
      number: typeof override?.number === 'number' ? override.number : seasonMap['2026'].number,
    };
  } else if (!override && cleanSeason === '2026' && seasonMap['2027']) {
    override = seasonMap['2027'];
  } else if (!override && cleanSeason === '2027' && seasonMap['2026']) {
    override = seasonMap['2026'];
  }

  if (!override) {
    return player;
  }

  return {
    ...player,
    photoUrl: override.photoUrl || player.photoUrl,
    number: typeof override.number === 'number' ? override.number : player.number,
  };
}
