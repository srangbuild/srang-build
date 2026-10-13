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
    ".bx-tc img{max-width:100%;max-height:46vh;border-radius:10px;margin:0 auto 14px;display:block}.bx-tc h2{font:700 34px/1.25 \"Kanit\",\"Leelawadee UI\",sans-serif;margin:0 0 8px;color:#7A5A00}.bx-tc p{margin:4px 0;font-size:17px;line-height:1.6}.bx-tc button{margin-top:16px;background:#7A5A00;color:#fff;border:0;border-radius:999px;padding:10px 26px;font:700 16px/1.2 \"Kanit\",sans-serif;cursor:pointer}" +
    ".bx-fl{font-size:14px}.bx-fl a,.bx-fl button{color:inherit;text-decoration:underline;background:none;border:0;padding:0;font:inherit;cursor:pointer}" +
    "@media print{.bx-ck,.bx-ad,.bx-tb{display:none!important}}";
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
    bar.addEventListener("click", function (ev) { var v = ev.target && ev.target.getAttribute && ev.target.getAttribute("data-c"); if (!v) return; setC(v); bar.remove(); bar = null; if (v === "all" && typeof window.BUILD_GA === "function") window.BUILD_GA(); });
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

  // ---------- 3) หน้าต่างถวายพระพร (ปิดไว้จนกว่าเจ้าของเว็บตรวจข้อความและเปิดเอง) ----------
  function tribute() {
    var T = S.tribute || {}; if (T.on !== true || here !== "index.html") return;
    var now = new Date(), md = ("0" + (now.getMonth() + 1)).slice(-2) + "-" + ("0" + now.getDate()).slice(-2);
    var day = (T.days || []).filter(function (d) { return d && d.on !== false && d.from && md >= d.from && md <= (d.to || d.from); })[0]; if (!day) return;
    var key = "build_tribute_" + now.getFullYear() + md; try { if (sessionStorage.getItem(key)) return; sessionStorage.setItem(key, "1"); } catch (e) {}
    var wrap = el("div", "bx-tb", '<div class="bx-tc" role="dialog" aria-modal="true" aria-label="' + esc(day.head || "") + '">' + (day.img ? '<img src="' + esc(day.img) + '" alt="">' : "") + "<h2>" + esc(day.head || "") + "</h2>" + (day.lines || []).map(function (l) { return "<p>" + esc(l) + "</p>"; }).join("") + (T.sign ? "<p>" + esc(T.sign) + "</p>" : "") + '<button type="button">เข้าสู่เว็บไซต์</button></div>');
    function close() { wrap.remove(); }
    wrap.addEventListener("click", function (ev) { if (ev.target === wrap || ev.target.tagName === "BUTTON") close(); });
    document.addEventListener("keydown", function (ev) { if (ev.key === "Escape") close(); });
    document.body.appendChild(wrap); var b = wrap.querySelector("button"); if (b) b.focus();
  }

  // ---------- 4) ลิงก์ท้ายหน้า ----------
  function foot() {
    var w = document.querySelector("footer .wrap"); if (!w || w.querySelector(".bx-fl")) return;
    var mail = (S.links && S.links.email) || "", adOn = !(S.ads && S.ads.on === false);
    var p = el("p", "bx-fl", '<a href="terms.html' + pv + '">ข้อตกลงการใช้งาน</a> · <a href="privacy.html' + pv + '">นโยบายความเป็นส่วนตัว</a>' + (S.consent && S.consent.on === false ? "" : ' · <button type="button" data-ck="1">ตั้งค่าคุกกี้</button>') + (adOn && mail ? ' · <a href="mailto:' + esc(mail) + "?subject=" + encodeURIComponent("สนใจลงโฆษณากับ สร้าง | BUILD TH") + '">ลงโฆษณา</a>' : ""));
    p.addEventListener("click", function (ev) { if (ev.target && ev.target.getAttribute && ev.target.getAttribute("data-ck")) consent(true); });
    w.appendChild(p);
  }

  function start() { foot(); ads(); tribute(); consent(false); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
