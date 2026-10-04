document.querySelectorAll("[data-report-row]").forEach((row) => {
  row.addEventListener("click", () => {
    document.querySelectorAll("[data-report-row]").forEach((item) => {
      item.classList.toggle("selected", item === row);
    });
  });
});
