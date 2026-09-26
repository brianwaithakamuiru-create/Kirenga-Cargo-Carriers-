import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Receipt,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Printer,
  ChevronRight,
  TrendingUp,
  Search
} from 'lucide-react';
import { db, COLLECTIONS } from '../../lib/firestoreService';
import { Invoice, Payment, DriverExpense } from '../../types';
import { EmptyState } from '../common/EmptyState';

interface FinanceWorkplaceProps {
  onNavigate: (view: string) => void;
}

export const FinanceWorkplace: React.FC<FinanceWorkplaceProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'invoices' | 'payments' | 'expenses'>('invoices');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<DriverExpense[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [invList, payList, expList] = await Promise.all([
        db.getAll<Invoice>(COLLECTIONS.INVOICES),
        db.getAll<Payment>(COLLECTIONS.PAYMENTS),
        db.getAll<DriverExpense>(COLLECTIONS.DRIVER_EXPENSES),
      ]);
      setInvoices(invList);
      setPayments(payList);
      setExpenses(expList);
    } catch (e) {
      console.error('Error loading finance data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsubInv = db.subscribe(COLLECTIONS.INVOICES, loadData);
    const unsubPay = db.subscribe(COLLECTIONS.PAYMENTS, loadData);
    const unsubExp = db.subscribe(COLLECTIONS.DRIVER_EXPENSES, loadData);
    return () => {
      unsubInv();
      unsubPay();
      unsubExp();
    };
  }, []);

  const handleApproveExpense = async (exp: DriverExpense) => {
    try {
      await db.update<DriverExpense>(COLLECTIONS.DRIVER_EXPENSES, exp.id, {
        status: 'APPROVED',
      });
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRejectExpense = async (exp: DriverExpense) => {
    try {
      await db.update<DriverExpense>(COLLECTIONS.DRIVER_EXPENSES, exp.id, {
        status: 'REJECTED',
      });
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const totalRevenue = payments
    .filter((p) => p.status === 'SUCCESS')
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingInvoiced = invoices
    .filter((i) => i.status === 'PENDING')
    .reduce((sum, i) => sum + i.amount, 0);

  const pendingExpenses = expenses.filter((e) => e.status === 'SUBMITTED' || e.status === 'UNDER_REVIEW');

  return (
    <div className="min-h-screen bg-[#050816] text-[#F8FAFC]">
      {/* Top Bar */}
      <div className="bg-[#080D1F] border-b border-slate-800 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-600/30">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold font-['Poppins'] text-white">Finance & Accounts Workplace</h1>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                FINANCIAL DESK
              </span>
            </div>
            <p className="text-xs text-slate-400">Invoices, client settlements, payment reconciliation, and driver corridor disbursements</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('admin')}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs border border-slate-700 transition-colors"
          >
            Admin Center
          </button>
          <button
            onClick={() => onNavigate('home')}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs border border-slate-700 transition-colors"
          >
            Public Website
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-800 bg-[#080D1F]/50 px-6 flex gap-3 text-xs font-medium">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'invoices' ? 'border-emerald-400 text-emerald-300 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Invoices ({invoices.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'payments' ? 'border-emerald-400 text-emerald-300 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Settlements & Payments ({payments.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'expenses' ? 'border-emerald-400 text-emerald-300 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Driver Claims ({pendingExpenses.length} pending)</span>
        </button>
      </div>

      {/* Main Container */}
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#0B1329] border border-slate-800 p-5 rounded-2xl">
            <span className="text-xs text-slate-400 block uppercase font-medium">Total Realized Revenue</span>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
              USD {totalRevenue.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">Verified received settlements</span>
          </div>

          <div className="bg-[#0B1329] border border-slate-800 p-5 rounded-2xl">
            <span className="text-xs text-slate-400 block uppercase font-medium">Uncollected Invoices</span>
            <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
              USD {pendingInvoiced.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">Awaiting customer payment</span>
          </div>

          <div className="bg-[#0B1329] border border-slate-800 p-5 rounded-2xl">
            <span className="text-xs text-slate-400 block uppercase font-medium">Pending Driver Expense Claims</span>
            <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">
              {pendingExpenses.length} claims
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">Fuel, weighbridge & border toll review</span>
          </div>
        </div>

        {/* Tab 1: Invoices */}
        {activeTab === 'invoices' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white font-['Poppins']">Freight Billing Invoices</h2>
            <div className="grid grid-cols-1 gap-3">
              {invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="p-4 rounded-2xl bg-[#0B1329] border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-bold text-white">{inv.invoiceReference}</span>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                          inv.status === 'SUCCESS'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {inv.status}
                      </span>
                      <span className="text-slate-300">Client: <strong>{inv.customerName}</strong></span>
                    </div>
                    <div className="text-slate-400 text-xs mt-1">
                      {inv.description} • Due: {inv.dueDate} • Shipment: {inv.shipmentNumber || 'General'}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-mono font-bold text-white text-base">
                      {inv.currency} {inv.amount.toLocaleString()}
                    </span>
                    <button
                      onClick={() => window.print()}
                      className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700"
                      title="Print Invoice"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Payments */}
        {activeTab === 'payments' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white font-['Poppins']">Confirmed Customer Settlements</h2>
            <div className="overflow-x-auto bg-[#0B1329] border border-slate-800 rounded-2xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] font-mono border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Txn Reference</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Invoice Ref</th>
                    <th className="px-4 py-3">Payment Channel</th>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-900/50">
                      <td className="px-4 py-3 font-mono font-bold text-white">{p.transactionReference}</td>
                      <td className="px-4 py-3">{p.customerName}</td>
                      <td className="px-4 py-3 font-mono text-cyan-400">{p.invoiceReference}</td>
                      <td className="px-4 py-3">{p.paymentMethod}</td>
                      <td className="px-4 py-3 font-mono text-slate-400">{new Date(p.timestamp).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400">
                        {p.currency} {p.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Driver Claims */}
        {activeTab === 'expenses' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white font-['Poppins']">Driver Corridor Expense Claims</h2>
            {expenses.length === 0 ? (
              <EmptyState
                icon={<DollarSign className="w-7 h-7 text-cyan-400" />}
                title="No Expense Claims"
                description="No driver road expense claims submitted."
              />
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {expenses.map((exp) => (
                  <div
                    key={exp.id}
                    className="p-4 rounded-2xl bg-[#0B1329] border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-white">{exp.category}</span>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                            exp.status === 'APPROVED'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : exp.status === 'REJECTED'
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {exp.status}
                        </span>
                        <span className="text-slate-400">Driver ID: <strong className="text-slate-200">{exp.driverId}</strong></span>
                      </div>
                      <div className="text-slate-400 text-xs mt-1">
                        {exp.description} • Trip ID: {exp.tripId} • {new Date(exp.date || exp.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-base text-cyan-400">
                        {exp.currency} {exp.amount.toLocaleString()}
                      </span>
                      {(exp.status === 'SUBMITTED' || exp.status === 'UNDER_REVIEW') && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleApproveExpense(exp)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectExpense(exp)}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                          >
                            Decline
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
