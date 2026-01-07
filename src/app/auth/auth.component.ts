import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css'],
})
export class AuthComponent {
  private http = inject(HttpClient);
  private router = inject(Router);
  private auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  mode: 'login' | 'signup' = 'login';
  staffRole = 'admin';
  loginForm = {
    email: '',
    password: ''
  };

  registerForm = {
    fullName: '',
    email: '',
    phone: '',
    password: ''
  };

  loginError = '';
  registerError = '';
  registerResult = false;
  loginSubmitting = false;

  get loginValidation(): string {
    if (!this.loginForm.email.trim()) return 'Email is required.';
    if (!this.isEmailValid(this.loginForm.email)) return 'Enter a valid email (e.g., user@example.com).';
    if (!this.loginForm.password.trim()) return 'Password is required.';
    return '';
  }

  get registerValidation(): string {
    if (!this.registerForm.fullName.trim()) return 'Full name is required.';
    if (this.registerForm.fullName.trim().length < 6) return 'Full name must be at least 6 characters.';
    if (!this.registerForm.email.trim()) return 'Email is required.';
    if (!this.isEmailValid(this.registerForm.email)) return 'Enter a valid email (e.g., user@example.com).';
    if (!this.registerForm.phone.trim()) return 'Phone is required.';
    if (!this.isPhoneValid(this.registerForm.phone)) return 'Phone must be 10 digits.';
    if (!this.registerForm.password.trim()) return 'Password is required.';
    if (!this.isStrongPassword(this.registerForm.password)) {
      return 'Password must be 8+ chars with upper, lower, number, and symbol.';
    }
    return '';
  }

  onLoginChange() {
    this.loginError = '';
  }

  onRegisterChange() {
    this.registerError = '';
  }

  // Reset handlers for forms
  resetLoginForm(form?: import('@angular/forms').NgForm) {
    this.loginForm = { email: '', password: '' };
    this.loginError = '';
    if (form) {
      form.resetForm(this.loginForm);
    }
    this.cdr.markForCheck();
  }

  resetRegisterForm(form?: import('@angular/forms').NgForm) {
    this.registerForm = { fullName: '', email: '', phone: '', password: '' };
    this.registerError = '';
    this.registerResult = false;
    if (form) {
      form.resetForm(this.registerForm);
    }
    this.cdr.markForCheck();
  }

  // Password requirement helpers for signup display
  get pwMinLen() {
    return (this.registerForm.password || '').trim().length >= 8;
  }

  get pwHasUpper() {
    return /[A-Z]/.test(this.registerForm.password || '');
  }

  get pwHasLower() {
    return /[a-z]/.test(this.registerForm.password || '');
  }

  get pwHasNumber() {
    return /[0-9]/.test(this.registerForm.password || '');
  }

  get pwHasSymbol() {
    return /[^A-Za-z0-9]/.test(this.registerForm.password || '');
  }

  get pwValidationMessages(): string[] {
    const msgs: string[] = [];
    const val = (this.registerForm.password || '').trim();
    if (!val) {
      msgs.push('Password is required.');
      return msgs;
    }
    if (!this.pwMinLen) msgs.push('At least 8 characters');
    if (!this.pwHasUpper) msgs.push('At least one uppercase letter');
    if (!this.pwHasLower) msgs.push('At least one lowercase letter');
    if (!this.pwHasNumber) msgs.push('At least one number');
    if (!this.pwHasSymbol) msgs.push('At least one symbol (e.g. !@#$%)');
    return msgs;
  }

  loginCitizen() {
    this.loginError = '';
    if (this.loginValidation) {
      this.cdr.markForCheck();
      return;
    }
    this.loginSubmitting = true;
    this.cdr.markForCheck();
    this.http.post<{ token?: string; role?: string }>(`${this.auth.getBaseUrl()}/auth/login`, this.loginForm).subscribe({
      next: res => {
        if (res?.token) {
          this.auth.setToken(res.token);
          this.fetchProfileAndNavigate(res.token, res.role, 'citizen');
        } else {
          this.loginError = 'Login succeeded but token was missing.';
          this.loginSubmitting = false;
          this.cdr.markForCheck();
        }
      },
      error: err => {
        this.loginError = this.readError(err);
        this.loginSubmitting = false;
        this.cdr.markForCheck();
      }
    });
  }

  registerCitizen() {
    this.registerError = '';
    this.registerResult = false;
    if (this.registerValidation) {
      this.cdr.markForCheck();
      return;
    }
    this.http.post(`${this.auth.getBaseUrl()}/auth/citizen/register`, this.registerForm).subscribe({
      next: () => {
        this.registerResult = true;
        this.mode = 'login';
        this.cdr.markForCheck();
      },
      error: err => {
        this.registerError = this.readError(err);
        this.cdr.markForCheck();
      }
    });
  }

  goToStaff() {
    if (this.staffRole === 'supervisor') {
      this.router.navigateByUrl('/supervisor/login');
      return;
    }
    if (this.staffRole === 'do') {
      this.router.navigateByUrl('/do/login');
      return;
    }
    if (this.staffRole === 'cw') {
      this.router.navigateByUrl('/cw/login');
      return;
    }
    this.router.navigateByUrl('/admin/login');
  }

  private fetchProfileAndNavigate(token: string, fallbackRole?: string, expectedRole: string = 'citizen') {
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    this.http
      .get<{ name?: string; email?: string; role?: string }>(`${this.auth.getBaseUrl()}/auth/profile`, {
        headers
      })
      .subscribe({
      next: res => {
        const resolvedRole = (res.role || fallbackRole || 'citizen').toString().toLowerCase();
        if (expectedRole && resolvedRole !== expectedRole) {
          this.auth.clearToken();
          this.auth.clearProfile();
          this.loginError = 'Please use the staff login for this account.';
          this.loginSubmitting = false;
          this.cdr.markForCheck();
          return;
        }
        this.auth.setProfile({ name: res.name, email: res.email, role: resolvedRole });
        this.loginSubmitting = false;
        this.router.navigateByUrl('/dashboard');
      },
      error: () => {
        const resolvedRole = (fallbackRole || 'citizen').toString().toLowerCase();
        if (expectedRole && resolvedRole !== expectedRole) {
          this.auth.clearToken();
          this.auth.clearProfile();
          this.loginError = 'Please use the staff login for this account.';
          this.loginSubmitting = false;
          this.cdr.markForCheck();
          return;
        }
        this.auth.setProfile({ role: resolvedRole });
        this.loginSubmitting = false;
        this.router.navigateByUrl('/dashboard');
      }
    });
  }

  private readError(error: unknown) {
    if (error instanceof HttpErrorResponse) {
      if (typeof error.error === 'string') {
        return error.error;
      }
      return error.error?.message || error.message;
    }
    return String(error);
  }

  isEmailValid(email: string) {
    const trimmed = email.trim();
    // simple RFC-ish email check
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed);
  }

  isPhoneValid(phone: string) {
    // allow digits only, 10 digits
    return /^\d{10}$/.test(phone.trim());
  }

  isStrongPassword(password: string) {
    const trimmed = password.trim();
    return /[a-z]/.test(trimmed) && /[A-Z]/.test(trimmed) && /\d/.test(trimmed) && /[^A-Za-z0-9]/.test(trimmed) && trimmed.length >= 8;
  }
}
