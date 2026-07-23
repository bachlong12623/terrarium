import { COLORS, GAME_W, GAME_H, STAGE_NAMES, BRANCH_LABELS } from '../game/constants.js';
import { getBranchScores, getPlantDef } from '../data/plants.js';

function px(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x), Math.floor(y), w, h);
}

function drawSeed(ctx, x, y, stage) {
  const s = stage <= 1 ? 1 : 1.2;
  px(ctx, x - 2 * s, y - 2 * s, 4 * s, 4 * s, COLORS.soilDark);
  px(ctx, x - 1 * s, y - 1 * s, 2 * s, 2 * s, '#6b5344');
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

function drawPreBranch(ctx, x, y, variant, branchHint) {
  const alpha = branchHint ? 0.85 : 1;
  ctx.globalAlpha = alpha;
  drawGrowing(ctx, x, y, variant);
  px(ctx, x - 1, y - 14, 2, 4, COLORS.leafPale);
  ctx.globalAlpha = 1;
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

function drawBranchSilhouette(ctx, x, y, branchId, alpha) {
  ctx.globalAlpha = alpha;
  if (branchId === 'rosette') drawRosette(ctx, x, y, 7, 0);
  else if (branchId === 'desert') drawDesert(ctx, x, y, 7);
  else drawGarden(ctx, x, y, 7);
  ctx.globalAlpha = 1;
}

export function drawPlant(ctx, plant, env) {
  const x = plant.x * GAME_W;
  const y = plant.y * GAME_H;
  const stage = plant.stage;
  const branch = plant.branch;
  const v = plant.variant;

  ctx.save();
  if (plant.stageUpAnim > 0) {
    const pulse = 1 + Math.sin(plant.stageUpAnim * 12) * 0.08;
    ctx.translate(x, y);
    ctx.scale(pulse, pulse);
    ctx.translate(-x, -y);
  }

  if (stage <= 1) drawSeed(ctx, x, y, stage);
  else if (stage === 2) drawAwaken(ctx, x, y);
  else if (stage === 3) drawSprout(ctx, x, y, v);
  else if (stage === 4) drawSeedling(ctx, x, y, v);
  else if (stage === 5) drawGrowing(ctx, x, y, v);
  else if (stage === 6) {
    const scores = getBranchScores(plant.speciesId, plant.care.snapshot());
    const top = scores.sort((a, b) => b.score - a.score)[0];
    drawPreBranch(ctx, x, y, v, top?.id);
  } else if (stage >= 7) {
    const b = branch ?? 'rosette';
    if (b === 'rosette') drawRosette(ctx, x, y, stage, v);
    else if (b === 'desert') drawDesert(ctx, x, y, stage);
    else drawGarden(ctx, x, y, stage);
  }

  for (const s of plant.sparkles) {
    const a = s.life / s.maxLife;
    ctx.globalAlpha = a;
    px(ctx, x + s.x, y + s.y - 12, s.size, s.size, COLORS.sparkle);
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

export class PixelRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this.selectedPlant = null;
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
    this.offsetX = (container.clientWidth - this.canvas.width) / 2;
    this.offsetY = (container.clientHeight - this.canvas.height) / 2;
    this.ctx.imageSmoothingEnabled = false;
  }

  screenToGame(sx, sy) {
    const rect = this.canvas.getBoundingClientRect();
    const x = ((sx - rect.left) / this.scale);
    const y = ((sy - rect.top) / this.scale);
    return { x: x / GAME_W, y: y / GAME_H, gx: x, gy: y };
  }

  render(terrarium, uiState) {
    const ctx = this.ctx;
    ctx.save();
    ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0);
    ctx.clearRect(0, 0, GAME_W, GAME_H);

    this.drawBackground(ctx, terrarium);
    this.drawTerrarium(ctx, terrarium);
    this.drawParticles(ctx, terrarium);

    for (const plant of terrarium.plants) {
      drawPlant(ctx, plant, terrarium.environment);
    }

    if (uiState?.showBranchPreview && terrarium.plants[0]?.stage === 6) {
      this.drawBranchPreview(ctx, terrarium.plants[0]);
    }

    this.drawDayNightOverlay(ctx, terrarium);
    this.drawTopHUD(ctx, terrarium);

    if (uiState?.toast) {
      this.drawToast(ctx, uiState.toast);
    }

    ctx.restore();
  }

  drawBackground(ctx, terrarium) {
    const grd = ctx.createLinearGradient(0, 0, 0, GAME_H);
    grd.addColorStop(0, COLORS.bgMid);
    grd.addColorStop(1, COLORS.bgDark);
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, GAME_W, GAME_H);

    for (let i = 0; i < 20; i += 1) {
      const sx = (i * 37 + terrarium.time * 50) % GAME_W;
      const sy = (i * 23) % (GAME_H * 0.5);
      px(ctx, sx, sy, 1, 1, COLORS.glassLo);
    }
  }

  drawTerrarium(ctx, terrarium) {
    const jarX = 72;
    const jarY = 28;
    const jarW = 240;
    const jarH = 150;

    px(ctx, jarX - 4, jarY + jarH, jarW + 8, 8, COLORS.soilDark);
    px(ctx, jarX, jarY + jarH - 4, jarW, 6, COLORS.soil);

    const soilH = 28;
    for (let row = 0; row < soilH; row += 2) {
      for (let col = 0; col < jarW; col += 4) {
        const c = (col + row) % 8 === 0 ? COLORS.soilLight : COLORS.soil;
        px(ctx, jarX + col, jarY + jarH - soilH + row, 4, 2, c);
      }
    }

    ctx.globalAlpha = 0.15;
    ctx.fillStyle = COLORS.glass;
    ctx.fillRect(jarX + 4, jarY + 8, jarW - 8, jarH - 12);
    ctx.globalAlpha = 1;

    ctx.strokeStyle = COLORS.glassLo;
    ctx.lineWidth = 2;
    ctx.strokeRect(jarX, jarY, jarW, jarH);

    px(ctx, jarX + 8, jarY + 4, jarW - 40, 2, COLORS.glassHi);
    px(ctx, jarX + jarW - 30, jarY + 12, 2, jarH - 24, COLORS.glassHi);

    const moisture = terrarium.moisture;
    if (moisture > 70) {
      ctx.globalAlpha = 0.25;
      for (let i = 0; i < 5; i += 1) {
        px(ctx, jarX + 20 + i * 40, jarY + 60, 20, 1, COLORS.waterLight);
      }
      ctx.globalAlpha = 1;
    }
  }

  drawParticles(ctx, terrarium) {
    for (const p of terrarium.particles) {
      const x = p.x * GAME_W;
      const y = p.y * GAME_H;
      const a = Math.min(1, p.life * 2);
      ctx.globalAlpha = a;
      if (p.kind === 'drop') {
        px(ctx, x, y, 2, 3, COLORS.water);
      } else {
        px(ctx, x, y, 3, 3, COLORS.waterPale);
      }
      ctx.globalAlpha = 1;
    }
  }

  drawBranchPreview(ctx, plant) {
    const scores = getBranchScores(plant.speciesId, plant.care.snapshot()).sort((a, b) => b.score - a.score);
    const max = scores[0]?.score || 1;
    const positions = [
      { x: 0.28, branch: 'rosette' },
      { x: 0.5, branch: 'desert' },
      { x: 0.72, branch: 'garden' },
    ];

    ctx.globalAlpha = 0.35;
    ctx.fillStyle = COLORS.bgDark;
    ctx.fillRect(50, 160, 284, 44);
    ctx.globalAlpha = 1;

    for (const pos of positions) {
      const score = scores.find((s) => s.id === pos.branch);
      const alpha = 0.25 + ((score?.score ?? 0) / max) * 0.55;
      drawBranchSilhouette(ctx, pos.x * GAME_W, 178, pos.branch, alpha);
    }

    ctx.fillStyle = COLORS.textDim;
    ctx.font = '8px "Pixelify Sans", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Đang định hình...', GAME_W / 2, 170);
  }

  drawDayNightOverlay(ctx, terrarium) {
    if (terrarium.isDay) {
      ctx.globalAlpha = 0.06;
      ctx.fillStyle = COLORS.sunWarm;
    } else {
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = COLORS.bgDark;
      for (let i = 0; i < 12; i += 1) {
        px(ctx, 20 + i * 30, 8 + (i % 3) * 4, 1, 1, COLORS.moon);
      }
    }
    ctx.fillRect(0, 0, GAME_W, GAME_H);
    ctx.globalAlpha = 1;
  }

  drawTopHUD(ctx, terrarium) {
    const timeIcon = terrarium.isDay ? '☀' : '🌙';
    const hours = Math.floor(terrarium.time * 24);
    const mins = Math.floor((terrarium.time * 24 - hours) * 60);

    ctx.fillStyle = COLORS.bgLight;
    ctx.globalAlpha = 0.85;
    ctx.fillRect(8, 6, 110, 14);
    ctx.fillRect(GAME_W - 118, 6, 110, 14);
    ctx.globalAlpha = 1;

    ctx.fillStyle = COLORS.text;
    ctx.font = '8px "Pixelify Sans", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${timeIcon} ${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`, 12, 16);

    ctx.textAlign = 'right';
    ctx.fillText(`💧 ${Math.round(terrarium.moisture)}%`, GAME_W - 12, 16);

    this.drawBar(ctx, 12, 22, 60, 4, terrarium.moisture / 100, COLORS.water);
    this.drawBar(ctx, GAME_W - 72, 22, 60, 4, terrarium.ambientLight / 100, COLORS.sunWarm);
  }

  drawBar(ctx, x, y, w, h, pct, color) {
    px(ctx, x, y, w, h, COLORS.bgDark);
    px(ctx, x, y, Math.floor(w * pct), h, color);
  }

  drawToast(ctx, toast) {
    const text = toast.branch
      ? `Nhánh: ${BRANCH_LABELS[toast.branch] ?? toast.branch}`
      : toast.stage
        ? `Giai đoạn: ${STAGE_NAMES[toast.stage] ?? toast.stage}`
        : toast.message ?? '';

    const w = Math.min(GAME_W - 40, text.length * 5 + 24);
    const x = (GAME_W - w) / 2;
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = COLORS.bgLight;
    ctx.fillRect(x, 100, w, 18);
    ctx.strokeStyle = COLORS.leafBright;
    ctx.strokeRect(x, 100, w, 18);
    ctx.globalAlpha = 1;
    ctx.fillStyle = COLORS.text;
    ctx.font = '8px "Pixelify Sans", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(text, GAME_W / 2, 112);
  }
}

export function getPlantAt(terrarium, gx, gy) {
  for (let i = terrarium.plants.length - 1; i >= 0; i -= 1) {
    const p = terrarium.plants[i];
    const px = p.x * GAME_W;
    const py = p.y * GAME_H;
    if (Math.abs(gx - px) < 20 && Math.abs(gy - py) < 24) return p;
  }
  return null;
}
