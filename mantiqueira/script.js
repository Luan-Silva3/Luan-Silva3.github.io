const menuToggle = document.getElementById("menuToggle");
const nav = document.getElementById("nav");

menuToggle?.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

document.querySelectorAll("#nav a").forEach(link => {
  link.addEventListener("click", () => {
    nav.classList.remove("open");
    menuToggle?.setAttribute("aria-expanded", "false");
  });
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll(".reveal").forEach(el => observer.observe(el));

document.getElementById("year").textContent = new Date().getFullYear();

const form = document.getElementById("contactForm");

form?.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = document.getElementById("name").value.trim();
  const eventType = document.getElementById("eventType").value;
  const date = document.getElementById("date").value;
  const message = document.getElementById("message").value.trim();

  const formattedDate = date
    ? new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR")
    : "a definir";

  const text =
`Olá! Vim pelo site da Mantiqueira Drinks.

Meu nome: ${name}
Tipo de evento: ${eventType}
Data: ${formattedDate}
Mensagem: ${message || "Gostaria de receber um orçamento."}`;

  window.open(
    `https://wa.me/5522992834971?text=${encodeURIComponent(text)}`,
    "_blank",
    "noopener"
  );
});


// Carta de drinks: os drinks disponíveis são carregados diretamente do Supabase.
async function loadPublicDrinks() {
  const grid = document.getElementById("drinksGrid");
  if (!grid) return;

  try {
    const config = window.MANTIQUEIRA_CONFIG;
    if (!config || !window.supabase) throw new Error("Configuração do Supabase não encontrada.");

    const client = window.supabase.createClient(
      config.SUPABASE_URL,
      config.SUPABASE_PUBLISHABLE_KEY
    );

    const { data, error } = await client
      .from("drinks")
      .select("id, name, category, description, ingredients, price, image_url")
      .eq("available", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      grid.innerHTML = '<div class="drinks-empty">Nossa carta está sendo preparada. Entre em contato para conhecer as opções disponíveis.</div>';
      return;
    }

    grid.innerHTML = data.map(drink => {
      const image = drink.image_url
        ? `<div class="drink-image"><img src="${escapeHtml(drink.image_url)}" alt="${escapeHtml(drink.name)}" loading="lazy"></div>`
        : '<div class="drink-image no-image">Foto em breve</div>';

      const price = drink.price !== null && drink.price !== undefined
        ? Number(drink.price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
        : "Sob consulta";

      return `
        <article class="drink-card reveal">
          ${image}
          <div class="drink-body">
            <span class="drink-category">${escapeHtml(drink.category || "Drink")}</span>
            <h3 class="drink-name">${escapeHtml(drink.name)}</h3>
            ${drink.description ? `<p class="drink-description">${escapeHtml(drink.description)}</p>` : ""}
            ${drink.ingredients ? `<p class="drink-ingredients">${escapeHtml(drink.ingredients)}</p>` : ""}
            <div class="drink-footer">
              <strong class="drink-price">${price}</strong>
              <a class="drink-quote" href="https://wa.me/5522992834971?text=${encodeURIComponent(`Olá! Gostaria de saber mais sobre o drink ${drink.name} para meu evento.`)}" target="_blank" rel="noopener">Consultar ↗</a>
            </div>
          </div>
        </article>`;
    }).join("");

    grid.querySelectorAll(".reveal").forEach(el => observer.observe(el));
  } catch (error) {
    console.error("Erro ao carregar drinks:", error);
    grid.innerHTML = '<div class="drinks-error">Não foi possível carregar a carta agora. Entre em contato pelo WhatsApp para conhecer os drinks.</div>';
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

loadPublicDrinks();
