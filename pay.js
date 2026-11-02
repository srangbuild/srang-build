/* pay.js — ชำระเงินออนไลน์ผ่าน Opn Payments ใช้ร่วมกันหลายหน้า (หน้าชำระเงิน checkout.html) · โหลดหลัง app.js
   · บัตร: ฟอร์มของ Opn (Omise.js) สร้าง token ในเครื่องลูกค้า เลขบัตรไม่ผ่านเว็บร้าน
   · พร้อมเพย์: หลังบ้านสร้างคิวอาร์ของคำสั่งซื้อนี้ หน้าเว็บตรวจผลทุก 5 วินาที
   · ทรูมันนี่ และบัตรที่ต้องยืนยันตัวตน (3-D Secure): ไปหน้ายืนยันของผู้ให้บริการ แล้วกลับมาที่หน้าเดิมพร้อม ?pay=เลขคำสั่งซื้อ
   หลังบ้านตรวจผลกับ Opn เองทุกครั้ง ไม่เชื่อผลจากเบราว์เซอร์ */
(function () {
  "use strict";
  var B = window.BUILD; if (!B) return;
  var esc = B.esc, P = B.P;
  // ช่องทางชำระเงิน (ตรวจกับบัญชี Opn จริงผ่าน Capability API และสร้าง source ทดสอบทุกชนิด 30 ต.ค. 2026) · [ชื่อ, คำอธิบาย, กลุ่ม]
  // จ่ายที่เคาน์เตอร์ Lotus's: Opn ปิดแล้ว ("type is no longer available") จึงไม่มีในรายการ
  var LABEL = {
    promptpay: ["พร้อมเพย์", "สแกนคิวอาร์ด้วยแอปธนาคารใดก็ได้ ยอดขึ้นเอง ระบบตรวจยอดอัตโนมัติ", "th"],
    card: ["บัตรเครดิต / เดบิต", "Visa Mastercard JCB UnionPay American Express ออกในไทยหรือต่างประเทศ · ตัดเป็นบาท ธนาคารผู้ออกบัตรแปลงสกุลเงินให้", "intl"],
    googlepay: ["Google Pay", "จ่ายด้วยบัตรที่บันทึกไว้ใน Google (Android และ Chrome)", "intl"],
    paypal: ["PayPal", "บัญชี PayPal หรือบัตรผ่าน PayPal จากทั่วโลก", "intl"],
    stripe: ["Stripe: บัตร และพร้อมเพย์", "Visa Mastercard ไทยและต่างประเทศ · พร้อมเพย์เฉพาะจ่ายเป็นบาท · ไปจ่ายที่หน้าของ Stripe", "intl"],
    installment: ["ผ่อนชำระผ่านบัตรเครดิต", "ยอดตั้งแต่ 2,000 บาท · เลือกธนาคารและจำนวนเดือนในหน้าถัดไป", "intl"],
    mobile_banking_kbank: ["K PLUS", "กสิกรไทย · เปิดแอปจ่ายทันที", "bank"],
    mobile_banking_scb: ["SCB EASY", "ไทยพาณิชย์ · เปิดแอปจ่ายทันที", "bank"],
    mobile_banking_bbl: ["Bualuang mBanking", "กรุงเทพ · เปิดแอปจ่ายทันที", "bank"],
    mobile_banking_bay: ["KMA", "กรุงศรีอยุธยา · เปิดแอปจ่ายทันที", "bank"],
    mobile_banking_ktb: ["Krungthai NEXT", "กรุงไทย · เปิดแอปจ่ายทันที", "bank"],
    truemoney_jumpapp: ["ทรูมันนี่", "จ่ายผ่านแอป TrueMoney", "wallet"],
    rabbit_linepay: ["Rabbit LINE Pay", "จ่ายผ่าน LINE", "wallet"],
    shopeepay: ["ShopeePay", "จ่ายผ่านแอป Shopee", "wallet"],
    grabpay: ["GrabPay", "จ่ายผ่านแอป Grab", "wallet"],
    alipay: ["Alipay", "สำหรับลูกค้าที่ใช้ Alipay (จีน)", "foreign"],
    wechat_pay: ["WeChat Pay", "สำหรับลูกค้าที่ใช้ WeChat (จีน)", "foreign"],
    alipay_hk: ["AlipayHK", "สำหรับลูกค้าในฮ่องกง", "foreign"],
    kakaopay: ["KakaoPay", "สำหรับลูกค้าในเกาหลีใต้", "foreign"],
    touch_n_go: ["Touch 'n Go eWallet", "สำหรับลูกค้าในมาเลเซีย", "foreign"]
  };
  var GROUPS = [["th", "แนะนำ · ตรวจยอดอัตโนมัติ"], ["intl", "บัตรและช่องทางสากล (ลูกค้าต่างประเทศใช้ได้)"], ["bank", "แอปธนาคารในไทย"], ["wallet", "กระเป๋าเงินออนไลน์"], ["foreign", "กระเป๋าเงินของลูกค้าต่างประเทศ"]];
  // กลุ่มที่ใช้น้อยพับไว้ ให้หน้าสั้นบนมือถือ · เปิดเองเมื่อวิธีที่เลือกอยู่ในกลุ่มนั้น
  var FOLD = { bank: 1, wallet: 1, foreign: 1 };
  function groupBox(g, n, head, inner, open) { return FOLD[g[0]] ? '<details class="pmg"' + (open ? " open" : "") + '><summary>' + esc(g[1]) + ' <small>' + n + ' วิธี</small></summary>' + inner + "</details>" : head + inner; }
  // ฟอร์มสำเร็จรูปของ Opn ไม่รองรับช่องทางนี้ในไทย จึงสร้าง source ด้วย Omise.createSource (docs.omise.co/omise-js)
  var DIRECT = { wechat_pay: 1, alipay_hk: 1, kakaopay: 1, touch_n_go: 1 };
  // ช่องทางที่ต้องเปิดแอปในเครื่องเดียวกัน: บนคอมพิวเตอร์บอกให้เปิดหน้านี้บนมือถือ
  var APP_ONLY = ["mobile_banking_kbank", "mobile_banking_scb", "mobile_banking_bbl", "mobile_banking_bay", "mobile_banking_ktb", "truemoney_jumpapp", "wechat_pay", "alipay_hk", "kakaopay", "touch_n_go"];
  var isPhone = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || "") || (navigator.maxTouchPoints > 1 && /Mac/i.test(navigator.platform || ""));
  if (!isPhone) APP_ONLY.forEach(function (k) { if (LABEL[k]) LABEL[k][1] += " · ต้องจ่ายจากมือถือ"; });
  // แอปธนาคารมีค่าบริการ 10 บาทต่อรายการ ยอดเล็กจึงให้ใช้พร้อมเพย์แทน (ใช้แอปธนาคารเดียวกัน) · ปรับได้ที่หลังบ้าน pay.bankMin
  var bankMin = P.bankMin === undefined || P.bankMin === "" ? 200 : +P.bankMin;
  var MIN_FOR = { installment: 2000, mobile_banking_kbank: bankMin, mobile_banking_scb: bankMin, mobile_banking_bbl: bankMin, mobile_banking_bay: bankMin, mobile_banking_ktb: bankMin }, ppId = "", ppReady = null, ppCur = "", capCur = null;
  // ค่าใช้จ่ายที่ลูกค้าอาจจ่ายเพิ่ม แสดงตอนเลือกวิธีจ่าย · ร้านไม่เก็บค่าธรรมเนียมเพิ่ม (สัญญา PayPal ไทยห้าม: No surcharges)
  var NONE = "ไม่มีค่าธรรมเนียมเพิ่ม", FX_NOTE = "ไม่มีค่าธรรมเนียมจากร้าน · บัตรต่างประเทศ ธนาคารของคุณอาจคิดค่าแปลงสกุลเงิน", WALLET_FX = "ไม่มีค่าธรรมเนียมจากร้าน · ผู้ให้บริการแปลงเป็นเงินของคุณตามอัตราของเขา";
  var FEE = { card: FX_NOTE, googlepay: FX_NOTE, stripe: FX_NOTE, paypal: "ไม่มีค่าธรรมเนียมจากร้าน · ถ้าบัญชีของคุณเป็นสกุลอื่น PayPal แปลงเงินตามอัตราของ PayPal", installment: "มีดอกเบี้ย ลูกค้าเป็นผู้จ่าย ดูอัตราด้านล่าง", alipay: WALLET_FX, wechat_pay: WALLET_FX, alipay_hk: WALLET_FX, kakaopay: WALLET_FX, touch_n_go: WALLET_FX };
  function feeHtml(k) { var f = FEE[k] || NONE; return '<small class="pfee' + (f === NONE ? " none" : "") + '">' + esc(f) + "</small>"; }
  // อัตราดอกเบี้ยต่อเดือนแบบลูกค้าจ่าย: สัญญา Opn ไทย ฉบับ 30 ก.ย. 2025 ตาราง Schedule II · จำนวนเดือนและขั้นต่ำต่อเดือน: docs.omise.co/installment-payment (อ่าน 31 ต.ค. 2026)
  var INST = [["กสิกรไทย", 0.65, [3, 4, 6, 10], 0], ["UOB", 0.64, [3, 4, 6, 10], 500], ["KTC", 0.74, [3, 4, 5, 6, 7, 8, 9, 10], 0], ["กรุงเทพ", 0.74, [3, 4, 5, 6, 7, 8, 9, 10], 500], ["ไทยพาณิชย์", 0.74, [3, 4, 6, 9, 10], 500], ["กรุงศรี", 0.8, [3, 4, 6, 9, 10], 500], ["ทีทีบี", 0.8, [3, 4, 6, 10], 500], ["กรุงศรี เฟิร์สช้อยส์", 1.3, [3, 4, 6, 9, 10, 12, 18, 24, 36], 300]];
  function instTable(ms, thb) {
    if (!ms || ms.indexOf("installment") < 0) return "";
    var rows = INST.map(function (r) { var ok = r[2].filter(function (n) { return thb / n >= r[3]; }); if (!ok.length) return ""; var n = ok[ok.length - 1], m = thb / n + thb * r[1] / 100; return "<tr><td>" + esc(r[0]) + "</td><td>" + r[1].toFixed(2) + "%</td><td>" + ok.join(", ") + "</td><td>" + B.thb(Math.ceil(m)) + "</td></tr>"; }).join("");
    return '<details class="insttb" style="margin:8px 0 0"><summary>ดูดอกเบี้ยและยอดผ่อนของคำสั่งซื้อนี้</summary><div style="overflow:auto"><table class="cmp" style="font-size:14px"><thead><tr><th>บัตรของธนาคาร</th><th>ดอกเบี้ยต่อเดือน</th><th>ผ่อนได้ (เดือน)</th><th>จ่ายต่ำสุดต่อเดือน</th></tr></thead><tbody>' + rows + '</tbody></table></div><p class="note" style="margin:6px 0 0">ยอดต่อเดือน = ยอดซื้อ ÷ จำนวนเดือน + ดอกเบี้ยต่อเดือนของยอดซื้อ · ธนาคารอาจปรับอัตราได้ ยอดจริงแสดงก่อนยืนยันที่หน้าถัดไป</p></details>';
  }
  // หลายสกุลเงิน: บัตร (Opn Multi-currency) และ PayPal จ่ายเป็นสกุลเงินของลูกค้าได้ · ช่องทางอื่นจ่ายเป็นบาท · ร้านได้รับเป็นบาทเสมอ · ราคาจริงมาจากหลังบ้านเท่านั้น
  var CUR = { THB: ["฿", "บาท"], USD: ["US$", "ดอลลาร์สหรัฐ"], EUR: ["€", "ยูโร"], GBP: ["£", "ปอนด์สเตอร์ลิง"], JPY: ["¥", "เยน"], SGD: ["S$", "ดอลลาร์สิงคโปร์"], AUD: ["A$", "ดอลลาร์ออสเตรเลีย"], HKD: ["HK$", "ดอลลาร์ฮ่องกง"], CNY: ["CN¥", "หยวน"], CHF: ["CHF ", "ฟรังก์สวิส"], DKK: ["DKK ", "โครนเดนมาร์ก"], NOK: ["NOK ", "โครนนอร์เวย์"], SEK: ["SEK ", "โครนาสวีเดน"] };
  var curNow = (function () { try { var c = sessionStorage.getItem("build_pay_cur"); if (CUR[c]) return c; } catch (e) {} var pl = localStorageLang(); return pl && pl !== "th" ? "USD" : "THB"; })();
  function localStorageLang() { try { return localStorage.getItem("build_lang") || ""; } catch (e) { return ""; } }
  function curs(me) { // สกุลเงินที่ใช้ได้จริงตอนนี้: บาท + สกุลบัตรของบัญชี Opn + สกุลของ PayPal
    var p = me && me.pay, want = Array.isArray(P.currencies) && P.currencies.length ? P.currencies : Object.keys(CUR);
    return want.filter(function (c) { return CUR[c] && (c === "THB" || (p && p.opn && (B.demo || (capCur && capCur.indexOf(c) >= 0))) || (p && p.paypal && c !== "CNY") || (p && p.stripe)); });
  }
  function cur(me) { var l = me ? curs(me) : null; return !l || l.indexOf(curNow) >= 0 ? curNow : "THB"; }
  function money(c, v) { return CUR[c][0] + v; }
  // กล่องเลือกสกุลเงิน: หน้าเว็บวางไว้เหนือรายการช่องทาง · ตั้ง B.pay.onCur เพื่อวาดรายการใหม่เมื่อเปลี่ยนสกุล
  function curBar(me, thb) {
    var l = curs(me); if (l.length < 2) return "";
    setTimeout(curPreview, 0);
    return '<div class="curbar" style="margin:0 0 10px"><label style="display:block;font-weight:600">จ่ายเป็นสกุลเงิน <select data-paycur="1" data-thb="' + (+thb || 0) + '" style="font:inherit;min-height:44px;margin-left:6px;padding:0 8px;border-radius:10px">' + l.map(function (c) { return '<option value="' + c + '"' + (c === cur(me) ? " selected" : "") + ">" + c + " · " + esc(CUR[c][1]) + "</option>"; }).join("") + '</select></label><p class="note" id="curq" aria-live="polite" style="margin:6px 0 0"></p></div>';
  }
  function curPreview() {
    var s = document.querySelector("[data-paycur]"), n = document.getElementById("curq"); if (!s || !n) return;
    var c = s.value, thb = +s.getAttribute("data-thb"); curNow = c;
    if (c === "THB") { n.textContent = ""; return; }
    n.textContent = "กำลังคิดราคา…";
    B.call("payQuote", { cur: c, thb: thb }).then(function (r) { if (s.value !== c) return; n.textContent = "ยอดโดยประมาณ " + money(c, r.quote.value) + " จาก " + B.thb(thb) + " · ระบบแสดงยอดสุดท้ายก่อนยืนยัน · ธนาคารของคุณอาจมีค่าธรรมเนียมเพิ่ม · ร้านคำนวณจากอัตราแลกเปลี่ยนของผู้ให้บริการ"; }).catch(function (e) { n.textContent = e.message; });
  }
  document.addEventListener("change", function (ev) {
    var s = ev.target && ev.target.closest && ev.target.closest("[data-paycur]"); if (!s) return;
    curNow = s.value; try { sessionStorage.setItem("build_pay_cur", curNow); } catch (e) {}
    if (B.pay.onCur) B.pay.onCur(); curPreview();
  });
  var watch = null, omiseReady = null, cap = null;

  // ช่องทางที่บัญชี Opn ของร้านเปิดอยู่จริง (Capability API ใช้คีย์สาธารณะ · docs.omise.co/capability-api) · อ่านครั้งเดียวต่อการเปิดหน้า
  function capability() {
    if (cap) return cap;
    cap = (B.demo || !/^pkey_/.test(String(P.opnKey || "")) ? Promise.resolve(null) : fetch("https://api.omise.co/capability", { headers: { Authorization: "Basic " + btoa(P.opnKey + ":") } }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }))
      .then(function (c) {
        if (!c || !Array.isArray(c.payment_methods)) return null;
        var names = c.payment_methods.map(function (m) { return m.name; });
        if (names.indexOf("truemoney") >= 0) names.push("truemoney_jumpapp");
        if (names.some(function (n) { return /^installment_/.test(n); })) names.push("installment");
        if ((c.tokenization_methods || []).indexOf("googlepay") >= 0) names.push("googlepay");
        var cardM = c.payment_methods.filter(function (m) { return m.name === "card"; })[0]; capCur = cardM && Array.isArray(cardM.currencies) ? cardM.currencies : null;
        return { names: names, min: c.limits && c.limits.charge_amount ? +c.limits.charge_amount.min / 100 : 0 };
      });
    return cap;
  }
  // วิธีชำระออนไลน์ที่ใช้ได้: หลังบ้านรองรับ (me.pay.methods) + ร้านเลือกไว้ใน data.js (pay.methods) + บัญชี Opn เปิดแล้ว (ถ้าอ่านได้)
  function methods(me, capNames, amount) { var on = (me && me.pay && me.pay.methods) || [], want = Array.isArray(P.methods) && P.methods.length ? P.methods : Object.keys(LABEL); if (me && me.pay && me.pay.paypal) ppId = me.pay.paypal; return want.filter(function (k) { return LABEL[k] && on.indexOf(k) >= 0 && (k === "paypal" || k === "stripe" || !capNames || capNames.indexOf(k) >= 0) && (amount === undefined || amount >= (MIN_FOR[k] || 0)) && (curNow === "THB" || (k === "card" && (B.demo || (capCur && capCur.indexOf(curNow) >= 0))) || (k === "paypal" && curNow !== "CNY") || k === "stripe"); }); }
  // โหมดทดสอบของ Opn กับหลังบ้านรุ่นเก่า (ไม่มี guard): ซ่อนการชำระออนไลน์ เพราะบัตรทดสอบที่เผยแพร่ "ชำระผ่าน" ได้โดยไม่มีเงินจริง
  function online(me) { var p = me && me.pay, opnOk = !!(p && p.opn && (B.demo || /^pkey_/.test(String(P.opnKey || ""))) && !(p.test && !p.guard && !B.demo)); return !!(p && (opnOk || p.paypal || p.stripe) && methods(me).length); }
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
    var pc = method === "card" || method === "paypal" || method === "stripe" ? curNow : "THB";
    if (method === "paypal") return paypal(order, ui, pc);
    if (method === "stripe") return stripe(order, ui, pc);
    if (B.demo) { // โหมดทดลอง: ตัวจำลองของ Opn ตอบแทน (บัตร = ผ่านทันที · พร้อมเพย์ = คิวอาร์ทดลอง · ช่องทางอื่น = ไปหน้ายืนยันแล้วกลับมา)
      var n = method === "card" || method === "googlepay" ? "tokn_test_emuok" : "src_test_emu" + String(method).replace(/_/g, "");
      return (pc === "THB" ? Promise.resolve() : B.call("payQuote", { order: order.id, cur: pc })).then(function () { return charge(order, n + B.rand(4), ui, pc); }).then(done);
    }
    if (ui.lock) ui.lock(true);
    var quote = null;
    return (pc === "THB" ? Promise.resolve() : B.call("payQuote", { order: order.id, cur: pc }).then(function (r) { quote = r.quote; })).then(omiseLoad).then(function (OC) {
      if (ui.lock) ui.lock(false);
      if (DIRECT[method]) return new Promise(function (res) {
        window.Omise.setPublicKey(P.opnKey);
        window.Omise.createSource(method, { amount: Math.round(order.amount * 100), currency: "THB" }, function (st, r) {
          if (st === 200 && r && r.id) res(charge(order, r.id, ui).then(done));
          else { if (ui.msg) ui.msg((r && r.message) || "ชำระไม่สำเร็จ ลองใหม่อีกครั้ง หรือเลือกวิธีอื่น", true); res(null); }
        });
      });
      return new Promise(function (res) {
        var cfg = { publicKey: P.opnKey, currency: pc, location: pc === "THB" ? "no" : "yes", frameLabel: "สร้าง | BUILD TH", frameDescription: "คำสั่งซื้อ " + order.id, submitLabel: "ชำระเงิน", buttonLabel: "ชำระเงิน", locale: /^en/i.test(document.documentElement.lang) ? "en" : "th", image: new URL("img/logo.png", location.href).href };
        if (P.googlePayId) cfg.googlepayMerchantId = P.googlePayId; // คีย์จริงต้องมีรหัสร้านค้า Google Pay (โหมดทดสอบไม่ต้องมี)
        OC.configure(cfg);
        OC.open({ amount: quote ? quote.amt : Math.round(order.amount * 100), currency: pc, defaultPaymentMethod: method === "card" ? "credit_card" : method, otherPaymentMethods: "",
          onCreateTokenSuccess: function (nonce) { res(charge(order, nonce, ui, pc).then(done)); }, onFormClosed: function () { res(null); } });
      });
    }).catch(function (e) { if (ui.lock) ui.lock(false); if (ui.msg) ui.msg(e.message, true); });
  }
  // PayPal (Orders v2 · developer.paypal.com/docs/checkout/standard/integrate): ปุ่มของ PayPal สร้างและยืนยันรายการผ่านหลังบ้านร้านเท่านั้น
  function ppLoad(pc) {
    if (ppReady && ppCur === pc) return ppReady;
    if (ppCur && ppCur !== pc) { var old = document.getElementById("pp-sdk"); if (old) old.remove(); try { delete window.paypal; } catch (e) { window.paypal = undefined; } ppReady = null; }
    ppCur = pc;
    ppReady = new Promise(function (res, rej) {
      if (window.paypal) return res(window.paypal);
      var s = document.createElement("script"); s.id = "pp-sdk"; s.src = "https://www.paypal.com/sdk/js?client-id=" + encodeURIComponent(ppId) + "&currency=" + encodeURIComponent(pc) + "&intent=capture&components=buttons"; s.async = true;
      s.onload = function () { if (window.paypal) res(window.paypal); else { ppReady = null; rej(new Error("โหลดระบบชำระเงินไม่สำเร็จ ลองใหม่อีกครั้ง")); } };
      s.onerror = function () { ppReady = null; rej(new Error("โหลดระบบชำระเงินไม่สำเร็จ ตรวจอินเทอร์เน็ตแล้วลองใหม่")); };
      document.head.appendChild(s);
    });
    return ppReady;
  }
  function paypal(order, ui, pc) {
    stop();
    var d = document.createElement("div"); d.id = "paymodal"; d.className = "modal"; d.setAttribute("role", "dialog"); d.setAttribute("aria-modal", "true"); d.setAttribute("aria-label", "PayPal");
    d.innerHTML = '<div class="mbox"><h2 style="margin:0 0 4px">จ่ายด้วย PayPal</h2><p class="note" style="margin:0 0 12px">คำสั่งซื้อ ' + esc(order.id) + " · ยอด <b>" + B.thb(order.amount) + '</b><span id="pp-cur"></span></p><div id="pp-box"></div>' + (B.demo ? '<p><button class="b pri" type="button" data-pq="ppemu">โหมดทดลอง: จำลองการจ่ายผ่าน PayPal</button></p>' : "") + '<p class="note" id="pp-msg" aria-live="polite" style="margin:8px 0 0"></p><div class="sum" style="margin:12px 0 0"><button class="b line sm" type="button" data-pq="close">ปิด</button></div></div>';
    document.body.appendChild(d); document.body.style.overflow = "hidden";
    var fail = function (e) { var m = document.getElementById("pp-msg"); if (m) m.textContent = (e && e.message) || "ชำระไม่สำเร็จ ลองใหม่อีกครั้ง หรือเลือกวิธีอื่น"; };
    var capture = function (ppOrder) { return B.call("ppCapture", { order: order.id, pp: ppOrder }).then(function (r) { if (r.status === "successful") { stop(); if (ui.paid) ui.paid(r); } else fail({ message: r.message }); return r; }); };
    d.addEventListener("click", function (ev) {
      var t = ev.target.closest("[data-pq]"); if (!t) return;
      if (t.getAttribute("data-pq") === "close") stop();
      if (t.getAttribute("data-pq") === "ppemu") B.call("ppStart", { order: order.id, cur: pc }).then(function (r) { return capture(r.id); }).catch(fail);
    });
    if (pc !== "THB") B.call("payQuote", { cur: pc, thb: order.amount, via: "paypal" }).then(function (r) { var e = document.getElementById("pp-cur"); if (e) e.textContent = " · ประมาณ " + money(pc, r.quote.value); }).catch(function () {});
    if (B.demo) return Promise.resolve(null);
    return ppLoad(pc).then(function (PP) {
      return PP.Buttons({
        createOrder: function (data) { return B.call("ppStart", { order: order.id, cur: pc, source: (data && data.paymentSource) || "paypal" }).then(function (r) { return r.id; }); },
        onApprove: function (data) { return capture(data.orderID).catch(fail); },
        onError: fail
      }).render("#pp-box");
    }).catch(fail);
  }
  // Stripe Checkout: ลูกค้าจ่ายที่หน้าของ Stripe แล้วกลับมาที่หน้าเดิม หลังบ้านตรวจผลกับ Stripe เอง
  function stripe(order, ui, pc) {
    if (ui.lock) ui.lock(true);
    return B.call("stStart", { order: order.id, cur: pc, ret: ui.back || "" }).then(function (r) {
      if (ui.lock) ui.lock(false);
      try { sessionStorage.setItem("build_pay_wait", order.id); sessionStorage.setItem("build_pay_from", ui.back || ""); } catch (e) {}
      location.href = r.url; return r;
    }, function (e) { if (ui.lock) ui.lock(false); if (ui.msg) ui.msg(e.message, true); });
  }
  function charge(order, nonce, ui, pc) {
    if (ui.lock) ui.lock(true);
    return B.call("payStart", { order: order.id, nonce: nonce, ret: ui.back || "", cur: pc || "THB" }).then(function (r) { if (ui.lock) ui.lock(false); return r; }, function (e) { if (ui.lock) ui.lock(false); throw e; });
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
    d.innerHTML = '<div class="mbox"><h2 style="margin:0 0 4px">สแกนจ่ายด้วยพร้อมเพย์</h2><p class="note" style="margin:0">คำสั่งซื้อ ' + esc(order.id) + ' · ยอด <b>' + B.thb(order.amount) + "</b></p>" + (r.qr ? '<img class="qrbig" src="' + esc(r.qr) + '" alt="คิวอาร์พร้อมเพย์ของคำสั่งซื้อนี้">' : '<p class="msg bad">โหลดรูปคิวอาร์ไม่ได้ กดปิดแล้วลองใหม่</p>') +
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
  B.pay = { groupBox: groupBox, feeHtml: feeHtml, instTable: instTable, CUR: CUR, curs: curs, cur: cur, curBar: curBar, curPreview: curPreview, onCur: null, LABEL: LABEL, GROUPS: GROUPS, methods: methods, capability: capability, online: online, minOnline: minOnline, start: start, check: check, stop: stop, returned: returned };
})();
