import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { forkJoin } from 'rxjs';

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

    forkJoin({
      state: this.http.get<any[]>('http://20.244.2.109:3006/stateGovernmentDepartments'),
      central: this.http.get<any[]>('http://20.244.2.109:3006/centralGovernmentDepartments')
    }).subscribe({
      next: res => {
        this.stateDepartments = Array.isArray(res.state) ? res.state : [];
        this.centralDepartments = Array.isArray(res.central) ? res.central : [];
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
