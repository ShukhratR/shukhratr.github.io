// Scroll reveal
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) {
      e.target.classList.add('is-visible');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach((el, i) => {
  el.style.transitionDelay = `${(i % 3) * 80}ms`;
  io.observe(el);
});

// Back to top
document.querySelector('.to-top')?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

document.getElementById('year').textContent = new Date().getFullYear();

// Highlight the nav link for the section in view
const navLinks = [...document.querySelectorAll('.nav a')];
const targets = navLinks.map((a) => document.querySelector(a.getAttribute('href')));
function setActive() {
  let current = -1;
  targets.forEach((el, i) => { if (el && el.getBoundingClientRect().top <= innerHeight * 0.4) current = i; });
  if (scrollY < innerHeight * 0.3) current = -1;   // nothing active on the intro
  navLinks.forEach((a, i) => a.classList.toggle('is-active', i === current));
}
addEventListener('scroll', setActive, { passive: true });
setActive();
