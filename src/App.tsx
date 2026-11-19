import { useEffect, useState } from 'react';
import { RoleProvider, useRole } from './context/RoleContext';
import { ToastProvider } from './context/ToastContext';
import { DashboardLayout } from './layouts/DashboardLayout';
import { DashboardPage } from './pages/DashboardPage';
import { StaffManagementPage } from './pages/StaffManagementPage';
import { UpcomingModulePage } from './pages/UpcomingModulePage';
import { getAccessibleNavItems, type NavSectionId } from './config/navigation';

function AppShell() {
  const { role } = useRole();
  const [activeSection, setActiveSection] = useState<NavSectionId>('dashboard');
  const [shopName, setShopName] = useState('CellTrack Mobile Hub');

  // If switching roles revokes access to the currently open section, smoothly return to dashboard
  useEffect(() => {
    const allowedIds = getAccessibleNavItems(role).map((item) => item.id);
    if (!allowedIds.includes(activeSection)) {
      setActiveSection('dashboard');
    }
  }, [role, activeSection]);

  const accessibleItems = getAccessibleNavItems(role);
  const currentNavItem = accessibleItems.find((item) => item.id === activeSection);

  let pageContent;
  if (activeSection === 'dashboard') {
    pageContent = (
      <DashboardPage
        onNavigate={setActiveSection}
        onShopNameLoaded={(name) => setShopName(name)}
      />
    );
  } else if (activeSection === 'staff' && role === 'ADMIN') {
    pageContent = <StaffManagementPage />;
  } else if (currentNavItem) {
    pageContent = (
      <UpcomingModulePage item={currentNavItem} onReturnDashboard={setActiveSection} />
    );
  } else {
    pageContent = <DashboardPage onNavigate={setActiveSection} />;
  }

  return (
    <DashboardLayout
      activeSection={activeSection}
      onSelectSection={setActiveSection}
      shopName={shopName}
    >
      {pageContent}
    </DashboardLayout>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <RoleProvider>
        <AppShell />
      </RoleProvider>
    </ToastProvider>
  );
}
