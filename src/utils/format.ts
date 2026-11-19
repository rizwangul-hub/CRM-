import type { UserRole } from '../types/auth';

export function formatPKR(paisa: number | null | undefined, currency = 'PKR'): string {
  if (paisa === null || paisa === undefined || !Number.isFinite(paisa)) {
    return `${currency} 0`;
  }
  const major = Math.round(paisa) / 100;
  const formatted = new Intl.NumberFormat('en-PK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(major));

  return `${major < 0 ? '-' : ''}${currency} ${formatted}`;
}

export function formatCompactPKR(paisa: number, currency = 'PKR'): string {
  const major = Math.round(paisa) / 100;
  const abs = Math.abs(major);
  const sign = major < 0 ? '-' : '';
  if (abs >= 1_000_000) {
    return `${sign}${currency} ${(abs / 1_000_000).toFixed(2)}M`;
  }
  if (abs >= 1_000) {
    return `${sign}${currency} ${(abs / 1_000).toFixed(0)}k`;
  }
  return `${sign}${currency} ${Math.round(abs)}`;
}

export function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return 'Never';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return 'Never';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRoleLabel(role: UserRole | string): string {
  switch (role) {
    case 'ADMIN':
      return 'Administrator';
    case 'MANAGER':
      return 'Store Manager';
    case 'STAFF':
      return 'Sales Staff';
    default:
      return role;
  }
}

export function getInitials(fullName: string): string {
  return fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}
