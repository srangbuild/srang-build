/* pay.js — ชำระเงินออนไลน์ผ่าน Opn Payments ใช้ร่วมกันหลายหน้า (หน้าชำระเงิน checkout.html) · โหลดหลัง app.js
   · บัตร: ฟอร์มของ Opn (Omise.js) สร้าง token ในเครื่องลูกค้า เลขบัตรไม่ผ่านเว็บร้าน
   · พร้อมเพย์: หลังบ้านสร้างคิวอาร์ของคำสั่งซื้อนี้ หน้าเว็บตรวจผลทุก 5 วินาที
   · ทรูมันนี่ และบัตรที่ต้องยืนยันตัวตน (3-D Secure): ไปหน้ายืนยันของผู้ให้บริการ แล้วกลับมาที่หน้าเดิมพร้อม ?pay=เลขคำสั่งซื้อ
   หลังบ้านตรวจผลกับ Opn เองทุกครั้ง ไม่เชื่อผลจากเบราว์เซอร์ */
(function () {
  "use strict";
  var B = window.BUILD; if (!B) return;
  var esc = B.esc, P = B.P;
  var LABEL = { card: ["บัตรเครดิต / เดบิต", "Visa Mastercard JCB ของไทยและต่างประเทศ"], promptpay: ["พร้อมเพย์", "สแกนคิวอาร์ด้วยแอปธนาคาร ยอดขึ้นเอง"], truemoney_jumpapp: ["ทรูมันนี่", "จ่ายผ่านแอป TrueMoney"] };
  var watch = null, omiseReady = null;

  // วิธีชำระออนไลน์ที่ใช้ได้: หลังบ้านเปิด (me.pay) และร้านเลือกไว้ใน data.js (pay.methods)
  function methods(me) { var on = (me && me.pay && me.pay.methods) || [], want = Array.isArray(P.methods) && P.methods.length ? P.methods : Object.keys(LABEL); return want.filter(function (k) { return LABEL[k] && on.indexOf(k) >= 0; }); }
  // โหมดทดสอบของ Opn กับหลังบ้านรุ่นเก่า (ไม่มี guard): ซ่อนการชำระออนไลน์ เพราะบัตรทดสอบที่เผยแพร่ "ชำระผ่าน" ได้โดยไม่มีเงินจริง
  function online(me) { var p = me && me.pay; return !!(p && p.opn && (B.demo || /^pkey_/.test(String(P.opnKey || ""))) && !(p.test && !p.guard && !B.demo) && methods(me).length); }
  function minOnline(me) { return +(me && me.minOnline) || 20; }

  function omiseLoad() {
    if (omiseReady) return omiseReady;
    omiseReady = new Promise(function (res, rej) {
      if (window.OmiseCard) return res(window.OmiseCard);
      var s = document.createElement("script"); s.src = "https://cdn.omise.co/omise.js"; s.async = true;
      s.onload = function () { if (window.OmiseCard) res(window.OmiseCard); else { omiseReady = null; rej(new Error("โหลดระบบชำระเงินไม่สำเร็จ ลองใหม่อีกครั้ง")); } };
      s.onerror = function () { omiseReady = null; rej(new Error("โหลดระบบชำระเงินไม่สำเร็จ ตรวจอินเทอร์เน็ตแล้วลองใหม่")); };
      document.head.appendChild(s);
    });
    return omiseReady;
  }

  // ui = { lock(on), paid(result), msg(text, bad), back: "checkout" }
  function start(order, method, ui) {
    ui = ui || {};
    var done = function (r) { return finish(order, r, ui); };
    if (B.demo) { // โหมดทดลอง: ตัวจำลองของ Opn ตอบแทน (บัตร = ผ่านทันที · พร้อมเพย์ = คิวอาร์ทดลอง · ทรูมันนี่ = ไปหน้ายืนยันแล้วกลับมา)
      var n = method === "card" ? "tokn_test_emuok" : method === "promptpay" ? "src_test_emupromptpay" : "src_test_emutruemoney";
      return charge(order, n + B.rand(4), ui).then(done);
    }
    if (ui.lock) ui.lock(true);
    return omiseLoad().then(function (OC) {
      if (ui.lock) ui.lock(false);
      return new Promise(function (res) {
        OC.configure({ publicKey: P.opnKey, currency: "THB", frameLabel: "สร้าง | BUILD TH", frameDescription: "คำสั่งซื้อ " + order.id, submitLabel: "ชำระเงิน", buttonLabel: "ชำระเงิน", locale: "th", image: new URL("img/logo.png", location.href).href });
        OC.open({ amount: Math.round(order.amount * 100), currency: "THB", defaultPaymentMethod: method === "card" ? "credit_card" : method, otherPaymentMethods: "",
          onCreateTokenSuccess: function (nonce) { res(charge(order, nonce, ui).then(done)); }, onFormClosed: function () { res(null); } });
      });
    }).catch(function (e) { if (ui.lock) ui.lock(false); if (ui.msg) ui.msg(e.message, true); });
  }
  function charge(order, nonce, ui) {
    if (ui.lock) ui.lock(true);
    return B.call("payStart", { order: order.id, nonce: nonce, ret: ui.back || "" }).then(function (r) { if (ui.lock) ui.lock(false); return r; }, function (e) { if (ui.lock) ui.lock(false); throw e; });
  }
  function finish(order, r, ui) {
    if (!r) return null;
    if (r.status === "successful") { if (ui.paid) ui.paid(r); return r; }
    if (r.authorizeUri) { try { sessionStorage.setItem("build_pay_wait", order.id); sessionStorage.setItem("build_pay_from", ui.back || ""); } catch (e) {} location.href = r.authorizeUri; return r; }
    if (r.qr || r.method === "promptpay") { qr(order, r, ui); return r; }
    if (ui.msg) ui.msg(r.message || "ชำระไม่สำเร็จ ลองใหม่อีกครั้ง หรือเลือกวิธีอื่น", true);
    return r;
  }
  function stop() { if (watch) { clearInterval(watch.t); watch = null; } var m = document.getElementById("paymodal"); if (m) m.remove(); document.body.style.overflow = ""; }
  function check(oid) { return B.call("payCheck", { order: oid }); }
  function qr(order, r, ui) {
    stop();
    var d = document.createElement("div"); d.id = "paymodal"; d.className = "modal"; d.setAttribute("role", "dialog"); d.setAttribute("aria-modal", "true"); d.setAttribute("aria-label", "สแกนคิวอาร์พร้อมเพย์");
    d.innerHTML = '<div class="mbox"><h2 style="margin:0 0 4px">สแกนจ่ายด้วยพร้อมเพย์</h2><p class="note" style="margin:0">คำสั่งซื้อ ' + esc(order.id) + ' · ยอด <b>' + B.baht(order.amount) + "</b></p>" + (r.qr ? '<img class="qrbig" src="' + esc(r.qr) + '" alt="คิวอาร์พร้อมเพย์ของคำสั่งซื้อนี้">' : '<p class="msg bad">โหลดรูปคิวอาร์ไม่ได้ กดปิดแล้วลองใหม่</p>') +
      '<ol class="steps"><li>เปิดแอปธนาคารของคุณ เลือกสแกนจ่าย</li><li>สแกนคิวอาร์ ยอดขึ้นให้เอง ไม่ต้องพิมพ์</li><li>จ่ายแล้วรอหน้านี้สักครู่ ระบบตรวจและเปิดไฟล์ให้เอง</li></ol><p class="note" id="qrleft" style="margin:0" aria-live="polite"></p>' +
      (r.qr ? '<p style="margin:6px 0 0"><a href="' + esc(r.qr) + '" download="PromptPay_' + esc(order.id) + '.svg">บันทึกรูปคิวอาร์</a> (ใช้สแกนจากรูปในเครื่องได้)</p>' : "") +
      '<div class="sum" style="margin:12px 0 0"><button class="b pri" type="button" data-pq="check">ฉันจ่ายแล้ว ตรวจผล</button><button class="b line sm" type="button" data-pq="close">ปิด</button></div>' + (B.demo ? '<p style="margin:10px 0 0"><button type="button" class="linkbtn" data-pq="emu">โหมดทดลอง: จำลองว่าสแกนจ่ายแล้ว</button></p>' : "") + "</div>";
    document.body.appendChild(d); document.body.style.overflow = "hidden";
    var exp = r.expiresAt ? new Date(r.expiresAt).getTime() : Date.now() + 864e5, until = Math.min(exp, Date.now() + 20 * 60000);
    var left = function (t) { var l = document.getElementById("qrleft"); if (l) l.textContent = t; };
    var ok = function (c) { stop(); if (ui.paid) ui.paid(c); };
    var poll = function () { return check(order.id).then(function (c) { if (c.status === "successful") ok(c); else if (c.message) { stop(); if (ui.msg) ui.msg(c.message, true); } return c; }); };
    watch = { t: setInterval(function () {
      left("คิวอาร์ใช้ได้ถึง " + B.when(new Date(exp).toISOString()) + " · ระบบตรวจผลทุก 5 วินาที");
      if (Date.now() > until) { stop(); if (ui.msg) ui.msg("ยังไม่พบการชำระ ถ้าจ่ายแล้ว ระบบตรวจและแจ้งทางอีเมลภายใน 10 นาที", true); return; }
      poll().catch(function () {});
    }, 5000) };
    d.addEventListener("click", function (ev) {
      var t = ev.target.closest("[data-pq]"); if (!t) return;
      var k = t.getAttribute("data-pq");
      if (k === "close") { stop(); if (ui.msg) ui.msg("ปิดหน้าคิวอาร์แล้ว · ถ้าจ่ายแล้ว ระบบตรวจและแจ้งทางอีเมลภายใน 10 นาที"); }
      else if (k === "check") poll().then(function (c) { if (c && c.status !== "successful" && !c.message) left("ยังไม่พบการชำระ ลองอีกครั้งใน 10–20 วินาที"); }).catch(function (e) { left(e.message); });
      else if (k === "emu" && window.EMU) { var ch = Object.keys(window.EMU.state.charges).filter(function (id) { var c = window.EMU.state.charges[id]; return c.metadata && c.metadata.order === order.id && c.status === "pending"; }).pop(); if (ch) window.EMU.payDone(ch); }
    });
    var btn = d.querySelector('[data-pq="check"]'); if (btn) btn.focus();
  }
  document.addEventListener("keydown", function (ev) { if (ev.key === "Escape" && document.getElementById("paymodal")) stop(); });
  // กลับจากหน้ายืนยันของธนาคาร ทรูมันนี่ หรือ 3-D Secure: คืน { oid, check: Promise } หรือ null
  function returned() {
    var sp; try { sp = new URLSearchParams(location.search); } catch (e) { return null; }
    var oid = sp.get("pay"); if (!oid) return null;
    var emu = sp.get("emudone");
    try { sessionStorage.removeItem("build_pay_wait"); sessionStorage.removeItem("build_pay_from"); } catch (e) {}
    var p = (B.demo && emu ? B.ensureEmu().then(function () { window.EMU.payDone(emu); }) : Promise.resolve()).then(function () { return check(oid); });
    return { oid: oid, check: p };
  }
  B.pay = { LABEL: LABEL, methods: methods, online: online, minOnline: minOnline, start: start, check: check, stop: stop, returned: returned };
})();
