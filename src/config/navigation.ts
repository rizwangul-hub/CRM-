import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Bell,
  BookOpen,
  Headphones,
  LayoutDashboard,
  Receipt,
  RotateCcw,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Truck,
  UserCog,
  Users,
  Wallet,
  Wrench,
  PackagePlus,
} from 'lucide-react';
import type { NavSectionId, UserRole } from '../types/crm';

export interface NavItem {
  id: NavSectionId;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
  roles: UserRole[];
  group: 'Core' | 'Catalog & Supply' | 'Sales & Service' | 'Finance & Admin';
}

export const NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    shortLabel: 'Home',
    description: 'Executive overview, sales velocity, stock health, and shop operations',
    icon: LayoutDashboard,
    roles: ['ADMIN', 'MANAGER', 'STAFF'],
    group: 'Core',
  },
  {
    id: 'pos',
    label: 'POS / New Sale',
    shortLabel: 'POS',
    description: 'Fast point-of-sale billing with IMEI capture, discounts, and receipts',
    icon: ShoppingCart,
    roles: ['ADMIN', 'MANAGER', 'STAFF'],
    group: 'Core',
  },
  {
    id: 'inventory',
    label: 'Products & Inventory',
    shortLabel: 'Phones',
    description: 'Manage smartphones, IMEI stock levels, pricing, and warranty coverage',
    icon: Smartphone,
    roles: ['ADMIN', 'MANAGER', 'STAFF'],
    group: 'Catalog & Supply',
  },
  {
    id: 'accessories',
    label: 'Accessories',
    shortLabel: 'Accessories',
    description: 'Chargers, earbuds, covers, cables, power banks, and audio stock',
    icon: Headphones,
    roles: ['ADMIN', 'MANAGER', 'STAFF'],
    group: 'Catalog & Supply',
  },
  {
    id: 'suppliers',
    label: 'Suppliers',
    shortLabel: 'Suppliers',
    description: 'Wholesalers, distributors, purchase volume, and payable balances',
    icon: Truck,
    roles: ['ADMIN', 'MANAGER'],
    group: 'Catalog & Supply',
  },
  {
    id: 'purchases',
    label: 'Purchases',
    shortLabel: 'Purchases',
    description: 'Record stock inward purchase orders and track supplier payments',
    icon: PackagePlus,
    roles: ['ADMIN', 'MANAGER'],
    group: 'Catalog & Supply',
  },
  {
    id: 'customers',
    label: 'Customers',
    shortLabel: 'Customers',
    description: 'Customer directory, purchase volume, credit balances, and profiles',
    icon: Users,
    roles: ['ADMIN', 'MANAGER', 'STAFF'],
    group: 'Sales & Service',
  },
  {
    id: 'sales',
    label: 'Sales History',
    shortLabel: 'Sales',
    description: 'Searchable invoice archive, payment breakdown, and receipt printing',
    icon: Receipt,
    roles: ['ADMIN', 'MANAGER', 'STAFF'],
    group: 'Sales & Service',
  },
  {
    id: 'repairs',
    label: 'Repairs & Services',
    shortLabel: 'Repairs',
    description: 'Repair intake tickets, technician tracking, and customer pickup status',
    icon: Wrench,
    roles: ['ADMIN', 'MANAGER', 'STAFF'],
    group: 'Sales & Service',
  },
  {
    id: 'warranties',
    label: 'Warranty Management',
    shortLabel: 'Warranty',
    description: 'IMEI warranty lookup, expiry alerts, and active claim coverage',
    icon: ShieldCheck,
    roles: ['ADMIN', 'MANAGER', 'STAFF'],
    group: 'Sales & Service',
  },
  {
    id: 'returns',
    label: 'Returns & Exchanges',
    shortLabel: 'Returns',
    description: 'Process invoice refunds and product exchanges with stock reconciliation',
    icon: RotateCcw,
    roles: ['ADMIN', 'MANAGER'],
    group: 'Sales & Service',
  },
  {
    id: 'ledger',
    label: 'Customer Ledger',
    shortLabel: 'Ledger',
    description: 'Track customer receivables, record payments, and print statements',
    icon: BookOpen,
    roles: ['ADMIN', 'MANAGER'],
    group: 'Finance & Admin',
  },
  {
    id: 'expenses',
    label: 'Expenses',
    shortLabel: 'Expenses',
    description: 'Shop rent, utilities, salaries, transport, and operating overhead',
    icon: Wallet,
    roles: ['ADMIN', 'MANAGER'],
    group: 'Finance & Admin',
  },
  {
    id: 'reports',
    label: 'Reports & Analytics',
    shortLabel: 'Reports',
    description: 'Revenue, estimated profit, stock valuation, and balance exports',
    icon: BarChart3,
    roles: ['ADMIN', 'MANAGER'],
    group: 'Finance & Admin',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    shortLabel: 'Alerts',
    description: 'Low stock, payment reminders, warranty alerts, and repair updates',
    icon: Bell,
    roles: ['ADMIN', 'MANAGER', 'STAFF'],
    group: 'Finance & Admin',
  },
  {
    id: 'users',
    label: 'User Management',
    shortLabel: 'Users',
    description: 'Manage shop admins, managers, sales staff, and repair technicians',
    icon: UserCog,
    roles: ['ADMIN'],
    group: 'Finance & Admin',
  },
  {
    id: 'settings',
    label: 'Settings',
    shortLabel: 'Settings',
    description: 'Shop profile, tax rules, invoice design, alerts, and demo reset',
    icon: Settings,
    roles: ['ADMIN'],
    group: 'Finance & Admin',
  },
];

export const NAV_GROUPS: Array<NavItem['group']> = [
  'Core',
  'Catalog & Supply',
  'Sales & Service',
  'Finance & Admin',
];

export function getNavItemsForRole(role: UserRole): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}

export function getNavItemById(id: NavSectionId): NavItem {
  return NAV_ITEMS.find((item) => item.id === id) || NAV_ITEMS[0];
}
