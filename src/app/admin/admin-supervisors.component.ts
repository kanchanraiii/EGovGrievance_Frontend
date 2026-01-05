import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-admin-supervisors',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="admin-shell">
      <header class="admin-header">
        <div>
          <p class="eyebrow">Admin Console</p>
          <h1>Supervisory Officers</h1>
          <p class="subtitle">Create Supervisory Officers (SO).</p>
        </div>
      </header>

      <section class="card">
        <div class="card-head">
          <h2>Register Supervisory Officer</h2>
          <p class="helper">Creates a Supervisory Officer.</p>
        </div>
        <div class="form-grid">
          <label class="field-label">Full name</label>
          <input class="field" [(ngModel)]="soForm.fullName" />
          <label class="field-label">Email</label>
          <input class="field" type="email" [(ngModel)]="soForm.email" />
          <label class="field-label">Phone</label>
          <input class="field" [(ngModel)]="soForm.phone" />
          <label class="field-label">Password</label>
          <input class="field" type="password" [(ngModel)]="soForm.password" />
        </div>
        <div class="actions">
          <button class="button" type="button" (click)="registerSO()" [disabled]="soSubmitting">
            {{ soSubmitting ? 'Creating...' : 'Create SO' }}
          </button>
        </div>
        <div class="response success" *ngIf="soSuccess">Supervisory Officer created.</div>
        <div class="response error" *ngIf="soError">{{ soError }}</div>
      </section>
    </section>
  `,
  styles: [
    `:host{display:block}
    .admin-shell{display:flex;flex-direction:column;gap:1rem;padding:1.25rem 1.5rem}
    .admin-header{display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap;align-items:flex-start}
    .eyebrow{text-transform:uppercase;letter-spacing:.18em;font-size:.72rem;color:var(--accent-2);margin:0 0 .35rem}
    h1{margin:0 0 .35rem}
    .subtitle{margin:0;color:var(--muted)}
    .card{background:var(--panel);border:1px solid var(--border);border-radius:14px;padding:1rem;display:flex;flex-direction:column;gap:.6rem;box-shadow:0 10px 22px rgba(28,39,56,0.08)}
    .card-head h2{margin:0;font-size:1.05rem}
    .helper{margin:0;color:var(--muted)}
    .form-grid{display:grid;gap:.5rem}
    .field-label{font-size:.75rem;color:var(--muted);text-transform:uppercase;letter-spacing:.12em}
    .field{border:1px solid var(--border);border-radius:10px;padding:.6rem .75rem;font:inherit;background:#fff}
    .actions{display:flex;gap:.5rem;flex-wrap:wrap}
    .button{border:none;border-radius:999px;background:var(--accent);color:#fff;padding:.55rem 1.1rem;font-weight:700;cursor:pointer;box-shadow:0 8px 18px rgba(31,79,147,0.2)}
    .button[disabled]{opacity:.6;cursor:not-allowed;box-shadow:none}
    .response{border-radius:10px;padding:.6rem .75rem;font-size:.85rem}
    .response.success{background:#ecfdf3;color:#166534;border:1px solid #bbf7d0}
    .response.error{background:#fff1f2;color:#9f1239;border:1px solid #fecdd3}
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminSupervisorsComponent {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  soForm = { fullName: '', email: '', phone: '', password: '' };
  soSubmitting = false;
  soSuccess = false;
  soError = '';

  registerSO() {
    this.soError = '';
    this.soSuccess = false;
    if (!this.soForm.fullName.trim() || !this.soForm.email.trim() || !this.soForm.password.trim()) {
      this.soError = 'All fields are required.';
      this.cdr.markForCheck();
      return;
    }
    this.soSubmitting = true;
    this.cdr.markForCheck();
    this.http
      .post(`${this.auth.getBaseUrl()}/auth/supervisory-officer/register`, this.soForm, { headers: this.authHeaders() })
      .subscribe({
        next: () => {
          this.soSuccess = true;
          this.soSubmitting = false;
          this.cdr.markForCheck();
        },
        error: err => {
          this.soError = this.readError(err);
          this.soSubmitting = false;
          this.cdr.markForCheck();
        }
      });
  }

  private authHeaders() {
    const trimmed = this.auth.getToken().trim();
    return trimmed ? new HttpHeaders({ Authorization: `Bearer ${trimmed}`, 'Content-Type': 'application/json' }) : new HttpHeaders({ 'Content-Type': 'application/json' });
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
