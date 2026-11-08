import { afterRenderEffect, Component, ElementRef, inject, signal, viewChild, type WritableSignal } from '@angular/core';

const photoInterval = 7000;
const experiencePhotoInterval = 5000;
const facilityPhotoInterval = 5000;

type FacilityCardNavigation = { overflows: boolean; previous: boolean; next: boolean };

type ExperienceEntry = {
  title: string;
  summary?: string;
  details: readonly string[];
  photo: {
    src: string;
    alt: string;
    width: number;
    height: number;
    position?: string;
    location: string;
    caption: string;
  };
};

@Component({
  selector: 'app-home',
  templateUrl: './home.html',
  host: { style: 'display: block' },
})
export class Home {
  protected readonly aboutIntroduction = 'Welcome to Mar Thoma Dhyanatheeram, nestled on the serene Perungalam Island in Munroe Island, Kollam. Mar Thoma Dhyanatheeram is the only lakeside meditation centre of the Mar Thoma Syrian Church.';
  protected readonly experienceEntries: readonly ExperienceEntry[] = [
    {
      title: 'Breathtaking Surroundings',
      summary: 'Step out to calm waters, lush greenery and the beauty of nature.',
      details: ['Explore the Boat Heritage Gallery and landscaped gardens, with paved walking paths around the grounds.'],
      photo: {
        src: 'assets/ashtamudi-waterfront.webp',
        alt: 'Coconut palms and flowering gardens reflected in the calm waters of Ashtamudi Lake',
        width: 1600, height: 1063,
        location: 'Perungalam', caption: 'Ashtamudi waterfront',
      },
    },
    {
      title: 'Explore Ashtamudi Lake',
      summary: 'Enjoy boat rides and experience Kerala’s unique backwaters.',
      details: ['A lakeside jetty is also available.'],
      photo: {
        src: 'assets/ashtamudi-sunset-canoe.png',
        alt: 'Canoe ride on Ashtamudi Lake at sunset, with passengers wearing life jackets',
        width: 1122, height: 1402, position: '50% 30%',
        location: 'Ashtamudi', caption: 'Sunset canoe ride',
      },
    },
    {
      title: 'Pets Collection',
      details: ['Discover the animal collection within the retreat grounds.'],
      photo: {
        src: 'assets/pets-collection.png',
        alt: 'Emu in a fenced enclosure shaded by coconut palms at Dhyanatheeram',
        width: 1536, height: 1024, position: '65% 50%',
        location: 'Perungalam', caption: 'Pets collection',
      },
    },
    {
      title: 'Munroe Island Boat Cruise',
      details: ['Explore Munroe Island’s backwaters on a boat cruise, including mangrove exploration.'],
      photo: {
        src: 'assets/munroe-island-boat-cruise.png',
        alt: 'Canoe passing beneath an arch of green mangrove trees reflected in the backwaters',
        width: 1122, height: 1402, position: '50% 53%',
        location: 'Munroe Island', caption: 'Mangrove canoe ride',
      },
    },
    {
      title: 'Prayer & Reflection Spaces',
      details: ['Peaceful environment for spiritual renewal'],
      photo: {
        src: 'assets/prayer-reflection-spaces.png',
        alt: 'Red steps beneath trees beside a mural of praying hands',
        width: 937, height: 1679, position: '50% 35%',
        location: 'Perungalam', caption: 'Prayer steps',
      },
    },
    {
      title: 'Island Village Walk',
      details: ['Enjoy walks through the island villages of Munroe Island.'],
      photo: {
        src: 'assets/garden-paths.webp',
        alt: 'Paved walking paths among palm trees and lawns in the retreat gardens',
        width: 1600, height: 1063,
        location: 'Perungalam', caption: 'Retreat walking paths',
      },
    },
    {
      title: 'Meditation Center',
      details: ['A Meditation Center set in peaceful natural surroundings.'],
      photo: {
        src: 'assets/coconut-grove.webp',
        alt: 'A covered shelter and winding paths among coconut palms overlooking the lake',
        width: 1600, height: 1063,
        location: 'Perungalam', caption: 'Coconut grove',
      },
    },
    {
      title: 'Children\u2019s Play Area',
      details: ['An outdoor play area for children in the retreat grounds.'],
      photo: {
        src: 'assets/childrens-play-area.png',
        alt: 'Blue garden swing with a yellow and maroon frame on the lawn among coconut palms',
        width: 1536, height: 1024,
        location: 'Perungalam', caption: 'Children\u2019s play area',
      },
    },
  ];
  protected readonly dialogsReady = signal(false);
  protected readonly currentSlide = signal(0);
  protected readonly previousSlide = signal(-1);
  protected readonly currentExperiencePhoto = signal(0);
  protected readonly previousExperiencePhoto = signal(-1);
  protected readonly experienceAnnouncement = signal('');
  protected readonly currentConferencePhoto = signal(0);
  protected readonly currentRoomPhoto = signal(0);
  protected readonly stayCardNavigation = signal<FacilityCardNavigation>({ overflows: false, previous: false, next: false });
  protected readonly gatherCardNavigation = signal<FacilityCardNavigation>({ overflows: false, previous: false, next: false });
  protected readonly shareUrl = signal('');
  protected readonly shareStatus = signal('');

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly heroImages = viewChild.required<ElementRef<HTMLDivElement>>('heroImages');
  private readonly experienceImages = viewChild.required<ElementRef<HTMLDivElement>>('experienceImages');
  private readonly experienceCarousel = viewChild.required<ElementRef<HTMLElement>>('experienceCarousel');
  private selectExperienceEntry?: (index: number, manual: boolean, focusIndicator?: boolean) => void;
  private readonly introVideo = viewChild.required<ElementRef<HTMLVideoElement>>('introVideo');
  private readonly conferenceImages = viewChild<ElementRef<HTMLElement>>('conferenceImages');
  private readonly roomImages = viewChild<ElementRef<HTMLElement>>('roomImages');
  private readonly stayCards = viewChild<ElementRef<HTMLElement>>('stayCards');
  private readonly gatherCards = viewChild<ElementRef<HTMLElement>>('gatherCards');
  private readonly aboutShare = viewChild.required<ElementRef<HTMLDialogElement>>('aboutShare');
  private readonly shareLinkDetails = viewChild.required<ElementRef<HTMLDetailsElement>>('shareLinkDetails');

