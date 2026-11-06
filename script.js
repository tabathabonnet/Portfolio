// ============================================
// Menu mobile
// ============================================
const navToggle = document.querySelector(".nav-toggle");
const mainNav = document.querySelector(".main-nav");

if (navToggle && mainNav) {
  navToggle.addEventListener("click", () => {
    const open = mainNav.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    navToggle.textContent = open ? "Fermer" : "Menu";
  });
}

// ============================================
// Page d'accueil — aperçu au survol de l'index de travaux
// ============================================
const preview = document.querySelector(".hover-preview");
const previewImg = preview ? preview.querySelector("img") : null;
const indexRows = document.querySelectorAll(".index-row");

if (preview && previewImg && indexRows.length) {
  indexRows.forEach((row) => {
    const src = row.getAttribute("data-thumb");
    row.addEventListener("mouseenter", () => {
      if (src) previewImg.setAttribute("src", src);
      preview.classList.add("active");
    });
    row.addEventListener("mouseleave", () => {
      preview.classList.remove("active");
    });
  });

  document.addEventListener("mousemove", (e) => {
    preview.style.left = e.clientX + "px";
    preview.style.top = e.clientY + "px";
  });
}

// ============================================
// Page projets — filtres par catégorie
// ============================================
const filterButtons = document.querySelectorAll(".filter-btn");
const workCards = document.querySelectorAll(".work-card");

if (filterButtons.length && workCards.length) {
  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const filter = btn.getAttribute("data-filter");

      workCards.forEach((card) => {
        const cats = (card.getAttribute("data-category") || "").split(/\s+/).filter(Boolean);
        const show = filter === "all" || cats.includes(filter);
        card.hidden = !show;
      });
    });
  });
}
