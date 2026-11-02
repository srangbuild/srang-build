(function () {
  "use strict";
  var S = window.SITE || {}, L = S.links || {};
  var $ = function (id) {
    return document.getElementById(id);
  };
  $("yr").textContent = new Date().getFullYear();
  $("ver").textContent = S.privacyDate || S.version || "";
  if (L.email) {
    var a = document.createElement("a");
    a.href = "mailto:" + L.email;
    a.textContent = L.email;
    $("who").appendChild(document.createTextNode("ติดต่อเรื่องข้อมูลส่วนตัวได้ที่ "));
    $("who").appendChild(a);
  }
    else $("who").textContent = "ติดต่อเรื่องข้อมูลส่วนตัวได้ทางช่องทางในหน้าหลัก";
  var ga = /^G-[A-Z0-9]{6,}$/.test((S.site || {}).ga4 || "");
  $("ga").textContent = "ระบบสมาชิกเก็บรหัสการเข้าสู่ระบบ รายการในตะกร้า และคำตอบของคุณในแถบแจ้งการเก็บข้อมูล ไว้ในเบราว์เซอร์ของคุณ ลบได้ด้วยการกดออกจากระบบ ล้างตะกร้า หรือล้างข้อมูลเว็บไซต์ในเบราว์เซอร์ เปลี่ยนคำตอบได้ที่ลิงก์ ตั้งค่าคุกกี้ ท้ายหน้า"
    + (ga ? " เว็บนี้ใช้ Google Analytics เพื่อนับจำนวนผู้เข้าชมและการกดลิงก์แบบรวม ไม่ระบุตัวบุคคล และจะเริ่มเก็บก็ต่อเมื่อคุณกดยอมรับสถิติในแถบแจ้งเท่านั้น" : " เว็บนี้ไม่ใช้เครื่องมือติดตามเพื่อการโฆษณา");
})();
