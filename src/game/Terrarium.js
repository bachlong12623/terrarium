import { Plant } from './Plant.js';

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

  plantSeed(speciesId = 'succulent') {
    if (this.plants.length >= 3) return false;
    const x = 0.35 + Math.random() * 0.3;
    const plant = new Plant(speciesId, x, 0.72);
    this.plants.push(plant);
    this.discoveredStages.add(`${speciesId}-1`);
    return true;
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
    return { watered: true, waterBoost: 1 };
  }

  mist() {
    if (!this.canAction('mist', 2)) return false;
    this.markAction('mist');
    this.moisture = Math.min(100, this.moisture + 10);
    this.lastAction = { type: 'mist', t: 0.6 };
    this.spawnMist();
    return { misted: true, mistBoost: 1 };
  }

  rotate() {
    if (!this.canAction('rotate', 0.8)) return false;
    this.markAction('rotate');
    this.rotation = (this.rotation + 15) % 100;
    this.lastAction = { type: 'rotate', t: 0.3 };
    return { rotated: true, rotateBoost: 1 };
  }

  fertilize() {
    if (!this.canAction('fertilize', 3)) return false;
    this.markAction('fertilize');
    this.lastAction = { type: 'fertilize', t: 0.5 };
    for (const plant of this.plants) {
      plant.stageProgress += 8;
    }
    return { fertilized: true };
  }

  prune() {
    if (!this.canAction('prune', 2.5)) return false;
    this.markAction('prune');
    this.lastAction = { type: 'prune', t: 0.4 };
    return { pruned: true };
  }

  spawnRipple() {
    for (let i = 0; i < 6; i += 1) {
      this.particles.push({
        kind: 'drop',
        x: 0.45 + Math.random() * 0.1,
        y: 0.3 + Math.random() * 0.1,
        vy: 0.15 + Math.random() * 0.1,
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
        life: 0.8 + Math.random() * 0.5,
      });
    }
  }

  update(dt, actionFlags = {}) {
    this.totalPlayTime += dt;
    this.time = (this.time + dt / DAY_LENGTH) % 1;

    this.moisture = Math.max(8, this.moisture - dt * 1.8);
    this.rotation = Math.max(0, this.rotation - dt * 2);

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
      .map((p) => ({ ...p, y: p.y + p.vy * dt, life: p.life - dt }))
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
    t.plants = (data.plants ?? []).map((p) => Plant.fromJSON(p));
    t.discoveredBranches = new Set(data.discoveredBranches ?? []);
    t.discoveredStages = new Set(data.discoveredStages ?? []);
    return t;
  }
}
