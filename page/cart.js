(function () {
  "use strict";
  var B = window.BUILD, esc = B.esc, q = B.preview;
  var $ = function (id) {
    return document.getElementById(id);
  };
  $("yr").textContent = new Date().getFullYear();
  if (B.demo) $("demo").hidden = false;
  if (q) [].forEach.call(document.querySelectorAll('a[href$=".html"]'), function (a) {
    a.href = a.getAttribute("href") + q;
  });
  var L = function (page, query) {
    return page + (q ? q + (query ? "&" + query : "") : (query ? "?" + query : ""));
  };
  var me = null; // ข้อมูลสมาชิก (ถ้าเข้าระบบแล้ว) ใช้บอกใบที่มีอยู่แล้วและราคาอัปเกรด
  function say(t, bad) {
    var m = $("msg");
    if (!t) {
      m.hidden = true;
      return;
    }
    m.hidden = false;
    m.className = "msg " + (bad ? "bad" : "ok");
    m.textContent = t;
  }

  // สิทธิ์ที่มีอยู่แล้ว: { "F-05": "edition" | "updates" }
  function rights() {
    var r = {};
    ((me && me.lib) || []).forEach(function (d) {
      r[d.id] = d.plan === "edition" ? "edition" : "updates";
    });
    if (me && !me.lib) (me.owned || []).forEach(function (k) {
      r[k] = "updates";
    });
    return r;
  }
  // ยอดของบรรทัด ตามกติกาเดียวกับหลังบ้าน: มีแบบฉบับนี้แล้ว + เลือกรับฉบับใหม่ = จ่ายส่วนต่าง (อย่างน้อย 1 บาท) · มีแล้ว = ซื้อซ้ำไม่ได้
  function lineInfo(id) {
    var x = B.find(id), R = rights(), rOff = +(me && me.pay && me.pay.repeatOff) || 0;
    var la = B.cart.lineAmt(id, R, rOff); // ยอดคิดที่เดียวใน app.js กติกาเดียวกับหลังบ้าน
    if (la.up) return {
      amt: la.amt,
      note: "คุณมีแบบซื้อฉบับนี้แล้ว · อัปเกรดเป็นรับฉบับใหม่ตลอด จ่ายเฉพาะส่วนต่าง",
      cls: "sv"
    };
    if (la.block) return {
      amt: 0,
      block: true,
      note: la.own === "updates" ? "คุณมีใบนี้แบบรับฉบับใหม่ตลอดแล้ว เอาออกจากตะกร้าได้" : "คุณมีใบนี้แล้ว · ถ้าต้องการรับฉบับใหม่ตลอด เลือกแบบนั้นเพื่ออัปเกรด จ่ายเฉพาะส่วนต่าง",
      cls: "bad"
    };
    var info = { amt: la.amt };
    if (la.off) { // มีฉบับอื่นของใบเดียวกันแล้ว: 1 ภาษา → 2 ภาษา จ่ายส่วนต่าง · กรณีอื่นลดตามส่วนลดผู้ซื้อเดิม
      info.note = la.lang ? "คุณมีฉบับ 1 ภาษาของใบนี้แล้ว · เพิ่มเป็น 2 ภาษา จ่ายเฉพาะส่วนต่าง (ประหยัด "
        + B.baht(la.off) + ")"
        : "คุณมีฉบับอื่นของใบนี้แล้ว ลด " + rOff + "% (ประหยัด " + B.baht(la.off) + ")";
      info.cls = "sv";
    }
    if (B.isBundle(x)) {
      var sfx = B.varOf(id) ? "." + B.varOf(id) : "", have = x.items.filter(function (k) {
        return R[k + sfx];
      });
      if (have.length === x.items.length) return { amt: 0, block: true, note: "คุณมีทุกใบในชุดนี้แล้ว",
        cls: "bad" };
      if (have.length) info.note = "คุณมีบางใบในชุดนี้แล้ว (" + have.join(" ") + ") · ซื้อแยกเฉพาะใบที่ยังไม่มีอาจถูกกว่า";
    }
    return info;
  }
  // ชุดรวมที่คุ้มกว่า: ใบเดี่ยวในตะกร้าครอบคลุมครึ่งหนึ่งของชุดขึ้นไป
  function upsell(ids) {
    var singles = ids.filter(function (id) {
      return !B.isBundle(B.find(id));
    }), out = [];
    B.bundles.filter(function (b) {
      return B.canSell(b) && b.id !== "B-ALL";
    }).forEach(function (b) {
      var mine = singles.filter(function (id) {
        return b.items.indexOf(B.rootOf(id)) >= 0;
      });
      if (mine.length < 2 || mine.length * 2 < b.items.length) return;
      var upd = mine.filter(B.isUpd).length * 2 > mine.length, cost = mine.reduce(function (t, id) {
        return t + B.cart.price(id);
      }, 0), v0 = B.varOf(mine[0]), same = mine.every(function (id) {
        return B.varOf(id) === v0;
      });
      // ชุดรวมฉบับเดียวกับใบที่เลือกอยู่ · ใบที่เลือกมีหลายฉบับปนกัน = เสนอชุด 2 ภาษา
      var bid = b.id + (same && v0 && B.find(b.id + "." + v0) ? "." + v0 : ""), bp = B.cart.price(bid
        + (upd && +b.priceU > 0 ? "+U" : ""));
      out.push({
        b: b,
        id: bid,
        upd: upd && +b.priceU > 0,
        extra: bp - cost,
        more: b.items.length - mine.length,
        price: bp
      });
    });
    return out.sort(function (a, c) {
      return a.extra - c.extra;
    }).slice(0, 2);
  }
  function thumb(x) {
    if (B.isBundle(x)) return '<a class="th set" href="' + esc(B.itemHref(x))
      + '" aria-hidden="true" tabindex="-1">' + esc(x.id) + "<br>" + x.items.length + " ใบ</a>";
    var s = x.of ? B.find(x.of) || x : x, img = s.ok === true && s.img ? s.img : "";
    return '<a class="th" href="' + esc(B.itemHref(x)) + '" aria-hidden="true" tabindex="-1">'
      + (img ? '<img src="' + esc(img) + '" alt="" loading="lazy">' : esc(x.id)) + "</a>";
  }
  function draw() {
    var ids = B.cart.get();
    if (!ids.length) {
      $("view").innerHTML = '<div class="card empty"><p style="font-size:18px;color:var(--navy);font-weight:600">ยังไม่มีรายการในตะกร้า</p><p class="note">เลือกใบตรวจงานหรือชุดรวม แล้วกด ใส่ตะกร้า</p><a class="b pri" href="'
        + L("sheets.html") + '">เลือกใบตรวจงาน</a></div>';
      return;
    }
    var total = 0, blocked = 0, sv = 0;
    var rows = ids.map(function (id) {
      var x = B.find(id), info = lineInfo(id), hasU = +x.priceU > 0, s = B.cart.saving(id);
      if (info.block) blocked++;
      else total += info.amt;
      if (!info.block) sv += s;
      var pl = !!(B.isPlan && B.isPlan(x)); // 28 Nov 2026 (28c): a time plan has no edition choice and no language set-up
      var sel = pl || B.isMarket(x) || B.isCtry(B.varOf(id)) ? "" : '<label class="ctl"><span class="note" style="margin:0">แบบสิทธิ์</span><select data-plan="'
        + esc(x.id) + '" aria-label="แบบสิทธิ์ของ ' + esc(x.id) + '"><option value="ed"' + (B.isUpd(id)
          ? "" : " selected") + ">ซื้อฉบับนี้ เก็บได้ตลอด · " + B.baht(B.cart.price(B.baseOf(id))) + "</option>"
        + (hasU ? '<option value="up"' + (B.isUpd(id) ? " selected" : "") + ">รับฉบับใหม่ตลอด · "
          + B.baht(B.cart.price(B.baseOf(id) + "+U")) + "</option>" : "") + "</select></label>";
      // 3 Nov 2026 (สภา + คำสั่งเจ้าของ): ระบบเต็มตั้งภาษา มาตรฐาน และที่ตั้งงานได้ที่เดียว คือหน้าต่างตั้งค่า · ในตะกร้าแสดงสรุปและปุ่มแก้
      // 21 Nov 2026 (คำสั่งเจ้าของ): รอบเปิดตัว 3ed เปลี่ยนฉบับภาษาได้ในแถวนี้เลย ไม่ต้องเปิดหน้าต่าง
      var cl = !B.isMarket(x) && B.cfg ? B.cfg.line(x.id) : "", ctry = B.isCtry(B.varOf(id)), eds = B.langsOf(x);
      var edSel = eds.length > 1 ? '<label class="ctl"><span class="note" style="margin:0">ภาษาบนใบ</span><select data-lang="'
        + esc(x.id)
        + '" aria-label="ภาษาบนใบของ ' + esc(x.id) + '">' + eds.map(function (v) {
          return '<option value="' + v + '"' + (v === B.varOf(id) ? " selected" : "") + ">" + esc(B.LANGS[v])
            + "</option>";
        }).join("") + "</select></label>" : "";
      var opt = pl || B.isMarket(x) || (B.cfg && B.cfg.simple) ? "" : '<div class="cfl" style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:6px 0 0"><small style="flex:1 1 220px;color:#0F2A44">'
        + esc(cl || "ภาษา: " + B.LANGS[B.varOf(id)] + " · มาตรฐาน: ไทย") + '</small><button class="b line sm" type="button" data-cfg="'
        + esc(x.id)
        + '">แก้ภาษา มาตรฐาน และที่ตั้งงาน</button></div>';
      return '<article class="card ln">' + (pl ? "" : thumb(x)) + '<div class="tt"><div class="nm"><a href="'
        + esc(B.itemHref(x)) + '">' + esc(B.code(x) + " " + x.title)
        + "</a><em>" + (info.block ? "–" : B.baht(info.amt)) + "</em></div>" +
        "<small>" + (pl ? "<span>แผนรายปี ใช้ได้ 1 ปีนับจากวันที่ร้านยืนยันยอด</span> · <span>ทุกใบที่เปิดใช้</span> "
          + B.planSheets().length + " <span>ใบ</span> · <span>ไม่ต่ออายุเอง ไม่ตัดเงินซ้ำ</span>" : B.isMarket(x)
          ? "สินค้าฝากขาย · " + esc(x.kind || "") + (x.seller ? " โดย " + esc(x.seller) : "")
          + " · " + esc({ file: "ดาวน์โหลดหลังชำระ", ship: "ส่งพัสดุ", manual: "ร้านส่งรายละเอียดทางอีเมล" }[x.delivery]
            || "ร้านส่งรายละเอียดทางอีเมล") : (B.isBundle(x) ? "ชุดรวม " + x.items.length + " ใบ: "
              + esc(x.items.join(" · ")) : esc(x.nPro) + " ข้อ · จุด H " + esc(x.nHold) + " · " + esc(x.pages
                || "") + " หน้า A4") + (ctry ? " · " + esc(B.LANGS[B.varOf(id)]) + " · ราคาปกติ × 1.5 · สร้างที่หน้าเอกสารอัจฉริยะ ข้อความเป็นฉบับแปล"
                  : " · เปิดใช้ในระบบเอกสาร กรอก แล้วพิมพ์หรือบันทึกเป็น PDF ได้"))
        + "</small>" + opt +
        (s > 0 && !info.block ? '<small class="sv">ถูกกว่าซื้อแยก ' + B.baht(s) + "</small>" : "")
        + (info.note ? '<small class="' + (info.cls || "") + '">' + esc(info.note) + "</small>" : "")
        +
        '<div class="ctl">' + (B.cfg && B.cfg.simple && !B.isMarket(x) ? edSel : "") + sel + '<button class="rm" type="button" data-rm="'
        + esc(x.id)
        + '">เอาออก</button></div></div></article>';
    }).join("");
    var ups = upsell(ids).map(function (u) {
      return '<div class="upsell"><span><b>ซื้อเป็น ' + esc(u.b.id + " " + u.b.title) + "</b> ได้ครบ "
        + u.b.items.length + " ใบ " + B.baht(u.price) + " · " + (u.extra <= 0 ? "ถูกกว่าที่เลือกอยู่ "
          + B.baht(-u.extra) : "จ่ายเพิ่ม " + B.baht(u.extra) + " ได้อีก " + u.more + " ใบ") + '</span><span><button class="b line sm" type="button" data-swap="'
        + esc(u.id) + '" data-upd="' + (u.upd ? 1 : 0) + '">เปลี่ยนเป็นชุดนี้</button></span></div>';
    }).join("");
    $("view").innerHTML = '<div class="cartg"><div class="lines">' + rows + ups + '<p class="note"><a href="'
      + L("sheets.html") + '">← เลือกซื้อต่อ</a></p></div>' +
      '<aside><div class="card sumc"><h2>สรุปคำสั่งซื้อ</h2><dl><dt>รายการ</dt><dd>' + (ids.length - blocked)
      + "</dd>" + (sv > 0 ? '<dt>ประหยัดจากชุดรวม</dt><dd class="sv">' + B.baht(sv) + "</dd>" : "")
      + "<dt>ค่าส่ง</dt><dd>ไม่มี (ไฟล์ดิจิทัล)</dd></dl>" +
      '<div class="tot"><span>ยอดชำระ</span><b>' + B.thbFx(total) + "</b></div>" +
      (blocked ? '<p class="msg bad" style="margin:0">มีรายการที่ซื้อซ้ำไม่ได้ ' + blocked + " รายการ เอาออกหรือเปลี่ยนแบบสิทธิ์ก่อน</p>" : "")
      +
      '<a class="b pri" href="' + L("checkout.html") + '"' + (blocked || !total ? ' aria-disabled="true" data-block="1"' : "")
      + ">ดำเนินการชำระเงิน →</a>" +
      '<p class="note">เลือกวิธีชำระเงินในขั้นถัดไป · เอกสารทุกหน้ามีชื่อผู้ได้รับสิทธิ์และเลขสิทธิ์ · เปิดใช้ได้ทุกเมื่อ</p>'
      +
      (me ? '<p class="note">ราคาคิดตามสิทธิ์ที่บัญชี ' + '<span data-noi18n="1">' + esc(me.member.email
        || me.member.name) + "</span>" + " มีอยู่แล้ว</p>" : '<p class="note">มีบัญชีอยู่แล้ว: ระบบตรวจใบที่คุณมีแล้วตอนชำระเงิน</p>')
      + "</div></aside></div>";
  }
  $("view").addEventListener("change", function (ev) {
    var t = ev.target;
    if (t.dataset.plan) {
      B.cart.setPlan(t.dataset.plan, t.value === "up");
      say("");
    } else if (t.dataset.lang) {
      B.cart.setLang(t.dataset.lang, t.value);
      if (B.cfg) B.cfg.edition(t.dataset.lang, t.value); // ให้หน้าเอกสารอัจฉริยะเปิดด้วยภาษาของฉบับที่เลือก
      say("เปลี่ยนภาษาบนใบของ " + t.dataset.lang + " เป็น " + B.LANGS[t.value] + " แล้ว");
    }
  });
  $("view").addEventListener("click", function (ev) {
    var t = ev.target.closest("[data-rm],[data-swap],[data-block],[data-cfg]");
    if (!t) return;
    if (t.dataset.cfg) {
      if (B.cfg) B.cfg.open(t.dataset.cfg, { upd: B.isUpd(B.cart.line(t.dataset.cfg)), done: draw });
      return;
    }
    if (t.dataset.block) {
      ev.preventDefault();
      say("แก้รายการที่มีป้ายสีแดงก่อน แล้วกดอีกครั้ง", true);
      return;
    }
    if (t.dataset.rm) {
      B.cart.remove(t.dataset.rm);
      say("เอา " + t.dataset.rm + " ออกจากตะกร้าแล้ว");
      return;
    }
    if (t.dataset.swap) {
      var err = B.cart.add(t.dataset.swap, t.dataset.upd === "1");
      say(err || "เปลี่ยนเป็น " + t.dataset.swap + " แล้ว ใบเดี่ยวที่อยู่ในชุดถูกเอาออกให้", !!err);
    }
  });
  window.addEventListener("build-cart", draw);
  draw();
  document.addEventListener("DOMContentLoaded", draw); // cart.js โหลดหลังไฟล์นี้: วาดใหม่เมื่อหน้าต่างตั้งค่าพร้อม
  if (B.token.get()) B.call("me").then(function (r) {
    me = r;
    draw();
  }).catch(function () {});
})();
