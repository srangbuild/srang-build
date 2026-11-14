/* pick.js (3 Nov 2026): a long drop-down list gets a search box, flags and alphabetical order.
   The original <select> stays in the page and keeps the value, so forms and other scripts work as before.
   No request goes to any other site. Loaded by nav.js. */
(function () {
  "use strict";
  if (/admin\.html/.test(location.pathname) || window.PICK) return;
  var RG = window.REGION;
  var ui = "th";
  try {
    ui = localStorage.getItem("build_lang") || "th";
  } catch (e) {}
    var loc = ui === "en" ? (RG && RG.ev() === "US" ? "en-US" : "en-GB") : ui;
  var COUNTRY_IDS = { c1: 1, c2: 1, ctry: 1, sxCc: 1, stdPick: 1, "bh-region": 1 };
  var dn = {};
  function nameIn(l, type, code) {
    var k = l + "|" + type;
    try {
      if (!dn[k]) dn[k] = new Intl.DisplayNames([l], { type: type });
      return dn[k].of(code) || "";
    } catch (e) {
      return "";
    }
  }
  function norm(s) {
    return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g,
      " ").trim();
  }
  function typeOf(sel) {
    if (COUNTRY_IDS[sel.id] || sel.hasAttribute("data-country-name")) return "country";
    if (sel.id === "lang1" || sel.id === "lang2" || sel.hasAttribute("data-lang-list")) return "lang";
    if (sel.hasAttribute("data-paycur")) return "cur";
    return "";
  }
  /* the flag of one row: the country itself, the first country of a language, or the country of a currency */
  function flagOf(type, o) {
    if (!RG || !RG.svg) return "";
    var v = String(o.getAttribute("data-lc") || o.value || "");
    if (type === "country") return /^[A-Z]{2}$/.test(v) ? RG.svg(v) : v === "INT" ? RG.svg("INT") : "";
    if (type === "lang") return /^[a-z]{2}(-[A-Z]{2})?$/.test(v) ? RG.svg(RG.ccOfLang(v)) : "";
    if (type === "cur") return /^[A-Z]{3}$/.test(v) ? RG.svg(RG.ccOfCur(v)) : "";
    return "";
  }
  /* every word that finds this row: the text on screen, the code, and the name in Thai, English and the local language */
  function keysOf(type, o) {
    var v = String(o.getAttribute("data-lc") || o.value || ""), a = [o.textContent, v, o.getAttribute("data-src")];
    if (type === "country" && /^[A-Z]{2}$/.test(v)) {
      a.push(nameIn("th", "region", v), nameIn("en", "region", v));
      if (RG && RG.regionName) a.push(RG.regionName(v, "th"), RG.regionName(v, "en")); // 7 Nov 2026: official spellings of the register
      if (RG && RG.langsOf) RG.langsOf(v).forEach(function (l) {
        a.push(nameIn(l, "region", v));
      });
    }
    if (type === "lang" && /^[a-z]{2}/.test(v)) {
      var b = v.slice(0, 2);
      a.push(nameIn("th", "language", b), nameIn("en", "language", b), nameIn(b, "language", b));
    }
    if (type === "cur" && /^[A-Z]{3}$/.test(v)) a.push(nameIn("en", "currency", v), nameIn("th",
      "currency", v), nameIn(ui, "currency", v));
    return norm(a.filter(Boolean).join(" "));
  }

  var open = null;
  function closePop(back) {
    if (!open) return;
    var o = open;
    open = null;
    o.pop.remove();
    o.btn.setAttribute("aria-expanded", "false");
    if (back) o.btn.focus();
  }
  document.addEventListener("mousedown", function (e) {
    if (open && !e.target.closest(".pk-pop") && !e.target.closest(".pk-btn")) closePop(false);
  });
  document.addEventListener("touchstart", function (e) {
    if (open && !e.target.closest(".pk-pop") && !e.target.closest(".pk-btn")) closePop(false);
  }, { passive: true });
  window.addEventListener("scroll", function (e) {
    if (open && !window.matchMedia("(max-width:640px)").matches && !(e.target.closest && e.target.closest(".pk-pop"))) closePop(false);
  }, true);
  window.addEventListener("resize", function () {
    if (open && !window.matchMedia("(max-width:640px)").matches) closePop(false);
  });
  function labelText(sel) {
    var aria = sel.getAttribute("aria-label");
    if (aria) return aria;
    var lab = sel.labels && sel.labels[0];
    if (!lab) return "";
    var t = "";
    [].forEach.call(lab.childNodes, function (n) {
      if (n === sel || (n.classList && n.classList.contains("pk"))) return;
      if (n.contains && n.contains(sel)) return;
      t += " " + (n.textContent || "");
    });
    return t.replace(/\s+/g, " ").trim();
  }
  function enhance(sel) {
    if (sel.__pk) return;
    sel.__pk = 1;
    var type = typeOf(sel), cs = window.getComputedStyle(sel), parentW = sel.parentNode.clientWidth
      || 0, selW = sel.offsetWidth, inline = selW > 0 && selW < parentW * 0.8;
    var wrap = document.createElement("span");
    wrap.className = "pk" + (inline ? " pk-in" : "");
    wrap.setAttribute("data-noi18n", "1");
    if (inline) wrap.style.minWidth = Math.max(selW, 120) + "px";
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pk-btn";
    btn.setAttribute("aria-haspopup", "listbox");
    btn.setAttribute("aria-expanded", "false");
    var fl = document.createElement("span");
    fl.style.display = "contents";
    var cap = document.createElement("span");
    cap.className = "pk-cap";
    var arr = document.createElement("span");
    arr.className = "pk-arr";
    arr.setAttribute("aria-hidden", "true");
    arr.textContent = "▾";
    btn.appendChild(fl);
    btn.appendChild(cap);
    btn.appendChild(arr);
    wrap.appendChild(btn);
    sel.parentNode.insertBefore(wrap, sel.nextSibling);
    sel.classList.add("pk-native");
    sel.setAttribute("tabindex", "-1");
    sel.setAttribute("aria-hidden", "true");
    function sync() {
      var o = sel.options[sel.selectedIndex];
      cap.textContent = o ? o.textContent.replace(/\s+/g, " ").trim() : "";
      fl.innerHTML = o ? flagOf(type, o) : "";
      btn.disabled = sel.disabled;
      var lt = labelText(sel);
      if (lt && window.I18N_TR) lt = window.I18N_TR(lt); /* 14 Nov 2026: the label is read before the page is translated, so translate it here */
      if (lt) btn.setAttribute("aria-label", lt + ": " + cap.textContent);
      else btn.removeAttribute("aria-label");
    }
    /* another script can set the value without a change event: show it on the button */
    ["value", "selectedIndex"].forEach(function (p) {
      var d = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, p);
      try {
        Object.defineProperty(sel, p, {
          configurable: true,
          get: function () {
            return d.get.call(sel);
          },
          set: function (v) {
            d.set.call(sel, v);
            sync();
          }
        });
      } catch (e) {}
    });
    sel.addEventListener("change", sync);
    new MutationObserver(sync).observe(sel, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["disabled", "selected", "aria-label"]
    });
    if (sel.form) sel.form.addEventListener("reset", function () {
      setTimeout(sync, 0);
    });
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (open && open.btn === btn) {
        closePop(true);
        return;
      }
      closePop(false);
      sync();
      showPop();
    });
    btn.addEventListener("keydown", function (e) {
      if ((e.key === "ArrowDown" || e.key === "ArrowUp") && !open) {
        e.preventDefault();
        closePop(false);
        sync();
        showPop();
      }
    });
    function showPop() {
      var pop = document.createElement("div");
      pop.className = "pk-pop";
      pop.setAttribute("data-noi18n", "1");
      var rows = [].map.call(sel.options, function (o, i) {
        return { o: o, i: i, t: o.textContent.replace(/\s+/g, " ").trim() };
      }).filter(function (r) {
        return !r.o.hidden;
      });
      var head = rows.filter(function (r) {
        var lc = r.o.getAttribute("data-lc");
        return !r.o.value || r.o.value === "INT" || lc === "INT" || r.o.getAttribute("data-pin");
      }), last = rows.filter(function (r) {
        return r.o.getAttribute("data-last");
      }), body = rows.filter(function (r) {
        return head.indexOf(r) < 0 && last.indexOf(r) < 0;
      });
      if (type) body.sort(function (a, b) {
        return a.t.localeCompare(b.t, loc);
      });
      rows = head.concat(body, last);
      var useQ = rows.length >= 8, q = null, word = window.BH_SEARCH || "Search";
      if (useQ) {
        q = document.createElement("input");
        q.type = "search";
        q.className = "pk-q";
        q.placeholder = word;
        q.setAttribute("aria-label", word);
        q.setAttribute("autocomplete", "off");
        q.setAttribute("autocapitalize", "none");
        q.setAttribute("spellcheck", "false");
        pop.appendChild(q);
      } else pop.classList.add("pk-noq");
      var ul = document.createElement("ul");
      ul.className = "pk-list";
      ul.setAttribute("role", "listbox");
      var lt = labelText(sel);
      if (lt) ul.setAttribute("aria-label", lt);
      pop.appendChild(ul);
      var uid = "pk" + Math.random().toString(36).slice(2, 8), active = -1, shown = [];
      rows.forEach(function (r, n) {
        var li = document.createElement("li");
        li.className = "pk-row";
        li.id = uid + "-" + n;
        li.setAttribute("role", "option");
        li.setAttribute("aria-selected", String(r.i === sel.selectedIndex));
        if (r.o.disabled) li.setAttribute("aria-disabled", "true");
        var f = flagOf(type, r.o);
        li.innerHTML = f;
        var sp = document.createElement("span");
        sp.textContent = r.t;
        li.appendChild(sp);
        r.li = li;
        r.k = null;
        ul.appendChild(li);
      });
      var none = document.createElement("li");
      none.className = "pk-none";
      none.textContent = word + ": 0";
      none.hidden = true;
      ul.appendChild(none);
      function setActive(n) {
        if (active >= 0 && shown[active]) shown[active].li.classList.remove("act");
        active = n;
        var r = shown[n];
        if (r) {
          r.li.classList.add("act");
          r.li.scrollIntoView({ block: "nearest" });
          if (q) q.setAttribute("aria-activedescendant", r.li.id);
        }
      }
      function filter() {
        var w = q ? norm(q.value) : "";
        shown = [];
        rows.forEach(function (r) {
          if (w && r.k === null) r.k = keysOf(type, r.o);
          var hit = !w || r.k.indexOf(w) >= 0;
          r.li.hidden = !hit;
          if (hit && !r.o.disabled) shown.push(r);
        });
        none.hidden = shown.length > 0;
        active = -1;
        if (w && shown.length) setActive(0);
      }
      function choose(r) {
        var changed = sel.selectedIndex !== r.i;
        sel.selectedIndex = r.i;
        closePop(true);
        if (changed) {
          sel.dispatchEvent(new Event("input", { bubbles: true }));
          sel.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }
      ul.addEventListener("click", function (e) {
        var li = e.target.closest(".pk-row");
        if (!li) return;
        var r = rows.filter(function (x) {
          return x.li === li;
        })[0];
        if (r && !r.o.disabled) choose(r);
      });
      pop.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          closePop(true);
          return;
        }
        if (e.key === "Tab") {
          closePop(false);
          return;
        }
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setActive(Math.min(active + 1, shown.length - 1));
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setActive(Math.max(active - 1, 0));
          return;
        }
        if (e.key === "Home" && (!q || !q.value)) {
          e.preventDefault();
          setActive(0);
          return;
        }
        if (e.key === "End" && (!q || !q.value)) {
          e.preventDefault();
          setActive(shown.length - 1);
          return;
        }
        if (e.key === "Enter") {
          e.preventDefault();
          if (shown[active]) choose(shown[active]);
        }
      });
      if (q) q.addEventListener("input", filter);
      document.body.appendChild(pop);
      filter();
      var dir = window.getComputedStyle(sel).direction;
      if (dir === "rtl") pop.setAttribute("dir", "rtl");
      if (!window.matchMedia("(max-width:640px)").matches) {
        var rc = btn.getBoundingClientRect(), vw = document.documentElement.clientWidth, vh = window.innerHeight,
          w = Math.min(Math.max(rc.width, 300), vw - 20), below = vh - rc.bottom - 12, above = rc.top - 12,
          down = below >= 280 || below >= above, h = Math.min(460, down ? below : above);
        pop.style.width = w + "px";
        pop.style.maxHeight = h + "px";
        pop.style.left = (dir === "rtl" ? Math.max(10, rc.right - w) : Math.min(rc.left, vw - w - 10))
          + "px";
        pop.style.top = (down ? rc.bottom + 4 : Math.max(10, rc.top - 4 - Math.min(h, pop.offsetHeight)))
          + "px";
      }
      btn.setAttribute("aria-expanded", "true");
      open = { pop: pop, btn: btn };
      var cur = rows.filter(function (r) {
        return r.i === sel.selectedIndex;
      })[0];
      if (cur) {
        cur.li.scrollIntoView({ block: "center" });
        var n = shown.indexOf(cur);
        if (n >= 0) {
          active = n;
          cur.li.classList.add("act");
        }
      }
      if (q && !window.matchMedia("(pointer:coarse)").matches) q.focus();
      else {
        pop.tabIndex = -1;
        pop.focus();
      }
    }
    sync();
  }
  function scan() {
    [].forEach.call(document.querySelectorAll("select"), function (sel) {
      if (sel.__pk || sel.multiple || sel.hasAttribute("data-nopick") || !sel.options.length || !sel.parentNode) return;
      if (typeOf(sel) || sel.options.length >= 10) enhance(sel);
    });
  }
  window.PICK = { scan: scan };
  var tm = 0, mo = new MutationObserver(function () {
    clearTimeout(tm);
    tm = setTimeout(scan, 80);
  });
  function start() {
    scan();
    mo.observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
