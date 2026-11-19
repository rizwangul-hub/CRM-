import { apiRequest } from './api';
import type {
  AuthUser,
  CreateUserPayload,
  PaginatedUsersResponse,
  UpdateUserPayload,
} from '../types/auth';

export async function fetchUsers(params?: {
  search?: string;
  role?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedUsersResponse> {
  const qs = new URLSearchParams();
  if (params?.search) qs.set('search', params.search);
  if (params?.role && params.role !== 'ALL') qs.set('role', params.role);
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  const query = qs.toString();
  return apiRequest<PaginatedUsersResponse>(`/api/users${query ? `?${query}` : ''}`);
}

export async function createUser(payload: CreateUserPayload): Promise<AuthUser> {
  const data = await apiRequest<{ user: AuthUser }>('/api/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data.user;
}

export async function updateUser(id: string, payload: UpdateUserPayload): Promise<AuthUser> {
  const data = await apiRequest<{ user: AuthUser }>(`/api/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return data.user;
}

export async function deleteUser(id: string): Promise<void> {
  await apiRequest<undefined>(`/api/users/${id}`, {
    method: 'DELETE',
  });
}
