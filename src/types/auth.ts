export type UserRole = 'ADMIN' | 'MANAGER' | 'STAFF';

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt?: string;
}

export interface PaginatedUsersResponse {
  items: AuthUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateUserPayload {
  fullName: string;
  email: string;
  phone?: string;
  role: UserRole;
}

export interface UpdateUserPayload {
  fullName?: string;
  phone?: string;
  role?: UserRole;
  isActive?: boolean;
}
