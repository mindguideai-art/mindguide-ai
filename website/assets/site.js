// MindGuide AI website: menu, mood check-in, copy buttons and the contact form.
(function () {
  // Mobile menu
  var btn = document.querySelector(".menu-btn");
  var menu = document.getElementById("mobile-menu");
  if (btn && menu) {
    btn.addEventListener("click", function () {
      var open = menu.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  // Mood check-in (same 1–10 scale the app uses)
  var range = document.getElementById("mood");
  if (range) {
    var out = document.getElementById("mood-value");
    var word = document.getElementById("mood-word");
    var reply = document.getElementById("mood-reply");
    var states = { 1: "Very low", 2: "Very low", 3: "Low", 4: "Low", 5: "Okay", 6: "Okay", 7: "Good", 8: "Good", 9: "Very good", 10: "Very good" };
    var replies = {
      1: '<strong class="urgent">You don’t have to face this alone.</strong> If you feel unsafe right now, call <strong>112</strong> or go to the nearest hospital. When you’re ready, a therapist can help you through what you’re carrying.',
      3: "<strong>Low days are heavy.</strong> Talking to someone who understands can make them lighter. You can book a private session for as soon as tomorrow.",
      5: "<strong>Okay is a good place to start.</strong> Therapy isn’t only for hard times. It helps you understand yourself and stay steady.",
      7: "<strong>Glad you’re feeling good.</strong> Keep building on it. Regular check-ins with a therapist help you protect your peace when life gets busy.",
      9: "<strong>That’s wonderful.</strong> Track your mood in the app to see what keeps you well, and come back whenever you need support."
    };
    var pick = function (v) { return v <= 2 ? 1 : v <= 4 ? 3 : v <= 6 ? 5 : v <= 8 ? 7 : 9; };
    var update = function () {
      var v = Number(range.value);
      out.textContent = v;
      word.textContent = states[v];
      reply.innerHTML = replies[pick(v)];
      range.setAttribute("aria-valuetext", v + " out of 10, " + states[v]);
    };
    range.addEventListener("input", update);
    update();
  }

  // Copy buttons
  document.querySelectorAll("[data-copy]").forEach(function (b) {
    b.addEventListener("click", function () {
      var text = b.getAttribute("data-copy");
      var done = function () { var t = b.textContent; b.textContent = "Copied"; setTimeout(function () { b.textContent = t; }, 1500); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () { selectText(b.previousElementSibling); });
      } else { selectText(b.previousElementSibling); }
    });
  });
  function selectText(el) {
    if (!el) return;
    var r = document.createRange(); r.selectNodeContents(el);
    var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
  }

  // Contact form: opens the visitor's email app with the message filled in.
  var form = document.getElementById("contact-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var f = new FormData(form);
      var to = form.getAttribute("data-to");
      var subject = "[" + f.get("topic") + "] Message from " + f.get("name");
      var body = f.get("message") + "\n\n" + f.get("name") + "\n" + f.get("email") + (f.get("phone") ? "\n" + f.get("phone") : "");
      var status = document.getElementById("form-status");
      status.hidden = false;
      status.innerHTML = "Your email app should open with your message ready to send. If it doesn’t, email us at <strong>" + to + "</strong>.";
      window.location.href = "mailto:" + to + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    });
  }

  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();

// Light / dark mode: follows the device until the visitor chooses, then remembers the choice.
(function () {
  var root = document.documentElement;
  function current() {
    var t = root.getAttribute("data-theme");
    if (t) return t;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  document.querySelectorAll("[data-theme-toggle]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var next = current() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("mg-theme", next); } catch (e) {}
    });
  });
})();

// Survey announcement bar: shown until the visitor closes it.
(function () {
  var bar = document.querySelector("[data-survey-bar]");
  if (!bar) return;
  var hidden = false;
  try { hidden = localStorage.getItem("mg-survey-bar") === "hidden"; } catch (e) {}
  if (!hidden) bar.hidden = false;
  var close = bar.querySelector("[data-survey-close]");
  if (close) close.addEventListener("click", function () {
    bar.hidden = true;
    try { localStorage.setItem("mg-survey-bar", "hidden"); } catch (e) {}
  });
})();
