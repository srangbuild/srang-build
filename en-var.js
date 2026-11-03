/* en-var.js: English of the United States and of the United Kingdom (3 Nov 2026).
   The site and the sheets are written once. This file changes spelling and building terms to the chosen form.
   Only words with one clear meaning are in the lists. A meter that measures water or power stays "meter" in both forms.
   Official names of standards and laws are marked data-noi18n on the page, so they stay as published. */
(function () {
  "use strict";
  function list(rows) {
    return rows.map(function (r) {
      return { re: new RegExp("\\b(" + r[0] + ")\\b", "gi"), to: r[1] };
    });
  }
    function cap(m, to) {
      if (m === m.toUpperCase() && m.length > 1) return to.toUpperCase();
      return /^[A-Z]/.test(m) ? to.charAt(0).toUpperCase() + to.slice(1) : to;
    }
    /* UK to US */
    var G2U = list([
      ["metres", "meters"], ["metre", "meter"], ["centimetres", "centimeters"], ["centimetre",
        "centimeter"], ["millimetres", "millimeters"], ["millimetre", "millimeter"], ["kilometres",
          "kilometers"], ["kilometre", "kilometer"],
      ["litres", "liters"], ["litre", "liter"], ["licences", "licenses"], ["licence", "license"], ["neighbours",
        "neighbors"], ["neighbouring", "neighboring"], ["neighbour", "neighbor"], ["colours",
          "colors"], ["coloured", "colored"], ["colour", "color"],
      ["centres", "centers"], ["centre", "center"], ["fibres", "fibers"], ["fibre", "fiber"], ["aluminium",
        "aluminum"], ["multi-storey", "multi-story"], ["storeys", "stories"], ["storey", "story"], ["greyish",
          "grayish"], ["grey", "gray"],
      ["moulds", "molds"], ["moulded", "molded"], ["moulding", "molding"], ["mould", "mold"], ["sulphates",
        "sulfates"], ["sulphate", "sulfate"], ["sulphur", "sulfur"], ["instalments", "installments"],
      ["instalment", "installment"],
      ["kerbs", "curbs"], ["kerb", "curb"], ["ageing", "aging"], ["catalogues", "catalogs"], ["catalogue",
        "catalog"], ["labour", "labor"], ["favour", "favor"], ["behaviour", "behavior"], ["vapour",
          "vapor"], ["rigour", "rigor"], ["odours", "odors"], ["odour", "odor"], ["mitres", "miters"],
      ["mitre", "miter"],
      ["levelling", "leveling"], ["labelled", "labeled"], ["labelling", "labeling"], ["cancelled",
        "canceled"], ["modelling", "modeling"], ["signalling", "signaling"], ["travelling",
          "traveling"],
      ["organisations", "organizations"], ["organisation", "organization"], ["organise", "organize"],
      ["recognise", "recognize"], ["summarise", "summarize"], ["energising", "energizing"], ["energise",
        "energize"], ["analyse", "analyze"], ["galvanised", "galvanized"], ["galvanise", "galvanize"],
      ["programmes", "programs"], ["programme", "program"],
      ["tonnes", "metric tons"], ["tonne", "metric ton"], ["lift openings", "elevator openings"], ["fire, lifts and",
        "fire, elevators and"], ["car parks", "parking lots"], ["car park", "parking lot"], ["line, neutral, earth",
          "hot, neutral, ground"], ["earth present", "ground present"], ["earth provided",
            "ground provided"], ["taps and valves", "faucets and valves"], ["earthing", "grounding"],
      ["earth wires", "ground wires"], ["earth wire", "ground wire"], ["earth rods", "ground rods"],
      ["earth rod", "ground rod"], ["earth electrodes", "grounding electrodes"], ["earth electrode",
        "grounding electrode"], ["earth fault", "ground fault"], ["earth leakage", "ground fault"],
      ["consumer units", "panelboards"], ["consumer unit", "panelboard"], ["socket outlets",
        "receptacles"], ["socket outlet", "receptacle"], ["downpipes", "downspouts"], ["downpipe",
          "downspout"],
      ["skirting boards", "baseboards"], ["skirting board", "baseboard"], ["skirting", "baseboard"],
      ["snagging list", "punch list"], ["snag list", "punch list"], ["whilst", "while"], ["towards",
        "toward"], ["defects period", "warranty period"]
    ]);
  /* US to UK. "meter" alone can be an instrument, so only its uses with a size change: see metres() below. "program" stays: UK English also writes a computer program that way. */
  var U2G = list([
    ["centimeters", "centimetres"], ["centimeter", "centimetre"], ["millimeters", "millimetres"], ["millimeter",
      "millimetre"], ["kilometers", "kilometres"], ["kilometer", "kilometre"],
    ["liters", "litres"], ["liter", "litre"], ["neighbors", "neighbours"], ["neighboring",
      "neighbouring"], ["neighbor", "neighbour"], ["colors", "colours"], ["colored", "coloured"], ["color",
        "colour"],
    ["centers", "centres"], ["center", "centre"], ["fibers", "fibres"], ["fiber", "fibre"], ["aluminum",
      "aluminium"], ["multi-story", "multi-storey"], ["grayish", "greyish"], ["gray", "grey"],
    ["molds", "moulds"], ["molded", "moulded"], ["molding", "moulding"], ["mold", "mould"], ["sulfates",
      "sulphates"], ["sulfate", "sulphate"], ["sulfur", "sulphur"], ["installments", "instalments"],
    ["installment", "instalment"],
    ["curbs", "kerbs"], ["curb", "kerb"], ["aging", "ageing"], ["catalogs", "catalogues"], ["catalog",
      "catalogue"], ["labor", "labour"], ["favor", "favour"], ["behavior", "behaviour"], ["vapor",
        "vapour"], ["odors", "odours"], ["odor", "odour"], ["miters", "mitres"], ["miter", "mitre"],
    ["leveling", "levelling"], ["labeled", "labelled"], ["labeling", "labelling"], ["canceled",
      "cancelled"], ["modeling", "modelling"], ["signaling", "signalling"], ["traveling",
        "travelling"],
    ["elevators", "lifts"], ["elevator", "lift"], ["parking lots", "car parks"], ["parking lot",
      "car park"], ["hot, neutral, ground", "line, neutral, earth"], ["ground present",
        "earth present"], ["ground provided", "earth provided"], ["grounding electrodes",
          "earth electrodes"], ["grounding electrode", "earth electrode"], ["grounding", "earthing"],
    ["ground wires", "earth wires"], ["ground wire", "earth wire"], ["ground rods", "earth rods"], ["ground rod",
      "earth rod"], ["ground fault", "earth fault"], ["panelboards", "consumer units"], ["panelboard",
        "consumer unit"], ["receptacles", "socket outlets"], ["receptacle", "socket outlet"], ["downspouts",
          "downpipes"], ["downspout", "downpipe"],
    ["baseboards", "skirting boards"], ["baseboard", "skirting board"], ["punch list",
      "snagging list"], ["faucets", "taps"], ["faucet", "tap"]
  ]);
  var NOT_LENGTH = /(water|power|gas|flow|electric|electricity|energy|test|clamp|multi|moisture|slump|kwh|moisture)\s*$/i;
  function metres(s) { /* a length, not an instrument */
    return s.replace(/(^|[^\s]*\s*)\b(meters|meter)\b/gi, function (m, pre, w) {
      if (NOT_LENGTH.test(pre)) return m;
      var one = w.length === 5, up = /^M/.test(w), t = one ? "metre" : "metres";
      return pre + (up ? t.charAt(0).toUpperCase() + t.slice(1) : t);
    });
  }
    function licence(s) { /* the noun. "to license" stays a verb. */
      return s.replace(/(^|[^\s]*\s*)\b(licenses|license)\b/gi, function (m, pre, w) {
        if (/\bto\s*$/i.test(pre)) return m;
        var t = /s$/i.test(w) ? "licences" : "licence";
        return pre + (/^L/.test(w) ? t.charAt(0).toUpperCase() + t.slice(1) : t);
      });
    }
    function floors(s) {
      return s.replace(/\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten)-story\b/gi,
        "$1-storey");
    }
    function conv(s, v) {
      var t = String(s == null ? "" : s);
      if (!t || !/[A-Za-z]/.test(t)) return t;
      if (v === "GB") {
        t = floors(licence(metres(t)));
        U2G.forEach(function (r) {
          t = t.replace(r.re, function (m) {
            return cap(m, r.to);
          });
        });
        return t;
      }
        G2U.forEach(function (r) {
          t = t.replace(r.re, function (m) {
            return cap(m, r.to);
          });
        });
      return t;
    }
    function cur() {
      return window.REGION ? window.REGION.ev() : "US";
    }
    window.EnVar = {
      conv: conv,
      cur: cur,
      loc: function () {
        return "en-" + cur();
      }
    };
})();
