import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { createInitialCrmState } from '../data/seedData';
import type {
  CrmState,
  Customer,
  Expense,
  Product,
  RepairStatus,
  RepairTicket,
  ShopSettings,
  Supplier,
  TeamMember,
  WarrantyRecord,
  WarrantyStatus,
} from '../types/crm';
import {
  completePosSale,
  processReturnOrExchange,
  recordCustomerPayment,
  recordPurchaseOrder,
  type CompleteSaleInput,
  type CreatePurchaseInput,
  type ProcessReturnInput,
  type RecordPaymentInput,
} from './crmEngine';

const CRM_STORAGE_KEY = 'celltrack_crm_demo_v1';

function loadInitialState(): CrmState {
  if (typeof window === 'undefined') return createInitialCrmState();
  try {
    const raw = window.localStorage.getItem(CRM_STORAGE_KEY);
    if (!raw) return createInitialCrmState();
    const parsed = JSON.parse(raw) as Partial<CrmState>;
    const seed = createInitialCrmState();
    if (!Array.isArray(parsed.products) || !Array.isArray(parsed.sales)) {
      return seed;
    }
    return {
      ...seed,
      ...parsed,
      settings: { ...seed.settings, ...(parsed.settings || {}) },
      baseline: { ...seed.baseline, ...(parsed.baseline || {}) },
    };
  } catch {
    return createInitialCrmState();
  }
}

interface CrmContextValue {
  state: CrmState;
  resetDemoData: () => void;
  // Products & Accessories
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => Product;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (id: string, delta: number) => void;
  // Customers
  addCustomer: (customer: Omit<Customer, 'id' | 'registeredAt' | 'totalPurchases' | 'totalPaid' | 'outstandingBalance'>) => Customer;
  updateCustomer: (id: string, patch: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  // Suppliers
  addSupplier: (supplier: Omit<Supplier, 'id' | 'totalPurchases' | 'paidAmount' | 'outstandingBalance'>) => Supplier;
  updateSupplier: (id: string, patch: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  // POS, Purchases, Ledger, Returns
  completeSale: (input: CompleteSaleInput) => ReturnType<typeof completePosSale>['sale'];
  createPurchase: (input: CreatePurchaseInput) => ReturnType<typeof recordPurchaseOrder>['purchase'];
  collectPayment: (input: RecordPaymentInput) => ReturnType<typeof recordCustomerPayment>['payment'];
  submitReturn: (input: ProcessReturnInput) => ReturnType<typeof processReturnOrExchange>['record'];
  // Expenses
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  updateExpense: (id: string, patch: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  // Repairs
  addRepair: (repair: Omit<RepairTicket, 'id' | 'ticketNumber'>) => RepairTicket;
  updateRepair: (id: string, patch: Partial<RepairTicket>) => void;
  updateRepairStatus: (id: string, status: RepairStatus) => void;
  deleteRepair: (id: string) => void;
  // Warranties
  addWarranty: (warranty: Omit<WarrantyRecord, 'id'>) => void;
  updateWarrantyStatus: (id: string, status: WarrantyStatus) => void;
  // Notifications
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  dismissNotification: (id: string) => void;
  // Team Users
  addTeamMember: (member: Omit<TeamMember, 'id'>) => void;
  updateTeamMember: (id: string, patch: Partial<TeamMember>) => void;
  deleteTeamMember: (id: string) => void;
  // Settings
  updateSettings: (patch: Partial<ShopSettings>) => void;
}

const CrmContext = createContext<CrmContextValue | null>(null);

export function CrmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CrmState>(() => loadInitialState());

  useEffect(() => {
    try {
      window.localStorage.setItem(CRM_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota errors
    }
  }, [state]);

  const resetDemoData = useCallback(() => {
    const fresh = createInitialCrmState();
    setState(fresh);
    try {
      window.localStorage.setItem(CRM_STORAGE_KEY, JSON.stringify(fresh));
    } catch {
      // Ignore
    }
  }, []);

  const addProduct = useCallback((product: Omit<Product, 'id' | 'createdAt'>) => {
    const created: Product = {
      ...product,
      id: `${product.kind === 'PHONE' ? 'prod' : 'acc'}-${Date.now()}`,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setState((prev) => ({ ...prev, products: [created, ...prev.products] }));
    return created;
  }, []);

  const updateProduct = useCallback((id: string, patch: Partial<Product>) => {
    setState((prev) => ({
      ...prev,
      products: prev.products.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));
  }, []);

  const deleteProduct = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      products: prev.products.filter((p) => p.id !== id),
    }));
  }, []);

