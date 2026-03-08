/* ═══════════════════════════════════════════════════════════════════
   Baklawa Bites — Eid Al-Fitr Edition
   app.js — Complete
═══════════════════════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────
   GALLERY DATA
   Update src paths if your folder structure differs.
   alt text is shown in the sidebar caption.
───────────────────────────────────────── */
const GALLERY_IMAGES = [
  { src: 'assets/images/gallery/gallery_1.jpg', alt: 'Baklawa gift box on marble' },
  { src: 'assets/images/gallery/gallery_2.jpg', alt: 'Full tray of fresh baklawa' },
  { src: 'assets/images/gallery/gallery_3.jpg', alt: 'Open gold box — with love' },
  { src: 'assets/images/gallery/gallery_4.jpg', alt: 'Close-up of pistachio baklawa' },
  { src: 'assets/images/gallery/gallery_5.jpg', alt: 'Baklawa tray overhead shot' },
  { src: 'assets/images/gallery/gallery_6.jpg', alt: 'Freshly baked tray in rows' },
  { src: 'assets/images/gallery/gallery_7.jpg', alt: 'Gold box with ribbon bow' },
  { src: 'assets/images/gallery/gallery_8.jpg', alt: "Bird's-eye view of full tray" },
  { src: 'assets/images/gallery/gallery_9.jpg', alt: 'Open box with love tag' },
];

/* Visual offsets for each card in the stack (index 0 = top card) */
const STACK_OFFSETS = [
  { rot:  0.0, tx:  0, ty:  0 },   // top — perfectly flat
  { rot:  3.8, tx:  9, ty:  5 },   // 2nd — slightly right + tilted
  { rot: -3.0, tx: -7, ty: 10 },   // 3rd — slightly left
  { rot:  5.5, tx: 13, ty: 16 },   // 4th
  { rot: -4.2, tx:-11, ty: 22 },   // 5th (deepest visible)
];

const MAX_VISIBLE  = 5;    // how many cards to render in the DOM at once
const SWIPE_THRESHOLD = 75; // px horizontal drag to commit a swipe


/* ═══════════════════════════════════════════
   YEAR
═══════════════════════════════════════════ */
function initYear() {
  const el = document.getElementById('year');
  if (el) el.textContent = new Date().getFullYear();
}


/* ═══════════════════════════════════════════
   SCROLL REVEAL
═══════════════════════════════════════════ */
function initReveal() {
  document.documentElement.classList.add('js');
  const items = document.querySelectorAll('.reveal, .reveal-delay-1, .reveal-delay-2');

  if (!('IntersectionObserver' in window)) {
    items.forEach(el => el.classList.add('is-visible'));
    return;
  }

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  items.forEach(el => obs.observe(el));
}


