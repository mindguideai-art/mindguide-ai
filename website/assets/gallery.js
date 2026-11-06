// MindGuide AI website: photo gallery (albums are managed in the web app: Admin → Gallery).
(function () {
  var app = document.getElementById("gallery-app");
  if (!app) return;
  var API = (app.getAttribute("data-api") || "").replace(/\/$/, "");
  var box = app.querySelector("[data-gallery]");
  var albums = [], current = null, preview = false;
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function when(d) { return d ? new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(d + "T00:00:00Z")) : ""; }
  var BACK = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>';

  function grid() {
    current = null;
    if (!albums.length) {
      box.innerHTML = '<div class="ev-empty"><div><h3>Photos are coming soon</h3><p>We’ll share pictures from our events here. See what’s coming up next.</p></div><a class="btn btn-primary" href="events.html">See upcoming events</a></div>';
      return;
    }
    box.innerHTML = (preview ? '<p class="ev-preview-note">Preview: sample albums with placeholder images. The live website shows the albums you publish in the app.</p>' : "") +
      '<div class="gal-albums">' + albums.map(function (a) {
        var thumbs = a.photos.slice(0, 3);
        return '<a class="gal-album" href="#album-' + esc(a.id) + '"><div class="gal-cover">' +
          '<img src="' + esc(a.cover) + '" alt="" loading="lazy" decoding="async">' +
          (thumbs.length > 1 ? '<div class="gal-stack" aria-hidden="true">' + thumbs.slice(1).map(function (p) { return '<img src="' + esc(p.src) + '" alt="" loading="lazy">'; }).join("") + "</div>" : "") +
          '</div><div class="gal-album-copy"><p class="ev-when">' + esc(when(a.taken_on)) + (a.taken_on ? " · " : "") + a.photos.length + " photo" + (a.photos.length === 1 ? "" : "s") + "</p><h3>" + esc(a.title) + "</h3>" +
          (a.description ? "<p>" + esc(a.description) + "</p>" : "") + "</div></a>";
      }).join("") + "</div>";
  }

  function album(a) {
    current = a;
    box.innerHTML = '<div class="gal-head"><a class="gal-back" href="#">' + BACK + " All albums</a>" +
      '<p class="ev-when">' + esc(when(a.taken_on)) + (a.event ? ' · <a href="events.html">' + esc(a.event.title) + "</a>" : "") + "</p>" +
      "<h2>" + esc(a.title) + "</h2>" + (a.description ? '<p class="lead">' + esc(a.description) + "</p>" : "") + "</div>" +
      '<div class="gal-masonry">' + a.photos.map(function (p, i) {
        var ratio = p.width && p.height ? ' style="aspect-ratio:' + p.width + "/" + p.height + '"' : "";
        return '<button type="button" class="gal-photo" data-i="' + i + '"' + ratio + ' aria-label="Open photo ' + (i + 1) + (p.caption ? ": " + esc(p.caption) : "") + '"><img src="' + esc(p.src) + '" alt="' + esc(p.caption || "") + '" loading="lazy" decoding="async">' +
          (p.caption ? "<span>" + esc(p.caption) + "</span>" : "") + "</button>";
      }).join("") + "</div>";
    window.scrollTo({ top: app.offsetTop - 90, behavior: "smooth" });
  }

  function route() {
    var m = location.hash.match(/^#album-(.+)$/);
    var a = m && albums.filter(function (x) { return x.id === m[1]; })[0];
    if (a) album(a); else grid();
  }

  // Lightbox
  var lb = document.getElementById("lightbox"), img = lb.querySelector("img"), cap = lb.querySelector("figcaption"), idx = 0, lastFocus = null;
  function show(i) {
    var ps = current.photos; idx = (i + ps.length) % ps.length;
    img.src = ps[idx].src; img.alt = ps[idx].caption || "";
    cap.textContent = (ps[idx].caption ? ps[idx].caption + " · " : "") + (idx + 1) + " of " + ps.length;
  }
  function openLb(i) { lastFocus = document.activeElement; lb.hidden = false; document.body.style.overflow = "hidden"; show(i); lb.querySelector(".lb-close").focus(); }
  function closeLb() { lb.hidden = true; document.body.style.overflow = ""; img.removeAttribute("src"); if (lastFocus) lastFocus.focus(); }
  box.addEventListener("click", function (e) { var b = e.target.closest(".gal-photo"); if (b) openLb(Number(b.getAttribute("data-i"))); });
  lb.querySelector(".lb-close").addEventListener("click", closeLb);
  lb.querySelector(".lb-prev").addEventListener("click", function () { show(idx - 1); });
  lb.querySelector(".lb-next").addEventListener("click", function () { show(idx + 1); });
  lb.addEventListener("click", function (e) { if (e.target === lb || e.target.tagName === "FIGURE") closeLb(); });
  document.addEventListener("keydown", function (e) {
    if (lb.hidden) return;
    if (e.key === "Escape") closeLb(); else if (e.key === "ArrowLeft") show(idx - 1); else if (e.key === "ArrowRight") show(idx + 1);
  });
  var x0 = null;
  lb.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", function (e) { if (x0 == null) return; var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1)); x0 = null; });

  fetch(API + "/api/gallery", { headers: { accept: "application/json" } })
    .then(function (r) { if (!r.ok) throw new Error("bad"); return r.json(); })
    .catch(function () { return fetch("assets/preview-data.json").then(function (r) { if (!r.ok) throw new Error("bad"); preview = true; return r.json().then(function (d) { return d.gallery; }); }); })
    .then(function (d) { albums = d.albums || []; route(); window.addEventListener("hashchange", route); })
    .catch(function () { box.innerHTML = '<div class="ev-empty"><div><h3>The gallery couldn’t load just now</h3><p>Please refresh the page in a moment.</p></div></div>'; });
})();
