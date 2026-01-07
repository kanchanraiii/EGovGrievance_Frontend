import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth/auth.service';

type Grievance = {
  id?: string;
  grievanceId?: string;
  description?: string;
  departmentId?: string;
  status?: string;
  updatedBy?: string;
  remarks?: string;
  assignedTo?: string;
  escalated?: boolean;
};

type Feedback = {
  grievanceId?: string;
  comments?: string;
  score?: number;
};

type FileMeta = {
  id?: string;
  fileName?: string;
  url?: string;
  fileDownloadUri?: string;
};

@Component({
  selector: 'app-cw-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="admin-shell">
      <header class="admin-header">
        <div>
          <p class="eyebrow">Case Worker</p>
          <h1>Assigned Grievances</h1>
          <p class="subtitle">Review your assigned grievances and update their status.</p>
        </div>
      </header>

      <div class="grid">
        <section class="card">
          <div class="card-head">
            <h2>Your assigned grievances</h2>
            <p class="helper">Auto-loaded. Refresh anytime.</p>
          </div>
          <div class="actions">
            <button class="button ghost" type="button" (click)="loadAssigned()" [disabled]="assignedLoading">Refresh</button>
          </div>
          <div class="response error" *ngIf="assignedError">{{ assignedError }}</div>
          <div class="loading" *ngIf="assignedLoading">
            <span class="spinner" aria-hidden="true"></span>
            <span>Loading assigned grievances...</span>
          </div>
          <ul class="grievance-list" *ngIf="!assignedLoading && assignedList.length">
            <li *ngFor="let g of paginatedAssigned; trackBy: trackGrievance">
              <div class="row">
                <div>
                  <div class="id">#{{ g.id }}</div>
                  <div class="muted">Dept: {{ g.departmentId || '—' }}</div>
                </div>
                <div class="chips">
                  <span class="status" [ngClass]="statusClass(g.status, g.escalated)">{{ formatStatus(g.status) }}</span>
                </div>
              </div>
              <p class="description">{{ g.description || 'No description provided.' }}</p>
              <div class="meta">
                <span *ngIf="g.updatedBy">Updated by: {{ g.updatedBy }}</span>
                <span *ngIf="g.remarks">Remarks: {{ g.remarks }}</span>
              </div>
              <div class="feedback" *ngIf="feedbackById[getId(g)]?.comments">
                Feedback: {{ feedbackById[getId(g)]?.comments }}
              </div>
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
            </li>
          </ul>
          <div class="pagination" *ngIf="totalPages > 1">
            <button class="button ghost" type="button" (click)="changePage(-1)" [disabled]="page === 1">Prev</button>
            <span class="muted">Page {{ page }} of {{ totalPages }}</span>
            <button class="button ghost" type="button" (click)="changePage(1)" [disabled]="page === totalPages">Next</button>
          </div>
          <div class="response warn" *ngIf="!assignedLoading && !assignedList.length && !assignedError">No assigned grievances.</div>
        </section>

        <section class="card">
          <div class="card-head">
            <h2>Update status</h2>
            <p class="helper">Mark a grievance as IN_PROGRESS, RESOLVED, or REJECTED.</p>
          </div>
          <div class="form-grid two-column">
            <div class="full">
              <label class="field-label">Grievance</label>
              <select class="field" [(ngModel)]="statusForm.grievanceId" [disabled]="!assignedList.length">
                <option value="" disabled>Select a grievance</option>
                <option *ngFor="let g of assignedList; trackBy: trackGrievance" [value]="g.id || g.grievanceId">
                  {{ g.id || g.grievanceId }} — {{ g.status || 'N/A' }}
                </option>
              </select>
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
          <div class="inline-help warn" *ngIf="isSelectedEscalated()">This grievance is escalated and cannot be updated by case workers.</div>
          <div class="actions">
            <button class="button" type="button" (click)="updateStatus()" [disabled]="statusSubmitting || !statusForm.grievanceId || isSelectedEscalated()">
              {{ statusSubmitting ? 'Updating...' : 'Update' }}
            </button>
          </div>
          <div class="response success" *ngIf="statusSuccess">{{ statusSuccess }}</div>
          <div class="response error" *ngIf="statusError">{{ statusError }}</div>
        </section>
      </div>
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
    .form-grid.two-column{grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:.75rem}
    .form-grid .full{grid-column:1/-1}
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
    .grievance-list{list-style:none;padding:0;margin:.35rem 0 0;display:flex;flex-direction:column;gap:.7rem}
    .grievance-list li{border:1px solid var(--border);border-radius:14px;padding:.9rem;background:#fff;display:flex;flex-direction:column;gap:.55rem;box-shadow:0 12px 22px rgba(16,24,40,0.08)}
    .row{display:flex;justify-content:space-between;align-items:flex-start;gap:.65rem;flex-wrap:wrap}
    .id{font-weight:800;font-size:1rem}
    .muted{color:var(--muted);font-size:.95rem}
    .status{border-radius:999px;padding:.3rem .7rem;font-size:.82rem;font-weight:700;background:#eef2fb;color:#1f4f93;border:1px solid rgba(31,79,147,0.2)}
    .status.submitted,.status.in-progress{background:#fff7ed;color:#b45309;border-color:#fed7aa}
    .status.resolved{background:#ecfdf3;color:#166534;border:1px solid #bbf7d0}
    .status.escalated{background:#fee2e2;color:#b91c1c;border:1px solid #fecdd3}
    .chips{display:flex;gap:.4rem;flex-wrap:wrap}
    .description{margin:0;font-size:1rem;line-height:1.45}
    .meta{display:flex;flex-wrap:wrap;gap:.55rem;font-size:.9rem;color:var(--muted)}
    .feedback{font-size:.9rem;color:#0f172a;background:#f1f5f9;border-radius:10px;padding:.5rem .6rem;border:1px solid #e2e8f0}
    .loading{display:flex;align-items:center;gap:.45rem;color:var(--muted)}
    .spinner{width:18px;height:18px;border:3px solid #e5e7eb;border-top-color:var(--accent);border-radius:50%;display:inline-block;animation:spin 1s linear infinite}
    .attachments{display:flex;flex-direction:column;gap:.35rem}
    .attachment-list{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:.25rem}
    .attachment-link{background:none;border:none;color:var(--accent);cursor:pointer;text-align:left;padding:0}
    .inline-help.error{color:#b91c1c;font-size:.85rem}
    .inline-help.warn{color:#b45309}
    .pagination{display:flex;gap:.6rem;align-items:center;flex-wrap:wrap;margin-top:.35rem}
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
export class CwDashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  assignedList: Grievance[] = [];
  assignedLoading = false;
  assignedError = '';
  feedbackById: Record<string, Feedback> = {};
  attachmentsById: Record<string, FileMeta[]> = {};
  attachmentsLoading: Record<string, boolean> = {};
  attachmentsError: Record<string, string> = {};
  pageSize = 5;
  page = 1;

  statusForm = { grievanceId: '', status: 'IN_PROGRESS', updatedBy: '', remarks: '' };
  statusSubmitting = false;
  statusSuccess = '';
  statusError = '';

  get selectedGrievance(): Grievance | undefined {
    return this.assignedList.find(g => (g.id || g.grievanceId) === this.statusForm.grievanceId);
  }

  get paginatedAssigned() {
    const start = (this.page - 1) * this.pageSize;
    return this.assignedList.slice(start, start + this.pageSize);
  }

  get totalPages() {
    return Math.max(1, Math.ceil(this.assignedList.length / this.pageSize));
  }

  formatStatus(status?: string) {
    if (!status) return 'N/A';
    return status.replace(/_/g, ' ').toUpperCase();
  }

  statusClass(status?: string, escalated?: boolean) {
    const normalized = (status || '').toLowerCase();
    if (escalated || normalized === 'escalated') return 'escalated';
    if (normalized === 'resolved' || normalized === 'closed') return 'resolved';
    if (normalized === 'submitted' || normalized === 'in_progress' || normalized === 'in-progress') return 'in-progress';
    return '';
  }

  ngOnInit(): void {
    const email = this.auth.getProfile().email || '';
    this.statusForm.updatedBy = email;
    this.loadAssigned();
  }

  loadAssigned() {
    this.assignedError = '';
    this.assignedLoading = true;
    this.http.get<Grievance[]>(`${this.auth.getBaseUrl()}/grievance-service/api/grievances/my-assigned`, { headers: this.authHeaders() }).subscribe({
      next: res => {
        this.assignedList = Array.isArray(res) ? res : [];
        this.page = 1;
        if (this.assignedList.length) {
          const current = this.statusForm.grievanceId;
          const exists = this.assignedList.some(g => (g.id || g.grievanceId) === current);
          this.statusForm.grievanceId = exists ? current : (this.assignedList[0].id || this.assignedList[0].grievanceId || '');
        } else {
          this.statusForm.grievanceId = '';
        }
        this.assignedLoading = false;
        this.loadFeedbackForResolved(this.assignedList);
        this.cdr.markForCheck();
      },
      error: err => {
        this.assignedError = this.readError(err);
        this.assignedLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  updateStatus() {
    this.statusError = '';
    this.statusSuccess = '';
    if (this.isSelectedEscalated()) {
      this.statusError = 'Escalated grievances cannot be updated by case workers.';
      this.cdr.markForCheck();
      return;
    }
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
          this.loadAssigned();
          this.cdr.markForCheck();
        },
        error: err => {
          this.statusError = this.readError(err);
          this.statusSubmitting = false;
          this.cdr.markForCheck();
        }
      });
  }

  trackGrievance(index: number, item: Grievance) {
    return item.id || item.grievanceId || index;
  }

  private authHeaders() {
    const trimmed = this.auth.getToken().trim();
    return trimmed ? new HttpHeaders({ Authorization: `Bearer ${trimmed}`, 'Content-Type': 'application/json' }) : new HttpHeaders({ 'Content-Type': 'application/json' });
  }

  isSelectedEscalated() {
    const status = this.selectedGrievance?.status || '';
    return status.toLowerCase() === 'escalated';
  }

  changePage(delta: number) {
    const next = this.page + delta;
    if (next < 1 || next > this.totalPages) return;
    this.page = next;
    this.cdr.markForCheck();
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

  getId(g: Grievance) {
    return g.id || g.grievanceId || '';
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
          error: () => {
            // Ignore missing feedback.
          }
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
