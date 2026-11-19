import { useEffect, useState, type ReactNode } from 'react';
import { Menu, X, Smartphone } from 'lucide-react';
import { useRole } from '../context/RoleContext';
import { getAccessibleNavItems, type NavItem, type NavSectionId } from '../config/navigation';
import { RoleSwitcher } from '../components/RoleSwitcher';
import { formatRoleLabel, getInitials } from '../utils/format';

interface DashboardLayoutProps {
  activeSection: NavSectionId;
  onSelectSection: (section: NavSectionId) => void;
  shopName?: string;
  headerAction?: ReactNode;
  children: ReactNode;
}

const GROUP_ORDER: NavItem['group'][] = [
  'Overview',
  'Retail Operations',
  'Service & Finance',
  'Administration',
];

export function DashboardLayout({
  activeSection,
  onSelectSection,
  shopName = 'CellTrack Mobile Hub',
  headerAction,
  children,
}: DashboardLayoutProps) {
  const { role, profile } = useRole();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileMenuOpen]);

  const accessibleItems = getAccessibleNavItems(role);
  const currentItem =
    accessibleItems.find((item) => item.id === activeSection) || accessibleItems[0];

  const handleNavigate = (section: NavSectionId) => {
    onSelectSection(section);
    setMobileMenuOpen(false);
  };

  const renderSidebarContent = () => (
    <div className="flex h-full flex-col bg-slate-900 text-slate-200">
      {/* Brand header */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800 px-5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <Smartphone className="h-4 w-4" aria-hidden="true" />
          </div>
          <span className="truncate font-semibold tracking-tight text-white text-base">
            CellTrack Pro
          </span>
        </div>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Close navigation menu"
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden cursor-pointer"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      {/* Navigation groups */}
      <nav aria-label="Main navigation" className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {GROUP_ORDER.map((groupName) => {
          const items = accessibleItems.filter((item) => item.group === groupName);
          if (items.length === 0) return null;
          return (
            <div key={groupName}>
              <p className="px-3 pb-1.5 text-xs font-medium text-slate-400">{groupName}</p>
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.id === activeSection;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => handleNavigate(item.id)}
                        aria-current={isActive ? 'page' : undefined}
                        className={`flex w-full items-center justify-between gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors duration-150 whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-indigo-400 ${
                          isActive
                            ? 'bg-indigo-600 text-white font-medium'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <span className="flex items-center gap-2.5 min-w-0">
                          <Icon
                            className={`h-4 w-4 shrink-0 ${
                              isActive ? 'text-white' : 'text-slate-400'
                            }`}
                            aria-hidden="true"
                          />
                          <span className="truncate">{item.label}</span>
                        </span>
                        {item.phase > 1 && (
                          <span
                            className={`text-[11px] font-mono shrink-0 ${
                              isActive ? 'text-indigo-100' : 'text-slate-500'
                            }`}
                          >
                            P{item.phase}
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

      {/* Active Demo Role Footer */}
      <div className="shrink-0 border-t border-slate-800 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-xs font-semibold text-indigo-300">
            {getInitials(profile.fullName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{profile.fullName}</p>
            <p className="truncate text-xs text-slate-400">
              {formatRoleLabel(role)} · Demo Mode
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // Mobile quick-nav items (compact bottom bar, max 4 items per role)
  const mobileQuickIds: NavSectionId[] =
    role === 'ADMIN'
      ? ['dashboard', 'pos', 'inventory', 'staff']
      : role === 'MANAGER'
        ? ['dashboard', 'pos', 'inventory', 'customers']
        : ['dashboard', 'pos', 'inventory', 'repairs'];

  const mobileQuickItems = mobileQuickIds
    .map((id) => accessibleItems.find((item) => item.id === id))
    .filter((item): item is NavItem => Boolean(item));

  return (
    <div className="flex min-h-screen w-full bg-slate-50 text-slate-900">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-64 lg:flex-col">
        {renderSidebarContent()}
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-[1px]"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] shadow-2xl">
            {renderSidebarContent()}
          </aside>
        </div>
      )}

      {/* Main Column */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        {/* Top Header */}
        <header className="sticky top-0 z-20 flex h-14 sm:h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 lg:hidden cursor-pointer"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
            <div className="flex min-w-0 items-center gap-2 text-sm">
              <span className="hidden sm:inline truncate text-slate-500">{shopName}</span>
              <span className="hidden sm:inline text-slate-300" aria-hidden="true">
                /
              </span>
              <h1 className="truncate font-semibold text-slate-900 text-base sm:text-sm">
                {currentItem?.label || 'Dashboard'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {headerAction}
            <RoleSwitcher />
          </div>
        </header>

        {/* Main Viewport */}
        <main className="flex-1 px-4 py-6 pb-20 sm:px-6 lg:px-8 lg:pb-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>

        {/* Compact Mobile Bottom Bar (56px height) */}
        <nav
          aria-label="Mobile quick navigation"
          className="fixed inset-x-0 bottom-0 z-20 grid h-14 grid-cols-4 border-t border-slate-200 bg-white lg:hidden"
        >
          {mobileQuickItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === activeSection;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigate(item.id)}
                className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors cursor-pointer ${
                  isActive ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span className="truncate max-w-[76px]">{item.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
