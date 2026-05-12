const body = document.body;
const header = document.querySelector('.site-header');
const menuToggle = document.querySelector('.menu-toggle');
const mobileMenu = document.querySelector('.mobile-menu');
const revealEls = document.querySelectorAll('.reveal');
const mobileLinks = document.querySelectorAll('.mobile-menu a');

function syncHeader() {
  if (!header) return;
  header.classList.toggle('is-scrolled', window.scrollY > 18);
}

syncHeader();
window.addEventListener('scroll', syncHeader, { passive: true });

if (menuToggle && mobileMenu) {
  menuToggle.addEventListener('click', () => {
    const open = !body.classList.contains('menu-open');
    body.classList.toggle('menu-open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    mobileMenu.setAttribute('aria-hidden', String(!open));
  });

  mobileLinks.forEach((link) => {
    link.addEventListener('click', () => {
      body.classList.remove('menu-open');
      menuToggle.setAttribute('aria-expanded', 'false');
      mobileMenu.setAttribute('aria-hidden', 'true');
    });
  });
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

revealEls.forEach((el) => observer.observe(el));
