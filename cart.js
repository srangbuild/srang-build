/* cart.js — ตะกร้าย่อของร้าน (โหลดหลัง app.js) รุ่น 3 · 24 ต.ค. 2026
   ปุ่มลอยมุมล่างขวา + แผงสรุป: ชื่อ แบบสิทธิ์ ราคา ส่วนที่ประหยัดของชุดรวม ยอดรวม ลบรายการ · ไปหน้าตะกร้า (cart.html) หรือชำระเงิน (checkout.html)
   ปุ่มในหน้าเว็บที่มี data-add="รหัส" ใส่รายการนั้นลงตะกร้า (แบบซื้อฉบับนี้) · ตะกร้าเก็บในเบราว์เซอร์เครื่องนี้เท่านั้น
   ป้ายจำนวนในเมนูบน (.navcart i) เปลี่ยนตามตะกร้า */
(function () {
  "use strict";
  var B = window.BUILD;
  if (!B || !B.cart) return;
  var esc = B.esc, q = B.preview;
  var page = (location.pathname.split("/").pop() || "").toLowerCase();
  var onCartPage = page === "cart.html" || page === "checkout.html";
  var L = function (p) {
    return p + (q || "");
  };
  var css = ".bc-fab{position:fixed;right:16px;bottom:16px;z-index:60;display:none;align-items:center;gap:10px;background:#FF6B1A;color:#fff;border:0;border-radius:999px;padding:12px 20px;font:700 17px/1.2 \"Kanit\",\"Leelawadee UI\",sans-serif;box-shadow:0 12px 30px rgba(15,42,68,.35);cursor:pointer}"
    +
    ".bc-fab.on{display:flex}.bc-fab i{font-style:normal;background:#fff;color:#C24A08;border-radius:999px;min-width:26px;height:26px;display:grid;place-items:center;font-size:15px;padding:0 6px}"
    +
    ".bc-bg{position:fixed;inset:0;z-index:100;background:rgba(15,42,68,.55);display:none}.bc-bg.on{display:block}"
    +
    ".bc-box{position:fixed;right:0;top:0;bottom:0;z-index:101;width:min(430px,100%);background:#fff;display:none;flex-direction:column;box-shadow:-18px 0 44px rgba(15,42,68,.3);font-family:\"IBM Plex Sans Thai\",\"Leelawadee UI\",sans-serif;color:#16202B}.bc-box.on{display:flex}"
    +
    ".bc-hd{display:flex;align-items:center;justify-content:space-between;padding:16px 18px;background:#0F2A44;color:#fff}.bc-hd h2{margin:0;padding:0;border:0;color:#fff;font:700 20px/1.2 \"Kanit\",sans-serif}.bc-hd h2::before{display:none}.bc-hd button{background:none;border:1.5px solid rgba(255,255,255,.5);color:#fff;border-radius:10px;min-width:42px;min-height:40px;font-size:18px;cursor:pointer}"
    +
    ".bc-li{list-style:none;margin:0;padding:6px 18px;overflow:auto;flex:1}.bc-li li{display:grid;grid-template-columns:1fr auto auto;gap:10px;align-items:start;padding:12px 0;border-bottom:1px dashed #DDE2E8}"
    +
    ".bc-li b{display:block;font-size:15.5px;color:#0F2A44}.bc-li b a{color:inherit;text-decoration:none}.bc-li b a:hover{text-decoration:underline}.bc-li small{display:block;color:#5A6573;font-size:13px}.bc-li small.pl{color:#9A3A05;font-weight:600}.bc-li small.sv{color:#1E7D4F;font-weight:600}.bc-li em{font-style:normal;font-weight:700;white-space:nowrap}"
    +
    ".bc-li button{background:none;border:0;color:#B3261E;font-size:20px;line-height:1;cursor:pointer;padding:2px 6px}.bc-emp{padding:26px 18px;color:#5A6573}"
    +
    ".bc-ft{border-top:1px solid #DDE2E8;padding:14px 18px 18px;background:#F6F4EF;display:grid;gap:8px}.bc-sum{display:flex;justify-content:space-between;align-items:baseline;font-size:16px}.bc-sum b{font:700 26px/1 \"Kanit\",sans-serif;color:#0F2A44}"
    +
    ".bc-nt{color:#5A6573;font-size:13px;margin:0}.bc-go{display:block;text-align:center;background:#FF6B1A;color:#fff;text-decoration:none;border-radius:999px;padding:12px;font:700 18px/1.2 \"Kanit\",sans-serif}.bc-vw{display:block;text-align:center;background:#fff;color:#0F2A44;text-decoration:none;border:2px solid #DDE2E8;border-radius:999px;padding:10px;font:700 16px/1.2 \"Kanit\",sans-serif}"
    +
    ".bc-msg{position:fixed;left:50%;bottom:84px;transform:translateX(-50%);z-index:102;background:#0F2A44;color:#fff;border-radius:999px;padding:10px 20px;font-size:15px;box-shadow:0 10px 26px rgba(15,42,68,.35);display:none;max-width:92%;text-align:center}.bc-msg.on{display:block}"
    +
    ".cf-bg{position:fixed;inset:0;z-index:110;background:rgba(15,42,68,.55)}.cf-box{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:111;width:min(580px,calc(100% - 20px));max-height:calc(100% - 20px);display:flex;flex-direction:column;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 18px 44px rgba(15,42,68,.35);font-family:\"IBM Plex Sans Thai\",\"Leelawadee UI\",sans-serif;color:#16202B}"
    +
    ".cf-bd{overflow:auto;padding:14px 16px 18px;margin:0;display:grid;gap:12px}.cf-it{margin:0;font-size:15.5px;color:#0F2A44}.cf-bd fieldset{border:1px solid #DDE2E8;border-radius:10px;margin:0;padding:8px 12px 12px;display:grid;gap:8px;min-width:0}.cf-bd fieldset[hidden]{display:none}.cf-bd legend{font:700 16px/1.3 \"Kanit\",sans-serif;color:#0F2A44;padding:0 6px}"
    +
    ".cf-r{display:flex;flex-wrap:wrap;gap:4px 20px}.cf-r label{display:flex;align-items:center;gap:8px;min-height:44px;font-size:16px;cursor:pointer}.cf-r input{width:20px;height:20px}.cf-f{display:grid;gap:4px;font-size:14px;color:#5A6573}.cf-f[hidden]{display:none}.cf-f select,.cf-f input{width:100%;min-height:44px;font-size:16px;border:1.5px solid #C9D1DB;border-radius:8px;padding:6px 10px;background:#fff;color:#16202B;box-sizing:border-box}"
    +
    ".cf-o{display:grid;grid-template-columns:auto 1fr;gap:10px;align-items:start;padding:8px 10px;border-radius:8px;border:1px solid #E7EBF0;cursor:pointer}.cf-o:has(input:checked){border-color:#FF6B1A;background:#FFF6F0}.cf-o input{margin-top:3px;width:20px;height:20px}.cf-o b{color:#0F2A44;font-size:15.5px}.cf-o small{display:block;color:#5A6573;font-size:13.5px;line-height:1.55;overflow-wrap:anywhere}.cf-o small:empty{display:none}"
    +
    ".cf-nt{margin:0;color:#5A6573;font-size:13.5px;line-height:1.55;overflow-wrap:anywhere}.cf-sum{background:#F6F4EF;border-radius:10px;padding:10px 12px;font-size:14.5px;line-height:1.6;overflow-wrap:anywhere}.cf-sum:empty{display:none}.cf-sum small{display:block;color:#5A6573}.cf-p{font:700 22px/1.4 \"Kanit\",sans-serif;color:#0F2A44}.cf-err{margin:0;color:#B3261E;font-weight:600}.cf-err:empty{display:none}"
    +
    ".cf-ft{display:grid;grid-template-columns:1fr 1fr;gap:8px}.cf-ft .bc-go{border:0;cursor:pointer}.cf-ft .bc-go:disabled{opacity:.45;cursor:not-allowed}.cf-ft .bc-vw{cursor:pointer;background:#fff}body.cf-on{overflow:hidden}.bc-li small.cf{color:#0F2A44}"
    +
    "@media (max-width:859px){body.has-mbar .bc-fab{bottom:calc(84px + env(safe-area-inset-bottom))}}"
    +
    "@media print{.bc-fab,.bc-bg,.bc-box,.bc-msg{display:none!important}}";
  var st = document.createElement("style");
  st.textContent = css;
  document.head.appendChild(st);
  var fab = document.createElement("button");
  fab.type = "button";
  fab.className = "bc-fab";
  fab.setAttribute("aria-haspopup", "dialog");
  var bg = document.createElement("div");
  bg.className = "bc-bg";
  var box = document.createElement("div");
  box.className = "bc-box";
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-modal", "true");
  box.setAttribute("aria-label", "ตะกร้า");
  var msg = document.createElement("div");
  msg.className = "bc-msg";
  msg.setAttribute("role", "status");
  document.body.appendChild(fab);
  document.body.appendChild(bg);
  document.body.appendChild(box);
  document.body.appendChild(msg);
  var timer = 0;
  function say(t) {
    msg.textContent = t;
    msg.classList.add("on");
    clearTimeout(timer);
    timer = setTimeout(function () {
      msg.classList.remove("on");
    }, 2600);
  }
  function open(o) {
    bg.classList.toggle("on", o);
    box.classList.toggle("on", o);
    if (o) {
      var c = box.querySelector("[data-bc-close]");
      if (c) c.focus();
    } else {
      fab.focus();
    }
  }
  function planTx(id) {
    return B.isMarket(B.find(id)) ? "สินค้าฝากขาย" : (B.isUpd(id) ? "รับฉบับใหม่ตลอด" : "ซื้อฉบับนี้ เก็บได้ตลอด")
      + " · " + B.LANGS[B.varOf(id)];
  }
  function draw() {
    var ids = B.cart.get(), n = ids.length, total = B.cart.total();
    fab.classList.toggle("on", n > 0 && !onCartPage);
    fab.innerHTML = "ตะกร้า <i>" + n + "</i> " + esc(B.baht(total));
    fab.setAttribute("aria-label", "เปิดตะกร้า มี " + n + " รายการ รวม " + total + " บาท");
    [].forEach.call(document.querySelectorAll(".navcart i"), function (b) {
      b.textContent = n;
      b.hidden = !n;
    });
    var rows = ids.map(function (id) {
      var x = B.find(id), bd = B.isBundle(x), sv = B.cart.saving(id);
      return '<li><div><b><a href="' + esc(L("product.html") + (q ? "&" : "?") + "id=" + encodeURIComponent(x.id))
        + '">' + esc(B.code(x) + " " + x.title) + '</a></b><small class="pl">' + planTx(id) + "</small>" + (cfgLine(rootId(id))
          ? '<small class="cf">' + esc(cfgLine(rootId(id))) + "</small>" : "") + "<small>"
        + (B.isMarket(x) ? esc(x.kind || "สินค้าฝากขาย") + (x.seller ? " โดย " + esc(x.seller) : "") : bd
          ? "ชุดรวม " + x.items.length + " ใบ · " + (B.isCtry(B.varOf(id)) ? "สร้างจากหน้าเอกสารอัจฉริยะ" : "ไฟล์ PDF") : esc(x.nPro)
          + " ข้อ · " + (B.isCtry(B.varOf(id)) ? "สร้างจากหน้าเอกสารอัจฉริยะ" : esc(x.pages || "")
            + " หน้า · ไฟล์ PDF")) + "</small>" + (sv > 0 ? '<small class="sv">ถูกกว่าซื้อแยก ' + esc(B.baht(sv))
              + "</small>" : "") + "</div><em>" + esc(B.baht(B.cart.price(id))) + '</em><button type="button" data-bc-del="'
        + esc(id) + '" aria-label="เอา ' + esc(x.id) + ' ออกจากตะกร้า">×</button></li>';
    }).join("");
    box.innerHTML = '<div class="bc-hd"><h2>ตะกร้า (' + n + ')</h2><button type="button" data-bc-close="1" aria-label="ปิดตะกร้า">✕</button></div>'
      +
      (n ? '<ul class="bc-li">' + rows + "</ul>" : '<p class="bc-emp">ยังไม่มีรายการในตะกร้า</p>')
      +
      '<div class="bc-ft"><div class="bc-sum"><span>ยอดรวม ' + n + " รายการ</span><b>" + esc(B.baht(total))
      + '</b></div><p class="bc-nt">ไฟล์ดิจิทัล PDF · ไม่มีค่าส่ง · ชำระด้วยบัตร พร้อมเพย์ ทรูมันนี่ หรือโอนเงิน</p>'
      +
      (n ? '<a class="bc-go" href="' + esc(L("checkout.html")) + '">ชำระเงิน →</a><a class="bc-vw" href="'
        + esc(L("cart.html")) + '">ดูและแก้ไขตะกร้า</a>' : '<a class="bc-vw" href="' + esc(L("sheets.html"))
        + '">เลือกใบตรวจงาน</a>') + "</div>";
    [].forEach.call(document.querySelectorAll("[data-add]"), function (b) {
      var id = b.getAttribute("data-add"), inC = B.cart.has(id), cov = !inC && B.cart.covered(id);
      b.textContent = inC ? "อยู่ในตะกร้า ✓" : cov ? "อยู่ในชุดที่เลือกแล้ว" : "ใส่ตะกร้า";
      b.disabled = cov;
      b.setAttribute("aria-pressed", String(inC));
    });
  }
  /* ---------- ตั้งค่าเอกสารก่อนใส่ตะกร้า (คำสั่งเจ้าของ 3 พ.ย. 2026) ----------
     กดใส่ตะกร้าแล้วเลือกได้ทันที: 1 หรือ 2 ภาษา · ภาษาที่ 1 · ภาษาที่ 2 · ประเทศที่ตั้งงาน · ยึดมาตรฐานของประเทศใด
     มาตรฐานแสดงเป็นตัวย่อ ชื่อ และ (ประเทศ) · กฎหมายท้ายเอกสารตามประเทศที่ตั้งงาน
     ระบบเลือกฉบับที่ต้องซื้อตามสิทธิ์เดิม: อังกฤษ-ไทย · .EN · .TH · ฉบับประเทศ (ราคา × 1.5 บอกก่อนใส่ตะกร้า)
     ค่าที่เลือกเก็บในเครื่องนี้ (build_cart_cfg) หน้าเอกสารอัจฉริยะอ่านไปตั้งค่าให้ */
  var R = window.REGION, CFK = "build_cart_cfg";
  function cfgAll() {
    try {
      var o = JSON.parse(localStorage.getItem(CFK) || "{}");
      return o && typeof o === "object" && !Array.isArray(o) ? o : {};
    } catch (e) {
      return {};
    }
  }
  function cfgPut(root, c) {
    var o = cfgAll();
    if (c) o[root] = c;
    else delete o[root];
    try {
      localStorage.setItem(CFK, JSON.stringify(o));
    } catch (e) {}
  }
  function uiL() {
    try {
      return localStorage.getItem("build_lang") || "th";
    } catch (e) {
      return "th";
    }
  }
  function bl(l) {
    return String(l || "").slice(0, 2);
  }
  function need(src) {
    return new Promise(function (ok) {
      var s = document.createElement("script");
      s.src = src;
      s.onload = s.onerror = function () {
        ok();
      };
      document.head.appendChild(s);
    });
  }
  function deps() { // หน้าใบตรวจงานไม่ได้โหลดข้อมูลมาตรฐานและกฎหมายไว้ โหลดเมื่อเปิดหน้าต่างครั้งแรก
    var a = [];
    if (!window.LAWDB) a.push("doc-law.js");
    if (!window.DOCREFS) a.push("doc-refs.js");
    if (!window.DOCCOV) a.push("doc-cov.js");
    return Promise.all(a.map(need)).then(function () {
      return window.StdPick ? 0 : need("std-pick.js");
    });
  }
  function rec(cc) {
    var C = window.CC_OF || {};
    return (window.LAWDB || []).filter(function (x) {
      return C[x.country] === cc;
    })[0] || null;
  }
  function ccN(cc) {
    if (cc === "INT") return "ข้อกำหนดโครงการ";
    return window.StdPick ? window.StdPick.label(cc) : R ? R.regionName(cc, uiL()) : cc;
  }
  function lccOf(l) { // ประเทศของภาษา: อังกฤษตามแบบที่เลือก (US หรือ GB) · ภาษาอื่นใช้ประเทศแรกของภาษานั้น
    return !l ? "" : l === "en-US" ? "US" : l === "en-GB" ? "GB" : (window.LANG_CC || {})[l] || (R ? R.ccOfLang(l) : "");
  }
  function idsOf(x) {
    return B.isBundle(x) ? x.items.slice(0, 12) : [x.id];
  }
  function stdHtml(cc, ids) { // ตัวย่อและชื่อมาตรฐาน (ประเทศ) ให้คนทั่วไปอ่านเข้าใจ · ตัวรหัสไม่ส่งไปแปล
    if (cc === "INT") return "ช่องเกณฑ์เว้นให้กรอกตามข้อกำหนดโครงการ ค่าไทยพิมพ์เป็นข้อมูลอ้างอิง";
    var D0 = window.DOCREFS && window.DOCREFS.cc && window.DOCREFS.cc[cc], th = uiL() === "th", seen = {}, rows = [];
    ids.forEach(function (id) {
      var s = D0 && D0.sheets && D0.sheets[id];
      ((s && s.t) || []).forEach(function (t) {
        var k = th ? t[0] : t[5] || t[0];
        if (!seen[k]) {
          seen[k] = 1;
          rows.push([t[4] ? 0 : 1, k, th ? t[1] : t[2] || t[1]]);
        }
      });
    });
    if (!rows.length) return "ยังไม่มีรายชื่อมาตรฐานของประเทศนี้สำหรับใบนี้ ช่องเกณฑ์ให้กรอกตามข้อกำหนดโครงการ";
    rows.sort(function (a, b) {
      return a[0] - b[0];
    });
    return rows.slice(0, 4).map(function (r) {
      return '<span data-noi18n="1"><b>' + esc(r[1]) + "</b> " + esc(r[2]) + "</span>";
    }).join(" · ") + (rows.length > 4 ? " · และอีก " + (rows.length - 4) + " รายการ" : "") + ' <span data-noi18n="1">('
      + esc(ccN(cc)) + ")</span>";
  }
  function covTx(cc, ids) {
    if (cc === "TH") return "ค่าเกณฑ์ครบตามฉบับไทย";
    if (cc === "INT") return "";
    var D0 = window.DOCCOV || {}, t = 0, n = 0;
    ids.forEach(function (id) {
      t += (D0.numeric || {})[id] || 0;
      n += ((D0.cc || {})[cc] || {})[id] || 0;
    });
    return "มีค่าที่ตรวจแหล่งแล้ว " + n + " จาก " + t + " ข้อ" + (n < t ? " ข้อที่เหลือกรอกตามข้อกำหนดโครงการ" : "");
  }
  function lawHtml(cc) {
    var r = rec(cc);
    if (!r) return "ยังไม่มีข้อมูลกฎหมายของประเทศนี้ ภาคผนวกกฎหมายจะว่างไว้ให้กรอก";
    return 'กฎหมายท้ายเอกสาร: <span data-noi18n="1"><b>' + esc(r.lawName) + "</b>" + (r.lawNameLocal ? " (" + esc(r.lawNameLocal)
      + ")" : "") + "</span> · " + esc(r.authority || "") + ' · <a href="laws.html#' + esc(cc)
      + '" target="_blank" rel="noopener">ดูกฎหมายทั้งหมดของประเทศนี้</a>';
  }
  /* ฉบับที่ต้องซื้อ: ภาษาไทยและอังกฤษอยู่ในทุกฉบับ · ภาษาอื่นหรือมาตรฐานต่างประเทศต้องใช้ฉบับประเทศ 1 ประเทศ
     กฎหมายของประเทศที่ตั้งงานเป็นข้อมูลสาธารณะ ใส่ให้ทุกฉบับ จึงไม่ทำให้ราคาเปลี่ยน */
  function skuOf(x, c) {
    var L = [c.l1].concat(c.n === 2 ? [c.l2] : []).map(bl), S = c.std, U = [], miss = [];
    if (S && S !== "TH" && S !== "INT") U.push(S);
    L.forEach(function (l) {
      if (l === "th" || l === "en") return;
      if (U.some(function (k) {
        return R.langsOf(k).indexOf(l) >= 0;
      })) return;
      var k = [c.site].concat(R.list(l)).filter(function (k2) {
        return k2 && B.CTRY[k2] && R.langsOf(k2).indexOf(l) >= 0;
      })[0];
      if (k) U.push(k);
      else miss.push(l);
    });
    if (miss.length) return { err: "ภาษานี้ยังไม่เปิดขายเป็นฉบับประเทศ เลือกภาษาอื่น หรือใช้ไทยหรืออังกฤษ" };
    if (U.length > 1) return { err: "เอกสาร 1 ใบใช้ข้อมูลต่างประเทศได้ 1 ประเทศ: ให้มาตรฐานตรงกับประเทศของภาษา หรือใช้ไทยหรืออังกฤษเป็นอีกภาษา" };
    if (U.length) return B.docOn() && B.find(x.id + "." + U[0]) ? { id: x.id + "." + U[0], cc: U[0] } : { err: "ฉบับประเทศนี้ยังไม่เปิดขาย" };
    var vs = B.langsOf(x), one = c.n === 1 ? (L[0] === "en" ? "EN" : "TH") : "";
    return { id: x.id + (one && vs.indexOf(one) > 0 ? "." + one : "") };
  }
  function cfgLine(root) { // บรรทัดสรุปในตะกร้า
    var c = cfgAll()[root];
    if (!c || !R) return "";
    var ln = function (l) {
      return R.langName(l, uiL());
    };
    return "ภาษา: " + ln(c.l1) + (c.n === 2 ? " + " + ln(c.l2) : "") + " · มาตรฐาน: " + ccN(c.std) + " · ที่ตั้งงาน: " + ccN(c.site)
      + (c.city ? " (" + c.city + ")" : "");
  }
  var cf = null;
  function cfgOpen(id, o) {
    o = o || {};
    var x = B.find(id);
    if (!x) return;
    deps().then(function () {
      cfgDraw(x, o);
    });
  }
  function cfgDraw(x, o) {
    var old = cfgAll()[x.id], u0 = uiL(), def = window.StdPick ? window.StdPick.defaultCc() : "TH", l1d = u0 === "th"
      ? "th" : u0 === "en" ? "en-" + (window.EnVar ? window.EnVar.cur() : "GB") : u0, c = old || {
        n: 2,
        l1: l1d,
        l2: l1d === "th" ? "en-GB" : "th",
        site: def,
        std: lccOf(l1d) || def, // คำตอบ Q47 (3 พ.ย. 2026): มาตรฐานเริ่มต้นยึดประเทศของภาษาที่ 1 ลูกค้าเปลี่ยนได้
        city: ""
      }, langs = R ? R.docLangs() : [["th", "ไทย"], ["en-GB", "English (UK)"]], ccs = Object.keys(window.CC_OF ? (function () {
        var m = {};
        Object.keys(window.CC_OF).forEach(function (k) {
          m[window.CC_OF[k]] = 1;
        });
        return m;
      })() : B.CTRY).filter(function (k) {
        return k && k !== "INT";
      }).sort(function (a, b) {
        return ccN(a).localeCompare(ccN(b), u0);
      }), hasU = !B.isMarket(x) && +x.priceU > 0;
    var lo = function (sel) {
      return langs.map(function (l) {
        return '<option value="' + esc(l[0]) + '"' + (l[0] === sel ? " selected" : "") + ">" + esc(R ? R.langName(l[0], u0) : l[1]) + "</option>";
      }).join("");
    }, co = function (sel) {
      return ccs.map(function (k) {
        return '<option value="' + k + '"' + (k === sel ? " selected" : "") + ">" + esc(ccN(k)) + "</option>";
      }).join("");
    };
    if (!cf) {
      cf = document.createElement("div");
      cf.className = "cf-wrap";
      document.body.appendChild(cf);
    }
    cf.innerHTML = '<div class="cf-bg" data-cf-x="1"></div><div class="cf-box" role="dialog" aria-modal="true" aria-labelledby="cfH"><div class="bc-hd"><h2 id="cfH">ตั้งค่าเอกสารก่อนใส่ตะกร้า</h2><button type="button" data-cf-x="1" aria-label="ปิด">✕</button></div><form class="cf-bd" id="cfF" novalidate><p class="cf-it" data-noi18n="1"><b>'
      + esc(B.code(x) + " " + x.title) + '</b></p><fieldset><legend>1. ภาษาบนเอกสาร</legend><div class="cf-r"><label><input type="radio" name="cfn" value="1"'
      + (c.n === 1 ? " checked" : "") + '> 1 ภาษา</label><label><input type="radio" name="cfn" value="2"' + (c.n === 2 ? " checked" : "")
      + '> 2 ภาษา</label></div><label class="cf-f"><span id="cfL1t">ภาษาที่ 1 (ข้อความหลัก มีช่องกรอก)</span><select id="lang1">' + lo(c.l1)
      + '</select></label><label class="cf-f" id="cfL2w"><span>ภาษาที่ 2 (บรรทัดรอง)</span><select id="lang2">' + lo(c.l2)
      + '</select></label></fieldset><fieldset><legend>2. ประเทศที่ตั้งงานก่อสร้าง</legend><label class="cf-f"><span>ประเทศ</span><select id="cfSite" data-country-name="1">'
      + co(c.site) + '</select></label><label class="cf-f"><span>จังหวัด เมือง หรือรัฐ (ไม่บังคับ)</span><input id="cfCity" maxlength="80" autocomplete="off" data-noi18n="1" value="'
      + esc(c.city || "") + '"></label><p class="cf-nt" id="cfLaw"></p></fieldset><fieldset><legend>3. ยึดมาตรฐานของประเทศใด</legend><div id="cfStd"></div><label class="cf-f" id="cfOw" hidden><span>ประเทศอื่น</span><select id="cfOther" data-country-name="1">'
      + co(c.std) + '</select></label></fieldset>' + (hasU ? '<fieldset id="cfPl"><legend>4. แบบสิทธิ์</legend><div class="cf-r"><label><input type="radio" name="cfu" value="0"'
        + (o.upd ? "" : " checked") + '> ซื้อฉบับนี้ เก็บได้ตลอด</label><label><input type="radio" name="cfu" value="1"' + (o.upd ? " checked" : "")
        + "> รับฉบับใหม่ตลอด</label></div></fieldset>" : "") + '<div class="cf-sum" id="cfSum" aria-live="polite"></div><p class="cf-err" id="cfErr" role="alert"></p><div class="cf-ft"><button type="submit" class="bc-go">'
      + (o.now ? "ใส่ตะกร้าและชำระเงิน" : "ใส่ตะกร้า") + '</button><button type="button" class="bc-vw" data-cf-x="1">ยกเลิก</button></div></form></div>';
    var $ = function (i) {
      return cf.querySelector("#" + i);
    }, stdPick = c.std, picked = !!old;
    function cur() {
      var n = +((cf.querySelector("input[name=cfn]:checked") || {}).value || 2), s = $("cfStd").querySelector("input[name=cfs]:checked"),
        site = $("cfSite").value, k = s ? s.value : stdPick;
      return {
        n: n,
        l1: $("lang1").value,
        l2: n === 2 ? $("lang2").value : "",
        site: site,
        std: k === "other" ? $("cfOther").value : k,
        city: String($("cfCity").value || "").trim().slice(0, 80)
      };
    }
    function redraw() {
      var v = cur(), two = v.n === 2;
      $("cfL2w").hidden = !two;
      $("cfL1t").textContent = two ? "ภาษาที่ 1 (ข้อความหลัก มีช่องกรอก)" : "ภาษาของเอกสาร";
      $("cfLaw").innerHTML = lawHtml(v.site);
      var opt = [], add = function (cc, why) {
        if (!cc) return;
        var h = opt.filter(function (p) {
          return p.cc === cc;
        })[0];
        if (h) h.why.push(why);
        else opt.push({ cc: cc, why: [why] });
      };
      add(lccOf(v.l1), two ? "ประเทศของภาษาที่ 1" : "ประเทศของภาษา");
      if (two) add(lccOf(v.l2), "ประเทศของภาษาที่ 2");
      add(v.site, "ประเทศที่ตั้งงาน");
      if (!picked) stdPick = lccOf(v.l1) || v.site; // ยึดภาษาที่ 1 จนกว่าลูกค้าจะเลือกเอง
      var known = opt.some(function (p) {
        return p.cc === stdPick;
      }) || stdPick === "INT", ids = idsOf(x);
      $("cfStd").innerHTML = opt.map(function (p) {
        return '<label class="cf-o"><input type="radio" name="cfs" value="' + p.cc + '"' + (p.cc === stdPick ? " checked" : "") + "><span><b>"
          + esc(p.why.join(" และ ")) + ': <span data-noi18n="1">' + esc(ccN(p.cc)) + "</span></b><small>" + stdHtml(p.cc, ids) + "</small><small>"
          + esc(covTx(p.cc, ids)) + "</small></span></label>";
      }).join("") + '<label class="cf-o"><input type="radio" name="cfs" value="other"' + (known ? "" : " checked")
        + "><span><b>ประเทศอื่น</b><small>เลือกประเทศจากรายการด้านล่าง</small></span></label>"
        + '<label class="cf-o"><input type="radio" name="cfs" value="INT"' + (stdPick === "INT" ? " checked" : "")
        + "><span><b>ตามข้อกำหนดโครงการ</b><small>ช่องเกณฑ์เว้นให้กรอกค่าเอง</small></span></label>";
      if (!known) $("cfOther").value = stdPick;
      $("cfOw").hidden = known;
      var w = cur(), k = skuOf(x, w), up = !!(cf.querySelector("input[name=cfu]:checked") || {}).value && cf.querySelector("input[name=cfu]:checked").value === "1";
      $("cfErr").textContent = k.err || "";
      $("cfSum").innerHTML = k.err ? "" : "<b>ฉบับที่จะใส่ตะกร้า:</b> " + esc(B.code(x)) + " · " + esc(B.LANGS[B.varOf(k.id)] || "") + "<br>"
        + esc(cfgTx(w)) + '<br><b class="cf-p">' + esc(B.baht(B.cart.price(k.id + (up && !k.cc ? "+U" : "")))) + "</b>" + (k.cc
          ? " <small>ราคาปกติ × 1.5 เพราะใช้ภาษาหรือมาตรฐานของ" + esc(ccN(k.cc)) + " · ข้อความแปลด้วยเครื่อง มีคำเตือนบนเอกสาร</small>" : "")
        + "<small>ปรับค่าเหล่านี้ได้อีกครั้งที่หน้าเอกสารอัจฉริยะ</small>";
      var pl = $("cfPl");
      if (pl) pl.hidden = !!k.cc;
      cf.querySelector("button[type=submit]").disabled = !!k.err;
    }
    function cfgTx(v) {
      var ln = function (l) {
        return R ? R.langName(l, u0) : l;
      };
      return "ภาษา: " + ln(v.l1) + (v.n === 2 ? " + " + ln(v.l2) : "") + " · มาตรฐาน: " + ccN(v.std) + " · ที่ตั้งงาน: " + ccN(v.site) + (v.city
        ? " (" + v.city + ")" : "") + " · กฎหมายท้ายเอกสารตามประเทศที่ตั้งงาน";
    }
    cf.onchange = function (ev) {
      var t = ev.target;
      if (t.name === "cfs") {
        picked = true;
        stdPick = t.value === "other" ? $("cfOther").value : t.value;
      }
      if (t.id === "cfOther") {
        picked = true;
        stdPick = t.value;
      }
      if (t.id === "lang1" || t.id === "lang2") {
        var v = cur();
        if (v.n === 2 && bl(v.l1) === bl(v.l2)) $("cfErr").textContent = "เลือกภาษาที่ 2 ให้ต่างจากภาษาที่ 1";
      }
      redraw();
    };
    cf.onclick = function (ev) {
      if (ev.target.closest && ev.target.closest("[data-cf-x]")) cfClose();
    };
    $("cfF").onsubmit = function (ev) {
      ev.preventDefault();
      var v = cur();
      if (v.n === 2 && bl(v.l1) === bl(v.l2)) {
        $("cfErr").textContent = "เลือกภาษาที่ 2 ให้ต่างจากภาษาที่ 1";
        return;
      }
      var k = skuOf(x, v), up = !k.cc && !!cf.querySelector("input[name=cfu][value='1']:checked");
      if (k.err) {
        $("cfErr").textContent = k.err;
        return;
      }
      var err = B.cart.add(k.id, up);
      if (err) {
        $("cfErr").textContent = err;
        return;
      }
      cfgPut(x.id, v);
      cfClose();
      draw();
      say("ใส่ " + B.code(x) + " ลงตะกร้าแล้ว · " + cfgTx(v));
      if (o.now) location.href = L("checkout.html");
      if (typeof o.done === "function") o.done(k.id);
    };
    document.body.classList.add("cf-on");
    redraw();
    var f0 = cf.querySelector("input[name=cfn]:checked");
    if (f0) f0.focus();
  }
  function cfgClose0() {
    if (cf) cf.innerHTML = "";
    document.body.classList.remove("cf-on");
  }
  var cfClose = cfgClose0;
  document.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape" && cf && cf.innerHTML) cfClose();
  });
  B.cfg = { open: cfgOpen, line: cfgLine, all: cfgAll, put: cfgPut };
  fab.addEventListener("click", function () {
    open(true);
  });
  bg.addEventListener("click", function () {
    open(false);
  });
  document.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape" && box.classList.contains("on")) open(false);
  });
  box.addEventListener("click", function (ev) {
    var t = ev.target;
    if (!t || !t.getAttribute) return;
    if (t.getAttribute("data-bc-close")) open(false);
    else if (t.getAttribute("data-bc-del")) {
      cfgPut(rootId(t.getAttribute("data-bc-del")), null);
      B.cart.remove(t.getAttribute("data-bc-del"));
    }
  });
  function rootId(id) {
    return B.baseOf(id).replace(/\.[A-Z]{2}$/, "");
  }
  document.addEventListener("click", function (ev) {
    var b = ev.target && ev.target.closest ? ev.target.closest("[data-add]") : null;
    if (!b) return;
    var id = b.getAttribute("data-add");
    if (B.cart.has(id)) {
      cfgPut(rootId(id), null);
      B.cart.remove(id);
      say("เอา " + id + " ออกจากตะกร้าแล้ว");
      return;
    }
    var x0 = B.find(id);
    if (x0 && !B.isMarket(x0) && R) { // ใบตรวจงานและชุดรวม: ตั้งค่าภาษา มาตรฐาน และที่ตั้งงานก่อน
      cfgOpen(rootId(id));
      return;
    }
    var err = B.cart.add(id, false);
    say(err || "ใส่ " + id + " ลงตะกร้าแล้ว · กดปุ่มตะกร้าเพื่อชำระเงิน");
  });
  window.addEventListener("build-cart", draw);
  window.addEventListener("storage", function (ev) {
    if (ev.key === "build_cart") {
      draw();
      try {
        window.dispatchEvent(new Event("build-cart-ext"));
      } catch (e) {}
    }
  });
  if (location.hash === "#cart" && !onCartPage) open(true);
  B.cartUi = { open: open, say: say };
  draw();
})();
