/* i18n.js: every language except Thai. nav.js loads this file and the dictionaries when the person chooses a language.
   It changes text on screen. It never changes form values or what the system sends to the back end.
   Order for each text: 1 reviewed correction, 2 full dictionary of the language, 3 core word list, 4 text translated from Thai by the back end and kept in this browser.
   English shows only while the translation of step 4 is on its way. Prices come from app.js in the currency of the language, marked with U+2068 and U+2069, and are never translated. */
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
  (Array.isArray(S.sheets) ? S.sheets : []).forEach(function (x) { (x.outline || []).concat(x.refs || []).forEach(function (s) { if (s.th && s.en) map[norm(s.th)] = s.en; }); });
  (Array.isArray(S.botfaq) ? S.botfaq : []).forEach(function (x) { if (x.q && x.qEn) map[norm(x.q)] = x.qEn; if (x.a && x.aEn) map[norm(x.a)] = x.aEn; });
  var phrases = Object.keys(map).filter(function (k) { return k.length >= 6; }).sort(function (a, b) { return b.length - a.length; });
  /* Languages other than Thai and English (1 Nov 2026): Thai -> English -> core word list. */
  var LANG = "en", CORE = {}, NOTE = "";
  try { LANG = localStorage.getItem("build_lang") || "en"; } catch (e) {}
  (function () { var L = (window.I18N_CORE || {})[LANG], K = window.I18N_KEYS || []; if (!L) { LANG = "en"; return; } L.split("|").forEach(function (w, i) { if (K[i] === "NOTE") NOTE = w; else if (K[i]) CORE[K[i]] = w; }); })();
  /* Full dictionary English -> this language, built by the back end (i18nBuildAll) and fetched once a day. Kept in this browser only. */
  var FULL = {}, FIX = (window.I18N_FIX || {})[LANG] || {}; /* 2 Nov 2026: corrections by reviewers per language (i18n-fix.js) win over the machine dictionary */
  (function () { if (LANG === "en") return; try { var raw = localStorage.getItem("build_i18n_" + LANG); if (raw) { var j = JSON.parse(raw); if (j && j.map) FULL = j.map; } } catch (e) {} })();
  function fetchFull() {
    var api = S.member && S.member.api; if (!api || LANG === "en") return;
    var at = 0; try { var raw = localStorage.getItem("build_i18n_" + LANG); if (raw) at = +((JSON.parse(raw) || {}).at || 0); } catch (e) {}
    if (at && Date.now() - at < 864e5) return;
    fetch(api + "?action=i18n&lang=" + encodeURIComponent(LANG), { redirect: "follow" }).then(function (r) { return r.json(); }).then(function (j) {
      if (!j || !j.ok || !j.map) return;
      try { localStorage.setItem("build_i18n_" + LANG, JSON.stringify({ at: Date.now(), built: j.built, map: j.map })); } catch (e) {}
      FULL = j.map; again(); doNav();
    }).catch(function () {});
  }
  var BRAND = /^(BUILD|BUILD TH|TH|สร้าง \| BUILD TH|นายห้าง AI)$/; /* 2 Nov 2026: brand words are never translated */
  /* 2 Nov 2026: text with no entry in the dictionaries (knowledge pages, new text, text with a number in it) is sent to the back end once, translated from Thai, checked, and kept in this browser */
  var EXTRA = {}, extraKey = "build_trx2_" + LANG, NEED = {}, needTimer = 0;
  try { localStorage.removeItem("build_trx_" + LANG); } catch (e) {}
  /* 2 Nov 2026: on pages with customer data, a text with an e-mail address, a phone number or a tax number is never sent. Names and addresses carry data-noi18n in the page itself. */
  var PRIVATE = /^(member|checkout|cart|track|request)\.html$/i.test(location.pathname.split("/").pop() || ""), PII = /@|\b0\d{1,2}[- ]?\d{3}[- ]?\d{3,4}\b|\b\d{13}\b|\b\d-\d{4}-\d{5}-\d{2}-\d\b/;
  (function () { try { var raw = localStorage.getItem(extraKey); if (raw) EXTRA = JSON.parse(raw) || {}; } catch (e) {} })();
  function need(t) {
    if (t.length < 2 || t.length > 1500 || Object.prototype.hasOwnProperty.call(EXTRA, t) || NEED[t] || (PRIVATE && PII.test(t))) return;
    NEED[t] = 1; if (!needTimer) needTimer = setTimeout(fetchExtra, 900);
  }
  /* 2 Nov 2026: a Thai standard code alone has one fixed form in every language. A date alone uses the date format of the language, and a Buddhist year becomes a Common Era year. */
  var CODE_ONLY = /^(มยผ\.|มอก\.|วสท\.)\s*([0-9A-Za-z][0-9A-Za-z.\-\/ ]*)$/, CODE_EN = { "มยผ.": "DPT", "มอก.": "TIS", "วสท.": "EIT" };
  var TH_M = { "ม.ค.": 0, "ก.พ.": 1, "มี.ค.": 2, "เม.ย.": 3, "พ.ค.": 4, "มิ.ย.": 5, "ก.ค.": 6, "ส.ค.": 7, "ก.ย.": 8, "ต.ค.": 9, "พ.ย.": 10, "ธ.ค.": 11, "มกราคม": 0, "กุมภาพันธ์": 1, "มีนาคม": 2, "เมษายน": 3, "พฤษภาคม": 4, "มิถุนายน": 5, "กรกฎาคม": 6, "สิงหาคม": 7, "กันยายน": 8, "ตุลาคม": 9, "พฤศจิกายน": 10, "ธันวาคม": 11 };
  var DATE_ONLY = /^(?:(\d{1,2})\s*)?(ม\.ค\.|ก\.พ\.|มี\.ค\.|เม\.ย\.|พ\.ค\.|มิ\.ย\.|ก\.ค\.|ส\.ค\.|ก\.ย\.|ต\.ค\.|พ\.ย\.|ธ\.ค\.|มกราคม|กุมภาพันธ์|มีนาคม|เมษายน|พฤษภาคม|มิถุนายน|กรกฎาคม|สิงหาคม|กันยายน|ตุลาคม|พฤศจิกายน|ธันวาคม)(?:\s*(\d{4}))?$/;
  function dateOnly(t) {
    var m = DATE_ONLY.exec(t); if (!m || (!m[1] && !m[3])) return null;
    var y = m[3] ? +m[3] : new Date().getFullYear(); if (y >= 2400) y -= 543;
    var o = { month: "short", timeZone: "UTC", numberingSystem: "latn" }; if (m[1]) o.day = "numeric"; if (m[3]) o.year = "numeric";
    try { return new Intl.DateTimeFormat(LANG, o).format(new Date(Date.UTC(y, TH_M[m[2]], m[1] ? +m[1] : 1))); } catch (e) { return null; }
  }
  /* A label beside the brand name ("Cart — BUILD TH") is translated alone. A brand name inside a sentence stays in the sentence: the back end writes it in Latin letters and the translator keeps it. */
  var BRAND_IN = /(สร้าง\s*\|\s*BUILD TH|นายห้าง AI)/, BRAND_SEP = /(^|[—–·:|]\s*)(สร้าง\s*\|\s*BUILD TH|นายห้าง AI)(\s*[—–·:|]|\s*$)/;
  function tr(raw) {
    var t = norm(raw);
    if (!t || BRAND.test(t)) return null;
    if (BRAND_SEP.test(t)) {
      var changed = false, out = t.split(BRAND_IN).map(function (p, i) {
        if (i % 2) return p.indexOf("BUILD TH") >= 0 ? "BUILD TH" : p; var m = /^([\s—–·:|,.()\-]*)([\s\S]*?)([\s—–·:|,.()\-]*)$/.exec(p); if (!m || !m[2]) return p;
        var v = tr1(m[2]); if (v === null) return p; changed = true; return m[1] + v + m[3];
      }).join("");
      return changed ? out : null;
    }
    return tr1(t);
  }
  var ID_ONE = /\b(?:BT|Q|CS|RQ|RC)-?\d[\d-]*\b/; /* a number of an order, question or receipt inside a sentence: one translation for all numbers */
  function tr1(raw) {
    var t = norm(raw);
    if (!t) return null;
    if (THAI.test(t) && ID_ONE.test(t)) {
      var ids = [], key = t.replace(new RegExp(ID_ONE.source, "g"), function (m) { ids.push(m); return "ZQ" + ids.length + "Z"; }), vk = tr1(key);
      return vk === null ? null : vk.replace(/ZQ(\d+)Z/g, function (x, k) { return ids[+k - 1] == null ? x : ids[+k - 1]; });
    }
    var cm = CODE_ONLY.exec(t); if (cm) return CODE_EN[cm[1]] + " " + cm[2];
    var dm = dateOnly(t); if (dm) return dm;
    if (LANG === "en") {
      var e0 = trEn(raw); if (e0 !== null) return e0;
      if (!THAI.test(t)) return null;
      var x0 = EXTRA[t]; if (x0 && x0 !== t) return x0;
      need(t); return null;
    }
    if (!THAI.test(t)) return null;
    var en = map[t] ? norm(map[t]) : "", c = en ? (FIX[en] || FULL[en] || CORE[en]) : "";
    if (c && c !== t) return c;
    var ex = EXTRA[t]; if (ex && ex !== t) return ex;
    need(t);
    return trEn(raw); /* English only until the translation arrives */
  }
  function trEn(raw) {
    var t = norm(raw);
    if (!t || !THAI.test(t)) return null;
    if (map[t]) return map[t];
    if (t.length > 260) return null;
    var r = t;
    for (var i = 0; i < phrases.length && THAI.test(r); i++) { if (r.indexOf(phrases[i]) >= 0) r = r.split(phrases[i]).join(" " + map[phrases[i]] + " "); } /* 2 Nov 2026: a space around each replaced phrase, so two phrases do not run together ("peopleare") */
    for (var j = 0; j < RULES.length && THAI.test(r); j++) r = r.replace(RULES[j][0], RULES[j][1]);
    r = r.replace(/\s+/g, " ").replace(/\s+([,.;:!?%)\]])/g, "$1").replace(/([(\[])\s+/g, "$1").trim();
    return THAI.test(r) ? null : r;
  }
  var SKIP = /^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA|CODE)$/, SRC = new WeakMap(), ATTR = new WeakMap();
  function doText(n) {
    var e = n.parentElement; if (!e || SKIP.test(e.tagName) || e.closest("[data-noi18n]")) return;
    /* a price is its own text part: the text before and after it are translated by themselves */
    var tk = /⁨[^⁩]*⁩/.exec(n.nodeValue);
    if (tk) { if (n.nodeValue.length === tk[0].length) return; var mid = tk.index ? n.splitText(tk.index) : n, aft = mid.splitText(tk[0].length); if (mid !== n) doText(n); if (aft.nodeValue) doText(aft); return; }
    var rec = SRC.get(n), cur = n.nodeValue, base = rec && rec.out === cur ? rec.src : cur;
    var v = tr(base); if (v === null) return;
    var nv = (/^\s/.test(base) ? " " : "") + v + (/\s$/.test(base) ? " " : "");
    SRC.set(n, { src: base, out: nv });
    if (nv !== cur) n.nodeValue = nv;
  }
  function doAttrs(el) {
    if (el.closest("[data-noi18n]")) return;
    var m = ATTR.get(el); if (!m) { m = {}; ATTR.set(el, m); }
    ["placeholder", "aria-label", "title", "alt", "label"].forEach(function (a) {
      if (!el.hasAttribute(a)) return; var cur = el.getAttribute(a), rec = m[a], base = rec && rec.out === cur ? rec.src : cur, v = tr(base);
      if (v !== null) { m[a] = { src: base, out: v }; if (v !== cur) el.setAttribute(a, v); }
    });
    if (el.tagName === "INPUT" && /^(submit|button)$/.test(el.type) && el.value) { var w = tr(el.value); if (w !== null) el.value = w; }
  }
  function walk(root) {
    if (root.nodeType === 3) { doText(root); return; }
    if (root.nodeType !== 1) return;
    doAttrs(root);
    root.querySelectorAll("[placeholder],[aria-label],[title],[alt],[label],input[type=submit],input[type=button]").forEach(doAttrs);
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), n, list = [];
    while ((n = w.nextNode())) list.push(n);
    list.forEach(doText);
  }
  var TITLE0 = document.title;
  function again() { walk(document.body); var tv = tr(TITLE0); if (tv !== null) document.title = tv; }
  document.documentElement.lang = LANG;
  if (LANG === "ar" || LANG === "ur") { document.documentElement.dir = "rtl"; var rs = document.createElement("style"); rs.textContent = ".skip:not(:focus){left:auto!important;right:-9999px!important}"; document.head.appendChild(rs); }
  function doNav() { /* the menu is drawn in English by nav.js and marked data-noi18n */
    if (LANG === "en") return;
    var w = document.createTreeWalker(document.querySelector(".bh") || document.body, NodeFilter.SHOW_TEXT), n, list = [];
    while ((n = w.nextNode())) { var p = n.parentElement; if (p && !p.closest("#bh-lmenu") && !p.closest(".bh-logo") && !BRAND.test(norm(n.nodeValue)) && (FIX[norm(n.nodeValue)] || FULL[norm(n.nodeValue)] || CORE[norm(n.nodeValue)])) list.push(n); }
    list.forEach(function (x) { x.nodeValue = FIX[norm(x.nodeValue)] || FULL[norm(x.nodeValue)] || CORE[norm(x.nodeValue)]; });
  }
  function callExtra(items) { /* pages without app.js (privacy, terms, checklists) use the same back end */
    var api = S.member && S.member.api, B = window.BUILD;
    if (api) return fetch(api, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action: "i18nExtra", lang: LANG, items: items }), redirect: "follow" }).then(function (r) { return r.json(); });
    if (B && B.call) return B.call("i18nExtra", { lang: LANG, items: items });
    return Promise.reject(new Error("no back end"));
  }
  window.I18N_TR = function (s) { var v = tr(s); return v === null ? s : v; }; /* for text that is not on the page, such as the print window */
  window.I18N_WAIT = function () { return Object.keys(NEED).length; }; /* how many texts wait for the translator (test page only) */
  function fetchExtra() {
    needTimer = 0;
    var list = Object.keys(NEED); if (!list.length) return;
    var batches = []; while (list.length) batches.push(list.splice(0, 60)); batches = batches.slice(0, 5);
    (function next() { var items = batches.shift(); if (!items) { if (Object.keys(NEED).length && !needTimer) needTimer = setTimeout(fetchExtra, 900); return; }
      callExtra(items).then(function (j) {
        var okj = !!(j && j.ok), busy = !okj || !!j.busy; items.forEach(function (k) { delete NEED[k]; var v = okj && j.map && j.map[k]; if (v) EXTRA[k] = v; else if (!busy) EXTRA[k] = ""; }); /* an empty entry means: the checks did not pass, do not ask again in this browser. A busy or failed back end marks nothing, so the next page asks again. */
        try { localStorage.setItem(extraKey, JSON.stringify(EXTRA)); } catch (e) {}
        again(); next();
      }).catch(function () { items.forEach(function (k) { delete NEED[k]; }); });
    })();
  }
  /* 2 Nov 2026: message boxes use the language of the page */
  ["alert", "confirm", "prompt"].forEach(function (k) {
    var f = window[k]; if (typeof f !== "function") return;
    window[k] = function (m, d) {
      var t = String(m == null ? "" : m), v = t.split("\n").map(function (x) { var y = tr(x); return y === null ? x : y; }).join("\n");
      return k === "prompt" ? f.call(window, v, d) : f.call(window, v);
    };
  });
  function start() {
    if (LANG !== "en") { var es = document.getElementById("en-summary"); if (es) es.hidden = true; } /* the English summary of privacy and terms: for English readers only */
    doNav(); window.addEventListener("load", doNav); fetchFull();
    if (NOTE && document.getElementById("main")) { var nb = document.createElement("div"); nb.setAttribute("data-noi18n", "1"); nb.style.cssText = "background:#FFF4D6;color:#3A2B05;padding:8px 16px;font-size:14px"; nb.textContent = NOTE; var mn = document.getElementById("main"); mn.parentNode.insertBefore(nb, mn); }
    var hint = document.body.classList.contains("k-body") ? "คู่มือนี้อธิบายกฎหมายไทย ข้อความแปลด้วยเครื่องจากภาษาไทย ให้ยึดภาษาไทยเป็นหลัก และยืนยันกับหน่วยงานก่อนดำเนินการ" : /^(privacy|terms)\.html$/i.test(location.pathname.split("/").pop() || "") ? "ข้อความภาษาไทยคือฉบับที่มีผลผูกพัน ข้อความในภาษานี้แปลเพื่อให้อ่านเข้าใจ" : "";
    if (hint && document.getElementById("main")) { var d = document.createElement("div"); d.style.cssText = "background:#E4EAF1;color:#0F2A44;padding:10px 16px;font-size:15px"; d.textContent = hint; var m = document.getElementById("main"); m.parentNode.insertBefore(d, m); }
    if (document.body.classList.contains("k-body") && document.getElementById("main") && LANG !== "en") { /* knowledge pages explain Thai law: a card gives the law of the country of the reader */
      var ls = document.createElement("script"); ls.src = "doc-law.js"; ls.onload = function () {
        var cc = (window.LANG_CC || {})[LANG], rec = (window.LAWDB || []).filter(function (x) { return (window.CC_OF || {})[x.country] === cc; })[0]; if (!rec || cc === "TH") return;
        var dn = ""; try { dn = new Intl.DisplayNames([LANG], { type: "region", style: "short" }).of(cc); } catch (e) { dn = rec.country; }
        var card = document.createElement("div"); card.style.cssText = "background:#F6F4EF;color:#0F2A44;padding:10px 16px;font-size:15px;border-bottom:1px solid #DDE3EA;overflow-wrap:anywhere";
        var b1 = document.createElement("b"); b1.setAttribute("data-noi18n", "1"); b1.textContent = dn + ": "; card.appendChild(b1);
        var s1 = document.createElement("span"); s1.textContent = "กฎหมายหลักของประเทศคุณ"; card.appendChild(s1); card.appendChild(document.createTextNode(" "));
        var s2 = document.createElement("span"); s2.setAttribute("data-noi18n", "1"); s2.textContent = rec.lawNameLocal || rec.lawName; card.appendChild(s2); card.appendChild(document.createTextNode(" · "));
        var a1 = document.createElement("a"); a1.href = "doc.html"; a1.textContent = "เปิดฟอร์มตามมาตรฐานของประเทศคุณ"; card.appendChild(a1);
        var mm = document.getElementById("main"); mm.parentNode.insertBefore(card, mm);
      }; document.head.appendChild(ls);
    }
    again();
    new MutationObserver(function (list) {
      list.forEach(function (m) {
        if (m.type === "characterData") { doText(m.target); return; }
        if (m.type === "attributes") { doAttrs(m.target); return; }
        m.addedNodes.forEach(walk);
      });
    }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["placeholder", "aria-label", "title", "alt", "label"] });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
