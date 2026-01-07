import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../auth/auth.service';

type NavItem = {
  label: string;
  short: string;
  route: string;
  exact?: boolean;
  fragment?: string;
};

type NavSection = { title: string; items: NavItem[] };

const PUBLIC_NAV: NavSection[] = [
  {
      title: 'General',
      items: [
        { label: 'Home', short: 'H', route: '/', exact: true },
        { label: 'About Us', short: 'A', route: '/about' },
        { label: 'Departments', short: 'D', route: '/departments' },
        { label: 'FAQ', short: 'F', route: '/faq' }
      ]
    }
  ];

const NAV_CONFIG: Record<string, NavSection[]> = {
  citizen: [
    {
      title: 'General',
      items: [
        { label: 'Home', short: 'H', route: '/', exact: true },
        { label: 'About Us', short: 'A', route: '/about' },
        { label: 'Departments', short: 'D', route: '/departments' },
        { label: 'FAQ', short: 'F', route: '/faq' }
      ]
    },
    {
      title: 'Citizen',
      items: [
        { label: 'Lodge a grievance', short: 'LG', route: '/dashboard', fragment: 'lodge-form' },
        { label: 'My grievances', short: 'MG', route: '/dashboard', fragment: 'my-grievances' }
      ]
    }
  ],
  staff: [
    {
      title: 'General',
      items: [
        { label: 'Departments', short: 'D', route: '/departments' },
        { label: 'FAQ', short: 'F', route: '/faq' }
      ]
    },
    {
      title: 'Staff',
      items: [
        { label: 'Staff Home', short: 'S', route: '/dashboard' },
        { label: 'Cases', short: 'C', route: '/dashboard' },
        { label: 'Reports', short: 'R', route: '/dashboard' }
      ]
    }
  ],
  admin: [
    {
      title: 'Admin',
      items: [
        { label: 'Admin Console', short: 'AD', route: '/admin' },
        { label: 'View Departments', short: 'VD', route: '/admin/view-departments' },
        { label: 'Add Department', short: 'ADP', route: '/admin/departments' },
        { label: 'Department Officers', short: 'DO', route: '/admin/department-officers' },
        { label: 'Supervisory Officers', short: 'SO', route: '/admin/supervisors' },
        { label: 'Analytics', short: 'AN', route: '/analytics' }
      ]
    }
  ],
  department_officer: [
    {
      title: 'General',
      items: [
        { label: 'Departments', short: 'D', route: '/departments' },
        { label: 'Analytics', short: 'AN', route: '/analytics' }
      ]
    },
    {
      title: 'Department Officer',
      items: [{ label: 'Officer Console', short: 'DO', route: '/do' }]
    }
  ],
  supervisory_officer: [
    {
      title: 'General',
      items: [
        { label: 'Departments', short: 'D', route: '/departments' },
        { label: 'Analytics', short: 'AN', route: '/analytics' }
      ]
    },
    {
      title: 'Supervisor',
      items: [{ label: 'Supervise Grievances', short: 'SG', route: '/supervisor' }]
    }
  ],
  case_worker: [
    {
      title: 'General',
      items: [
        { label: 'Departments', short: 'D', route: '/departments' },
        { label: 'Analytics', short: 'AN', route: '/analytics' }
      ]
    },
    {
      title: 'Case Worker',
      items: [{ label: 'Assigned Grievances', short: 'CW', route: '/cw' }]
    }
  ]
};

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
  navOpen = signal(false);
  private defaultAvatar = 'https://cdn-icons-png.flaticon.com/512/6596/6596121.png';

  toggle() {
    this.collapsed.update(v => !v);
  }

  isAuthed = () => this.auth.isAuthenticated();

  get displayName() {
    const profile = this.auth.getProfile();
    return profile.name || this.roleLabel;
  }

  get displayEmail() {
    const profile = this.auth.getProfile();
    return profile.email || this.roleLabel;
  }

  private get roleLabel() {
    const roleKey = (this.auth.getRole() || 'citizen').toLowerCase();
    const labels: Record<string, string> = {
      admin: 'Admin',
      supervisory_officer: 'Supervisory Officer',
      supervisor: 'Supervisory Officer',
      department_officer: 'Department Officer',
      do: 'Department Officer',
      case_worker: 'Case Worker',
      cw: 'Case Worker',
      citizen: 'Citizen'
    };
    return labels[roleKey] || 'Citizen';
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

  showLogoutConfirm = signal(false);

openLogoutConfirm() {
  this.showLogoutConfirm.set(true);
}

closeLogoutConfirm() {
  this.showLogoutConfirm.set(false);
}

confirmLogout() {
  this.showLogoutConfirm.set(false);
  this.logout();
}


  get avatarUrl() {
    return this.defaultAvatar;
  }

  toggleMenu() {
    this.menuOpen.update(v => !v);
    if (this.menuOpen()) {
      this.navOpen.set(false);
    }
  }

  toggleNav() {
    this.navOpen.update(v => !v);
    if (this.navOpen()) {
      this.menuOpen.set(false);
    }
  }

  closeNav() {
    this.navOpen.set(false);
  }

  get navSections(): NavSection[] {
    if (!this.isAuthed()) {
      return PUBLIC_NAV;
    }
    const roleKey = (this.auth.getRole() || 'citizen').toLowerCase();
    return NAV_CONFIG[roleKey] ?? NAV_CONFIG['citizen'];
  }

  trackSection(index: number, section: NavSection) {
    return `${index}-${section.title}`;
  }

  trackNav(index: number, item: NavItem) {
    return `${index}-${item.route}-${item.label}`;
  }
}
