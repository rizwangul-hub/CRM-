import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Shield } from 'lucide-react';
import { ROLE_PROFILES, useRole } from '../context/RoleContext';
import { useToast } from '../context/ToastContext';
import type { UserRole } from '../types/crm';

const ROLE_ORDER: readonly UserRole[] = ['ADMIN', 'MANAGER', 'STAFF'];

export function RoleSwitcher() {
  const { role, profile, setRole } = useRole();
  const { notify } = useToast();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const handleSelectRole = (nextRole: UserRole) => {
    setOpen(false);
    if (nextRole === role) return;
    setRole(nextRole);
    const nextProfile = ROLE_PROFILES[nextRole];
    notify('info', `Switched role to ${nextProfile.label}`, nextProfile.scopeSummary);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Switch role, current role ${profile.label}`}
        className="inline-flex min-h-[38px] items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-2xs transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 whitespace-nowrap shrink-0 cursor-pointer"
      >
        <Shield className="h-3.5 w-3.5 shrink-0 text-indigo-600" aria-hidden="true" />
        <span className="hidden sm:inline text-slate-500 font-normal">Role:</span>
        <span className="font-semibold text-slate-900">{profile.label}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-150 ${
            open ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Select workspace role"
          className="absolute right-0 mt-2 w-64 origin-top-right rounded-xl border border-slate-200 bg-white py-1.5 shadow-lg z-50"
        >
          <div className="border-b border-slate-100 px-3.5 py-2">
            <p className="text-xs font-semibold text-slate-900">Switch Active Role</p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Updates navigation & widgets immediately
            </p>
          </div>

          <div className="py-1">
            {ROLE_ORDER.map((optionRole) => {
              const option = ROLE_PROFILES[optionRole];
              const isSelected = optionRole === role;
              return (
                <button
                  key={optionRole}
                  type="button"
                  role="menuitemradio"
                  aria-checked={isSelected}
                  onClick={() => handleSelectRole(optionRole)}
                  className={`flex w-full items-start justify-between gap-3 px-3.5 py-2.5 text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50/70 text-indigo-950'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="min-w-0">
                    <p
                      className={`text-xs font-semibold ${
                        isSelected ? 'text-indigo-700' : 'text-slate-900'
                      }`}
                    >
                      {option.label}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-snug text-slate-500">
                      {option.scopeSummary}
                    </p>
                  </div>
                  {isSelected && (
                    <Check
                      className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600"
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div className="border-t border-slate-100 px-3.5 py-2">
            <p className="text-[11px] text-slate-400">
              Local demo mode · No login required
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
