/* nav.js — แถบเมนูเดียวกันทุกหน้า (วาง <div id="hdr"></div> ไว้บนสุดของ body แล้วโหลดไฟล์นี้หลัง data.js)
   รุ่น 4 (30 ต.ค. 2026): จัดเป็นหมวด ร้านค้า · ความรู้ · คลิปและเพลง · บริการ · เกี่ยวกับ + ปุ่มภาษา ตะกร้า สมาชิก
   จอกว้าง: เมนูแนวนอน หมวดเปิดเป็นรายการย่อย · จอแคบ: ปุ่ม ☰ เปิดทุกหมวดเต็มความกว้าง · หน้าเดียวกันใช้ลิงก์ #หัวข้อ */
(function () {
  "use strict";
  var S = window.SITE || {};
  try { if (new URLSearchParams(location.search).get("preview") === "1") { var dr = localStorage.getItem("build_site_draft"); if (dr) { var dj = JSON.parse(dr); S = dj.data || dj; } } } catch (e) {}
  var here = (location.pathname.split("/").pop() || "index.html").toLowerCase(); if (!/\.html$/.test(here)) here = "index.html";
  var pv = /[?&]preview=1/.test(location.search) ? "?preview=1" : "";
  var logged = false; try { logged = !!localStorage.getItem("build_member_token"); } catch (e) {}
  var lang = "th"; try { lang = localStorage.getItem("build_lang") === "en" ? "en" : "th"; } catch (e) {}
  if (lang === "en" && !/[?&]shot=1/.test(location.search)) { ["i18n-en.js", "i18n.js"].forEach(function (f) { var sc = document.createElement("script"); sc.src = f; sc.async = false; document.head.appendChild(sc); }); }
  var hasSheets = Array.isArray(S.sheets) && S.sheets.length > 0, memOn = !S.member || S.member.on !== false;
  var gear = (S.products || []).some(function (p) { return p.on !== false && /^https?:\/\//i.test(p.url || ""); });
  // [หน้า, #หัวข้อ, ชื่อไทย, ชื่ออังกฤษ]
  var menu = [
    { t: "หน้าหลัก", e: "Home", i: ["index.html", ""] },
    hasSheets ? { t: "ร้านค้า", e: "Store", sub: [["sheets.html", "packs", "แพ็กเกจตามงาน", "Packages by project"], ["sheets.html", "list", "ใบตรวจงานทีละใบ", "Check sheets"], ["market.html", "", "ร้านฝากขาย โปรแกรม หนังสือ", "Marketplace"], ["request.html", "", "สั่งทำเอกสาร ภาษา มาตรฐาน", "Custom documents"]] } : null,
    { t: "ความรู้", e: "Knowledge", sub: [["knowledge.html", "", "แหล่งความรู้ทั้งหมด", "All guides"], ["knowledge.html", "permit", "ขออนุญาตก่อสร้างและโรงงาน", "Permits"], ["knowledge.html", "ms", "Method statement", "Method statements"], ["sheets.html", "compare", "ใบตรวจงานฉบับฟรี", "Free check sheets"]] },
    { t: "คลิปและเพลง", e: "Videos", sub: [["index.html", "episodes", "คลิปทุกตอน", "All episodes"], ["index.html", "music", "เพลง", "Music"]].concat(gear ? [["index.html", "gear", "ของที่ใช้ในคลิป", "Gear in the videos"]] : []) },
    { t: "บริการ", e: "Services", i: ["index.html", "service"] },
    { t: "เกี่ยวกับ", e: "About", i: ["index.html", "about"] }
  ].filter(Boolean);
  var shopPages = ["sheets.html", "product.html", "cart.html", "checkout.html", "market.html", "request.html"];
  function href(p, h) { if (p === here && h) return "#" + h; return p + pv + (h ? "#" + h : ""); }
  var css = ".bh{position:sticky;top:0;z-index:40;background:rgba(15,42,68,.97);backdrop-filter:blur(8px);color:#fff;font-family:\"IBM Plex Sans Thai\",\"Leelawadee UI\",sans-serif}" +
    ".bh-in{max-width:1180px;margin:0 auto;padding:0 16px;display:flex;align-items:center;gap:8px;min-height:58px}" +
    ".bh-logo{display:flex;align-items:center;gap:10px;text-decoration:none;color:#fff;font-family:\"Kanit\",sans-serif;font-weight:700;font-size:18px;white-space:nowrap;flex:none}" +
    ".bh-logo img{width:34px;height:34px;object-fit:contain}.bh-logo b{color:#FF6B1A}" +
    ".bh-nav{display:flex;gap:2px;margin-left:auto;align-items:center}" +
    ".bh-nav a,.bh-top{font:inherit;text-decoration:none;font-size:14.5px;padding:8px 11px;border-radius:999px;color:#D5E1EE;white-space:nowrap;background:none;border:0;cursor:pointer}" +
    ".bh-nav a:hover,.bh-top:hover,.bh-nav a[aria-current],.bh-top.on{background:rgba(255,255,255,.13);color:#fff}" +
    ".bh-grp{position:relative}.bh-top::after{content:\" \\25BE\";font-size:11px;opacity:.8}" +
    ".bh-sub{display:none;position:absolute;left:0;top:calc(100% + 6px);min-width:250px;background:#fff;border:1px solid #D8DEE6;border-radius:14px;box-shadow:0 16px 36px rgba(15,42,68,.22);padding:6px;z-index:50}" +
    ".bh-grp.open .bh-sub{display:block}" +
    ".bh-sub a{display:block;color:#16202B;border-radius:10px;padding:9px 12px;white-space:normal;font-weight:500}.bh-sub a small{display:block;color:#5A6573;font-size:12.5px;font-weight:400}" +
    ".bh-sub a:hover,.bh-sub a[aria-current]{background:#F3F5F8;color:#0F2A44}" +
    ".bh-btn{display:none;background:none;border:1.5px solid rgba(255,255,255,.45);color:#fff;border-radius:11px;min-width:46px;min-height:42px;font-size:20px;line-height:1;cursor:pointer;font-family:inherit}" +
    ".bh-tools{display:flex;gap:6px;align-items:center;flex:none;margin-left:6px}" +
    ".bh-lwrap{position:relative}.bh-lmenu{position:absolute;right:0;top:calc(100% + 8px);width:230px;max-height:min(70vh,520px);overflow:auto;background:#fff;color:#0F2A44;border-radius:14px;box-shadow:0 14px 34px rgba(15,42,68,.3);padding:6px;z-index:120;font-size:15px}.bh-lmenu[hidden]{display:none}.bh-lmenu button,.bh-lmenu a{display:block;width:100%;min-height:44px;padding:10px 12px;border:0;background:none;color:#0F2A44;font:inherit;text-align:left;text-decoration:none;border-radius:10px;cursor:pointer}.bh-lmenu button:hover,.bh-lmenu a:hover{background:#EEF1F5}.bh-lmenu [aria-current]{font-weight:700;background:#E4EAF1}.bh-lmenu p{margin:6px 8px;font-size:12.5px;line-height:1.45;color:#475466}" +
    ".bh-lang{font:inherit;font-size:13.5px;font-weight:600;color:#fff;background:none;border:1.5px solid rgba(255,255,255,.35);border-radius:11px;min-height:42px;min-width:46px;padding:0 10px;cursor:pointer}.bh-lang:hover{background:rgba(255,255,255,.13)}" +
    ".bh-cart{position:relative;flex:none;display:inline-flex;align-items:center;gap:6px;text-decoration:none;color:#fff;border:1.5px solid rgba(255,255,255,.35);border-radius:11px;min-height:42px;padding:0 11px;font-size:14.5px;font-weight:600}.bh-cart:hover,.bh-cart[aria-current]{background:rgba(255,255,255,.13)}" +
    ".bh-cart svg{width:20px;height:20px}.bh-cart i{font-style:normal;min-width:20px;height:20px;padding:0 6px;border-radius:999px;background:#FF6B1A;color:#fff;font:700 12px/20px \"Kanit\",sans-serif;text-align:center}" +
    ".bh-mem{display:inline-flex;align-items:center;text-decoration:none;background:#FF6B1A;color:#fff;font-weight:700;font-size:14.5px;border-radius:11px;min-height:42px;padding:0 13px;white-space:nowrap}.bh-mem:hover{background:#FF7C33}" +
    "@media(max-width:1080px){.bh-btn{display:block}.bh-tools{margin-left:auto}.bh-cart span{display:none}.bh-mem{display:none}" +
    ".bh-nav{display:none;position:absolute;left:0;right:0;top:58px;background:#0F2A44;flex-direction:column;align-items:stretch;gap:0;padding:6px 12px 14px;border-top:1px solid rgba(255,255,255,.14);box-shadow:0 14px 30px rgba(0,0,0,.3);max-height:calc(100vh - 58px);overflow:auto}" +
    ".bh.open .bh-nav{display:flex}.bh-nav a,.bh-top{font-size:17px;padding:12px;border-radius:12px;text-align:left}" +
    ".bh-top{cursor:default;color:#8FA6BD;font-size:13.5px;font-weight:700;padding:14px 12px 4px}.bh-top::after{content:\"\"}.bh-top:hover{background:none;color:#8FA6BD}" +
    ".bh-sub{display:block;position:static;background:none;border:0;box-shadow:none;padding:0;min-width:0}.bh-sub a{color:#fff;padding:11px 12px;border-bottom:1px solid rgba(255,255,255,.07);font-size:16.5px}.bh-sub a small{display:none}.bh-sub a:hover,.bh-sub a[aria-current]{background:rgba(255,255,255,.13);color:#fff}" +
    ".bh-mm{display:block!important;margin-top:10px;text-align:center;background:#FF6B1A!important;color:#fff!important;font-weight:700}}" +
    "@media(min-width:1081px){.bh-mm{display:none!important}}" +
    "@media(max-width:400px){.bh-logo span{font-size:15px}}" +
    "@media print{.bh{display:none!important}}";
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
  var box = document.getElementById("hdr"); if (!box) return;
  box.className = "bh";
  function lab(t, e) { return lang === "en" ? e : t; }
  var navHtml = "";
  menu.forEach(function (m, i) {
    if (m.i) { var on = m.i[0] === here && !m.i[1]; navHtml += '<a href="' + href(m.i[0], m.i[1]) + '"' + (on ? ' aria-current="page"' : "") + ' data-noi18n="1">' + lab(m.t, m.e) + "</a>"; return; }
    var cur = m.sub.some(function (x) { return x[0] === here; }) || (i === 1 && shopPages.indexOf(here) >= 0);
    navHtml += '<div class="bh-grp"><button class="bh-top' + (cur ? " on" : "") + '" type="button" aria-expanded="false" data-noi18n="1">' + lab(m.t, m.e) + '</button><div class="bh-sub">' + m.sub.map(function (x) { var c = x[0] === here && !x[1]; return '<a href="' + href(x[0], x[1]) + '"' + (c ? ' aria-current="page"' : "") + ' data-noi18n="1">' + (lang === "en" ? x[3] : x[2] + "<small>" + x[3] + "</small>") + "</a>"; }).join("") + "</div></div>";
  });
  if (hasSheets && memOn) navHtml += '<a class="bh-mm" href="member.html' + pv + '" data-noi18n="1">' + (logged ? lab("บัญชีของฉัน", "My account") : lab("สมาชิก", "Member")) + "</a>";
  // ปุ่มตะกร้าอยู่นอกเมนูพับ เห็นทุกขนาดจอ (24 ต.ค. 2026) · จำนวนรายการอัปเดตโดย cart.js
  var nCart = 0; try { if (window.BUILD && window.BUILD.cart) nCart = window.BUILD.cart.get().length; else { var raw = JSON.parse(localStorage.getItem("build_cart") || "[]"); nCart = Array.isArray(raw) ? raw.length : 0; } } catch (e) {}
  var cartBtn = hasSheets ? '<a class="bh-cart navcart" href="cart.html' + pv + '"' + (here === "cart.html" ? ' aria-current="page"' : "") + ' aria-label="' + lab("ตะกร้า", "Cart") + '" data-noi18n="1"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.6 12.2a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.5L22 7H6"/></svg><span>' + lab("ตะกร้า", "Cart") + "</span><i" + (nCart ? "" : " hidden") + ">" + nCart + "</i></a>" : "";
  var memBtn = hasSheets && memOn ? '<a class="bh-mem" href="member.html' + pv + '"' + (here === "member.html" ? ' aria-current="page"' : "") + ' data-noi18n="1">' + (logged ? lab("บัญชีของฉัน", "My account") : lab("สมาชิก", "Member")) + "</a>" : "";
  // เมนูภาษา: ไทยและอังกฤษแปลโดยร้าน · ภาษาอื่นใช้ปุ่มแปลของเบราว์เซอร์ (ลิงก์ Google Translate ใช้ไม่ได้ เพราะ CSP ของเว็บบล็อกตามตั้งใจ ทดสอบ 31 ต.ค. 2026)
  var langMenu = '<div class="bh-lmenu" id="bh-lmenu" hidden data-noi18n="1"><button type="button" data-l="th"' + (lang === "th" ? ' aria-current="true"' : "") + '>ไทย</button><button type="button" data-l="en"' + (lang === "en" ? ' aria-current="true"' : "") + ">English</button><p>" +
    lab("ภาษาอื่น: ใช้ปุ่มแปลในเบราว์เซอร์ของคุณ (ถ้าเครื่องรองรับ) · Chrome มือถือ: เมนู ⋮ แล้วกด แปล · iPhone Safari: ปุ่ม aA แล้วกด แปลเว็บไซต์ · Edge: เมนู ⋯ แล้วกด แปล", "Other languages: use the translate button in your browser, if your device has one. Chrome on a phone: menu ⋮, then Translate. iPhone Safari: aA button, then Translate Website. Edge: menu ⋯, then Translate.") + "</p></div>";
  var langBtn = '<div class="bh-lwrap"><button class="bh-lang" type="button" id="bh-lang" aria-haspopup="true" aria-expanded="false" aria-controls="bh-lmenu" aria-label="' + lab("เลือกภาษา", "Choose language") + '" data-noi18n="1">' + (lang === "en" ? "EN" : "ไทย") + " ▾</button>" + langMenu + "</div>";
  box.innerHTML = '<div class="bh-in"><a class="bh-logo" href="' + (here === "index.html" ? "#top" : "index.html" + pv) + '" data-noi18n="1"><img src="img/logo.png" alt="" width="34" height="34"><span>สร้าง <b>|</b> BUILD TH</span></a><nav class="bh-nav" id="bh-nav" aria-label="' + lab("เมนูหลัก", "Main menu") + '">' + navHtml + '</nav><div class="bh-tools">' + langBtn + cartBtn + memBtn + '<button class="bh-btn" type="button" aria-expanded="false" aria-controls="bh-nav" aria-label="' + lab("เปิดเมนู", "Open menu") + '">☰</button></div></div>';
  var btn = box.querySelector(".bh-btn");
  function setOpen(o) { box.classList.toggle("open", o); btn.setAttribute("aria-expanded", String(o)); btn.textContent = o ? "✕" : "☰"; btn.setAttribute("aria-label", o ? lab("ปิดเมนู", "Close menu") : lab("เปิดเมนู", "Open menu")); }
  function closeGroups(except) { [].forEach.call(box.querySelectorAll(".bh-grp.open"), function (g) { if (g !== except) { g.classList.remove("open"); g.querySelector(".bh-top").setAttribute("aria-expanded", "false"); } }); }
  btn.addEventListener("click", function () { setOpen(!box.classList.contains("open")); });
  box.addEventListener("click", function (ev) {
    var top = ev.target.closest(".bh-top");
    if (top && window.matchMedia("(min-width:1081px)").matches) { var g = top.parentNode, o = !g.classList.contains("open"); closeGroups(g); g.classList.toggle("open", o); top.setAttribute("aria-expanded", String(o)); return; }
    var lb = ev.target.closest("#bh-lang"), lm = box.querySelector("#bh-lmenu");
    if (lb) { var lo = lm.hidden; lm.hidden = !lo; lb.setAttribute("aria-expanded", String(lo)); return; }
    var lc = ev.target.closest("#bh-lmenu [data-l]");
    if (lc) { if (lc.getAttribute("data-l") !== lang) { try { localStorage.setItem("build_lang", lc.getAttribute("data-l")); } catch (e) {} location.reload(); } else { lm.hidden = true; } return; }
    if (ev.target.closest(".bh-nav a")) { setOpen(false); closeGroups(); }
  });
  function closeLang() { var m = box.querySelector("#bh-lmenu"); if (m && !m.hidden) { m.hidden = true; box.querySelector("#bh-lang").setAttribute("aria-expanded", "false"); } }
  document.addEventListener("click", function (ev) { if (!ev.target.closest(".bh-grp")) closeGroups(); if (!ev.target.closest(".bh-lwrap")) closeLang(); });
  document.addEventListener("keydown", function (ev) { if (ev.key === "Escape") { setOpen(false); closeGroups(); closeLang(); } });
})();
