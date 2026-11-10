/*
 * MindGuide AI translation engine (shared by the website and the web app).
 * Shows the page in English, Nigerian Pidgin, Yoruba, Igbo or Hausa by swapping visible text
 * using a dictionary (one JSON file per language: { "English text": "Translation" }).
 * Text it doesn't know stays in English. Content inside [data-no-translate] is never changed.
 */
(function () {
  if (window.MGi18n) return;
  var LANGS = [["en", "English"], ["pcm", "Pidgin"], ["yo", "Yorùbá"], ["ig", "Igbo"], ["ha", "Hausa"]];
  var CODES = LANGS.map(function (l) { return l[0]; });
  var KEY = "mg-lang";
  var BASE = window.MG_I18N_BASE || "/i18n/";
  var SKIP = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, CODE: 1, PRE: 1, TEXTAREA: 1, svg: 1, SVG: 1 };
  var ATTRS = ["placeholder", "aria-label", "title", "alt"];
  var lang = "en", dict = null, pattern = null, cache = {}, observer = null;
  var texts = new Set(); // translated text nodes
  var tState = new WeakMap(); // node -> { en, tr }
  var aState = new WeakMap(); // element -> { attr: { en, tr } }
  var titleState = null;

  function read() {
    try {
      var q = new URLSearchParams(location.search).get("lang");
      if (q && CODES.indexOf(q) >= 0) { localStorage.setItem(KEY, q); return q; }
      var s = localStorage.getItem(KEY);
      if (s && CODES.indexOf(s) >= 0) return s;
    } catch (e) {}
    return "en";
  }

  function digits(s) {
    var nums = [];
    var k = s.replace(/\d+(?:[.,]\d+)*/g, function (m) { nums.push(m); return "{n}"; });
    return [k, nums];
  }

  function build(raw) {
    dict = new Map();
    pattern = new Map();
    Object.keys(raw).forEach(function (en) {
      var tr = raw[en];
      if (!tr) return;
      dict.set(en, tr);
      if (/\d/.test(en)) {
        var a = digits(en), b = digits(tr);
        if (a[1].length === b[1].length && a[1].join() === b[1].join()) pattern.set(a[0], b[0]);
      }
    });
  }

  function lookup(s) {
    var t = s.replace(/\s+/g, " ").trim();
    if (!t || !/[A-Za-z]/.test(t)) return null;
    var v = dict.get(t);
    if (!v && /\d/.test(t)) {
      var d = digits(t), p = pattern.get(d[0]);
      if (p) { var i = 0; v = p.replace(/\{n\}/g, function () { return d[1][i++]; }); }
    }
    if (!v) {
      var cut = t.lastIndexOf(" · ");
      if (cut > 0) { var head = lookup(t.slice(0, cut)); if (head) v = head + t.slice(cut); }
    }
    if (!v) return null;
    var lead = s.match(/^\s*/)[0], trail = s.match(/\s*$/)[0];
    return lead + v + trail;
  }

  function skipped(el) {
    for (var p = el; p; p = p.parentElement) {
      if (SKIP[p.tagName] || (p.hasAttribute && (p.hasAttribute("data-no-translate") || p.isContentEditable))) return true;
    }
    return false;
  }

  function doText(n) {
    if (!dict || !n.parentElement || skipped(n.parentElement)) return;
    var cur = n.nodeValue, st = tState.get(n);
    if (st && cur === st.tr) return;
    var tr = lookup(cur);
    if (tr && tr !== cur) { tState.set(n, { en: cur, tr: tr }); texts.add(n); n.nodeValue = tr; }
  }

  function doAttrs(el) {
    if (!dict || skipped(el)) return;
    var st = aState.get(el) || {};
    ATTRS.forEach(function (a) {
      var cur = el.getAttribute(a);
      if (!cur || (st[a] && st[a].tr === cur)) return;
      var tr = lookup(cur);
      if (tr && tr !== cur) { st[a] = { en: cur, tr: tr }; el.setAttribute(a, tr); }
    });
    aState.set(el, st);
  }

  function walk(root) {
    if (root.nodeType === 3) return doText(root);
    if (root.nodeType !== 1 || SKIP[root.tagName]) return;
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), n;
    while ((n = w.nextNode())) doText(n);
    if (root.matches && root.matches("[placeholder],[aria-label],[title],[alt]")) doAttrs(root);
    if (root.querySelectorAll) root.querySelectorAll("[placeholder],[aria-label],[title],[alt]").forEach(doAttrs);
  }

  function doTitle() {
    var cur = document.title;
    if (titleState && cur === titleState.tr) return;
    var tr = lookup(cur);
    if (tr) { titleState = { en: cur, tr: tr }; document.title = tr; }
  }

  function observe() {
    if (observer) return;
    observer = new MutationObserver(function (list) {
      list.forEach(function (m) {
        if (m.type === "characterData") doText(m.target);
        else if (m.type === "attributes") doAttrs(m.target);
        else m.addedNodes.forEach(walk);
      });
      doTitle();
    });
    observer.observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }

  function restore() {
    if (observer) { observer.disconnect(); observer = null; }
    texts.forEach(function (n) { var st = tState.get(n); if (st && n.nodeValue === st.tr) n.nodeValue = st.en; tState.delete(n); });
    texts.clear();
    document.querySelectorAll("[placeholder],[aria-label],[title],[alt]").forEach(function (el) {
      var st = aState.get(el);
      if (!st) return;
      Object.keys(st).forEach(function (a) { if (el.getAttribute(a) === st[a].tr) el.setAttribute(a, st[a].en); });
      aState.delete(el);
    });
    if (titleState && document.title === titleState.tr) document.title = titleState.en;
    titleState = null;
    dict = null;
  }

  function linkApp() {
    var app = window.MG_APP_URL;
    if (!app) return;
    document.querySelectorAll('a[href^="' + app + '"]').forEach(function (a) {
      try {
        var u = new URL(a.href);
        if (lang === "en") u.searchParams.delete("lang"); else u.searchParams.set("lang", lang);
        a.href = u.toString();
      } catch (e) {}
    });
  }

  var enabled = window.MG_I18N_ENABLED !== false;

  function apply(code) {
    restore();
    lang = code;
    if (!enabled) code = "en";
    document.documentElement.lang = code === "pcm" ? "pcm" : code;
    document.documentElement.setAttribute("data-lang", code);
    linkApp();
    window.dispatchEvent(new CustomEvent("mg-lang", { detail: code }));
    if (code === "en") return Promise.resolve();
    var p = cache[code] || (cache[code] = fetch(BASE + code + ".json", { cache: "force-cache" }).then(function (r) { if (!r.ok) throw new Error("missing"); return r.json(); }));
    return p.then(function (raw) {
      if (lang !== code) return;
      build(raw);
      walk(document.body);
      doTitle();
      observe();
    }).catch(function () { delete cache[code]; });
  }

  window.MGi18n = {
    languages: LANGS,
    current: function () { return lang; },
    /* Staff screens (therapist, admin) stay in English: the app turns translation off there. */
    enable: function (on) {
      if (enabled === !!on) return;
      enabled = !!on;
      apply(lang);
    },
    set: function (code) {
      if (CODES.indexOf(code) < 0) return;
      try { localStorage.setItem(KEY, code); } catch (e) {}
      try { document.cookie = KEY + "=" + code + ";path=/;max-age=31536000;samesite=lax"; } catch (e) {}
      return apply(code);
    },
  };

  var start = read();
  lang = start;
  // English needs no work at start, so the page is left exactly as the server sent it.
  function boot() { if (start !== "en") apply(start); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
