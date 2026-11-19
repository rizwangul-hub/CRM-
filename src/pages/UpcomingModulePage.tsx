import { ArrowLeft, Database } from 'lucide-react';
import type { NavItem, NavSectionId } from '../config/navigation';
import { Button } from '../components/ui/Button';

interface UpcomingModulePageProps {
  item: NavItem;
  onReturnDashboard: (section: NavSectionId) => void;
}

export function UpcomingModulePage({ item, onReturnDashboard }: UpcomingModulePageProps) {
  const Icon = item.icon;
  return (
    <div className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="font-mono text-xs font-medium text-indigo-600">
            Scheduled for Phase {item.phase}
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
            {item.label}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.summary}</p>
        </div>
      </div>

      {item.provisionedModels && item.provisionedModels.length > 0 && (
        <div className="mt-6 border-t border-slate-200 pt-5">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
            <Database className="h-4 w-4 text-slate-400" aria-hidden="true" />
            <span>MongoDB Schemas Provisioned in Phase 1</span>
          </div>
          <p className="mt-1.5 font-mono text-xs text-slate-600">
            {item.provisionedModels.join(' · ')}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Phase 1 establishes the MongoDB collections, indexes, top-header role switching
            (Admin / Manager / Staff), user management, and real-time analytics dashboard. Full
            interactive workflows for this module activate in Phase {item.phase}.
          </p>
        </div>
      )}

      <div className="mt-6 flex items-center gap-3">
        <Button type="button" onClick={() => onReturnDashboard('dashboard')}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
