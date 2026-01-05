import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../auth/auth.service';


@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
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
