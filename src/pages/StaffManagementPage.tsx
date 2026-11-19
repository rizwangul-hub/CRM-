import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Pencil, Search, Trash2, UserPlus } from 'lucide-react';
import {
  createUser,
  deleteUser,
  fetchUsers,
  updateUser,
} from '../services/usersService';
import { fetchRecentAuditLogs } from '../services/dashboardService';
import type { AuthUser, UserRole } from '../types/auth';
import type { AuditLogItem } from '../types/dashboard';
import { ApiError } from '../services/api';
import { useRole } from '../context/RoleContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { TableSkeleton } from '../components/ui/Skeleton';
import { formatDateTime, formatRoleLabel } from '../utils/format';

const createStaffSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters'),
  email: z.string().trim().email('Enter a valid email address'),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  role: z.enum(['ADMIN', 'MANAGER', 'STAFF']),
});

const editStaffSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters'),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  role: z.enum(['ADMIN', 'MANAGER', 'STAFF']),
  isActive: z.boolean(),
});

type CreateStaffValues = z.infer<typeof createStaffSchema>;
type EditStaffValues = z.infer<typeof editStaffSchema>;

const ROLE_FILTERS: Array<{ value: 'ALL' | UserRole; label: string }> = [
  { value: 'ALL', label: 'All Roles' },
  { value: 'ADMIN', label: 'Admins' },
  { value: 'MANAGER', label: 'Managers' },
  { value: 'STAFF', label: 'Staff' },
];

