import { mergeApplicationConfig } from '@angular/core';
import { bootstrapApplication, BootstrapContext } from '@angular/platform-browser';
import { provideServerRendering, RenderMode, withRoutes } from '@angular/ssr';
import { SiteShell } from './app/app';
import { appConfig } from './app/app.config';

const serverConfig = mergeApplicationConfig(appConfig, {
  providers: [provideServerRendering(withRoutes([
    { path: '', renderMode: RenderMode.Prerender },
    { path: 'leadership', renderMode: RenderMode.Prerender },
  ]))],
});

export default (context: BootstrapContext) => bootstrapApplication(SiteShell, serverConfig, context);
