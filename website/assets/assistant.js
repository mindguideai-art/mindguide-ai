// MindGuide Assistant: the chat window on the website.
// Talks to the web app's /api/assistant (Claude). If that can't be reached, it answers from a short built-in FAQ.
(function () {
  var root = document.getElementById("mg-assistant");
  if (!root) return;
  var API = root.getAttribute("data-api");
  var APP = root.getAttribute("data-app");
  var WA = (root.getAttribute("data-whatsapp") || "").replace(/\D/g, "");
  var TG = root.getAttribute("data-telegram") || "";
  var STORE = "mg-assistant-v1";

  var CRISIS = /\b(suicid\w*|kill (my ?self|me)|end (my|it all)|end my life|want(ed)? to die|wan die|make i die|better off dead|hurt(ing)? my ?self|self[- ]?harm|cut(ting)? my ?self|overdose|no reason to live|can'?t go on|he (is )?(beat|beating|hit|hitting) me|being abused|not safe at home)\b/i;
  var CRISIS_REPLY = "I'm really sorry you're going through this. You deserve support right now.\n\n**If you are in danger or thinking about ending your life, please call 112 now** or go to the nearest hospital. If you can, reach out to someone you trust and tell them how you're feeling.\n\nWhen you're safe, a verified MindGuide therapist can help you through this. You don't have to carry it alone.";
  var FAQ = [
    [/\b(hi|hello|hey|good (morning|afternoon|evening)|how far|bawo|ndewo|sannu)\b/i, "Hello, and welcome to MindGuide AI. I can tell you how it works, the plans, privacy, or how therapists can join. What would you like to know?"],
    [/(price|cost|how much|plan|subscription|naira|₦|pay)/i, "Plans are monthly and paid securely with Paystack:\n• Basic ₦10,000: 2 sessions\n• Standard ₦20,000: 4 sessions, messaging and progress tracker\n• Premium ₦30,000: 8 sessions, calls outside sessions, priority booking\n• Family ₦50,000: 12 sessions shared by your household\nYou can cancel anytime. Start with the free assessment: " + APP + "/register"],
    [/(therapist|join|apply|counsel+or|psycholog)/i, "Licensed therapists can apply at " + APP + "/register/therapist. You create a profile, upload your licence, our team verifies it, then you set your hours and start accepting bookings."],
    [/(private|privacy|confidential|secure|safe|data)/i, "Your sessions are private. Calls are encrypted and connect directly between you and your therapist, and **you choose which therapists can see your details**. You can stop sharing anytime."],
    [/(how (does|do) (it|this) work|start|sign ?up|register|begin|book)/i, "It's three steps: create a free account, take the 2-minute wellbeing assessment to see matched therapists, then choose a plan and book a video or voice session. Start here: " + APP + "/register"],
    [/(assessment|test|quiz|\bai\b)/i, "The assessment is 7 short questions based on standard screening scales. It gives you a gentle summary and suggests therapists who fit. It isn't a diagnosis. It's free when you create an account: " + APP + "/register"],
    [/(cancel|reschedul|refund)/i, "You can reschedule or cancel a session up to 24 hours before it starts. You can cancel your plan anytime and keep it until the end of the month you paid for."],
    [/(video|voice|call|internet|data|app|download|phone)/i, "Sessions run in your browser on a phone, tablet or computer, with no app to download. Choose video, or voice if your internet is slow, since it uses much less data."],
    [/(talk to someone|talk now|need help|feel|sad|depress|anxious|anxiety|stress|lonely|tired)/i, "Thank you for sharing that. It takes courage. A verified MindGuide therapist can listen and help you work through it, by video or voice, from wherever you are. You can create a free account and see matched therapists in a few minutes: " + APP + "/register"],
    [/(telegram|community|group)/i, "Join the MindGuide AI community on Telegram to connect with others and get extra support: " + TG],
    [/(contact|email|support|human|agent)/i, "You can email the team at mindguideai@gmail.com" + (TG ? ", or join our Telegram community: " + TG : ".")]
  ];
  var CHIPS = ["How does it work?", "How much does it cost?", "Is it private?", "I want to talk to someone", "I'm a therapist"];
  var WELCOME = "Hi, I'm the **MindGuide Assistant** 👋\nI can answer questions about MindGuide AI and help you get started. What would you like to know?";

  var ICON = {
    close: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    send: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>',
    wa: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2a9.9 9.9 0 0 0-8.5 15l-1.4 5 5.1-1.3A9.9 9.9 0 1 0 12.04 2Zm5.8 14.1c-.25.7-1.45 1.33-2 1.38-.53.06-1.03.25-3.46-.72-2.92-1.15-4.77-4.15-4.92-4.35-.14-.2-1.17-1.56-1.17-2.98 0-1.42.74-2.12 1-2.41.27-.29.58-.36.78-.36h.56c.18 0 .42-.07.66.5.25.6.84 2.06.92 2.2.07.15.12.32.02.52-.1.2-.15.32-.29.5l-.44.51c-.15.15-.3.3-.13.6.17.29.75 1.24 1.62 2 1.11.99 2.05 1.3 2.34 1.44.29.15.46.12.63-.07.17-.2.73-.85.92-1.15.2-.29.39-.24.66-.14.27.1 1.7.8 2 .95.29.14.48.22.55.34.07.12.07.7-.18 1.4Z"/></svg>',
    chat: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>'
  };

  var history = [];
  try { history = JSON.parse(sessionStorage.getItem(STORE) || "[]"); } catch (e) { history = []; }
  var save = function () { try { sessionStorage.setItem(STORE, JSON.stringify(history.slice(-30))); } catch (e) {} };

  root.innerHTML =
    '<button class="mga-launcher" type="button" aria-expanded="false" aria-controls="mga-panel">' +
      '<span class="mga-launcher-icon"><img src="assets/img/mindguide-mark.png" alt="" width="34" height="34"></span>' +
      '<span class="mga-launcher-text"><b>Ask MindGuide</b><small>Questions? We reply instantly</small></span>' +
    "</button>" +
    '<section class="mga-panel" id="mga-panel" role="dialog" aria-label="MindGuide Assistant" hidden>' +
      '<header class="mga-head">' +
        '<span class="mga-avatar"><img src="assets/img/mindguide-mark.png" alt="" width="30" height="30"></span>' +
        '<div class="mga-title"><b>MindGuide Assistant</b><small><i></i> Online · replies instantly</small></div>' +
        '<button class="mga-close" type="button" aria-label="Close chat">' + ICON.close + "</button>" +
      "</header>" +
      (WA ? '<a class="mga-wa" href="https://wa.me/' + WA + '?text=' + encodeURIComponent("Hello MindGuide AI, I'd like to know more.") + '" target="_blank" rel="noopener">' + ICON.wa + "<span>Prefer WhatsApp? <b>Chat with us there</b></span></a>" : "") +
      '<div class="mga-body" aria-live="polite"></div>' +
      '<form class="mga-form">' +
        '<label for="mga-input" class="mga-sr">Type your message</label>' +
        '<textarea id="mga-input" rows="1" placeholder="Ask about plans, privacy, booking…" maxlength="1000"></textarea>' +
        '<button type="submit" aria-label="Send">' + ICON.send + "</button>" +
      "</form>" +
      '<p class="mga-note">AI assistant, not a therapist. Messages are processed by our AI provider, so please don\u2019t share personal details. In an emergency call <b>112</b>.</p>' +
    "</section>";

  var launcher = root.querySelector(".mga-launcher");
  var panel = root.querySelector(".mga-panel");
  var body = root.querySelector(".mga-body");
  var form = root.querySelector(".mga-form");
  var input = root.querySelector("#mga-input");
  var busy = false;

  function esc(s) { return s.replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function fmt(s) {
    return esc(s)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/(https?:\/\/[^\s<)]+[^\s<).,])/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
      .replace(/\b112\b/g, "<b class=\"mga-112\">112</b>")
      .replace(/\n/g, "<br>");
  }
  function bubble(role, text) {
    var el = document.createElement("div");
    el.className = "mga-msg mga-" + role;
    el.innerHTML = fmt(text);
    body.appendChild(el);
    body.scrollTop = body.scrollHeight;
    return el;
  }
  function chips() {
    var wrap = document.createElement("div");
    wrap.className = "mga-chips";
    CHIPS.forEach(function (c) {
      var b = document.createElement("button");
      b.type = "button"; b.textContent = c;
      b.addEventListener("click", function () { wrap.remove(); ask(c); });
      wrap.appendChild(b);
    });
    body.appendChild(wrap);
  }
  function render() {
    body.innerHTML = "";
    bubble("bot", WELCOME);
    history.forEach(function (m) { bubble(m.role === "user" ? "user" : "bot", m.content); });
    if (!history.length) chips();
  }
  function local(text) {
    if (CRISIS.test(text)) return CRISIS_REPLY;
    for (var i = 0; i < FAQ.length; i++) if (FAQ[i][0].test(text)) return FAQ[i][1];
    return "I can help with how MindGuide AI works, plans and prices, privacy, and joining as a therapist. If you'd like to talk something through, our verified therapists can help: " + APP + "/register";
  }

  function ask(text) {
    text = text.trim();
    if (!text || busy) return;
    busy = true;
    history.push({ role: "user", content: text }); save();
    bubble("user", text);
    var typing = document.createElement("div");
    typing.className = "mga-msg mga-bot mga-typing";
    typing.innerHTML = "<span></span><span></span><span></span>";
    body.appendChild(typing); body.scrollTop = body.scrollHeight;

    var finish = function (reply) {
      typing.remove();
      history.push({ role: "assistant", content: reply }); save();
      busy = false;
    };
    var controller = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (controller) controller.abort(); }, 25000);

    fetch(API, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ messages: history }), signal: controller ? controller.signal : undefined })
      .then(function (res) {
        if (!res.ok || !res.body) {
          return res.text().then(function (t) { throw new Error(res.status === 429 ? t : "unavailable"); });
        }
        var reader = res.body.getReader(), dec = new TextDecoder(), text = "", el = null;
        var pump = function () {
          return reader.read().then(function (r) {
            if (r.done) return text;
            text += dec.decode(r.value, { stream: true });
            if (!el) { typing.remove(); el = bubble("bot", ""); }
            el.innerHTML = fmt(text); body.scrollTop = body.scrollHeight;
            return pump();
          });
        };
        return pump().then(function (t) { clearTimeout(timer); if (!el) bubble("bot", t); finish(t || local(text)); });
      })
      .catch(function (err) {
        clearTimeout(timer);
        var reply = err && err.message && err.message !== "unavailable" && err.name !== "AbortError" && err.name !== "TypeError" ? err.message : local(text);
        typing.remove();
        bubble("bot", reply);
        finish(reply);
      });
  }

  function open(state) {
    panel.hidden = !state;
    launcher.setAttribute("aria-expanded", state ? "true" : "false");
    root.classList.toggle("mga-open", state);
    if (state) { if (!body.childElementCount) render(); setTimeout(function () { input.focus(); }, 50); }
  }
  launcher.addEventListener("click", function () { open(panel.hidden); });
  root.querySelector(".mga-close").addEventListener("click", function () { open(false); launcher.focus(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !panel.hidden) open(false); });
  form.addEventListener("submit", function (e) { e.preventDefault(); var t = input.value; input.value = ""; input.style.height = ""; ask(t); });
  input.addEventListener("keydown", function (e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event("submit")); } });
  input.addEventListener("input", function () { input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 120) + "px"; });

  // Buttons anywhere on the page can open the chat: <button data-open-assistant>
  document.querySelectorAll("[data-open-assistant]").forEach(function (b) {
    b.addEventListener("click", function (e) { e.preventDefault(); open(true); var q = b.getAttribute("data-open-assistant"); if (q) ask(q); });
  });
})();
