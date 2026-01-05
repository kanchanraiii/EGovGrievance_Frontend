import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const departmentOfficerGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const role = auth.getRole().toLowerCase();
  if (auth.isAuthenticated() && (role === 'department_officer' || role === 'do' || role === 'department-officer')) {
    return true;
  }

  return router.parseUrl('/do/login');
};
