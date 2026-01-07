import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-admin-do',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl:'./admin-do.html',
  styleUrl:'./admin-do.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDoComponent {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  form = { fullName: '', email: '', phone: '', password: '', departmentId: '' };
  submitting = false;
  success = false;
  error = '';











  registerDO(form?: import('@angular/forms').NgForm) {
    this.error = '';
    this.success = false;
    if (form && form.invalid) {
      this.error = 'Please fix validation errors.';
      form.form.markAllAsTouched();
      this.cdr.markForCheck();
      return;
    }

    // Fallback basic check
    if (!this.form.fullName.trim() || !this.form.email.trim() || !this.form.password.trim() || !this.form.departmentId.trim()) {
      this.error = 'All fields are required.';
      this.cdr.markForCheck();
      return;
    }

    this.submitting = true;
    this.cdr.markForCheck();
    this.http
      .post(`${this.auth.getBaseUrl()}/auth/department-officer/register`, this.form, { headers: this.authHeaders() })
      .subscribe({
        next: () => {
          this.success = true;
          this.submitting = false;
          this.form = { fullName: '', email: '', phone: '', password: '', departmentId: '' };
          this.cdr.markForCheck();
        },

        error: err => {
          this.error = this.readError(err);
          this.submitting = false;
          this.cdr.markForCheck();
        }
      });
  }

  resetForm(form?: import('@angular/forms').NgForm) {
    // reset model and form state
    this.form = { fullName: '', email: '', phone: '', password: '', departmentId: '' };
    this.success = false;
    this.error = '';

    if (form) {
      // reset Angular form and set model values
      form.resetForm(this.form);
    }
    this.cdr.markForCheck();
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
