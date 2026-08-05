import { COLORS, GAME_W, GAME_H, STAGE_NAMES, BRANCH_LABELS } from '../game/constants.js';
import { getBranchScores } from '../data/plants.js';

const S = GAME_W / 384;
const JAR = { x: Math.round(68 * S), y: Math.round(26 * S), w: Math.round(248 * S), h: Math.round(154 * S) };
const SOIL_H = Math.round(28 * S);

function px(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x), Math.floor(y), w, h);
}

function shade(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255;
  let g = (n >> 8) & 255;
  let b = n & 255;
  r = Math.max(0, Math.min(255, r + amount));
  g = Math.max(0, Math.min(255, g + amount));
  b = Math.max(0, Math.min(255, b + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function drawSoftShadow(ctx, cx, cy, rx, ry, alpha = 0.22) {
  ctx.globalAlpha = alpha;
  for (let row = 0; row < ry * 2; row += 1) {
    const t = row / (ry * 2);
    const halfW = rx * Math.sin(Math.PI * t);
    px(ctx, cx - halfW, cy - ry + row, halfW * 2, 1, COLORS.shadowDeep);
  }
  ctx.globalAlpha = 1;
}

function drawVolumeLeaf(ctx, cx, cy, angle, radius, w, base) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const steps = Math.max(5, Math.floor(radius / 2));
  const hi = shade(base, 22);
  const lo = shade(base, -28);
  const lit = sin < -0.2;

  for (let i = 0; i < steps; i += 1) {
    const t = i / steps;
    const lx = cx + cos * radius * t;
    const ly = cy + sin * radius * t * 0.55 - 4 * S;
    const edge = lit ? hi : lo;
    px(ctx, lx - w / 2, ly - 2, w, 5, i < steps * 0.35 ? lo : base);
    px(ctx, lx - w / 2 + (lit ? 0 : 1), ly - 1, w - 2, 2, i === steps - 1 ? edge : base);
    if (i === steps - 1) px(ctx, lx - 1, ly - 3, 2, 2, hi);
  }
}

function drawFatLeaf(ctx, x, y, dx, dy, len, w, color, hi) {
  const lo = shade(color, -24);
  const highlight = hi ?? shade(color, 18);
  for (let i = 0; i < len; i += 1) {
    const lx = x + dx * i;
    const ly = y + dy * i;
    const t = i / len;
    px(ctx, lx - Math.floor(w / 2), ly - 1, w, 4, t < 0.4 ? lo : color);
    px(ctx, lx - Math.floor(w / 2) + (dx < 0 ? 0 : 1), ly, w - 2, 2, t > 0.6 ? highlight : color);
  }
}

function drawRosetteLeaf(ctx, cx, cy, angle, radius, w, color, hi) {
  drawVolumeLeaf(ctx, cx, cy, angle, radius, w, color);
}

function drawPlantShadow(ctx, x, y, stage) {
  const spread = Math.min(28 * S, 8 * S + stage * 2 * S);
  drawSoftShadow(ctx, x, y + 4 * S, spread, 5 * S, 0.18 + stage * 0.015);
}

/* ---------- shared early stages ---------- */

function drawSeed(ctx, x, y) {
  px(ctx, x - 4, y - 1, 8, 3, COLORS.soilDark);
  px(ctx, x - 3, y - 3, 6, 5, COLORS.soil);
  px(ctx, x - 2, y - 2, 4, 4, COLORS.seed);
  px(ctx, x - 1, y - 1, 2, 2, COLORS.seedHi);
  px(ctx, x, y - 3, 1, 1, COLORS.soilLight);
}

function drawAwaken(ctx, x, y) {
  px(ctx, x - 5, y, 10, 2, COLORS.soilLight);
  px(ctx, x - 4, y - 1, 8, 1, COLORS.soilDark);
  px(ctx, x - 1, y - 6, 2, 6, COLORS.leafPale);
  px(ctx, x - 2, y - 2, 4, 2, COLORS.leafYoung);
  px(ctx, x - 3, y - 1, 1, 1, COLORS.soilPebb);
  px(ctx, x + 2, y - 1, 1, 1, COLORS.soilPebb);
}

/* ---------- succulent sprites (echeveria-style) ---------- */

/** Thick wedge leaf — the iconic sen đá shape */
function drawEcheveriaLeaf(ctx, cx, cy, angle, length, maxW, color, tipColor) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const hi = shade(color, 28);
  const lo = shade(color, -34);
  const tip = tipColor ?? shade(color, 12);

  for (let step = 0; step < length; step += 1) {
    const t = step / length;
    const w = Math.max(2, maxW * (1 - t * 0.9));
    const bx = cx + cos * step * 1.1;
    const by = cy + sin * step * 0.48 - 2 * S;
    const body = step < length * 0.18 ? lo : (t > 0.82 ? tip : color);
    px(ctx, bx - w / 2, by - 2, w, 5, body);
    px(ctx, bx - w / 2 + 1, by - 3, Math.max(1, w - 2), 2, hi);
    if (t > 0.75 && tipColor) {
      px(ctx, bx - 1, by - 4, 2, 2, tipColor);
    } else if (step >= length - 2) {
      px(ctx, bx - 1, by - 4, 2, 2, hi);
    }
  }
}

function drawEcheveriaRosette(ctx, cx, cy, leafCount, leafLen, leafW, baseColor, opts = {}) {
  const { tipColor, offsetAngle = 0, scale = 1 } = opts;
  const len = Math.round(leafLen * scale);
  const w = Math.round(leafW * scale);
  const order = [];
  for (let i = 0; i < leafCount; i += 1) {
    const angle = (i / leafCount) * Math.PI * 2 + offsetAngle - Math.PI / 2;
    order.push({ angle, i });
  }
  order.sort((a, b) => Math.sin(a.angle) - Math.sin(b.angle));
  for (const { angle, i } of order) {
    const c = shade(baseColor, (i % 4) * 3 - 6);
    drawEcheveriaLeaf(ctx, cx, cy, angle, len, w, c, tipColor);
  }
  px(ctx, cx - Math.round(2 * scale * S), cy - Math.round(4 * scale * S), Math.round(4 * scale * S), Math.round(3 * scale * S), shade(baseColor, -18));
}

function drawSprout(ctx, x, y, variant) {
  const c = [COLORS.leafYoung, COLORS.leafBright, COLORS.leafMid][variant % 3];
  drawEcheveriaLeaf(ctx, x, y, -Math.PI * 0.72, Math.round(4 * S), Math.round(3.5 * S), c, COLORS.leafPale);
  drawEcheveriaLeaf(ctx, x, y, -Math.PI * 0.28, Math.round(4 * S), Math.round(3.5 * S), c, COLORS.leafPale);
  px(ctx, x - 1, y - 1, 2, 2, shade(COLORS.leaf, -10));
}

function drawSeedling(ctx, x, y, variant) {
  const c = [COLORS.leafMid, COLORS.leafBright, COLORS.leafYoung][variant % 3];
  drawEcheveriaRosette(ctx, x, y, 4, Math.round(5 * S), Math.round(4 * S), c, { tipColor: COLORS.leafPale, offsetAngle: variant * 0.4 });
}

function drawGrowing(ctx, x, y, variant) {
  const c = [COLORS.leafMid, COLORS.leafBright, COLORS.leafYoung][variant % 3];
  drawEcheveriaRosette(ctx, x, y, 7, Math.round(6 * S), Math.round(4.5 * S), c, { tipColor: shade(c, 16), offsetAngle: variant * 0.3 });
}

function drawPreBranch(ctx, x, y, variant) {
  const c = [COLORS.leafMid, COLORS.leafBright, COLORS.leafYoung][variant % 3];
  drawEcheveriaRosette(ctx, x, y, 9, Math.round(7 * S), Math.round(5 * S), c, { tipColor: COLORS.leafPale, offsetAngle: variant * 0.25 });
  px(ctx, x - 2, y - Math.round(10 * S), 4, 4, COLORS.leafPale);
  px(ctx, x - 1, y - Math.round(12 * S), 2, 3, COLORS.sparkle);
}

function drawRosette(ctx, x, y, stage, variant) {
  const count = stage >= 8 ? 15 : 12;
  const len = stage >= 8 ? Math.round(9 * S) : Math.round(7.5 * S);
  const w = stage >= 8 ? Math.round(5.5 * S) : Math.round(4.5 * S);
  const tip = variant === 1 ? COLORS.bloom : shade(COLORS.leafPale, 8);
  drawEcheveriaRosette(ctx, x, y, count, len, w, COLORS.leafMid, { tipColor: tip, offsetAngle: variant * 0.35 });
  if (variant === 1) {
    for (let i = 0; i < 5; i += 1) {
      const a = (i / 5) * Math.PI * 2 + variant;
      const lx = x + Math.cos(a) * Math.round(8 * S);
      const ly = y + Math.sin(a) * Math.round(4 * S) - Math.round(6 * S);
      px(ctx, lx, ly, 2, 2, COLORS.bloom);
    }
  }
  if (stage >= 8) {
    px(ctx, x - 2, y - Math.round(14 * S), 4, Math.round(10 * S), COLORS.leafMid);
    px(ctx, x - 5, y - Math.round(20 * S), 10, 5, COLORS.flower);
    px(ctx, x - 2, y - Math.round(21 * S), 4, 3, COLORS.whiteHot);
  }
}

function drawDesert(ctx, x, y, stage) {
  const blues = [COLORS.succulentBlueLo, COLORS.succulentBlue, COLORS.succulentBlueHi];
  const stacks = stage >= 8
    ? [[0, 0, 1], [-8, 5, 0.72], [9, 4, 0.68], [-5, -9, 0.6], [7, -7, 0.55]]
    : [[0, 0, 1], [-7, 4, 0.75], [8, 3, 0.7]];
  stacks.forEach(([ox, oy, sc], i) => {
    drawEcheveriaRosette(ctx, x + ox, y + oy, sc >= 0.9 ? 11 : 8,
      Math.round(6 * S), Math.round(4 * S), blues[i % blues.length],
      { tipColor: shade(blues[i % blues.length], 20), scale: sc, offsetAngle: i * 0.5 });
  });
}

function drawGarden(ctx, x, y, stage) {
  drawRosette(ctx, x, y, 7, 0);
  const pups = stage >= 8
    ? [[-20, 5, 0.45], [18, 6, 0.42], [-14, 11, 0.38], [15, 10, 0.38], [-6, 12, 0.35], [8, 11, 0.35]]
    : [[-16, 4, 0.4], [15, 5, 0.38], [-10, 8, 0.35], [12, 7, 0.35]];
  for (const [ox, oy, sc] of pups) {
    drawEcheveriaRosette(ctx, x + ox, y + oy, 7, Math.round(5 * S), Math.round(3.5 * S),
      COLORS.leafYoung, { tipColor: COLORS.leafPale, scale: sc, offsetAngle: ox * 0.05 });
  }
}

/* ---------- fern sprites ---------- */

function drawFernFrond(ctx, bx, by, dirX, len, spread, stemColor, leafColor, droop = 0) {
  const leafLo = shade(leafColor, -22);
  const leafHi = shade(leafColor, 14);
  for (let i = 0; i < len; i += 1) {
    const fx = bx + dirX * i * 3;
    const fy = by - i * 2 + Math.floor((i * i * droop) / 12);
    px(ctx, fx, fy, 3, 3, stemColor);
    if (i > 0 && i % 2 === 0) {
      const plen = Math.min(spread, 2 + Math.floor(i / 2));
      for (let p = 0; p < plen; p += 1) {
        const side = dirX >= 0 ? 1 : -1;
        px(ctx, fx - side * (p + 1) * 3, fy - p, 3, 2, p % 2 === 0 ? leafLo : leafColor);
        px(ctx, fx + side * (p + 1) * 3 - 1, fy - p - 1, 3, 2, leafHi);
      }
    }
  }
}

function drawFiddlehead(ctx, x, y) {
  px(ctx, x - 2, y - 10, 4, 10, COLORS.fernStem);
  for (let i = 0; i < 8; i += 1) {
    const angle = (i / 8) * Math.PI * 1.6;
    const lx = x + Math.cos(angle) * (5 + i * 0.4);
    const ly = y - 12 + Math.sin(angle) * (4 + i * 0.3);
    px(ctx, lx - 2, ly - 2, 4, 3, COLORS.leafYoung);
  }
  px(ctx, x - 3, y - 14, 6, 4, COLORS.leafBright);
  px(ctx, x - 1, y - 13, 2, 2, COLORS.leafPale);
}

function drawFernSmall(ctx, x, y, variant) {
  const c = [COLORS.leafBright, COLORS.leafMid, COLORS.leafYoung][variant % 3];
  px(ctx, x - 2, y - 14, 4, 14, COLORS.fernStem);
  drawFernFrond(ctx, x - 1, y - 12, -1, 5, 3, COLORS.fernStem, c);
  drawFernFrond(ctx, x + 1, y - 12, 1, 5, 3, COLORS.fernStem, c);
  px(ctx, x - 1, y - 15, 2, 3, COLORS.leafPale);
}

function drawFernGrowing(ctx, x, y, variant) {
  const c = [COLORS.leafBright, COLORS.leafMid, COLORS.leafYoung][variant % 3];
  px(ctx, x - 2, y - 20, 4, 20, COLORS.fernStem);
  drawFernFrond(ctx, x - 1, y - 16, -1, 6, 4, COLORS.fernStem, c);
  drawFernFrond(ctx, x + 1, y - 16, 1, 6, 4, COLORS.fernStem, c);
  drawFernFrond(ctx, x, y - 18, 0, 5, 3, COLORS.fernStem, COLORS.leafPale);
  drawFernFrond(ctx, x - 3, y - 12, -1, 4, 3, COLORS.fernStem, COLORS.leafMid);
  drawFernFrond(ctx, x + 3, y - 12, 1, 4, 3, COLORS.fernStem, COLORS.leafMid);
}

function drawFernPreBranch(ctx, x, y, variant) {
  drawFernGrowing(ctx, x, y, variant);
  px(ctx, x - 5, y - 28, 3, 3, COLORS.leafYoung);
  px(ctx, x + 3, y - 27, 3, 3, COLORS.leafYoung);
  px(ctx, x - 2, y - 32, 4, 4, COLORS.sparkle);
  px(ctx, x - 6, y - 30, 2, 2, COLORS.leafPale);
  px(ctx, x + 4, y - 29, 2, 2, COLORS.leafPale);
}

function drawFernCanopy(ctx, x, y, stage) {
  px(ctx, x - 2, y - 18, 4, 18, COLORS.fernStem);
  const spread = stage >= 8 ? 8 : 6;
  drawFernFrond(ctx, x - 1, y - 14, -1, spread, spread - 1, COLORS.fernStem, COLORS.leaf);
  drawFernFrond(ctx, x + 1, y - 14, 1, spread, spread - 1, COLORS.fernStem, COLORS.leaf);
  drawFernFrond(ctx, x - 3, y - 12, -1, spread - 1, spread - 2, COLORS.fernStem, COLORS.leafMid);
  drawFernFrond(ctx, x + 3, y - 12, 1, spread - 1, spread - 2, COLORS.fernStem, COLORS.leafMid);
  drawFernFrond(ctx, x, y - 16, 0, 5, 4, COLORS.fernStem, COLORS.leafBright);
  drawFernFrond(ctx, x - 5, y - 10, -1, spread - 2, 3, COLORS.fernStem, COLORS.leafYoung);
  drawFernFrond(ctx, x + 5, y - 10, 1, spread - 2, 3, COLORS.fernStem, COLORS.leafYoung);
  if (stage >= 8) {
    px(ctx, x - 16, y - 30, 3, 3, COLORS.leafPale);
    px(ctx, x + 13, y - 28, 3, 3, COLORS.leafPale);
    px(ctx, x - 8, y - 34, 2, 2, COLORS.leafPale);
    px(ctx, x + 6, y - 33, 2, 2, COLORS.leafPale);
  }
}

function drawFernCascade(ctx, x, y, stage) {
  px(ctx, x - 2, y - 14, 4, 14, COLORS.fernStem);
  const len = stage >= 8 ? 9 : 7;
  drawFernFrond(ctx, x - 1, y - 12, -1, len, len - 2, COLORS.fernStem, COLORS.leafMid, 4);
  drawFernFrond(ctx, x + 1, y - 12, 1, len, len - 2, COLORS.fernStem, COLORS.leafMid, 4);
  drawFernFrond(ctx, x - 3, y - 9, -1, len - 1, len - 3, COLORS.fernStem, COLORS.leafBright, 5);
  drawFernFrond(ctx, x + 3, y - 9, 1, len - 1, len - 3, COLORS.fernStem, COLORS.leafBright, 5);
  drawFernFrond(ctx, x, y - 11, 0, len - 2, 3, COLORS.fernStem, COLORS.leafPale, 3);
  if (stage >= 8) {
    px(ctx, x - 18, y + 2, 3, 5, COLORS.leafYoung);
    px(ctx, x + 15, y + 3, 3, 5, COLORS.leafYoung);
    px(ctx, x - 12, y + 6, 2, 4, COLORS.leafPale);
    px(ctx, x + 10, y + 5, 2, 4, COLORS.leafPale);
  }
}

function drawFernColumn(ctx, x, y, stage) {
  const h = stage >= 8 ? 40 * S : 30 * S;
  px(ctx, x - 3, y - h, 6, h, COLORS.leaf);
  px(ctx, x - 2, y - h + 4, 4, h - 8, COLORS.leafMid);
  for (let i = 6; i < h - 4; i += 6) {
    px(ctx, x - 7, y - i, 5, 3, COLORS.leafMid);
    px(ctx, x + 2, y - i - 3, 5, 3, COLORS.leafMid);
    px(ctx, x - 8, y - i + 1, 2, 1, COLORS.leafPale);
    px(ctx, x + 6, y - i - 2, 2, 1, COLORS.leafPale);
  }
  for (let i = 0; i < 5; i += 1) {
    const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
    drawRosetteLeaf(ctx, x, y - h, angle, 8 * S, 6, COLORS.leafBright, COLORS.leafPale);
  }
  px(ctx, x - 4, y - h - 5, 8, 6, COLORS.leafPale);
  if (stage >= 8) {
    px(ctx, x - 2, y - h - 10, 4, 5, COLORS.sparkle);
    px(ctx, x - 5, y - h - 6, 2, 2, COLORS.leafYoung);
    px(ctx, x + 3, y - h - 7, 2, 2, COLORS.leafYoung);
  }
}

/* ---------- dispatch ---------- */

function drawSpeciesStage(ctx, plant, x, y) {
  const { stage, variant: v, branch, speciesId } = plant;

  if (speciesId === 'fern') {
    if (stage <= 1) drawSeed(ctx, x, y);
    else if (stage === 2) drawAwaken(ctx, x, y);
    else if (stage === 3) drawFiddlehead(ctx, x, y);
    else if (stage === 4) drawFernSmall(ctx, x, y, v);
    else if (stage === 5) drawFernGrowing(ctx, x, y, v);
    else if (stage === 6) drawFernPreBranch(ctx, x, y, v);
    else {
      const b = branch ?? 'canopy';
      if (b === 'canopy') drawFernCanopy(ctx, x, y, stage);
      else if (b === 'cascade') drawFernCascade(ctx, x, y, stage);
      else drawFernColumn(ctx, x, y, stage);
    }
    return;
  }

  if (stage <= 1) drawSeed(ctx, x, y);
  else if (stage === 2) {
    px(ctx, x - 3, y - 1, 6, 3, COLORS.soilLight);
    drawEcheveriaLeaf(ctx, x, y, -Math.PI / 2, Math.round(3 * S), Math.round(2.5 * S), COLORS.leafPale, COLORS.leafYoung);
  }
  else if (stage === 3) drawSprout(ctx, x, y, v);
  else if (stage === 4) drawSeedling(ctx, x, y, v);
  else if (stage === 5) drawGrowing(ctx, x, y, v);
  else if (stage === 6) drawPreBranch(ctx, x, y, v);
  else {
    const b = branch ?? 'rosette';
    if (b === 'rosette') drawRosette(ctx, x, y, stage, v);
    else if (b === 'desert') drawDesert(ctx, x, y, stage);
    else drawGarden(ctx, x, y, stage);
  }
}

function drawBranchSilhouette(ctx, x, y, speciesId, branchId, alpha) {
  ctx.globalAlpha = alpha;
  if (speciesId === 'fern') {
    if (branchId === 'canopy') drawFernCanopy(ctx, x, y, 7);
    else if (branchId === 'cascade') drawFernCascade(ctx, x, y, 7);
    else drawFernColumn(ctx, x, y, 7);
  } else {
    if (branchId === 'rosette') drawRosette(ctx, x, y, 7, 0);
    else if (branchId === 'desert') drawDesert(ctx, x, y, 7);
    else drawGarden(ctx, x, y, 7);
  }
  ctx.globalAlpha = 1;
}

export function drawPlant(ctx, plant, tSec, selected) {
  const x = plant.x * GAME_W;
  const y = plant.y * GAME_H;

  ctx.save();

  const sway = plant.stage >= 4 && !plant.withered
    ? Math.round(Math.sin(tSec * 1.6 + plant.x * 20) * S)
    : 0;
  ctx.translate(sway, 0);

  if (plant.stageUpAnim > 0) {
    const pulse = 1 + Math.sin(plant.stageUpAnim * 12) * 0.08;
    ctx.translate(x, y);
    ctx.scale(pulse, pulse);
    ctx.translate(-x, -y);
  }

  if (plant.withered) {
    ctx.filter = 'saturate(0.3) brightness(0.88) contrast(0.95)';
  }

  drawPlantShadow(ctx, x, y, plant.stage);
  drawSpeciesStage(ctx, plant, x, y);
  ctx.filter = 'none';

  for (const s of plant.sparkles) {
    const a = s.life / s.maxLife;
    ctx.globalAlpha = a;
    px(ctx, x + s.x, y + s.y - 18 * S, s.size, s.size, COLORS.sparkle);
    ctx.globalAlpha = 1;
  }

  if (plant.withered && Math.sin(tSec * 4) > 0) {
    const wy = y - 42 * S + Math.round(Math.sin(tSec * 5) * S);
    px(ctx, x - 2, wy - 6, 4, 6, COLORS.water);
    px(ctx, x - 3, wy - 3, 6, 2, COLORS.waterLight);
    px(ctx, x - 1, wy - 8, 2, 2, COLORS.waterPale);
  }

  if (plant.isHarvestable) {
    const bob = Math.round(Math.sin(tSec * 3) * 2 * S);
    const hy = y - 45 * S + bob;
    px(ctx, x - 3, hy - 3, 6, 6, COLORS.flower);
    px(ctx, x - 2, hy - 5, 4, 2, COLORS.sunCore);
    px(ctx, x - 5, hy, 2, 2, COLORS.flower);
    px(ctx, x + 3, hy, 2, 2, COLORS.flower);
    px(ctx, x, hy + 3, 2, 2, COLORS.flower);
    px(ctx, x - 1, hy - 1, 2, 2, COLORS.whiteHot);
  }

  if (selected) {
    const pulse = 0.5 + Math.sin(tSec * 4) * 0.2;
    ctx.globalAlpha = pulse;
    ctx.strokeStyle = COLORS.sparkle;
    ctx.lineWidth = 2;
    const bx = x - 22 * S;
    const by = y - 45 * S;
    const bw = 44 * S;
    const bh = 50 * S;
    for (const [ox, oy, ow, oh] of [
      [bx, by, 7, 3], [bx, by, 3, 7],
      [bx + bw - 7, by, 7, 3], [bx + bw - 3, by, 3, 7],
      [bx, by + bh - 3, 7, 3], [bx, by + bh - 7, 3, 7],
      [bx + bw - 7, by + bh - 3, 7, 3], [bx + bw - 3, by + bh - 7, 3, 7],
    ]) {
      ctx.strokeRect(ox, oy, ow, oh);
    }
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

/* ---------- renderer ---------- */

export class PixelRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.scale = 1;
  }

  resize() {
    const container = this.canvas.parentElement;
    const maxW = container.clientWidth;
    const maxH = container.clientHeight;
    const scaleX = maxW / GAME_W;
    const scaleY = maxH / GAME_H;
    this.scale = Math.max(1, Math.floor(Math.min(scaleX, scaleY)));
    this.canvas.width = GAME_W * this.scale;
    this.canvas.height = GAME_H * this.scale;
    this.canvas.style.width = `${this.canvas.width}px`;
    this.canvas.style.height = `${this.canvas.height}px`;
    this.ctx.imageSmoothingEnabled = false;
  }

  screenToGame(sx, sy) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (sx - rect.left) / this.scale;
    const y = (sy - rect.top) / this.scale;
    return { x: x / GAME_W, y: y / GAME_H, gx: x, gy: y };
  }

  render(terrarium, uiState = {}) {
    const ctx = this.ctx;
    const tSec = terrarium.totalPlayTime;
    ctx.save();
    ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0);
    ctx.clearRect(0, 0, GAME_W, GAME_H);

    this.drawSky(ctx, terrarium);
    this.drawHills(ctx, terrarium);
    this.drawTable(ctx, terrarium);
    this.drawJarInterior(ctx, terrarium);
    this.drawParticlesBehind(ctx, terrarium, tSec);

    for (const plant of terrarium.plants) {
      drawPlant(ctx, plant, tSec, plant === uiState.selectedPlant);
    }

    this.drawJarGlass(ctx, terrarium);
    this.drawParticlesFront(ctx, terrarium, tSec);

    const branchingPlant = terrarium.plants.find((p) => p.stage === 6);
    if (branchingPlant) {
      this.drawBranchPreview(ctx, branchingPlant);
    }

    this.drawDayNightOverlay(ctx, terrarium);
    this.drawTopHUD(ctx, terrarium);

    ctx.restore();
  }

  drawSky(ctx, terrarium) {
    const bands = terrarium.isDay
      ? [COLORS.skyTop, COLORS.skyMid, COLORS.skyHorizon, COLORS.skyGlow]
      : [COLORS.skyNightTop, COLORS.skyNightMid, COLORS.skyNightHorizon, COLORS.skyNightHorizon];
    const bandH = Math.ceil(GAME_H / bands.length);
    bands.forEach((color, i) => {
      px(ctx, 0, i * bandH, GAME_W, bandH + 1, color);
    });

    for (let y = 0; y < GAME_H; y += 3) {
      for (let x = 0; x < GAME_W; x += 3) {
        const n = (x * 13 + y * 7) % 11;
        if (n < 2) {
          ctx.globalAlpha = terrarium.isDay ? 0.04 : 0.06;
          px(ctx, x, y, 1, 1, terrarium.isDay ? COLORS.whiteHot : COLORS.moonHi);
          ctx.globalAlpha = 1;
        }
      }
    }

    if (terrarium.isDay) {
      this.drawClouds(ctx, terrarium);
      const frac = terrarium.time / 0.5;
      const sx = 42 + frac * (GAME_W - 84);
      const sy = 33 - Math.sin(frac * Math.PI) * 21;
      this.drawSun(ctx, sx, sy);
    } else {
      this.drawStars(ctx, terrarium);
      const frac = (terrarium.time - 0.5) / 0.5;
      const mx = 48 + frac * (GAME_W - 96);
      const my = 30 - Math.sin(frac * Math.PI) * 18;
      this.drawMoon(ctx, mx, my);
    }
  }

  drawHills(ctx, terrarium) {
    const hillBase = JAR.y + JAR.h + Math.round(18 * S);
    const farH = Math.round(28 * S);
    const nearH = Math.round(36 * S);

    for (let x = 0; x < GAME_W; x += 2) {
      const wave1 = Math.sin((x / GAME_W) * Math.PI * 2.4) * Math.round(8 * S);
      const wave2 = Math.sin((x / GAME_W) * Math.PI * 3.8 + 1.2) * Math.round(5 * S);
      const farY = hillBase - farH + wave1;
      px(ctx, x, farY, 2, farH + Math.round(40 * S), COLORS.hillFar);
      if (x % 6 === 0) px(ctx, x, farY - 1, 2, 1, shade(COLORS.hillFar, 12));
      const nearY = hillBase - nearH + wave2;
      px(ctx, x, nearY, 2, nearH + Math.round(50 * S), COLORS.hillNear);
      px(ctx, x, nearY, 2, 2, shade(COLORS.hillNear, -15));
    }

    if (terrarium.isDay) {
      ctx.globalAlpha = 0.12;
      px(ctx, 0, hillBase - Math.round(6 * S), GAME_W, Math.round(8 * S), COLORS.skyGlow);
      ctx.globalAlpha = 1;
    }
  }

  drawClouds(ctx, terrarium) {
    const drift = terrarium.totalPlayTime * 4;
    const clouds = [
      { x: 60, y: 27, w: 42 },
      { x: 210, y: 18, w: 54 },
      { x: 390, y: 33, w: 36 },
      { x: 480, y: 21, w: 45 },
      { x: 620, y: 24, w: 48 },
      { x: 820, y: 15, w: 40 },
      { x: 980, y: 30, w: 52 },
    ];
    for (const c of clouds) {
      const cx = ((c.x + drift * 0.3) % (GAME_W + 60)) - 30;
      px(ctx, cx, c.y + 4, c.w, 3, COLORS.cloudShadow);
      px(ctx, cx + 4, c.y, c.w - 8, 5, COLORS.cloud);
      px(ctx, cx + 8, c.y - 2, c.w - 16, 3, COLORS.cloud);
      px(ctx, cx + 2, c.y + 7, c.w - 4, 2, COLORS.cloudShadow);
    }
  }

  drawSun(ctx, sx, sy) {
    ctx.globalAlpha = 0.18;
    px(ctx, sx - 14, sy - 14, 28, 28, COLORS.sunCore);
    ctx.globalAlpha = 1;
    for (let i = 0; i < 8; i += 1) {
      const angle = (i / 8) * Math.PI * 2;
      const rx = sx + Math.cos(angle) * 10 * S;
      const ry = sy + Math.sin(angle) * 10 * S;
      px(ctx, rx - 1, ry - 1, 3, 3, COLORS.sunRay);
    }
    px(ctx, sx - 6, sy - 6, 12, 12, COLORS.sunRay);
    px(ctx, sx - 5, sy - 5, 10, 10, COLORS.sunCore);
    px(ctx, sx - 3, sy - 3, 6, 6, COLORS.sun);
    px(ctx, sx - 2, sy - 2, 4, 4, COLORS.whiteHot);
  }

  drawMoon(ctx, mx, my) {
    ctx.globalAlpha = 0.15;
    px(ctx, mx - 10, my - 10, 20, 20, COLORS.moonHi);
    ctx.globalAlpha = 1;
    px(ctx, mx - 6, my - 6, 12, 12, COLORS.moon);
    px(ctx, mx - 5, my - 5, 10, 10, COLORS.moonHi);
    px(ctx, mx - 2, my - 3, 4, 6, COLORS.moonCrater);
    px(ctx, mx + 2, my + 2, 3, 3, COLORS.moonCrater);
    px(ctx, mx - 4, my + 1, 2, 2, COLORS.moonCrater);
  }

  drawStars(ctx, terrarium) {
    for (let i = 0; i < 40; i += 1) {
      const starX = (i * 53 + 17) % GAME_W;
      const starY = (i * 31 + 5) % Math.round(70 * S);
      const tw = 0.25 + Math.abs(Math.sin(terrarium.totalPlayTime * 1.8 + i * 0.7)) * 0.55;
      ctx.globalAlpha = tw;
      const sz = i % 7 === 0 ? 2 : 1;
      px(ctx, starX, starY, sz, sz, COLORS.star);
      if (i % 11 === 0) {
        ctx.globalAlpha = tw * 0.35;
        px(ctx, starX - 1, starY - 1, sz + 2, sz + 2, COLORS.moonHi);
      }
      ctx.globalAlpha = 1;
    }
  }

  drawJarInterior(ctx, terrarium) {
    const { x: jx, y: jy, w: jw, h: jh } = JAR;

    px(ctx, jx + Math.round(18 * S), jy - Math.round(10 * S), jw - Math.round(36 * S), Math.round(8 * S), COLORS.wood);
    px(ctx, jx + Math.round(22 * S), jy - Math.round(12 * S), jw - Math.round(44 * S), Math.round(4 * S), COLORS.woodHi);
    px(ctx, jx + Math.round(20 * S), jy - Math.round(4 * S), jw - Math.round(40 * S), Math.round(3 * S), COLORS.woodLo);
    px(ctx, jx + jw / 2 - Math.round(6 * S), jy - Math.round(14 * S), Math.round(12 * S), Math.round(4 * S), COLORS.woodShadow);
    for (let i = 0; i < 6; i += 1) {
      px(ctx, jx + Math.round(24 * S) + i * Math.round(18 * S), jy - Math.round(11 * S), 1, Math.round(5 * S), shade(COLORS.woodLo, -12));
    }

    ctx.globalAlpha = 0.05;
    ctx.fillStyle = COLORS.glassTint;
    ctx.fillRect(jx + 2, jy + 2, jw - 4, jh - 4);
    ctx.globalAlpha = 1;

    const soilTop = jy + jh - SOIL_H;
    px(ctx, jx + 3, soilTop - Math.round(4 * S), jw - 6, SOIL_H + Math.round(4 * S), shade(COLORS.soilDark, -8));
    for (let row = 0; row < SOIL_H; row += 2) {
      for (let col = 4; col < jw - 4; col += 3) {
        const noise = (col * 7 + row * 13) % 19;
        const depth = row / SOIL_H;
        const c = noise < 2
          ? COLORS.soilPebb
          : depth > 0.65
            ? shade(COLORS.soilDark, -6)
            : noise < 7 ? COLORS.soilLight : COLORS.soil;
        px(ctx, jx + col, soilTop + row, 3, 2, c);
      }
    }
    px(ctx, jx + 4, soilTop, jw - 8, 3, COLORS.soilLight);
    px(ctx, jx + 6, soilTop - 2, jw - 12, 2, COLORS.moss);
    px(ctx, jx + 8, soilTop - 1, jw - 16, 1, shade(COLORS.moss, 12));

    const pebbles = [
      [24, -5, 11, 7], [28, -7, 7, 4], [jw - 46, -4, 13, 6],
      [jw - 42, -6, 6, 4], [jw / 2 - 10, -4, 10, 5],
      [jw / 2 + 20, -3, 8, 4], [40, -2, 6, 3],
    ];
    for (const [ox, oy, pw, ph] of pebbles) {
      px(ctx, jx + ox + 1, soilTop + oy + 1, pw, ph, shade(COLORS.soilDark, -10));
      px(ctx, jx + ox, soilTop + oy, pw, ph, COLORS.soilPebb);
      px(ctx, jx + ox + 1, soilTop + oy, pw - 2, 2, shade(COLORS.soilLight, 10));
      px(ctx, jx + ox + pw - 2, soilTop + oy + ph - 1, 1, 1, shade(COLORS.soilDark, -15));
    }

    ctx.globalAlpha = 0.12;
    px(ctx, jx + 2, jy + 2, Math.round(5 * S), jh - 4, shade(COLORS.glassEdge, -20));
    px(ctx, jx + jw - Math.round(7 * S), jy + 2, Math.round(5 * S), jh - 4, shade(COLORS.glassEdge, -20));
    ctx.globalAlpha = 1;

    if (terrarium.moisture > 65) {
      ctx.globalAlpha = Math.min(0.3, (terrarium.moisture - 65) / 70);
      for (let i = 0; i < 8; i += 1) {
        const row = i % 4;
        const fogY = jy + Math.round(24 * S) + row * Math.round(18 * S);
        px(ctx, jx + Math.round(10 * S) + (i % 3) * Math.round(72 * S), fogY, Math.round(28 * S), 2, COLORS.waterLight);
        px(ctx, jx + Math.round(16 * S) + (i % 3) * Math.round(68 * S), fogY + Math.round(6 * S), Math.round(18 * S), 2, COLORS.waterPale);
      }
      ctx.globalAlpha = 1;
    }
  }

  drawJarGlass(ctx, terrarium) {
    const { x: jx, y: jy, w: jw, h: jh } = JAR;

    ctx.strokeStyle = COLORS.glassEdge;
    ctx.lineWidth = 3;
    ctx.strokeRect(jx, jy, jw, jh);
    ctx.strokeStyle = COLORS.glassLo;
    ctx.lineWidth = 1;
    ctx.strokeRect(jx + 2, jy + 2, jw - 4, jh - 4);

    px(ctx, jx, jy, 4, 4, shade(COLORS.glassEdge, -15));
    px(ctx, jx + jw - 4, jy, 4, 4, shade(COLORS.glassEdge, -15));
    px(ctx, jx, jy + jh - 4, 4, 4, shade(COLORS.glassEdge, -20));
    px(ctx, jx + jw - 4, jy + jh - 4, 4, 4, shade(COLORS.glassEdge, -20));

    ctx.globalAlpha = 0.55;
    px(ctx, jx + Math.round(8 * S), jy + Math.round(6 * S), jw - Math.round(80 * S), 3, COLORS.glassReflect);
    px(ctx, jx + jw - Math.round(24 * S), jy + Math.round(14 * S), 3, jh - Math.round(50 * S), COLORS.glassReflect);
    ctx.globalAlpha = 0.3;
    px(ctx, jx + Math.round(6 * S), jy + Math.round(14 * S), 2, jh - Math.round(52 * S), COLORS.glassHi);
    px(ctx, jx + Math.round(16 * S), jy + jh - Math.round(44 * S), jw - Math.round(32 * S), 2, COLORS.glass);
    ctx.globalAlpha = 0.15;
    px(ctx, jx + jw - Math.round(12 * S), jy + Math.round(20 * S), 2, jh - Math.round(60 * S), shade(COLORS.glassLo, -10));
    ctx.globalAlpha = 1;

    if (terrarium.moisture > 80) {
      ctx.globalAlpha = Math.min(0.18, (terrarium.moisture - 80) / 60);
      px(ctx, jx + 4, jy + 8, 4, jh - 24, COLORS.waterPale);
      px(ctx, jx + jw - 10, jy + 14, 3, jh - 36, COLORS.waterLight);
      ctx.globalAlpha = 1;
    }

    ctx.globalAlpha = 0.08;
    px(ctx, jx + 4, jy + 4, jw - 8, jh - 8, COLORS.glassTint);
    ctx.globalAlpha = 1;
  }

  drawTable(ctx, terrarium) {
    const { x: jx, y: jy, w: jw, h: jh } = JAR;
    const shelfY = jy + jh;
    const shelfW = jw + Math.round(24 * S);
    const shelfX = jx - Math.round(12 * S);

    drawSoftShadow(ctx, jx + jw / 2, shelfY + Math.round(8 * S), jw * 0.42, Math.round(10 * S), 0.28);

    px(ctx, shelfX - Math.round(4 * S), shelfY + Math.round(14 * S), shelfW + Math.round(8 * S), Math.round(6 * S), COLORS.woodShadow);
    px(ctx, shelfX, shelfY + Math.round(10 * S), shelfW, Math.round(5 * S), COLORS.woodLo);
    px(ctx, shelfX - Math.round(2 * S), shelfY + Math.round(2 * S), shelfW + Math.round(4 * S), Math.round(8 * S), COLORS.wood);
    px(ctx, shelfX, shelfY, shelfW, Math.round(6 * S), COLORS.woodHi);

    for (let x = shelfX; x < shelfX + shelfW; x += Math.round(8 * S)) {
      const grain = Math.sin(x * 0.08) > 0 ? shade(COLORS.woodLo, -8) : shade(COLORS.woodHi, 6);
      px(ctx, x, shelfY + 1, Math.round(4 * S), Math.round(4 * S), grain);
    }

    for (let i = 0; i < 5; i += 1) {
      const gx = shelfX + Math.round(14 * S) + i * Math.round(52 * S);
      px(ctx, gx, shelfY + 1, Math.round(2 * S), Math.round(5 * S), COLORS.woodLo);
    }

    const legW = Math.round(6 * S);
    const legH = Math.round(22 * S);
    const legY = shelfY + Math.round(14 * S);
    px(ctx, shelfX + Math.round(8 * S) + 1, legY + 1, legW, legH, shade(COLORS.woodShadow, -10));
    px(ctx, shelfX + shelfW - Math.round(14 * S) + 1, legY + 1, legW, legH, shade(COLORS.woodShadow, -10));
    px(ctx, shelfX + Math.round(8 * S), legY, legW, legH, COLORS.woodLo);
    px(ctx, shelfX + shelfW - Math.round(14 * S), legY, legW, legH, COLORS.woodLo);
    px(ctx, shelfX + Math.round(9 * S), legY, legW - 2, 2, COLORS.woodHi);
    px(ctx, shelfX + shelfW - Math.round(13 * S), legY, legW - 2, 2, COLORS.woodHi);

    px(ctx, shelfX - Math.round(6 * S), shelfY + Math.round(16 * S), shelfW + Math.round(12 * S), Math.round(3 * S), COLORS.woodShadow);
  }

  drawParticlesBehind(ctx, terrarium, tSec) {
    if (!terrarium.isDay) {
      for (const p of terrarium.particles) {
        if (p.kind !== 'firefly') continue;
        const x = p.x * GAME_W;
        const y = p.y * GAME_H;
        const flicker = 0.3 + Math.abs(Math.sin(tSec * 3 + x)) * 0.55;
        ctx.globalAlpha = Math.min(1, p.life) * flicker;
        px(ctx, x, y, 2, 2, COLORS.firefly);
        ctx.globalAlpha = 0.15 * flicker;
        px(ctx, x - 2, y - 2, 6, 6, COLORS.firefly);
        ctx.globalAlpha = 1;
      }
    }
  }

  drawParticlesFront(ctx, terrarium, tSec) {
    for (const p of terrarium.particles) {
      if (p.kind === 'firefly') continue;
      const x = p.x * GAME_W;
      const y = p.y * GAME_H;
      const a = Math.min(1, p.life * 2);
      ctx.globalAlpha = a;
      if (p.kind === 'drop') {
        px(ctx, x, y, 2, 4, COLORS.water);
        px(ctx, x, y, 1, 2, COLORS.waterLight);
        px(ctx, x + 1, y + 2, 1, 1, COLORS.waterPale);
      } else if (p.kind === 'seedfly') {
        px(ctx, x, y, 3, 3, COLORS.flower);
        px(ctx, x + 1, y, 1, 2, COLORS.sunCore);
        px(ctx, x, y + 1, 2, 1, COLORS.leafYoung);
      } else {
        px(ctx, x, y, 4, 4, COLORS.waterPale);
        px(ctx, x + 1, y + 1, 2, 2, COLORS.waterLight);
      }
      ctx.globalAlpha = 1;
    }

    if (terrarium.isDay) {
      for (let i = 0; i < 18; i += 1) {
        const px_ = ((i * 97 + Math.floor(tSec * 12 + i * 3)) % (GAME_W - 40)) + 20;
        const py = ((i * 53 + Math.floor(tSec * 8 + i * 7)) % Math.round(JAR.y + JAR.h - 20)) + 20;
        const drift = Math.sin(tSec * 0.8 + i) * 3;
        const alpha = 0.15 + Math.abs(Math.sin(tSec * 1.2 + i * 0.9)) * 0.25;
        ctx.globalAlpha = alpha;
        px(ctx, px_ + drift, py, 2, 2, COLORS.pollen);
        if (i % 4 === 0) {
          ctx.globalAlpha = alpha * 0.5;
          px(ctx, px_ + drift - 1, py - 1, 4, 4, COLORS.flower);
        }
        ctx.globalAlpha = 1;
      }
    }
  }

  drawBranchPreview(ctx, plant) {
    const scores = getBranchScores(plant.speciesId, plant.care.snapshot());
    const sorted = [...scores].sort((a, b) => b.score - a.score);
    const max = sorted[0]?.score || 1;

    const panelX = Math.round(24 * S);
    const panelY = Math.round(77 * S);
    const panelW = Math.round(144 * S);
    const panelH = Math.round(26 * S);

    this.drawHudPanel(ctx, panelX, panelY, panelW, panelH);

    const positions = [0.28, 0.5, 0.72];
    scores.forEach((s, i) => {
      const alpha = 0.2 + (s.score / max) * 0.65;
      drawBranchSilhouette(ctx, positions[i] * GAME_W, JAR.y + JAR.h - SOIL_H - Math.round(8 * S), plant.speciesId, s.id, alpha);
    });

    ctx.fillStyle = COLORS.textDim;
    ctx.font = `${Math.round(10 * S)}px "Pixelify Sans", monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('Đang định hình...', GAME_W / 2, panelY + Math.round(10 * S));

    const labels = scores.map((s) => BRANCH_LABELS[s.id] ?? s.id);
    ctx.font = `${Math.round(9 * S)}px "Pixelify Sans", monospace`;
    labels.forEach((label, i) => {
      ctx.fillStyle = scores[i].score === max ? COLORS.accent : COLORS.textDim;
      ctx.fillText(label, positions[i] * GAME_W, panelY + panelH + Math.round(8 * S));
    });
  }

  drawDayNightOverlay(ctx, terrarium) {
    if (terrarium.isDay) {
      ctx.globalAlpha = 0.04;
      ctx.fillStyle = COLORS.sunCore;
      ctx.fillRect(0, 0, GAME_W, GAME_H);
      ctx.globalAlpha = 0.025;
      const grd = ctx.createLinearGradient(0, 0, GAME_W, GAME_H);
      grd.addColorStop(0, COLORS.whiteHot);
      grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, GAME_W, GAME_H);
    } else {
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = COLORS.skyNightTop;
      ctx.fillRect(0, 0, GAME_W, GAME_H);
      ctx.globalAlpha = 0.06;
      const grd = ctx.createLinearGradient(0, 0, 0, GAME_H);
      grd.addColorStop(0, COLORS.moonHi);
      grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, GAME_W, GAME_H * 0.4);
    }
    ctx.globalAlpha = 1;
  }

  drawTopHUD(ctx, terrarium) {
    const hours = Math.floor(terrarium.time * 24);
    const mins = Math.floor((terrarium.time * 24 - hours) * 60);

    this.drawHudPanel(ctx, 6, 6, Math.round(104 * S), Math.round(30 * S));
    this.drawHudPanel(ctx, GAME_W - Math.round(108 * S), 6, Math.round(104 * S), Math.round(30 * S));

    const iconX = 14;
    const iconY = 16;
    if (terrarium.isDay) {
      px(ctx, iconX, iconY - 3, 9, 9, COLORS.sunRay);
      px(ctx, iconX + 1, iconY - 2, 7, 7, COLORS.sun);
    } else {
      px(ctx, iconX + 1, iconY - 3, 8, 8, COLORS.moon);
      px(ctx, iconX + 2, iconY - 2, 6, 6, COLORS.moonHi);
    }

    ctx.fillStyle = COLORS.text;
    ctx.font = `${Math.round(10 * S)}px "Pixelify Sans", monospace`;
    ctx.textAlign = 'left';
    ctx.fillText(`${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`, 28, 20);

    px(ctx, 102, 13, 9, 9, COLORS.flower);
    px(ctx, 103, 14, 7, 7, COLORS.seed);
    ctx.fillStyle = COLORS.textDim;
    ctx.fillText(`${terrarium.seeds}`, 114, 20);

    this.drawBar(ctx, 14, 30, Math.round(92 * S), 8, terrarium.moisture / 100, COLORS.water, 'Ẩm');

    px(ctx, GAME_W - Math.round(98 * S), 13, 9, 9, COLORS.leafMid);
    px(ctx, GAME_W - Math.round(97 * S), 14, 7, 7, COLORS.leafBright);
    ctx.fillStyle = COLORS.text;
    ctx.fillText(`${terrarium.plants.length}/4`, GAME_W - Math.round(90 * S), 20);

    this.drawBar(ctx, GAME_W - Math.round(98 * S), 30, Math.round(92 * S), 8, terrarium.ambientLight / 100, COLORS.sunCore, 'Sáng');
  }

  drawHudPanel(ctx, x, y, w, h) {
    ctx.fillStyle = COLORS.hudBg;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = COLORS.hudBorder;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    px(ctx, x + 1, y + 1, w - 2, 1, 'rgba(255, 255, 255, 0.45)');
  }

  drawBar(ctx, x, y, w, h, pct, color, label) {
    ctx.fillStyle = 'rgba(200, 221, 212, 0.35)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = COLORS.hudBorder;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    const fillW = Math.max(0, Math.floor((w - 4) * Math.min(1, pct)));
    if (fillW > 0) {
      px(ctx, x + 2, y + 2, fillW, h - 4, color);
      px(ctx, x + 2, y + 2, fillW, 1, 'rgba(255, 255, 255, 0.4)');
    }
    if (label) {
      ctx.fillStyle = COLORS.textDim;
      ctx.font = `${Math.round(7 * S)}px "Pixelify Sans", monospace`;
      ctx.textAlign = 'left';
      ctx.fillText(label, x + 2, y - 1);
    }
  }
}

export function getPlantAt(terrarium, gx, gy) {
  for (let i = terrarium.plants.length - 1; i >= 0; i -= 1) {
    const p = terrarium.plants[i];
    const cx = p.x * GAME_W;
    const cy = p.y * GAME_H;
    if (Math.abs(gx - cx) < 33 * S && gy > cy - 60 * S && gy < cy + 21 * S) return p;
  }
  return null;
}
