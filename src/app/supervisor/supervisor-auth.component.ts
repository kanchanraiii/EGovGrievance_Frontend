import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-supervisor-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="auth-shell">
      <div class="panel-container">
        <div class="panel">
          <header>
            <p class="eyebrow">Supervisory Officer</p>
            <h1>Login</h1>
            <p class="subtitle">Use your supervisory officer credentials.</p>
          </header>

          <form #loginFormRef="ngForm" (ngSubmit)="login()" class="form">
          <label class="field-label">Email</label>
          <input
            placeholder="yourmail@example.com"
            class="field"
            type="email"
            [(ngModel)]="form.email"
            name="loginEmail"
            #loginEmailModel="ngModel"
            required
            (ngModelChange)="onChange()"
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
            [(ngModel)]="form.password"
            name="loginPassword"
            #loginPasswordModel="ngModel"
            required minlength="8"
            (ngModelChange)="onChange()"
          />
          <div class="field-error" *ngIf="loginPasswordModel?.invalid && loginPasswordModel.dirty">
            <small *ngIf="loginPasswordModel.errors?.['required']">Password is required.</small>
            <small *ngIf="loginPasswordModel.errors?.['minlength']">Enter at least 8 characters.</small>
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
        <h3>Supervisory Portal</h3>
        <p>Monitor and supervise grievance workflows, manage case workers, and oversee resolution processes.</p>
      </div>
      </div>
    </section>
  `,
  styles: [
    `:host{display:block}
    .auth-shell{min-height:calc(100vh - 3rem);display:flex;align-items:center;justify-content:center;padding:2rem}
    .panel-container{display:flex;gap:2rem;align-items:stretch;width:min(900px,100%)}
    .panel{flex:1;background:var(--panel);border:1px solid var(--border);border-radius:18px;padding:2rem;box-shadow:var(--shadow);display:flex;flex-direction:column;gap:1rem;min-width:300px}
    .info-box{flex:0 0 280px;background:linear-gradient(160deg,#74438f 0%,#9a53ad 45%,#d6795f 100%);border:2px solid rgba(255,255,255,0.35);border-radius:18px;padding:1.5rem;display:flex;flex-direction:column;gap:0.8rem;justify-content:center;color:#f8fafc}
    .info-box h3{margin:0;font-size:1.2rem;color:#f8fafc}
    .info-box p{margin:0;color:#f1f5f9;font-size:0.95rem;line-height:1.5}
    .eyebrow{text-transform:uppercase;letter-spacing:.18em;font-size:.7rem;color:var(--accent-2);margin:0}
    h1{margin:.35rem 0;font-size:1.8rem}
    .subtitle{margin:0;color:var(--muted)}
    header{position:relative}
    .form{display:flex;flex-direction:column;gap:.6rem}
    .field-label{font-size:.75rem;color:var(--muted);text-transform:uppercase;letter-spacing:.12em}
    .field{border:1px solid var(--border);border-radius:10px;padding:.6rem .75rem;font:inherit;background:#fff}
    .button{margin-top:.4rem;border:none;border-radius:999px;background:var(--accent);color:#fff;padding:.6rem 1.1rem;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;justify-content:center}
    .button[disabled]{opacity:.6;cursor:not-allowed}
    .field-error{color:#9f1239;font-size:.8rem;margin:0.18rem 0 0}
    .form-actions{display:flex;gap:0.5rem;align-items:center;margin-top:0.4rem}
    .button.secondary{background:transparent;color:var(--muted);border:1px solid var(--border);box-shadow:none}
    .response{margin-top:.4rem;border-radius:10px;padding:.6rem .75rem;font-size:.8rem}
    .response.error{background:#fff1f2;color:#9f1239;border:1px solid #fecdd3}
    .response.warn{background:#fff7ed;color:#b45309;border:1px solid #fed7aa}
    @media (max-width:768px){.panel-container{flex-direction:column}.info-box{flex:1;min-width:auto}}
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupervisorAuthComponent {
  private http = inject(HttpClient);
  private router = inject(Router);
  private auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  form = { email: '', password: '' };
  submitting = false;
  error = '';

  get validation(): string {
    if (!this.form.email.trim()) return 'Email is required.';
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
    this.http.post<{ token?: string; role?: string }>(`${this.auth.getBaseUrl()}/auth/supervisory-officer/login`, this.form).subscribe({
      next: res => {
        if (res?.token) {
          this.auth.setToken(res.token);
          this.auth.setProfile({ role: res.role || 'supervisory_officer' });
          this.submitting = false;
          this.router.navigateByUrl('/supervisor');
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

  private readError(error: unknown) {
    if (error instanceof HttpErrorResponse) {
      if (typeof error.error === 'string') {
        return error.error;
      }
      return error.error?.message || error.message;
    }
    return String(error);
  }
}
