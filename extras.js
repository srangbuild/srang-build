/* extras.js — ส่วนเสริมของทุกหน้าสาธารณะ (โหลดหลัง data.js) ข้อมูลทั้งหมดอยู่ใน data.js
   1) แถบแจ้งการเก็บข้อมูลในเบราว์เซอร์ (คุกกี้และที่เก็บในเครื่อง): จำเป็น / สถิติ · สถิติ (GA4) จะเริ่มก็ต่อเมื่อผู้ชมกดยอมรับ
   2) พื้นที่โฆษณา: วาดในกล่อง <div id="adslot"> มีป้าย โฆษณา ทุกชิ้น · ถ้ายังไม่มีผู้ลงโฆษณา แสดงการ์ด รับโฆษณา
   3) หน้าต่างถวายพระพร: แสดงเฉพาะวันที่กำหนดใน data.js → tribute และเฉพาะเมื่อ tribute.on = true (ค่าเริ่มต้นคือปิด)
   4) ลิงก์ท้ายหน้า: ข้อตกลงการใช้งาน · นโยบายความเป็นส่วนตัว · ตั้งค่าคุกกี้ · ลงโฆษณา */
(function () {
  "use strict";
  var S = window.SITE || {};
  try { if (new URLSearchParams(location.search).get("preview") === "1") { var dr = localStorage.getItem("build_site_draft"); if (dr) S = JSON.parse(dr); } } catch (e) {}
  var pv = /[?&]preview=1/.test(location.search) ? "?preview=1" : "";
  var here = (location.pathname.split("/").pop() || "index.html").toLowerCase(); if (!/\.html$/.test(here)) here = "index.html";
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function ok(u) { return /^https?:\/\//i.test(u || ""); }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  var css = ".bx-ck{position:fixed;left:12px;right:12px;bottom:12px;z-index:90;max-width:760px;margin:0 auto;background:#0F2A44;color:#fff;border-radius:18px;padding:16px 18px;box-shadow:0 16px 40px rgba(15,42,68,.45);font:15px/1.55 \"IBM Plex Sans Thai\",\"Leelawadee UI\",sans-serif}" +
    ".bx-ck p{margin:0 0 10px}.bx-ck a{color:#FFB98F}.bx-ck .r{display:flex;flex-wrap:wrap;gap:8px}.bx-ck button{border:0;border-radius:999px;padding:9px 18px;font:700 15px/1.2 \"Kanit\",\"Leelawadee UI\",sans-serif;cursor:pointer}" +
    ".bx-ck .a{background:#FF6B1A;color:#fff}.bx-ck .n{background:#fff;color:#0F2A44}" +
    ".bx-ad{border:1px dashed #C9D2DC;border-radius:16px;padding:14px 16px;background:#fff;display:flex;gap:14px;align-items:center;flex-wrap:wrap;margin:18px 0}.bx-ad .tg{font:700 12px/1 \"Kanit\",sans-serif;background:#E8ECF1;color:#475466;border-radius:999px;padding:5px 10px;flex:none}" +
    ".bx-ad img{width:120px;height:auto;border-radius:10px;flex:none}.bx-ad b{display:block;color:#0F2A44;font-size:17px}.bx-ad span{color:#3B4654;font-size:14.5px}.bx-ad a.go{margin-left:auto;background:#0F2A44;color:#fff;text-decoration:none;border-radius:999px;padding:9px 18px;font:700 15px/1.2 \"Kanit\",sans-serif;white-space:nowrap}" +
    ".bx-tb{position:fixed;inset:0;z-index:95;background:rgba(10,20,34,.82);display:grid;place-items:center;padding:16px}.bx-tc{background:#FFFDF6;color:#3A2B05;max-width:560px;width:100%;border-radius:18px;border:3px solid #C9A227;padding:26px 22px 22px;text-align:center;font-family:\"IBM Plex Sans Thai\",\"Leelawadee UI\",sans-serif;box-shadow:0 24px 60px rgba(0,0,0,.5)}" +
    ".bx-tc img{max-width:100%;max-height:46vh;border-radius:10px;margin:0 auto 14px;display:block}.bx-tc h2::before{display:none!important;content:none!important}.bx-tc h2{font:700 34px/1.25 \"Kanit\",\"Leelawadee UI\",sans-serif;margin:0 0 8px;color:#7A5A00}.bx-tc p{margin:4px 0;font-size:17px;line-height:1.6}.bx-tc button{margin-top:16px;background:#7A5A00;color:#fff;border:0;border-radius:999px;padding:10px 26px;font:700 16px/1.2 \"Kanit\",sans-serif;cursor:pointer}" +
    ".bx-tc .en{margin:12px 0 0;padding-top:10px;border-top:1px solid #E6D9A8;color:#5A4510}.bx-tc .en b{display:block;font:700 22px/1.3 \"Kanit\",sans-serif;color:#7A5A00;margin:0 0 2px}.bx-tc .en p{font-size:15px;margin:2px 0}.bx-tc{max-height:94vh;overflow:auto}" +
    ".bx-fa{position:fixed;left:14px;bottom:14px;z-index:80;width:250px;background:#fff;border:1px solid #C9D2DC;border-radius:16px;box-shadow:0 14px 34px rgba(15,42,68,.22);padding:12px 14px 14px;font:14.5px/1.5 \"IBM Plex Sans Thai\",\"Leelawadee UI\",sans-serif;color:#16202B}" +
    ".bx-fa .tg{display:inline-block;font:700 11.5px/1 \"Kanit\",sans-serif;background:#E8ECF1;color:#475466;border-radius:999px;padding:5px 9px}.bx-fa .x{position:absolute;right:6px;top:4px;width:34px;height:34px;border:0;background:none;font-size:22px;line-height:1;color:#475466;cursor:pointer;border-radius:999px}.bx-fa .x:hover{background:#EEF1F5}" +
    ".bx-fa img{display:block;width:100%;height:auto;border-radius:10px;margin:8px 0 0}.bx-fa b{display:block;margin-top:8px;color:#0F2A44;font-size:16px;line-height:1.35}.bx-fa span.t{display:block;color:#3B4654;font-size:13.5px;margin-top:2px}" +
    ".bx-fa a.go{display:block;margin-top:10px;text-align:center;background:#0F2A44;color:#fff;text-decoration:none;border-radius:999px;padding:8px 14px;font:700 14.5px/1.2 \"Kanit\",sans-serif}" +
    ".bx-fa .dots{display:flex;gap:5px;justify-content:center;margin-top:9px}.bx-fa .dots i{width:6px;height:6px;border-radius:99px;background:#C9D2DC}.bx-fa .dots i.on{background:#FF6B1A}" +
    "@media (max-width:860px){.bx-fa{left:8px;right:76px;bottom:8px;width:auto;padding:8px 40px 8px 12px;border-radius:14px}.bx-fa .in{display:grid;grid-template-columns:minmax(0,1fr) auto;grid-template-areas:\"tg go\" \"b go\";column-gap:10px;align-items:center}.bx-fa .tg{grid-area:tg;justify-self:start;font-size:10.5px;padding:3px 8px}.bx-fa img,.bx-fa span.t,.bx-fa .dots{display:none}.bx-fa b{grid-area:b;margin:3px 0 0;font-size:14px;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.bx-fa a.go{grid-area:go;margin:0;padding:8px 12px;font-size:13.5px;white-space:nowrap}.bx-fa .x{top:50%;transform:translateY(-50%);right:2px}}" +
    ".bx-fl{font-size:14px}.bx-fl a,.bx-fl button{color:inherit;text-decoration:underline;background:none;border:0;padding:0;font:inherit;cursor:pointer}" +
    "@media print{.bx-ck,.bx-ad,.bx-tb,.bx-fa{display:none!important}}";
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  // ---------- 1) การยินยอม ----------
  var CK = "build_consent";   // "need" = เฉพาะที่จำเป็น · "all" = ยอมรับสถิติด้วย
  function getC() { try { return localStorage.getItem(CK) || ""; } catch (e) { return ""; } }
  function setC(v) { try { localStorage.setItem(CK, v); localStorage.setItem(CK + "_at", new Date().toISOString()); } catch (e) {} }
  var hasStats = /^G-[A-Z0-9]{6,}$/.test((S.site && S.site.ga4) || "");
  var bar = null;
  function consent(force) {
    if (S.consent && S.consent.on === false) return;
    if (bar) { bar.remove(); bar = null; }
    if (getC() && !force) return;
    var txt = (S.consent && S.consent.text) || "เว็บนี้เก็บข้อมูลในเบราว์เซอร์ของคุณเท่าที่จำเป็นต่อการใช้งาน เช่น การเข้าสู่ระบบสมาชิกและตะกร้า";
    bar = el("div", "bx-ck", "<p>" + esc(txt) + (hasStats ? " และจะเก็บสถิติการเข้าชมแบบไม่ระบุตัวตนก็ต่อเมื่อคุณอนุญาต" : " ไม่มีคุกกี้โฆษณาและไม่มีการติดตามข้ามเว็บ") + ' · <a href="privacy.html' + pv + '">นโยบายความเป็นส่วนตัว</a></p><div class="r">' +
      (hasStats ? '<button type="button" class="n" data-c="need">ยอมรับเฉพาะที่จำเป็น</button><button type="button" class="a" data-c="all">ยอมรับสถิติด้วย</button>' : '<button type="button" class="a" data-c="need">รับทราบ</button>') + "</div>");
    bar.setAttribute("role", "region"); bar.setAttribute("aria-label", "การเก็บข้อมูลในเบราว์เซอร์");
    bar.addEventListener("click", function (ev) { var v = ev.target && ev.target.getAttribute && ev.target.getAttribute("data-c"); if (!v) return; setC(v); bar.remove(); bar = null; if (v === "all" && typeof window.BUILD_GA === "function") window.BUILD_GA(); floatAd(); });
    document.body.appendChild(bar);
  }

  // ---------- 2) พื้นที่โฆษณา ----------
  function ads() {
    var box = document.getElementById("adslot"), A = S.ads || {}; if (!box || A.on === false) return;
    var live = (A.items || []).filter(function (x) { return x && x.on !== false && x.title && ok(x.url); });
    if (live.length) {
      box.innerHTML = live.map(function (x) { return '<div class="bx-ad"><span class="tg">' + esc(x.label || "โฆษณา") + "</span>" + (x.img ? '<img src="' + esc(x.img) + '" alt="" loading="lazy">' : "") + "<div><b>" + esc(x.title) + "</b><span>" + esc(x.text || "") + '</span></div><a class="go" href="' + esc(x.url) + '" target="_blank" rel="sponsored noopener">ดูรายละเอียด →</a></div>'; }).join("");
    } else if (A.pitch && A.pitch.on !== false) {
      var mail = (S.links && S.links.email) || "";
      box.innerHTML = '<div class="bx-ad"><span class="tg">พื้นที่โฆษณา</span><div><b>' + esc(A.pitch.title || "พื้นที่นี้รับโฆษณา") + "</b><span>" + esc(A.pitch.text || "") + "</span></div>" + (mail ? '<a class="go" href="mailto:' + esc(mail) + "?subject=" + encodeURIComponent("สนใจลงโฆษณากับ สร้าง | BUILD TH") + '">ติดต่อลงโฆษณา</a>' : "") + "</div>";
    }
  }

  // ---------- 2b) โฆษณาแบบลอย: เลื่อนตามจอ อยู่มุมล่างซ้าย ไม่ทับเนื้อหา ปิดได้ทุกเมื่อ มีป้ายทุกชิ้น ----------
  // ตั้งค่าที่ data.js → ads.float { on, pages } · ไม่มีโฆษณาจริง = แสดงการ์ด รับโฆษณา · ขึ้นหลังผู้ชมตอบแถบคุกกี้แล้ว เพื่อไม่ให้ซ้อนกัน
  function floatAd() {
    var A = S.ads || {}, F = A.float || {}; if (A.on === false || F.on !== true) return;
    var pages = Array.isArray(F.pages) && F.pages.length ? F.pages : ["index.html", "sheets.html"]; if (pages.indexOf(here) < 0) return;
    if (document.querySelector(".bx-fa")) return;
    if (!(S.consent && S.consent.on === false) && !getC()) return;
    var key = "build_ad_closed"; try { if (sessionStorage.getItem(key)) return; } catch (e) {}
    // แผ่นที่สลับกัน: 1) โฆษณาจริง (ป้าย โฆษณา) 2) ของช่องเอง จาก ads.float.own (ป้าย จากช่องเรา) 3) ประกาศรับโฆษณา (ป้าย พื้นที่โฆษณา)
    var mail = (S.links && S.links.email) || "", slides = [];
    (A.items || []).forEach(function (x) { if (x && x.on !== false && x.float !== false && x.title && ok(x.url)) slides.push({ tag: x.label || "โฆษณา", title: x.title, text: x.text || "", img: x.img || "", href: x.url, cta: "ดูรายละเอียด", out: true, rel: "sponsored noopener" }); });
    (F.own || []).forEach(function (x) {
      if (!x || x.on === false || !x.title) return;
      var pg = /^[a-z0-9_-]+\.html(#[\w-]+)?$/i.test(x.page || "") ? x.page : "", link = S.links && x.link ? S.links[x.link] : "";
      if (pg && pg.split("#")[0].toLowerCase() === here) return;                 // ไม่ชวนไปหน้าที่ผู้ชมอยู่แล้ว
      var href = pg ? pg + pv : (ok(link) ? link : (ok(x.url) ? x.url : "")); if (!href) return;
      slides.push({ tag: "จากช่องเรา", title: x.title, text: x.text || "", img: "", href: href, cta: x.cta || "ดูเลย", out: !pg, rel: "noopener" });
    });
    if (A.pitch && A.pitch.on !== false && mail) slides.push({ tag: "พื้นที่โฆษณา", title: A.pitch.title || "พื้นที่นี้รับโฆษณา", text: A.pitch.text || "", img: "", href: "mailto:" + mail + "?subject=" + encodeURIComponent("สนใจลงโฆษณากับ สร้าง | BUILD TH"), cta: "ติดต่อลงโฆษณา", out: false, rel: "" });
    if (!slides.length) return;
    var box = el("aside", "bx-fa", '<div class="in"></div><button type="button" class="x" aria-label="ปิด">×</button>'); box.setAttribute("aria-label", "โฆษณาและข่าวจากช่อง");
    var inner = box.querySelector(".in"), at = 0, timer = null, hold = false;
    function draw() { var s = slides[at]; inner.innerHTML = '<span class="tg">' + esc(s.tag) + "</span>" + (s.img ? '<img src="' + esc(s.img) + '" alt="" loading="lazy">' : "") + "<b>" + esc(s.title) + '</b><span class="t">' + esc(s.text) + '</span><a class="go" href="' + esc(s.href) + '"' + (s.out ? ' target="_blank"' : "") + (s.rel ? ' rel="' + s.rel + '"' : "") + ">" + esc(s.cta) + "</a>" + (slides.length > 1 ? '<span class="dots">' + slides.map(function (q, i) { return '<i class="' + (i === at ? "on" : "") + '"></i>'; }).join("") + "</span>" : ""); }
    draw();
    if (slides.length > 1) { timer = setInterval(function () { if (hold || document.hidden) return; at = (at + 1) % slides.length; draw(); }, Math.max(5, +F.seconds || 9) * 1000); box.addEventListener("mouseenter", function () { hold = true; }); box.addEventListener("mouseleave", function () { hold = false; }); box.addEventListener("focusin", function () { hold = true; }); box.addEventListener("focusout", function () { hold = false; }); }
    box.querySelector(".x").addEventListener("click", function () { if (timer) clearInterval(timer); box.remove(); try { sessionStorage.setItem(key, "1"); } catch (e) {} });
    // ไม่แสดงโฆษณาหรือข่าวของช่องซ้อนกับหน้าถวายพระพร: รอจนผู้ชมกด เข้าสู่เว็บไซต์ ก่อน
    if (document.querySelector(".bx-tb")) document.addEventListener("build-tribute-closed", function () { document.body.appendChild(box); }, { once: true });
    else document.body.appendChild(box);
  }

  // ---------- 3) หน้าต่างถวายพระพร (ปิดไว้จนกว่าเจ้าของเว็บตรวจข้อความและเปิดเอง) ----------
  // mode "days" = แสดงเฉพาะวันที่กำหนด · mode "always" = แสดงทุกวัน (ครั้งแรกของการเข้าเว็บแต่ละรอบ) ใช้รายการ always
  function tribute() {
    var T = S.tribute || {}; if (T.on !== true || here !== "index.html") return;
    var now = new Date(), md = ("0" + (now.getMonth() + 1)).slice(-2) + "-" + ("0" + now.getDate()).slice(-2);
    var day = (T.days || []).filter(function (d) { return d && d.on !== false && d.from && md >= d.from && md <= (d.to || d.from); })[0];
    if (!day && T.mode === "always" && T.always && T.always.head) day = T.always;
    if (!day) return;
    // ผู้ใช้สั่ง 18 ต.ค. 2026: ขึ้นแค่ครั้งแรกที่เข้าเว็บ (จำในเบราว์เซอร์นั้น) · วันพิเศษที่มีข้อความของวันนั้น ขึ้นอีก 1 ครั้งในวันนั้นของแต่ละปี
    var key = day === T.always ? "build_tribute_seen" : "build_tribute_" + now.getFullYear() + md, store = null;
    try { store = window.localStorage; store.setItem("build_t_test", "1"); store.removeItem("build_t_test"); } catch (e) { try { store = window.sessionStorage; } catch (e2) { store = null; } }
    try { if (store && store.getItem(key)) return; if (store) store.setItem(key, "1"); } catch (e) {}
    var wrap = el("div", "bx-tb", '<div class="bx-tc" role="dialog" aria-modal="true" aria-label="' + esc(day.head || "") + '">' + (day.img ? '<img src="' + esc(day.img) + '" alt="' + esc(day.imgAlt || T.imgAlt || "") + '">' : "") + "<h2>" + esc(day.head || "") + "</h2>" + (day.lines || []).map(function (l) { return "<p>" + esc(l) + "</p>"; }).join("") + (T.sign ? '<p class="sg">' + esc(T.sign).replace("สร้าง | BUILD TH", '<span style="white-space:nowrap">สร้าง | BUILD TH</span>') + "</p>" : "") +
      (day.headEn || (day.linesEn || []).length || T.signEn ? '<div class="en" lang="en">' + (day.headEn ? "<b>" + esc(day.headEn) + "</b>" : "") + (day.linesEn || []).map(function (l) { return "<p>" + esc(l) + "</p>"; }).join("") + (T.signEn ? "<p>" + esc(T.signEn).replace("Srang | BUILD TH", '<span style="white-space:nowrap">Srang | BUILD TH</span>') + "</p>" : "") + "</div>" : "") +
      '<button type="button">' + esc(T.button || "เข้าสู่เว็บไซต์") + "</button></div>");
    function close() { if (!wrap.parentNode) return; wrap.remove(); try { document.dispatchEvent(new Event("build-tribute-closed")); } catch (e) {} }
    wrap.addEventListener("click", function (ev) { if (ev.target.tagName === "BUTTON") close(); }); // ปิดได้ทางปุ่มเข้าสู่เว็บไซต์ (และปุ่ม Esc เพื่อการเข้าถึง) ตามที่ผู้ใช้สั่ง 18 ต.ค.
    document.addEventListener("keydown", function (ev) { if (ev.key === "Escape") close(); });
    document.body.appendChild(wrap); var b = wrap.querySelector("button"); if (b) b.focus();
  }

  // ---------- 4) ลิงก์ท้ายหน้า ----------
  function foot() {
    var w = document.querySelector("footer .wrap"); if (!w || w.querySelector(".bx-fl")) return;
    var mail = (S.links && S.links.email) || "", adOn = !(S.ads && S.ads.on === false);
    var p = el("p", "bx-fl", '<a href="terms.html' + pv + '">ข้อตกลงการใช้งาน</a> · <a href="privacy.html' + pv + '">นโยบายความเป็นส่วนตัว</a>' + (S.consent && S.consent.on === false ? "" : ' · <button type="button" data-ck="1">ตั้งค่าคุกกี้</button>') + (adOn && mail ? ' · <a href="mailto:' + esc(mail) + "?subject=" + encodeURIComponent("สนใจลงโฆษณากับ สร้าง | BUILD TH") + '">ลงโฆษณา</a>' : ""));
    p.addEventListener("click", function (ev) { if (ev.target && ev.target.getAttribute && ev.target.getAttribute("data-ck")) consent(true); });
    // แถวร้านและช่วยเหลือ (24 ต.ค. 2026): เข้าร้าน ตะกร้า บัญชี และช่องทางติดต่อ จากท้ายทุกหน้า
    var L = S.links || {}, shop = Array.isArray(S.sheets) && S.sheets.length;
    var help = [];
    if (shop) help.push('<a href="sheets.html' + pv + '">ร้านใบตรวจงาน</a>', '<a href="cart.html' + pv + '">ตะกร้า</a>', '<a href="member.html' + pv + '">บัญชีของฉัน และคำสั่งซื้อ</a>');
    if (/^https:\/\//.test(L.line || "")) help.push('<a href="' + esc(L.line) + '" target="_blank" rel="noopener">ติดต่อร้านทาง LINE' + (L.lineId ? " " + esc(L.lineId) : "") + "</a>");
    if (mail) help.push('<a href="mailto:' + esc(mail) + '">' + esc(mail) + "</a>");
    if (help.length) w.appendChild(el("p", "bx-fl", help.join(" · ")));
    w.appendChild(p);
  }

  function start() { foot(); ads(); tribute(); consent(false); floatAd(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
