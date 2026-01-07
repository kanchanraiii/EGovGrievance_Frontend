import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth/auth.service';

type Department = { id: string; name: string; state?: string; level?: string };
type Feedback = { grievanceId?: string; comments?: string; score?: number };

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
          <div class="filters">
            <div>
              <label class="field-label">Status filter</label>
              <select class="field" [(ngModel)]="statusFilter">
                <option *ngFor="let s of statusOptions" [value]="s">{{ s }}</option>
              </select>
            </div>
            <button class="button ghost" type="button" (click)="viewAll()" [disabled]="grievancesLoading">Refresh</button>
          </div>
          <div class="actions">
            <small class="muted">Filtering {{ filteredAll.length }} of {{ grievancesList.length }} results</small>
          </div>
          <div class="response error" *ngIf="grievancesError">{{ grievancesError }}</div>
          <div class="loading" *ngIf="grievancesLoading">
            <span class="spinner" aria-hidden="true"></span>
            <span>Loading grievances...</span>
          </div>
          <ul class="grievance-list" *ngIf="!grievancesError && paginatedAll.length">
            <li *ngFor="let g of paginatedAll">
              <div class="row">
                <div>
                  <div class="id">#{{ g.id }}</div>
                  <div class="muted">Dept: {{ g.departmentId || '—' }}</div>
                </div>
                <div class="chips">
                  <span class="status" [class]="statusClass(g.status)">{{ formatStatus(g.status) }}</span>
                  <span *ngIf="g.assignedTo" class="chip">Assigned to: {{ g.assignedTo }}</span>
                  <button class="link-button" type="button" (click)="openGrievance(g)">Open details</button>
                </div>
              </div>
              <p class="description">{{ g.description || 'No description provided.' }}</p>
              <div class="meta">
                <span *ngIf="g.categoryCode">Category: {{ g.categoryCode }}</span>
                <span *ngIf="g.subCategoryCode">Sub-category: {{ g.subCategoryCode }}</span>
              </div>
              <div class="feedback" *ngIf="feedbackById[g.id]?.comments">Feedback: {{ feedbackById[g.id]?.comments }}</div>
            </li>
          </ul>
          <div class="pagination" *ngIf="allPageCount > 1">
            <button class="button ghost" type="button" (click)="changePage('all', -1)" [disabled]="allPage === 1">Prev</button>
            <span class="muted">Page {{ allPage }} of {{ allPageCount }}</span>
            <button class="button ghost" type="button" (click)="changePage('all', 1)" [disabled]="allPage === allPageCount">Next</button>
          </div>
          <div class="response warn" *ngIf="!grievancesError && !grievancesLoading && !filteredAll.length">No grievances yet for this filter.</div>
        </section>

        <section class="card">
          <div class="card-head">
          <h2>By department</h2>
          <p class="helper">Filter grievances for a specific department.</p>
        </div>
        <div class="form-grid two-column">
          <div>
            <label class="field-label">Department ID</label>
            <select class="field" [(ngModel)]="deptId" [disabled]="departmentsLoading">
              <option value="" disabled>Select a department</option>
              <option *ngFor="let d of departments" [value]="d.id">
                {{ d.name }}{{ d.state ? ' (' + d.state + ')' : '' }}
              </option>
            </select>
            <div class="inline-help" *ngIf="departmentsLoading">Loading departments...</div>
            <div class="inline-help warn" *ngIf="!departmentsLoading && !departments.length">No departments available.</div>
            <div class="inline-help error" *ngIf="departmentsError">{{ departmentsError }}</div>
          </div>
        </div>
          <div class="actions">
            <button class="button ghost" type="button" (click)="viewDept()" [disabled]="deptLoading || !deptId">
              {{ deptLoading ? 'Loading...' : 'Load department' }}
            </button>
          </div>
        <div class="response error" *ngIf="deptError">{{ deptError }}</div>
        <div class="loading" *ngIf="deptLoading">
          <span class="spinner" aria-hidden="true"></span>
          <span>Loading department grievances...</span>
        </div>
        <ul class="grievance-list" *ngIf="!deptError && paginatedDept.length">
          <li *ngFor="let g of paginatedDept">
            <div class="row">
              <div>
                  <div class="id">#{{ g.id }}</div>
                  <div class="muted">Dept: {{ g.departmentId || '—' }}</div>
                </div>
                <div class="chips">
                  <span class="status" [class]="statusClass(g.status)">{{ formatStatus(g.status) }}</span>
                  <span *ngIf="g.assignedTo" class="chip">Assigned to: {{ g.assignedTo }}</span>
                  <button class="link-button" type="button" (click)="openGrievance(g)">Open details</button>
                </div>
              </div>
              <p class="description">{{ g.description || 'No description provided.' }}</p>
              <div class="meta">
                <span *ngIf="g.categoryCode">Category: {{ g.categoryCode }}</span>
                <span *ngIf="g.subCategoryCode">Sub-category: {{ g.subCategoryCode }}</span>
              </div>
              <div class="feedback" *ngIf="feedbackById[g.id]?.comments">Feedback: {{ feedbackById[g.id]?.comments }}</div>
            </li>
          </ul>
          <div class="pagination" *ngIf="deptPageCount > 1">
            <button class="button ghost" type="button" (click)="changePage('dept', -1)" [disabled]="deptPage === 1">Prev</button>
            <span class="muted">Page {{ deptPage }} of {{ deptPageCount }}</span>
            <button class="button ghost" type="button" (click)="changePage('dept', 1)" [disabled]="deptPage === deptPageCount">Next</button>
          </div>
          <div class="response warn" *ngIf="!deptError && !deptLoading && !filteredDept.length">No grievances for this department and filter.</div>
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
        <ul class="grievance-list escalated-list" *ngIf="!escalatedError && paginatedEscalated.length">
          <li *ngFor="let g of paginatedEscalated">
            <div class="row">
              <div>
                <div class="id">#{{ g.id }}</div>
                <div class="muted">Dept: {{ g.departmentId || '—' }}</div>
              </div>
              <div class="chips">
                <span class="status escalated">ESCALATED</span>
                <span *ngIf="g.assignedTo" class="chip">Assigned to: {{ g.assignedTo }}</span>
                <button class="link-button" type="button" (click)="openGrievance(g)">Open details</button>
              </div>
            </div>
            <p class="description">{{ g.description || 'No description provided.' }}</p>
            <div class="meta">
              <span *ngIf="g.assignedBy">Assigned by: {{ g.assignedBy }}</span>
            </div>
          </li>
        </ul>
        <div class="pagination" *ngIf="escalatedPageCount > 1">
          <button class="button ghost" type="button" (click)="changePage('escalated', -1)" [disabled]="escalatedPage === 1">Prev</button>
          <span class="muted">Page {{ escalatedPage }} of {{ escalatedPageCount }}</span>
          <button class="button ghost" type="button" (click)="changePage('escalated', 1)" [disabled]="escalatedPage === escalatedPageCount">Next</button>
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
    .filters{display:flex;gap:.6rem;flex-wrap:wrap;align-items:flex-end}
    .filters .field{min-width:180px}
    .form-grid{display:grid;gap:.5rem}
    .form-grid.two-column{grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:.6rem}
    .field-label{font-size:.75rem;color:var(--muted);text-transform:uppercase;letter-spacing:.12em}
    .field{border:1px solid var(--border);border-radius:10px;padding:.6rem .75rem;font:inherit;background:#fff}
    .inline-help{margin:0;color:var(--muted);font-size:.85rem}
    .inline-help.warn{color:#b45309}
    .inline-help.error{color:#b91c1c}
    .actions{display:flex;gap:.5rem;flex-wrap:wrap}
    .button{border:none;border-radius:999px;background:var(--accent);color:#fff;padding:.55rem 1.1rem;font-weight:700;cursor:pointer;box-shadow:0 8px 18px rgba(31,79,147,0.2)}
    .button.ghost{background:#eef2fb;color:var(--accent);box-shadow:none;border:1px solid rgba(31,79,147,0.2)}
    .button[disabled]{opacity:.6;cursor:not-allowed;box-shadow:none}
    .response{border-radius:10px;padding:.6rem .75rem;font-size:.85rem}
    .response.success{background:#ecfdf3;color:#166534;border:1px solid #bbf7d0}
    .response.error{background:#fff1f2;color:#9f1239;border:1px solid #fecdd3}
    .response.warn{background:#fff7ed;color:#b45309;border:1px solid #fed7aa}
    .grievance-list{list-style:none;padding:0;margin:.25rem 0 0;display:flex;flex-direction:column;gap:.7rem}
    .grievance-list li{border:1px solid var(--border);border-radius:12px;padding:.75rem;background:#fff;box-shadow:0 10px 20px rgba(16,24,40,0.06);display:flex;flex-direction:column;gap:.35rem}
    .grievance-list.escalated-list li{border-color:#fca5a5;background:#fff1f2}
    .row{display:flex;justify-content:space-between;gap:.6rem;align-items:flex-start}
    .id{font-weight:700}
    .muted{color:var(--muted);font-size:.9rem}
    .status{border-radius:999px;padding:.25rem .6rem;font-size:.8rem;font-weight:700;background:#eef2fb;color:#1f4f93;border:1px solid rgba(31,79,147,0.2)}
    .status.submitted{background:#e0f2fe;color:#075985;border-color:#bae6fd}
    .status.escalated{background:#fee2e2;color:#b91c1c;border:1px solid #fecdd3}
    .chips{display:flex;gap:.4rem;flex-wrap:wrap;align-items:center}
    .chip{border:1px solid var(--border);border-radius:999px;padding:.2rem .6rem;font-size:.8rem;color:var(--muted);background:#f8fafc}
    .feedback{font-size:.9rem;color:#0f172a;background:#f1f5f9;border-radius:10px;padding:.5rem .6rem;border:1px solid #e2e8f0}
    .pagination{display:flex;gap:.6rem;align-items:center;margin-top:.4rem;flex-wrap:wrap}
    .link-button{background:none;border:none;color:var(--accent);font-weight:700;cursor:pointer;padding:0}
    .loading{display:flex;align-items:center;gap:.45rem;color:var(--muted);font-size:.9rem}
    .spinner{width:18px;height:18px;border:3px solid #e5e7eb;border-top-color:var(--accent);border-radius:50%;display:inline-block;animation:spin 1s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
    .description{margin:0;font-size:.95rem}
    .meta{display:flex;flex-wrap:wrap;gap:.45rem;font-size:.85rem;color:var(--muted)}
    @media (max-width:768px){
      .admin-shell{padding:1rem}
      .grid{grid-template-columns:1fr}
      .actions{justify-content:flex-start}
      .card{padding:.9rem}
      h1{font-size:1.6rem}
    }
    @media (max-width:560px){
      .form-grid.two-column{grid-template-columns:1fr}
      .card-grid{grid-template-columns:1fr}
    }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupervisorDashboardComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  grievancesList: any[] = [];
  grievancesLoading = false;
  grievancesError = '';
  statusFilter = 'ALL';
  statusOptions = ['ALL', 'SUBMITTED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'ESCALATED'];
  pageSize = 5;
  allPage = 1;
  deptPage = 1;
  escalatedPage = 1;

  departments: Department[] = [];
  departmentsLoading = false;
  departmentsError = '';
  deptId = '';
  deptList: any[] = [];
  deptLoading = false;
  deptError = '';
  feedbackById: Record<string, Feedback> = {};

  escalatedList: any[] = [];
  escalatedLoading = false;
  escalatedError = '';
  autoRefresh: any;
  readonly REFRESH_MS = 15000;

  ngOnInit(): void {
    this.fetchDepartments();
    this.viewAll();
    this.viewEscalated();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();
  }

  get filteredAll() {
    return this.applyStatusFilter(this.grievancesList);
  }

  get filteredDept() {
    return this.applyStatusFilter(this.deptList);
  }

  get paginatedAll() {
    return this.paginate(this.filteredAll, this.allPage);
  }

  get paginatedDept() {
    return this.paginate(this.filteredDept, this.deptPage);
  }

  get paginatedEscalated() {
    return this.paginate(this.escalatedList, this.escalatedPage);
  }

  get allPageCount() {
    return this.pageCount(this.filteredAll);
  }

  get deptPageCount() {
    return this.pageCount(this.filteredDept);
  }

  get escalatedPageCount() {
    return this.pageCount(this.escalatedList);
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
          this.loadFeedbackForResolved(this.grievancesList);
          this.allPage = 1;
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
          this.loadFeedbackForResolved(this.deptList);
          this.deptPage = 1;
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
    this.http
      .get(`${this.auth.getBaseUrl()}/grievance-service/api/grievances/escalated`, { headers: this.soHeaders() })
      .subscribe({
        next: res => {
          this.escalatedList = this.normalizeArray(res);
          this.escalatedPage = 1;
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

  private applyStatusFilter(list: any[]) {
    if (!this.statusFilter || this.statusFilter === 'ALL') return list;
    const target = this.statusFilter.toLowerCase();
    return list.filter(item => (item.status || '').toLowerCase() === target);
  }

  formatStatus(status?: string) {
    if (!status) return 'Unknown';
    return status.replace(/_/g, ' ').toUpperCase();
  }

  statusClass(status?: string) {
    const normalized = (status || '').toLowerCase();
    if (normalized === 'escalated') return 'escalated';
    if (normalized === 'submitted') return 'submitted';
    return '';
  }

  changePage(kind: 'all' | 'dept' | 'escalated', delta: number) {
    if (kind === 'all') {
      this.allPage = this.clampPage(this.allPage + delta, this.allPageCount);
    } else if (kind === 'dept') {
      this.deptPage = this.clampPage(this.deptPage + delta, this.deptPageCount);
    } else {
      this.escalatedPage = this.clampPage(this.escalatedPage + delta, this.escalatedPageCount);
    }
    this.cdr.markForCheck();
  }

  openGrievance(g: any) {
    const win = window.open('', '_blank');
    if (!win) return;
    const escape = (val: any) => this.escapeHtml(String(val ?? '—'));
    const html = `
      <html>
        <head>
          <title>Grievance ${escape(g.id)}</title>
          <style>
            body{font-family:Arial,sans-serif;padding:16px;background:#f6f7fb;color:#0f172a;}
            .card{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:16px;box-shadow:0 10px 24px rgba(15,23,42,0.08);max-width:800px;margin:0 auto;}
            .muted{color:#6b7280;font-size:13px;}
            .badge{display:inline-block;padding:6px 10px;border-radius:999px;font-weight:700;font-size:12px;background:#eef2fb;color:#1f4f93;border:1px solid rgba(31,79,147,0.2);}
            .badge.escalated{background:#fee2e2;color:#b91c1c;border-color:#fecdd3;}
            h1{margin:0 0 8px;font-size:22px;}
            p{margin:6px 0;font-size:14px;line-height:1.5;}
            dl{display:grid;grid-template-columns:140px 1fr;gap:6px 12px;margin:12px 0;}
            dt{font-weight:700;color:#374151;}
            dd{margin:0;color:#111827;}
          </style>
        </head>
        <body>
          <div class="card">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;">
              <h1>#${escape(g.id)}</h1>
              <span class="badge ${g.status === 'ESCALATED' ? 'escalated' : ''}">${escape(this.formatStatus(g.status))}</span>
            </div>
            <p class="muted">Department: ${escape(g.departmentId)}</p>
            <p>${escape(g.description || 'No description provided.')}</p>
            <dl>
              <dt>Category</dt><dd>${escape(g.categoryCode)}</dd>
              <dt>Sub-category</dt><dd>${escape(g.subCategoryCode)}</dd>
              <dt>Assigned to</dt><dd>${escape(g.assignedTo)}</dd>
            </dl>
          </div>
        </body>
      </html>
    `;
    win.document.write(html);
    win.document.close();
  }

  private clampPage(next: number, max: number) {
    if (max < 1) return 1;
    if (next < 1) return 1;
    if (next > max) return max;
    return next;
  }

  private paginate(list: any[], page: number) {
    const start = (page - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  }

  private pageCount(list: any[]) {
    return Math.max(1, Math.ceil(list.length / this.pageSize));
  }

  private escapeHtml(value: string) {
    return value.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] || ch));
  }

  private soHeaders() {
    const trimmed = this.auth.getToken().trim();
    return trimmed ? new HttpHeaders({ Authorization: `Bearer ${trimmed}` }) : new HttpHeaders();
  }

  private startAutoRefresh() {
    this.stopAutoRefresh();
    this.autoRefresh = setInterval(() => {
      this.viewAll();
      this.viewEscalated();
    }, this.REFRESH_MS);
  }

  private stopAutoRefresh() {
    if (this.autoRefresh) {
      clearInterval(this.autoRefresh);
      this.autoRefresh = null;
    }
  }

  private fetchDepartments() {
    this.departmentsLoading = true;
    this.departmentsError = '';
    this.http
      .get<any>(`${this.auth.getBaseUrl()}/auth/departments`, { headers: this.soHeaders() })
      .subscribe({
        next: res => {
          const central = Array.isArray((res as any)?.centralGovernmentDepartments) ? (res as any).centralGovernmentDepartments : [];
          const state = Array.isArray((res as any)?.stateGovernmentDepartments) ? (res as any).stateGovernmentDepartments : [];
          this.departments = [...central, ...state];
          this.departmentsLoading = false;
          this.cdr.markForCheck();
        },
        error: err => {
          this.departmentsError = this.readError(err);
          this.departmentsLoading = false;
          this.cdr.markForCheck();
        }
      });
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

  private isResolved(status?: string) {
    const normalized = (status || '').toLowerCase();
    return normalized === 'resolved' || normalized === 'closed';
  }

  private loadFeedbackForResolved(list: any[]) {
    list.forEach(item => {
      const id = item?.id;
      if (!id || !this.isResolved(item.status) || this.feedbackById[id]) return;
      this.http
        .get<Feedback>(`/feedback-service/api/feedback/grievance/${id}`, { headers: this.soHeaders() })
        .subscribe({
          next: res => {
            this.feedbackById[id] = res;
            this.cdr.markForCheck();
          },
          error: () => {}
        });
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
