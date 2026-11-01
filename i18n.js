/* i18n.js: English mode. nav.js loads this file and i18n-en.js only when the person chooses EN.
   It changes text on screen. It never changes form values or what the system sends to the back end.
   A string with no translation stays in Thai. Prices keep Thai baht, with an estimate in US dollars. */
(function () {
  "use strict";
  var D = window.I18N_EN || {}, RULES = window.I18N_RULES || [], S = window.SITE || {}, map = {};
  var THAI = /[฀-฾เ-๿]/; /* not the baht sign U+0E3F */
  function norm(s) { return String(s).replace(/\s+/g, " ").trim(); }
  Object.keys(D).forEach(function (k) { map[norm(k)] = D[k]; });
  /* product names and texts already have English in data.js */
  [["sheets", "title", "titleEn"], ["sheets", "sum", "sumEn"], ["bundles", "title", "titleEn"], ["bundles", "text", "textEn"], ["bundles", "who", "whoEn"]].forEach(function (r) {
    (Array.isArray(S[r[0]]) ? S[r[0]] : []).forEach(function (x) { if (x[r[1]] && x[r[2]]) map[norm(x[r[1]])] = x[r[2]]; });
  });
  (Array.isArray(S.botfaq) ? S.botfaq : []).forEach(function (x) { if (x.q && x.qEn) map[norm(x.q)] = x.qEn; if (x.a && x.aEn) map[norm(x.a)] = x.aEn; });
  var phrases = Object.keys(map).filter(function (k) { return k.length >= 6; }).sort(function (a, b) { return b.length - a.length; });
  var rate = S.pay && +S.pay.usdRate; /* baht to US dollar, set by the owner in the back office, estimate only */
  function usd(baht) { var v = baht * rate; return v >= 10 ? Math.round(v) : Math.round(v * 100) / 100; }
  /* Languages other than Thai and English (1 Nov 2026): Thai -> English -> core word list. A word that is not on the list stays in English. */
  var LANG = "en", CORE = {}, NOTE = "";
  try { LANG = localStorage.getItem("build_lang") || "en"; } catch (e) {}
  (function () { var L = (window.I18N_CORE || {})[LANG], K = window.I18N_KEYS || []; if (!L) { LANG = "en"; return; } L.split("|").forEach(function (w, i) { if (K[i] === "NOTE") NOTE = w; else if (K[i]) CORE[K[i]] = w; }); })();
  /* Full dictionary English -> this language, built by the back end (i18nBuildAll) and fetched once a day. Kept in this browser only. */
  var FULL = {};
  (function () { if (LANG === "en") return; try { var raw = localStorage.getItem("build_i18n_" + LANG); if (raw) { var j = JSON.parse(raw); if (j && j.map) FULL = j.map; } } catch (e) {} })();
  function fetchFull() {
    var api = S.member && S.member.api; if (!api || LANG === "en") return;
    var at = 0; try { var raw = localStorage.getItem("build_i18n_" + LANG); if (raw) at = +((JSON.parse(raw) || {}).at || 0); } catch (e) {}
    if (at && Date.now() - at < 864e5) return;
    fetch(api + "?action=i18n&lang=" + encodeURIComponent(LANG), { redirect: "follow" }).then(function (r) { return r.json(); }).then(function (j) {
      if (!j || !j.ok || !j.map) return;
      try { localStorage.setItem("build_i18n_" + LANG, JSON.stringify({ at: Date.now(), built: j.built, map: j.map })); } catch (e) {}
      FULL = j.map; walk(document.body); doNav();
    }).catch(function () {});
  }
  function tr(raw) {
    var en = trEn(raw);
    if (LANG === "en") return en;
    var t = en === null ? norm(raw) : norm(en), c = FULL[t] || CORE[t];
    return c && c !== t ? c : en; /* a word that does not change returns null, so the observer does not loop */
  }
  function trEn(raw) {
    var t = norm(raw);
    if (!t) return null;
    var price = /^฿([\d,]+)$/.exec(t);
    if (price && rate) { var b = +price[1].replace(/,/g, ""); return b ? t + " (≈ US$" + usd(b) + ")" : null; }
    if (!THAI.test(t)) return null;
    if (map[t]) return map[t];
    if (t.length > 260) return null;
    var r = t;
    for (var i = 0; i < phrases.length && THAI.test(r); i++) { if (r.indexOf(phrases[i]) >= 0) r = r.split(phrases[i]).join(map[phrases[i]]); }
    for (var j = 0; j < RULES.length && THAI.test(r); j++) r = r.replace(RULES[j][0], RULES[j][1]);
    return THAI.test(r) ? null : r;
  }
  var SKIP = /^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA|CODE)$/;
  function doText(n) {
    var e = n.parentElement; if (!e || SKIP.test(e.tagName) || e.closest("[data-noi18n]")) return;
    var v = tr(n.nodeValue); if (v === null) return;
    var lead = /^\s/.test(n.nodeValue) ? " " : "", tail = /\s$/.test(n.nodeValue) ? " " : "", nv = lead + v + tail;
    if (nv !== n.nodeValue) n.nodeValue = nv;
  }
  function doAttrs(el) {
    if (el.closest("[data-noi18n]")) return;
    ["placeholder", "aria-label", "title", "alt"].forEach(function (a) { if (el.hasAttribute(a)) { var v = tr(el.getAttribute(a)); if (v !== null && v !== el.getAttribute(a)) el.setAttribute(a, v); } });
    if (el.tagName === "INPUT" && /^(submit|button)$/.test(el.type) && el.value) { var w = tr(el.value); if (w !== null) el.value = w; }
  }
  function walk(root) {
    if (root.nodeType === 3) { doText(root); return; }
    if (root.nodeType !== 1) return;
    doAttrs(root);
    root.querySelectorAll("[placeholder],[aria-label],[title],[alt],input[type=submit],input[type=button]").forEach(doAttrs);
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), n, list = [];
    while ((n = w.nextNode())) list.push(n);
    list.forEach(doText);
  }
  document.documentElement.lang = LANG;
  if (LANG === "ar" || LANG === "ur") { document.documentElement.dir = "rtl"; var rs = document.createElement("style"); rs.textContent = ".skip:not(:focus){left:auto!important;right:-9999px!important}"; document.head.appendChild(rs); }
  function doNav() { /* the menu is drawn in English by nav.js and marked data-noi18n */
    if (LANG === "en") return;
    var w = document.createTreeWalker(document.querySelector(".bh") || document.body, NodeFilter.SHOW_TEXT), n, list = [];
    while ((n = w.nextNode())) { var p = n.parentElement; if (p && !p.closest("#bh-lmenu") && (FULL[norm(n.nodeValue)] || CORE[norm(n.nodeValue)])) list.push(n); }
    list.forEach(function (x) { x.nodeValue = FULL[norm(x.nodeValue)] || CORE[norm(x.nodeValue)]; });
  }
  function start() {
    doNav(); window.addEventListener("load", doNav); fetchFull();
    if (NOTE && document.getElementById("main")) { var nb = document.createElement("div"); nb.setAttribute("data-noi18n", "1"); nb.style.cssText = "background:#FFF4D6;color:#3A2B05;padding:8px 16px;font-size:14px"; nb.textContent = NOTE; var mn = document.getElementById("main"); mn.parentNode.insertBefore(nb, mn); }
    var hint = document.body.classList.contains("k-body") ? "This guide is in Thai because it explains Thai law. Use your browser's translate tool to read it in your language." : /^(privacy|terms)\.html$/i.test(location.pathname.split("/").pop() || "") ? "The Thai text below is the binding version. The English summary is at the end of this page." : "";
    if (!hint && rate && /^(sheets|product|cart|checkout|market)\.html$/i.test(location.pathname.split("/").pop() || "")) hint = "Prices are in Thai baht. Your card is charged in baht. US dollar amounts are estimates, and your bank sets the final rate.";
    if (hint && document.getElementById("main")) { var d = document.createElement("div"); d.setAttribute("data-noi18n", "1"); d.style.cssText = "background:#E4EAF1;color:#0F2A44;padding:10px 16px;font-size:15px"; d.textContent = hint; var m = document.getElementById("main"); m.parentNode.insertBefore(d, m); }
    walk(document.body);
    var tv = tr(document.title); if (tv !== null) document.title = tv;
    new MutationObserver(function (list) {
      list.forEach(function (m) {
        if (m.type === "characterData") { doText(m.target); return; }
        if (m.type === "attributes") { doAttrs(m.target); return; }
        m.addedNodes.forEach(walk);
      });
    }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["placeholder", "aria-label", "title", "alt"] });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
