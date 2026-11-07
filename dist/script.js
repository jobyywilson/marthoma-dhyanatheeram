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

const introPhotos = document.querySelector('.intro-photos');
const introImages = Array.from(introPhotos.querySelectorAll('img'));
let introPhotoTimer;

const introPhotoObserver = new IntersectionObserver(([entry]) => {
  window.clearInterval(introPhotoTimer);
  if (entry.intersectionRatio < 0.35) return;

  introPhotoTimer = window.setInterval(() => {
    if (document.hidden || reducedMotion.matches) return;
    if (introImages.every((image) => image.complete && image.naturalWidth > 0)) {
      introPhotos.classList.toggle('show-evening');
    }
  }, photoInterval);
}, { threshold: 0.35 });
introPhotoObserver.observe(introPhotos);

const photoDialog = document.querySelector('[data-photo-dialog]');
const roomCarousel = document.querySelector('[data-room-carousel]');
const roomPhotos = roomCarousel.querySelector('.room-photos');
const roomSlides = roomPhotos.children;
const roomPhotoInterval = 5000;
const canHover = window.matchMedia('(hover: hover)');
let roomPhotoTimer;

function scrollRoomPhotos(direction) {
  const current = roomPhotos.scrollLeft;
  const end = roomPhotos.scrollWidth - roomPhotos.clientWidth;
  const step = roomSlides[1].offsetLeft - roomSlides[0].offsetLeft;
  let target = current + direction * step;

  if (direction > 0 && current >= end - 1) target = 0;
  if (direction < 0 && current <= 1) target = end;

  roomPhotos.scrollTo({ left: target });
}

roomCarousel.querySelectorAll('[data-room-step]').forEach((button) => {
  button.hidden = false;
  button.addEventListener('click', () => scrollRoomPhotos(Number(button.dataset.roomStep)));
});

function advanceRoomPhoto() {
  const hovering = canHover.matches && roomCarousel.matches(':hover');
  if (document.hidden || reducedMotion.matches || hovering || roomCarousel.matches(':focus-within') || photoDialog.open) return;
  scrollRoomPhotos(1);
}

const roomObserver = new IntersectionObserver(([entry]) => {
  window.clearInterval(roomPhotoTimer);
  if (entry.intersectionRatio >= 0.5) {
    roomPhotoTimer = window.setInterval(advanceRoomPhoto, roomPhotoInterval);
  }
}, { threshold: 0.5 });
roomObserver.observe(roomCarousel);

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

const aboutShare = document.querySelector('#about-share');
const aboutShareUrl = aboutShare.querySelector('input');
const aboutShareStatus = aboutShare.querySelector('[role="status"]');

document.querySelectorAll('[data-about-dialog]').forEach((button) => {
  const dialog = document.getElementById(button.dataset.aboutDialog);
  if (!dialog.showModal) return;
  button.hidden = false;
  button.addEventListener('click', () => {
    if (dialog === aboutShare) {
      aboutShareUrl.value = new URL('#about', window.location.href).href;
      aboutShareStatus.textContent = '';
    }
    dialog.showModal();
  });
});

aboutShare.querySelector('[data-copy-about]').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(aboutShareUrl.value);
    aboutShareStatus.textContent = 'Link copied.';
  } catch {
    aboutShareUrl.select();
    aboutShareStatus.textContent = 'Copy the selected link.';
  }
});
