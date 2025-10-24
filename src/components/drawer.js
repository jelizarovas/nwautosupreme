// <site-drawer> — Mobile drawer with shade and focus trap
export class SiteDrawer extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: "open" });
    const style = /*css*/ `
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
    `;
    const html = /*html*/ `
      <style>${style}</style>
      <div class="drawer" id="drawer" aria-hidden="true">
        <div class="shade" id="shade" part="shade"></div>
        <div class="panel" role="dialog" aria-modal="true" aria-label="Menu">
          <div class="topbar"><button class="btn" id="close">Close</button></div>
          <div class="menu-list"><slot></slot></div>
          <div style="display:flex;gap:10px;margin-top:8px"><slot name="footer"></slot></div>
        </div>
      </div>
    `;
    this.shadowRoot.innerHTML = html;

    this.$drawer = this.shadowRoot.getElementById("drawer");
    this.shadowRoot
      .getElementById("shade")
      .addEventListener("click", () => this.close());
    this.shadowRoot
      .getElementById("close")
      .addEventListener("click", () => this.close());

    // Imperative open/close API
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
}
customElements.define("site-drawer", SiteDrawer);
