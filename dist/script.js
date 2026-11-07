const header = document.querySelector('[data-header]');
const menuButton = document.querySelector('[data-menu-button]');
const nav = document.querySelector('[data-nav]');

const syncHeader = () => header.classList.toggle('scrolled', window.scrollY > 36);
syncHeader();
window.addEventListener('scroll', syncHeader, { passive: true });

menuButton.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!isOpen));
  nav.classList.toggle('open', !isOpen);
  document.body.classList.toggle('menu-open', !isOpen);
});

nav.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    menuButton.setAttribute('aria-expanded', 'false');
    nav.classList.remove('open');
    document.body.classList.remove('menu-open');
  });
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && nav.classList.contains('open')) {
    menuButton.setAttribute('aria-expanded', 'false');
    nav.classList.remove('open');
    document.body.classList.remove('menu-open');
    menuButton.focus();
  }
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
document.querySelector('[data-year]').textContent = new Date().getFullYear();

const heroSlides = Array.from(document.querySelectorAll('.hero-image'));
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const photoInterval = 7000;
let currentSlide = 0;
let previousSlide;
let rotationTimer;

function advanceHeroPhoto() {
  if (document.hidden) return;

  for (let offset = 1; offset < heroSlides.length; offset += 1) {
    const nextIndex = (currentSlide + offset) % heroSlides.length;
    const nextSlide = heroSlides[nextIndex];
    if (!nextSlide.complete || nextSlide.naturalWidth === 0) continue;

    previousSlide?.classList.remove('is-previous');
    previousSlide = heroSlides[currentSlide];
    previousSlide.classList.replace('is-current', 'is-previous');
    nextSlide.classList.add('is-current');
    currentSlide = nextIndex;
    return;
  }
}

function syncHeroRotation() {
  window.clearInterval(rotationTimer);
  rotationTimer = reducedMotion.matches ? undefined : window.setInterval(advanceHeroPhoto, photoInterval);
}

reducedMotion.addEventListener('change', syncHeroRotation);
syncHeroRotation();

const roomCarousel = document.querySelector('[data-room-carousel]');
const roomPhotos = roomCarousel.querySelector('.room-photos');
const roomSlides = roomPhotos.children;

roomCarousel.querySelectorAll('[data-room-step]').forEach((button) => {
  button.hidden = false;
  button.addEventListener('click', () => {
    const direction = Number(button.dataset.roomStep);
    const current = roomPhotos.scrollLeft;
    const end = roomPhotos.scrollWidth - roomPhotos.clientWidth;
    const step = roomSlides[1].offsetLeft - roomSlides[0].offsetLeft;
    let target = current + direction * step;

    if (direction > 0 && current >= end - 1) target = 0;
    if (direction < 0 && current <= 1) target = end;

    roomPhotos.scrollTo({ left: target });
  });
});

const photoDialog = document.querySelector('[data-photo-dialog]');
const fullPhoto = photoDialog.querySelector('[data-full-photo]');
const photoCaption = photoDialog.querySelector('figcaption');

document.querySelectorAll('[data-photo]').forEach((link) => {
  link.addEventListener('click', (event) => {
    if (!photoDialog.showModal || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    fullPhoto.src = link.href;
    fullPhoto.alt = link.querySelector('img')?.alt || link.dataset.caption;
    photoCaption.textContent = link.dataset.caption;
    photoDialog.showModal();
  });
});
