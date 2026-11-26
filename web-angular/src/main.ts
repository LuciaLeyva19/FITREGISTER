import { bootstrapApplication } from '@angular/platform-browser';

import {
  provideRouter,
  withInMemoryScrolling
} from '@angular/router';

import {
  provideZoneChangeDetection,
  isDevMode
} from '@angular/core';

import {
  provideServiceWorker
} from '@angular/service-worker';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';

bootstrapApplication(AppComponent, {
  providers: [
    provideZoneChangeDetection({
      eventCoalescing: true
    }),

    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled'
      })
    ),

    // Habilitar la PWA en compilaciones de producción.
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    })
  ]
}).catch(console.error);
