/* Fidelity Hub — interazioni della pagina (la scena 3D è in scene.js) */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const hasGsap = typeof gsap !== "undefined";
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);
  $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

  /* stato condiviso con scene.js */
  const FH = (window.FH = window.FH || { progress: 0, total: 5.2 });

  /* ---------- scroll morbido ---------- */
  let lenis = null;
  if (!reduce && typeof Lenis !== "undefined" && hasGsap) {
    lenis = new Lenis({ lerp: 0.085 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const story = $("#storia");
  const storyY = (T) => story.offsetTop + (story.offsetHeight - innerHeight) * (T / FH.total);
  const go = (y) => (lenis ? lenis.scrollTo(y, { duration: 1.6 }) : scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" }));

  /* ---------- menu ---------- */
  const burger = $(".nav__burger"), menu = $("#menu");
  const setMenu = (open) => {
    burger.setAttribute("aria-expanded", open);
    burger.setAttribute("aria-label", open ? "Chiudi il menu" : "Apri il menu");
    menu.hidden = !open;
    document.body.style.overflow = open ? "hidden" : "";
    if (lenis) open ? lenis.stop() : lenis.start();
  };
  burger.addEventListener("click", () => setMenu(burger.getAttribute("aria-expanded") !== "true"));
  addEventListener("keydown", (e) => { if (e.key === "Escape" && !menu.hidden) { setMenu(false); burger.focus(); } });

  /* ---------- informativa privacy ---------- */
  const policy = $("#policy");
  let policyFrom = null;
  const openPolicy = () => {
    policyFrom = document.activeElement;
    policy.showModal();
    $(".policy__body", policy).scrollTop = 0;
    document.body.style.overflow = "hidden";
    if (lenis) lenis.stop();
  };
  policy.addEventListener("close", () => {
    document.body.style.overflow = "";
    if (lenis) lenis.start();
    if (policyFrom) policyFrom.focus();
  });
  $$(".policy__close, [data-close]", policy).forEach((b) => b.addEventListener("click", () => policy.close()));
  policy.addEventListener("click", (e) => { if (e.target === policy) policy.close(); });
  if (location.hash === "#privacy") openPolicy();

  $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
    const id = a.getAttribute("href");
    if (id === "#privacy") { e.preventDefault(); return openPolicy(); }
    if (id === "#main") return;
    e.preventDefault();
    if (!menu.hidden) setMenu(false);
    if (id === "#top" || id === "#storia") return go(id === "#top" ? 0 : storyY(1.55));
    if (id === "#s1") return go(storyY(1.55));
    const t = $(id);
    if (t) go(t.getBoundingClientRect().top + scrollY - 70);
  }));

  /* ---------- nav con sfondo dopo l'apertura ---------- */
  const nav = $("#nav");
  const onScroll = () => nav.classList.toggle("is-solid", scrollY > story.offsetTop + story.offsetHeight - innerHeight - 10);
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* ---------- storia: avanzamento e testi ---------- */
  const steps = $$(".step"), dots = $$(".story__dots li");
  const CUT = [0.7, 2.2, 3.8];
  let cur = 0;
  const setStep = (i) => {
    if (i === cur) return;
    steps.forEach((s, k) => { s.classList.toggle("is-on", k === i); s.classList.toggle("is-past", k < i); s.setAttribute("aria-hidden", k !== i); });
    dots.forEach((d, k) => d.classList.toggle("is-on", k === i));
    cur = i;
  };
  steps.forEach((s, k) => s.setAttribute("aria-hidden", k !== 0));
  const readStory = () => {
    const max = story.offsetHeight - innerHeight;
    const p = Math.min(1, Math.max(0, (scrollY - story.offsetTop) / max));
    FH.progress = p;
    const T = p * FH.total;
    setStep(T < CUT[0] ? 0 : T < CUT[1] ? 1 : T < CUT[2] ? 2 : 3);
  };
  addEventListener("scroll", readStory, { passive: true });
  addEventListener("resize", readStory);
  readStory();

  /* ---------- QR finti per le carte DOM ---------- */
  const qr = (seed) => {
    let s = seed;
    const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    const N = 21, cells = [];
    const finder = (x, y) => cells.push(`<path d="M${x} ${y}h7v7h-7zM${x + 1} ${y + 1}v5h5v-5z" fill-rule="evenodd"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3"/>`);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const inF = (x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12);
      if (!inF && rnd() > 0.52) cells.push(`<rect x="${x}" y="${y}" width="1" height="1"/>`);
    }
    finder(0, 0); finder(14, 0); finder(0, 14);
    return `<svg viewBox="0 0 21 21" fill="#161618" shape-rendering="crispEdges" aria-hidden="true">${cells.join("")}</svg>`;
  };
  $$(".pass__qr").forEach((el, i) => (el.innerHTML = qr(17 + i * 31)));

  /* ---------- settori: carta che cambia ---------- */
  const SECTORS = {
    bar:    { name: "Caffè Aurora", ic: "A", bg: "#FD6B11", fg: "#FFFFFF", acc: "#FFFFFF", unit: "Timbri", on: 7, tot: 10, reward: "Caffè omaggio", rule: "Ogni 10 caffè, uno lo offri tu.", idea: "Idea notifica: «Piove? Dalle 15 alle 17 il cappuccino lo offriamo noi.»" },
    pizza:  { name: "Pizzeria Da Gino", ic: "G", bg: "#161618", fg: "#FFFFFF", acc: "#FD6B11", unit: "Pizze", on: 4, tot: 8, reward: "Margherita omaggio", rule: "Ogni 8 pizze, la nona è della casa.", idea: "Idea notifica: «Stasera la seconda pizza costa la metà.»" },
    hair:   { name: "Studio Capelli", ic: "S", bg: "#F1E6DA", fg: "#161618", acc: "#161618", unit: "Tagli", on: 3, tot: 5, reward: "Piega omaggio", rule: "Ogni 5 tagli, una piega in regalo.", idea: "Idea notifica: «Sabato mattina ci sono ancora posti liberi.»" },
    beauty: { name: "Centro Iris", ic: "I", bg: "#E9CFC7", fg: "#161618", acc: "#161618", unit: "Trattamenti", on: 2, tot: 6, reward: "Trattamento viso", rule: "Al sesto trattamento, il viso è in regalo.", idea: "Idea notifica: «Buon compleanno! Questo mese hai uno sconto del 20%.»" },
    gym:    { name: "Fit Lab", ic: "F", bg: "#1F3A2E", fg: "#FFFFFF", acc: "#C9F27A", unit: "Ingressi", on: 9, tot: 10, reward: "Ingresso amico", rule: "Ogni 10 ingressi, porti un amico gratis.", idea: "Idea notifica: «Non ti vediamo da due settimane: domani lezione di prova per te e un amico.»" },
    shop:   { name: "Boutique Lina", ic: "L", bg: "#FFFFFF", fg: "#161618", acc: "#FD6B11", unit: "Acquisti", on: 6, tot: 10, reward: "Buono da 20 €", rule: "Ogni 10 acquisti, un buono da 20 €.", idea: "Idea notifica: «È arrivata la nuova collezione: anteprima riservata ai clienti con la carta.»" },
    pharma: { name: "Farmacia Centrale", ic: "+", bg: "#0E6B50", fg: "#FFFFFF", acc: "#FFFFFF", unit: "Visite", on: 5, tot: 10, reward: "Buono parafarmacia", rule: "Premi su parafarmaco e cosmesi.", idea: "Idea notifica: «Giovedì misurazione della pressione gratuita in farmacia.»" },
    bakery: { name: "Forno Bianchi", ic: "B", bg: "#F4D29C", fg: "#161618", acc: "#161618", unit: "Spese", on: 10, tot: 12, reward: "Torta della domenica", rule: "Alla dodicesima spesa, la torta è nostra.", idea: "Idea notifica: «Il pane caldo esce alle 17: passa a prenderlo.»" },
  };
  const live = $("#livePass");
  const setSector = (key) => {
    const d = SECTORS[key];
    live.style.setProperty("--bg", d.bg); live.style.setProperty("--fg", d.fg); live.style.setProperty("--acc", d.acc);
    const f = (n) => $(`[data-f="${n}"]`);
    f("ic").textContent = d.ic; f("name").textContent = d.name; f("unitLabel").textContent = d.unit;
    f("value").textContent = `${d.on}/${d.tot}`; f("reward").textContent = d.reward;
    f("rule").textContent = d.rule; f("idea").textContent = d.idea;
    const st = f("stamps");
    st.style.gridTemplateColumns = `repeat(${Math.min(d.tot, d.tot > 10 ? 6 : 5)}, 1fr)`;
    st.innerHTML = Array.from({ length: d.tot }, (_, i) => `<i class="${i < d.on ? "on" : ""}"></i>`).join("");
    if (hasGsap && !reduce) gsap.from(live, { rotateY: -30, scale: 0.94, duration: 0.9, ease: "expo.out", clearProps: "rotate,scale" });
  };
  const tabs = $$("[data-sector]");
  tabs.forEach((b) => b.addEventListener("click", () => {
    tabs.forEach((t) => { t.setAttribute("aria-selected", t === b); t.tabIndex = t === b ? 0 : -1; });
    setSector(b.dataset.sector);
  }));
  tabs.forEach((t, i) => (t.tabIndex = i ? -1 : 0));
  $(".tabs").addEventListener("keydown", (e) => {
    const i = tabs.indexOf(document.activeElement);
    if (i < 0 || !["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"].includes(e.key)) return;
    e.preventDefault();
    const n = tabs[(i + (e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : tabs.length - 1)) % tabs.length];
    n.focus(); n.click();
  });
  setSector("bar");

  /* carta che si inclina col mouse */
  if (fine && !reduce) $$("[data-tilt]").forEach((wrap) => {
    const card = wrap.firstElementChild;
    wrap.parentElement.addEventListener("pointermove", (e) => {
      const r = wrap.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      card.style.setProperty("--ry", `${x * 22 - 4}deg`); card.style.setProperty("--rx", `${-y * 16}deg`);
    });
    wrap.parentElement.addEventListener("pointerleave", () => { card.style.setProperty("--ry", "-8deg"); card.style.setProperty("--rx", "0deg"); });
  });

  /* ---------- dashboard: compositore notifiche ---------- */
  const msg = $("#msg"), txt = $("#notifText"), count = $("#count"), prev = $("#notifPreview");
  const syncMsg = () => { txt.textContent = msg.value.trim() || "Scrivi qualcosa…"; count.textContent = msg.value.length; };
  msg.addEventListener("input", syncMsg); syncMsg();
  $("#sendNotif").addEventListener("click", () => {
    prev.classList.remove("is-pop"); void prev.offsetWidth; prev.classList.add("is-pop");
    const n = $('input[name="to"]:checked').value === "tutti" ? "1.248" : "214";
    count.parentElement.innerHTML = `<span id="count">${msg.value.length}</span>/110 caratteri · prova inviata a ${n} clienti (esempio)`;
  });

  /* ---------- modulo demo ---------- */
  const form = $("#demoForm");
  const errs = { nome: "Scrivi il tuo nome.", attivita: "Scrivi il nome della tua attività.", email: "Serve un'email valida per risponderti." };
  const show = (input, m) => { const b = input.closest(".field"); b.classList.toggle("is-bad", !!m); $(".field__err", b).textContent = m || ""; input.setAttribute("aria-invalid", !!m); };
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    let first = null;
    for (const k of ["nome", "attivita", "email"]) {
      const i = form.elements[k], v = i.value.trim();
      const ok = v && (k !== "email" || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v));
      show(i, ok ? "" : errs[k]); if (!ok && !first) first = i;
    }
    const p = form.elements.privacy;
    $(".field__err--privacy").textContent = p.checked ? "" : "Per inviare devi accettare l'informativa.";
    if (!p.checked && !first) first = p;
    if (first) return first.focus();
    const fd = new FormData(form);
    const body = ["Nome: " + fd.get("nome"), "Attività: " + fd.get("attivita"), "Settore: " + fd.get("settore"), "Email: " + fd.get("email"), "Telefono: " + (fd.get("telefono") || "—")].join("\n");
    location.href = `mailto:info@fidelityhub.it?subject=${encodeURIComponent("Richiesta demo — " + fd.get("attivita"))}&body=${encodeURIComponent(body)}`;
    const ok = $(".form__ok"); ok.hidden = false;
    ok.textContent = "Si è aperta la tua app di posta con la richiesta pronta: premi invia e ti contattiamo entro un giorno lavorativo.";
  });
  form.addEventListener("input", (e) => { if (e.target.closest(".is-bad")) show(e.target, ""); });

  if (!hasGsap || reduce) return;

  /* ---------- ingressi ---------- */
  const up = (sel, trig, extra = {}) => gsap.from(sel, { y: 50, opacity: 0, duration: 1.1, stagger: 0.08, ease: "expo.out", scrollTrigger: { trigger: trig, start: "top 82%" }, ...extra });
  $$(".h2").forEach((h) => up(h, h));
  up(".tabs button", ".tabs", { y: 20, stagger: 0.04 });
  up(".tile", ".bento");
  up(".cmp tbody tr", ".cmp", { y: 20 });
  up(".how__steps li", ".how__steps");
  up(".faq__list details", ".faq__list", { y: 24 });
  [".chart", ".art-chart"].forEach((s) => gsap.from(`${s} i`, { scaleY: 0, duration: 1.2, stagger: 0.05, ease: "expo.out", scrollTrigger: { trigger: s, start: "top 88%" } }));
  $$("[data-count]").forEach((el) => {
    const o = { v: 0 }, to = +el.dataset.count, suf = el.dataset.suf || "";
    gsap.to(o, { v: to, duration: 1.8, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%" }, onUpdate: () => (el.textContent = Math.round(o.v).toLocaleString("it-IT").replace(/^(\d)(\d{3})$/, "$1.$2") + suf) });
  });
  gsap.fromTo(".demo__mark", { xPercent: -10, rotate: -8 }, { xPercent: 10, rotate: 4, ease: "none", scrollTrigger: { trigger: ".demo", start: "top bottom", end: "bottom top", scrub: true } });

  /* bottoni che seguono il puntatore */
  if (fine) $$(".btn").forEach((b) => {
    const mx = gsap.quickTo(b, "x", { duration: 0.6, ease: "elastic.out(1, .5)" }), my = gsap.quickTo(b, "y", { duration: 0.6, ease: "elastic.out(1, .5)" });
    b.addEventListener("pointermove", (e) => { const r = b.getBoundingClientRect(); mx((e.clientX - r.left - r.width / 2) * 0.2); my((e.clientY - r.top - r.height / 2) * 0.3); });
    b.addEventListener("pointerleave", () => { mx(0); my(0); });
  });
})();
