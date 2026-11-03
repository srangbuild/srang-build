/* Knowledge pages: 1-minute check, larger text, print, share, and hub search. The page reads fully without this file. */
(function () {
  "use strict";
  var doc = document, root = doc.documentElement;
  (function () { /* 3 Nov 2026: find the office on Google Maps. A plain link that opens a new tab. Nothing loads until the reader presses it. */
    var MAP = {
      "k-build.html": ["กองช่าง เทศบาล สำนักงานเขต", "หาหน่วยงานที่รับคำขอใกล้คุณบน Google Maps"],
      "k-extend.html": ["กองช่าง เทศบาล สำนักงานเขต", "หาหน่วยงานที่รับคำขอใกล้คุณบน Google Maps"],
      "k-change-use.html": ["กองช่าง เทศบาล สำนักงานเขต",
        "หาหน่วยงานที่รับคำขอใกล้คุณบน Google Maps"],
      "k-highrise.html": ["กองช่าง เทศบาล สำนักงานเขต", "หาหน่วยงานที่รับคำขอใกล้คุณบน Google Maps"],
      "k-factory.html": ["สำนักงานอุตสาหกรรมจังหวัด", "หาสำนักงานอุตสาหกรรมจังหวัดบน Google Maps"],
      "k-venue.html": ["สถานีตำรวจ ที่ว่าการอำเภอ", "หาสถานีตำรวจและที่ว่าการอำเภอบน Google Maps"],
      "k-method-statement.html": ["โรงพยาบาล", "หาโรงพยาบาลใกล้หน้างานบน Google Maps"]
    };
    var here = (location.pathname.split("/").pop() || "").toLowerCase(), m = MAP[here], hook = doc.querySelector(".k-notice");
    if (!m || !hook) return;
    var p = doc.createElement("p"), a = doc.createElement("a");
    p.style.margin = "0 0 12px";
    a.textContent = m[1];
    a.rel = "noopener noreferrer";
    a.target = "_blank";
    var q = function () {
      var t = window.I18N_TR ? window.I18N_TR(m[0]) : m[0];
      return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(t);
    };
    a.href = q();
    a.addEventListener("click", function () {
      a.href = q();
    });
    p.appendChild(a);
    hook.parentNode.insertBefore(p, hook);
  })();
  function store(k, v) {
    try {
      if (v === undefined) return localStorage.getItem(k);
      localStorage.setItem(k, v);
    } catch (e) {} return null;
  }
  if (store("build_k_big") === "1") root.classList.add("k-big");

  doc.addEventListener("click", function (ev) {
    var t = ev.target.closest("[data-k]");
    if (!t) return;
    var a = t.getAttribute("data-k");
    if (a === "print") {
      window.print();
    }
    if (a === "big") {
      var on = root.classList.toggle("k-big");
      store("build_k_big", on ? "1" : "0");
    }
    if (a === "copy") {
      var ok = function () {
        var was = t.textContent;
        t.textContent = t.getAttribute("data-done");
        setTimeout(function () {
          t.textContent = was;
        }, 1500);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(location.href).then(ok,
        function () {});
      else ok();
    }
    if (a === "line") {
      window.open("https://social-plugins.line.me/lineit/share?url=" + encodeURIComponent(location.href),
        "_blank", "noopener");
    }
  });

  /* Step-by-step check. The static list stays as the fallback when scripts do not run. */
  var box = doc.querySelector("[data-check]");
  if (box) {
    var data;
    try {
      data = JSON.parse(box.getAttribute("data-check"));
    } catch (e) {
      data = null;
    }
    if (data && data.q && data.q.length) {
      var list = box.querySelector("ol"), view = doc.createElement("div"), i = 0;
      if (list) list.hidden = true;
      box.appendChild(view);
      var text = function (el, s) {
        el.textContent = s;
        return el;
      };
      var mk = function (tag, cls) {
        var e = doc.createElement(tag);
        if (cls) e.className = cls;
        return e;
      };
      var result = function (msg, go) {
        view.textContent = "";
        var r = mk("div", "k-res " + (go ? "go" : "ok"));
        text(r, msg);
        var s = mk("small");
        text(s, data.note);
        r.appendChild(s);
        view.appendChild(r);
        var w = mk("div", "k-btns");
        w.style.marginTop = "12px";
        var again = mk("button");
        again.type = "button";
        text(again, data.again);
        again.addEventListener("click", function () {
          i = 0;
          show();
        });
        w.appendChild(again);
        view.appendChild(w);
        r.setAttribute("tabindex", "-1");
        r.focus();
      };
      var show = function () {
        view.textContent = "";
        var cur = data.q[i];
        var c = mk("p", "k-count");
        text(c, (i + 1) + " / " + data.q.length);
        view.appendChild(c);
        var q = mk("p", "k-q");
        text(q, cur.q);
        view.appendChild(q);
        var w = mk("div", "k-btns");
        var add = function (label, fn) {
          var b = mk("button");
          b.type = "button";
          text(b, label);
          b.addEventListener("click", fn);
          w.appendChild(b);
        };
        var next = function () {
          i += 1;
          if (i >= data.q.length) result(data.end, false);
          else show();
        };
        add(data.yes, function () {
          if (cur.y) result(cur.y, true);
          else next();
        });
        add(data.no, function () {
          if (cur.n) result(cur.n, false);
          else next();
        });
        add(data.unsure, function () {
          result(data.unsureMsg, true);
        });
        view.appendChild(w);
      };
      show();
    }
  }

  /* Hub search: filters the tiles by the words a person types. */
  var find = doc.getElementById("k-find");
  if (find) {
    var tiles = doc.querySelectorAll("[data-tags]"), none = doc.getElementById("k-none"), secs = doc.querySelectorAll("[data-ksec]");
    find.addEventListener("input", function () {
      var w = find.value.trim().toLowerCase().split(/\s+/).filter(Boolean), seen = 0;
      tiles.forEach(function (el) {
        var hay = (el.getAttribute("data-tags") + " " + el.textContent).toLowerCase();
        var hit = w.every(function (x) {
          return hay.indexOf(x) >= 0;
        });
        el.hidden = !hit;
        if (hit) seen += 1;
      });
      secs.forEach(function (s) {
        s.hidden = !s.querySelector("[data-tags]:not([hidden])");
      });
      if (none) none.hidden = seen > 0;
    });
  }
})();
