(() => {
const root = document.documentElement;
const rm = matchMedia('(prefers-reduced-motion: reduce)').matches;
root.classList.add('js');

/* hero: headline words rise out of a mask; a soft light follows the pointer with a lag */
const hero = document.querySelector('.hero');
const h1 = hero && hero.querySelector('h1');
if (h1) {
  h1.innerHTML = h1.textContent.trim().split(/\s+/).map((w, i) => `<span class="w"><span style="--i:${i}">${w}</span></span>`).join(' ');
  hero.insertAdjacentHTML('afterbegin', '<div class="glow" aria-hidden="true"></div>');
  const g = hero.querySelector('.glow');
  let x = hero.offsetWidth * .75, y = hero.offsetHeight * .35, tx = x, ty = y, raf = 0;
  const draw = () => { g.style.transform = `translate(${x}px,${y}px)`; };
  const step = () => { x += (tx - x) * .06; y += (ty - y) * .06; draw(); raf = (Math.abs(tx - x) > .5 || Math.abs(ty - y) > .5) ? requestAnimationFrame(step) : 0; };
  draw();
  if (!rm) hero.addEventListener('pointermove', e => { const r = hero.getBoundingClientRect(); tx = e.clientX - r.left; ty = e.clientY - r.top; if (!raf) raf = requestAnimationFrame(step); });
}

/* scroll reveal: slow fade and rise */
const targets = document.querySelectorAll('.section h2, .what p, .what .before, .steps li, .feats li, .why li, .cta');
targets.forEach(n => { n.setAttribute('data-reveal', ''); n.style.setProperty('--d', [...n.parentElement.children].indexOf(n)); });
if (rm || !('IntersectionObserver' in window)) targets.forEach(n => n.classList.add('in'));
else {
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .15 });
  targets.forEach(n => io.observe(n));
}

/* app rows enter on page load only, not on every re-render */
function boot() { document.body.classList.add('boot'); setTimeout(() => document.body.classList.remove('boot'), 2200); }
boot(); addEventListener('hashchange', boot);

/* navbar: menu toggle, glass background after scrolling, progress line, underline on the current section */
const nav = document.getElementById('nav'), bg = nav && nav.querySelector('.burger');
if (bg) {
  const set = o => { nav.classList.toggle('open', o); bg.setAttribute('aria-expanded', String(o)); };
  bg.addEventListener('click', () => set(!nav.classList.contains('open')));
  nav.querySelectorAll('.menu a').forEach(a => a.addEventListener('click', () => set(false)));
}
if (nav) {
  const bar = document.createElement('i'); bar.className = 'progress'; nav.appendChild(bar);
  const links = [...nav.querySelectorAll('.menu a[href^="#"]:not(.btn)')];
  const secs = links.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  const upd = () => {
    const h = document.documentElement.scrollHeight - innerHeight;
    nav.classList.toggle('scrolled', scrollY > 8);
    bar.style.setProperty('--p', h > 0 ? Math.min(scrollY / h, 1) : 0);
    let cur = ''; secs.forEach(s => { if (s.getBoundingClientRect().top < innerHeight * .35) cur = s.id; });
    links.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + cur));
  };
  addEventListener('scroll', upd, { passive: true }); upd();
}

/* hero card drifts slightly toward the pointer */
const demo = document.querySelector('.demo');
if (demo && !rm && matchMedia('(hover: hover)').matches) {
  demo.addEventListener('pointermove', e => {
    const r = demo.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
    demo.style.transform = `perspective(1100px) rotateY(${px * 5}deg) rotateX(${-py * 5}deg)`;
  });
  demo.addEventListener('pointerleave', () => { demo.style.transform = ''; });
}

/* success cue (kept under its old name so app.js needs no change): a single ring expands from the element */
window.hmConfetti = el => {
  if (rm) return;
  const r = el ? el.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 };
  const c = document.createElement('i'); c.className = 'ripple';
  c.style.left = (r.left + r.width / 2) + 'px'; c.style.top = (r.top + r.height / 2) + 'px';
  document.body.appendChild(c);
  c.animate([{ transform: 'scale(1)', opacity: .9 }, { transform: 'scale(11)', opacity: 0 }], { duration: 1100, easing: 'cubic-bezier(.16,1,.3,1)' }).onfinish = () => c.remove();
};
})();
