/* cart.js — ตะกร้าย่อของร้าน (โหลดหลัง app.js) รุ่น 3 · 24 ต.ค. 2026
   ปุ่มลอยมุมล่างขวา + แผงสรุป: ชื่อ แบบสิทธิ์ ราคา ส่วนที่ประหยัดของชุดรวม ยอดรวม ลบรายการ · ไปหน้าตะกร้า (cart.html) หรือชำระเงิน (checkout.html)
   ปุ่มในหน้าเว็บที่มี data-add="รหัส" ใส่รายการนั้นลงตะกร้า (แบบซื้อฉบับนี้) · ตะกร้าเก็บในเบราว์เซอร์เครื่องนี้เท่านั้น
   ป้ายจำนวนในเมนูบน (.navcart i) เปลี่ยนตามตะกร้า */
(function () {
  "use strict";
  var B = window.BUILD; if (!B || !B.cart) return;
  var esc = B.esc, q = B.preview;
  var page = (location.pathname.split("/").pop() || "").toLowerCase();
  var onCartPage = page === "cart.html" || page === "checkout.html";
  var L = function (p) { return p + (q || ""); };
  var css = ".bc-fab{position:fixed;right:16px;bottom:16px;z-index:60;display:none;align-items:center;gap:10px;background:#FF6B1A;color:#fff;border:0;border-radius:999px;padding:12px 20px;font:700 17px/1.2 \"Kanit\",\"Leelawadee UI\",sans-serif;box-shadow:0 12px 30px rgba(15,42,68,.35);cursor:pointer}" +
    ".bc-fab.on{display:flex}.bc-fab i{font-style:normal;background:#fff;color:#C24A08;border-radius:999px;min-width:26px;height:26px;display:grid;place-items:center;font-size:15px;padding:0 6px}" +
    ".bc-bg{position:fixed;inset:0;z-index:100;background:rgba(15,42,68,.55);display:none}.bc-bg.on{display:block}" +
    ".bc-box{position:fixed;right:0;top:0;bottom:0;z-index:101;width:min(430px,100%);background:#fff;display:none;flex-direction:column;box-shadow:-18px 0 44px rgba(15,42,68,.3);font-family:\"IBM Plex Sans Thai\",\"Leelawadee UI\",sans-serif;color:#16202B}.bc-box.on{display:flex}" +
    ".bc-hd{display:flex;align-items:center;justify-content:space-between;padding:16px 18px;background:#0F2A44;color:#fff}.bc-hd h2{margin:0;padding:0;border:0;color:#fff;font:700 20px/1.2 \"Kanit\",sans-serif}.bc-hd h2::before{display:none}.bc-hd button{background:none;border:1.5px solid rgba(255,255,255,.5);color:#fff;border-radius:10px;min-width:42px;min-height:40px;font-size:18px;cursor:pointer}" +
    ".bc-li{list-style:none;margin:0;padding:6px 18px;overflow:auto;flex:1}.bc-li li{display:grid;grid-template-columns:1fr auto auto;gap:10px;align-items:start;padding:12px 0;border-bottom:1px dashed #DDE2E8}" +
    ".bc-li b{display:block;font-size:15.5px;color:#0F2A44}.bc-li b a{color:inherit;text-decoration:none}.bc-li b a:hover{text-decoration:underline}.bc-li small{display:block;color:#5A6573;font-size:13px}.bc-li small.pl{color:#9A3A05;font-weight:600}.bc-li small.sv{color:#1E7D4F;font-weight:600}.bc-li em{font-style:normal;font-weight:700;white-space:nowrap}" +
    ".bc-li button{background:none;border:0;color:#B3261E;font-size:20px;line-height:1;cursor:pointer;padding:2px 6px}.bc-emp{padding:26px 18px;color:#5A6573}" +
    ".bc-ft{border-top:1px solid #DDE2E8;padding:14px 18px 18px;background:#F6F4EF;display:grid;gap:8px}.bc-sum{display:flex;justify-content:space-between;align-items:baseline;font-size:16px}.bc-sum b{font:700 26px/1 \"Kanit\",sans-serif;color:#0F2A44}" +
    ".bc-nt{color:#5A6573;font-size:13px;margin:0}.bc-go{display:block;text-align:center;background:#FF6B1A;color:#fff;text-decoration:none;border-radius:999px;padding:12px;font:700 18px/1.2 \"Kanit\",sans-serif}.bc-vw{display:block;text-align:center;background:#fff;color:#0F2A44;text-decoration:none;border:2px solid #DDE2E8;border-radius:999px;padding:10px;font:700 16px/1.2 \"Kanit\",sans-serif}" +
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
  function planTx(id) { return B.isMarket(B.find(id)) ? "สินค้าฝากขาย" : (B.isUpd(id) ? "รับฉบับใหม่ตลอด" : "ซื้อฉบับนี้ เก็บได้ตลอด") + " · " + B.LANGS[B.varOf(id)]; }
  function draw() {
    var ids = B.cart.get(), n = ids.length, total = B.cart.total();
    fab.classList.toggle("on", n > 0 && !onCartPage); fab.innerHTML = "ตะกร้า <i>" + n + "</i> " + esc(B.baht(total)); fab.setAttribute("aria-label", "เปิดตะกร้า มี " + n + " รายการ รวม " + total + " บาท");
    [].forEach.call(document.querySelectorAll(".navcart i"), function (b) { b.textContent = n; b.hidden = !n; });
    var rows = ids.map(function (id) {
      var x = B.find(id), bd = B.isBundle(x), sv = B.cart.saving(id);
      return '<li><div><b><a href="' + esc(L("product.html") + (q ? "&" : "?") + "id=" + encodeURIComponent(x.id)) + '">' + esc(x.id + " " + x.title) + '</a></b><small class="pl">' + planTx(id) + "</small><small>" + (B.isMarket(x) ? esc(x.kind || "สินค้าฝากขาย") + (x.seller ? " โดย " + esc(x.seller) : "") : bd ? "ชุดรวม " + x.items.length + " ใบ · ไฟล์ PDF" : esc(x.nPro) + " ข้อ · " + esc(x.pages || "") + " หน้า · ไฟล์ PDF") + "</small>" + (sv > 0 ? '<small class="sv">ถูกกว่าซื้อแยก ' + esc(B.baht(sv)) + "</small>" : "") + "</div><em>" + esc(B.baht(B.cart.price(id))) + '</em><button type="button" data-bc-del="' + esc(id) + '" aria-label="เอา ' + esc(x.id) + ' ออกจากตะกร้า">×</button></li>';
    }).join("");
    box.innerHTML = '<div class="bc-hd"><h2>ตะกร้า (' + n + ')</h2><button type="button" data-bc-close="1" aria-label="ปิดตะกร้า">✕</button></div>' +
      (n ? '<ul class="bc-li">' + rows + "</ul>" : '<p class="bc-emp">ยังไม่มีรายการในตะกร้า</p>') +
      '<div class="bc-ft"><div class="bc-sum"><span>ยอดรวม ' + n + " รายการ</span><b>" + esc(B.baht(total)) + '</b></div><p class="bc-nt">ไฟล์ดิจิทัล PDF · ไม่มีค่าส่ง · ชำระด้วยบัตร พร้อมเพย์ ทรูมันนี่ หรือโอนเงิน</p>' +
      (n ? '<a class="bc-go" href="' + esc(L("checkout.html")) + '">ชำระเงิน →</a><a class="bc-vw" href="' + esc(L("cart.html")) + '">ดูและแก้ไขตะกร้า</a>' : '<a class="bc-vw" href="' + esc(L("sheets.html")) + '">เลือกใบตรวจงาน</a>') + "</div>";
    [].forEach.call(document.querySelectorAll("[data-add]"), function (b) { var id = b.getAttribute("data-add"), inC = B.cart.has(id), cov = !inC && B.cart.covered(id); b.textContent = inC ? "อยู่ในตะกร้า ✓" : cov ? "อยู่ในชุดที่เลือกแล้ว" : "ใส่ตะกร้า"; b.disabled = cov; b.setAttribute("aria-pressed", String(inC)); });
  }
  fab.addEventListener("click", function () { open(true); });
  bg.addEventListener("click", function () { open(false); });
  document.addEventListener("keydown", function (ev) { if (ev.key === "Escape" && box.classList.contains("on")) open(false); });
  box.addEventListener("click", function (ev) {
    var t = ev.target; if (!t || !t.getAttribute) return;
    if (t.getAttribute("data-bc-close")) open(false);
    else if (t.getAttribute("data-bc-del")) B.cart.remove(t.getAttribute("data-bc-del"));
  });
  document.addEventListener("click", function (ev) {
    var b = ev.target && ev.target.closest ? ev.target.closest("[data-add]") : null; if (!b) return;
    var id = b.getAttribute("data-add");
    if (B.cart.has(id)) { B.cart.remove(id); say("เอา " + id + " ออกจากตะกร้าแล้ว"); return; }
    var err = B.cart.add(id, false); say(err || "ใส่ " + id + " ลงตะกร้าแล้ว · กดปุ่มตะกร้าเพื่อชำระเงิน");
  });
  window.addEventListener("build-cart", draw);
  window.addEventListener("storage", function (ev) { if (ev.key === "build_cart") { draw(); try { window.dispatchEvent(new Event("build-cart-ext")); } catch (e) {} } });
  if (location.hash === "#cart" && !onCartPage) open(true);
  B.cartUi = { open: open, say: say };
  draw();
})();
