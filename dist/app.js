(() => {
  // src/components/before-after.js
  var BeforeAfter = class extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this._current = 50;
      this._target = 50;
      this._dragging = false;
      this._raf = null;
      this._presets = {
        tint: {
          label: "Window Tint \u2022 35% on front, 20% rear",
          before: "linear-gradient(135deg,rgba(5,25,60,.9),rgba(15,35,85,.9))",
          after: "linear-gradient(135deg,#a6b6d6,#eaf0ff)"
        },
        wraps: {
          label: "Wrap \u2022 Satin blue over OEM paint",
          before: "linear-gradient(135deg,#0A63FF,#3B82F6)",
          after: "linear-gradient(135deg,#343a40,#8a8f96)"
        },
        ppf: {
          label: "PPF \u2022 Front clip protection",
          before: "linear-gradient(135deg,rgba(230,240,255,.8),rgba(255,255,255,.95))",
          after: "linear-gradient(135deg,#d9e3ff,#ffffff)"
        },
        leather: {
          label: "Leather \u2022 Alea custom diamond stitch",
          before: "linear-gradient(135deg,#111,#444)",
          after: "linear-gradient(135deg,#b7b7b7,#e6e6e6)"
        },
        chrome: {
          label: "Chrome delete \u2022 Gloss black trim",
          before: "linear-gradient(135deg,#0f172a,#1e2a44)",
          after: "linear-gradient(135deg,#c8d2e3,#f4f7ff)"
        },
        heaters: {
          label: "Heated seats \u2022 Factory-look switch",
          before: "linear-gradient(135deg,#273042,#4a5a7a)",
          after: "linear-gradient(135deg,#d7dee9,#ffffff)"
        },
        fleet: {
          label: "Fleet \u2022 Vinyl branding application",
          before: "linear-gradient(135deg,#0A63FF,#00E0FF)",
          after: "linear-gradient(135deg,#e6f2ff,#ffffff)"
        },
        custom: {
          label: "Custom \u2022 Two-tone interior accents",
          before: "linear-gradient(135deg,#7C3AED,#3B82F6)",
          after: "linear-gradient(135deg,#f2f2f2,#ffffff)"
        }
      };
    }
    static get observedAttributes() {
      return ["data-preset"];
    }
    attributeChangedCallback(name, _old, val) {
      if (name === "data-preset" && this.isConnected) {
        this.applyPreset(val);
      }
    }
    connectedCallback() {
      const preset = this.getAttribute("data-preset") || "tint";
      const style = (
        /*css*/
        `
      :host{display:block}
      .ba{margin:14px 0 18px}
      .ba-viewport{
        position:relative;height:340px;border-radius:22px;border:1px solid var(--line);
        box-shadow:var(--shadow);overflow:hidden;
        background:linear-gradient(135deg, color-mix(in oklab, var(--ghost), var(--bg)), var(--bg))
      }
      .ba-after,.ba-before{position:absolute;inset:0}
      .ba-before{clip-path:inset(0 calc(100% - var(--cut,50%)) 0 0);transition:clip-path 120ms ease-out;will-change:clip-path}
      .ba-handle{
        position:absolute;top:0;bottom:0;left:var(--cut,50%);width:2px;
        background:rgba(255,255,255,.8);box-shadow:0 0 0 1px rgba(0,0,0,.06);
        transition:left 120ms ease-out;will-change:left
      }
      .ba-knob{
        position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
        width:46px;height:46px;border-radius:50%;
        background:rgba(255,255,255,.95);box-shadow:0 6px 18px rgba(0,0,0,.18);
        display:grid;place-items:center;cursor:ew-resize;user-select:none;touch-action:none
      }
      .ba-slider{position:absolute;inset:0;opacity:0;width:100%;height:100%;cursor:ew-resize}
      .ba-caption{margin-top:10px;font-weight:800;color:color-mix(in oklab, var(--ink), #000 10%)}
    `
      );
      const html = (
        /*html*/
        `
      <style>${style}</style>
      <div class="ba">
        <div class="ba-viewport" id="vp" style="--cut:${this._current}%">
          <div class="ba-after" id="after"></div>
          <div class="ba-before" id="before"></div>
          <input type="range" class="ba-slider" id="slider" min="0" max="100" value="${this._current}" aria-label="Before after slider">
          <div class="ba-handle" id="handle">
            <div class="ba-knob" id="knob" role="slider" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${this._current}" aria-label="Drag comparison" tabindex="0"></div>
          </div>
        </div>
        <div class="ba-caption"><slot name="label"><span id="label"></span></slot></div>
      </div>
    `
      );
      this.shadowRoot.innerHTML = html;
      this.$vp = this.shadowRoot.getElementById("vp");
      this.$before = this.shadowRoot.getElementById("before");
      this.$after = this.shadowRoot.getElementById("after");
      this.$slider = this.shadowRoot.getElementById("slider");
      this.$handle = this.shadowRoot.getElementById("handle");
      this.$knob = this.shadowRoot.getElementById("knob");
      this.$label = this.shadowRoot.getElementById("label");
      this.applyPreset(preset);
      this._animate();
      this.$slider.addEventListener("input", (e) => {
        this.animateTo(Number(e.target.value));
      });
      const pctFromEvent = (e) => {
        const r = this.$vp.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width * 100;
        return Math.min(100, Math.max(0, x));
      };
      const start = (e) => {
        this._dragging = true;
        this.animateTo(pctFromEvent(e));
        this.$vp.setPointerCapture?.(e.pointerId);
      };
      const move = (e) => {
        if (!this._dragging) return;
        this.animateTo(pctFromEvent(e));
      };
      const end = () => {
        this._dragging = false;
      };
      [this.$vp, this.$knob].forEach((el) => {
        el.addEventListener("pointerdown", start);
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", end);
        window.addEventListener("pointercancel", end);
      });
      this.$knob.addEventListener("keydown", (e) => {
        const step = e.shiftKey ? 10 : 2;
        if (e.key === "ArrowLeft") {
          this.animateTo(this._target - step);
          e.preventDefault();
        }
        if (e.key === "ArrowRight") {
          this.animateTo(this._target + step);
          e.preventDefault();
        }
        if (e.key === "Home") {
          this.animateTo(0);
          e.preventDefault();
        }
        if (e.key === "End") {
          this.animateTo(100);
          e.preventDefault();
        }
      });
    }
    disconnectedCallback() {
      cancelAnimationFrame(this._raf);
    }
    // Public API
    applyPreset(key = "tint") {
      const p = this._presets[key] || this._presets.tint;
      this.$before.style.background = p.before;
      this.$after.style.background = p.after;
      if (this.$label) this.$label.textContent = p.label;
      this.animateTo(50);
    }
    animateTo(p) {
      this._target = Math.min(100, Math.max(0, p));
      if (!this._raf) this._animate();
    }
    // Internal smooth animation
    _animate = () => {
      const done = !this._dragging && Math.abs(this._target - this._current) < 0.05;
      if (!done) {
        this._current += (this._target - this._current) * 0.25;
        this._applyCut();
      }
      this._raf = requestAnimationFrame(this._animate);
    };
    _applyCut() {
      const v = Math.round(this._current);
      this.$vp.style.setProperty("--cut", `${this._current}%`);
      this.$handle.style.left = `${this._current}%`;
      this.$slider.value = v;
      this.$knob.setAttribute("aria-valuenow", String(v));
    }
  };
  customElements.define("ba-slider", BeforeAfter);

  // src/components/drawer.js
  var SiteDrawer = class extends HTMLElement {
    connectedCallback() {
      this.attachShadow({ mode: "open" });
      const style = (
        /*css*/
        `
      :host { display: contents; }
      .drawer{position:fixed;inset:0;display:none;z-index:2000}
      .drawer.open{display:block}
      .shade{position:absolute;inset:0;background:rgba(0,0,0,.8)}
      .panel{
        position:absolute;right:0;top:0;height:100%;width:min(84vw,380px);
        background:linear-gradient(180deg, color-mix(in oklab, var(--bg), #fff 4%), color-mix(in oklab, var(--ghost), var(--bg)));
        border-left:1px solid color-mix(in oklab, var(--line), #000 6%);
        box-shadow:-12px 0 30px rgba(0,0,0,.22);
        padding:18px 16px;display:flex;flex-direction:column;gap:14px
      }
      .menu-list{background:linear-gradient(180deg, color-mix(in oklab, var(--ghost), #fff 10%), color-mix(in oklab, var(--ghost-2), var(--bg)));padding:10px;border-radius:16px;box-shadow:0 8px 18px color-mix(in oklab, var(--brand) 16%, transparent)}
      .menu-list ::slotted(a){display:block;padding:14px;border-radius:12px;font-weight:900;color:color-mix(in oklab, var(--ink), #000 5%)}
      .topbar{display:flex;justify-content:flex-end}
      .btn{background:color-mix(in oklab, var(--ghost), var(--bg));border:1px solid var(--line);padding:8px 12px;border-radius:10px;cursor:pointer}
    `
      );
      const html = (
        /*html*/
        `
      <style>${style}</style>
      <div class="drawer" id="drawer" aria-hidden="true">
        <div class="shade" id="shade" part="shade"></div>
        <div class="panel" role="dialog" aria-modal="true" aria-label="Menu">
          <div class="topbar"><button class="btn" id="close">Close</button></div>
          <div class="menu-list"><slot></slot></div>
          <div style="display:flex;gap:10px;margin-top:8px"><slot name="footer"></slot></div>
        </div>
      </div>
    `
      );
      this.shadowRoot.innerHTML = html;
      this.$drawer = this.shadowRoot.getElementById("drawer");
      this.shadowRoot.getElementById("shade").addEventListener("click", () => this.close());
      this.shadowRoot.getElementById("close").addEventListener("click", () => this.close());
      this.addEventListener("open", () => this.open());
      this.addEventListener("close", () => this.close());
    }
    open() {
      this.$drawer.classList.add("open");
      this.$drawer.setAttribute("aria-hidden", "false");
      document.body.classList.add("no-scroll");
    }
    close() {
      this.$drawer.classList.remove("open");
      this.$drawer.setAttribute("aria-hidden", "true");
      document.body.classList.remove("no-scroll");
    }
  };
  customElements.define("site-drawer", SiteDrawer);

  // src/components/quote-modal.js
  var QuoteModal = class extends HTMLElement {
    connectedCallback() {
      this.attachShadow({ mode: "open" });
      const style = (
        /*css*/
        `
      :host{display:contents}
      .modal{position:fixed;inset:0;display:none;align-items:center;justify-content:center;z-index:3000}
      .modal.open{display:flex}
      .overlay{position:absolute;inset:0;background:rgba(0,0,0,.55);backdrop-filter:blur(3px)}
      .dialog{position:relative;z-index:1;width:min(680px,92vw);background:var(--bg);border-radius:16px;border:1px solid var(--line);box-shadow:var(--shadow);padding:20px}
      .close{margin-left:auto;background:var(--ghost);border:1px solid var(--line);padding:8px 12px;border-radius:10px;cursor:pointer}
      form{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px}
      form .full{grid-column:1/-1}
      input,select,textarea{width:100%;padding:10px 12px;border:1px solid var(--line);border-radius:10px;background:var(--bg);color:var(--ink)}
      textarea{min-height:110px;resize:vertical}
      .btn{display:inline-flex;align-items:center;gap:8px;padding:12px 16px;border-radius:12px;font-weight:900;border:0;cursor:pointer}
      .primary{background:linear-gradient(90deg,var(--brand),var(--brand-2));color:#fff}
      .secondary{background:var(--bg);border:1px solid var(--line);color:color-mix(in oklab, var(--ink), #000 10%)}
      .muted{color:var(--muted)}
      .danger{color:#c0392b}
      .row{display:flex;align-items:center;gap:10px;margin-bottom:8px}
    `
      );
      const html = (
        /*html*/
        `
      <style>${style}</style>
      <div class="modal" id="m" aria-hidden="true" role="dialog" aria-modal="true" aria-labelledby="qt">
        <div class="overlay" id="ov"></div>
        <div class="dialog">
          <div class="row"><h3 id="qt" style="margin:0;font-size:22px">Request a Quote</h3><button class="close" id="x" type="button" aria-label="Close quote form">Close</button></div>
          <form id="f" novalidate>
            <div><label for="name">Full name</label><input id="name" name="name" autocomplete="name" required /></div>
            <div><label for="phone">Phone</label><input id="phone" name="phone" inputmode="tel" autocomplete="tel" required /></div>
            <div><label for="email">Email</label><input id="email" name="email" type="email" autocomplete="email" /></div>
            <div><label for="vehicle">Year / Make / Model</label><input id="vehicle" name="vehicle" placeholder="2024 Honda Civic" required /></div>
            <div><label for="service">Service</label>
              <select id="service" name="service" required>
                <option value="">Select\u2026</option>
                <option>Window Tint</option>
                <option>Vehicle Wrap</option>
                <option>Paint Protection Film</option>
                <option>Leather / Upholstery</option>
                <option>Heated Seats</option>
                <option>Other</option>
              </select>
            </div>
            <div><label for="date">Preferred date</label><input id="date" name="preferred_date" type="date" /></div>
            <div class="full"><label for="details">Notes</label><textarea id="details" name="details" placeholder="Tell us what you\u2019d like done and any goals (shade, brand, budget)."></textarea></div>
            <input type="text" name="company" style="display:none" tabindex="-1" autocomplete="off" aria-hidden="true" />
            <div class="full" style="display:flex;gap:10px;align-items:center">
              <button class="btn primary" type="submit">Send Request</button>
              <button class="btn secondary" type="button" id="cancel">Cancel</button>
              <span class="muted" id="msg" role="status" aria-live="polite"></span>
            </div>
          </form>
          <p class="danger" id="err" aria-live="assertive" style="display:none;margin-top:8px">Please complete required fields.</p>
        </div>
      </div>
    `
      );
      this.shadowRoot.innerHTML = html;
      this.$m = this.shadowRoot.getElementById("m");
      this.$f = this.shadowRoot.getElementById("f");
      this.$msg = this.shadowRoot.getElementById("msg");
      this.$err = this.shadowRoot.getElementById("err");
      this.shadowRoot.getElementById("x").addEventListener("click", () => this.close());
      this.shadowRoot.getElementById("cancel").addEventListener("click", () => this.close());
      this.shadowRoot.getElementById("ov").addEventListener("click", () => this.close());
      window.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && this.opened) this.close();
      });
      this.$f.addEventListener("submit", (e) => {
        e.preventDefault();
        this.$err.style.display = "none";
        this.$msg.textContent = "";
        const req = ["name", "phone", "vehicle", "service"];
        const ok = req.every(
          (id) => this.shadowRoot.getElementById(id).value.trim() !== ""
        );
        if (!ok) {
          this.$err.style.display = "block";
          return;
        }
        const F = this.$f;
        const body = encodeURIComponent(
          `Name: ${F.name.value}
Phone: ${F.phone.value}
Email: ${F.email.value}
Vehicle: ${F.vehicle.value}
Service: ${F.service.value}
Preferred date: ${F.preferred_date.value}
Notes: ${F.details.value}`
        );
        window.location.href = `mailto:info@nwautosupreme.com?subject=Quote%20Request&body=${body}`;
        this.$msg.textContent = "Opening your email app\u2026";
        this.dispatchEvent(
          new CustomEvent("quote:submitted", {
            bubbles: true,
            detail: {
              name: F.name.value,
              phone: F.phone.value,
              email: F.email.value,
              vehicle: F.vehicle.value,
              service: F.service.value
            }
          })
        );
        setTimeout(() => {
          this.close();
          this.$f.reset();
        }, 400);
      });
    }
    get opened() {
      return this.$m?.classList.contains("open");
    }
    open() {
      this.$m.classList.add("open");
      this.$m.setAttribute("aria-hidden", "false");
      this.shadowRoot.getElementById("name")?.focus();
    }
    close() {
      this.$m.classList.remove("open");
      this.$m.setAttribute("aria-hidden", "true");
    }
  };
  customElements.define("quote-modal", QuoteModal);

  // src/components/reviews.js
  var ReviewsGrid = class extends HTMLElement {
    connectedCallback() {
      if (!this.children.length) {
        this.innerHTML = `
        <review-card stars="5" name="Jamie L." meta="2024 Honda Accord \u2022 Tint + Leather">
          My Accord looks brand new. Edges are tight and no dust trapped. They also upgraded me to Alea leather and it feels factory.
          <owner-reply>Appreciate you, Jamie. If you want a ceramic upgrade later, we\u2019ll credit part of today\u2019s install.</owner-reply>
        </review-card>
      `;
      }
    }
  };
  var ReviewCard = class extends HTMLElement {
    connectedCallback() {
      const name = this.getAttribute("name") || "Customer";
      const stars = Number(this.getAttribute("stars") || 5);
      const meta = this.getAttribute("meta") || "";
      const body = this.textContent.trim().replace(/\s+/g, " ");
      const replySlot = Array.from(this.children).find(
        (n) => n.tagName.toLowerCase() === "owner-reply"
      );
      const replyHtml = replySlot ? `<div class="owner-reply"><strong>Owner reply</strong> \xB7 ${replySlot.innerHTML}</div>` : "";
      this.innerHTML = `
      <article class="review-card">
        <div class="review-head">
          <div class="avatar a1">${(name.match(/\b(\w)/g) || ["?"]).slice(0, 2).join("").toUpperCase()}</div>
          <div>
            <div style="font-weight:900">${name} <span class="stars">${"\u2605".repeat(
        stars
      )}</span></div>
            <div class="vehicle">
              <svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M3 13l1-3c.3-.9 1.2-1.5 2.1-1.5h7.5c.9 0 1.8.6 2.1 1.5l1 3H21a1 1 0 110 2h-1.2a2.5 2.5 0 11-5 0H9.2a2.5 2.5 0 11-5 0H3a1 1 0 110-2h0z"/></svg>
              ${meta}
            </div>
          </div>
        </div>
        <p class="review-body clamp" data-clamp>${body}</p>
        <button class="expand" type="button">Read more</button>
        ${replyHtml}
      </article>
    `;
      const btn = this.querySelector(".expand");
      const p = this.querySelector("[data-clamp]");
      btn.addEventListener("click", () => {
        const clamped = p.classList.contains("clamp");
        if (clamped) {
          p.classList.remove("clamp");
          btn.textContent = "Show less";
        } else {
          p.classList.add("clamp");
          btn.textContent = "Read more";
        }
      });
    }
  };
  customElements.define("reviews-grid", ReviewsGrid);
  customElements.define("review-card", ReviewCard);

  // src/components/theme-toggle.js
  var ThemeToggle = class extends HTMLElement {
    connectedCallback() {
      this.attachShadow({ mode: "open" });
      const style = (
        /*css*/
        `
      :host{display:inline-grid}
      button{background:color-mix(in oklab, var(--ghost), var(--bg));border:1px solid var(--line);
        width:42px;height:42px;border-radius:10px;display:grid;place-items:center;cursor:pointer}
      svg{width:22px;height:22px}
    `
      );
      const html = (
        /*html*/
        `
      <style>${style}</style>
      <button id="b" aria-label="Toggle theme" title="Toggle theme">
        <svg id="i" viewBox="0 0 24 24" fill="currentColor"></svg>
      </button>
    `
      );
      this.shadowRoot.innerHTML = html;
      this.$btn = this.shadowRoot.getElementById("b");
      this.$icon = this.shadowRoot.getElementById("i");
      const renderIcon = () => {
        const isDark = document.body.classList.contains("dark");
        const sun = '<circle cx="12" cy="12" r="5"/><g><line x1="12" y1="1" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="23"/><line x1="1" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="23" y2="12"/><line x1="4.2" y1="4.2" x2="6.3" y2="6.3"/><line x1="17.7" y1="17.7" x2="19.8" y2="19.8"/><line x1="4.2" y1="19.8" x2="6.3" y2="17.7"/><line x1="17.7" y1="6.3" x2="19.8" y2="4.2"/></g>';
        const moon = '<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>';
        this.$icon.innerHTML = isDark ? sun : moon;
      };
      this.$btn.addEventListener("click", () => {
        document.dispatchEvent(
          new CustomEvent("theme:toggle", { bubbles: true })
        );
        document.body.classList.toggle("dark");
        document.dispatchEvent(
          new CustomEvent("theme:changed", { bubbles: true })
        );
        renderIcon();
      });
      document.addEventListener("theme:changed", renderIcon);
      renderIcon();
    }
  };
  customElements.define("theme-toggle", ThemeToggle);

  // src/app.js
  var $ = (sel, root = document) => root.querySelector(sel);
  var $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
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
  var THEME_KEY = "nw-theme";
  function applyTheme(mode) {
    document.body.classList.toggle("dark", mode === "dark");
  }
  function loadTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "dark" || saved === "light") {
      applyTheme(saved);
    } else {
      const prefers = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      applyTheme(prefers);
    }
  }
  function saveTheme() {
    const mode = document.body.classList.contains("dark") ? "dark" : "light";
    localStorage.setItem(THEME_KEY, mode);
  }
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
  function setupQuoteModal() {
    const modalEl = $("quote-modal");
    on("click", "[data-open-modal]", (e) => {
      e.preventDefault();
      if (modalEl?.open) modalEl.open();
      else {
        const legacy = $("#quoteModal");
        if (legacy) {
          legacy.classList.add("open");
          legacy.setAttribute("aria-hidden", "false");
          const firstInput = legacy.querySelector("input,select,textarea,button");
          if (firstInput) firstInput.focus();
        }
      }
    });
    if (modalEl) {
      modalEl.addEventListener("quote:submitted", (e) => {
      });
    }
  }
  function setupDrawerBridge() {
    const drawerEl = $("site-drawer");
    if (drawerEl) return;
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
      $$("[data-close]", drawer).forEach(
        (a) => a.addEventListener("click", close)
      );
    }
  }
  function setupThemeToggle() {
    loadTheme();
    document.addEventListener("theme:toggle", () => {
      document.body.classList.toggle("dark");
      saveTheme();
    });
    document.addEventListener("theme:set", (e) => {
      const mode = e.detail === "dark" ? "dark" : "light";
      applyTheme(mode);
      saveTheme();
    });
    const modeBtns = ["#modeToggle", "#modeToggleMobile"].map((sel) => $(sel)).filter(Boolean);
    modeBtns.forEach(
      (btn) => btn.addEventListener("click", () => {
        document.body.classList.toggle("dark");
        saveTheme();
        document.dispatchEvent(new CustomEvent("theme:changed"));
      })
    );
  }
  function setupReviews() {
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
      btn.textContent = el.classList.contains("open") ? "Show less" : "More details";
    });
  }
  function setupGallery() {
    const slider = $("ba-slider") || $("#ba");
    const thumbs = $("#thumbs");
    if (!thumbs) return;
    on("click", "#thumbs [data-key]", (e, btn) => {
      const key = btn.dataset.key;
      if (!key) return;
      if (slider && typeof slider.applyPreset === "function") {
        slider.applyPreset(key);
        if (typeof slider.animateTo === "function") slider.animateTo(50);
        return;
      }
      if (window.applyPreset) window.applyPreset(key);
      if (window.animate) window.animate();
    });
    const viewMore = $("#viewMore");
    if (viewMore)
      viewMore.addEventListener("click", (e) => {
        e.preventDefault();
      });
  }
  function setCurrentYear() {
    const y = $("#year");
    if (y) y.textContent = (/* @__PURE__ */ new Date()).getFullYear();
  }
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
})();
//# sourceMappingURL=app.js.map
