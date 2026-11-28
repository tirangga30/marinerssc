/**
 * Client-Side Lineup Image Generator using HTML5 Canvas.
 * Generates high-definition, pixel-perfect PNG images directly on the user's device
 * with native system fonts, completely eliminating server font rendering issues (tofu boxes).
 */

export interface LineupPlayerForCanvas {
  id?: string;
  name: string;
  number: number | string;
  photoUrl?: string;
  x?: number;
  y?: number;
  isStarter?: boolean;
  isGk?: boolean;
  pitchPosition?: string;
}

export interface LineupCanvasOptions {
  match: {
    id: string;
    competition?: string;
    stage?: string;
    seasonName?: string;
    matchDate: string | Date;
    venue?: string;
    isHome?: boolean;
    opponentName: string;
  };
  teamName: string;
  formation: string;
  starters: LineupPlayerForCanvas[];
  bench: LineupPlayerForCanvas[];
}

// Helper to safely load an image as an HTMLImageElement
function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export async function generateLineupCanvas(options: LineupCanvasOptions): Promise<Blob> {
  const { match, teamName, formation, starters, bench } = options;

  const width = 1080;
  const height = 1440;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas 2d context');
  }

  // Pre-load glove icon and player photos (lapangan & cadangan)
  const gloveImgPromise = loadImage('/gk_gloves.png');
  const starterPhotosPromises = starters.map((s) =>
    loadImage(s.photoUrl && s.photoUrl !== '/playertemplate.webp' ? s.photoUrl : '/playertemplate.webp')
  );
  const benchPhotosPromises = bench.slice(0, 10).map((b) =>
    loadImage(b.photoUrl && b.photoUrl !== '/playertemplate.webp' ? b.photoUrl : '/playertemplate.webp')
  );

  const [gloveImg, starterImgs, benchImgs] = await Promise.all([
    gloveImgPromise,
    Promise.all(starterPhotosPromises),
    Promise.all(benchPhotosPromises),
  ]);

  // 1. ═══ BACKGROUND GRADIENT ═══
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#07111e');
  bgGrad.addColorStop(0.5, '#0d1b2e');
  bgGrad.addColorStop(1, '#050a12');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. ═══ HEADER ═══
  const competition = (match.competition || 'FRIENDLY').toUpperCase();
  const stage = (match.stage || match.seasonName || '2026').toUpperCase();
  const homeTeam = (match.isHome ? teamName : match.opponentName).toUpperCase();
  const awayTeam = (match.isHome ? match.opponentName : teamName).toUpperCase();

  let dateStr = '';
  try {
    const d = new Date(match.matchDate);
    dateStr = d.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    dateStr += ` • ${hours}:${mins} WIB`;
  } catch {
    dateStr = 'Jadwal Pertandingan';
  }
  const venueStr = match.venue || '—';

  // Header tag
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillStyle = '#f59e0b';
  ctx.fillText(`${competition} • ${stage}`, 540, 55);

  // Teams VS
  ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillStyle = '#ffffff';
  const vsText = `${homeTeam}   VS   ${awayTeam}`;
  ctx.fillText(vsText, 540, 105);

  // Date & Venue
  ctx.font = 'normal 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(`${dateStr} • ${venueStr}`, 540, 142);

  // Formation Badge
  const badgeW = 170;
  const badgeH = 28;
  const badgeX = 540 - badgeW / 2;
  const badgeY = 158;
  ctx.fillStyle = '#1e293b';
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 14);
  ctx.fill();
  ctx.stroke();

  ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillStyle = '#38bdf8';
  ctx.fillText(`FORMASI: ${formation || '4-3-3'}`, 540, badgeY + badgeH / 2);

  // 3. ═══ TACTICAL PITCH ═══
  const pitchLeft = 60;
  const pitchTop = 205;
  const pitchWidth = 960;
  const pitchHeight = 865;

  // Grass Background
  const pitchGrad = ctx.createLinearGradient(0, pitchTop, 0, pitchTop + pitchHeight);
  pitchGrad.addColorStop(0, '#14532d');
  pitchGrad.addColorStop(1, '#166534');

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(pitchLeft, pitchTop, pitchWidth, pitchHeight, 24);
  ctx.fillStyle = pitchGrad;
  ctx.fill();
  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.clip();

  // Pitch Lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.lineWidth = 3;

  const inset = 25;
  const fieldLeft = pitchLeft + inset;
  const fieldTop = pitchTop + inset;
  const fieldWidth = pitchWidth - inset * 2;
  const fieldHeight = pitchHeight - inset * 2;

  // Inner boundary
  ctx.strokeRect(fieldLeft, fieldTop, fieldWidth, fieldHeight);

  // Halfway line
  const midY = fieldTop + fieldHeight / 2;
  ctx.beginPath();
  ctx.moveTo(fieldLeft, midY);
  ctx.lineTo(fieldLeft + fieldWidth, midY);
  ctx.stroke();

  // Center circle
  const centerX = fieldLeft + fieldWidth / 2;
  ctx.beginPath();
  ctx.arc(centerX, midY, 95, 0, Math.PI * 2);
  ctx.stroke();

  // Center spot
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.beginPath();
  ctx.arc(centerX, midY, 5, 0, Math.PI * 2);
  ctx.fill();

  // Top penalty box (Opponent)
  const penW = 440;
  const penH = 170;
  const penLeft = centerX - penW / 2;
  ctx.strokeRect(penLeft, fieldTop, penW, penH);

  // Top goal area
  const goalW = 220;
  const goalH = 65;
  ctx.strokeRect(centerX - goalW / 2, fieldTop, goalW, goalH);

  // Bottom penalty box (Our side)
  ctx.strokeRect(penLeft, fieldTop + fieldHeight - penH, penW, penH);

  // Bottom goal area
  ctx.strokeRect(centerX - goalW / 2, fieldTop + fieldHeight - goalH, goalW, goalH);

  // Bottom penalty spot
  ctx.beginPath();
  ctx.arc(centerX, fieldTop + fieldHeight - 130, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // 4. ═══ STARTER TOKENS ON PITCH ═══
  // Identify Goalkeeper: lowest player on pitch (highest Y coordinate)
  let maxStarterY = -Infinity;
  let detectedGkId: string | null = null;
  for (const s of starters) {
    const yVal = s.y != null && !isNaN(Number(s.y)) ? Number(s.y) : 50;
    if (yVal > maxStarterY) {
      maxStarterY = yVal;
      detectedGkId = s.id || s.name;
    }
  }

  for (let idx = 0; idx < starters.length; idx++) {
    const s = starters[idx];
    const starterImg = starterImgs[idx];
    const xPct = s.x != null && !isNaN(Number(s.x)) ? Number(s.x) : 50;
    const yPct = s.y != null && !isNaN(Number(s.y)) ? Number(s.y) : 50;
    const px = pitchLeft + (xPct / 100) * pitchWidth;
    const py = pitchTop + (yPct / 100) * pitchHeight;

    const isGk = s.isGk || (s.id && s.id === detectedGkId) || s.name === detectedGkId;
    const ringColor = isGk ? '#f59e0b' : '#38bdf8';

    ctx.save();
    // Shadow
    ctx.beginPath();
    ctx.arc(px, py, 28, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fill();

    // Circle base
    ctx.beginPath();
    ctx.arc(px, py, 26, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();

    // Foto Pemain di dalam lingkaran token lapang
    if (starterImg) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(px, py, 26, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(starterImg, px - 26, py - 26, 52, 52);
      ctx.restore();
    } else {
      ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
      ctx.fillStyle = isGk ? '#fbbf24' : '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(s.number), px, py + 1);
    }

    // Border ring (Gold untuk GK, Cyan untuk Outfield)
    ctx.beginPath();
    ctx.arc(px, py, 26, 0, Math.PI * 2);
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = ringColor;
    ctx.stroke();

    // Name Pill below token: [ Nomor Punggung (Kiri, Biru) | Nama (Gelap) | (Sarung jika Kiper) ]
    const shortName = s.name.split(' ')[0].toUpperCase();
    const numStr = String(s.number);

    ctx.font = 'bold 12px monospace, sans-serif';
    const numW = ctx.measureText(numStr).width;

    ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
    const nameW = ctx.measureText(shortName).width;

    const gloveW = isGk && gloveImg ? 18 : 0;
    const gloveGap = isGk && gloveImg ? 4 : 0;
    const numGap = 6;

    const contentW = numW + numGap + nameW + gloveGap + gloveW;
    const pillW = Math.max(120, contentW + 20);
    const pillH = 26;
    const pillX = px - pillW / 2;
    const pillY = py + 34;

    // Latar kartu nama putih / terang
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, 6);
    ctx.fill();
    ctx.stroke();

    const startX = px - contentW / 2;
    const centerY = pillY + pillH / 2;

    // 1. Nomor punggung di sebelah KIRI nama (berwarna biru #2563eb)
    ctx.font = 'bold 12px monospace, sans-serif';
    ctx.fillStyle = '#2563eb';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(numStr, startX, centerY);

    // 2. Tulisan nama pemain berwarna GELAP (#0f172a)
    const nameX = startX + numW + numGap;
    ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText(shortName, nameX, centerY);

    // 3. Ikon sarung tangan jika Kiper di sebelah kanan nama
    if (isGk && gloveImg) {
      const gloveX = nameX + nameW + gloveGap;
      ctx.drawImage(gloveImg, gloveX, centerY - 8, 16, 16);
    }

    ctx.restore();
  }

  // 5. ═══ BENCH SECTION (CADANGAN MENYAMPING) ═══
  const benchY = 1205;
  ctx.save();

  // Dividing line
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(60, 1120);
  ctx.lineTo(width - 60, 1120);
  ctx.stroke();

  // Bench header
  ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillStyle = '#38bdf8';
  ctx.textAlign = 'left';
  ctx.fillText('PEMAIN CADANGAN', 60, 1150);

  ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.textAlign = 'right';
  ctx.fillText(`${bench.length} PEMAIN`, width - 60, 1150);

  // Render bench players horizontally side by side
  const benchCount = Math.min(10, bench.length);
  if (benchCount > 0) {
    const itemWidth = Math.min(130, Math.floor((width - 80) / benchCount));
    const benchStartX = Math.max(40, (width - benchCount * itemWidth) / 2);

    for (let i = 0; i < benchCount; i++) {
      const b = bench[i];
      const img = benchImgs[i];
      const bx = benchStartX + i * itemWidth + itemWidth / 2;

      // Base circle
      ctx.beginPath();
      ctx.arc(bx, benchY, 32, 0, Math.PI * 2);
      ctx.fillStyle = '#1e293b';
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#38bdf8';
      ctx.stroke();

      // Circular clipped photo
      if (img) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(bx, benchY, 30, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, bx - 30, benchY - 30, 60, 60);
        ctx.restore();
      } else {
        ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
        ctx.fillStyle = '#38bdf8';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(b.number), bx, benchY);
      }

      // Small number badge in top-right
      const badgeBx = bx + 20;
      const badgeBy = benchY - 20;
      ctx.beginPath();
      ctx.arc(badgeBx, badgeBy, 12, 0, Math.PI * 2);
      ctx.fillStyle = '#0f172a';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#38bdf8';
      ctx.stroke();

      ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(b.number), badgeBx, badgeBy + 0.5);

      // Name label below circle
      ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
      ctx.fillStyle = '#cbd5e1';
      ctx.textAlign = 'center';
      ctx.fillText(b.name.split(' ')[0], bx, benchY + 48);
    }
  }

  ctx.restore();

  // 6. ═══ FOOTER WATERMARK ═══
  ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
  ctx.fillStyle = '#475569';
  ctx.textAlign = 'center';
  ctx.fillText(`${teamName.toUpperCase()} • OFFICIAL LINEUP`, 540, 1410);

  // Return PNG Blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to export canvas to PNG blob'));
      },
      'image/png',
      0.95
    );
  });
}
