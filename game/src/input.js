// input.js — mouse, keyboard and the on-screen buttons, for every screen.
// Clicks are mapped from client pixels to the game's logical 1280x720
// space, so the canvas can be CSS-scaled without breaking hit tests.
import {
  VIEW_W, VIEW_H, PANEL_W, PANEL_H, PANEL_Y, PANEL_LEFT_X, PANEL_RIGHT_X,
} from "./config.js";
import {
  titleButtons, mapButtons, mapStallRects, playButtons,
  pauseButtons, celebrateButtons, endButtons,
} from "./render.js";
import { unlockAudio } from "./audio.js";

function inRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

// Which panel (if any) holds this logical point, and its panel-local coords.
export function panelAt(x, y) {
  if (y >= PANEL_Y && y <= PANEL_Y + PANEL_H) {
    if (x >= PANEL_LEFT_X && x <= PANEL_LEFT_X + PANEL_W) {
      return { panel: "left", x: x - PANEL_LEFT_X, y: y - PANEL_Y };
    }
    if (x >= PANEL_RIGHT_X && x <= PANEL_RIGHT_X + PANEL_W) {
      return { panel: "right", x: x - PANEL_RIGHT_X, y: y - PANEL_Y };
    }
  }
  return null;
}

export function attachInput(canvas, game) {
  function toLogical(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * VIEW_W,
      y: ((e.clientY - rect.top) / rect.height) * VIEW_H,
    };
  }

  function buttonHit(x, y, buttons) {
    for (const b of buttons) if (inRect(x, y, b)) return b.id;
    return null;
  }

  function handleButton(id) {
    switch (id) {
      case "mode-waktu": game.startMode("waktu"); break;
      case "mode-santai": game.startMode("santai"); break;
      case "map": game.showMap(); break;
      case "back-title": game.showTitle(); break;
      case "hint": game.useHint(); break;
      case "magnifier": game.toggleMagnifier(); break;
      case "pause": game.togglePause(); break;
      case "sound": game.toggleMute(); break;
      case "resume": game.togglePause(); break;
      case "restart-scene": game.restartScene(); break;
      case "to-map": game.showMap(); break;
      case "retry-scene": game.restartScene(); break;
      case "next-scene": game.nextScene(); break;
      case "finish": game.finishToEnd(); break;
      case "play-again": game.playAgain(); break;
      default: break;
    }
  }

  canvas.addEventListener("click", (e) => {
    unlockAudio();
    const { x, y } = toLogical(e);
    if (game.screen === "title") {
      const id = buttonHit(x, y, titleButtons());
      if (id) handleButton(id);
      return;
    }
    if (game.screen === "map") {
      const rects = mapStallRects(game.scenes.length);
      for (let i = 0; i < rects.length; i++) {
        if (inRect(x, y, rects[i])) {
          if (i < game.save.unlocked) game.startScene(i);
          return;
        }
      }
      const id = buttonHit(x, y, mapButtons());
      if (id) handleButton(id);
      return;
    }
    if (game.screen === "play") {
      const id = buttonHit(x, y, playButtons());
      if (id) {
        handleButton(id);
        return;
      }
      const p = panelAt(x, y);
      if (p) {
        game.cursorVisible = false;
        game.clickAtPanel(p.panel, p.x, p.y);
      }
      return;
    }
    if (game.screen === "paused") {
      const id = buttonHit(x, y, pauseButtons());
      if (id) handleButton(id);
      return;
    }
    if (game.screen === "celebrate") {
      const id = buttonHit(x, y, celebrateButtons(game.sceneIndex === game.scenes.length - 1, game.failed));
      if (id) handleButton(id);
      return;
    }
    if (game.screen === "end") {
      const id = buttonHit(x, y, endButtons());
      if (id) handleButton(id);
    }
  });

  // Right-click toggles the magnifier during play.
  canvas.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    if (game.screen === "play") game.toggleMagnifier();
  });

  canvas.addEventListener("mousemove", (e) => {
    const { x, y } = toLogical(e);
    const p = panelAt(x, y);
    if (p && game.screen === "play") {
      game.mouseInPanel = { mx: p.x, my: p.y, panel: p.panel };
    } else {
      game.mouseInPanel = null;
    }
  });

  canvas.addEventListener("mouseleave", () => {
    game.mouseInPanel = null;
  });

  window.addEventListener("keydown", (e) => {
    unlockAudio();
    const k = e.key;
    if (k === "ArrowUp" || k === "ArrowDown" || k === "ArrowLeft" || k === "ArrowRight" || k === " ") {
      e.preventDefault();
    }
    if (game.screen === "title") {
      if (k === "Enter") game.startMode("waktu");
      if (k === "m" || k === "M") game.showMap();
      return;
    }
    if (game.screen === "map") {
      const n = parseInt(k, 10);
      if (n >= 1 && n <= game.scenes.length && n <= game.save.unlocked) game.startScene(n - 1);
      if (k === "Escape") game.showTitle();
      return;
    }
    if (game.screen === "play") {
      if (k === "p" || k === "P" || k === "Escape") { game.togglePause(); return; }
      if (k === "h" || k === "H") { game.useHint(); return; }
      if (k === "m" || k === "M") { game.toggleMagnifier(); return; }
      if (k === "ArrowLeft" || k === "ArrowRight" || k === "ArrowUp" || k === "ArrowDown") {
        moveCursor(game, k, e.shiftKey);
        return;
      }
      if (k === "Enter" || k === " ") {
        game.cursorVisible = true;
        game.clickAtPanel(game.cursor.panel, game.cursor.x, game.cursor.y);
      }
      return;
    }
    if (game.screen === "paused") {
      if (k === "p" || k === "P" || k === "Escape" || k === "Enter") game.togglePause();
      return;
    }
    if (game.screen === "celebrate") {
      if ((k === "n" || k === "N") && !game.failed && game.sceneIndex < game.scenes.length - 1) game.nextScene();
      if (k === "Enter") {
        if (game.failed) game.restartScene();
        else if (game.sceneIndex < game.scenes.length - 1) game.nextScene();
        else game.finishToEnd();
      }
      if (k === "Escape") game.showMap();
      return;
    }
    if (game.screen === "end") {
      if (k === "Enter") game.playAgain();
      if (k === "Escape") game.showMap();
    }
  });
}

export function moveCursor(game, key, fine) {
  const step = fine ? 8 : 26;
  game.cursorVisible = true;
  if (key === "ArrowLeft") game.cursor.x -= step;
  if (key === "ArrowRight") game.cursor.x += step;
  if (key === "ArrowUp") game.cursor.y -= step;
  if (key === "ArrowDown") game.cursor.y += step;
  // crossing a panel edge hops to the other panel, same spot
  if (game.cursor.x < 0) {
    game.cursor.x = PANEL_W - 12;
    game.cursor.panel = game.cursor.panel === "left" ? "right" : "left";
  }
  if (game.cursor.x > PANEL_W) {
    game.cursor.x = 12;
    game.cursor.panel = game.cursor.panel === "left" ? "right" : "left";
  }
  game.cursor.y = Math.max(8, Math.min(PANEL_H - 8, game.cursor.y));
}
