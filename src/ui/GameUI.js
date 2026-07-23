import { BRANCH_LABELS, STAGE_NAMES } from '../game/constants.js';
import { getBranchScores, getPlantDef, SUCCULENT } from '../data/plants.js';

export class GameUI {
  constructor(root, game) {
    this.root = root;
    this.game = game;
    this.panel = null;
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
      if (!btn) return;
      const action = btn.dataset.action;
      this.handleAction(action);
    });
  }

  handleAction(action) {
    const g = this.game;
    switch (action) {
      case 'water':
        g.doWater();
        break;
      case 'mist':
        g.doMist();
        break;
      case 'rotate':
        g.doRotate();
        break;
      case 'fertilize':
        g.doFertilize();
        break;
      case 'prune':
        g.doPrune();
        break;
      case 'plant':
        g.doPlant();
        break;
      case 'dex':
        this.showDex();
        break;
      case 'settings':
        this.showSettings();
        break;
      default:
        break;
    }
  }

  showPanel(title, html) {
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
  }

  showPlantDetail(plant) {
    const def = getPlantDef(plant.speciesId);
    const stageName = STAGE_NAMES[plant.stage] ?? plant.stage;
    const progress = plant.stage >= 8 ? 100 : Math.round((plant.stageProgress / plant.stageDuration) * 100);
    const care = plant.care.snapshot();
    const scores = getBranchScores(plant.speciesId, care).sort((a, b) => b.score - a.score);

    let branchHtml = '';
    if (plant.branch) {
      branchHtml = `<p class="branch-locked">Nhánh: <strong>${BRANCH_LABELS[plant.branch]}</strong></p>`;
    } else if (plant.isBranchingWindow || plant.stage === 6) {
      branchHtml = `
        <p class="hint">Đang định hình nhánh...</p>
        <div class="branch-bars">
          ${scores.map((s, i) => `
            <div class="branch-row">
              <span>${s.label}</span>
              <div class="bar-track"><div class="bar-fill" style="width:${Math.min(100, s.score / (scores[0].score || 1) * 100)}%"></div></div>
            </div>
          `).join('')}
        </div>
        <p class="hint-sm">${scores[0]?.hint ?? ''}</p>
      `;
    }

    this.showPanel(def.name, `
      <div class="plant-detail">
        <p><strong>${stageName}</strong> — Giai đoạn ${plant.stage}/8</p>
        <div class="progress-track"><div class="progress-fill" style="width:${progress}%"></div></div>
        ${branchHtml}
        <p class="desc">${def.description}</p>
        <div class="care-stats">
          <span>💧 ${Math.round(care.humid)}</span>
          <span>☀️ ${Math.round(care.radiant)}</span>
        </div>
      </div>
    `);
  }

  showDex() {
    const t = this.game.terrarium;
    const def = SUCCULENT;
    const stages = [];
    for (let i = 1; i <= 8; i += 1) {
      const key = `succulent-${i}`;
      const found = t.discoveredStages.has(key);
      stages.push(`<div class="dex-slot ${found ? 'found' : ''}" title="${STAGE_NAMES[i]}">${found ? i : '?'}</div>`);
    }

    const branches = def.branches.map((b) => {
      const key = `succulent-${b.id}`;
      const found = t.discoveredBranches.has(key);
      return `<div class="dex-branch ${found ? 'found' : ''}"><span>${found ? b.label : '???'}</span><small>${b.hint}</small></div>`;
    });

    this.showPanel('Plant Dex', `
      <div class="dex">
        <h3>${def.name}</h3>
        <p class="dex-label">Giai đoạn</p>
        <div class="dex-grid">${stages.join('')}</div>
        <p class="dex-label">Nhánh sinh trưởng</p>
        <div class="dex-branches">${branches.join('')}</div>
      </div>
    `);
  }

  showSettings() {
    this.showPanel('Cài đặt', `
      <div class="settings">
        <button class="setting-btn" id="export-save">📤 Xuất save</button>
        <button class="setting-btn" id="import-save">📥 Nhập save</button>
        <input type="file" id="import-file" accept=".json" hidden />
        <button class="setting-btn danger" id="reset-save">🗑️ Xóa & bắt đầu lại</button>
        <p class="hint-sm">Game tự lưu trên thiết bị này.</p>
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

  update() {
    // reserved for dynamic HUD updates
  }
}