export function StaffManagementPage() {
  const { profile } = useRole();
  const { notify } = useToast();

  const [users, setUsers] = useState<AuthUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL');
  const [loading, setLoading] = useState(true);

  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AuthUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<AuthUser | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, logsRes] = await Promise.all([
        fetchUsers({ search: search.trim(), role: roleFilter, page, limit: 10 }),
        fetchRecentAuditLogs(10),
      ]);
      setUsers(usersRes.items);
      setTotal(usersRes.total);
      setTotalPages(usersRes.totalPages);
      setAuditLogs(logsRes);
    } catch (err) {
      notify(
        'error',
        'Could not load staff directory',
        err instanceof Error ? err.message : 'Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, page, notify]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 150);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  const createForm = useForm<CreateStaffValues>({
    resolver: zodResolver(createStaffSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      role: 'STAFF',
    },
  });

  const editForm = useForm<EditStaffValues>({
    resolver: zodResolver(editStaffSchema),
  });

  const openCreateModal = () => {
    setModalError(null);
    createForm.reset({
      fullName: '',
      email: '',
      phone: '',
      role: 'STAFF',
    });
    setCreateOpen(true);
  };

  const openEditModal = (target: AuthUser) => {
    setModalError(null);
    editForm.reset({
      fullName: target.fullName,
      phone: target.phone || '',
      role: target.role,
      isActive: target.isActive,
    });
    setEditingUser(target);
  };

  const handleCreateSubmit = async (values: CreateStaffValues) => {
    setModalError(null);
    try {
      const created = await createUser(values);
      setCreateOpen(false);
      notify('success', 'Team member added', `${created.fullName} (${created.role}) saved.`);
      await loadData();
    } catch (err) {
      setModalError(err instanceof ApiError ? err.message : 'Failed to create team member.');
    }
  };

  const handleEditSubmit = async (values: EditStaffValues) => {
    if (!editingUser) return;
    setModalError(null);
    try {
      const updated = await updateUser(editingUser.id, {
        fullName: values.fullName,
        phone: values.phone,
        role: values.role,
        isActive: values.isActive,
      });
      setEditingUser(null);
      notify('success', 'Profile updated', `${updated.fullName} settings saved.`);
      await loadData();
    } catch (err) {
      setModalError(err instanceof ApiError ? err.message : 'Failed to update profile.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    setDeleteBusy(true);
    try {
      await deleteUser(deletingUser.id);
      notify('success', 'Team member removed', `${deletingUser.fullName} has been removed.`);
      setDeletingUser(null);
      await loadData();
    } catch (err) {
      notify(
        'error',
        'Delete prevented',
        err instanceof ApiError ? err.message : 'Unable to delete profile.',
      );
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            User Management
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Manage shop administrator, manager, and counter staff directory profiles ({total} total).
          </p>
        </div>
        <Button type="button" onClick={openCreateModal}>
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          Add Team Member
        </Button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            placeholder="Search name, email, or phone..."
            aria-label="Search team members"
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
          />
        </div>

        <div
          role="group"
          aria-label="Filter by role"
          className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1"
        >
          {ROLE_FILTERS.map((rf) => {
            const active = roleFilter === rf.value;
            return (
              <button
                key={rf.value}
                type="button"
                onClick={() => {
                  setPage(1);
                  setRoleFilter(rf.value);
                }}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {rf.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Staff Table */}
      {loading ? (
        <TableSkeleton rows={5} />
      ) : users.length === 0 ? (
        <EmptyState
          title="No matching team members"
          description="Adjust your search query or role filter, or add a new staff member."
          action={
            <Button type="button" onClick={openCreateModal}>
              Add Team Member
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                  <th className="px-5 py-3">Member</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Added</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((member) => {
                  const isActivePersona = profile.email === member.email;
                  return (
                    <tr key={member.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-slate-900">
                          {member.fullName}
                          {isActivePersona && (
                            <span className="ml-2 text-xs font-normal text-indigo-600">
                              (Active Demo Profile)
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-slate-500">{member.email}</p>
                      </td>
                      <td className="px-4 py-3.5 text-xs font-medium text-slate-700 whitespace-nowrap">
                        {formatRoleLabel(member.role)}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-slate-600 whitespace-nowrap">
                        {member.phone || '—'}
                      </td>
                      <td className="px-4 py-3.5 text-xs font-medium whitespace-nowrap">
                        <span className={member.isActive ? 'text-emerald-700' : 'text-red-700'}>
                          {member.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-slate-500 whitespace-nowrap tabular-nums">
                        {formatDateTime(member.createdAt)}
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(member)}
                            aria-label={`Edit ${member.fullName}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingUser(member)}
                            aria-label={`Delete ${member.fullName}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-700 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3 text-xs text-slate-600">
              <span>
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent Activity Audit Log */}
      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="text-sm font-semibold text-slate-900">Recent Activity & Audit Trail</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Immutable log of team profile updates and operational events.
          </p>
        </div>
        <ul className="divide-y divide-slate-100">
          {auditLogs.map((log) => (
            <li
              key={log.id}
              className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-900">{log.summary}</p>
                <p className="text-[11px] text-slate-500">
                  {log.actorName} · {log.actorRole} · {log.action}
                </p>
              </div>
              <span className="shrink-0 font-mono text-[11px] text-slate-400 tabular-nums">
                {formatDateTime(log.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Create Team Member Modal */}
      <Modal
        open={createOpen}
        title="Add Team Member"
        description="Add a new staff, manager, or administrator profile to the shop directory."
        onClose={() => setCreateOpen(false)}
      >
        {modalError && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-800"
          >
            {modalError}
          </div>
        )}
        <form onSubmit={createForm.handleSubmit(handleCreateSubmit)} noValidate className="space-y-4">
          <div>
            <label htmlFor="create-name" className="block text-xs font-medium text-slate-700">
              Full name
            </label>
            <input
              id="create-name"
              type="text"
              placeholder="e.g. Tariq Mehmood"
              {...createForm.register('fullName')}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
            />
            {createForm.formState.errors.fullName && (
              <p className="mt-1 text-xs text-red-700">
                {createForm.formState.errors.fullName.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="create-email" className="block text-xs font-medium text-slate-700">
                Email address
              </label>
              <input
                id="create-email"
                type="email"
                placeholder="tariq@celltrack.pk"
                {...createForm.register('email')}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
              />
              {createForm.formState.errors.email && (
                <p className="mt-1 text-xs text-red-700">
                  {createForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="create-phone" className="block text-xs font-medium text-slate-700">
                Mobile number
              </label>
              <input
                id="create-phone"
                type="tel"
                placeholder="+92 300 1234567"
                {...createForm.register('phone')}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
              />
            </div>
          </div>

          <div>
            <label htmlFor="create-role" className="block text-xs font-medium text-slate-700">
              Assigned role
            </label>
            <select
              id="create-role"
              {...createForm.register('role')}
              className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
            >
              <option value="STAFF">Sales Staff</option>
              <option value="MANAGER">Store Manager</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={createForm.formState.isSubmitting}>
              Add Member
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Team Member Modal */}
      <Modal
        open={Boolean(editingUser)}
        title={`Edit ${editingUser?.fullName || 'Member'}`}
        description={editingUser?.email}
        onClose={() => setEditingUser(null)}
      >
        {modalError && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-800"
          >
            {modalError}
          </div>
        )}
        <form onSubmit={editForm.handleSubmit(handleEditSubmit)} noValidate className="space-y-4">
          <div>
            <label htmlFor="edit-name" className="block text-xs font-medium text-slate-700">
              Full name
            </label>
            <input
              id="edit-name"
              type="text"
              {...editForm.register('fullName')}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
            />
            {editForm.formState.errors.fullName && (
              <p className="mt-1 text-xs text-red-700">
                {editForm.formState.errors.fullName.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="edit-phone" className="block text-xs font-medium text-slate-700">
                Mobile number
              </label>
              <input
                id="edit-phone"
                type="tel"
                {...editForm.register('phone')}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
              />
            </div>

            <div>
              <label htmlFor="edit-role" className="block text-xs font-medium text-slate-700">
                Assigned role
              </label>
              <select
                id="edit-role"
                {...editForm.register('role')}
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
              >
                <option value="STAFF">Sales Staff</option>
                <option value="MANAGER">Store Manager</option>
                <option value="ADMIN">Administrator</option>
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              {...editForm.register('isActive')}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
            />
            <span>Active staff member</span>
          </label>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <Button type="button" variant="secondary" onClick={() => setEditingUser(null)}>
              Cancel
            </Button>
            <Button type="submit" loading={editForm.formState.isSubmitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(deletingUser)}
        title="Remove Team Member"
        message={`Are you sure you want to permanently remove ${deletingUser?.fullName} (${deletingUser?.email})? Historical sales and audit records remain preserved.`}
        confirmLabel="Remove Member"
        destructive
        loading={deleteBusy}
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setDeletingUser(null)}
      />
    </div>
  );
}