/* ═══════════════════════════════════════════
   CARD DECK GALLERY
═══════════════════════════════════════════ */
function initDeckGallery() {
  /* ── DOM refs ── */
  const scene     = document.getElementById('deckScene');
  const labelLeft = document.getElementById('dragLeft');
  const labelRight= document.getElementById('dragRight');
  const curEl     = document.getElementById('deckCur');
  const totEl     = document.getElementById('deckTot');
  const capEl     = document.getElementById('deckCaption');
  const dotsEl    = document.getElementById('deckDots');
  const btnPrev   = document.getElementById('deckPrev');
  const btnNext   = document.getElementById('deckNext');

  if (!scene) return;

  /* ── State ── */
  let order      = [...GALLERY_IMAGES];   // index 0 = currently visible top card
  let cardEls    = [];                    // parallel DOM array
  let topIndex   = 0;                     // which GALLERY_IMAGES index is on top

  let isDragging  = false;
  let didDrag     = false;   // true if pointer moved enough to count as a drag
  let pointerStartX = 0;
  let pointerStartY = 0;
  let currentDX   = 0;
  let currentDY   = 0;
  let animating   = false;   // lock during fly-out

  /* ── Init total ── */
  totEl.textContent = GALLERY_IMAGES.length;

  /* ─────────────────────────────────────────
     BUILD / REBUILD THE DECK
  ───────────────────────────────────────── */
  function buildDeck() {
    /* Remove old cards */
    scene.querySelectorAll('.deck-card').forEach(c => c.remove());
    cardEls = [];

    /* Render up to MAX_VISIBLE cards.
       DOM order: deepest first → top card appended last → highest z-index */
    const count = Math.min(MAX_VISIBLE, order.length);
    for (let i = count - 1; i >= 0; i--) {
      const card = createCard(order[i], i);
      scene.appendChild(card);
      cardEls[i] = card;
    }

    buildDots();
    refreshUI();
  }

  function createCard(imgData, stackIdx) {
    const card = document.createElement('div');
    card.className = 'deck-card';
    card.setAttribute('role', 'img');
    card.setAttribute('aria-label', imgData.alt);

    const img = document.createElement('img');
    img.src = imgData.src;
    img.alt = imgData.alt;
    img.loading = stackIdx < 2 ? 'eager' : 'lazy';
    img.draggable = false;
    card.appendChild(img);

    applyStackTransform(card, stackIdx);
    return card;
  }

  function applyStackTransform(card, stackIdx) {
    const off = STACK_OFFSETS[Math.min(stackIdx, STACK_OFFSETS.length - 1)];
    const t   = `rotate(${off.rot}deg) translate(${off.tx}px, ${off.ty}px)`;
    card.style.setProperty('--natural-transform', t);
    card.style.transform = t;
    card.style.zIndex    = 100 - stackIdx;
  }

  /* ─────────────────────────────────────────
     DOTS
  ───────────────────────────────────────── */
  function buildDots() {
    dotsEl.innerHTML = '';
    GALLERY_IMAGES.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className   = 'deck-dot';
      dot.setAttribute('aria-label', `Photo ${i + 1}`);
      dot.setAttribute('role', 'tab');
      dot.addEventListener('click', () => goToIndex(i));
      dotsEl.appendChild(dot);
    });
  }

  /* ─────────────────────────────────────────
     UI REFRESH (counter, caption, dots)
  ───────────────────────────────────────── */
  function refreshUI() {
    /* Mark top card */
    cardEls.forEach((c, i) => {
      if (!c) return;
      c.classList.toggle('is-top', i === 0);
    });

    /* Counter */
    curEl.textContent = topIndex + 1;

    /* Caption with fade */
    capEl.classList.add('fading');
    setTimeout(() => {
      capEl.textContent = GALLERY_IMAGES[topIndex].alt;
      capEl.classList.remove('fading');
    }, 200);

    /* Dots */
    dotsEl.querySelectorAll('.deck-dot').forEach((d, i) => {
      d.classList.toggle('active', i === topIndex);
      d.setAttribute('aria-selected', i === topIndex ? 'true' : 'false');
    });
  }

  /* ─────────────────────────────────────────
     SWIPE: commit top card away
  ───────────────────────────────────────── */
  function swipe(direction) {
    if (animating || !cardEls[0]) return;
    animating = true;

    const top = cardEls[0];
    top.classList.remove('is-dragging');
    top.classList.add(direction === 'left' ? 'fly-left' : 'fly-right');

    top.addEventListener('animationend', () => {
      /* Cycle: move front of order to back */
      order.push(order.shift());
      topIndex = (topIndex + (direction === 'right' ? 1 : GALLERY_IMAGES.length - 1)) % GALLERY_IMAGES.length;
      animating = false;
      buildDeck();
    }, { once: true });
  }

  /* ─────────────────────────────────────────
     JUMP TO SPECIFIC INDEX (dot click)
  ───────────────────────────────────────── */
  function goToIndex(targetIdx) {
    if (animating) return;
    if (targetIdx === topIndex) return;

    /* Rotate the order array so targetIdx is at front */
    const imgAtTarget = GALLERY_IMAGES[targetIdx];
    const posInOrder  = order.findIndex(img => img === imgAtTarget);
    if (posInOrder < 0) return;

    /* If target is already second, just do one right swipe */
    if (posInOrder === 1) { swipe('right'); return; }

    /* Otherwise teleport: rebuild deck with target on top */
    order = [
      ...order.slice(posInOrder),
      ...order.slice(0, posInOrder),
    ];
    topIndex = targetIdx;
    buildDeck();
  }

  /* ─────────────────────────────────────────
     DRAG — SHARED LOGIC
  ───────────────────────────────────────── */
  function onDragStart(clientX, clientY) {
    if (animating || !cardEls[0]) return;
    isDragging    = true;
    didDrag       = false;
    pointerStartX = clientX;
    pointerStartY = clientY;
    currentDX     = 0;
    currentDY     = 0;
    cardEls[0].classList.add('is-dragging');
    cardEls[0].style.transition = 'none';
  }

  function onDragMove(clientX, clientY) {
    if (!isDragging || !cardEls[0]) return;
    currentDX = clientX - pointerStartX;
    currentDY = clientY - pointerStartY;

    /* Only treat as a drag (not a click) if moved > 6px */
    if (Math.abs(currentDX) > 6 || Math.abs(currentDY) > 6) didDrag = true;

    /* Rotate card with drag, pull Y very slightly */
    const rot   = currentDX * 0.07;
    const pullY = currentDY * 0.25;
    cardEls[0].style.transform =
      `rotate(${rot.toFixed(2)}deg) translate(${currentDX}px, ${pullY.toFixed(1)}px)`;

    /* Show direction labels based on horizontal progress */
    const progress = Math.min(Math.abs(currentDX) / SWIPE_THRESHOLD, 1);
    if (currentDX < -12) {
      labelLeft.classList.add('visible');
      labelLeft.style.opacity  = progress;
      labelRight.classList.remove('visible');
    } else if (currentDX > 12) {
      labelRight.classList.add('visible');
      labelRight.style.opacity  = progress;
      labelLeft.classList.remove('visible');
    } else {
      labelLeft.classList.remove('visible');
      labelRight.classList.remove('visible');
    }
  }

  function onDragEnd(clientX) {
    if (!isDragging) return;
    isDragging = false;
    labelLeft.classList.remove('visible');
    labelRight.classList.remove('visible');

    if (!cardEls[0]) return;
    cardEls[0].classList.remove('is-dragging');

    const dx = clientX - pointerStartX;

    if (Math.abs(dx) > SWIPE_THRESHOLD) {
      /* ✅ Committed swipe */
      swipe(dx < 0 ? 'left' : 'right');
    } else {
      /* ❌ Not far enough — spring back */
      const off = STACK_OFFSETS[0];
      const t   = `rotate(${off.rot}deg) translate(${off.tx}px, ${off.ty}px)`;
      cardEls[0].style.transition = 'transform 0.38s cubic-bezier(0.34, 1.56, 0.64, 1)';
      cardEls[0].style.transform  = t;

      /* If it was a tap (no real drag), open lightbox */
      if (!didDrag) openLightbox(order[0].src, order[0].alt);
    }
  }

  /* ─────────────────────────────────────────
     MOUSE EVENTS  (desktop)
  ───────────────────────────────────────── */
  scene.addEventListener('mousedown', e => {
    e.preventDefault();
    onDragStart(e.clientX, e.clientY);
  });

  window.addEventListener('mousemove', e => {
    if (!isDragging) return;
    onDragMove(e.clientX, e.clientY);
  });

  window.addEventListener('mouseup', e => {
    if (!isDragging) return;
    onDragEnd(e.clientX);
  });

  /* ─────────────────────────────────────────
     TOUCH EVENTS  (mobile)
  ───────────────────────────────────────── */
  scene.addEventListener('touchstart', e => {
    const t = e.touches[0];
    onDragStart(t.clientX, t.clientY);
  }, { passive: true });

  /* We listen on window so a fast swipe that leaves the scene still registers */
  window.addEventListener('touchmove', e => {
    if (!isDragging) return;
    const t = e.touches[0];
    onDragMove(t.clientX, t.clientY);
    /* Prevent page scroll only when dragging mostly horizontally */
    if (Math.abs(currentDX) > Math.abs(currentDY)) {
      e.preventDefault();
    }
  }, { passive: false });

  window.addEventListener('touchend', e => {
    if (!isDragging) return;
    const t = e.changedTouches[0];
    onDragEnd(t.clientX);
  });

  /* ─────────────────────────────────────────
     KEYBOARD
  ───────────────────────────────────────── */
  window.addEventListener('keydown', e => {
    /* Only fire when gallery is in viewport */
    const rect = scene.getBoundingClientRect();
    const inView = rect.top < window.innerHeight && rect.bottom > 0;
    if (!inView) return;

    if (e.key === 'ArrowLeft')  { e.preventDefault(); swipe('left'); }
    if (e.key === 'ArrowRight') { e.preventDefault(); swipe('right'); }
  });

  /* ─────────────────────────────────────────
     BUTTON CLICKS
  ───────────────────────────────────────── */
  btnPrev?.addEventListener('click', () => swipe('left'));
  btnNext?.addEventListener('click', () => swipe('right'));

  /* ── Build on init ── */
  buildDeck();
}


