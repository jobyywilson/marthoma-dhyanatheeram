import { Routes } from '@angular/router';
import { Home } from './home';
import { Leadership } from './leadership';

export const routes: Routes = [
  {
    path: '', pathMatch: 'full', component: Home,
    title: 'Mar Thoma Dhyanatheeram | Perungalam, Kollam',
    data: { description: 'Explore Mar Thoma Dhyanatheeram, a lakeside spiritual retreat in Perungalam, Kollam, with guest rooms, day packages and spaces for prayer and fellowship.' },
  },
  {
    path: 'leadership', component: Leadership,
    title: 'Leadership & Stewardship | Mar Thoma Dhyanatheeram',
    data: { description: 'Meet the church and project leadership guiding Mar Thoma Dhyanatheeram in Perungalam, Kollam.' },
  },
];
