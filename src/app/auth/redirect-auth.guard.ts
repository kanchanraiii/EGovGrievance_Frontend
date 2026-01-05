import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

// If user is already authenticated, push them away from /auth
export const redirectAuthGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    const role = auth.getRole().toLowerCase();
    if (role === 'admin') {
      return router.parseUrl('/admin');
    }
    return router.parseUrl('/');
  }

  return true;
};