/* ═══════════════════════════════════════════
   LIGHTBOX  (opens on tap/click of a card)
═══════════════════════════════════════════ */
function openLightbox(src, alt) {
  const lb    = document.getElementById('lightbox');
  const imgEl = lb?.querySelector('.lightbox__img');
  if (!lb || !imgEl) return;
  imgEl.src = src;
  imgEl.alt = alt || '';
  lb.classList.add('open');
  lb.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function initLightbox() {
  const lb    = document.getElementById('lightbox');
  if (!lb) return;
  const imgEl   = lb.querySelector('.lightbox__img');
  const closeBtn= lb.querySelector('.lightbox__close');

  function close() {
    lb.classList.remove('open');
    lb.setAttribute('aria-hidden', 'true');
    imgEl.src = '';
    document.body.style.overflow = '';
  }

  closeBtn?.addEventListener('click', close);
  lb.addEventListener('click', e => { if (e.target === lb) close(); });
  window.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
}


/* ═══════════════════════════════════════════
   HERO CARD 3D TILT  (desktop only)
═══════════════════════════════════════════ */
function initTilt() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.matchMedia('(hover: none)').matches) return; /* skip on touch devices */

  const card = document.querySelector('.hero-card');
  if (!card) return;

  const MAX = 7;
  let rect  = null;

  card.addEventListener('mouseenter', () => {
    rect = card.getBoundingClientRect();
    card.style.transition = 'transform 0.1s ease';
  });
  card.addEventListener('mousemove', e => {
    if (!rect) rect = card.getBoundingClientRect();
    const x    = (e.clientX - rect.left) / rect.width;
    const y    = (e.clientY - rect.top)  / rect.height;
    const rotY =  (x - 0.5) * MAX * 2;
    const rotX = -(y - 0.5) * MAX * 2;
    card.style.transform = `perspective(800px) rotateX(${rotX.toFixed(1)}deg) rotateY(${rotY.toFixed(1)}deg)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transition = 'transform 0.45s ease';
    card.style.transform  = '';
    rect = null;
  });
}


/* ═══════════════════════════════════════════
   FALLING STARS  (entrance animation)
═══════════════════════════════════════════ */
function initStarRain() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const rain = document.createElement('div');
  rain.className = 'star-rain';
  rain.setAttribute('aria-hidden', 'true');
  document.body.appendChild(rain);

  const count = Math.max(14, Math.min(28, Math.floor(window.innerWidth / 58)));
  for (let i = 0; i < count; i++) {
    const s    = document.createElement('span');
    s.className = 'falling-star';
    const warm  = Math.random() < 0.35;
    const size  = warm && Math.random() < 0.4 ? 3 : 2;

    s.style.setProperty('--x',     (Math.random() * 100).toFixed(1) + '%');
    s.style.setProperty('--delay', (Math.random() * 0.9).toFixed(2) + 's');
    s.style.setProperty('--dur',   (1.6 + Math.random() * 1.2).toFixed(2) + 's');
    s.style.setProperty('--drift', ((Math.random() - 0.5) * 160).toFixed(0) + 'px');
    s.style.setProperty('--s',     size + 'px');
    s.style.setProperty('--o',     (0.5 + Math.random() * 0.45).toFixed(2));

    if (warm) {
      s.style.background  = 'rgba(212,168,67,.95)';
      s.style.boxShadow   = '0 0 10px rgba(212,168,67,.4)';
    }
    s.addEventListener('animationend', () => s.remove(), { once: true });
    rain.appendChild(s);
  }

  setTimeout(() => {
    rain.classList.add('fade');
    setTimeout(() => rain.remove(), 700);
  }, 2800);
}


/* ═══════════════════════════════════════════
   CANVAS STARFIELD
═══════════════════════════════════════════ */
function initStarfield() {
  const canvas = document.getElementById('starfield');
  if (!canvas) return;

  const fallback = document.querySelector('.stars-fallback');
  const ctx = canvas.getContext('2d', { alpha: true });
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let w = 0, h = 0;
  let dpr   = Math.min(2, window.devicePixelRatio || 1);
  const stars = [];

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    w   = window.innerWidth;
    h   = Math.min(window.innerHeight * 0.8, 800);
    canvas.width  = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width  = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    stars.length = 0;
    const count = Math.floor((w * h) / 5000);
    for (let i = 0; i < count; i++) {
      const big = Math.random() < 0.10;
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: big ? Math.random() * 1.5 + 1 : Math.random() * 0.9 + 0.25,
        a: Math.random() * 0.6 + 0.25,
        s: Math.random() * 0.9 + 0.35,
        p: Math.random() * Math.PI * 2,
        big,
        warm: Math.random() < 0.3,
      });
    }
  }

  function draw(t) {
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';

    for (const star of stars) {
      const tw    = reducedMotion ? 0 : Math.sin(t * 0.0011 * star.s + star.p) * 0.22;
      const alpha = Math.max(0, Math.min(1, star.a + tw));
      const color = star.warm
        ? `rgba(212,168,67,${alpha})`
        : `rgba(255,248,232,${alpha})`;

      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fill();

      if (star.big) {
        ctx.beginPath();
        ctx.fillStyle = star.warm
          ? `rgba(212,168,67,${alpha * 0.18})`
          : `rgba(255,248,232,${alpha * 0.15})`;
        ctx.arc(star.x, star.y, star.r * 3.5, 0, Math.PI * 2);
        ctx.fill();

        const len = star.r * 5.5;
        ctx.strokeStyle = star.warm
          ? `rgba(212,168,67,${alpha * 0.28})`
          : `rgba(255,248,232,${alpha * 0.22})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(star.x - len, star.y); ctx.lineTo(star.x + len, star.y);
        ctx.moveTo(star.x, star.y - len); ctx.lineTo(star.x, star.y + len);
        ctx.stroke();
      }
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  let rafId = 0;
  function loop(t) { draw(t); rafId = requestAnimationFrame(loop); }

  function onScroll() {
    const fade = Math.max(0.1, 1 - (window.scrollY || 0) / 650);
    canvas.style.opacity = (0.9 * fade).toFixed(2);
    if (fallback) fallback.style.opacity = (0.18 * fade).toFixed(2);
  }

  resize();
  draw(0);
  if (!reducedMotion) rafId = requestAnimationFrame(loop);

  window.addEventListener('resize', () => {
    cancelAnimationFrame(rafId);
    resize();
    draw(0);
    if (!reducedMotion) rafId = requestAnimationFrame(loop);
  }, { passive: true });

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}


