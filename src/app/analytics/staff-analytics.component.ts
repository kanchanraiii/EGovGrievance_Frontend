import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { AuthService } from '../auth/auth.service';

Chart.register(...registerables);

type NormalizedGrievance = {
  id: string;
  departmentId: string;
  status: string;
  createdAt: string;
  escalated: boolean;
};

@Component({
  selector: 'app-staff-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="admin-shell">
      <header class="admin-header">
        <div>
          <p class="eyebrow">Staff Analytics</p>
          <h1>Grievance Insights</h1>
          <p class="subtitle">Overview of grievance volume, statuses, and department load.</p>
        </div>
        <div class="actions">
          <button class="button ghost" type="button" (click)="loadData()" [disabled]="loading">
            {{ loading ? 'Refreshing...' : 'Refresh data' }}
          </button>
          <span class="muted" *ngIf="lastUpdated">Updated {{ lastUpdated | date:'short' }}</span>
        </div>
      </header>

      <div class="response error" *ngIf="error">{{ error }}</div>

      <div class="grid">
        <section class="card">
          <div class="card-head">
            <h2>Status distribution</h2>
            <p class="helper">Across {{ dataCount }} grievances.</p>
          </div>
          <div class="chart-wrap">
            <canvas #statusCanvas></canvas>
          </div>
          <div class="muted" *ngIf="!dataCount && !loading">No data to display.</div>
        </section>

        <section class="card">
          <div class="card-head">
            <h2>By department</h2>
            <p class="helper">Top departments by grievance count.</p>
          </div>
          <div class="chart-wrap">
            <canvas #deptCanvas></canvas>
          </div>
          <div class="muted" *ngIf="!dataCount && !loading">No data to display.</div>
        </section>
      </div>

      <section class="card">
        <div class="card-head">
          <h2>Trend (last 7 days)</h2>
          <p class="helper">Submissions per day.</p>
        </div>
        <div class="chart-wrap">
          <canvas #trendCanvas></canvas>
        </div>
        <div class="muted" *ngIf="!dataCount && !loading">No data to display.</div>
      </section>
    </section>
  `,
  styles: [
    `:host{display:block}
    .admin-shell{display:flex;flex-direction:column;gap:1rem;padding:1.1rem 1.3rem}
    .admin-header{display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap;align-items:flex-start}
    .eyebrow{text-transform:uppercase;letter-spacing:.14em;font-size:.7rem;color:var(--accent-2);margin:0 0 .25rem}
    h1{margin:0 0 .25rem;font-size:1.6rem}
    .subtitle{margin:0;color:var(--muted);font-size:.95rem}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:.85rem}
    .card{background:var(--panel);border:1px solid var(--border);border-radius:12px;padding:.75rem;display:flex;flex-direction:column;gap:.55rem;box-shadow:0 8px 14px rgba(28,39,56,0.08)}
    .card-head h2{margin:0;font-size:1rem}
    .helper{margin:0;color:var(--muted);font-size:.9rem}
    .actions{display:flex;gap:.5rem;flex-wrap:wrap;align-items:center}
    .button{border:none;border-radius:999px;background:var(--accent);color:#fff;padding:.5rem 1rem;font-weight:700;cursor:pointer;box-shadow:0 8px 18px rgba(31,79,147,0.18);font-size:.88rem}
    .button.ghost{background:#eef2fb;color:var(--accent);box-shadow:none;border:1px solid rgba(31,79,147,0.2)}
    .button[disabled]{opacity:.6;cursor:not-allowed;box-shadow:none}
    .response{border-radius:12px;padding:.6rem .75rem;font-size:.88rem}
    .response.error{background:#fff1f2;color:#9f1239;border:1px solid #fecdd3}
    .muted{color:var(--muted);font-size:.9rem}
    .chart-wrap{min-height:160px;display:flex;align-items:center;justify-content:center}
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StaffAnalyticsComponent implements AfterViewInit, OnDestroy {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('statusCanvas') statusCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('deptCanvas') deptCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('trendCanvas') trendCanvas!: ElementRef<HTMLCanvasElement>;

  loading = false;
  error = '';
  dataCount = 0;
  lastUpdated: Date | null = null;

  private statusChart?: Chart;
  private deptChart?: Chart;
  private trendChart?: Chart;
  private viewReady = false;

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  loadData() {
    if (!this.viewReady) return;
    this.loading = true;
    this.error = '';
    this.cdr.markForCheck();

    const role = (this.auth.getRole() || '').toLowerCase();
    const base = this.auth.getBaseUrl();
    let url = `${base}/grievance-service/api/grievances/getAll`;
    if (role === 'case_worker' || role === 'cw') {
      url = `${base}/grievance-service/api/grievances/my-assigned`;
    }

    this.http.get<any>(url, { headers: this.authHeaders() }).subscribe({
      next: res => {
        const list = this.normalize(res);
        this.applyData(list);
      },
      error: err => {
        this.error = this.readError(err);
        // fallback to sample data so the view is still useful
        this.applyData(this.sampleData());
      }
    });
  }

  private applyData(items: NormalizedGrievance[]) {
    const data = items.length ? items : this.sampleData();
    this.dataCount = data.length;
    this.lastUpdated = new Date();
    this.renderStatusChart(data);
    this.renderDeptChart(data);
    this.renderTrendChart(data);
    this.loading = false;
    this.cdr.markForCheck();
  }

  private renderStatusChart(data: NormalizedGrievance[]) {
    const counts = data.reduce<Record<string, number>>((acc, item) => {
      const key = item.status || 'UNKNOWN';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const labels = Object.keys(counts);
    const values = Object.values(counts);
    this.statusChart?.destroy();
    const ctx = this.statusCanvas.nativeElement.getContext('2d');
    if (!ctx) return;
    this.statusChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: ['#3b82f6', '#22c55e', '#f97316', '#e11d48', '#a855f7', '#0ea5e9'],
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  }

  private renderDeptChart(data: NormalizedGrievance[]) {
    const counts = data.reduce<Record<string, number>>((acc, item) => {
      const key = item.departmentId || 'Unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const labels = sorted.map(([dept]) => dept);
    const values = sorted.map(([, count]) => count);
    this.deptChart?.destroy();
    const ctx = this.deptCanvas.nativeElement.getContext('2d');
    if (!ctx) return;
    this.deptChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Grievances',
            data: values,
            backgroundColor: '#1f4f93'
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0 } }
        }
      }
    });
  }

  private renderTrendChart(data: NormalizedGrievance[]) {
    const today = new Date();
    const dayKey = (d: Date) => d.toISOString().slice(0, 10);
    const last7 = [...Array(7).keys()]
      .map(offset => {
        const d = new Date(today);
        d.setDate(today.getDate() - (6 - offset));
        return dayKey(d);
      });
    const map = last7.reduce<Record<string, number>>((acc, key) => ({ ...acc, [key]: 0 }), {});
    data.forEach(item => {
      const key = item.createdAt?.slice(0, 10);
      if (key && key in map) {
        map[key] += 1;
      }
    });
    const labels = last7;
    const values = labels.map(l => map[l] || 0);
    this.trendChart?.destroy();
    const ctx = this.trendCanvas.nativeElement.getContext('2d');
    if (!ctx) return;
    this.trendChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Daily grievances',
            data: values,
            fill: false,
            borderColor: '#1d4ed8',
            backgroundColor: '#bfdbfe',
            tension: 0.25,
            pointRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0 } }
        }
      }
    });
  }

  private destroyCharts() {
    this.statusChart?.destroy();
    this.deptChart?.destroy();
    this.trendChart?.destroy();
  }

  private normalize(res: any): NormalizedGrievance[] {
    if (!res) return [];
    const arr = Array.isArray(res) ? res : [res];
    return arr.map(item => ({
      id: item?.id || item?.grievanceId || '—',
      departmentId: item?.departmentId || 'Unknown',
      status: item?.status || 'UNKNOWN',
      createdAt: item?.createdAt || item?.updatedAt || '',
      escalated: !!item?.escalated || item?.status === 'ESCALATED'
    }));
  }

  private authHeaders() {
    const token = this.auth.getToken().trim();
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  private sampleData(): NormalizedGrievance[] {
    return [
      { id: 'S1', departmentId: 'STATE_PWD', status: 'SUBMITTED', createdAt: this.sampleDate(1), escalated: false },
      { id: 'S2', departmentId: 'STATE_HEALTH', status: 'IN_PROGRESS', createdAt: this.sampleDate(2), escalated: false },
      { id: 'S3', departmentId: 'STATE_PWD', status: 'IN_PROGRESS', createdAt: this.sampleDate(3), escalated: false },
      { id: 'S4', departmentId: 'STATE_PWD', status: 'RESOLVED', createdAt: this.sampleDate(4), escalated: false },
      { id: 'S5', departmentId: 'STATE_ELECTRICITY', status: 'ESCALATED', createdAt: this.sampleDate(5), escalated: true }
    ];
  }

  private sampleDate(daysAgo: number) {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString();
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
