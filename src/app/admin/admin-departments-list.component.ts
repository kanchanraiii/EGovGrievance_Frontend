import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../auth/auth.service';

type Department = {
  id: string;
  name: string;
  level?: string;
  state?: string;
};

@Component({
  selector: 'app-admin-departments-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section class="admin-shell">
      <header class="admin-header">
        <div>
          <p class="eyebrow">Admin Console</p>
          <h1>View Departments</h1>
          <p class="subtitle">Browse, open, or delete departments (state and central).</p>
        </div>
        <button class="button ghost" type="button"
                (click)="loadDepartments()" [disabled]="deptLoading">
          {{ deptLoading ? 'Loading...' : 'Refresh' }}
        </button>
      </header>

      <div class="grid">

        <!-- CENTRAL -->
        <section class="card">
          <div class="card-head">
            <h2>Central Departments</h2>
            <span class="pill">{{ centralDepartments.length }}</span>
          </div>
          <div class="scroll-area">
            <div class="response error" *ngIf="deptError">{{ deptError }}</div>
            <div class="loading" *ngIf="deptLoading">Loading...</div>
            <div class="empty" *ngIf="!deptLoading && !deptError && !centralDepartments.length">
              No central departments.
            </div>
            <div class="dept-list" *ngIf="!deptLoading && !deptError && centralDepartments.length">
              <div class="dept-row" *ngFor="let dept of centralDepartments">
                <div>
                  <div class="dept-title">
                    {{ dept.name }} <span class="muted">({{ dept.id }})</span>
                  </div>
                  <div class="muted">Level: {{ dept.level || 'CENTRAL' }}</div>
                </div>
                <div class="dept-row-actions">
                  <a class="chip" [routerLink]="['/admin/departments', dept.id]">Open</a>
                  <button class="chip danger" type="button" (click)="openDeleteConfirm(dept.id)">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- STATE -->
        <section class="card">
          <div class="card-head">
            <h2>State Departments</h2>
            <span class="pill">{{ stateDepartments.length }}</span>
          </div>
          <div class="scroll-area">
            <div class="response error" *ngIf="deptError">{{ deptError }}</div>
            <div class="loading" *ngIf="deptLoading">Loading...</div>
            <div class="empty" *ngIf="!deptLoading && !deptError && !stateDepartments.length">
              No state departments.
            </div>
            <div class="dept-list" *ngIf="!deptLoading && !deptError && stateDepartments.length">
              <div class="dept-row" *ngFor="let dept of stateDepartments">
                <div>
                  <div class="dept-title">
                    {{ dept.name }} <span class="muted">({{ dept.id }})</span>
                  </div>
                  <div class="muted">
                    Level: {{ dept.level || 'STATE' }}
                    <span *ngIf="dept.state">- {{ dept.state }}</span>
                  </div>
                </div>
                <div class="dept-row-actions">
                  <a class="chip" [routerLink]="['/admin/departments', dept.id]">Open</a>
                  <button class="chip danger" type="button" (click)="openDeleteConfirm(dept.id)">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>

      <!-- DELETE CONFIRM OVERLAY -->
      <div class="overlay" *ngIf="showDeleteConfirm" (click)="closeDeleteConfirm()"></div>

      <!-- DELETE CONFIRM MODAL -->
      <div class="modal" *ngIf="showDeleteConfirm">
        <h3>Confirm Delete</h3>
        <p>Do you really want to delete this department?</p>

        <div class="modal-actions">
          <button class="btn cancel" type="button" (click)="closeDeleteConfirm()">
            Cancel
          </button>
          <button class="btn confirm" type="button" (click)="confirmDelete()">
            Delete
          </button>
        </div>
      </div>
    </section>
  `,
  styles: [
    `:host{display:block}
    .admin-shell{display:flex;flex-direction:column;gap:1rem;padding:1.25rem 1.5rem}
    .admin-header{display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap;align-items:center}
    .eyebrow{text-transform:uppercase;letter-spacing:.18em;font-size:.72rem;color:var(--accent-2);margin:0 0 .35rem}
    h1{margin:0 0 .35rem}
    .subtitle{margin:0;color:var(--muted)}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:1rem}
    .card{background:var(--panel);border:1px solid var(--border);border-radius:14px;padding:1rem;display:flex;flex-direction:column;gap:.6rem;box-shadow:0 10px 22px rgba(28,39,56,0.08)}
    .card-head{display:flex;justify-content:space-between;align-items:center;gap:.75rem;flex-wrap:wrap}
    .card-head h2{margin:0;font-size:1.05rem}
    .pill{display:inline-flex;align-items:center;justify-content:center;border-radius:999px;padding:.2rem .7rem;background:#eef2fb;color:#1f4f93;font-weight:700;font-size:.85rem}
    .scroll-area{max-height:480px;overflow-y:auto;padding-right:.35rem}
    .dept-list{display:flex;flex-direction:column;gap:.5rem}
    .dept-row{border:1px solid var(--border);border-radius:10px;padding:.65rem;background:#fff;box-shadow:0 8px 16px rgba(31,79,147,0.08);display:flex;justify-content:space-between;align-items:flex-start;gap:.6rem;flex-wrap:wrap}
    .dept-title{font-weight:700;margin-bottom:.1rem}
    .dept-row-actions{display:flex;gap:.4rem;flex-wrap:wrap}
    .chip{border:none;border-radius:10px;padding:.4rem .75rem;background:#eef2fb;color:#1f4f93;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:.25rem}
    .chip.danger{background:#fff1f2;color:#b42318}
    .response.error{background:#fff1f2;color:#9f1239;border:1px solid #fecdd3;border-radius:10px;padding:.5rem}
    .loading,.empty{padding:.6rem .75rem;border:1px dashed var(--border);border-radius:10px;color:var(--muted);background:#f8f9ff}
    .button{border:1px solid rgba(31,79,147,0.2);border-radius:999px;background:#eef2fb;color:var(--accent);padding:.55rem 1.1rem;font-weight:700;cursor:pointer}
    .button[disabled]{opacity:.6;cursor:not-allowed}

    /* Blur Overlay */
    .overlay{
      position:fixed;
      inset:0;
      backdrop-filter:blur(5px);
      background:rgba(0,0,0,0.45);
      z-index:9998;
    }

    /* Modal */
    .modal{
      position:fixed;
      top:50%;
      left:50%;
      transform:translate(-50%,-50%);
      background:#fff;
      padding:1.25rem 1.5rem;
      width:min(340px,90%);
      border-radius:12px;
      box-shadow:0 14px 30px rgba(0,0,0,0.25);
      text-align:center;
      z-index:9999;
    }

    .modal-actions{
      margin-top:1rem;
      display:flex;
      justify-content:center;
      gap:.6rem;
    }

    .btn{
      border:none;
      border-radius:8px;
      padding:.5rem 1rem;
      font-weight:600;
      cursor:pointer;
    }

    .btn.cancel{background:#ccc}
    .btn.confirm{background:#d11a2a;color:#fff}

    @media (max-width:768px){
      .admin-shell{padding:1rem}
      .grid{grid-template-columns:1fr}
      .card{padding:.9rem}
      .dept-row{flex-direction:column;align-items:flex-start}
      .admin-header{gap:.6rem}
    }
    @media (max-width:560px){
      .button{width:100%;justify-content:center}
      .dept-row-actions{width:100%}
      .chip{width:fit-content}
    }`
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDepartmentsListComponent implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private adminApi = this.auth.getBaseUrl();

  centralDepartments: Department[] = [];
  stateDepartments: Department[] = [];
  deptLoading = false;
  deptError = '';

  // NEW MODAL STATE
  showDeleteConfirm = false;
  deleteTargetId: string | null = null;

  ngOnInit() {
    this.loadDepartments();
  }

  loadDepartments() {
    this.deptLoading = true;
    this.deptError = '';
    this.http.get<any>(`${this.adminApi}/auth/departments`, { headers: this.authHeaders() }).subscribe({
      next: res => {
        const central = res?.centralGovernmentDepartments;
        const state = res?.stateGovernmentDepartments;
        this.centralDepartments = Array.isArray(central) ? central : [];
        this.stateDepartments = Array.isArray(state) ? state : [];
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

  // Open modal
  openDeleteConfirm(id: string) {
    this.deleteTargetId = id;
    this.showDeleteConfirm = true;
    this.cdr.markForCheck();
  }

  // Close modal
  closeDeleteConfirm() {
    this.showDeleteConfirm = false;
    this.deleteTargetId = null;
    this.cdr.markForCheck();
  }

  // Confirm delete
  confirmDelete() {
    if (!this.deleteTargetId) return;
    const deptId = this.deleteTargetId;

    this.showDeleteConfirm = false;
    this.deleteTargetId = null;

    this.deleteDepartmentNow(deptId);
    this.cdr.markForCheck();
  }

  // API delete
  private deleteDepartmentNow(deptId: string) {
    this.http.delete(`${this.adminApi}/auth/admin/departments/${deptId}`, { headers: this.authHeaders() }).subscribe({
      next: () => {
        this.centralDepartments = this.centralDepartments.filter(d => d.id !== deptId);
        this.stateDepartments = this.stateDepartments.filter(d => d.id !== deptId);
        this.cdr.markForCheck();
      },
      error: err => {
        this.deptError = this.readError(err);
        this.cdr.markForCheck();
      }
    });
  }

  private authHeaders() {
    const trimmed = this.auth.getToken().trim();
    return trimmed
      ? new HttpHeaders({ Authorization: `Bearer ${trimmed}`, 'Content-Type': 'application/json' })
      : new HttpHeaders({ 'Content-Type': 'application/json' });
  }

  private readError(error: unknown) {
    if (error instanceof HttpErrorResponse) {
      if (typeof error.error === 'string') return error.error;
      return error.error?.message || error.message;
    }
    return String(error);
  }
}
