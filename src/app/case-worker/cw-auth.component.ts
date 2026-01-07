import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-cw-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="auth-shell">
      <div class="panel-container">
        <div class="panel">
          <header>
            <p class="eyebrow">Case Worker</p>
            <h1>Login</h1>
            <p class="subtitle">Sign in to update assigned grievances.</p>
          </header>

          <form #loginFormRef="ngForm" (ngSubmit)="login()" class="form">
          <label class="field-label">Email</label>
          <input placeholder="yourmail@example.com" class="field" type="email" [(ngModel)]="form.email" name="email" #emailModel="ngModel" required (ngModelChange)="onChange()" />
          <div class="field-error" *ngIf="emailModel?.invalid && emailModel.dirty">
            <small *ngIf="emailModel.errors?.['required']">Email is required.</small>
            <small *ngIf="emailModel.errors?.['email']">Enter a valid email.</small>
          </div>

          <label class="field-label">Password</label>
          <input placeholder="Enter your password" class="field" type="password" [(ngModel)]="form.password" name="password" #passwordModel="ngModel" required minlength="8" (ngModelChange)="onChange()" />
          <div class="field-error" *ngIf="passwordModel?.invalid && passwordModel.dirty">
            <small *ngIf="passwordModel.errors?.['required']">Password is required.</small>
            <small *ngIf="passwordModel.errors?.['minlength']">Enter at least 8 characters.</small>
          </div>

          <div class="response warn" *ngIf="validation">{{ validation }}</div>
          <div class="form-actions">
            <button class="button" type="submit" [disabled]="!!validation || submitting">
              {{ submitting ? 'Signing in...' : 'Login' }}
            </button>
            <button class="button secondary" type="button" (click)="resetLoginForm(loginFormRef)">Reset</button>
          </div>
          <div class="response error" *ngIf="error">{{ error }}</div>
        </form>
      </div>
      <div class="info-box">
        <h3>Case Worker Portal</h3>
        <p>Access your assigned grievances and provide regular updates on the status of resolutions.</p>
      </div>
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
    header{position:relative}
    .form{display:flex;flex-direction:column;gap:.6rem}
    .field-label{font-size:.75rem;color:var(--muted);text-transform:uppercase;letter-spacing:.12em}
    .field{border:1px solid var(--border);border-radius:10px;padding:.6rem .75rem;font:inherit;background:#fff}
    .button{margin-top:.4rem;border:none;border-radius:999px;background:var(--accent);color:#fff;padding:.6rem 1.1rem;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:.4rem}
    .form-actions{display:flex;gap:0.5rem;align-items:center;margin-top:0.4rem}
    .button.secondary{background:transparent;color:var(--muted);border:1px solid var(--border);box-shadow:none}
    .button[disabled]{opacity:.6;cursor:not-allowed}
    .response{margin-top:.2rem;border-radius:10px;padding:.6rem .75rem;font-size:.8rem}
    .response.error{background:#fff1f2;color:#9f1239;border:1px solid #fecdd3}
    .response.warn{background:#fff7ed;color:#b45309;border:1px solid #fed7aa}
    .panel-container{display:flex;gap:2rem;align-items:stretch;width:min(900px,100%)}
    .panel{flex:1;background:var(--panel);border:1px solid var(--border);border-radius:18px;padding:2rem;box-shadow:var(--shadow);display:flex;flex-direction:column;gap:1rem;min-width:300px}
    .info-box{flex:0 0 280px;background:linear-gradient(160deg,#74438f 0%,#9a53ad 45%,#d6795f 100%);border:2px solid rgba(255,255,255,0.35);border-radius:18px;padding:1.5rem;display:flex;flex-direction:column;gap:0.8rem;justify-content:center;color:#f8fafc}
    .info-box h3{margin:0;font-size:1.2rem;color:#f8fafc}
    .info-box p{margin:0;color:#f1f5f9;font-size:0.95rem;line-height:1.5}
    @media (max-width:768px){.panel-container{flex-direction:column}.info-box{flex:1;min-width:auto}}
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CwAuthComponent {
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

  goBackToSignup() {
    this.router.navigateByUrl('/');
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
      .post<{ token?: string; role?: string }>(`${this.auth.getBaseUrl()}/auth/case-worker/login`, this.form)
      .subscribe({
        next: res => {
          if (res?.token) {
            this.auth.setToken(res.token);
            this.fetchProfileAndNavigate(res.token, res.role || 'case_worker');
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
          this.auth.setProfile({ name: res.name, email: res.email, role: res.role || fallbackRole || 'case_worker' });
          this.submitting = false;
          this.router.navigateByUrl('/cw');
        },
        error: () => {
          this.auth.setProfile({ role: fallbackRole || 'case_worker' });
          this.submitting = false;
          this.router.navigateByUrl('/cw');
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
