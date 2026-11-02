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
  var pLink = function (id) {
    return "product.html" + (q ? q + "&" : "?") + "id=" + encodeURIComponent(id);
  };
  var DEL = {
    file: "ดาวน์โหลดได้ทันทีหลังชำระ",
    ship: "ส่งพัสดุ",
    manual: "ร้านส่งรายละเอียดทางอีเมล"
  };
  // แสดงเฉพาะสินค้าที่ร้านตรวจแล้ว · ปุ่มใส่ตะกร้าเฉพาะสินค้าที่เปิดขาย
  var items = B.market.filter(function (x) {
    return x.ok === true && x.hidden !== true;
  }), kinds = [], cur = "ทั้งหมด";
  items.forEach(function (x) {
    if (x.kind && kinds.indexOf(x.kind) < 0) kinds.push(x.kind);
  });
  $("lead").textContent = items.length ? items.length + " รายการ · ร้านตรวจสินค้าและลิขสิทธิ์ก่อนวางขาย" : "";
  function draw() {
    var list = items.filter(function (x) {
      return cur === "ทั้งหมด" || x.kind === cur;
    });
    if (!items.length) {
      $("cards").innerHTML = '<div class="card empty2" style="grid-column:1/-1"><p style="font-size:18px;color:var(--navy);font-weight:600;margin:0 0 6px">เปิดรับฝากขายแล้ว</p><p class="note" style="margin:0 0 14px">ยังไม่มีสินค้าวางขาย · ผู้เขียนหนังสือ ผู้พัฒนาโปรแกรม และคนทำเทมเพลต ส่งใบสมัครได้เลย</p><a class="b pri" href="#apply">ส่งใบสมัครฝากขาย</a></div>';
      $("chips").hidden = true;
      return;
    }
      $("cards").innerHTML = list.map(function (x) {
        var sell = B.canSell(x);
        return '<article class="card mk"><a class="im" href="' + esc(pLink(x.id)) + '" tabindex="-1" aria-hidden="true">'
          + (x.img ? '<img src="' + esc(x.img) + '" alt="" loading="lazy">' : esc(x.kind || "สินค้า"))
          + '</a><div class="tx"><span class="kind">' + esc(x.kind) + " · " + esc(x.id) + '</span><h3><a href="'
          + esc(pLink(x.id)) + '">' + esc(x.title) + "</a></h3>" + (x.seller ? '<span class="by">โดย '
            + esc(x.seller) + "</span>" : "") + "<p>" + esc(x.sum || "") + '</p><span class="by">' + esc(DEL[x.delivery]
              || DEL.manual) + (x.format ? " · " + esc(x.format) : "") + '</span><div class="ft"><span class="price">'
          + (+x.price > 0 ? B.baht(B.memberPrice(x.price)) : "") + "</span>" + (sell ? '<button class="b pri sm" type="button" data-add="'
            + esc(x.id) + '">ใส่ตะกร้า</button>' : '<span class="pill gray">เร็ว ๆ นี้</span>') + "</div></div></article>";
      }).join("") || '<p class="note">ไม่มีสินค้าในประเภทนี้</p>';
    try {
      window.dispatchEvent(new Event("build-cart"));
    } catch (e) {}
  }
    if (kinds.length > 1) {
      $("chips").innerHTML = ["ทั้งหมด"].concat(kinds).map(function (k) {
        return '<button class="chip" type="button" data-v="' + esc(k) + '" aria-pressed="' + (k === cur)
          + '">' + esc(k) + "</button>";
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
    } else $("chips").hidden = true;
  draw();

  // ใบสมัครฝากขาย → หลังบ้าน (action consign) · กันส่งซ้ำระหว่างรอ
  function say(t, bad) {
    var m = $("msg");
    m.hidden = !t;
    m.className = "msg " + (bad ? "bad" : "ok");
    m.textContent = t || "";
    if (t) m.scrollIntoView({ block: "nearest" });
  }
    var busy = false;
  $("f-cs").addEventListener("submit", function (ev) {
    ev.preventDefault();
    if (busy) return;
    var f = ev.target, v = function (n) {
      return String(f.elements[n].value || "").trim();
    };
    if (!v("name") || !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(v("email"))) {
      say("กรอกชื่อและอีเมลให้ถูกต้อง", true);
      return;
    }
      if (!v("kind")) {
        say("เลือกประเภทสินค้า", true);
        return;
      }
      if (v("title").length < 3 || v("desc").length < 20) {
        say("กรอกชื่อสินค้า และรายละเอียดอย่างน้อย 20 ตัวอักษร", true);
        return;
      }
      if (v("url") && !/^https:\/\//.test(v("url"))) {
        say("ลิงก์ตัวอย่างต้องขึ้นต้นด้วย https://", true);
        return;
      }
      if (!f.elements.own.checked) {
        say("ยืนยันเรื่องลิขสิทธิ์และเงื่อนไขก่อนส่ง", true);
        return;
      }
      busy = true;
    var btn = f.querySelector("button[type=submit]");
    btn.disabled = true;
    btn.textContent = "กำลังส่ง…";
    B.call("consign", {
      name: v("name"),
      email: v("email").toLowerCase(),
      contact: v("contact"),
      kind: v("kind"),
      title: v("title"),
      desc: v("desc"),
      price: +v("price") || 0,
      url: v("url"),
      own: true
    })
      .then(function (r) {
        f.reset();
        say("ส่งใบสมัคร " + r.consign.id + " แล้ว · ร้านตอบกลับทางอีเมลภายใน 3 วันทำการ และส่งอีเมลยืนยันให้แล้ว");
      })
      .catch(function (e) {
        say(e && e.message ? e.message : "ส่งไม่สำเร็จ ลองใหม่อีกครั้ง", true);
      })
      .then(function () {
        busy = false;
        btn.disabled = false;
        btn.textContent = "ส่งใบสมัคร";
      });
  });
})();
