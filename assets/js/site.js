// Karo0 — interactive behaviour
(function () {
  "use strict";

  /* ---- Mobile nav toggle ------------------------------------------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  /* ---- Search modal ------------------------------------------------ */
  var modal = document.querySelector("[data-search-modal]");
  var openBtns = document.querySelectorAll("[data-search-open]");
  var closeEls = document.querySelectorAll("[data-search-close]");

  function openSearch() {
    if (!modal) return;
    modal.hidden = false;
    if (window.__initPagefind) window.__initPagefind();
    var input = modal.querySelector("input");
    if (input) input.focus();
  }
  function closeSearch() { if (modal) modal.hidden = true; }

  openBtns.forEach(function (b) { b.addEventListener("click", openSearch); });
  closeEls.forEach(function (b) { b.addEventListener("click", closeSearch); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeSearch();
    if (e.key === "/" && document.activeElement.tagName !== "INPUT") {
      e.preventDefault();
      openSearch();
    }
  });

  /* ---- CTF tag filtering ------------------------------------------- */
  var filter = document.querySelector("[data-tag-filter]");
  if (filter) {
    var cards = document.querySelectorAll(".post-card[data-tags]");
    filter.addEventListener("click", function (e) {
      var chip = e.target.closest(".tag-chip");
      if (!chip) return;
      filter.querySelectorAll(".tag-chip").forEach(function (c) { c.classList.remove("is-active"); });
      chip.classList.add("is-active");
      var tag = chip.getAttribute("data-tag");
      cards.forEach(function (card) {
        var tags = (card.getAttribute("data-tags") || "").split(" ");
        card.style.display = (tag === "all" || tags.indexOf(tag) !== -1) ? "" : "none";
      });
    });
  }

  /* ---- Hero constellation ------------------------------------------ */
  var canvas = document.querySelector("[data-constellation]");
  var field = document.querySelector("[data-stars]");
  if (canvas && field && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var ctx = canvas.getContext("2d");
    var points = [];
    var mouse = { x: -9999, y: -9999, active: false };

    function measure() {
      var rect = field.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      points = [];
      field.querySelectorAll(".star").forEach(function (s) {
        var r = s.getBoundingClientRect();
        points.push({
          x: r.left - rect.left + r.width / 2,
          y: r.top - rect.top + r.height / 2
        });
      });
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!mouse.active) return;
      // Stars near the cursor become eligible...
      var near = points.filter(function (p) {
        return Math.hypot(p.x - mouse.x, p.y - mouse.y) < 110;
      });
      // ...and connect to each other when close enough.
      ctx.strokeStyle = "rgba(255,246,234,0.35)";
      ctx.lineWidth = 0.75;
      for (var i = 0; i < near.length; i++) {
        for (var j = i + 1; j < near.length; j++) {
          if (Math.hypot(near[i].x - near[j].x, near[i].y - near[j].y) < 90) {
            ctx.beginPath();
            ctx.moveTo(near[i].x, near[i].y);
            ctx.lineTo(near[j].x, near[j].y);
            ctx.stroke();
          }
        }
      }
    }

    var hero = canvas.closest(".hero");
    hero.addEventListener("mousemove", function (e) {
      var rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
      draw();
    });
    hero.addEventListener("mouseleave", function () {
      mouse.active = false;
      draw();
    });

    measure();
    window.addEventListener("resize", function () { measure(); draw(); });
  }
})();