  constructor() {
    // Reconnect observers and timers when template updates replace queried elements.
    afterRenderEffect({
      write: (onCleanup) => onCleanup(this.initializeBrowserBehavior()),
    });
    afterRenderEffect({
      write: (onCleanup) => onCleanup(this.observeIntroVideo(this.introVideo().nativeElement)),
    });
    afterRenderEffect({
      write: (onCleanup) => onCleanup(this.observeExperienceCarousel(
        this.experienceCarousel().nativeElement, this.experienceImages().nativeElement,
      )),
    });
    afterRenderEffect({
      write: (onCleanup) => {
        const photos = this.conferenceImages()?.nativeElement;
        if (photos) onCleanup(this.observeFacilityPhotos(photos, this.currentConferencePhoto));
      },
    });
    afterRenderEffect({
      write: (onCleanup) => {
        const photos = this.roomImages()?.nativeElement;
        if (photos) onCleanup(this.observeFacilityPhotos(photos, this.currentRoomPhoto));
      },
    });
    afterRenderEffect({
      write: (onCleanup) => {
        const cleanups: (() => void)[] = [];
        const stay = this.stayCards()?.nativeElement;
        const gather = this.gatherCards()?.nativeElement;
        if (stay) cleanups.push(this.observeCardTrack(stay, (state) => this.stayCardNavigation.set(state)));
        if (gather) cleanups.push(this.observeCardTrack(gather, (state) => this.gatherCardNavigation.set(state)));
        onCleanup(() => cleanups.forEach((cleanup) => cleanup()));
      },
    });
  }

  protected scrollFacilityCards(track: HTMLElement, direction: -1 | 1): void {
    const maximum = Math.max(0, track.scrollWidth - track.clientWidth);
    if (maximum <= 1) return;

    const start = track.getBoundingClientRect().left + track.clientLeft;
    const positions = Array.from(track.querySelectorAll<HTMLElement>(':scope > .facility-card'))
      .map((card) => Math.min(maximum, Math.max(0, card.getBoundingClientRect().left - start + track.scrollLeft)));
    const target = direction > 0
      ? positions.find((position) => position > track.scrollLeft + 1) ?? maximum
      : positions.reverse().find((position) => position < track.scrollLeft - 1) ?? 0;
    track.scrollTo({
      left: target,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    });
  }

  private observeCardTrack(track: HTMLElement, update: (state: FacilityCardNavigation) => void): () => void {
    const listeners = new AbortController();
    let previous: FacilityCardNavigation | undefined;
    const sync = () => {
      const maximum = track.scrollWidth - track.clientWidth;
      const state = {
        overflows: maximum > 1,
        previous: maximum > 1 && track.scrollLeft > 1,
        next: maximum > 1 && track.scrollLeft < maximum - 1,
      };
      if (!previous || state.overflows !== previous.overflows || state.previous !== previous.previous || state.next !== previous.next) {
        previous = state;
        update(state);
      }
    };
    track.addEventListener('scroll', sync, { passive: true, signal: listeners.signal });
    const observer = new ResizeObserver(sync);
    observer.observe(track);
    Array.from(track.children).forEach((card) => observer.observe(card));
    sync();

    return () => {
      listeners.abort();
      observer.disconnect();
    };
  }

