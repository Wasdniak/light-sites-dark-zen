(() => {
  const { controller } = ChromeUtils.importESModule(
    "chrome://sine/content/light-sites-dark-zen/controller.sys.mjs"
  );
  const release = controller.acquire();
  const onWindowUnload = () => release({ restore: false });
  // Sine disable: restore the user's original website appearance.
  window.addUnloadListener(() => {
    window.removeEventListener("unload", onWindowUnload);
    release({ restore: true });
  }, "chrome://sine/content/light-sites-dark-zen/light-sites.uc.js");
  // Window/browser close: keep light mode in place for the next startup.
  window.addEventListener("unload", onWindowUnload, { once: true });
})();
