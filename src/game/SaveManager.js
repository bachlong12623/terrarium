const SAVE_KEY = 'terrarium-save-v1';

export class SaveManager {
  static save(state) {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        ...state,
        savedAt: Date.now(),
      }));
      return true;
    } catch {
      return false;
    }
  }

  static load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  static exportSave(state) {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `terrarium-save-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  static async importSave(file) {
    const text = await file.text();
    return JSON.parse(text);
  }

  static clear() {
    localStorage.removeItem(SAVE_KEY);
  }
}
