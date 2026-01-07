import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-admin-departments',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <section class="admin-shell">
      <header class="admin-header">
        <div>
          <p class="eyebrow">Admin Console</p>
          <h1>Add Department</h1>
          <p class="subtitle">Create a department and then onboard its Department Officers.</p>
        </div>
      </header>

      <section class="card">
        <div class="card-head">
          <h2>Add department</h2>
          <p class="helper">Enter department details and at least one category (with optional sub-categories).</p>
        </div>
        <div class="form-grid two-column">
          <div>
            <label class="field-label">Department ID</label>
            <input class="field" [(ngModel)]="newDept.id" />
            <div class="field-error" *ngIf="showDeptValidation && !newDept.id.trim()">Department ID is required.</div>
          </div>
          <div>
            <label class="field-label">Name</label>
            <input class="field" [(ngModel)]="newDept.name" />
            <div class="field-error" *ngIf="showDeptValidation && !newDept.name.trim()">Name is required.</div>
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
                <div class="field-error" *ngIf="showDeptValidation && !cat.code.trim()">Category code is required.</div>
              </div>
              <div>
                <label class="field-label">Category name</label>
                <input class="field" [(ngModel)]="cat.name" />
                <div class="field-error" *ngIf="showDeptValidation && !cat.name.trim()">Category name is required.</div>
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
                <button class="chip danger" type="button" (click)="removeSubcategory(i, j)" *ngIf="cat.subCategories.length > 1">Remove</button>
              </div>
              <div class="field-error" *ngIf="showDeptValidation && !isSubcatValid(cat)">At least one sub-category with code and name is required.</div>
            </div>
            <div class="cat-actions">
              <button class="chip danger" type="button" (click)="removeCategoryRow(i)">Remove category</button>
            </div>
          </div>
        </div>
        <div class="actions">
          <button class="button" type="button" (click)="addDepartment()" [disabled]="addDeptSubmitting || !isDeptFormValid()">
            {{ addDeptSubmitting ? 'Adding...' : 'Add Department' }}
          </button>
          <button class="button secondary" type="button" (click)="resetForm()" [disabled]="addDeptSubmitting">Reset</button>
        </div>
        <div class="response success" *ngIf="addDeptSuccess">
          <div>Department added. Now add Department Officers.</div>
          <button class="chip" type="button" (click)="goToDepartmentOfficers()">Go to Department Officers</button>
        </div>
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
    .card{background:var(--panel);border:1px solid var(--border);border-radius:14px;padding:1rem;display:flex;flex-direction:column;gap:.6rem;box-shadow:0 10px 22px rgba(28,39,56,0.08)}
    .card-head{display:flex;justify-content:space-between;align-items:flex-start;gap:.75rem;flex-wrap:wrap}
    .card-head h2{margin:0;font-size:1.05rem}
    .helper{margin:0;color:var(--muted)}
    .form-grid{display:grid;gap:.5rem}
    .form-grid.two-column{grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:.6rem}
    .field-label{font-size:.75rem;color:var(--muted);text-transform:uppercase;letter-spacing:.12em}
    .field{border:1px solid var(--border);border-radius:10px;padding:.6rem .75rem;font:inherit;background:#fff}
    .field.small{padding:.45rem .6rem;max-width:200px}
    .field-error{color:#b42318;font-size:.85rem}
    .actions{display:flex;gap:.5rem;flex-wrap:wrap}
    .button{border:none;border-radius:999px;background:var(--accent);color:#fff;padding:.55rem 1.1rem;font-weight:700;cursor:pointer;box-shadow:0 8px 18px rgba(31,79,147,0.2)}
    .button[disabled]{opacity:.6;cursor:not-allowed;box-shadow:none}
    .response{border-radius:10px;padding:.6rem .75rem;font-size:.85rem}
    .response.success{background:#ecfdf3;color:#166534;border:1px solid #bbf7d0;display:flex;align-items:center;gap:.5rem;flex-wrap:wrap}
    .response.error{background:#fff1f2;color:#9f1239;border:1px solid #fecdd3}
    .category-form{display:flex;flex-direction:column;gap:.6rem;border:1px dashed var(--border);border-radius:12px;padding:.75rem;background:#f9faff}
    .category-header{display:flex;justify-content:space-between;align-items:center;gap:.5rem;flex-wrap:wrap}
    .category-row{border:1px solid var(--border);border-radius:12px;padding:.75rem;display:flex;flex-direction:column;gap:.5rem;background:#fff}
    .subcat-list{display:flex;flex-direction:column;gap:.35rem}
    .subcat-header{display:flex;justify-content:space-between;align-items:center}
    .subcat-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:.4rem;align-items:center}
    .cat-actions{display:flex;justify-content:flex-end}
    .chip{border:none;border-radius:10px;padding:.4rem .75rem;background:#eef2fb;color:#1f4f93;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:.25rem}
    .chip.danger{background:#fff1f2;color:#b42318;min-width:96px;justify-content:center}
    @media (max-width:768px){
      .admin-shell{padding:1rem}
      .card{padding:.9rem}
      .form-grid.two-column{grid-template-columns:1fr}
      .category-header{flex-direction:column;align-items:flex-start}
    }
    @media (max-width:560px){
      .subcat-row{grid-template-columns:1fr}
      .actions{flex-direction:column}
      .button{width:100%;justify-content:center}
    }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDepartmentsComponent {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private adminApi = this.auth.getBaseUrl();

  newDept = this.blankDept();
  addDeptSubmitting = false;
  addDeptSuccess = false;
  addDeptError = '';
  showDeptValidation = false;

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

  isDeptFormValid() {
    if (!this.newDept.id.trim() || !this.newDept.name.trim()) {
      return false;
    }
    const cleaned = this.cleanCategories();
    return cleaned.length > 0 && cleaned.every(cat => cat.subCategories.length > 0);
  }

  isSubcatValid(cat: { subCategories: { code: string; name: string }[] }) {
    return (cat.subCategories || []).some(sub => sub.code.trim() && sub.name.trim());
  }

  private cleanCategories() {
    return this.newDept.categories
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
  }

  addCategoryBlock() {
    this.newDept.categories.push({ code: '', name: '', subCategories: [{ code: '', name: '' }] });
    this.cdr.markForCheck();
  }

  resetForm() {
    this.newDept = this.blankDept();
    this.addDeptError = '';
    this.addDeptSuccess = false;
    this.showDeptValidation = false;
    this.cdr.markForCheck();
  }

  addDepartment() {
    this.addDeptError = '';
    this.addDeptSuccess = false;
    this.showDeptValidation = true;
    if (!this.isDeptFormValid()) {
      this.addDeptError = 'Please fill required department, category, and sub-category details.';
      this.cdr.markForCheck();
      return;
    }
    const cleanedCategories = this.cleanCategories();

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
        this.showDeptValidation = false;
        this.cdr.markForCheck();
      },
      error: err => {
        this.addDeptError = this.readError(err);
        this.addDeptSubmitting = false;
        this.cdr.markForCheck();
      }
    });
  }

  goToDepartmentOfficers() {
    this.router.navigateByUrl('/admin/department-officers');
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
