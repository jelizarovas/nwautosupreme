// <quote-modal> — Quote request form with validation and mailto handoff
export class QuoteModal extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: "open" });
    const style = /*css*/ `
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
    `;
    const html = /*html*/ `
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
                <option value="">Select…</option>
                <option>Window Tint</option>
                <option>Vehicle Wrap</option>
                <option>Paint Protection Film</option>
                <option>Leather / Upholstery</option>
                <option>Heated Seats</option>
                <option>Other</option>
              </select>
            </div>
            <div><label for="date">Preferred date</label><input id="date" name="preferred_date" type="date" /></div>
            <div class="full"><label for="details">Notes</label><textarea id="details" name="details" placeholder="Tell us what you’d like done and any goals (shade, brand, budget)."></textarea></div>
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
    `;
    this.shadowRoot.innerHTML = html;

    this.$m = this.shadowRoot.getElementById("m");
    this.$f = this.shadowRoot.getElementById("f");
    this.$msg = this.shadowRoot.getElementById("msg");
    this.$err = this.shadowRoot.getElementById("err");

    this.shadowRoot
      .getElementById("x")
      .addEventListener("click", () => this.close());
    this.shadowRoot
      .getElementById("cancel")
      .addEventListener("click", () => this.close());
    this.shadowRoot
      .getElementById("ov")
      .addEventListener("click", () => this.close());
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
        `Name: ${F.name.value}\nPhone: ${F.phone.value}\nEmail: ${F.email.value}\n` +
          `Vehicle: ${F.vehicle.value}\nService: ${F.service.value}\nPreferred date: ${F.preferred_date.value}\nNotes: ${F.details.value}`
      );
      window.location.href = `mailto:info@nwautosupreme.com?subject=Quote%20Request&body=${body}`;
      this.$msg.textContent = "Opening your email app…";
      this.dispatchEvent(
        new CustomEvent("quote:submitted", {
          bubbles: true,
          detail: {
            name: F.name.value,
            phone: F.phone.value,
            email: F.email.value,
            vehicle: F.vehicle.value,
            service: F.service.value,
          },
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
}
customElements.define("quote-modal", QuoteModal);
