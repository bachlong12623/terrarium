import { Plant } from './Plant.js';
import { START_SEEDS, HARVEST_SEEDS, MAX_PLANTS, PLANT_SLOTS } from './constants.js';

const DAY_LENGTH = 120;

export class Terrarium {
  constructor() {
    this.moisture = 55;
    this.light = 60;
    this.time = 0.25;
    this.plants = [];
    this.particles = [];
    this.rotation = 0;
    this.lastAction = null;
    this.actionCooldowns = {};
    this.discoveredBranches = new Set();
    this.discoveredStages = new Set();
    this.totalPlayTime = 0;
    this.seeds = START_SEEDS;
    this.harvestCount = 0;
  }

  get isDay() {
    return this.time < 0.5;
  }

  get ambientLight() {
    const dayCurve = this.isDay
      ? 55 + Math.sin(this.time * Math.PI * 2) * 35
      : 15 + Math.sin(this.time * Math.PI * 2) * 8;
    return Math.min(100, Math.max(5, dayCurve + this.rotation * 0.15));
  }

  get environment() {
    return {
      moisture: this.moisture,
      light: this.ambientLight,
      isDay: this.isDay,
      time: this.time,
    };
  }

  findFreeSlot() {
    for (const slot of PLANT_SLOTS) {
      const taken = this.plants.some((p) => Math.abs(p.x - slot) < 0.06);
      if (!taken) return slot;
    }
    return null;
  }

  plantSeed(speciesId = 'succulent') {
    if (this.plants.length >= MAX_PLANTS) return { ok: false, reason: 'full' };
    if (this.seeds <= 0) return { ok: false, reason: 'noseed' };

    const slot = this.findFreeSlot();
    if (slot === null) return { ok: false, reason: 'full' };

    this.seeds -= 1;
    const plant = new Plant(speciesId, slot, 0.72);
    this.plants.push(plant);
    this.discoveredStages.add(`${speciesId}-1`);
    return { ok: true, plant };
  }

  harvest(plant) {
    const idx = this.plants.indexOf(plant);
    if (idx === -1 || !plant.isHarvestable) return false;

    this.plants.splice(idx, 1);
    this.seeds += HARVEST_SEEDS;
    this.harvestCount += 1;
    this.spawnHarvestBurst(plant.x, plant.y);
    return true;
  }

  spawnHarvestBurst(x, y) {
    for (let i = 0; i < 14; i += 1) {
      this.particles.push({
        kind: 'seedfly',
        x: x + (Math.random() - 0.5) * 0.05,
        y: y - 0.05,
        vy: -0.08 - Math.random() * 0.12,
        vx: (Math.random() - 0.5) * 0.1,
        life: 0.8 + Math.random() * 0.6,
      });
    }
  }

  canAction(id, cooldown = 1.5) {
    const now = performance.now() / 1000;
    const last = this.actionCooldowns[id] ?? 0;
    return now - last >= cooldown;
  }

  markAction(id) {
    this.actionCooldowns[id] = performance.now() / 1000;
  }

  water() {
    if (!this.canAction('water', 1.2)) return false;
    this.markAction('water');
    this.moisture = Math.min(100, this.moisture + 18);
    this.lastAction = { type: 'water', t: 0.4 };
    this.spawnRipple();
    return { watered: true, waterBoost: 1, cooldown: 1.2 };
  }

  mist() {
    if (!this.canAction('mist', 2)) return false;
    this.markAction('mist');
    this.moisture = Math.min(100, this.moisture + 10);
    this.lastAction = { type: 'mist', t: 0.6 };
    this.spawnMist();
    return { misted: true, mistBoost: 1, cooldown: 2 };
  }

  rotate() {
    if (!this.canAction('rotate', 0.8)) return false;
    this.markAction('rotate');
    this.rotation = (this.rotation + 15) % 100;
    this.lastAction = { type: 'rotate', t: 0.3 };
    return { rotated: true, rotateBoost: 1, cooldown: 0.8 };
  }

