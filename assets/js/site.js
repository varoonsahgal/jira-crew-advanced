/* Crew Academy: shared behaviour for the Beginner, Intermediate and Advanced course sites.
   No dependencies. Per-course settings come from assets/js/config.js (window.CREW). */
(function () {
  "use strict";

  const C = Object.assign({
    brand: "CREW ACADEMY",
    course: "Course",
    storage: "crew",
    pages: [["index.html", "Home"]],
    modules: [],               // [{id:"m1", href:"m1.html", title:"..."}] used by the completion record
    footer: "",
    otherCourses: [],          // [{label, href}]
    site: "https://varoonsahgaltraining.atlassian.net",
    seatBoardBase: 64,          // seat NN -> board 64 + NN in the CRP space
    tiers: [[0, "Trainee"], [400, "Line Crew"], [1200, "Senior Crew"], [2600, "Lead"], [4200, "Chief Scheduler"]]
  }, window.CREW || {});

  const DEFAULT_SITE = C.site;
  const store = {
    get(k, d) { try { const v = localStorage.getItem(C.storage + ":" + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(C.storage + ":" + k, JSON.stringify(v)); } catch (e) { /* private mode */ } },
    keys() { try { return Object.keys(localStorage).filter(k => k.startsWith(C.storage + ":")); } catch (e) { return []; } }
  };
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const siteUrl = () => (store.get("site", DEFAULT_SITE) || DEFAULT_SITE).replace(/\/+$/, "");
  window.CA = { store, siteUrl, config: C };

  /* ---------------- Header / footer ---------------- */
  const here = (location.pathname.split("/").pop() || "index.html");
  const planeSvg = '<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="30" fill="#0033a0"/><path fill="#ffb81c" d="M50 28.5 36 26 27 12h-4l4.5 14.5L17 25l-4-5h-3l2.5 9-2.5 9h3l4-5 10.5-1.5L23 46h4l9-14 14-2.5c2-.4 2-2.6 0-3z" transform="rotate(-8 32 32)"/></svg>';
  const header = $("#site-header");
  if (header) {
    header.className = "topbar";
    header.innerHTML =
      '<a class="skip" href="#main">Skip to content</a><div class="wrap">' +
      '<a class="brand" href="index.html">' + planeSvg + '<span>' + C.brand + '</span></a>' +
      '<span class="course-pill">' + C.course + '</span>' +
      '<button class="nav-toggle" aria-expanded="false" aria-controls="mainnav">Menu ☰</button>' +
      '<nav class="nav" id="mainnav">' +
      C.pages.map(([h, l]) => '<a href="' + h + '"' + (h === here ? ' aria-current="page"' : "") + ">" + l + "</a>").join("") +
      '</nav><span class="miles-pill" title="Your training miles (saved in this browser)" data-miles-pill>✈ 0 mi</span></div>';
    const t = $(".nav-toggle", header), n = $("#mainnav", header);
    t.addEventListener("click", () => { n.classList.toggle("open"); t.setAttribute("aria-expanded", n.classList.contains("open")); });
  }
  const footer = $("#site-footer");
  if (footer) {
    footer.outerHTML =
      '<div class="runway" aria-hidden="true"></div><footer class="site"><div class="wrap">' +
      '<div style="max-width:460px"><div class="brand" style="margin-bottom:10px">' + planeSvg + '<span>' + C.brand + '</span></div>' +
      '<p>' + C.footer + '</p>' +
      (C.otherCourses.length ? '<p>Other courses in the series: ' + C.otherCourses.map(o => '<a href="' + o.href + '">' + o.label + '</a>').join(" · ") + '</p>' : '') +
      '<p class="muted" style="color:#7286ab">Fictional Crew Scheduling scenario for training. Not an official Atlassian publication. Product names belong to their owners.</p></div>' +
      '<div><h4 style="color:#cfe0ff">Training site</h4><p style="margin-bottom:6px">“Run in Jira” buttons and board links open this site:</p>' +
      '<form id="site-form" style="display:flex;gap:6px;flex-wrap:wrap"><input id="site-input" type="url" aria-label="Training Jira site URL" style="padding:8px 10px;border-radius:8px;border:1px solid #2a3f66;background:#0b1a36;color:#fff;min-width:240px;font:inherit" />' +
      '<button class="btn btn-sm btn-primary" type="submit">Save</button></form>' +
      '<p style="margin-top:14px"><a href="#" id="reset-progress">Reset my miles, notes &amp; progress</a></p></div>' +
      "</div></footer>";
    const inp = $("#site-input"); if (inp) inp.value = siteUrl();
    $("#site-form") && $("#site-form").addEventListener("submit", e => { e.preventDefault(); store.set("site", inp.value.trim() || DEFAULT_SITE); toast("Training site saved ✈"); location.reload(); });
    $("#reset-progress") && $("#reset-progress").addEventListener("click", e => { e.preventDefault(); if (window.confirm("Reset all miles, saved notes and progress for this course in this browser?")) { store.keys().filter(k => k !== C.storage + ":site").forEach(k => localStorage.removeItem(k)); location.reload(); } });
  }

  /* ---------------- Lab seats (up to 20 learners at once) ---------------- */
  const seat = () => store.get("seat", "");
  window.CA.seat = seat;
  window.CA.seatBoardUrl = (s, suffix) => {
    s = s || seat();
    return s ? siteUrl() + "/jira/software/c/projects/CRP/boards/" + (C.seatBoardBase + Number(s)) + (suffix || "") : siteUrl() + "/jira/software/c/projects/CRP/boards";
  };
  if (header) {
    const wrap = $(".wrap", header);
    const pick = document.createElement("label");
    pick.className = "seat-pick";
    pick.title = "Your lab seat. Every {SEAT} in the labs becomes this number.";
    pick.innerHTML = '💺 <select data-seat-select aria-label="Choose your lab seat"><option value="">Seat?</option>' +
      Array.from({ length: 20 }, (_, i) => { const v = String(i + 1).padStart(2, "0"); return '<option value="' + v + '"' + (seat() === v ? " selected" : "") + ">Seat " + v + "</option>"; }).join("") + "</select>";
    wrap.insertBefore(pick, $(".nav-toggle", wrap));
    $("select", pick).addEventListener("change", e => { store.set("seat", e.target.value); location.reload(); });
  }
  (function applySeat() {
    const s = seat() || "NN";
    const root = $("main") || document.body;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = []; while (walker.nextNode()) if (walker.currentNode.nodeValue.indexOf("{SEAT}") > -1) nodes.push(walker.currentNode);
    nodes.forEach(n => { n.nodeValue = n.nodeValue.replace(/\{SEAT\}/g, s); });
    $$("pre[data-jql], pre[data-code]", root).forEach(p => { if (p.textContent.indexOf("{SEAT}") > -1) p.textContent = p.textContent.replace(/\{SEAT\}/g, s); });
    $$("[href*='%7BSEAT%7D'], [href*='{SEAT}']", root).forEach(a => { a.href = a.getAttribute("href").replace(/%7BSEAT%7D|\{SEAT\}/g, s); });
    $$("[data-seat-board]", root).forEach(a => {
      a.href = window.CA.seatBoardUrl(null, a.dataset.seatBoard || ""); a.target = "_blank"; a.rel = "noopener";
      if (!seat()) a.addEventListener("click", () => toast("Pick your lab seat in the top bar first 💺"));
    });
    $$("[data-seat-label]", root).forEach(el => { el.textContent = seat() ? "Seat " + seat() : "no seat chosen yet"; });
    // links to the Jira site that should follow the footer setting
    $$("a[data-jira]", root).forEach(a => { a.href = siteUrl() + a.dataset.jira; a.target = "_blank"; a.rel = "noopener"; });
  })();

  /* ---------------- Toast + confetti ---------------- */
  let toastEl;
  function toast(msg) {
    if (!toastEl) { toastEl = document.createElement("div"); toastEl.className = "toast"; toastEl.setAttribute("role", "status"); document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add("show");
    clearTimeout(toastEl._t); toastEl._t = setTimeout(() => toastEl.classList.remove("show"), 2600);
  }
  function confetti(n) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const glyphs = ["✈", "☁", "★", "✦", "🛫", "🎉"];
    for (let i = 0; i < (n || 28); i++) {
      const s = document.createElement("span"); s.className = "confetti";
      s.textContent = glyphs[i % glyphs.length];
      s.style.left = Math.random() * 100 + "vw";
      s.style.color = ["#ffb81c", "#4a90e2", "#0033a0", "#8cbcf0"][i % 4];
      s.style.animationDuration = 1.8 + Math.random() * 1.8 + "s";
      document.body.appendChild(s); setTimeout(() => s.remove(), 4000);
    }
  }
  window.CA.toast = toast; window.CA.confetti = confetti;

  /* ---------------- Miles & status ---------------- */
  const TIERS = C.tiers;
  const tierFor = m => TIERS.filter(t => m >= t[0]).pop()[1];
  function miles() { const done = store.get("done", {}); return Object.values(done).reduce((a, b) => a + (+b || 0), 0); }
  function renderMiles() {
    const m = miles();
    $$("[data-miles-pill]").forEach(el => el.textContent = "✈ " + m.toLocaleString() + " mi · " + tierFor(m));
    $$("[data-miles-total]").forEach(el => el.textContent = m.toLocaleString());
    $$("[data-miles-tier]").forEach(el => el.textContent = tierFor(m));
    const next = TIERS.find(t => t[0] > m);
    $$("[data-miles-next]").forEach(el => el.textContent = next ? (next[0] - m).toLocaleString() + " mi to " + next[1] : "Top tier reached. Blue skies!");
    $$("[data-miles-bar]").forEach(el => { const prev = TIERS.filter(t => m >= t[0]).pop()[0]; const nx = next ? next[0] : prev + 1; el.style.width = Math.min(100, ((m - prev) / (nx - prev)) * 100) + "%"; });
    $$("[data-count-done]").forEach(el => el.textContent = Object.keys(store.get("done", {})).length);
    $$("[data-tiers]").forEach(el => el.innerHTML = TIERS.map(t => "<span>" + t[1] + " " + (t[0] >= 1000 ? (t[0] / 1000) + "k" : t[0]) + "</span>").join(""));
  }
  function award(id, amt, label) {
    const done = store.get("done", {});
    const before = tierFor(miles());
    if (done[id]) { delete done[id]; store.set("done", done); renderMiles(); return false; }
    done[id] = amt; store.set("done", done); renderMiles();
    const after = tierFor(miles());
    toast("+" + amt + " miles · " + (label || "Lab complete"));
    if (after !== before) { setTimeout(() => { toast("Status upgrade: " + after + " 🎖"); confetti(40); }, 900); } else confetti(14);
    return true;
  }
  function awardOnce(id, amt, label) { if (!store.get("done", {})[id]) award(id, amt, label); }
  window.CA.award = award; window.CA.awardOnce = awardOnce;
  $$("[data-miles-pill]").forEach(p => p.addEventListener("click", () => location.href = "index.html#logbook"));

  /* ---------------- Missions / labs ---------------- */
  $$(".mission").forEach(m => {
    const id = m.id || m.dataset.id; const amt = +(m.dataset.miles || 250);
    const btn = $(".complete-btn", m); if (!btn || !id) return;
    const sync = () => { const d = !!store.get("done", {})[id]; btn.classList.toggle("done", d); btn.textContent = d ? "✓ Lab complete" : "Mark lab complete"; const t = $('.toc a[href="#' + id + '"]'); t && t.classList.toggle("done", d); };
    btn.addEventListener("click", () => { award(id, amt, $(".mission-head h3", m) ? $(".mission-head h3", m).textContent : ""); sync(); });
    sync();
  });

  /* ---------------- Checklists ---------------- */
  $$(".checklist[data-id]").forEach(list => {
    const key = "chk:" + list.dataset.id; const saved = store.get(key, {});
    $$("input[type=checkbox]", list).forEach((cb, i) => {
      cb.checked = !!saved[i]; cb.closest("li").classList.toggle("checked", cb.checked);
      cb.addEventListener("change", () => { const s = store.get(key, {}); s[i] = cb.checked; store.set(key, s); cb.closest("li").classList.toggle("checked", cb.checked);
        if ($$("input[type=checkbox]", list).every(c => c.checked)) { toast("Checklist complete ✓"); confetti(12); } });
    });
  });

  /* ---------------- Evidence cards (learner outputs, autosaved) ---------------- */
  // <div class="evidence" data-evidence="m3"><h4>…</h4><label for="m3-a">…</label><textarea id="m3-a" data-field="story"></textarea></div>
  $$(".evidence[data-evidence]").forEach(card => {
    const key = "ev:" + card.dataset.evidence; const saved = store.get(key, {});
    let note = $(".saved", card); if (!note) { note = document.createElement("div"); note.className = "saved"; card.appendChild(note); }
    $$("[data-field]", card).forEach(f => {
      if (saved[f.dataset.field] != null) f.value = saved[f.dataset.field];
      let t; f.addEventListener("input", () => { clearTimeout(t); t = setTimeout(() => { const s = store.get(key, {}); s[f.dataset.field] = f.value; s._at = new Date().toISOString(); store.set(key, s); note.textContent = "Saved in this browser ✓"; }, 400); });
    });
  });
  window.CA.evidence = id => store.get("ev:" + id, {});

  /* ---------------- JQL highlighting / copy / run ---------------- */
  const KW = /\b(AND|OR|NOT|IN|IS|EMPTY|NULL|ORDER BY|ASC|DESC|WAS|CHANGED|DURING|BEFORE|AFTER|ON|BY|FROM|TO)\b/g;
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  window.CA.esc = esc;
  function hlJql(src) {
    const parts = []; let out = src.replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(--[^\n]*)/g, (m, str, cm) => { parts.push(str ? '<span class="tok-str">' + esc(str) + "</span>" : '<span class="tok-cm">' + esc(cm) + "</span>"); return "\u0000" + (parts.length - 1) + "\u0000"; });
    out = esc(out)
      .replace(/\b([a-zA-Z]+)\(/g, '<span class="tok-fn">$1</span>(')
      .replace(KW, '<span class="tok-kw">$1</span>')
      .replace(/(!=|~|!~|&gt;=|&lt;=|(?<![a-z-])&gt;|(?<![a-z-])&lt;)/g, '<span class="tok-op">$1</span>');
    return out.replace(/\u0000(\d+)\u0000/g, (m, i) => parts[+i]);
  }
  function stripComments(q) { return q.split("\n").map(l => l.replace(/--.*$/, "")).join(" ").replace(/\s+/g, " ").trim(); }
  function refreshRunLinks() { $$("a[data-run-jql]").forEach(a => { a.href = siteUrl() + "/issues/?jql=" + encodeURIComponent(a.dataset.runJql); }); }
  $$("pre[data-jql], pre[data-code]").forEach(pre => {
    const isJql = pre.hasAttribute("data-jql");
    const raw = pre.textContent.replace(/^\n+|\s+$/g, "");
    const wrap = document.createElement("div"); wrap.className = "codeblock";
    const label = pre.dataset.label || (isJql ? "JQL" : (pre.dataset.code || "Code"));
    const head = document.createElement("div"); head.className = "cb-head";
    head.innerHTML = "<span>" + esc(label) + '</span><span class="cb-actions"></span>';
    const actions = $(".cb-actions", head);
    const copy = document.createElement("button"); copy.className = "cb-btn"; copy.type = "button"; copy.textContent = "Copy";
    copy.addEventListener("click", () => { const txt = isJql ? stripComments(raw) : raw; (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => { copy.textContent = "Copied ✓"; setTimeout(() => copy.textContent = "Copy", 1400); }).catch(() => toast("Select the text and copy it manually")); });
    actions.appendChild(copy);
    if (isJql && pre.dataset.jql !== "norun") {
      const run = document.createElement("a"); run.className = "cb-btn run"; run.target = "_blank"; run.rel = "noopener"; run.textContent = "Run in Jira ↗";
      run.dataset.runJql = stripComments(raw); actions.appendChild(run);
    }
    pre.parentNode.insertBefore(wrap, pre); wrap.appendChild(head); wrap.appendChild(pre);
    pre.innerHTML = isJql ? hlJql(raw) : esc(raw);
  });
  refreshRunLinks();
  window.CA.hlJql = hlJql; window.CA.refreshRunLinks = refreshRunLinks;

  /* ---------------- Quizzes (checkpoints) ---------------- */
  $$(".quiz[data-id]").forEach(quiz => {
    const qs = $$(".q", quiz); let answered = 0, right = 0;
    const scoreEl = $(".quiz-score", quiz);
    const pass = +(quiz.dataset.pass || 80);
    const update = () => {
      if (!scoreEl) return;
      const pct = Math.round((right / qs.length) * 100);
      $("b", scoreEl).textContent = right + " / " + qs.length;
      const msg = $(".msg", scoreEl);
      if (answered < qs.length) msg.textContent = (qs.length - answered) + " question(s) to go…";
      else if (pct >= pass) { msg.textContent = "Checkpoint passed (" + pct + "%). Cleared for the next leg ✈"; const id = "quiz:" + quiz.dataset.id; if (!store.get("done", {})[id]) award(id, +(quiz.dataset.miles || 200), "Checkpoint passed"); confetti(40); }
      else msg.textContent = "Score " + pct + "%. You need " + pass + "%. Review and try again.";
    };
    qs.forEach(q => {
      const box = $(".opts", q);
      if (box) { const kids = $$("button.opt", box); for (let i = kids.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [kids[i], kids[j]] = [kids[j], kids[i]]; } kids.forEach(k => box.appendChild(k)); }
      const opts = $$("button.opt", q);
      opts.forEach(o => o.addEventListener("click", () => {
        if (q.classList.contains("answered")) return;
        q.classList.add("answered"); answered++;
        const ok = o.hasAttribute("data-right");
        if (ok) right++;
        o.classList.add(ok ? "right" : "wrong");
        opts.forEach(x => { x.disabled = true; if (x.hasAttribute("data-right")) x.classList.add("right"); });
        update();
      }));
    });
    const retry = $(".retry", quiz);
    retry && retry.addEventListener("click", () => { qs.forEach(q => { q.classList.remove("answered"); $$("button.opt", q).forEach(o => { o.disabled = false; o.classList.remove("right", "wrong"); }); }); answered = right = 0; update(); quiz.scrollIntoView({ behavior: "smooth" }); });
    update();
  });

  /* ---------------- Sort / match games ----------------
     <div class="sort-game" data-id="m2-sort" data-miles="150">
       <div class="sort-card" data-answer="Spike"><p>…</p><div class="choices"><button>Story</button>…</div><div class="why">…</div></div>
       <div class="game-score"></div></div> */
  $$(".sort-game[data-id]").forEach(game => {
    const cards = $$(".sort-card", game); let done = 0, right = 0; const score = $(".game-score", game);
    const upd = () => { if (score) score.textContent = done < cards.length ? right + " right of " + done + " answered · " + (cards.length - done) + " to go" : "Final: " + right + " / " + cards.length + (right === cards.length ? " · Perfect sort ✈" : " · Read the explanations, then try the reset."); if (done === cards.length && right >= Math.ceil(cards.length * .75)) awardOnce("game:" + game.dataset.id, +(game.dataset.miles || 150), "Sorting game"); };
    cards.forEach(card => {
      const ans = card.dataset.answer.split("|");
      $$(".choices button", card).forEach(b => { b.type = "button"; b.addEventListener("click", () => {
        if (card.classList.contains("answered")) return;
        card.classList.add("answered"); done++;
        const ok = ans.includes(b.textContent.trim()); if (ok) right++;
        b.classList.add(ok ? "right" : "wrong");
        $$(".choices button", card).forEach(x => { x.disabled = true; if (ans.includes(x.textContent.trim())) x.classList.add("right"); });
        upd();
      }); });
    });
    const reset = $(".reset", game);
    reset && reset.addEventListener("click", () => { cards.forEach(c => { c.classList.remove("answered"); $$(".choices button", c).forEach(x => { x.disabled = false; x.classList.remove("right", "wrong"); }); }); done = right = 0; upd(); });
    upd();
  });

  /* ---------------- Split-flap departure board ---------------- */
  const CH = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:.-+→";
  function flap(el) {
    const target = (el.dataset.text || el.textContent).toUpperCase(); el.textContent = "";
    const spans = Array.from(target).map(() => { const s = document.createElement("span"); s.textContent = " "; el.appendChild(s); return s; });
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { spans.forEach((s, i) => s.textContent = target[i]); return; }
    spans.forEach((s, i) => {
      let n = 0; const stop = 6 + Math.floor(Math.random() * 10) + i;
      const t = setInterval(() => {
        n++; s.classList.remove("flip"); void s.offsetWidth; s.classList.add("flip");
        if (n >= stop) { s.textContent = target[i]; clearInterval(t); }
        else s.textContent = CH[Math.floor(Math.random() * CH.length)];
      }, 55);
    });
  }
  window.CA.flap = flap;
  const flapObs = "IntersectionObserver" in window ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { flap(e.target); flapObs.unobserve(e.target); } }), { threshold: .3 }) : null;
  $$(".flap").forEach(f => { f.dataset.text = f.textContent; flapObs ? flapObs.observe(f) : flap(f); });
  $$(".board-clock").forEach(c => { const tick = () => c.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + " LOCAL"; tick(); setInterval(tick, 15000); });

  /* ---------------- Lightbox for screenshots ---------------- */
  const lb = document.createElement("div"); lb.className = "lightbox"; lb.innerHTML = "<img alt=''>"; document.body.appendChild(lb);
  lb.addEventListener("click", () => lb.classList.remove("open"));
  document.addEventListener("keydown", e => { if (e.key === "Escape") lb.classList.remove("open"); });
  $$("figure.shot img").forEach(img => img.addEventListener("click", () => { $("img", lb).src = img.src; $("img", lb).alt = img.alt; lb.classList.add("open"); }));

  /* ---------------- TOC scroll spy ---------------- */
  const tocLinks = $$(".toc a[href^='#']");
  if (tocLinks.length && "IntersectionObserver" in window) {
    const map = new Map(tocLinks.map(a => [a.getAttribute("href").slice(1), a]));
    const spy = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { tocLinks.forEach(a => a.classList.remove("active")); const a = map.get(e.target.id); a && a.classList.add("active"); } }), { rootMargin: "-20% 0px -70% 0px" });
    map.forEach((a, id) => { const t = document.getElementById(id); t && spy.observe(t); });
  }

  /* ---------------- Module progress on the home page ----------------
     <span data-module-status="m3"></span> -> "✓ Lab done" when the module's lab id (m3-lab) is complete */
  $$("[data-module-status]").forEach(el => { const id = el.dataset.moduleStatus; const d = store.get("done", {}); const n = Object.keys(d).filter(k => k === id + "-lab" || k === "quiz:" + id).length; el.textContent = n === 2 ? "✓ Done" : n === 1 ? "In progress" : "Not started"; el.className = "status-board " + (n === 2 ? "st-boarding" : n === 1 ? "st-final" : "st-ontime"); });

  /* ---------------- Easter egg: barrel roll ---------------- */
  const code = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"]; let pos = 0;
  document.addEventListener("keydown", e => {
    pos = e.key === code[pos] ? pos + 1 : (e.key === code[0] ? 1 : 0);
    if (pos === code.length) { pos = 0; document.body.classList.add("barrel"); setTimeout(() => document.body.classList.remove("barrel"), 1300); toast("Do a barrel roll! +100 bonus miles"); awardOnce("egg:barrel", 100, "Secret maneuver"); }
  });

  renderMiles();
})();
