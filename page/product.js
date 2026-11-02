(function () {
  "use strict";
  var B = window.BUILD, esc = B.esc, q = B.preview, P = B.P;
  var $ = function (id) {
    return document.getElementById(id);
  };
  $("yr").textContent = new Date().getFullYear();
  if (B.demo) $("demo").hidden = false;
  if (q) [].forEach.call(document.querySelectorAll('a[href$=".html"]'), function (a) {
    a.href = a.getAttribute("href") + q;
  });
  var L = function (page, query) {
    return page + (q ? q + (query ? "&" + query : "") : (query ? "?" + query : ""));
  };
  var id = "";
  try {
    id = (new URLSearchParams(location.search).get("id") || "").trim().toUpperCase();
  } catch (e) {}
    var x = B.find(id);
  var dmy = function (iso) {
    var mt = /^(\d{4})-(\d\d)-(\d\d)/.exec(String(iso || ""));
    return mt ? mt[3] + "/" + mt[2] + "/" + mt[1] : "";
  };
  var langTx = function (s) {
    return s === "EN-TH" ? "อังกฤษ-ไทย" : "ไทย";
  };
  // ใบที่ใช้รูปและข้อมูลประกอบ: รายการทดสอบที่ซ่อนอยู่ (of = ใบต้นแบบ) ใช้ข้อมูลของใบต้นแบบ
  var src = x && x.of ? B.find(x.of) || x : x;

  if (!x) {
    $("crumbs").innerHTML = '<a href="' + L("index.html") + '">หน้าหลัก</a><span aria-hidden="true">›</span><a href="'
      + L("sheets.html") + '">ใบตรวจงาน</a>';
    $("pd").innerHTML = '<div class="card empty" style="margin-top:14px"><h1 class="kn" style="color:var(--navy);margin:0 0 8px">ไม่พบสินค้านี้</h1><p>ลิงก์อาจพิมพ์ไม่ครบ หรือสินค้านี้ไม่มีแล้ว</p><a class="b pri" href="'
      + L("sheets.html") + '">ดูใบตรวจงานทั้งหมด</a></div>';
    return;
  }
    var bundle = B.isBundle(x), mk = B.isMarket(x), sell = B.canSell(x), hasU = +x.priceU > 0 && !mk;
  var DEL = {
    file: "ดาวน์โหลดได้ทันทีหลังชำระ",
    ship: "ส่งพัสดุตามที่อยู่ในโปรไฟล์",
    manual: "ร้านส่งรายละเอียดทางอีเมลภายใน 1 วันทำการ"
  };
  var pE = B.memberPrice(x.price), pU = hasU ? B.memberPrice(x.priceU) : 0;
  var items = bundle ? x.items.map(B.find).filter(Boolean) : [];
  var sumOf = function (k) {
    return items.reduce(function (t, s) {
      return t + (+s[k] || 0);
    }, 0);
  };
  var title = bundle ? x.title : x.title, code = bundle ? x.id : (x.code || x.id);
  document.title = B.code(x) + " " + title + " — สร้าง | BUILD TH";
  var md = document.querySelector('meta[name="description"]');
  if (md) md.setAttribute("content", (bundle ? x.text : src.sum) || md.getAttribute("content"));

  $("crumbs").innerHTML = mk ? '<a href="' + L("index.html") + '">หน้าหลัก</a><span aria-hidden="true">›</span><a href="'
    + L("market.html") + '">ร้านฝากขาย</a><span aria-hidden="true">›</span><span>' + esc(x.kind || "")
    + '</span><span aria-hidden="true">›</span><span aria-current="page">' + esc(B.code(x)) + "</span>" : '<a href="'
    + L("index.html") + '">หน้าหลัก</a><span aria-hidden="true">›</span><a href="' + L("sheets.html")
    + '">ใบตรวจงาน</a><span aria-hidden="true">›</span>' + (bundle ? '<a href="' + L("sheets.html")
      + '#bundle">ชุดรวม</a>' : '<span>' + esc(src.group || "") + "</span>") + '<span aria-hidden="true">›</span><span aria-current="page">'
    + esc(B.code(x)) + "</span>";

  // ---------- ภาพ ----------
  function media() {
    if (mk) return '<figure class="pd-media">' + (x.img ? '<div class="frame"><img src="' + esc(x.img)
      + '" alt="' + esc(x.title) + '"></div>' : '<div class="frame wait" style="background:linear-gradient(160deg,#16395C,#0F2A44);color:#fff;font:700 22px/1.3 Kanit,sans-serif">'
      + esc(x.kind || "สินค้า") + "</div>") + '<figcaption>สินค้าฝากขาย' + (x.seller ? " โดย " + esc(x.seller) : "")
      + " · ร้านตรวจสินค้าและลิขสิทธิ์ก่อนวางขาย</figcaption></figure>";
    if (bundle) return '<figure class="pd-media"><div class="frame set" aria-hidden="true">' + items.slice(0,
      9).map(function (s) {
        return "<span>" + esc(s.id) + "</span>";
      }).join("") + '</div><figcaption>ชุดนี้มี ' + items.length + " ใบ · กดชื่อใบด้านล่างเพื่อดูรายละเอียดแต่ละใบ</figcaption></figure>";
    var img = src.ok === true && src.img ? src.img : "";
    if (!img) return '<figure class="pd-media"><div class="frame wait"><span>ภาพตัวอย่างหน้าแรกจะแสดง<br>เมื่อร้านตรวจรายการของใบนี้เสร็จ</span></div></figure>';
    return '<figure class="pd-media"><div class="frame"><img src="' + esc(img) + '" alt="ตัวอย่างหน้าแรกของ '
      + esc(src.id) + " " + esc(src.title) + ' ฉบับมืออาชีพ" width="794" height="1123"><button class="b line sm zoom" type="button" data-zoom="'
      + esc(img) + '">ขยายภาพ</button></div><figcaption>ตัวอย่างหน้าแรกของฉบับมืออาชีพ (มีคำว่า SAMPLE และตัดท้ายหน้า) · ไฟล์ที่ได้ไม่มีคำว่า SAMPLE</figcaption></figure>';
  }
    // ---------- ข้อมูลหลัก ----------
    function facts() {
      if (mk) {
        var g = [[x.kind || "–", "ประเภท"], [x.format || "–", "รูปแบบ"], [x.seller || "–", "ผู้ขาย"]];
        return '<dl class="facts">' + g.map(function (a) {
          return "<div><dt>" + esc(a[1]) + "</dt><dd style=\"font-size:16px\">" + esc(a[0]) + "</dd></div>";
        }).join("") + '</dl><p class="note" style="margin:-6px 0 14px">การส่งมอบ: ' + esc(DEL[x.delivery]
          || DEL.manual) + "</p>";
      }
        var f = bundle ? [[items.length, "ใบในชุด"], [sumOf("nPro"), "รายการตรวจรวม"], [sumOf("nHold"),
          "จุดหยุดรอตรวจ (H)"], [sumOf("pages"), "หน้า A4 รวม"], ["2", "ภาษา อังกฤษ-ไทย"], ["PDF",
            "ไฟล์พิมพ์ได้"]]
        : [[src.nPro, "รายการตรวจ"], [src.nHold, "จุดหยุดรอตรวจ (H)"], [(src.recs || []).length || "–",
          "ตารางบันทึก"], [src.pages || "–", "หน้า A4"], [langTx(src.langs), "ภาษา"], [dmy(src.revDate)
            || "–", "ฉบับวันที่"]];
      return '<dl class="facts">' + f.map(function (a) {
        return "<div><dt>" + esc(a[1]) + "</dt><dd>" + esc(a[0]) + "</dd></div>";
      }).join("") + "</dl>";
    }
    function cur() {
      var l = B.cart.line(x.id);
      return l ? (B.isUpd(l) ? "up" : "ed") : "";
    }
    function plan() {
      var r = document.querySelector("input[name=plan]:checked");
      return r ? r.value : "ed";
    }
    // ภาษาบนใบ (โปรเจกต์กำแพง 24 ต.ค. 2026): 2 ภาษา อังกฤษ + ไทย หรือ 1 ภาษา · ราคาเท่ากัน · ภาษาอื่นและมาตรฐานประเทศอื่น = สั่งทำ
    function lang() {
      var r = document.querySelector("input[name=lang]:checked");
      if (r) return r.value;
      var l = B.cart.line(x.id);
      return l ? B.varOf(l) : "";
    }
    function langSel(dis) {
      if (mk) return "";
      var lv = B.langsOf(x), c = lang();
      var tx = {
        "": ["2 ภาษา: อังกฤษ + ไทย",
          "บรรทัดบนอังกฤษมีช่องกรอก บรรทัดล่างไทย · ใช้ได้ทั้งทีมไทยและทีมต่างชาติ"],
        EN: ["1 ภาษา: อังกฤษ", "ทั้งใบเป็นภาษาอังกฤษ · สำหรับโครงการและผู้ตรวจต่างประเทศ"],
        TH: ["1 ภาษา: ไทย", "ทั้งใบเป็นภาษาไทย ตัวอักษรใหญ่ขึ้น อ่านง่าย"]
      };
      return '<fieldset class="opts"' + (dis ? " disabled" : "") + '><legend>ภาษาบนใบ</legend>' + lv.map(function (v) {
        return '<label class="opt"><input type="radio" name="lang" value="' + v + '"' + (v === c ? " checked" : "")
          + "><span><b>" + tx[v][0] + "</b><small>" + tx[v][1] + "</small></span><em>ราคาเท่ากัน</em></label>";
      }).join("") +
        '<p class="note" style="margin:8px 2px 0">ต้องการภาษาหรือมาตรฐานของประเทศอื่น: เลือก <a href="#editions">ฉบับประเทศ</a> ด้านล่าง</p></fieldset>';
    }
    // ฉบับประเทศ (2 พ.ย. 2026): ภาษาของประเทศนั้น ไทย อังกฤษ + ค่ามาตรฐานและกฎหมายของประเทศนั้นเทียบกับค่าไทย · แจ้งจำนวนข้อที่มีค่าตรวจแหล่งแล้วก่อนซื้อ
    function ccLabel(k) {
      var ui = uiLang(), c = B.CTRY[k] || ["", k, ""];
      if (ui === "th") return c[0];
      return window.StdPick ? window.StdPick.labelIn(k, ui) : c[1];
    } /* 3 Nov 2026: a country name in the language of the page */
    function ctryInfo(cc) {
      var D = window.DOCCOV || {}, ids = bundle ? x.items : [x.id], t = 0, n = 0, c = B.CTRY[cc] || ["",
        "", ""];
      ids.forEach(function (k) {
        t += (D.numeric || {})[k] || 0;
        n += ((D.cc || {})[cc] || {})[k] || 0;
      });
      return {
        price: B.memberPrice ? B.memberPrice(B.docPrice(x.price)) : B.docPrice(x.price),
        note: "ภาษาบนเอกสาร: " + c[2] + " คู่กับไทยหรืออังกฤษ" + (/English/.test(c[2]) ? "" : " แปลด้วยเครื่อง มีคำเตือนบนเอกสาร")
          + " · ใช้ค่าไทย หรือเทียบกับมาตรฐาน" + ccLabel(cc) + " ค่าตรงกันอ้างอิงร่วม ค่าต่างกันเลือกได้ในเอกสาร · มีค่าของ"
          + ccLabel(cc) + "ที่ตรวจแหล่งแล้ว " + n + " จาก " + t + " ข้อ ข้อที่เหลือใช้ค่าไทยเป็นข้อมูล หรือกรอกตามข้อกำหนดโครงการ · กรอบกฎหมายอยู่ท้ายเอกสาร · สร้างจากหน้าเอกสารอัจฉริยะ ไม่มีไฟล์ PDF สำเร็จรูป · ยังไม่ผ่านการตรวจโดยผู้แปลหรือผู้มีใบอนุญาตของประเทศนั้น"
      };
    }
    function ctryBox() {
      if (mk || !B.docOn() || !sell) return "";
      var ks = Object.keys(B.CTRY).sort(function (a, b) {
        return ccLabel(a).localeCompare(ccLabel(b), uiLang());
      }), want = String(new URLSearchParams(location.search).get("cc") || "").toUpperCase(), cov = function (k) {
        var D = window.DOCCOV || {}, s = 0;
        (bundle ? x.items : [x.id]).forEach(function (i) {
          s += ((D.cc || {})[k] || {})[i] || 0;
        });
        return s;
      }, lc = window.StdPick ? window.StdPick.defaultCc() : "", c0 = B.CTRY[want] ? want : B.CTRY[lc]
        ? lc : ks.slice().sort(function (a, b) {
          return cov(b) - cov(a);
        })[0], f = ctryInfo(c0);
      return '<fieldset class="opts" id="editions"><legend>ฉบับประเทศ: ภาษาและมาตรฐานของประเทศอื่น</legend><label class="ctl" style="display:block;margin:0 2px"><span class="note" style="margin:0">เลือกประเทศ</span><select id="ctry" style="width:100%;min-height:44px">'
        + ks.map(function (k) {
          return '<option value="' + k + '"' + (k === c0 ? " selected" : "") + (uiLang() === "th" ? ">"
            + esc(B.CTRY[k][0] + " · " + B.CTRY[k][1]) : ' data-noi18n="1">' + esc(ccLabel(k))) + "</option>";
        }).join("") + '</select></label><p class="note" id="ctryNote" style="margin:8px 2px">' + esc(f.note)
        + '</p><button class="b line sm" type="button" data-act="addc">ใส่ฉบับประเทศนี้ลงตะกร้า <span id="ctryPrice">'
        + B.baht(f.price) + "</span></button></fieldset>";
    }
    function opts() {
      if (mk) return '<p style="margin:0 0 14px"><span class="price" style="font-size:30px">' + B.baht(pE)
        + "</span></p>";
      var c = cur() || "ed";
      var rows = [["ed", "ซื้อฉบับนี้ เก็บได้ตลอด",
        "ได้ไฟล์ฉบับวันที่ซื้อ ดาวน์โหลดและพิมพ์ได้ตลอด · ภายหลังอัปเกรดเป็นรับฉบับใหม่ได้ จ่ายเฉพาะส่วนต่าง",
        pE]];
      if (hasU) rows.push(["up", "รับฉบับใหม่ตลอด",
        "เมื่อกฎหมาย มาตรฐาน หรือข้อกำหนดเปลี่ยน ร้านออกฉบับใหม่ คุณดาวน์โหลดฉบับล่าสุดได้ทุกครั้งโดยไม่จ่ายเพิ่ม และได้อีเมลแจ้ง",
        pU]);
      return langSel(false) + '<fieldset class="opts"><legend>เลือกแบบสิทธิ์</legend>' + rows.map(function (r) {
        return '<label class="opt"><input type="radio" name="plan" value="' + r[0] + '"' + (r[0] === c
          ? " checked" : "") + "><span><b>" + r[1] + "</b><small>" + r[2] + "</small></span><em>" + B.baht(r[3])
          + "</em></label>";
      }).join("") + "</fieldset>" + ctryBox();
    }
    var own = ""; // สิทธิ์ที่บัญชีนี้มีอยู่แล้ว: "edition" | "updates" (โหลดหลังหน้าเปิด ถ้าเข้าระบบอยู่)
  function ownBox() {
    var diff = hasU ? Math.max(1, pU - pE) : 0, inC = B.cart.line(x.id);
    var lib = '<a class="b line sm" href="' + L("member.html") + '#docs">เปิดเอกสารของฉัน</a>';
    if (mk) return '<div class="own"><span><b>คุณซื้อสินค้านี้แล้ว</b> · ' + esc(DEL[x.delivery] || DEL.manual)
      + '</span><div class="buy">' + (x.delivery === "file" ? lib : '<a class="b line sm" href="' + L("member.html")
        + '#orders">ดูคำสั่งซื้อของฉัน</a>') + "</div></div>";
    var lvx = B.langsOf(x).filter(String), more = ctryBox() + (lvx.length && sell ? '<p class="note" style="margin:8px 0 0">ต้องการฉบับภาษาเดียวด้วย: '
      + lvx.map(function (v) {
        return '<button class="b line sm" type="button" data-act="addv" data-v="' + v + '">' + esc(B.LANGS[v])
          + " " + B.baht(pE) + "</button>";
      }).join(" ") + "</p>" : "");
    if (own === "updates") return '<div class="own"><span><b>คุณมีใบนี้แล้ว</b> (อังกฤษ + ไทย) แบบรับฉบับใหม่ตลอด · ดาวน์โหลดฉบับล่าสุดได้ทุกเมื่อ</span><div class="buy">'
      + lib + "</div>" + more + "</div>";
    return '<div class="own"><span><b>คุณมีใบนี้แล้ว</b> (อังกฤษ + ไทย) แบบซื้อฉบับนี้ เก็บได้ตลอด'
      + (diff ? " · อัปเกรดเป็นรับฉบับใหม่ตลอด จ่ายเฉพาะส่วนต่าง " + B.baht(diff) : "") + '</span><div class="buy">'
      + lib + (diff && sell ? (inC === x.id + "+U" ? '<a class="b pri sm" href="' + L("checkout.html")
        + '">อัปเกรดอยู่ในตะกร้า · ชำระเงิน</a>' : '<button class="b pri sm" type="button" data-act="upg">อัปเกรด '
        + B.baht(diff) + "</button>") : "") + "</div>" + more + "</div>";
  }
    function buyBox() {
      if (own && !bundle) return ownBox();
      if (!sell) {
        var why = B.P.on !== true ? "ร้านยังไม่เปิดรับชำระเงิน" : B.reviewed(x) ? "เปิดขายเร็ว ๆ นี้" : "ร้านกำลังตรวจรายการของ"
          + (bundle ? "ใบในชุดนี้" : "ใบนี้") + " เปิดขายเมื่อตรวจครบ";
        var inAcc = !!B.token.get();
        return opts().replace(/<fieldset class="opts">/g, '<fieldset class="opts" disabled>') + '<div class="soon"><b>'
          + esc(why) + "</b><br>" + (inAcc ? "ร้านส่งอีเมลแจ้งสมาชิกเมื่อเปิดขาย (ตั้งค่าได้ที่หน้าสมาชิก เมนู โปรไฟล์)" : "สมัครสมาชิกฟรี แล้วระบบส่งอีเมลแจ้งเมื่อเปิดขาย")
          + '</div><div class="buy"><a class="b pri" href="' + L("member.html") + (inAcc ? "#profile" : "")
          + '">' + (inAcc ? "ไปหน้าสมาชิก" : "สมัครสมาชิกฟรี") + "</a>" + (!bundle && src.ok === true
            && src.free ? '<a class="b line" data-noi18n="1" lang="th" href="' + esc(src.free) + '" download>ฉบับฟรี ไทย</a><a class="b line" data-noi18n="1" lang="en" href="'
            + esc(B.freeEN(src)) + '" download>Free: English</a><a class="b line" href="' + L("doc.html")
            + (L("doc.html").indexOf("?") < 0 ? "?" : "&") + "item=" + encodeURIComponent(src.id) + '">ฉบับฟรี ภาษาอื่น</a>' : "")
          + "</div>";
      }
        var inC = B.cart.has(x.id), cov = !inC && B.cart.covered(x.id);
      var btns = cov ? '<p class="soon" style="margin:0 0 12px">ใบนี้อยู่ในชุดรวมที่อยู่ในตะกร้าแล้ว ไม่ต้องซื้อแยก · <a href="'
        + L("cart.html") + '">ดูตะกร้า</a></p>'
        : '<div class="buy"><button class="b pri" type="button" data-act="add">' + (inC ? "อยู่ในตะกร้าแล้ว ✓" : "ใส่ตะกร้า")
        + '</button><button class="b dark" type="button" data-act="now">' + (inC ? "ไปชำระเงิน" : "ซื้อเลย")
        + "</button></div>" + (inC ? '<p class="note" style="margin:-4px 0 12px">เปลี่ยนแบบสิทธิ์ด้านบนได้ ตะกร้าเปลี่ยนตาม · <a href="'
          + L("cart.html") + '">ดูตะกร้า</a></p>' : "");
      return (x.hidden ? '<p class="soon"><b>รายการทดสอบระบบของร้าน</b> · ไม่แสดงในหน้าร้าน · เฉพาะบัญชีทดสอบที่ร้านตั้งไว้ซื้อได้</p>' : "")
        + opts() + btns + (!bundle && src.ok === true && src.free ? '<p class="note" style="margin:0 0 12px">อยากลองก่อน: ฉบับฟรี ('
          + esc(src.nFree) + " จุดสำคัญ · " + esc(+src.freePages || 1) + " หน้า · 1 ภาษา): " + '<a data-noi18n="1" lang="th" href="'
          + esc(src.free) + '" download>ไทย</a> · <a data-noi18n="1" lang="en" href="' + esc(B.freeEN(src))
          + '" download>English</a> · <a href="' + L("doc.html") + (L("doc.html").indexOf("?") < 0 ? "?" : "&")
          + "item=" + encodeURIComponent(src.id) + '">ภาษาอื่น</a></p>' : "");
    }
    function trust() {
      var h = +P.hours || 24;
      if (mk) return '<ul class="trust"><li><i>✓</i><span>ร้านตรวจสินค้าและลิขสิทธิ์ก่อนวางขาย · ร้านรับชำระและดูแลการส่งมอบ</span></li><li><i>✓</i><span>ชำระด้วยบัตร พร้อมเพย์ แอปธนาคาร กระเป๋าเงินออนไลน์ หรือโอนเงิน</span></li><li><i>✓</i><span>'
        + esc(DEL[x.delivery] || DEL.manual) + "</span></li>" + (x.delivery === "file" ? "<li><i>✓</i><span>ดาวน์โหลดซ้ำได้ทุกเมื่อจากหน้าสมาชิก</span></li>" : "")
        + "</ul>";
      return '<ul class="trust"><li><i>✓</i><span>ชำระด้วยพร้อมเพย์ บัตรไทยและต่างประเทศ แอปธนาคาร หรือกระเป๋าเงินออนไลน์ ผ่าน Opn Payments หรือโอนเงินแล้วแนบสลิป · เลขบัตรไม่ผ่านเว็บร้าน</span></li><li><i>✓</i><span>ชำระออนไลน์ ดาวน์โหลดได้ทันที · โอนเงิน ร้านตรวจยอดภายใน '
        + h + ' ชั่วโมง</span></li><li><i>✓</i><span>ทุกหน้ามีชื่อผู้ซื้อและเลขสิทธิ์พิมพ์ท้ายกระดาษ · ดาวน์โหลดซ้ำได้ทุกเมื่อจากหน้าสมาชิก</span></li><li><i>✓</i><span>ไฟล์ PDF ขนาด A4 พิมพ์ใช้หน้างานได้ทันที · ไม่มีค่าส่ง</span></li></ul>';
    }
    // 2 พ.ย. 2026: บรรทัดอังกฤษที่สองมีเฉพาะหน้าภาษาไทย · หน้าอังกฤษใช้ข้อความอังกฤษที่เขียนไว้ · ภาษาอื่นแปลจากข้อความหลัก
    function uiLang() {
      try {
        return localStorage.getItem("build_lang") || "th";
      } catch (e) {
        return "th";
      }
    }
    function mainTx(th, en) {
      if (uiLang() !== "en" || !en) return th;
      if (/[a-z]/.test(en.replace(/\([^)]*\)/g, ""))) return en;
      var s = en.replace(/\b[A-Z]{2,}(?:-[A-Z]{2,})*\b/g, function (w) {
        return w.toLowerCase();
      });
      return s.charAt(0).toUpperCase() + s.slice(1); // หัวตารางตัวพิมพ์ใหญ่ทั้งบรรทัด
    }
    function subTx(en) {
      return uiLang() === "th" && en ? en : "";
    }
    // ---------- ส่วนรายละเอียด ----------
    function secOutline() {
      var o = src.outline || [];
      if (!o.length) return "";
      return '<section class="pd-sec" id="inside"><h2>ในใบนี้มีอะไร</h2><ol class="outl">' + o.map(function (s,
        i) {
          return "<li><b>" + (i + 1) + "</b><span>" + esc(mainTx(s.th, s.en)) + (subTx(s.en) ? "<small>"
            + esc(s.en) + "</small>" : "") + "</span><em>" + esc(s.n) + " ข้อ" + (s.h ? " · H " + esc(s.h)
              + " จุด" : "") + "</em></li>";
        }).join("") +
        '</ol><p class="note">ทุกข้อมีเกณฑ์ยอมรับ วิธีตรวจ (ตา วัด ทดสอบ เอกสาร) ช่อง C / NC / N/A และช่องหมายเหตุ · ช่องค่าตัวเลขเว้นให้เติมจากแบบและข้อกำหนดของงานคุณ · H = จุดหยุดรอตรวจ ห้ามทำงานขั้นต่อไปจนกว่าจะผ่าน</p>'
        + guide() + "</section>";
    }
    // คู่มือวิธีกรอก 8 ขั้น + ตัวอย่างที่กรอกแล้ว (ขึ้นเว็บเมื่อใบ F-02 ที่ใช้ในตัวอย่างผ่านการตรวจ)
    function guide() {
      var f2 = B.find("F-02");
      if (!f2 || f2.ok !== true) return "";
      return '<div class="card pad" style="margin-top:12px;display:flex;gap:14px;align-items:center;flex-wrap:wrap"><span style="flex:1;min-width:220px"><b style="color:var(--navy)">วิธีกรอกใบตรวจงาน</b><br><span class="note" style="margin:0">8 ขั้น 2 ภาษา สัญลักษณ์ H W R S และตัวอย่างหน้าที่กรอกแล้ว · ใช้ได้กับทุกใบ</span></span><a class="b line sm" href="sheets/guide/BUILD_how-to-fill_p1.pdf" target="_blank" rel="noopener">วิธีกรอก (PDF)</a><a class="b line sm" href="sheets/guide/BUILD_how-to-fill_p2_example.pdf" target="_blank" rel="noopener">ตัวอย่างที่กรอกแล้ว (PDF)</a></div>';
    }
    function secRecords() {
      var r = src.recs || [], refs = src.refs || [];
      var a = '<div class="card pad"><h3 class="kn" style="margin:0 0 8px;color:var(--navy)">ตารางบันทึกและหน้าท้าย</h3><ul class="reclist">'
        + r.map(function (t) {
          return "<li>" + esc(mainTx(t.th, t.en)) + (t.en ? "<small>" + (subTx(t.en) ? esc(t.en) + " · " : "")
            + esc(t.cols) + " คอลัมน์</small>" : "") + "</li>";
        }).join("") + "<li>ใบรายการข้อบกพร่องและการตรวจซ้ำ" + (subTx("Defect list and re-inspection")
          ? "<small>Defect list and re-inspection</small>" : "") + "</li><li>บันทึกรูปถ่ายอ้างอิงรายข้อ"
        + (subTx("Photo log") ? "<small>Photo log</small>" : "") + "</li><li>ช่องลงชื่อ 3 ฝ่าย<small>Contractor · Supervisor · Owner</small></li></ul></div>";
      var b = refs.length ? '<div class="card pad"><h3 class="kn" style="margin:0 0 8px;color:var(--navy)">มาตรฐานและกฎหมายที่อ้างอิง</h3><ul class="reflist">'
        + refs.map(function (t) {
          return "<li><b>" + esc(t.code) + "</b> " + esc(mainTx(t.th, t.en)) + "<small>" + [subTx(t.en),
            t.by].filter(Boolean).map(esc).join(" · ") + "</small></li>";
        }).join("") + '</ul><p class="note">ใบตรวจงานอ้างอิงเฉพาะเอกสารที่ร้านค้นพบว่ามีอยู่จริง และไม่แทนเอกสารฉบับเต็ม</p></div>' : "";
      return '<section class="pd-sec" id="records"><h2>บันทึกค่าและเอกสารท้ายใบ</h2>' + (window.StdPick
        ? a : '<div class="twocol">' + a + b + "</div>") + "</section>";
    }
    // 2 พ.ย. 2026 (คำสั่งผู้ใช้): มาตรฐานและกฎหมายตามประเทศของภาษา เลือกประเทศได้ และเลือกมาตรฐานได้ถ้าเรื่องนั้นมีหลายตัว
    function secStandards() {
      return window.StdPick ? '<section class="pd-sec" id="standards"><h2>มาตรฐานและกฎหมายที่อ้างอิง</h2><p class="note" style="margin:-4px 0 10px">ฟอร์มนี้ปรับตามประเทศได้ เลือกประเทศ เลือกมาตรฐาน แล้วเปิดฟอร์มตามตัวเลือกนั้น</p><div class="card pad sx" id="stdPick"></div></section>' : "";
    }
    var picker = null;
  function mountPicker() {
    var box = $("stdPick");
    if (!box || !window.StdPick) return;
    var cq = String(new URLSearchParams(location.search).get("cc") || "").toUpperCase();
    picker = window.StdPick.mount(box, {
      sheet: src.id || x.id,
      cc: cq,
      stages: (src.outline || []).map(function (s) {
        return mainTx(s.th, s.en);
      }),
      onCc: function (cc) {
        var se = $("ctry");
        if (se && B.CTRY[cc]) {
          se.value = cc;
          var fi = ctryInfo(cc);
          document.getElementById("ctryNote").textContent = fi.note;
          document.getElementById("ctryPrice").textContent = B.baht(fi.price);
        }
      }
    });
  }
    function secIncluded() {
      var sv = B.cart.saving(x.id) || 0, sum = items.reduce(function (t, s) {
        return t + B.memberPrice(s.price);
      }, 0);
      return '<section class="pd-sec" id="inside"><h2>ใบในชุดนี้</h2><ul class="inc">' + items.map(function (s) {
        return '<li><a href="' + L("product.html", "id=" + encodeURIComponent(s.id)) + '"><span>' + esc(B.code(s)
          + " " + s.title) + "</span><em>" + esc(s.nPro) + " ข้อ · " + B.baht(B.memberPrice(s.price))
          + "</em></a></li>";
      }).join("") + "</ul>" +
        '<p class="note">ซื้อแยกทุกใบ (แบบซื้อฉบับนี้) รวม ' + B.baht(sum) + " · ซื้อเป็นชุด " + B.baht(pE)
        + (sum > pE ? ' · <b style="color:var(--ok)">ถูกกว่า ' + B.baht(sum - pE) + "</b>" : "") + (x.id === "B-ALL"
          ? " · ชุดรวมฉบับปีให้สิทธิ์ทุกใบของฉบับปีนั้น รวมใบที่ออกเพิ่มและรุ่นปรับปรุงภายในปีของฉบับ" : "")
        + "</p></section>";
    }
    function secBundles() {
      if (bundle) return "";
      var bs = B.bundlesOf(x.id);
      if (!bs.length) return "";
      return '<section class="pd-sec" id="sets"><h2>ซื้อเป็นชุดถูกกว่า</h2><div class="bcards">' + bs.map(function (b) {
        var s = b.items.reduce(function (t, k) {
          var y = B.find(k);
          return t + (y ? B.memberPrice(y.price) : 0);
        }, 0), p = B.memberPrice(b.price);
        return '<a class="bcard" href="' + L("product.html", "id=" + encodeURIComponent(b.id)) + '"><b>'
          + esc(B.code(b) + " " + b.title) + "</b><small>" + b.items.length + " ใบ: " + esc(b.items.map(function (i) {
            var y = B.find(i);
            return y ? B.code(y) : i;
          }).join(" · ")) + "</small><span><span class=\"price\">" + B.baht(p) + "</span>" + (s > p
            ? ' <span class="sv">ถูกกว่าซื้อแยก ' + B.baht(s - p) + "</span>" : "") + "</span></a>";
      }).join("") + "</div></section>";
    }
    // สินค้าฝากขาย: รายละเอียดจากผู้ขาย + ข้อมูลผู้ขาย
    function secMarket() {
      var paras = String(x.desc || "").split(/\n+/).map(function (p) {
        return p.trim();
      }).filter(Boolean);
      return '<section class="pd-sec" id="detail"><h2>รายละเอียดสินค้า</h2><div class="card pad">' + (paras.length
        ? paras.map(function (p) {
          return '<p style="margin:0 0 10px">' + esc(p) + "</p>";
        }).join("") : '<p class="note" style="margin:0">ผู้ขายยังไม่ได้ใส่รายละเอียดเพิ่ม</p>') + "</div>"
        +
        (x.seller ? '<div class="card pad" style="margin-top:12px"><h3 class="kn" style="margin:0 0 6px;color:var(--navy)">ผู้ขาย: '
          + esc(x.seller) + '</h3><p class="note" style="margin:0">สินค้าฝากขายเป็นผลงานของผู้ขาย · ร้านตรวจสินค้าและลิขสิทธิ์ก่อนวางขาย · คำถามเรื่องการสั่งซื้อและส่งมอบ ถามร้านได้ที่หน้าสมาชิก เมนู ถามร้าน</p></div>' : "")
        +
        '<p class="note"><a href="' + L("market.html") + '">← ดูสินค้าฝากขายทั้งหมด</a> · <a href="'
        + L("market.html") + '#sell">สนใจฝากขาย</a></p></section>';
    }
    function secFaq() {
      var h = +P.hours || 24;
      if (mk) {
        var qm = [["ได้รับสินค้าอย่างไร", DEL[x.delivery] || DEL.manual], ["ขอคืนเงินได้ไหม",
          "เป็นไปตามข้อตกลงการใช้งานของร้าน ข้อ การคืนเงิน · สินค้าดิจิทัลที่ดาวน์โหลดหรือส่งให้แล้ว ไม่คืนเงิน เว้นแต่ไฟล์เสียหาย เปิดไม่ได้ หรือไม่ตรงกับรายการที่สั่ง"],
          ["ใครดูแลการใช้งานสินค้า",
            "ผู้ขายดูแลการใช้งานโปรแกรมหรือเนื้อหาของตนเอง · ร้านดูแลเรื่องการชำระเงินและการส่งมอบ"]];
        return '<section class="pd-sec faq" id="faq"><h2>คำถามที่พบบ่อย</h2>' + qm.map(function (a) {
          return "<details><summary>" + esc(a[0]) + "</summary><p>" + esc(a[1]) + "</p></details>";
        }).join("") + '<p class="note">อ่านข้อตกลงเต็มที่ <a href="' + L("terms.html") + '">ข้อตกลงการใช้งาน</a></p></section>';
      }
        var qa = [
          ["แบบ ซื้อฉบับนี้ กับ รับฉบับใหม่ตลอด ต่างกันอย่างไร",
            "ซื้อฉบับนี้: ได้ไฟล์ฉบับวันที่ซื้อ เก็บและดาวน์โหลดซ้ำได้ตลอด · รับฉบับใหม่ตลอด: เมื่อร้านปรับใบตามกฎหมาย มาตรฐาน หรือข้อกำหนดที่เปลี่ยน คุณดาวน์โหลดฉบับล่าสุดได้ทุกครั้งโดยไม่จ่ายเพิ่ม และได้อีเมลแจ้ง · ซื้อฉบับนี้ไปแล้ว อัปเกรดภายหลังได้โดยจ่ายเฉพาะส่วนต่าง"],
          ["ได้ไฟล์อย่างไร",
            "ชำระออนไลน์ ระบบเปิดสิทธิ์ทันที · โอนเงินแล้วแนบสลิป ร้านตรวจยอดภายใน " + h + " ชั่วโมง · กดดาวน์โหลดได้ที่หน้าสมาชิก เมนู เอกสารของฉัน ระบบส่งอีเมลแจ้งทุกขั้น และมีลิงก์ติดตามสถานะ"],
          ["ใช้กับหลายโครงการได้ไหม",
            "ได้ ผู้ซื้อใช้ในงานของตนเองและของหน่วยงานที่ตนทำงานอยู่ได้ไม่จำกัดจำนวนครั้ง พิมพ์ได้ · ไม่อนุญาตให้ขาย แจกจ่าย เผยแพร่ต่อสาธารณะ หรือดัดแปลงแล้วนำไปขาย"],
          ["ออกใบเสร็จได้ไหม",
            "ได้ ระบบออกใบเสร็จรับเงินให้อัตโนมัติทุกคำสั่งซื้อที่ชำระแล้ว ในนามบุคคลหรือบริษัท พร้อมเลขประจำตัวผู้เสียภาษี (ใส่ได้ตอนชำระเงิน) · เปิดและพิมพ์เป็น PDF ได้จากหน้าสมาชิกและอีเมล · ร้านยังไม่ได้จดภาษีมูลค่าเพิ่ม เอกสารจึงไม่ใช่ใบกำกับภาษี"],
          ["ขอคืนเงินได้ไหม",
            "ยังไม่ได้ดาวน์โหลดไฟล์: แจ้งขอคืนเงินได้ภายใน 7 วันนับจากวันที่ร้านยืนยันยอด · ดาวน์โหลดแล้ว: ไม่คืนเงิน เว้นแต่ไฟล์เสียหาย เปิดไม่ได้ หรือไม่ตรงกับรายการที่สั่ง (ร้านส่งไฟล์ที่ถูกต้องให้หรือคืนเงิน)"],
          ["ใบตรวจงานแทนการตรวจของวิศวกรได้ไหม",
            "ไม่ได้ ใบตรวจงานเป็นเครื่องมือช่วยตรวจและบันทึก งานจริงให้ยึดแบบ ข้อกำหนด และมาตรฐานที่สัญญาอ้างอิง งานที่กฎหมายกำหนดให้ผู้มีใบอนุญาตทำ ต้องให้ผู้มีใบอนุญาตเป็นผู้ทำและรับรอง"]
        ];
      return '<section class="pd-sec faq" id="faq"><h2>คำถามที่พบบ่อย</h2>' + qa.map(function (a) {
        return "<details><summary>" + esc(a[0]) + "</summary><p>" + esc(a[1]) + "</p></details>";
      }).join("") + '<p class="note">อ่านข้อตกลงเต็มที่ <a href="' + L("terms.html") + '">ข้อตกลงการใช้งาน</a></p></section>';
    }

    function draw() {
      $("pd").innerHTML = '<div class="pd">' + media() + '<div class="pd-info"><span class="code">'
        + esc(mk ? x.id : code) + (mk ? " · " + esc(x.kind || "สินค้าฝากขาย") : bundle ? " · ชุดรวม" : " · "
          + esc(src.group || "")) + "</span><h1>" + esc(title) + "</h1>" + (!bundle && src.titleEn ? '<p class="en" lang="en">'
            + esc(src.titleEn) + "</p>" : "") + '<p class="lede">' + esc(bundle ? x.text : src.sum)
        + "</p>" + facts() + '<div id="buybox">' + buyBox() + "</div>" + trust() + "</div></div>" +
        (mk ? secMarket() : (bundle ? secIncluded() : secOutline() + secStandards() + secRecords())
          + secBundles()) + secFaq();
      mountPicker();
      mbar();
    }
    function redrawBuy() {
      var bb = $("buybox");
      if (bb) bb.innerHTML = buyBox();
      mbar();
    }
    function mbar() {
      var m = $("mbar");
      if (!sell || B.cart.covered(x.id) || (own && !bundle)) {
        m.classList.remove("on");
        document.body.classList.remove("has-mbar");
        return;
      }
        var up = (cur() || plan()) === "up", inC = B.cart.has(x.id);
      m.innerHTML = '<span class="price">' + B.baht(up ? pU : pE) + "<small>" + (up ? "รับฉบับใหม่ตลอด" : "ซื้อฉบับนี้ เก็บได้ตลอด")
        + "</small></span>" + (inC ? '<a class="b pri" href="' + L("checkout.html") + '">ไปชำระเงิน</a>' : '<button class="b pri" type="button" data-act="add">ใส่ตะกร้า</button>');
      m.classList.add("on");
      m.removeAttribute("aria-hidden");
      document.body.classList.add("has-mbar");
    }
    function toast(t) {
      var el = document.querySelector(".bc-msg");
      if (el) {
        el.textContent = t;
        el.classList.add("on");
        setTimeout(function () {
          el.classList.remove("on");
        }, 2600);
      }
    }
    document.addEventListener("click", function (ev) {
      var z = ev.target.closest("[data-zoom]");
      if (z) {
        var lb = document.createElement("div");
        lb.className = "lightbox";
        lb.setAttribute("role", "dialog");
        lb.setAttribute("aria-modal", "true");
        lb.setAttribute("aria-label", "ภาพตัวอย่างขนาดใหญ่");
        lb.innerHTML = '<button class="b line sm" type="button" data-lbx="1">ปิด ✕</button><img src="'
          + esc(z.getAttribute("data-zoom")) + '" alt="ตัวอย่างหน้าแรกขนาดใหญ่">';
        document.body.appendChild(lb);
        lb.querySelector("button").focus();
        return;
      }
        if (ev.target.closest("[data-lbx]") || (ev.target.classList && ev.target.classList.contains("lightbox"))) {
          var l0 = document.querySelector(".lightbox");
          if (l0) l0.remove();
          return;
        }
        var a = ev.target.closest("[data-act]");
      if (!a) return;
      ev.stopPropagation();
      var up = plan() === "up", act = a.getAttribute("data-act");
      if (act === "addc") {
        var cv = document.getElementById("ctry").value, ec = B.cart.add(x.id + "." + cv, false);
        toast(ec || "ใส่ " + B.code(x) + " " + B.LANGS[cv] + " ลงตะกร้าแล้ว");
        return;
      }
        if (act === "addv") {
          var ev0 = B.cart.add(x.id + "." + a.getAttribute("data-v"), false);
          toast(ev0 || "ใส่ " + B.code(x) + " " + B.LANGS[a.getAttribute("data-v")] + " ลงตะกร้าแล้ว");
          return;
        }
        if (act === "upg") {
          var e0 = B.cart.has(x.id) ? (B.cart.setPlan(x.id, true), "") : B.cart.add(x.id, true);
          if (e0) {
            toast(e0);
            return;
          }
            location.href = L("checkout.html");
          return;
        }
        if (B.cart.has(x.id)) {
          if (act === "now") location.href = L("checkout.html");
          else location.href = L("cart.html");
          return;
        }
        var lv0 = lang(), err = B.cart.add(x.id + (lv0 ? "." + lv0 : ""), up);
      if (err) {
        toast(err);
        return;
      }
        if (act === "now") {
          location.href = L("checkout.html");
          return;
        }
        toast("ใส่ " + B.code(x) + " ลงตะกร้าแล้ว · " + (up ? "รับฉบับใหม่ตลอด" : "ซื้อฉบับนี้") + " · "
          + B.LANGS[lv0]);
      redrawBuy();
    }, true);
  document.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape") {
      var l0 = document.querySelector(".lightbox");
      if (l0) l0.remove();
    }
  });
  document.addEventListener("change", function (ev) {
    if (ev.target.id === "ctry") {
      if (picker) picker.setCc(ev.target.value);
      var fi = ctryInfo(ev.target.value);
      document.getElementById("ctryNote").textContent = fi.note;
      document.getElementById("ctryPrice").textContent = B.baht(fi.price);
      return;
    }
      if (ev.target.name === "lang") {
        if (B.cart.has(x.id)) {
          B.cart.setLang(x.id, ev.target.value);
          toast("เปลี่ยนภาษาในตะกร้าเป็น " + B.LANGS[ev.target.value] + " แล้ว");
        }
          return;
      }
      if (ev.target.name === "plan") {
        if (B.cart.has(x.id)) {
          B.cart.setPlan(x.id, ev.target.value === "up");
          toast("เปลี่ยนแบบสิทธิ์ในตะกร้าแล้ว");
        }
          mbar();
      }
  });
  window.addEventListener("build-cart", function () {
    if ($("buybox") && !$("buybox").contains(document.activeElement)) redrawBuy();
  });
  draw();
  if (B.token.get() && !bundle) B.call("me").then(function (r) {
    var d = (r.lib || []).filter(function (k) {
      return k.id === x.id;
    })[0];
    if (d) {
      own = d.plan === "edition" ? "edition" : "updates";
      redrawBuy();
    }
  }).catch(function () {});

  // ที่อยู่หลักของหน้านี้ (1 หน้าต่อ 1 สินค้า) และภาพตัวอย่างตอนแชร์
  var siteUrl = String((B.S.site || {}).url || "").replace(/\/+$/, "");
  if (/^https:\/\//.test(siteUrl) && !x.hidden) {
    var cl = document.createElement("link");
    cl.rel = "canonical";
    cl.href = siteUrl + "/product.html?id=" + encodeURIComponent(x.id);
    document.head.appendChild(cl);
    var og = document.querySelector('meta[property="og:title"]');
    if (og) og.setAttribute("content", document.title);
    if (!bundle && src.ok === true && src.img) {
      var oi = document.querySelector('meta[property="og:image"]');
      if (oi) oi.setAttribute("content", siteUrl + "/" + src.img);
    }
  }
    // ข้อมูลสินค้าสำหรับเครื่องมือค้นหา (เฉพาะรายการที่เปิดขาย)
    if (sell && !x.hidden) {
      var ld = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: B.code(x) + " " + title,
        sku: code,
        description: bundle ? x.text : src.sum,
        brand: { "@type": "Brand", name: "สร้าง | BUILD TH" },
        offers: {
          "@type": "Offer",
          priceCurrency: "THB",
          price: String(pE),
          availability: "https://schema.org/InStock",
          url: location.href.split("#")[0]
        }
      };
      if (!bundle && src.img) ld.image = new URL(src.img, location.href).href;
      var sc = document.createElement("script");
      sc.type = "application/ld+json";
      sc.textContent = JSON.stringify(ld);
      document.head.appendChild(sc);
    }
})();
