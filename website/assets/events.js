// MindGuide AI website: events list, event details and the registration form.
// Events are managed in the web app (Admin → Events) and loaded from its public API.
(function () {
  var page = document.getElementById("events-app");
  var home = document.getElementById("home-events");
  var root = page || home;
  if (!root) return;
  var API = (root.getAttribute("data-api") || "").replace(/\/$/, "");
  var TZ = "Africa/Lagos";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function fmt(iso, opts) { return new Intl.DateTimeFormat("en-NG", Object.assign({ timeZone: TZ }, opts)).format(new Date(iso)); }
  function day(iso) { return fmt(iso, { day: "numeric" }); }
  function month(iso) { return fmt(iso, { month: "short" }); }
  function weekday(iso) { return fmt(iso, { weekday: "long" }); }
  function longDate(iso) { return fmt(iso, { weekday: "long", day: "numeric", month: "long", year: "numeric" }); }
  function time(iso) { return fmt(iso, { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase().replace(/\s/g, ""); }
  function timeRange(e) { return time(e.starts_at) + (e.ends_at ? " – " + time(e.ends_at) : "") + " WAT"; }
  var ICON = {
    clock: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
    pin: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
    monitor: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>',
    users: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    arrow: '<span class="arrow"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg></span>',
    x: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    check: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>',
    share: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98"/></svg>'
  };

  function where(e) {
    if (e.location_type === "online") return { icon: ICON.monitor, text: "Online · joining details shared when you register" };
    if (e.location_type === "hybrid") return { icon: ICON.pin, text: (e.venue || "In person") + " · or join online" };
    return { icon: ICON.pin, text: e.venue || "In person" };
  }
  function status(e) {
    if (e.open) {
      if (e.spots_left != null && e.spots_left <= 10) return { cls: "low", text: e.spots_left === 1 ? "1 place left" : e.spots_left + " places left" };
      return { cls: "open", text: "Registration open" };
    }
    if (e.closed_reason === "full") return { cls: "shut", text: "Fully booked" };
    if (e.closed_reason === "past") return { cls: "shut", text: "Ended" };
    return { cls: "shut", text: "Registration closed" };
  }
  function media(e, cls) {
    // Portrait flyers are shown whole, on a soft blurred copy of themselves, instead of being cropped.
    return '<div class="ev-media ' + (cls || "") + '"' + (e.image ? ' style="--img:url(\'' + esc(e.image) + '\')"' : "") + ">" +
      (e.image ? '<img src="' + esc(e.image) + '" alt="' + esc(e.title) + ' flyer" decoding="async" onload="this.parentNode.classList.toggle(\'fit\', this.naturalWidth / this.naturalHeight < 1.45)">' : '<div class="ev-ph" aria-hidden="true"></div>') +
      '<div class="ev-date" aria-hidden="true"><span>' + esc(month(e.starts_at)) + "</span><b>" + esc(day(e.starts_at)) + "</b></div></div>";
  }
  function card(e) {
    var w = where(e), st = status(e);
    return '<article class="ev-card">' + media(e) +
      '<div class="ev-body"><p class="ev-when">' + esc(weekday(e.starts_at)) + " · " + esc(timeRange(e)) + "</p>" +
      '<h3><a href="events.html#' + esc(e.slug) + '" data-open="' + esc(e.slug) + '">' + esc(e.title) + "</a></h3>" +
      (e.summary ? '<p class="ev-sum">' + esc(e.summary) + "</p>" : "") +
      '<div class="ev-foot"><span class="ev-where">' + w.icon + "<span>" + esc(w.text) + '</span></span><span class="ev-pill ' + st.cls + '">' + esc(st.text) + "</span></div></div></article>";
  }
  function featured(e) {
    var w = where(e), st = status(e);
    return '<article class="ev-feature">' + media(e, "big") +
      '<div class="ev-body"><span class="ev-pill ' + st.cls + '">' + esc(st.text) + "</span>" +
      '<h2><a href="events.html#' + esc(e.slug) + '" data-open="' + esc(e.slug) + '">' + esc(e.title) + "</a></h2>" +
      (e.summary ? '<p class="ev-sum">' + esc(e.summary) + "</p>" : "") +
      '<ul class="ev-meta"><li>' + ICON.clock + "<span>" + esc(longDate(e.starts_at)) + "<br>" + esc(timeRange(e)) + "</span></li><li>" + w.icon + "<span>" + esc(w.text) + "</span></li></ul>" +
      '<div class="btn-row"><button class="btn btn-primary" type="button" data-open="' + esc(e.slug) + '">' + (e.open ? "Register now" : "View details") + " " + ICON.arrow + "</button></div></div></article>";
  }

  var events = [], past = [], modal = document.getElementById("ev-modal"), preview = false;

  function load() {
    return fetch(API + "/api/events", { headers: { accept: "application/json" } })
      .then(function (r) { if (!r.ok) throw new Error("bad"); return r.json(); })
      .catch(function () {
        // The page preview can't reach the app, so it shows sample data instead.
        return fetch("assets/preview-data.json").then(function (r) { if (!r.ok) throw new Error("bad"); preview = true; return r.json().then(function (d) { return d.events; }); });
      });
  }

  function renderPage() {
    var box = page.querySelector("[data-events-upcoming]");
    if (!events.length) {
      box.innerHTML = '<div class="ev-empty"><div><h3>No upcoming events right now</h3><p>New talks and workshops are added regularly. Join the community on Telegram to hear about them first.</p></div>' +
        '<a class="btn btn-primary" href="' + esc(page.getAttribute("data-telegram")) + '">Join the community ' + ICON.arrow + "</a></div>";
    } else {
      box.innerHTML = (preview ? '<p class="ev-preview-note">Preview: these are sample events. The live website shows the events you publish in the app.</p>' : "") +
        featured(events[0]) + (events.length > 1 ? '<div class="ev-grid">' + events.slice(1).map(card).join("") + "</div>" : "");
    }
    if (past.length) {
      page.querySelector("[data-events-past]").hidden = false;
      page.querySelector("[data-events-past-list]").innerHTML = past.slice(0, 8).map(function (e) {
        return '<div class="ev-past-row"><time datetime="' + esc(e.starts_at) + '"><b>' + esc(day(e.starts_at)) + "</b>" + esc(month(e.starts_at)) + " " + esc(fmt(e.starts_at, { year: "numeric" })) + "</time>" +
          "<div><h3>" + esc(e.title) + "</h3>" + (e.summary ? "<p>" + esc(e.summary) + "</p>" : "") + "</div>" +
          '<a class="ev-past-link" href="gallery.html">See photos ' + ICON.arrow + "</a></div>";
      }).join("");
    }
  }

  function renderHome() {
    if (!events.length) return;
    home.querySelector("[data-events-home]").innerHTML = events.slice(0, 3).map(card).join("");
    home.hidden = false;
  }

  // ---- Details + registration modal ----
  function find(slug) { return events.concat(past).filter(function (e) { return e.slug === slug; })[0]; }

  function openEvent(slug, push) {
    var e = find(slug);
    if (!e || !modal) return;
    var w = where(e), st = status(e);
    var desc = (e.description || "").split(/\n{2,}/).map(function (p) { return "<p>" + esc(p).replace(/\n/g, "<br>") + "</p>"; }).join("");
    var closedMsg = { full: "This event is fully booked.", past: "This event has already taken place.", deadline: "Registration for this event has closed.", closed: "Registration for this event is closed." }[e.closed_reason] || "";
    modal.querySelector("[data-modal-body]").innerHTML =
      '<button class="ev-x" type="button" data-close aria-label="Close">' + ICON.x + "</button>" +
      '<div class="ev-modal-grid"><div class="ev-modal-info">' + media(e, "modal") +
        '<div class="ev-modal-copy"><span class="ev-pill ' + st.cls + '">' + esc(st.text) + "</span>" +
        '<h2 id="ev-modal-title">' + esc(e.title) + "</h2>" +
        '<ul class="ev-meta"><li>' + ICON.clock + "<span>" + esc(longDate(e.starts_at)) + "<br>" + esc(timeRange(e)) + "</span></li><li>" + w.icon + "<span>" + esc(w.text) + "</span></li>" +
        (e.capacity && !e.registration_url ? "<li>" + ICON.users + "<span>" + (e.spots_left != null ? esc(e.spots_left) + " of " + esc(e.capacity) + " places left" : esc(e.capacity) + " places") + "</span></li>" : "") + "</ul>" +
        (desc ? '<div class="ev-desc">' + desc + "</div>" : "") +
        '<button class="ev-share" type="button" data-share>' + ICON.share + " Share this event</button></div></div>" +
      '<div class="ev-modal-form">' + (e.open ? (e.registration_url ? externalHtml(e) : formHtml(e)) : '<div class="ev-closed"><h3>' + esc(closedMsg) + '</h3><p>Join the community to hear about the next one.</p><a class="btn btn-primary" href="' + esc((page || home).getAttribute("data-telegram") || "contact.html") + '">Stay in the loop ' + ICON.arrow + "</a></div>") + "</div></div>";
    var form = modal.querySelector("form");
    if (form) {
      form.addEventListener("submit", function (ev) { submit(ev, e); });
      form.addEventListener("input", function () { form.querySelector(".ev-error").hidden = true; });
    }
    modal.querySelector("[data-share]").addEventListener("click", function () { share(e, this); });
    if (!modal.open) modal.showModal();
    modal.scrollTop = 0;
    if (push !== false && location.hash !== "#" + slug) history.replaceState(null, "", "#" + slug);
  }

  function externalHtml(e) {
    return '<div class="ev-closed"><p class="eyebrow">Register</p><h3>Save your place</h3><p>Registration for this event is on a short form. It opens in a new tab' +
      (e.location_type !== "in_person" ? ", and the joining details are shared with everyone who registers." : ".") + "</p>" +
      '<a class="btn btn-glow" href="' + esc(e.registration_url) + '" target="_blank" rel="noopener">Open the registration form ' + ICON.arrow + "</a>" +
      '<a class="ev-cal-link" href="' + esc(calendarUrl(e)) + '" target="_blank" rel="noopener">Add to Google Calendar</a></div>';
  }

  function formHtml(e) {
    return '<form class="form ev-form" novalidate><div><p class="eyebrow">Register</p><h3>Save your place</h3><p class="ev-free">It takes about a minute.</p></div>' +
      '<label><span>Full name</span><input name="full_name" autocomplete="name" required maxlength="120"></label>' +
      '<label><span>Email address</span><input name="email" type="email" autocomplete="email" required maxlength="160"><span class="hint">Your confirmation' + (e.location_type !== "in_person" ? " and the joining link are" : " is") + " sent here.</span></label>" +
      '<div class="row"><label><span>Phone <span class="opt">(optional)</span></span><input name="phone" type="tel" autocomplete="tel" inputmode="tel" maxlength="30" placeholder="080…"></label>' +
      '<label><span>Organisation <span class="opt">(optional)</span></span><input name="organisation" autocomplete="organization" maxlength="160"></label></div>' +
      (e.custom_question ? "<label><span>" + esc(e.custom_question) + (e.custom_required ? "" : ' <span class="opt">(optional)</span>') + '</span><textarea name="custom_answer" rows="2" maxlength="1000"' + (e.custom_required ? " required" : "") + "></textarea></label>" : "") +
      '<label><span>How did you hear about this event? <span class="opt">(optional)</span></span><select name="heard_from"><option value="">Choose one</option><option>Instagram</option><option>Facebook</option><option>X (Twitter)</option><option>LinkedIn</option><option>WhatsApp</option><option>Telegram community</option><option>Friend or family</option><option>Work, school or church</option><option>MindGuide AI app</option><option>Other</option></select></label>' +
      '<input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      '<label class="ev-consent"><input type="checkbox" name="consent" required><span>I agree that MindGuide AI can use these details to manage my registration and contact me about this event. They are not shared or used for marketing.</span></label>' +
      '<p class="ev-error" role="alert" hidden></p>' +
      '<button class="btn btn-glow" type="submit">Register ' + ICON.arrow + "</button></form>";
  }

  function submit(ev, e) {
    ev.preventDefault();
    var form = ev.target, err = form.querySelector(".ev-error"), btn = form.querySelector("button[type=submit]");
    var f = new FormData(form);
    var data = { full_name: f.get("full_name"), email: f.get("email"), phone: f.get("phone"), organisation: f.get("organisation"), custom_answer: f.get("custom_answer") || "", heard_from: f.get("heard_from"), website: f.get("website"), consent: form.consent.checked };
    var problem = !String(data.full_name).trim() ? "Please enter your full name." : !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(data.email).trim()) ? "Please enter a valid email address." :
      e.custom_question && e.custom_required && !String(data.custom_answer).trim() ? "Please answer: " + e.custom_question : !data.consent ? "Please tick the box to agree to how we use your details." : "";
    if (problem) { err.textContent = problem; err.hidden = false; return; }
    err.hidden = true; btn.disabled = true; btn.innerHTML = "Registering…";
    if (preview) {
      setTimeout(function () { success(form, e, data, "This is a preview, so nothing was saved. On the live website you'd get a confirmation email now."); }, 600);
      return;
    }
    fetch(API + "/api/events/" + encodeURIComponent(e.slug) + "/register", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        if (!res.ok) throw new Error(res.d.error || "Something went wrong. Please try again.");
        success(form, e, data, res.d.message);
        if (e.spots_left != null) e.spots_left = Math.max(0, e.spots_left - 1);
      })
      .catch(function (x) {
        err.textContent = x.message && x.message !== "Failed to fetch" ? x.message : "We couldn't reach the server. Check your connection and try again.";
        err.hidden = false; btn.disabled = false; btn.innerHTML = "Register " + ICON.arrow;
      });
  }

  function calendarUrl(e) {
    var f = function (iso) { return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, ""); };
    var end = e.ends_at || new Date(new Date(e.starts_at).getTime() + 3600000).toISOString();
    return "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" + encodeURIComponent(e.title) + "&dates=" + f(e.starts_at) + "/" + f(end) +
      "&details=" + encodeURIComponent((e.summary || "") + "\n" + location.origin + location.pathname + "#" + e.slug) + "&location=" + encodeURIComponent(e.venue || "Online");
  }

  function success(form, e, data, message) {
    var first = String(data.full_name).trim().split(/\s+/)[0];
    form.outerHTML = '<div class="ev-done"><span class="ev-tick">' + ICON.check + "</span><h3>You're in, " + esc(first) + "!</h3><p>" + esc(message || "You're registered.") + "</p>" +
      '<p class="ev-done-mail">Sent to <b>' + esc(String(data.email).trim()) + "</b>. Can't find it? Check your spam or promotions folder.</p>" +
      '<div class="btn-row"><a class="btn btn-primary" href="' + esc(calendarUrl(e)) + '" target="_blank" rel="noopener">Add to Google Calendar</a><button class="btn btn-ghost" type="button" data-close>Done</button></div></div>';
  }

  function share(e, btn) {
    var url = location.origin + location.pathname.replace(/[^/]*$/, "") + "events.html#" + e.slug;
    var done = function () { btn.innerHTML = ICON.share + " Link copied"; setTimeout(function () { btn.innerHTML = ICON.share + " Share this event"; }, 1800); };
    if (navigator.share) { navigator.share({ title: e.title, text: e.summary || e.title, url: url }).catch(function () {}); return; }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, function () { prompt0(url, btn); });
    else prompt0(url, btn);
  }
  function prompt0(url, btn) { btn.outerHTML = '<input class="ev-share-input" readonly value="' + esc(url) + '" onclick="this.select()">'; }

  function close() {
    if (modal && modal.open) modal.close();
  }

  document.addEventListener("click", function (ev) {
    var t = ev.target.closest("[data-open]");
    if (t) {
      if (!page) return; // on the home page the link goes to events.html#slug
      ev.preventDefault(); openEvent(t.getAttribute("data-open"));
      return;
    }
    if (ev.target.closest("[data-close]")) close();
  });
  if (modal) {
    modal.addEventListener("click", function (ev) { if (ev.target === modal) close(); });
    modal.addEventListener("close", function () { if (location.hash) history.replaceState(null, "", location.pathname + location.search); });
  }
  window.addEventListener("hashchange", function () { var s = location.hash.slice(1); if (s && page) openEvent(s, false); });

  load().then(function (d) {
    events = d.upcoming || []; past = d.past || [];
    if (page) {
      renderPage();
      var s = location.hash.slice(1); if (s) openEvent(s, false);
    } else renderHome();
  }).catch(function () {
    if (page) page.querySelector("[data-events-upcoming]").innerHTML = '<div class="ev-empty"><div><h3>Events couldn’t load just now</h3><p>Please refresh the page in a moment. If it keeps happening, email us and we’ll help you register.</p></div><a class="btn btn-ghost" href="contact.html">Contact us</a></div>';
  });
})();
