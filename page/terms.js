(function () {
  "use strict";
  var S = window.SITE || {}, L = S.links || {}, P = S.pay || {};
  var $ = function (id) {
    return document.getElementById(id);
  };
  $("yr").textContent = new Date().getFullYear();
  $("ver").textContent = S.termsDate || S.version || "";
  if (L.email) {
    var a = document.createElement("a");
    a.href = "mailto:" + L.email;
    a.textContent = L.email;
    $("who").appendChild(document.createTextNode("ติดต่อได้ที่ "));
    $("who").appendChild(a);
  }
  $("hours").textContent = P.hours ? "ร้านตรวจยอดภายใน " + P.hours + " ชั่วโมง แล้วเปิดสิทธิ์ดาวน์โหลด" : "ร้านตรวจยอดแล้วเปิดสิทธิ์ดาวน์โหลด";
})();
