import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
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
        <a class="nav-item" routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
          <span class="nav-short">H</span>
          <span class="nav-text">Home</span>
        </a>
        <a class="nav-item" routerLink="/dashboard" routerLinkActive="active">
          <span class="nav-short">A</span>
          <span class="nav-text">About Us</span>
        </a>
        <a class="nav-item" routerLink="/dashboard" routerLinkActive="active">
          <span class="nav-short">F</span>
          <span class="nav-text">FAQs</span>
        </a>
        <a class="nav-item" routerLink="/dashboard" routerLinkActive="active">
          <span class="nav-short">G</span>
          <span class="nav-text">Grievance</span>
        </a>
      </nav>
      <div class="spacer"></div>
      <ng-container *ngIf="isAuthed(); else signupLink">
        <div class="user-card-wrapper" (click)="toggleMenu()" [class.open]="menuOpen()">
          <div class="user-card" [title]="displayEmail">
            <img class="avatar" [src]="avatarUrl" alt="User avatar" />
            <div class="user-meta" *ngIf="!collapsed()">
              <div class="user-name">{{ displayName }}</div>
              <div class="user-email">{{ displayEmail }}</div>
            </div>
          </div>
          <div class="dropdown" *ngIf="menuOpen()">
            <button class="logout" type="button" (click)="logout()">Logout</button>
          </div>
        </div>
      </ng-container>
      <ng-template #signupLink>
        <a class="nav-item signup signup-bottom" routerLink="/auth" routerLinkActive="active">
          <span class="nav-short">S</span>
          <span class="nav-text">Sign Up</span>
        </a>
      </ng-template>
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
    .nav-item{display:flex;align-items:center;gap:.6rem;border:1px solid transparent;background:rgba(255,255,255,0.18);color:#fff;padding:.6rem .7rem;border-radius:8px;cursor:pointer;font-size:.92rem;transition:background .2s ease,border-color .2s ease,color .2s ease;text-decoration:none}
    .nav-item:hover{background:rgba(255,255,255,0.28)}
    .nav-item.active{border-color:rgba(255,255,255,0.6);background:rgba(255,255,255,0.35);color:#fff}
    .nav-item.signup{border-color:rgba(255,224,210,0.8);background:rgba(255,224,210,0.35);color:#5c2d44}
    .signup-bottom{margin-top:.5rem}
    .nav-short{width:26px;height:26px;border-radius:8px;background:rgba(255,255,255,0.3);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.8rem}
    .nav-text{white-space:nowrap}
    .user-card-wrapper{position:relative}
    .user-card{display:flex;align-items:center;gap:.45rem;border:1px solid rgba(255,255,255,0.35);background:rgba(255,255,255,0.2);color:#fff;padding:.45rem .55rem;border-radius:9px;cursor:pointer}
    .user-card:hover{background:rgba(255,255,255,0.26)}
    .avatar{width:32px;height:32px;border-radius:50%;object-fit:cover;background:rgba(255,255,255,0.28)}
    .user-meta{display:flex;flex-direction:column;line-height:1.15}
    .user-name{font-weight:700;font-size:.9rem}
    .user-email{font-size:.74rem;color:rgba(255,255,255,0.8);max-width:150px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .dropdown{position:absolute;right:0;bottom:calc(100% + 6px);background:rgba(21,21,34,0.95);border:1px solid rgba(255,255,255,0.2);border-radius:10px;box-shadow:0 12px 24px rgba(0,0,0,0.25);padding:.4rem;z-index:10;min-width:140px}
    .logout{width:100%;border:none;background:transparent;color:#fff;padding:.55rem .6rem;border-radius:8px;text-align:left;cursor:pointer}
    .logout:hover{background:rgba(255,255,255,0.12)}
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
  private auth = inject(AuthService);
  menuOpen = signal(false);
  private defaultAvatar = 'https://cdn-icons-png.flaticon.com/512/6596/6596121.png';

  toggle() {
    this.collapsed.update(v => !v);
  }

  isAuthed = () => this.auth.isAuthenticated();

  get displayName() {
    const profile = this.auth.getProfile();
    return profile.name || 'Citizen';
  }

  get displayEmail() {
    const profile = this.auth.getProfile();
    return profile.email || 'Logged in';
  }

  get initials() {
    const name = this.displayName.trim();
    if (!name) return 'U';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase())
      .join('');
  }

  logout() {
    this.auth.clearToken();
    this.auth.clearProfile();
    window.location.href = '/auth';
  }

  get avatarUrl() {
    return this.defaultAvatar;
  }

  toggleMenu() {
    this.menuOpen.update(v => !v);
  }
}
