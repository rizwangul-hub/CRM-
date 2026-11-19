import { apiRequest } from './api';
import type { AuditLogItem, DashboardOverview } from '../types/dashboard';

export async function fetchDashboardOverview(): Promise<DashboardOverview> {
  return apiRequest<DashboardOverview>('/api/dashboard/overview');
}

export async function fetchRecentAuditLogs(limit = 12): Promise<AuditLogItem[]> {
  const data = await apiRequest<{ items: AuditLogItem[] }>(
    `/api/dashboard/audit-logs?limit=${limit}`,
  );
  return data.items;
}