/* ═══════════════════════════════════════════
   MOON SCROLL ROTATION
═══════════════════════════════════════════ */
function initMoonScroll() {
  const img = document.querySelector('.moon-img');
  if (!img) return;
  let ticking = false;

  function update() {
    ticking = false;
    const deg = ((window.scrollY || 0) * 0.12) % 360;
    img.style.transform = `rotate(${deg.toFixed(1)}deg) scaleX(-1)`;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });

  update();
}


/* ═══════════════════════════════════════════
   EID CONFETTI  (gold, emerald, ivory, rose)
═══════════════════════════════════════════ */
function initConfetti() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const wrap = document.getElementById('confetti');
  if (!wrap) return;

  const colors = ['#D4A843','#E8C060','#2A7A5E','#4EC99A','#FFF8E8','#C4687A','#B88A2C'];
  const count  = Math.min(70, Math.floor(window.innerWidth / 20));

  for (let i = 0; i < count; i++) {
    const el    = document.createElement('div');
    el.className = 'confetti-piece';
    const color  = colors[Math.floor(Math.random() * colors.length)];
    const size   = 6 + Math.random() * 9;
    const isCirc = Math.random() < 0.35;

    el.style.cssText = [
      `left: ${(Math.random() * 100).toFixed(1)}%`,
      `width: ${size.toFixed(1)}px`,
      `height: ${size.toFixed(1)}px`,
      `background: ${color}`,
      `border-radius: ${isCirc ? '50%' : '2px'}`,
      `--delay: ${(Math.random() * 3).toFixed(2)}s`,
      `--dur: ${(2.5 + Math.random() * 2).toFixed(2)}s`,
      `--drift: ${((Math.random() - 0.5) * 300).toFixed(0)}px`,
    ].join(';');

    el.addEventListener('animationend', () => el.remove(), { once: true });
    wrap.appendChild(el);
  }

  setTimeout(() => wrap.remove(), 7000);
}


