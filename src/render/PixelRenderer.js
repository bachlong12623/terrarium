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
  px(ctx, x - 1, y - 1, 2, 2, '#6b5344');
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
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.water;
    ctx.fillText('💧', x, y - 30);
  }

  if (plant.isHarvestable) {
    const bob = Math.round(Math.sin(tSec * 3) * 2);
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.flower;
    ctx.fillText('✦', x, y - 32 + bob);
  }

  if (selected) {
    ctx.strokeStyle = COLORS.sparkle;
    ctx.globalAlpha = 0.7;
    const bx = x - 14;
    const by = y - 28;
    const bw = 28;
    const bh = 32;
    ctx.strokeRect(bx, by, 4, 1);
    ctx.strokeRect(bx, by, 1, 4);
    ctx.strokeRect(bx + bw - 4, by, 4, 1);
    ctx.strokeRect(bx + bw - 1, by, 1, 4);
    ctx.strokeRect(bx, by + bh - 1, 4, 1);
    ctx.strokeRect(bx, by + bh - 4, 1, 4);
    ctx.strokeRect(bx + bw - 4, by + bh - 1, 4, 1);
    ctx.strokeRect(bx + bw - 1, by + bh - 4, 1, 4);
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
    const grd = ctx.createLinearGradient(0, 0, 0, GAME_H);
    if (terrarium.isDay) {
      grd.addColorStop(0, '#2d4a63');
      grd.addColorStop(0.5, COLORS.bgMid);
      grd.addColorStop(1, COLORS.bgDark);
    } else {
      grd.addColorStop(0, '#141b2a');
      grd.addColorStop(1, COLORS.bgDark);
    }
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, GAME_W, GAME_H);

    if (terrarium.isDay) {
      const frac = terrarium.time / 0.5;
      const sx = 24 + frac * (GAME_W - 48);
      const sy = 26 - Math.sin(frac * Math.PI) * 12;
      px(ctx, sx - 3, sy - 3, 6, 6, COLORS.accent);
      px(ctx, sx - 2, sy - 2, 4, 4, '#f8c58a');
      px(ctx, sx - 1, sy - 5, 2, 1, COLORS.accent);
      px(ctx, sx - 1, sy + 4, 2, 1, COLORS.accent);
      px(ctx, sx - 5, sy - 1, 1, 2, COLORS.accent);
      px(ctx, sx + 4, sy - 1, 1, 2, COLORS.accent);
    } else {
      const frac = (terrarium.time - 0.5) / 0.5;
      const mx = 24 + frac * (GAME_W - 48);
      const my = 24 - Math.sin(frac * Math.PI) * 10;
      px(ctx, mx - 3, my - 3, 6, 6, COLORS.moon);
      px(ctx, mx - 1, my - 2, 3, 3, '#9bb5d6');
      px(ctx, mx - 2, my - 1, 1, 1, '#5c7a9c');

      for (let i = 0; i < 24; i += 1) {
        const starX = (i * 53 + 17) % GAME_W;
        const starY = (i * 31 + 5) % 60;
        const tw = Math.sin(terrarium.totalPlayTime * 2 + i) > 0.3 ? 1 : 0.4;
        ctx.globalAlpha = tw;
        px(ctx, starX, starY, 1, 1, COLORS.sun);
        ctx.globalAlpha = 1;
      }
    }
  }

  drawJar(ctx, terrarium) {
    const { x: jx, y: jy, w: jw, h: jh } = JAR;

    px(ctx, jx - 8, jy + jh, jw + 16, 6, '#3a4a5a');
    px(ctx, jx - 6, jy + jh + 6, jw + 12, 3, '#2d3a48');

    px(ctx, jx + 20, jy - 8, jw - 40, 6, '#6b5344');
    px(ctx, jx + 24, jy - 10, jw - 48, 3, '#7d6350');
    px(ctx, jx + 20, jy - 3, jw - 40, 2, '#54412f');

    ctx.globalAlpha = 0.12;
    ctx.fillStyle = COLORS.glass;
    ctx.fillRect(jx + 3, jy + 3, jw - 6, jh - 6);
    ctx.globalAlpha = 1;

    const soilTop = jy + jh - SOIL_H;
    for (let row = 0; row < SOIL_H; row += 2) {
      for (let col = 4; col < jw - 4; col += 4) {
        const c = (col + row) % 12 === 0
          ? COLORS.soilLight
          : row > SOIL_H - 8 ? COLORS.soilDark : COLORS.soil;
        px(ctx, jx + col, soilTop + row, 4, 2, c);
      }
    }
    for (let col = 8; col < jw - 8; col += 24) {
      px(ctx, jx + col, soilTop - 1, 3, 2, '#7a95a5');
    }

    px(ctx, jx + 24, soilTop - 5, 10, 6, '#5c7a8a');
    px(ctx, jx + 26, soilTop - 7, 6, 3, '#6b8a9a');
    px(ctx, jx + jw - 44, soilTop - 4, 12, 5, '#4a6d7a');
    px(ctx, jx + jw - 40, soilTop - 6, 5, 3, '#5c7a8a');

    ctx.strokeStyle = COLORS.glassLo;
    ctx.lineWidth = 2;
    ctx.strokeRect(jx, jy, jw, jh);
    px(ctx, jx, jy, 3, 3, COLORS.bgDark);
    px(ctx, jx + jw - 3, jy, 3, 3, COLORS.bgDark);

    px(ctx, jx + 10, jy + 6, jw - 60, 2, COLORS.glassHi);
    px(ctx, jx + jw - 26, jy + 14, 2, jh - 40, COLORS.glassHi);
    ctx.globalAlpha = 0.5;
    px(ctx, jx + 6, jy + 14, 2, jh - 50, COLORS.glassHi);
    ctx.globalAlpha = 1;

    if (terrarium.moisture > 70) {
      ctx.globalAlpha = Math.min(0.35, (terrarium.moisture - 70) / 80);
      for (let i = 0; i < 6; i += 1) {
        px(ctx, jx + 14 + i * 38, jy + 30 + (i % 3) * 16, 22, 1, COLORS.waterLight);
        px(ctx, jx + 20 + i * 36, jy + 38 + (i % 2) * 20, 12, 1, COLORS.waterPale);
      }
      ctx.globalAlpha = 1;
    }
  }

  drawParticlesBehind(ctx, terrarium, tSec) {
    for (const p of terrarium.particles) {
      if (p.kind !== 'firefly') continue;
      const x = p.x * GAME_W;
      const y = p.y * GAME_H;
      const flicker = 0.4 + Math.abs(Math.sin(tSec * 3 + x)) * 0.6;
      ctx.globalAlpha = Math.min(1, p.life) * flicker;
      px(ctx, x, y, 2, 2, '#c9f27e');
      ctx.globalAlpha = 0.25 * flicker;
      px(ctx, x - 1, y - 1, 4, 4, '#c9f27e');
      ctx.globalAlpha = 1;
    }
  }

  drawParticlesFront(ctx, terrarium) {
    for (const p of terrarium.particles) {
      if (p.kind === 'firefly') continue;
      const x = p.x * GAME_W;
      const y = p.y * GAME_H;
      const a = Math.min(1, p.life * 2);
      ctx.globalAlpha = a;
      if (p.kind === 'drop') {
        px(ctx, x, y, 2, 3, COLORS.water);
      } else if (p.kind === 'seedfly') {
        px(ctx, x, y, 2, 2, COLORS.flower);
      } else {
        px(ctx, x, y, 3, 3, COLORS.waterPale);
      }
      ctx.globalAlpha = 1;
    }
  }

  drawBranchPreview(ctx, plant) {
    const scores = getBranchScores(plant.speciesId, plant.care.snapshot());
    const sorted = [...scores].sort((a, b) => b.score - a.score);
    const max = sorted[0]?.score || 1;

    ctx.globalAlpha = 0.4;
    ctx.fillStyle = COLORS.bgDark;
    ctx.fillRect(50, 158, 284, 48);
    ctx.globalAlpha = 1;

    const positions = [0.28, 0.5, 0.72];
    scores.forEach((s, i) => {
      const alpha = 0.25 + (s.score / max) * 0.55;
      drawBranchSilhouette(ctx, positions[i] * GAME_W, 196, plant.speciesId, s.id, alpha);
    });

    ctx.fillStyle = COLORS.textDim;
    ctx.font = '8px "Pixelify Sans", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Đang định hình...', GAME_W / 2, 167);
  }

  drawDayNightOverlay(ctx, terrarium) {
    if (terrarium.isDay) {
      ctx.globalAlpha = 0.05;
      ctx.fillStyle = COLORS.sunWarm;
    } else {
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = COLORS.bgDark;
    }
    ctx.fillRect(0, 0, GAME_W, GAME_H);
    ctx.globalAlpha = 1;
  }

  drawTopHUD(ctx, terrarium) {
    const hours = Math.floor(terrarium.time * 24);
    const mins = Math.floor((terrarium.time * 24 - hours) * 60);
    const timeIcon = terrarium.isDay ? '☀' : '☾';

    ctx.globalAlpha = 0.82;
    ctx.fillStyle = COLORS.bgLight;
    ctx.fillRect(6, 5, 96, 26);
    ctx.fillRect(GAME_W - 102, 5, 96, 26);
    ctx.globalAlpha = 1;

    ctx.strokeStyle = COLORS.glassLo;
    ctx.lineWidth = 1;
    ctx.strokeRect(6.5, 5.5, 95, 25);
    ctx.strokeRect(GAME_W - 101.5, 5.5, 95, 25);

    ctx.fillStyle = COLORS.text;
    ctx.font = '9px "Pixelify Sans", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${timeIcon} ${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`, 11, 15);
    ctx.fillStyle = COLORS.textDim;
    ctx.fillText(`Hạt: ${terrarium.seeds}`, 60, 15);

    this.drawBar(ctx, 11, 21, 86, 5, terrarium.moisture / 100, COLORS.water, 'Ẩm');

    ctx.fillStyle = COLORS.text;
    ctx.textAlign = 'left';
    ctx.fillText(`Cây: ${terrarium.plants.length}/4`, GAME_W - 96, 15);

    this.drawBar(ctx, GAME_W - 96, 21, 86, 5, terrarium.ambientLight / 100, COLORS.sunWarm, 'Sáng');
  }

  drawBar(ctx, x, y, w, h, pct, color) {
    px(ctx, x, y, w, h, COLORS.bgDark);
    px(ctx, x + 1, y + 1, Math.max(0, Math.floor((w - 2) * Math.min(1, pct))), h - 2, color);
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
