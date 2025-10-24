// app.js — NW Auto Supreme (no framework, single-file build ready)

// Import Web Components (each file defines and registers its element)
import "./components/before-after.js";
import "./components/drawer.js";
import "./components/quote-modal.js";
import "./components/reviews.js";
import "./components/theme-toggle.js";

// ---------- Utilities ----------
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function on(type, selOrEl, handler, opts) {
  if (typeof selOrEl === "string") {
    document.addEventListener(
      type,
      (e) => {
        const t = e.target.closest(selOrEl);
        if (t) handler(e, t);
      },
      opts
    );
  } else {
    selOrEl.addEventListener(type, handler, opts);
  }
}

// ---------- Theme ----------
const THEME_KEY = "nw-theme";
function applyTheme(mode) {
  document.body.classList.toggle("dark", mode === "dark");
}
function loadTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "dark" || saved === "light") {
    applyTheme(saved);
  } else {
    const prefers = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
    applyTheme(prefers);
  }
}
function saveTheme() {
  const mode = document.body.classList.contains("dark") ? "dark" : "light";
  localStorage.setItem(THEME_KEY, mode);
}

// ---------- Reveal on scroll ----------
function setupReveal() {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("revealed");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  $$(".fade-up").forEach((el) => io.observe(el));
}

// ---------- Smooth anchor scroll ----------
function setupSmoothAnchors() {
  on("click", 'a[href^="#"]', (e, a) => {
    const id = a.getAttribute("href");
    if (!id || id.length <= 1) return;
    const target = document.getElementById(id.slice(1));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    history.pushState(null, "", id);
  });
}

// ---------- Quote Modal wiring (works with <quote-modal> WC or legacy DOM) ----------
function setupQuoteModal() {
  const modalEl = $("quote-modal");
  // Open triggers
  on("click", "[data-open-modal]", (e) => {
    e.preventDefault();
    if (modalEl?.open) modalEl.open();
    else {
      // Fallback: legacy modal in DOM with id #quoteModal and class .open
      const legacy = $("#quoteModal");
      if (legacy) {
        legacy.classList.add("open");
        legacy.setAttribute("aria-hidden", "false");
        const firstInput = legacy.querySelector("input,select,textarea,button");
        if (firstInput) firstInput.focus();
      }
    }
  });

  // Custom event from WC if present
  if (modalEl) {
    modalEl.addEventListener("quote:submitted", (e) => {
      // Placeholder: analytics hook
      // console.log('Quote submitted', e.detail);
    });
  }
}

// ---------- Drawer (mobile nav) helpers for legacy markup; WC handles itself otherwise ----------
function setupDrawerBridge() {
  const drawerEl = $("site-drawer");
  if (drawerEl) return; // WC manages everything internally

  const drawer = $("#drawer");
  const openBtn = $("#openDrawer");
  const closeShade = $("#closeDrawer");
  const closeX = $("#xDrawer");

  const open = () => {
    if (!drawer) return;
    drawer.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
  };
  const close = () => {
    if (!drawer) return;
    drawer.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
    document.body.classList.remove("no-scroll");
  };

  if (openBtn)
    on("click", openBtn, (e) => {
      e.preventDefault();
      open();
    });
  if (closeShade)
    on("click", closeShade, (e) => {
      e.preventDefault();
      close();
    });
  if (closeX)
    on("click", closeX, (e) => {
      e.preventDefault();
      close();
    });
  if (drawer) {
    $$("[data-close]", drawer).forEach((a) =>
      a.addEventListener("click", close)
    );
  }
}

// ---------- Theme toggle wiring ----------
function setupThemeToggle() {
  loadTheme();
  // Listen to WC custom events
  document.addEventListener("theme:toggle", () => {
    document.body.classList.toggle("dark");
    saveTheme();
  });
  document.addEventListener("theme:set", (e) => {
    const mode = e.detail === "dark" ? "dark" : "light";
    applyTheme(mode);
    saveTheme();
  });

  // Legacy buttons (if any)
  const modeBtns = ["#modeToggle", "#modeToggleMobile"]
    .map((sel) => $(sel))
    .filter(Boolean);
  modeBtns.forEach((btn) =>
    btn.addEventListener("click", () => {
      document.body.classList.toggle("dark");
      saveTheme();
      // Let any icons inside WC update if needed
      document.dispatchEvent(new CustomEvent("theme:changed"));
    })
  );
}

// ---------- Reviews expand/collapse (works with WC or legacy data attributes) ----------
function setupReviews() {
  // If <reviews-grid> WC exists, it manages itself.
  if ($("reviews-grid")) return;
  on("click", "[data-expand]", (e, btn) => {
    const body = btn.previousElementSibling;
    if (!body) return;
    const isClamped = body.classList.contains("clamp");
    if (isClamped) {
      body.classList.remove("clamp");
      btn.textContent = "Show less";
    } else {
      body.classList.add("clamp");
      btn.textContent = "Read more";
    }
  });
  on("click", "[data-more]", (e, btn) => {
    const sel = btn.getAttribute("data-more");
    if (!sel) return;
    const el = document.querySelector(sel);
    if (!el) return;
    el.classList.toggle("open");
    btn.textContent = el.classList.contains("open")
      ? "Show less"
      : "More details";
  });
}

// ---------- Gallery: hook thumbs to <ba-slider> ----------
function setupGallery() {
  const slider = $("ba-slider") || $("#ba"); // support WC or legacy id
  const thumbs = $("#thumbs");
  if (!thumbs) return;

  on("click", "#thumbs [data-key]", (e, btn) => {
    const key = btn.dataset.key;
    if (!key) return;

    // Web Component API
    if (slider && typeof slider.applyPreset === "function") {
      slider.applyPreset(key);
      if (typeof slider.animateTo === "function") slider.animateTo(50);
      return;
    }

    // Legacy globals (from the canvas code)
    if (window.applyPreset) window.applyPreset(key);
    if (window.animate) window.animate();
  });

  const viewMore = $("#viewMore");
  if (viewMore)
    viewMore.addEventListener("click", (e) => {
      e.preventDefault();
      // placeholder; wire up later
    });
}

// ---------- Misc ----------
function setCurrentYear() {
  const y = $("#year");
  if (y) y.textContent = new Date().getFullYear();
}

// ---------- Init ----------
document.addEventListener("DOMContentLoaded", () => {
  setCurrentYear();
  setupThemeToggle();
  setupReveal();
  setupSmoothAnchors();
  setupQuoteModal();
  setupDrawerBridge();
  setupReviews();
  setupGallery();
});
