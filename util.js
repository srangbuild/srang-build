/* util.js: shared helpers. Load this file first on every page. One copy of the HTML escape, used by all other scripts. */
(function () {
  "use strict";
  window.escHtml = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
})();
