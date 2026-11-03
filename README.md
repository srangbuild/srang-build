# สร้าง | BUILD TH: website

Static site on GitHub Pages, with one Google Apps Script back end (`Code.gs`). No build server. No framework. No Node on the work machine.

## Layout

| Path | What it holds | How it changes |
|---|---|---|
| `*.html` | One file per page: content and markup only | By hand |
| `page/<name>.js`, `page/<name>.css` | The script and style of one page | By hand |
| `app.js` | Shared shop logic (`window.BUILD`): prices, currency, cart rules, API call | By hand |
| `nav.js`, `nav.css` | Shared header and language menu | By hand |
| `pick.js` | Long lists: search box, flags, alphabetical order. The `<select>` stays and holds the value | By hand |
| `i18n.js`, `en-var.js` | Translation engine, US and UK English forms | By hand |
| `doc.js`, `std-pick.js`, `doc-form.css` | Smart document form and standards picker | By hand |
| `pay.js`, `cart.js`, `extras.js`, `bot.js`, `qr.js`, `knowledge.js` | One job each, as the name says | By hand |
| `site.css`, `shop.css`, `knowledge.css` | Shared styles | By hand |
| `region.js` | Languages, countries, flags, currencies | **Generated** by `gen_zones.ps1` |
| `doc-refs.js`, `doc-cov.js` | Names of standards, coverage counts | **Generated** by `gen_smartdoc.ps1` |
| `data.js` | Catalogue and site settings | **Generated** by the site tools |
| `doc-law.js` | Law records by country | Added by `merge_law.ps1` |
| `i18n-en.js`, `i18n-core.js`, `i18n-fix.js` | Translation data | Data files |
| `sheets/`, `free/`, `img/`, `pay/` | Sheets, free files, images | Data files |
| `demo/` | Copy of the back end for the test mode. Not published when the real back end is set | **Generated** by `gas_harness.ps1` |
| `_dev/` | Local test pages. Never published | **Generated** by `gas_harness.ps1` |

Tools are outside the site, in `tools_v10`. Data sources are in `สินค้า\มาตรฐานประเทศ`.

## Rules for the code

1. A list lives in one place. Languages and countries live only in `00_โซน.json` and `00_ธง.txt`. Never copy such a list into a page.
2. A generated file has a header that says so. Change the source, then run the generator.
3. A page holds no inline script, no inline style block and no inline event handler. The Content Security Policy of each page has no `'unsafe-inline'` in `script-src`, so an injected script cannot run.
4. One form for code: `web_tidy.ps1` formats all hand-written JavaScript. It only adds line breaks and indentation, and it compares tokens before it writes a file.
5. No secret in this folder. Secrets live only in the Script properties of the back end.
6. Text for customers is written in Thai first. English pairs and other languages come through `i18n`. A form value stays the Thai original, so the back end always receives the same value.

## Add a language or a country

1. Add it to `languages`, `languageInfo` and `countries` in `00_โซน.json`.
2. Add a flag line to `00_ธง.txt`.
3. Run `gen_zones.ps1`, then `web_publish.ps1`.
4. A country goes on sale on the web when it has a law record in `doc-law.js` (`merge_law.ps1`). The back end already knows every country in the register.

## Before a release

1. `web_tidy.ps1`: one form for code.
2. `gen_zones.ps1`, `gen_smartdoc.ps1`: lists and data.
3. `gas_harness.ps1`, then open `_dev/member.html` and run `selfTest()`. It must return 0.
4. `web_publish.ps1`: runs `web_check.ps1` and copies the site to `เว็บ_พร้อมขึ้น`.
5. `web_diff.ps1`: shows which files differ from the live site.
6. Upload the files, then Deploy the back end when `Code.gs` changed.
