import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenKey = 'citizenToken';
  private readonly nameKey = 'citizenName';
  private readonly emailKey = 'citizenEmail';
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

  setProfile(profile: { name?: string; email?: string }) {
    if (profile.name) {
      localStorage.setItem(this.nameKey, profile.name);
    }
    if (profile.email) {
      localStorage.setItem(this.emailKey, profile.email);
    }
  }

  getProfile() {
    return {
      name: localStorage.getItem(this.nameKey) ?? '',
      email: localStorage.getItem(this.emailKey) ?? ''
    };
  }

  clearProfile() {
    localStorage.removeItem(this.nameKey);
    localStorage.removeItem(this.emailKey);
  }
}
