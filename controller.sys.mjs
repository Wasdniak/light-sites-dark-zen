// This module has no startup side effects. Browser-window scripts acquire it.
export const BACKUP = "sine.light-sites-dark-zen.originals";
const CONTENT = "layout.css.prefers-color-scheme.content-override";
const ZEN_CONTENT = "zen.theme.apply-dark-mode-to-content";

export function createController(prefs) {
  let clients = 0;
  let originals;
  let changing = false;
  const desired = new Map();
  const read = (name, value) => typeof value === "boolean"
    ? prefs.getBoolPref(name) : prefs.getIntPref(name);
  const write = (name, value) => typeof value === "boolean"
    ? prefs.setBoolPref(name, value) : prefs.setIntPref(name, value);
  const enforce = () => {
    if (changing) return;
    changing = true;
    try {
      for (const [name, value] of desired) {
        if (read(name, value) !== value) write(name, value);
      }
    } finally { changing = false; }
  };
  const observer = { observe: enforce };

  return {
    acquire() {
      if (!clients) {
        desired.set(CONTENT, 1);
        // Older/newer Zen builds may not have this extra content override.
        if (prefs.getPrefType(ZEN_CONTENT) === 128) desired.set(ZEN_CONTENT, false);
        for (const name of desired.keys()) {
          if (prefs.prefIsLocked(name)) throw new Error(`Preference is locked: ${name}`);
        }
        const saved = prefs.getStringPref(BACKUP, "");
        if (saved) {
          originals = JSON.parse(saved);
          // Refuse an invalid backup instead of replacing the user's originals.
          if (!Array.isArray(originals) || originals.length !== desired.size ||
              originals.some(item => !desired.has(item.name) ||
                typeof item.hadUserValue !== "boolean" ||
                typeof item.value !== typeof desired.get(item.name)) ||
              new Set(originals.map(item => item.name)).size !== desired.size) {
            throw new Error("Invalid Light Sites backup; preferences were left untouched.");
          }
        } else {
          originals = [...desired].map(([name, value]) => ({
            name, hadUserValue: prefs.prefHasUserValue(name), value: read(name, value),
          }));
          prefs.setStringPref(BACKUP, JSON.stringify(originals));
          prefs.savePrefFile(null);
        }
        enforce();
        for (const name of desired.keys()) prefs.addObserver(name, observer);
      }
      clients++;
      let released = false;
      // restore=false (browser/window closing): keep the light preference and the
      // saved originals, so restored tabs load light on the next startup.
      // restore=true (Sine disable): put the original values back.
      return ({ restore = true } = {}) => {
        if (released) return;
        released = true;
        if (--clients) return;
        for (const name of desired.keys()) prefs.removeObserver(name, observer);
        if (!restore) {
          desired.clear();
          return;
        }
        for (const item of originals) {
          // Do not overwrite a later external change if another mod/policy took over.
          if (read(item.name, desired.get(item.name)) !== desired.get(item.name)) continue;
          if (item.hadUserValue) write(item.name, item.value);
          else prefs.clearUserPref(item.name);
        }
        prefs.clearUserPref(BACKUP);
        prefs.savePrefFile(null);
        desired.clear();
      };
    },
  };
}

// Node can import the factory for tests without Firefox globals.
export const controller = typeof Services === "undefined" ? null : createController(Services.prefs);
