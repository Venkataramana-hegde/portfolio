import { SETTINGS_STORAGE_KEY, settingDefs } from "@/content/settings";
import { INSTALLED_STORAGE_KEY, THEME_STORAGE_KEY, defaultThemeId, preinstalledIds, themeCssText, themes } from "@/content/themes";

/* Applies the visitor's theme and settings before the first paint, so someone
   who installed Gruvbox at 1.0625rem does not see a flash of default navy on
   every navigation. This has to be a blocking inline script in <head>: anything
   deferred paints the defaults first.

   The CSP allows it via 'unsafe-inline' (see next.config.ts) — a nonce would
   force every request to render dynamically and the site must stay static.

   Everything here is serialised from the registries at build time, so the
   bootstrap cannot drift from themes.ts or settings.ts. Defaults are omitted
   where globals.css already holds them as literal values, which is what the
   prerendered HTML is styled with. */

const themeCss = Object.fromEntries(
  themes.filter((t) => t.id !== defaultThemeId).map((t) => [t.id, themeCssText(t)]),
);

const appearances = Object.fromEntries(themes.map((t) => [t.id, t.appearance]));

/** The minimum each setting needs to be applied without shipping the whole schema. */
const settingPlan = settingDefs.map((d) =>
  d.kind === "number"
    ? { k: d.key, t: "n", v: d.cssVar, u: d.unit, lo: d.min, hi: d.max }
    : d.kind === "boolean"
      ? { k: d.key, t: "b", a: d.attr }
      : { k: d.key, t: "e", a: d.attr, o: d.options },
);

const defaults = Object.fromEntries(settingDefs.map((d) => [d.key, d.default]));

const json = (value: unknown) => JSON.stringify(value).replace(/</g, "\\u003c");

const script = `
(function(){
  var root = document.documentElement;

  try {
    var css = ${json(themeCss)}, look = ${json(appearances)};
    var installed = ${json(preinstalledIds)};
    var raw = localStorage.getItem(${json(INSTALLED_STORAGE_KEY)});
    if (raw) {
      var list = JSON.parse(raw);
      if (Array.isArray(list)) {
        for (var i = 0; i < list.length; i++) {
          if (look[list[i]] && installed.indexOf(list[i]) < 0) installed = installed.concat(list[i]);
        }
      }
    }
    var id = localStorage.getItem(${json(THEME_STORAGE_KEY)});
    if (!id || !look[id] || installed.indexOf(id) < 0) id = ${json(defaultThemeId)};
    root.dataset.theme = id;
    root.dataset.appearance = look[id];
    root.style.colorScheme = look[id];
    if (css[id]) root.style.cssText += ";" + css[id];
  } catch (e) {
    /* Blocked site data just means the committed default, already applied. */
  }

  try {
    var plan = ${json(settingPlan)}, values = ${json(defaults)};
    var stored = localStorage.getItem(${json(SETTINGS_STORAGE_KEY)});
    if (stored) {
      var parsed = JSON.parse(stored);
      if (parsed && typeof parsed === "object") {
        for (var j = 0; j < plan.length; j++) {
          var p = plan[j], got = parsed[p.k];
          if (p.t === "n" && typeof got === "number" && isFinite(got)) {
            values[p.k] = Math.min(p.hi, Math.max(p.lo, got));
          } else if (p.t === "b" && typeof got === "boolean") {
            values[p.k] = got;
          } else if (p.t === "e" && p.o.indexOf(got) > -1) {
            values[p.k] = got;
          }
        }
      }
    }
    // Dataset keys are camelCase: data-line-numbers is dataset.lineNumbers.
    var camel = function (s) { return s.replace(/-([a-z])/g, function (m, c) { return c.toUpperCase(); }); };
    for (var n = 0; n < plan.length; n++) {
      var def = plan[n], val = values[def.k];
      if (def.t === "n") root.style.setProperty(def.v, val + def.u);
      else root.dataset[camel(def.a)] = def.t === "b" ? (val ? "on" : "off") : val;
    }
  } catch (e) {
    /* Same: the defaults in globals.css stand. */
  }
})();
`.trim();

export function Bootstrap() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
