/* cart.js — ตะกร้าของร้านใบตรวจงาน (โหลดหลัง app.js)
   ปุ่มลอยมุมล่างขวา + แผงสรุปรายการ: ชื่อ ราคาสมาชิก ส่วนที่ประหยัดของชุดรวม ยอดรวม ลบรายการ ล้างตะกร้า และไปชำระเงิน
   ปุ่มในหน้าเว็บที่มี data-add="รหัส" จะใส่รายการนั้นลงตะกร้า · ตะกร้าเก็บในเบราว์เซอร์เครื่องนี้เท่านั้น */
(function () {
  "use strict";
  var B = window.BUILD; if (!B || !B.cart) return;
  var esc = B.esc, q = B.preview;
  var css = ".bc-fab{position:fixed;right:16px;bottom:16px;z-index:60;display:none;align-items:center;gap:10px;background:#FF6B1A;color:#fff;border:0;border-radius:999px;padding:12px 20px;font:700 17px/1.2 \"Kanit\",\"Leelawadee UI\",sans-serif;box-shadow:0 12px 30px rgba(15,42,68,.35);cursor:pointer}" +
    ".bc-fab.on{display:flex}.bc-fab i{font-style:normal;background:#fff;color:#C24A08;border-radius:999px;min-width:26px;height:26px;display:grid;place-items:center;font-size:15px;padding:0 6px}" +
    ".bc-bg{position:fixed;inset:0;z-index:100;background:rgba(15,42,68,.55);display:none}.bc-bg.on{display:block}" +
    ".bc-box{position:fixed;right:0;top:0;bottom:0;z-index:101;width:min(430px,100%);background:#fff;display:none;flex-direction:column;box-shadow:-18px 0 44px rgba(15,42,68,.3);font-family:\"IBM Plex Sans Thai\",\"Leelawadee UI\",sans-serif;color:#16202B}.bc-box.on{display:flex}" +
    ".bc-hd{display:flex;align-items:center;justify-content:space-between;padding:16px 18px;background:#0F2A44;color:#fff}.bc-hd h2{margin:0;padding:0;border:0;color:#fff;font:700 20px/1.2 \"Kanit\",sans-serif}.bc-hd button{background:none;border:1.5px solid rgba(255,255,255,.5);color:#fff;border-radius:10px;min-width:42px;min-height:40px;font-size:18px;cursor:pointer}" +
    ".bc-li{list-style:none;margin:0;padding:6px 18px;overflow:auto;flex:1}.bc-li li{display:grid;grid-template-columns:1fr auto auto;gap:10px;align-items:start;padding:12px 0;border-bottom:1px dashed #DDE2E8}" +
    ".bc-li b{display:block;font-size:15.5px;color:#0F2A44}.bc-li small{display:block;color:#5A6573;font-size:13px}.bc-li small.sv{color:#1E7D4F;font-weight:600}.bc-li em{font-style:normal;font-weight:700;white-space:nowrap}" +
    ".bc-li button{background:none;border:0;color:#B3261E;font-size:20px;line-height:1;cursor:pointer;padding:2px 6px}.bc-emp{padding:26px 18px;color:#5A6573}" +
    ".bc-ft{border-top:1px solid #DDE2E8;padding:14px 18px 18px;background:#F6F4EF}.bc-sum{display:flex;justify-content:space-between;align-items:baseline;font-size:16px}.bc-sum b{font:700 26px/1 \"Kanit\",sans-serif;color:#0F2A44}" +
    ".bc-nt{color:#5A6573;font-size:13px;margin:6px 0 12px}.bc-go{display:block;text-align:center;background:#FF6B1A;color:#fff;text-decoration:none;border-radius:999px;padding:12px;font:700 18px/1.2 \"Kanit\",sans-serif}.bc-cl{display:block;margin:10px auto 0;background:none;border:0;color:#5A6573;text-decoration:underline;cursor:pointer;font:inherit;font-size:14px}" +
    ".bc-msg{position:fixed;left:50%;bottom:84px;transform:translateX(-50%);z-index:102;background:#0F2A44;color:#fff;border-radius:999px;padding:10px 20px;font-size:15px;box-shadow:0 10px 26px rgba(15,42,68,.35);display:none;max-width:92%;text-align:center}.bc-msg.on{display:block}" +
    "@media print{.bc-fab,.bc-bg,.bc-box,.bc-msg{display:none!important}}";
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
  var fab = document.createElement("button"); fab.type = "button"; fab.className = "bc-fab"; fab.setAttribute("aria-haspopup", "dialog");
  var bg = document.createElement("div"); bg.className = "bc-bg";
  var box = document.createElement("div"); box.className = "bc-box"; box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-label", "ตะกร้า");
  var msg = document.createElement("div"); msg.className = "bc-msg"; msg.setAttribute("role", "status");
  document.body.appendChild(fab); document.body.appendChild(bg); document.body.appendChild(box); document.body.appendChild(msg);
  var timer = 0;
  function say(t) { msg.textContent = t; msg.classList.add("on"); clearTimeout(timer); timer = setTimeout(function () { msg.classList.remove("on"); }, 2600); }
  function open(o) { bg.classList.toggle("on", o); box.classList.toggle("on", o); if (o) { var c = box.querySelector("[data-bc-close]"); if (c) c.focus(); } else { fab.focus(); } }
  function draw() {
    var ids = B.cart.get(), n = ids.length, total = B.cart.total();
    fab.classList.toggle("on", n > 0); fab.innerHTML = "ตะกร้า <i>" + n + "</i> " + esc(B.baht(total)); fab.setAttribute("aria-label", "เปิดตะกร้า มี " + n + " รายการ รวม " + total + " บาท");
    var rows = ids.map(function (id) {
      var x = B.find(id), bd = B.isBundle(x), sv = B.cart.saving(id);
      return "<li><div><b>" + esc(id + " " + x.title) + "</b><small>" + (bd ? "ชุดรวม " + x.items.length + " ใบ · ไฟล์ PDF" : esc(x.nPro) + " ข้อ · " + esc(x.pages || "") + " หน้า · ไฟล์ PDF") + "</small>" + (sv > 0 ? '<small class="sv">ถูกกว่าซื้อแยก ' + esc(B.baht(sv)) + "</small>" : "") + "</div><em>" + esc(B.baht(B.memberPrice(x.price))) + '</em><button type="button" data-bc-del="' + esc(id) + '" aria-label="เอา ' + esc(id) + ' ออกจากตะกร้า">×</button></li>';
    }).join("");
    box.innerHTML = '<div class="bc-hd"><h2>ตะกร้า (' + n + ')</h2><button type="button" data-bc-close="1" aria-label="ปิดตะกร้า">✕</button></div>' +
      (n ? '<ul class="bc-li">' + rows + "</ul>" : '<p class="bc-emp">ยังไม่มีรายการในตะกร้า</p>') +
      '<div class="bc-ft"><div class="bc-sum"><span>ยอดรวม ' + n + " รายการ</span><b>" + esc(B.baht(total)) + '</b></div><p class="bc-nt">ชำระด้วยการโอนเงินแล้วแนบสลิปในหน้าสมาชิก · ไฟล์ดิจิทัลเปิดดาวน์โหลดหลังร้านตรวจยอด · ไม่มีค่าจัดส่ง</p>' +
      (n ? '<a class="bc-go" href="member.html' + (q ? q + "&" : "?") + "buy=" + encodeURIComponent(ids.join(",")) + '">ไปชำระเงิน →</a><button type="button" class="bc-cl" data-bc-clear="1">ล้างตะกร้า</button>' : "") + "</div>";
    [].forEach.call(document.querySelectorAll("[data-add]"), function (b) { var id = b.getAttribute("data-add"), inC = B.cart.has(id), cov = !inC && B.cart.covered(id); b.textContent = inC ? "อยู่ในตะกร้า ✓" : cov ? "อยู่ในชุดที่เลือกแล้ว" : "ใส่ตะกร้า"; b.disabled = cov; b.setAttribute("aria-pressed", String(inC)); });
  }
  fab.addEventListener("click", function () { open(true); });
  bg.addEventListener("click", function () { open(false); });
  document.addEventListener("keydown", function (ev) { if (ev.key === "Escape" && box.classList.contains("on")) open(false); });
  box.addEventListener("click", function (ev) {
    var t = ev.target; if (!t || !t.getAttribute) return;
    if (t.getAttribute("data-bc-close")) open(false);
    else if (t.getAttribute("data-bc-del")) B.cart.remove(t.getAttribute("data-bc-del"));
    else if (t.getAttribute("data-bc-clear")) B.cart.clear();
  });
  document.addEventListener("click", function (ev) {
    var b = ev.target && ev.target.closest ? ev.target.closest("[data-add]") : null; if (!b) return;
    var id = b.getAttribute("data-add");
    if (B.cart.has(id)) { B.cart.remove(id); say("เอา " + id + " ออกจากตะกร้าแล้ว"); return; }
    var err = B.cart.add(id); say(err || "ใส่ " + id + " ลงตะกร้าแล้ว");
  });
  window.addEventListener("build-cart", draw);
  window.addEventListener("storage", function (ev) { if (ev.key === "build_cart") draw(); });
  if (location.hash === "#cart") open(true);
  draw();
})();
