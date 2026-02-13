/* Baklawa Bites — Ramadan Night Sky */

function initYear(){
  const el = document.getElementById('year');
  if (el) el.textContent = new Date().getFullYear().toString();
}

function initReveal(){
  // Add js class to html for CSS targeting
  document.documentElement.classList.add('js');
  
  const items = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)){
    items.forEach(el => el.classList.add('is-visible'));
    return;
  }
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting){
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  items.forEach(el => obs.observe(el));
}

function initLightbox(){
  const lb = document.getElementById('lightbox');
  if (!lb) return;
  const imgEl = lb.querySelector('.lightbox__img');
  const closeBtn = lb.querySelector('.lightbox__close');

  function close(){
    lb.classList.remove('open');
    lb.setAttribute('aria-hidden', 'true');
    imgEl.removeAttribute('src');
    imgEl.setAttribute('alt', '');
  }

  document.querySelectorAll('.gcard img').forEach(img => {
    img.addEventListener('click', () => {
      lb.classList.add('open');
      lb.setAttribute('aria-hidden', 'false');
      imgEl.src = img.src;
      imgEl.alt = img.alt || 'Baklawa photo';
    });
  });

  closeBtn?.addEventListener('click', close);
  lb.addEventListener('click', (e) => {
    if (e.target === lb) close();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
}


/* Gentle tilt/parallax on the hero card (adds depth without affecting layout) */
function initTilt(){
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const el = document.querySelector('.hero-card');
  if (!el) return;

  let rect = null;
  const max = 7; // degrees

  const onEnter = () => {
    rect = el.getBoundingClientRect();
    el.classList.add('tilting');
  };

  const onMove = (e) => {
    if (!rect) rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;  // 0..1
    const y = (e.clientY - rect.top) / rect.height;  // 0..1
    const rotY = (x - 0.5) * max * 2;
    const rotX = -(y - 0.5) * max * 2;
    el.style.transform = `rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`;
  };

  const onLeave = () => {
    el.style.transform = '';
    el.classList.remove('tilting');
    rect = null;
  };

  el.addEventListener('mouseenter', onEnter);
  el.addEventListener('mousemove', onMove);
  el.addEventListener('mouseleave', onLeave);
}

/* Create continuous background overlay */
function initContinuousBackground() {
  const overlay = document.createElement('div');
  overlay.className = 'background-overlay';
  document.body.appendChild(overlay);
}

/* Falling stars on first load (short, subtle entrance animation) */
function initStarRain(){
  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) return;

  const rain = document.createElement('div');
  rain.className = 'star-rain';
  rain.setAttribute('aria-hidden', 'true');
  document.body.appendChild(rain);

  const count = Math.max(16, Math.min(30, Math.floor(window.innerWidth / 55)));
  for (let i = 0; i < count; i++){
    const s = document.createElement('span');
    s.className = 'falling-star';

    const x = Math.random() * 100;
    const delay = Math.random() * 0.85;
    const dur = 1.55 + Math.random() * 1.15;
    const drift = (Math.random() - 0.5) * 140;
    const warm = Math.random() < 0.28;
    const size = warm && Math.random() < 0.4 ? 3 : 2;
    const opacity = (0.55 + Math.random() * 0.40).toFixed(2);

    s.style.setProperty('--x', x.toFixed(2) + '%');
    s.style.setProperty('--delay', delay.toFixed(2) + 's');
    s.style.setProperty('--dur', dur.toFixed(2) + 's');
    s.style.setProperty('--drift', drift.toFixed(0) + 'px');
    s.style.setProperty('--s', size + 'px');
    s.style.setProperty('--o', opacity);

    if (warm){
      s.style.background = 'rgba(217,179,94,.95)';
      s.style.boxShadow = '0 0 10px rgba(217,179,94,.35), 0 0 22px rgba(255,255,255,.20)';
    }

    s.addEventListener('animationend', () => s.remove(), { once: true });
    rain.appendChild(s);
  }

  // Fade and remove after a couple seconds so it doesn't distract.
  window.setTimeout(() => {
    rain.classList.add('fade');
    window.setTimeout(() => rain.remove(), 700);
  }, 2400);
}


/* Ramadan starfield (top-of-page twinkle) */
function initStarfield(){
  const canvas = document.getElementById('starfield');
  if (!canvas) return;

  const fallback = document.querySelector('.stars-fallback');
  const ctx = canvas.getContext('2d', { alpha: true });
  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let w = 0, h = 0, dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const stars = [];

  function resize(){
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    w = Math.floor(window.innerWidth);
    h = Math.floor(Math.min(window.innerHeight * 0.75, 720));
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    stars.length = 0;
    const count = Math.floor((w * h) / 5200); // denser = more visible
    for (let i = 0; i < count; i++){
      const big = Math.random() < 0.10;
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: big ? (Math.random() * 1.4 + 1.1) : (Math.random() * 0.9 + 0.25),
        a: Math.random() * 0.58 + 0.26,
        s: Math.random() * 0.9 + 0.35,
        p: Math.random() * Math.PI * 2,
        big,
        warm: Math.random() < 0.30,
      });
    }
  }

  function draw(t){
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';

    for (const s of stars){
      const tw = reducedMotion ? 0 : Math.sin(t * 0.0011 * s.s + s.p) * 0.22;
      const alpha = Math.max(0, Math.min(1, s.a + tw));

      // Core dot
      ctx.beginPath();
      ctx.fillStyle = s.warm
        ? `rgba(217,179,94,${alpha})`
        : `rgba(255,255,255,${alpha})`;
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();

      // Subtle glow halo (cheap)
      if (s.big){
        ctx.beginPath();
        ctx.fillStyle = s.warm
          ? `rgba(217,179,94,${alpha * 0.22})`
          : `rgba(255,255,255,${alpha * 0.18})`;
        ctx.arc(s.x, s.y, s.r * 3.2, 0, Math.PI * 2);
        ctx.fill();

        // Sparkle cross
        const len = s.r * 6.0;
        ctx.strokeStyle = s.warm
          ? `rgba(217,179,94,${alpha * 0.32})`
          : `rgba(255,255,255,${alpha * 0.28})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(s.x - len, s.y);
        ctx.lineTo(s.x + len, s.y);
        ctx.moveTo(s.x, s.y - len);
        ctx.lineTo(s.x, s.y + len);
        ctx.stroke();
      }
    }

    ctx.globalCompositeOperation = 'source-over';
  }

  let rafId = 0;
  function loop(t){
    draw(t);
    rafId = requestAnimationFrame(loop);
  }

  // Fade starfield slightly as you scroll down
  function onScroll(){
    const y = window.scrollY || 0;
    const fade = Math.max(0.15, 1 - y / 600);
    canvas.style.opacity = String(0.92 * fade);
    if (fallback) fallback.style.opacity = String(0.20 * fade);
  }

  resize();
  draw(0);
  window.addEventListener('resize', () => {
    cancelAnimationFrame(rafId);
    resize();
    draw(0);
    if (!reducedMotion) rafId = requestAnimationFrame(loop);
  }, { passive: true });

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (!reducedMotion) rafId = requestAnimationFrame(loop);
}


function initMoonScroll(){
  const img = document.querySelector('.moon-img');
  if (!img) return;

  let ticking = false;
  const update = () => {
    ticking = false;
    const y = window.scrollY || 0;
    const deg = (y * 0.12) % 360;
    img.style.transform = `rotate(${deg.toFixed(2)}deg) scaleX(-1)`;
  };

  const onScroll = () => {
    if (!ticking){
      ticking = true;
      requestAnimationFrame(update);
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  update();
}



/* Shopify Buy Button (shared cart) */
function loadShopifyBuy(cb){
  if (window.ShopifyBuy && window.ShopifyBuy.UI){
    cb();
    return;
  }
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://sdks.shopifycdn.com/buy-button/latest/buy-button-storefront.min.js';
  script.onload = cb;
  document.head.appendChild(script);
}

function initShopify(){
  // Storefront details (from your Shopify Buy Button embed)
  const domain = 'bm3rcp-p3.myshopify.com';
  const token = 'e6ed311285d5b71c3057ed317f544f2d';

  const productIds = {
    // Small box order (hero button)
    'buy-hero': 10224601497889,
    'buy-12': 10224601497889,
    'buy-24': 10224743612705,
    'buy-48': 10224657858849,
  };

  if (!window.ShopifyBuy) return;

  const client = window.ShopifyBuy.buildClient({
    domain,
    storefrontAccessToken: token,
  });

  window.ShopifyBuy.UI.onReady(client).then((ui) => {
    const commonOptions = {
      product: {
        iframe: true,
        contents: {
          img: false,
          title: false,
          price: false,
          options: false,
          quantity: false,
          button: true,
          buttonWithQuantity: false,
          description: false,
        },
        text: {
          button: 'Add to cart',
        },
        styles: {
          button: {
            'background-color': 'rgba(255,255,255,0.18)',
            'border': '1px solid rgba(255,255,255,0.35)',
            'border-radius': '14px',
            'font-weight': '700',
            'padding': '12px 16px',
            'backdrop-filter': 'blur(14px)',
            'color': 'rgba(11,23,48,0.95)',
            ':hover': {
              'background-color': 'rgba(217,179,94,0.18)',
              'border': '1px solid rgba(217,179,94,0.28)',
            },
            ':focus': {
              'outline': 'none',
              'box-shadow': '0 0 0 4px rgba(217,179,94,0.20)',
            },
          },
        },
      },
      cart: {
        startOpen: false,
        popup: false,
        text: {
          title: 'Your cart',
          total: 'Subtotal',
          button: 'Checkout',
          empty: 'Your cart is empty.',
          notice: 'Shipping & taxes calculated at checkout.',
        },
        styles: {
          button: {
            'background-color': 'rgba(217,179,94,0.18)',
            'border': '1px solid rgba(217,179,94,0.28)',
            'border-radius': '14px',
            'font-weight': '700',
          },
          header: { 'background-color': 'rgba(255,255,255,0.12)' },
          footer: { 'background-color': 'rgba(255,255,255,0.12)' },
        },
      },
      toggle: {
        styles: {
          toggle: {
            'background-color': 'rgba(217,179,94,0.18)',
            'border': '1px solid rgba(217,179,94,0.28)',
            'border-radius': '14px',
            'backdrop-filter': 'blur(14px)',
            ':hover': { 'background-color': 'rgba(217,179,94,0.26)' },
          },
        },
      },
    };

    // Hero order button (Small Box)
    const heroNode = document.getElementById('buy-hero');
    if (heroNode) {
      const heroOptions = {
        ...commonOptions,
        product: {
          ...commonOptions.product,
          text: { button: 'Order Now' },
          styles: {
            ...commonOptions.product.styles,
            product: { 'text-align': 'center', 'margin': '0', 'max-width': '100%' },
            button: {
              ...commonOptions.product.styles.button,
              'background-color': 'rgba(217,179,94,0.38)',
              'border': '1px solid rgba(217,179,94,0.62)',
              ':hover': { 'background-color': 'rgba(217,179,94,0.52)' },
              ':focus': { 'background-color': 'rgba(217,179,94,0.52)' },
            },
          },
        },
      };

      ui.createComponent('product', {
        id: productIds['buy-hero'],
        node: heroNode,
        moneyFormat: '%24%7B%7Bamount%7D%7D',
        options: heroOptions,
      });
    }
// Render buttons in the exact order of your product cards.
    for (const mountId of ['buy-12', 'buy-24', 'buy-48']){
      const mountNode = document.getElementById(mountId);
      if (!mountNode) continue;
      ui.createComponent('product', {
        id: productIds[mountId],
        node: mountNode,
        moneyFormat: '%24%7B%7Bamount%7D%7D',
        options: commonOptions,
      });
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initYear();
  initContinuousBackground(); // Add this line
  initReveal();
  initLightbox();
  initStarRain();
  initStarfield();
  initMoonScroll();
initTilt();

  loadShopifyBuy(() => {
    try { initShopify(); } catch (e) { console.warn('Shopify init failed:', e); }
  });
});
