import { Terrarium } from './Terrarium.js';
import { SaveManager } from './SaveManager.js';
import { PixelRenderer, getPlantAt } from '../render/PixelRenderer.js';
import { GameUI } from '../ui/GameUI.js';
import { BRANCH_LABELS, STAGE_NAMES } from './constants.js';

export class Game {
  constructor(canvas, uiRoot) {
    this.canvas = canvas;
    this.renderer = new PixelRenderer(canvas);
    this.ui = new GameUI(uiRoot, this);
    this.terrarium = new Terrarium();
    this.toast = null;
    this.toastTimer = 0;
    this.lastTime = 0;
    this.running = false;
    this.pendingFlags = {};
    this.autoSaveTimer = 0;
    this.selectedPlant = null;

    this.load();
    if (this.terrarium.plants.length === 0) {
      this.terrarium.plantSeed('succulent');
    }

    this.bindInput();
    window.addEventListener('resize', () => this.renderer.resize());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.save();
      else this.applyOfflineProgress();
    });
  }

  load() {
    const data = SaveManager.load();
    if (data?.terrarium) {
      this.terrarium = Terrarium.fromJSON(data.terrarium);
      this.applyOfflineProgress(data.savedAt);
    }
  }

  applyOfflineProgress(savedAt) {
    if (!savedAt) return;
    const elapsed = Math.min(12 * 3600, (Date.now() - savedAt) / 1000);
    if (elapsed < 5) return;

    let remaining = elapsed * 0.35;
    const step = 1;
    while (remaining > 0) {
      this.terrarium.update(step, {});
      remaining -= step;
    }
  }

  save() {
    SaveManager.save({ terrarium: this.terrarium.toJSON() });
  }

  exportSave() {
    SaveManager.exportSave({ terrarium: this.terrarium.toJSON() });
    this.ui.showToast('Đã xuất file save');
  }

  async importSave(file) {
    try {
      const data = await SaveManager.importSave(file);
      if (data.terrarium) {
        this.terrarium = Terrarium.fromJSON(data.terrarium);
        this.save();
        this.ui.hidePanel();
        this.ui.showToast('Đã nhập save');
      }
    } catch {
      this.ui.showToast('File save không hợp lệ');
    }
  }

  reset() {
    SaveManager.clear();
    this.terrarium = new Terrarium();
    this.terrarium.plantSeed('succulent');
    this.ui.hidePanel();
    this.ui.showToast('Đã bắt đầu lại');
  }

  bindInput() {
    const handleTap = (e) => {
      if (e.target.closest('.action-bar, .panel')) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const { gx, gy } = this.renderer.screenToGame(clientX, clientY);
      const plant = getPlantAt(this.terrarium, gx, gy);
      if (plant) {
        this.selectedPlant = plant;
        this.ui.showPlantDetail(plant);
      }
    };

    this.canvas.addEventListener('click', handleTap);
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      handleTap(e);
    }, { passive: false });
  }

  doWater() {
    const flags = this.terrarium.water();
    if (flags) {
      this.pendingFlags = { ...this.pendingFlags, ...flags };
      this.ui.showToast('Đã tưới nước 💧');
    }
  }

  doMist() {
    const flags = this.terrarium.mist();
    if (flags) {
      this.pendingFlags = { ...this.pendingFlags, ...flags };
      this.ui.showToast('Đã phun sương 🌫️');
    }
  }

  doRotate() {
    const flags = this.terrarium.rotate();
    if (flags) {
      this.pendingFlags = { ...this.pendingFlags, ...flags };
      this.ui.showToast('Đã xoay bình 🔄');
    }
  }

  doFertilize() {
    const flags = this.terrarium.fertilize();
    if (flags) {
      this.pendingFlags = { ...this.pendingFlags, ...flags };
      this.ui.showToast('Đã bón phân 🌿');
    }
  }

  doPrune() {
    const flags = this.terrarium.prune();
    if (flags) {
      this.pendingFlags = { ...this.pendingFlags, ...flags };
      this.ui.showToast('Đã cắt tỉa ✂️');
    }
  }

  doPlant() {
    if (this.terrarium.plantSeed('succulent')) {
      this.ui.showToast('Đã trồng sen đá mới 🌱');
      this.save();
    } else {
      this.ui.showToast('Tối đa 3 cây trong bình');
    }
  }

  start() {
    this.renderer.resize();
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  loop(now) {
    if (!this.running) return;
    const dt = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;

    this.terrarium.update(dt, this.pendingFlags);
    this.pendingFlags = {};

    for (const plant of this.terrarium.plants) {
      if (plant.lastToast) {
        const t = plant.lastToast;
        plant.lastToast = null;
        if (t.type === 'branch') {
          this.showGameToast(`Nhánh: ${BRANCH_LABELS[t.branch]}`);
        } else {
          this.showGameToast(`Giai đoạn: ${STAGE_NAMES[t.stage]}`);
        }
        this.save();
      }
    }

    if (this.toastTimer > 0) {
      this.toastTimer -= dt;
      if (this.toastTimer <= 0) this.toast = null;
    }

    this.autoSaveTimer += dt;
    if (this.autoSaveTimer >= 30) {
      this.autoSaveTimer = 0;
      this.save();
    }

    const plant = this.terrarium.plants[0];
    this.renderer.render(this.terrarium, {
      toast: this.toast,
      showBranchPreview: plant?.stage === 6,
    });

    requestAnimationFrame((t) => this.loop(t));
  }

  showGameToast(payload) {
    this.toast = payload;
    this.toastTimer = 2.5;
    const text = payload.branch
      ? `Nhánh: ${BRANCH_LABELS[payload.branch]}`
      : `Giai đoạn: ${STAGE_NAMES[payload.stage]}`;
    this.ui.showToast(text);
  }
}
