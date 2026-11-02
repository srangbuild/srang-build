/* เมนูเดียวกับทุกหน้า · ไม่โหลดตอนถ่ายภาพหน้าเพื่อทำ PDF และรูป (shot=1) · ตอนพิมพ์ เมนูซ่อนตัวเอง */
(function () {
  if (/[?&]shot=1/.test(location.search)) return;
  var s = document.createElement("script");
  s.src = "nav.js";
  document.body.insertBefore(s, document.getElementById("hdr").nextSibling);
})();
