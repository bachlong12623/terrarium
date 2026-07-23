import { BRANCH_LABELS, STAGE_NAMES, MAX_PLANTS } from '../game/constants.js';
import { getBranchScores, getPlantDef, PLANTS } from '../data/plants.js';

export class GameUI {
  constructor(root, game) {
    this.root = root;
    this.game = game;
    this.panel = null;
    this.detailPlant = null;
    this.render();
    this.bind();
  }

  render() {
    this.root.innerHTML = `
      <div class="hud-top">
        <h1 class="title">TERRARIUM</h1>
      </div>
      <div class="action-bar" role="toolbar" aria-label="Chăm sóc cây">
        <button class="action-btn" data-action="water" title="Tưới nước">💧<span>Tưới</span></button>
        <button class="action-btn" data-action="mist" title="Phun sương">🌫️<span>Sương</span></button>
        <button class="action-btn" data-action="rotate" title="Xoay bình">🔄<span>Xoay</span></button>
        <button class="action-btn" data-action="fertilize" title="Bón phân">🌿<span>Bón</span></button>
        <button class="action-btn" data-action="prune" title="Cắt tỉa">✂️<span>Tỉa</span></button>
        <button class="action-btn" data-action="plant" title="Trồng hạt">🌱<span>Trồng</span></button>
        <button class="action-btn" data-action="dex" title="Sổ cây">📖<span>Dex</span></button>
        <button class="action-btn" data-action="settings" title="Cài đặt">⚙️</button>
      </div>
      <div id="panel" class="panel hidden" aria-live="polite"></div>
      <div id="toast-ui" class="toast-ui hidden"></div>
    `;
    this.panel = this.root.querySelector('#panel');
    this.toastEl = this.root.querySelector('#toast-ui');
  }

