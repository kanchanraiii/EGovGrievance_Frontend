import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenKey = 'citizenToken';
  private readonly nameKey = 'citizenName';
  private readonly emailKey = 'citizenEmail';
  private readonly roleKey = 'userRole';
  private readonly baseUrl = '/api';

  getToken() {
    return localStorage.getItem(this.tokenKey) ?? '';
  }

  setToken(token: string) {
    localStorage.setItem(this.tokenKey, token.trim());
  }

  clearToken() {
    localStorage.removeItem(this.tokenKey);
    this.clearProfile();
  }

  getBaseUrl() {
    return this.baseUrl;
  }

  isAuthenticated() {
    return !!this.getToken().trim();
  }

  setProfile(profile: { name?: string; email?: string; role?: string }) {
    const role = profile.role;
    if (profile.name) {
      localStorage.setItem(this.nameKey, profile.name);
    }
    if (profile.email) {
      localStorage.setItem(this.emailKey, profile.email);
    }
    const resolvedRole = (role || this.getRole() || 'citizen').toString();
    localStorage.setItem(this.roleKey, resolvedRole);
  }

  getProfile() {
    return {
      name: localStorage.getItem(this.nameKey) ?? '',
      email: localStorage.getItem(this.emailKey) ?? '',
      role: this.getRole()
    };
  }

  getRole() {
    return localStorage.getItem(this.roleKey) ?? 'citizen';
  }

  clearProfile() {
    localStorage.removeItem(this.nameKey);
    localStorage.removeItem(this.emailKey);
    localStorage.removeItem(this.roleKey);
  }
}
