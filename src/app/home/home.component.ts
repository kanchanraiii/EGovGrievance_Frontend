import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  standalone: true,
  template: `
    <section class="page-frame">
      <div class="logo-name">Logo Name</div>
      <div class="content-frame"></div>
    </section>
  `,
  styles: [
    `:host{display:block}
    .page-frame{min-height:calc(100vh - 3rem);background:#fff;border-radius:14px;box-shadow:var(--shadow);padding:1.5rem;display:flex;flex-direction:column}
    .logo-name{align-self:flex-end;color:var(--muted);font-weight:600;letter-spacing:.02em}
    .content-frame{flex:1;margin-top:1rem;border:1px solid var(--border);border-radius:12px}
    `,
  ],
})
export class HomeComponent {}
