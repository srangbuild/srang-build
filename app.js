/* app.js — ระบบสมาชิก คำสั่งซื้อ และแนบสลิป ของ สร้าง | BUILD TH (รุ่น 2 · 18 ต.ค. 2026)
   · ใส่ที่อยู่หลังบ้าน (Google Apps Script) ไว้ที่ data.js → member.api แล้วระบบจะต่อกับหลังบ้านจริง
   · ถ้ายังไม่ใส่ = โหมดทดลอง: รันโค้ดหลังบ้านตัวจริง (demo/code_gs.js) ในเบราว์เซอร์เครื่องนี้ ผ่านตัวจำลอง demo/gas_emu.js
     ข้อมูลอยู่ในเบราว์เซอร์เครื่องนี้เท่านั้น ไม่ส่งออกไปที่ใด ใช้ดูและทดสอบขั้นตอน ไม่ใช่การสมัครจริง */
(function () {
  "use strict";
  var S = window.SITE || {};
  try { if (new URLSearchParams(location.search).get("preview") === "1") { var dr = localStorage.getItem("build_site_draft"); if (dr) S = JSON.parse(dr); } } catch (e) {}
  var M = S.member || {}, P = S.pay || {};
  var API_RX = /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/;
  var API = API_RX.test(M.api || "") && M.api.indexOf("/EMULATOR/") < 0 ? M.api : "";
  var EMU_API = "https://script.google.com/macros/s/EMULATOR/exec", EMU_KEY = "emu-admin-key-0123456789abcdef0123456789";
  var TK = "build_member_token";
  // hidden = รายการทดสอบระบบ (เช่น X-05 ราคา 1 บาท) ไม่แสดงในรายการของหน้าร้าน แต่ find() ยังหาเจอ เมื่อเปิดลิงก์ ?buy=X-05 ของเจ้าของร้าน
  var allSheets = Array.isArray(S.sheets) ? S.sheets : [], sheets = allSheets.filter(function (x) { return x.hidden !== true; }), bundles = Array.isArray(S.bundles) ? S.bundles : [];
  var ST = { wait: "รอชำระ", check: "รอตรวจ", paid: "ชำระแล้ว", reject: "สลิปไม่ผ่าน", cancel: "ยกเลิก" };
  /* หัวข้อที่สมาชิกถามร้านได้ (ตรงกับหลังบ้าน Code.gs ตัวแปร ASK_TOPICS) */
  var ASK = ["คำสั่งซื้อและการชำระเงิน", "ไฟล์และการดาวน์โหลด", "เนื้อหาของใบตรวจงาน", "บัญชีสมาชิก", "เรื่องอื่น"];

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function baht(n) { return "฿" + Number(n || 0).toLocaleString("th-TH"); }
  // +U = แบบรับฉบับใหม่ตลอด (คำสั่งผู้ใช้ 23 ต.ค. 2026) · รหัสปกติ = ซื้อฉบับนี้ เก็บได้ตลอด
  function baseOf(id) { return String(id || "").replace(/\+U$/, ""); }
  function isUpd(id) { return /\+U$/.test(String(id || "")); }
  function find(id) { id = baseOf(id); return allSheets.filter(function (x) { return x.id === id; })[0] || bundles.filter(function (x) { return x.id === id; })[0] || null; }
  function isBundle(x) { return !!(x && Array.isArray(x.items)); }
  function memberPrice(p) { var d = Math.min(90, Math.max(0, +M.discount || 0)); return Math.max(1, Math.round((+p || 0) * (100 - d) / 100)); }
  // ขายได้เมื่อ: เปิดรับชำระเงิน + รายการนั้นเปิดขาย + ใบตรวจงานผ่านการตรวจรายการแล้ว (ชุดรวม = ทุกใบในชุดผ่านแล้ว)
  function reviewed(x) { if (!x) return false; if (isBundle(x)) return x.items.length > 0 && x.items.every(function (id) { var s = find(id); return !!(s && s.ok === true); }); return x.ok === true; }
  function canSell(x) { return !!(P.on === true && x && x.sale === true && +x.price > 0 && reviewed(x)); }
  function expand(ids) { var o = {}; (ids || []).forEach(function (id) { id = baseOf(id); var x = find(id); if (isBundle(x)) x.items.forEach(function (k) { o[k] = 1; }); else if (x) o[id] = 1; }); return Object.keys(o); }

  var token = {
    get: function () { try { return localStorage.getItem(TK) || ""; } catch (e) { return ""; } },
    set: function (v) { try { localStorage.setItem(TK, v); } catch (e) {} },
    clear: function () { try { localStorage.removeItem(TK); } catch (e) {} }
  };

  // ---------- โหมดทดลอง: โหลดตัวจำลองและโค้ดหลังบ้านตัวจริงครั้งเดียว ----------
  var here = (document.currentScript && document.currentScript.src) ? document.currentScript.src.replace(/[^\/]*$/, "") : "";
  var emuReady = null;
  function loadScript(src) { return new Promise(function (res, rej) { var s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = function () { rej(new Error("โหลดโหมดทดลองไม่สำเร็จ")); }; document.head.appendChild(s); }); }
  function ensureEmu() {
    if (!emuReady) emuReady = (window.EMU && window.doPost ? Promise.resolve() : loadScript(here + "demo/gas_emu.js").then(function () { return loadScript(here + "demo/code_gs.js"); })).then(function () { window.EMU.install(); });
    return emuReady;
  }

  // ---------- ต่อหลังบ้าน ----------
  function post(url, body) {
    return fetch(url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(body) })
      .then(function (r) { if (!r.ok) throw new Error("ติดต่อระบบไม่ได้ (" + r.status + ") ลองใหม่อีกครั้ง"); return r.json(); })
      .then(function (j) { if (!j || j.ok !== true) throw new Error((j && j.error) || "ทำรายการไม่สำเร็จ"); return j; });
  }
  function call(action, data) {
    var body = { action: action, token: token.get() }; Object.keys(data || {}).forEach(function (k) { body[k] = data[k]; });
    if (API) return post(API, body);
    return ensureEmu().then(function () { return post(EMU_API, body); });
  }
  // หน้าหลังบ้าน (admin.html) เรียกด้วยรหัสหลังบ้าน · โหมดทดลองใช้รหัสของตัวจำลอง
  function callAdmin(action, data, key) {
    var body = { action: action }; Object.keys(data || {}).forEach(function (k) { body[k] = data[k]; });
    if (API) { body.adminKey = key || ""; return post(API, body); }
    body.adminKey = EMU_KEY; return ensureEmu().then(function () { return post(EMU_API, body); });
  }
  function ping() { if (!API) return ensureEmu().then(function () { return JSON.parse(window.doGet({}).getContent()); }); return fetch(API).then(function (r) { return r.json(); }); }
  // โหมดทดลอง: อ่านอีเมลที่ระบบจำลองส่ง (ใช้ดูรหัสลืมรหัสผ่าน)
  function demoMail(to) { if (API || !window.EMU) return null; var all = window.EMU.mails().filter(function (m) { return m.to === to; }); return all.length ? all[all.length - 1] : null; }

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
  var MON = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  function when(iso) { var d = new Date(iso); if (!iso || isNaN(d)) return ""; return d.getDate() + " " + MON[d.getMonth()] + " " + d.getFullYear() + " " + ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2); }
  function rand(n) { var a = new Uint8Array(n || 16); (window.crypto || window.msCrypto).getRandomValues(a); return Array.prototype.map.call(a, function (b) { return ("0" + b.toString(16)).slice(-2); }).join(""); }

  // ---------- ตะกร้า (เก็บในเบราว์เซอร์เครื่องนี้ จนกว่าจะสร้างคำสั่งซื้อ ไม่มีข้อมูลส่วนตัว) ----------
  // 1 บรรทัด = รหัสสินค้า 1 รายการ · ต่อท้าย +U = แบบรับฉบับใหม่ตลอด (เลือกแยกได้ทีละบรรทัด รุ่น 3 · 24 ต.ค. 2026)
  // กติกา: ใส่ชุดรวมแล้ว ใบเดี่ยวและชุดย่อยที่อยู่ในชุดนั้นจะถูกเอาออก (ไม่จ่ายซ้ำ) · ใบที่อยู่ในชุดซึ่งอยู่ในตะกร้าแล้ว ใส่ซ้ำไม่ได้
  var CK = "build_cart";
  function planOk(id) { var x = find(id); return !!(x && canSell(x) && (!isUpd(id) || +x.priceU > 0)); }
  function unitPrice(id) { var x = find(id); return x ? memberPrice(isUpd(id) ? x.priceU : x.price) : 0; }
  var cart = {
    get: function () { try { var a = JSON.parse(localStorage.getItem(CK) || "[]"), seen = {}; return Array.isArray(a) ? a.filter(function (id) { if (typeof id !== "string" || seen[baseOf(id)] || !planOk(id)) return false; seen[baseOf(id)] = 1; return true; }) : []; } catch (e) { return []; } },
    put: function (a) { try { localStorage.setItem(CK, JSON.stringify(a)); } catch (e) {} try { window.dispatchEvent(new Event("build-cart")); } catch (e) {} },
    line: function (id) { var b = baseOf(id); return cart.get().filter(function (k) { return baseOf(k) === b; })[0] || ""; },
    has: function (id) { return !!cart.line(id); },
    covered: function (id) { var b = baseOf(id); return cart.get().some(function (k) { var y = find(k); return isBundle(y) && y.items.indexOf(b) >= 0; }); },
    add: function (id, upd) {
      var b = baseOf(id), want = upd === undefined ? id : b + (upd ? "+U" : ""), x = find(b);
      if (!x || !canSell(x)) return "รายการนี้ยังไม่เปิดขาย";
      if (isUpd(want) && !(+x.priceU > 0)) return "รายการนี้ไม่มีแบบรับฉบับใหม่ตลอด";
      var a = cart.get(), cur = cart.line(b);
      if (cur) { if (cur !== want) cart.setPlan(b, isUpd(want)); return ""; }
      if (!isBundle(x) && cart.covered(b)) return "ใบนี้อยู่ในชุดที่อยู่ในตะกร้าแล้ว";
      if (isBundle(x)) {
        if (a.some(function (k) { var y = find(k); return isBundle(y) && x.items.every(function (s) { return y.items.indexOf(s) >= 0; }); })) return "ชุดนี้อยู่ในชุดใหญ่ที่อยู่ในตะกร้าแล้ว";
        a = a.filter(function (k) { var y = find(k); return isBundle(y) ? !y.items.every(function (s) { return x.items.indexOf(s) >= 0; }) : x.items.indexOf(baseOf(k)) < 0; });
      }
      a.push(want); cart.put(a); return "";
    },
    setPlan: function (id, upd) { var b = baseOf(id), x = find(b); if (upd && !(x && +x.priceU > 0)) return; cart.put(cart.get().map(function (k) { return baseOf(k) === b ? b + (upd ? "+U" : "") : k; })); },
    remove: function (id) { var b = baseOf(id); cart.put(cart.get().filter(function (k) { return baseOf(k) !== b; })); },
    clear: function () { cart.put([]); },
    price: unitPrice,
    total: function () { return cart.get().reduce(function (t, id) { return t + unitPrice(id); }, 0); },
    // ส่วนต่างจริงของชุดรวมเทียบกับราคารายใบของใบในชุด แบบเดียวกัน (ใช้บอก ประหยัด ไม่ใช่ราคาขีดฆ่า)
    saving: function (id) { var x = find(id), u = isUpd(id); if (!isBundle(x)) return 0; var s = x.items.reduce(function (t, k) { var y = find(k); return t + (y ? memberPrice(u && +y.priceU > 0 ? y.priceU : y.price) : 0); }, 0); return Math.max(0, s - unitPrice(id)); }
  };
  // ชุดรวมที่มีใบนี้ (หน้าสินค้าและตะกร้าใช้แนะนำ ซื้อเป็นชุดถูกกว่า)
  function bundlesOf(id) { var b = baseOf(id); return bundles.filter(function (x) { return x.items.indexOf(b) >= 0; }); }

  window.BUILD = { baseOf: baseOf, isUpd: isUpd, allSheets: allSheets, S: S, M: M, P: P, ST: ST, ASK: ASK,demo: !API, api: API, esc: esc, baht: baht, sheets: sheets, bundles: bundles, find: find, isBundle: isBundle, memberPrice: memberPrice, reviewed: reviewed, canSell: canSell, expand: expand, bundlesOf: bundlesOf, planOk: planOk, token: token, call: call, callAdmin: callAdmin, ping: ping, demoMail: demoMail, ensureEmu: ensureEmu, shrink: shrink, saveFile: saveFile, when: when, rand: rand, cart: cart, preview: /[?&]preview=1/.test(location.search) ? "?preview=1" : "" };
})();
