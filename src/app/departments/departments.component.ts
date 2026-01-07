import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-departments',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './departments.component.html',
  styleUrls: ['./departments.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DepartmentsComponent implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  stateDepartments: any[] = [];
  centralDepartments: any[] = [];
  stateLoading = false;
  centralLoading = false;
  stateError = '';
  centralError = '';

  ngOnInit(): void {
    this.loadDepartments();
  }

  reload() {
    this.loadDepartments();
  }

  trackDept(index: number, dept: any) {
    return dept?.id ?? dept?.code ?? dept?.departmentId ?? `${index}-${this.getName(dept)}`;
  }

  getName(dept: any) {
    return dept?.name || dept?.departmentName || dept?.deptName || dept?.title || 'Department';
  }

  getLevel(dept: any) {
    return dept?.level || dept?.departmentLevel || dept?.type || '';
  }

  private loadDepartments() {
    this.stateLoading = true;
    this.centralLoading = true;
    this.stateError = '';
    this.centralError = '';

    this.http.get<any>(`${this.auth.getBaseUrl()}/auth/departments`, { headers: this.authHeaders() }).subscribe({
      next: res => {
        this.stateDepartments = Array.isArray(res?.stateGovernmentDepartments) ? res.stateGovernmentDepartments : [];
        this.centralDepartments = Array.isArray(res?.centralGovernmentDepartments)
          ? res.centralGovernmentDepartments
          : [];
        this.stateLoading = false;
        this.centralLoading = false;
        this.cdr.markForCheck();
      },
      error: err => {
        const msg = this.readError(err);
        this.stateError = msg;
        this.centralError = msg;
        this.stateLoading = false;
        this.centralLoading = false;
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
      if (typeof error.error === 'string') {
        return error.error;
      }
      return error.error?.message || error.message;
    }
    return String(error);
  }
}
