/** Peaceful palette — warm cream, sage, soft sky */
export const COLORS = {
  skyTop: '#c5dff0',
  skyMid: '#dceef5',
  skyHorizon: '#f5ebe0',
  skyGlow: '#fdebd3',
  skyNightTop: '#2e2640',
  skyNightMid: '#3d3558',
  skyNightHorizon: '#5c4f72',
  hillFar: '#b8cdb8',
  hillNear: '#9bb89b',
  cloud: '#f0f7fa',
  cloudShadow: '#d4e8ef',
  glass: '#e8f5f0',
  glassHi: '#fafcf9',
  glassLo: '#c8ddd4',
  glassTint: '#d4ede1',
  wood: '#c9a87c',
  woodHi: '#dbc4a0',
  woodLo: '#a68962',
  woodShadow: '#8b7355',
  soil: '#9a8268',
  soilDark: '#7d684f',
  soilLight: '#b09a7e',
  soilPebb: '#c4b09a',
  moss: '#8aab8a',
  leafDark: '#5a8a6a',
  leaf: '#6fa080',
  leafMid: '#85b595',
  leafBright: '#9ec9ab',
  leafYoung: '#b5d9be',
  leafPale: '#d0ead4',
  water: '#8ecae6',
  waterLight: '#b8dff0',
  waterPale: '#d4eef8',
  sun: '#fde68a',
  sunCore: '#fef3c7',
  sunRay: '#fcd34d',
  moon: '#e2e8f0',
  moonHi: '#f8fafc',
  moonCrater: '#cbd5e1',
  star: '#fef9c3',
  firefly: '#d9f99d',
  pollen: '#fef08a',
  text: '#4a5d4a',
  textDim: '#7a917a',
  textLight: '#faf6f0',
  accent: '#d4a574',
  accentSoft: '#e8c9a8',
  bloom: '#e8a0b4',
  flower: '#fde68a',
  seed: '#8b6914',
  seedHi: '#a68932',
  succulentBlue: '#94a8b8',
  succulentBlueHi: '#b8c8d4',
  succulentBlueLo: '#788898',
  fernStem: '#5a8a6a',
  danger: '#d4a090',
  dangerSoft: '#f5e6e0',
  hudBg: 'rgba(250, 246, 240, 0.88)',
  hudBorder: '#c8ddd4',
  outline: '#5a7060',
  sparkle: '#b8dff0',
};

export const GAME_W = 1152;
export const GAME_H = 648;

export const STAGE_NAMES = {
  1: 'Ngủ',
  2: 'Thức',
  3: 'Mầm',
  4: 'Non',
  5: 'Phát triển',
  6: 'Định hình',
  7: 'Trưởng thành',
  8: 'Hoàn thiện',
};

export const BRANCH_LABELS = {
  rosette: 'Đồng minh',
  desert: 'Sa mạc',
  garden: 'Vườn',
  canopy: 'Rừng',
  cascade: 'Thác',
  column: 'Cột',
};

export const START_SEEDS = 3;
export const HARVEST_SEEDS = 2;
export const MAX_PLANTS = 4;
export const PLANT_SLOTS = [0.3, 0.45, 0.6, 0.75];

export const STAGE_DURATIONS = {
  1: 20,
  2: 25,
  3: 35,
  4: 45,
  5: 60,
  6: 75,
  7: 90,
  8: -1,
};

export const BRANCH_WINDOW_STAGES = [4, 5, 6];
