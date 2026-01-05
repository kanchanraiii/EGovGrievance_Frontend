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
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
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
