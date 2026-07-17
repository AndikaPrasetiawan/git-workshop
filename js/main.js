/**
 * Git & GitHub Workshop — shared interactivity
 * Vanilla JS, no dependencies. Handles: theme toggle, mobile sidebar,
 * active nav highlighting, copy-to-clipboard for code blocks, and
 * localStorage-backed progress tracking for the exercises page.
 */
(function () {
  "use strict";

  var THEME_KEY = "workshop-theme";
  var PROGRESS_KEY = "workshop-progress";
  var SIDEBAR_KEY = "workshop-sidebar-collapsed";
  var root = document.documentElement;

  /* ---------------- Theme toggle ---------------- */
  function initTheme() {
    var saved = localStorage.getItem(THEME_KEY);
    if (saved) root.setAttribute("data-theme", saved);

    var btn = document.querySelector("[data-theme-toggle]");
    if (!btn) return;

    function currentIsDark() {
      var explicit = root.getAttribute("data-theme");
      if (explicit) return explicit === "dark";
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }

    function render() {
      btn.textContent = currentIsDark() ? "☀️" : "🌙";
      btn.setAttribute("aria-label", currentIsDark() ? "Ganti ke mode terang" : "Ganti ke mode gelap");
    }

    btn.addEventListener("click", function () {
      var next = currentIsDark() ? "light" : "dark";
      root.setAttribute("data-theme", next);
      localStorage.setItem(THEME_KEY, next);
      render();
    });

    render();
  }

  /* ---------------- Sidebar: off-canvas on mobile, collapsible on desktop ---------------- */
  function initSidebar() {
    var toggle = document.querySelector("[data-menu-toggle]");
    var sidebar = document.querySelector(".sidebar");
    var backdrop = document.querySelector("[data-sidebar-backdrop]");
    if (!toggle || !sidebar) return;

    function isDesktop() {
      return window.innerWidth > 900;
    }

    /* mobile: off-canvas overlay */
    function closeMobile() {
      sidebar.classList.remove("open");
      if (backdrop) backdrop.classList.remove("open");
      if (!isDesktop()) toggle.setAttribute("aria-expanded", "false");
    }
    function openMobile() {
      sidebar.classList.add("open");
      if (backdrop) backdrop.classList.add("open");
      toggle.setAttribute("aria-expanded", "true");
    }

    /* desktop: persistent collapse, remembered across visits */
    function setDesktopCollapsed(collapsed) {
      document.body.classList.toggle("sidebar-collapsed", collapsed);
      toggle.setAttribute("aria-expanded", String(!collapsed));
      toggle.setAttribute("aria-label", collapsed ? "Buka sidebar" : "Tutup sidebar");
      localStorage.setItem(SIDEBAR_KEY, collapsed ? "1" : "0");
    }

    if (isDesktop() && localStorage.getItem(SIDEBAR_KEY) === "1") {
      setDesktopCollapsed(true);
    }

    toggle.addEventListener("click", function () {
      if (isDesktop()) {
        setDesktopCollapsed(!document.body.classList.contains("sidebar-collapsed"));
      } else {
        sidebar.classList.contains("open") ? closeMobile() : openMobile();
      }
    });
    if (backdrop) backdrop.addEventListener("click", closeMobile);
    sidebar.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", closeMobile);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMobile();
    });
  }

  /* ---------------- Active nav link ---------------- */
  function initActiveNav() {
    var here = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".side-link").forEach(function (link) {
      var href = link.getAttribute("href");
      if (href === here) {
        link.classList.add("active");
        link.setAttribute("aria-current", "page");
      }
    });
  }

  /* ---------------- Copy-to-clipboard ---------------- */
  function initCopyButtons() {
    document.querySelectorAll(".copy-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var block = btn.closest(".code-block");
        var code = block ? block.querySelector("code") : null;
        if (!code) return;

        var text = code.innerText;
        var done = function () {
          var original = btn.dataset.label || "Salin";
          btn.textContent = "✓ Disalin";
          btn.classList.add("copied");
          setTimeout(function () {
            btn.textContent = original;
            btn.classList.remove("copied");
          }, 1600);
        };

        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(text).then(done, function () {
            fallbackCopy(text);
            done();
          });
        } else {
          fallbackCopy(text);
          done();
        }
      });
      if (!btn.dataset.label) btn.dataset.label = btn.textContent;
    });
  }

  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (e) { /* no-op */ }
    document.body.removeChild(ta);
  }

  /* ---------------- Exercise progress tracking ---------------- */
  function loadProgress() {
    try {
      return JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
    } catch (e) {
      return {};
    }
  }
  function saveProgress(data) {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(data));
  }

  function updateProgressBar() {
    var boxes = document.querySelectorAll(".check-item input[type='checkbox']");
    var bar = document.querySelector(".progress-bar-fill");
    var label = document.querySelector(".progress-percent");
    if (!boxes.length || !bar) return;

    var checked = 0;
    boxes.forEach(function (b) { if (b.checked) checked++; });
    var pct = Math.round((checked / boxes.length) * 100);
    bar.style.width = pct + "%";
    if (label) label.textContent = pct + "% (" + checked + "/" + boxes.length + ")";
  }

  function initChecklist() {
    var boxes = document.querySelectorAll(".check-item input[type='checkbox']");
    if (!boxes.length) return;

    var progress = loadProgress();

    boxes.forEach(function (box) {
      var key = box.dataset.progressKey;
      if (key && progress[key]) {
        box.checked = true;
        box.closest(".check-item").classList.add("checked");
      }
      box.addEventListener("change", function () {
        box.closest(".check-item").classList.toggle("checked", box.checked);
        if (key) {
          progress[key] = box.checked;
          saveProgress(progress);
        }
        updateProgressBar();
      });
    });

    updateProgressBar();

    var resetBtn = document.querySelector("[data-reset-progress]");
    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        if (!confirm("Reset semua progres latihan? Tindakan ini tidak bisa dibatalkan.")) return;
        boxes.forEach(function (box) {
          box.checked = false;
          box.closest(".check-item").classList.remove("checked");
        });
        saveProgress({});
        updateProgressBar();
      });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    initTheme();
    initSidebar();
    initActiveNav();
    initCopyButtons();
    initChecklist();
  });
})();
