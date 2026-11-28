import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { formatWibDate, formatWibTime } from '@/lib/date';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: matchId } = await params;

    const [match, systemSetting] = await Promise.all([
      prisma.footballMatch.findUnique({
        where: { id: matchId },
        include: {
          lineups: {
            include: { player: true },
          },
        },
      }),
      (prisma as any).systemSetting.findUnique({
        where: { id: 'default' },
      }).catch(() => null),
    ]);

    if (!match) {
      return new NextResponse('Match not found', { status: 404 });
    }

    const teamName = (systemSetting?.teamName || 'MARS FC').trim();
    const homeTeam = match.isHome ? teamName : match.opponentName;
    const awayTeam = match.isHome ? match.opponentName : teamName;

    const competition = (match.competition || 'FRIENDLY').toUpperCase();
    const stage = (match.stage || match.seasonName || '2026').toUpperCase();
    const dateText = formatWibDate(match.matchDate, {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }) + ' • ' + formatWibTime(match.matchDate) + ' WIB';
    const venueText = match.venue || '—';
    const formation = match.formation || '4-3-3';

    // Separate starters and bench
    const rawStarters = (match.lineups || []).filter((l) => l.isStarter && l.player);
    const rawBench = (match.lineups || []).filter((l) => !l.isStarter && l.player);

    // Auto-detect goalkeeper (lowest on pitch / highest Y)
    let maxTopY = -Infinity;
    let detectedGkPlayerId: string | null = null;
    for (const s of rawStarters) {
      const y = s.y != null && !isNaN(Number(s.y)) ? Number(s.y) : 50;
      if (y > maxTopY) {
        maxTopY = y;
        detectedGkPlayerId = s.player?.id;
      }
    }

    // Default position coordinate presets
    const positionCoordinates: Record<string, { top: number; left: number }> = {
      GK: { top: 88, left: 50 },
      LB: { top: 70, left: 16 },
      CB1: { top: 72, left: 37 },
      CB2: { top: 72, left: 63 },
      RB: { top: 70, left: 84 },
      CM1: { top: 50, left: 32 },
      CM2: { top: 50, left: 68 },
      CAM: { top: 34, left: 50 },
      LW: { top: 16, left: 18 },
      ST: { top: 12, left: 50 },
      RW: { top: 16, left: 82 },
      CDM1: { top: 56, left: 36 },
      CDM2: { top: 56, left: 64 },
    };

    const starters = rawStarters.map((s) => {
      let x = 50;
      let y = 50;
      if (s.x != null && !isNaN(Number(s.x))) {
        x = Number(s.x);
      } else if (s.pitchPosition && positionCoordinates[s.pitchPosition]) {
        x = positionCoordinates[s.pitchPosition].left;
      }

      if (s.y != null && !isNaN(Number(s.y))) {
        y = Number(s.y);
      } else if (s.pitchPosition && positionCoordinates[s.pitchPosition]) {
        y = positionCoordinates[s.pitchPosition].top;
      }

      return {
        number: s.player.number,
        name: s.player.name.split(' ')[0],
        x,
        y,
        isGk: s.player.id === detectedGkPlayerId,
      };
    });

    // Process bench player photos
    const benchWithPhotos = await Promise.all(
      rawBench.map(async (b) => {
        let photoBase64: string | null = null;
        const photoUrl = b.player.photoUrl;

        if (photoUrl && photoUrl !== '/playertemplate.webp') {
          try {
            let buffer: Buffer | null = null;
            if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
              const res = await fetch(photoUrl, { signal: AbortSignal.timeout(3000) });
              if (res.ok) {
                buffer = Buffer.from(await res.arrayBuffer());
              }
            } else {
              const localPath = path.join(process.cwd(), 'public', photoUrl.replace(/^\//, ''));
              if (fs.existsSync(localPath)) {
                buffer = fs.readFileSync(localPath);
              }
            }

            if (buffer) {
              const resized = await sharp(buffer)
                .resize(64, 64, { fit: 'cover', position: 'top' })
                .png()
                .toBuffer();
              photoBase64 = resized.toString('base64');
            }
          } catch {
            photoBase64 = null;
          }
        }

        return {
          number: b.player.number,
          name: b.player.name.split(' ')[0],
          photoBase64,
        };
      })
    );

    // ═══ SVG GENERATION (1080 x 1440 HD) ═══
    const width = 1080;
    const height = 1440;
    const pitchLeft = 60;
    const pitchTop = 195;
    const pitchWidth = 960;
    const pitchHeight = 875;

    // Starter markers SVG
    const starterSvg = starters
      .map((s) => {
        const px = pitchLeft + (s.x / 100) * pitchWidth;
        const py = pitchTop + (s.y / 100) * pitchHeight;
        const ringColor = s.isGk ? '#f59e0b' : '#38bdf8';
        const numColor = s.isGk ? '#fbbf24' : '#ffffff';

        return `
          <g transform="translate(${px}, ${py})">
            <circle cx="0" cy="0" r="28" fill="rgba(0,0,0,0.6)"/>
            <circle cx="0" cy="0" r="26" fill="#0f172a" stroke="${ringColor}" stroke-width="4"/>
            <text x="0" y="8" font-family="monospace, sans-serif" font-size="22" font-weight="900" fill="${numColor}" text-anchor="middle">${s.number}</text>
            <g transform="translate(0, 36)">
              <rect x="-65" y="0" width="130" height="24" rx="6" fill="#0f172a" stroke="#334155" stroke-width="1.5" opacity="0.95"/>
              <text x="0" y="16" font-family="sans-serif" font-size="13" font-weight="bold" fill="#ffffff" text-anchor="middle">${s.name.toUpperCase()}${s.isGk ? ' (GK)' : ''}</text>
            </g>
          </g>
        `;
      })
      .join('\n');

    // Bench horizontal items (gambar kecil menyamping)
    const benchCount = benchWithPhotos.length;
    const itemWidth = Math.min(130, Math.floor((width - 80) / Math.max(1, benchCount)));
    const benchStartX = Math.max(40, (width - benchCount * itemWidth) / 2);
    const benchY = 1205;

    const benchSvg = benchWithPhotos
      .map((b, idx) => {
        const bx = benchStartX + idx * itemWidth + itemWidth / 2;
        const clipId = `bench-clip-${idx}`;

        return `
          <g transform="translate(${bx}, ${benchY})">
            <defs>
              <clipPath id="${clipId}">
                <circle cx="0" cy="0" r="30"/>
              </clipPath>
            </defs>
            <circle cx="0" cy="0" r="32" fill="#1e293b" stroke="#38bdf8" stroke-width="2.5"/>
            ${
              b.photoBase64
                ? `<image href="data:image/png;base64,${b.photoBase64}" x="-30" y="-30" width="60" height="60" clip-path="url(#${clipId})"/>`
                : `<text x="0" y="8" font-family="monospace, sans-serif" font-size="20" font-weight="900" fill="#38bdf8" text-anchor="middle">${b.number}</text>`
            }
            <circle cx="18" cy="-18" r="11" fill="#0f172a" stroke="#38bdf8" stroke-width="1.5"/>
            <text x="18" y="-14" font-family="monospace, sans-serif" font-size="10" font-weight="900" fill="#ffffff" text-anchor="middle">${b.number}</text>
            <text x="0" y="48" font-family="sans-serif" font-size="13" font-weight="bold" fill="#cbd5e1" text-anchor="middle">${b.name}</text>
          </g>
        `;
      })
      .join('\n');

    const svg = `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#07111e"/>
            <stop offset="50%" stop-color="#0d1b2e"/>
            <stop offset="100%" stop-color="#050a12"/>
          </linearGradient>
          <linearGradient id="pitchGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#14532d"/>
            <stop offset="100%" stop-color="#166534"/>
          </linearGradient>
        </defs>

        <!-- Background -->
        <rect width="${width}" height="${height}" fill="url(#bgGrad)"/>

        <!-- ═══ HEADER ═══ -->
        <text x="540" y="55" font-family="sans-serif" font-size="15" font-weight="900" fill="#f59e0b" letter-spacing="3" text-anchor="middle">${competition} • ${stage}</text>
        
        <!-- Teams Title -->
        <text x="540" y="105" font-family="sans-serif" font-size="34" font-weight="900" fill="#ffffff" text-anchor="middle">
          ${homeTeam.toUpperCase()} <tspan fill="#64748b" font-size="26">VS</tspan> ${awayTeam.toUpperCase()}
        </text>

        <!-- Date & Venue -->
        <text x="540" y="140" font-family="sans-serif" font-size="15" font-weight="500" fill="#94a3b8" text-anchor="middle">
          ${dateText} • ${venueText}
        </text>

        <!-- Formation Badge -->
        <rect x="460" y="152" width="160" height="26" rx="13" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5"/>
        <text x="540" y="170" font-family="sans-serif" font-size="12" font-weight="800" fill="#38bdf8" letter-spacing="1.5" text-anchor="middle">FORMASI: ${formation}</text>

        <!-- ═══ TACTICAL PITCH ═══ -->
        <g transform="translate(${pitchLeft}, ${pitchTop})">
          <!-- Pitch Field Base -->
          <rect width="${pitchWidth}" height="${pitchHeight}" rx="24" fill="url(#pitchGrad)" stroke="#22c55e" stroke-width="3"/>
          
          <!-- Pitch Inner Border Line -->
          <rect x="25" y="25" width="${pitchWidth - 50}" height="${pitchHeight - 50}" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="3"/>

          <!-- Halfway line -->
          <line x1="25" y1="${pitchHeight / 2}" x2="${pitchWidth - 25}" y2="${pitchHeight / 2}" stroke="rgba(255,255,255,0.45)" stroke-width="3"/>
          
          <!-- Center circle -->
          <circle cx="${pitchWidth / 2}" cy="${pitchHeight / 2}" r="95" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="3"/>
          <circle cx="${pitchWidth / 2}" cy="${pitchHeight / 2}" r="5" fill="rgba(255,255,255,0.65)"/>

          <!-- Top Penalty Box (Opponent) -->
          <rect x="${(pitchWidth - 440) / 2}" y="25" width="440" height="170" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="3"/>
          <rect x="${(pitchWidth - 220) / 2}" y="25" width="220" height="65" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="3"/>

          <!-- Bottom Penalty Box (Our Goal) -->
          <rect x="${(pitchWidth - 440) / 2}" y="${pitchHeight - 195}" width="440" height="170" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="3"/>
          <rect x="${(pitchWidth - 220) / 2}" y="${pitchHeight - 90}" width="220" height="65" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="3"/>
          <circle cx="${pitchWidth / 2}" cy="${pitchHeight - 130}" r="4" fill="rgba(255,255,255,0.65)"/>
        </g>

        <!-- Starter Markers -->
        ${starterSvg}

        <!-- ═══ BENCH SECTION (CADANGAN MENYAMPING) ═══ -->
        <line x1="60" y1="1120" x2="1020" y2="1120" stroke="#1e293b" stroke-width="2"/>
        
        <text x="60" y="1150" font-family="sans-serif" font-size="14" font-weight="900" fill="#38bdf8" letter-spacing="2">PEMAIN CADANGAN</text>
        <text x="1020" y="1150" font-family="sans-serif" font-size="13" font-weight="bold" fill="#64748b" text-anchor="end">${benchWithPhotos.length} PEMAIN</text>

        <!-- Bench items horizontal -->
        ${benchSvg}

        <!-- Watermark Footer -->
        <text x="540" y="1410" font-family="sans-serif" font-size="12" font-weight="bold" fill="#475569" letter-spacing="2" text-anchor="middle">${teamName.toUpperCase()} • OFFICIAL LINEUP</text>
      </svg>
    `;

    const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();

    return new NextResponse(pngBuffer as any, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=60, s-maxage=60',
      },
    });
  } catch (err: any) {
    console.error('Error generating lineup image:', err);
    return new NextResponse('Internal error generating lineup image', { status: 500 });
  }
}
