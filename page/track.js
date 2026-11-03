(function () {
  "use strict";
  var B = window.BUILD, $ = function (id) {
    return document.getElementById(id);
  }, esc = B.esc, ST = B.ST;
  var yr = $("yr");
  if (yr) yr.textContent = new Date().getFullYear();
  var q = new URLSearchParams(location.search), oid = q.get("o") || "", key = q.get("k") || "";
  function say(t, bad) {
    var m = $("msg");
    m.textContent = t;
    m.className = "msg" + (bad ? " bad" : "");
    m.hidden = !t;
  }
  function title(id) {
    var x = B.find(id);
    return (x ? B.code(x) + " " + x.title : id) + (B.isCtry(B.varOf(id)) ? " · " + B.LANGS[B.varOf(id)] : "")
      + (B.isUpd(id) ? " · แบบรับฉบับใหม่ตลอด" : "");
  }
  function paint(o) {
    var paid = o.status === ST.paid, rej = o.status === ST.reject, can = o.status === ST.cancel;
    // ขั้นตอนแบบระบบติดตามพัสดุ: แต่ละขั้นมีเวลาจริงจากหลังบ้าน
    var steps = [
      ["สั่งซื้อแล้ว", "ระบบสร้างคำสั่งซื้อ " + o.id, o.created, true],
      [rej ? "สลิปไม่ผ่าน" : "ชำระเงิน", rej ? (o.note ? "เหตุผล: " + o.note : "รอแนบสลิปใหม่") : o.method
        ? "ช่องทาง: " + o.method : (o.slipAt ? "แนบสลิปแล้ว" : "รอชำระ"), o.slipAt || (paid ? o.okAt : ""),
        !!(o.slipAt || paid)],
      ["ตรวจยอดแล้ว", paid ? "ยืนยันยอดเข้าบัญชีของร้าน" : o.status === ST.check ? "ร้านกำลังตรวจยอด" : "รอขั้นก่อนหน้า",
        paid ? o.okAt : "", paid],
      // เอกสารส่งมอบแบบดิจิทัล (24 ต.ค. 2026): เปิดสิทธิ์ในหน้าสมาชิก + อีเมลแจ้งพร้อมเลขสิทธิ์ · ไม่มีขั้นส่งพัสดุ
      ["ส่งมอบเอกสารแล้ว", paid ? "เปิดสิทธิ์ " + (o.nDocs || o.items.length) + " เอกสารในหน้าสมาชิก เมนู เอกสารของฉัน"
        + (o.mailedAt ? " · อีเมลแจ้งพร้อมเลขสิทธิ์แล้ว" : "") : "รอขั้นก่อนหน้า", paid ? (o.mailedAt
          || o.okAt) : "", paid],
      ["ดาวน์โหลดแล้ว", o.dl1 ? "ดาวน์โหลด " + (o.dlN || 1) + " ครั้ง · ทุกหน้ามีชื่อผู้ซื้อและเลขสิทธิ์" : "ยังไม่ได้ดาวน์โหลด · ดาวน์โหลดซ้ำได้ทุกเมื่อ",
        o.dl1, !!o.dl1]
    ];
    if (o.digital === false && !o.ship && paid) steps.push(["ส่งพัสดุ", "ร้านกำลังจัดส่งสินค้า",
      "", false]);
    if (o.ship) steps.push(["ส่งพัสดุแล้ว", o.ship.carrier + " เลขพัสดุ " + o.ship.no, o.ship.at,
      true, o.ship.link]);
    var cur = -1;
    for (var i = 0; i < steps.length; i++) if (!steps[i][3]) {
      cur = i;
      break;
    }
    var li = steps.map(function (s, i) {
      var cl = s[3] ? "d" : i === cur ? (rej && i === 1 ? "x" : "a") : "";
      return '<li class="' + cl + '"><b>' + (s[3] ? "✓" : i + 1) + "</b><h3>" + esc(s[0]) + "</h3><p>"
        + esc(s[1]) + (s[4] && /^https:\/\//.test(s[4]) ? ' · <a href="' + esc(s[4]) + '" target="_blank" rel="noopener noreferrer">ติดตามที่บริษัทขนส่ง</a>' : "")
        + "</p>" + (s[2] && s[3] ? "<time>" + esc(B.when(s[2])) + "</time>" : "") + "</li>";
    }).join("");
    $("view").innerHTML = '<div class="card pad"><div class="sumrow"><b class="big">' + esc(o.id)
      + '</b><span class="pill ' + (paid ? "ok" : can ? "gray" : rej ? "bad" : "") + '">' + esc(o.status)
      + "</span><span>" + B.thb(o.amount) + "</span><span class=\"note\" style=\"margin:0\">สั่งซื้อ "
      + esc(B.when(o.created)) + "</span></div>" +
      "<ul style=\"margin:10px 0 0\">" + o.items.map(function (id) {
        return "<li>" + esc(title(id)) + "</li>";
      }).join("") + "</ul>" +
      (can ? '<p class="note">คำสั่งซื้อนี้ยกเลิกแล้ว</p>' : '<ol class="tl">' + li + "</ol>") +
      '<p style="margin:14px 0 0;display:flex;gap:8px;flex-wrap:wrap">' + (can ? '<a class="b pri sm" href="sheets.html">เลือกซื้อใหม่</a>' : '<a class="b pri sm" href="'
        + (paid ? "member.html#docs" : o.status === ST.check ? "member.html#orders" : "checkout.html?done="
          + encodeURIComponent(o.id)) + '">' + (paid ? "เปิดเอกสารของฉัน" : o.status === ST.check
            ? "ดูคำสั่งซื้อของฉัน" : "ไปชำระหรือแนบสลิป") + "</a>") + (paid && o.receipt ? '<a class="b line sm" href="receipt.html?o='
              + encodeURIComponent(oid) + "&k=" + encodeURIComponent(key) + '" target="_blank" rel="noopener">ใบเสร็จรับเงิน'
              + (o.receipt !== "pending" ? " " + esc(o.receipt) : "") + "</a>" : "") + '<button class="b line sm" type="button" id="re">ตรวจสถานะล่าสุด</button></p></div>';
    var re = $("re");
    if (re) re.onclick = load;
  }
  function load() {
    if (!/^BT-\d{6}-\d{3}$/.test(oid) || !/^[0-9a-f]{16}$/.test(key)) {
      $("view").innerHTML = '<div class="card pad"><p style="margin:0">ลิงก์ติดตามไม่ครบ · เปิดลิงก์จากอีเมลของคำสั่งซื้อ หรือดูที่ <a href="member.html#orders">หน้าสมาชิก เมนู คำสั่งซื้อ</a></p></div>';
      return;
    }
    say("");
    B.call("track", { order: oid, key: key }).then(function (r) {
      paint(r.order);
    }, function (e) {
      $("view").innerHTML = "";
      say((e && e.message) || "เปิดสถานะไม่ได้ ลองใหม่อีกครั้ง", true);
    });
  }
  load();
})();
