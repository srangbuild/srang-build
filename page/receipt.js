(function () {
  "use strict";
  var B = window.BUILD, esc = B.esc, $ = function (id) {
    return document.getElementById(id);
  };
  // 27 Nov 2026: this page has no translation system. Readers in other languages get English around the receipt;
  // the receipt itself stays a Thai document with English labels (the shop is in Thailand).
  var EN = false;
  try {
    EN = !/^th/.test(localStorage.getItem("build_lang") || "th");
  } catch (e) {}
  function L(th, en) {
    return EN ? en : th;
  }
  if (EN) {
    var bar = document.querySelector(".bar"), bt = function (sel, t) {
      var n = bar && bar.querySelector(sel);
      if (n) n.textContent = t;
    };
    if (bar) bar.setAttribute("lang", "en");
    bt("#print", "Print or save as PDF");
    bt('a[href="member.html#orders"]', "My orders");
    bt('a[href="index.html"]', "Home");
    bt("small", "Save as PDF: press Print, then choose the printer “Save as PDF”.");
    var ld = document.querySelector("#out .msg");
    if (ld) ld.textContent = "Loading the receipt…";
  }
  var P = new URLSearchParams(location.search), order = String(P.get("o") || ""), key = String(P.get("k")
    || "");
  // จำนวนเงินเป็นตัวอักษรไทย (บาทถ้วน / สตางค์) · หน่วยหลักที่ 1 อ่าน "เอ็ด" เมื่อมีหลักที่สูงกว่า
  var D = ["", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"], U = ["", "สิบ",
    "ร้อย", "พัน", "หมื่น", "แสน"];
  function six(s, hasHigher) {
    var o = "", n = s.length;
    for (var i = 0; i < n; i++) {
      var d = +s[i], p = n - i - 1;
      if (!d) continue;
      if (p === 1 && d === 1) o += "สิบ";
      else if (p === 1 && d === 2) o += "ยี่สิบ";
      else if (p === 0 && d === 1 && (hasHigher || /[1-9]/.test(s.slice(0, n - 1)))) o += "เอ็ด";
      else o += D[d] + U[p];
    }
    return o;
  }
  function intText(s) {
    s = String(s).replace(/^0+/, "");
    if (!s) return "ศูนย์";
    var parts = [];
    while (s.length > 6) {
      parts.unshift(s.slice(-6));
      s = s.slice(0, -6);
    }
    parts.unshift(s);
    var o = "";
    parts.forEach(function (g, i) {
      o += six(g, i > 0 && /[1-9]/.test(parts.slice(0, i).join("")));
      if (i < parts.length - 1) o += "ล้าน";
    });
    return o;
  }
  function bahtText(x) {
    var c = Math.round(+x * 100), b = Math.floor(c / 100), st = c % 100;
    return intText(String(b)) + "บาท" + (st ? intText(String(st)) + "สตางค์" : "ถ้วน");
  }
  function money(n) {
    return Number(n || 0).toLocaleString("th-TH", { minimumFractionDigits: 2,
      maximumFractionDigits: 2 });
  }
  function thDate(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    if (isNaN(d)) return esc(iso);
    return d.toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric",
      timeZone: "Asia/Bangkok" }) + " (GMT+7)"; // 7 พ.ย. 2026: ใบเสร็จเป็นเอกสารของร้านในไทย วันที่ตามเวลาไทย จึงบอกเขตเวลาให้ชัด
  }
  function fail(t, detail) { // detail = the shop's own message, kept for support when the page shows English
    $("out").innerHTML = '<p class="msg bad">' + esc(t) + (detail ? '<br><small lang="th">' + esc(detail) + "</small>" : "") + "</p>";
  }
  if (!/^BT-\d{6}-\d{3,6}$/.test(order)) { // รูปแบบเดียวกับหลังบ้าน (3 ถึง 6 หลักต่อวัน)
    fail(L("ลิงก์ใบเสร็จไม่ครบ · เปิดจากหน้าสมาชิก เมนู คำสั่งซื้อของฉัน หรือจากลิงก์ในอีเมล",
      "The receipt link is not complete. Open it from My orders on the member page, or from the link in your email."));
    return;
  }
  B.call("receipt", { order: order, key: key }).then(function (r) {
    var S = r.shop, rc = r.receipt || {}, by = rc.buyer || {}, tax = r.kind === "tax";
    var title = tax ? "ใบเสร็จรับเงิน / ใบกำกับภาษี" : "ใบเสร็จรับเงิน", titleEn = tax ? "Receipt / Tax invoice" : "Receipt";
    var note = !r.ready ? '<p class="msg noprint">' + esc(L("ร้านกำลังตั้งค่าข้อมูลผู้ออกใบเสร็จ (ชื่อตามกฎหมายและเลขประจำตัวผู้เสียภาษี) · เลขที่ใบเสร็จและรายการด้านล่างบันทึกไว้แล้ว เปิดลิงก์นี้อีกครั้งภายหลังเพื่อได้ใบเสร็จฉบับสมบูรณ์",
      "The shop is setting up the issuer details (legal name and tax ID). The receipt number and the items below are saved. Open this link again later to get the complete receipt.")) + "</p>" : "",
      wait = L("(รอร้านตั้งค่า)", "(shop is setting this up)");
    var rows = (rc.lines || []).map(function (l, i) {
      return "<tr><td class=\"n hide\">" + (i + 1) + "</td><td>" + (l.id ? "<b>" + esc(window.BUILD
        && window.BUILD.find(l.id) ? window.BUILD.code(window.BUILD.find(l.id)) : l.id) + "</b> " : "")
        + esc(l.title || "") + (l.plan ? "<small>" + esc(l.plan) + "</small>" : "") + '</td><td class="n hide">1</td><td class="n">'
        + money(l.amt) + "</td></tr>";
    }).join("");
    var totals = tax ? "<div><span>มูลค่าก่อนภาษี <small>(Net)</small></span><span>" + money(r.net)
      + "</span></div><div><span>ภาษีมูลค่าเพิ่ม " + esc(S.rate) + "% <small>(VAT)</small></span><span>"
      + money(r.vat) + '</span></div><div class="g"><span>รวมทั้งสิ้น <small>(Total)</small></span><span>'
      + money(r.order.amount) + "</span></div>"
      : '<div class="g"><span>รวมทั้งสิ้น <small>(Total)</small></span><span>' + money(r.order.amount)
      + "</span></div>" + (S.vat ? '<div style="font-size:13px;color:var(--mute)"><span>ราคานี้รวมภาษีมูลค่าเพิ่ม '
        + esc(S.rate) + '% แล้ว<span class="en">Price includes VAT ' + esc(S.rate) + "%</span></span></div>"
        : '<div style="font-size:13px;color:var(--mute)"><span>ร้านยังไม่ได้จดทะเบียนภาษีมูลค่าเพิ่ม ราคานี้ไม่มีภาษีมูลค่าเพิ่ม<span class="en">The shop is not VAT registered. No VAT is charged.</span></span></div>');
    $("out").innerHTML = note + '<article class="doc">' +
      '<div class="hd"><div class="brand"><img src="img/logo.png" alt=""><div><b>' + esc(S.name || S.brand)
      + "</b><span>" + esc(S.brand) + "</span></div></div>" +
      '<div class="ttl"><h1>' + esc(title) + '</h1><div class="en">' + esc(titleEn) + '</div><span class="orig">ต้นฉบับ · Original</span></div></div>'
      +
      '<div class="two"><div class="blk"><h2>ผู้ขาย / ผู้ออกใบเสร็จ <small>Seller / Issuer</small></h2><p><b>' + esc(S.name || wait)
      + "</b>" + (tax ? " (" + esc(S.branch) + ")" : "") + "<br>" + esc(S.addr || "") + "<br>เลขประจำตัวผู้เสียภาษีอากร (Tax ID) "
      + esc(S.id || wait) + "</p></div>" +
      // 27 Nov 2026: one "paid by" row (the back end sends the same method twice, so the old page showed it twice)
      '<div class="blk"><dl class="meta"><dt>เล่มที่ <small>Book</small></dt><dd>' + esc(rc.book || "") + "</dd><dt>เลขที่ <small>No.</small></dt><dd>"
      + esc(rc.no || "") + "</dd><dt>วันที่ <small>Date</small></dt><dd>" + thDate(rc.at) + "</dd><dt>คำสั่งซื้อ <small>Order</small></dt><dd>"
      + esc(r.order.id) + "</dd><dt>ชำระด้วย <small>Paid by</small></dt><dd>"
      + esc(r.order.method || rc.method || "โอนเงิน") + "</dd></dl></div></div>" +
      '<div class="blk" style="margin:0 0 6px"><h2>ผู้ซื้อ / ลูกค้า <small>Buyer / Customer</small></h2><p><b>' + esc(by.name || by.email
        || "") + "</b>" + (by.type === "company" && by.branch ? " (" + esc(by.branch) + ")" : "")
      + (by.addr ? "<br>" + esc(by.addr) : "") + (by.id ? "<br>เลขประจำตัวผู้เสียภาษีอากร (Tax ID) " + esc(by.id) : "")
      + (by.email ? "<br>" + esc(by.email) : "") + "</p></div>" +
      '<table><thead><tr><th class="n hide">ลำดับ<small>No.</small></th><th>รายการ<small>Description</small></th><th class="n hide">จำนวน<small>Qty</small></th><th class="n">จำนวนเงิน (บาท)<small>Amount (THB)</small></th></tr></thead><tbody>'
      + rows + "</tbody></table>" +
      '<div class="tot">' + totals + '</div><p class="words">(' + esc(bahtText(r.order.amount)) + ")</p>"
      +
      '<div class="ft"><div>ได้รับเงินตามรายการข้างต้นถูกต้องแล้ว · เอกสารนี้ออกโดยระบบของร้านเมื่อได้รับชำระเงิน · สินค้าเป็นไฟล์ดิจิทัล ส่งมอบในบัญชีสมาชิกของผู้ซื้อ<br>ตรวจสอบเอกสารนี้กับร้านได้ด้วยเลขที่ '
      + esc(rc.no || r.order.id) + '<span class="en" lang="en">Received the amount above in full. The shop system issued this document when the payment arrived. The goods are digital files, delivered in the buyer\'s member account. To check this document with the shop, give its number '
      + esc(rc.no || r.order.id) + '.</span></div><div class="sig"><span class="paid">ชำระแล้ว · PAID</span><div class="ln">ผู้รับเงิน · Received by · '
      + esc(S.name || S.brand) + "</div></div></div></article>";
    $("print").disabled = false;
    document.title = (rc.no || L("ใบเสร็จ", "Receipt")) + " — " + (S.name || S.brand);
  }).catch(function (e) {
    var m = e && e.message ? String(e.message) : "";
    if (EN) fail("Could not open this receipt. Check the link, or open it from My orders on the member page.", m);
    else fail(m || "เปิดใบเสร็จไม่ได้ ลองใหม่อีกครั้ง");
  });
  $("print").addEventListener("click", function () {
    window.print();
  });
})();
