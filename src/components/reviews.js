// <reviews-grid> — Reviews with clamp/expand and optional owner reply
export class ReviewsGrid extends HTMLElement {
  connectedCallback() {
    if (!this.children.length) {
      this.innerHTML = `
        <review-card stars="5" name="Jamie L." meta="2024 Honda Accord • Tint + Leather">
          My Accord looks brand new. Edges are tight and no dust trapped. They also upgraded me to Alea leather and it feels factory.
          <owner-reply>Appreciate you, Jamie. If you want a ceramic upgrade later, we’ll credit part of today’s install.</owner-reply>
        </review-card>
      `;
    }
  }
}

export class ReviewCard extends HTMLElement {
  connectedCallback() {
    const name = this.getAttribute("name") || "Customer";
    const stars = Number(this.getAttribute("stars") || 5);
    const meta = this.getAttribute("meta") || "";
    const body = this.textContent.trim().replace(/\s+/g, " ");
    const replySlot = Array.from(this.children).find(
      (n) => n.tagName.toLowerCase() === "owner-reply"
    );
    const replyHtml = replySlot
      ? `<div class="owner-reply"><strong>Owner reply</strong> · ${replySlot.innerHTML}</div>`
      : "";

    this.innerHTML = `
      <article class="review-card">
        <div class="review-head">
          <div class="avatar a1">${(name.match(/\b(\w)/g) || ["?"])
            .slice(0, 2)
            .join("")
            .toUpperCase()}</div>
          <div>
            <div style="font-weight:900">${name} <span class="stars">${"★".repeat(
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
}

customElements.define("reviews-grid", ReviewsGrid);
customElements.define("review-card", ReviewCard);
