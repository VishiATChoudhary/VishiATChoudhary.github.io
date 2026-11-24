// Theme toggle: dark by default, choice saved in localStorage.
// The initial theme is applied by an inline snippet in <head> to avoid a flash.
document.addEventListener("DOMContentLoaded", function () {
  var btn = document.querySelector(".theme-toggle");
  if (!btn) return;
  var root = document.documentElement;
  function sync() {
    var light = root.dataset.theme === "light";
    btn.setAttribute("aria-label", light ? "Switch to dark theme" : "Switch to light theme");
    btn.setAttribute("aria-pressed", String(light));
  }
  sync();
  btn.addEventListener("click", function () {
    root.dataset.theme = root.dataset.theme === "light" ? "dark" : "light";
    try { localStorage.setItem("theme", root.dataset.theme); } catch (e) {}
    sync();
  });
});
