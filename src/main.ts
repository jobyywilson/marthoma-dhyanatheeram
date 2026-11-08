import { bootstrapApplication } from '@angular/platform-browser';
import { SiteShell } from './app/app';
import { appConfig } from './app/app.config';

bootstrapApplication(SiteShell, appConfig).catch(console.error);
