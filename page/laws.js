/* laws.html: the law and standards record of each country, with links to its official sources. */
(function () {
  "use strict";
  var R = window.REGION, B = window.BUILD, esc = B.esc;
  var LAW = window.LAWDB || [], CC_OF = window.CC_OF || {}, REFS = (window.DOCREFS || { cc: {} }).cc
    || {};
  var ui = "th";
  try {
    ui = localStorage.getItem("build_lang") || "th";
  } catch (e) {}
    var $ = function (id) {
      return document.getElementById(id);
    };

  /* Who publishes a link. A government page comes first, and the badge says what the reader is opening. */
  var GOV = /(^|\.)(gov|go|gob|gouv|gub|govt|gv|gc)\.[a-z]{2}$|\.gov$|\.admin\.ch$|\.europa\.eu$|\.mil$/i;
  var OFFICIAL = ["boe.es", "codigotecnico.org", "normattiva.it", "gazzettaufficiale.it",
    "riksdagen.se", "boverket.se", "retsinformation.dk", "regjeringen.no", "lovdata.no",
    "slov-lex.sk", "minv.sk", "mrrb.bg", "mi.government.bg", "overheid.nl", "legilux.public.lu",
    "legimonaco.mc", "nn.hr", "diariodarepublica.pt", "chinhphu.vn", "cdnchinhphu.vn",
    "irishstatutebook.ie",
    "saskatchewan.ca", "vlaanderen.be", "wallonie.be", "ch.ch", "gesetze.li", "llv.li", "governo.cv",
    "incv.cv", "consigliograndeegenerale.sm", "legis.md", "pravno-informacioni-sistem.rs",
    "vladars.rs", "ym.fi", "kenyalaw.org", "batowncouncil.com.fj", "gov.scot", "gov.wales", "nic.in",
    "almeezan.qa", "u.ae", "impo.com.uy", "joradp.dz", "conseildetat.dz", "idaraty.tn", "ibst.vn",
    "sbma.com", "opamss.org.sv", "bund.de", "gesetze-im-internet.de", "economie-ivoirienne.ci",
    "investindrc.cd", "sgg-mali.ml", "pravo.by", "etalonline.by", "lex.uz", "mc.uz", "egov.tj",
    "portali-huquqi.tj", "anp.ne", "hauqe.tg", "zan.kz", "bauministerkonferenz.de"];
  var BODY = ["din.de", "dibt.de", "oib.or.at", "iccsafe.org", "pec.org.pk", "psqca.com.pk",
    "sgpstandard.cz", "aipalync.org", "bsigroup.com", "iso.org", "pkn.pl", "piib.org.pl",
    "bis.org.in", "jisc.go.jp", "ansi.org", "astm.org", "nfpa.org", "aci-int.org",
    "singaporestandardseshop.sg", "standardsforhighways.co.uk", "bcsa.org.uk", "theiet.org",
    "iiee.org.ph",
    "nhbc.co.uk", "nhbc-standards.co.uk", "mcscertified.com", "wbdg.org", "circe.hn", "occ.cd",
    "anor.cm",
    "abnorm.bf", "hbrc.edu.eg"];
  var INTL = ["fao.org", "unep.org", "unhabitat.org", "un.org", "iom.int", "ilo.org", "who.int",
    "worldbank.org"];
  function hostOf(url) {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch (e) {
      return "";
    }
  }
  function inList(h, list) {
    return list.some(function (x) {
      return h === x || h.slice(-x.length - 1) === "." + x;
    });
  }
  function kindOf(url) {
    var h = hostOf(url);
    if (GOV.test(h) || inList(h, OFFICIAL)) return 0;
    if (inList(h, BODY)) return 1;
    return inList(h, INTL) ? 2 : 3;
  }
  var BADGE = [["ok", "หน่วยงานรัฐ"], ["body", "หน่วยงานมาตรฐานหรือสภาวิชาชีพ"], ["intl",
    "องค์การระหว่างประเทศ"],
    ["other", "แหล่งอื่น ควรยืนยันกับหน่วยงาน"]];

  function sourcesOf(x, cc) {
    var seen = {}, list = [x.sourceUrl, x.sourceUrl2].concat(x.more || [], (REFS[cc] && REFS[cc].src)
      || []).filter(function (u) {
        if (!/^https?:\/\//.test(u || "") || seen[u]) return false;
        seen[u] = 1;
        return true;
      });
    return list.sort(function (a, b) {
      return kindOf(a) - kindOf(b);
    });
  }
  function standardsOf(cc) {
    var r = REFS[cc], seen = {}, out = [];
    if (!r || !r.sheets) return out;
    Object.keys(r.sheets).forEach(function (id) {
      (r.sheets[id].s || []).forEach(function (n) {
        if (n && !seen[n]) {
          seen[n] = 1;
          out.push(n);
        }
      });
    });
    return out.sort(function (a, b) {
      return a.localeCompare(b);
    });
  }
  function row(label, value) {
    return value ? "<dt>" + esc(label) + '</dt><dd data-noi18n="1">' + esc(value) + "</dd>" : "";
  }
  function linkRow(u) {
    var k = BADGE[kindOf(u)], text = hostOf(u), path = "";
    try {
      path = decodeURIComponent(new URL(u).pathname).replace(/\/$/, "");
    } catch (e) {}
      if (path.length > 34) path = "/…" + path.slice(-30);
    return '<li><a href="' + esc(u) + '" target="_blank" rel="noopener nofollow" data-noi18n="1">' + esc(text
      + path)
      + '</a> <span class="lw-b ' + k[0] + '">' + esc(k[1]) + "</span></li>";
  }
  /* What the reader sees first: pages of the state and of national bodies. Other pages stay one click away. */
  function srcHtml(src) {
    if (!src.length) return '<p class="note">ยังไม่พบหน้าทางการที่ยืนยันได้</p>';
    var main = src.filter(function (u) {
      return kindOf(u) < 3;
    }), rest = src.filter(function (u) {
      return kindOf(u) === 3;
    });
    return (main.length ? '<ul class="lw-src">' + main.slice(0, 8).map(linkRow).join("") + "</ul>" : '<p class="note">ยังไม่พบหน้าทางการที่ยืนยันได้</p>')
      + (main.length > 8 ? '<details class="lw-std"><summary>หน้าทางการเพิ่มเติม <span data-noi18n="1">('
        + (main.length - 8) + ')</span></summary><ul class="lw-src">' + main.slice(8).map(linkRow).join("")
        + "</ul></details>" : "")
      + (rest.length ? '<details class="lw-std"><summary>แหล่งประกอบอื่น <span data-noi18n="1">(' + rest.length
        + ')</span></summary><ul class="lw-src">' + rest.map(linkRow).join("") + "</ul></details>" : "");
  }
  function body(x, cc) {
    var src = sourcesOf(x, cc), std = standardsOf(cc), ev = (REFS[cc] && REFS[cc].ev) || {};
    return '<dl class="lw-dl">' + row("กฎหมายหลัก", x.lawName) + row("ชื่อในภาษาของประเทศ", x.lawNameLocal)
      + row("หน่วยงานที่อนุญาตและกำกับ", x.authority) + row("ข้อบังคับและมาตรฐานก่อสร้าง", x.codeName)
      + row("หน่วยงานมาตรฐานแห่งชาติ", x.standardsBody) + row("ผู้ที่ต้องมีใบอนุญาต", x.licensed) + row("สิ่งที่ควรรู้",
        x.note)
      + "</dl>" + '<h3 class="lw-h">แหล่งอ้างอิง</h3>' + srcHtml(src) + '<p class="note lw-meta">ตรวจล่าสุด <span data-noi18n="1">'
      + esc(x.checked || "") + "</span> · " + (x.confidence === "official" ? "อ่านจากหน้าเว็บทางการ" : "ยังต้องยืนยันกับหน่วยงาน")
      + "</p>"
      + (std.length ? '<details class="lw-std"><summary>มาตรฐานที่ใบตรวจอ้างถึง <span data-noi18n="1">('
        + std.length + ")</span></summary><ul>"
        + std.map(function (n) {
          return '<li data-noi18n="1">' + (ev[n] ? '<a href="' + esc(ev[n]) + '" target="_blank" rel="noopener nofollow">'
            + esc(n) + "</a>" : esc(n)) + "</li>";
        }).join("") + "</ul></details>" : "");
  }

  var rows = LAW.map(function (x) {
    var cc = CC_OF[x.country];
    return cc ? { x: x, cc: cc, name: R.regionName(cc, ui) } : null;
  }).filter(Boolean).sort(function (a, b) {
    return a.name.localeCompare(b.name, ui);
  });
  function norm(s) {
    return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  }
  rows.forEach(function (r) {
    r.key = norm([r.cc, r.name, R.regionName(r.cc, "en"), R.regionName(r.cc, "th"), r.x.lawName, r.x.lawNameLocal,
      r.x.authority].join(" "));
  });
  var want = (location.hash || "").slice(1).toUpperCase();
  if (!want) want = ui === "th" ? "TH" : R.of(ui);
  $("lwlist").innerHTML = rows.map(function (r) {
    var open = r.cc === want;
    return '<details class="lw-c" id="' + r.cc + '" data-cc="' + r.cc + '"' + (open ? " open" : "")
      + '><summary data-noi18n="1">' + R.svg(r.cc)
      + "<b>" + esc(r.name) + "</b></summary>" + (open ? body(r.x, r.cc) : "") + "</details>";
  }).join("");
  $("lwcount").textContent = String(rows.length);
  /* A record is drawn when it opens, so the first paint stays light. */
  $("lwlist").addEventListener("toggle", function (ev) {
    var d = ev.target;
    if (!d.open || d.getAttribute("data-done") || d.querySelector(".lw-dl")) return;
    d.setAttribute("data-done", "1");
    var r = rows.filter(function (q) {
      return q.cc === d.getAttribute("data-cc");
    })[0];
    if (r) d.insertAdjacentHTML("beforeend", body(r.x, r.cc));
    try {
      history.replaceState(null, "", "#" + r.cc);
    } catch (e) {}
  }, true);
  $("lwq").addEventListener("input", function () {
    var q = norm(this.value).trim(), n = 0;
    rows.forEach(function (r) {
      var hit = !q || r.key.indexOf(q) >= 0;
      $(r.cc).hidden = !hit;
      if (hit) n++;
    });
    $("lwcount").textContent = String(n);
    $("lwnone").hidden = n > 0;
  });
  $("lwq").placeholder = R.searchWord(ui);
  var first = $(want);
  if (first) setTimeout(function () {
    if (location.hash) first.scrollIntoView({ block: "start" });
  }, 0);
})();
