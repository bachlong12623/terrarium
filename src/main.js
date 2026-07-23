import { Game } from './game/Game.js';

const canvas = document.getElementById('game');
const uiRoot = document.getElementById('ui-root');

const game = new Game(canvas, uiRoot);
game.start();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {});
  });
}