  const adjustStock = useCallback((id: string, delta: number) => {
    setState((prev) => ({
      ...prev,
      products: prev.products.map((p) =>
        p.id === id ? { ...p, quantity: Math.max(0, p.quantity + delta) } : p,
      ),
    }));
  }, []);

  const addCustomer = useCallback(
    (
      customer: Omit<
        Customer,
        'id' | 'registeredAt' | 'totalPurchases' | 'totalPaid' | 'outstandingBalance'
      >,
    ) => {
      const created: Customer = {
        ...customer,
        id: `cust-${Date.now()}`,
        registeredAt: new Date().toISOString().slice(0, 10),
        totalPurchases: 0,
        totalPaid: 0,
        outstandingBalance: 0,
      };
      setState((prev) => ({ ...prev, customers: [created, ...prev.customers] }));
      return created;
    },
    [],
  );

  const updateCustomer = useCallback((id: string, patch: Partial<Customer>) => {
    setState((prev) => ({
      ...prev,
      customers: prev.customers.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  }, []);

  const deleteCustomer = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      customers: prev.customers.filter((c) => c.id !== id),
    }));
  }, []);

  const addSupplier = useCallback(
    (supplier: Omit<Supplier, 'id' | 'totalPurchases' | 'paidAmount' | 'outstandingBalance'>) => {
      const created: Supplier = {
        ...supplier,
        id: `sup-${Date.now()}`,
        totalPurchases: 0,
        paidAmount: 0,
        outstandingBalance: 0,
      };
      setState((prev) => ({ ...prev, suppliers: [created, ...prev.suppliers] }));
      return created;
    },
    [],
  );

  const updateSupplier = useCallback((id: string, patch: Partial<Supplier>) => {
    setState((prev) => ({
      ...prev,
      suppliers: prev.suppliers.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  }, []);

  const deleteSupplier = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      suppliers: prev.suppliers.filter((s) => s.id !== id),
    }));
  }, []);

  const completeSale = useCallback(
    (input: CompleteSaleInput) => {
      const result = completePosSale(state, input);
      setState(result.nextState);
      return result.sale;
    },
    [state],
  );

  const createPurchase = useCallback(
    (input: CreatePurchaseInput) => {
      const result = recordPurchaseOrder(state, input);
      setState(result.nextState);
      return result.purchase;
    },
    [state],
  );

  const collectPayment = useCallback(
    (input: RecordPaymentInput) => {
      const result = recordCustomerPayment(state, input);
      setState(result.nextState);
      return result.payment;
    },
    [state],
  );

  const submitReturn = useCallback(
    (input: ProcessReturnInput) => {
      const result = processReturnOrExchange(state, input);
      setState(result.nextState);
      return result.record;
    },
    [state],
  );

  const addExpense = useCallback((expense: Omit<Expense, 'id'>) => {
    setState((prev) => ({
      ...prev,
      expenses: [{ ...expense, id: `exp-${Date.now()}` }, ...prev.expenses],
    }));
  }, []);

  const updateExpense = useCallback((id: string, patch: Partial<Expense>) => {
    setState((prev) => ({
      ...prev,
      expenses: prev.expenses.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }));
  }, []);

  const deleteExpense = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      expenses: prev.expenses.filter((e) => e.id !== id),
    }));
  }, []);

  const addRepair = useCallback(
    (repair: Omit<RepairTicket, 'id' | 'ticketNumber'>) => {
      const created: RepairTicket = {
        ...repair,
        id: `rep-${Date.now()}`,
        ticketNumber: `REP-2026-${206 + state.repairs.length}`,
      };
      setState((prev) => ({ ...prev, repairs: [created, ...prev.repairs] }));
      return created;
    },
    [state.repairs.length],
  );

  const updateRepair = useCallback((id: string, patch: Partial<RepairTicket>) => {
    setState((prev) => ({
      ...prev,
      repairs: prev.repairs.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }));
  }, []);

  const updateRepairStatus = useCallback((id: string, status: RepairStatus) => {
    setState((prev) => {
      const target = prev.repairs.find((r) => r.id === id);
      const nextNotifications = [...prev.notifications];
      if (target && status === 'Ready for Delivery' && target.status !== 'Ready for Delivery') {
        nextNotifications.unshift({
          id: `not-rep-${Date.now()}`,
          type: 'Repair Ready',
          title: `Repair ${target.ticketNumber} ready for pickup`,
          message: `${target.customerName}'s ${target.brand} ${target.model} is ready for delivery.`,
          date: new Date().toISOString().slice(0, 10),
          read: false,
          targetSection: 'repairs',
        });
      }
      return {
        ...prev,
        repairs: prev.repairs.map((r) => (r.id === id ? { ...r, status } : r)),
        notifications: nextNotifications,
      };
    });
  }, []);

  const deleteRepair = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      repairs: prev.repairs.filter((r) => r.id !== id),
    }));
  }, []);

  const addWarranty = useCallback((warranty: Omit<WarrantyRecord, 'id'>) => {
    setState((prev) => ({
      ...prev,
      warranties: [{ ...warranty, id: `war-${Date.now()}` }, ...prev.warranties],
    }));
  }, []);

  const updateWarrantyStatus = useCallback((id: string, status: WarrantyStatus) => {
    setState((prev) => ({
      ...prev,
      warranties: prev.warranties.map((w) => (w.id === id ? { ...w, status } : w)),
    }));
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, read: true })),
    }));
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.filter((n) => n.id !== id),
    }));
  }, []);

  const addTeamMember = useCallback((member: Omit<TeamMember, 'id'>) => {
    setState((prev) => ({
      ...prev,
      users: [{ ...member, id: `usr-${Date.now()}` }, ...prev.users],
    }));
  }, []);

  const updateTeamMember = useCallback((id: string, patch: Partial<TeamMember>) => {
    setState((prev) => ({
      ...prev,
      users: prev.users.map((u) => (u.id === id ? { ...u, ...patch } : u)),
    }));
  }, []);

  const deleteTeamMember = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      users: prev.users.filter((u) => u.id !== id),
    }));
  }, []);

  const updateSettings = useCallback((patch: Partial<ShopSettings>) => {
    setState((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...patch },
    }));
  }, []);

  const value = useMemo<CrmContextValue>(
    () => ({
      state,
      resetDemoData,
      addProduct,
      updateProduct,
      deleteProduct,
      adjustStock,
      addCustomer,
      updateCustomer,
      deleteCustomer,
      addSupplier,
      updateSupplier,
      deleteSupplier,
      completeSale,
      createPurchase,
      collectPayment,
      submitReturn,
      addExpense,
      updateExpense,
      deleteExpense,
      addRepair,
      updateRepair,
      updateRepairStatus,
      deleteRepair,
      addWarranty,
      updateWarrantyStatus,
      markNotificationRead,
      markAllNotificationsRead,
      dismissNotification,
      addTeamMember,
      updateTeamMember,
      deleteTeamMember,
      updateSettings,
    }),
    [
      state,
      resetDemoData,
      addProduct,
      updateProduct,
      deleteProduct,
      adjustStock,
      addCustomer,
      updateCustomer,
      deleteCustomer,
      addSupplier,
      updateSupplier,
      deleteSupplier,
      completeSale,
      createPurchase,
      collectPayment,
      submitReturn,
      addExpense,
      updateExpense,
      deleteExpense,
      addRepair,
      updateRepair,
      updateRepairStatus,
      deleteRepair,
      addWarranty,
      updateWarrantyStatus,
      markNotificationRead,
      markAllNotificationsRead,
      dismissNotification,
      addTeamMember,
      updateTeamMember,
      deleteTeamMember,
      updateSettings,
    ],
  );

  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>;
}

export function useCrm(): CrmContextValue {
  const ctx = useContext(CrmContext);
  if (!ctx) {
    throw new Error('useCrm must be used inside CrmProvider');
  }
  return ctx;
}
