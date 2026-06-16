/* ============================================================
   Vinaadi marketing — shared chrome injector (review build)
   Injects the real PublicNav + PublicFooter into every page so
   they stay byte-identical, and rewrites Next.js routes to the
   flat filenames used in this static review build.
   ============================================================ */
(function () {
  "use strict";

  // ---- Brand mark (replaces /brand/vinaadi-symbol-icon.png) ----
  var BRAND = '<svg class="cl-nav__symbol" width="26" height="26" viewBox="0 0 32 32" fill="none" aria-hidden="true">' +
    '<circle cx="16" cy="16" r="13" stroke="var(--cl-accent)" stroke-width="1.4"/>' +
    '<circle cx="16" cy="16" r="3" fill="var(--cl-accent)"/>' +
    '<g stroke="var(--cl-accent)" stroke-width="1.4" stroke-linecap="round">' +
    '<path d="M16 3.2v6"/><path d="M16 22.8v6"/><path d="M3.2 16h6"/><path d="M22.8 16h6"/>' +
    '<path d="M7 7l3.2 3.2"/><path d="M21.8 21.8L25 25"/><path d="M25 7l-3.2 3.2"/><path d="M10.2 21.8L7 25"/></g>' +
    '</svg>';

  // ---- Route → flat filename map ----
  var APP_ROUTES = { "/dashboard": "#", "/login": "#" };
  function routeToFile(href) {
    if (!href || href[0] !== "/") return href;          // external / hash / relative
    if (href === "/") return "index.html";
    if (APP_ROUTES[href] !== undefined) return APP_ROUTES[href];
    var path = href.split("#")[0].split("?")[0];
    var hash = href.indexOf("#") > -1 ? href.slice(href.indexOf("#")) : "";
    var slug = path.replace(/^\//, "").replace(/\/$/, "").replace(/\//g, "-");
    return (slug || "index") + ".html" + hash;
  }

  // ---- Nav ----
  var FEATURES = [
    ["/features/daily-guidance", "Daily Guidance"],
    ["/features/family-planning", "Family Planning"],
    ["/features/chart-guidance", "Chart Guidance"],
    ["/features/timing-and-decisions", "Timing & Decisions"],
  ];
  var TOOLS = [
    ["/tools/marriage-porutham-calculator", "Porutham Calculator", "Marriage compatibility"],
    ["/tools/jadhagam-generator", "Jadhagam Generator", "Tamil birth chart"],
    ["/tools/daily-panchangam-planner", "Panchangam Planner", "Daily Tamil almanac"],
    ["/tools/birth-time-rectification", "Birth Time Rectification", "Refine uncertain birth time"],
  ];

  function navHTML() {
    var feat = FEATURES.map(function (f) {
      return '<a href="' + f[0] + '" class="cl-nav-dropdown__item" role="menuitem"><span class="cl-nav-dropdown__item-label">' + f[1] + "</span></a>";
    }).join("");
    var tools = TOOLS.map(function (t) {
      return '<a href="' + t[0] + '" class="cl-nav-dropdown__item" role="menuitem"><span class="cl-nav-dropdown__item-label">' + t[1] + '</span><span class="cl-nav-dropdown__item-desc">' + t[2] + "</span></a>";
    }).join("");
    var chevron = '<svg width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true" class="cl-nav-dropdown__chevron"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    return '' +
      '<header class="cl-nav"><div class="cl-nav__inner">' +
        '<a href="/" class="cl-nav__brand" aria-label="Vinaadi home">' + BRAND + '<span class="cl-nav__wordmark">Vinaadi</span></a>' +
        '<nav class="cl-nav__links" aria-label="Primary navigation">' +
          '<div class="cl-nav-dropdown"><button type="button" class="cl-nav__link cl-nav-dropdown__trigger" aria-haspopup="true">Features' + chevron + '</button>' +
            '<div class="cl-nav-dropdown__menu" role="menu"><div class="cl-nav-dropdown__menu-inner">' + feat + '</div></div></div>' +
          '<div class="cl-nav-dropdown"><button type="button" class="cl-nav__link cl-nav-dropdown__trigger" aria-haspopup="true">Tools' + chevron + '</button>' +
            '<div class="cl-nav-dropdown__menu" role="menu"><div class="cl-nav-dropdown__menu-inner">' + tools + '</div></div></div>' +
          '<a href="/learn/what-is-thirukanitham" class="cl-nav__link">Learn</a>' +
          '<a href="/trust/methodology" class="cl-nav__link">Method</a>' +
          '<a href="/login" class="cl-nav__signin">Sign in</a>' +
        '</nav>' +
      '</div></header>';
  }

  // ---- Footer ----
  function footerHTML() {
    function col(head, links) {
      return '<div class="cl-footer__col"><p class="cl-footer__col-head">' + head + "</p>" +
        links.map(function (l) { return '<a href="' + l[0] + '" class="cl-footer__link">' + l[1] + "</a>"; }).join("") + "</div>";
    }
    return '' +
      '<footer class="cl-footer"><div class="cl-container cl-footer__inner">' +
        '<div class="cl-footer__brand"><span class="cl-footer__wordmark">Vinaadi</span>' +
          '<p class="cl-footer__tagline">Thirukanitham-based Tamil astrology for daily life and family planning.</p></div>' +
        '<div class="cl-footer__links">' +
          col("Features", FEATURES.map(function (f) { return f; })) +
          col("Tools", [
            ["/tools/marriage-porutham-calculator", "Porutham Calculator"],
            ["/tools/jadhagam-generator", "Jadhagam Generator"],
            ["/tools/daily-panchangam-planner", "Panchangam Planner"],
            ["/tools/birth-time-rectification", "Birth Time Rectification"],
          ]) +
          col("Learn", [
            ["/learn/what-is-porutham", "What is Porutham?"],
            ["/learn/what-is-thirukanitham", "What is Thirukanitham?"],
            ["/learn/what-is-chandrashtama", "What is Chandrashtama?"],
            ["/learn/how-to-read-a-jadhagam", "How to read a Jadhagam"],
            ["/learn/why-birth-time-matters", "Why birth time matters"],
          ]) +
          col("Company", [
            ["/trust/about-vinaadi", "About Vinaadi"],
            ["/trust/methodology", "Methodology"],
            ["/privacy", "Privacy policy"],
            ["/terms", "Terms of service"],
          ]) +
        "</div>" +
      "</div>" +
      '<div class="cl-footer__bottom"><div class="cl-container cl-footer__bottom-inner">' +
        '<p class="cl-footer__disclaimer">Vinaadi provides Jyotish-based guidance. Astrology is a traditional belief system, not a science. For medical, legal, or financial decisions, consult a qualified professional.</p>' +
        '<p class="cl-footer__copy">© ' + new Date().getFullYear() + " Vinaadi</p>" +
      "</div></div></footer>";
  }

  function init() {
    var shell = document.querySelector(".clarity-shell");
    if (!shell) return;

    // insert nav first, footer last
    shell.insertAdjacentHTML("afterbegin", navHTML());
    shell.insertAdjacentHTML("beforeend", footerHTML());

    // rewrite every internal route to its flat filename
    document.querySelectorAll('a[href^="/"]').forEach(function (a) {
      a.setAttribute("href", routeToFile(a.getAttribute("href")));
    });

    buildArticleTOC();
    wireReveals();
  }

  // ---- Reveal sample result panels on button click ----
  function wireReveals() {
    document.querySelectorAll("[data-reveal]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var panel = document.getElementById(btn.getAttribute("data-reveal"));
        if (!panel) return;
        panel.hidden = false;
        var orig = btn.textContent;
        btn.textContent = "Calculating…";
        btn.disabled = true;
        setTimeout(function () {
          btn.textContent = orig;
          btn.disabled = false;
          var top = panel.getBoundingClientRect().top + window.scrollY - 80;
          window.scrollTo({ top: top, behavior: "smooth" });
        }, 550);
      });
    });
  }

  // ---- Build the "On this page" rail from the article's h2s ----
  function slugify(s) {
    return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }
  function buildArticleTOC() {
    document.querySelectorAll(".cl-article").forEach(function (article) {
      var toc = article.querySelector(".cl-article__toc[data-auto]");
      var body = article.querySelector(".cl-article__body");
      if (!toc || !body) return;
      var heads = body.querySelectorAll("h2");
      if (!heads.length) return;

      var list = document.createElement("nav");
      list.className = "cl-article__toc-list";
      list.setAttribute("aria-label", "On this page");
      var links = [];
      heads.forEach(function (h, i) {
        if (!h.id) h.id = slugify(h.textContent) || "section-" + i;
        var a = document.createElement("a");
        a.href = "#" + h.id;
        a.textContent = h.textContent;
        a.addEventListener("click", function (e) {
          e.preventDefault();
          var top = h.getBoundingClientRect().top + window.scrollY - 88;
          window.scrollTo({ top: top, behavior: "smooth" });
          history.replaceState(null, "", "#" + h.id);
        });
        list.appendChild(a);
        links.push(a);
      });
      var label = toc.querySelector(".cl-article__toc-label");
      toc.innerHTML = "";
      if (label) toc.appendChild(label);
      else {
        var lbl = document.createElement("p");
        lbl.className = "cl-article__toc-label";
        lbl.textContent = "On this page";
        toc.appendChild(lbl);
      }
      toc.appendChild(list);

      // scroll-spy
      var spy = function () {
        var pos = window.scrollY + 120;
        var current = 0;
        heads.forEach(function (h, i) { if (h.offsetTop <= pos) current = i; });
        links.forEach(function (a, i) { a.classList.toggle("is-active", i === current); });
      };
      window.addEventListener("scroll", spy, { passive: true });
      spy();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
