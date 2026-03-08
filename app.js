/* ═══════════════════════════════════════════════════════════════════
   Baklawa Bites — Eid Al-Fitr Edition
   app.js
═══════════════════════════════════════════════════════════════════ */

/* ── Year ── */
function initYear() {
  const el = document.getElementById('year');
  if (el) el.textContent = new Date().getFullYear();
}

/* ── Reveal on scroll ── */
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

/* ── Lightbox ── */
function initLightbox() {
  const lb = document.getElementById('lightbox');
  if (!lb) return;
  const imgEl = lb.querySelector('.lightbox__img');
  const closeBtn = lb.querySelector('.lightbox__close');

  function open(src, alt) {
    lb.classList.add('open');
    lb.setAttribute('aria-hidden', 'false');
    imgEl.src = src;
    imgEl.alt = alt || 'Baklawa photo';
  }
  function close() {
    lb.classList.remove('open');
    lb.setAttribute('aria-hidden', 'true');
    imgEl.src = '';
    imgEl.alt = '';
  }

  document.querySelectorAll('.gcard img').forEach(img => {
    img.style.cursor = 'zoom-in';
    img.addEventListener('click', () => open(img.src, img.alt));
  });

  closeBtn?.addEventListener('click', close);
  lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
}

/* ── Hero card tilt ── */
function initTilt() {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) return;

  const card = document.querySelector('.hero-card');
  if (!card) return;

  const MAX = 7;
  let rect = null;

  card.addEventListener('mouseenter', () => {
    rect = card.getBoundingClientRect();
    card.style.transition = 'transform 0.1s ease';
  });
  card.addEventListener('mousemove', (e) => {
    if (!rect) rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rotY = (x - 0.5) * MAX * 2;
    const rotX = -(y - 0.5) * MAX * 2;
    card.style.transform = `perspective(800px) rotateX(${rotX.toFixed(1)}deg) rotateY(${rotY.toFixed(1)}deg)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transition = 'transform 0.4s ease';
    card.style.transform = '';
    rect = null;
  });
}

/* ── Falling stars (entrance) ── */
function initStarRain() {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) return;

  const rain = document.createElement('div');
  rain.className = 'star-rain';
  rain.setAttribute('aria-hidden', 'true');
  document.body.appendChild(rain);

  const count = Math.max(16, Math.min(30, Math.floor(window.innerWidth / 55)));

  for (let i = 0; i < count; i++) {
    const s = document.createElement('span');
    s.className = 'falling-star';

    const warm = Math.random() < 0.35;
    const size = warm && Math.random() < 0.4 ? 3 : 2;

    s.style.setProperty('--x', (Math.random() * 100).toFixed(1) + '%');
    s.style.setProperty('--delay', (Math.random() * 0.9).toFixed(2) + 's');
    s.style.setProperty('--dur', (1.6 + Math.random() * 1.2).toFixed(2) + 's');
    s.style.setProperty('--drift', ((Math.random() - 0.5) * 160).toFixed(0) + 'px');
    s.style.setProperty('--s', size + 'px');
    s.style.setProperty('--o', (0.5 + Math.random() * 0.45).toFixed(2));

    if (warm) {
      s.style.background = 'rgba(212,168,67,.95)';
      s.style.boxShadow = '0 0 10px rgba(212,168,67,.4), 0 0 22px rgba(255,255,255,.2)';
    }

    s.addEventListener('animationend', () => s.remove(), { once: true });
    rain.appendChild(s);
  }

  setTimeout(() => {
    rain.classList.add('fade');
    setTimeout(() => rain.remove(), 700);
  }, 2600);
}

/* ── Canvas starfield ── */
function initStarfield() {
  const canvas = document.getElementById('starfield');
  if (!canvas) return;

  const fallback = document.querySelector('.stars-fallback');
  const ctx = canvas.getContext('2d', { alpha: true });
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let w = 0, h = 0;
  let dpr = Math.min(2, window.devicePixelRatio || 1);
  const stars = [];

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    w = window.innerWidth;
    h = Math.min(window.innerHeight * 0.8, 800);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + 'px';
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
      const tw = reducedMotion ? 0 : Math.sin(t * 0.0011 * star.s + star.p) * 0.22;
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
          ? `rgba(212,168,67,${alpha * 0.2})`
          : `rgba(255,248,232,${alpha * 0.16})`;
        ctx.arc(star.x, star.y, star.r * 3.5, 0, Math.PI * 2);
        ctx.fill();

        const len = star.r * 5.5;
        ctx.strokeStyle = star.warm
          ? `rgba(212,168,67,${alpha * 0.3})`
          : `rgba(255,248,232,${alpha * 0.25})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(star.x - len, star.y);
        ctx.lineTo(star.x + len, star.y);
        ctx.moveTo(star.x, star.y - len);
        ctx.lineTo(star.x, star.y + len);
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

/* ── Moon scroll parallax ── */
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

/* ── Eid Confetti (gold, emerald, ivory, rose) ── */
function initConfetti() {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) return;

  const wrap = document.getElementById('confetti');
  if (!wrap) return;

  const colors = ['#D4A843', '#E8C060', '#2A7A5E', '#4EC99A', '#FFF8E8', '#C4687A', '#B88A2C'];
  const shapes = ['square', 'circle', 'diamond'];
  const count = Math.min(80, Math.floor(window.innerWidth / 18));

  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-piece';

    const color = colors[Math.floor(Math.random() * colors.length)];
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    const size = 6 + Math.random() * 10;
    const left = Math.random() * 100;
    const delay = Math.random() * 3;
    const dur = 2.5 + Math.random() * 2;
    const drift = (Math.random() - 0.5) * 300;

    el.style.cssText = `
      left: ${left}%;
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      border-radius: ${shape === 'circle' ? '50%' : shape === 'diamond' ? '0' : '2px'};
      transform: ${shape === 'diamond' ? 'rotate(45deg)' : 'none'};
      --delay: ${delay}s;
      --dur: ${dur}s;
      --drift: ${drift}px;
    `;

    el.addEventListener('animationend', () => el.remove(), { once: true });
    wrap.appendChild(el);
  }

  // Clean up wrap after all done
  setTimeout(() => { if (wrap) wrap.remove(); }, 6500);
}

