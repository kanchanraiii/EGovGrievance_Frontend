import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const caseWorkerGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const role = auth.getRole().toLowerCase();
  if (auth.isAuthenticated() && (role === 'case_worker' || role === 'case-worker' || role === 'cw')) {
    return true;
  }

  return router.parseUrl('/cw/login');
};
