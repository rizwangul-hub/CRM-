import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Smartphone,
  Headphones,
  ShoppingCart,
  Users,
  Truck,
  Receipt,
  Wrench,
  ShieldCheck,
  RotateCcw,
  BarChart3,
  UserCog,
  Settings,
} from 'lucide-react';
import type { UserRole } from '../types/auth';

export type NavSectionId =
  | 'dashboard'
  | 'inventory'
  | 'accessories'
  | 'pos'
  | 'customers'
  | 'purchases'
  | 'expenses'
  | 'repairs'
  | 'warranties'
  | 'returns'
  | 'reports'
  | 'staff'
  | 'settings';

export interface NavItem {
  id: NavSectionId;
  label: string;
  group: 'Overview' | 'Retail Operations' | 'Service & Finance' | 'Administration';
  icon: LucideIcon;
  roles: readonly UserRole[];
  phase: number;
  summary: string;
  provisionedModels?: string[];
}

export const NAV_ITEMS: readonly NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    group: 'Overview',
    icon: LayoutDashboard,
    roles: ['ADMIN', 'MANAGER', 'STAFF'],
    phase: 1,
    summary: 'Real-time sales, stock, repairs, warranties, and financial analytics.',
  },
  {
    id: 'pos',
    label: 'POS & Sales',
    group: 'Retail Operations',
    icon: ShoppingCart,
    roles: ['ADMIN', 'MANAGER', 'STAFF'],
    phase: 4,
    summary: 'Point of Sale checkout, IMEI lookup, discounts, partial payments, and A4/thermal invoices.',
    provisionedModels: ['Sale', 'Product', 'Customer'],
  },
  {
    id: 'inventory',
    label: 'Phone Inventory',
    group: 'Retail Operations',
    icon: Smartphone,
    roles: ['ADMIN', 'MANAGER', 'STAFF'],
    phase: 2,
    summary: 'IMEI-tracked smartphones, condition grading, stock adjustments, and movement history.',
    provisionedModels: ['Product', 'Supplier'],
  },
  {
    id: 'accessories',
    label: 'Accessories',
    group: 'Retail Operations',
    icon: Headphones,
    roles: ['ADMIN', 'MANAGER', 'STAFF'],
    phase: 2,
    summary: 'Chargers, earbuds, covers, power banks, and SKU/barcode stock tracking.',
    provisionedModels: ['Product', 'Supplier'],
  },
  {
    id: 'customers',
    label: 'Customers',
    group: 'Retail Operations',
    icon: Users,
    roles: ['ADMIN', 'MANAGER', 'STAFF'],
    phase: 3,
    summary: 'Customer CRM profiles, duplicate-phone protection, credit ledger, and statements.',
    provisionedModels: ['Customer', 'Sale'],
  },
  {
    id: 'purchases',
    label: 'Purchases & Suppliers',
    group: 'Retail Operations',
    icon: Truck,
    roles: ['ADMIN', 'MANAGER'],
    phase: 3,
    summary: 'Supplier directory, wholesale stock purchases, cost updates, and payable ledgers.',
    provisionedModels: ['Supplier', 'Product'],
  },
  {
    id: 'repairs',
    label: 'Repairs & Service',
    group: 'Service & Finance',
    icon: Wrench,
    roles: ['ADMIN', 'MANAGER', 'STAFF'],
    phase: 6,
    summary: 'Repair job tickets, technician workflow statuses, repair payments, and receipts.',
    provisionedModels: ['Repair', 'Customer'],
  },
  {
    id: 'warranties',
    label: 'Warranties',
    group: 'Service & Finance',
    icon: ShieldCheck,
    roles: ['ADMIN', 'MANAGER', 'STAFF'],
    phase: 6,
    summary: 'IMEI warranty registration, invoice lookup, and expiration tracking.',
    provisionedModels: ['Warranty', 'Sale'],
  },
  {
    id: 'returns',
    label: 'Returns & Exchanges',
    group: 'Service & Finance',
    icon: RotateCcw,
    roles: ['ADMIN', 'MANAGER'],
    phase: 7,
    summary: 'Invoice return validation, IMEI verification, refunds, and device exchanges.',
    provisionedModels: ['Sale', 'Product'],
  },
  {
    id: 'expenses',
    label: 'Expenses',
    group: 'Service & Finance',
    icon: Receipt,
    roles: ['ADMIN'],
    phase: 5,
    summary: 'Shop rent, utilities, salaries, and daily/weekly/monthly expense reports.',
    provisionedModels: ['Expense'],
  },
  {
    id: 'reports',
    label: 'Reports & Analytics',
    group: 'Service & Finance',
    icon: BarChart3,
    roles: ['ADMIN', 'MANAGER'],
    phase: 8,
    summary: 'COGS-accurate profit reports, stock valuation, ledgers, and PDF/Excel export.',
    provisionedModels: ['Sale', 'Expense', 'Product', 'Customer', 'Supplier'],
  },
  {
    id: 'staff',
    label: 'User Management',
    group: 'Administration',
    icon: UserCog,
    roles: ['ADMIN'],
    phase: 1,
    summary: 'Manage Admin, Manager, and Staff directory records and review activity audit logs.',
  },
  {
    id: 'settings',
    label: 'Shop Settings',
    group: 'Administration',
    icon: Settings,
    roles: ['ADMIN'],
    phase: 8,
    summary: 'Shop identity, PKR currency, tax rules, invoice prefix, and database backups.',
    provisionedModels: ['ShopSettings'],
  },
];

export function getAccessibleNavItems(role: UserRole): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}
