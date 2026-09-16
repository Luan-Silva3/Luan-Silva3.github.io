const menuButton = document.getElementById("menuButton");
const nav = document.getElementById("nav");
const header = document.querySelector(".header");

/* MENU MOBILE */
menuButton.addEventListener("click", () => {
  nav.classList.toggle("active");
  menuButton.setAttribute("aria-expanded", nav.classList.contains("active"));
});

document.querySelectorAll(".nav a").forEach(link => {
  link.addEventListener("click", () => nav.classList.remove("active"));
});

/* HEADER */
function updateHeader() {
  header.classList.toggle("scrolled", window.scrollY > 45);
}
window.addEventListener("scroll", updateHeader, { passive: true });
updateHeader();

/* REVEAL ON SCROLL */
const reveals = document.querySelectorAll(".reveal");
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("active");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
reveals.forEach(el => observer.observe(el));

/* FILTRO DO PORTFÓLIO */
const filterButtons = document.querySelectorAll(".filter-btn");
const portfolioItems = document.querySelectorAll(".gallery-item");

filterButtons.forEach(button => {
  button.addEventListener("click", () => {
    filterButtons.forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");

    const filter = button.dataset.filter;

    portfolioItems.forEach(item => {
      const show = filter === "todos" || item.dataset.category === filter;
      item.classList.toggle("hide", !show);
      item.classList.toggle("show", show);
    });
  });
});

/* GALERIA / MODAL */
const modal = document.getElementById("imageModal");
const modalImage = document.getElementById("modalImage");
const modalClose = document.getElementById("modalClose");
const modalLabel = document.getElementById("modalLabel");

portfolioItems.forEach(item => {
  item.addEventListener("click", () => {
    const image = item.dataset.image;
    const title = item.querySelector("h3")?.textContent || "Projeto";

    modalImage.src = image;
    modalImage.alt = title;
    modalLabel.textContent = title.toUpperCase();
    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  });
});

function closeModal() {
  modal.classList.remove("active");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  modalImage.src = "";
}

modalClose.addEventListener("click", closeModal);
modal.addEventListener("click", event => {
  if (event.target === modal) closeModal();
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && modal.classList.contains("active")) closeModal();
});
