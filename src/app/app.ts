import { afterNextRender, afterRenderEffect, Component, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core';
import { PhotoGallery } from './photo-gallery';

const photoInterval = 7000;
const roomPhotoInterval = 5000;

@Component({
  selector: 'app-root',
  imports: [PhotoGallery],
  templateUrl: './app.html',
  host: { '(document:keydown.escape)': 'closeMenuOnEscape()' },
})
export class App {
  protected readonly aboutIntroduction = 'Welcome to Mar Thoma Dhyanatheeram, nestled on the serene Perungalam Island in Munroe Island, Kollam. Mar Thoma Dhyanatheeram is the only lakeside meditation centre of the Mar Thoma Syrian Church.';
  protected readonly scrolled = signal(false);
  protected readonly menuOpen = signal(false);
  protected readonly interactive = signal(false);
  protected readonly dialogsReady = signal(false);
  protected readonly currentSlide = signal(0);
  protected readonly previousSlide = signal(-1);
  protected readonly shareUrl = signal('');
  protected readonly shareStatus = signal('');
  protected readonly photo = signal<{ src: string; alt: string; caption: string } | null>(null);
  protected readonly year = signal(new Date().getFullYear());

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly destroyRef = inject(DestroyRef);
  private readonly menuButton = viewChild.required<ElementRef<HTMLButtonElement>>('menuButton');
  private readonly heroImages = viewChild.required<ElementRef<HTMLDivElement>>('heroImages');
  private readonly introVideo = viewChild.required<ElementRef<HTMLVideoElement>>('introVideo');
  private readonly roomCarousel = viewChild.required<ElementRef<HTMLDivElement>>('roomCarousel');
  private readonly roomPhotos = viewChild.required<ElementRef<HTMLDivElement>>('roomPhotos');
  private readonly aboutShare = viewChild.required<ElementRef<HTMLDialogElement>>('aboutShare');
  private readonly photoDialog = viewChild.required<ElementRef<HTMLDialogElement>>('photoDialog');

  constructor() {
    afterNextRender(() => this.initializeBrowserBehavior());
    afterRenderEffect({
      write: (onCleanup) => onCleanup(this.observeIntroVideo(this.introVideo().nativeElement)),
    });
  }

  protected toggleMenu(): void {
    this.setMenuOpen(!this.menuOpen());
  }

  protected onNavClick(event: MouseEvent): void {
    if (event.target instanceof Element && event.target.closest('a')) this.setMenuOpen(false);
  }

  protected closeMenuOnEscape(): void {
    if (!this.menuOpen()) return;
    this.setMenuOpen(false);
    this.menuButton().nativeElement.focus();
  }

  protected scrollRoomPhotos(direction: number): void {
    const track = this.roomPhotos().nativeElement;
    const [first, second] = Array.from(track.children) as HTMLElement[];
    const current = track.scrollLeft;
    const end = track.scrollWidth - track.clientWidth;
    const step = second.offsetLeft - first.offsetLeft;
    let target = current + direction * step;

    if (direction > 0 && current >= end - 1) target = 0;
    if (direction < 0 && current <= 1) target = end;

    track.scrollTo({ left: target });
  }

  protected openPhoto(event: MouseEvent): void {
    if (!(event.target instanceof Element) || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest<HTMLAnchorElement>('a[data-photo]');
    if (!link || !this.dialogsReady()) return;

    event.preventDefault();
    const caption = link.dataset['caption'] ?? '';
    this.photo.set({ src: link.href, alt: link.querySelector('img')?.alt || caption, caption });
    this.photoDialog().nativeElement.showModal();
  }

  protected showShare(): void {
    this.shareUrl.set(new URL('#about', window.location.href).href);
    this.shareStatus.set('');
    this.aboutShare().nativeElement.showModal();
  }

  protected async copyShareUrl(input: HTMLInputElement): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.shareUrl());
      this.shareStatus.set('Link copied.');
    } catch {
      input.select();
      this.shareStatus.set('Copy the selected link.');
    }
  }

  private setMenuOpen(open: boolean): void {
    this.menuOpen.set(open);
    document.body.classList.toggle('menu-open', open);
  }

  private observeIntroVideo(video: HTMLVideoElement): () => void {
    const listeners = new AbortController();
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let inView = false;

    const syncPlayback = () => {
      if (!inView || document.hidden || reducedMotion.matches) {
        video.pause();
        return;
      }
      video.muted = true;
      void video.play().catch(() => {
        // The poster remains visible if the browser blocks autoplay.
      });
    };

    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      syncPlayback();
    });
    observer.observe(video);
    document.addEventListener('visibilitychange', syncPlayback, { signal: listeners.signal });
    reducedMotion.addEventListener('change', syncPlayback, { signal: listeners.signal });

    return () => {
      observer.disconnect();
      listeners.abort();
      video.pause();
    };
  }

  private initializeBrowserBehavior(): void {
    const listeners = new AbortController();
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const canHover = window.matchMedia('(hover: hover)');
    const heroSlides = Array.from(this.heroImages().nativeElement.querySelectorAll('img'));
    const carousel = this.roomCarousel().nativeElement;
    const dialog = this.photoDialog().nativeElement;
    let heroTimer: number | undefined;
    let roomTimer: number | undefined;

    const syncHeader = () => this.scrolled.set(window.scrollY > 36);
    syncHeader();
    window.addEventListener('scroll', syncHeader, { passive: true, signal: listeners.signal });

    const syncHeroRotation = () => {
      window.clearInterval(heroTimer);
      if (!reducedMotion.matches) {
        heroTimer = window.setInterval(() => this.advanceHeroPhoto(heroSlides), photoInterval);
      }
    };
    reducedMotion.addEventListener('change', syncHeroRotation, { signal: listeners.signal });
    syncHeroRotation();

    const revealObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    }, { threshold: 0.12 });
    this.host.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

    const roomObserver = new IntersectionObserver(([entry]) => {
      window.clearInterval(roomTimer);
      if (entry.intersectionRatio < 0.5) return;
      roomTimer = window.setInterval(() => {
        const hovering = canHover.matches && carousel.matches(':hover');
        if (document.hidden || reducedMotion.matches || hovering || carousel.matches(':focus-within') || dialog.open) return;
        this.scrollRoomPhotos(1);
      }, roomPhotoInterval);
    }, { threshold: 0.5 });
    roomObserver.observe(carousel);

    this.year.set(new Date().getFullYear());
    this.dialogsReady.set(typeof dialog.showModal === 'function');
    this.interactive.set(true);

    this.destroyRef.onDestroy(() => {
      listeners.abort();
      revealObserver.disconnect();
      roomObserver.disconnect();
      window.clearInterval(heroTimer);
      window.clearInterval(roomTimer);
      document.body.classList.remove('menu-open');
    });
  }

  private advanceHeroPhoto(slides: HTMLImageElement[]): void {
    if (document.hidden) return;

    const current = this.currentSlide();
    for (let offset = 1; offset < slides.length; offset += 1) {
      const next = (current + offset) % slides.length;
      if (!slides[next].complete || slides[next].naturalWidth === 0) continue;
      this.previousSlide.set(current);
      this.currentSlide.set(next);
      return;
    }
  }
}
