import { BRANCH_WINDOW_STAGES, STAGE_DURATIONS } from './constants.js';
import { resolveBranch } from '../data/plants.js';

export class CareTracker {
  constructor() {
    this.humid = 33;
    this.radiant = 33;
    this.samples = 0;
    this.pruneCount = 0;
    this.fertilizeCount = 0;
    this.mistCount = 0;
    this.waterCount = 0;
    this.rotateCount = 0;
  }

  record(env, actions = {}) {
    if (!BRANCH_WINDOW_STAGES.includes(actions.stage)) return;

    const humidSample = Math.min(100, env.moisture * 0.7 + (actions.mistBoost ?? 0) * 30 + (actions.waterBoost ?? 0) * 20);
    const radiantSample = Math.min(100, env.light * 0.8 + (actions.rotateBoost ?? 0) * 25);

    this.humid = (this.humid * this.samples + humidSample) / (this.samples + 1);
    this.radiant = (this.radiant * this.samples + radiantSample) / (this.samples + 1);
    this.samples += 1;

    if (actions.pruned) this.pruneCount += 1;
    if (actions.fertilized) this.fertilizeCount += 1;
    if (actions.misted) this.mistCount += 1;
    if (actions.watered) this.waterCount += 1;
    if (actions.rotated) this.rotateCount += 1;
  }

  snapshot() {
    return {
      humid: this.humid,
      radiant: this.radiant,
      pruneCount: this.pruneCount,
      fertilizeCount: this.fertilizeCount,
      mistCount: this.mistCount,
      waterCount: this.waterCount,
      rotateCount: this.rotateCount,
      samples: this.samples,
    };
  }

  static fromJSON(data) {
    const tracker = new CareTracker();
    if (!data) return tracker;
    Object.assign(tracker, data);
    return tracker;
  }
}

export class Plant {
  constructor(speciesId = 'succulent', x = 0.5, y = 0.72) {
    this.speciesId = speciesId;
    this.x = x;
    this.y = y;
    this.stage = 1;
    this.stageProgress = 0;
    this.branch = null;
    this.care = new CareTracker();
    this.stageUpAnim = 0;
    this.sparkles = [];
    this.variant = Math.floor(Math.random() * 3);
    this.plantedAt = Date.now();
    this.lastToast = null;
    this.stress = 0;
    this.withered = false;
  }

  get stageDuration() {
    const d = STAGE_DURATIONS[this.stage];
    return d > 0 ? d : Infinity;
  }

  get isBranchingWindow() {
    return BRANCH_WINDOW_STAGES.includes(this.stage);
  }

  get isComplete() {
    return this.stage >= 8;
  }

  get isHarvestable() {
    return this.stage >= 8;
  }

  update(dt, env, actionFlags) {
    this.updateStress(dt, env);

    if (this.stage >= 8) {
      this.updateSparkles(dt);
      if (this.stageUpAnim > 0) this.stageUpAnim -= dt;
      return;
    }

    if (this.isBranchingWindow) {
      this.care.record(env, { ...actionFlags, stage: this.stage });
    }

    const growthRate = this.getGrowthRate(env);
    this.stageProgress += dt * growthRate;

    if (this.stageProgress >= this.stageDuration) {
      this.advanceStage();
    }

    if (this.stageUpAnim > 0) {
      this.stageUpAnim -= dt;
    }

    this.updateSparkles(dt);
  }

  updateStress(dt, env) {
    const harsh = env.moisture < 15 || env.moisture > 95;
    if (harsh) {
      this.stress = Math.min(20, this.stress + dt);
    } else {
      this.stress = Math.max(0, this.stress - dt * 2);
    }

    if (!this.withered && this.stress >= 8) {
      this.withered = true;
      this.lastToast = { type: 'wither' };
    } else if (this.withered && this.stress <= 1) {
      this.withered = false;
      this.lastToast = { type: 'recover' };
      this.spawnSparkles(8);
    }
  }

  getGrowthRate(env) {
    if (this.withered) return 0;

    let rate = 1;
    if (env.moisture < 15 || env.moisture > 95) rate *= 0.35;
    else if (env.moisture >= 40 && env.moisture <= 75) rate *= 1.15;

    if (env.light < 20) rate *= 0.5;
    else if (env.light >= 45 && env.light <= 85) rate *= 1.1;

    if (this.stage >= 5) rate *= 0.85;
    return rate;
  }

  advanceStage() {
    const prev = this.stage;
    this.stage += 1;
    this.stageProgress = 0;
    this.stageUpAnim = 1.2;
    this.spawnSparkles(12);

    if (prev === 6 && !this.branch) {
      this.branch = resolveBranch(this.speciesId, this.care.snapshot());
      this.lastToast = { type: 'branch', branch: this.branch };
    } else {
      this.lastToast = { type: 'stage', stage: this.stage };
    }
  }

  spawnSparkles(count = 8) {
    for (let i = 0; i < count; i += 1) {
      this.sparkles.push({
        x: (Math.random() - 0.5) * 24,
        y: (Math.random() - 0.5) * 20,
        life: 0.6 + Math.random() * 0.5,
        maxLife: 0.6 + Math.random() * 0.5,
        size: 1 + Math.floor(Math.random() * 2),
      });
    }
  }

  updateSparkles(dt) {
    this.sparkles = this.sparkles
      .map((s) => ({ ...s, life: s.life - dt, y: s.y - dt * 12 }))
      .filter((s) => s.life > 0);
  }

  toJSON() {
    return {
      speciesId: this.speciesId,
      x: this.x,
      y: this.y,
      stage: this.stage,
      stageProgress: this.stageProgress,
      branch: this.branch,
      care: this.care.snapshot(),
      variant: this.variant,
      plantedAt: this.plantedAt,
      stress: this.stress,
      withered: this.withered,
    };
  }

  static fromJSON(data) {
    const plant = new Plant(data.speciesId, data.x, data.y);
    plant.stage = data.stage ?? 1;
    plant.stageProgress = data.stageProgress ?? 0;
    plant.branch = data.branch ?? null;
    plant.care = CareTracker.fromJSON(data.care);
    plant.variant = data.variant ?? 0;
    plant.plantedAt = data.plantedAt ?? Date.now();
    plant.stress = data.stress ?? 0;
    plant.withered = data.withered ?? false;
    return plant;
  }
}
