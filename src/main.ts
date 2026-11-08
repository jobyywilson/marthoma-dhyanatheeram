import { bootstrapApplication } from '@angular/platform-browser';
import { SiteShell } from './app/app';
import { appConfig } from './app/app.config';

bootstrapApplication(SiteShell, appConfig).catch((error) => {
  window.dispatchEvent(new Event('site:ready'));
  console.error(error);
});
