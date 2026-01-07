import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth/auth.service';

type CaseWorker = { id?: string; fullName?: string; email?: string; phone?: string; departmentId?: string };
type Grievance = {
  id?: string;
  grievanceId?: string;
  description?: string;
  departmentId?: string;
  status?: string;
  assignedTo?: string;
  updatedBy?: string;
  remarks?: string;
};

type Feedback = { grievanceId?: string; comments?: string; score?: number };
type FileMeta = { id?: string; fileName?: string; url?: string; fileDownloadUri?: string };

@Component({
  selector: 'app-do-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="admin-shell">
      <header class="admin-header">
        <div>
          <p class="eyebrow">Department Officer</p>
          <h1>Officer Console</h1>
          <p class="subtitle">Assign grievances, manage statuses, and onboard case workers.</p>
        </div>
      </header>

      <div class="grid">
        <section class="card">
          <div class="card-head">
            <h2>Assign grievance</h2>
            <p class="helper">Pick a grievance and assign it to a case worker.</p>
          </div>
          <div class="form-grid two-column">
            <div>
              <label class="field-label">Grievance ID</label>
              <input class="field" [(ngModel)]="assignForm.grievanceId" />
            </div>
            <div>
              <label class="field-label">Assign to (Case Worker ID)</label>
              <input class="field" [(ngModel)]="assignForm.assignedTo" />
            </div>
          </div>
          <div class="actions">
            <button class="button" type="button" (click)="assignGrievance()" [disabled]="assignSubmitting">
              {{ assignSubmitting ? 'Assigning...' : 'Assign' }}
            </button>
          </div>
          <div class="response success" *ngIf="assignSuccess">{{ assignSuccess }}</div>
          <div class="response error" *ngIf="assignError">{{ assignError }}</div>
        </section>

        <section class="card">
          <div class="card-head">
            <h2>Update grievance status</h2>
            <p class="helper">Move a grievance to IN_PROGRESS, RESOLVED, or REJECTED.</p>
          </div>
          <div class="form-grid two-column">
            <div>
              <label class="field-label">Grievance ID</label>
              <input class="field" [(ngModel)]="statusForm.grievanceId" />
            </div>
            <div>
              <label class="field-label">Status</label>
              <select class="field" [(ngModel)]="statusForm.status">
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>
            <div>
              <label class="field-label">Updated by</label>
              <input class="field" [(ngModel)]="statusForm.updatedBy" />
            </div>
            <div>
              <label class="field-label">Remarks</label>
              <input class="field" [(ngModel)]="statusForm.remarks" />
            </div>
          </div>
          <div class="actions">
            <button class="button" type="button" (click)="updateStatus()" [disabled]="statusSubmitting">
              {{ statusSubmitting ? 'Updating...' : 'Update' }}
            </button>
          </div>
          <div class="response success" *ngIf="statusSuccess">{{ statusSuccess }}</div>
          <div class="response error" *ngIf="statusError">{{ statusError }}</div>
        </section>
      </div>

      <section class="card">
        <div class="card-head">
          <h2>My case workers</h2>
          <p class="helper">List of case workers in your department.</p>
        </div>
        <div class="actions">
          <button class="button ghost" type="button" (click)="loadCaseWorkers()" [disabled]="caseWorkersLoading">Refresh</button>
        </div>
        <div class="response error" *ngIf="caseWorkersError">{{ caseWorkersError }}</div>
        <div class="inline-help" *ngIf="caseWorkersLoading">
          <span class="spinner" aria-hidden="true"></span> Loading case workers...
        </div>
        <div class="card-grid" *ngIf="caseWorkers.length">
          <article class="grievance-card" *ngFor="let cw of caseWorkers; trackBy: trackCaseWorker">
            <header class="grievance-head">
              <div>
                <div class="id">{{ cw.fullName || cw.id || 'Case Worker' }}</div>
                <div class="muted">ID: {{ cw.id || '—' }}</div>
              </div>
              <span class="status submitted">Case Worker</span>
            </header>
            <div class="meta">
              <span *ngIf="cw.email">Email: {{ cw.email }}</span>
              <span *ngIf="cw.phone">Phone: {{ cw.phone }}</span>
              <span *ngIf="cw.departmentId">Dept: {{ cw.departmentId }}</span>
            </div>
          </article>
        </div>
        <div class="response warn" *ngIf="!caseWorkersLoading && !caseWorkers.length && !caseWorkersError">No case workers found.</div>
      </section>

      <section class="card">
        <div class="card-head">
          <h2>Department grievances</h2>
          <p class="helper">See all grievances for your department (scoped by your login).</p>
        </div>
        <div class="actions">
          <button class="button ghost" type="button" (click)="loadDepartmentGrievances()" [disabled]="deptGrievancesLoading">
            {{ deptGrievancesLoading ? 'Loading...' : 'Refresh' }}
          </button>
        </div>
        <div class="response error" *ngIf="deptGrievancesError">{{ deptGrievancesError }}</div>
        <div class="card-grid" *ngIf="deptGrievances.length">
          <article class="grievance-card" *ngFor="let g of deptGrievances; trackBy: trackGrievance" [class.escalated]="g.status === 'ESCALATED'">
            <header class="grievance-head">
              <div>
                <div class="id">#{{ g.id || g.grievanceId }}</div>
                <div class="muted">Dept: {{ g.departmentId || '—' }}</div>
              </div>
              <span class="status submitted">{{ g.status || 'N/A' }}</span>
            </header>
            <p class="description">{{ g.description || 'No description provided.' }}</p>
            <div class="meta">
              <span *ngIf="g.assignedTo">Assigned to: {{ g.assignedTo }}</span>
              <span *ngIf="g.updatedBy">Updated by: {{ g.updatedBy }}</span>
              <span *ngIf="g.remarks">Remarks: {{ g.remarks }}</span>
            </div>
            <div class="feedback" *ngIf="feedbackById[getId(g)]?.comments">Feedback: {{ feedbackById[getId(g)]?.comments }}</div>
            <div class="attachments">
              <button class="link-button" type="button" (click)="loadAttachments(getId(g))">
                {{ attachmentsLoading[getId(g)] ? 'Loading attachments...' : 'Load attachments' }}
              </button>
              <div class="inline-help error" *ngIf="attachmentsError[getId(g)]">{{ attachmentsError[getId(g)] }}</div>
              <ul class="attachment-list" *ngIf="attachmentsById[getId(g)]?.length">
                <li *ngFor="let file of attachmentsById[getId(g)]">
                  <button class="attachment-link" type="button" (click)="downloadAttachment(file)">
                    {{ file.fileName || file.id || 'Attachment' }}
                  </button>
                </li>
              </ul>
            </div>
          </article>
        </div>
        <div class="response warn" *ngIf="!deptGrievancesLoading && !deptGrievances.length && !deptGrievancesError">No grievances found for your department.</div>
      </section>

      <section class="card">
        <div class="card-head">
          <h2>Grievances by case worker</h2>
          <p class="helper">See grievances handled by a specific case worker.</p>
        </div>
        <div class="form-grid two-column">
          <div>
            <label class="field-label">Case worker</label>
            <select class="field" [(ngModel)]="caseWorkerId">
              <option value="" disabled>Select a case worker</option>
              <option *ngFor="let cw of caseWorkers; trackBy: trackCaseWorker" [value]="cw.id || cw.email">
                {{ cw.fullName || cw.email || cw.id }}
              </option>
            </select>
          </div>
        </div>
        <div class="actions">
          <button class="button ghost" type="button" (click)="loadCaseWorkerGrievances()" [disabled]="cwGrievancesLoading">
            {{ cwGrievancesLoading ? 'Loading...' : 'Load grievances' }}
          </button>
        </div>
        <div class="response error" *ngIf="cwGrievancesError">{{ cwGrievancesError }}</div>
        <div class="card-grid" *ngIf="cwGrievances.length">
          <article class="grievance-card" *ngFor="let g of cwGrievances; trackBy: trackGrievance">
            <header class="grievance-head">
              <div>
                <div class="id">#{{ g.id }}</div>
                <div class="muted">Dept: {{ g.departmentId || '—' }}</div>
              </div>
              <span class="status submitted">{{ g.status || 'N/A' }}</span>
            </header>
            <p class="description">{{ g.description || 'No description provided.' }}</p>
            <div class="meta">
              <span *ngIf="g.assignedTo">Assigned to: {{ g.assignedTo }}</span>
              <span *ngIf="g.updatedBy">Updated by: {{ g.updatedBy }}</span>
              <span *ngIf="g.remarks">Remarks: {{ g.remarks }}</span>
            </div>
            <div class="feedback" *ngIf="feedbackById[getId(g)]?.comments">Feedback: {{ feedbackById[getId(g)]?.comments }}</div>
            <div class="attachments">
              <button class="link-button" type="button" (click)="loadAttachments(getId(g))">
                {{ attachmentsLoading[getId(g)] ? 'Loading attachments...' : 'Load attachments' }}
              </button>
              <div class="inline-help error" *ngIf="attachmentsError[getId(g)]">{{ attachmentsError[getId(g)] }}</div>
              <ul class="attachment-list" *ngIf="attachmentsById[getId(g)]?.length">
                <li *ngFor="let file of attachmentsById[getId(g)]">
                  <button class="attachment-link" type="button" (click)="downloadAttachment(file)">
                    {{ file.fileName || file.id || 'Attachment' }}
                  </button>
                </li>
              </ul>
            </div>
          </article>
        </div>
        <div class="response warn" *ngIf="!cwGrievancesLoading && !cwGrievances.length && !cwGrievancesError">No grievances for this case worker.</div>
      </section>

      <section class="card">
        <div class="card-head">
          <h2>Register case worker</h2>
          <p class="helper">Onboard a new case worker for your department.</p>
        </div>
        <div class="form-grid two-column">
          <div>
            <label class="field-label">Full name</label>
            <input class="field" [(ngModel)]="cwForm.fullName" />
          </div>
          <div>
            <label class="field-label">Email</label>
            <input class="field" type="email" [(ngModel)]="cwForm.email" />
          </div>
          <div>
            <label class="field-label">Phone</label>
            <input class="field" [(ngModel)]="cwForm.phone" />
          </div>
          <div>
            <label class="field-label">Password</label>
            <input class="field" type="password" [(ngModel)]="cwForm.password" />
          </div>
          <div>
            <label class="field-label">Department ID</label>
            <input class="field" [(ngModel)]="cwForm.departmentId" />
          </div>
        </div>
        <div class="actions">
          <button class="button" type="button" (click)="registerCaseWorker()" [disabled]="cwSubmitting">
            {{ cwSubmitting ? 'Registering...' : 'Register' }}
          </button>
        </div>
        <div class="response success" *ngIf="cwSuccess">{{ cwSuccess }}</div>
        <div class="response error" *ngIf="cwError">{{ cwError }}</div>
      </section>
    </section>
  `,
  styles: [
    `:host{display:block}
    .admin-shell{display:flex;flex-direction:column;gap:1.2rem;padding:1.5rem 1.75rem}
    .admin-header{display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap;align-items:flex-start}
    .eyebrow{text-transform:uppercase;letter-spacing:.18em;font-size:.76rem;color:var(--accent-2);margin:0 0 .35rem}
    h1{margin:0 0 .35rem;font-size:1.9rem}
    .subtitle{margin:0;color:var(--muted);font-size:1rem}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:1.2rem}
    .card{background:var(--panel);border:1px solid var(--border);border-radius:16px;padding:1.1rem;display:flex;flex-direction:column;gap:.75rem;box-shadow:0 14px 28px rgba(28,39,56,0.1)}
    .card-head h2{margin:0;font-size:1.12rem}
    .helper{margin:0;color:var(--muted);font-size:.95rem}
    .form-grid{display:grid;gap:.6rem}
    .form-grid.two-column{grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:.75rem}
    .field-label{font-size:.8rem;color:var(--muted);text-transform:uppercase;letter-spacing:.12em}
    .field{border:1px solid var(--border);border-radius:12px;padding:.7rem .85rem;font:inherit;background:#fff}
    .actions{display:flex;gap:.6rem;flex-wrap:wrap}
    .button{border:none;border-radius:999px;background:var(--accent);color:#fff;padding:.65rem 1.2rem;font-weight:700;cursor:pointer;box-shadow:0 10px 22px rgba(31,79,147,0.22);font-size:.95rem}
    .button.ghost{background:#eef2fb;color:var(--accent);box-shadow:none;border:1px solid rgba(31,79,147,0.2)}
    .button[disabled]{opacity:.6;cursor:not-allowed;box-shadow:none}
    .response{border-radius:12px;padding:.7rem .85rem;font-size:.9rem}
    .response.success{background:#ecfdf3;color:#166534;border:1px solid #bbf7d0}
    .response.error{background:#fff1f2;color:#9f1239;border:1px solid #fecdd3}
    .response.warn{background:#fff7ed;color:#b45309;border:1px solid #fed7aa}
    .card-grid{display:flex;flex-direction:column;gap:.75rem;margin-top:.35rem}
    .grievance-card{border:1px solid var(--border);border-radius:14px;padding:.9rem;background:#fff;display:flex;flex-direction:column;gap:.55rem;box-shadow:0 12px 22px rgba(16,24,40,0.08);width:100%}
    .grievance-card.escalated{border-color:#fca5a5;background:#fff1f2}
    .grievance-head{display:flex;justify-content:space-between;align-items:flex-start;gap:.65rem}
    .id{font-weight:800;font-size:1rem}
    .muted{color:var(--muted);font-size:.95rem}
    .status{border-radius:999px;padding:.3rem .7rem;font-size:.82rem;font-weight:700;background:#eef2fb;color:#1f4f93;border:1px solid rgba(31,79,147,0.2)}
    .status.submitted{background:#e0f2fe;color:#075985;border-color:#bae6fd}
    .status.escalated{background:#fee2e2;color:#b91c1c;border:1px solid #fecdd3}
    .description{margin:0;font-size:1rem;line-height:1.45}
    .meta{display:flex;flex-wrap:wrap;gap:.55rem;font-size:.9rem;color:var(--muted)}
    .attachments{display:flex;flex-direction:column;gap:.35rem}
    .attachment-list{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:.25rem}
    .attachment-link{background:none;border:none;color:var(--accent);cursor:pointer;text-align:left;padding:0}
    .inline-help.error{color:#b91c1c;font-size:.85rem}
    .feedback{font-size:.9rem;color:#0f172a;background:#f1f5f9;border-radius:10px;padding:.5rem .6rem;border:1px solid #e2e8f0}
    .spinner{width:16px;height:16px;border:3px solid #e5e7eb;border-top-color:var(--accent);border-radius:50%;display:inline-block;animation:spin 1s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
    @media (max-width:768px){
      .admin-shell{padding:1rem}
      .grid{grid-template-columns:1fr}
      .card{padding:1rem}
      .form-grid.two-column{grid-template-columns:1fr}
    }
    @media (max-width:560px){
      .actions{flex-direction:column}
      .button{width:100%;justify-content:center}
      .card-grid{grid-template-columns:1fr}
    }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DoDashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  assignForm = { grievanceId: '', assignedTo: '' };
  assignSubmitting = false;
  assignSuccess = '';
  assignError = '';

  statusForm = { grievanceId: '', status: 'IN_PROGRESS', updatedBy: '', remarks: '' };
  statusSubmitting = false;
  statusSuccess = '';
  statusError = '';

  caseWorkers: CaseWorker[] = [];
  caseWorkersLoading = false;
  caseWorkersError = '';

  caseWorkerId = '';
  cwGrievances: Grievance[] = [];
  cwGrievancesLoading = false;
  cwGrievancesError = '';

  deptGrievances: Grievance[] = [];
  deptGrievancesLoading = false;
  deptGrievancesError = '';
  feedbackById: Record<string, Feedback> = {};
  attachmentsById: Record<string, FileMeta[]> = {};
  attachmentsLoading: Record<string, boolean> = {};
  attachmentsError: Record<string, string> = {};

  cwForm = { fullName: '', email: '', phone: '', password: '', departmentId: '' };
  cwSubmitting = false;
  cwSuccess = '';
  cwError = '';
  

  ngOnInit(): void {
    this.loadCaseWorkers();
    this.loadDepartmentGrievances();
  }

  assignGrievance() {
    this.assignError = '';
    this.assignSuccess = '';
    if (!this.assignForm.grievanceId.trim() || !this.assignForm.assignedTo.trim()) {
      this.assignError = 'Grievance ID and assignee are required.';
      this.cdr.markForCheck();
      return;
    }
    this.assignSubmitting = true;
    this.cdr.markForCheck();
    this.http
      .patch(`${this.auth.getBaseUrl()}/grievance-service/api/grievances/assign`, this.assignForm, { headers: this.authHeaders() })
      .subscribe({
        next: () => {
          this.assignSuccess = 'Grievance assigned.';
          this.assignSubmitting = false;
          this.cdr.markForCheck();
        },
        error: err => {
          this.assignError = this.readError(err);
          this.assignSubmitting = false;
          this.cdr.markForCheck();
        }
      });
  }

  updateStatus() {
    this.statusError = '';
    this.statusSuccess = '';
    if (!this.statusForm.grievanceId.trim()) {
      this.statusError = 'Grievance ID is required.';
      this.cdr.markForCheck();
      return;
    }
    this.statusSubmitting = true;
    this.cdr.markForCheck();
    this.http
      .patch(`${this.auth.getBaseUrl()}/grievance-service/api/grievances/status`, this.statusForm, { headers: this.authHeaders() })
      .subscribe({
        next: () => {
          this.statusSuccess = 'Status updated.';
          this.statusSubmitting = false;
          this.cdr.markForCheck();
        },
        error: err => {
          this.statusError = this.readError(err);
          this.statusSubmitting = false;
          this.cdr.markForCheck();
        }
      });
  }

  loadCaseWorkers() {
    this.caseWorkersError = '';
    this.caseWorkersLoading = true;
    this.http
      .get<CaseWorker[]>(`${this.auth.getBaseUrl()}/grievance-service/api/grievances/my-case-workers`, { headers: this.authHeaders() })
      .subscribe({
        next: res => {
          const raw = Array.isArray(res)
            ? res
            : Array.isArray((res as any)?.caseWorkers)
              ? (res as any).caseWorkers
              : Array.isArray((res as any)?.data)
                ? (res as any).data
                : [];
          this.caseWorkers = raw.map((entry: CaseWorker | string) => {
            if (typeof entry === 'string') {
              return { id: entry, fullName: entry };
            }
            return entry as CaseWorker;
          });
          if (!this.caseWorkers.some(cw => cw.id === this.caseWorkerId || cw.email === this.caseWorkerId)) {
            this.caseWorkerId = '';
          }
          this.caseWorkersLoading = false;
          this.cdr.markForCheck();
        },
        error: err => {
          this.caseWorkersError = this.readError(err);
          this.caseWorkersLoading = false;
          this.cdr.markForCheck();
        }
      });
  }

  loadDepartmentGrievances() {
    this.deptGrievancesError = '';
    this.deptGrievances = [];
    this.deptGrievancesLoading = true;
    this.http
      .get<Grievance[]>(`/grievance-service/api/grievances/getAll`, { headers: this.authHeaders() })
      .subscribe({
        next: res => {
          this.deptGrievances = Array.isArray(res) ? res : [];
          this.loadFeedbackForResolved(this.deptGrievances);
          this.deptGrievancesLoading = false;
          this.cdr.markForCheck();
        },
        error: err => {
          this.deptGrievancesError = this.readError(err);
          this.deptGrievancesLoading = false;
          this.cdr.markForCheck();
        }
      });
  }

  loadCaseWorkerGrievances() {
    this.cwGrievancesError = '';
    this.cwGrievances = [];
    if (!this.caseWorkerId.trim()) {
      this.cwGrievancesError = 'Case worker ID is required.';
      this.cdr.markForCheck();
      return;
    }
    this.cwGrievancesLoading = true;
    this.http
      .get<Grievance[]>(`${this.auth.getBaseUrl()}/grievance-service/api/grievances/case-worker/${this.caseWorkerId.trim()}`, {
        headers: this.authHeaders()
      })
      .subscribe({
        next: res => {
          this.cwGrievances = Array.isArray(res) ? res : [];
          this.loadFeedbackForResolved(this.cwGrievances);
          this.cwGrievancesLoading = false;
          this.cdr.markForCheck();
        },
        error: err => {
          this.cwGrievancesError = this.readError(err);
          this.cwGrievancesLoading = false;
          this.cdr.markForCheck();
        }
      });
  }

  registerCaseWorker() {
    this.cwError = '';
    this.cwSuccess = '';
    if (!this.cwForm.fullName.trim() || !this.cwForm.email.trim() || !this.cwForm.password.trim() || !this.cwForm.departmentId.trim()) {
      this.cwError = 'Full name, email, password, and department are required.';
      this.cdr.markForCheck();
      return;
    }
    this.cwSubmitting = true;
    this.cdr.markForCheck();
    this.http
      .post(`${this.auth.getBaseUrl()}/auth/case-worker/register`, this.cwForm, {
        headers: this.authHeaders(),
        responseType: 'text' as 'json'
      })
      .subscribe({
        next: () => {
          this.cwSuccess = 'Case worker registered.';
          this.cwSubmitting = false;
          this.cwForm = { fullName: '', email: '', phone: '', password: '', departmentId: '' };
          this.loadCaseWorkers();
          this.cdr.markForCheck();
        },
        error: err => {
          this.cwError = this.readError(err);
          this.cwSubmitting = false;
          this.cdr.markForCheck();
        }
      });
  }

  trackCaseWorker(index: number, item: CaseWorker) {
    return item.id || item.email || index;
  }

  trackGrievance(index: number, item: Grievance) {
    return item.id || item.grievanceId || index;
  }

  loadAttachments(grievanceId: string) {
    if (!grievanceId) return;
    this.attachmentsError[grievanceId] = '';
    this.attachmentsLoading[grievanceId] = true;
    this.http
      .get<FileMeta[]>(`/storage-api/storage/grievance/${grievanceId}`, {
        headers: this.authHeaders()
      })
      .subscribe({
        next: res => {
          this.attachmentsById[grievanceId] = Array.isArray(res) ? res : [];
          this.attachmentsLoading[grievanceId] = false;
          this.cdr.markForCheck();
        },
        error: err => {
          this.attachmentsError[grievanceId] = this.readError(err);
          this.attachmentsLoading[grievanceId] = false;
          this.cdr.markForCheck();
        }
      });
  }

  downloadAttachment(file: FileMeta) {
    const fileId = file.id;
    if (!fileId) return;
    const url = `/storage-api/storage/${fileId}`;
    this.http
      .get(url, { headers: this.authHeaders(), responseType: 'blob' })
      .subscribe({
        next: blob => {
          const link = document.createElement('a');
          link.href = window.URL.createObjectURL(blob);
          link.download = file.fileName || fileId;
          link.click();
          window.URL.revokeObjectURL(link.href);
        },
        error: err => {
          const id = Object.keys(this.attachmentsById).find(key => this.attachmentsById[key]?.includes(file));
          if (id) {
            this.attachmentsError[id] = this.readError(err);
            this.cdr.markForCheck();
          }
        }
      });
  }

  getId(item: Grievance) {
    return item.id || item.grievanceId || '';
  }

  private isResolved(status?: string) {
    const normalized = (status || '').toLowerCase();
    return normalized === 'resolved' || normalized === 'closed';
  }

  private loadFeedbackForResolved(list: Grievance[]) {
    list.forEach(item => {
      const id = this.getId(item);
      if (!id || !this.isResolved(item.status) || this.feedbackById[id]) return;
      this.http
        .get<Feedback>(`/feedback-service/api/feedback/grievance/${id}`, { headers: this.authHeaders() })
        .subscribe({
          next: res => {
            this.feedbackById[id] = res;
            this.cdr.markForCheck();
          },
          error: () => {}
        });
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
