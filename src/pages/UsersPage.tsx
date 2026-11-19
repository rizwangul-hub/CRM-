import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../context/ToastContext';
import { useCrm } from '../store/crmStore';
import type { TeamMember, UserRole } from '../types/crm';
import { formatShortDate, getInitials } from '../utils/format';

const ROLE_TITLES: TeamMember['roleTitle'][] = [
  'Admin User',
  'Shop Manager',
  'Sales Staff',
  'Repair Technician',
];

export function UsersPage() {
  const { state, addTeamMember, updateTeamMember, deleteTeamMember } = useCrm();
  const { notify } = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [deleting, setDeleting] = useState<TeamMember | null>(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    roleTitle: 'Sales Staff' as TeamMember['roleTitle'],
    accessLevel: 'STAFF' as UserRole,
    status: 'Active' as 'Active' | 'Inactive',
    branch: 'Hall Road Main Branch',
  });

  const openAdd = () => {
    setEditing(null);
    setForm({
      name: '',
      email: '',
      phone: '',
      roleTitle: 'Sales Staff',
      accessLevel: 'STAFF',
      status: 'Active',
      branch: 'Hall Road Main Branch',
    });
    setFormOpen(true);
  };

  const openEdit = (member: TeamMember) => {
    setEditing(member);
    setForm({
      name: member.name,
      email: member.email,
      phone: member.phone,
      roleTitle: member.roleTitle,
      accessLevel: member.accessLevel,
      status: member.status,
      branch: member.branch,
    });
    setFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (editing) {
      updateTeamMember(editing.id, form);
      notify('success', 'Team member updated', `${form.name} details saved.`);
    } else {
      addTeamMember({
        ...form,
        joinedDate: new Date().toISOString().slice(0, 10),
      });
      notify('success', 'Team member added', `${form.name} added to staff directory.`);
    }
    setFormOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Shop Staff & Role Directory</h2>
          <p className="text-xs text-slate-500">
            Manage shop admins, managers, sales associates, and repair technicians.
          </p>
        </div>
        <Button type="button" size="sm" onClick={openAdd}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add Team Member
        </Button>
      </div>

      {/* Role Profile Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {state.users.map((member) => (
          <div
            key={member.id}
            className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-2xs"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-xs font-bold text-white">
                    {getInitials(member.name)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-slate-900">{member.name}</h3>
                    <p className="text-xs font-medium text-indigo-600">{member.roleTitle}</p>
                  </div>
                </div>
                <span
                  className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold ${
                    member.status === 'Active'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 bg-slate-100 text-slate-600'
                  }`}
                >
                  {member.status}
                </span>
              </div>

              <div className="mt-4 space-y-1 text-xs text-slate-600">
                <p className="truncate">{member.email}</p>
                <p className="tabular-nums">{member.phone}</p>
                <p className="text-[11px] text-slate-400">
                  {member.branch} · Joined {formatShortDate(member.joinedDate)}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => {
                  const nextStatus = member.status === 'Active' ? 'Inactive' : 'Active';
                  updateTeamMember(member.id, { status: nextStatus });
                  notify('info', `${member.name} marked ${nextStatus}`);
                }}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700 cursor-pointer"
              >
                {member.status === 'Active' ? 'Deactivate' : 'Activate'}
              </button>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => openEdit(member)}
                  aria-label={`Edit ${member.name}`}
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleting(member)}
                  aria-label={`Delete ${member.name}`}
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal open={formOpen} title={editing ? 'Edit Team Member' : 'Add Team Member'} onClose={() => setFormOpen(false)}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700">Full Name</label>
              <input
                required
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">Email</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">Phone</label>
              <input
                required
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">Role Title</label>
              <select
                value={form.roleTitle}
                onChange={(e) => {
                  const title = e.target.value as TeamMember['roleTitle'];
                  const accessLevel: UserRole =
                    title === 'Admin User'
                      ? 'ADMIN'
                      : title === 'Shop Manager'
                        ? 'MANAGER'
                        : 'STAFF';
                  setForm({ ...form, roleTitle: title, accessLevel });
                }}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                {ROLE_TITLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">Branch</label>
              <input
                type="text"
                value={form.branch}
                onChange={(e) => setForm({ ...form, branch: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">{editing ? 'Save Changes' : 'Add Member'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Remove Team Member"
        message={`Remove ${deleting?.name} from the shop team directory?`}
        confirmLabel="Remove"
        destructive
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) {
            deleteTeamMember(deleting.id);
            notify('success', 'Team member removed');
          }
          setDeleting(null);
        }}
      />
    </div>
  );
}
