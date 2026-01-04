import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <aside class="sidebar" [class.collapsed]="collapsed()">
      <div class="brand">
        <div class="logo">E-GR</div>
        <div class="brand-text" *ngIf="!collapsed()">
          <div class="brand-title">E-Grievance</div>
          <div class="brand-sub">Redressal Portal</div>
        </div>
        <button
          class="icon-button"
          (click)="toggle()"
          [attr.aria-expanded]="!collapsed()"
          [attr.aria-label]="collapsed() ? 'Expand sidebar' : 'Collapse sidebar'"
          [attr.title]="collapsed() ? 'Expand sidebar' : 'Collapse sidebar'"
        >
          {{ collapsed() ? '≫' : '≪' }}
        </button>
      </div>

      <nav class="nav">
        <button class="nav-item active">
          <span class="nav-short">H</span>
          <span class="nav-text">Home</span>
        </button>
        <button class="nav-item">
          <span class="nav-short">A</span>
          <span class="nav-text">About Us</span>
        </button>
        <button class="nav-item">
          <span class="nav-short">F</span>
          <span class="nav-text">FAQs</span>
        </button>
        <button class="nav-item">
          <span class="nav-short">L</span>
          <span class="nav-text">Login</span>
        </button>
        <button class="nav-item">
          <span class="nav-short">G</span>
          <span class="nav-text">Grievance</span>
        </button>
      </nav>
      <div class="spacer"></div>
      <button class="nav-item signup signup-bottom">
        <span class="nav-short">S</span>
        <span class="nav-text">Sign Up</span>
      </button>
    </aside>
  `,
  styles: [
    `:host{display:block}
    .sidebar{width:240px;min-height:calc(100vh - 3rem);padding:1.5rem 1.25rem;border-radius:14px;background:linear-gradient(160deg,#74438f 0%,#9a53ad 45%,#d6795f 100%);color:#fff;display:flex;flex-direction:column;box-shadow:var(--shadow);transition:width .2s ease}
    .sidebar.collapsed{width:80px}
    .brand{display:flex;align-items:center;gap:.75rem;margin-bottom:1rem}
    .logo{width:42px;height:42px;border-radius:10px;background:rgba(255,255,255,0.25);border:1px solid rgba(255,255,255,0.3);display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;letter-spacing:.05em}
    .brand-text{line-height:1.1}
    .brand-title{font-weight:700}
    .brand-sub{font-size:.75rem;color:rgba(255,255,255,0.7)}
    .icon-button{margin-left:auto;border:1px solid rgba(255,255,255,0.25);background:rgba(255,255,255,0.18);color:#fff;border-radius:10px;padding:.25rem .5rem;cursor:pointer}
    .nav{display:flex;flex-direction:column;gap:.4rem;margin-top:.5rem}
    .spacer{flex:1}
    .nav-item{display:flex;align-items:center;gap:.6rem;border:1px solid transparent;background:rgba(255,255,255,0.18);color:#fff;padding:.6rem .7rem;border-radius:8px;cursor:pointer;font-size:.92rem;transition:background .2s ease,border-color .2s ease,color .2s ease}
    .nav-item:hover{background:rgba(255,255,255,0.28)}
    .nav-item.active{border-color:rgba(255,255,255,0.6);background:rgba(255,255,255,0.35);color:#fff}
    .nav-item.signup{border-color:rgba(255,224,210,0.8);background:rgba(255,224,210,0.35);color:#5c2d44}
    .signup-bottom{margin-top:.5rem}
    .nav-short{width:26px;height:26px;border-radius:8px;background:rgba(255,255,255,0.3);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.8rem}
    .nav-text{white-space:nowrap}
    .sidebar.collapsed .brand-text,
    .sidebar.collapsed .nav-text{display:none}
    .sidebar.collapsed .nav-item{justify-content:center;padding:.6rem}
    .sidebar.collapsed .nav-short{background:rgba(255,255,255,0.25);border:1px solid rgba(255,255,255,0.3)}
    @media (max-width:980px){.sidebar{width:100%;min-height:auto}}
    `,
  ],
})
export class SidebarComponent {
  collapsed = signal(false);

  toggle() {
    this.collapsed.update(v => !v);
  }
}
