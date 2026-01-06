import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

const STAFF_ROLES = ['admin', 'supervisor', 'supervisory_officer', 'department_officer', 'do', 'case_worker', 'cw'];

export const staffGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const role = auth.getRole().toLowerCase();
  if (auth.isAuthenticated() && STAFF_ROLES.includes(role)) {
    return true;
  }

  return router.parseUrl('/auth');
};
