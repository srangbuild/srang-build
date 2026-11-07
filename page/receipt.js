(function () {
  "use strict";
  var B = window.BUILD, esc = B.esc, $ = function (id) {
    return document.getElementById(id);
  };
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
  function fail(t) {
    $("out").innerHTML = '<p class="msg bad">' + esc(t) + '</p>';
  }
  if (!/^BT-\d{6}-\d{3}$/.test(order)) {
    fail("ลิงก์ใบเสร็จไม่ครบ · เปิดจากหน้าสมาชิก เมนู คำสั่งซื้อของฉัน หรือจากลิงก์ในอีเมล");
    return;
  }
  B.call("receipt", { order: order, key: key }).then(function (r) {
    var S = r.shop, rc = r.receipt || {}, by = rc.buyer || {}, tax = r.kind === "tax";
    var title = tax ? "ใบเสร็จรับเงิน / ใบกำกับภาษี" : "ใบเสร็จรับเงิน", titleEn = tax ? "Receipt / Tax invoice" : "Receipt";
    var note = !r.ready ? '<p class="msg noprint">ร้านกำลังตั้งค่าข้อมูลผู้ออกใบเสร็จ (ชื่อตามกฎหมายและเลขประจำตัวผู้เสียภาษี) · เลขที่ใบเสร็จและรายการด้านล่างบันทึกไว้แล้ว เปิดลิงก์นี้อีกครั้งภายหลังเพื่อได้ใบเสร็จฉบับสมบูรณ์</p>' : "";
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
        + esc(S.rate) + "% แล้ว</span></div>" : '<div style="font-size:13px;color:var(--mute)"><span>ร้านยังไม่ได้จดทะเบียนภาษีมูลค่าเพิ่ม ราคานี้ไม่มีภาษีมูลค่าเพิ่ม</span></div>');
    $("out").innerHTML = note + '<article class="doc">' +
      '<div class="hd"><div class="brand"><img src="img/logo.png" alt=""><div><b>' + esc(S.name || S.brand)
      + "</b><span>" + esc(S.brand) + "</span></div></div>" +
      '<div class="ttl"><h1>' + esc(title) + '</h1><div class="en">' + esc(titleEn) + '</div><span class="orig">ต้นฉบับ · Original</span></div></div>'
      +
      '<div class="two"><div class="blk"><h2>ผู้ขาย / ผู้ออกใบเสร็จ</h2><p><b>' + esc(S.name || "(รอร้านตั้งค่า)")
      + "</b>" + (tax ? " (" + esc(S.branch) + ")" : "") + "<br>" + esc(S.addr || "") + "<br>เลขประจำตัวผู้เสียภาษีอากร "
      + esc(S.id || "(รอร้านตั้งค่า)") + "</p></div>" +
      '<div class="blk"><dl class="meta"><dt>เล่มที่</dt><dd>' + esc(rc.book || "") + "</dd><dt>เลขที่</dt><dd>"
      + esc(rc.no || "") + "</dd><dt>วันที่</dt><dd>" + thDate(rc.at) + (rc.method ? "</dd><dt>ชำระด้วย</dt><dd>"
        + esc(rc.method) : "") + "</dd><dt>คำสั่งซื้อ</dt><dd>" + esc(r.order.id) + "</dd><dt>ชำระด้วย</dt><dd>"
      + esc(r.order.method || "โอนเงิน") + "</dd></dl></div></div>" +
      '<div class="blk" style="margin:0 0 6px"><h2>ผู้ซื้อ / ลูกค้า</h2><p><b>' + esc(by.name || by.email
        || "") + "</b>" + (by.type === "company" && by.branch ? " (" + esc(by.branch) + ")" : "")
      + (by.addr ? "<br>" + esc(by.addr) : "") + (by.id ? "<br>เลขประจำตัวผู้เสียภาษีอากร " + esc(by.id) : "")
      + (by.email ? "<br>" + esc(by.email) : "") + "</p></div>" +
      '<table><thead><tr><th class="n hide">ลำดับ<small>No.</small></th><th>รายการ<small>Description</small></th><th class="n hide">จำนวน<small>Qty</small></th><th class="n">จำนวนเงิน (บาท)<small>Amount (THB)</small></th></tr></thead><tbody>'
      + rows + "</tbody></table>" +
      '<div class="tot">' + totals + '</div><p class="words">(' + esc(bahtText(r.order.amount)) + ")</p>"
      +
      '<div class="ft"><div>ได้รับเงินตามรายการข้างต้นถูกต้องแล้ว · เอกสารนี้ออกโดยระบบของร้านเมื่อได้รับชำระเงิน · สินค้าเป็นไฟล์ดิจิทัล ส่งมอบในบัญชีสมาชิกของผู้ซื้อ<br>ตรวจสอบเอกสารนี้กับร้านได้ด้วยเลขที่ '
      + esc(rc.no || r.order.id) + '</div><div class="sig"><span class="paid">ชำระแล้ว · PAID</span><div class="ln">ผู้รับเงิน · '
      + esc(S.name || S.brand) + "</div></div></div></article>";
    $("print").disabled = false;
    document.title = (rc.no || "ใบเสร็จ") + " — " + (S.name || S.brand);
  }).catch(function (e) {
    fail(e && e.message ? e.message : "เปิดใบเสร็จไม่ได้ ลองใหม่อีกครั้ง");
  });
  $("print").addEventListener("click", function () {
    window.print();
  });
})();
