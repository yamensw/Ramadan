/* ═══════════════════════════════════════════════════════════════════
   Baklawa Bites — Universal Edition
   app.js
═══════════════════════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────
   GALLERY DATA
   Update src paths if your folder structure differs.
───────────────────────────────────────── */
const GALLERY_IMAGES = [
  { src: 'assets/images/gallery/gallery_1.jpg', alt: 'Baklawa gift box on marble' },
  { src: 'assets/images/gallery/gallery_2.jpg', alt: 'Full tray of fresh baklawa' },
  { src: 'assets/images/gallery/gallery_3.jpg', alt: 'Open gold box — tied with ribbon' },
  { src: 'assets/images/gallery/gallery_4.jpg', alt: 'Close-up of pistachio baklawa' },
  { src: 'assets/images/gallery/gallery_5.jpg', alt: 'Baklawa tray overhead shot' },
  { src: 'assets/images/gallery/gallery_6.jpg', alt: 'Freshly baked tray in rows' },
  { src: 'assets/images/gallery/gallery_7.jpg', alt: 'Gold box with ribbon bow' },
  { src: 'assets/images/gallery/gallery_8.jpg', alt: "Bird's-eye view of full tray" },
  { src: 'assets/images/gallery/gallery_9.jpg', alt: 'Open gift box with love tag' },
];

/* Stack visual offsets — index 0 = top card */
const STACK_OFFSETS = [
  { rot:  0.0, tx:  0, ty:  0 },
  { rot:  3.8, tx:  9, ty:  5 },
  { rot: -3.0, tx: -7, ty: 10 },
  { rot:  5.5, tx: 13, ty: 16 },
  { rot: -4.2, tx:-11, ty: 22 },
];

const MAX_VISIBLE      = 5;
const SWIPE_THRESHOLD  = 75;  /* px to commit a swipe */


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

  const obs = new IntersectionObserver(entries => {
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
  const scene      = document.getElementById('deckScene');
  const labelLeft  = document.getElementById('dragLeft');
  const labelRight = document.getElementById('dragRight');
  const curEl      = document.getElementById('deckCur');
  const totEl      = document.getElementById('deckTot');
  const capEl      = document.getElementById('deckCaption');
  const dotsEl     = document.getElementById('deckDots');
  const btnPrev    = document.getElementById('deckPrev');
  const btnNext    = document.getElementById('deckNext');

  if (!scene) return;

  let order    = [...GALLERY_IMAGES];
  let cardEls  = [];
  let topIndex = 0;

  let isDragging    = false;
  let didDrag       = false;
  let pointerStartX = 0;
  let pointerStartY = 0;
  let currentDX     = 0;
  let currentDY     = 0;
  let animating     = false;

  totEl.textContent = GALLERY_IMAGES.length;

  /* ── Build / rebuild ── */
  function buildDeck() {
    scene.querySelectorAll('.deck-card').forEach(c => c.remove());
    cardEls = [];

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
    img.src     = imgData.src;
    img.alt     = imgData.alt;
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

  /* ── Dots ── */
  function buildDots() {
    dotsEl.innerHTML = '';
    GALLERY_IMAGES.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'deck-dot';
      dot.setAttribute('aria-label', `Photo ${i + 1}`);
      dot.setAttribute('role', 'tab');
      dot.addEventListener('click', () => goToIndex(i));
      dotsEl.appendChild(dot);
    });
  }

  /* ── Refresh counter / caption / dots ── */
  function refreshUI() {
    cardEls.forEach((c, i) => c?.classList.toggle('is-top', i === 0));

    curEl.textContent = topIndex + 1;

    capEl.classList.add('fading');
    setTimeout(() => {
      capEl.textContent = GALLERY_IMAGES[topIndex].alt;
      capEl.classList.remove('fading');
    }, 200);

    dotsEl.querySelectorAll('.deck-dot').forEach((d, i) => {
      d.classList.toggle('active', i === topIndex);
      d.setAttribute('aria-selected', i === topIndex ? 'true' : 'false');
    });
  }

  /* ── Swipe ── */
  function swipe(direction) {
    if (animating || !cardEls[0]) return;
    animating = true;

    const top = cardEls[0];
    top.classList.remove('is-dragging');
    top.classList.add(direction === 'left' ? 'fly-left' : 'fly-right');

    top.addEventListener('animationend', () => {
      order.push(order.shift());
      topIndex = (topIndex + (direction === 'right' ? 1 : GALLERY_IMAGES.length - 1))
                 % GALLERY_IMAGES.length;
      animating = false;
      buildDeck();
    }, { once: true });
  }

  /* ── Jump to specific index (dot click) ── */
  function goToIndex(targetIdx) {
    if (animating || targetIdx === topIndex) return;
    const imgAtTarget = GALLERY_IMAGES[targetIdx];
    const posInOrder  = order.findIndex(img => img === imgAtTarget);
    if (posInOrder < 0) return;
    if (posInOrder === 1) { swipe('right'); return; }
    order    = [...order.slice(posInOrder), ...order.slice(0, posInOrder)];
    topIndex = targetIdx;
    buildDeck();
  }

  /* ── Drag shared ── */
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

    if (Math.abs(currentDX) > 6 || Math.abs(currentDY) > 6) didDrag = true;

    const rot    = currentDX * 0.07;
    const pullY  = currentDY * 0.25;
    cardEls[0].style.transform =
      `rotate(${rot.toFixed(2)}deg) translate(${currentDX}px, ${pullY.toFixed(1)}px)`;

    const progress = Math.min(Math.abs(currentDX) / SWIPE_THRESHOLD, 1);
    if (currentDX < -12) {
      labelLeft.classList.add('visible');
      labelLeft.style.opacity = progress;
      labelRight.classList.remove('visible');
    } else if (currentDX > 12) {
      labelRight.classList.add('visible');
      labelRight.style.opacity = progress;
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
      swipe(dx < 0 ? 'left' : 'right');
    } else {
      /* Spring back */
      const off = STACK_OFFSETS[0];
      const t   = `rotate(${off.rot}deg) translate(${off.tx}px, ${off.ty}px)`;
      cardEls[0].style.transition = 'transform 0.38s cubic-bezier(0.34,1.56,0.64,1)';
      cardEls[0].style.transform  = t;

      /* Tap (no real drag) → open lightbox */
      if (!didDrag) openLightbox(order[0].src, order[0].alt);
    }
  }

  /* Mouse */
  scene.addEventListener('mousedown', e => { e.preventDefault(); onDragStart(e.clientX, e.clientY); });
  window.addEventListener('mousemove', e => { if (isDragging) onDragMove(e.clientX, e.clientY); });
  window.addEventListener('mouseup',   e => { if (isDragging) onDragEnd(e.clientX); });

  /* Touch */
  scene.addEventListener('touchstart', e => {
    const t = e.touches[0];
    onDragStart(t.clientX, t.clientY);
  }, { passive: true });

  window.addEventListener('touchmove', e => {
    if (!isDragging) return;
    const t = e.touches[0];
    onDragMove(t.clientX, t.clientY);
    if (Math.abs(currentDX) > Math.abs(currentDY)) e.preventDefault();
  }, { passive: false });

  window.addEventListener('touchend', e => {
    if (!isDragging) return;
    onDragEnd(e.changedTouches[0].clientX);
  });

  /* Keyboard */
  window.addEventListener('keydown', e => {
    const rect   = scene.getBoundingClientRect();
    const inView = rect.top < window.innerHeight && rect.bottom > 0;
    if (!inView) return;
    if (e.key === 'ArrowLeft')  { e.preventDefault(); swipe('left'); }
    if (e.key === 'ArrowRight') { e.preventDefault(); swipe('right'); }
  });

  /* Buttons */
  btnPrev?.addEventListener('click', () => swipe('left'));
  btnNext?.addEventListener('click', () => swipe('right'));

  buildDeck();
}


