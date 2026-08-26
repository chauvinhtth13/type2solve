(function (global) {
  "use strict";

  function byId(id) {
    return document.getElementById(id);
  }

  function ri(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function pick(items) {
    return items[ri(0, items.length - 1)];
  }

  function shuffle(items) {
    for (let index = items.length - 1; index > 0; index -= 1) {
      const swapIndex = ri(0, index);
      [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
    }
    return items;
  }

  function safeSound(name) {
    const sound = global.SFX && global.SFX[name];
    if (typeof sound !== "function") return false;

    try {
      sound();
      return true;
    } catch (_error) {
      return false;
    }
  }

  function safeShowScreen(id) {
    const showScreen = global.showScreen;
    if (typeof showScreen === "function") {
      try {
        showScreen(id);
        return true;
      } catch (_error) {
        return false;
      }
    }
    document.querySelectorAll(".screen").forEach(function (screen) {
      screen.classList.remove("active");
    });
    const screen = byId(id);
    if (screen) screen.classList.add("active");
    return Boolean(screen);
  }

  function setExclusiveSections(prefix, names, visible) {
    const visibleNames = new Set(Array.isArray(visible) ? visible : [visible]);

    names.forEach(function (name) {
      const section = byId(prefix + name);
      if (section) section.hidden = !visibleNames.has(name);
    });
  }

  function reducedMotion() {
    return Boolean(
      typeof global.REDUCED_MOTION === "function"
        ? global.REDUCED_MOTION()
        : global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  function createTimerRegistry() {
    const timers = new Set();

    function later(callback, delay) {
      const timer = global.setTimeout(function () {
        timers.delete(timer);
        callback();
      }, delay);
      timers.add(timer);
      return timer;
    }

    function clear() {
      timers.forEach(function (timer) {
        global.clearTimeout(timer);
      });
      timers.clear();
    }

    return Object.freeze({ timers: timers, later: later, clear: clear });
  }

  global.ri = ri;
  global.pick = pick;
  global.shuffle = shuffle;
  global.$ = byId;
  global.GameRuntime = Object.freeze({
    byId: byId,
    randomInt: ri,
    pick: pick,
    shuffle: shuffle,
    safeSound: safeSound,
    safeShowScreen: safeShowScreen,
    setExclusiveSections: setExclusiveSections,
    reducedMotion: reducedMotion,
    createTimerRegistry: createTimerRegistry,
  });
})(window);
