import { Component } from '@angular/core';

@Component({
  selector: 'app-landing',
  standalone: true,
  template: `
    <section class="landing">
      <div class="hero">
        <p class="eyebrow">E-Grievance</p>
        <h1>Citizen grievance redressal made simple.</h1>
        <p class="lead">
          Track issues, submit new grievances, and follow up on resolutions in one place.
        </p>
        <div class="cta">
          <a class="button" routerLink="/dashboard">Go to Dashboard</a>
          <a class="button ghost" routerLink="/auth">Login / Sign Up</a>
        </div>
      </div>
      <div class="panels">
        <div class="panel">
          <h3>Lodge grievances</h3>
          <p>Submit complaints with department, category, and description in minutes.</p>
        </div>
        <div class="panel">
          <h3>Track progress</h3>
          <p>Check history and current status for every grievance you’ve filed.</p>
        </div>
        <div class="panel">
          <h3>Share feedback</h3>
          <p>Rate resolved grievances and help improve service quality.</p>
        </div>
      </div>
    </section>
  `,
  styles: [
    `:host{display:block}
    .landing{min-height:calc(100vh - 3rem);background:var(--panel);border-radius:16px;box-shadow:var(--shadow);padding:2rem;display:flex;flex-direction:column;gap:2rem}
    .hero{max-width:720px}
    .eyebrow{text-transform:uppercase;letter-spacing:.18em;font-size:.72rem;color:var(--accent-2);margin:0 0 .5rem}
    h1{margin:0 0 .75rem;font-size:2.4rem;color:var(--ink)}
    .lead{margin:0 0 1rem;color:var(--muted);font-size:1rem}
    .cta{display:flex;gap:.75rem;flex-wrap:wrap}
    .button{display:inline-flex;align-items:center;justify-content:center;border:none;border-radius:999px;background:var(--accent);color:#fff;padding:.65rem 1.2rem;font-weight:700;text-decoration:none;box-shadow:0 10px 22px rgba(31,79,147,0.18)}
    .button.ghost{background:#eef2fb;color:var(--accent);box-shadow:none;border:1px solid rgba(31,79,147,0.2)}
    .panels{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem}
    .panel{background:var(--panel);border:1px solid var(--border);border-radius:12px;padding:1rem;box-shadow:0 8px 18px rgba(24,34,54,0.08)}
    .panel h3{margin:.1rem 0 .4rem;font-size:1.05rem}
    .panel p{margin:0;color:var(--muted)}
    @media (max-width:720px){.landing{padding:1.4rem}h1{font-size:2rem}}
    `,
  ],
})
export class LandingComponent {}
