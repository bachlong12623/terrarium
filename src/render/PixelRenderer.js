import { COLORS, GAME_W, GAME_H, STAGE_NAMES, BRANCH_LABELS } from '../game/constants.js';
import { getBranchScores } from '../data/plants.js';

const JAR = { x: 68, y: 26, w: 248, h: 154 };
const SOIL_H = 28;

function px(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x), Math.floor(y), w, h);
}

/* ---------- succulent sprites ---------- */

function drawSeed(ctx, x, y) {
  px(ctx, x - 2, y - 2, 4, 4, COLORS.soilDark);
  px(ctx, x - 1, y - 1, 2, 2, COLORS.seed);
}

function drawAwaken(ctx, x, y) {
  px(ctx, x - 3, y, 6, 2, COLORS.soilLight);
  px(ctx, x - 1, y - 3, 2, 3, COLORS.leafPale);
  px(ctx, x - 2, y - 1, 4, 1, COLORS.leafYoung);
}

function drawSprout(ctx, x, y, variant) {
  const greens = [COLORS.leafPale, COLORS.leafYoung, COLORS.leafBright];
  const c = greens[variant % 3];
  px(ctx, x - 1, y - 8, 2, 8, COLORS.leafMid);
  px(ctx, x - 4, y - 5, 3, 3, c);
  px(ctx, x + 1, y - 5, 3, 3, c);
}

function drawSeedling(ctx, x, y, variant) {
  const c = [COLORS.leafYoung, COLORS.leafBright, COLORS.leafPale][variant % 3];
  px(ctx, x - 1, y - 10, 2, 10, COLORS.leaf);
  px(ctx, x - 5, y - 7, 4, 4, c);
  px(ctx, x + 1, y - 7, 4, 4, c);
  px(ctx, x - 2, y - 11, 4, 3, COLORS.leafMid);
}

function drawGrowing(ctx, x, y, variant) {
  const c = [COLORS.leafBright, COLORS.leafMid, COLORS.leafYoung][variant % 3];
  for (let i = 0; i < 6; i += 1) {
    const angle = (i / 6) * Math.PI * 2;
    const lx = x + Math.cos(angle) * 5;
    const ly = y - 6 + Math.sin(angle) * 3;
    px(ctx, lx - 2, ly - 2, 4, 4, c);
  }
  px(ctx, x - 2, y - 4, 4, 4, COLORS.leaf);
}

function drawPreBranch(ctx, x, y, variant) {
  drawGrowing(ctx, x, y, variant);
  px(ctx, x - 1, y - 14, 2, 4, COLORS.leafPale);
  px(ctx, x - 2, y - 16, 4, 2, COLORS.sparkle);
}

function drawRosette(ctx, x, y, stage, variant) {
  const layers = stage >= 8 ? 8 : 6;
  const radius = stage >= 8 ? 14 : 11;
  const colors = [COLORS.leafMid, COLORS.leafBright, COLORS.leafYoung, COLORS.leafPale];
  for (let i = 0; i < layers; i += 1) {
    const angle = (i / layers) * Math.PI * 2 + variant * 0.3;
    const lx = x + Math.cos(angle) * radius * 0.7;
    const ly = y - 8 + Math.sin(angle) * radius * 0.45;
    px(ctx, lx - 3, ly - 3, 6, 5, colors[i % colors.length]);
  }
  px(ctx, x - 3, y - 10, 6, 5, COLORS.leaf);
  if (variant === 1) {
    px(ctx, x - 5, y - 12, 2, 2, '#e07a9a');
    px(ctx, x + 3, y - 11, 2, 2, '#e07a9a');
  }
  if (stage >= 8) {
    px(ctx, x - 1, y - 18, 2, 8, COLORS.leafMid);
    px(ctx, x - 3, y - 21, 6, 4, COLORS.flower);
    px(ctx, x - 1, y - 22, 2, 2, '#fff3b0');
  }
}

function drawDesert(ctx, x, y, stage) {
  const w = stage >= 8 ? 16 : 12;
  const colors = ['#5c7a8a', '#6b8a9a', '#4a6d7a', '#7a9aaa'];
  for (let i = 0; i < 4; i += 1) {
    const ox = (i % 2) * 6 - 3;
    const oy = Math.floor(i / 2) * 4 - 6;
    px(ctx, x + ox - 3, y + oy - 3, 6, 5, colors[i]);
  }
  px(ctx, x - 2, y - 2, w, 4, COLORS.soilLight);
  px(ctx, x - 4, y - 8, 8, 6, '#6b8a9a');
  if (stage >= 8) {
    px(ctx, x - 6, y - 11, 3, 3, '#8aa8b8');
    px(ctx, x + 4, y - 10, 3, 3, '#8aa8b8');
  }
}