  bind() {
    this.root.querySelector('.action-bar').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn || btn.disabled) return;
      this.handleAction(btn.dataset.action);
    });
  }

  handleAction(action) {
    const g = this.game;
    switch (action) {
      case 'water': g.doWater(); break;
      case 'mist': g.doMist(); break;
      case 'rotate': g.doRotate(); break;
      case 'fertilize': g.doFertilize(); break;
      case 'prune': g.doPrune(); break;
      case 'plant': this.showPlantPicker(); break;
      case 'dex': this.showDex(); break;
      case 'settings': this.showSettings(); break;
      default: break;
    }
  }

  startCooldown(action, seconds) {
    const btn = this.root.querySelector(`[data-action="${action}"]`);
    if (!btn) return;
    btn.disabled = true;
    btn.classList.add('cooling');
    btn.style.setProperty('--cd', `${seconds}s`);
    setTimeout(() => {
      btn.disabled = false;
      btn.classList.remove('cooling');
    }, seconds * 1000);
  }

  showPanel(title, html) {
    this.detailPlant = null;
    this.panel.innerHTML = `
      <div class="panel-header">
        <h2>${title}</h2>
        <button class="panel-close" aria-label="Đóng">✕</button>
      </div>
      <div class="panel-body">${html}</div>
    `;
    this.panel.classList.remove('hidden');
    this.panel.querySelector('.panel-close').onclick = () => this.hidePanel();
  }

  hidePanel() {
    this.panel.classList.add('hidden');
    this.detailPlant = null;
    this.game.selectedPlant = null;
  }

  /* ---------- plant detail (live-updating) ---------- */

  showPlantDetail(plant) {
    const def = getPlantDef(plant.speciesId);

    this.showPanel(`${def.icon} ${def.name}`, `
      <div class="plant-detail">
        <p><strong data-live="stage"></strong> — <span data-live="stagenum"></span></p>
        <div class="progress-track"><div class="progress-fill" data-live="progress"></div></div>
        <div data-live="status"></div>
        <div data-live="branch"></div>
        <p class="desc">${def.description}</p>
        <div class="care-stats">
          <span data-live="humid"></span>
          <span data-live="radiant"></span>
        </div>
        <div data-live="actions"></div>
      </div>
    `);

    this.detailPlant = plant;
    this.updatePlantDetail();
  }

  updatePlantDetail() {
    const plant = this.detailPlant;
    if (!plant || this.panel.classList.contains('hidden')) return;

    if (!this.game.terrarium.plants.includes(plant)) {
      this.hidePanel();
      return;
    }

    const q = (sel) => this.panel.querySelector(`[data-live="${sel}"]`);
    const stageName = STAGE_NAMES[plant.stage] ?? plant.stage;
    const progress = plant.stage >= 8 ? 100 : Math.round((plant.stageProgress / plant.stageDuration) * 100);
    const care = plant.care.snapshot();

    q('stage').textContent = stageName;
    q('stagenum').textContent = `Giai đoạn ${plant.stage}/8`;
    q('progress').style.width = `${progress}%`;
    q('humid').textContent = `💧 Ẩm tích lũy: ${Math.round(care.humid)}`;
    q('radiant').textContent = `☀️ Sáng tích lũy: ${Math.round(care.radiant)}`;

    const status = q('status');
    if (plant.withered) {
      status.innerHTML = '<p class="status-bad">⚠️ Cây đang héo — cân bằng độ ẩm để hồi phục!</p>';
    } else {
      status.innerHTML = '';
    }

    const branchEl = q('branch');
    if (plant.branch) {
      branchEl.innerHTML = `<p class="branch-locked">Nhánh: <strong>${BRANCH_LABELS[plant.branch]}</strong></p>`;
    } else if (plant.isBranchingWindow || plant.stage === 6) {
      const scores = getBranchScores(plant.speciesId, care).sort((a, b) => b.score - a.score);
      const max = scores[0]?.score || 1;
      branchEl.innerHTML = `
        <p class="hint">Đang định hình nhánh...</p>
        <div class="branch-bars">
          ${scores.map((s) => `
            <div class="branch-row">
              <span>${s.label}</span>
              <div class="bar-track"><div class="bar-fill" style="width:${Math.min(100, (s.score / max) * 100)}%"></div></div>
            </div>
          `).join('')}
        </div>
        <p class="hint-sm">💡 ${scores[0]?.hint ?? ''}</p>
      `;
    } else {
      branchEl.innerHTML = '';
    }

    const actionsEl = q('actions');
    if (plant.isHarvestable && !actionsEl.querySelector('.harvest-btn')) {
      actionsEl.innerHTML = '<button class="setting-btn harvest-btn">🌾 Thu hoạch (+2 hạt)</button>';
      actionsEl.querySelector('.harvest-btn').onclick = () => {
        this.game.doHarvest(plant);
        this.hidePanel();
      };
    } else if (!plant.isHarvestable) {
      actionsEl.innerHTML = '';
    }
  }

  /* ---------- species picker ---------- */

  showPlantPicker() {
    const t = this.game.terrarium;
    if (t.plants.length >= MAX_PLANTS) {
      this.showToast('Bình đã đầy — thu hoạch cây trưởng thành để lấy chỗ');
      return;
    }
    if (t.seeds <= 0) {
      this.showToast('Hết hạt giống — thu hoạch cây ở giai đoạn Hoàn thiện');
      return;
    }

    const cards = Object.values(PLANTS).map((def) => `
      <button class="species-card" data-species="${def.id}">
        <span class="species-icon">${def.icon}</span>
        <span class="species-name">${def.name}</span>
        <small>${def.description}</small>
        <em>${def.branches.map((b) => b.label).join(' · ')}</em>
      </button>
    `).join('');

    this.showPanel(`🌱 Trồng hạt (còn ${t.seeds})`, `<div class="species-list">${cards}</div>`);

    this.panel.querySelectorAll('.species-card').forEach((card) => {
      card.onclick = () => {
        this.game.plantSpecies(card.dataset.species);
        this.hidePanel();
      };
    });
  }

  /* ---------- dex ---------- */

  showDex() {
    const t = this.game.terrarium;

    const sections = Object.values(PLANTS).map((def) => {
      const stages = [];
      for (let i = 1; i <= 8; i += 1) {
        const found = t.discoveredStages.has(`${def.id}-${i}`);
        stages.push(`<div class="dex-slot ${found ? 'found' : ''}" title="${STAGE_NAMES[i]}">${found ? i : '?'}</div>`);
      }

      const branches = def.branches.map((b) => {
        const found = t.discoveredBranches.has(`${def.id}-${b.id}`);
        return `<div class="dex-branch ${found ? 'found' : ''}"><span>${found ? b.label : '???'}</span><small>${b.hint}</small></div>`;
      });

      const total = 8 + def.branches.length;
      const foundCount =
        [...Array(8)].filter((_, i) => t.discoveredStages.has(`${def.id}-${i + 1}`)).length +
        def.branches.filter((b) => t.discoveredBranches.has(`${def.id}-${b.id}`)).length;

      return `
        <div class="dex-species">
          <h3>${def.icon} ${def.name} <small>${foundCount}/${total}</small></h3>
          <p class="dex-label">Giai đoạn</p>
          <div class="dex-grid">${stages.join('')}</div>
          <p class="dex-label">Nhánh sinh trưởng</p>
          <div class="dex-branches">${branches.join('')}</div>
        </div>
      `;
    }).join('<hr class="dex-divider" />');

    this.showPanel('📖 Plant Dex', `
      <div class="dex">
        <p class="dex-summary">Đã thu hoạch: ${t.harvestCount} cây</p>
        ${sections}
      </div>
    `);
  }

  /* ---------- settings ---------- */

  showSettings() {
    this.showPanel('⚙️ Cài đặt', `
      <div class="settings">
        <button class="setting-btn" id="export-save">📤 Xuất save</button>
        <button class="setting-btn" id="import-save">📥 Nhập save</button>
        <input type="file" id="import-file" accept=".json" hidden />
        <button class="setting-btn danger" id="reset-save">🗑️ Xóa & bắt đầu lại</button>
        <p class="hint-sm">Game tự lưu trên thiết bị này. Xuất file để chuyển sang thiết bị khác.</p>
      </div>
    `);

    this.panel.querySelector('#export-save').onclick = () => this.game.exportSave();
    this.panel.querySelector('#import-save').onclick = () => this.panel.querySelector('#import-file').click();
    this.panel.querySelector('#import-file').onchange = async (e) => {
      const file = e.target.files?.[0];
      if (file) await this.game.importSave(file);
    };
    this.panel.querySelector('#reset-save').onclick = () => {
      if (confirm('Xóa toàn bộ tiến trình?')) this.game.reset();
    };
  }

  showToast(message, duration = 2500) {
    this.toastEl.textContent = message;
    this.toastEl.classList.remove('hidden');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastEl.classList.add('hidden');
    }, duration);
  }
}
