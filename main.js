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
    if ($("#pick").open) return policyFrom && policyFrom.focus();
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
    if (id === "#main" || a.dataset.plan) return;
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

  /* ---------- carta fedeltà (DOM) ---------- */
  // fetta di pizza: crosta, pomodoro e salame
  const slice = (cls = "") => `<svg class="slice ${cls}" viewBox="0 0 32 32" aria-hidden="true"><path class="slice__cheese" d="M6.4 10.6Q16 5.4 25.6 10.6L17 27.6Q16 29.2 15 27.6Z"/><path class="slice__crust" d="M5.2 9.2Q16 2.8 26.8 9.2"/><circle class="slice__pep" cx="13" cy="13.4" r="2.1"/><circle class="slice__pep" cx="19.2" cy="14.6" r="1.8"/><circle class="slice__pep" cx="15.8" cy="20.2" r="1.6"/></svg>`;
  // icone dei timbri per settore: .f si riempie quando il timbro è preso, .d sono i dettagli sopra il pieno
  const ICONS = {
    cup: `<path class="f" d="M4.5 9h12v4.5a5.5 5.5 0 0 1-5.5 5.5h-1A5.5 5.5 0 0 1 4.5 13.5z"/><path d="M16.5 10.5h1.2a2.6 2.6 0 0 1 0 5.2h-1.6M8.5 3.5c-.9 1.1.9 2.1 0 3.2M12.5 3.5c-.9 1.1.9 2.1 0 3.2M3.5 21.5h15"/>`,
    scissors: `<path d="M8.8 8.3 20 17.5M8.8 15.7 20 6.5"/><circle class="f" cx="6.5" cy="6.5" r="2.8"/><circle class="f" cx="6.5" cy="17.5" r="2.8"/>`,
    sparkle: `<path class="f" d="M11 3.5l1.9 5.1 5.1 1.9-5.1 1.9L11 17.5l-1.9-5.1L4 10.5l5.1-1.9z"/><path class="f" d="M18 14.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>`,
    dumbbell: `<path d="M2.5 12H5M8.5 12h7M19 12h2.5"/><rect class="f" x="5" y="6.5" width="3.5" height="11" rx="1"/><rect class="f" x="15.5" y="6.5" width="3.5" height="11" rx="1"/>`,
    bag: `<path class="f" d="M5 8.5h14l-1.1 11a1.6 1.6 0 0 1-1.6 1.5H7.7a1.6 1.6 0 0 1-1.6-1.5z"/><path d="M9 8.5V7a3 3 0 0 1 6 0v1.5"/><path class="d" d="M9 12.5a3 3 0 0 0 6 0"/>`,
    cross: `<path class="f" d="M9 3.5h6V9h5.5v6H15v5.5H9V15H3.5V9H9z"/>`,
    bread: `<path class="f" d="M3.5 11.5C3.5 7.9 7.3 5.5 12 5.5s8.5 2.4 8.5 6c0 1-.6 1.6-1.5 1.8V19a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-5.7c-.9-.2-1.5-.8-1.5-1.8z"/><path class="d" d="M8.5 9.5l-1 2.5M12.5 9l-1 2.8M16.5 9.5l-1 2.5"/>`,
  };
  const ico = (k) => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${ICONS[k]}</svg>`;
  const stampArt = (k, on) => (k === "pizza" ? slice(on ? "" : "slice--off") : ico(k));
  const logoArt = (k) => (k === "pizza" ? `<span class="pass__logo">${slice()}</span>` : `<span class="pass__logo pass__logo--ico">${ico(k)}</span>`);
  const SECTORS = {
    pizza:  { name: "Pizzeria da Aurora", stamp: "pizza", bg: "#B5341C", fg: "#FFF4E6", acc: "#FFF4E6", unit: "Timbri", on: 7, tot: 10, reward: "Al 10° timbro una pizza in omaggio", rule: "Al decimo timbro, la pizza la offri tu.", idea: "Idea notifica: «Stasera la seconda pizza costa la metà.»" },
    bar:    { name: "Bar Gino", stamp: "cup", bg: "#FD6B11", fg: "#FFFFFF", acc: "#FFFFFF", unit: "Timbri", on: 7, tot: 10, reward: "Caffè omaggio", rule: "Ogni 10 caffè, uno lo offri tu.", idea: "Idea notifica: «Piove? Dalle 15 alle 17 il cappuccino lo offriamo noi.»" },
    hair:   { name: "Studio Capelli", stamp: "scissors", bg: "#F1E6DA", fg: "#161618", acc: "#161618", unit: "Tagli", on: 3, tot: 5, reward: "Piega omaggio", rule: "Ogni 5 tagli, una piega in regalo.", idea: "Idea notifica: «Sabato mattina ci sono ancora posti liberi.»" },
    beauty: { name: "Centro Iris", stamp: "sparkle", bg: "#E9CFC7", fg: "#161618", acc: "#161618", unit: "Trattamenti", on: 2, tot: 6, reward: "Trattamento viso", rule: "Al sesto trattamento, il viso è in regalo.", idea: "Idea notifica: «Buon compleanno! Questo mese hai uno sconto del 20%.»" },
    gym:    { name: "Fit Lab", stamp: "dumbbell", bg: "#1F3A2E", fg: "#FFFFFF", acc: "#C9F27A", unit: "Ingressi", on: 9, tot: 10, reward: "Ingresso amico", rule: "Ogni 10 ingressi, porti un amico gratis.", idea: "Idea notifica: «Non ti vediamo da due settimane: domani lezione di prova per te e un amico.»" },
    shop:   { name: "Boutique Lina", stamp: "bag", bg: "#FFFFFF", fg: "#161618", acc: "#FD6B11", unit: "Acquisti", on: 6, tot: 10, reward: "Buono da 20 €", rule: "Ogni 10 acquisti, un buono da 20 €.", idea: "Idea notifica: «È arrivata la nuova collezione: anteprima riservata ai clienti con la carta.»" },
    pharma: { name: "Farmacia Centrale", stamp: "cross", bg: "#0E6B50", fg: "#FFFFFF", acc: "#FFFFFF", unit: "Visite", on: 5, tot: 10, reward: "Buono parafarmacia", rule: "Premi su parafarmaco e cosmesi.", idea: "Idea notifica: «Giovedì misurazione della pressione gratuita in farmacia.»" },
    bakery: { name: "Forno Bianchi", stamp: "bread", bg: "#F4D29C", fg: "#161618", acc: "#161618", unit: "Spese", on: 10, tot: 12, reward: "Torta della domenica", rule: "Alla dodicesima spesa, la torta è nostra.", idea: "Idea notifica: «Il pane caldo esce alle 17: passa a prenderlo.»" },
  };
  const renderPass = (el, d, seed) => {
    el.style.setProperty("--bg", d.bg); el.style.setProperty("--fg", d.fg); el.style.setProperty("--acc", d.acc);
    const cols = d.tot <= 6 ? d.tot : Math.ceil(d.tot / 2);
    const stamps = Array.from({ length: d.tot }, (_, i) => `<i class="${i < d.on ? "on" : ""}">${stampArt(d.stamp, i < d.on)}</i>`).join("");
        el.innerHTML = `
      <div class="pass__head">
        ${logoArt(d.stamp)}
        <span class="pass__id"><small>Carta fedeltà</small><b>${d.name}</b></span>
        <span class="pass__val"><small>${d.unit}</small>${d.on}/${d.tot}</span>
      </div>
      <div class="pass__stamps" style="grid-template-columns: repeat(${cols}, 1fr)">${stamps}</div>
      <div class="pass__fields"><span><small>Premio</small>${d.reward}</span><span><small>Cliente</small>Giulia R.</span></div>
      <div class="pass__qr">${qr(seed)}</div>
      <span class="pass__brand wm" aria-hidden="true"></span>`;
  };
  $$("[data-pass]").forEach((el, i) => renderPass(el, SECTORS[el.dataset.pass], 17 + i * 31));

  /* ---------- settori: carta che cambia ---------- */
  const live = $("#livePass");
  const setSector = (key, animate = true) => {
    const d = SECTORS[key];
    renderPass(live, d, 48);
    $('[data-f="rule"]').textContent = d.rule; $('[data-f="idea"]').textContent = d.idea;
    if (animate && hasGsap && !reduce) gsap.from(live, { rotateY: -30, scale: 0.94, duration: 0.9, ease: "expo.out", clearProps: "rotate,scale" });
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
  setSector("pizza", false);

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

  /* ---------- moduli: richiesta demo e scelta del piano ---------- */
  const errs = { nome: "Scrivi il tuo nome.", attivita: "Scrivi il nome della tua attività.", email: "Serve un'email valida per risponderti." };
  const show = (input, m) => { const b = input.closest(".field"); b.classList.toggle("is-bad", !!m); $(".field__err", b).textContent = m || ""; input.setAttribute("aria-invalid", !!m); };
  // restituisce il primo campo da correggere, oppure null se è tutto a posto
  const invalid = (f) => {
    let first = null;
    for (const k of ["nome", "attivita", "email"]) {
      const i = f.elements[k], v = i.value.trim();
      const ok = v && (k !== "email" || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v));
      show(i, ok ? "" : errs[k]); if (!ok && !first) first = i;
    }
    const p = f.elements.privacy;
    $(".field__err--privacy", f).textContent = p.checked ? "" : "Per inviare devi accettare l'informativa.";
    return first || (p.checked ? null : p);
  };
  const mail = (subject, lines) => { location.href = `mailto:info@fidelityhub.it?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`; };

  const form = $("#demoForm");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const first = invalid(form);
    if (first) return first.focus();
    const fd = new FormData(form);
    mail("Richiesta demo — " + fd.get("attivita"), ["Nome: " + fd.get("nome"), "Attività: " + fd.get("attivita"), "Settore: " + fd.get("settore"), "Piano: " + fd.get("piano"), "Email: " + fd.get("email"), "Telefono: " + (fd.get("telefono") || "—")]);
    const ok = $(".form__ok"); ok.hidden = false;
    ok.textContent = "Si è aperta la tua app di posta con la richiesta pronta: premi invia e ti contattiamo entro un giorno lavorativo.";
  });

  /* finestra del piano: riepilogo, costi e richiesta senza lasciare la sezione prezzi */
  const pick = $("#pick"), pickForm = $("#pickForm"), pickOk = $(".pick__ok", pick);
  const SETUP = 100;
  const PLANS = {};
  $$(".plan").forEach((li) => {
    const name = $(".plan__name", li).textContent.trim();
    const m = $(".plan__price strong", li).textContent.match(/\d+/);
    PLANS[name] = { name, fee: m ? +m[0] : null, list: $(".plan__list", li).innerHTML };
  });
  const eur = (n) => "€" + n.toLocaleString("it-IT");
  let picked = null, pickFrom = null;
  const fill = (name) => {
    const d = PLANS[name]; picked = d;
    $$('[data-p="name"]', pick).forEach((el) => (el.textContent = d.name));
    $('[data-p="price"]', pick).innerHTML = d.fee ? `<strong>${eur(d.fee)}</strong><span>/mese</span>` : "<strong>Su richiesta</strong>";
    $('[data-p="list"]', pick).innerHTML = d.list;
    $('[data-p="sum"]', pick).innerHTML = d.fee
      ? `<div><dt>Attivazione una tantum</dt><dd>${eur(SETUP)}</dd></div><div><dt>Canone mensile</dt><dd>${eur(d.fee)}</dd></div><div class="pick__tot"><dt>Totale primo mese</dt><dd>${eur(SETUP + d.fee)}</dd></div><div><dt>Dal secondo mese</dt><dd>${eur(d.fee)}/mese</dd></div>`
      : `<div><dt>Attivazione una tantum</dt><dd>${eur(SETUP)}</dd></div><div class="pick__tot"><dt>Canone</dt><dd>Preventivo su misura</dd></div>`;
    $('[data-p="cta"]', pick).textContent = d.fee ? `Richiedi il piano ${d.name}` : "Richiedi un preventivo";
    pick.dataset.plan = d.name.toLowerCase();
    $$("[data-to]", pick).forEach((b) => b.setAttribute("aria-pressed", b.dataset.to === d.name));
    form.elements.piano.value = d.name;
  };
  const openPick = (name) => {
    pickFrom = document.activeElement;
    fill(name);
    pickForm.hidden = false; pickOk.hidden = true;
    pick.showModal();
    $(".pick__grid", pick).scrollTop = 0;
    document.body.style.overflow = "hidden";
    if (lenis) lenis.stop();
  };
  pick.addEventListener("close", () => {
    document.body.style.overflow = "";
    if (lenis) lenis.start();
    if (pickFrom) pickFrom.focus();
  });
  $$(".pick__close, [data-close]", pick).forEach((b) => b.addEventListener("click", () => pick.close()));
  pick.addEventListener("click", (e) => { if (e.target === pick) pick.close(); });
  $$("[data-to]", pick).forEach((b) => b.addEventListener("click", () => {
    fill(b.dataset.to);
    const fan = $(".pick__fan", pick); fan.classList.remove("is-swap"); void fan.offsetWidth; fan.classList.add("is-swap");
  }));
  $$("[data-plan]").forEach((b) => b.addEventListener("click", (e) => { e.preventDefault(); openPick(b.dataset.plan); }));
  pickForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const first = invalid(pickForm);
    if (first) return first.focus();
    const fd = new FormData(pickForm), d = picked;
    mail(`Richiesta piano ${d.name} — ${fd.get("attivita")}`, ["Piano: " + d.name + (d.fee ? ` (${eur(d.fee)}/mese + attivazione ${eur(SETUP)}, IVA esclusa)` : " (preventivo su misura)"), "Nome: " + fd.get("nome"), "Attività: " + fd.get("attivita"), "Email: " + fd.get("email"), "Telefono: " + (fd.get("telefono") || "—")]);
    $('[data-p="ok"]', pick).textContent = `Si è aperta la tua app di posta con la richiesta per il piano ${d.name}: premi invia e ti ricontattiamo entro un giorno lavorativo.`;
    pickForm.hidden = true; pickOk.hidden = false;
    if (!reduce) {
      const burst = $(".pick__burst", pick), cols = ["#FD6B11", "#FFB27A", "#161618", "#FFE3CF", "#B5341C"];
      burst.innerHTML = Array.from({ length: 26 }, (_, i) => {
        const a = (i / 26) * Math.PI * 2 + Math.random() * 0.3, r = 70 + Math.random() * 70;
        return `<i style="--x:${(Math.cos(a) * r).toFixed(1)}px;--y:${(Math.sin(a) * r - 20).toFixed(1)}px;--r:${Math.round(Math.random() * 540 - 270)}deg;--c:${cols[i % 5]};--d:${Math.round(Math.random() * 120)}ms"></i>`;
      }).join("");
    }
    $(".btn", pickOk).focus();
  });
  [form, pickForm].forEach((f) => f.addEventListener("input", (e) => { if (e.target.closest(".is-bad")) show(e.target, ""); }));

  /* ---------- ingressi delle card allo scroll ---------- */
  // lo spazio è già occupato: si animano solo opacity e transform; con riduzione del movimento restano visibili
  if (!reduce && "IntersectionObserver" in window) {
    const items = $$(".h2, .tabs, .tile, .cmp tbody tr, .how__steps li, .plan, .faq__list details");
    const done = (el) => { el.classList.remove("rv", "rv--in"); el.style.transitionDelay = ""; };
    const io = new IntersectionObserver((entries) => {
      const inn = entries.filter((e) => e.isIntersecting).map((e) => e.target);
      inn.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top || a.getBoundingClientRect().left - b.getBoundingClientRect().left);
      inn.forEach((el, k) => {
        io.unobserve(el);
        el.style.transitionDelay = `${Math.min(k, 6) * 70}ms`;
        el.classList.add("rv--in");
        el.addEventListener("transitionend", (e) => { if (e.target === el && e.propertyName === "opacity") done(el); });
        setTimeout(() => done(el), 1200 + k * 70);
      });
    }, { threshold: 0.15, rootMargin: "0px 0px 8% 0px" });
    items.forEach((el) => {
      // ciò che è già sullo schermo (o sopra) all'avvio non si anima
      if (el.getBoundingClientRect().top < innerHeight * 0.9) return;
      el.classList.add("rv"); io.observe(el);
    });
  }

  if (!hasGsap || reduce) return;

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
