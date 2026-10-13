/* nav.js — แถบเมนูเดียวกันทุกหน้า (วาง <div id="hdr"></div> ไว้บนสุดของ body แล้วโหลดไฟล์นี้หลัง data.js)
   จอแคบ: ปุ่มเมนู ☰ เปิดรายการเต็มความกว้าง · จอกว้าง: เมนูแนวนอน · หน้าเดียวกันใช้ลิงก์ #หัวข้อ */
(function () {
  "use strict";
  var S = window.SITE || {};
  try { if (new URLSearchParams(location.search).get("preview") === "1") { var dr = localStorage.getItem("build_site_draft"); if (dr) S = JSON.parse(dr); } } catch (e) {}
  var here = (location.pathname.split("/").pop() || "index.html").toLowerCase(); if (!/\.html$/.test(here)) here = "index.html";
  var pv = /[?&]preview=1/.test(location.search) ? "?preview=1" : "";
  var logged = false; try { logged = !!localStorage.getItem("build_member_token"); } catch (e) {}
  var hasSheets = Array.isArray(S.sheets) && S.sheets.length > 0, memOn = !S.member || S.member.on !== false;
  var gear = (S.products || []).some(function (p) { return p.on !== false && /^https?:\/\//i.test(p.url || ""); });
  var items = [["index.html", "", "หน้าหลัก"], ["index.html", "episodes", "คลิป"], ["index.html", "free", "เช็กลิสต์ฟรี"]];
  if (hasSheets) items.push(["sheets.html", "", "ใบตรวจงาน"]);
  if (gear) items.push(["index.html", "gear", "ของที่ใช้ในคลิป"]);
  items.push(["index.html", "service", "บริการ"], ["index.html", "shop", "ร้าน"], ["index.html", "music", "เพลง"], ["index.html", "about", "เกี่ยวกับ"]);
  if (hasSheets && memOn) items.push(["member.html", "", logged ? "บัญชีของฉัน" : "สมาชิก", "cta"]);
  function href(it) { if (it[0] === here && it[1]) return "#" + it[1]; return it[0] + pv + (it[1] ? "#" + it[1] : ""); }
  var css = ".bh{position:sticky;top:0;z-index:40;background:rgba(15,42,68,.96);backdrop-filter:blur(8px);color:#fff;font-family:\"IBM Plex Sans Thai\",\"Leelawadee UI\",sans-serif}" +
    ".bh-in{max-width:1080px;margin:0 auto;padding:0 16px;display:flex;align-items:center;gap:12px;min-height:58px}" +
    ".bh-logo{display:flex;align-items:center;gap:10px;text-decoration:none;color:#fff;font-family:\"Kanit\",sans-serif;font-weight:700;font-size:18px;white-space:nowrap;flex:none}" +
    ".bh-logo img{width:34px;height:34px;object-fit:contain}.bh-logo b{color:#FF6B1A}" +
    ".bh-nav{display:flex;gap:2px;margin-left:auto;align-items:center}" +
    ".bh-nav a{text-decoration:none;font-size:14.5px;padding:8px 11px;border-radius:999px;color:#D5E1EE;white-space:nowrap}" +
    ".bh-nav a:hover,.bh-nav a[aria-current]{background:rgba(255,255,255,.13);color:#fff}" +
    ".bh-nav a.cta{background:#FF6B1A;color:#fff;font-weight:700;margin-left:6px}.bh-nav a.cta:hover{background:#FF7C33}" +
    ".bh-btn{display:none;margin-left:auto;background:none;border:1.5px solid rgba(255,255,255,.45);color:#fff;border-radius:11px;min-width:46px;min-height:42px;font-size:20px;line-height:1;cursor:pointer;font-family:inherit}" +
    "@media(max-width:920px){.bh-btn{display:block}.bh-nav{display:none;position:absolute;left:0;right:0;top:58px;background:#0F2A44;flex-direction:column;align-items:stretch;gap:0;padding:6px 12px 14px;border-top:1px solid rgba(255,255,255,.14);box-shadow:0 14px 30px rgba(0,0,0,.3);max-height:calc(100vh - 58px);overflow:auto}" +
    ".bh.open .bh-nav{display:flex}.bh-nav a{font-size:17px;padding:13px 12px;border-radius:12px;border-bottom:1px solid rgba(255,255,255,.07)}.bh-nav a.cta{margin:10px 0 0;text-align:center;border-bottom:0}}" +
    "@media print{.bh{display:none!important}}";
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
  var box = document.getElementById("hdr"); if (!box) return;

  box.className = "bh";
  var h = '<div class="bh-in"><a class="bh-logo" href="' + (here === "index.html" ? "#top" : "index.html" + pv) + '"><img src="img/logo.png" alt="" width="34" height="34"><span>สร้าง <b>|</b> BUILD TH</span></a>' +
    '<button class="bh-btn" type="button" aria-expanded="false" aria-controls="bh-nav" aria-label="เปิดเมนู">☰</button><nav class="bh-nav" id="bh-nav" aria-label="เมนูหลัก">';
  items.forEach(function (it) { var on = it[0] === here && !it[1]; h += '<a href="' + href(it) + '"' + (it[3] ? ' class="' + it[3] + '"' : "") + (on ? ' aria-current="page"' : "") + ">" + it[2] + "</a>"; });
  box.innerHTML = h + "</nav></div>";
  var btn = box.querySelector(".bh-btn");
  function setOpen(o) { box.classList.toggle("open", o); btn.setAttribute("aria-expanded", String(o)); btn.textContent = o ? "✕" : "☰"; btn.setAttribute("aria-label", o ? "ปิดเมนู" : "เปิดเมนู"); }
  btn.addEventListener("click", function () { setOpen(!box.classList.contains("open")); });
  box.querySelector(".bh-nav").addEventListener("click", function (ev) { if (ev.target.closest("a")) setOpen(false); });
  document.addEventListener("keydown", function (ev) { if (ev.key === "Escape") setOpen(false); });
})();
