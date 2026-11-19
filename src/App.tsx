import { useEffect, useState } from 'react';
import { getNavItemsForRole } from './config/navigation';
import { RoleProvider, useRole } from './context/RoleContext';
import { ToastProvider } from './context/ToastContext';
import { DashboardLayout } from './layouts/DashboardLayout';
import { AccessoriesPage } from './pages/AccessoriesPage';
import { CustomerLedgerPage } from './pages/CustomerLedgerPage';
import { CustomersPage } from './pages/CustomersPage';
import { DashboardPage } from './pages/DashboardPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { InventoryPage } from './pages/InventoryPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { PosPage } from './pages/PosPage';
import { PurchasesPage } from './pages/PurchasesPage';
import { RepairsPage } from './pages/RepairsPage';
import { ReportsPage } from './pages/ReportsPage';
import { ReturnsPage } from './pages/ReturnsPage';
import { SalesHistoryPage } from './pages/SalesHistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { UsersPage } from './pages/UsersPage';
import { WarrantyPage } from './pages/WarrantyPage';
import { CrmProvider } from './store/crmStore';
import type { NavSectionId } from './types/crm';

function AppShell() {
  const { role } = useRole();
  const [activeSection, setActiveSection] = useState<NavSectionId>('dashboard');

  const allowedIds = getNavItemsForRole(role).map((item) => item.id);
  const currentSection: NavSectionId = allowedIds.includes(activeSection)
    ? activeSection
    : 'dashboard';

  useEffect(() => {
    if (!allowedIds.includes(activeSection)) {
      setActiveSection('dashboard');
    }
  }, [activeSection, allowedIds]);

  const renderSection = () => {
    switch (currentSection) {
      case 'dashboard':
        return <DashboardPage onNavigate={setActiveSection} />;
      case 'pos':
        return <PosPage />;
      case 'inventory':
        return <InventoryPage />;
      case 'accessories':
        return <AccessoriesPage />;
      case 'customers':
        return <CustomersPage />;
      case 'suppliers':
        return <SuppliersPage />;
      case 'purchases':
        return <PurchasesPage />;
      case 'sales':
        return <SalesHistoryPage />;
      case 'expenses':
        return <ExpensesPage />;
      case 'repairs':
        return <RepairsPage />;
      case 'warranties':
        return <WarrantyPage />;
      case 'ledger':
        return <CustomerLedgerPage />;
      case 'returns':
        return <ReturnsPage />;
      case 'reports':
        return <ReportsPage />;
      case 'notifications':
        return <NotificationsPage onNavigate={setActiveSection} />;
      case 'users':
        return <UsersPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage onNavigate={setActiveSection} />;
    }
  };

  return (
    <DashboardLayout activeSection={currentSection} onSelectSection={setActiveSection}>
      {renderSection()}
    </DashboardLayout>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <CrmProvider>
        <RoleProvider>
          <AppShell />
        </RoleProvider>
      </CrmProvider>
    </ToastProvider>
  );
}
