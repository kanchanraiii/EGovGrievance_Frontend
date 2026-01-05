import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../auth/auth.service';

type Category = {
  code: string;
  name: string;
  subCategories?: Array<{ code: string; name: string }>;
};

type DepartmentMeta = {
  id: string;
  name: string;
  level?: string;
  state?: string;
  categories?: Category[];
};

@Component({
  selector: 'app-admin-department-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section class="admin-shell">
      <header class="admin-header">
        <div>
          <p class="eyebrow">Admin Console</p>
          <h1>Department: {{ deptId }}</h1>
          <p class="subtitle">View categories and manage them for this department.</p>
        </div>
        <a class="chip-link" routerLink="/admin/departments">← Back to departments</a>
      </header>

      <section class="card">
        <div class="card-head">
          <h2>Categories</h2>
          <p class="helper">Existing categories for this department.</p>
        </div>
        <div class="actions">
          <button class="button ghost" type="button" (click)="loadCategories()" [disabled]="loading">
            {{ loading ? 'Loading...' : 'Refresh' }}
          </button>
          <span class="muted" *ngIf="categories.length">Loaded {{ categories.length }} categories.</span>
        </div>
        <div class="response error" *ngIf="error">{{ error }}</div>
        <div class="category-list" *ngIf="categories.length">
          <div class="category-card" *ngFor="let cat of categories">
          <div class="category-head">
            <div>
              <div class="cat-title">{{ cat.name }}</div>
              <div class="muted">Code: {{ cat.code }}</div>
            </div>
          </div>
            <div class="subcats" *ngIf="cat.subCategories?.length">
              <div class="subcat" *ngFor="let sub of cat.subCategories">
                <span class="subcat-code">{{ sub.code }}</span>
                <span>{{ sub.name }}</span>
              </div>
            </div>
            <div class="muted" *ngIf="!cat.subCategories?.length">No sub-categories.</div>
          </div>
        </div>
        <div class="response warn" *ngIf="!loading && !error && !categories.length">No categories returned.</div>
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
    .actions{display:flex;gap:.5rem;flex-wrap:wrap}
    .button{border:none;border-radius:999px;background:var(--accent);color:#fff;padding:.55rem 1.1rem;font-weight:700;cursor:pointer;box-shadow:0 8px 18px rgba(31,79,147,0.2)}
    .button.ghost{background:#eef2fb;color:var(--accent);box-shadow:none;border:1px solid rgba(31,79,147,0.2)}
    .button[disabled]{opacity:.6;cursor:not-allowed;box-shadow:none}
    .response{border-radius:10px;padding:.6rem .75rem;font-size:.85rem}
    .response.success{background:#ecfdf3;color:#166534;border:1px solid #bbf7d0}
    .response.error{background:#fff1f2;color:#9f1239;border:1px solid #fecdd3}
    .response.warn{background:#fff7ed;color:#b45309;border:1px solid #fed7aa}
    .category-list{display:flex;flex-direction:column;gap:.6rem;max-height:520px;overflow:auto;padding-right:.25rem}
    .category-card{border:1px solid var(--border);border-radius:12px;padding:.75rem;background:#fff;display:flex;flex-direction:column;gap:.4rem}
    .category-head{display:flex;justify-content:space-between;gap:.6rem;align-items:flex-start}
    .cat-title{font-weight:700}
    .muted{color:var(--muted);font-size:.9rem}
    .chip{border:none;border-radius:10px;padding:.4rem .75rem;background:#eef2fb;color:#1f4f93;cursor:pointer}
    .chip.danger{background:#fff1f2;color:#b42318}
    .subcats{display:flex;flex-direction:column;gap:.35rem}
    .subcat{display:flex;gap:.5rem;align-items:center}
    .subcat-code{display:inline-block;border:1px solid var(--border);border-radius:8px;padding:.2rem .5rem;background:#f7f8fc;font-weight:700}
    .form-grid{display:grid;gap:.5rem}
    .field-label{font-size:.75rem;color:var(--muted);text-transform:uppercase;letter-spacing:.12em}
    .field{border:1px solid var(--border);border-radius:10px;padding:.6rem .75rem;font:inherit;background:#fff}
    .field-textarea{resize:vertical;border:1px solid var(--border);border-radius:10px;padding:.6rem .75rem;font:inherit;background:#fff}
    .chip-link{border:1px solid var(--border);border-radius:10px;padding:.4rem .75rem;text-decoration:none;color:var(--accent);background:#eef2fb}
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDepartmentDetailComponent implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);

  deptId = '';
  deptMeta: DepartmentMeta | null = null;
  categories: Category[] = [];
  loading = false;
  error = '';

  ngOnInit(): void {
    this.deptId = this.route.snapshot.paramMap.get('id') ?? '';
    this.loadDeptMeta();
  }

  loadCategories() {
    if (!this.deptId) return;
    this.loading = true;
    this.error = '';
    this.http.get<Category[]>(`${this.auth.getBaseUrl()}/auth/departments/${this.deptId}/categories`, { headers: this.authHeaders() }).subscribe({
      next: res => {
        this.categories = Array.isArray(res) ? res : [];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: err => {
        this.error = this.readError(err);
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  addCategory() {
  }

  private loadDeptMeta() {
    this.loading = true;
    this.http.get<any>(`${this.auth.getBaseUrl()}/auth/departments`, { headers: this.authHeaders() }).subscribe({
      next: res => {
        const central = res?.centralGovernmentDepartments || [];
        const state = res?.stateGovernmentDepartments || [];
        const found =
          [...central, ...state].find((dept: DepartmentMeta) => dept.id === this.deptId) || null;
        this.deptMeta = found;
        // If categories already available from meta, use them; still fetch latest categories endpoint to be safe
        if (found?.categories?.length) {
          this.categories = found.categories;
        }
        this.loadCategories();
      },
      error: err => {
        this.error = this.readError(err);
        this.loading = false;
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
