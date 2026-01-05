import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section class="admin-shell">
      <header class="admin-header">
        <div>
          <p class="eyebrow">Admin Console</p>
          <h1>Welcome, Admin</h1>
          <p class="subtitle">Choose a workspace to manage departments/Department Officers or Supervisory Officers.</p>
        </div>
      </header>

      <div class="grid">
        <a class="card link-card" routerLink="/admin/departments">
          <div class="card-head">
            <h2>Departments & DO</h2>
            <p class="helper">Add departments, delete categories, register Department Officers.</p>
          </div>
          <div class="muted">Go to departments workspace →</div>
        </a>

        <a class="card link-card" routerLink="/admin/supervisors">
          <div class="card-head">
            <h2>Supervisory Officers</h2>
            <p class="helper">Create Supervisory Officers.</p>
          </div>
          <div class="muted">Go to supervisors workspace →</div>
        </a>
      </div>
    </section>
  `,
  styles: [
    `:host{display:block}
    .admin-shell{display:flex;flex-direction:column;gap:1rem;padding:1.25rem 1.5rem}
    .admin-header{display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap;align-items:flex-start}
    .eyebrow{text-transform:uppercase;letter-spacing:.18em;font-size:.72rem;color:var(--accent-2);margin:0 0 .35rem}
    h1{margin:0 0 .35rem}
    .subtitle{margin:0;color:var(--muted)}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1rem}
    .card{background:var(--panel);border:1px solid var(--border);border-radius:14px;padding:1rem;display:flex;flex-direction:column;gap:.6rem;box-shadow:0 10px 22px rgba(28,39,56,0.08);text-decoration:none;color:inherit}
    .card.link-card{cursor:pointer;transition:transform .15s ease,box-shadow .15s ease}
    .card.link-card:hover{transform:translateY(-2px);box-shadow:0 14px 26px rgba(28,39,56,0.12)}
    .card-head h2{margin:0;font-size:1.05rem}
    .helper{margin:0;color:var(--muted)}
    .muted{color:var(--muted);font-size:.9rem}
    `,
  ],
})
export class AdminDashboardComponent {}
