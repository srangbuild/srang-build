/* mode.js — 21 Nov 2026 (round R3): admin preview of the saved draft, and the maintenance notice.
   Load right after data.js on every public page.
   Preview = ?preview=1 + the admin pass of this tab (sessionStorage build_admin_tok, set by admin.html).
   The back end checks the pass (adminDraft) and only then sends the draft. The draft stays in this tab
   (sessionStorage). No pass, or a pass the back end refuses = live data.
   Local test pages: a build_site_draft whose member.api is the EMULATOR address keeps working as before. */
(function () {
  "use strict";
  var PV = /[?&]preview=1/.test(location.search), TK = "build_admin_tok", DK = "build_pv_site",
    LK = "build_site_draft", MK = "build_maint", NK = "build_pv_msg";
  function store(s, k, v) {
    try {
      if (v === undefined) return s.getItem(k);
      if (v === null) s.removeItem(k);
      else s.setItem(k, v);
    } catch (e) {}
    return null;
  }
  function ss(k, v) {
    try {
      return store(window.sessionStorage, k, v);
    } catch (e) {
      return null;
    }
  }
  function ls(k, v) {
    try {
      return store(window.localStorage, k, v);
    } catch (e) {
      return null;
    }
  }
  function json(t) {
    try {
      return JSON.parse(t || "null");
    } catch (e) {
      return null;
    }
  }
  function emuApi(o) {
    var a = o && o.member && o.member.api;
    return typeof a === "string" && a.indexOf("/EMULATOR/") > 0;
  }
  var mode = window.SITE_MODE = { preview: false, tok: "", maint: null, at: "", who: "" }, C = null;
  if (PV) {
    /* build_site_draft must stay a plain site object (app.js reads it as is) · build_pv_flag = it holds a preview copy now · build_pv_dev = the test-page draft it replaced */
    var tok = ss(TK) || "", L = json(ls(LK)), dev = null;
    if (ls("build_pv_flag") === "1") dev = json(ls("build_pv_dev"));
    else if (L) {
      if (emuApi(L.data || L)) dev = L;
      else ls(LK + "_old", JSON.stringify(L)); /* an old admin working copy: kept aside, never shown */
    }
    C = json(ss(DK));
    mode.tok = tok;
    if (tok && C && C.data) {
      var d = C.data, dd = dev && (dev.data || dev);
      if (dd && dd.member) {
        d = JSON.parse(JSON.stringify(d));
        d.member = d.member || {};
        d.member.api = dd.member.api; /* local test pages keep the emulator back end */
      }
      window.SITE = d;
      ls(LK, JSON.stringify(d)); /* the pages read the preview data from here */
      ls("build_pv_flag", "1");
      ls("build_pv_dev", dev ? JSON.stringify(dev) : null);
      mode.preview = true;
      mode.at = C.at || "";
      mode.who = C.who || "";
    }
    else {
      ls(LK, dev ? JSON.stringify(dev) : null);
      ls("build_pv_flag", null);
      ls("build_pv_dev", null);
    }
  }

  function api() {
    var a = (window.SITE && window.SITE.member && window.SITE.member.api) || "";
    return /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(a) && a.indexOf("/EMULATOR/") < 0 ? a : "";
  }
  function adminCall(action, data) {
    var B = window.BUILD;
    if (B && B.callAdmin) return B.callAdmin(action, data, "");
    var u = api();
    if (!u) return Promise.reject(new Error("ไม่มีหลังบ้าน"));
    data.action = action;
    return fetch(u, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(data) })
      .then(function (r) {
        return r.json();
      }).then(function (j) {
        if (!j || j.ok !== true) throw new Error((j && j.error) || "ทำรายการไม่สำเร็จ");
        return j;
      });
  }
  function reload(msg) {
    ss(NK, msg || null);
    var n = +(ss("build_pv_reload") || 0);
    if (Date.now() - n < 8000) { /* never loop */
      mode.note = (msg ? msg + " · " : "") + "โหลดหน้านี้ใหม่อีกครั้ง";
      return draw();
    }
    ss("build_pv_reload", String(Date.now()));
    location.reload();
  }
  function parse(t) {
    return JSON.parse(String(t).replace(/^﻿/, "").trim().replace(/^window\.SITE\s*=\s*/, "").replace(/;\s*$/, ""));
  }
  function refresh() {
    if (!PV) return;
    if (!mode.tok) return draw();
    adminCall("adminDraft", { adminToken: mode.tok, text: 1 }).then(function (r) {
      if (!r.draft || !r.text) {
        ss(DK, null);
        if (mode.preview) return reload("ยังไม่มีร่างบนหลังบ้าน");
        mode.note = "ยังไม่มีร่างบนหลังบ้าน";
        return draw();
      }
      var key = r.draft.at + "|" + r.text.length;
      if (C && C.key === key && mode.preview) return draw();
      ss(DK, JSON.stringify({ key: key, at: r.draft.at, who: r.draft.who, data: parse(r.text) }));
      reload();
    }).catch(function (e) {
      ss(DK, null);
      if (mode.preview) return reload(e.message);
      mode.note = e.message || "";
      draw();
    });
  }
  function checkMaint() {
    var c = json(ss(MK));
    if (c && Date.now() - c.t < 120000) return setMaint(c.m);
    var B = window.BUILD, p = B && B.ping ? B.ping() : api() ? fetch(api()).then(function (r) {
      return r.json();
    }) : null;
    if (!p) return;
    p.then(function (j) {
      var m = (j && j.maint) || { on: false };
      ss(MK, JSON.stringify({ t: Date.now(), m: m }));
      setMaint(m);
    }).catch(function () {});
  }
  function setMaint(m) {
    mode.maint = m && m.on ? m : { on: false };
    document.documentElement.classList.toggle("maint", !!mode.maint.on && !mode.preview);
    draw();
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function when(iso) {
    var d = new Date(iso);
    return isNaN(d) ? "" : d.toLocaleString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  }
  function draw() {
    var m = mode.maint || {}, html = "", bg = "";
    if (PV && mode.preview) {
      bg = "#1f6f43";
      html = "<b>โหมดพรีวิว · ลูกค้าไม่เห็นหน้านี้</b> · ข้อมูลจากร่างที่บันทึก " + esc(when(mode.at)) + (mode.who ? " โดย " + esc(mode.who) : "")
        + (m.on ? " · เว็บจริงปิดปรับปรุงอยู่ ลูกค้าเห็นป้ายปิดปรับปรุง" : "")
        + ' · <a href="' + esc(location.pathname + location.search.replace(/([?&])preview=1&?/, "$1").replace(/[?&]$/, "") + location.hash) + '">ออกจากพรีวิว</a>';
    }
    else if (PV) {
      bg = "#5a5a5a";
      var why = mode.note || ss(NK) || (mode.tok ? "กำลังตรวจสิทธิ์…" : "เปิดจากปุ่ม ดูตัวอย่าง ในหน้าหลังบ้านหลังเข้าสู่ระบบ");
      html = "<b>ไม่ใช่พรีวิว: หน้านี้แสดงข้อมูลจริง</b> · " + esc(why);
    }
    else if (m.on) {
      bg = "#8a1c1c";
      html = "<b>ปิดปรับปรุงชั่วคราว</b>" + (m.back ? " · กลับมา " + esc(m.back) : "") + (m.msg ? " · " + esc(m.msg) : "")
        + " · ยังสั่งซื้อและชำระเงินไม่ได้ · ลูกค้าเดิมเข้าสู่ระบบ ดูคำสั่งซื้อ ใบเสร็จ และดาวน์โหลดเอกสารที่ซื้อแล้วได้ตามปกติ";
    }
    var el = document.getElementById("site-mode");
    if (!html) {
      if (el) el.remove();
      return;
    }
    if (!document.body) return;
    if (!el) {
      el = document.createElement("div");
      el.id = "site-mode";
      el.setAttribute("role", "status");
      document.body.insertBefore(el, document.body.firstChild);
      var st = document.createElement("style");
      st.textContent = "#site-mode{position:sticky;top:0;z-index:10000;color:#fff;font:14px/1.5 system-ui,sans-serif;padding:8px 16px;text-align:center;overflow-wrap:anywhere}#site-mode a{color:#fff;text-decoration:underline}@media print{#site-mode{display:none}}";
      document.head.appendChild(st);
    }
    el.style.background = bg;
    el.innerHTML = html;
  }
  /* 21 Nov 2026 (owner Q62): pages with <body data-admin-only="1"> (laws.html, k-std-sources.html) are for admins only
     while data.js has scope 3ed. nav.css hides #main until body has class adm-ok, so the page stays closed if this
     script fails. The back end checks the admin pass of this tab (adminDraft); a missing or refused pass keeps it closed.
     The data files of these pages stay public; this hides the pages, it does not protect secrets. */
  var GATE_T = "หน้านี้ยังไม่เปิดให้บริการ", GATE_P = "ข้อมูลกฎหมายและมาตรฐานรายประเทศอยู่ระหว่างตรวจ ตอนนี้เปิดให้ดูเฉพาะผู้ดูแลระบบ",
    GATE_W = "กำลังตรวจสิทธิ์ผู้ดูแลระบบ", GATE_N = "สิทธิ์ผู้ดูแลระบบหมดอายุหรือไม่ถูกต้อง เข้าสู่ระบบในหน้าหลังบ้านแล้วเปิดหน้านี้อีกครั้ง";
  function gate() {
    var b = document.body, R = window.REGION;
    if (!b || b.getAttribute("data-admin-only") !== "1") return;
    if (!(R && R.scope3 && R.scope3())) {
      b.classList.add("adm-ok");
      return;
    }
    var robots = document.createElement("meta");
    robots.name = "robots";
    robots.content = "noindex";
    document.head.appendChild(robots);
    var box = document.createElement("section"), main = document.getElementById("main"), tok = ss(TK) || "";
    box.id = "admin-gate";
    box.className = "wrap";
    box.setAttribute("role", "status");
    box.style.cssText = "max-width:720px;margin:48px auto;padding:0 20px";
    box.innerHTML = "<h1>" + esc(GATE_T) + "</h1><p>" + esc(tok ? GATE_W : GATE_P) + '</p><p><a href="knowledge.html">ความรู้ทั้งหมด</a> · <a href="sheets.html">ใบตรวจงาน</a></p>';
    if (main && main.parentNode) main.parentNode.insertBefore(box, main);
    else b.appendChild(box);
    if (!tok) return;
    adminCall("adminDraft", { adminToken: tok }).then(function () {
      box.remove();
      b.classList.add("adm-ok");
    }).catch(function () {
      box.querySelector("p").textContent = GATE_N;
    });
  }
  function start() {
    gate();
    draw();
    refresh();
    checkMaint();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
