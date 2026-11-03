(function () {
  "use strict";
  var S = window.SITE || {};
  try {
    if (new URLSearchParams(location.search).get("preview") === "1") {
      var d = localStorage.getItem("build_site_draft");
      if (d) S = JSON.parse(d);
    }
  } catch (e) {}
    var L = S.links || {}, B = S.brand || {};
  var $ = function (id) {
    return document.getElementById(id);
  };
  var esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  var ok = function (u) {
    return /^https?:\/\//i.test(u || "");
  };
  var pv = /[?&]preview=1/.test(location.search) ? "?preview=1" : ""; /* 2 Nov 2026: defined early · the free-sheet button used it before it was set (link ended in "undefined") */
  var MON = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.",
    "พ.ย.", "ธ.ค."];
  var fmt = function (iso, short) {
    var m = /^(\d{4})-(\d\d)-(\d\d)$/.exec(iso || "");
    if (!m) return "";
    return (+m[3]) + " " + MON[+m[2] - 1] + (short ? "" : " " + m[1]);
  };
  var future = function (iso) {
    return iso && new Date(iso + "T00:00:00") > new Date();
  };
  var PLAT = [["tiktok", "TikTok", "TT"], ["youtube", "YouTube", "YT"], ["facebook", "Facebook",
    "FB"], ["instagram", "Instagram", "IG"], ["threads", "Threads", "TH"], ["x", "X", "X"]];
  var ext = ' target="_blank" rel="noopener"';

  // แบรนด์
  document.title = (B.name || "สร้าง | BUILD TH") + " — " + (B.tagline || "");
  $("about-hero").textContent = B.about || "";
  $("eyebrow").textContent = "รายการประจำ · " + (B.show || "");
  $("schedule").textContent = "รายการประจำ “" + (B.show || "") + "” " + (B.schedule || "") + " เลือกแพลตฟอร์มที่คุณใช้อยู่";
  $("ep-title").textContent = (B.show || "ตอนทั้งหมด");
  $("foot-name").textContent = B.name || "";
  $("yr").textContent = new Date().getFullYear();
  if (S.announce && S.announce.on && S.announce.text) {
    var an = $("announce");
    an.hidden = false;
    an.innerHTML = ok(S.announce.url) ? '<a href="' + esc(S.announce.url) + '"' + ext + ">" + esc(S.announce.text)
      + "</a>" : esc(S.announce.text);
  }

  // ปุ่มหลัก
  var firstCh = PLAT.filter(function (p) {
    return ok(L[p[0]]);
  })[0];
  var cta = "";
  cta += '<a class="b pri" href="sheets.html' + pv + '#compare">โหลดใบตรวจงานฟรี</a>'; /* มติสภา 30 ต.ค. 2026: ชูใบตรวจงาน เลิกแจกเช็กลิสต์จากคลิปบนหน้าเว็บ */
  if (firstCh) cta += '<a class="b sec" href="' + esc(L[firstCh[0]]) + '"' + ext + ">ดูคลิปบน " + firstCh[1]
    + "</a>";
  else cta += '<a class="b sec" href="#episodes">ดูตอนทั้งหมด</a>';
  var anySale = (S.pay || {}).on === true && (S.sheets || []).some(function (x) {
    return x.hidden !== true && x.ok === true && x.sale === true;
  });
  if (anySale) cta += '<a class="b sec" href="sheets.html' + (/[?&]preview=1/.test(location.search)
    ? "?preview=1" : "") + '">ร้านใบตรวจงาน</a>'; // เปิดขายแล้ว: ปุ่มเข้าร้านบนหน้าแรก
  $("hero-cta").innerHTML = cta;
  var eps = S.episodes || [], frees = S.freebies || [];
  // แสดงเฉพาะตอนที่ปล่อยแล้ว กับตอนของสัปดาห์ถัดไป (2 ตอนที่ใกล้ที่สุด)
  var hasLink = function (e) {
    return PLAT.some(function (p) {
      return ok((e.watch || {})[p[0]]);
    });
  };
  var outEps = eps.filter(function (e) {
    return hasLink(e) || (e.date && !future(e.date));
  });
  var nextEps = eps.filter(function (e) {
    return outEps.indexOf(e) < 0 && e.date;
  }).sort(function (a, b) {
    return a.date < b.date ? -1 : 1;
  }).slice(0, 2);
  var shown = outEps.concat(nextEps);
  $("facts").innerHTML = (outEps.length ? "<li><b>" + outEps.length + "</b>ตอนที่ปล่อยแล้ว</li>" : (nextEps.length
    ? "<li><b>" + fmt(nextEps[0].date, true) + "</b>ตอนแรก</li>" : "")) + "<li><b>อังคาร 18:00</b>ตอนใหม่ทุกสัปดาห์</li><li><b>"
    + ((S.sheets || []).filter(function (x) {
      return x.free && x.hidden !== true;
    }).length || 29) + "</b>ใบตรวจงานฟรี</li>";
  var st = shown.concat(eps).filter(function (e) {
    return e.cover;
  });
  var pick = [st[3] || st[0], st[0], st[7] || st[1]].filter(Boolean);
  $("stack").innerHTML = pick.map(function (e) {
    return '<img src="' + esc(e.cover) + '" alt="" loading="lazy">';
  }).join("");

  // ช่องทาง
  var sub = {
    tiktok: "คลิปสั้นทุกตอน",
    youtube: "Shorts และคลิปรวมตอน",
    facebook: "Reels และตอบคำถาม",
    instagram: "Reels",
    threads: "โพสต์สั้นและภาพเบื้องหลัง",
    x: "ข่าวและเกร็ดสั้น"
  };
  $("channels").innerHTML = PLAT.map(function (p, i) {
    var u = L[p[0]], on = ok(u);
    return '<a class="card ch' + (on ? "" : " off") + (on && p === firstCh ? " main" : "") + '" href="'
      + (on ? esc(u) : "#") + '"' + (on ? ext : ' tabindex="-1" aria-disabled="true"') + "><i>" + p[2]
      + "</i><span><strong>" + p[1] + "</strong><small>" + (on ? sub[p[0]] : "เร็ว ๆ นี้") + '</small></span><span class="arr">'
      + (on ? "→" : "") + "</span></a>";
  }).join("");

  // ของแจก
  var epNo = {};
  eps.forEach(function (e) {
    epNo[e.id] = e.no;
  });
  $("freebies").innerHTML = frees.map(function (f, i) {
    return '<details class="card fb"' + (i === 0 ? " open" : "") + '><summary><span class="n">' + (epNo[f.from]
      ? "#" + epNo[f.from] : "ฟรี") + "</span><strong>" + esc(f.title) + '</strong></summary><div class="in"><ol>'
      + (f.items || []).map(function (x) {
        return "<li>" + esc(x) + "</li>";
      }).join("") + "</ol>" + (f.note ? '<p class="note">' + esc(f.note) + "</p>" : "") + '<div class="row"><a class="b line sm" href="free.html?id='
      + encodeURIComponent(f.id) + '">เปิดฉบับพิมพ์</a>' + (ok(L.line) && f.keyword ? '<span class="kw">หรือพิมพ์ <b>'
        + esc(f.keyword) + "</b> ใน LINE รับไฟล์</span>" : "") + "</div></div></details>";
  }).join("");
  $("leadbox").innerHTML = ok(L.line)
    ? "<p><strong>รับไฟล์พิมพ์ครบทุกชุดทาง LINE</strong><small>เพิ่มเพื่อนแล้วระบบส่งให้ทันที มีชุดใหม่จะแจ้งก่อนใคร เลิกติดตามได้ทุกเมื่อ</small></p>"
    + '<a class="b pri" href="' + esc(L.line) + '"' + ext + ">เพิ่มเพื่อน LINE" + (L.lineId ? " " + esc(L.lineId) : "")
    + "</a>"
    : "<p><strong>ไฟล์พิมพ์ครบทุกชุด</strong><small>กด “เปิดฉบับพิมพ์” ของชุดที่ต้องการ แล้วสั่งพิมพ์หรือบันทึกเป็น PDF ได้เลย</small></p>"
    + '<a class="b pri" href="free.html">เปิดทุกชุด</a>';

  // ใบตรวจงานและสมาชิก (แสดงเมื่อมีใบตรวจงานใน data.js)
  var shs = (Array.isArray(S.sheets) ? S.sheets : []).filter(function (x) {
    return x.hidden !== true;
  });
  if (shs.length) {
    var rdy = shs.filter(function (x) {
      return x.ok === true;
    }).length, memOn = !S.member || S.member.on !== false;
    $("sheets").hidden = false;

    $("facts").innerHTML += "<li><b>" + shs.length + "</b>ใบตรวจงาน</li>";
    // เปิดขายแล้ว (24 ต.ค. 2026): บอกราคาเริ่มต้นและปุ่มเข้าร้าน
    var onSale = (S.pay || {}).on === true ? shs.filter(function (x) {
      return x.ok === true && x.sale === true && +x.price > 0;
    }) : [];
    var minP = onSale.map(function (x) {
      return +x.price;
    }).sort(function (a, b) {
      return a - b;
    })[0];
    $("sheetbox").innerHTML = "<p><strong>" + shs.length + " ใบ: " + esc(shs.slice(0, 4).map(function (x) {
      return x.title.replace(/\s*\(.*$/, "");
    }).join(" · ")) + " และอื่น ๆ</strong><small>ฉบับฟรีพิมพ์ใช้ได้ทันที (1–2 หน้า, 1 ภาษา เลือกได้ทุกภาษา) และฉบับมืออาชีพอังกฤษ-ไทยที่มีจุดหยุดรอตรวจ ตารางบันทึกค่าเฉพาะงาน และใบข้อบกพร่อง"
      + (onSale.length ? " · เปิดขายแล้ว " + onSale.length + " ใบ ราคาเริ่มต้น " + (window.BUILD && window.BUILD.baht
        ? window.BUILD.baht(minP) : "฿" + Number(minP).toLocaleString("th-TH")) + " · ชุดรวมถูกกว่าซื้อแยก · ชำระแล้วดาวน์โหลดได้ทันที" : rdy < shs.length
        ? " · กำลังทยอยเปิดให้ดาวน์โหลด" : "") + '</small></p><span class="row"><a class="b pri" href="sheets.html'
      + pv + '">' + (onSale.length ? "เลือกซื้อใบตรวจงาน" : "ดูใบตรวจงาน") + "</a>" + (memOn ? '<a class="b sec" href="member.html'
        + pv + '">' + (onSale.length ? "บัญชีสมาชิก" : "สมัครสมาชิกฟรี") + "</a>" : "") + "</span>";
  }

  // ตอน
  var topics = [];
  shown.forEach(function (e) {
    if (e.topic && topics.indexOf(e.topic) < 0) topics.push(e.topic);
  });
  var cur = "ทั้งหมด";
  function links(o, cls) {
    o = o || {};
    return PLAT.filter(function (p) {
      return ok(o[p[0]]);
    }).map(function (p, i) {
      return '<a class="' + (i === 0 && cls ? cls : "") + '" href="' + esc(o[p[0]]) + '"' + ext + ">"
        + p[1] + "</a>";
    }).join("");
  }
  function drawEps() {
    $("eps").innerHTML = shown.filter(function (e) {
      return cur === "ทั้งหมด" || e.topic === cur;
    }).map(function (e) {
      var w = links(e.watch, "p"), s = links(e.song, "");
      var badge = w ? '<span class="pill ok">ดูได้แล้ว</span>' : (future(e.date) ? '<span class="pill">ปล่อย '
        + fmt(e.date, true) + "</span>" : '<span class="pill gray">เร็ว ๆ นี้</span>');
      return '<article class="card ep"><div class="im">' + (e.cover ? '<img src="' + esc(e.cover)
        + '" alt="ปกตอน #' + esc(e.no) + '" loading="lazy" width="360" height="480">' : "") + badge
        + '</div><div class="tx"><h3>#' + esc(e.no) + " " + esc(e.title) + '</h3><div class="meta">'
        + esc(e.topic || "") + (e.date ? " · " + fmt(e.date) : "") + "</div>" + (w ? '<div class="acts">'
          + w + "</div>" : "") + (e.songTitle ? '<div class="song">เพลง “' + esc(e.songTitle) + "”"
            + (s ? ' <span class="acts" style="display:inline-flex;margin-left:4px">' + s + "</span>" : (e.songDate
              ? " · " + fmt(e.songDate, true) : "")) + "</div>" : "") + "</div></article>";
    }).join("");
  }
  $("chips").innerHTML = ["ทั้งหมด"].concat(topics).map(function (t) {
    return '<button class="chip" type="button" data-v="' + esc(t) + '" aria-pressed="' + (t === cur)
      + '">' + esc(t) + "</button>";
  }).join("");
  $("chips").addEventListener("click", function (ev) {
    var b = ev.target.closest(".chip");
    if (!b) return;
    cur = b.getAttribute("data-v") || b.textContent;
    [].forEach.call($("chips").children, function (c) {
      c.setAttribute("aria-pressed", String(c === b));
    });
    drawEps();
  });
  drawEps();

  // ของที่ใช้ในคลิป (แสดงเฉพาะรายการที่ใส่ลิงก์แล้ว)
  var pr = (S.products || []).filter(function (p) {
    return p.on !== false && ok(p.url);
  });
  if (pr.length) {
    $("gear").hidden = false;
    $("disclosure").textContent = S.disclosure || "";
    $("foot-disc").textContent = S.disclosure || "";
    $("prods").innerHTML = pr.map(function (p) {
      return '<div class="card pd"><h3>' + esc(p.name) + "</h3><p>" + esc(p.why) + '</p><div class="meta">'
        + (epNo[p.ep] ? "จากตอน #" + epNo[p.ep] + " · " : "") + esc(p.cat || "") + '</div><a class="b line sm" href="'
        + esc(p.url) + '" target="_blank" rel="sponsored nofollow noopener">ดูราคาที่ ' + esc(p.network
          || "ร้านค้า") + " →</a></div>";
    }).join("");
  }

  // บริการ ร้าน เพลง คำถาม
  // รายการที่มีหน้าในเว็บนี้เอง (ช่อง page เช่น sheets.html) ได้ปุ่มไปหน้านั้น · รายการที่ยังไม่เปิดได้ปุ่มแจ้งเตือนทาง LINE
  // บริการหรือของที่ยังไม่เปิด: ผู้ใช้เห็นชื่อ + เร็ว ๆ นี้ + ปุ่มรับแจ้งเตือน · รายละเอียดและราคาอยู่ในหลังบ้าน (คำสั่งผู้ใช้ 30 ต.ค. 2026)
  function item(x) {
    var open = ok(x.url), pg = /^[a-z0-9_-]+\.html(#[\w-]+)?$/i.test(x.page || "") ? x.page : "",
      live = open || !!pg;
    return '<div class="card it' + (live ? "" : " soon") + '"><h3>' + esc(x.title) + ' <span class="pill'
      + (live ? " ok" : "") + '">' + esc(open ? (x.price || "เปิดแล้ว") : pg ? (x.price || "เปิดขายแล้ว") : "เร็ว ๆ นี้")
      + "</span></h3>" + (live ? "<p>" + esc(x.text) + "</p>" : "") + (open ? '<a class="b line sm" href="'
        + esc(x.url) + '"' + ext + ">ดูรายละเอียด →</a>" : (pg ? '<a class="b line sm" href="' + esc(pg)
          + '">' + esc(x.cta || "ดูรายการและราคา") + " →</a>" : (ok(L.line) ? '<a class="b line sm" href="'
            + esc(L.line) + '"' + ext + ">แจ้งเตือนเมื่อเปิดทาง LINE</a>" : ""))) + "</div>";
  }
  $("services").innerHTML = (S.services || []).map(item).join("");
  $("shopitems").innerHTML = (S.shop || []).map(item).join("");
  $("musiclinks").innerHTML = (S.music || []).map(function (m) {
    var on = ok(m.url);
    return '<a class="card ch' + (on ? "" : " off") + '" href="' + (on ? esc(m.url) : "#") + '"' + (on
      ? ext : ' tabindex="-1" aria-disabled="true"') + "><i>♪</i><span><strong>" + esc(m.title) + "</strong><small>"
      + esc(m.text) + '</small></span><span class="arr">' + (on ? "→" : "") + "</span></a>";
  }).join("");
  $("faq").innerHTML = (S.faq || []).map(function (f) {
    return "<details><summary>" + esc(f.q) + "</summary><p>" + esc(f.a) + "</p></details>";
  }).join("");
  if (L.email) $("contact").innerHTML = 'ติดต่องานและสปอนเซอร์: <a href="mailto:' + esc(L.email) + '">'
    + esc(L.email) + "</a>";

  // แถบปุ่มล่างจอ (มือถือ)
  var dock = $("dock");
  dock.innerHTML = true ? '<a class="b pri" href="sheets.html' + pv + '#compare">โหลดใบตรวจงานฟรี</a>' : (firstCh
    ?'<a class="b pri" href="' + esc(L[firstCh[0]]) + '"' + ext + ">ติดตามบน " + firstCh[1] + "</a>" : "");
  if (dock.innerHTML) window.addEventListener("scroll", function () {
    dock.classList.toggle("show", window.scrollY > 520);
  }, { passive: true });

  // ข้อมูลให้เครื่องมือค้นหา + สถิติ (ทำงานเมื่อใส่รหัส GA4 ใน data.js เท่านั้น)
  var ld = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: B.name,
    description: B.about,
    sameAs: PLAT.map(function (p) {
      return L[p[0]];
    }).filter(ok)
  };
  if (S.site && ok(S.site.url)) ld.url = S.site.url;
  var sc = document.createElement("script");
  sc.type = "application/ld+json";
  sc.textContent = JSON.stringify(ld);
  document.head.appendChild(sc);
  var ga = S.site && S.site.ga4;
  window.BUILD_GA = function () {
    if (window.gtag || !/^G-[A-Z0-9]{6,}$/.test(ga || "")) return;
    var g = document.createElement("script");
    g.async = true;
    g.src = "https://www.googletagmanager.com/gtag/js?id=" + ga;
    document.head.appendChild(g);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      dataLayer.push(arguments);
    };
    gtag("js", new Date());
    gtag("config", ga);
    document.addEventListener("click", function (ev) {
      var a = ev.target.closest("a[href^='http']");
      if (a) gtag("event", "outbound_click", {
        link_url: a.href,
        link_text: (a.textContent || "").trim().slice(0, 60)
      });
    });
  }; /* สถิติเริ่มเมื่อผู้ชมกดยอมรับในแถบแจ้งเท่านั้น (extras.js) */
  try {
    if (localStorage.getItem("build_consent") === "all") window.BUILD_GA();
  } catch (e) {}
})();
