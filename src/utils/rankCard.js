const { createCanvas, loadImage } = require('@napi-rs/canvas');
const path = require('path');
GlobalFonts.registerFromPath(path.join(__dirname, '../assets/fonts/Inter-Regular.ttf'), 'Inter');
GlobalFonts.registerFromPath(path.join(__dirname, '../assets/fonts/Inter-Bold.ttf'), 'InterBold');

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function fitInside(srcW, srcH, maxW, maxH) {
  const s = Math.min(maxW / srcW, maxH / srcH);
  return { w: Math.floor(srcW * s), h: Math.floor(srcH * s) };
}

async function generateRankCard({ username, discriminator, avatarURL, level, xp, xpNext }) {
  const width = 900;
  const height = 300;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Theme colors
  const bg = '#06110a';
  const panel = '#0f2a18';
  const panelDark = '#0b2414';
  const accent = '#2ecc71';
  const textMain = '#eafff1';
  const textSub = '#b7e7c9';

  // ===== Background =====
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // ===== Outer card =====
  ctx.save();
  roundRect(ctx, 18, 18, width - 36, height - 36, 28);
  ctx.shadowColor = 'rgba(46, 204, 113, 0.18)';
  ctx.shadowBlur = 18;
  ctx.fillStyle = panelDark;
  ctx.fill();
  ctx.restore();

  // ===== Inner panel =====
  ctx.save();
  roundRect(ctx, 30, 30, width - 60, height - 60, 22);
  ctx.fillStyle = panel;
  ctx.fill();
  ctx.restore();

  // ===== Layout anchors =====
  const padL = 60;
  const padR = 60;
  const topY = 55;

  // Avatar
  const avatarSize = 150;
  const avatarX = padL;
  const avatarY = 75;

  // Right sticker area (bigger and anchored)
  const stickerBoxW = 190;
  const stickerBoxH = 220;
  const stickerBoxX = width - padR - stickerBoxW;
  const stickerBoxY = 55;

  // Text area boundaries
  const textX = avatarX + avatarSize + 40;
  const textRight = stickerBoxX - 30; // safe space before sticker

  // ===== Header strip (only behind name area) =====
  const headerH = 58;
  const headerY = topY;
  const headerX = textX - 10;
  const headerW = (textRight - headerX);

  ctx.save();
  roundRect(ctx, headerX, headerY, headerW, headerH, 16);
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = accent;
  ctx.fill();
  ctx.restore();

  // ===== Avatar image + ring =====
  const avatar = await loadImage(avatarURL);

  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 6;
  ctx.shadowColor = 'rgba(46, 204, 113, 0.35)';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // ===== Sticker (pickle-only PNG) =====
  try {
    const stickerPath = path.join(__dirname, '../assets/pickle_sticker.png');
    const sticker = await loadImage(stickerPath);

    const fitted = fitInside(sticker.width, sticker.height, stickerBoxW, stickerBoxH);
    const sx = stickerBoxX + Math.floor((stickerBoxW - fitted.w) / 2);
    const sy = stickerBoxY + Math.floor((stickerBoxH - fitted.h) / 2);

    ctx.drawImage(sticker, sx, sy, fitted.w, fitted.h);
  } catch (_) {
    // ok if missing
  }

  // ===== Username (fits header width) =====
  ctx.fillStyle = textMain;
  ctx.font = '20px Inter';

  let displayName = username;
  while (ctx.measureText(displayName).width > (headerW - 24) && displayName.length > 3) {
    displayName = displayName.slice(0, -1);
  }
  if (displayName !== username) displayName = displayName.slice(0, -1) + '…';

  ctx.fillText(displayName, headerX + 18, headerY + 41);

  // Discriminator (optional)
  if (discriminator && discriminator !== '0') {
    ctx.fillStyle = textSub;
    ctx.font = '20px Inter';
    ctx.fillText(`#${discriminator}`, headerX + 18, headerY + 70);
  }

  // ===== Stats block =====
  const statsY = 155;
  ctx.fillStyle = textMain;
  ctx.font = '20px Inter';
  ctx.fillText(`Level: ${level}`, textX, statsY);

  ctx.fillStyle = textSub;
  ctx.font = '20px Inter';
  ctx.fillText(`XP: ${xp} / ${xpNext}`, textX, statsY + 32);

  // ===== Progress bar (wide, aligned with text area) =====
  const barX = textX;
  const barY = 235;
  const barW = (textRight - barX);
  const barH = 24;

  const progress = xpNext > 0 ? Math.max(0, Math.min(1, xp / xpNext)) : 0;
  const fillW = Math.floor(barW * progress);

  ctx.save();
  roundRect(ctx, barX, barY, barW, barH, 12);
  ctx.fillStyle = '#143220';
  ctx.fill();
  ctx.restore();

  if (fillW > 0) {
    ctx.save();
    roundRect(ctx, barX, barY, fillW, barH, 12);
    ctx.shadowColor = 'rgba(46, 204, 113, 0.45)';
    ctx.shadowBlur = 10;
    ctx.fillStyle = accent;
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  roundRect(ctx, barX, barY, barW, barH, 12);
  ctx.strokeStyle = '#2a6b44';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  return canvas.toBuffer('image/png');
}

module.exports = { generateRankCard };
