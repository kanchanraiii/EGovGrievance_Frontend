import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../auth/auth.service';

type SubCategory = {
  code: string;
  name: string;
};

type Category = {
  code: string;
  name: string;
  subCategories?: SubCategory[];
};

type Department = {
  id: string;
  name: string;
  level?: string;
  categories?: Category[];
};

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
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  grievances: Grievance[] = [];
  selectedId = '';
  ratingOptions = [1, 2, 3, 4, 5];
  ratingScore: number | null = null;

  departments: Department[] = [];
  categoryOptions: Category[] = [];
  subCategoryOptions: SubCategory[] = [];
  departmentsLoading = false;
  departmentsError = '';
  myGrievancesLoading = false;
  grievanceSubmitting = false;

  grievanceForm = {
    departmentId: '',
    categoryCode: '',
    subCategoryCode: '',
    description: ''
  };

  grievanceResult = false;
  grievanceError = '';
  myGrievancesError = '';
  ratingResult = false;
  ratingError = '';

  showLodgeForm = signal(false);

  ngOnInit(): void {
    this.fetchDepartments();
    this.loadMyGrievances();
  }

  toggleLodge() {
    this.showLodgeForm.update(v => !v);
  }

  getId(item: Grievance) {
    return item.grievanceId || item.id || '';
  }

  selectGrievance(item: Grievance) {
    const id = this.getId(item);
    if (!id) return;
    this.selectedId = id;
    this.ratingScore = null;
    this.ratingError = '';
    this.ratingResult = false;
  }

  toggleGrievance(item: Grievance) {
    const id = this.getId(item);
    if (!id) return;
    if (this.selectedId === id) {
      this.selectedId = '';
      this.ratingScore = null;
      this.ratingError = '';
      this.ratingResult = false;
      return;
    }
    this.selectGrievance(item);
  }

  isResolved(item: Grievance) {
    return this.isResolvedStatus(item.status);
  }

  fetchDepartments() {
    this.departmentsLoading = true;
    this.departmentsError = '';
    this.http.get<Department[]>('http://localhost:3006/stateGovernmentDepartments').subscribe({
      next: res => {
        this.departments = Array.isArray(res) ? res : [];
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

  onDepartmentChange(deptId: string) {
    this.grievanceForm.departmentId = deptId;
    const dept = this.departments.find(d => d.id === deptId);
    this.categoryOptions = dept?.categories ?? [];
    this.subCategoryOptions = [];
    this.grievanceForm.categoryCode = '';
    this.grievanceForm.subCategoryCode = '';
  }

  onCategoryChange(categoryCode: string) {
    this.grievanceForm.categoryCode = categoryCode;
    const category = this.categoryOptions.find(c => c.code === categoryCode);
    this.subCategoryOptions = category?.subCategories ?? [];
    this.grievanceForm.subCategoryCode = '';
  }

  onSubCategoryChange(subCategoryCode: string) {
    this.grievanceForm.subCategoryCode = subCategoryCode;
  }

  createGrievance() {
    this.log('createGrievance:clicked', { form: this.grievanceForm });
    this.grievanceError = '';
    this.grievanceResult = false;
    if (!this.isFormValid()) {
      this.grievanceError = 'All fields are required before submitting.';
      this.log('createGrievance:validation_failed', { grievanceError: this.grievanceError });
      return;
    }
    this.grievanceSubmitting = true;
    this.cdr.markForCheck();
    this.log('createGrievance:posting', { form: this.grievanceForm });
    this.http
      .post(`${this.auth.getBaseUrl()}/grievance-service/api/grievances/create`, this.grievanceForm, {
        headers: this.authHeaders()
      })
      .pipe(
        finalize(() => {
          this.grievanceSubmitting = false;
          this.cdr.markForCheck();
          this.log('createGrievance:finalize');
        })
      )
      .subscribe({
        next: res => {
          this.grievanceResult = true;
          this.showLodgeForm.set(false);
          this.loadMyGrievances(res as Grievance);
          this.cdr.markForCheck();
          this.log('createGrievance:success', { response: res });
        },
        error: err => {
          this.grievanceError = this.readError(err);
          this.cdr.markForCheck();
          this.log('createGrievance:error', { error: this.grievanceError });
        }
      });
  }

  loadMyGrievances(newItem?: Grievance) {
    this.log('loadMyGrievances:start', { newItem });
    this.myGrievancesError = '';
    this.myGrievancesLoading = true;
    this.http.get<Grievance[]>(`${this.auth.getBaseUrl()}/grievance-service/api/grievances/my`, { headers: this.authHeaders() }).subscribe({
      next: res => {
        this.grievances = Array.isArray(res) ? res : [];
        if (newItem) {
          this.grievances = [newItem, ...this.grievances];
        }
        const stillSelected = this.grievances.some(item => this.getId(item) === this.selectedId);
        if (!stillSelected) {
          this.selectedId = '';
          this.ratingScore = null;
        }
        this.log('loadMyGrievances:success', { count: this.grievances.length });
        this.myGrievancesLoading = false;
        this.cdr.markForCheck();
      },
      error: err => {
        this.myGrievancesError = this.readError(err);
        this.log('loadMyGrievances:error', { error: this.myGrievancesError });
        this.myGrievancesLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  postRating() {
    this.ratingError = '';
    this.ratingResult = false;
    if (!this.selectedId) {
      this.ratingError = 'Select a grievance first.';
      return;
    }
    const selected = this.grievances.find(item => this.getId(item) === this.selectedId);
    if (!this.isResolvedStatus(selected?.status)) {
      this.ratingError = 'You can rate only after the grievance is resolved.';
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
        next: () => {
          this.ratingResult = true;
          this.cdr.markForCheck();
        },
        error: err => {
          this.ratingError = this.readError(err);
          this.cdr.markForCheck();
        }
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

  private isResolvedStatus(status?: string) {
    return (status || '').trim().toLowerCase() === 'resolved';
  }

  private log(message: string, data?: unknown) {
    const ts = new Date().toISOString();
    if (data !== undefined) {
      console.log(`[${ts}] [Grievance] ${message}`, data);
    } else {
      console.log(`[${ts}] [Grievance] ${message}`);
    }
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
