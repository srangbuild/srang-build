// ลิงก์สั้นของช่อง: go.html?to=<ปลายทาง>&from=<ที่มา>
// ปลายทาง: line, tiktok, youtube, facebook, instagram, x, naihang · E01 (ตอน) · E01s (เวอร์ชันเพลง) · free-<id> (เช็กลิสต์) · shop-1, service-1 (ลำดับในรายการ)
// เปลี่ยนปลายทางได้ที่ data.js ที่เดียว ลิงก์ที่แปะไว้ในโปรไฟล์และคำอธิบายคลิปไม่ต้องแก้
(function () {
  "use strict";
  var S = window.SITE || {}, L = S.links || {};
  var q = new URLSearchParams(location.search), to = (q.get("to") || "").trim(), from = (q.get("from")
    || "").replace(/[^a-zA-Z0-9_\-]/g, "").slice(0, 40);
  var ok = function (u) {
    return /^https?:\/\//i.test(u || "");
  };
  var order = ["tiktok", "youtube", "facebook", "instagram", "x"];
  function first(o) {
    o = o || {};
    for (var i = 0; i < order.length; i++) if (ok(o[order[i]])) return o[order[i]];
    return "";
  }
  var url = "", m;
  if (ok(L[to])) url = L[to];
  else if ((m = /^(E\d\d)(s?)$/.exec(to))) {
    var ep = (S.episodes || []).filter(function (e) {
      return e.id === m[1];
    })[0];
    if (ep) url = (from && ok((m[2] ? ep.song : ep.watch || {})[from]) ? (m[2] ? ep.song : ep.watch)[from] : first(m[2]
      ? ep.song : ep.watch)) || "index.html#episodes";
  }
  else if ((m = /^free-([\w\-]+)$/.exec(to))) url = "free.html?id=" + encodeURIComponent(m[1]);
  else if ((m = /^(shop|service)-(\d+)$/.exec(to))) {
    var it = ((m[1] === "shop" ? S.shop : S.services) || [])[+m[2] - 1];
    url = it && ok(it.url) ? it.url : "index.html#" + m[1];
  }
  var box = document.getElementById("box");
  if (!url) {
    box.innerHTML = '<h1>ลิงก์นี้ยังไม่พร้อม</h1><p>ดูทุกช่องทางและของแจกฟรีได้ที่หน้าหลัก</p><a class="btn" href="index.html">ไปหน้าหลัก</a>';
    return;
  }
  box.insertAdjacentHTML("beforeend", '<a class="btn" id="go">ไปต่อ</a>');
  document.getElementById("go").href = url;
  var done = false, go = function () {
    if (!done) {
      done = true;
      location.replace(url);
    }
  };
  var ga = S.site && S.site.ga4;
  var gaYes = false;
  try {
    gaYes = localStorage.getItem("build_consent") === "all";
  } catch (e) {} // นับสถิติเฉพาะผู้ที่กดยอมรับแล้ว
    if (gaYes && /^G-[A-Z0-9]{6,}$/.test(ga || "")) {
      var g = document.createElement("script");
      g.async = true;
      g.src = "https://www.googletagmanager.com/gtag/js?id=" + ga;
      document.head.appendChild(g);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () {
        dataLayer.push(arguments);
      };
      gtag("js", new Date());
      gtag("config", ga, { send_page_view: false });
      gtag("event", "go_click", { go_to: to, go_from: from || "direct", event_callback: go });
      setTimeout(go, 700);
    } else go();
})();
