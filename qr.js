/* qr.js: PromptPay QR with the order amount. The customer scans and the amount fills in, so no typing errors.
   The payee comes only from data.js pay.qrBase, which is the text inside the shop's own QR image (pay/qr.jpg). This file adds tag 54 (amount) and a new CRC.
   QR encoder: byte mode, error correction level M, versions 1-10, per ISO/IEC 18004. No outside library. */
(function () {
  "use strict";
  var B = window.BUILD; if (!B) return;
  var P = B.P || {};
  var TOTAL = [0, 26, 44, 70, 100, 134, 172, 196, 242, 292, 346], ECB = [0, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26], BLK = [0, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5];
  var ALIGN = [[], [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]];
  var EXP = new Array(512), LOG = new Array(256);
  (function () { var x = 1; for (var i = 0; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 256) x ^= 0x11d; } for (i = 255; i < 512; i++) EXP[i] = EXP[i - 255]; })();
  function mul(a, b) { return a && b ? EXP[LOG[a] + LOG[b]] : 0; }
  function rsGen(n) { var g = [1]; for (var i = 0; i < n; i++) { var ng = []; for (var k = 0; k <= g.length; k++) ng[k] = 0; for (var j = 0; j < g.length; j++) { ng[j] ^= g[j]; ng[j + 1] ^= mul(g[j], EXP[i]); } g = ng; } return g; }
  function rsEnc(data, n) { var g = rsGen(n), res = []; for (var k = 0; k < n; k++) res[k] = 0; data.forEach(function (d) { var f = d ^ res[0]; res.shift(); res.push(0); for (var i = 0; i < n; i++) res[i] ^= mul(g[i + 1], f); }); return res; }
  function encode(text) {
    var bytes = []; var u = unescape(encodeURIComponent(text)); for (var i = 0; i < u.length; i++) bytes.push(u.charCodeAt(i));
    var ver = 0; for (var v = 1; v <= 10; v++) { var cap = TOTAL[v] - ECB[v] * BLK[v], head = v < 10 ? 2 : 3; if (bytes.length + head <= cap) { ver = v; break; } }
    if (!ver) throw new Error("QR text too long");
    var dataLen = TOTAL[ver] - ECB[ver] * BLK[ver], bits = [];
    var put = function (val, n) { for (var b = n - 1; b >= 0; b--) bits.push((val >>> b) & 1); };
    put(4, 4); put(bytes.length, ver < 10 ? 8 : 16); bytes.forEach(function (x) { put(x, 8); });
    put(0, Math.min(4, dataLen * 8 - bits.length)); while (bits.length % 8) bits.push(0);
    var cw = []; for (i = 0; i < bits.length; i += 8) { var c = 0; for (var j = 0; j < 8; j++) c = (c << 1) | bits[i + j]; cw.push(c); }
    for (var pad = 0xEC; cw.length < dataLen; pad ^= 0xEC ^ 0x11) cw.push(pad);
    var nb = BLK[ver], ecn = ECB[ver], shortLen = Math.floor(dataLen / nb), longN = dataLen % nb, blocks = [], ecs = [], pos = 0;
    for (i = 0; i < nb; i++) { var len = shortLen + (i >= nb - longN ? 1 : 0), blk = cw.slice(pos, pos + len); pos += len; blocks.push(blk); ecs.push(rsEnc(blk, ecn)); }
    var out = []; for (i = 0; i <= shortLen; i++) blocks.forEach(function (b) { if (i < b.length) out.push(b[i]); });
    for (i = 0; i < ecn; i++) ecs.forEach(function (e) { out.push(e[i]); });
    var size = 17 + 4 * ver, mod = [], fn = [];
    for (var y = 0; y < size; y++) { mod[y] = []; fn[y] = []; for (var x = 0; x < size; x++) { mod[y][x] = false; fn[y][x] = false; } }
    var set = function (cx, cy, dark) { mod[cy][cx] = !!dark; fn[cy][cx] = true; };
    for (i = 0; i < size; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
    var finder = function (cx, cy) { for (var dy = -4; dy <= 4; dy++) for (var dx = -4; dx <= 4; dx++) { var d = Math.max(Math.abs(dx), Math.abs(dy)), xx = cx + dx, yy = cy + dy; if (xx >= 0 && xx < size && yy >= 0 && yy < size) set(xx, yy, d !== 2 && d !== 4); } };
    finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
    var al = ALIGN[ver]; al.forEach(function (ay, ai) { al.forEach(function (ax, aj) { if ((ai === 0 && aj === 0) || (ai === 0 && aj === al.length - 1) || (ai === al.length - 1 && aj === 0)) return; for (var dy = -2; dy <= 2; dy++) for (var dx = -2; dx <= 2; dx++) set(ax + dx, ay + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1); }); });
    var format = function (mask) {
      var d = mask, rem = d; for (var k = 0; k < 10; k++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
      var fb = ((d << 10) | rem) ^ 0x5412, bit = function (n) { return ((fb >>> n) & 1) !== 0; };
      for (var a = 0; a <= 5; a++) set(8, a, bit(a));
      set(8, 7, bit(6)); set(8, 8, bit(7)); set(7, 8, bit(8));
      for (a = 9; a < 15; a++) set(14 - a, 8, bit(a));
      for (a = 0; a < 8; a++) set(size - 1 - a, 8, bit(a));
      for (a = 8; a < 15; a++) set(8, size - 15 + a, bit(a));
      set(8, size - 8, true);
    };
    format(0);
    if (ver >= 7) { var rv = ver; for (i = 0; i < 12; i++) rv = (rv << 1) ^ ((rv >>> 11) * 0x1F25); var vb = (ver << 12) | rv; for (i = 0; i < 18; i++) { var dk = ((vb >>> i) & 1) !== 0, a1 = size - 11 + i % 3, b1 = Math.floor(i / 3); set(a1, b1, dk); set(b1, a1, dk); } }
    var bitIdx = 0, total = out.length * 8;
    for (var right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (var vert = 0; vert < size; vert++) for (j = 0; j < 2; j++) {
        var cx = right - j, up = ((right + 1) & 2) === 0, cy = up ? size - 1 - vert : vert;
        if (!fn[cy][cx] && bitIdx < total) { mod[cy][cx] = ((out[bitIdx >>> 3] >>> (7 - (bitIdx & 7))) & 1) !== 0; bitIdx++; }
      }
    }
    var maskFn = [function (x0, y0) { return (x0 + y0) % 2 === 0; }, function (x0, y0) { return y0 % 2 === 0; }, function (x0) { return x0 % 3 === 0; }, function (x0, y0) { return (x0 + y0) % 3 === 0; }, function (x0, y0) { return (Math.floor(x0 / 3) + Math.floor(y0 / 2)) % 2 === 0; }, function (x0, y0) { return (x0 * y0) % 2 + (x0 * y0) % 3 === 0; }, function (x0, y0) { return ((x0 * y0) % 2 + (x0 * y0) % 3) % 2 === 0; }, function (x0, y0) { return ((x0 + y0) % 2 + (x0 * y0) % 3) % 2 === 0; }];
    var flip = function (m) { for (var yy = 0; yy < size; yy++) for (var xx = 0; xx < size; xx++) if (!fn[yy][xx] && maskFn[m](xx, yy)) mod[yy][xx] = !mod[yy][xx]; };
    var score = function () {
      var s = 0, dark = 0, yy, xx, run;
      for (yy = 0; yy < size; yy++) { run = 1; for (xx = 0; xx < size; xx++) { if (mod[yy][xx]) dark++; if (xx && mod[yy][xx] === mod[yy][xx - 1]) { run++; if (run === 5) s += 3; else if (run > 5) s++; } else run = 1; if (xx < size - 1 && yy < size - 1 && mod[yy][xx] === mod[yy][xx + 1] && mod[yy][xx] === mod[yy + 1][xx] && mod[yy][xx] === mod[yy + 1][xx + 1]) s += 3; } }
      for (xx = 0; xx < size; xx++) { run = 1; for (yy = 1; yy < size; yy++) { if (mod[yy][xx] === mod[yy - 1][xx]) { run++; if (run === 5) s += 3; else if (run > 5) s++; } else run = 1; } }
      var pat = [true, false, true, true, true, false, true];
      var finderLike = function (get) { for (var o = 0; o + 7 <= size; o++) { var ok = true; for (var q = 0; q < 7 && ok; q++) ok = get(o + q) === pat[q]; if (ok) s += 40; } };
      for (yy = 0; yy < size; yy++) (function (r) { finderLike(function (i2) { return mod[r][i2]; }); })(yy);
      for (xx = 0; xx < size; xx++) (function (c2) { finderLike(function (i2) { return mod[i2][c2]; }); })(xx);
      s += Math.floor(Math.abs(dark * 20 - size * size * 10) / (size * size)) * 10;
      return s;
    };
    var best = 0, low = Infinity;
    for (var m = 0; m < 8; m++) { flip(m); format(m); var sc = score(); if (sc < low) { low = sc; best = m; } flip(m); }
    flip(best); format(best);
    return mod;
  }
  function crc16(s) { var c = 0xFFFF; for (var i = 0; i < s.length; i++) { c ^= s.charCodeAt(i) << 8; for (var j = 0; j < 8; j++) c = c & 0x8000 ? ((c << 1) ^ 0x1021) & 0xFFFF : (c << 1) & 0xFFFF; } return ("0000" + c.toString(16).toUpperCase()).slice(-4); }
  function promptPay(base, amount) { // keeps every tag of the shop's QR, sets dynamic mode, adds the amount, then writes a new CRC
    var tags = [], i = 0, s = String(base || "");
    while (i < s.length) { var t = s.substr(i, 2), l = parseInt(s.substr(i + 2, 2), 10); if (!/^\d\d$/.test(t) || !(l >= 0)) throw new Error("bad QR text"); tags.push([t, s.substr(i + 4, l)]); i += 4 + l; }
    if (!tags.some(function (x) { return x[0] === "29" || x[0] === "30"; })) throw new Error("not a PromptPay QR");
    var fmt = function (t2, v2) { return t2 + ("0" + v2.length).slice(-2) + v2; }, val = (Math.round(+amount * 100) / 100).toFixed(2);
    if (!(+val > 0)) throw new Error("bad amount");
    var out = tags.filter(function (x) { return x[0] !== "54" && x[0] !== "63"; }).map(function (x) { return x[0] === "01" ? ["01", "12"] : x; });
    out.push(["54", val]); out.sort(function (a, b) { return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0; });
    var body = out.map(function (x) { return fmt(x[0], x[1]); }).join("") + "6304";
    return body + crc16(body);
  }
  function png(text) { // a real image file, because bank apps read QR codes from saved photos
    var mod = encode(text), n = mod.length, q = 4, sc = 8, c = document.createElement("canvas"); c.width = c.height = (n + q * 2) * sc;
    var x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); x.fillStyle = "#000";
    for (var yy = 0; yy < n; yy++) for (var xx = 0; xx < n; xx++) if (mod[yy][xx]) x.fillRect((xx + q) * sc, (yy + q) * sc, sc, sc);
    return c.toDataURL("image/png");
  }
  // QR block for the transfer box. If anything fails, the shop's static QR image shows instead.
  B.qrBox = function (o) {
    var esc = B.esc, url = "";
    try { if (P.qrBase) url = png(promptPay(P.qrBase, o.amount)); } catch (e) { url = ""; }
    if (url) return '<div><img class="qr" src="' + url + '" alt="คิวอาร์พร้อมเพย์ของคำสั่งซื้อนี้ ยอด ' + esc(B.baht(o.amount)) + '"><p class="note" style="margin:4px 0 0">สแกนแล้วยอด <b>' + esc(B.baht(o.amount)) + '</b> ขึ้นเอง ไม่ต้องพิมพ์ · <a href="' + url + '" download="BUILD_TH_' + esc(o.id) + '.png">บันทึกรูปคิวอาร์</a> แล้วเปิดในแอปธนาคารได้</p></div>';
    return P.qr ? '<div><img class="qr" src="' + esc(P.qr) + '" alt="คิวอาร์พร้อมเพย์รับเงินของร้าน"><p class="note" style="margin:4px 0 0"><a href="' + esc(P.qr) + '" download="BUILD_TH_QR.jpg">บันทึกรูปคิวอาร์</a> แล้วเปิดในแอปธนาคาร · ใส่ยอดให้ตรง</p></div>' : "";
  };
  B.qrTest = { encode: encode, crc16: crc16, promptPay: promptPay };
})();