function drawGarden(ctx, x, y, stage) {
  drawRosette(ctx, x, y, 7, 0);
  if (stage >= 8) {
    const offsets = [[-12, 2], [10, 3], [-8, 6], [12, 5], [0, 8]];
    for (const [ox, oy] of offsets) {
      for (let i = 0; i < 4; i += 1) {
        const angle = (i / 4) * Math.PI * 2;
        px(ctx, x + ox + Math.cos(angle) * 4 - 2, y - 6 + oy + Math.sin(angle) * 2 - 2, 4, 4, COLORS.leafYoung);
      }
    }
  } else {
    for (const ox of [-9, 9]) {
      for (let i = 0; i < 3; i += 1) {
        px(ctx, x + ox - 2, y - 5 - i * 2, 4, 3, COLORS.leafBright);
      }
    }
  }
}

/* ---------- fern sprites ---------- */

function drawFrond(ctx, x, y, dirX, len, color, droop = 0) {
  for (let i = 0; i < len; i += 1) {
    const fx = x + dirX * i * 2;
    const fy = y - i * 2 + Math.floor((i * i * droop) / 8);
    px(ctx, fx, fy, 2, 2, color);
    if (i > 0 && i % 2 === 0) {
      px(ctx, fx - 2, fy - 1, 2, 2, color);
      px(ctx, fx + 2, fy - 1, 2, 2, color);
    }
  }
}

function drawFiddlehead(ctx, x, y) {
  px(ctx, x - 1, y - 6, 2, 6, COLORS.leafMid);
  px(ctx, x - 3, y - 9, 4, 4, COLORS.leafYoung);
  px(ctx, x - 1, y - 8, 2, 2, COLORS.leafPale);
}

function drawFernSmall(ctx, x, y, variant) {
  const c = [COLORS.leafBright, COLORS.leafMid, COLORS.leafYoung][variant % 3];
  px(ctx, x - 1, y - 8, 2, 8, COLORS.leaf);
  drawFrond(ctx, x - 1, y - 8, -1, 3, c);
  drawFrond(ctx, x + 1, y - 8, 1, 3, c);
}

function drawFernGrowing(ctx, x, y, variant) {
  const c = [COLORS.leafBright, COLORS.leafMid, COLORS.leafYoung][variant % 3];
  px(ctx, x - 1, y - 12, 2, 12, COLORS.leaf);
  drawFrond(ctx, x - 1, y - 10, -1, 4, c);
  drawFrond(ctx, x + 1, y - 10, 1, 4, c);
  drawFrond(ctx, x, y - 12, 0, 3, COLORS.leafPale);
}

function drawFernPreBranch(ctx, x, y, variant) {
  drawFernGrowing(ctx, x, y, variant);
  px(ctx, x - 3, y - 18, 2, 2, COLORS.leafYoung);
  px(ctx, x + 2, y - 17, 2, 2, COLORS.leafYoung);
  px(ctx, x - 1, y - 20, 2, 2, COLORS.sparkle);
}

function drawFernCanopy(ctx, x, y, stage) {
  px(ctx, x - 1, y - 12, 2, 12, COLORS.leafDark);
  const spread = stage >= 8 ? 6 : 5;
  drawFrond(ctx, x - 1, y - 10, -1, spread, COLORS.leaf);
  drawFrond(ctx, x + 1, y - 10, 1, spread, COLORS.leaf);
  drawFrond(ctx, x - 2, y - 8, -1, spread - 1, COLORS.leafMid);
  drawFrond(ctx, x + 2, y - 8, 1, spread - 1, COLORS.leafMid);
  drawFrond(ctx, x, y - 12, 0, 4, COLORS.leafBright);
  if (stage >= 8) {
    px(ctx, x - 10, y - 22, 2, 2, COLORS.leafPale);
    px(ctx, x + 8, y - 21, 2, 2, COLORS.leafPale);
  }
}

