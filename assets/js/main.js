/* ==========================================================================
   American Stone LS — interactions
   Depends on GSAP + ScrollTrigger (and optionally Lenis) loaded via CDN.
   Everything degrades gracefully if a library fails to load.
   ========================================================================== */
(function () {
  "use strict";

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGsap = typeof window.gsap !== "undefined";
  const hasST = hasGsap && typeof window.ScrollTrigger !== "undefined";
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  document.documentElement.classList.remove("no-js");
  if (reduced) document.documentElement.classList.add("reduced");
  if (hasST) gsap.registerPlugin(ScrollTrigger);

  /* ---------- Smooth scroll (Lenis) ---------- */
  let lenis = null;
  if (!reduced && typeof window.Lenis !== "undefined") {
    lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1, smoothWheel: true });
    window.__lenis = lenis; // handy for debugging in the console
    if (hasST) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }
  // anchor links play nicely with Lenis
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id.length < 2) return;
      const target = $(id);
      if (!target) return;
      e.preventDefault();
      closeMenu();
      if (lenis) lenis.scrollTo(target, { offset: -80, duration: 1.4 });
      else target.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
    });
  });

  /* ---------- Split headings into words ---------- */
  $$(".split").forEach((el) => {
    if (el.dataset.splitDone) return;
    const walk = (node) => {
      Array.from(node.childNodes).forEach((child) => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((piece) => {
            if (!piece) return;
            if (/^\s+$/.test(piece)) { frag.appendChild(document.createTextNode(" ")); return; }
            const w = document.createElement("span"); w.className = "w";
            const wi = document.createElement("span"); wi.className = "wi"; wi.textContent = piece;
            w.appendChild(wi); frag.appendChild(w);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1 && !child.classList.contains("w")) {
          walk(child);
        }
      });
    };
    walk(el);
    el.dataset.splitDone = "1";
  });

  const animateSplit = (el, delay = 0) => {
    const words = $$(".wi", el);
    if (!hasGsap || reduced) { el.classList.add("is-done"); return; }
    gsap.to(words, { y: 0, duration: 1.1, ease: "power4.out", stagger: 0.045, delay, onComplete: () => el.classList.add("is-done") });
  };

  /* ---------- Loader (stone wall that lays itself) ---------- */
  const loader = $(".loader");
  const runIntro = () => {
    // Hero entrance
    const hero = $(".hero");
    if (hero) {
      const media = $(".hero-media img", hero);
      if (hasGsap && !reduced && media) gsap.fromTo(media, { scale: 1.18 }, { scale: 1.08, duration: 2.4, ease: "power3.out" });
      $$(".split", hero).forEach((h, i) => animateSplit(h, 0.15 + i * 0.15));
      const items = $$("[data-hero]", hero);
      if (hasGsap && !reduced) gsap.fromTo(items, { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, ease: "power3.out", stagger: 0.12, delay: 0.55, clearProps: "transform" });
      else items.forEach((i) => (i.style.opacity = 1));
    }
    $$(".split:not(.hero .split)").forEach((el) => {
      if (hasST && !reduced) ScrollTrigger.create({ trigger: el, start: "top 88%", once: true, onEnter: () => animateSplit(el) });
      else el.classList.add("is-done");
    });
  };

  if (loader) {
    const wall = $(".loader-wall", loader);
    const seen = sessionStorage.getItem("as-intro");
    if (wall) {
      const cols = 8, rows = Math.ceil(window.innerHeight / (window.innerWidth / cols)) + 1;
      for (let i = 0; i < cols * rows; i++) wall.appendChild(document.createElement("span"));
    }
    if (!hasGsap || reduced || seen) {
      loader.classList.add("is-done");
      runIntro();
    } else {
      sessionStorage.setItem("as-intro", "1");
      if (lenis) lenis.stop();
      const bricks = $$("span", wall);
      const tl = gsap.timeline({ onComplete: () => { loader.classList.add("is-done"); if (lenis) lenis.start(); } });
      tl.to(bricks, { y: 0, opacity: 1, duration: 0.5, ease: "power3.out", stagger: { each: 0.012, from: "end", grid: "auto" } }, 0)
        .to($(".loader-mark", loader), { opacity: 1, duration: 0.7, ease: "power2.out" }, 0.35)
        .to($(".loader-line i", loader), { scaleX: 1, duration: 1.0, ease: "power2.inOut" }, 0.35)
        .to($(".loader-mark", loader), { opacity: 0, y: -14, duration: 0.45, ease: "power2.in" }, 1.55)
        .to(loader, { yPercent: -100, duration: 0.9, ease: "power4.inOut" }, 1.7)
        .add(runIntro, 1.85);
    }
  } else {
    runIntro();
  }

  /* ---------- Header ---------- */
  const header = $(".header");
  let lastY = 0;
  const onScroll = () => {
    const y = window.scrollY || document.documentElement.scrollTop;
    if (!header) return;
    header.classList.toggle("is-scrolled", y > 40);
    if (y > 320 && y > lastY + 6 && !document.body.classList.contains("menu-open")) header.classList.add("is-hidden");
    else if (y < lastY - 6 || y < 320) header.classList.remove("is-hidden");
    lastY = y;
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  const burger = $(".burger");
  function closeMenu() {
    document.body.classList.remove("menu-open");
    if (burger) burger.setAttribute("aria-expanded", "false");
    if (lenis) lenis.start();
  }
  if (burger) {
    burger.addEventListener("click", () => {
      const open = document.body.classList.toggle("menu-open");
      burger.setAttribute("aria-expanded", String(open));
      if (lenis) open ? lenis.stop() : lenis.start();
    });
    $$(".menu a").forEach((a) => a.addEventListener("click", closeMenu));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });
  }

  /* ---------- Trowel cursor + mortar trail ---------- */
  const TROWEL = '<path d="M3 5l13 3.5L20 20 3 5z" fill="currentColor"/><path d="M17 17l9 9" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><path d="M24 24l4.5 4.5" stroke="#c4933c" stroke-width="4" stroke-linecap="round"/>';
  // every arrow icon becomes a small trowel
  $$(".arrow").forEach((svg) => { svg.setAttribute("viewBox", "0 0 32 32"); svg.removeAttribute("stroke"); svg.removeAttribute("fill"); svg.innerHTML = TROWEL; });
  const cursor = $(".cursor"), mortar = $(".mortar");
  if (cursor && mortar && finePointer && !reduced && hasGsap) {
    document.documentElement.classList.add("has-trowel");
    const label = $(".cursor-label", cursor);
    const xTo = gsap.quickTo(cursor, "x", { duration: 0.12, ease: "power3" });
    const yTo = gsap.quickTo(cursor, "y", { duration: 0.12, ease: "power3" });
    const ctx = mortar.getContext("2d");
    let blobs = [], last = { x: -1, y: -1 }, raf = null, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = () => { mortar.width = innerWidth * dpr; mortar.height = innerHeight * dpr; mortar.style.width = innerWidth + "px"; mortar.style.height = innerHeight + "px"; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    size(); window.addEventListener("resize", size);
    const add = (x, y, r, life) => { blobs.push({ x: x + (Math.random() - 0.5) * 6, y: y + (Math.random() - 0.5) * 6, r, born: performance.now(), life, a: Math.random() * Math.PI }); if (!raf) raf = requestAnimationFrame(draw); };
    const draw = (now) => {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      blobs = blobs.filter((b) => now - b.born < b.life);
      blobs.forEach((b) => {
        const t = (now - b.born) / b.life, alpha = (1 - t) * 0.55, rr = b.r * (1 + t * 0.25);
        ctx.beginPath(); ctx.ellipse(b.x, b.y, rr, rr * 0.72, b.a, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(140,132,118,${alpha})`; ctx.fill();
      });
      raf = blobs.length ? requestAnimationFrame(draw) : null;
    };
    window.addEventListener("mousemove", (e) => {
      xTo(e.clientX); yTo(e.clientY);
      const d = Math.hypot(e.clientX - last.x, e.clientY - last.y);
      if (d > 7) { add(e.clientX + 4, e.clientY + 4, 4 + Math.min(d, 40) * 0.18, 900); last = { x: e.clientX, y: e.clientY }; }
    }, { passive: true });
    window.addEventListener("mousedown", (e) => { cursor.classList.add("is-down"); for (let i = 0; i < 9; i++) add(e.clientX + (Math.random() - 0.5) * 34, e.clientY + (Math.random() - 0.5) * 34, 5 + Math.random() * 9, 1400 + Math.random() * 600); });
    window.addEventListener("mouseup", () => cursor.classList.remove("is-down"));
    document.addEventListener("mouseover", (e) => {
      const view = e.target.closest("[data-cursor]");
      const link = e.target.closest("a, button, summary, input[type=range], [role=button]");
      cursor.classList.toggle("is-view", !!view);
      if (view) label.textContent = view.dataset.cursor || "View";
      cursor.classList.toggle("is-link", !!link);
    });
    document.addEventListener("mouseleave", () => { cursor.style.opacity = 0; });
    document.addEventListener("mouseenter", () => { cursor.style.opacity = 1; });
  }

  /* ---------- Scroll reveals ---------- */
  const revealEls = $$("[data-reveal]");
  if ("IntersectionObserver" in window && !reduced) {
    const pending = new Set(revealEls);
    const show = (el) => {
      if (!pending.has(el)) return;
      pending.delete(el);
      const delay = parseFloat(el.dataset.delay || 0);
      setTimeout(() => el.classList.add("is-in"), delay * 1000);
    };
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { show(en.target); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0 });
    revealEls.forEach((el) => io.observe(el));
    // Safety net: anything the viewport has already scrolled past (fast scrolls, jump links,
    // throttled background tabs) is revealed immediately so nothing is left invisible.
    let tick = 0;
    const sweep = () => {
      tick = 0;
      pending.forEach((el) => { const r = el.getBoundingClientRect(); if (r.bottom < 0 || r.top < window.innerHeight * 0.94) { show(el); io.unobserve(el); } });
    };
    window.addEventListener("scroll", () => { if (!tick) tick = setTimeout(sweep, 180); }, { passive: true });
    window.addEventListener("load", () => setTimeout(sweep, 600));
  } else {
    revealEls.forEach((el) => el.classList.add("is-in"));
  }

  // Stone-set image reveal: images "settle" into place like a stone into mortar
  if (hasST && !reduced) {
    $$(".set img").forEach((img) => {
      gsap.fromTo(img, { clipPath: "inset(100% 0 0 0)", y: 40, rotate: -1.2, scale: 1.04 },
        { clipPath: "inset(0% 0 0 0)", y: 0, rotate: 0, scale: 1, duration: 1.3, ease: "power4.out",
          scrollTrigger: { trigger: img, start: "top 90%", once: true } });
    });
    // Parallax
    $$("[data-parallax]").forEach((el) => {
      const amt = parseFloat(el.dataset.parallax) || 12;
      gsap.fromTo(el, { yPercent: -amt }, { yPercent: amt, ease: "none", scrollTrigger: { trigger: el.closest("[data-parallax-wrap]") || el, start: "top bottom", end: "bottom top", scrub: true } });
    });
    // Hero image parallax on scroll
    const heroImg = $(".hero-media img");
    if (heroImg) gsap.to(heroImg, { yPercent: 18, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    // Process line draw
    const line = $(".process-line path");
    if (line) {
      const len = line.getTotalLength();
      gsap.set(line, { strokeDasharray: len, strokeDashoffset: len });
      gsap.to(line, { strokeDashoffset: 0, ease: "none", scrollTrigger: { trigger: ".steps", start: "top 80%", end: "bottom 60%", scrub: 0.6 } });
    }
    // Footer big text drift
    const big = $(".footer-big");
    if (big) gsap.fromTo(big, { yPercent: 30 }, { yPercent: 0, ease: "none", scrollTrigger: { trigger: ".footer", start: "top bottom", end: "bottom bottom", scrub: true } });
  }

  /* ---------- Counters ---------- */
  $$("[data-count]").forEach((el) => {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || "";
    const run = () => {
      if (!hasGsap || reduced) { el.textContent = target + suffix; return; }
      const o = { v: 0 };
      gsap.to(o, { v: target, duration: 1.8, ease: "power3.out", onUpdate: () => (el.textContent = Math.round(o.v) + suffix) });
    };
    if (hasST && !reduced) ScrollTrigger.create({ trigger: el, start: "top 88%", once: true, onEnter: run });
    else run();
  });

  /* ---------- Testimonials ---------- */
  const tWrap = $(".testimonials");
  if (tWrap) {
    const items = $$(".testimonial", tWrap);
    const dots = $(".t-dots", tWrap);
    let idx = 0, timer;
    items.forEach((_, i) => { const d = document.createElement("i"); if (i === 0) d.classList.add("is-active"); dots.appendChild(d); });
    const show = (n) => {
      idx = (n + items.length) % items.length;
      items.forEach((it, i) => it.classList.toggle("is-active", i === idx));
      $$("i", dots).forEach((d, i) => d.classList.toggle("is-active", i === idx));
    };
    const auto = () => { clearInterval(timer); if (!reduced) timer = setInterval(() => show(idx + 1), 6500); };
    $(".t-prev", tWrap).addEventListener("click", () => { show(idx - 1); auto(); });
    $(".t-next", tWrap).addEventListener("click", () => { show(idx + 1); auto(); });
    auto();
  }

  /* ---------- Work filters ---------- */
  const filters = $(".filters");
  if (filters) {
    const items = $$("[data-cat]");
    filters.addEventListener("click", (e) => {
      const btn = e.target.closest("button"); if (!btn) return;
      $$("button", filters).forEach((b) => b.classList.toggle("is-active", b === btn));
      const f = btn.dataset.filter;
      items.forEach((it) => {
        const show = f === "all" || it.dataset.cat.split(" ").includes(f);
        it.classList.toggle("is-hidden", !show);
      });
      if (hasGsap && !reduced) gsap.fromTo(items.filter((i) => !i.classList.contains("is-hidden")), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.03, ease: "power3.out", clearProps: "all" });
      if (hasST) ScrollTrigger.refresh();
    });
  }

  /* ---------- Lightbox ---------- */
  const lb = $(".lightbox");
  if (lb) {
    const img = $("img", lb), cap = $("figcaption", lb);
    let list = [], cur = 0;
    const open = (i) => {
      cur = i; const a = list[cur];
      img.src = a.getAttribute("href"); img.alt = a.dataset.alt || "";
      cap.innerHTML = `<b>${a.dataset.title || ""}</b>${a.dataset.desc || ""}`;
      lb.classList.add("is-open"); if (lenis) lenis.stop();
    };
    const close = () => { lb.classList.remove("is-open"); if (lenis) lenis.start(); };
    document.addEventListener("click", (e) => {
      const a = e.target.closest("a[data-lightbox]"); if (!a) return;
      e.preventDefault();
      list = $$(`a[data-lightbox="${a.dataset.lightbox}"]`).filter((x) => !x.closest(".is-hidden"));
      open(list.indexOf(a));
    });
    $(".lb-close", lb).addEventListener("click", close);
    $(".lb-prev", lb).addEventListener("click", () => open((cur - 1 + list.length) % list.length));
    $(".lb-next", lb).addEventListener("click", () => open((cur + 1) % list.length));
    lb.addEventListener("click", (e) => { if (e.target === lb) close(); });
    document.addEventListener("keydown", (e) => {
      if (!lb.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") open((cur + 1) % list.length);
      if (e.key === "ArrowLeft") open((cur - 1 + list.length) % list.length);
    });
  }

  /* ---------- Compare slider ---------- */
  $$(".compare").forEach((c) => {
    const r = $("input", c);
    const set = () => c.style.setProperty("--pos", r.value + "%");
    r.addEventListener("input", set); set();
  });

  /* ---------- YouTube facade ---------- */
  $$(".yt").forEach((y) => {
    const id = y.dataset.id;
    if (!y.style.backgroundImage) y.style.backgroundImage = `url(https://i.ytimg.com/vi/${id}/hqdefault.jpg)`;
    y.addEventListener("click", () => {
      if (y.classList.contains("is-playing")) return;
      const f = document.createElement("iframe");
      f.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`;
      f.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      f.allowFullscreen = true; f.title = y.dataset.title || "Video";
      y.appendChild(f); y.classList.add("is-playing");
    });
  });

  /* ---------- Instagram embeds (lazy) ---------- */
  const igSlots = $$(".ig-slot[data-permalink]");
  if (igSlots.length) {
    let scriptLoaded = false;
    const process = () => { if (window.instgrm && window.instgrm.Embeds) window.instgrm.Embeds.process(); };
    const loadScript = () => {
      if (scriptLoaded) { process(); return; }
      scriptLoaded = true;
      const s = document.createElement("script"); s.async = true; s.src = "https://www.instagram.com/embed.js"; s.onload = process; document.body.appendChild(s);
    };
    const render = (slot) => {
      if (slot.dataset.done) return; slot.dataset.done = "1";
      const url = slot.dataset.permalink;
      slot.innerHTML = `<blockquote class="instagram-media" data-instgrm-permalink="${url}?utm_source=ig_embed&utm_campaign=loading" data-instgrm-version="14" style="background:#1c1a15;border:0;margin:0;padding:0;width:100%;"><a href="${url}" target="_blank" rel="noopener" style="display:block;padding:24px;color:#d3b47f;font-size:.8rem;letter-spacing:.2em;text-transform:uppercase;">View on Instagram</a></blockquote>`;
      loadScript();
    };
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => entries.forEach((en) => { if (en.isIntersecting) { render(en.target); io.unobserve(en.target); } }), { rootMargin: "400px 0px" });
      igSlots.forEach((s) => io.observe(s));
    } else igSlots.forEach(render);
  }

  /* ---------- Contact form ---------- */
  const form = $("form[data-form]");
  if (form) {
    const status = $(".form-status", form);
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if ($('input[name="bot-field"]', form) && $('input[name="bot-field"]', form).value) return;
      const data = new FormData(form);
      const btn = $('button[type="submit"]', form); btn.disabled = true;
      const fail = () => {
        // Fallback: open the visitor's mail client with the message pre-filled.
        const body = Array.from(data.entries()).filter(([k]) => !["bot-field", "form-name"].includes(k)).map(([k, v]) => `${k}: ${v}`).join("\n");
        window.location.href = `mailto:AmericanStoneLS@gmail.com?subject=${encodeURIComponent("Free estimate request — " + (data.get("name") || ""))}&body=${encodeURIComponent(body)}`;
        status.className = "form-status ok"; status.textContent = "Opening your email app so you can send the request directly. Or call (215) 794-3170.";
      };
      try {
        if (location.protocol === "file:") throw new Error("local");
        const res = await fetch(form.getAttribute("action") || "/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(data).toString() });
        if (!res.ok) throw new Error("bad");
        status.className = "form-status ok"; status.textContent = "Grazie! Your request is in. Luciano or Alex will call you within one business day.";
        form.reset();
      } catch (err) { fail(); }
      btn.disabled = false;
    });
  }

  /* ---------- Marquee duplication ---------- */
  $$(".marquee-track").forEach((t) => { t.innerHTML += t.innerHTML; });

  /* ---------- Active nav ---------- */
  const here = location.pathname.split("/").pop() || "index.html";
  $$(".nav a, .menu a").forEach((a) => { if ((a.getAttribute("href") || "").split("/").pop() === here) a.classList.add("is-active"); });

  /* ---------- Year ---------- */
  $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

  window.addEventListener("load", () => { if (hasST) ScrollTrigger.refresh(); });
})();
