import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-supervisor-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="admin-shell">
      <header class="admin-header">
        <div>
          <p class="eyebrow">Supervisory Officer</p>
          <h1>Grievance Views</h1>
          <p class="subtitle">View grievances for all departments, by department, or escalated.</p>
        </div>
      </header>

      <div class="grid">
        <section class="card">
          <div class="card-head">
            <h2>All grievances</h2>
            <p class="helper">Showing every grievance currently in the system.</p>
          </div>
          <div class="actions">
            <button class="button ghost" type="button" (click)="viewAll()" [disabled]="grievancesLoading">Refresh</button>
          </div>
          <div class="response error" *ngIf="grievancesError">{{ grievancesError }}</div>
          <div class="card-grid" *ngIf="!grievancesError && grievancesList.length">
            <article class="grievance-card" *ngFor="let g of grievancesList">
              <header class="grievance-head">
                <div>
                  <div class="id">#{{ g.id }}</div>
                  <div class="muted">Dept: {{ g.departmentId || '—' }}</div>
                </div>
                <span class="status" [class.escalated]="g.escalated" [class.submitted]="g.status === 'SUBMITTED'">{{ g.status || 'Unknown' }}</span>
              </header>
              <p class="description">{{ g.description || 'No description provided.' }}</p>
              <div class="meta">
                <span *ngIf="g.categoryCode">Category: {{ g.categoryCode }}</span>
                <span *ngIf="g.subCategoryCode">Sub-category: {{ g.subCategoryCode }}</span>
                <span *ngIf="g.assignedTo">Assigned to: {{ g.assignedTo }}</span>
              </div>
            </article>
          </div>
          <div class="response warn" *ngIf="!grievancesError && !grievancesLoading && !grievancesList.length">No grievances yet.</div>
        </section>

        <section class="card">
          <div class="card-head">
            <h2>By department</h2>
            <p class="helper">Filter grievances for a specific department.</p>
          </div>
          <div class="form-grid two-column">
            <div>
              <label class="field-label">Department ID</label>
              <input class="field" [(ngModel)]="deptId" />
            </div>
          </div>
          <div class="actions">
            <button class="button ghost" type="button" (click)="viewDept()" [disabled]="deptLoading">Load department</button>
          </div>
          <div class="response error" *ngIf="deptError">{{ deptError }}</div>
          <div class="card-grid" *ngIf="!deptError && deptList.length">
            <article class="grievance-card" *ngFor="let g of deptList">
              <header class="grievance-head">
                <div>
                  <div class="id">#{{ g.id }}</div>
                  <div class="muted">Dept: {{ g.departmentId || '—' }}</div>
                </div>
                <span class="status" [class.escalated]="g.escalated" [class.submitted]="g.status === 'SUBMITTED'">{{ g.status || 'Unknown' }}</span>
              </header>
              <p class="description">{{ g.description || 'No description provided.' }}</p>
              <div class="meta">
                <span *ngIf="g.categoryCode">Category: {{ g.categoryCode }}</span>
                <span *ngIf="g.subCategoryCode">Sub-category: {{ g.subCategoryCode }}</span>
                <span *ngIf="g.assignedTo">Assigned to: {{ g.assignedTo }}</span>
              </div>
            </article>
          </div>
          <div class="response warn" *ngIf="!deptError && !deptLoading && !deptList.length">No grievances for this department.</div>
        </section>
      </div>

      <section class="card">
        <div class="card-head">
          <h2>Escalated grievances</h2>
          <p class="helper">Grievances that have been escalated.</p>
        </div>
        <div class="actions">
          <button class="button ghost" type="button" (click)="viewEscalated()" [disabled]="escalatedLoading">Refresh</button>
        </div>
        <div class="response error" *ngIf="escalatedError">{{ escalatedError }}</div>
        <div class="card-grid" *ngIf="!escalatedError && escalatedList.length">
          <article class="grievance-card escalated" *ngFor="let g of escalatedList">
            <header class="grievance-head">
              <div>
                <div class="id">#{{ g.id }}</div>
                <div class="muted">Dept: {{ g.departmentId || '—' }}</div>
              </div>
              <span class="status escalated">ESCALATED</span>
            </header>
            <p class="description">{{ g.description || 'No description provided.' }}</p>
            <div class="meta">
              <span *ngIf="g.assignedTo">Assigned to: {{ g.assignedTo }}</span>
              <span *ngIf="g.assignedBy">Assigned by: {{ g.assignedBy }}</span>
            </div>
          </article>
        </div>
        <div class="response warn" *ngIf="!escalatedError && !escalatedLoading && !escalatedList.length">No escalated grievances.</div>
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
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:1rem}
    .card{background:var(--panel);border:1px solid var(--border);border-radius:14px;padding:1rem;display:flex;flex-direction:column;gap:.6rem;box-shadow:0 10px 22px rgba(28,39,56,0.08)}
    .card-head h2{margin:0;font-size:1.05rem}
    .helper{margin:0;color:var(--muted)}
    .form-grid{display:grid;gap:.5rem}
    .form-grid.two-column{grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:.6rem}
    .field-label{font-size:.75rem;color:var(--muted);text-transform:uppercase;letter-spacing:.12em}
    .field{border:1px solid var(--border);border-radius:10px;padding:.6rem .75rem;font:inherit;background:#fff}
    .actions{display:flex;gap:.5rem;flex-wrap:wrap}
    .button{border:none;border-radius:999px;background:var(--accent);color:#fff;padding:.55rem 1.1rem;font-weight:700;cursor:pointer;box-shadow:0 8px 18px rgba(31,79,147,0.2)}
    .button.ghost{background:#eef2fb;color:var(--accent);box-shadow:none;border:1px solid rgba(31,79,147,0.2)}
    .button[disabled]{opacity:.6;cursor:not-allowed;box-shadow:none}
    .response{border-radius:10px;padding:.6rem .75rem;font-size:.85rem}
    .response.success{background:#ecfdf3;color:#166534;border:1px solid #bbf7d0}
    .response.error{background:#fff1f2;color:#9f1239;border:1px solid #fecdd3}
    .response.warn{background:#fff7ed;color:#b45309;border:1px solid #fed7aa}
    .card-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:.65rem;margin-top:.5rem}
    .grievance-card{border:1px solid var(--border);border-radius:12px;padding:.75rem;background:#fff;display:flex;flex-direction:column;gap:.4rem;box-shadow:0 10px 20px rgba(16,24,40,0.06)}
    .grievance-card.escalated{border-color:#fca5a5;background:#fff1f2}
    .grievance-head{display:flex;justify-content:space-between;align-items:flex-start;gap:.5rem}
    .id{font-weight:700}
    .muted{color:var(--muted);font-size:.9rem}
    .status{border-radius:999px;padding:.25rem .6rem;font-size:.8rem;font-weight:700;background:#eef2fb;color:#1f4f93;border:1px solid rgba(31,79,147,0.2)}
    .status.submitted{background:#e0f2fe;color:#075985;border-color:#bae6fd}
    .status.escalated{background:#fee2e2;color:#b91c1c;border:1px solid #fecdd3}
    .description{margin:0;font-size:.95rem}
    .meta{display:flex;flex-wrap:wrap;gap:.45rem;font-size:.85rem;color:var(--muted)}
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupervisorDashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  grievancesList: any[] = [];
  grievancesLoading = false;
  grievancesError = '';

  deptId = '';
  deptList: any[] = [];
  deptLoading = false;
  deptError = '';

  escalatedList: any[] = [];
  escalatedLoading = false;
  escalatedError = '';

  ngOnInit(): void {
    this.viewAll();
    this.viewEscalated();
  }

  viewAll() {
    this.grievancesError = '';
    this.grievancesList = [];
    this.grievancesLoading = true;
    this.http
      .get(`${this.auth.getBaseUrl()}/grievance-service/api/grievances/getAll`, { headers: this.soHeaders() })
      .subscribe({
        next: res => {
          this.grievancesList = this.normalizeArray(res);
          this.grievancesLoading = false;
          this.cdr.markForCheck();
        },
        error: err => {
          this.grievancesError = this.readError(err);
          this.grievancesLoading = false;
          this.cdr.markForCheck();
        }
      });
  }

  viewDept() {
    if (!this.deptId.trim()) {
      this.deptError = 'Department ID is required.';
      this.cdr.markForCheck();
      return;
    }
    this.deptError = '';
    this.deptList = [];
    this.deptLoading = true;
    this.http
      .get(`${this.auth.getBaseUrl()}/grievance-service/api/grievances/department/${this.deptId.trim()}`, { headers: this.soHeaders() })
      .subscribe({
        next: res => {
          this.deptList = this.normalizeArray(res);
          this.deptLoading = false;
          this.cdr.markForCheck();
        },
        error: err => {
          this.deptError = this.readError(err);
          this.deptLoading = false;
          this.cdr.markForCheck();
        }
      });
  }

  viewEscalated() {
    this.escalatedError = '';
    this.escalatedList = [];
    this.escalatedLoading = true;
    // This endpoint lives at /grievance/escalated (no /api prefix) and may return empty body.
    this.http
      .get(`/grievance/escalated`, { headers: this.soHeaders(), responseType: 'text' })
      .subscribe({
        next: res => {
          const parsed = this.safeParse(res);
          this.escalatedList = this.normalizeArray(parsed);
          this.escalatedLoading = false;
          this.cdr.markForCheck();
        },
        error: err => {
          this.escalatedError = this.readError(err);
          this.escalatedLoading = false;
          this.cdr.markForCheck();
        }
      });
  }

  private soHeaders() {
    const trimmed = this.auth.getToken().trim();
    return trimmed ? new HttpHeaders({ Authorization: `Bearer ${trimmed}` }) : new HttpHeaders();
  }

  private safeParse(raw: string) {
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  private normalizeArray(res: any): any[] {
    if (!res) return [];
    const arr = Array.isArray(res) ? res : [res];
    return arr.map(item => {
      const id = item?.id || item?.grievanceId || item?._id || '—';
      return {
        id,
        description: item?.description,
        departmentId: item?.departmentId,
        status: item?.status,
        categoryCode: item?.categoryCode,
        subCategoryCode: item?.subCategoryCode,
        escalated: item?.escalated || item?.status === 'ESCALATED',
        assignedTo: item?.assignedTo || item?.assignedWokerId,
        assignedBy: item?.assignedBy
      };
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
