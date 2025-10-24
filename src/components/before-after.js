// <ba-slider> — Before/After slider with draggable knob, presets, and smooth animation
export class BeforeAfter extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._current = 50;
    this._target = 50;
    this._dragging = false;
    this._raf = null;
    this._presets = {
      tint: {
        label: "Window Tint • 35% on front, 20% rear",
        before: "linear-gradient(135deg,rgba(5,25,60,.9),rgba(15,35,85,.9))",
        after: "linear-gradient(135deg,#a6b6d6,#eaf0ff)",
      },
      wraps: {
        label: "Wrap • Satin blue over OEM paint",
        before: "linear-gradient(135deg,#0A63FF,#3B82F6)",
        after: "linear-gradient(135deg,#343a40,#8a8f96)",
      },
      ppf: {
        label: "PPF • Front clip protection",
        before:
          "linear-gradient(135deg,rgba(230,240,255,.8),rgba(255,255,255,.95))",
        after: "linear-gradient(135deg,#d9e3ff,#ffffff)",
      },
      leather: {
        label: "Leather • Alea custom diamond stitch",
        before: "linear-gradient(135deg,#111,#444)",
        after: "linear-gradient(135deg,#b7b7b7,#e6e6e6)",
      },
      chrome: {
        label: "Chrome delete • Gloss black trim",
        before: "linear-gradient(135deg,#0f172a,#1e2a44)",
        after: "linear-gradient(135deg,#c8d2e3,#f4f7ff)",
      },
      heaters: {
        label: "Heated seats • Factory-look switch",
        before: "linear-gradient(135deg,#273042,#4a5a7a)",
        after: "linear-gradient(135deg,#d7dee9,#ffffff)",
      },
      fleet: {
        label: "Fleet • Vinyl branding application",
        before: "linear-gradient(135deg,#0A63FF,#00E0FF)",
        after: "linear-gradient(135deg,#e6f2ff,#ffffff)",
      },
      custom: {
        label: "Custom • Two-tone interior accents",
        before: "linear-gradient(135deg,#7C3AED,#3B82F6)",
        after: "linear-gradient(135deg,#f2f2f2,#ffffff)",
      },
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
    const style = /*css*/ `
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
    `;
    const html = /*html*/ `
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
    `;
    this.shadowRoot.innerHTML = html;

    this.$vp = this.shadowRoot.getElementById("vp");
    this.$before = this.shadowRoot.getElementById("before");
    this.$after = this.shadowRoot.getElementById("after");
    this.$slider = this.shadowRoot.getElementById("slider");
    this.$handle = this.shadowRoot.getElementById("handle");
    this.$knob = this.shadowRoot.getElementById("knob");
    this.$label = this.shadowRoot.getElementById("label");

    this.applyPreset(preset);
    this._animate(); // start animation loop for smoothing

    // range input
    this.$slider.addEventListener("input", (e) => {
      this.animateTo(Number(e.target.value));
    });

    // pointer drag on viewport and knob
    const pctFromEvent = (e) => {
      const r = this.$vp.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
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

    // keyboard for knob
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
    const done =
      !this._dragging && Math.abs(this._target - this._current) < 0.05;
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
}

customElements.define("ba-slider", BeforeAfter);
