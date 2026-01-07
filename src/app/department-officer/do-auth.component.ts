import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-do-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="auth-shell">
      <div class="panel">
        <header>
          <p class="eyebrow">Department Officer</p>
          <h1>Login</h1>
          <p class="subtitle">Sign in to manage grievances and case workers.</p>
        </header>

        <form #loginFormRef="ngForm" (ngSubmit)="login()" class="form">
          <label class="field-label">Email</label>
          <input
            placeholder="yourmail@example.com"
            class="field"
            type="email"
            [(ngModel)]="form.email"
            name="email"
            #emailModel="ngModel"
            required
            (ngModelChange)="onChange()"
          />
          <div class="field-error" *ngIf="emailModel?.invalid && emailModel.dirty">
            <small *ngIf="emailModel.errors?.['required']">Email is required.</small>
            <small *ngIf="emailModel.errors?.['email']">Enter a valid email.</small>
          </div>

          <label class="field-label">Password</label>
          <input
            placeholder="Enter your password"
            class="field"
            type="password"
            [(ngModel)]="form.password"
            name="password"
            #passwordModel="ngModel"
            required minlength="8"
            (ngModelChange)="onChange()"
          />
          <div class="field-error" *ngIf="passwordModel?.invalid && passwordModel.dirty">
            <small *ngIf="passwordModel.errors?.['required']">Password is required.</small>
            <small *ngIf="passwordModel.errors?.['minlength']">Enter at least 8 characters.</small>
          </div>

          <div class="response warn" *ngIf="validation">{{ validation }}</div>
          <div class="form-actions">
            <button class="button" type="submit" [disabled]="!!validation || submitting">{{ submitting ? 'Signing in...' : 'Login' }}</button>
            <button class="button secondary" type="button" (click)="resetLoginForm(loginFormRef)">Reset</button>
          </div>

          <div class="response error" *ngIf="error">{{ error }}</div>
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
    .form-actions{display:flex;gap:0.5rem;align-items:center;margin-top:0.4rem}
    .button{margin-top:.4rem;border:none;border-radius:999px;background:var(--accent);color:#fff;padding:.6rem 1.1rem;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:.4rem}
    .button.secondary{background:transparent;color:var(--muted);border:1px solid var(--border);box-shadow:none}
    .button[disabled]{opacity:.6;cursor:not-allowed}
    .field-error{color:#9f1239;font-size:.8rem;margin:0.18rem 0 0}
    .response{margin-top:.2rem;border-radius:10px;padding:.6rem .75rem;font-size:.8rem}
    .response.error{background:#fff1f2;color:#9f1239;border:1px solid #fecdd3}
    .response.warn{background:#fff7ed;color:#b45309;border:1px solid #fed7aa}
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DoAuthComponent {
  private http = inject(HttpClient);
  private router = inject(Router);
  private auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  form = { email: '', password: '' };
  submitting = false;
  error = '';

  get validation(): string {
    if (!this.form.email.trim()) return 'Email is required.';
    if (!this.isEmailValid(this.form.email)) return 'Enter a valid email.';
    if (!this.form.password.trim()) return 'Password is required.';
    return '';
  }

  onChange() {
    this.error = '';
  }

  resetLoginForm(form?: NgForm) {
    this.form = { email: '', password: '' };
    this.error = '';
    if (form) form.resetForm();
    this.cdr.markForCheck();
  }

  login() {
    this.error = '';
    if (this.validation) {
      this.cdr.markForCheck();
      return;
    }
    this.submitting = true;
    this.cdr.markForCheck();
    this.http
      .post<{ token?: string; role?: string }>(`${this.auth.getBaseUrl()}/auth/department-officer/login`, this.form)
      .subscribe({
        next: res => {
          if (res?.token) {
            this.auth.setToken(res.token);
            this.fetchProfileAndNavigate(res.token, res.role || 'department_officer');
          } else {
            this.error = 'Login succeeded but token was missing.';
            this.submitting = false;
            this.cdr.markForCheck();
          }
        },
        error: err => {
          this.error = this.readError(err);
          this.submitting = false;
          this.cdr.markForCheck();
        }
      });
  }

  private fetchProfileAndNavigate(token: string, fallbackRole?: string) {
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    this.http
      .get<{ name?: string; email?: string; role?: string }>(`${this.auth.getBaseUrl()}/auth/profile`, { headers })
      .subscribe({
        next: res => {
          this.auth.setProfile({ name: res.name, email: res.email, role: res.role || fallbackRole || 'department_officer' });
          this.submitting = false;
          this.router.navigateByUrl('/do');
        },
        error: () => {
          this.auth.setProfile({ role: fallbackRole || 'department_officer' });
          this.submitting = false;
          this.router.navigateByUrl('/do');
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
}
