/* packages.js (28 Nov 2026, 28c): packages and prices. Prices come from data.js (sheets, bundles, plans, biz).
   Buying a plan uses the same cart as every other item. Company and agency packages go to the quote request form. */
(function () {
  "use strict";
  var B = window.BUILD, S = window.SITE || {}, $ = function (id) {
    return document.getElementById(id);
  }, esc = B.esc, baht = B.baht, biz = S.biz || {};
  var yr = $("yr");
  if (yr) yr.textContent = String(new Date().getFullYear());
  function minMax(list) {
    var p = list.map(function (x) {
      return B.memberPrice(+x.price || 0);
    }).filter(function (n) {
      return n > 0;
    });
    return p.length ? [Math.min.apply(null, p), Math.max.apply(null, p)] : [0, 0];
  }
  function cell(k, html) {
    var td = document.querySelector('#pick-tbl [data-p="' + k + '"]');
    if (td) td.innerHTML = html;
  }
  var sells = B.sheets.filter(function (x) {
    return B.canSell(x);
  }), packs = B.bundles.filter(function (x) {
    return B.canSell(x);
  }), plan = (B.plans || [])[0] || null, sm = minMax(sells), pm = minMax(packs);
  cell("sheet", sm[0] ? "<span>ใบละ</span> " + esc(baht(sm[0])) + "–" + esc(baht(sm[1])) : "–");
  cell("pack", pm[0] ? "<span>ชุดละ</span> " + esc(baht(pm[0])) + "–" + esc(baht(pm[1])) : "–");
  var planOn = !!(plan && B.canSell(plan));
  cell("plan", planOn ? esc(baht(B.memberPrice(plan.price))) + " <span>ต่อปี</span>" : "<span>ยังไม่เปิดขาย</span>");
  var b2b = Array.isArray(biz.b2b) ? biz.b2b : [], b2g = Array.isArray(biz.b2g) ? biz.b2g : [];
  cell("b2b", b2b.length ? "<span>เริ่ม</span> " + esc(baht(b2b[0].price)) + " <span>ต่อปี</span>" : "<span>ขอใบเสนอราคา</span>");
  cell("b2g", b2g.length ? "<span>เริ่ม</span> " + esc(baht(b2g[0].price)) + " <span>ต่อปี</span>" : "<span>ขอใบเสนอราคา</span>");

  // personal yearly plan
  $("plan-n").textContent = String(B.planSheets ? B.planSheets().length : B.sheets.length);
  $("plan-price").textContent = plan ? baht(B.memberPrice(plan.price)) : "–";
  var buy = $("plan-buy"), msg = $("plan-msg");
  if (!planOn) {
    buy.disabled = true;
    msg.textContent = "ยังไม่เปิดขาย";
  }
  buy.addEventListener("click", function () {
    if (!planOn) return;
    var err = B.cart.add(plan.id);
    if (err) {
      msg.textContent = err;
      return;
    }
    location.href = "cart.html" + (B.preview || "");
  });

  // company and agency tables: seats, price per year, price per seat, a quote button
  function rows(list, kind, tb) {
    tb.innerHTML = list.map(function (r) {
      var seats = Math.max(1, +r.seats || 1), per = Math.round((+r.price || 0) / seats);
      return "<tr><td>" + seats + " <span>คน</span></td><td class=\"num\">" + esc(baht(r.price)) + "</td><td class=\"num\">"
        + esc(baht(per))
        + "</td><td><a class=\"b line\" href=\"request.html?kind=" + encodeURIComponent(kind) + "&amp;seats="
        + seats + "\">ขอใบเสนอราคา</a></td></tr>";
    }).join("") || "<tr><td colspan=\"4\"><span>ขอใบเสนอราคา</span></td></tr>";
  }
  rows(b2b, "สิทธิ์ใช้งานสำหรับบริษัท (หลายผู้ใช้)", document.querySelector("#b2b-tbl tbody"));
  rows(b2g, "จัดซื้อสำหรับหน่วยงานรัฐ", document.querySelector("#b2g-tbl tbody"));
  $("extra-seat").textContent = biz.extraSeat ? baht(biz.extraSeat) : "–";
})();
