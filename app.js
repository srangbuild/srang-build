/* app.js — ระบบสมาชิก คำสั่งซื้อ และแนบสลิป ของ สร้าง | BUILD TH
   · ใส่ที่อยู่หลังบ้าน (Google Apps Script) ไว้ที่ data.js → member.api แล้วระบบจะต่อกับหลังบ้านจริง
   · ถ้ายังไม่ใส่ = โหมดทดลอง: ข้อมูลอยู่ในเบราว์เซอร์เครื่องนี้เท่านั้น ใช้ดูขั้นตอน ไม่ใช่การสมัครจริง */
(function () {
  "use strict";
  var S = window.SITE || {};
  try { if (new URLSearchParams(location.search).get("preview") === "1") { var dr = localStorage.getItem("build_site_draft"); if (dr) S = JSON.parse(dr); } } catch (e) {}
  var M = S.member || {}, P = S.pay || {};
  var API = /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(M.api || "") ? M.api : "";
  var TK = "build_member_token", DB = "build_demo_db";
  var sheets = Array.isArray(S.sheets) ? S.sheets : [], bundles = Array.isArray(S.bundles) ? S.bundles : [];
  var ST = { wait: "รอชำระ", check: "รอตรวจ", paid: "ชำระแล้ว", reject: "สลิปไม่ผ่าน", cancel: "ยกเลิก" };
  /* หัวข้อที่สมาชิกถามร้านได้ (ตรงกับหลังบ้าน Code.gs ตัวแปร ASK_TOPICS) */
  var ASK = ["คำสั่งซื้อและการชำระเงิน", "ไฟล์และการดาวน์โหลด", "เนื้อหาของใบตรวจงาน", "บัญชีสมาชิก", "เรื่องอื่น"];

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function baht(n) { return "฿" + Number(n || 0).toLocaleString("th-TH"); }
  function find(id) { return sheets.filter(function (x) { return x.id === id; })[0] || bundles.filter(function (x) { return x.id === id; })[0] || null; }
  function isBundle(x) { return !!(x && Array.isArray(x.items)); }
  function memberPrice(p) { var d = Math.min(90, Math.max(0, +M.discount || 0)); return Math.max(1, Math.round((+p || 0) * (100 - d) / 100)); }
  // ขายได้เมื่อ: เปิดรับชำระเงิน + รายการนั้นเปิดขาย + ใบตรวจงานผ่านการตรวจรายการแล้ว (ชุดรวม = ทุกใบในชุดผ่านแล้ว)
  function reviewed(x) { if (!x) return false; if (isBundle(x)) return x.items.length > 0 && x.items.every(function (id) { var s = find(id); return !!(s && s.ok === true); }); return x.ok === true; }
  function canSell(x) { return !!(P.on === true && x && x.sale === true && +x.price > 0 && reviewed(x)); }
  function expand(ids) { var o = {}; (ids || []).forEach(function (id) { var x = find(id); if (isBundle(x)) x.items.forEach(function (k) { o[k] = 1; }); else if (x) o[id] = 1; }); return Object.keys(o); }

  var token = {
    get: function () { try { return localStorage.getItem(TK) || ""; } catch (e) { return ""; } },
    set: function (v) { try { localStorage.setItem(TK, v); } catch (e) {} },
    clear: function () { try { localStorage.removeItem(TK); } catch (e) {} }
  };

  // ---------- ต่อหลังบ้านจริง ----------
  function remote(action, data) {
    var body = { action: action, token: token.get() }; Object.keys(data || {}).forEach(function (k) { body[k] = data[k]; });
    return fetch(API, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(body) })
      .then(function (r) { if (!r.ok) throw new Error("ติดต่อระบบไม่ได้ (" + r.status + ") ลองใหม่อีกครั้ง"); return r.json(); })
      .then(function (j) { if (!j || j.ok !== true) throw new Error((j && j.error) || "ทำรายการไม่สำเร็จ"); return j; });
  }

  // ---------- โหมดทดลอง (เก็บในเครื่องนี้เท่านั้น) ----------
  function load() { try { var d = JSON.parse(localStorage.getItem(DB) || "null"); if (d && d.members) return d; } catch (e) {} return { members: [], orders: [], asks: [], sessions: {}, seq: 0 }; }
  function save(d) { try { localStorage.setItem(DB, JSON.stringify(d)); } catch (e) {} }
  function rnd() { var a = new Uint8Array(16); (window.crypto || window.msCrypto).getRandomValues(a); return Array.prototype.map.call(a, function (b) { return ("0" + b.toString(16)).slice(-2); }).join(""); }
  function sha(t) {
    if (window.crypto && crypto.subtle && window.TextEncoder) return crypto.subtle.digest("SHA-256", new TextEncoder().encode(t)).then(function (b) { return Array.prototype.map.call(new Uint8Array(b), function (x) { return ("0" + x.toString(16)).slice(-2); }).join(""); });
    var h = 5381; for (var i = 0; i < t.length; i++) h = ((h << 5) + h + t.charCodeAt(i)) | 0; return Promise.resolve("x" + (h >>> 0).toString(16));
  }
  function fail(m) { throw new Error(m); }
  function pub(m) { return { name: m.name, email: m.email, line: m.line || "", created: m.created }; }
  function checkReg(a) {
    var name = String(a.name || "").trim(), email = String(a.email || "").trim().toLowerCase(), pass = String(a.pass || "");
    if (name.length < 1 || name.length > 60) fail("กรอกชื่อที่ใช้เรียก (ไม่เกิน 60 ตัวอักษร)");
    if (!/^[a-z0-9][a-z0-9._%+-]*@[a-z0-9.-]+\.[a-z]{2,}$/.test(email) || email.length > 120) fail("อีเมลไม่ถูกรูปแบบ");
    if (pass.length < 8 || pass.length > 72) fail("รหัสผ่านต้องยาว 8–72 ตัวอักษร");
    if (a.consent !== true) fail("ต้องกดยินยอมการเก็บข้อมูลก่อนสมัคร");
    return { name: name, email: email, pass: pass, line: String(a.line || "").trim().slice(0, 40) };
  }
  function demo(action, a) {
    return Promise.resolve().then(function () {
      var d = load(), now = new Date().toISOString();
      var me = function () { var id = d.sessions[a.token || ""]; var m = d.members.filter(function (x) { return x.id === id; })[0]; if (!m) fail("กรุณาเข้าสู่ระบบ"); return m; };
      var mine = function (m) { return d.orders.filter(function (o) { return o.member === m.id; }).sort(function (x, y) { return x.created < y.created ? 1 : -1; }); };
      var owned = function (m) { var ids = []; mine(m).forEach(function (o) { if (o.status === ST.paid) ids = ids.concat(o.items); }); return expand(ids); };
      var view = function (o) { return { id: o.id, created: o.created, items: o.items, amount: o.amount, status: o.status, slipAt: o.slipAt || "", note: o.note || "" }; };
      if (action === "register") {
        var r = checkReg(a); if (d.members.some(function (x) { return x.email === r.email; })) fail("อีเมลนี้สมัครแล้ว ให้เข้าสู่ระบบ");
        var salt = rnd();
        return sha(salt + ":" + r.pass).then(function (h) { var m = { id: "M" + rnd().slice(0, 10), name: r.name, email: r.email, line: r.line, salt: salt, hash: h, created: now }; d.members.push(m); var t = rnd() + rnd(); d.sessions[t] = m.id; save(d); return { ok: true, token: t, member: pub(m) }; });
      }
      if (action === "login") {
        var em = String(a.email || "").trim().toLowerCase(), m0 = d.members.filter(function (x) { return x.email === em; })[0]; if (!m0) fail("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
        return sha(m0.salt + ":" + String(a.pass || "")).then(function (h) { if (h !== m0.hash) fail("อีเมลหรือรหัสผ่านไม่ถูกต้อง"); var t = rnd() + rnd(); d.sessions[t] = m0.id; save(d); return { ok: true, token: t, member: pub(m0) }; });
      }
      if (action === "google") fail("เข้าสู่ระบบด้วย Google ใช้ได้เมื่อเชื่อมหลังบ้านแล้ว");
      if (action === "logout") { delete d.sessions[a.token || ""]; save(d); return { ok: true }; }
      var m = me();
      if (!Array.isArray(d.asks)) d.asks = [];
      var myAsks = function () { return d.asks.filter(function (q) { return q.member === m.id; }).sort(function (x, y) { return x.created < y.created ? 1 : -1; }).map(function (q) { return { id: q.id, created: q.created, topic: q.topic, text: q.text, answer: q.answer || "", answeredAt: q.answeredAt || "" }; }); };
      if (action === "me") return { ok: true, member: pub(m), orders: mine(m).map(view), owned: owned(m), asks: myAsks() };
      if (action === "ask") {
        var tp = String(a.topic || ""), tx = String(a.text || "").replace(/\s+/g, " ").trim();
        if (ASK.indexOf(tp) < 0) fail("เลือกหัวข้อของคำถาม"); if (tx.length < 10 || tx.length > 1000) fail("พิมพ์คำถาม 10–1000 ตัวอักษร");
        if (d.asks.filter(function (q) { return q.member === m.id && !q.answer; }).length >= 3) fail("มีคำถามที่รอคำตอบ 3 ข้อแล้ว รอร้านตอบก่อน");
        d.seq = (d.seq || 0) + 1; d.asks.push({ id: "Q-" + ("000" + d.seq).slice(-4), member: m.id, created: now, topic: tp, text: tx }); save(d); return { ok: true, asks: myAsks() };
      }
      if (action === "demoAnswer") { var q0 = d.asks.filter(function (q) { return q.id === a.ask && q.member === m.id; })[0]; if (!q0) fail("ไม่พบคำถาม"); q0.answer = "ตัวอย่างคำตอบในโหมดทดลอง: เมื่อต่อหลังบ้านแล้ว ร้านพิมพ์คำตอบในชีต asks แล้วคำตอบจะขึ้นที่นี่ และส่งไปที่อีเมลของคุณ"; q0.answeredAt = now; save(d); return { ok: true, asks: myAsks() }; }
      if (action === "passwd") {
        var np = String(a.newPass || ""); if (np.length < 8 || np.length > 72) fail("รหัสผ่านใหม่ต้องยาว 8–72 ตัวอักษร");
        return sha(m.salt + ":" + String(a.pass || "")).then(function (h) { if (h !== m.hash) fail("รหัสผ่านเดิมไม่ถูกต้อง"); var s2 = rnd(); return sha(s2 + ":" + np).then(function (h2) { m.salt = s2; m.hash = h2; save(d); return { ok: true }; }); });
      }
      if (action === "order") {
        var ids = (a.items || []).filter(function (v, i, arr) { return typeof v === "string" && arr.indexOf(v) === i; }); if (!ids.length) fail("เลือกอย่างน้อย 1 รายการ");
        var amt = 0, have = owned(m); ids.forEach(function (id) { var x = find(id); if (!canSell(x)) fail("รายการ " + id + " ยังไม่เปิดขาย"); if (!isBundle(x) && have.indexOf(id) >= 0) fail("คุณมี " + id + " อยู่แล้ว"); amt += memberPrice(x.price); });
        if (mine(m).filter(function (o) { return o.status === ST.wait; }).length >= 3) fail("มีคำสั่งซื้อที่รอชำระ 3 รายการแล้ว ชำระหรือยกเลิกก่อน");
        d.seq = (d.seq || 0) + 1; var t0 = new Date(), o = { id: "BT-" + String(t0.getFullYear()).slice(2) + ("0" + (t0.getMonth() + 1)).slice(-2) + ("0" + t0.getDate()).slice(-2) + "-" + ("00" + d.seq).slice(-3), member: m.id, created: now, items: ids, amount: amt, status: ST.wait };
        d.orders.push(o); save(d); return { ok: true, order: view(o) };
      }
      var od = d.orders.filter(function (o) { return o.id === a.order && o.member === m.id; })[0];
      if (action === "slip") {
        if (!od) fail("ไม่พบคำสั่งซื้อ"); if (od.status !== ST.wait && od.status !== ST.reject) fail("คำสั่งซื้อนี้แนบสลิปไม่ได้แล้ว");
        if (!/^data:image\/(jpeg|png);base64,/.test(a.image || "")) fail("แนบรูปสลิปเป็น JPG หรือ PNG"); if (a.image.length > 1400000) fail("รูปใหญ่เกินไป");
        od.status = ST.check; od.slipAt = now; od.paidAt = String(a.paidAt || "").slice(0, 40); od.slipSize = a.image.length; od.note = ""; save(d); return { ok: true, order: view(od) };
      }
      if (action === "cancel") { if (!od || od.status !== ST.wait) fail("ยกเลิกได้เฉพาะคำสั่งซื้อที่ยังไม่แนบสลิป"); od.status = ST.cancel; save(d); return { ok: true, order: view(od) }; }
      if (action === "demoApprove") { if (!od || od.status !== ST.check) fail("ไม่มีสลิปรอตรวจ"); od.status = ST.paid; save(d); return { ok: true, order: view(od) }; }
      if (action === "download") { var id = String(a.sheet || ""); if (id !== "FREE-ALL" && owned(m).indexOf(id) < 0) fail("ยังไม่มีสิทธิ์เปิดไฟล์นี้"); return { ok: true, demo: true, name: id === "FREE-ALL" ? "BUILD_F-ALL_free.pdf" : "BUILD_" + id + "_pro.pdf" }; }
      if (action === "erase") { d.members = d.members.filter(function (x) { return x.id !== m.id; }); d.orders = d.orders.filter(function (o) { return o.member !== m.id; }); d.asks = d.asks.filter(function (q) { return q.member !== m.id; }); Object.keys(d.sessions).forEach(function (k) { if (d.sessions[k] === m.id) delete d.sessions[k]; }); save(d); return { ok: true }; }
      fail("ไม่รู้จักคำสั่ง");
    });
  }
  function call(action, data) { data = data || {}; if (API) return remote(action, data); var a = { token: token.get() }; Object.keys(data).forEach(function (k) { a[k] = data[k]; }); return demo(action, a); }

  // ย่อรูปสลิปในเครื่องผู้ใช้ก่อนส่ง (ด้านยาวไม่เกิน 1500 จุด JPEG) เพื่อให้ส่งเร็วและไม่เกินขนาด
  function shrink(file) {
    return new Promise(function (res, rej) {
      if (!file || !/^image\/(jpeg|png)$/.test(file.type)) return rej(new Error("แนบรูปสลิปเป็น JPG หรือ PNG"));
      if (file.size > 12 * 1024 * 1024) return rej(new Error("ไฟล์ใหญ่เกิน 12 MB"));
      var fr = new FileReader(); fr.onerror = function () { rej(new Error("อ่านไฟล์ไม่ได้")); };
      fr.onload = function () {
        var im = new Image(); im.onerror = function () { rej(new Error("ไฟล์นี้ไม่ใช่รูปภาพ")); };
        im.onload = function () {
          var k = Math.min(1, 1500 / Math.max(im.width, im.height)), c = document.createElement("canvas"); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
          var g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0, c.width, c.height);
          var q = 0.84, out = c.toDataURL("image/jpeg", q); while (out.length > 1200000 && q > 0.4) { q -= 0.12; out = c.toDataURL("image/jpeg", q); }
          if (out.length > 1300000) return rej(new Error("รูปใหญ่เกินไป ลองถ่ายหน้าจอสลิปใหม่")); res(out);
        };
        im.src = fr.result;
      };
      fr.readAsDataURL(file);
    });
  }
  function saveFile(name, b64, type) { var bin = atob(b64), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([u], { type: type || "application/pdf" })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 4000); }
  function when(iso) { var d = new Date(iso); if (isNaN(d)) return ""; var MON = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."]; return d.getDate() + " " + MON[d.getMonth()] + " " + d.getFullYear() + " " + ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2); }

  // ---------- ตะกร้า (เก็บในเบราว์เซอร์เครื่องนี้ จนกว่าจะสร้างคำสั่งซื้อ ไม่มีข้อมูลส่วนตัว) ----------
  // กติกา: ใส่ชุดรวมแล้ว ใบเดี่ยวและชุดย่อยที่อยู่ในชุดนั้นจะถูกเอาออก (ไม่จ่ายซ้ำ) · ใบที่อยู่ในชุดซึ่งอยู่ในตะกร้าแล้ว ใส่ซ้ำไม่ได้
  var CK = "build_cart";
  var cart = {
    get: function () { try { var a = JSON.parse(localStorage.getItem(CK) || "[]"); return Array.isArray(a) ? a.filter(function (id, i, arr) { return typeof id === "string" && arr.indexOf(id) === i && canSell(find(id)); }) : []; } catch (e) { return []; } },
    put: function (a) { try { localStorage.setItem(CK, JSON.stringify(a)); } catch (e) {} try { window.dispatchEvent(new Event("build-cart")); } catch (e) {} },
    has: function (id) { return cart.get().indexOf(id) >= 0; },
    covered: function (id) { return cart.get().some(function (k) { var b = find(k); return isBundle(b) && b.items.indexOf(id) >= 0; }); },
    add: function (id) {
      var x = find(id); if (!canSell(x)) return "รายการนี้ยังไม่เปิดขาย";
      var a = cart.get(); if (a.indexOf(id) >= 0) return "";
      if (!isBundle(x) && cart.covered(id)) return "ใบนี้อยู่ในชุดที่อยู่ในตะกร้าแล้ว";
      if (isBundle(x)) {
        if (a.some(function (k) { var y = find(k); return isBundle(y) && x.items.every(function (s) { return y.items.indexOf(s) >= 0; }); })) return "ชุดนี้อยู่ในชุดใหญ่ที่อยู่ในตะกร้าแล้ว";
        a = a.filter(function (k) { var y = find(k); return isBundle(y) ? !y.items.every(function (s) { return x.items.indexOf(s) >= 0; }) : x.items.indexOf(k) < 0; });
      }
      a.push(id); cart.put(a); return "";
    },
    remove: function (id) { cart.put(cart.get().filter(function (k) { return k !== id; })); },
    clear: function () { cart.put([]); },
    total: function () { return cart.get().reduce(function (t, id) { return t + memberPrice(find(id).price); }, 0); },
    // ส่วนต่างจริงของชุดรวมเทียบกับราคารายใบของใบในชุด (ใช้บอก ประหยัด ไม่ใช่ราคาขีดฆ่า)
    saving: function (id) { var x = find(id); if (!isBundle(x)) return 0; var s = x.items.reduce(function (t, k) { var y = find(k); return t + (y ? memberPrice(y.price) : 0); }, 0); return Math.max(0, s - memberPrice(x.price)); }
  };

  window.BUILD = { S: S, M: M, P: P, ST: ST, ASK: ASK, demo: !API, esc: esc, baht: baht, sheets: sheets, bundles: bundles, find: find, isBundle: isBundle, memberPrice: memberPrice, reviewed: reviewed, canSell: canSell, expand: expand, token: token, call: call, shrink: shrink, saveFile: saveFile, when: when, cart: cart, preview: /[?&]preview=1/.test(location.search) ? "?preview=1" : "" };
})();
