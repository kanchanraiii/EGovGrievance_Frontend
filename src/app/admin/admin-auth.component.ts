import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-admin-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-auth.html',
  styleUrl: './admin-auth.css'
  ,
})
export class AdminAuthComponent {
  private http = inject(HttpClient);
  private router = inject(Router);
  private auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  submitting = false;

  loginForm = {
    email: '',
    password: ''
  };

  loginError = '';

  get loginValidation(): string {
    if (!this.loginForm.email.trim()) return 'Email is required.';
    if (!this.isEmailValid(this.loginForm.email)) return 'Enter a valid email.';
    if (!this.loginForm.password.trim()) return 'Password is required.';
    return '';
  }

  onLoginChange() {
    this.loginError = '';
  }

  goBackToSignup() {
    this.router.navigateByUrl('/');
  }

  resetLoginForm(form?: NgForm) {
    this.loginForm = { email: '', password: '' };
    this.loginError = '';
    if (form) form.resetForm();
    this.cdr.markForCheck();
  }

  loginAdmin() {
    this.loginError = '';
    if (this.loginValidation) {
      this.cdr.markForCheck();
      return;
    }
    this.submitting = true;
    this.cdr.markForCheck();
    this.http.post<{ token?: string; role?: string }>(`${this.auth.getBaseUrl()}/auth/admin/login`, this.loginForm).subscribe({
      next: res => {
        if (res?.token) {
          this.auth.setToken(res.token);
          this.fetchProfileAndNavigate(res.token, res.role || 'admin');
        } else {
          this.loginError = 'Login succeeded but token was missing.';
          this.submitting = false;
          this.cdr.markForCheck();
        }
      },
      error: err => {
        this.loginError = this.readError(err);
        this.submitting = false;
        this.cdr.markForCheck();
      }
    });
  }

  private fetchProfileAndNavigate(token: string, fallbackRole: string) {
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    this.http
      .get<{ name?: string; email?: string; role?: string }>(`${this.auth.getBaseUrl()}/auth/profile`, {
        headers
      })
      .subscribe({
        next: res => {
          this.auth.setProfile({ name: res.name, email: res.email, role: res.role || fallbackRole });
          this.submitting = false;
          this.router.navigateByUrl('/admin');
        },
        error: () => {
          this.auth.setProfile({ role: fallbackRole });
          this.submitting = false;
          this.router.navigateByUrl('/admin');
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
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed);
  }

  private isPhoneValid(phone: string) {
    return /^\d{10}$/.test(phone.trim());
  }
}
