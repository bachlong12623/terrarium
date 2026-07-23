import { Terrarium } from './Terrarium.js';
import { SaveManager } from './SaveManager.js';
import { PixelRenderer, getPlantAt } from '../render/PixelRenderer.js';
import { GameUI } from '../ui/GameUI.js';
import { BRANCH_LABELS, STAGE_NAMES } from './constants.js';
import { getPlantDef } from '../data/plants.js';

export class Game {
  constructor(canvas, uiRoot) {
    this.canvas = canvas;
    this.renderer = new PixelRenderer(canvas);
    this.ui = new GameUI(uiRoot, this);
    this.terrarium = new Terrarium();
    this.lastTime = 0;
    this.running = false;
    this.pendingFlags = {};
    this.autoSaveTimer = 0;
    this.uiTickTimer = 0;
    this.selectedPlant = null;

    this.load();
    if (this.terrarium.plants.length === 0 && this.terrarium.seeds > 0) {
      this.terrarium.seeds += 1;
      this.terrarium.plantSeed('succulent');
    }

    this.bindInput();
    window.addEventListener('resize', () => this.renderer.resize());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.save();
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
    if (elapsed < 30) return;

    let remaining = elapsed * 0.35;
    const step = 1;
    while (remaining > 0) {
      this.terrarium.update(step, {});
      remaining -= step;
    }

    const mins = Math.round(elapsed / 60);
    const label = mins >= 60 ? `${Math.floor(mins / 60)}g ${mins % 60}p` : `${mins} phút`;
    this.ui.showToast(`⏳ Bạn đã vắng ${label} — cây vẫn lớn!`, 3500);
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
    this.terrarium.seeds += 1;
    this.terrarium.plantSeed('succulent');
    this.selectedPlant = null;
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
      } else {
        this.selectedPlant = null;
      }
    };

    this.canvas.addEventListener('click', handleTap);
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      handleTap(e);
    }, { passive: false });
  }

  applyAction(name, flags, toastMsg) {
    if (!flags) {
      this.ui.showToast('Chờ chút rồi thử lại...', 1200);
      return;
    }
    this.pendingFlags = { ...this.pendingFlags, ...flags };
    if (flags.cooldown) this.ui.startCooldown(name, flags.cooldown);
    this.ui.showToast(toastMsg, 1500);
  }

  doWater() {
    this.applyAction('water', this.terrarium.water(), 'Đã tưới nước 💧');
  }

  doMist() {
    this.applyAction('mist', this.terrarium.mist(), 'Đã phun sương 🌫️');
  }

  doRotate() {
    this.applyAction('rotate', this.terrarium.rotate(), 'Đã xoay bình — thêm ánh sáng 🔄');
  }

  doFertilize() {
    this.applyAction('fertilize', this.terrarium.fertilize(), 'Đã bón phân — cây lớn nhanh hơn 🌿');
  }

  doPrune() {
    this.applyAction('prune', this.terrarium.prune(), 'Đã cắt tỉa ✂️');
  }

  plantSpecies(speciesId) {
    const result = this.terrarium.plantSeed(speciesId);
    if (result.ok) {
      const def = getPlantDef(speciesId);
      this.ui.showToast(`Đã trồng ${def.name} ${def.icon}`);
      this.save();
    } else if (result.reason === 'noseed') {
      this.ui.showToast('Hết hạt giống — thu hoạch cây trưởng thành');
    } else {
      this.ui.showToast('Bình đã đầy');
    }
  }

  doHarvest(plant) {
    if (this.terrarium.harvest(plant)) {
      const def = getPlantDef(plant.speciesId);
      this.ui.showToast(`🌾 Thu hoạch ${def.name} — +2 hạt giống!`, 3000);
      if (this.selectedPlant === plant) this.selectedPlant = null;
      this.save();
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
        this.announcePlantEvent(plant, t);
        this.save();
      }
    }

    this.autoSaveTimer += dt;
    if (this.autoSaveTimer >= 30) {
      this.autoSaveTimer = 0;
      this.save();
    }

    this.uiTickTimer += dt;
    if (this.uiTickTimer >= 0.4) {
      this.uiTickTimer = 0;
      this.ui.updatePlantDetail();
    }

    this.renderer.render(this.terrarium, {
      selectedPlant: this.selectedPlant,
    });

    requestAnimationFrame((t) => this.loop(t));
  }

  announcePlantEvent(plant, event) {
    const def = getPlantDef(plant.speciesId);
    if (event.type === 'branch') {
      this.ui.showToast(`✨ ${def.name} — Nhánh: ${BRANCH_LABELS[event.branch]}!`, 3500);
    } else if (event.type === 'stage') {
      this.ui.showToast(`${def.icon} ${def.name} → ${STAGE_NAMES[event.stage]}`, 2500);
    } else if (event.type === 'wither') {
      this.ui.showToast(`⚠️ ${def.name} đang héo — kiểm tra độ ẩm!`, 3000);
    } else if (event.type === 'recover') {
      this.ui.showToast(`💚 ${def.name} đã hồi phục!`, 2500);
    }
  }
}