  protected showShare(): void {
    this.shareUrl.set(new URL('#about', window.location.href).href);
    this.shareStatus.set('');
    this.shareLinkDetails().nativeElement.open = false;
    this.aboutShare().nativeElement.showModal();
  }

  protected async copyShareUrl(input: HTMLInputElement, details: HTMLDetailsElement): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.shareUrl());
      this.shareStatus.set('Link copied. Ready to share.');
    } catch {
      this.shareStatus.set('Copy the selected link to share it.');
      if (this.aboutShare().nativeElement.open) {
        details.open = true;
        input.focus();
        input.select();
      }
    }
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

  private observeFacilityPhotos(container: HTMLElement, currentPhoto: WritableSignal<number>): () => void {
    const listeners = new AbortController();
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const slides = Array.from(container.querySelectorAll('img'));
    let inView = false;
    let timer: number | undefined;

    const syncRotation = () => {
      window.clearInterval(timer);
      if (!inView || document.hidden || reducedMotion.matches || slides.length < 2) return;
      timer = window.setInterval(() => {
        const next = (currentPhoto() + 1) % slides.length;
        if (slides[next].complete && slides[next].naturalWidth > 0) {
          currentPhoto.set(next);
        }
      }, facilityPhotoInterval);
    };
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting && entry.intersectionRatio >= 0.25;
      syncRotation();
    }, { threshold: [0, 0.25] });
    observer.observe(container);
    reducedMotion.addEventListener('change', syncRotation, { signal: listeners.signal });
    document.addEventListener('visibilitychange', syncRotation, { signal: listeners.signal });

    return () => {
      observer.disconnect();
      listeners.abort();
      window.clearInterval(timer);
    };
  }

  protected selectExperience(index: number): void {
    this.selectExperienceEntry?.(index, true);
  }

  private observeExperienceCarousel(carousel: HTMLElement, images: HTMLElement): () => void {
    const listeners = new AbortController();
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const slides = Array.from(images.querySelectorAll('img'));
    const indicators = Array.from(carousel.querySelectorAll<HTMLButtonElement>('.experience-dot'));
    let inView = false;
    let focused = carousel.contains(document.activeElement) && document.activeElement instanceof Element && document.activeElement.matches(':focus-visible');
    let pressedPointer: number | undefined;
    let gesture: { id: number; x: number; y: number; axis: 'pending' | 'horizontal' | 'vertical' } | undefined;
    let pending = false;
    let selectionVersion = 0;
    let timer: number | undefined;

    const syncRotation = () => {
      window.clearTimeout(timer);
      if (listeners.signal.aborted || !inView || document.hidden || reducedMotion.matches || focused || pressedPointer !== undefined || pending) return;
      timer = window.setTimeout(() => select(this.currentExperiencePhoto() + 1, false), experiencePhotoInterval);
    };
    const select = (index: number, manual: boolean, focusIndicator = false) => {
      const next = (index + slides.length) % slides.length;
      const version = ++selectionVersion;
      window.clearTimeout(timer);
      pending = true;
      const commit = () => {
        if (listeners.signal.aborted || version !== selectionVersion) return;
        pending = false;
        if (!manual && (!inView || document.hidden || reducedMotion.matches || focused || pressedPointer !== undefined)) {
          syncRotation();
          return;
        }
        if (next !== this.currentExperiencePhoto()) {
          this.previousExperiencePhoto.set(this.currentExperiencePhoto());
          this.currentExperiencePhoto.set(next);
        }
        this.experienceAnnouncement.set(manual ? `${this.experienceEntries[next].title}. ${next + 1} of ${slides.length}.` : '');
        if (focusIndicator) indicators[next]?.focus({ preventScroll: true });
        syncRotation();
      };
      const photo = slides[next];
      if (photo.complete && photo.naturalWidth > 0) {
        commit();
      } else {
        photo.loading = 'eager';
        void photo.decode().then(commit, () => {
          if (listeners.signal.aborted || version !== selectionVersion) return;
          pending = false;
          if (manual) this.experienceAnnouncement.set('Unable to load that experience photo.');
          syncRotation();
        });
      }
    };
    this.selectExperienceEntry = select;

    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting && entry.intersectionRatio >= 0.15;
      syncRotation();
    }, { threshold: [0, 0.15] });
    observer.observe(carousel);
    reducedMotion.addEventListener('change', syncRotation, { signal: listeners.signal });
    document.addEventListener('visibilitychange', syncRotation, { signal: listeners.signal });
    carousel.addEventListener('focusin', (event) => {
      focused = event.target instanceof Element && event.target.matches(':focus-visible');
      syncRotation();
    }, { signal: listeners.signal });
    carousel.addEventListener('focusout', (event) => {
      focused = event.relatedTarget instanceof Element && carousel.contains(event.relatedTarget) && event.relatedTarget.matches(':focus-visible');
      syncRotation();
    }, { signal: listeners.signal });
    carousel.addEventListener('keydown', (event) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || window.getSelection()?.toString()) return;
      const target = event.target;
      if (!(target instanceof HTMLElement) || target.closest('input, textarea, select, [contenteditable]')) return;
      let next: number;
      switch (event.key) {
        case 'ArrowLeft': next = this.currentExperiencePhoto() - 1; break;
        case 'ArrowRight': next = this.currentExperiencePhoto() + 1; break;
        case 'Home': next = 0; break;
        case 'End': next = slides.length - 1; break;
        default: return;
      }
      event.preventDefault();
      select(next, true, !!target.closest('.experience-dot'));
    }, { signal: listeners.signal });
    carousel.addEventListener('pointerdown', (event) => {
      focused = false;
      if (!event.isPrimary) {
        gesture = undefined;
        pressedPointer = undefined;
        syncRotation();
        return;
      }
      pressedPointer = event.pointerId;
      syncRotation();
      const target = event.target;
      if (event.pointerType === 'mouse' || !(target instanceof Element) || !target.closest('[data-experience-swipe]') || target.closest('button, a, input, textarea, select') || window.getSelection()?.toString()) return;
      gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, axis: 'pending' };
    }, { signal: listeners.signal });
    carousel.addEventListener('pointermove', (event) => {
      if (!gesture || gesture.id !== event.pointerId) return;
      if (window.getSelection()?.toString()) {
        gesture = undefined;
        return;
      }
      const dx = Math.abs(event.clientX - gesture.x);
      const dy = Math.abs(event.clientY - gesture.y);
      if (gesture.axis === 'pending' && Math.max(dx, dy) >= 12) {
        if (dx > dy * 1.25) gesture.axis = 'horizontal';
        else if (dy > dx * 1.25) gesture.axis = 'vertical';
      }
      if (gesture.axis === 'horizontal') {
        if (!carousel.hasPointerCapture(event.pointerId)) carousel.setPointerCapture(event.pointerId);
        if (event.cancelable) event.preventDefault();
      }
    }, { signal: listeners.signal });
    const finishPointer = (event: PointerEvent) => {
      if (pressedPointer !== event.pointerId) return;
      const swipe = gesture;
      gesture = undefined;
      pressedPointer = undefined;
      if (carousel.hasPointerCapture(event.pointerId)) carousel.releasePointerCapture(event.pointerId);
      const dx = swipe ? event.clientX - swipe.x : 0;
      const dy = swipe ? event.clientY - swipe.y : 0;
      if (event.type === 'pointerup' && swipe?.axis === 'horizontal' && Math.abs(dx) >= 48 && Math.abs(dx) > Math.abs(dy) * 1.25 && !window.getSelection()?.toString()) {
        select(this.currentExperiencePhoto() + (dx < 0 ? 1 : -1), true);
      } else {
        syncRotation();
      }
    };
    window.addEventListener('pointerup', finishPointer, { signal: listeners.signal });
    window.addEventListener('pointercancel', finishPointer, { signal: listeners.signal });
    carousel.addEventListener('lostpointercapture', (event) => {
      // Ignore capture transfers bubbling from the original touch target.
      if (event.target === carousel) finishPointer(event);
    }, { signal: listeners.signal });

    return () => {
      listeners.abort();
      observer.disconnect();
      window.clearTimeout(timer);
      selectionVersion += 1;
      if (pressedPointer !== undefined && carousel.hasPointerCapture(pressedPointer)) carousel.releasePointerCapture(pressedPointer);
      if (this.selectExperienceEntry === select) this.selectExperienceEntry = undefined;
    };
  }

  private initializeBrowserBehavior(): () => void {
    const listeners = new AbortController();
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const heroSlides = Array.from(this.heroImages().nativeElement.querySelectorAll('img'));
    const dialog = this.aboutShare().nativeElement;
    let heroTimer: number | undefined;

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

    this.dialogsReady.set(typeof dialog.showModal === 'function');

    return () => {
      listeners.abort();
      revealObserver.disconnect();
      window.clearInterval(heroTimer);
    };
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
