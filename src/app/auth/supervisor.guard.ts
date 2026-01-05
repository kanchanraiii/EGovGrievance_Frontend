import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const supervisorGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const role = auth.getRole().toLowerCase();
  if (auth.isAuthenticated() && (role === 'supervisory_officer' || role === 'supervisor' || role === 'so')) {
    return true;
  }

  return router.parseUrl('/supervisor/login');
};
