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
  // รายการเดียวกับหลังบ้าน (Code.gs ตัวแปร RQ_KINDS และ RQ_LANGS)
  var KINDS = ["ใบตรวจงานภาษาอื่น", "เกณฑ์ตามมาตรฐานของประเทศอื่น", "ใบตรวจงานตามแบบของโครงการ",
    "Method statement", "เช็กลิสต์เอกสารขออนุญาต", "แบบฟอร์มอื่น"];
  var RQ = window.REGION.request(), LANGS = RQ.langs, SAMPLE = RQ.sample, LCODE = RQ.code;
  $("kind").innerHTML = '<option value="">เลือกประเภทงาน</option>' + KINDS.map(function (k) {
    return "<option>" + esc(k) + "</option>";
  }).join("");
  /* 3 Nov 2026: the Thai word for a language can also mean the country. The name comes from the browser in the language of the page, and the value stays the Thai name that the back end checks. */
  var UI = "th";
  try {
    UI = localStorage.getItem("build_lang") || "th";
  } catch (e) {}
    function lgName(l) {
      var c = LCODE[l];
      if (!c || UI === "th") return l;
      try {
        return new Intl.DisplayNames([UI], { type: "language" }).of(c) || l;
      } catch (e) {
        return l;
      }
    }
  function lgOpt(l, sel) {
    var R = window.REGION, c = LCODE[l], n = lgName(l), o = c && R && R.ownName ? R.ownName(c) : "";
    return '<option value="' + esc(l) + '"' + (l === sel ? " selected" : "") + (c ? ' data-lc="' + c
      + '"' + (UI !== "th" ? ' data-noi18n="1"' : "") : ' data-last="1"') + ">" + esc(o && o !== n
        ? n + " · " + o : n) + "</option>";
  }
  (function () {
    var R = window.REGION, sp = $("stdPick"), oth = sp.querySelector('[value="other"]');
    if (!B.CTRY || !R) return;
    Object.keys(B.CTRY).forEach(function (k) {
      var o = document.createElement("option");
      o.value = k;
      o.setAttribute("data-lc", k);
      o.setAttribute("data-src", B.CTRY[k][0]);
      o.setAttribute("data-noi18n", "1");
      o.textContent = UI === "th" ? B.CTRY[k][0] : R.regionName(k, UI);
      sp.insertBefore(o, oth);
    });
  })();
  $("lang1").innerHTML = LANGS.map(function (l) {
    return lgOpt(l, "อังกฤษ (สหรัฐอเมริกา)");
  }).join("");
  $("lang2").innerHTML = LANGS.map(function (l) {
    return lgOpt(l, "ไทย");
  }).join("");
  var P = new URLSearchParams(location.search);
  if (P.get("item")) {
    $("items").value = String(P.get("item")).replace(/[^\w .,+-]/g, "").slice(0, 300);
    $("kind").value = "ใบตรวจงานภาษาอื่น";
  }
  if (P.get("kind") && KINDS.indexOf(P.get("kind")) >= 0) $("kind").value = P.get("kind");
  function nLang() {
    var r = document.querySelector("input[name=n]:checked");
    return r ? +r.value : 2;
  }
  function draw() {
    var two = nLang() === 2;
    $("l2w").hidden = !two;
    $("l1t").textContent = two ? "ภาษาบรรทัดบน (มีช่องกรอก)" : "ภาษาของเอกสาร";
    var a = $("lang1").value, b = $("lang2").value;
    $("pv").innerHTML = "<b>ตัวอย่างหน้าตา 1 ข้อ</b><br>" + '<span data-noi18n="1">' + esc(SAMPLE[a]
      || a) + "</span> [ ช่องกรอก ] มม." + (two ? '<span class="l2"><span data-noi18n="1">' + esc(SAMPLE[b]
        || b) + "</span> ① (บรรทัดล่างชี้กล่องเดียวกัน)</span>" : "") + '<span class="l2">คำตัวอย่างเป็นฉบับร่าง เอกสารจริงมีผู้แปลตรวจก่อนส่งมอบ</span>'
      + (two && a === b ? '<span class="l2" style="color:var(--bad)">เลือกภาษาบรรทัดล่างให้ต่างจากบรรทัดบน</span>' : "");
  }
  document.addEventListener("change", function (ev) {
    if (ev.target.name === "n" || ev.target.id === "lang1" || ev.target.id === "lang2") draw();
  });
  document.addEventListener("click", function (ev) {
    var k = ev.target.closest("[data-kind]");
    if (k) {
      $("kind").value = k.getAttribute("data-kind");
    }
  });
  draw();
  function say(t, bad) {
    var m = $("msg");
    m.hidden = !t;
    m.className = "msg " + (bad ? "bad" : "ok");
    m.textContent = t || "";
    if (t) m.scrollIntoView({ block: "nearest" });
  }
  var busy = false;
  $("f-rq").addEventListener("submit", function (ev) {
    ev.preventDefault();
    if (busy) return;
    var f = ev.target, v = function (n) {
      return String(f.elements[n].value || "").trim();
    }, two = nLang() === 2;
    if (!v("name") || !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(v("email"))) {
      say("กรอกชื่อและอีเมลให้ถูกต้อง", true);
      return;
    }
    if (!v("kind")) {
      say("เลือกประเภทงาน", true);
      return;
    }
    if (two && v("lang1") === v("lang2")) {
      say("ภาษาบรรทัดล่างต้องต่างจากบรรทัดบน หรือเลือก 1 ภาษา", true);
      return;
    }
    if (v("desc").length < 10) {
      say("เล่ารายละเอียดของงานอย่างน้อย 10 ตัวอักษร", true);
      return;
    }
    if (!f.elements.consent.checked) {
      say("ติ๊กยินยอมก่อนส่งคำขอ", true);
      return;
    }
    busy = true;
    var btn = f.querySelector("button[type=submit]");
    btn.disabled = true;
    btn.textContent = "กำลังส่ง…";
    B.call("request", {
      name: v("name"),
      email: v("email").toLowerCase(),
      contact: v("contact"),
      org: v("org"),
      kind: v("kind"),
      items: v("items"),
      lang1: v("lang1"),
      lang2: two ? v("lang2") : "",
      std: (function (o) {
        return o.getAttribute("data-src") || o.text;
      })(f.elements.stdPick.options[f.elements.stdPick.selectedIndex]) + (v("law") ? " · กฎหมาย: " + v("law") : ""),
      qty: +v("qty") || 1,
      due: v("due"),
      desc: v("desc"),
      consent: true
    })
      .then(function (r) {
        f.reset();
        draw();
        say("ส่งคำขอ " + r.request.id + " แล้ว · ร้านส่งอีเมลยืนยันให้แล้ว และตอบใบเสนอราคาภายใน 3 วันทำการ");
      })
      .catch(function (e) {
        say(e && e.message ? e.message : "ส่งไม่สำเร็จ ลองใหม่อีกครั้ง", true);
      })
      .then(function () {
        busy = false;
        btn.disabled = false;
        btn.textContent = "ส่งคำขอ";
      });
  });
})();
