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
  template: `
    <section class="auth-shell">
      <div class="panel">
        <header>
          <p class="eyebrow">Admin Access</p>
          <h1>Administrator Login</h1>
          <p class="subtitle">Authenticate to manage departments and staff users.</p>
        </header>

        <form #loginFormRef="ngForm" (ngSubmit)="loginAdmin()" class="form">
          <label class="field-label">Email</label>
          <input
            placeholder="yourmail@example.com"
            class="field"
            type="email"
            [(ngModel)]="loginForm.email"
            name="loginEmail"
            #loginEmailModel="ngModel"
            required
            (ngModelChange)="onLoginChange()"
          />
          <div class="field-error" *ngIf="loginEmailModel?.invalid && loginEmailModel.dirty">
            <small *ngIf="loginEmailModel.errors?.['required']">Email is required.</small>
            <small *ngIf="loginEmailModel.errors?.['email']">Enter a valid email.</small>
          </div>

          <label class="field-label">Password</label>
          <input
            placeholder="Enter your password"
            class="field"
            type="password"
            [(ngModel)]="loginForm.password"
            name="loginPassword"
            #loginPasswordModel="ngModel"
            required minlength="8"
            (ngModelChange)="onLoginChange()"
          />
          <div class="field-error" *ngIf="loginPasswordModel?.invalid && loginPasswordModel.dirty">
            <small *ngIf="loginPasswordModel.errors?.['required']">Password is required.</small>
            <small *ngIf="loginPasswordModel.errors?.['minlength']">Enter at least 8 characters.</small>
          </div>

          <div class="response warn" *ngIf="loginValidation">{{ loginValidation }}</div>
          <div class="form-actions">
            <button class="button" type="submit" [disabled]="!!loginValidation || submitting">
              {{ submitting ? 'Signing in...' : 'Login' }}
            </button>
            <button class="button secondary" type="button" (click)="resetLoginForm(loginFormRef)">Reset</button>
          </div>
          <div class="response error" *ngIf="loginError">{{ loginError }}</div>
        </form>
      </div>
    </section>
  `,
  styles: [
    `:host{display:block}
    .auth-shell{min-height:calc(100vh - 3rem);display:flex;align-items:center;justify-content:center;padding:2rem}
    .panel{width:min(520px,100%);background:var(--panel);border:1px solid var(--border);border-radius:18px;padding:2rem;box-shadow:var(--shadow);display:flex;flex-direction:column;gap:1rem}
    .eyebrow{text-transform:uppercase;letter-spacing:.18em;font-size:.7rem;color:var(--accent-2);margin:0}
    h1{margin:.35rem 0;font-size:1.9rem}
    .subtitle{margin:0;color:var(--muted)}
    .form{display:flex;flex-direction:column;gap:.6rem}
    .field-label{font-size:.75rem;color:var(--muted);text-transform:uppercase;letter-spacing:.12em}
    .field{border:1px solid var(--border);border-radius:10px;padding:.6rem .75rem;font:inherit;background:#fff}
    .button{margin-top:.4rem;border:none;border-radius:999px;background:var(--accent);color:#fff;padding:.6rem 1.1rem;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:.4rem}
    .form-actions{display:flex;gap:0.5rem;align-items:center;margin-top:0.4rem}
    .button.secondary{background:transparent;color:var(--muted);border:1px solid var(--border);box-shadow:none}
    .button[disabled]{opacity:.6;cursor:not-allowed}
    .field-error{color:#9f1239;font-size:.8rem;margin:0.18rem 0 0}
    .response{margin-top:.4rem;border-radius:10px;padding:.6rem .75rem;font-size:.8rem}
    .response.error{background:#fff1f2;color:#9f1239;border:1px solid #fecdd3}
    .response.success{background:#ecfdf3;color:#166534;border:1px solid #bbf7d0}
    .response.warn{background:#fff7ed;color:#b45309;border:1px solid #fed7aa}
    @media (max-width:720px){
      .auth-shell{padding:1.25rem}
      .panel{padding:1.5rem}
    }
    `,
  ],
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
