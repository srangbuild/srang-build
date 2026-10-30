/* bot.js: announcement bar and the question helper (Phase 1 item 35).
   The helper is rule based. It matches words against data.js (botfaq) and knowledge-index.js. It uses no AI service.
   Typed questions are logged for research. The back end hides e-mail addresses and phone numbers before it saves a question. */
(function () {
  "use strict";
  var B = window.BUILD || {}, S = window.SITE || B.S || {};
  var here = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  if (/^(admin|receipt|go)\.html$/.test(here) || /[?&]shot=1/.test(location.search)) return;
  var EN = false; try { EN = localStorage.getItem("build_lang") === "en"; } catch (e) {}
  var T = EN ? {
    open: "Ask us", title: "BUILD helper", sub: "Automatic answers. This helper is not a person.", hello: "Hello. Choose a topic or type your question.", ph: "Type your question", send: "Send", close: "Close",
    more: "Read more", good: "This helps", bad: "Not what I asked", none: "We have no answer for this yet. Send it to the shop, or contact us on LINE.", thanks: "Thank you.",
    form: "Send to the shop", contact: "E-mail or LINE ID for the reply", consent: "I agree that the shop uses this contact to reply to this question.", sent: "Sent. The shop will reply within 2 working days.", line: "Contact on LINE", privacy: "Do not type personal data. We keep questions to improve the answers.", fail: "Could not send. Try again or use LINE.", notices: "Close this notice"
  } : {
    open: "ถามได้เลย", title: "ผู้ช่วย BUILD", sub: "ตอบอัตโนมัติ ผู้ช่วยนี้ไม่ใช่คน", hello: "สวัสดี เลือกเรื่องที่อยากรู้ หรือพิมพ์คำถามได้เลย", ph: "พิมพ์คำถามของคุณ", send: "ส่ง", close: "ปิด",
    more: "อ่านต่อ", good: "ตรงคำถาม", bad: "ยังไม่ตรง", none: "เรื่องนี้ยังไม่มีคำตอบในระบบ ส่งให้ร้านตอบได้ หรือติดต่อทาง LINE", thanks: "ขอบคุณที่บอกเรา",
    form: "ส่งให้ร้านตอบ", contact: "อีเมลหรือ LINE ID สำหรับรับคำตอบ", consent: "ยินยอมให้ร้านใช้ช่องทางนี้ตอบคำถามนี้", sent: "ส่งแล้ว ร้านจะตอบภายใน 2 วันทำการ", line: "ติดต่อทาง LINE", privacy: "อย่าพิมพ์ข้อมูลส่วนตัว เราเก็บคำถามไว้เพื่อปรับปรุงคำตอบ", fail: "ส่งไม่สำเร็จ ลองใหม่ หรือติดต่อทาง LINE", notices: "ปิดประกาศนี้"
  };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function safeHref(h) { h = String(h || ""); return /^(https:\/\/|[a-z0-9-]+\.html([?#].*)?$)/i.test(h) ? h : ""; }
  function apiOn() { return typeof B.call === "function" && !!((S.member && S.member.api) || /\/_dev\//.test(location.pathname)); }

  var css = ".bn-note{display:flex;gap:10px;align-items:flex-start;padding:10px 16px;font-size:15px;line-height:1.5;background:#FFF1E8;color:#6F2B05;border-bottom:1px solid #FFD2B3}.bn-note.warn{background:#FDECEA;color:#7A1C14;border-color:#F5C4BE}.bn-note .x{margin-left:auto;background:none;border:0;font-size:22px;line-height:1;color:inherit;cursor:pointer;min-width:36px;min-height:36px}.bn-note a{color:inherit;font-weight:700}" +
    ".bt-fab{position:fixed;right:14px;bottom:14px;bottom:calc(14px + env(safe-area-inset-bottom));z-index:85;display:flex;align-items:center;gap:8px;min-height:50px;padding:0 18px;border:0;border-radius:999px;background:#0F2A44;color:#fff;font:600 15.5px/1 \"IBM Plex Sans Thai\",sans-serif;box-shadow:0 10px 26px rgba(15,42,68,.35);cursor:pointer}.bt-fab:hover{background:#16395C}.bt-fab svg{width:20px;height:20px}.bt-fab.bt-typing{display:none}" +
    ".bt-pan{position:fixed;right:14px;bottom:14px;bottom:calc(14px + env(safe-area-inset-bottom));z-index:96;width:min(400px,calc(100vw - 28px));height:min(600px,calc(100vh - 90px));display:flex;flex-direction:column;background:#F6F4EF;border-radius:18px;box-shadow:0 20px 50px rgba(15,42,68,.4);overflow:hidden;font:16px/1.6 \"IBM Plex Sans Thai\",sans-serif;color:#16202B}" +
    ".bt-hd{display:flex;align-items:center;gap:10px;padding:12px 14px;background:#0F2A44;color:#fff}.bt-hd b{display:block;font-size:16.5px}.bt-hd small{display:block;font-size:12.5px;color:#CFDAE5}.bt-hd button{margin-left:auto;background:none;border:0;color:#fff;font-size:26px;line-height:1;min-width:42px;min-height:42px;cursor:pointer}" +
    ".bt-log{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px}.bt-m{max-width:90%;padding:9px 12px;border-radius:14px;background:#fff;border:1px solid #DDE3EA;white-space:pre-wrap;overflow-wrap:anywhere}.bt-m.me{align-self:flex-end;background:#FFE7D8;border-color:#FFD2B3}" +
    ".bt-chips{display:flex;flex-wrap:wrap;gap:6px}.bt-chips button,.bt-act button,.bt-act a{font:inherit;font-size:14.5px;background:#fff;color:#0F2A44;border:1.5px solid #C9D2DC;border-radius:999px;padding:6px 12px;min-height:38px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center}.bt-chips button:hover,.bt-act button:hover,.bt-act a:hover{border-color:#FF6B1A;background:#FFF6EF}.bt-act{display:flex;flex-wrap:wrap;gap:6px}.bt-act a.pri{background:#FF6B1A;border-color:#FF6B1A;color:#fff}" +
    ".bt-f{display:grid;gap:8px;background:#fff;border:1px solid #DDE3EA;border-radius:14px;padding:10px 12px}.bt-f input[type=text]{font:inherit;min-height:44px;border:1.5px solid #C9D2DC;border-radius:10px;padding:0 10px}.bt-f label{font-size:14px;display:flex;gap:8px;align-items:flex-start}.bt-f button{font:inherit;font-weight:600;min-height:44px;border:0;border-radius:10px;background:#FF6B1A;color:#fff;cursor:pointer}" +
    ".bt-in{display:flex;gap:8px;padding:10px 12px;background:#fff;border-top:1px solid #DDE3EA}.bt-in input{flex:1;min-width:0;font:inherit;min-height:46px;border:1.5px solid #C9D2DC;border-radius:12px;padding:0 12px}.bt-in button{font:inherit;font-weight:600;min-height:46px;padding:0 16px;border:0;border-radius:12px;background:#FF6B1A;color:#fff;cursor:pointer}.bt-pv{margin:0;padding:0 12px 8px;background:#fff;font-size:12.5px;color:#5A6573}" +
    "@media (max-width:520px){.bt-pan{right:0;left:0;bottom:0;width:100%;height:82vh;border-radius:18px 18px 0 0}}@media print{.bt-fab,.bt-pan,.bn-note{display:none!important}}";
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  /* ---------- announcement bar: data.js notices, editable in the back office ---------- */
  function noticesNow() {
    var today = new Date().toISOString().slice(0, 10), off = [];
    try { off = JSON.parse(localStorage.getItem("build_notice_off") || "[]"); } catch (e) {}
    return (Array.isArray(S.notices) ? S.notices : []).filter(function (n) {
      return n && n.on !== false && n.text && n.id && off.indexOf(n.id) < 0 && (!n.from || n.from <= today) && (!n.to || n.to >= today);
    });
  }
  B.noticesNow = noticesNow;
  function drawNotices() {
    var hdr = document.getElementById("hdr"); if (!hdr) return;
    noticesNow().slice(0, 2).forEach(function (n) {
      var d = document.createElement("div"); d.className = "bn-note" + (n.level === "warn" ? " warn" : ""); d.setAttribute("role", "status");
      var href = safeHref(n.href), text = EN && n.textEn ? n.textEn : n.text;
      d.innerHTML = "<span>" + esc(text) + (href ? ' <a href="' + esc(href) + '">' + esc(n.label || T.more) + "</a>" : "") + '</span><button class="x" type="button" aria-label="' + esc(T.notices) + '">&times;</button>';
      d.querySelector(".x").addEventListener("click", function () {
        var off = []; try { off = JSON.parse(localStorage.getItem("build_notice_off") || "[]"); off.push(n.id); localStorage.setItem("build_notice_off", JSON.stringify(off.slice(-40))); } catch (e) {}
        d.remove();
      });
      hdr.parentNode.insertBefore(d, hdr.nextSibling);
    });
  }

  /* ---------- helper ---------- */
  var FAQ = (Array.isArray(S.botfaq) ? S.botfaq : []).map(function (x) {
    return { id: x.id, q: EN && x.qEn ? x.qEn : x.q, a: EN && x.aEn ? x.aEn : x.a, href: x.href, top: x.top, words: String(x.k || "").split(/[\s,]+/).concat(String(x.qEn || "").toLowerCase().split(/\s+/).filter(function (w) { return w.length > 3; })) };
  });
  var indexReady = false, pan = null, logBox = null, lastId = "", lastQ = "";
  function loadIndex(done) {
    if (indexReady) return done();
    var s = document.createElement("script"); s.src = "knowledge-index.js";
    s.onload = function () { (window.K_INDEX || []).forEach(function (k) { FAQ.push({ id: "k-" + k.id, q: k.title, a: k.short, href: "k-" + k.id + ".html", words: String(k.tags || "").split(/\s+/) }); (k.faq || []).forEach(function (f, i) { FAQ.push({ id: "k-" + k.id + "-" + i, q: f[0], a: f[1], href: "k-" + k.id + ".html", words: String(k.tags || "").split(/\s+/) }); }); }); indexReady = true; done(); };
    s.onerror = function () { indexReady = true; done(); };
    document.head.appendChild(s);
  }
  function norm(s) { return String(s || "").toLowerCase().replace(/[?？!.,'"“”]/g, " ").replace(/\s+/g, " ").trim(); }
  function score(q, it) {
    var s = 0, nq = norm(it.q);
    if (nq === q) s += 60; else if (q.length >= 4 && nq.indexOf(q) >= 0) s += 12;
    it.words.forEach(function (w) { w = norm(w); if (w.length >= 2 && q.indexOf(w) >= 0) s += Math.min(w.length, 10); });
    return s;
  }
  function rank(q) { q = norm(q); return FAQ.map(function (it) { return { it: it, s: score(q, it) }; }).filter(function (x) { return x.s >= 5; }).sort(function (a, b) { return b.s - a.s; }); }
  function say(text, me) { var d = document.createElement("div"); d.className = "bt-m" + (me ? " me" : ""); d.textContent = text; logBox.appendChild(d); logBox.scrollTop = logBox.scrollHeight; return d; }
  function block(cls, html) { var d = document.createElement("div"); d.className = cls; d.innerHTML = html; logBox.appendChild(d); logBox.scrollTop = logBox.scrollHeight; return d; }
  function lineBtn() { var l = S.links && S.links.line; return /^https:\/\//.test(l || "") ? '<a href="' + esc(l) + '" target="_blank" rel="noopener">' + esc(T.line) + "</a>" : ""; }
  function send(data) {
    if (!apiOn()) return Promise.resolve({ id: "" });
    data.page = here;
    return B.call("botlog", data).catch(function () { return { id: "" }; });
  }
  function answer(it, typed) {
    say(it.a);
    var href = safeHref(it.href);
    block("bt-act", (href ? '<a class="pri" href="' + esc(href) + '">' + esc(T.more) + "</a>" : "") + (typed ? '<button type="button" data-fb="good">' + esc(T.good) + '</button><button type="button" data-fb="bad">' + esc(T.bad) + "</button>" : ""));
  }
  function askForm() {
    block("bt-f", '<label for="bt-c" style="display:block">' + esc(T.contact) + '</label><input id="bt-c" type="text" maxlength="80" autocomplete="email"><label><input id="bt-ok" type="checkbox"><span>' + esc(T.consent) + '</span></label><button type="button" data-bt="post">' + esc(T.form) + "</button>");
    var ln = lineBtn(); if (ln) block("bt-act", ln);
  }
  function handle(text) {
    text = String(text || "").trim(); if (!text) return;
    say(text, true); lastQ = text; lastId = "";
    loadIndex(function () {
      var r = rank(text);
      send({ q: text, hit: r.length ? r[0].it.id : "", res: r.length ? "ตอบได้" : "ไม่พบคำตอบ" }).then(function (o) { lastId = (o && o.id) || ""; });
      if (r.length) {
        answer(r[0].it, true);
        var more = r.slice(1, 3).filter(function (x) { return x.s >= 6; });
        if (more.length) block("bt-chips", more.map(function (x) { return '<button type="button" data-q="' + esc(x.it.id) + '">' + esc(x.it.q) + "</button>"; }).join(""));
      } else { say(T.none); askForm(); }
    });
  }
  function build() {
    if (pan) { pan.hidden = false; pan.querySelector("input").focus(); return; }
    pan = document.createElement("div"); pan.className = "bt-pan"; pan.setAttribute("role", "dialog"); pan.setAttribute("aria-label", T.title);
    pan.innerHTML = '<div class="bt-hd"><span><b>' + esc(T.title) + "</b><small>" + esc(T.sub) + '</small></span><button type="button" data-bt="close" aria-label="' + esc(T.close) + '">&times;</button></div><div class="bt-log" aria-live="polite"></div><form class="bt-in"><input type="text" maxlength="300" placeholder="' + esc(T.ph) + '" aria-label="' + esc(T.ph) + '"><button type="submit">' + esc(T.send) + '</button></form><p class="bt-pv">' + esc(T.privacy) + "</p>";
    document.body.appendChild(pan);
    logBox = pan.querySelector(".bt-log");
    say(T.hello);
    var tops = FAQ.filter(function (x) { return x.top; }).slice(0, 7);
    if (tops.length) block("bt-chips", tops.map(function (x) { return '<button type="button" data-q="' + esc(x.id) + '">' + esc(x.q) + "</button>"; }).join(""));
    pan.querySelector("form").addEventListener("submit", function (ev) { ev.preventDefault(); var i = pan.querySelector("form input"); handle(i.value); i.value = ""; });
    pan.addEventListener("click", function (ev) {
      var t = ev.target.closest("button"); if (!t) return;
      if (t.dataset.bt === "close") { pan.hidden = true; if (fab) fab.focus(); return; }
      if (t.dataset.q) { var it = FAQ.filter(function (x) { return x.id === t.dataset.q; })[0]; if (it) { say(it.q, true); answer(it, false); } return; }
      if (t.dataset.fb) {
        t.parentNode.querySelectorAll("[data-fb]").forEach(function (b) { b.remove(); });
        if (lastId) send({ id: lastId, res: t.dataset.fb === "good" ? "ตรงคำถาม" : "ไม่ตรงคำถาม" });
        if (t.dataset.fb === "good") say(T.thanks); else { say(T.none); askForm(); }
        return;
      }
      if (t.dataset.bt === "post") {
        var c = pan.querySelector("#bt-c"), ok = pan.querySelector("#bt-ok"), box = t.parentNode;
        if (!c.value.trim() || !ok.checked) { c.focus(); return; }
        t.disabled = true;
        var body = { res: "ขอให้ร้านตอบ", contact: c.value.trim(), consent: true };
        if (lastId) body.id = lastId; else { body.q = lastQ; body.hit = ""; }
        (apiOn() ? B.call("botlog", Object.assign({ page: here }, body)) : Promise.reject(new Error("off"))).then(function () { box.remove(); say(T.sent); }).catch(function () { t.disabled = false; say(T.fail); });
      }
    });
    loadIndex(function () {});
    pan.querySelector("form input").focus();
  }
  var fab = document.createElement("button"); fab.type = "button"; fab.className = "bt-fab";
  fab.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.7A8 8 0 1 1 21 12z"/></svg>' + esc(T.open);
  fab.addEventListener("click", build);
  document.addEventListener("click", function (ev) { var a = ev.target.closest && ev.target.closest("[data-bot-open]"); if (a) { ev.preventDefault(); build(); } });
  // บนมือถือ ปุ่มผู้ช่วยหลบตอนพิมพ์ ไม่ให้ทับช่องกรอก
  document.addEventListener("focusin", function (ev) { if (window.innerWidth <= 768 && /^(INPUT|TEXTAREA|SELECT)$/.test(ev.target.tagName)) fab.classList.add("bt-typing"); });
  document.addEventListener("focusout", function () { fab.classList.remove("bt-typing"); });
  function start() { document.body.appendChild(fab); drawNotices(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
