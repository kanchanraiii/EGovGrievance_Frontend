import { Routes } from '@angular/router';
import { AuthComponent } from './auth/auth.component';
import { authGuard } from './auth/auth.guard';
import { HomeComponent } from './home/home.component';
import { LandingComponent } from './landing/landing.component';
import { redirectAuthGuard } from './auth/redirect-auth.guard';

export const routes: Routes = [
  { path: '', component: LandingComponent, pathMatch: 'full' },
  { path: 'auth', component: AuthComponent, canActivate: [redirectAuthGuard] },
  { path: 'dashboard', component: HomeComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];
