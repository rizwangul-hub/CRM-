import { useEffect, useState, type ReactNode } from 'react';
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Menu,
  MoreHorizontal,
  Smartphone,
  X,
} from 'lucide-react';
import {
  getNavItemById,
  getNavItemsForRole,
  NAV_GROUPS,
} from '../config/navigation';
import { RoleSwitcher } from '../components/RoleSwitcher';
import { useRole } from '../context/RoleContext';
import { useCrm } from '../store/crmStore';
import type { NavSectionId } from '../types/crm';
import { formatRoleLabel, getInitials } from '../utils/format';

interface DashboardLayoutProps {
  activeSection: NavSectionId;
  onSelectSection: (section: NavSectionId) => void;
  children: ReactNode;
}

export function DashboardLayout({
  activeSection,
  onSelectSection,
  children,
}: DashboardLayoutProps) {
  const { role, profile } = useRole();
  const { state } = useCrm();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = getNavItemsForRole(role);
  const activeItem = getNavItemById(activeSection);
  const unreadCount = state.notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileMenuOpen]);

  const handleNavigate = (id: NavSectionId) => {
    onSelectSection(id);
    setMobileMenuOpen(false);
  };

  const bottomQuickIds: NavSectionId[] = ['dashboard', 'pos', 'inventory', 'repairs'];
  const bottomQuickItems = bottomQuickIds
    .map((id) => navItems.find((item) => item.id === id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const renderSidebarNav = (collapsed: boolean) => (
    <div className="flex h-full flex-col bg-[#0F172A] text-slate-200">
      <div
        className={`flex h-16 items-center border-b border-slate-800/80 px-4 ${
          collapsed ? 'justify-center' : 'justify-between'
        }`}
      >
        <button
          type="button"
          onClick={() => handleNavigate('dashboard')}
          className="flex items-center gap-2.5 text-left focus-visible:outline-2 focus-visible:outline-indigo-400 rounded-lg cursor-pointer"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
            <Smartphone className="h-5 w-5" aria-hidden="true" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-bold tracking-tight text-white font-display">
                {state.settings.shopName}
              </p>
              <p className="truncate text-[11px] text-slate-400">Mobile Shop CRM</p>
            </div>
          )}
        </button>

        {!collapsed && (
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close navigation menu"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden cursor-pointer"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </div>

      <nav
        aria-label="Primary CRM Navigation"
        className="flex-1 overflow-y-auto px-3 py-3 space-y-3"
      >
        {NAV_GROUPS.map((group) => {
          const items = navItems.filter((item) => item.group === group);
          if (items.length === 0) return null;
          return (
            <div key={group}>
              {!collapsed && (
                <p className="mb-1 px-2.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                  {group}
                </p>
              )}
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.id === activeSection;
                  const showBadge = item.id === 'notifications' && unreadCount > 0;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => handleNavigate(item.id)}
                        title={collapsed ? item.label : undefined}
                        aria-current={isActive ? 'page' : undefined}
                        className={`group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors cursor-pointer ${
                          collapsed ? 'justify-center' : 'justify-between'
                        } ${
                          isActive
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                        }`}
                      >
                        <span className="flex min-w-0 items-center gap-2.5">
                          <Icon
                            className={`h-4 w-4 shrink-0 ${
                              isActive
                                ? 'text-white'
                                : 'text-slate-400 group-hover:text-slate-200'
                            }`}
                            aria-hidden="true"
                          />
                          {!collapsed && <span className="truncate">{item.label}</span>}
                        </span>
                        {!collapsed && showBadge && (
                          <span
                            className={`inline-flex min-w-[20px] items-center justify-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${
                              isActive
                                ? 'bg-white/20 text-white'
                                : 'bg-indigo-500/20 text-indigo-300'
                            }`}
                          >
                            {unreadCount}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-slate-800/80 p-3">
        <div
          className={`flex items-center gap-2.5 rounded-lg bg-slate-800/60 px-2.5 py-2 ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/25 text-xs font-semibold text-indigo-200">
            {getInitials(profile.fullName)}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white">{profile.fullName}</p>
              <p className="truncate text-[11px] text-slate-400">
                {formatRoleLabel(role)} Workspace
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      {/* Desktop Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden border-r border-slate-800 transition-all duration-200 lg:block ${
          sidebarCollapsed ? 'w-[74px]' : 'w-64'
        }`}
      >
        {renderSidebarNav(sidebarCollapsed)}
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-[1px]"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 flex w-72 max-w-[85vw] flex-col shadow-2xl">
            {renderSidebarNav(false)}
          </div>
        </div>
      )}

      {/* Main Content Shell */}
      <div
        className={`flex min-h-screen flex-col transition-all duration-200 ${
          sidebarCollapsed ? 'lg:pl-[74px]' : 'lg:pl-64'
        }`}
      >
        {/* Top Navigation Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur-sm sm:px-6 print:hidden">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 lg:hidden cursor-pointer"
            >
              <Menu className="h-4 w-4" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="hidden h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 lg:inline-flex cursor-pointer"
            >
              {sidebarCollapsed ? (
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              ) : (
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              )}
            </button>

            <div className="min-w-0">
              <h1 className="truncate text-base font-bold tracking-tight text-slate-900 sm:text-lg font-display">
                {activeItem.label}
              </h1>
              <p className="hidden truncate text-xs text-slate-500 md:block">
                {activeItem.description}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
            <span
              className="hidden items-center rounded-md border border-indigo-200 bg-indigo-50 px-2 py-1 text-[10px] font-semibold tracking-wider text-indigo-700 sm:inline-flex"
              title="Interactive frontend demonstration with browser localStorage persistence"
            >
              DEMO MODE
            </span>

            <button
              type="button"
              onClick={() => handleNavigate('notifications')}
              aria-label={`Notifications, ${unreadCount} unread`}
              className="relative inline-flex h-[38px] w-[38px] items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
            >
              <Bell className="h-4 w-4" aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white tabular-nums">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            <RoleSwitcher />
          </div>
        </header>

        {/* Active Module View */}
        <main
          className={`flex-1 px-4 pt-5 pb-20 sm:px-6 lg:pb-8 ${
            state.settings.compactDensity ? 'py-4' : 'py-6'
          }`}
        >
          <div className="mx-auto w-full max-w-[1440px]">{children}</div>
        </main>

        {/* Mobile Bottom Quick Navigation */}
        <nav
          aria-label="Mobile quick navigation"
          className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-slate-200 bg-white/95 px-1 py-1.5 backdrop-blur-sm lg:hidden print:hidden"
        >
          {bottomQuickItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === activeSection;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigate(item.id)}
                className={`flex min-w-[60px] flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                  isActive ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span>{item.shortLabel}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="flex min-w-[60px] flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-[11px] font-medium text-slate-500 hover:text-slate-900 cursor-pointer"
          >
            <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
            <span>More</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
