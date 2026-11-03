/* nav.js — แถบเมนูเดียวกันทุกหน้า (วาง <div id="hdr"></div> ไว้บนสุดของ body แล้วโหลดไฟล์นี้หลัง data.js)
   รุ่น 4 (30 ต.ค. 2026): จัดเป็นหมวด ร้านค้า · ความรู้ · คลิปและเพลง · บริการ · เกี่ยวกับ + ปุ่มภาษา ตะกร้า สมาชิก
   จอกว้าง: เมนูแนวนอน หมวดเปิดเป็นรายการย่อย · จอแคบ: ปุ่ม ☰ เปิดทุกหมวดเต็มความกว้าง · หน้าเดียวกันใช้ลิงก์ #หัวข้อ */
(function () {
  "use strict";
  var S = window.SITE || {};
  try {
    if (new URLSearchParams(location.search).get("preview") === "1") {
      var dr = localStorage.getItem("build_site_draft");
      if (dr) {
        var dj = JSON.parse(dr);
        S = dj.data || dj;
      }
    }
  } catch (e) {}
    var here = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  if (!/\.html$/.test(here)) here = "index.html";
  var pv = /[?&]preview=1/.test(location.search) ? "?preview=1" : "";
  var logged = false;
  try {
    logged = !!localStorage.getItem("build_member_token");
  } catch (e) {}
    var LL = window.REGION.menu(); /* languages: code, form of the language, short name, own name */
  var lang = "th";
  try {
    var lg = localStorage.getItem("build_lang");
    if (LL.some(function (x) {
      return x[0] === lg;
    })) lang = lg;
  } catch (e) {}
    var RG = window.REGION, enV = RG ? RG.ev() : "US"; /* 3 Nov 2026: each language has its countries (region.js). The country sets the standards, currency and date format. */
  if (lang !== "th" && !/[?&]shot=1/.test(location.search)) {
    (lang === "en" ? ["en-var.js", "i18n-en.js", "i18n.js"] : ["i18n-en.js", "i18n-core.js",
      "i18n-fix.js", "i18n.js"]).forEach(function (f) {
        var sc = document.createElement("script");
        sc.src = f;
        sc.async = false;
        document.head.appendChild(sc);
      });
  }
  var hasSheets = Array.isArray(S.sheets) && S.sheets.length > 0, memOn = !S.member || S.member.on !== false;
  var gear = (S.products || []).some(function (p) {
    return p.on !== false && /^https?:\/\//i.test(p.url || "");
  });
  // [หน้า, #หัวข้อ, ชื่อไทย, ชื่ออังกฤษ]
  var menu = [
    { t: "หน้าหลัก", e: "Home", i: ["index.html", ""] },
    hasSheets ? {
      t: "ร้านค้า",
      e: "Store",
      sub: [["sheets.html", "packs", "แพ็กเกจตามงาน", "Packages by project"], ["sheets.html", "list",
        "ใบตรวจงานทีละใบ", "Check sheets"], ["market.html", "", "ร้านฝากขาย โปรแกรม หนังสือ",
          "Marketplace"], ["doc.html", "", "ฟอร์มเอกสารอัจฉริยะ ภาษา มาตรฐาน กฎหมาย",
            "Smart documents"], ["request.html", "", "สั่งทำงานเฉพาะโครงการ", "Custom documents"]]
    } : null,
    {
      t: "ความรู้",
      e: "Knowledge",
      sub: [["knowledge.html", "", "แหล่งความรู้ทั้งหมด", "All guides"], ["knowledge.html", "permit",
        "ขออนุญาตก่อสร้างและโรงงาน", "Permits"], ["knowledge.html", "ms", "Method statement",
          "Method statements"], ["sheets.html", "compare", "ใบตรวจงานฉบับฟรี", "Free check sheets"]]
    },
    {
      t: "คลิปและเพลง",
      e: "Videos",
      sub: [["index.html", "episodes", "คลิปทุกตอน", "All episodes"], ["index.html", "music", "เพลง",
        "Music"]].concat(gear ? [["index.html", "gear", "ของที่ใช้ในคลิป", "Gear in the videos"]] : [])
    },
    { t: "บริการ", e: "Services", i: ["index.html", "service"] },
    { t: "เกี่ยวกับ", e: "About", i: ["index.html", "about"] }
  ].filter(Boolean);
  var shopPages = ["sheets.html", "product.html", "cart.html", "checkout.html", "market.html",
    "request.html"];
  function href(p, h) {
    if (p === here && h) return "#" + h;
    return p + pv + (h ? "#" + h : "");
  }

  var box = document.getElementById("hdr");
  if (!box) return;
  box.className = "bh";
  function flag(cc) {
    return RG && RG.svg ? RG.svg(cc) : "";
  } /* flags are in region.js */
  function lab(t, e) {
    return lang === "th" ? t : e;
  }
  var navHtml = "";
  menu.forEach(function (m, i) {
    if (m.i) {
      var on = m.i[0] === here && !m.i[1];
      navHtml += '<a href="' + href(m.i[0], m.i[1]) + '"' + (on ? ' aria-current="page"' : "") + ' data-noi18n="1">'
        + lab(m.t, m.e) + "</a>";
      return;
    }
    var cur = m.sub.some(function (x) {
      return x[0] === here;
    }) || (i === 1 && shopPages.indexOf(here) >= 0);
    navHtml += '<div class="bh-grp"><button class="bh-top' + (cur ? " on" : "") + '" type="button" aria-expanded="false" data-noi18n="1">'
      + lab(m.t, m.e) + '</button><div class="bh-sub">' + m.sub.map(function (x) {
        var c = x[0] === here && !x[1];
        return '<a href="' + href(x[0], x[1]) + '"' + (c ? ' aria-current="page"' : "") + ' data-noi18n="1">'
          + (lang !== "th" ? x[3] : x[2] + "<small>" + x[3] + "</small>") + "</a>";
      }).join("") + "</div></div>";
  });
  if (hasSheets && memOn) navHtml += '<a class="bh-mm" href="member.html' + pv + '" data-noi18n="1">'
    + (logged ? lab("บัญชีของฉัน", "My account") : lab("สมาชิก", "Member")) + "</a>";
  // ปุ่มตะกร้าอยู่นอกเมนูพับ เห็นทุกขนาดจอ (24 ต.ค. 2026) · จำนวนรายการอัปเดตโดย cart.js
  var nCart = 0;
  try {
    if (window.BUILD && window.BUILD.cart) nCart = window.BUILD.cart.get().length;
    else {
      var raw = JSON.parse(localStorage.getItem("build_cart") || "[]");
      nCart = Array.isArray(raw) ? raw.length : 0;
    }
  } catch (e) {}
    var cartBtn = hasSheets ? '<a class="bh-cart navcart" href="cart.html' + pv + '"' + (here === "cart.html"
      ? ' aria-current="page"' : "") + ' aria-label="' + lab("ตะกร้า", "Cart") + '" data-noi18n="1"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.6 12.2a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.5L22 7H6"/></svg><span>'
    + lab("ตะกร้า", "Cart") + "</span><i" + (nCart ? "" : " hidden") + ">" + nCart + "</i></a>" : "";
  var memBtn = hasSheets && memOn ? '<a class="bh-mem" href="member.html' + pv + '"' + (here === "member.html"
    ? ' aria-current="page"' : "") + ' data-noi18n="1">' + (logged ? lab("บัญชีของฉัน", "My account") : lab("สมาชิก",
      "Member")) + "</a>" : "";
  // เมนูภาษา: ไทยและอังกฤษแปลโดยร้าน · ภาษาอื่นใช้ปุ่มแปลของเบราว์เซอร์ (ลิงก์ Google Translate ใช้ไม่ได้ เพราะ CSP ของเว็บบล็อกตามตั้งใจ ทดสอบ 31 ต.ค. 2026)
  var uiLoc = lang === "en" ? "en-" + enV : lang, sWord = RG && RG.searchWord ? RG.searchWord(lang) : "Search";
  window.BH_SEARCH = sWord;
  /* 3 Nov 2026: alphabetical in the language on the screen. Each row also shows the own name of the language, so a reader finds it in any case. */
  var lRows = LL.map(function (x) {
    var code = x[1] ? x[0] + "-" + x[1] : x[0];
    return {
      x: x,
      code: code,
      cc: x[1] || (x[0] === "th" ? "TH" : RG ? RG.list(x[0])[0] : ""),
      n: RG && RG.langName ? RG.langName(code, uiLoc === lang ? lang : uiLoc) : x[3]
    };
  }).sort(function (a, b) {
    return a.n.localeCompare(b.n, uiLoc);
  });
  var langMenu = '<div class="bh-lmenu" id="bh-lmenu" hidden data-noi18n="1"><input class="bh-lq" id="bh-lq" type="search" autocomplete="off" spellcheck="false" placeholder="'
    + sWord + '" aria-label="' + sWord + '"><div class="bh-lgrid">' + lRows.map(function (r) {
      var x = r.x;
      return '<button type="button" data-l="' + x[0] + '"' + (x[1] ? ' data-v="' + x[1] + '"' : "")
        + ' data-code="' + r.code + '"' + (lang === x[0] && (!x[1] || x[1] === enV) ? ' aria-current="true"' : "")
        + ">" + flag(r.cc) + '<span class="bh-ln"><b>' + r.n + "</b>" + (r.n !== x[3] ? "<small>" + x[3]
          + "</small>" : "") + "</span></button>";
    }).join("") + '</div><p class="bh-lnone" hidden>' + sWord + ": 0</p><p>" + lab("ไทยและอังกฤษแปลโดยร้าน · ภาษาอื่นเป็นคำแปลฉบับร่าง คำหลักแปลแล้ว ส่วนที่เหลือแสดงเป็นอังกฤษ",
      "Thai and English are complete. Other languages are first drafts: main words are translated, and the rest stays in English.")
    + "</p><p>" +
    lab("ภาษาอื่น: ใช้ปุ่มแปลในเบราว์เซอร์ของคุณ (ถ้าเครื่องรองรับ) · Chrome มือถือ: เมนู ⋮ แล้วกด แปล · iPhone Safari: ปุ่ม aA แล้วกด แปลเว็บไซต์ · Edge: เมนู ⋯ แล้วกด แปล",
      "Other languages: use the translate button in your browser, if your device has one. Chrome on a phone: menu ⋮, then Translate. iPhone Safari: aA button, then Translate Website. Edge: menu ⋯, then Translate.")
    + "</p></div>";
  var regList = lang !== "th" && RG ? RG.list(lang, lang === "en" ? enV : "") : [], regNow = RG && lang !== "th"
    ? RG.of(lang) : "", regName = function (cc) {
      return RG.regionName(cc, lang);
    };
  if (regList.length > 1) langMenu = langMenu.replace('<input class="bh-lq"',
    '<label class="bh-reg"><span>' + lab("ประเทศ", "Country") + '</span><select id="bh-region" aria-label="'
    + lab("ประเทศของคุณ", "Your country") + '">' + regList.map(function (cc) {
      return '<option value="' + cc + '"' + (cc === regNow ? " selected" : "") + ">" + regName(cc) + "</option>";
    }).join("") + '</select></label><input class="bh-lq"');
  var langBtn = '<div class="bh-lwrap"><button class="bh-lang" type="button" id="bh-lang" aria-haspopup="true" aria-expanded="false" aria-controls="bh-lmenu" aria-label="'
    + lab("เลือกภาษา", "Choose language") + '" data-noi18n="1">' + flag(lang === "th" ? "TH" : RG ? RG.of(lang) : "")
    + " " + (LL.filter(function (x) {
      return x[0] === lang;
    })[0] || ["", "", lang.toUpperCase()])[2] + " ▾</button>" + langMenu + "</div>";
  box.innerHTML = '<div class="bh-in"><a class="bh-logo" href="' + (here === "index.html" ? "#top" : "index.html"
    + pv) + '" data-noi18n="1"><img src="img/logo.png" alt="" width="34" height="34"><span>สร้าง <b>|</b> BUILD TH</span></a><nav class="bh-nav" id="bh-nav" aria-label="'
    + lab("เมนูหลัก", "Main menu") + '">' + navHtml + '</nav><div class="bh-tools">' + langBtn + cartBtn
    + memBtn + '<button class="bh-btn" type="button" aria-expanded="false" aria-controls="bh-nav" aria-label="'
    + lab("เปิดเมนู", "Open menu") + '">☰</button></div></div>';
  var btn = box.querySelector(".bh-btn");
  function setOpen(o) {
    box.classList.toggle("open", o);
    btn.setAttribute("aria-expanded", String(o));
    btn.textContent = o ? "✕" : "☰";
    btn.setAttribute("aria-label", o ? lab("ปิดเมนู", "Close menu") : lab("เปิดเมนู", "Open menu"));
  }
  function closeGroups(except) {
    [].forEach.call(box.querySelectorAll(".bh-grp.open"), function (g) {
      if (g !== except) {
        g.classList.remove("open");
        g.querySelector(".bh-top").setAttribute("aria-expanded", "false");
      }
    });
  }
  btn.addEventListener("click", function () {
    setOpen(!box.classList.contains("open"));
  });
  box.addEventListener("click", function (ev) {
    var top = ev.target.closest(".bh-top");
    if (top && window.matchMedia("(min-width:1081px)").matches) {
      var g = top.parentNode, o = !g.classList.contains("open");
      closeGroups(g);
      g.classList.toggle("open", o);
      top.setAttribute("aria-expanded", String(o));
      return;
    }
    var lb = ev.target.closest("#bh-lang"), lm = box.querySelector("#bh-lmenu");
    if (lb) {
      var lo = lm.hidden;
      lm.hidden = !lo;
      lb.setAttribute("aria-expanded", String(lo));
      if (lo) lqOpen();
      return;
    }
    var lc = ev.target.closest("#bh-lmenu [data-l]");
    if (lc) {
      var nl = lc.getAttribute("data-l"), nv = lc.getAttribute("data-v") || "";
      if (nl !== lang || (nv && nv !== enV)) {
        try {
          localStorage.setItem("build_lang", nl);
          if (nv && RG) RG.setForm(nv);
        } catch (e) {} location.reload();
      } else {
        lm.hidden = true;
      }
      return;
    }
    if (ev.target.closest(".bh-nav a")) {
      setOpen(false);
      closeGroups();
    }
  });
  box.addEventListener("change", function (ev) {
    if (ev.target.id === "bh-region" && RG) {
      RG.set(lang, ev.target.value);
      location.reload();
    }
  });
  /* search in the language menu */
  function lqNorm(s) {
    return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }
  var lqKeys = false;
  function lqFilter(v) {
    var w = lqNorm(v).trim(), m = box.querySelector("#bh-lmenu"), n = 0;
    [].forEach.call(m.querySelectorAll("[data-code]"), function (b) {
      var hit = !w || (b.getAttribute("data-k") || "").indexOf(w) >= 0;
      b.hidden = !hit;
      if (hit) n++;
    });
    m.querySelector(".bh-lnone").hidden = n > 0;
  }
  function lqOpen() {
    var m = box.querySelector("#bh-lmenu"), q = m.querySelector("#bh-lq");
    if (!lqKeys && RG && RG.keysOfLang) {
      lqKeys = true;
      [].forEach.call(m.querySelectorAll("[data-code]"), function (b) {
        b.setAttribute("data-k", lqNorm(b.textContent + " " + RG.keysOfLang(b.getAttribute("data-code"),
          lang)));
      });
    }
    q.value = "";
    lqFilter("");
    var c = m.querySelector("[aria-current]");
    if (c) {
      var g = m.querySelector(".bh-lgrid");
      m.scrollTop = Math.max(0, c.offsetTop - g.offsetTop - 60);
    }
    if (!window.matchMedia("(pointer:coarse)").matches) q.focus();
  }
  box.addEventListener("input", function (ev) {
    if (ev.target.id === "bh-lq") lqFilter(ev.target.value);
  });
  box.addEventListener("keydown", function (ev) {
    if (ev.target.id === "bh-lq" && ev.key === "Enter") {
      ev.preventDefault();
      var f = box.querySelector("#bh-lmenu [data-code]:not([hidden])");
      if (f) f.click();
    }
  });
  function closeLang() {
    var m = box.querySelector("#bh-lmenu");
    if (m && !m.hidden) {
      m.hidden = true;
      box.querySelector("#bh-lang").setAttribute("aria-expanded", "false");
    }
  }
  document.addEventListener("click", function (ev) {
    if (!ev.target.closest(".bh-grp")) closeGroups();
    if (!ev.target.closest(".bh-lwrap") && !ev.target.closest(".pk-pop")) closeLang();
  });
  document.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape") {
      setOpen(false);
      closeGroups();
      closeLang();
    }
  });
  (function () {
    var s = document.createElement("script");
    s.src = "pick.js";
    s.async = true;
    document.head.appendChild(s);
  })(); /* search box, flags and alphabetical order for long lists */
})();
