import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { UserRole } from '../types/auth';

export const DEMO_ROLE_STORAGE_KEY = 'celltrack_demo_role';

export interface DemoRoleProfile {
  role: UserRole;
  label: string;
  fullName: string;
  email: string;
  scopeSummary: string;
}

export const ROLE_PROFILES: Record<UserRole, DemoRoleProfile> = {
  ADMIN: {
    role: 'ADMIN',
    label: 'Admin',
    fullName: 'Rizwan Ahmed',
    email: 'admin@celltrack.pk',
    scopeSummary: 'Full access · Finance, users & settings',
  },
  MANAGER: {
    role: 'MANAGER',
    label: 'Manager',
    fullName: 'Hamza Tariq',
    email: 'manager@celltrack.pk',
    scopeSummary: 'Daily operations · Limited reports',
  },
  STAFF: {
    role: 'STAFF',
    label: 'Staff',
    fullName: 'Bilal Mahmood',
    email: 'staff@celltrack.pk',
    scopeSummary: 'POS, customers, search & repairs',
  },
};

export function readStoredDemoRole(): UserRole {
  if (typeof window === 'undefined') return 'ADMIN';
  try {
    const raw = window.localStorage.getItem(DEMO_ROLE_STORAGE_KEY);
    if (raw === 'ADMIN' || raw === 'MANAGER' || raw === 'STAFF') {
      return raw;
    }
  } catch {
    // Ignore storage unavailability
  }
  return 'ADMIN';
}

interface RoleContextValue {
  role: UserRole;
  profile: DemoRoleProfile;
  setRole: (nextRole: UserRole) => void;
  hasRole: (...roles: UserRole[]) => boolean;
}

const RoleContext = createContext<RoleContextValue | null>(null);

/**
 * Local/demo role-switching context (no authentication).
 * Persists selected role in localStorage and defaults to ADMIN.
 */
export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<UserRole>(() => readStoredDemoRole());

  const setRole = useCallback((nextRole: UserRole) => {
    setRoleState(nextRole);
    try {
      window.localStorage.setItem(DEMO_ROLE_STORAGE_KEY, nextRole);
    } catch {
      // Ignore storage errors
    }
  }, []);

  const hasRole = useCallback(
    (...roles: UserRole[]) => roles.includes(role),
    [role],
  );

  const value = useMemo(
    () => ({
      role,
      profile: ROLE_PROFILES[role],
      setRole,
      hasRole,
    }),
    [role, setRole, hasRole],
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole(): RoleContextValue {
  const ctx = useContext(RoleContext);
  if (!ctx) {
    throw new Error('useRole must be used inside RoleProvider');
  }
  return ctx;
}
