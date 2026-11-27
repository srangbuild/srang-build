/* guide.js (27 Nov 2026, owner order): which job needs which check sheet.
   One picture of a house, the steps of the work, and the packs of the shop. A visitor picks a job, and the page marks the sheets of that job.
   Sheet names, codes and prices come from data.js (BUILD). Only the order of the steps and the words of each step live here.
   The words of each step follow the summary of its sheets in data.js. A step says when to check, not how to build. */
(function () {
  "use strict";
  var B = window.BUILD, esc = B.esc, q = B.preview;
  var $ = function (id) {
    return document.getElementById(id);
  };
  $("yr").textContent = new Date().getFullYear();
  if (q) [].forEach.call(document.querySelectorAll('a[href$=".html"], a[href*=".html#"]'), function (a) {
    var h = a.getAttribute("href"), i = h.indexOf("#");
    a.href = i < 0 ? h + q : h.slice(0, i) + q + h.slice(i);
  });
  // [mark, name of the step, when to check, sheets] · marks 1-10 are on the picture of the house
  var HOUSE = [
    ["1", "เสาเข็ม", "ตรวจตั้งแต่เข็มมาถึงหน้างาน จนตัดหัวเข็ม · เลือกใบตามชนิดเข็มที่ใช้", ["F-01A",
      "F-01B"]],
    ["2", "ฐานราก ตอม่อ และคานคอดิน", "ตรวจตั้งแต่ขุดดิน วางเหล็ก เทคอนกรีต จนถึงก่อนถมดินกลับ", ["F-02"]],
    ["3", "เสา คาน และพื้น", "ตรวจเหล็กและไม้แบบก่อนเท ตรวจวันเทคอนกรีต จนบ่มครบ", ["F-03", "F-04",
      "F-05"]],
    ["4", "หลังคา", "ตรวจโครงหลังคาและการมุง จนทดสอบว่าไม่รั่ว", ["F-07"]],
    ["5", "ผนังก่ออิฐและฉาบปูน", "ตรวจแนวผนัง เสาเอ็น และทับหลัง จนผิวฉาบแห้ง", ["F-06"]],
    ["6", "ไฟฟ้าและประปา", "ตรวจท่อและสายก่อนปิดผนังหรือฝ้า และดูผลทดสอบก่อนเปิดใช้", ["F-10",
      "F-11"]],
    ["7", "กันซึมและกระเบื้อง", "ทดสอบขังน้ำก่อนปูทับ และเคาะกระเบื้องก่อนรับงาน", ["F-08", "F-09"]],
    ["8", "ฝ้า ประตูหน้าต่าง และทาสี",
      "ตรวจงานเหนือฝ้าก่อนปิดแผ่น ตรวจผิวก่อนทาสี และทดสอบน้ำรั่วที่หน้าต่าง", ["F-13", "F-15",
        "F-14"]],
    ["9", "แอร์ โซลาร์ และที่ชาร์จรถ", "ตรวจตอนติดตั้ง และดูผลทดสอบก่อนเปิดใช้", ["F-12", "F-16",
      "F-17"]],
    ["10", "รับมอบบ้าน", "เดินตรวจบ้านหรือห้องชุดทีละหมวด ก่อนเซ็นรับโอน", ["F-18"]]
  ], MORE = [
    ["A", "แบบและรายการคำนวณ", "ตรวจว่าชุดแบบและรายการคำนวณครบ ก่อนยื่นขออนุญาตหรือก่อนเริ่มสร้าง",
      ["F-23"]],
    ["B", "นั่งร้านและค้ำยัน", "ตรวจก่อนใช้งาน ระหว่างใช้งาน และก่อนรื้อ", ["F-22"]],
    ["C", "โครงสร้างเหล็ก",
      "ตรวจตั้งแต่เหล็กมาถึงหน้างาน การติดตั้ง รอยเชื่อม และสลักเกลียว ก่อนทาสี", ["F-19", "F-20"]],
    ["D", "เครื่องจักรและป้าย", "ตรวจฐานและการยึด ก่อนเดินเครื่องหรือเปิดใช้ป้าย", ["F-21", "F-24"]],
    ["E", "ใบบันทึกทดสอบวัสดุ",
      "ใช้บันทึกเมื่อรับคอนกรีต เก็บตัวอย่างคอนกรีตหรือเหล็กส่งทดสอบ และสรุปผล", ["T-01", "T-02",
        "T-03", "T-04"]]
  ];
  // the jobs = the packs of the shop that are made for one kind of buyer (data.js: aud is home, building or factory)
  var SHORT = {
    "B-HO": "รับโอนบ้าน",
    "B-HN": "สร้างบ้านใหม่",
    "B-RN": "ต่อเติม",
    "B-CD": "ตกแต่งคอนโด",
    "B-BL": "อาคาร",
    "B-FT": "โรงงาน"
  }, AUD = { home: "บ้านและคอนโด", building: "อาคาร", factory: "โรงงาน" };
  var packs = B.bundles.filter(function (x) {
    return x.aud && x.aud !== "job" && Array.isArray(x.items);
  }), cur = "";
  function pLink(id) {
    return B.itemHref(id);
  }
  function pack(id) {
    return packs.filter(function (x) {
      return x.id === id;
    })[0] || null;
  }
  function has(p, id) {
    return !!p && p.items.indexOf(id) >= 0;
  }
  function known(id) { // a sheet that the shop shows now
    var s = B.find(id);
    return s && s.ok === true ? s : null;
  }
  function saveOf(x) { // the same sum as the pack cards on the sheets page
    var sum = x.items.reduce(function (t, id) {
      var s = B.find(id);
      return t + (s ? B.memberPrice(s.price) : 0);
    }, 0);
    return Math.max(0, sum - B.memberPrice(x.price));
  }

  function stepHtml(st) {
    var p = pack(cur), sheets = st[3].map(known).filter(Boolean);
    if (!sheets.length) return "";
    var hit = sheets.some(function (s) {
      return has(p, s.id);
    });
    return '<li class="card gd-st' + (p ? (hit ? " on" : " off") : "") + '" id="st-' + st[0] + '"><span class="gd-no" aria-hidden="true">'
      + st[0] + "</span><div><h3>" + esc(st[1]) + '</h3><p class="gd-when">' + esc(st[2]) + '</p><ul class="gd-sh">'
      + sheets.map(function (s) {
        return '<li><a href="' + esc(pLink(s.id)) + '"' + (has(p, s.id) ? ' class="in"' : "") + "><b>"
          + esc(B.code(s))
          + "</b><span>" + esc(s.title) + "</span></a></li>";
      }).join("") + "</ul></div></li>";
  }
  function drawSteps() {
    $("steps").innerHTML = HOUSE.map(stepHtml).join("");
    $("steps2").innerHTML = MORE.map(stepHtml).join("");
    var p = pack(cur);
    [].forEach.call(document.querySelectorAll(".gd-mk"), function (m) {
      var st = HOUSE.filter(function (x) {
        return x[0] === m.getAttribute("data-mk");
      })[0], hit = !!st && st[3].some(function (id) {
        return has(p, id);
      });
      m.setAttribute("class", "gd-mk" + (p ? (hit ? " on" : " off") : ""));
    });
  }
  function drawWho() {
    $("who-btns").innerHTML = packs.map(function (x) {
      return '<button type="button" class="gd-wb" data-for="' + esc(x.id) + '" aria-pressed="' + (x.id === cur
        ? "true" : "false") + '"><b>' + esc(x.who || x.title) + "</b><small>" + esc(x.title) + "</small></button>";
    }).join("");
    $("who-note").hidden = !!cur;
  }
  function drawRec() {
    var x = pack(cur);
    if (!x) {
      $("rec").innerHTML = '<p>กดเลือกงานของคุณในข้อ 1 แล้วชุดที่ตรงกับงานจะแสดงที่นี่</p><p style="margin:10px 0 0"><a class="b line" href="sheets.html'
        + q + '#packs">ดูทุกชุด</a></p>';
      return;
    }
    var many = B.langsOf(x).length > 1, sv = saveOf(x);
    $("rec").innerHTML = '<span class="code"><span>' + esc(AUD[x.aud] || "") + "</span> · <span>" + x.items.length
      + "</span> <span>ใบ</span></span><h3>" + esc(x.title) + "</h3><p>" + esc(x.text || "") + "</p>"
      + (sv > 0 ? '<p class="note"><span>ถูกกว่าซื้อแยก</span> <b>' + B.baht(sv) + "</b></p>" : "")
      + '<div class="sum">' + (+x.price > 0 ? '<span class="price">' + (many ? '<small class="from">เริ่มต้น</small> ' : "")
        + B.baht(B.memberPrice(x.price)) + "</span>" : "") + (B.canSell(x) ? '<button class="b pri sm" type="button" data-add="'
          + esc(x.id) + '">ใส่ตะกร้า</button>' : "") + '<a class="b line sm" href="' + esc(pLink(x.id))
      + '">ดูว่าชุดนี้มีใบอะไรบ้าง</a></div><p class="note" style="margin:12px 0 0">ยังไม่แน่ใจ ลองฉบับฟรีของแต่ละใบก่อนได้ กดชื่อใบในแผนผังด้านบน</p>';
    try { // cart.js sets the label of each cart button again
      window.dispatchEvent(new Event("build-cart"));
    } catch (e) {}
  }
  function drawMx() {
    var all = HOUSE.concat(MORE), head = "<thead><tr><th>ขั้นงานและใบตรวจงาน</th>" + packs.map(function (x) {
      return '<th scope="col"' + (x.id === cur ? ' class="sel"' : "") + ">" + esc(SHORT[x.id] || x.title)
        + "</th>";
    }).join("") + "</tr></thead>";
    $("mx").innerHTML = head + "<tbody>" + all.map(function (st) {
      var sheets = st[3].map(known).filter(Boolean);
      if (!sheets.length) return "";
      return '<tr class="gr"><td colspan="' + (packs.length + 1) + '"><span>' + st[0] + "</span> · <span>"
        + esc(st[1])
        + "</span></td></tr>" + sheets.map(function (s) {
          return '<tr><td><a href="' + esc(pLink(s.id)) + '"><b>' + esc(B.code(s)) + "</b><span>" + esc(s.title)
            + "</span></a></td>" + packs.map(function (x) {
              var y = has(x, s.id);
              return "<td" + (x.id === cur ? ' class="sel' + (y ? " yes" : "") + '"' : (y ? ' class="yes"' : ""))
                + ">"
                + (y ? "✓" : "–") + "</td>";
            }).join("") + "</tr>";
        }).join("");
    }).join("") + "</tbody>";
  }
  function draw() {
    drawWho();
    drawSteps();
    drawRec();
    drawMx();
  }
  function pick(id, keep) {
    cur = pack(id) ? (cur === id && !keep ? "" : id) : "";
    try { // the address keeps the choice, so a link to this page can open with one job chosen
      var u = new URL(location.href);
      if (cur) u.searchParams.set("for", cur);
      else u.searchParams.delete("for");
      history.replaceState(null, "", u.pathname + u.search + u.hash);
    } catch (e) {}
      draw();
  }
  $("who-btns").addEventListener("click", function (ev) {
    var b = ev.target.closest("[data-for]");
    if (!b) return;
    var id = b.getAttribute("data-for");
    pick(id);
    var again = document.querySelector('[data-for="' + id + '"]'); // the buttons were drawn again: keep the keyboard focus
    if (again) again.focus();
  });
  var first = "";
  try {
    first = new URLSearchParams(location.search).get("for") || "";
  } catch (e) {}
    if (pack(first)) pick(first, true);
  else draw();
})();
