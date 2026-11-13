/* doc.js: smart document page (1 Nov 2026 · country layers 2 Nov 2026 · same form as the PDF sheets 2 Nov 2026). The customer chooses language and country standard, then prints the sheet. No quotation step.
   Rule from the owner: the standard follows the country of the language. Same value in both countries = one value, both documents cited. Different values = the customer ticks one in the document.
   Rule C13 from the owner: the free edition keeps its form and its key items, in 1 language, any language. 2 languages are paid. */
(function () {
  "use strict";
  var B = window.BUILD, esc = B.esc, $ = function (id) {
    return document.getElementById(id);
  };
  var LANGS = window.REGION.docLangs();
  var RTL = { ar: 1, ur: 1, he: 1 };
  // ภาษา → ประเทศของมาตรฐาน · อังกฤษใช้หลายประเทศ จึงตามประเทศของภาษาคู่ หรือข้อกำหนดโครงการ
  var LANG_CC = window.LANG_CC || {};
  var CODE = window.CC_OF || {};
  var LAW = window.LAWDB || [], REC = {};
  LAW.forEach(function (x) {
    if (CODE[x.country]) REC[CODE[x.country]] = x;
  });
  function opts(list, sel) {
    var R = window.REGION;
    return list.map(function (x) {
      var n = R && R.langName ? R.langName(x[0], siteLang) : x[1];
      return '<option value="' + x[0] + '" data-noi18n="1"' + (x[0] === sel ? " selected" : "") + ">"
        + esc(n === x[1] ? n : n + " · " + x[1]) + "</option>";
    }).join("");
  }
  var sheets = (window.SITE && window.SITE.sheets || []).filter(function (x) {
    return /^[FT]-\d\d[A-Z]?$/.test(x.id);
  });
  $("sheet").innerHTML = sheets.map(function (x) {
    return '<option value="' + esc(x.id) + '">' + esc(x.code || x.id) + " · " + esc(x.title) + "</option>";
  }).join("");
  var siteLang = "th";
  try {
    siteLang = localStorage.getItem("build_lang") || "th";
  } catch (e) {}
    /* 3 Nov 2026: English of the US or the UK. On a Thai page the sheet stays in the form of the ready-made PDF files, which is UK English. */
    var EN_DEF = siteLang === "en" && window.EnVar ? "en-" + window.EnVar.cur() : "en-GB";
  function base(l) {
    return String(l || "").slice(0, 2);
  }
  function enDoc(d, l) { /* the sheet text arrives once in English: change it to the chosen form */
    var cs = [d.lang1, d.lang2, d.lang3].filter(Boolean), pos = cs.indexOf("en"), V = /^en-/.test(l
      || "") ? l.slice(3) : "";
    if (pos < 0 || !V || !window.EnVar) return d;
    (function walk(o) {
      if (Array.isArray(o)) {
        if (o.length === cs.length && o.every(function (x) {
          return typeof x === "string";
        })) {
          o[pos] = window.EnVar.conv(o[pos], V);
          return;
        }
          o.forEach(walk);
        return;
      }
      if (o && typeof o === "object") Object.keys(o).forEach(function (k) {
        walk(o[k]);
      });
    })(d);
    return d;
  }
  $("lang1").innerHTML = opts(LANGS, siteLang === "en" ? EN_DEF : LANGS.some(function (x) {
    return x[0] === siteLang;
  }) ? siteLang : "th");
  $("lang2").innerHTML = opts(LANGS, siteLang === "th" ? EN_DEF : "th");
  function zr(c) {
    var z = window.REGION && siteLang !== "th" ? window.REGION.list(siteLang) : [], i = z.indexOf(c);
    return i >= 0 ? i : c === "TH" ? 900 : 999;
  } /* countries that use the language of the page come first */
  function ccOpts(none) {
    var SP = window.StdPick, list = LAW.map(function (x) {
      return [CODE[x.country], SP ? SP.label(CODE[x.country]) : x.countryTh + " · " + x.country];
    }).filter(function (x) {
      return x[0];
    }).sort(function (a, b) {
      return zr(a[0]) - zr(b[0]) || a[1].localeCompare(b[1], siteLang);
    });
    return (none ? '<option value="">' + esc(none) + "</option>" : "") + '<option value="INT">ตามข้อกำหนดโครงการ (กรอกค่าเอง)</option>'
      + list.map(function (x) {
        return '<option value="' + x[0] + '">' + esc(x[1]) + "</option>";
      }).join("");
  }
  $("c1").innerHTML = ccOpts("");
  $("c2").innerHTML = ccOpts("ไม่เทียบประเทศที่ 2");
  if ($("site")) $("site").innerHTML = ccOpts("").replace(/<option value="INT">[^<]*<\/option>/, ""); // 3 Nov 2026: ประเทศที่ตั้งงาน กำหนดกฎหมายในภาคผนวก ข
  function nLang() {
    var r = document.querySelector("input[name=nlang]:checked");
    return r ? +r.value : 1;
  }
  function drawLang() {
    var two = nLang() === 2;
    $("l2wrap").hidden = !two;
    $("swapWrap").hidden = !two;
    $("l1txt").textContent = two ? "ภาษาที่ 1 (ข้อความหลัก)" : "ภาษาของเอกสาร";
  }
  var touched = { c1: false, c2: false };
  function ccOfLang(l) { // 7 พ.ย. 2026: ประเทศเริ่มต้นของภาษา ตามลำดับในทะเบียนโซน (สเปน → สเปน ไม่ใช่สหรัฐฯ) · อังกฤษตามรูปแบบที่เลือก (en-US / en-GB)
    var b0 = base(l);
    if (b0 === "en") return LANG_CC[l] || "";
    var z = window.REGION && window.REGION.list ? window.REGION.list(b0) || [] : [];
    return z[0] || LANG_CC[b0] || LANG_CC[l] || "";
  }
  function ownedCc(sheet) { // ประเทศมาตรฐานที่สิทธิ์ของสมาชิกครอบคลุม: ไทยและข้อกำหนดโครงการเสมอ + ฉบับประเทศที่ซื้อ · null = ยังไม่รู้สิทธิ์ (ยังไม่เข้าสู่ระบบ หรือยังไม่ซื้อใบนี้)
    var vs = typeof OWN === "object" && OWN ? OWN[sheet] : null;
    if (!vs) return null;
    var o = { TH: 1, INT: 1 };
    vs.forEach(function (v) {
      if (REC[v]) o[v] = 1;
    });
    return o;
  }
  var followNote = "";
  function follow() { // ภาษาไหนยึดประเทศนั้น จนกว่าลูกค้าจะเปลี่ยนเอง · 7 พ.ย. 2026: สมาชิกที่ซื้อใบนี้แล้วแต่ไม่มีฉบับประเทศนั้น ใช้มาตรฐานไทยตามฉบับที่ซื้อ และบอกให้รู้ (ไม่ตกไปฉบับฟรีเงียบๆ)
    var l1 = $("lang1").value, l2 = nLang() === 2 ? $("lang2").value : "", withTh = base(l1) === "th"
      || base(l2) === "th", ofL = function (l) {
        return !l || (base(l) === "en" && withTh) ? "" : ccOfLang(l);
      }, a = ofL(l1), b = ofL(l2), al = ownedCc($("sheet").value), want = a || b || "INT"; /* English with Thai is the Thai edition: it stays on Thai standards */
    followNote = "";
    if (al && want !== "INT" && !al[want]) {
      followNote = "ใช้มาตรฐานไทยตามฉบับที่คุณซื้อ · ค่ามาตรฐานของ" + ccName(want) + "ต้องซื้อฉบับประเทศนั้นเพิ่ม";
      want = "TH";
      b = "";
    }
    if (!touched.c1) $("c1").value = want;
    if (!touched.c2) $("c2").value = a && b && a !== b ? b : "";
    drawCc();
  }
  function ccName(cc) {
    return window.StdPick ? window.StdPick.label(cc) : cc === "TH" ? "ไทย" : cc === "INT" ? "ข้อกำหนดโครงการ" : REC[cc]
      ? REC[cc].countryTh : cc;
  }
  function covLine(cc) {
    if (!cc) return "";
    if (cc === "INT") return "ข้อกำหนดโครงการ: ช่องเกณฑ์เว้นให้กรอกเอง ค่าไทยพิมพ์เป็นข้อมูลอ้างอิง";
    if (cc === "TH") return "ไทย: ค่าเต็มตามฉบับไทย";
    var D0 = window.DOCCOV || {}, id = $("sheet").value, t = (D0.numeric || {})[id] || 0, n = ((D0.cc
      || {})[cc] || {})[id] || 0;
    return ccName(cc) + ": มีค่าที่ตรวจแหล่งแล้ว " + n + " จาก " + t + " ข้อของใบนี้" + (n < t ? " · ข้อที่เหลือใช้ค่าของประเทศอ้างอิงในกลุ่มมาตรฐานเดียวกันถ้ามี (เอกสารพิมพ์ป้ายบอก) ไม่เช่นนั้นเว้นให้กรอกตามข้อกำหนดโครงการ" : ""); // 7 พ.ย. 2026: บอกให้ตรงกับที่เอกสารทำจริง (ค่าประเทศอ้างอิง C19)
  }
  var pickFirst = null;
  function drawCc() {
    var a = $("c1").value, b = $("c2").value, r = REC[a];
    $("ccInfo").textContent = [covLine(a), b && b !== a ? covLine(b) : "", followNote].filter(Boolean).join(" · ");
    var li = $("lawInfo");
    li.textContent = "";
    if (r) { /* ชื่อกฎหมายเป็นชื่อทางการ ไม่แปล · คำกำกับแยกส่วนเพื่อแปลตามภาษาของหน้า */
      var names = [r.lawName, r.codeName].filter(Boolean).join(" · "), sp = document.createElement("span"),
        part = function (t) {
          var e = document.createElement("span");
          e.textContent = t;
          li.appendChild(document.createTextNode(" · "));
          li.appendChild(e);
        };
      if (!/[\u0e01-\u0e5b]/.test(names)) sp.setAttribute("data-noi18n", "1");
      sp.textContent = names;
      li.appendChild(sp);
      part("ตรวจเมื่อ");
      li.appendChild(document.createTextNode(" " + r.checked));
      if (r.confidence !== "official") part("ยังไม่ยืนยันจากแหล่งทางการ");
    }
    $("c2wrapNote").hidden = !b || b === a;
    if (window.StdPick && $("stdBox")) {
      window.StdPick.list($("stdBox"), { sheet: $("sheet").value, cc: a, picked: pickFirst });
      pickFirst = null;
    } // เลือกมาตรฐานที่ใช้ในเอกสาร ถ้าเรื่องนั้นมีหลายตัว
  }
  document.addEventListener("change", function (ev) {
    var t = ev.target;
    if (t.name === "nlang") {
      drawLang();
      follow();
    }
    else if (t.id === "lang1" || t.id === "lang2") follow();
    else if (t.id === "c1" || t.id === "c2") {
      touched[t.id] = true;
      drawCc();
    }
    else if (t.id === "sheet") drawCc();
  });
  $("swapPick").addEventListener("click", function () {
    var a = $("lang1").value;
    $("lang1").value = $("lang2").value;
    $("lang2").value = a;
    if (touched.c1 || touched.c2) {
      var x = $("c1").value, y = $("c2").value;
      if (y) {
        $("c1").value = y;
        $("c2").value = x;
      }
    }
    follow();
  }); // สลับลำดับภาษาก่อนสร้างเอกสาร · บรรทัดหลักและกล่องกรอกย้ายตาม
  /* 3 Nov 2026: site coordinates. They stay on this device and print on the sheet. No map script loads and no key is used: the link opens Google Maps in a new tab. */
  function geoVal() {
    var g = $("geo"), m = g ? /^\s*(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*$/.exec(g.value) : null;
    return m && Math.abs(+m[1]) <= 90 && Math.abs(+m[2]) <= 180 ? m[1] + ", " + m[2] : "";
  }
  function geoDraw() {
    var a = $("geoMap");
    if (!a) return;
    var g = geoVal();
    a.hidden = !g;
    if (g) a.href = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(g.replace(" ",
      ""));
    geoCountry();
  }
  /* 14 Nov 2026 (คำสั่งเจ้าของ): แผนที่เปิดตามประเทศที่ตั้งงานที่เลือก · ไม่มีพิกัด = เปิดแผนที่ของประเทศนั้น (พร้อมชื่อพื้นที่ตรวจถ้ากรอก) ให้ผู้ใช้ปักหมุดเอง */
  function geoCountry() {
    var c = $("geoCountry"), sv = $("site");
    if (!c || !sv) return;
    var o = sv.options[sv.selectedIndex], cc = sv.value, en = "", area;
    try {
      en = new Intl.DisplayNames(["en"], { type: "region" }).of(cc) || "";
    } catch (e) {}
    if (!en || en === cc) en = (o ? o.textContent : "") || cc;
    area = String(($("f-doc").elements.location || {}).value || "").trim();
    c.hidden = !!geoVal() || !cc;
    c.href = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent([area, en].filter(Boolean).join(", "));
  }
  if ($("geoBtn")) {
    $("geo").addEventListener("input", geoDraw);
    if ($("f-doc").elements.location) $("f-doc").elements.location.addEventListener("input", geoCountry);
    if ($("site")) $("site").addEventListener("change", function () {
      touched.site = true;
      geoCountry();
    });
    // ประเทศที่ตั้งงานตามประเทศที่ 1 จนกว่าผู้ใช้จะเลือกเอง: กฎหมายในภาคผนวก ข (รวมผังเมืองและที่ดิน) และแผนที่จึงตรงกับประเทศที่เลือก
    $("c1").addEventListener("change", function () {
      var sv = $("site"), v = $("c1").value;
      if (!sv || touched.site || !v) return;
      if ([].some.call(sv.options, function (o) {
        return o.value === v;
      })) sv.value = v;
      geoCountry();
    });
    $("geoBtn").addEventListener("click", function () {
      if (!navigator.geolocation) {
        say("เครื่องนี้ไม่รองรับการระบุตำแหน่ง พิมพ์พิกัดเองได้", true);
        return;
      }
      navigator.geolocation.getCurrentPosition(function (p) {
        $("geo").value = p.coords.latitude.toFixed(5) + "," + p.coords.longitude.toFixed(5);
        geoDraw();
      }, function () {
        say("เปิดสิทธิ์ตำแหน่งในเบราว์เซอร์ หรือพิมพ์พิกัดเองได้", true);
      }, { enableHighAccuracy: true, timeout: 15000 });
    });
  }
  var q = new URLSearchParams(location.search);
  if (q.get("item") && sheets.some(function (x) {
    return x.id === q.get("item");
  })) $("sheet").value = q.get("item");
  if (q.get("lang") === "en") $("lang1").value = EN_DEF;
  else if (q.get("lang") && LANGS.some(function (x) {
    return x[0] === q.get("lang");
  })) $("lang1").value = q.get("lang");
  function setN(n) {
    var r = document.querySelector('input[name=nlang][value="' + n + '"]');
    if (r) r.checked = true;
  }
  // ลิงก์จากหน้าเอกสารของฉัน: ไม่มีรหัส = ฉบับอังกฤษ-ไทย · EN หรือ TH = ภาษาเดียว · รหัสประเทศ = ภาษาของประเทศนั้นคู่กับไทย
  (function () {
    if (!q.has("cc")) return;
    var cc = String(q.get("cc") || "").toUpperCase();
    if (!cc) {
      $("lang1").value = EN_DEF;
      $("lang2").value = "th";
      setN(2);
      return;
    }
    if (cc === "EN" || cc === "TH") {
      $("lang1").value = cc === "EN" ? EN_DEF : "th";
      setN(1);
      return;
    }
    if (!REC[cc]) return;
    var l = Object.keys(LANG_CC).filter(function (k) {
      return k !== "en" && LANG_CC[k] === cc;
    })[0];
    if (l) $("lang1").value = l;
    $("lang2").value = l === "th" ? EN_DEF : "th";
    setN(2);
    $("c1").value = cc;
    $("c2").value = cc === "TH" ? "" : "TH";
    touched.c1 = true;
    touched.c2 = true;
  })();
  if (q.get("c1")) {
    var c1q = String(q.get("c1")).toUpperCase();
    if (c1q === "TH" || c1q === "INT" || REC[c1q]) {
      $("c1").value = c1q;
      touched.c1 = true;
      if (q.get("st")) pickFirst = String(q.get("st")).split("|").filter(Boolean);
    }
  }
  /* 3 Nov 2026 (คำสั่งเจ้าของ): ค่าที่ลูกค้าตั้งตอนใส่ตะกร้า (ภาษา มาตรฐาน ประเทศที่ตั้งงาน เมือง) ตั้งให้เองเมื่อเปิดใบนั้น
     ใช้เฉพาะเมื่อค่าตรงกับฉบับในลิงก์ (cc) ลิงก์ที่ระบุภาษาหรือมาตรฐานเองมีผลก่อน */
  (function () {
    var cf = null, sv = $("site");
    try {
      cf = (JSON.parse(localStorage.getItem("build_cart_cfg") || "{}") || {})[$("sheet").value] || null;
    } catch (e) {}
    var has = function (v) {
      return sv && v && [].some.call(sv.options, function (o) {
        return o.value === v;
      });
    };
    if (sv) sv.value = has(String(q.get("site") || "").toUpperCase()) ? String(q.get("site")).toUpperCase()
      : cf && has(cf.site) ? cf.site : has($("c1").value) ? $("c1").value : "TH";
    if (!cf) return;
    if (cf.city && !$("f-doc").elements.location.value) $("f-doc").elements.location.value = String(cf.city).slice(0, 100);
    if (q.get("lang") || q.get("c1")) return;
    var cc = q.has("cc") ? String(q.get("cc") || "").toUpperCase() : null, ls = [cf.l1, cf.n === 2 ? cf.l2 : ""].filter(Boolean),
      local = ls.every(function (l) {
        return base(l) === "th" || base(l) === "en";
      }) && (cf.std === "TH" || cf.std === "INT"), fit = cc === null || ((cc === "" || cc === "EN" || cc === "TH") ? local
        : cf.std === cc || ls.some(function (l) {
          return LANG_CC[l] === cc || (window.REGION && window.REGION.langsOf(cc).indexOf(base(l)) >= 0);
        }));
    if (!fit) return;
    var okL = function (l) {
      return LANGS.some(function (x) {
        return x[0] === l;
      });
    };
    setN(cf.n === 1 ? 1 : 2);
    if (okL(cf.l1)) $("lang1").value = cf.l1;
    if (cf.n === 2 && okL(cf.l2)) $("lang2").value = cf.l2;
    if (cf.std && (cf.std === "TH" || cf.std === "INT" || REC[cf.std])) {
      $("c1").value = cf.std;
      $("c2").value = "";
      touched.c1 = true;
      touched.c2 = true;
    }
  })();
  drawLang();
  follow();
  // ยังไม่เข้าสู่ระบบ: บอกตั้งแต่ต้นว่าอะไรดาวน์โหลดได้เลย · เข้าสู่ระบบแล้วกลับมาหน้านี้พร้อมตัวเลือกเดิม
  function keepNext() {
    try {
      sessionStorage.setItem("build_next", "doc.html?item=" + encodeURIComponent($("sheet").value) + "&lang="
        + encodeURIComponent($("lang1").value));
    } catch (e) {}
  }
  $("loginBar").hidden = !!B.token.get();
  $("loginLink").addEventListener("click", keepNext);
  // เข้าสู่ระบบแล้ว: ทำเครื่องหมายใบที่มีสิทธิ์ และบอกว่าได้ฉบับไหน
  var OWN = {};
  function drawRight() {
    var vs = OWN[$("sheet").value], el = $("rightInfo");
    el.hidden = !vs;
    el.textContent = vs ? "คุณมีสิทธิ์ใบนี้: " + vs.map(function (v) {
      return B.LANGS[v] || v;
    }).join(" · ") + " · สร้างได้ครบทุกข้อ ในภาษาและมาตรฐานของฉบับนี้" : "";
  }
  $("sheet").addEventListener("change", drawRight);
  if (B.token.get()) B.call("me", { token: B.token.get() }).then(function (r) {
    (r.owned || []).forEach(function (id) {
      var k = B.rootOf(id), v = B.varOf(id);
      if (!OWN[k]) OWN[k] = [];
      if (OWN[k].indexOf(v) < 0) OWN[k].push(v);
    });
    [].forEach.call($("sheet").options, function (o) {
      if (OWN[o.value]) o.textContent = "✓ " + o.textContent;
    });
    drawRight();
    if (!touched.c1) follow(); // 7 พ.ย. 2026: สิทธิ์มาถึงแล้ว เลือกประเทศเริ่มต้นใหม่ตามสิทธิ์ที่ซื้อ
  }).catch(function () {});
  function say(t, bad) {
    var m = $("msg");
    m.hidden = !t;
    m.className = "msg " + (bad ? "bad" : "ok");
    m.textContent = t || "";
  }

  // ---------- ตัวสร้างฟอร์ม: โครงเดียวกับใบ PDF (gen_sheets.ps1) แต่ข้อความมาจากหลังบ้านตามภาษาที่เลือก ----------
  var D = null, META = {}, fitOn = true;
  var CE = (function () {
    var e = document.createElement("div");
    try {
      e.contentEditable = "plaintext-only";
      if (e.contentEditable === "plaintext-only") return "plaintext-only";
    } catch (x) {} return "true";
  })();
  var CEA = ' contenteditable="' + CE + '" spellcheck="false"';
  var SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
  var ICO = {
    sun: SVG + '<circle cx="12" cy="12" r="4.5"/><path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M4.6 19.4l2.1-2.1M17.3 6.7l2.1-2.1"/></svg>',
    cloud: SVG + '<path d="M7 18h10.5a4.5 4.5 0 0 0 .4-9A6 6 0 0 0 6.3 10.2 4 4 0 0 0 7 18z"/></svg>',
    rain: SVG + '<path d="M7 14h10.5a4 4 0 0 0 .4-8A5.5 5.5 0 0 0 6.6 7.2 3.5 3.5 0 0 0 7 14z"/><path d="M8 17l-1 4M12.5 17l-1 4M17 17l-1 4"/></svg>',
    wind: SVG + '<path d="M3 9h11a3 3 0 1 0-3-3"/><path d="M3 14h15a3 3 0 1 1-3 3"/><path d="M3 19h7"/></svg>',
    lock: '<svg class="lk" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><rect x="4.5" y="10.5" width="15" height="11" rx="1.5" fill="#000"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/></svg>',
    cam: SVG + '<path d="M3 8h4l1.6-2.5h6.8L17 8h4v11H3z"/><circle cx="12" cy="13.3" r="3.3"/></svg>'
  };
  function langs() {
    return [D.lang1, D.lang2, D.lang3].filter(Boolean);
  }
  function at(c) {
    return ' lang="' + c + '" dir="' + (RTL[c] ? "auto" : "ltr") + '"';
  }
  // ข้อความหลักกับบรรทัดภาษาถัดไป
  function M(arr) {
    var cs = langs();
    return (arr || []).map(function (t, i) {
      var c = cs[i] || "en";
      return "<span" + (i ? ' class="l2' + (i === 2 ? " l3" : "") + '"' : "") + at(c) + ">" + esc(t)
        + "</span>";
    }).join("");
  }
  // ป้ายกำกับ: ภาษาหลัก + ภาษาถัดไปตัวเล็ก
  function Lab(arr) {
    var cs = langs();
    return '<span class="lb">' + (arr || []).map(function (t, i) {
      var c = cs[i] || "en";
      return i ? "<i" + at(c) + ">" + esc(t) + "</i>" : "<span" + at(c) + ">" + esc(t) + "</span>";
    }).join(" ") + "</span>";
  }
  // ทุกภาษาในบรรทัดเดียว
  function One(arr) {
    var cs = langs();
    return (arr || []).map(function (t, i) {
      return "<span" + at(cs[i] || "en") + ">" + esc(t) + "</span>";
    }).join(" ");
  }
  function Sla(arr) {
    return (arr || []).map(esc).join(" / ");
  }
  var UNIT = "mm|cm|m²|m³|m|t|kg|kN|MPa|°C|%|s|min|h|days?|hours?|A|V|Ω|MΩ|bar|kPa|in\\.|ft|psi|°F|lb|gal|มม\\.|ซม\\.|ตร\\.ม\\.|ลบ\\.ม\\.|ม\\.|กก\\.|ตัน|นาที|ชม\\.|วัน|องศา|ซม";
  var BLANK = new RegExp("_{2,}( (?:" + UNIT + ")(?=[\\s,.;·)]|$))?", "g"), SPLIT = /\s+·\s+|;\s+|；\s*|؛\s*/;
  function nBlank(s) {
    return (String(s || "").match(/_{2,}/g) || []).length;
  }
  // กล่องกรอกอยู่บรรทัดหลัก บรรทัดถัดไปมีเลขชี้กล่องเดียวกัน (กรอกครั้งเดียว) · หน่วยไม่แยกจากกล่อง
  function boxed(s, num, k) {
    var out = "", last = 0, m, re = new RegExp(BLANK.source, "g"), str = String(s || "");
    while ((m = re.exec(str))) {
      k.n++;
      out += esc(str.slice(last, m.index)) + '<span class="fb">' + (num ? '<span class="bn">' + k.n
        + "</span>" : "") + '<span class="bl"' + CEA + "></span>" + esc(m[1] || "") + "</span>";
      last = m.index + m[0].length;
    }
    return out + esc(str.slice(last));
  }
  function numbered(s, k) {
    var out = "", last = 0, m, re = /_{2,}/g, str = String(s || "");
    while ((m = re.exec(str))) {
      k.n++;
      out += esc(str.slice(last, m.index)) + '<span class="bn">' + k.n + "</span>";
      last = m.index + m[0].length;
    }
    return out + esc(str.slice(last));
  }
  function Bi(arr, bul) {
    arr = arr || [];
    var cs = langs(), n = nBlank(arr[0]), same = arr.length > 1 && n > 0 && arr.slice(1).every(function (s) {
      return nBlank(s) === n;
    });
    return arr.map(function (t, i) {
      var k = { n: 0 }, c = cs[i] || "en", parts = bul ? String(t || "").split(SPLIT).filter(Boolean) : [String(t
        || "")];
      var cell = function (p) {
        return i === 0 || !same ? boxed(p, same, k) : numbered(p, k);
      }, body = parts.length > 1 ? '<span class="mb">' + parts.map(function (p) {
        return "<span>" + cell(p) + "</span>";
      }).join("") + "</span>" : cell(parts[0] || "");
      return "<span" + (i ? ' class="l2' + (i === 2 ? " l3" : "") + '"' : "") + at(c) + ">" + body
        + "</span>";
    }).join("");
  }
  function docCode(d) { // รหัสเอกสาร: -P ฉบับเต็ม · -F ฉบับฟรี · ต่อท้ายด้วยรหัสภาษา ยกเว้นฉบับอังกฤษ-ไทย
    var base = String(d.code || ("BTH-" + d.id.replace("-", "") + "-P")).replace(/-[PF]$/, "") + "-"
      + (d.owned ? "P" : "F"), cs = [d.lang1, d.lang2].filter(Boolean);
    return base + (cs.length === 2 && cs.indexOf("en") >= 0 && cs.indexOf("th") >= 0 ? "" : "-" + cs.join("-").toUpperCase());
  }
  function ctryName(c) {
    var cs = langs();
    return cs.every(function (x) {
      return x === "th";
    }) ? c.th : cs.indexOf("th") >= 0 ? c.en + " (" + c.th + ")" : c.en;
  }
  function stdText() {
    var d = D;
    return (d.ctry || []).map(ctryName).join(" + ") + (d.stdName ? " · " + d.stdName : "");
  }
  function keyPlan() {
    var L = D.lab, s = '<svg viewBox="0 0 22 15.5" fill="none" stroke="#000" stroke-width=".2" font-family="Arial" font-size="1.7" text-anchor="middle" aria-hidden="true">',
      x, y;
    for (x = 0; x <= 8; x++) for (y = 0; y <= 7; y++) s += '<circle cx="' + (3.6 + 1.5 * x) + '" cy="'
      + (3.6 + 1.6 * y) + '" r=".13" fill="#8A939E" stroke="none"/>';
    s += '<rect x="3.0" y="2.95" width="13.2" height="12.3" stroke-width=".22"/>';
    for (x = 0; x <= 4; x++) s += '<rect x="' + (3.25 + 2.6 * x) + '" y=".35" width="2.15" height="1.9" stroke-width=".16"/>';
    for (y = 0; y <= 3; y++) s += '<rect x=".3" y="' + (3.35 + 3.0 * y) + '" width="2.2" height="2.3" stroke-width=".16"/>';
    s += '<circle cx="19.15" cy="7.2" r="2.45" stroke-width=".22"/><path d="M19.15 4.4v.6M19.15 9.4v.6M16.35 7.2h.6M21.35 7.2h.6" stroke-width=".2"/><circle cx="19.15" cy="7.2" r=".18" fill="#000" stroke="none"/>';
    s += '<text x="19.15" y="12.3" fill="#000" stroke="none" font-size="1.45">' + esc(L.north[0])
      + "</text>" + (L.north[1] ? '<text x="19.15" y="14.1" fill="#3F4A58" stroke="none" font-size="1.45">'
        + esc(L.north[1]) + "</text>" : "") + "</svg>";
    return '<div class="kpc"><b>' + esc(L.kp[0]) + (L.kp[1] ? " <span>" + esc(L.kp[1]) + "</span>" : "")
      + "</b>" + s + "</div>";
  }
  function head(kind, plan) {
    var d = D, L = d.lab, cs = langs(), tt = d.title || [], brand = /^T-/.test(d.id) ? L.brandT : L.brandF;
    return '<header class="hd' + (plan ? " kp" : "") + '"><div class="lg"><img src="img/logo.png" alt="BUILD TH"><div><b>สร้าง | BUILD TH</b>'
      + brand.map(function (x, i) {
        return "<span" + at(cs[i] || "en") + ">" + esc(x) + "</span>";
      }).join("") + '</div></div><div class="ti"><small>' + kind + "</small><h1" + at(cs[0]) + ">"
      + esc(tt[0]) + "</h1>" + tt.slice(1).map(function (x, i) {
        return "<h2" + at(cs[i + 1] || "en") + ">" + esc(x) + "</h2>";
      }).join("") + '</div><div class="cd"><div><b>' + Sla(L.sheetNo) + '</b><span class="w"' + CEA
      + '></span></div><div><b>' + Sla(L.dateChk) + '</b><span class="w"' + CEA + "></span></div></div>"
      + (plan ? keyPlan() : "") + "</header>";
  }
  function info(rows) {
    return '<section class="info">' + rows.map(function (r, i) {
      return "<div" + (i === rows.length - 1 && rows.length % 2 ? ' class="wide"' : "") + ">" + Lab(r[0])
        + '<span class="iv w"' + CEA + ">" + esc(r[1] || "") + "</span></div>";
    }).join("") + "</section>";
  }
  function strip() {
    var d = D, L = d.lab, wx = "<div>" + '<span class="lb">' + esc(L.weather[0]) + (L.weather[1] ? "<i>"
      + esc(L.weather[1]) + "</i>" : "") + "</span>" + [[ICO.sun, L.sun], [ICO.cloud, L.cloud], [ICO.rain,
        L.rain], [ICO.wind, L.wind]].map(function (p) {
          return '<span class="wx"><b class="tick"></b>' + p[0] + esc(p[1][0]) + (p[1][1] ? "<small>"
            + esc(p[1][1]) + "</small>" : "") + "</span>";
        }).join("") + "</div>", g = "";
    if (d.gauge) g = '<div class="gauge"><span class="lb">' + esc(L.gauge[0]) + (L.gauge[1] ? "<i>"
      + esc(L.gauge[1]) + "</i>" : "") + "</span>" + [0.1, 0.2, 0.3, 0.5, 1, 2, 3].map(function (w) {
        return '<span class="gb"><i style="width:' + w + 'mm"></i>' + w.toFixed(1) + "</span>";
      }).join("") + '<span class="cal"><i></i>' + esc(L.cal[0]) + (L.cal[1] ? "<br>" + esc(L.cal[1]) : "")
      + "</span></div>";
    return '<div class="strip">' + wx + g + "</div>";
  }
  function notices() { // คำเตือนเฉพาะงาน · ค่าของประเทศ · เอกสารแปลด้วยเครื่อง
    var d = D, L = d.lab, h = d.warnTxt ? '<p class="warn">' + M(d.warnTxt) + "</p>" : "";
    if ((d.ccs || []).some(function (c) {
      return c !== "TH";
    })) h += '<p class="warn">' + M(L.cnote) + "</p>";
    if (d.rgs && d.rgs.length && L.rgn) h += '<p class="warn">' + M(L.rgn) + " " + esc(d.rgs.join(", ")) + "</p>"; // C19
    if (d.nWeak && L.weakN) h += '<p class="warn">' + M(L.weakN) + "</p>"; // C19
    return h;
  }
  function c19o(o, L) { // C19: ป้ายค่าภูมิภาค และค่าที่ต่ำกว่าที่ตั้งงาน ในตัวเลือก
    return (o.rg && L.rgv ? '<span class="rf2 rgv">' + One(L.rgv) + " " + esc(o.rg) + "</span>" : "")
      + (o.weak && L.weakO ? '<span class="rf2 wk">' + One(L.weakO) + "</span>" : "");
  }
  function c19x(r, L) { // C19: ป้ายค่าภูมิภาค และคำเตือนค่าต่ำกว่าที่ตั้งงาน พร้อมค่าของที่ตั้งงาน (คำตอบ Q41)
    return (r.rg && L.rgv ? '<div class="rf rgv">' + One(L.rgv) + " " + esc(r.rg) + "</div>" : "")
      + (r.weak && L.weak ? '<div class="weak">' + One(L.weak) + " " + esc(r.weak.cc) + " · " + Bi(r.weak.cr, true)
        + (r.weak.ref ? '<span class="rf2">' + esc(r.weak.ref) + "</span>" : "") + "</div>" : "");
  }
  function crCell(r, n) {
    var L = D.lab, ex = c19x(r, L);
    if (r.opts) return '<div class="opts2">' + r.opts.map(function (o) {
      return '<label class="pick' + (o.tag ? " ptag" : "") + (o.weak ? " pweak" : "") + '" data-cc="' + esc(o.cc) + '"><input type="radio" name="pk'
        + n + '" value="' + esc(o.cc) + '"><span class="tk" aria-hidden="true"></span><span class="ctag">'
        + esc(o.tag || o.cc) + '</span><span class="ptx">' + Bi(o.cr, true) + (o.ref ? '<span class="rf2">'
          + esc(o.ref) + "</span>" : "") + c19o(o, L) + "</span></label>";
    }).join("") + "</div>" + ex;
    return Bi(r.cr, true) + (r.jref ? '<div class="rf">' + One(L.also) + " " + esc(r.jref) + "</div>" : "")
      + (r.ref ? '<div class="rf">' + One(L.ref) + " " + One(r.ref) + "</div>" : "") + ex;
  }
  function thw(c) {
    var s = (c || []).join(" ");
    return /\bdate\b|วันที่/i.test(s) ? ' style="min-width:15mm"' : /\btime\b|เวลา/i.test(s) ? ' style="min-width:13mm"' : /\bno\.|เลข/i.test(s)
      ? ' style="min-width:11mm"' : "";
  }
  function blankRows(cols, rows) {
    var o = "", i, j;
    for (i = 0; i < rows; i++) {
      o += "<tr>";
      for (j = 0; j < cols; j++) o += '<td class="w"' + CEA + "></td>";
      o += "</tr>";
    }
    return o;
  }
  function recTable(x) {
    var L = D.lab;
    return '<div class="keep"><h3>' + M(x.title) + (x.plain && D.owned ? "<small>" + One(L.measS)
      + "</small>" : "") + '</h3><table class="rec"><thead><tr><th style="width:9mm">' + M(L.seq)
      + "</th>" + x.cols.map(function (c) {
        return "<th" + thw(c) + ">" + M(c) + "</th>";
      }).join("") + "</tr></thead><tbody>" + blankRows(x.cols.length + 1, x.n) + "</tbody></table></div>";
  }
  function sign(roles) {
    var L = D.lab;
    return '<div class="sig c' + roles.length + '">' + roles.map(function (ro) {
      return "<div><h4>" + M(ro) + "</h4>" + [L.company, L.signature, L.name, L.position, L.date].map(function (f) {
        return "<p>" + Lab(f) + '<span class="w"' + CEA + "></span></p>";
      }).join("") + "</div>";
    }).join("") + "</div>";
  }
  function notesBox(lab, n) {
    var s = "";
    for (var i = 0; i < n; i++) s += '<span class="w"' + CEA + "></span>";
    return '<div class="nt"><b>' + One(lab) + "</b>" + s + "</div>";
  }
  function rpBar(extra) {
    var d = D, L = d.lab;
    return '<div class="rp"><b>' + M(L.rp) + "</b><span>" + esc(docCode(d)) + " " + esc((d.title
      || [])[0]) + '</span><span class="f">' + One(L.rpSheet) + ' <span class="w"' + CEA + '></span></span><span class="f">'
      + One(L.date) + ' <span class="w"' + CEA + "></span></span>" + (extra ? '<span class="f">' + One(L.rpNo)
        + ' <span class="w"' + CEA + "></span></span>" : "") + "</div>";
  }
  function freeRefs() {
    var d = D, L = d.lab, th = langs()[0] === "th", list = d.frefs || [], cc0 = (d.ccs || [])[0];
    if (cc0 && cc0 !== "TH" && cc0 !== "INT") { // ฉบับฟรีอ้างอิงมาตรฐานของประเทศที่เลือก
      var sd0 = window.StdPick ? window.StdPick.data(cc0, d.id) : null, nm = d.picked && d.picked.length
        ? d.picked : sd0 ? sd0.s : (REC[cc0] && REC[cc0].codeName ? [REC[cc0].codeName] : []);
      return nm.length ? " · " + One(L.refsShort) + ": " + nm.slice(0, 4).map(esc).join(" · ") + " ("
        + One(L.refsFull) + ")" : "";
    }
    if (!list.length) return "";
    return " · " + One(L.refsShort) + ": " + list.map(function (x) {
      return esc(th ? x[0] : (x[5] || x[0])) + " " + esc(th ? x[1] : (x[2] || x[1]));
    }).join(" · ") + " (" + One(L.refsFull) + ")";
  }
  function upBox() { // ฉบับฟรีบอกว่าฉบับเต็มมีอะไรเพิ่ม เหมือนใบ PDF
    var d = D, L = d.lab, code = String(d.code || ("BTH-" + d.id.replace("-", "") + "-P")).replace(/-[PF]$/,
      "") + "-P", base = window.SITE && window.SITE.site && window.SITE.site.url ? String(window.SITE.site.url).replace(/\/+$/,
        "") + "/" : "";
    return '<div class="up"><b>' + One(L.upT) + " · " + esc(code) + "</b><ul><li>" + One(L.upItems)
      + ": " + d.nPro + "</li><li>" + One(L.upStages) + ": " + d.nStages + "</li><li>" + One(L.upH)
      + ": " + d.nHold + "</li><li>" + One(L.up2L) + "</li><li>" + One(L.upRec) + "</li><li>" + One(L.upDef)
      + "</li><li>" + One(L.upPh) + "</li><li>" + One(L.upSign) + '</li></ul><div style="margin-top:1mm">'
      + One(L.upMore) + ": " + esc(base + "sheets.html") + "</div></div>";
  }
  function freeForm(m) {
    var d = D, L = d.lab, kind = (/^T-/.test(d.id) ? L.kindFT : L.kindF).map(function (t, i) {
      return esc(t) + " · " + d.nFree + " " + esc((L.keyN || [])[i] || "");
    }).join(" · ");
    var rows = [[L.project, m.project], [L.area, m.location], [L.contractor, m.contractor], [L.drawing,
      ""]];
    if ((d.ccs || []).some(function (c) {
      return c !== "TH";
    })) rows.push([L.std, stdText()]);
    var h = head(kind, false) + info(rows) + notices();
    h += '<table class="chk"><colgroup><col style="width:8mm"><col style="width:70mm"><col style="width:68mm"><col style="width:8mm"><col style="width:8mm"><col></colgroup><thead><tr><th>'
      + M(L.no) + "</th><th>" + M(L.hItems) + "</th><th>" + M(L.hCrit) + "</th><th>C</th><th>NC</th><th>"
      + M(L.hRem) + "</th></tr></thead><tbody>";
    var n = 0;
    d.stages.forEach(function (st) {
      st.items.forEach(function (r) {
        n++;
        h += "<tr" + (r.warn ? ' class="fl"' : "") + '><td class="n">' + n + (r.warn ? " ⚑" : "")
          + '</td><td class="it">' + Bi(r.it, false) + '</td><td class="cr">' + crCell(r, n) + '</td><td class="bx"></td><td class="bx"></td><td class="w"'
          + CEA + "></td></tr>";
      });
    });
    h += '</tbody></table><p class="lgd">C = ' + One(L.cC) + " · NC = " + One(L.cNC) + " · " + One(L.lgFree)
      + freeRefs() + "</p>";
    var hasRec = (d.recs || []).length > 0;
    var tail = '<p class="sh2 top">' + M(L.sh2) + "</p>" + sign([L.sIns, L.sAck]) + notesBox(L.notesF,
      hasRec ? 2 : 4) + upBox() + '<p class="fine">' + One(L.fine) + " · " + One(L.freeShare) + "</p>"
      + flagNote();
    if (hasRec) h += '<div class="pb">' + rpBar(false) + d.recs.map(recTable).join("") + tail + "</div>";
    else h += tail;
    return h;
  }
  function flagNote() {
    var d = D, L = d.lab;
    return d.machine ? '<p class="fine">' + One(L.flag) + "</p>" : "";
  }
  function proForm(m) {
    var d = D, L = d.lab, isT = /^T-/.test(d.id), intl = (d.ccs || []).some(function (c) {
      return c !== "TH";
    }), lawText = (d.ctry || []).filter(function (c) {
      return c.cc !== "INT";
    }).map(ctryName).join(" + "), two = langs().length > 1;
    var rows = [[L.project, m.project], [L.location, m.location], [L.contractor, m.contractor], [L.supervisor,
      ""], [L.drawRev, ""], [L.areaGrid, ""], [L.refer, stdText()], [L.time, ""]];
    if (intl) rows.push([L.law, lawText ? lawText + " · Annex B" : ""], [L.licensed, ""], [L.permit,
      ""]);
    var h = head((isT ? L.kindPT : L.kindP).map(esc).join(" · "), true) + info(rows) + strip() + notices()
      + '<p class="sh1">' + M(L.sh1) + "</p>";
    var cm = d.cmp || {};
    if (cm.same || cm.diff || cm.none || cm.own) h += '<div class="cmpb"><b>' + One(L.cmpT) + "</b>"
      + [[cm.same, L.cmpS], [cm.diff, L.cmpD], [cm.own, L.cmpO], [cm.none, L.cmpN]].filter(function (x) {
        return x[0];
      }).map(function (x) {
        return '<span class="cm"><em>' + x[0] + "</em><span>" + M(x[1]) + "</span></span>";
      }).join("") + "</div>";
    h += '<table class="chk"><colgroup><col style="width:8mm"><col style="width:6.6mm"><col style="width:57mm"><col style="width:62mm"><col style="width:12mm"><col style="width:7mm"><col style="width:7mm"><col style="width:7mm"><col></colgroup><thead><tr><th>'
      + esc(L.no[0]) + "</th><th>" + M(L.point) + "</th><th>" + M(L.hItems) + "</th><th>" + M(L.hCrit)
      + "</th><th>" + M(L.method) + "</th><th>C</th><th>NC</th><th>N/A</th><th>" + M(L.hRem) + "</th></tr></thead>";
    var n = 0;
    d.stages.forEach(function (st, si) {
      h += '<tbody class="sg"><tr class="st"><td colspan="9">' + (si + 1) + ". " + M(st.name) + "</td></tr>";
      st.items.forEach(function (r, ii) {
        n++;
        if (ii === 1) h += "</tbody><tbody>";
        var isH = r.p === "H";
        h += "<tr" + (isH || r.warn ? ' class="' + (isH ? "hp" : "") + (r.warn ? " fl" : "") + '"' : "")
          + '><td class="n">' + (si + 1) + "." + (ii + 1) + (r.warn ? " ⚑" : "") + '</td><td class="pt"><b class="'
          + esc(r.p) + '">' + esc(r.p) + "</b>" + (isH ? ICO.lock : "") + '</td><td class="it">' + Bi(r.it,
            false) + '</td><td class="cr">' + crCell(r, n) + '</td><td class="hw">' + M(r.m) + '</td><td class="bx"></td><td class="bx"></td><td class="bx"></td>'
          + (isH ? '<td style="vertical-align:bottom"><span class="ph">' + ICO.cam + One(L.photo)
            + '<i class="w"' + CEA + "></i></span></td>" : '<td class="w"' + CEA + "></td>") + "</tr>";
      });
      h += "</tbody>";
    });
    h += '</table><p class="lgd"><span class="lg1">C = ' + One(L.cC) + '</span> · <span class="lg1">NC = '
      + One(L.cNC) + '</span> · <span class="lg1">N/A = ' + One(L.cNA) + '</span> | <span class="lg1"><span class="mk H">H</span>'
      + One(L.lgH) + '</span> · <span class="lg1"><span class="mk W">W</span>' + One(L.lgW) + '</span> · <span class="lg1"><span class="mk">R</span>'
      + One(L.lgR) + '</span> · <span class="lg1"><span class="mk S">S</span>' + One(L.lgS) + "</span><br>"
      + (two ? '<span><span class="bn">1</span>' + One(L.lgBox) + "</span> · " : "") + "<span>" + One(L.lgPlan)
      + "</span></p>";
    // ผลการตรวจ ลายเซ็น 3 ฝ่าย วิธีใช้ หมายเหตุ
    h += '<div class="keep"><h3>' + M(L.result) + '</h3><div class="res"><span><b class="tick"></b>'
      + One(L.r1) + '</span><span><b class="tick"></b>' + esc(L.r2[0]) + ' <span class="bl"' + CEA
      + "></span>" + L.r2.slice(1).map(function (x, i) {
        return '<span class="l2"' + at(langs()[i + 1]) + ">" + esc(x) + "</span>";
      }).join("") + '</span><span><b class="tick"></b>' + One(L.r3) + '</span><span class="ipc">'
      + One(L.ipc) + ' <span class="bl"' + CEA + '></span></span></div><p class="sh2">' + M(L.sh2)
      + "</p>" + sign([L.sCon, L.sSup, L.sOwn]) + "</div>";
    h += '<ol class="use">' + [L.use1, L.use2, L.use3, L.use4, L.use5].map(function (u) {
      return "<li>" + M(u) + "</li>";
    }).join("") + "</ol>" + notesBox(L.notesP, 4);
    h += '<p class="fine">' + One(L.fine) + " · " + One(L.proOnly) + "</p>" + flagNote();
    // แผ่นบันทึก: หน้าใหม่ พิมพ์เพิ่มได้ตามจำนวนรายการ
    h += '<div class="pb">' + rpBar(true) + '<p class="addn">' + One(L.rpAdd) + "</p>" + (d.recs
      || []).map(recTable).join("");
    h += '<div class="keep"><h3>' + M(L.defT) + "<small>" + One(L.defS) + '</small></h3><table class="rec"><thead><tr><th style="width:9mm">'
      + M(L.seq) + '</th><th style="width:14mm">' + M(L.dItem) + '</th><th style="width:30mm">' + M(L.dLoc)
      + "</th><th>" + M(L.dFound) + '</th><th style="width:38mm">' + M(L.dFix) + '</th><th style="width:17mm">'
      + M(L.dDue) + '</th><th style="width:23mm">' + M(L.dRe) + "</th></tr></thead><tbody>" + blankRows(7,
        8) + "</tbody></table></div>";
    h += '<div class="keep"><h3>' + M(L.phT) + "<small>" + One(L.phS) + '</small></h3><table class="rec"><thead><tr><th style="width:14mm">'
      + M(L.phNo) + '</th><th style="width:14mm">' + M(L.dItem) + '</th><th style="width:38mm">' + M(L.dLoc)
      + "</th><th>" + M(L.phSub) + '</th><th style="width:27mm">' + M(L.phDt) + "</th></tr></thead><tbody>"
      + blankRows(5, 7) + "</tbody></table></div></div>";
    return h + annexes();
  }
  function refRow(x) {
    var cs = langs(), hasTh = cs.indexOf("th") >= 0, onlyTh = cs.every(function (c) {
      return c === "th";
    }), code = onlyTh ? x[0] : (x[5] || x[0]), by = onlyTh ? x[3] : (x[6] || x[3]);
    return "<li><b>" + esc(code) + "</b> " + esc(hasTh ? x[1] : (x[2] || x[1])) + (hasTh && !onlyTh
      && x[2] ? '<span class="l2">' + esc(x[2]) + "</span>" : "") + (by ? ' <span style="color:#3F4A58">('
        + esc(by) + ")</span>" : "") + "</li>";
  }
  function relBlock(cc) { // 3 Nov 2026: กฎหมายที่เกี่ยวข้องของประเทศที่ตั้งงาน (ผังเมือง ที่ดิน ผู้อนุญาต วิศวกร สถาปนิก อัคคีภัย ไฟฟ้า ความปลอดภัย สิ่งแวดล้อม มาตรฐาน)
    var list = (window.LAWREL || {})[cc] || [], TOP = [["plan", "Town planning and land use"], ["land", "Land"], ["gov",
      "Local permit authority"], ["eng", "Engineers"], ["arch", "Architects"], ["fire", "Fire safety"], ["elec", "Electrical"],
      ["osh", "Occupational safety and health"], ["env", "Environment"], ["std", "Technical standards"]], site = window.SITE
        && window.SITE.site && window.SITE.site.url ? String(window.SITE.site.url).replace(/\/+$/, "") : "";
    if (!list.length) return "";
    return '<div class="lawc"><h4><span data-en="Related laws">Related laws</span></h4>' + TOP.map(function (t) {
      var it = list.filter(function (r) {
        return r.t === t[0];
      });
      return it.length ? '<div><b><span data-en="' + esc(t[1]) + '">' + esc(t[1]) + "</span>:</b> " + it.map(function (r) {
        return esc(r.n) + (r.l ? " (" + esc(r.l) + ")" : "") + (r.b ? " · " + esc(r.b) : "")
          + (r.s === "draft" ? ' [<span data-en="draft, not yet in force">draft, not yet in force</span>]' : r.s ? ' [<span data-en="passed, not yet in force">passed, not yet in force</span>]' : "") // 7 Nov 2026
          + (r.o ? "" : " *");
      }).join("; ") + "</div>" : "";
    }).join("") + '<div><b><span data-en="Official links">Official links</span>:</b> ' + esc(site + "/laws.html#" + cc)
      + ' · * <span data-en="confirm with the authority">confirm with the authority</span></div></div>';
  }
  function lawBlock(cc, c, tag) {
    var r = REC[cc] || null, x = (c && c.law) || {};
    if (!r && !c) return "";
    var tx = function (t) {
      return '<span data-en="' + esc(t) + '">' + esc(t) + "</span>";
    }, row = function (k, v, keep) {
      return v ? "<div><b>" + tx(k) + ":</b> " + (keep ? esc(v) : tx(v)) + "</div>" : "";
    }, name = window.StdPick ? window.StdPick.labelIn(cc, langs()[0]) : r ? r.country : (c ? c.en : cc); // คำบนภาคผนวกตามภาษาของเอกสาร ชื่อทางการและลิงก์คงเดิม
    return '<div class="lawc"><h4>' + esc(name) + "</h4>" + (tag ? "<div><b>" + tx(tag) + "</b></div>" : "") + (r ? row("Law", r.lawName + (r.lawNameLocal
      ? " (" + r.lawNameLocal + ")" : ""), true) + row("Authority", r.authority) + row("Code", r.codeName,
        true) + row("Standards body", r.standardsBody, true) + row("Licensed persons", r.licensed) : "")
      + row("Permit body", x.permitBody) + row("Mandatory inspections", x.mandatoryInspections) + row("Licensed persons (detail)",
        x.licensedPersons) + row("Statutory language", x.statutoryLanguage) + row("Notes", x.notes)
      + (r ? row("Source", r.sourceUrl, true) + row("Source 2", r.sourceUrl2, true) + row("Checked",
        r.checked + " · " + r.confidence, true) : "") + (x.sources && x.sources.length ? row("More sources",
          x.sources.join(" · "), true) : "") + "</div>";
  }
  function evOf(name) { // หน้าทางการของมาตรฐานชื่อนี้ จากทุกประเทศที่เลือก (ชื่อตรงกัน หรือชื่อหนึ่งขึ้นต้นด้วยอีกชื่อ)
    var R = window.DOCREFS && window.DOCREFS.cc, hit = "";
    if (!R || !name) return "";
    (D.ctry || []).forEach(function (c) {
      var ev = R[c.cc] && R[c.cc].ev;
      if (!ev || hit) return;
      if (ev[name]) hit = ev[name];
      else Object.keys(ev).some(function (k) {
        if (k.indexOf(name) === 0 || name.indexOf(k) === 0) { hit = ev[k]; return true; }
        return false;
      });
    });
    return /^https?:\/\//.test(hit) ? hit : "";
  }
  function annexes() { // ภาคผนวก ก มาตรฐานอ้างอิงและลำดับการใช้เกณฑ์ · ภาคผนวก ข กรอบกฎหมายของประเทศที่เลือก (อยู่ท้ายเอกสาร ตามคำสั่งผู้ใช้ 2 พ.ย. 2026)
    var d = D, L = d.lab, cs = langs();
    var codeRow = function (c) {
      var m = c.code || {}, keys = Object.keys(m).filter(function (k) {
        return m[k];
      });
      return keys.length ? '<div class="stdc"><h4>' + esc(c.en) + "</h4>" + keys.map(function (k) {
        var lb = {
          building: "Building work",
          concrete: "Concrete",
          steel: "Steel",
          electrical: "Electrical",
          plumbing: "Plumbing and sanitation",
          fire: "Fire",
          safety: "Safety"
        }[k] || k;
        return '<div><b><span data-en="' + esc(lb) + '">' + esc(lb) + "</span>:</b> " + '<span data-en="'
          + esc(m[k]) + '">' + esc(m[k]) + "</span></div>";
      }).join("") + "</div>" : "";
    };
    var thRefs = (d.ccs || []).indexOf("TH") >= 0 && (d.refs || []).length ? '<div class="refs" style="margin:0;border:0"><b>'
      + M(L.refsT) + "</b><ul>" + d.refs.map(refRow).join("") + "</ul><p>" + One(L.refsN) + "</p></div>" : "";
    var ord = '<p class="ordb"><b>' + esc(L.ordT[0]) + '</b> <b class="tick"></b>1 ' + esc(L.ordA[0])
      + ' <b class="tick"></b>2 ' + esc(L.ordB[0]) + ' <b class="tick"></b>3 ' + esc(L.ordC[0]) + ' <span class="bl"'
      + CEA + "></span> · " + esc(L.ordN[0]) + cs.slice(1).map(function (c, i) {
        return '<span class="l2"' + at(c) + ">" + esc(L.ordT[i + 1]) + ": 1 " + esc(L.ordA[i + 1])
          + " · 2 " + esc(L.ordB[i + 1]) + " · 3 " + esc(L.ordC[i + 1]) + " · " + esc(L.ordN[i + 1])
          + "</span>";
      }).join("") + "</p>";
    var h = '<section class="annex pb"><h3>' + M(L.annexA) + "</h3>" + (d.picked && d.picked.length
      ? '<div class="stdc"><h4>' + M(L.stdUsed) + "</h4>" + d.picked.map(function (n) { // 7 พ.ย. 2026 คำสั่งเจ้าของ: มาตรฐานที่ใช้ในเอกสารต้องมีแหล่งอ้างอิงที่ตามไปดูได้ · ลิงก์หน้าทางการจาก doc-refs.js (evidence) เมื่อมี
        var u = evOf(n);
        return esc(n) + (u ? ' <span class="rf2" data-noi18n="1">' + esc(u) + "</span>" : "");
      }).join(" · ") + "</div>" : "")
      + thRefs + (d.ctry || []).map(codeRow).join("") + (d.stdName ? '<div class="stdc"><h4>' + esc(d.stdName)
        + "</h4>" + M(L.user) + "</div>" : "") + ord + "</section>";
    var site = $("site") ? $("site").value : "", inC = (d.ctry || []).some(function (c) {
      return c.cc === site;
    });
    var lawHtml = (site && !inC && REC[site] ? lawBlock(site, null, "Construction site") : "") + (d.ctry || []).filter(function (c) {
      return c.cc !== "INT";
    }).map(function (c) {
      return lawBlock(c.cc, c, c.cc === site ? "Construction site" : "Country of the standard");
    }).join("") + (site ? relBlock(site) : ""); // 3 Nov 2026: กฎหมายตามประเทศที่ตั้งงานขึ้นก่อน แล้วตามด้วยกฎหมายที่เกี่ยวข้อง
    if (lawHtml) h += '<section class="annex"><h3>' + M(L.annexB) + "</h3>" + lawHtml + '<div class="ord2">'
      + M(L.lnote) + "</div></section>";
    return h;
  }
  function pageCss(d) { // ท้ายทุกหน้า: รหัส ฉบับวันที่ ชื่อผู้ซื้อ เลขหน้า
    var st = $("pageCss"), L = d.lab, q2 = function (s) {
      return '"' + String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/[\r\n]+/g, " ")
        + '"';
    };
    if (!st) {
      st = document.createElement("style");
      st.id = "pageCss";
      document.head.appendChild(st);
    }
    var f = 'font: 7.6pt "Segoe UI", "Leelawadee UI", Arial, sans-serif; color: #111;';
    st.textContent = "@media print { @page { size: A4; margin: 12mm 11mm 15mm 11mm; @bottom-left { content: "
      + q2(docCode(d) + (d.revDate ? " · " + L.issue[0] + " " + d.revDate : "")) + "; " + f + " } @bottom-center { content: "
      + q2("สร้าง | BUILD TH" + (d.owned && d.licensee ? " · Licensed to " + d.licensee + (d.licNo
        ? " · " + d.licNo : "") : "")) + "; " + f + " } @bottom-right { content: " + q2(L.page[0]
          + " ") + ' counter(page) " / " counter(pages); ' + f + " }"
      + " } }";
  }
  function noteBar(d) { // ข้อความบนจอเหนือเอกสาร ไม่พิมพ์ · แปลตามภาษาของเว็บ
    var h = "", cm = d.cmp || {};
    if (!d.owned) {
      var want = (d.ccs || []).filter(function (c) {
        return c !== "TH" && c !== "INT";
      })[0] || (d.lang1 === "en" ? "" : LANG_CC[d.lang1]) || "", href = "product.html?id=" + encodeURIComponent(d.id)
        + (want && want !== "TH" ? "&cc=" + want : "") + "#editions";
      h += '<div class="dn"><span><b>' + esc(d.outside ? "ภาษาหรือมาตรฐานนี้ไม่อยู่ในฉบับที่คุณซื้อ จึงแสดงฉบับฟรี" : "นี่คือฉบับฟรี: ข้อหลัก 1 ภาษา")
        + "</b>" + (d.freeOne ? " · ฉบับฟรีแสดงเฉพาะภาษาที่ 1" : "") + " · ซื้อใบนี้เพื่อใช้ครบทุกข้อ และ 2 ภาษา</span>"
        + '<a class="b pri sm" href="' + esc(href) + '">' + esc(want && want !== "TH" ? "ซื้อฉบับ"
          + ccName(want) + "ของใบนี้" : "ซื้อใบนี้") + "</a>" + (d.outside ? ' <button class="b line sm" type="button" id="useTH">ใช้มาตรฐานไทยตามฉบับที่ซื้อแล้ว</button>' : "") + "</div>"; // 7 พ.ย. 2026: ทางกลับหนึ่งคลิก ไม่ต้องหาช่องประเทศเอง
    }
    if (cm.diff || (cm.none && (d.ccs || []).length > 1)) h += '<div class="pbar"><b>ค่าที่ต่างกัน:</b> '
      + d.ccs.map(function (c) {
        return '<button class="b line sm" type="button" data-all="' + esc(c) + '">ใช้ค่า' + esc(ccName(c))
          + "ทั้งใบ</button>";
      }).join(" ") + ' <button class="b line sm" type="button" data-all="">ล้าง ให้ติ๊กหน้างาน</button><span class="note" id="pickN"></span></div>';
    $("docNote").innerHTML = h;
  }
  function fit() { // จอเล็ก: ย่อทั้งแผ่นให้พอดีจอ · กดขยายเพื่อกรอกได้
    var w = $("pagewrap"), box = $("sheetOut"), btn = $("fitBtn");
    if (!w || !box || $("result").hidden) return;
    var cs = getComputedStyle(w), avail = w.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight),
      z = Math.min(1, avail / 794), small = z < 0.995;
    btn.hidden = !small;
    box.style.zoom = small && fitOn ? z.toFixed(3) : "";
    btn.textContent = fitOn ? "ขยายเต็มขนาด" : "ย่อให้พอดีจอ";
  }
  window.addEventListener("resize", fit);
  function draw() {
    var d = D, cs = langs(), box = $("sheetOut");
    box.className = "fm" + (cs[0] === "th" ? " thf" : "") + (cs.length > 2 ? " t3" : "");
    box.setAttribute("dir", [d.lang1, d.lang2].filter(Boolean).every(function (c) {
      return RTL[c];
    }) ? "rtl" : "ltr");
    box.setAttribute("lang", cs[0]);
    box.innerHTML = (d.owned ? proForm(META) : freeForm(META)) + (d.owned ? '<p class="lic">' + esc(docCode(d))
      + " · สร้าง | BUILD TH · Licensed to " + esc(d.licensee) + (d.licNo ? " · " + esc(d.licNo) : "")
      + "</p>" : "") + '<p class="fine editedNote" hidden>' + One(d.lab.edited) + "</p>";
    noteBar(d);
    pageCss(d);
    if (window.StdPick) window.StdPick.trEn(box, cs[0]); // ภาคผนวกตามภาษาของเอกสาร
    $("swapBtn").hidden = !d.lang2;
    editing = false;
    $("editBtn").textContent = "แก้ไขเอกสาร";
    $("addRow").hidden = true;
    $("result").hidden = false;
    drawPicks();
    fit();
  }
  function render(d, meta) {
    D = d;
    META = meta;
    draw();
    $("result").scrollIntoView({ block: "start" });
  }
  function drawPicks() {
    var el = $("pickN");
    if (!el) return;
    var all = document.querySelectorAll(".opts2").length, on = document.querySelectorAll(".opts2.chosen").length;
    el.textContent = " เลือกแล้ว " + on + " จาก " + all + " ข้อ · ข้อที่ยังไม่เลือกพิมพ์เป็นช่องติ๊กทั้ง 2 ค่า";
  }
  function setPick(group, inp) {
    group.classList.toggle("chosen", !!inp);
    [].forEach.call(group.querySelectorAll(".pick"), function (p) {
      var i = p.querySelector("input"), on = !!inp && i === inp;
      i.checked = on;
      p.classList.toggle("on", on);
    });
  }
  var busy = false;
  $("f-doc").addEventListener("submit", function (ev) {
    ev.preventDefault();
    if (busy) return;
    var f = ev.target, v = function (n) {
      return String(f.elements[n].value || "").trim();
    }, tok = B.token.get();
    $("freeNow").hidden = true;
    if (!tok) {
      var sx = sheets.filter(function (x) {
        return x.id === v("sheet");
      })[0], l0 = base(v("lang1"));
      if (nLang() === 1 && sx && sx.free && sx.ok === true && (l0 === "th" || l0 === "en")) { // ฉบับฟรีไทยและอังกฤษมีไฟล์พร้อม ไม่ต้องสมัคร
        say("");
        $("freeNow").innerHTML = "<span><b>ฉบับฟรีของใบนี้พร้อมดาวน์โหลด ไม่ต้องสมัคร</b></span>" + '<a class="b pri sm" href="'
          + esc(l0 === "en" ? B.freeEN(sx) : sx.free) + '" download>' + (l0 === "en" ? "ดาวน์โหลด PDF (English)" : "ดาวน์โหลด PDF (ไทย)")
          + "</a>";
        $("freeNow").hidden = false;
        return;
      }
      say(nLang() === 2 ? "2 ภาษาต้องซื้อ เข้าสู่ระบบก่อนสร้างเอกสาร" : "ภาษานี้สร้างจากระบบเอกสาร เข้าสู่ระบบก่อน (สมัครฟรี)",
        true);
      $("loginBar").hidden = false;
      keepNext();
      return;
    }
    var pick2 = nLang() === 2 ? v("lang2") : "", pick1 = v("lang1");
    if (base(pick1) === base(pick2)) {
      say("เลือกภาษาที่ 2 ให้ต่างจากภาษาที่ 1", true);
      return;
    }
    busy = true;
    var b = f.querySelector("button[type=submit]"), old = b.textContent;
    b.disabled = true;
    b.textContent = "กำลังสร้างเอกสาร…";
    say("ครั้งแรกของภาษานั้นอาจใช้เวลาประมาณ 1 นาที เพราะระบบแปลและตรวจทุกช่อง");
    B.call("docBuild", {
      token: tok,
      sheet: v("sheet"),
      lang1: base(pick1),
      lang2: base(pick2),
      std: v("c1"),
      std2: v("c2"),
      site: $("site") ? $("site").value : "",
      stds: window.StdPick && $("stdBox") ? window.StdPick.selected($("stdBox")) : []
    })
      .then(function (r) {
        say("");
        render(enDoc(r.doc, /^en-/.test(pick1) ? pick1 : pick2), {
          project: [v("project"), f.elements.detail ? v("detail") : ""].filter(Boolean).join(" · "),
          contractor: v("contractor"),
          location: [v("location"), geoVal()].filter(Boolean).join(" · ")
        });
        if (jobPending) {
          if (D && jobPending.id === D.id) jobApply(jobPending);
          jobPending = null;
        }
      })
      .catch(function (e) {
        say(e.message || "สร้างเอกสารไม่สำเร็จ ลองใหม่อีกครั้ง", true);
        jobPending = null;
      })
      .then(function () {
        busy = false;
        b.disabled = false;
        b.textContent = old;
      });
  });
  $("printBtn").addEventListener("click", function () {
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    window.print();
  });
  $("fitBtn").addEventListener("click", function () {
    fitOn = !fitOn;
    fit();
  });
  // สลับภาษา 1 ↔ 2 โดยไม่ต้องสร้างใหม่: กล่องกรอกย้ายไปบรรทัดหลักของภาษาใหม่ ค่าที่กรอกแล้วยังอยู่
  function swapText(o) {
    if (Array.isArray(o)) {
      if (o.length >= 2 && o.every(function (x) {
        return typeof x === "string";
      })) {
        var t = o[0];
        o[0] = o[1];
        o[1] = t;
        return;
      }
        o.forEach(swapText);
      return;
    }
    if (o && typeof o === "object") Object.keys(o).forEach(function (k) {
      swapText(o[k]);
    });
  }
  $("swapBtn").addEventListener("click", function () {
    var box = $("sheetOut"), vals = [].map.call(box.querySelectorAll(".w,.bl"), function (e) {
      return e.textContent;
    }), ticks = [].map.call(box.querySelectorAll(".bx,.tick"), function (e) {
      return e.classList.contains("on");
    }), picks = [].map.call(box.querySelectorAll(".pick input"), function (e) {
      return e.checked;
    });
    ["lab", "title", "sum", "stages", "recs", "warnTxt"].forEach(function (k) {
      swapText(D[k]);
    });
    var l = D.lang1;
    D.lang1 = D.lang2;
    D.lang2 = l;
    draw();
    [].forEach.call(box.querySelectorAll(".w,.bl"), function (e, i) {
      if (vals[i]) e.textContent = vals[i];
    });
    [].forEach.call(box.querySelectorAll(".bx,.tick"), function (e, i) {
      e.classList.toggle("on", !!ticks[i]);
    });
    [].forEach.call(box.querySelectorAll(".pick input"), function (e, i) {
      if (picks[i]) setPick(e.closest(".opts2"), e);
    });
    drawPicks();
  });
  // แก้เอกสารก่อนพิมพ์ได้ทุกช่อง · ซ่อนหรือเพิ่มรายการได้ · บรรทัดรหัสและชื่อผู้มีสิทธิ์ท้ายเอกสารแก้ไม่ได้
  var editing = false, EDITABLE = ".ti small,.ti h1,.ti h2,.warn,.sh1,.sh2,.chk th,.chk td:not(.bx):not(.w),.rec th,h3,.res > span,.sig h4,.use li,.nt > b,.rp > b,.addn,.stdc,.lawc,.ordb,.up,.lgd,.cmpb";
  function setEdit(on) {
    editing = on;
    var box = $("sheetOut"), en = box.querySelector(".editedNote");
    if (on && en) en.hidden = false;
    box.classList.toggle("editing", on);
    $("editBtn").textContent = on ? "เสร็จสิ้นการแก้ไข" : "แก้ไขเอกสาร";
    $("addRow").hidden = !on;
    [].forEach.call(box.querySelectorAll(EDITABLE), function (e) {
      if (on) {
        e.setAttribute("contenteditable", CE);
        e.setAttribute("data-e", "1");
      } else {
        e.removeAttribute("contenteditable");
        e.removeAttribute("data-e");
      }
    });
    [].forEach.call(box.querySelectorAll(".chk tbody tr:not(.st)"), function (tr) {
      var x = tr.querySelector(".rm");
      if (on && !x) {
        x = document.createElement("button");
        x.type = "button";
        x.className = "rm noprint";
        x.textContent = "×";
        x.title = "ซ่อนแถวนี้";
        x.setAttribute("contenteditable", "false");
        tr.cells[0].appendChild(x);
      }
      if (!on && x) x.remove();
    });
  }
  $("editBtn").addEventListener("click", function () {
    setEdit(!editing);
  });
  /* 14 Nov 2026 (คำสั่งเจ้าของ): บันทึกข้อมูลที่กรอกแยกตามงาน · เก็บในเบราว์เซอร์ของเครื่องนี้ (localStorage) ไม่ส่งขึ้นเซิร์ฟเวอร์
     เก็บ: ค่าในฟอร์มด้านบน + ข้อความในช่องกรอก + ช่องติ๊ก + ค่าที่เลือก ของเอกสารที่สร้างแล้ว · เปิดงาน = ตั้งฟอร์ม สร้างเอกสารใหม่ แล้วเติมข้อมูลกลับตามลำดับช่อง */
  var JOBK = "build_doc_jobs", jobPending = null, JOBF = ["sheet", "lang1", "lang2", "c1", "c2", "stdName", "project", "detail",
    "contractor", "location"];
  function jobsGet() {
    try {
      var j = JSON.parse(localStorage.getItem(JOBK) || "{}");
      return j && typeof j === "object" ? j : {};
    } catch (e) {
      return {};
    }
  }
  function jobsList() {
    var s = $("jobPick");
    if (!s) return;
    var j = jobsGet(), keep = s.value;
    s.innerHTML = '<option value="">งานใหม่</option>' + Object.keys(j).sort(function (a, b) {
      return (j[b].at || 0) - (j[a].at || 0);
    }).map(function (k) {
      return '<option value="' + esc(k) + '">' + esc(k) + "</option>";
    }).join("");
    if (keep && j[keep]) s.value = keep;
  }
  function jobSnap() {
    var box = $("sheetOut"), idx = function (sel, test) {
      var out = [];
      [].forEach.call(box.querySelectorAll(sel), function (e, i) {
        if (test(e)) out.push(i);
      });
      return out;
    }, on = function (e) {
      return e.classList.contains("on");
    }, t = [].map.call(box.querySelectorAll(".w,.iv,.bl"), function (e) {
      return e.textContent;
    });
    return {
      id: D.id, n: t.length, t: t, bx: idx("td.bx", on), tk: idx(".tick", on), pk: idx(".pick input", function (e) {
        return e.checked;
      })
    };
  }
  function jobApply(s) {
    var box = $("sheetOut"), each = function (sel, fn) {
      [].forEach.call(box.querySelectorAll(sel), fn);
    };
    each(".w,.iv,.bl", function (e, i) {
      if (s.t && typeof s.t[i] === "string" && s.t[i] !== "") e.textContent = s.t[i];
    });
    each("td.bx", function (e, i) {
      e.classList.toggle("on", (s.bx || []).indexOf(i) >= 0);
    });
    each(".tick", function (e, i) {
      e.classList.toggle("on", (s.tk || []).indexOf(i) >= 0);
    });
    each(".pick input", function (e, i) {
      if ((s.pk || []).indexOf(i) >= 0) setPick(e.closest(".opts2"), e);
    });
    drawPicks();
    say(s.n === box.querySelectorAll(".w,.iv,.bl").length ? "เปิดงานที่บันทึกไว้แล้ว" : "เอกสารฉบับนี้มีจำนวนช่องต่างจากตอนบันทึก ตรวจข้อมูลที่กรอกอีกครั้ง",
      s.n !== box.querySelectorAll(".w,.iv,.bl").length);
  }
  if ($("jobSave")) $("jobSave").addEventListener("click", function () {
    if (!D) return;
    var f = $("f-doc"), form = {}, j = jobsGet(), btn = $("jobSave");
    JOBF.forEach(function (n) {
      if (f.elements[n]) form[n] = f.elements[n].value;
    });
    form.nlang = nLang();
    form.site = $("site") ? $("site").value : "";
    form.geo = $("geo") ? $("geo").value : "";
    var name = (String(form.project || "").trim() || "งานไม่มีชื่อ") + " · " + D.id;
    if (!j[name] && Object.keys(j).length >= 60) {
      window.alert("บันทึกได้ไม่เกิน 60 งานในเครื่องนี้ ลบงานเก่าก่อน");
      return;
    }
    j[name] = { at: Date.now(), form: form, doc: jobSnap() };
    try {
      localStorage.setItem(JOBK, JSON.stringify(j));
    } catch (e) {
      window.alert("พื้นที่เก็บของเบราว์เซอร์เต็ม ลบงานเก่าก่อน");
      return;
    }
    jobsList();
    $("jobPick").value = name;
    btn.textContent = "บันทึกแล้ว";
    setTimeout(function () {
      btn.textContent = "บันทึกงานนี้";
    }, 2000);
  });
  if ($("jobLoad")) $("jobLoad").addEventListener("click", function () {
    var job = jobsGet()[$("jobPick").value], f = $("f-doc");
    if (!job) {
      say("เลือกงานที่บันทึกไว้ก่อน", true);
      return;
    }
    var fm = job.form || {}, set = function (el, val) {
      if (!el || val == null || val === "") return;
      el.value = val;
      el.dispatchEvent(new Event("change", { bubbles: true }));
    };
    set(f.elements.sheet, fm.sheet);
    setN(fm.nlang === 2 ? 2 : 1);
    var r = document.querySelector("input[name=nlang]:checked");
    if (r) r.dispatchEvent(new Event("change", { bubbles: true }));
    set(f.elements.lang1, fm.lang1);
    if (fm.nlang === 2) set(f.elements.lang2, fm.lang2);
    touched.c1 = true;
    touched.c2 = true;
    touched.site = true;
    set(f.elements.c1, fm.c1);
    set(f.elements.c2, fm.c2);
    if ($("site") && fm.site) $("site").value = fm.site;
    ["stdName", "project", "detail", "contractor", "location"].forEach(function (n) {
      if (f.elements[n]) f.elements[n].value = fm[n] || "";
    });
    if ($("geo")) $("geo").value = fm.geo || "";
    geoDraw();
    jobPending = job.doc || null;
    f.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
  });
  if ($("jobDel")) $("jobDel").addEventListener("click", function () {
    var k = $("jobPick").value, j = jobsGet();
    if (!k || !j[k]) {
      say("เลือกงานที่บันทึกไว้ก่อน", true);
      return;
    }
    if (!window.confirm("ลบงาน " + k + " ออกจากเครื่องนี้ ลบแล้วกู้คืนไม่ได้")) return;
    delete j[k];
    try {
      localStorage.setItem(JOBK, JSON.stringify(j));
    } catch (e) {}
    jobsList();
    say("ลบงานแล้ว");
  });
  jobsList();
  geoCountry();
  $("sheetOut").addEventListener("click", function (ev) {
    var t = ev.target, x = t.closest(".rm");
    if (x) {
      x.closest("tr").remove();
      drawPicks();
      return;
    }
    var bx = t.closest("td.bx");
    if (bx) {
      var was = bx.classList.contains("on");
      [].forEach.call(bx.parentNode.querySelectorAll("td.bx"), function (c) {
        c.classList.remove("on");
      });
      if (!was) bx.classList.add("on");
      return;
    } // ติ๊กได้ช่องเดียวต่อแถว
    var wx = t.closest(".wx");
    if (wx) {
      wx.querySelector(".tick").classList.toggle("on");
      return;
    }
    var tk = t.closest(".tick");
    if (tk) {
      var on = tk.classList.contains("on"), grp = tk.closest(".res,.ordb");
      if (grp) [].forEach.call(grp.querySelectorAll(".tick"), function (c) {
        c.classList.remove("on");
      });
      tk.classList.toggle("on", !on);
    }
  });
  $("sheetOut").addEventListener("change", function (ev) {
    var t = ev.target;
    if (t.matches && t.matches(".pick input")) {
      setPick(t.closest(".opts2"), t);
      drawPicks();
    }
  });
  $("sheetOut").addEventListener("keydown", function (ev) {
    if (ev.key === "Enter" && ev.target.classList && (ev.target.classList.contains("bl") || ev.target.classList.contains("iv"))) {
      ev.preventDefault();
      ev.target.blur();
    }
  });
  $("docNote").addEventListener("click", function (ev) { // 7 พ.ย. 2026: ปุ่ม "ใช้มาตรฐานไทยตามฉบับที่ซื้อแล้ว" สร้างเอกสารใหม่ด้วยมาตรฐานไทยทันที
    if (!ev.target.closest("#useTH")) return;
    touched.c1 = true;
    touched.c2 = true;
    $("c1").value = "TH";
    $("c2").value = "";
    drawCc();
    if ($("f-doc").requestSubmit) $("f-doc").requestSubmit();
    else $("f-doc").dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
  });
  $("docNote").addEventListener("click", function (ev) {
    var all = ev.target.closest("[data-all]");
    if (!all) return;
    var cc = all.getAttribute("data-all");
    [].forEach.call($("sheetOut").querySelectorAll(".opts2"), function (g) {
      var p = cc ? g.querySelector('.pick[data-cc="' + cc + '"] input') : null;
      setPick(g, p);
    });
    drawPicks();
  });
  $("addRow").addEventListener("click", function () {
    var list = $("sheetOut").querySelectorAll("table.chk tbody"), tb = list[list.length - 1];
    if (!tb) return;
    var tr = document.createElement("tr");
    tr.innerHTML = D.owned ? '<td class="n"></td><td class="pt"></td><td class="it"></td><td class="cr"></td><td class="hw"></td><td class="bx"></td><td class="bx"></td><td class="bx"></td><td class="w"'
      + CEA + "></td>" : '<td class="n"></td><td class="it"></td><td class="cr"></td><td class="bx"></td><td class="bx"></td><td class="w"'
      + CEA + "></td>";
    tb.appendChild(tr);
    setEdit(true);
    var c = tr.querySelector(".it");
    if (c) c.focus();
  });
})();
