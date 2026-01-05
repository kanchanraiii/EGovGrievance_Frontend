import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

type Grievance = {
  id?: string;
  grievanceId?: string;
  departmentId?: string;
  categoryCode?: string;
  subCategoryCode?: string;
  description?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="page-frame">
      <header class="page-header">
        <div>
          <p class="eyebrow">My Grievances</p>
          <h1>Track and update your submissions</h1>
          <p class="subtitle">
            View all your grievances in one place. Open a grievance to see details or share a rating once it’s resolved.
          </p>
        </div>
        <button class="button" type="button" (click)="toggleLodge()" [attr.aria-expanded]="showLodgeForm()">
          {{ showLodgeForm() ? 'Close form' : 'Lodge a grievance' }}
        </button>
      </header>

      <div class="layout">
        <section class="card lodge" *ngIf="showLodgeForm()">
          <div class="card-head">
            <h2>Lodge a grievance</h2>
            <p class="helper">Fill in the details below. All fields are required.</p>
          </div>
          <div class="form-grid two-column">
            <div>
              <label class="field-label">Department ID</label>
              <input class="field" [(ngModel)]="grievanceForm.departmentId" />
            </div>
            <div>
              <label class="field-label">Category Code</label>
              <input class="field" [(ngModel)]="grievanceForm.categoryCode" />
            </div>
            <div>
              <label class="field-label">Sub-category Code</label>
              <input class="field" [(ngModel)]="grievanceForm.subCategoryCode" />
            </div>
            <div class="full">
              <label class="field-label">Description</label>
              <textarea class="field field-textarea" rows="4" [(ngModel)]="grievanceForm.description"></textarea>
            </div>
          </div>
          <div class="actions">
            <button class="button" type="button" (click)="createGrievance()">Submit grievance</button>
          </div>
          <div class="response error" *ngIf="grievanceError">{{ grievanceError }}</div>
          <div class="response success" *ngIf="grievanceResult">Grievance submitted successfully.</div>
        </section>

        <div class="columns">
          <section class="card list">
            <div class="card-head">
              <h2>Your grievances</h2>
              <p class="helper">Automatically loaded from your account.</p>
            </div>
            <div class="response error" *ngIf="myGrievancesError">{{ myGrievancesError }}</div>
            <div class="empty" *ngIf="!myGrievancesError && grievances.length === 0">
              No grievances found. Click “Lodge a grievance” to submit one.
            </div>
            <ul class="grievance-list" *ngIf="grievances.length">
              <li
                *ngFor="let item of grievances"
                (click)="selectGrievance(item)"
                [class.active]="selectedId === getId(item)"
              >
                <div class="grievance-title">
                  <span class="badge">{{ item.status || 'Pending' }}</span>
                  <span class="id-text">ID: {{ getId(item) }}</span>
                </div>
                <div class="grievance-meta">
                  <div>
                    <strong>Department:</strong> {{ item.departmentId || '—' }}
                  </div>
                  <div>
                    <strong>Category:</strong> {{ item.categoryCode || '—' }}
                  </div>
                </div>
                <p class="grievance-desc">{{ item.description || 'No description provided.' }}</p>
              </li>
            </ul>
          </section>

          <section class="card detail" *ngIf="selectedGrievance">
            <div class="card-head">
              <h2>Grievance details</h2>
              <p class="helper">Review information and share your rating.</p>
            </div>
            <div class="detail-grid">
              <div><span class="muted">Tracking ID</span><div>{{ getId(selectedGrievance) }}</div></div>
              <div><span class="muted">Status</span><div class="badge large">{{ selectedGrievance.status || 'Pending' }}</div></div>
              <div><span class="muted">Department</span><div>{{ selectedGrievance.departmentId || '—' }}</div></div>
              <div><span class="muted">Category</span><div>{{ selectedGrievance.categoryCode || '—' }}</div></div>
              <div><span class="muted">Sub-category</span><div>{{ selectedGrievance.subCategoryCode || '—' }}</div></div>
              <div><span class="muted">Updated</span><div>{{ selectedGrievance.updatedAt || '—' }}</div></div>
            </div>
            <div class="detail-section">
              <span class="muted">Description</span>
              <p class="grievance-desc">{{ selectedGrievance.description || 'No description provided.' }}</p>
            </div>

            <div class="rating-block">
              <h3>Rate this grievance</h3>
              <p class="helper">Scores from 1 (poor) to 5 (excellent).</p>
              <div class="rating-inputs">
                <label *ngFor="let n of ratingOptions">
                  <input type="radio" name="score" [value]="n" [(ngModel)]="ratingScore" />
                  <span>{{ n }}</span>
                </label>
              </div>
              <div class="actions">
                <button class="button" type="button" (click)="postRating()" [disabled]="!ratingScore">
                  Submit rating
                </button>
              </div>
              <div class="response error" *ngIf="ratingError">{{ ratingError }}</div>
              <div class="response success" *ngIf="ratingResult">Thank you for your feedback.</div>
            </div>
          </section>
        </div>
      </div>
    </section>
  `,
  styles: [
    `:host{display:block}
    .page-frame{min-height:calc(100vh - 3rem);background:linear-gradient(180deg,#ffffff 0%,#f5f7fb 100%);border-radius:16px;box-shadow:var(--shadow);padding:1.75rem;display:flex;flex-direction:column;gap:1.5rem}
    .page-header{display:flex;gap:1rem;align-items:flex-start;justify-content:space-between;flex-wrap:wrap}
    .eyebrow{text-transform:uppercase;letter-spacing:.18em;font-size:.72rem;color:var(--accent-2);margin:0 0 .35rem}
    h1{margin:0 0 .35rem;font-size:2rem;color:var(--ink)}
    .subtitle{margin:0;color:var(--muted);max-width:720px}
    .layout{display:flex;flex-direction:column;gap:1rem}
    .columns{display:grid;grid-template-columns:1.1fr 1fr;gap:1rem;align-items:start}
    .card{background:var(--panel);border:1px solid var(--border);border-radius:14px;padding:1.25rem;display:flex;flex-direction:column;gap:.6rem;box-shadow:0 10px 24px rgba(28,39,56,0.06)}
    .card-head h2{margin:0;font-size:1.15rem}
    .helper{margin:0;color:var(--muted);font-size:.9rem}
    .lodge{border:1px solid #d8e3ff;background:linear-gradient(180deg,#f5f8ff 0%,#eef4ff 100%)}
    .form-grid{display:grid;gap:.5rem}
    .form-grid.two-column{grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:.75rem}
    .form-grid.two-column .full{grid-column:1/-1}
    .field-label{font-size:.75rem;color:var(--muted);text-transform:uppercase;letter-spacing:.12em}
    .field{border:1px solid var(--border);border-radius:10px;padding:.6rem .75rem;font:inherit;background:#fff}
    .field-textarea{resize:vertical}
    .actions{display:flex;gap:.6rem;flex-wrap:wrap}
    .button{border:none;border-radius:999px;background:var(--accent);color:#fff;padding:.55rem 1.1rem;font-weight:600;cursor:pointer;box-shadow:0 8px 18px rgba(31,79,147,0.2)}
    .button[disabled]{opacity:.5;cursor:not-allowed;box-shadow:none}
    .button.ghost{background:#eef2fb;color:var(--accent);box-shadow:none;border:1px solid rgba(31,79,147,0.2)}
    .response{margin-top:.4rem;border-radius:10px;padding:.6rem .75rem;font-size:.85rem}
    .response.error{background:#fff1f2;color:#9f1239;border:1px solid #fecdd3}
    .response.success{background:#ecfdf3;color:#166534;border:1px solid #bbf7d0}
    .grievance-list{list-style:none;padding:0;margin:.2rem 0 0;display:flex;flex-direction:column;gap:.6rem}
    .grievance-list li{border:1px solid var(--border);border-radius:12px;padding:.75rem;background:#fff;cursor:pointer;transition:border-color .2s ease,box-shadow .2s ease}
    .grievance-list li:hover{border-color:#d0d9f2;box-shadow:0 10px 18px rgba(31,79,147,0.08)}
    .grievance-list li.active{border-color:#1f4f93;box-shadow:0 10px 20px rgba(31,79,147,0.12)}
    .grievance-title{display:flex;align-items:center;gap:.5rem;flex-wrap:wrap}
    .id-text{color:var(--muted);font-size:.88rem}
    .badge{display:inline-flex;align-items:center;justify-content:center;border-radius:999px;padding:.2rem .6rem;font-weight:700;font-size:.8rem;background:#eef2fb;color:#1f4f93}
    .badge.large{font-size:.9rem;padding:.35rem .8rem}
    .grievance-meta{display:flex;gap:1rem;flex-wrap:wrap;color:var(--muted);font-size:.9rem;margin:.25rem 0}
    .grievance-desc{margin:.15rem 0 0;color:var(--ink);font-size:.95rem;line-height:1.45}
    .empty{padding:1rem;border:1px dashed var(--border);border-radius:12px;color:var(--muted);background:#fafbff}
    .detail-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:.6rem}
    .muted{color:var(--muted);font-size:.85rem}
    .detail-section{display:flex;flex-direction:column;gap:.35rem}
    .rating-block{margin-top:.6rem;padding-top:.6rem;border-top:1px solid var(--border);display:flex;flex-direction:column;gap:.4rem}
    .rating-inputs{display:flex;gap:.5rem;flex-wrap:wrap}
    .rating-inputs label{display:flex;align-items:center;gap:.25rem;border:1px solid var(--border);border-radius:10px;padding:.35rem .6rem;background:#fff;cursor:pointer}
    .rating-inputs input{accent-color:var(--accent)}
    @media (max-width:1080px){.columns{grid-template-columns:1fr}}
    @media (max-width:720px){.page-frame{padding:1.25rem}}
    `,
  ],
})
export class HomeComponent implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private router = inject(Router);

  grievances: Grievance[] = [];
  selectedGrievance: Grievance | null = null;
  selectedId = '';
  ratingOptions = [1, 2, 3, 4, 5];
  ratingScore: number | null = null;

  grievanceForm = {
    departmentId: 'STATE_PWD',
    categoryCode: 'ROAD_INFRASTRUCTURE',
    subCategoryCode: 'ROAD_DAMAGE',
    description: ''
  };

  grievanceResult = false;
  grievanceError = '';
  myGrievancesError = '';
  ratingResult = false;
  ratingError = '';

  showLodgeForm = signal(false);

  ngOnInit(): void {
    this.loadMyGrievances();
  }

  toggleLodge() {
    this.showLodgeForm.update(v => !v);
  }

  getId(item: Grievance) {
    return item.grievanceId || item.id || '';
  }

  selectGrievance(item: Grievance) {
    this.selectedGrievance = item;
    this.selectedId = this.getId(item);
    this.ratingScore = null;
    this.ratingError = '';
    this.ratingResult = false;
  }

  createGrievance() {
    this.grievanceError = '';
    this.grievanceResult = false;
    if (!this.isFormValid()) {
      this.grievanceError = 'All fields are required before submitting.';
      return;
    }
    this.http
      .post(`${this.auth.getBaseUrl()}/grievance-service/api/grievances/create`, this.grievanceForm, {
        headers: this.authHeaders()
      })
      .subscribe({
        next: res => {
          this.grievanceResult = true;
          this.showLodgeForm.set(false);
          this.loadMyGrievances(true, res as Grievance);
        },
        error: err => (this.grievanceError = this.readError(err))
      });
  }

  loadMyGrievances(selectNew = false, newItem?: Grievance) {
    this.myGrievancesError = '';
    this.http.get<Grievance[]>(`${this.auth.getBaseUrl()}/grievance-service/api/grievances/my`, { headers: this.authHeaders() }).subscribe({
      next: res => {
        this.grievances = Array.isArray(res) ? res : [];
        if (newItem) {
          this.grievances = [newItem, ...this.grievances];
        }
        if (this.grievances.length && (selectNew || !this.selectedGrievance)) {
          this.selectGrievance(this.grievances[0]);
        }
      },
      error: err => (this.myGrievancesError = this.readError(err))
    });
  }

  postRating() {
    this.ratingError = '';
    this.ratingResult = false;
    if (!this.selectedId) {
      this.ratingError = 'Select a grievance first.';
      return;
    }
    if (!this.ratingScore) {
      this.ratingError = 'Choose a score between 1 and 5.';
      return;
    }
    const payload = { grievanceId: this.selectedId, score: this.ratingScore };
    this.http
      .post(`${this.auth.getBaseUrl()}/feedback-service/api/feedback/ratings`, payload, {
        headers: this.authHeaders()
      })
      .subscribe({
        next: () => (this.ratingResult = true),
        error: err => (this.ratingError = this.readError(err))
      });
  }

  logout() {
    this.auth.clearToken();
    this.router.navigateByUrl('/auth');
  }

  private isFormValid() {
    return (
      this.grievanceForm.departmentId.trim() &&
      this.grievanceForm.categoryCode.trim() &&
      this.grievanceForm.subCategoryCode.trim() &&
      this.grievanceForm.description.trim()
    );
  }

  private authHeaders() {
    const trimmed = this.auth.getToken().trim();
    return trimmed
      ? new HttpHeaders({ Authorization: `Bearer ${trimmed}`, 'Content-Type': 'application/json' })
      : new HttpHeaders({ 'Content-Type': 'application/json' });
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
