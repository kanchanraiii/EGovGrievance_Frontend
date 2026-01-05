import { Routes } from '@angular/router';
import { AuthComponent } from './auth/auth.component';
import { authGuard } from './auth/auth.guard';
import { AboutComponent } from './about/about';
import { adminGuard } from './auth/admin.guard';
import { HomeComponent } from './home/home.component';
import { LandingComponent } from './landing/landing.component';
import { redirectAuthGuard } from './auth/redirect-auth.guard';
import { AdminAuthComponent } from './admin/admin-auth.component';
import { AdminDashboardComponent } from './admin/admin-dashboard.component';
import { AdminDepartmentsComponent } from './admin/admin-departments.component';
import { AdminSupervisorsComponent } from './admin/admin-supervisors.component';
import { AdminDepartmentDetailComponent } from './admin/admin-department-detail.component';
import { AdminDoComponent } from './admin/admin-do.component';
import { SupervisorAuthComponent } from './supervisor/supervisor-auth.component';
import { SupervisorDashboardComponent } from './supervisor/supervisor-dashboard.component';
import { supervisorGuard } from './auth/supervisor.guard';
import { DoAuthComponent } from './department-officer/do-auth.component';
import { DoDashboardComponent } from './department-officer/do-dashboard.component';
import { departmentOfficerGuard } from './auth/department-officer.guard';
import { CwAuthComponent } from './case-worker/cw-auth.component';
import { CwDashboardComponent } from './case-worker/cw-dashboard.component';
import { caseWorkerGuard } from './auth/case-worker.guard';

export const routes: Routes = [
  { path: '', component: LandingComponent, pathMatch: 'full' },
  { path: 'about', component: AboutComponent },
  { path: 'auth', component: AuthComponent, canActivate: [redirectAuthGuard] },
  { path: 'dashboard', component: HomeComponent, canActivate: [authGuard] },
  { path: 'admin/login', component: AdminAuthComponent, canActivate: [redirectAuthGuard] },
  { path: 'admin', component: AdminDashboardComponent, canActivate: [adminGuard] },
  { path: 'admin/departments', component: AdminDepartmentsComponent, canActivate: [adminGuard] },
  { path: 'admin/departments/:id', component: AdminDepartmentDetailComponent, canActivate: [adminGuard] },
  { path: 'admin/department-officers', component: AdminDoComponent, canActivate: [adminGuard] },
  { path: 'admin/supervisors', component: AdminSupervisorsComponent, canActivate: [adminGuard] },
  { path: 'supervisor/login', component: SupervisorAuthComponent, canActivate: [redirectAuthGuard] },
  { path: 'supervisor', component: SupervisorDashboardComponent, canActivate: [supervisorGuard] },
  { path: 'do/login', component: DoAuthComponent, canActivate: [redirectAuthGuard] },
  { path: 'do', component: DoDashboardComponent, canActivate: [departmentOfficerGuard] },
  { path: 'cw/login', component: CwAuthComponent, canActivate: [redirectAuthGuard] },
  { path: 'cw', component: CwDashboardComponent, canActivate: [caseWorkerGuard] },
  { path: '**', redirectTo: '' }
];
