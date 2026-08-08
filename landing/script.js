const visualRedesign = document.createElement("link");
visualRedesign.rel = "stylesheet";
visualRedesign.href = "./visual-redesign.css?v=20260808-1";
document.head.appendChild(visualRedesign);

document.querySelectorAll("[data-report-row]").forEach((row) => {
  row.addEventListener("click", () => {
    document.querySelectorAll("[data-report-row]").forEach((item) => {
      item.classList.toggle("selected", item === row);
    });
  });
});