  fertilize() {
    if (!this.canAction('fertilize', 3)) return false;
    this.markAction('fertilize');
    this.lastAction = { type: 'fertilize', t: 0.5 };
    for (const plant of this.plants) {
      plant.stageProgress += 8;
    }
    return { fertilized: true, cooldown: 3 };
  }

  prune() {
    if (!this.canAction('prune', 2.5)) return false;
    this.markAction('prune');
    this.lastAction = { type: 'prune', t: 0.4 };
    return { pruned: true, cooldown: 2.5 };
  }

  spawnRipple() {
    for (let i = 0; i < 6; i += 1) {
      this.particles.push({
        kind: 'drop',
        x: 0.45 + Math.random() * 0.1,
        y: 0.3 + Math.random() * 0.1,
        vy: 0.15 + Math.random() * 0.1,
        vx: 0,
        life: 0.5 + Math.random() * 0.3,
      });
    }
  }

  spawnMist() {
    for (let i = 0; i < 10; i += 1) {
      this.particles.push({
        kind: 'mist',
        x: 0.3 + Math.random() * 0.4,
        y: 0.5 + Math.random() * 0.2,
        vy: -0.02 - Math.random() * 0.03,
        vx: 0,
        life: 0.8 + Math.random() * 0.5,
      });
    }
  }

  update(dt, actionFlags = {}) {
    this.totalPlayTime += dt;
    this.time = (this.time + dt / DAY_LENGTH) % 1;

    this.moisture = Math.max(8, this.moisture - dt * 1.1);
    this.rotation = Math.max(0, this.rotation - dt * 2);

    if (!this.isDay && Math.random() < dt * 0.6 && this.particles.length < 40) {
      this.particles.push({
        kind: 'firefly',
        x: 0.25 + Math.random() * 0.5,
        y: 0.25 + Math.random() * 0.35,
        vy: (Math.random() - 0.5) * 0.02,
        vx: (Math.random() - 0.5) * 0.03,
        life: 2.5 + Math.random() * 2,
        maxLife: 4,
      });
    }

    if (this.lastAction) {
      this.lastAction.t -= dt;
      if (this.lastAction.t <= 0) this.lastAction = null;
    }

    const flags = {
      waterBoost: actionFlags.watered ? 1 : 0,
      mistBoost: actionFlags.misted ? 1 : 0,
      rotateBoost: actionFlags.rotated ? 1 : 0,
      watered: actionFlags.watered,
      misted: actionFlags.misted,
      rotated: actionFlags.rotated,
      fertilized: actionFlags.fertilized,
      pruned: actionFlags.pruned,
    };

    for (const plant of this.plants) {
      plant.update(dt, this.environment, flags);
      this.discoveredStages.add(`${plant.speciesId}-${plant.stage}`);
      if (plant.branch) {
        this.discoveredBranches.add(`${plant.speciesId}-${plant.branch}`);
      }
    }

    this.particles = this.particles
      .map((p) => ({ ...p, x: p.x + (p.vx ?? 0) * dt, y: p.y + p.vy * dt, life: p.life - dt }))
      .filter((p) => p.life > 0);
  }

  toJSON() {
    return {
      moisture: this.moisture,
      light: this.light,
      time: this.time,
      rotation: this.rotation,
      plants: this.plants.map((p) => p.toJSON()),
      discoveredBranches: [...this.discoveredBranches],
      discoveredStages: [...this.discoveredStages],
      totalPlayTime: this.totalPlayTime,
      seeds: this.seeds,
      harvestCount: this.harvestCount,
    };
  }

  static fromJSON(data) {
    const t = new Terrarium();
    if (!data) return t;
    t.moisture = data.moisture ?? 55;
    t.light = data.light ?? 60;
    t.time = data.time ?? 0.25;
    t.rotation = data.rotation ?? 0;
    t.totalPlayTime = data.totalPlayTime ?? 0;
    t.seeds = data.seeds ?? START_SEEDS;
    t.harvestCount = data.harvestCount ?? 0;
    t.plants = (data.plants ?? []).map((p) => Plant.fromJSON(p));
    t.discoveredBranches = new Set(data.discoveredBranches ?? []);
    t.discoveredStages = new Set(data.discoveredStages ?? []);
    return t;
  }
}