/* ═══════════════════════════════════════════
   LIGHTBOX
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
  const imgEl    = lb.querySelector('.lightbox__img');
  const closeBtn = lb.querySelector('.lightbox__close');

  function close() {
    lb.classList.remove('open');
    lb.setAttribute('aria-hidden', 'true');
    if (imgEl) imgEl.src = '';
    document.body.style.overflow = '';
  }

  closeBtn?.addEventListener('click', close);
  lb.addEventListener('click', e => { if (e.target === lb) close(); });
  window.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
}


/* ═══════════════════════════════════════════
   HERO CARD 3D TILT  (desktop / hover devices only)
═══════════════════════════════════════════ */
function initTilt() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.matchMedia('(hover: none)').matches) return;

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
    card.style.transform =
      `perspective(800px) rotateX(${rotX.toFixed(1)}deg) rotateY(${rotY.toFixed(1)}deg)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transition = 'transform 0.45s ease';
    card.style.transform  = '';
    rect = null;
  });
}


/* ═══════════════════════════════════════════
   PARTICLE CANVAS
   Floating warm dust motes — elegant, brand-neutral
═══════════════════════════════════════════ */
function initParticles() {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { canvas.style.display = 'none'; return; }

  const ctx    = canvas.getContext('2d');
  const reduced = false;
  let w = 0, h = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
  const particles = [];

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    w   = window.innerWidth;
    h   = window.innerHeight;
    canvas.width  = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width  = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawnParticle() {
    const warm = Math.random() < 0.55;
    return {
      x:     Math.random() * w,
      y:     Math.random() * h,
      r:     Math.random() * 1.6 + 0.4,
      vx:    (Math.random() - 0.5) * 0.15,
      vy:   -(Math.random() * 0.25 + 0.05),
      a:     Math.random() * 0.5 + 0.1,
      life:  Math.random(),
      speed: Math.random() * 0.004 + 0.002,
      warm,
    };
  }

  function init() {
    particles.length = 0;
    const count = Math.floor((w * h) / 14000);
    for (let i = 0; i < count; i++) {
      const p = spawnParticle();
      p.life = Math.random(); // stagger
      particles.push(p);
    }
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);

    for (const p of particles) {
      p.life += p.speed;
      if (p.life > 1) {
        /* Reset particle at bottom */
        Object.assign(p, spawnParticle());
        p.y    = h + 10;
        p.life = 0;
      }

      const fade  = Math.sin(p.life * Math.PI); // 0 → 1 → 0
      const alpha = p.a * fade;

      ctx.beginPath();
      ctx.globalAlpha = alpha;
      ctx.fillStyle   = p.warm
        ? `rgba(200,145,58,${alpha})`
        : `rgba(245,238,224,${alpha})`;
      ctx.arc(p.x + p.vx * p.life * 1000, p.y - p.vy * p.life * 400, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  }

  let rafId = 0;
  function loop() { draw(); rafId = requestAnimationFrame(loop); }

  resize();
  init();
  loop();

  window.addEventListener('resize', () => {
    cancelAnimationFrame(rafId);
    resize();
    init();
    loop();
  }, { passive: true });
}


/* ═══════════════════════════════════════════
   CONFETTI  (warm palette — no religious tones)
═══════════════════════════════════════════ */
function initConfetti() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const wrap = document.getElementById('confetti');
  if (!wrap) return;

  /* Honey, amber, sage, cream, warm brown */
  const colors = ['#C8913A','#E8A84A','#4A7C62','#7DC4A0','#F5EEE0','#A37428','#D4B896'];
  const count  = Math.min(65, Math.floor(window.innerWidth / 22));

  for (let i = 0; i < count; i++) {
    const el    = document.createElement('div');
    el.className = 'confetti-piece';
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size  = 6 + Math.random() * 9;
    const circ  = Math.random() < 0.3;
    const dia   = !circ && Math.random() < 0.4;

    el.style.cssText = [
      `left: ${(Math.random() * 100).toFixed(1)}%`,
      `width: ${size.toFixed(1)}px`,
      `height: ${size.toFixed(1)}px`,
      `background: ${color}`,
      `border-radius: ${circ ? '50%' : '2px'}`,
      `transform: ${dia ? 'rotate(45deg)' : 'none'}`,
      `--delay: ${(Math.random() * 3.2).toFixed(2)}s`,
      `--dur:   ${(2.4 + Math.random() * 2.2).toFixed(2)}s`,
      `--drift: ${((Math.random() - 0.5) * 280).toFixed(0)}px`,
    ].join(';');

    el.addEventListener('animationend', () => el.remove(), { once: true });
    wrap.appendChild(el);
  }

  setTimeout(() => wrap.remove(), 7000);
}


/* ═══════════════════════════════════════════
   ACTIVE NAV ON SCROLL
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
        if (active) active.style.color = 'var(--honey)';
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
  const script  = document.createElement('script');
  script.async  = true;
  script.src    = 'https://sdks.shopifycdn.com/buy-button/latest/buy-button-storefront.min.js';
  script.onload = cb;
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
    const honeyBtn = {
      'background':     'linear-gradient(135deg, #C8913A, #E8A84A)',
      'border':         '1px solid rgba(200,145,58,0.45)',
      'border-radius':  '999px',
      'font-weight':    '600',
      'font-size':      '13px',
      'letter-spacing': '0.08em',
      'text-transform': 'uppercase',
      'padding':        '11px 22px',
      'color':          '#141210',
      ':hover': {
        'background': 'linear-gradient(135deg, #E8A84A, #C8913A)',
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
        styles: { button: honeyBtn },
      },
      cart: {
        startOpen: false,
        popup: false,
        text: {
          title:  'Your Cart',
          total:  'Subtotal',
          button: 'Checkout',
          empty:  'Your cart is empty.',
          notice: 'Shipping & taxes calculated at checkout.',
        },
        styles: {
          button: {
            'background':    'linear-gradient(135deg, #C8913A, #E8A84A)',
            'border-radius': '999px',
            'font-weight':   '600',
            'color':         '#141210',
          },
          header: { 'background-color': 'rgba(20,18,16,0.97)' },
          footer: { 'background-color': 'rgba(20,18,16,0.97)' },
        },
      },
      toggle: {
        styles: {
          toggle: {
            'background-color': 'rgba(200,145,58,0.16)',
            'border': '1px solid rgba(200,145,58,0.32)',
            'border-radius': '999px',
            ':hover': { 'background-color': 'rgba(200,145,58,0.26)' },
          },
        },
      },
    };

    /* Hero button */
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
  initDeckGallery();
  initLightbox();
  initTilt();
  initParticles();
  initConfetti();
  initActiveNav();

  loadShopifyBuy(() => {
    try { initShopify(); }
    catch (e) { console.warn('Shopify init failed:', e); }
  });
});
