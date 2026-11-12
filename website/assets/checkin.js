/* Free check-in: scores the answers in the browser. Nothing is sent anywhere unless the person chooses to create an account. */
(function () {
  var form = document.getElementById("checkin");
  var box = document.getElementById("ck-result");
  if (!form || !box) return;
  var IDS = ["interest", "down", "nervous", "worry", "sleep", "stress", "selfharm"];
  var APP = (window.MG_APP_URL || "https://mindguide-ai.vercel.app").replace(/\/$/, "");

  function level(score, max) {
    var r = score / max;
    return r <= 0.34 ? 0 : r <= 0.67 ? 1 : 2;
  }
  var NAMES = {
    mood: ["Few signs of low mood", "Some signs of low mood", "Many signs of low mood"],
    anxiety: ["Few signs of anxiety", "Some signs of anxiety", "Many signs of anxiety"],
    sleep: ["Sleeping well", "Some trouble sleeping", "A lot of trouble sleeping"],
    stress: ["Stress feels manageable", "Some stress", "A lot of stress"],
  };
  var LABELS = { mood: "Mood", anxiety: "Anxiety", sleep: "Sleep", stress: "Stress" };
  var TIPS = {
    mood: [
      "Plan one small thing you used to enjoy, like a walk, a call with a friend or your favourite music, and do it even if you don't feel like it.",
      "Tell one person you trust how you've really been feeling.",
    ],
    anxiety: [
      "When worry builds, try slow breathing: in for 4, hold for 4, out for 6. Repeat five times.",
      "Set aside 15 minutes a day as your worry time. When worries come up at other times, write them down for later.",
    ],
    sleep: ["Keep the same wake-up time every day, and put your phone away 30 minutes before bed."],
    stress: ["Write down everything on your plate, pick the one thing that matters most today, and let the rest wait."],
    general: ["Keep moving: even a 10-minute walk can lift your mood.", "Spend time with people who make you feel good."],
  };
  var CTA = {
    mood: "Create a free account to save these results, track how you feel over time, and see therapists who work with low mood and depression.",
    anxiety: "Create a free account to save these results, track how you feel over time, and see therapists who work with anxiety.",
    stress: "Create a free account to save these results, track how you feel over time, and see therapists who work with stress and burnout.",
    sleep: "Create a free account to save these results, track how you feel over time, and see therapists who can help with sleep and stress.",
    general: "Create a free account to save these results, track how you feel over time, and see therapists matched to what you're going through.",
  };

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var a = {}, missing = null;
    IDS.forEach(function (id) {
      var c = form.querySelector('input[name="' + id + '"]:checked');
      if (c) a[id] = Number(c.value);
      else if (!missing) missing = id;
    });
    var err = form.querySelector(".ck-error");
    if (missing) {
      err.hidden = false;
      var q = form.querySelector('[data-q="' + missing + '"]');
      if (q) q.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    err.hidden = true;
    show(a);
  });

  function show(a) {
    var s = { mood: a.interest + a.down, anxiety: a.nervous + a.worry, sleep: a.sleep, stress: a.stress };
    var max = { mood: 6, anxiety: 6, sleep: 3, stress: 3 };
    var lv = {};
    Object.keys(s).forEach(function (k) { lv[k] = level(s[k], max[k]); });
    var crisis = a.selfharm > 0;
    var lowMood = s.mood >= 3, anxious = s.anxiety >= 3; // PHQ-2 and GAD-2 screening cut-offs
    var other = s.sleep + s.stress >= 3;

    var title, summary;
    if (crisis) {
      title = "Please reach out today";
      summary = "Your answers suggest you're carrying a lot right now. A therapist can help you understand what's happening and find a way through it, and the sooner you talk to someone, the better.";
    } else if (lowMood || anxious) {
      title = "It may help to talk to someone";
      summary = lowMood && anxious
        ? "Your answers show signs of low mood and anxiety that are worth talking through. Many people feel this way, and talking to a therapist early can stop things getting heavier."
        : lowMood
          ? "Your answers show signs of low mood that are worth talking through. Many people feel this way, and talking to a therapist early can stop things getting heavier."
          : "Your answers show signs of anxiety that are worth talking through. Many people feel this way, and talking to a therapist early can stop things getting heavier.";
    } else if (other) {
      title = "Worth keeping an eye on";
      summary = "You're mostly coping, but a few things have been weighing on you. Small changes can help, and talking to someone early is always an option.";
    } else {
      title = "You seem to be doing okay";
      summary = "Your answers don't show many signs of low mood or anxiety right now. Keep doing what helps you, and come back any time to check in again.";
    }

    box.querySelector(".ck-crisis").hidden = !crisis;
    box.querySelector(".ck-title").textContent = title;
    box.querySelector(".ck-summary").textContent = summary;

    var bars = box.querySelector(".ck-bars");
    bars.innerHTML = "";
    ["mood", "anxiety", "sleep", "stress"].forEach(function (k) {
      var row = el("div", "ck-bar lv" + lv[k]);
      row.appendChild(el("span", "ck-bar-label", LABELS[k]));
      var track = el("span", "ck-track");
      var fill = el("i");
      fill.style.width = Math.max(6, Math.round((s[k] / max[k]) * 100)) + "%";
      track.appendChild(fill);
      row.appendChild(track);
      row.appendChild(el("span", "ck-bar-level", NAMES[k][lv[k]]));
      bars.appendChild(row);
    });

    var order = ["mood", "anxiety", "stress", "sleep"].filter(function (k) { return lv[k] > 0; })
      .sort(function (x, y) { return lv[y] - lv[x]; });
    var tips = [];
    order.forEach(function (k) { TIPS[k].forEach(function (t) { if (tips.length < 3 && tips.indexOf(t) < 0) tips.push(t); }); });
    TIPS.general.forEach(function (t) { if (tips.length < 3) tips.push(t); });
    var ul = box.querySelector(".ck-tips ul");
    ul.innerHTML = "";
    tips.forEach(function (t) { ul.appendChild(el("li", null, t)); });

    var top = lowMood ? "mood" : anxious ? "anxiety" : order[0] || "general";
    box.querySelector(".ck-cta-text").textContent = CTA[top] || CTA.general;
    var code = IDS.map(function (id) { return a[id]; }).join("");
    var lang = "";
    try { var l = localStorage.getItem("mg-lang"); if (l && l !== "en") lang = "&lang=" + l; } catch (e) {}
    box.querySelector(".ck-save").href = APP + "/register?checkin=" + code + lang;

    form.hidden = true;
    box.hidden = false;
    window.scrollTo({ top: box.getBoundingClientRect().top + window.scrollY - 100, behavior: "smooth" });
  }

  box.querySelector(".ck-again").addEventListener("click", function () {
    form.reset();
    box.hidden = true;
    form.hidden = false;
    form.scrollIntoView({ behavior: "smooth" });
  });
})();
