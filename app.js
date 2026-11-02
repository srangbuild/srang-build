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
  // สินค้าฝากขาย (รุ่น 26 ต.ค. 2026): โปรแกรม หนังสือ อีบุ๊ก เทมเพลต · รหัส M-001 · ซื้อผ่านตะกร้าเดียวกัน
  var market = Array.isArray(S.market) ? S.market : [];
  var ST = { wait: "รอชำระ", check: "รอตรวจ", paid: "ชำระแล้ว", reject: "สลิปไม่ผ่าน", cancel: "ยกเลิก" };
  /* หัวข้อที่สมาชิกถามร้านได้ (ตรงกับหลังบ้าน Code.gs ตัวแปร ASK_TOPICS) */
  var ASK = ["คำสั่งซื้อและการชำระเงิน", "ไฟล์และการดาวน์โหลด", "เนื้อหาของใบตรวจงาน", "บัญชีสมาชิก", "เรื่องอื่น"];

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  // ราคา (คำสั่งผู้ใช้ 2 พ.ย. 2026): แสดงตามภาษาที่เลือก แล้ววงเล็บดอลลาร์สหรัฐ · ภาษาอังกฤษแสดงดอลลาร์อย่างเดียว · thb() คือยอดเงินบาทจริงสำหรับหน้าชำระเงิน คำสั่งซื้อ และใบเสร็จ
  // ค่าอื่นนอกจากบาทเป็นค่าประมาณจากอัตราแลกเปลี่ยนล่าสุด · อักขระ U+2068 U+2069 กันทิศทางข้อความในภาษาขวาไปซ้าย และบอก i18n.js ว่านี่คือราคา ไม่ต้องแปล
  function thb(n) { return "฿" + Number(n || 0).toLocaleString("th-TH"); }
  var LANG_CUR = { th: "THB", en: "USD", zh: "CNY", hi: "INR", es: "EUR", fr: "EUR", ar: "SAR", bn: "BDT", pt: "BRL", ru: "RUB", ur: "PKR", id: "IDR", de: "EUR", ja: "JPY", tr: "TRY", sw: "TZS", ta: "INR", vi: "VND", tl: "PHP", ko: "KRW", it: "EUR", nl: "EUR", my: "MMK", ms: "MYR", km: "KHR", lo: "LAK", he: "ILS" };
  var FX0 = { USD:0.029625,CNY:0.197842,INR:2.812735,EUR:0.026545,SAR:0.111091,BDT:3.673813,BRL:0.161063,RUB:2.388268,PKR:8.197044,IDR:536.552651,JPY:4.666575,TRY:1.479806,TZS:78.086048,VND:763.850492,PHP:1.886672,KRW:39.56349,MMK:62.300689,MYR:0.120188,KHR:121.68,LAK:663.212163,GBP:0.0222,ILS:0.109 }, siteLang = "th", FX = FX0; // FX0 = อัตราสำรองวันที่สร้างไฟล์ · ใช้เมื่ออ่านอัตราล่าสุดไม่ได้
  try { siteLang = localStorage.getItem("build_lang") || "th"; var fxs = JSON.parse(localStorage.getItem("build_fx") || "null"); if (fxs && fxs.rates && fxs.rates.USD > 0) FX = fxs.rates; } catch (e) {}
  var RG = window.REGION, LOC = RG && siteLang !== "th" ? RG.loc(siteLang) : siteLang; if (RG && siteLang !== "th" && RG.cur(siteLang)) LANG_CUR[siteLang] = RG.cur(siteLang); /* 3 Nov 2026: the country of the reader sets the currency and date format */
  function fxFmt(v, cur, loc) {
    var nd = /^(USD|GBP|ILS|EUR|BRL|MYR|SAR|CNY|TRY|CAD|AUD|NZD|SGD|HKD|MOP|CHF|AED|QAR|KWD|BHD|OMR|JOD|ZAR|MXN|PEN|BOB|GTQ|DOP|UYU|BND|FJD|SRD|GHS|MAD|TND|EGP|BYN|TJS)$/.test(cur) ? 2 : 0;
    if (!nd) { if (v >= 1000) { var p = Math.pow(10, Math.floor(Math.log(v) / Math.LN10) - 2); v = Math.round(v / p) * p; } else v = Math.round(v); }
    try { return new Intl.NumberFormat(loc + "-u-nu-latn", { style: "currency", currency: cur, currencyDisplay: "narrowSymbol", minimumFractionDigits: nd, maximumFractionDigits: nd }).format(v); }
    catch (e) { return cur + " " + v.toLocaleString("en-US", { minimumFractionDigits: nd, maximumFractionDigits: nd }); }
  }
  function fxOf(n, cur) { var r = +FX[cur] || +FX0[cur]; return r > 0 ? fxFmt(n * r, cur, cur === "USD" ? "en-US" : LOC) : ""; }
  function baht(n) { // ราคาที่แสดงในร้าน
    n = Number(n || 0); if (!n) return thb(0);
    var cur = LANG_CUR[siteLang] || "THB", us = fxOf(n, "USD"), main = cur === "THB" ? thb(n) : fxOf(n, cur) || thb(n);
    return "\u2068" + (cur === "USD" && us ? us : main + (us ? " (" + us + ")" : "")) + "\u2069";
  }
  function thbFx(n) { // ยอดเรียกเก็บจริงเป็นบาท พร้อมค่าประมาณตามภาษา (ใช้ในสรุปยอดหน้าชำระเงิน)
    n = Number(n || 0); if (!n) return thb(0);
    var cur = LANG_CUR[siteLang] || "THB", us = fxOf(n, "USD"), loc = cur === "THB" || cur === "USD" ? "" : fxOf(n, cur);
    return "\u2068" + thb(n) + (loc ? " ≈ " + loc : "") + (us ? " (" + us + ")" : "") + "\u2069";
  }
  (function fxLoad() { // อ่านอัตราล่าสุดจากหลังบ้าน วันละ 2 ครั้ง · ใช้กับหน้าถัดไป ไม่ทำให้หน้าปัจจุบันกระตุก
    var api = window.SITE && window.SITE.member && window.SITE.member.api; if (!/^https:/.test(String(api || "")) || !window.fetch) return;
    var at = 0; try { at = +((JSON.parse(localStorage.getItem("build_fx") || "{}") || {}).at || 0); } catch (e) {} if (Date.now() - at < 432e5) return;
    fetch(api + "?action=fx", { redirect: "follow" }).then(function (r) { return r.json(); }).then(function (j) { if (j && j.ok && j.rates && j.rates.USD > 0) { FX = j.rates; try { localStorage.setItem("build_fx", JSON.stringify({ at: Date.now(), rates: j.rates })); } catch (e) {} } }).catch(function () {});
  })();
  // หมายเหตุราคา: แสดงในหน้าที่มีราคา
  document.addEventListener("DOMContentLoaded", function () {
    var pg = location.pathname.split("/").pop() || "index.html", m = document.getElementById("main"); if (!m || !/^(sheets|product|cart|checkout|market|member)\.html$/.test(pg)) return;
    var p = document.createElement("p"); p.className = "note noprint"; p.style.cssText = "margin:18px 0 0;font-size:13.5px";
    p.appendChild(document.createTextNode("ราคาในวงเล็บและราคาสกุลเงินอื่นเป็นราคาโดยประมาณจากอัตราแลกเปลี่ยนล่าสุด ยอดที่เรียกเก็บจริงแสดงในหน้าชำระเงิน"));
    var a = document.createElement("a"); a.href = "https://www.exchangerate-api.com"; a.target = "_blank"; a.rel = "noopener"; a.textContent = "Rates By Exchange Rate API"; a.setAttribute("data-noi18n", "1");
    p.appendChild(document.createTextNode(" · ")); p.appendChild(a); m.appendChild(p);
  });
  // +U = แบบรับฉบับใหม่ตลอด (คำสั่งผู้ใช้ 23 ต.ค. 2026) · รหัสปกติ = ซื้อฉบับนี้ เก็บได้ตลอด
  function baseOf(id) { return String(id || "").replace(/\+U$/, ""); }
  function isUpd(id) { return /\+U$/.test(String(id || "")); }
  // ฉบับภาษา (โปรเจกต์กำแพง 24 ต.ค. 2026): ไม่มีท้ายรหัส = อังกฤษ + ไทย · .EN = อังกฤษอย่างเดียว · .TH = ไทยอย่างเดียว · ราคาเท่ากัน (ตรงกับหลังบ้าน VARS)
  var LANGS = { "": "อังกฤษ + ไทย", EN: "อังกฤษอย่างเดียว", TH: "ไทยอย่างเดียว" }, LANGS_EN = { "": "English + Thai", EN: "English only", TH: "Thai only" };
  // ฉบับประเทศ (2 พ.ย. 2026): F-05.JP = ภาษาของประเทศนั้น ไทย อังกฤษ + ค่ามาตรฐานและกฎหมายของประเทศนั้นเทียบกับค่าไทย · สร้างจากหน้าเอกสารอัจฉริยะ ไม่มีไฟล์ PDF · ตรงกับหลังบ้าน CTRY · [ชื่อไทย, ชื่ออังกฤษ, ภาษาบนเอกสาร]
  var CTRY = { JP: ["ญี่ปุ่น", "Japan", "日本語"], CN: ["จีน", "China", "中文"], IN: ["อินเดีย", "India", "हिन्दी, தமிழ்"], ES: ["สเปน", "Spain", "Español"], FR: ["ฝรั่งเศส", "France", "Français"], SA: ["ซาอุดีอาระเบีย", "Saudi Arabia", "العربية"], BD: ["บังกลาเทศ", "Bangladesh", "বাংলা"], PT: ["โปรตุเกส", "Portugal", "Português"], BR: ["บราซิล", "Brazil", "Português"], RU: ["รัสเซีย", "Russia", "Русский"], PK: ["ปากีสถาน", "Pakistan", "اردو"], ID: ["อินโดนีเซีย", "Indonesia", "Indonesia"], DE: ["เยอรมนี", "Germany", "Deutsch"], TR: ["ตุรกี", "Turkey", "Türkçe"], TZ: ["แทนซาเนีย", "Tanzania", "Kiswahili"], KE: ["เคนยา", "Kenya", "Kiswahili"], VN: ["เวียดนาม", "Vietnam", "Tiếng Việt"], PH: ["ฟิลิปปินส์", "Philippines", "Tagalog"], KR: ["เกาหลีใต้", "South Korea", "한국어"], IT: ["อิตาลี", "Italy", "Italiano"], NL: ["เนเธอร์แลนด์", "Netherlands", "Nederlands"], MM: ["เมียนมา", "Myanmar", "မြန်မာ"], MY: ["มาเลเซีย", "Malaysia", "Melayu"], KH: ["กัมพูชา", "Cambodia", "ខ្មែរ"], LA: ["ลาว", "Laos", "ລາວ"], SG: ["สิงคโปร์", "Singapore", "English, 中文, Melayu, தமிழ்"], HK: ["ฮ่องกง", "Hong Kong", "中文"], US: ["สหรัฐอเมริกา", "United States", "English, Español"], GB: ["สหราชอาณาจักร", "United Kingdom", "English"], IL: ["อิสราเอล", "Israel", "עברית"] };
  Object.keys(CTRY).forEach(function (k) { LANGS[k] = "ฉบับ" + CTRY[k][0]; LANGS_EN[k] = CTRY[k][1] + " edition"; });
  function docOn() { return P.docOn === true; }
  function isCtry(v) { return !!CTRY[v]; }
  function docPrice(p) { return Math.ceil((+p || 0) * (+P.docFactor || 1.5) / 10) * 10 - 1; }
  function varOf(id) { var m = /\.([A-Z]{2})(\+U)?$/.exec(String(id || "")); return m && LANGS[m[1]] ? m[1] : ""; }
  function rootOf(id) { return baseOf(id).replace(/\.[A-Z]{2}$/, ""); }
  function find0(id) { return allSheets.filter(function (x) { return x.id === id; })[0] || bundles.filter(function (x) { return x.id === id; })[0] || market.filter(function (x) { return x.id === id; })[0] || null; }
  function langsOf(x) { if (!x || isMarket(x)) return [""]; var vs = isBundle(x) ? Object.keys(LANGS).filter(function (v) { return v && x.items.length && x.items.every(function (k) { var s = find0(k); return s && (s.vars || []).indexOf(v) >= 0; }); }) : (x.vars || []).filter(function (v) { return !!LANGS[v]; }); return [""].concat(vs); }
  function find(id) { var b = baseOf(id), hit = find0(b); if (hit) return hit; var v = varOf(b), x = v ? find0(rootOf(b)) : null; if (x && CTRY[v]) return docOn() && x.hidden !== true && !isMarket(x) && (isBundle(x) || /^[FT]-/.test(x.id)) ? x : null; return x && x.hidden !== true && langsOf(x).indexOf(v) > 0 ? x : null; }
  function langLabel(id) { var v = varOf(id); return v ? LANGS[v] : ""; }
  function isMarket(x) { return !!(x && /^M-\d{3}$/.test(String(x.id))); }
  function isBundle(x) { return !!(x && Array.isArray(x.items)); }
  function memberPrice(p) { var d = Math.min(90, Math.max(0, +M.discount || 0)); return Math.max(1, Math.round((+p || 0) * (100 - d) / 100)); }
  // ขายได้เมื่อ: เปิดรับชำระเงิน + รายการนั้นเปิดขาย + ใบตรวจงานผ่านการตรวจรายการแล้ว (ชุดรวม = ทุกใบในชุดผ่านแล้ว)
  function reviewed(x) { if (!x) return false; if (isBundle(x)) return x.items.length > 0 && x.items.every(function (id) { var s = find(id); return !!(s && s.ok === true); }); return x.ok === true; }
  function canSell(x) { return !!(P.on === true && x && x.sale === true && +x.price > 0 && reviewed(x)); }
  function expand(ids) { var o = {}; (ids || []).forEach(function (id) { id = baseOf(id); var v = varOf(id), x = find(id); if (isBundle(x)) x.items.forEach(function (k) { o[k + (v ? "." + v : "")] = 1; }); else if (x) o[id] = 1; }); return Object.keys(o); }

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
    var body = { action: action, token: token.get(), ui: siteLang }; Object.keys(data || {}).forEach(function (k) { body[k] = data[k]; });
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
  function when(iso) {
    var d = new Date(iso); if (!iso || isNaN(d)) return "";
    if (siteLang !== "th") { try { return "⁨" + new Intl.DateTimeFormat(LOC, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false, numberingSystem: "latn" }).format(d) + "⁩"; } catch (e) {} } // 2 พ.ย. 2026: รูปแบบวันที่ของภาษานั้น · อักขระ U+2068 U+2069 บอก i18n.js ว่าไม่ต้องแปล
    return d.getDate() + " " + MON[d.getMonth()] + " " + d.getFullYear() + " " + ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
  }
  function rand(n) { var a = new Uint8Array(n || 16); (window.crypto || window.msCrypto).getRandomValues(a); return Array.prototype.map.call(a, function (b) { return ("0" + b.toString(16)).slice(-2); }).join(""); }

  // ---------- ตะกร้า (เก็บในเบราว์เซอร์เครื่องนี้ จนกว่าจะสร้างคำสั่งซื้อ ไม่มีข้อมูลส่วนตัว) ----------
  // 1 บรรทัด = รหัสสินค้า 1 รายการ · ต่อท้าย +U = แบบรับฉบับใหม่ตลอด (เลือกแยกได้ทีละบรรทัด รุ่น 3 · 24 ต.ค. 2026)
  // กติกา: ใส่ชุดรวมแล้ว ใบเดี่ยวและชุดย่อยที่อยู่ในชุดนั้นจะถูกเอาออก (ไม่จ่ายซ้ำ) · ใบที่อยู่ในชุดซึ่งอยู่ในตะกร้าแล้ว ใส่ซ้ำไม่ได้
  var CK = "build_cart";
  function planOk(id) { var x = find(id); return !!(x && canSell(x) && (!isUpd(id) || +x.priceU > 0)); }
  function unitPrice(id) { var x = find(id); if (!x) return 0; var p = isUpd(id) ? x.priceU : x.price; return memberPrice(CTRY[varOf(id)] ? docPrice(p) : p); }
  var cart = {
    get: function () { try { var a = JSON.parse(localStorage.getItem(CK) || "[]"), seen = {}; return Array.isArray(a) ? a.filter(function (id) { if (typeof id !== "string" || seen[rootOf(id)] || !planOk(id)) return false; seen[rootOf(id)] = 1; return true; }) : []; } catch (e) { return []; } },
    put: function (a) { try { localStorage.setItem(CK, JSON.stringify(a)); } catch (e) {} try { window.dispatchEvent(new Event("build-cart")); } catch (e) {} },
    line: function (id) { var b = rootOf(id); return cart.get().filter(function (k) { return rootOf(k) === b; })[0] || ""; },
    has: function (id) { return !!cart.line(id); },
    covered: function (id) { var b = rootOf(id); return cart.get().some(function (k) { var y = find(k); return isBundle(y) && y.items.indexOf(b) >= 0; }); },
    add: function (id, upd) {
      var b = baseOf(id), want = upd === undefined ? id : b + (upd ? "+U" : ""), x = find(b), r0 = rootOf(id);
      if (!x || !canSell(x)) return "รายการนี้ยังไม่เปิดขาย";
      if (isUpd(want) && !(+x.priceU > 0)) return "รายการนี้ไม่มีแบบรับฉบับใหม่ตลอด";
      var a = cart.get(), cur = cart.line(b);
      if (cur) { if (cur !== want) cart.put(cart.get().map(function (k) { return rootOf(k) === r0 ? want : k; })); return ""; }
      if (!isBundle(x) && cart.covered(r0)) return "ใบนี้อยู่ในชุดที่อยู่ในตะกร้าแล้ว";
      if (isBundle(x)) {
        if (a.some(function (k) { var y = find(k); return isBundle(y) && x.items.every(function (s) { return y.items.indexOf(s) >= 0; }); })) return "ชุดนี้อยู่ในชุดใหญ่ที่อยู่ในตะกร้าแล้ว";
        a = a.filter(function (k) { var y = find(k); return isBundle(y) ? !y.items.every(function (s) { return x.items.indexOf(s) >= 0; }) : x.items.indexOf(rootOf(k)) < 0; });
      }
      a.push(want); cart.put(a); return "";
    },
    setPlan: function (id, upd) { var r0 = rootOf(id), x = find(id); if (upd && !(x && +x.priceU > 0)) return; cart.put(cart.get().map(function (k) { return rootOf(k) === r0 ? baseOf(k) + (upd ? "+U" : "") : k; })); },
    // เปลี่ยนภาษาของบรรทัดในตะกร้า (คำสั่งผู้ใช้ 24 ต.ค. 2026: ในตะกร้าปรับตัวเลือกของสินค้าได้) · ราคาเท่าเดิม
    setLang: function (id, v) { var r0 = rootOf(id), x = find(r0); if (!x || (langsOf(x).indexOf(v || "") < 0 && !CTRY[v])) return; cart.put(cart.get().map(function (k) { return rootOf(k) === r0 ? r0 + (v ? "." + v : "") + (isUpd(k) ? "+U" : "") : k; })); },
    remove: function (id) { var b = rootOf(id); cart.put(cart.get().filter(function (k) { return rootOf(k) !== b; })); },
    clear: function () { cart.put([]); },
    price: unitPrice,
    total: function () { return cart.get().reduce(function (t, id) { return t + unitPrice(id); }, 0); },
    // ส่วนต่างจริงของชุดรวมเทียบกับราคารายใบของใบในชุด แบบเดียวกัน (ใช้บอก ประหยัด ไม่ใช่ราคาขีดฆ่า)
    saving: function (id) { var x = find(id), u = isUpd(id); if (!isBundle(x)) return 0; var s = x.items.reduce(function (t, k) { var y = find(k); var q = y ? (u && +y.priceU > 0 ? y.priceU : y.price) : 0; return t + (y ? memberPrice(CTRY[varOf(id)] ? docPrice(q) : q) : 0); }, 0); return Math.max(0, s - unitPrice(id)); }
  };
  // ชุดรวมที่มีใบนี้ (หน้าสินค้าและตะกร้าใช้แนะนำ ซื้อเป็นชุดถูกกว่า)
  function bundlesOf(id) { var b = rootOf(id); return bundles.filter(function (x) { return x.items.indexOf(b) >= 0; }); }

  function freeEN(x) { return String(x && x.free || "").replace(/_free\.pdf$/, "_free_EN.pdf"); } // ฉบับฟรี 1 ภาษา (คำสั่ง C13): x.free = ไทย · _free_EN = อังกฤษ · ภาษาอื่นสร้างที่ doc.html
  window.BUILD = { thb: thb, thbFx: thbFx, freeEN: freeEN, CTRY: CTRY, isCtry: isCtry, docOn: docOn, docPrice: docPrice, baseOf: baseOf, isUpd: isUpd, rootOf: rootOf, varOf: varOf, langsOf: langsOf, langLabel: langLabel, LANGS: LANGS, LANGS_EN: LANGS_EN, allSheets: allSheets, S: S, M: M, P: P, ST: ST, ASK: ASK,demo: !API, api: API, esc: esc, baht: baht, sheets: sheets, bundles: bundles, find: find, isBundle: isBundle, memberPrice: memberPrice, reviewed: reviewed, canSell: canSell, expand: expand, bundlesOf: bundlesOf, planOk: planOk, market: market, isMarket: isMarket, token: token, call: call, callAdmin: callAdmin, ping: ping, demoMail: demoMail, ensureEmu: ensureEmu, shrink: shrink, saveFile: saveFile, when: when, rand: rand, cart: cart, preview: /[?&]preview=1/.test(location.search) ? "?preview=1" : "" };
})();
// 1 พ.ย. 2026 (Q29, C03): รหัสที่ลูกค้าเห็นต้องตรงกับรหัสบน PDF (เช่น BTH-F05-P) · id ภายในไม่เปลี่ยน · ชุดรวม = BTH-BHO
window.BUILD.code = function (x) { if (!x) return ""; if (x.code) return String(x.code); var id = String(x.id || ""); if (/^[FT]-\d/.test(id)) return "BTH-" + id.replace("-", "") + "-P"; if (x.items) return "BTH-" + id.replace(/-/g, ""); return id; };
