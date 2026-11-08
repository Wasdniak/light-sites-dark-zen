# Light Sites, Dark Zen

> **Personal project.** Built for my own setup (Zen + Sine, dark browser theme). Shared as-is: no support, and it may break when Zen updates. Issues and PRs may not get a response.

A Sine mod that asks websites to use light mode while preserving Zen's existing browser theme. Keep Zen's appearance set to **Dark**.

## Install

This is a JavaScript mod and needs the [Sine](https://github.com/CosmoCreeper/Sine) mod manager.

1. In Zen, open **Settings → Sine Mods**, click the gear (**Open settings**) and turn on **Enable installing JS from unofficial sources**.
2. Under the Marketplace, in the **add your own locally from a GitHub repo** box, enter `Wasdniak/light-sites-dark-zen` and click **Install**.
3. Go to `about:support`, click **Clear startup cache**, and restart Zen.
4. Open [`test-page.html`](test-page.html) from this repo (download it and open the local file). It should report **Light = true**, **Dark = false**, while the browser stays dark. Reload existing websites if needed.

Sine checks this repo for updates on its own (unless auto-updates are off for Sine or for this mod). The mod does not edit prefs.js or user.js.

## What it does

- Sets `layout.css.prefers-color-scheme.content-override` to `1` (light) while enabled. This is Firefox's native website preference, so both CSS media queries and JavaScript `matchMedia` see it.
- If this Zen build defines `zen.theme.apply-dark-mode-to-content`, temporarily sets it to `false` to prevent that separate content override. The inspected installed build did not contain this setting in its JavaScript sources; the guard supports builds that define it.
- Leaves `zen.view.window.scheme`, the selected browser theme, OS appearance, and `ui.systemUsesDarkTheme` unchanged.
- Keeps the content preferences in effect if browser settings try to change them while the mod is enabled. Disable the mod before choosing a different website appearance.
- Uses Sine's unload callbacks, shares ownership across windows, and restores original user values (or clears overrides that were originally unset) when disabled or the last browser window closes. The originals are also saved under `sine.light-sites-dark-zen.originals` for recovery after an interrupted session.

## Limits

This changes the preference websites receive; it cannot guarantee every website will become light. A saved account theme, cookie, local setting, dark-only design, Dark Reader, or a Zen Boost can override it. Choose **System / Automatic / Use device theme** in a site's appearance settings, or explicitly choose Light there. Do not clear all site data as a first step.

Sine loads window scripts during browser startup, so an already-restored page might briefly appear in its previous theme. Reload it after startup. A per-site saved theme can also persist after disabling this mod.

## Disable / remove / recover

Disable the mod in Settings > Sine Mods while a browser window is open. Original website preferences are restored automatically. You can then remove it through Sine. Restart Zen if Sine requests it.

If files were deleted manually while the mod was active or Zen crashed and the mod was then removed, use the Browser Console to restore its saved originals (enable browser chrome debugging only if needed):

```js
const key = 'sine.light-sites-dark-zen.originals';
const items = JSON.parse(Services.prefs.getStringPref(key, '[]'));
for (const item of items) {
  if (!['layout.css.prefers-color-scheme.content-override', 'zen.theme.apply-dark-mode-to-content'].includes(item.name)) continue;
  if (!item.hadUserValue) Services.prefs.clearUserPref(item.name);
  else if (typeof item.value === 'boolean') Services.prefs.setBoolPref(item.name, item.value);
  else Services.prefs.setIntPref(item.name, item.value);
}
Services.prefs.clearUserPref(key);
Services.prefs.savePrefFile(null);
```
## Validation

Built against the Sine loader/unload interfaces inspected in the installed profile on October 24, 2026. Automated tests covered preference enforcement, preservation of browser theme, multiple windows, restoration of unset/explicit preferences, crash recovery, and locked settings (the tests aren't included in this repo). **Live browsing/visual behavior has not been tested.**

## References

- Mozilla: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/browserSettings/overrideContentColorScheme
- Zen report about the separate content override: https://github.com/zen-browser/desktop/issues/14073

For this effect alone, manually setting `layout.css.prefers-color-scheme.content-override` to `1` in about:config may already be sufficient. This mod adds enforcement and automatic restoration in Sine.

## Releasing an update

Sine only installs an update when `updatedAt` in `theme.json` is newer than the installed copy's. For every release, bump `version`, set `updatedAt` to the current UTC time, then commit and push to `main`.

## License

MIT, see [LICENSE](LICENSE).
