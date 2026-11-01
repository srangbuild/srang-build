/* doc.js: smart document page (1 Nov 2026). The customer chooses language, standard and local law, then prints the sheet. No quotation step. */
(function () {
  "use strict";
  var B = window.BUILD, esc = B.esc, S = window.SITE || {}, $ = function (id) { return document.getElementById(id); };
  var LANGS = [["en", "English"], ["th", "ไทย"], ["zh", "中文"], ["hi", "हिन्दी"], ["es", "Español"], ["fr", "Français"], ["ar", "العربية"], ["bn", "বাংলা"], ["pt", "Português"], ["ru", "Русский"], ["ur", "اردو"], ["id", "Indonesia"], ["de", "Deutsch"], ["ja", "日本語"], ["tr", "Türkçe"], ["sw", "Kiswahili"], ["ta", "தமிழ்"], ["vi", "Tiếng Việt"], ["tl", "Tagalog"], ["ko", "한국어"], ["it", "Italiano"], ["nl", "Nederlands"], ["my", "မြန်မာ"], ["ms", "Melayu"], ["km", "ខ្មែរ"], ["lo", "ລາວ"]];
  var RTL = { ar: 1, ur: 1 }, STD = { th: "Thailand", int: "Project specification", hk: "Hong Kong", sg: "Singapore", other: "Other" };
  function opts(list, sel) { return list.map(function (x) { return '<option value="' + x[0] + '"' + (x[0] === sel ? " selected" : "") + ">" + x[0].toUpperCase() + " · " + esc(x[1]) + "</option>"; }).join(""); }
  var sheets = (S.sheets || []).filter(function (x) { return /^[FT]-\d\d[A-Z]?$/.test(x.id); });
  $("sheet").innerHTML = sheets.map(function (x) { return '<option value="' + esc(x.id) + '">' + esc(x.code || x.id) + " · " + esc(x.title) + "</option>"; }).join("");
  $("lang1").innerHTML = opts(LANGS, "en");
  $("lang2").innerHTML = opts(LANGS, "th");
  function nLang() { var r = document.querySelector("input[name=nlang]:checked"); return r ? +r.value : 2; }
  function drawLang() { var two = nLang() === 2; $("l2wrap").hidden = !two; $("l1txt").textContent = two ? "ภาษาที่ 1 (ข้อความหลัก)" : "ภาษาของเอกสาร"; }
  document.addEventListener("change", function (ev) { if (ev.target.name === "nlang") drawLang(); });
  drawLang();
  var LAW = window.LAWDB || [];
  $("law").innerHTML = '<option value="">ไม่ระบุประเทศ</option>' + LAW.map(function (x) { return '<option value="' + esc(x.country) + '">' + esc(x.countryTh) + " · " + esc(x.country) + "</option>"; }).join("");
  function lawOf(n) { return LAW.filter(function (x) { return x.country === n; })[0] || null; }
  function drawLaw() { var r = lawOf($("law").value); $("lawInfo").textContent = r ? [r.lawName, r.codeName].filter(Boolean).join(" · ") + " · ตรวจเมื่อ " + r.checked + (r.confidence === "official" ? "" : " · ยังไม่ยืนยันจากแหล่งทางการ") : ""; }
  document.addEventListener("change", function (ev) { if (ev.target.id === "law") drawLaw(); });
  function lawBlock(r) {
    if (!r) return "";
    var row = function (k, v) { return v ? "<div><b>" + k + ":</b> " + esc(v) + "</div>" : ""; };
    return '<section class="lawb"><h3>Legal framework: ' + esc(r.country) + "</h3>" + row("Law", r.lawName + (r.lawNameLocal ? " (" + r.lawNameLocal + ")" : "")) + row("Authority", r.authority) + row("Code", r.codeName) + row("Standards body", r.standardsBody) + row("Licensed persons", r.licensed) + row("Note", r.note) + row("Source", r.sourceUrl) + row("Source 2", r.sourceUrl2) + row("Checked", r.checked + " · " + r.confidence) + "<div>Summary for reference, not legal advice. A blank field could not be confirmed. Confirm the current text and local rules before use. No values on this sheet come from this law unless the sheet says so.</div></section>";
  }
  var q = new URLSearchParams(location.search); if (q.get("item") && sheets.some(function (x) { return x.id === q.get("item"); })) $("sheet").value = q.get("item");
  function say(t, bad) { var m = $("msg"); m.hidden = !t; m.className = "msg " + (bad ? "bad" : "ok"); m.textContent = t || ""; }
  function cell(arr, d) { var cs = [d.lang1, d.lang2, d.lang3].filter(Boolean); return (arr || []).map(function (t, i) { var c = cs[i] || "en"; return '<div class="' + (i ? (cs[i] === d.lang3 && d.lang3 ? "l3" : "l2") : "l1") + '" lang="' + c + '" dir="' + (RTL[c] ? "rtl" : "ltr") + '">' + esc(t) + "</div>"; }).join(""); }
  function field(lab, val, d) { return '<div class="fld"><div class="k">' + cell(lab, d) + '</div><div class="v">' + esc(val || "") + "</div></div>"; }
  function render(d, meta) {
    var L = d.lab, stdText = STD[d.std] + (d.stdName ? " · " + d.stdName : "");
    var h = '<header class="dh"><div><div class="dt">' + cell(d.title, d) + '</div><div class="ds">' + cell(d.sum, d) + '</div></div><div class="dc"><b>' + esc(d.code || d.id) + "</b>" + (d.revDate ? "<br>" + esc(d.revDate) : "") + "</div></header>";
    if (d.outside) h += '<div class="warn">' + esc("ภาษาหรือมาตรฐานนี้ไม่อยู่ในฉบับที่คุณซื้อ จึงแสดงเฉพาะข้อฟรี · ฉบับภาษาและมาตรฐานอื่นเป็นสินค้าแยก ร้านกำลังเปิดขาย") + "</div>";
    if (!d.owned) h += '<div class="warn">' + cell(L.sample, d) + "</div>";
    if (d.machine) h += '<div class="warn">' + cell(L.mt, d) + cell(L.draft, d) + "</div>";
    if (d.std !== "th") h += '<div class="warn">' + cell(L.intl, d) + "</div>";
    h += '<div class="flds">' + field(L.project, meta.project, d) + field(L.contractor, meta.contractor, d) + field(L.location, meta.location, d) + field(L.drawing, "", d) + field(L.date, "", d) + field(L.std, stdText, d) + field(L.law, d.law, d) + (d.stdName || d.law ? '<div class="fld"><div class="k">' + cell(L.user, d) + "</div></div>" : "") + field(L.permit, "", d) + field(L.licensed, "", d) + "</div>";
    h += lawBlock(lawOf(d.law));
    h += '<div class="key">' + cell(L.key, d) + "</div>";
    h += '<div class="tw"><table class="dtb"><thead><tr><th>#</th><th>' + cell(L.point, d) + "</th><th>" + cell(L.item, d) + "</th><th>" + cell(L.crit, d) + "</th><th>" + cell(L.method, d) + "</th><th>" + cell(L.measured, d) + "</th><th>" + cell(L.pass, d) + "</th><th>" + cell(L.fail, d) + "</th><th>" + cell(L.na, d) + "</th><th>" + cell(L.remark, d) + "</th></tr></thead><tbody>";
    var n = 0;
    d.stages.forEach(function (st) {
      h += '<tr class="st"><td colspan="10">' + cell(st.name, d) + "</td></tr>";
      st.items.forEach(function (r) { n++; h += "<tr" + (r.warn ? ' class="fl"' : "") + "><td>" + n + (r.warn ? " ⚑" : "") + '</td><td class="c"><b>' + esc(r.p) + "</b></td><td>" + cell(r.it, d) + "</td><td>" + cell(r.cr, d) + (r.ref ? '<div class="ref">' + cell(L.ref, d) + cell(r.ref, d) + "</div>" : "") + "</td><td>" + cell(r.m, d) + '</td><td class="mv"></td><td class="b"></td><td class="b"></td><td class="b"></td><td></td></tr>'; });
    });
    h += "</tbody></table></div>";
    if (d.recs.length) h += '<div class="recs"><h3>' + cell(L.rec, d) + "</h3>" + d.recs.map(function (x) { var cols = Math.max(x.cols.length, 1), blank = ""; for (var i = 0; i < 5; i++) { blank += "<tr>"; for (var j = 0; j < cols; j++) blank += "<td>&nbsp;</td>"; blank += "</tr>"; } return '<div class="rec"><b>' + cell(x.title, d) + '</b><div class="tw"><table class="dtb rect"><thead><tr>' + x.cols.map(function (k) { return "<th>" + cell(k, d) + "</th>"; }).join("") + "</tr></thead><tbody>" + blank + "</tbody></table></div></div>"; }).join("") + "</div>";
    h += '<div class="sign">' + [L.inspector, L.supervisor, L.owner].map(function (x) { return "<div>" + cell(x, d) + '<span class="ln"></span><small>' + cell(L.date, d) + "</small></div>"; }).join("") + "</div>";
    h += '<div class="fine">' + cell(L.note, d) + "</div><p class=\"fine lic\">" + esc(d.code || d.id) + " · สร้าง | BUILD TH · Licensed to " + esc(d.licensee) + (d.licNo ? " · " + esc(d.licNo) : "") + "</p>" + (d.machine ? '<div class="fine">' + cell(L.flag, d) + '</div><div class="printdraft">' + cell(L.draft, d) + "</div>" : "") + '<div class="fine editedNote" hidden>' + cell(L.edited, d) + "</div>";
    $("sheetOut").innerHTML = h;
    editing = false; $("editBtn").textContent = "แก้ไขเอกสาร"; $("addRow").hidden = true; $("result").hidden = false; $("result").scrollIntoView({ block: "start" });
  }
  var busy = false;
  $("f-doc").addEventListener("submit", function (ev) {
    ev.preventDefault(); if (busy) return;
    var f = ev.target, v = function (n) { return String(f.elements[n].value || "").trim(); }, tok = B.token.get();
    if (!tok) { say("เข้าสู่ระบบก่อนสร้างเอกสาร", true); $("loginLink").hidden = false; return; }
    var pick2 = nLang() === 2 ? v("lang2") : ""; if (v("lang1") === pick2) { say("เลือกภาษาที่ 2 ให้ต่างจากภาษาที่ 1", true); return; }
    busy = true; var b = f.querySelector("button[type=submit]"), old = b.textContent; b.disabled = true; b.textContent = "กำลังสร้างเอกสาร…"; say("ครั้งแรกของภาษานั้นอาจใช้เวลาประมาณ 1 นาที เพราะระบบแปลและตรวจทุกช่อง");
    B.call("docBuild", { token: tok, sheet: v("sheet"), lang1: v("lang1"), lang2: pick2, std: v("std"), stdName: v("stdName"), law: v("law") })
      .then(function (r) { say(""); render(r.doc, { project: v("project"), contractor: v("contractor"), location: v("location") }); })
      .catch(function (e) { say(e.message || "สร้างเอกสารไม่สำเร็จ ลองใหม่อีกครั้ง", true); })
      .then(function () { busy = false; b.disabled = false; b.textContent = old; });
  });
  $("printBtn").addEventListener("click", function () { window.print(); });
  // แก้เอกสารก่อนพิมพ์ได้ทุกช่อง · ซ่อนหรือเพิ่มรายการได้ · บรรทัดผู้มีสิทธิ์ใช้ท้ายเอกสารแก้ไม่ได้
  var editing = false;
  function setEdit(on) {
    editing = on; var box = $("sheetOut"); var en = box.querySelector(".editedNote"); if (on && en) en.hidden = false; $("editBtn").textContent = on ? "เสร็จสิ้นการแก้ไข" : "แก้ไขเอกสาร"; $("addRow").hidden = !on;
    [].forEach.call(box.querySelectorAll(".dt,.ds,.fld .v,.key,.dtb td,.dtb th,.rec,.sign div"), function (e) { if (on) e.setAttribute("contenteditable", "true"); else e.removeAttribute("contenteditable"); });
    [].forEach.call(box.querySelectorAll(".dtb tbody tr:not(.st)"), function (tr) { var x = tr.querySelector(".rm"); if (on && !x) { x = document.createElement("button"); x.type = "button"; x.className = "rm noprint"; x.textContent = "×"; x.title = "ซ่อนแถวนี้"; x.setAttribute("contenteditable", "false"); tr.cells[0].appendChild(x); } if (!on && x) x.remove(); });
  }
  $("editBtn").addEventListener("click", function () { setEdit(!editing); });
  $("sheetOut").addEventListener("click", function (ev) { var x = ev.target.closest(".rm"); if (x) x.closest("tr").remove(); });
  $("addRow").addEventListener("click", function () { var tb = document.querySelector(".dtb tbody"); if (!tb) return; var tr = document.createElement("tr"); tr.innerHTML = '<td></td><td class="c"></td><td>รายการใหม่</td><td></td><td></td><td class="mv"></td><td class="b"></td><td class="b"></td><td class="b"></td><td></td>'; tb.appendChild(tr); setEdit(true); });
})();
