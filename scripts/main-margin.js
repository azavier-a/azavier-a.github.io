let nav = document.querySelector("nav");
let main = document.querySelector("main");

nav.addEventListener("mouseenter", (event) => {
  main.style.marginLeft = "var(--nav-width-hover)";
});

nav.addEventListener("mouseleave", (event) => {
  main.style.marginLeft = "var(--nav-width)";
});