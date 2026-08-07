const comparisonStates = {
  before: {
    label: "До обработки",
    html: "“Отправим <mark>смс</mark>, когда заказ будет готов...”",
  },
  after: {
    label: "После обработки",
    html: "<span class=\"changed-mark\">«</span>Отправим <mark>смс</mark>, когда заказ будет готов<span class=\"changed-mark\">…»</span>",
  },
};

document.querySelectorAll("[data-comparison]").forEach((button) => {
  button.addEventListener("click", () => {
    const state = comparisonStates[button.dataset.comparison];
    document.querySelectorAll("[data-comparison]").forEach((item) => {
      const isActive = item === button;
      item.classList.toggle("active", isActive);
      item.setAttribute("aria-pressed", String(isActive));
    });
    document.querySelector("#comparison-label").textContent = state.label;
    document.querySelector("#comparison-text").innerHTML = state.html;
  });
});

const scopeStates = {
  layer: { title: "Выбран текстовый слой", description: "Обрабатывается только он." },
  frame: { title: "Выбран фрейм или компонент", description: "Обрабатываются текстовые слои внутри." },
  page: { title: "Ничего не выбрано", description: "Обрабатывается текущая страница — не весь файл." },
};

document.querySelectorAll("[data-scope]").forEach((button) => {
  button.addEventListener("click", () => {
    const scope = button.dataset.scope;
    const state = scopeStates[scope];
    document.querySelectorAll("[data-scope]").forEach((item) => {
      const isActive = item === button;
      item.classList.toggle("active", isActive);
      item.setAttribute("aria-pressed", String(isActive));
    });
    document.querySelector("[data-scope-visual]").dataset.scopeVisual = scope;
    document.querySelector("#scope-title").textContent = state.title;
    document.querySelector("#scope-description").textContent = state.description;
  });
});

document.querySelectorAll("[data-report-row]").forEach((row) => {
  row.addEventListener("click", () => {
    document.querySelectorAll("[data-report-row]").forEach((item) => {
      item.classList.toggle("selected", item === row);
    });
  });
});
