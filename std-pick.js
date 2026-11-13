/* std-pick.js (2 Nov 2026): choose a country, then the standards to use for a check sheet.
   Product page (mount): 3 tabs (standards of this sheet, law, standards system) and a button that opens the form with the same choices.
   Form page (list): a short list of tick boxes.
   This file and doc-refs.js hold names and counts only. The values stay in the paid data on the back end.
   Words in Thai are translated by i18n.js. Official names carry data-noi18n. English notes carry data-en and go to the translator here. */
(function () {
  "use strict";
  var REFS = window.DOCREFS || { cc: {} }, LAW = window.LAWDB || [], CC_OF = window.CC_OF || {},
    LANG_CC = window.LANG_CC || {}, REC = {};
  LAW.forEach(function (x) {
    if (CC_OF[x.country]) REC[CC_OF[x.country]] = x;
  });
  var lang = "th";
  try {
    lang = localStorage.getItem("build_lang") || "th";
  } catch (e) {}
    var DN = null;
  try {
    DN = new Intl.DisplayNames([lang], { type: "region", style: "short" });
  } catch (e) {}
    function esc(s) {
      return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
      });
    }
  function regName(cc, lg) { // 7 พ.ย. 2026: ชื่อประเทศไทยและอังกฤษใช้ทะเบียนเดียวกับหน้ากฎหมาย (region.js จาก 00_โซน.json) ไม่ใช้ชื่อย่อของเบราว์เซอร์ เช่น สหรัฐฯ
    var R = window.REGION, b = String(lg || "").slice(0, 2);
    if (R && R.regionName && (b === "th" || b === "en")) {
      var n = R.regionName(cc, b);
      if (n && n !== cc) return n;
    }
    return "";
  }
  function label(cc) {
    if (cc === "INT") return "ข้อกำหนดโครงการ";
    var n = regName(cc, lang);
    if (n) return n;
    try {
      n = DN ? DN.of(cc) : "";
    } catch (e) {}
      if (n && n !== cc) return n;
    return REC[cc] ? (lang === "th" ? REC[cc].countryTh : REC[cc].country) : cc;
  }
  function labelIn(cc, lg) {
    var n = regName(cc, lg);
    if (n) return n;
    try {
      n = new Intl.DisplayNames([lg], { type: "region", style: "short" }).of(cc);
      if (n && n !== cc) return n;
    } catch (e) {} return REC[cc] ? REC[cc].country : cc;
  }
  function defaultCc() {
    return LANG_CC[lang] || "TH";
  }
  function data(cc, sheet) {
    var c = REFS.cc && REFS.cc[cc];
    return (c && c.sheets && c.sheets[sheet]) || null;
  }
  function countries() {
    var first = defaultCc(), zone = window.REGION ? window.REGION.list(lang) : [], rank = function (c) {
      var i = zone.indexOf(c);
      return c === first ? -2 : i >= 0 ? i : c === "TH" ? 900 : 999;
    };
    return Object.keys(REC).sort(function (a, b) {
      return rank(a) - rank(b) || label(a).localeCompare(label(b), lang);
    });
  }
  function ccOptions(sheet, sel) {
    var all = countries(), yes = all.filter(function (c) {
      return data(c, sheet);
    }), no = all.filter(function (c) {
      return !data(c, sheet);
    });
    var o = function (c) {
      return '<option value="' + esc(c) + '"' + (c === sel ? " selected" : "") + ">" + esc(label(c))
        + "</option>";
    };
    return '<optgroup label="มีข้อมูลของใบนี้แล้ว">' + yes.map(o).join("") + "</optgroup>" + (no.length
      ? '<optgroup label="ประเทศอื่น กรอกค่าตามข้อกำหนดโครงการ">' + no.map(o).join("") + "</optgroup>" : "");
  }
  var langSite = lang;
  // English notes: translated once per language, kept in this browser
  function trEn(root, target) {
    var lang = target || langSite;
    if (lang === "en") return;
    var els = [].slice.call(root.querySelectorAll("[data-en]"));
    if (!els.length) return;
    var key = "build_sx_" + lang, cache = {};
    try {
      cache = JSON.parse(localStorage.getItem(key) || "{}") || {};
    } catch (e) {}
      var need = [], put = function () {
        els.forEach(function (e) {
          var t = cache[e.getAttribute("data-en")];
          if (t) e.textContent = t;
        });
      };
    els.forEach(function (e) {
      var t = e.getAttribute("data-en");
      if (!cache[t] && need.indexOf(t) < 0 && t.length <= 1500) need.push(t);
    });
    put();
    var B = window.BUILD;
    if (!need.length || !B || !B.call) return;
    B.call("i18nExtra", { lang: lang, items: need.slice(0, 60) }).then(function (j) {
      var m = (j && j.map) || {};
      Object.keys(m).forEach(function (k) {
        cache[k] = m[k];
      });
      try {
        localStorage.setItem(key, JSON.stringify(cache));
      } catch (e) {} put();
    }).catch(function () {});
  }
  function en(t) {
    return t ? '<span data-noi18n="1" data-en="' + esc(t) + '">' + esc(t) + "</span>" : "";
  }
  function off(t) {
    return t ? '<span data-noi18n="1">' + esc(t) + "</span>" : "";
  }
  function trow(d, i) { // Thailand: code, name and issuer in the language of the page
    var t = (d.t || [])[i] || [];
    return {
      code: lang === "th" ? t[0] : (t[5] || t[0]),
      name: lang === "en" ? (t[2] || t[1]) : t[1],
      by: lang === "en" ? (t[6] || t[3]) : t[3]
    };
  }
  // ---------- coverage for the names that are on
  function cover(d, offNames) {
    var keys = Object.keys(d.m || {}), per = {}, have = 0, th = !!d.t;
    keys.forEach(function (k) {
      var on = d.m[k].filter(function (i) {
        return !offNames[d.s[i]];
      }), st = +k.split(".")[0] - 1;
      if (on.length) {
        have++;
        per[st] = per[st] || { n: 0, by: {} };
        per[st].n++;
        on.forEach(function (i) {
          per[st].by[i] = (per[st].by[i] || 0) + 1;
        });
      }
    });
    if (th) have = (d.n || 0) - (keys.length - have); // Thailand: every item has a criterion, except an item whose cited standards are all off
    return { have: have, per: per };
  }
  function countOf(d, i) {
    return Object.keys(d.m || {}).filter(function (k) {
      return d.m[k].indexOf(i) >= 0;
    }).length;
  }
  function usable(d) {
    return d.s.filter(function (n, i) {
      return countOf(d, i) > 0;
    });
  }

  function mount(el, o) {
    var S = {
      cc: REC[o.cc] ? o.cc : (REC[defaultCc()] ? defaultCc() : "TH"),
      tab: "std",
      off: {}
    };
    function picked() {
      var d = data(S.cc, o.sheet);
      return d ? usable(d).filter(function (n) {
        return !S.off[n];
      }) : [];
    }
    function goHref() {
      var d = data(S.cc, o.sheet), all = !d || picked().length === usable(d).length, st = all ? "" : "&st="
        + encodeURIComponent(picked().join("|"));
      return (o.docUrl || "doc.html") + "?item=" + encodeURIComponent(o.sheet) + "&c1=" + encodeURIComponent(S.cc)
        + st;
    }
    function panelStd() {
      var d = data(S.cc, o.sheet), r = REC[S.cc], many = d && usable(d).length > 1;
      if (!d) return '<div class="sx-empty"><b>ยังไม่มีค่าที่ตรวจแล้วของประเทศนี้สำหรับใบนี้</b><p>ฟอร์มใช้ได้ทันที ช่องเกณฑ์เว้นให้กรอกตามข้อกำหนดโครงการ และพิมพ์เกณฑ์ไทยเป็นข้อมูลอ้างอิง</p>'
        + (r && r.codeName ? '<p><b>มาตรฐานหลักของประเทศนี้</b><br>' + off(r.codeName) + "</p>" : "")
        + "</div>";
      var rows = d.s.map(function (n, i) {
        var t = d.t ? trow(d, i) : null, c = countOf(d, i);
        var box = false; // 14 พ.ย. 2026 (คำสั่งเจ้าของ): ไม่มีช่องติ๊กให้เลือกมาตรฐาน ระบบใช้มาตรฐานของใบนั้นทั้งหมด
        if (many && c === 0) return ""; // แสดงเฉพาะมาตรฐานที่ใช้ในเอกสารที่จะออก
        return (box ? '<label class="sx-i"><input type="checkbox" data-sx="' + esc(n) + '"' + (S.off[n]
          ? "" : " checked") + ">" : '<div class="sx-i">') + '<span class="sx-t"><b data-noi18n="1">'
          + esc(t ? t.code : n) + "</b>" + (t && t.name ? "<small>" + esc(t.name) + (t.by ? " · "
            + esc(t.by) : "") + "</small>" : "") + "</span>" + (c ? "<em>" + c + " <span>ข้อ</span></em>" : "")
          + (box ? "</label>" : "</div>");
      }).join("");
      var cv = cover(d, S.off), n = d.n || 0, pct = n ? Math.round(cv.have / n * 100) : 0, names = (o.stages
        || []);
      var stage = names.map(function (nm, i) {
        var p = cv.per[i];
        if (!p) return "";
        return '<li><span>' + esc(nm) + "</span><b>" + p.n + " <span>ข้อ</span></b>" + (many ? '<small data-noi18n="1">'
          + Object.keys(p.by).map(function (k) {
            var tk = d.t ? trow(d, +k).code : d.s[+k];
            return esc(tk) + " " + p.by[k];
          }).join(" · ") + "</small>" : "") + "</li>";
      }).join("");
      return '<p class="sx-lead">' + (many ? "เรื่องนี้มีมาตรฐานหลายตัว ระบบใช้ทุกตัวที่เกี่ยวกับใบนี้ · ข้อที่มาตรฐานให้ค่าต่างกัน เอกสารพิมพ์ทุกค่าเป็นช่องติ๊กให้เลือกในฟอร์ม" : "มาตรฐานที่ใช้กับใบนี้")
        + '</p><div class="sx-list">' + rows + "</div>" +
        (many ? '<p class="sx-tools"><button type="button" class="sx-l" data-sxall="1">เลือกทั้งหมด</button></p>' : "")
        +
        '<div class="sx-sum"><div class="sx-m"><b>' + (d.t ? "ใช้เกณฑ์ตามมาตรฐานของใบนี้ " : "มีค่าที่ตรวจแล้ว ")
        + cv.have + " ข้อ จาก " + n + ' ข้อ</b><span class="sx-bar" aria-hidden="true"><i style="width:'
        + pct + '%"></i></span></div>' + (stage ? '<ul class="sx-st">' + stage + "</ul>" : "") + (cv.have < n
          ? '<p class="note" style="margin:6px 0 0">ข้อที่เหลือเว้นช่องให้กรอกตามข้อกำหนดโครงการ</p>' : "")
        + "</div>";
    }
    function panelLaw() {
      var r = REC[S.cc];
      if (!r) return '<div class="sx-empty"><b>ยังไม่มีข้อมูลกฎหมายของประเทศนี้</b></div>';
      var row = function (k, v) {
        return v ? "<dt>" + k + "</dt><dd>" + v + "</dd>" : "";
      }, c = REFS.cc && REFS.cc[S.cc], src = [r.sourceUrl, r.sourceUrl2].filter(function (u) {
        return /^https:\/\//.test(String(u));
      });
      return '<dl class="sx-dl">' + row("กฎหมายหลัก", off(r.lawName) + (r.lawNameLocal && r.lawNameLocal !== r.lawName
        ? "<br>" + off(r.lawNameLocal) : "")) + row("หน่วยงาน", en(r.authority)) + row("ผู้มีใบอนุญาต",
          en(r.licensed)) + row("มาตรฐานหลัก", off(r.codeName)) + row("หน่วยงานมาตรฐาน", off(r.standardsBody))
        + row("ตรวจข้อมูลเมื่อ", off(c && c.date ? c.date : r.checked) + (r.confidence === "official"
          ? "" : ' · <span class="sx-warn">ยังไม่ยืนยันจากแหล่งทางการ</span>')) + row("แหล่งข้อมูล",
            src.map(function (u, i) {
              return '<a href="' + esc(u) + '" target="_blank" rel="noopener nofollow">' + (i + 1)
                + " " + esc(String(u).replace(/^https:\/\/(www\.)?/, "").split("/")[0]) + "</a>";
            }).join(" · ")) + '</dl><p class="note" style="margin:8px 0 0">รายละเอียดการตรวจตามกฎหมาย พิมพ์ในภาคผนวก ข ท้ายเอกสารฉบับประเทศ</p>';
    }
    function panelSys() { // ทุกมาตรฐานที่ระบบใช้กับประเทศนี้ และใช้กับใบไหนบ้าง
      var c = REFS.cc && REFS.cc[S.cc], r = REC[S.cc], sh = (c && c.sheets) || {}, map = {},
        order = [];
      Object.keys(sh).sort().forEach(function (id) {
        var d = sh[id];
        d.s.forEach(function (n, i) {
          var t = d.t ? trow(d, i).code : n;
          if (!map[t]) {
            map[t] = [];
            order.push(t);
          }
          map[t].push(id);
        });
      });
      if (!order.length) return '<div class="sx-empty"><b>ยังไม่ได้ค้นรายชื่อมาตรฐานตามใบงานของประเทศนี้</b>'
        + (r && r.codeName ? "<p>" + off(r.codeName) + "</p>" : "") + "</div>";
      order.sort(function (a, b) {
        var ha = map[a].indexOf(o.sheet) >= 0 ? 0 : 1, hb = map[b].indexOf(o.sheet) >= 0 ? 0 : 1;
        return ha - hb || map[b].length - map[a].length || a.localeCompare(b);
      }); // ใบนี้ขึ้นก่อน
      var nHere = order.filter(function (t) {
        return map[t].indexOf(o.sheet) >= 0;
      }).length, show = S.sysAll ? order : order.slice(0, Math.max(6, nHere));
      return '<p class="sx-lead">มาตรฐานทั้งหมดที่ระบบใช้กับประเทศนี้ และใบตรวจงานที่ใช้</p><div class="sx-list sx-two">'
        + show.map(function (t) {
          return '<div class="sx-i' + (map[t].indexOf(o.sheet) >= 0 ? " sx-here" : "") + '"><span class="sx-t"><b data-noi18n="1">'
            + esc(t) + '</b><small data-noi18n="1">' + map[t].map(esc).join(" · ") + "</small></span></div>";
        }).join("") + "</div>" + (show.length < order.length ? '<p class="sx-tools"><button type="button" class="sx-l" data-sxmore="1">ดูทั้งหมด (<span data-noi18n="1">'
          + order.length + "</span>)</button></p>" : "");
    }
    function draw() {
      var tabs = [["std", "มาตรฐานของใบนี้"], ["law", "กฎหมาย"], ["sys", "ระบบมาตรฐาน"]];
      el.innerHTML = '<ol class="sx-steps"><li class="sx-s"><span class="sx-no">1</span><label for="sxCc">เลือกประเทศ</label><select id="sxCc">'
        + ccOptions(o.sheet, S.cc) + "</select>" + (S.cc === LANG_CC[lang] ? '<small class="note">ตั้งตามภาษาของคุณ</small>' : "")
        + '</li><li class="sx-s sx-w"><span class="sx-no">2</span><div class="sx-tabs" role="tablist">'
        + tabs.map(function (t) {
          return '<button type="button" role="tab" aria-selected="' + (S.tab === t[0]) + '" data-sxt="'
            + t[0] + '">' + t[1] + "</button>";
        }).join("") + '</div><div class="sx-p" role="tabpanel">' + (S.tab === "std" ? panelStd() : S.tab === "law"
          ? panelLaw() : panelSys()) + '</div></li><li class="sx-s"><span class="sx-no">3</span><a class="b pri" href="'
        + esc(goHref()) + '">เปิดฟอร์มตามตัวเลือกนี้</a></li></ol><p class="note sx-foot">ทีม BUILD TH รวบรวมข้อมูลนี้จากแหล่งที่ระบุ ไม่ใช่คำรับรองของผู้มีใบอนุญาต ก่อนใช้งานจริงให้ตรวจกับเอกสารทางการของประเทศนั้น</p>';
      trEn(el);
    }
    el.addEventListener("change", function (ev) {
      var t = ev.target;
      if (t.id === "sxCc") {
        S.cc = t.value;
        S.off = {};
        S.sysAll = false;
        draw();
        if (o.onCc) o.onCc(S.cc);
        return;
      }
      if (t.getAttribute && t.getAttribute("data-sx") !== null) {
        S.off[t.getAttribute("data-sx")] = !t.checked;
        if (!picked().length) {
          S.off[t.getAttribute("data-sx")] = false;
          t.checked = true;
          return;
        }
        draw();
        var f = el.querySelector('[data-sx="' + t.getAttribute("data-sx").replace(/"/g, '\\"')
          + '"]');
        if (f) f.focus();
      }
    });
    el.addEventListener("click", function (ev) {
      var b = ev.target.closest("[data-sxt]");
      if (b) {
        S.tab = b.getAttribute("data-sxt");
        draw();
        var f = el.querySelector('[data-sxt="' + S.tab + '"]');
        if (f) f.focus();
        return;
      }
      if (ev.target.closest("[data-sxall]")) {
        S.off = {};
        draw();
        return;
      }
      if (ev.target.closest("[data-sxmore]")) {
        S.sysAll = true;
        draw();
      }
    });
    el.addEventListener("keydown", function (ev) {
      var b = ev.target.closest && ev.target.closest("[data-sxt]");
      if (!b || (ev.key !== "ArrowRight" && ev.key !== "ArrowLeft")) return;
      var all = [].slice.call(el.querySelectorAll("[data-sxt]")), i = all.indexOf(b) + (ev.key === "ArrowRight"
        ? 1 : -1), n = all[(i + all.length) % all.length];
      S.tab = n.getAttribute("data-sxt");
      draw();
      var f = el.querySelector('[data-sxt="' + S.tab + '"]');
      if (f) f.focus();
      ev.preventDefault();
    });
    draw();
    return {
      setCc: function (cc) {
        if (cc && cc !== S.cc && REC[cc]) {
          S.cc = cc;
          S.off = {};
          S.sysAll = false;
          draw();
        }
      }
    };
  }

  // ---------- form page: tick boxes. Nothing is shown when the country has no names for this sheet.
  function list(el, o) {
    var d = data(o.cc, o.sheet);
    el.innerHTML = "";
    el.hidden = !d;
    if (!d) return;
    var want = o.picked && o.picked.length ? o.picked : null, many = usable(d).length > 1;
    el.innerHTML = '<fieldset class="sx-mini"><legend>' + "มาตรฐานที่ใช้ในเอกสารนี้"
      + "</legend>" + d.s.map(function (n, i) {
        var t = d.t ? trow(d, i) : null, c = countOf(d, i);
        if (many && c === 0) return ""; // 14 พ.ย. 2026 (คำสั่งเจ้าของ): ไม่มีช่องติ๊ก ระบบใช้ทุกมาตรฐานของใบ และแสดงเฉพาะตัวที่ใช้ในเอกสารที่จะออก
        return false ? '<label class="sx-i"><input type="checkbox" data-sx="' + esc(n) + '"'
          + (!want || want.indexOf(n) >= 0 ? " checked" : "") + '><span class="sx-t"><b data-noi18n="1">'
          + esc(t ? t.code : n) + "</b></span>" + (c ? "<em>" + c + " <span>ข้อ</span></em>" : "")
          + "</label>" : '<div class="sx-i"><span class="sx-t"><b data-noi18n="1">' + esc(t ? t.code : n)
          + "</b></span>" + (c ? "<em>" + c + " <span>ข้อ</span></em>" : "") + "</div>";
      }).join("") + '<p class="note" style="margin:4px 0 0">ระบบใช้มาตรฐานเหล่านี้ให้อัตโนมัติ · ข้อที่ไม่มีค่าจากมาตรฐาน เว้นช่องให้กรอกตามข้อกำหนดโครงการ</p>'
      + "</fieldset>";
  }
  // names that are on, or an empty list when all are on (the back end then uses everything)
  function selected(el) {
    var all = [].slice.call(el.querySelectorAll("[data-sx]")), on = all.filter(function (x) {
      return x.checked;
    }).map(function (x) {
      return x.getAttribute("data-sx");
    });
    return on.length === all.length ? [] : on;
  }
  window.StdPick = {
    labelIn: labelIn,
    mount: mount,
    list: list,
    selected: selected,
    label: label,
    defaultCc: defaultCc,
    data: data,
    ccOptions: ccOptions,
    trEn: trEn
  };
})();
