import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-admin-supervisors',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl:'./admin-supervisors.html' ,
  styleUrl:'./admin-supervisors.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminSupervisorsComponent {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  soForm = { fullName: '', email: '', phone: '', password: '' };
  soSubmitting = false;
  soSuccess = false;
  soError = '';

  registerSO(form?: import('@angular/forms').NgForm) {
    this.soError = '';
    this.soSuccess = false;
    if (form && form.invalid) {
      this.soError = 'Please fix validation errors.';
      form.form.markAllAsTouched();
      this.cdr.markForCheck();
      return;
    }

    if (!this.soForm.fullName.trim() || !this.soForm.email.trim() || !this.soForm.password.trim() || !this.soForm.phone.trim()) {
      this.soError = 'All fields are required.';
      this.cdr.markForCheck();
      return;
    }

    if (!this.isPasswordStrong(this.soForm.password)) {
      this.soError = 'Password must be at least 8 characters and include upper, lower, number, and special character.';
      this.cdr.markForCheck();
      return;
    }

    this.soSubmitting = true;
    this.cdr.markForCheck();
    this.http
      .post(`${this.auth.getBaseUrl()}/auth/supervisory-officer/register`, this.soForm, { headers: this.authHeaders() })
      .subscribe({
        next: () => {
          this.soSuccess = true;
          this.soSubmitting = false;
          this.cdr.markForCheck();
        },
        error: err => {
          this.soError = this.readError(err);
          this.soSubmitting = false;
          this.cdr.markForCheck();
        }
      });
  }

  resetForm(form?: import('@angular/forms').NgForm) {
   
    this.soForm = { fullName: '', email: '', phone: '', password: '' };
    this.soSuccess = false;
    this.soError = '';
    if (form) {
      
      form.resetForm(this.soForm);
    }
    this.cdr.markForCheck();
  }

  private isPasswordStrong(password: string) {
    // Require at least 8 characters with upper, lower, digit, and special character.
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[\\W_]).{8,}$/.test(password || '');
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
