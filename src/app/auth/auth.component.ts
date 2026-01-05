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
  template: `
    <section class="auth-shell">
      <div class="panel">
        <header>
          <p class="eyebrow">Citizen Access</p>
          <h1>Login or Sign Up</h1>
          <p class="subtitle">Use your citizen credentials to access your grievance dashboard.</p>
        </header>

        <div class="toggle">
          <button class="toggle-button" [class.active]="mode === 'login'" (click)="mode = 'login'">
            Login
          </button>
          <button class="toggle-button" [class.active]="mode === 'signup'" (click)="mode = 'signup'">
            Sign Up
          </button>
        </div>

        <form *ngIf="mode === 'login'" (ngSubmit)="loginCitizen()" class="form">
          <label class="field-label">Email</label>
          <input
            class="field"
            type="email"
            [(ngModel)]="loginForm.email"
            name="loginEmail"
            (ngModelChange)="onLoginChange()"
          />
          <label class="field-label">Password</label>
          <input
            class="field"
            type="password"
            [(ngModel)]="loginForm.password"
            name="loginPassword"
            (ngModelChange)="onLoginChange()"
          />
          <div class="response warn" *ngIf="loginValidation">{{ loginValidation }}</div>
          <button class="button" type="submit" [disabled]="!!loginValidation">Login</button>
          <div class="response error" *ngIf="loginError">{{ loginError }}</div>
        </form>

        <form *ngIf="mode === 'signup'" (ngSubmit)="registerCitizen()" class="form">
          <label class="field-label">Full name</label>
          <input
            class="field"
            [(ngModel)]="registerForm.fullName"
            name="fullName"
            (ngModelChange)="onRegisterChange()"
          />
          <label class="field-label">Email</label>
          <input
            class="field"
            type="email"
            [(ngModel)]="registerForm.email"
            name="registerEmail"
            (ngModelChange)="onRegisterChange()"
          />
          <label class="field-label">Phone</label>
          <input
            class="field"
            [(ngModel)]="registerForm.phone"
            name="phone"
            (ngModelChange)="onRegisterChange()"
          />
          <label class="field-label">Password</label>
          <input
            class="field"
            type="password"
            [(ngModel)]="registerForm.password"
            name="registerPassword"
            (ngModelChange)="onRegisterChange()"
          />
          <div class="response warn" *ngIf="registerValidation">{{ registerValidation }}</div>
          <button class="button" type="submit" [disabled]="!!registerValidation">Create Account</button>
          <div class="response error" *ngIf="registerError">{{ registerError }}</div>
          <div class="response success" *ngIf="registerResult">
            Account created. You can log in now.
          </div>
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
    .toggle{display:flex;background:#f3f5fb;border-radius:999px;padding:.35rem;gap:.35rem}
    .toggle-button{flex:1;border:none;border-radius:999px;padding:.5rem 1rem;background:transparent;cursor:pointer;font-weight:600;color:var(--muted)}
    .toggle-button.active{background:#fff;color:var(--accent);box-shadow:0 6px 14px rgba(31,79,147,0.15)}
    .form{display:flex;flex-direction:column;gap:.6rem}
    .field-label{font-size:.75rem;color:var(--muted);text-transform:uppercase;letter-spacing:.12em}
    .field{border:1px solid var(--border);border-radius:10px;padding:.6rem .75rem;font:inherit;background:#fff}
    .button{margin-top:.4rem;border:none;border-radius:999px;background:var(--accent);color:#fff;padding:.6rem 1.1rem;font-weight:600;cursor:pointer}
    .response{margin-top:.4rem;border-radius:10px;padding:.6rem .75rem;font-size:.8rem}
    .response.error{background:#fff1f2;color:#9f1239;border:1px solid #fecdd3}
    .response.success{background:#ecfdf3;color:#166534;border:1px solid #bbf7d0}
    .response.warn{background:#fff7ed;color:#b45309;border:1px solid #fed7aa}
    `,
  ],
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
