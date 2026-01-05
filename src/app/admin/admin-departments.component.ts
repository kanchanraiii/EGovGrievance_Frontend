import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth/auth.service';
import { RouterModule } from '@angular/router';

type Department = {
  id: string;
  name: string;
  level?: string;
  state?: string;
  categories?: Array<{ code: string; name: string; subCategories?: Array<{ code: string; name: string }> }>;
};

@Component({
  selector: 'app-admin-departments',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <section class="admin-shell">
      <header class="admin-header">
        <div>
          <p class="eyebrow">Admin Console</p>
          <h1>Departments & Department Officers</h1>
          <p class="subtitle">Onboard Department Officers and manage departments/categories.</p>
        </div>
      </header>

      <section class="card">
        <div class="card-head">
          <h2>Departments</h2>
          <p class="helper">Load, delete departments, or remove categories.</p>
        </div>
        <div class="dept-actions">
          <button class="button ghost" type="button" (click)="loadDepartments()" [disabled]="deptLoading">
            {{ deptLoading ? 'Loading...' : 'Refresh departments' }}
          </button>
          <span class="muted" *ngIf="totalDepartments">Loaded {{ totalDepartments }} departments.</span>
        </div>
        <div class="response error" *ngIf="deptError">{{ deptError }}</div>

        <div class="dept-section" *ngIf="centralDepartments.length">
          <h3>Central Departments</h3>
          <div class="dept-list">
            <div class="dept-row" *ngFor="let dept of centralDepartments">
              <div>
                <div class="dept-title">{{ dept.name }} <span class="muted">({{ dept.id }})</span></div>
                <div class="muted">Level: {{ dept.level || 'CENTRAL' }}</div>
                <div class="muted">Categories: {{ dept.categories?.length || 0 }}</div>
              </div>
              <div class="dept-row-actions">
                <a class="chip" [routerLink]="['/admin/departments', dept.id]">Open</a>
                <button class="chip danger" type="button" (click)="deleteDepartment(dept.id)">Delete</button>
              </div>
            </div>
          </div>
        </div>

        <div class="dept-section" *ngIf="stateDepartments.length">
          <h3>State Departments</h3>
          <div class="dept-list">
            <div class="dept-row" *ngFor="let dept of stateDepartments">
              <div>
                <div class="dept-title">{{ dept.name }} <span class="muted">({{ dept.id }})</span></div>
                <div class="muted">Level: {{ dept.level || 'STATE' }} <span *ngIf="dept.state">· {{ dept.state }}</span></div>
                <div class="muted">Categories: {{ dept.categories?.length || 0 }}</div>
              </div>
              <div class="dept-row-actions">
                <a class="chip" [routerLink]="['/admin/departments', dept.id]">Open</a>
                <button class="chip danger" type="button" (click)="deleteDepartment(dept.id)">Delete</button>
              </div>
            </div>
          </div>
        </div>

        <div class="response warn" *ngIf="!deptLoading && !deptError && !totalDepartments">No departments returned.</div>
        <div class="response warn" *ngIf="deptCategoriesMessage">{{ deptCategoriesMessage }}</div>
        <div class="response error" *ngIf="deptCategoriesError">{{ deptCategoriesError }}</div>
      </section>

      <section class="card">
        <div class="card-head">
          <h2>Add department</h2>
          <p class="helper">Enter department details and one category (with optional sub-categories).</p>
        </div>
        <div class="form-grid two-column">
          <div>
            <label class="field-label">Department ID</label>
            <input class="field" [(ngModel)]="newDept.id" />
          </div>
          <div>
            <label class="field-label">Name</label>
            <input class="field" [(ngModel)]="newDept.name" />
          </div>
          <div>
            <label class="field-label">Level</label>
            <select class="field" [(ngModel)]="newDept.level">
              <option value="STATE">STATE</option>
              <option value="CENTRAL">CENTRAL</option>
            </select>
          </div>
        </div>

        <div class="category-form">
          <div class="category-header">
            <h3>Categories</h3>
            <button class="chip" type="button" (click)="addCategoryBlock()">+ Add category</button>
          </div>
          <div class="category-row" *ngFor="let cat of newDept.categories; let i = index">
            <div class="form-grid two-column">
              <div>
                <label class="field-label">Category code</label>
                <input class="field" [(ngModel)]="cat.code" />
              </div>
              <div>
                <label class="field-label">Category name</label>
                <input class="field" [(ngModel)]="cat.name" />
              </div>
            </div>
            <div class="subcat-list">
              <div class="subcat-header">
                <span>Sub-categories</span>
                <button class="chip" type="button" (click)="addCategoryRow(i)">+ Add sub-category</button>
              </div>
              <div class="subcat-row" *ngFor="let sub of cat.subCategories; let j = index">
                <input class="field small" placeholder="Code" [(ngModel)]="sub.code" />
                <input class="field small" placeholder="Name" [(ngModel)]="sub.name" />
                <button class="chip danger" type="button" (click)="removeSubcategory(i, j)">Remove</button>
              </div>
            </div>
            <div class="cat-actions">
              <button class="chip danger" type="button" (click)="removeCategoryRow(i)">Remove category</button>
            </div>
          </div>
        </div>
        <div class="actions">
          <button class="button" type="button" (click)="addDepartment()" [disabled]="addDeptSubmitting">
            {{ addDeptSubmitting ? 'Adding...' : 'Add Department' }}
          </button>
        </div>
        <div class="response success" *ngIf="addDeptSuccess">Department added.</div>
        <div class="response error" *ngIf="addDeptError">{{ addDeptError }}</div>
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
    .card-head{display:flex;justify-content:space-between;align-items:flex-start;gap:.75rem}
    .card-head h2{margin:0;font-size:1.05rem}
    .helper{margin:0;color:var(--muted)}
    .form-grid{display:grid;gap:.5rem}
    .form-grid.two-column{grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:.6rem}
    .field-label{font-size:.75rem;color:var(--muted);text-transform:uppercase;letter-spacing:.12em}
    .field{border:1px solid var(--border);border-radius:10px;padding:.6rem .75rem;font:inherit;background:#fff}
    .field.small{padding:.45rem .6rem;max-width:200px}
    .field-textarea{resize:vertical;border:1px solid var(--border);border-radius:10px;padding:.6rem .75rem;font:inherit;background:#fff}
    .actions{display:flex;gap:.5rem;flex-wrap:wrap}
    .button{border:none;border-radius:999px;background:var(--accent);color:#fff;padding:.55rem 1.1rem;font-weight:700;cursor:pointer;box-shadow:0 8px 18px rgba(31,79,147,0.2)}
    .button.ghost{background:#eef2fb;color:var(--accent);box-shadow:none;border:1px solid rgba(31,79,147,0.2)}
    .button.danger{background:#b42318;box-shadow:0 8px 18px rgba(180,35,24,0.18)}
    .button[disabled]{opacity:.6;cursor:not-allowed;box-shadow:none}
    .response{border-radius:10px;padding:.6rem .75rem;font-size:.85rem}
    .response.success{background:#ecfdf3;color:#166534;border:1px solid #bbf7d0}
    .response.error{background:#fff1f2;color:#9f1239;border:1px solid #fecdd3}
    .response.warn{background:#fff7ed;color:#b45309;border:1px solid #fed7aa}
    .dept-actions{display:flex;align-items:center;gap:.75rem;flex-wrap:wrap}
    .dept-list{display:flex;flex-direction:column;gap:.5rem}
    .dept-row{display:flex;justify-content:space-between;align-items:flex-start;padding:.75rem;border:1px solid var(--border);border-radius:12px;background:#fff}
    .dept-title{font-weight:700}
    .dept-row-actions{display:flex;gap:.4rem;flex-wrap:wrap}
    .chip{border:none;border-radius:10px;padding:.4rem .75rem;background:#eef2fb;color:#1f4f93;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:.25rem}
    .chip.danger{background:#fff1f2;color:#b42318}
    .divider{height:1px;background:var(--border);margin:.75rem 0}
    .dept-section{display:flex;flex-direction:column;gap:.45rem;margin-top:.5rem}
    .dept-section h3{margin:.1rem 0;font-size:.95rem}
    .muted{color:var(--muted);font-size:.9rem}
    .category-form{display:flex;flex-direction:column;gap:.6rem;border:1px dashed var(--border);border-radius:12px;padding:.75rem;background:#f9faff}
    .category-header{display:flex;justify-content:space-between;align-items:center;gap:.5rem}
    .category-row{border:1px solid var(--border);border-radius:12px;padding:.75rem;display:flex;flex-direction:column;gap:.5rem;background:#fff}
    .subcat-list{display:flex;flex-direction:column;gap:.35rem}
    .subcat-header{display:flex;justify-content:space-between;align-items:center}
    .subcat-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:.4rem;align-items:center}
    .cat-actions{display:flex;justify-content:flex-end}
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDepartmentsComponent implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private adminApi = this.auth.getBaseUrl();

  departments: Department[] = [];
  centralDepartments: Department[] = [];
  stateDepartments: Department[] = [];
  deptLoading = false;
  deptError = '';
  deptCategoriesMessage = '';
  deptCategoriesError = '';

  newDept = this.blankDept();
  addDeptSubmitting = false;
  addDeptSuccess = false;
  addDeptError = '';

  deleteDeptId = '';
  deleteSubmitting = false;
  deleteSuccess = '';
  deleteError = '';

  get totalDepartments() {
    return this.centralDepartments.length + this.stateDepartments.length || this.departments.length;
  }

  ngOnInit(): void {
    this.loadDepartments();
  }

  addCategoryRow(catIndex: number) {
    this.newDept.categories[catIndex].subCategories.push({ code: '', name: '' });
  }

  removeCategoryRow(catIndex: number) {
    this.newDept.categories.splice(catIndex, 1);
    if (!this.newDept.categories.length) {
      this.newDept.categories.push({ code: '', name: '', subCategories: [{ code: '', name: '' }] });
    }
    this.cdr.markForCheck();
  }

  removeSubcategory(catIndex: number, subIndex: number) {
    this.newDept.categories[catIndex].subCategories.splice(subIndex, 1);
    if (!this.newDept.categories[catIndex].subCategories.length) {
      this.newDept.categories[catIndex].subCategories.push({ code: '', name: '' });
    }
    this.cdr.markForCheck();
  }

  addCategoryBlock() {
    this.newDept.categories.push({ code: '', name: '', subCategories: [{ code: '', name: '' }] });
    this.cdr.markForCheck();
  }

  loadDepartments() {
    this.deptError = '';
    this.deptCategoriesMessage = '';
    this.deptCategoriesError = '';
    this.deptLoading = true;
    this.http.get<any>(`${this.adminApi}/auth/departments`, { headers: this.authHeaders() }).subscribe({
      next: res => {
        const central = res?.centralGovernmentDepartments;
        const state = res?.stateGovernmentDepartments;
        this.centralDepartments = Array.isArray(central) ? central : [];
        this.stateDepartments = Array.isArray(state) ? state : [];
        this.departments = Array.isArray(res) ? res : [...this.centralDepartments, ...this.stateDepartments];
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

  loadDeptCategories(deptId: string) {
    if (!deptId) return;
    this.deptCategoriesMessage = '';
    this.deptCategoriesError = '';
    this.http.get(`${this.adminApi}/auth/departments/${deptId}/categories`, { headers: this.authHeaders() }).subscribe({
      next: res => {
        this.deptCategoriesMessage = `Categories for ${deptId}: ${JSON.stringify(res)}`;
        this.cdr.markForCheck();
      },
      error: err => {
        this.deptCategoriesError = this.readError(err);
        this.cdr.markForCheck();
      }
    });
  }

  addDepartment() {
    this.addDeptError = '';
    this.addDeptSuccess = false;
    if (!this.newDept.id.trim() || !this.newDept.name.trim()) {
      this.addDeptError = 'Department ID and name are required.';
      this.cdr.markForCheck();
      return;
    }
    const cleanedCategories = this.newDept.categories
      .map(cat => ({
        code: cat.code.trim(),
        name: cat.name.trim(),
        subCategories: (cat.subCategories || []).map(sub => ({
          code: sub.code.trim(),
          name: sub.name.trim()
        }))
      }))
      .filter(cat => cat.code && cat.name)
      .map(cat => ({
        ...cat,
        subCategories: cat.subCategories.filter(sub => sub.code && sub.name)
      }));

    if (!cleanedCategories.length) {
      this.addDeptError = 'At least one category with code and name is required.';
      this.cdr.markForCheck();
      return;
    }

    const payload = {
      id: this.newDept.id.trim(),
      name: this.newDept.name.trim(),
      level: this.newDept.level,
      categories: cleanedCategories
    };
    this.addDeptSubmitting = true;
    this.cdr.markForCheck();
    this.http.post(`${this.adminApi}/auth/admin/departments/add-department`, payload, { headers: this.authHeaders() }).subscribe({
      next: () => {
        this.addDeptSuccess = true;
        this.addDeptSubmitting = false;
        this.newDept = this.blankDept();
        this.loadDepartments();
        this.cdr.markForCheck();
      },
      error: err => {
        this.addDeptError = this.readError(err);
        this.addDeptSubmitting = false;
        this.cdr.markForCheck();
      }
    });
  }

  deleteDepartment(deptId: string) {
    if (!deptId.trim()) {
      this.deleteError = 'Department ID is required to delete.';
      this.cdr.markForCheck();
      return;
    }
    this.deleteSubmitting = true;
    this.deleteSuccess = '';
    this.deleteError = '';
    this.cdr.markForCheck();
    // Use direct path so proxy handles base (no /api prefix baked in)
    this.http.delete(`/auth/admin/departments/${deptId}`, { headers: this.authHeaders() }).subscribe({
      next: () => {
        this.deleteSuccess = `Department ${deptId} deleted.`;
        this.deleteSubmitting = false;
        this.loadDepartments();
        this.cdr.markForCheck();
      },
      error: err => {
        this.deleteError = this.readError(err);
        this.deleteSubmitting = false;
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

  private blankDept() {
    return {
      id: '',
      name: '',
      level: 'STATE',
      categories: [
        {
          code: '',
          name: '',
          subCategories: [{ code: '', name: '' }]
        }
      ]
    };
  }
}