/* ═══════════════════════════════════════════
   ACTIVE NAV HIGHLIGHT ON SCROLL
═══════════════════════════════════════════ */
function initActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const links    = document.querySelectorAll('.nav__link');
  if (!sections.length || !links.length) return;

  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        links.forEach(l => l.removeAttribute('style'));
        const active = document.querySelector(`.nav__link[href="#${entry.target.id}"]`);
        if (active) active.style.color = 'var(--gold)';
      }
    });
  }, { threshold: 0.45 });

  sections.forEach(s => obs.observe(s));
}


/* ═══════════════════════════════════════════
   SHOPIFY BUY BUTTON
═══════════════════════════════════════════ */
function loadShopifyBuy(cb) {
  if (window.ShopifyBuy && window.ShopifyBuy.UI) { cb(); return; }
  const script   = document.createElement('script');
  script.async   = true;
  script.src     = 'https://sdks.shopifycdn.com/buy-button/latest/buy-button-storefront.min.js';
  script.onload  = cb;
  document.head.appendChild(script);
}

function initShopify() {
  const domain = 'bm3rcp-p3.myshopify.com';
  const token  = 'e6ed311285d5b71c3057ed317f544f2d';

  const productIds = {
    'buy-hero': 10224601497889,
    'buy-12':   10224601497889,
    'buy-24':   10224743612705,
    'buy-48':   10224657858849,
  };

  if (!window.ShopifyBuy) return;

  const client = window.ShopifyBuy.buildClient({ domain, storefrontAccessToken: token });

  window.ShopifyBuy.UI.onReady(client).then(ui => {
    const goldBtn = {
      'background':     'linear-gradient(135deg, #D4A843, #E8C060)',
      'border':         '1px solid rgba(212,168,67,0.5)',
      'border-radius':  '999px',
      'font-weight':    '700',
      'font-size':      '13px',
      'letter-spacing': '0.08em',
      'text-transform': 'uppercase',
      'padding':        '11px 22px',
      'color':          '#1A0E2E',
      ':hover': {
        'background': 'linear-gradient(135deg, #E8C060, #D4A843)',
        'filter':     'brightness(1.08)',
      },
    };

    const commonOpts = {
      product: {
        iframe: true,
        contents: {
          img: false, title: false, price: false,
          options: false, quantity: false, button: true,
          buttonWithQuantity: false, description: false,
        },
        text:   { button: 'Add to Cart' },
        styles: { button: goldBtn },
      },
      cart: {
        startOpen: false,
        popup: false,
        text: {
          title: 'Your Cart',
          total: 'Subtotal',
          button: 'Checkout',
          empty: 'Your cart is empty.',
          notice: 'Shipping & taxes calculated at checkout.',
        },
        styles: {
          button: {
            'background': 'linear-gradient(135deg, #D4A843, #E8C060)',
            'border-radius': '999px',
            'font-weight': '700',
            'color': '#1A0E2E',
          },
          header: { 'background-color': 'rgba(26,14,46,0.96)' },
          footer: { 'background-color': 'rgba(26,14,46,0.96)' },
        },
      },
      toggle: {
        styles: {
          toggle: {
            'background-color': 'rgba(212,168,67,0.18)',
            'border': '1px solid rgba(212,168,67,0.35)',
            'border-radius': '999px',
            ':hover': { 'background-color': 'rgba(212,168,67,0.28)' },
          },
        },
      },
    };

    /* Hero small-box button */
    const heroNode = document.getElementById('buy-hero');
    if (heroNode) {
      ui.createComponent('product', {
        id: productIds['buy-hero'],
        node: heroNode,
        moneyFormat: '%24%7B%7Bamount%7D%7D',
        options: {
          ...commonOpts,
          product: { ...commonOpts.product, text: { button: 'Order Small Box' } },
        },
      });
    }

    /* Product card buttons */
    ['buy-12', 'buy-24', 'buy-48'].forEach(id => {
      const node = document.getElementById(id);
      if (!node) return;
      ui.createComponent('product', {
        id: productIds[id],
        node,
        moneyFormat: '%24%7B%7Bamount%7D%7D',
        options: commonOpts,
      });
    });
  });
}


/* ═══════════════════════════════════════════
   BOOT
═══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  initYear();
  initReveal();
  initDeckGallery();   /* ← card deck (replaces old lightbox grid) */
  initLightbox();      /* ← lightbox still works when you tap a card */
  initTilt();
  initStarRain();
  initStarfield();
  initMoonScroll();
  initActiveNav();
  initConfetti();

  loadShopifyBuy(() => {
    try { initShopify(); }
    catch (e) { console.warn('Shopify init failed:', e); }
  });
});
