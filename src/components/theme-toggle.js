// <theme-toggle> — Emits theme:toggle and updates icon automatically
export class ThemeToggle extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: "open" });
    const style = /*css*/ `
      :host{display:inline-grid}
      button{background:color-mix(in oklab, var(--ghost), var(--bg));border:1px solid var(--line);
        width:42px;height:42px;border-radius:10px;display:grid;place-items:center;cursor:pointer}
      svg{width:22px;height:22px}
    `;
    const html = /*html*/ `
      <style>${style}</style>
      <button id="b" aria-label="Toggle theme" title="Toggle theme">
        <svg id="i" viewBox="0 0 24 24" fill="currentColor"></svg>
      </button>
    `;
    this.shadowRoot.innerHTML = html;
    this.$btn = this.shadowRoot.getElementById("b");
    this.$icon = this.shadowRoot.getElementById("i");

    const renderIcon = () => {
      const isDark = document.body.classList.contains("dark");
      const sun =
        '<circle cx="12" cy="12" r="5"/><g><line x1="12" y1="1" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="23"/><line x1="1" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="23" y2="12"/><line x1="4.2" y1="4.2" x2="6.3" y2="6.3"/><line x1="17.7" y1="17.7" x2="19.8" y2="19.8"/><line x1="4.2" y1="19.8" x2="6.3" y2="17.7"/><line x1="17.7" y1="6.3" x2="19.8" y2="4.2"/></g>';
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

    // Update icon when theme changes elsewhere
    document.addEventListener("theme:changed", renderIcon);
    // initial
    renderIcon();
  }
}
customElements.define("theme-toggle", ThemeToggle);
