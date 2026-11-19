import { useMemo, useState } from 'react';
import { ArrowRight, CheckCheck, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { useToast } from '../context/ToastContext';
import { useCrm } from '../store/crmStore';
import type { NavSectionId, NotificationType } from '../types/crm';
import { formatShortDate } from '../utils/format';

interface NotificationsPageProps {
  onNavigate: (section: NavSectionId) => void;
}

const ALERT_TYPES: Array<'ALL' | NotificationType> = [
  'ALL',
  'Low Stock',
  'New Sale',
  'Pending Payment',
  'Warranty Expiring',
  'Repair Ready',
  'Supplier Payment Due',
];

function typeBadgeClass(type: NotificationType): string {
  switch (type) {
    case 'Low Stock':
    case 'Warranty Expiring':
      return 'border-amber-200 bg-amber-50 text-amber-700';
    case 'New Sale':
    case 'Repair Ready':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'Pending Payment':
    case 'Supplier Payment Due':
      return 'border-rose-200 bg-rose-50 text-rose-700';
    default:
      return 'border-slate-200 bg-slate-50 text-slate-700';
  }
}

export function NotificationsPage({ onNavigate }: NotificationsPageProps) {
  const { state, markNotificationRead, markAllNotificationsRead, dismissNotification } = useCrm();
  const { notify } = useToast();

  const [typeFilter, setTypeFilter] = useState<'ALL' | NotificationType>('ALL');
  const [unreadOnly, setUnreadOnly] = useState(false);

  const filtered = useMemo(
    () =>
      state.notifications.filter((n) => {
        if (unreadOnly && n.read) return false;
        if (typeFilter !== 'ALL' && n.type !== typeFilter) return false;
        return true;
      }),
    [state.notifications, typeFilter, unreadOnly],
  );

  const unreadCount = state.notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {ALERT_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(t)}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                typeFilter === t
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t === 'ALL' ? 'All Alerts' : t}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => setUnreadOnly(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600"
            />
            Unread only ({unreadCount})
          </label>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={unreadCount === 0}
            onClick={() => {
              markAllNotificationsRead();
              notify('success', 'All notifications marked read');
            }}
          >
            <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Mark All Read
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No alerts right now"
          description="You are all caught up on shop notifications for this filter."
        />
      ) : (
        <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
          {filtered.map((item) => (
            <div
              key={item.id}
              className={`flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${
                item.read ? 'bg-white' : 'bg-indigo-50/30'
              }`}
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold ${typeBadgeClass(
                      item.type,
                    )}`}
                  >
                    {item.type}
                  </span>
                  {!item.read && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600">
                      New
                    </span>
                  )}
                  <span className="text-[11px] text-slate-400">{formatShortDate(item.date)}</span>
                </div>
                <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                <p className="text-xs text-slate-600">{item.message}</p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {!item.read && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => markNotificationRead(item.id)}
                  >
                    Mark Read
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    markNotificationRead(item.id);
                    onNavigate(item.targetSection);
                  }}
                >
                  Open <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
                <button
                  type="button"
                  onClick={() => dismissNotification(item.id)}
                  aria-label={`Dismiss ${item.title}`}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