function drawFernCascade(ctx, x, y, stage) {
  px(ctx, x - 1, y - 10, 2, 10, COLORS.leafDark);
  const len = stage >= 8 ? 6 : 5;
  drawFrond(ctx, x - 1, y - 10, -1, len, COLORS.leafMid, 3);
  drawFrond(ctx, x + 1, y - 10, 1, len, COLORS.leafMid, 3);
  drawFrond(ctx, x - 2, y - 7, -1, len - 1, COLORS.leafBright, 4);
  drawFrond(ctx, x + 2, y - 7, 1, len - 1, COLORS.leafBright, 4);
  if (stage >= 8) {
    px(ctx, x - 12, y - 2, 2, 3, COLORS.leafYoung);
    px(ctx, x + 10, y - 1, 2, 3, COLORS.leafYoung);
  }
}

function drawFernColumn(ctx, x, y, stage) {
  const h = stage >= 8 ? 26 : 20;
  px(ctx, x - 1, y - h, 2, h, COLORS.leaf);
  for (let i = 2; i < h - 2; i += 4) {
    px(ctx, x - 4, y - i, 3, 2, COLORS.leafMid);
    px(ctx, x + 1, y - i - 2, 3, 2, COLORS.leafMid);
  }
  px(ctx, x - 2, y - h - 3, 4, 4, COLORS.leafPale);
  if (stage >= 8) {
    px(ctx, x - 1, y - h - 6, 2, 3, COLORS.sparkle);
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
  else if (stage === 2) drawAwaken(ctx, x, y);
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
    ? Math.round(Math.sin(tSec * 1.6 + plant.x * 20) * 1)
    : 0;
  ctx.translate(sway, 0);

  if (plant.stageUpAnim > 0) {
    const pulse = 1 + Math.sin(plant.stageUpAnim * 12) * 0.08;
    ctx.translate(x, y);
    ctx.scale(pulse, pulse);
    ctx.translate(-x, -y);
  }

  if (plant.withered) {
    ctx.filter = 'saturate(0.25) brightness(0.85)';
  }

  drawSpeciesStage(ctx, plant, x, y);
  ctx.filter = 'none';

  for (const s of plant.sparkles) {
    const a = s.life / s.maxLife;
    ctx.globalAlpha = a;
    px(ctx, x + s.x, y + s.y - 12, s.size, s.size, COLORS.sparkle);
    ctx.globalAlpha = 1;
  }

  if (plant.withered && Math.sin(tSec * 4) > 0) {
    const wy = y - 28 + Math.round(Math.sin(tSec * 5) * 1);
    px(ctx, x - 1, wy - 4, 2, 3, COLORS.water);
    px(ctx, x - 2, wy - 2, 4, 1, COLORS.waterLight);
    px(ctx, x, wy - 5, 1, 1, COLORS.waterPale);
  }

  if (plant.isHarvestable) {
    const bob = Math.round(Math.sin(tSec * 3) * 2);
    const hy = y - 30 + bob;
    px(ctx, x - 2, hy - 2, 4, 4, COLORS.flower);
    px(ctx, x - 1, hy - 3, 2, 1, COLORS.sunCore);
    px(ctx, x - 3, hy, 1, 1, COLORS.flower);
    px(ctx, x + 2, hy, 1, 1, COLORS.flower);
    px(ctx, x, hy + 2, 1, 1, COLORS.flower);
  }

  if (selected) {
    const pulse = 0.5 + Math.sin(tSec * 4) * 0.2;
    ctx.globalAlpha = pulse;
    ctx.strokeStyle = COLORS.sparkle;
    ctx.lineWidth = 1;
    const bx = x - 15;
    const by = y - 30;
    const bw = 30;
    const bh = 34;
    for (const [ox, oy, ow, oh] of [
      [bx, by, 5, 2], [bx, by, 2, 5],
      [bx + bw - 5, by, 5, 2], [bx + bw - 2, by, 2, 5],
      [bx, by + bh - 2, 5, 2], [bx, by + bh - 5, 2, 5],
      [bx + bw - 5, by + bh - 2, 5, 2], [bx + bw - 2, by + bh - 5, 2, 5],
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
    this.drawJar(ctx, terrarium);
    this.drawParticlesBehind(ctx, terrarium, tSec);

    for (const plant of terrarium.plants) {
      drawPlant(ctx, plant, tSec, plant === uiState.selectedPlant);
    }

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
      ? [COLORS.skyTop, COLORS.skyMid, COLORS.bgMid, COLORS.bgDark]
      : [COLORS.skyNightTop, COLORS.skyNightMid, COLORS.bgMid, COLORS.bgDark];
    const bandH = Math.ceil(GAME_H / bands.length);
    bands.forEach((color, i) => {
      px(ctx, 0, i * bandH, GAME_W, bandH + 1, color);
    });

    if (terrarium.isDay) {
      this.drawClouds(ctx, terrarium);
      const frac = terrarium.time / 0.5;
      const sx = 28 + frac * (GAME_W - 56);
      const sy = 22 - Math.sin(frac * Math.PI) * 14;
      this.drawSun(ctx, sx, sy);
    } else {
      this.drawStars(ctx, terrarium);
      const frac = (terrarium.time - 0.5) / 0.5;
      const mx = 32 + frac * (GAME_W - 64);
      const my = 20 - Math.sin(frac * Math.PI) * 12;
      this.drawMoon(ctx, mx, my);
    }
  }

  drawClouds(ctx, terrarium) {
    const drift = terrarium.totalPlayTime * 4;
    const clouds = [
      { x: 40, y: 18, w: 28 },
      { x: 140, y: 12, w: 36 },
      { x: 260, y: 22, w: 24 },
      { x: 320, y: 14, w: 30 },
    ];
    for (const c of clouds) {
      const cx = ((c.x + drift * 0.3) % (GAME_W + 60)) - 30;
      px(ctx, cx, c.y + 4, c.w, 3, COLORS.cloud);
      px(ctx, cx + 4, c.y, c.w - 8, 5, COLORS.cloudHi);
      px(ctx, cx + 8, c.y - 2, c.w - 16, 3, COLORS.cloudHi);
      px(ctx, cx + 2, c.y + 7, c.w - 4, 2, COLORS.cloud);
    }
  }

  drawSun(ctx, sx, sy) {
    for (let i = 0; i < 8; i += 1) {
      const angle = (i / 8) * Math.PI * 2;
      const rx = sx + Math.cos(angle) * 7;
      const ry = sy + Math.sin(angle) * 7;
      px(ctx, rx - 1, ry - 1, 2, 2, COLORS.sunRay);
    }
    px(ctx, sx - 4, sy - 4, 8, 8, COLORS.sunRay);
    px(ctx, sx - 3, sy - 3, 6, 6, COLORS.sunCore);
    px(ctx, sx - 2, sy - 2, 4, 4, COLORS.sun);
    px(ctx, sx - 1, sy - 1, 2, 2, '#fff3b0');
  }

  drawMoon(ctx, mx, my) {
    px(ctx, mx - 4, my - 4, 8, 8, COLORS.moon);
    px(ctx, mx - 3, my - 3, 6, 6, COLORS.moonHi);
    px(ctx, mx - 1, my - 2, 3, 4, COLORS.moonCrater);
    px(ctx, mx + 1, my + 1, 2, 2, COLORS.moonCrater);
  }

  drawStars(ctx, terrarium) {
    for (let i = 0; i < 32; i += 1) {
      const starX = (i * 53 + 17) % GAME_W;
      const starY = (i * 31 + 5) % 55;
      const tw = 0.3 + Math.abs(Math.sin(terrarium.totalPlayTime * 2 + i * 0.7)) * 0.7;
      ctx.globalAlpha = tw;
      const sz = i % 5 === 0 ? 2 : 1;
      px(ctx, starX, starY, sz, sz, COLORS.star);
      ctx.globalAlpha = 1;
    }
  }

  drawJar(ctx, terrarium) {
    const { x: jx, y: jy, w: jw, h: jh } = JAR;

    px(ctx, jx - 12, jy + jh + 2, jw + 24, 8, COLORS.woodDark);
    px(ctx, jx - 10, jy + jh, jw + 20, 6, COLORS.wood);
    px(ctx, jx - 8, jy + jh + 6, jw + 16, 4, COLORS.woodLo);
    px(ctx, jx - 6, jy + jh + 10, jw + 12, 3, COLORS.woodDark);
    for (let i = 0; i < 4; i += 1) {
      px(ctx, jx + 16 + i * 56, jy + jh + 1, 2, 5, COLORS.woodHi);
    }

    px(ctx, jx + 18, jy - 10, jw - 36, 8, COLORS.wood);
    px(ctx, jx + 22, jy - 12, jw - 44, 4, COLORS.woodHi);
    px(ctx, jx + 20, jy - 4, jw - 40, 3, COLORS.woodLo);
    px(ctx, jx + jw / 2 - 6, jy - 14, 12, 4, COLORS.woodDark);

    ctx.globalAlpha = 0.08;
    ctx.fillStyle = COLORS.glass;
    ctx.fillRect(jx + 2, jy + 2, jw - 4, jh - 4);
    ctx.globalAlpha = 1;

    const soilTop = jy + jh - SOIL_H;
    for (let row = 0; row < SOIL_H; row += 2) {
      for (let col = 4; col < jw - 4; col += 4) {
        const noise = (col * 7 + row * 13) % 17;
        const c = noise < 3
          ? COLORS.soilPebb
          : row > SOIL_H - 8
            ? COLORS.soilDark
            : noise < 8 ? COLORS.soilLight : COLORS.soil;
        px(ctx, jx + col, soilTop + row, 4, 2, c);
      }
    }
    px(ctx, jx + 4, soilTop, jw - 8, 2, COLORS.soilLight);

    const pebbles = [
      [24, -4, 10, 6], [26, -6, 6, 3], [jw - 44, -3, 12, 5],
      [jw - 40, -5, 5, 3], [jw / 2 - 8, -3, 8, 4],
    ];
    for (const [ox, oy, pw, ph] of pebbles) {
      px(ctx, jx + ox, soilTop + oy, pw, ph, COLORS.soilPebb);
      px(ctx, jx + ox + 1, soilTop + oy, pw - 2, 1, COLORS.soilLight);
    }

    ctx.strokeStyle = COLORS.glassLo;
    ctx.lineWidth = 2;
    ctx.strokeRect(jx, jy, jw, jh);
    ctx.strokeStyle = COLORS.glassDeep;
    ctx.lineWidth = 1;
    ctx.strokeRect(jx + 1, jy + 1, jw - 2, jh - 2);

    px(ctx, jx, jy, 3, 3, COLORS.bgDark);
    px(ctx, jx + jw - 3, jy, 3, 3, COLORS.bgDark);
    px(ctx, jx, jy + jh - 3, 3, 3, COLORS.bgDark);
    px(ctx, jx + jw - 3, jy + jh - 3, 3, 3, COLORS.bgDark);

    px(ctx, jx + 8, jy + 5, jw - 70, 2, COLORS.glassHi);
    px(ctx, jx + jw - 22, jy + 12, 2, jh - 36, COLORS.glassHi);
    ctx.globalAlpha = 0.45;
    px(ctx, jx + 5, jy + 12, 2, jh - 48, COLORS.glassHi);
    px(ctx, jx + 14, jy + jh - 40, jw - 28, 1, COLORS.glass);
    ctx.globalAlpha = 1;

    if (terrarium.moisture > 65) {
      ctx.globalAlpha = Math.min(0.4, (terrarium.moisture - 65) / 70);
      for (let i = 0; i < 8; i += 1) {
        const row = i % 4;
        const fogY = jy + 24 + row * 18;
        px(ctx, jx + 10 + (i % 3) * 72, fogY, 28, 1, COLORS.waterLight);
        px(ctx, jx + 16 + (i % 3) * 68, fogY + 6, 18, 1, COLORS.waterPale);
      }
      ctx.globalAlpha = 1;
    }

    if (terrarium.moisture > 80) {
      ctx.globalAlpha = Math.min(0.25, (terrarium.moisture - 80) / 60);
      px(ctx, jx + 4, jy + 8, 3, jh - 20, COLORS.waterPale);
      px(ctx, jx + jw - 8, jy + 14, 2, jh - 30, COLORS.waterLight);
      ctx.globalAlpha = 1;
    }
  }

  drawParticlesBehind(ctx, terrarium, tSec) {
    for (const p of terrarium.particles) {
      if (p.kind !== 'firefly') continue;
      const x = p.x * GAME_W;
      const y = p.y * GAME_H;
      const flicker = 0.35 + Math.abs(Math.sin(tSec * 3 + x)) * 0.65;
      ctx.globalAlpha = Math.min(1, p.life) * flicker;
      px(ctx, x, y, 2, 2, COLORS.firefly);
      ctx.globalAlpha = 0.2 * flicker;
      px(ctx, x - 2, y - 2, 6, 6, COLORS.firefly);
      ctx.globalAlpha = 1;
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
  }

  drawBranchPreview(ctx, plant) {
    const scores = getBranchScores(plant.speciesId, plant.care.snapshot());
    const sorted = [...scores].sort((a, b) => b.score - a.score);
    const max = sorted[0]?.score || 1;

    px(ctx, 48, 154, 288, 52, COLORS.hudBg);
    ctx.strokeStyle = COLORS.hudBorder;
    ctx.lineWidth = 1;
    ctx.strokeRect(48.5, 154.5, 287, 51);
    px(ctx, 50, 156, 284, 2, COLORS.glassLo);

    const positions = [0.28, 0.5, 0.72];
    scores.forEach((s, i) => {
      const alpha = 0.2 + (s.score / max) * 0.65;
      drawBranchSilhouette(ctx, positions[i] * GAME_W, 196, plant.speciesId, s.id, alpha);
    });

    ctx.fillStyle = COLORS.textDim;
    ctx.font = '8px "Pixelify Sans", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Đang định hình...', GAME_W / 2, 166);

    const labels = scores.map((s) => BRANCH_LABELS[s.id] ?? s.id);
    ctx.font = '7px "Pixelify Sans", monospace';
    labels.forEach((label, i) => {
      ctx.fillStyle = scores[i].score === max ? COLORS.sparkle : COLORS.textDim;
      ctx.fillText(label, positions[i] * GAME_W, 202);
    });
  }

  drawDayNightOverlay(ctx, terrarium) {
    if (terrarium.isDay) {
      ctx.globalAlpha = 0.04;
      ctx.fillStyle = COLORS.sunCore;
    } else {
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = COLORS.skyNightTop;
    }
    ctx.fillRect(0, 0, GAME_W, GAME_H);
    ctx.globalAlpha = 1;

    ctx.globalAlpha = 0.35;
    const vig = 12;
    px(ctx, 0, 0, GAME_W, vig, COLORS.bgDark);
    px(ctx, 0, GAME_H - vig, GAME_W, vig, COLORS.bgDark);
    px(ctx, 0, 0, vig, GAME_H, COLORS.bgDark);
    px(ctx, GAME_W - vig, 0, vig, GAME_H, COLORS.bgDark);
    ctx.globalAlpha = 1;
  }

  drawTopHUD(ctx, terrarium) {
    const hours = Math.floor(terrarium.time * 24);
    const mins = Math.floor((terrarium.time * 24 - hours) * 60);

    this.drawHudPanel(ctx, 4, 4, 104, 30);
    this.drawHudPanel(ctx, GAME_W - 108, 4, 104, 30);

    const iconX = 10;
    const iconY = 11;
    if (terrarium.isDay) {
      px(ctx, iconX, iconY - 2, 6, 6, COLORS.sunRay);
      px(ctx, iconX + 1, iconY - 1, 4, 4, COLORS.sun);
    } else {
      px(ctx, iconX + 1, iconY - 2, 5, 5, COLORS.moon);
      px(ctx, iconX + 2, iconY - 1, 3, 3, COLORS.moonHi);
    }

    ctx.fillStyle = COLORS.text;
    ctx.font = '9px "Pixelify Sans", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`, 20, 14);

    px(ctx, 68, 9, 6, 6, COLORS.flower);
    px(ctx, 69, 10, 4, 4, COLORS.seed);
    ctx.fillStyle = COLORS.textDim;
    ctx.fillText(`${terrarium.seeds}`, 76, 14);

    this.drawBar(ctx, 10, 22, 92, 6, terrarium.moisture / 100, COLORS.water, 'Ẩm');

    px(ctx, GAME_W - 98, 9, 6, 6, COLORS.leafMid);
    px(ctx, GAME_W - 97, 10, 4, 4, COLORS.leafBright);
    ctx.fillStyle = COLORS.text;
    ctx.fillText(`${terrarium.plants.length}/4`, GAME_W - 90, 14);

    this.drawBar(ctx, GAME_W - 98, 22, 92, 6, terrarium.ambientLight / 100, COLORS.sunCore, 'Sáng');
  }

  drawHudPanel(ctx, x, y, w, h) {
    ctx.globalAlpha = 0.88;
    px(ctx, x, y, w, h, COLORS.hudBg);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = COLORS.hudBorder;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    px(ctx, x + 1, y + 1, w - 2, 1, COLORS.glassLo);
  }

  drawBar(ctx, x, y, w, h, pct, color, label) {
    px(ctx, x, y, w, h, COLORS.bgDark);
    ctx.strokeStyle = COLORS.outline;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    const fillW = Math.max(0, Math.floor((w - 4) * Math.min(1, pct)));
    if (fillW > 0) {
      px(ctx, x + 2, y + 2, fillW, h - 4, color);
      px(ctx, x + 2, y + 2, fillW, 1, COLORS.glassHi);
    }
    if (label) {
      ctx.fillStyle = COLORS.textDim;
      ctx.font = '6px "Pixelify Sans", monospace';
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
    if (Math.abs(gx - cx) < 22 && gy > cy - 40 && gy < cy + 14) return p;
  }
  return null;
}
