import { DOCUMENT, ViewportScroller } from '@angular/common';
import { afterNextRender, afterRenderEffect, Component, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  host: { '(document:keydown.escape)': 'closeMenuOnEscape()' },
})
export class SiteShell {
  protected readonly scrolled = signal(false);
  protected readonly leadershipPage = signal(false);
  protected readonly menuOpen = signal(false);
  protected readonly year = signal(new Date().getFullYear());

  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly meta = inject(Meta);
  private readonly siteHeader = viewChild<ElementRef<HTMLElement>>('siteHeader');
  private readonly menuButton = viewChild.required<ElementRef<HTMLButtonElement>>('menuButton');

  constructor() {
    afterNextRender(() => window.dispatchEvent(new Event('site:ready')));
    inject(ViewportScroller).setOffset(() => [0, (this.siteHeader()?.nativeElement.offsetHeight ?? 72) + 12]);
    const navigation = this.router.events.subscribe((event) => {
      if (!(event instanceof NavigationEnd)) return;
      const page = this.router.routerState.snapshot.root.firstChild;
      this.leadershipPage.set(page?.routeConfig?.path === 'leadership');
      const description = page?.data['description'];
      if (typeof description === 'string') this.meta.updateTag({ name: 'description', content: description });
      this.setMenuOpen(false);
    });
    this.destroyRef.onDestroy(() => {
      navigation.unsubscribe();
      this.document.body.classList.remove('menu-open');
    });
    afterRenderEffect({
      write: (onCleanup) => {
        this.siteHeader();
        const listeners = new AbortController();
        const syncHeader = () => this.scrolled.set(window.scrollY > 36);
        syncHeader();
        this.year.set(new Date().getFullYear());
        window.addEventListener('scroll', syncHeader, { passive: true, signal: listeners.signal });
        onCleanup(() => listeners.abort());
      },
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

  private setMenuOpen(open: boolean): void {
    this.menuOpen.set(open);
    this.document.body.classList.toggle('menu-open', open);
  }
}
