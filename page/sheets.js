(function () {
  "use strict";
  var B = window.BUILD, S = B.S, esc = B.esc, q = B.preview;
  var $ = function (id) {
    return document.getElementById(id);
  };
  $("yr").textContent = new Date().getFullYear();
  if (B.demo) $("demo").hidden = false;
  if (q) [].forEach.call(document.querySelectorAll('a[href$=".html"]'), function (a) {
    a.href = a.getAttribute("href") + q;
  });
  if (B.token.get()) {
    $("join").textContent = "ไปหน้าสมาชิก";
  }
  var sh = B.sheets, groups = [], cur = "ทั้งหมด", term = "", sortBy = "code";
  var low = sh.filter(B.canSell).map(function (x) {
    return B.memberPrice(x.price);
  }).sort(function (a, b) {
    return a - b;
  })[0];
  if (low) $("cmp-price").textContent = "เริ่มต้น " + B.baht(low);
  $("hero-pts").innerHTML = ["ฉบับฟรี 1 ภาษา เลือกได้ทุกภาษา",
    "ฉบับมืออาชีพ อังกฤษ-ไทย ในใบเดียว ใช้กับทีมช่างและผู้ควบคุมงานได้",
    "จุดหยุดรอตรวจ (H) ตารางบันทึกค่า ใบข้อบกพร่อง ลงชื่อ 3 ฝ่าย",
    "ชำระแล้วดาวน์โหลดได้ทันที · ดาวน์โหลดซ้ำได้ทุกเมื่อ"].map(function (t) {
      return "<li>" + esc(t) + "</li>";
    }).join("");
  function norm(s) {
    return String(s || "").toLowerCase().replace(/[\s\-]/g, "");
  }
  function hit(x) {
    if (!term) return true;
    var t = norm(term);
    return [x.id, x.title, x.titleEn, x.group, x.sum].some(function (v) {
      return norm(v).indexOf(t) >= 0;
    });
  }
  function order(a, b) {
    if (sortBy === "price") return a.price - b.price || (a.id < b.id ? -1 : 1);
    if (sortBy === "priceD") return b.price - a.price || (a.id < b.id ? -1 : 1);
    if (sortBy === "items") return b.nPro - a.nPro;
    return 0;
  }
  $("q").addEventListener("input", function () {
    term = this.value.trim();
    draw();
  });
  $("sort").addEventListener("change", function () {
    sortBy = this.value;
    draw();
  });
  sh.forEach(function (x) {
    if (x.group && groups.indexOf(x.group) < 0) groups.push(x.group);
  });
  var ready = sh.filter(function (x) {
    return x.ok === true;
  }).length;
  var nSell = sh.filter(B.canSell).length;
  $("list-lead").textContent = sh.length + " ใบ · " + (nSell === sh.length ? "เปิดขายทุกใบ" : nSell
    ? "เปิดขาย " + nSell + " ใบ" : "ยังไม่เปิดขาย") + " · ฉบับฟรีดาวน์โหลดได้ " + ready + " ใบ 1 ภาษา"
    + (ready < sh.length ? " · ที่เหลือกำลังตรวจรายการ" : "") + " · กดชื่อใบเพื่อดูรายละเอียด";
  var pg = sh.map(function (x) {
    return +x.pages || 0;
  }).filter(Boolean);
  if (pg.length) {
    var lo = Math.min.apply(0, pg), hi = Math.max.apply(0, pg);
    $("cmp-pages").textContent = lo === hi ? String(lo) : lo + "–" + hi;
  }
  // ราคาแสดงทุกใบ · ปุ่มใส่ตะกร้ามีเฉพาะรายการที่เปิดขายแล้ว (ตรวจรายการแล้ว + เปิดขาย + เปิดรับชำระ) · ชุดรวมบอกส่วนที่ถูกกว่าซื้อแยก
  function buy(x) {
    var pr = +x.price > 0 ? '<span class="price">' + B.baht(B.memberPrice(x.price)) + "</span>" : "",
      sv = B.cart.saving(x.id);
    var save = sv > 0 ? '<span class="pill ok" style="margin-right:auto">ถูกกว่าซื้อแยก ' + B.baht(sv)
      + "</span>" : "";
    return B.canSell(x) ? save + pr + '<button class="b pri sm" type="button" data-add="' + esc(x.id)
      + '">ใส่ตะกร้า</button>' : save + pr + '<span class="pill">' + (B.reviewed(x) ? "เปิดขายเร็ว ๆ นี้" : "กำลังตรวจรายการ")
      + "</span>";
  }
  function relabel() {
    try {
      window.dispatchEvent(new Event("build-cart"));
    } catch (e) {}
  }
  function pLink(id) {
    return "product.html" + (q ? q + "&" : "?") + "id=" + encodeURIComponent(id);
  } // หน้าสินค้ารายใบ (24 ต.ค. 2026)
  function draw() {
    $("cards").innerHTML = sh.filter(function (x) {
      return (cur === "ทั้งหมด" || x.group === cur) && hit(x);
    }).slice().sort(order).map(function (x) {
      return '<article class="card sh">' + (x.ok === true ? '<a class="im" style="display:block" href="'
        + esc(pLink(x.id)) + '" tabindex="-1" aria-hidden="true"><img src="' + esc(x.img) + '" alt="" loading="lazy" width="794" height="1123"></a>' : '<div class="im wait"><span>ตัวอย่างจะแสดงเมื่อตรวจรายการเสร็จ</span></div>')
        + '<div class="tx"><span class="code">' + esc(B.code(x)) + " · " + esc(x.group) + '</span><h3><a href="'
        + esc(pLink(x.id)) + '" style="color:inherit;text-decoration:none">' + esc(x.title) + "</a></h3>"
        + (x.titleEn ? '<p lang="en" style="color:var(--mute);font-size:14px;margin-top:-4px">' + esc(x.titleEn)
          + "</p>" : "") + "<p>" + esc(x.sum) + '</p><div class="two"><div class="ver"><b>ฉบับฟรี</b><small>'
        + esc(x.nFree) + " จุดสำคัญ · " + (+x.freePages || 1) + " หน้า · 1 ภาษา</small>" + (x.ok === true
          ? '<span class="fl3"><a class="b line sm" data-noi18n="1" lang="th" href="' + esc(x.free)
          + '" download>ไทย</a><a class="b line sm" data-noi18n="1" lang="en" href="' + esc(B.freeEN(x))
          + '" download>English</a><a class="b line sm" href="doc.html' + (q ? q + "&" : "?") + "item="
          + encodeURIComponent(x.id) + '">ภาษาอื่น</a></span>' : '<span class="pill gray">กำลังตรวจรายการ</span>')
        + '</div><div class="ver pro"><b>ฉบับมืออาชีพ</b><small>' + esc(x.nPro) + " ข้อ · จุด H "
        + esc(x.nHold) + " จุด" + (x.pages ? " · " + esc(x.pages) + " หน้า" : "") + (x.revDate ? " · ฉบับวันที่ "
          + esc(String(x.revDate).replace(/^(\d{4})-(\d\d)-(\d\d).*$/, "$3/$2/$1")) : "") + "</small>"
        + buy(x) + '<a class="note" style="margin:0" href="' + esc(pLink(x.id)) + '">ดูรายละเอียด แบบสิทธิ์ และมาตรฐานอ้างอิง ›</a></div></div></div></article>';
    }).join("") || '<p class="note">' + (term ? "ไม่พบใบตรวจงานที่ตรงกับ “" + esc(term) + "” ลองคำอื่น หรือเลือกกลุ่ม ทั้งหมด" : "ยังไม่มีใบตรวจงานในกลุ่มนี้")
      + "</p>";
    relabel();
  }
  $("chips").innerHTML = ["ทั้งหมด"].concat(groups).map(function (g) {
    return '<button class="chip" type="button" data-v="' + esc(g) + '" aria-pressed="' + (g === cur)
      + '">' + esc(g) + "</button>";
  }).join("");
  $("chips").addEventListener("click", function (ev) {
    var b = ev.target.closest(".chip");
    if (!b) return;
    cur = b.getAttribute("data-v") || b.textContent;
    [].forEach.call($("chips").children, function (c) {
      c.setAttribute("aria-pressed", String(c === b));
    });
    draw();
  });
  draw();
  // แพ็กเกจตามกลุ่มผู้ใช้ (สภา 30 ต.ค. 2026): พูดภาษาคนซื้อ ไม่ใช่ภาษางานช่าง · ส่วนต่างคำนวณจริงจากราคารายใบ
  var packs = B.bundles.filter(function (x) {
    return x.aud && x.aud !== "job";
  }), AUD = { home: "บ้านและคอนโด", building: "อาคาร", factory: "โรงงาน" };
  function saveOf(x) {
    var sum = x.items.reduce(function (t, id) {
      var s = B.find(id);
      return t + (s ? B.memberPrice(s.price) : 0);
    }, 0);
    return Math.max(0, sum - B.memberPrice(x.price));
  }
  $("packcards").innerHTML = packs.map(function (x) {
    return '<div class="card pad" style="display:flex;flex-direction:column;gap:6px"><span class="code" style="font-family:Kanit,sans-serif;font-weight:700;color:#C24A08;font-size:14px">'
      + esc(AUD[x.aud] || "") + " · " + x.items.length + ' ใบ</span><h3 style="margin:0;font-size:19px;color:#0F2A44;font-family:inherit"><a href="'
      + esc(pLink(x.id)) + '" style="color:inherit;text-decoration:none">' + esc(x.title) + '</a></h3><p style="margin:0;font-weight:600;font-size:15px;color:#344054">'
      + esc(x.who || "") + '</p><p style="margin:0;font-size:15px">' + esc(x.text) + '</p><p class="note" style="margin:0">ถูกกว่าซื้อแยก '
      + B.baht(saveOf(x)) + ' · <a href="' + esc(pLink(x.id)) + '">ดูว่ามีใบอะไรบ้าง ›</a></p><div class="sum" style="margin:auto 0 0">'
      + buy(x) + "</div></div>";
  }).join("");
  if (!packs.length) $("packs").hidden = true;
  $("bundles").innerHTML = B.bundles.filter(function (x) {
    return !x.aud || x.aud === "job";
  }).map(function (x) {
    var names = x.items.map(function (id) {
      var s = B.find(id);
      return s ? s.id : id;
    }).join(" · ");
    return '<div class="card pad"><span class="code" style="font-family:Kanit,sans-serif;font-weight:700;color:#C24A08;font-size:14px">'
      + esc(B.code(x)) + " · " + x.items.length + ' ใบ</span><h3 style="margin:2px 0 4px;font-size:19px;color:#0F2A44;font-family:inherit"><a href="'
      + esc(pLink(x.id)) + '" style="color:inherit;text-decoration:none">' + esc(x.title) + '</a></h3><p style="margin:0 0 4px;font-size:15.5px">'
      + esc(x.text) + '</p><p class="note" style="margin:0 0 12px">' + esc(names) + ' · <a href="' + esc(pLink(x.id))
      + '">ดูรายละเอียดชุด ›</a></p><div class="sum" style="margin:0">' + buy(x) + "</div></div>";
  }).join("");
  if (!B.bundles.length) $("bundle").hidden = true;
  $("perks").innerHTML = (B.M.perks || []).map(function (p) {
    return "<li>" + esc(p) + "</li>";
  }).join("");
  if (B.M.on === false) $("member").hidden = true;
  var nx = S.sheetsNext || [];
  if (nx.length) {
    $("next").hidden = false;
    $("nextlist").innerHTML = nx.map(function (p) {
      return "<li>" + esc(p) + "</li>";
    }).join("");
  }
  var f02 = B.find("F-02");
  if (f02 && f02.ok === true) $("how-guide").hidden = false;
  if (B.P.hours) $("how-wait").textContent = "ร้านตรวจยอดเข้าบัญชีภายใน " + B.P.hours + " ชั่วโมง แล้วเปิดสิทธิ์ให้ดาวน์โหลด (ชำระออนไลน์ เปิดได้ทันที)";
  // 2 พ.ย. 2026: ลูกค้าภาษาอื่นเห็นว่ามาตรฐานตามประเทศของตน มีข้อมูลแล้วกี่ใบ
  (function () {
    var lg = "th";
    try {
      lg = localStorage.getItem("build_lang") || "th";
    } catch (e) {} if (lg === "th") return;
    var load = function (u, cb) {
      var s = document.createElement("script");
      s.src = u;
      s.onload = cb;
      document.head.appendChild(s);
    };
    load("doc-cov.js", function () {
      load("doc-law.js", function () {
        var cc = (window.LANG_CC || {})[lg], bar = $("ccBar");
        if (!cc || !bar) return;
        var cov = ((window.DOCCOV || {}).cc || {})[cc] || {}, n = Object.keys(cov).filter(function (k) {
          return cov[k] > 0;
        }).length, all = B.sheets.filter(function (x) {
          return /^[FT]-/.test(x.id);
        }).length, name = cc;
        try {
          name = new Intl.DisplayNames([lg], { type: "region", style: "short" }).of(cc);
        } catch (e) {}
          bar.innerHTML = '<b data-noi18n="1">' + esc(name) + ": </b><span>มีค่าที่ตรวจแล้ว " + n + " ใบ จาก "
          + all + ' ใบ ใบอื่นเปิดฟอร์มได้ และกรอกค่าตามข้อกำหนดโครงการ</span> <a href="doc.html">เปิดฟอร์มตามมาตรฐานของประเทศคุณ</a>';
        bar.hidden = false;
      });
    });
  })();
})();
