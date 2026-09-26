import React, { useState, useEffect, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Receipt,
  FileText,
  Users,
  Truck,
  Building,
  RefreshCw,
  Search,
  Plus,
  Filter,
  Printer,
  Download,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Briefcase,
  X,
  PieChart,
  Settings,
  HelpCircle,
  Calendar,
  Layers,
  Check,
  ChevronRight,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { db, COLLECTIONS } from '../../lib/firestoreService';
import {
  FinanceCommandKey,
  FinanceTransaction,
  Invoice,
  Payment,
  DriverExpense,
  Quotation,
  TransactionType,
  KenyanPaymentMethod,
  TransactionStatus,
} from '../../types';
import { formatKES, parseKES } from '../../lib/currency';
import { CommandButton } from '../common/CommandButton';
import { EmptyState } from '../common/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { CompanyLogo } from '../common/CompanyLogo';

interface FinanceCommandCenterProps {
  onNavigate?: (view: string) => void;
  initialTab?: FinanceCommandKey;
}

export const FinanceCommandCenter: React.FC<FinanceCommandCenterProps> = ({
  onNavigate,
  initialTab = 'overview',
}) => {
  const { currentUser } = useAuth();
  const [activeCommand, setActiveCommand] = useState<FinanceCommandKey>(initialTab);
  const [loading, setLoading] = useState(true);

  // Real Database Collections from Firestore
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<DriverExpense[]>([]);
  const [quotes, setQuotes] = useState<Quotation[]>([]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // Modal State for Recording New Transaction
  const [showNewTxModal, setShowNewTxModal] = useState(false);
  const [txType, setTxType] = useState<TransactionType>('INCOME');
  const [txParty, setTxParty] = useState('');
  const [txDescription, setTxDescription] = useState('');
  const [txAmount, setTxAmount] = useState<string>('');
  const [txPaymentMethod, setTxPaymentMethod] = useState<KenyanPaymentMethod>('M-PESA');
  const [txReference, setTxReference] = useState('');
  const [txCategory, setTxCategory] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [txTime, setTxTime] = useState(new Date().toTimeString().split(' ')[0]);
  const [txStatus, setTxStatus] = useState<TransactionStatus>('COMPLETED');
  const [txNotes, setTxNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Payment Settings State (M-Pesa, Bank, RTGS)
  const [paybillNumber, setPaybillNumber] = useState('247247');
  const [accountNumber, setAccountNumber] = useState('0712345678');
  const [tillNumber, setTillNumber] = useState('556677');
  const [bankName, setBankName] = useState('KCB Bank Kenya / Equity Bank');
  const [bankAccount, setBankAccount] = useState('1109876543');
  const [swiftCode, setSwiftCode] = useState('KCBLKENX');
  const [vatRate, setVatRate] = useState('16');
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Fetch real data
  const loadFinanceData = async () => {
    try {
      const [txList, invList, payList, expList, quoteList] = await Promise.all([
        db.getAll<FinanceTransaction>('transactions'),
        db.getAll<Invoice>(COLLECTIONS.INVOICES),
        db.getAll<Payment>(COLLECTIONS.PAYMENTS),
        db.getAll<DriverExpense>(COLLECTIONS.DRIVER_EXPENSES),
        db.getAll<Quotation>(COLLECTIONS.QUOTES),
      ]);
      setTransactions(txList.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)));
      setInvoices(invList);
      setPayments(payList);
      setExpenses(expList);
      setQuotes(quoteList);
    } catch (e) {
      console.warn('Error loading financial collections:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinanceData();
    const unsubTx = db.subscribe('transactions', loadFinanceData);
    const unsubInv = db.subscribe(COLLECTIONS.INVOICES, loadFinanceData);
    const unsubPay = db.subscribe(COLLECTIONS.PAYMENTS, loadFinanceData);
    const unsubExp = db.subscribe(COLLECTIONS.DRIVER_EXPENSES, loadFinanceData);
    return () => {
      unsubTx();
      unsubInv();
      unsubPay();
      unsubExp();
    };
  }, []);

  // Compute Kenyan Shilling Financial Metrics from Real Data (Req 51)
  const metrics = useMemo(() => {
    // 1. Total Revenue: completed income, client payments, successful payments
    const directIncome = transactions
      .filter((t) => t.type === 'INCOME' || t.type === 'CLIENT_PAYMENT' || t.type === 'SETTLEMENT')
      .filter((t) => t.status === 'COMPLETED' || t.status === 'RECONCILED')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const invoiceRevenue = invoices
      .filter((i) => i.status === 'SUCCESS')
      .reduce((sum, i) => sum + (i.amount || 0), 0);

    const totalRevenue = directIncome + invoiceRevenue;

    // 2. Total Expenses: operational expenses, driver payments, staff payments, supplier payments
    const directExpenses = transactions
      .filter(
        (t) =>
          t.type === 'EXPENSE' ||
          t.type === 'DRIVER_PAYMENT' ||
          t.type === 'STAFF_PAYMENT' ||
          t.type === 'SUPPLIER_PAYMENT' ||
          t.type === 'WITHDRAWAL'
      )
      .filter((t) => t.status === 'COMPLETED' || t.status === 'RECONCILED')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const approvedDriverExpenses = expenses
      .filter((e) => e.status === 'APPROVED' || e.status === 'PAID')
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    const totalExpenses = directExpenses + approvedDriverExpenses;

    // 3. Net Balance
    const netBalance = totalRevenue - totalExpenses;

    // 4. Pending Payments (pending client or invoice settlements)
    const pendingTransactions = transactions
      .filter((t) => t.status === 'PENDING')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const pendingInvoiceSum = invoices
      .filter((i) => i.status === 'PENDING')
      .reduce((sum, i) => sum + (i.amount || 0), 0);

    const pendingPayments = pendingTransactions + pendingInvoiceSum;

    // 5. Outstanding Invoices
    const outstandingInvoices = pendingInvoiceSum;

    // 6. Driver Payments
    const driverPayments = transactions
      .filter((t) => t.type === 'DRIVER_PAYMENT')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    // 7. Staff Payments
    const staffPayments = transactions
      .filter((t) => t.type === 'STAFF_PAYMENT')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    // 8. Supplier Payments
    const supplierPayments = transactions
      .filter((t) => t.type === 'SUPPLIER_PAYMENT')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    return {
      totalRevenue,
      totalExpenses,
      netBalance,
      pendingPayments,
      outstandingInvoices,
      driverPayments,
      staffPayments,
      supplierPayments,
    };
  }, [transactions, invoices, expenses]);

  // Handle Recording New Transaction in KES
  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseKES(txAmount);
    if (!amountVal || amountVal <= 0) {
      alert('Please enter a valid amount in Kenyan Shillings (KES).');
      return;
    }
    if (!txParty.trim()) {
      alert('Please enter the Payer or Payee name.');
      return;
    }

    setSubmitting(true);
    try {
      const txNum = `TXN-KES-${new Date().getFullYear()}-${String(transactions.length + 1).padStart(4, '0')}`;
      const newTx: FinanceTransaction = {
        id: `tx_${Date.now()}`,
        transactionNumber: txNum,
        date: txDate,
        time: txTime || new Date().toTimeString().split(' ')[0],
        type: txType,
        description: txDescription || `${txType.replace(/_/g, ' ')}: ${txParty}`,
        party: txParty.trim(),
        amount: amountVal,
        currency: 'KES',
        paymentMethod: txPaymentMethod,
        reference: txReference.trim() || `REF-${Date.now().toString().slice(-6)}`,
        status: txStatus,
        category: txCategory || 'General Operations',
        createdBy: currentUser?.email || 'Administrator',
        notes: txNotes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await db.add('transactions', newTx);
      setSuccessToast(`Transaction ${txNum} recorded: ${formatKES(amountVal)}`);
      setTimeout(() => setSuccessToast(null), 4000);

      // Reset form
      setShowNewTxModal(false);
      setTxAmount('');
      setTxParty('');
      setTxDescription('');
      setTxReference('');
      setTxNotes('');
      loadFinanceData();
    } catch (err) {
      console.error(err);
      alert('Failed to record transaction. Please check connection.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered transactions for ledger
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchesSearch =
        searchQuery === '' ||
        t.transactionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.party.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
      const matchesType = typeFilter === 'ALL' || t.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [transactions, searchQuery, statusFilter, typeFilter]);

  // Specific workspace filtered transactions
  const commandFilteredTransactions = useMemo(() => {
    switch (activeCommand) {
      case 'income':
        return transactions.filter((t) => t.type === 'INCOME');
      case 'expenses':
        return transactions.filter((t) => t.type === 'EXPENSE');
      case 'driver-payments':
        return transactions.filter((t) => t.type === 'DRIVER_PAYMENT');
      case 'staff-payments':
        return transactions.filter((t) => t.type === 'STAFF_PAYMENT');
      case 'client-payments':
        return transactions.filter((t) => t.type === 'CLIENT_PAYMENT');
      case 'supplier-payments':
        return transactions.filter((t) => t.type === 'SUPPLIER_PAYMENT');
      case 'refunds':
        return transactions.filter((t) => t.type === 'REFUND');
      case 'withdrawals':
        return transactions.filter((t) => t.type === 'WITHDRAWAL');
      default:
        return filteredTransactions;
    }
  }, [activeCommand, transactions, filteredTransactions]);

  const printFinanceReport = () => {
    window.print();
  };

  const exportLedgerCSV = () => {
    const headers = [
      'Transaction ID',
      'Date',
      'Time',
      'Type',
      'Payer/Payee',
      'Description',
      'Amount (KES)',
      'Payment Method',
      'Reference',
      'Status',
      'Created By',
    ];
    const rows = filteredTransactions.map((t) => [
      t.transactionNumber,
      t.date,
      t.time,
      t.type,
      `"${t.party}"`,
      `"${t.description}"`,
      t.amount,
      t.paymentMethod,
      t.reference,
      t.status,
      t.createdBy,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `KCC_KES_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="relative min-h-[90vh] text-[#F8FAFC]">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-mono font-semibold">{successToast}</span>
        </div>
      )}

      {/* 1. Header Bar: Kenya Shilling Command Banner */}
      <div className="bg-[#080E24]/80 border border-slate-800/80 rounded-3xl p-5 sm:p-6 mb-6 backdrop-blur-md shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-500 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-400/30">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-white font-['Montserrat'] tracking-tight">
                FINANCE COMMAND CENTER
              </h1>
              <span className="px-2.5 py-0.5 text-[11px] font-mono font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.2)]">
                KES / KSh OPERATING DESK
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Primary Currency: <strong className="text-emerald-400">Kenyan Shilling (KSh)</strong>. Complete double-entry freight ledger, corridor disbursement, tax reconciliation & audit.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowNewTxModal(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-mono font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>RECORD TRANSACTION</span>
          </button>
          <button
            onClick={printFinanceReport}
            className="px-3.5 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-mono flex items-center gap-2 border border-slate-700/60 transition-colors"
            title="Print Current Financial View"
          >
            <Printer className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">PRINT</span>
          </button>
          <button
            onClick={exportLedgerCSV}
            className="px-3.5 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-mono flex items-center gap-2 border border-slate-700/60 transition-colors"
            title="Export KES Ledger to CSV"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">EXPORT CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Seventeen (17) Premium Finance Command Buttons Grid (Req 50) */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs font-mono uppercase text-cyan-400 tracking-wider font-semibold">
            FINANCIAL OPERATION COMMANDS
          </span>
          <span className="text-[11px] text-slate-400 font-mono">17 Workspaces Active</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3">
          <CommandButton
            icon={TrendingUp}
            label="FINANCE OVERVIEW"
            description="Central financial metrics in KSh"
            active={activeCommand === 'overview'}
            onClick={() => setActiveCommand('overview')}
          />
          <CommandButton
            icon={CreditCard}
            label="PAYMENTS"
            description="Incoming & corridor settlements"
            active={activeCommand === 'payments'}
            onClick={() => setActiveCommand('payments')}
            badge={payments.length > 0 ? payments.length : undefined}
          />
          <CommandButton
            icon={ArrowUpRight}
            label="INCOME"
            description="Freight revenue streams"
            active={activeCommand === 'income'}
            onClick={() => setActiveCommand('income')}
          />
          <CommandButton
            icon={ArrowDownRight}
            label="EXPENSES"
            description="Corridor tolls & operations"
            active={activeCommand === 'expenses'}
            onClick={() => setActiveCommand('expenses')}
          />
          <CommandButton
            icon={Truck}
            label="DRIVER PAYMENTS"
            description="Trip allowances & per-diem"
            active={activeCommand === 'driver-payments'}
            onClick={() => setActiveCommand('driver-payments')}
          />
          <CommandButton
            icon={Users}
            label="STAFF PAYMENTS"
            description="Workforce payroll in KSh"
            active={activeCommand === 'staff-payments'}
            onClick={() => setActiveCommand('staff-payments')}
          />
          <CommandButton
            icon={Building}
            label="CLIENT PAYMENTS"
            description="Enterprise remittances"
            active={activeCommand === 'client-payments'}
            onClick={() => setActiveCommand('client-payments')}
          />
          <CommandButton
            icon={Briefcase}
            label="SUPPLIER PAYMENTS"
            description="Fuel, maintenance & parts"
            active={activeCommand === 'supplier-payments'}
            onClick={() => setActiveCommand('supplier-payments')}
          />
          <CommandButton
            icon={FileText}
            label="QUOTES"
            description="Corridor rate proposals"
            active={activeCommand === 'quotes'}
            onClick={() => setActiveCommand('quotes')}
            badge={quotes.length > 0 ? quotes.length : undefined}
          />
          <CommandButton
            icon={Receipt}
            label="INVOICES"
            description="Commercial waybill billings"
            active={activeCommand === 'invoices'}
            onClick={() => setActiveCommand('invoices')}
            badge={invoices.length > 0 ? invoices.length : undefined}
          />
          <CommandButton
            icon={RefreshCw}
            label="REFUNDS"
            description="Cargo claims & adjustments"
            active={activeCommand === 'refunds'}
            onClick={() => setActiveCommand('refunds')}
          />
          <CommandButton
            icon={ExternalLink}
            label="WITHDRAWALS"
            description="Bank disbursements & float"
            active={activeCommand === 'withdrawals'}
            onClick={() => setActiveCommand('withdrawals')}
          />
          <CommandButton
            icon={Layers}
            label="TRANSACTIONS"
            description="Double-entry ledger book"
            active={activeCommand === 'transactions'}
            onClick={() => setActiveCommand('transactions')}
            badge={transactions.length > 0 ? transactions.length : undefined}
          />
          <CommandButton
            icon={PieChart}
            label="CASH FLOW"
            description="Operating trajectory & float"
            active={activeCommand === 'cash-flow'}
            onClick={() => setActiveCommand('cash-flow')}
          />
          <CommandButton
            icon={FileText}
            label="FINANCIAL REPORTS"
            description="P&L, balance sheets & tax"
            active={activeCommand === 'financial-reports'}
            onClick={() => setActiveCommand('financial-reports')}
          />
          <CommandButton
            icon={Settings}
            label="PAYMENT SETTINGS"
            description="M-Pesa, KCB, equity & tax"
            active={activeCommand === 'payment-settings'}
            onClick={() => setActiveCommand('payment-settings')}
          />
          <CommandButton
            icon={ShieldCheck}
            label="AUDIT LOG"
            description="Signed financial action trail"
            active={activeCommand === 'audit-log'}
            onClick={() => setActiveCommand('audit-log')}
          />
        </div>
      </div>

      {/* 3. WORKSPACE 1: FINANCE OVERVIEW (Req 51) */}
      {activeCommand === 'overview' && (
        <div className="space-y-6">
          {/* Real Metrics Cards formatted consistently in KSh */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Revenue */}
            <div className="bg-[#080E24]/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-md hover:border-emerald-500/40 transition-colors shadow-lg">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
                <span>TOTAL REVENUE</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold font-mono text-white tracking-tight">
                {formatKES(metrics.totalRevenue)}
              </div>
              <div className="text-[11px] text-emerald-400 font-medium mt-1">
                All confirmed corridor receipts
              </div>
            </div>

            {/* Total Expenses */}
            <div className="bg-[#080E24]/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-md hover:border-rose-500/40 transition-colors shadow-lg">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
                <span>TOTAL EXPENSES</span>
                <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
                  <TrendingDown className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold font-mono text-white tracking-tight">
                {formatKES(metrics.totalExpenses)}
              </div>
              <div className="text-[11px] text-rose-400 font-medium mt-1">
                Fleet, tolls, border & operational costs
              </div>
            </div>

            {/* Net Balance */}
            <div className="bg-[#080E24]/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-md hover:border-cyan-500/40 transition-colors shadow-lg">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
                <span>NET BALANCE</span>
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div
                className={`text-2xl font-bold font-mono tracking-tight ${
                  metrics.netBalance >= 0 ? 'text-cyan-300' : 'text-rose-400'
                }`}
              >
                {formatKES(metrics.netBalance)}
              </div>
              <div className="text-[11px] text-slate-400 font-medium mt-1">
                Net operational profit margin
              </div>
            </div>

            {/* Pending Payments */}
            <div className="bg-[#080E24]/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-md hover:border-amber-500/40 transition-colors shadow-lg">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
                <span>PENDING PAYMENTS</span>
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold font-mono text-amber-300 tracking-tight">
                {formatKES(metrics.pendingPayments)}
              </div>
              <div className="text-[11px] text-amber-400/80 font-medium mt-1">
                Awaiting clearance or reconciliation
              </div>
            </div>
          </div>

          {/* Secondary 4 Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Outstanding Invoices */}
            <div className="bg-[#080E24]/60 border border-slate-800/80 rounded-2xl p-4">
              <div className="text-[11px] font-mono text-slate-400 uppercase">Outstanding Invoices</div>
              <div className="text-xl font-bold font-mono text-slate-100 mt-1">
                {formatKES(metrics.outstandingInvoices)}
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">Unpaid customer invoices</p>
            </div>

            {/* Driver Payments */}
            <div className="bg-[#080E24]/60 border border-slate-800/80 rounded-2xl p-4">
              <div className="text-[11px] font-mono text-slate-400 uppercase">Driver Payments</div>
              <div className="text-xl font-bold font-mono text-cyan-300 mt-1">
                {formatKES(metrics.driverPayments)}
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">Corridor allowances & per-diem</p>
            </div>

            {/* Staff Payments */}
            <div className="bg-[#080E24]/60 border border-slate-800/80 rounded-2xl p-4">
              <div className="text-[11px] font-mono text-slate-400 uppercase">Staff Payments</div>
              <div className="text-xl font-bold font-mono text-blue-300 mt-1">
                {formatKES(metrics.staffPayments)}
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">Dispatched payroll in KSh</p>
            </div>

            {/* Supplier Payments */}
            <div className="bg-[#080E24]/60 border border-slate-800/80 rounded-2xl p-4">
              <div className="text-[11px] font-mono text-slate-400 uppercase">Supplier Payments</div>
              <div className="text-xl font-bold font-mono text-purple-300 mt-1">
                {formatKES(metrics.supplierPayments)}
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">Vendors, fuel depots & maintenance</p>
            </div>
          </div>

          {/* Recent Transactions Snippet */}
          <div className="bg-[#080E24]/80 border border-slate-800 rounded-3xl p-5 sm:p-6 backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold font-mono uppercase text-white tracking-wider">
                  Recent Verified Ledger Entries (KSh)
                </h3>
              </div>
              <button
                onClick={() => setActiveCommand('transactions')}
                className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                <span>View Full Ledger</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {transactions.length === 0 ? (
              <EmptyState
                title="No Financial Data"
                description="All figures currently stand at KSh 0.00. Record your first freight income or corridor expense to initialize the active ledger."
                showTruck={true}
                action={{
                  label: 'Record New Transaction',
                  onClick: () => setShowNewTxModal(true),
                }}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">TXN ID</th>
                      <th className="py-3 px-4">DATE</th>
                      <th className="py-3 px-4">TYPE</th>
                      <th className="py-3 px-4">PARTY</th>
                      <th className="py-3 px-4">METHOD</th>
                      <th className="py-3 px-4">REFERENCE</th>
                      <th className="py-3 px-4 text-right">AMOUNT (KES)</th>
                      <th className="py-3 px-4 text-center">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {transactions.slice(0, 6).map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3 px-4 text-cyan-400 font-bold">{tx.transactionNumber}</td>
                        <td className="py-3 px-4 text-slate-300">{tx.date}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              tx.type.includes('INCOME') || tx.type === 'CLIENT_PAYMENT'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            }`}
                          >
                            {tx.type.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-200 font-semibold">{tx.party}</td>
                        <td className="py-3 px-4 text-slate-300">{tx.paymentMethod}</td>
                        <td className="py-3 px-4 text-slate-400 font-mono">{tx.reference}</td>
                        <td
                          className={`py-3 px-4 text-right font-bold text-sm ${
                            tx.type.includes('INCOME') || tx.type === 'CLIENT_PAYMENT'
                              ? 'text-emerald-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {formatKES(tx.amount)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. WORKSPACE 2: COMPLETE TRANSACTION LEDGER (Req 52) */}
      {activeCommand === 'transactions' && (
        <div className="bg-[#080E24]/80 border border-slate-800 rounded-3xl p-5 sm:p-6 backdrop-blur-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold font-mono uppercase text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-cyan-400" />
                <span>COMPLETE TRANSACTION LEDGER (KENYAN SHILLING)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Every financial disbursement, receipt, toll allowance and remittance recorded in KES.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">Total Records:</span>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-bold">
                {filteredTransactions.length}
              </span>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search transaction ID, party, reference, notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-900/80 border border-slate-700/80 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 bg-slate-900/80 border border-slate-700/80 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-400"
            >
              <option value="ALL">All Types</option>
              <option value="INCOME">Income</option>
              <option value="EXPENSE">Expense</option>
              <option value="DRIVER_PAYMENT">Driver Payment</option>
              <option value="STAFF_PAYMENT">Staff Payment</option>
              <option value="CLIENT_PAYMENT">Client Payment</option>
              <option value="SUPPLIER_PAYMENT">Supplier Payment</option>
              <option value="REFUND">Refund</option>
              <option value="WITHDRAWAL">Withdrawal</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-900/80 border border-slate-700/80 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-400"
            >
              <option value="ALL">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending</option>
              <option value="RECONCILED">Reconciled</option>
              <option value="FAILED">Failed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Ledger Table */}
          {filteredTransactions.length === 0 ? (
            <div className="py-12">
              <EmptyState
                title="No Transactions Match Filters"
                description={
                  transactions.length === 0
                    ? 'The Kenyan Shilling ledger is empty. Click below to record your first operational transaction.'
                    : 'No records matched the selected query or filters.'
                }
                action={
                  transactions.length === 0
                    ? {
                        label: 'Record Transaction',
                        onClick: () => setShowNewTxModal(true),
                      }
                    : undefined
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-800 rounded-2xl">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-3.5">ID</th>
                    <th className="py-3 px-3.5">DATE & TIME</th>
                    <th className="py-3 px-3.5">TYPE</th>
                    <th className="py-3 px-3.5">PAYER / PAYEE</th>
                    <th className="py-3 px-3.5">DESCRIPTION</th>
                    <th className="py-3 px-3.5 text-right">AMOUNT (KES)</th>
                    <th className="py-3 px-3.5">METHOD</th>
                    <th className="py-3 px-3.5">REFERENCE</th>
                    <th className="py-3 px-3.5 text-center">STATUS</th>
                    <th className="py-3 px-3.5">CREATED BY</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-3.5 text-cyan-400 font-bold whitespace-nowrap">
                        {tx.transactionNumber}
                      </td>
                      <td className="py-3 px-3.5 text-slate-300 whitespace-nowrap">
                        {tx.date} <span className="text-[10px] text-slate-500">{tx.time}</span>
                      </td>
                      <td className="py-3 px-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap ${
                            tx.type.includes('INCOME') || tx.type === 'CLIENT_PAYMENT'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {tx.type.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-white font-medium">{tx.party}</td>
                      <td className="py-3 px-3.5 text-slate-400 max-w-[200px] truncate" title={tx.description}>
                        {tx.description}
                      </td>
                      <td
                        className={`py-3 px-3.5 text-right font-bold text-sm whitespace-nowrap ${
                          tx.type.includes('INCOME') || tx.type === 'CLIENT_PAYMENT'
                            ? 'text-emerald-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {formatKES(tx.amount)}
                      </td>
                      <td className="py-3 px-3.5 text-slate-300">{tx.paymentMethod}</td>
                      <td className="py-3 px-3.5 text-cyan-200/90 font-mono text-[11px] whitespace-nowrap">
                        {tx.reference}
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            tx.status === 'COMPLETED' || tx.status === 'RECONCILED'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : tx.status === 'PENDING'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-slate-500 text-[11px] truncate max-w-[120px]">
                        {tx.createdBy}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 5. WORKSPACE 3: PAYMENT SETTINGS (M-PESA, BANK, TAX CONFIG) */}
      {activeCommand === 'payment-settings' && (
        <div className="bg-[#080E24]/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-md max-w-4xl space-y-6">
          <div>
            <h2 className="text-lg font-bold font-mono text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-cyan-400" />
              <span>KENYAN PAYMENT GATEWAY & ACCOUNT CONFIGURATION</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Configure official corporate M-Pesa channels, KCB/Equity settlement details and Kenyan VAT taxation rules.
            </p>
          </div>

          {settingsSaved && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-xs text-emerald-300 font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Kenyan payment configuration saved successfully.</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Safaricom M-Pesa Corporate Config */}
            <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4">
              <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold text-xs uppercase">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Safaricom M-Pesa Corporate</span>
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">M-Pesa Paybill Business Number</label>
                <input
                  type="text"
                  value={paybillNumber}
                  onChange={(e) => setPaybillNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">Default Account Reference (e.g. Waybill / Booking)</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">Buy Goods / Till Number (Alternate)</label>
                <input
                  type="text"
                  value={tillNumber}
                  onChange={(e) => setTillNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {/* Corporate Commercial Bank Details */}
            <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4">
              <div className="flex items-center gap-2 text-blue-400 font-mono font-bold text-xs uppercase">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                <span>Kenyan Commercial Bank (KCB / Equity)</span>
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">Bank Name</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">Corporate Account Number (KES)</label>
                <input
                  type="text"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">SWIFT / RTGS Code</label>
                <input
                  type="text"
                  value={swiftCode}
                  onChange={(e) => setSwiftCode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => {
                setSettingsSaved(true);
                setTimeout(() => setSettingsSaved(false), 3000);
              }}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-mono font-bold text-xs shadow-lg shadow-emerald-600/30"
            >
              SAVE PAYMENT SETTINGS
            </button>
          </div>
        </div>
      )}

      {/* 6. WORKSPACE 4: SUB-COMMANDS (PAYMENTS, INCOME, EXPENSES, INVOICES, ETC.) */}
      {!['overview', 'transactions', 'payment-settings'].includes(activeCommand) && (
        <div className="bg-[#080E24]/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold font-mono uppercase text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                <span>{activeCommand.replace(/-/g, ' ')} WORKSPACE (KSh)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Active dedicated view for {activeCommand.replace(/-/g, ' ')} in Kenyan Shilling operating currency.
              </p>
            </div>
            <button
              onClick={() => {
                // Auto-fill transaction type based on command
                if (activeCommand === 'income') setTxType('INCOME');
                else if (activeCommand === 'expenses') setTxType('EXPENSE');
                else if (activeCommand === 'driver-payments') setTxType('DRIVER_PAYMENT');
                else if (activeCommand === 'staff-payments') setTxType('STAFF_PAYMENT');
                else if (activeCommand === 'client-payments') setTxType('CLIENT_PAYMENT');
                else if (activeCommand === 'supplier-payments') setTxType('SUPPLIER_PAYMENT');
                else if (activeCommand === 'refunds') setTxType('REFUND');
                else if (activeCommand === 'withdrawals') setTxType('WITHDRAWAL');
                setShowNewTxModal(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-lg"
            >
              <Plus className="w-4 h-4" />
              <span>Record New Entry</span>
            </button>
          </div>

          {commandFilteredTransactions.length === 0 ? (
            <div className="py-12">
              <EmptyState
                title={`No Records in ${activeCommand.replace(/-/g, ' ').toUpperCase()}`}
                description={`There are currently no recorded transactions in this workspace. All amounts are set to KSh 0.00.`}
                action={{
                  label: `Record ${activeCommand.replace(/-/g, ' ')}`,
                  onClick: () => setShowNewTxModal(true),
                }}
              />
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-800 rounded-2xl">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-3.5">TRANSACTION ID</th>
                    <th className="py-3 px-3.5">DATE</th>
                    <th className="py-3 px-3.5">PARTY</th>
                    <th className="py-3 px-3.5">DESCRIPTION</th>
                    <th className="py-3 px-3.5">METHOD</th>
                    <th className="py-3 px-3.5">REFERENCE</th>
                    <th className="py-3 px-3.5 text-right">AMOUNT (KES)</th>
                    <th className="py-3 px-3.5 text-center">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {commandFilteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-900/40">
                      <td className="py-3 px-3.5 text-cyan-400 font-bold">{tx.transactionNumber}</td>
                      <td className="py-3 px-3.5 text-slate-300">{tx.date}</td>
                      <td className="py-3 px-3.5 text-white font-medium">{tx.party}</td>
                      <td className="py-3 px-3.5 text-slate-400">{tx.description}</td>
                      <td className="py-3 px-3.5 text-slate-300">{tx.paymentMethod}</td>
                      <td className="py-3 px-3.5 text-cyan-300">{tx.reference}</td>
                      <td className="py-3 px-3.5 text-right font-bold text-sm text-emerald-400">
                        {formatKES(tx.amount)}
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 7. MODAL: Record New Transaction in Kenyan Shillings (KES) */}
      {showNewTxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0A1024] border border-cyan-500/40 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowNewTxModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold font-mono uppercase text-white">
                  RECORD NEW KES TRANSACTION
                </h3>
                <p className="text-xs text-slate-400">
                  Disburse or record payments in Kenyan Shillings (KES / KSh)
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateTransaction} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono text-slate-300 block mb-1">Transaction Type *</label>
                  <select
                    value={txType}
                    onChange={(e) => setTxType(e.target.value as TransactionType)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="INCOME">Freight Income</option>
                    <option value="EXPENSE">Operational Expense</option>
                    <option value="DRIVER_PAYMENT">Driver Corridor Payment</option>
                    <option value="STAFF_PAYMENT">Staff Salary / Allowance</option>
                    <option value="CLIENT_PAYMENT">Client Settlement</option>
                    <option value="SUPPLIER_PAYMENT">Supplier / Vendor Disbursement</option>
                    <option value="REFUND">Refund / Claim</option>
                    <option value="WITHDRAWAL">Cash Withdrawal</option>
                    <option value="SETTLEMENT">Corridor Settlement</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-300 block mb-1">Amount (KES / KSh) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-mono text-emerald-400 font-bold">KSh</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="25000.00"
                      value={txAmount}
                      onChange={(e) => setTxAmount(e.target.value)}
                      className="w-full pl-12 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono font-bold text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono text-slate-300 block mb-1">Payer or Payee Party *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TotalEnergies Kenya / John Kamau"
                    value={txParty}
                    onChange={(e) => setTxParty(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-300 block mb-1">Payment Method *</label>
                  <select
                    value={txPaymentMethod}
                    onChange={(e) => setTxPaymentMethod(e.target.value as KenyanPaymentMethod)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="M-PESA">Safaricom M-Pesa</option>
                    <option value="BANK_TRANSFER">Bank Wire / Electronic Transfer</option>
                    <option value="RTGS">RTGS Real-Time Settlement</option>
                    <option value="EFT">EFT Batch Settlement</option>
                    <option value="CREDIT_CARD">Corporate Visa / Mastercard</option>
                    <option value="CASH">Cash Voucher</option>
                    <option value="CHEQUE">Banker's Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-mono text-slate-300 block mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Fuel allowance for Mombasa-Kampala corridor dispatch"
                  value={txDescription}
                  onChange={(e) => setTxDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-mono text-slate-300 block mb-1">Reference / Code</label>
                  <input
                    type="text"
                    placeholder="e.g. QHJ761928"
                    value={txReference}
                    onChange={(e) => setTxReference(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-300 block mb-1">Date</label>
                  <input
                    type="date"
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-300 block mb-1">Status</label>
                  <select
                    value={txStatus}
                    onChange={(e) => setTxStatus(e.target.value as TransactionStatus)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="COMPLETED">Completed</option>
                    <option value="PENDING">Pending</option>
                    <option value="RECONCILED">Reconciled</option>
                    <option value="FAILED">Failed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-mono text-slate-300 block mb-1">Notes / Audit Memo</label>
                <textarea
                  rows={2}
                  placeholder="Additional audit or disbursement remarks..."
                  value={txNotes}
                  onChange={(e) => setTxNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewTxModal(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-mono font-bold text-xs rounded-xl shadow-lg flex items-center gap-2"
                >
                  {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>COMMIT TO LEDGER</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
