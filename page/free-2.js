(function () {
  "use strict";
  var S = window.SITE || {};
  try {
    if (new URLSearchParams(location.search).get("preview") === "1") {
      var d = localStorage.getItem("build_site_draft");
      if (d) S = JSON.parse(d);
    }
  } catch (e) {}
    var esc = function (s) {
      return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
      });
    };
  var qs = new URLSearchParams(location.search), id = qs.get("id");
  if (qs.get("shot") === "1") document.body.className = "shot";
  document.getElementById("b-print").addEventListener("click", function () {
    window.print();
  });
  var epNo = {};
  (S.episodes || []).forEach(function (e) {
    epNo[e.id] = e.no;
  });
  var list = (S.freebies || []).filter(function (f) {
    return !id || f.id === id;
  });
  var B = S.brand || {}, L = S.links || {};
  var where = [S.site && S.site.url ? S.site.url.replace(/^https?:\/\//, "") : "", L.lineId ? "LINE "
    + L.lineId : ""].filter(Boolean).join(" · ");
  var lang = "th";
  try {
    if (qs.get("shot") !== "1") lang = localStorage.getItem("build_lang") || "th";
  } catch (e) {}
    var pick = function (th, en) {
      return lang === "en" && en ? en : th;
    }; // ฉบับฟรี 1 ภาษา (คำสั่ง C13)
  document.getElementById("out").innerHTML = list.length ? list.map(function (f) {
    var no = epNo[f.from] || "", code = f.code || ("BTH-C" + (no || "00")), ie = f.itemsEn || [];
    var rows = (f.items || []).map(function (x, i) {
      return '<tr><td class="n">' + (i + 1) + '</td><td class="it">' + esc(pick(x, ie[i])) + '</td><td class="c"></td><td class="r"></td></tr>';
    }).join("");
    return '<article class="sheet"><header class="hd"><div class="lg"><img src="img/logo.png" alt=""><div><b>'
      + esc(B.name) + '</b><span>เช็กลิสต์จากคลิป</span></div></div><div class="ti"><small>เช็กลิสต์ฟรี'
      + (no ? " · " + esc(B.show) + " #" + esc(no) : "") + "</small><h1>" + esc(pick(f.title, f.titleEn))
      + "</h1>" + '</div><div class="cd"><div>ใบที่</div><div>วันที่</div></div></header>' +
      '<section class="info"><div>บ้าน / โครงการ<span></span></div><div>ผู้ตรวจ<span></span></div></section>'
      +
      '<table><thead><tr><th>ที่</th><th>รายการ</th><th>ทำแล้ว</th><th>บันทึก</th></tr></thead><tbody>'
      + rows + "</tbody></table>" +
      '<p class="lgd">ติ๊กช่อง “ทำแล้ว” ทีละข้อ · จดสิ่งที่เห็นในช่องบันทึก · เก็บแผ่นนี้ไว้กับเอกสารบ้าน</p>'
      +
      (f.note ? '<p class="note">' + esc(pick(f.note, f.noteEn)) + "</p>" : "") +
      '<div class="sig"><div><h4>ผู้ตรวจ</h4><p>ลงชื่อ<span></span></p><p>วันที่<span></span></p></div><div><h4>ผู้รับทราบ</h4><p>ลงชื่อ<span></span></p><p>วันที่<span></span></p></div></div>'
      +
      ((S.sheets || []).length ? '<p class="more"><b>ต้องการตรวจงานก่อสร้างทีละขั้น</b> ดูใบตรวจงาน '
        + (S.sheets || []).filter(function (x) {
          return x.hidden !== true;
        }).length + " งาน (เสาเข็ม ฐานราก เหล็กเสริม คอนกรีต หลังคา กันซึม ไฟฟ้า ประปา และอื่น ๆ) ที่หน้าใบตรวจงานของ "
        + esc(B.name) + "</p>" : "") +
      '<div class="foot"><b>' + esc(code) + " · ฉบับวันที่ " + esc(f.revDate || "12/10/2026") + "</b><span>© "
      + esc(B.name) + " · ใช้และส่งต่อได้โดยไม่ดัดแปลง</span><span>" + esc(where) + "</span></div></article>";
  }).join("") : '<article class="sheet"><h1>ไม่พบเช็กลิสต์นี้</h1><p><a href="free.html">ดูทุกชุด</a></p></article>';
  if (list.length === 1) document.title = list[0].title + " — " + (B.name || "");
})();
