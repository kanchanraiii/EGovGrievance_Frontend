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

  loginCitizen() {
    this.loginError = '';
    if (this.loginValidation) {
      this.cdr.markForCheck();
      return;
    }
    this.http.post<{ token?: string }>(`${this.auth.getBaseUrl()}/auth/login`, this.loginForm).subscribe({
      next: res => {
        if (res?.token) {
          this.auth.setToken(res.token);
          this.fetchProfileAndNavigate(res.token);
        } else {
          this.loginError = 'Login succeeded but token was missing.';
          this.cdr.markForCheck();
        }
      },
      error: err => {
        this.loginError = this.readError(err);
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

  private fetchProfileAndNavigate(token: string) {
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    this.http.get<{ name?: string; email?: string }>(`${this.auth.getBaseUrl()}/auth/profile`, { headers }).subscribe({
      next: res => {
        this.auth.setProfile({ name: res.name, email: res.email });
        this.router.navigateByUrl('/dashboard');
      },
      error: () => {
        // even if profile fails, still navigate with token
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

  private isEmailValid(email: string) {
    const trimmed = email.trim();
    // simple RFC-ish email check
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed);
  }

  private isPhoneValid(phone: string) {
    // allow digits only, 10 digits
    return /^\d{10}$/.test(phone.trim());
  }

  private isStrongPassword(password: string) {
    const trimmed = password.trim();
    return /[a-z]/.test(trimmed) && /[A-Z]/.test(trimmed) && /\d/.test(trimmed) && /[^A-Za-z0-9]/.test(trimmed) && trimmed.length >= 8;
  }
}
