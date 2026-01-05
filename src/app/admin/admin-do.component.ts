import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-admin-do',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="admin-shell">
      <header class="admin-header">
        <div>
          <p class="eyebrow">Admin Console</p>
          <h1>Create Department Officer</h1>
          <p class="subtitle">Register a Department Officer (DO) for a specific department.</p>
        </div>
      </header>

      <section class="card">
        <div class="card-head">
          <h2>Department Officer details</h2>
          <p class="helper">All fields are required.</p>
        </div>
        <div class="form-grid two-column">
          <div>
            <label class="field-label">Full name</label>
            <input class="field" [(ngModel)]="form.fullName" />
          </div>
          <div>
            <label class="field-label">Email</label>
            <input class="field" type="email" [(ngModel)]="form.email" />
          </div>
          <div>
            <label class="field-label">Phone</label>
            <input class="field" [(ngModel)]="form.phone" />
          </div>
          <div>
            <label class="field-label">Password</label>
            <input class="field" type="password" [(ngModel)]="form.password" />
          </div>
          <div>
            <label class="field-label">Department ID</label>
            <input class="field" [(ngModel)]="form.departmentId" />
          </div>
        </div>
        <div class="actions">
          <button class="button" type="button" (click)="registerDO()" [disabled]="submitting">
            {{ submitting ? 'Creating...' : 'Create DO' }}
          </button>
        </div>
        <div class="response success" *ngIf="success">Department Officer created.</div>
        <div class="response error" *ngIf="error">{{ error }}</div>
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
    .card-head{display:flex;justify-content:space-between;align-items:flex-start;gap:.75rem}
    .card-head h2{margin:0;font-size:1.05rem}
    .helper{margin:0;color:var(--muted)}
    .form-grid{display:grid;gap:.5rem}
    .form-grid.two-column{grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:.75rem}
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
export class AdminDoComponent {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  form = { fullName: '', email: '', phone: '', password: '', departmentId: '' };
  submitting = false;
  success = false;
  error = '';

  registerDO() {
    this.error = '';
    this.success = false;
    if (!this.form.fullName.trim() || !this.form.email.trim() || !this.form.password.trim() || !this.form.departmentId.trim()) {
      this.error = 'All fields are required.';
      this.cdr.markForCheck();
      return;
    }
    this.submitting = true;
    this.cdr.markForCheck();
    this.http
      .post(`${this.auth.getBaseUrl()}/auth/department-officer/register`, this.form, { headers: this.authHeaders() })
      .subscribe({
        next: () => {
          this.success = true;
          this.submitting = false;
          this.form = { fullName: '', email: '', phone: '', password: '', departmentId: '' };
          this.cdr.markForCheck();
        },
        error: err => {
          this.error = this.readError(err);
          this.submitting = false;
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