/* ── Smooth active nav highlight ── */
function initActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const links = document.querySelectorAll('.nav__link');

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        links.forEach(l => l.style.color = '');
        const active = document.querySelector(`.nav__link[href="#${entry.target.id}"]`);
        if (active) active.style.color = 'var(--gold)';
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(s => obs.observe(s));
}

/* ── Shopify Buy Button ── */
function loadShopifyBuy(cb) {
  if (window.ShopifyBuy && window.ShopifyBuy.UI) { cb(); return; }
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://sdks.shopifycdn.com/buy-button/latest/buy-button-storefront.min.js';
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

  window.ShopifyBuy.UI.onReady(client).then((ui) => {
    const goldBtn = {
      'background-color': 'linear-gradient(135deg, #D4A843, #E8C060)',
      'background':       'linear-gradient(135deg, #D4A843, #E8C060)',
      'border':           '1px solid rgba(212,168,67,0.5)',
      'border-radius':    '999px',
      'font-weight':      '700',
      'font-size':        '13px',
      'letter-spacing':   '0.08em',
      'text-transform':   'uppercase',
      'padding':          '11px 22px',
      'color':            '#1A0E2E',
      ':hover': {
        'background-color': 'linear-gradient(135deg, #E8C060, #D4A843)',
        'background':       'linear-gradient(135deg, #E8C060, #D4A843)',
        'filter':           'brightness(1.08)',
      },
    };

    const commonOptions = {
      product: {
        iframe: true,
        contents: {
          img: false, title: false, price: false,
          options: false, quantity: false, button: true,
          buttonWithQuantity: false, description: false,
        },
        text: { button: 'Add to Cart' },
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
            'background-color': 'transparent',
            'background': 'linear-gradient(135deg, #D4A843, #E8C060)',
            'border-radius': '999px',
            'font-weight': '700',
            'color': '#1A0E2E',
          },
          header: { 'background-color': 'rgba(26,14,46,0.95)' },
          footer: { 'background-color': 'rgba(26,14,46,0.95)' },
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

    // Hero button (Small box)
    const heroNode = document.getElementById('buy-hero');
    if (heroNode) {
      ui.createComponent('product', {
        id: productIds['buy-hero'],
        node: heroNode,
        moneyFormat: '%24%7B%7Bamount%7D%7D',
        options: {
          ...commonOptions,
          product: {
            ...commonOptions.product,
            text: { button: 'Order Small Box' },
          },
        },
      });
    }

    // Product card buttons
    for (const mountId of ['buy-12', 'buy-24', 'buy-48']) {
      const node = document.getElementById(mountId);
      if (!node) continue;
      ui.createComponent('product', {
        id: productIds[mountId],
        node,
        moneyFormat: '%24%7B%7Bamount%7D%7D',
        options: commonOptions,
      });
    }
  });
}

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', () => {
  initYear();
  initReveal();
  initLightbox();
  initTilt();
  initStarRain();
  initStarfield();
  initMoonScroll();
  initActiveNav();
  initConfetti();

  loadShopifyBuy(() => {
    try { initShopify(); } catch (e) { console.warn('Shopify init failed:', e); }
  });
});
