import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  FileText,
  CreditCard,
  Receipt,
  Users,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Clock,
  Printer,
  X,
  RefreshCw,
  Building,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { db, COLLECTIONS } from '../../lib/firestoreService';
import {
  Client,
  Quote,
  Quotation,
  Invoice,
  Payment,
  OperationalExpense,
  Customer,
} from '../../types';
import { EmptyState } from '../common/EmptyState';
import { useAuth } from '../../context/AuthContext';

interface CommercialManagementProps {
  initialSubTab?: 'clients' | 'quotes' | 'quotations' | 'invoices' | 'payments' | 'expenses';
  onRefreshStats?: () => void;
}

export const CommercialManagement: React.FC<CommercialManagementProps> = ({
  initialSubTab = 'clients',
  onRefreshStats,
}) => {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'clients' | 'quotes' | 'quotations' | 'invoices' | 'payments' | 'expenses'>(
    initialSubTab
  );

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Datasets from Firestore
  const [clients, setClients] = useState<Client[]>([]);
  const [quoteRequests, setQuoteRequests] = useState<Quote[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<OperationalExpense[]>([]);

  // Modals
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showCreateQuotationModal, setShowCreateQuotationModal] = useState(false);
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);
  const [showRecordExpenseModal, setShowRecordExpenseModal] = useState(false);
  const [viewQuotationPrint, setViewQuotationPrint] = useState<Quotation | null>(null);
  const [viewInvoicePrint, setViewInvoicePrint] = useState<Invoice | null>(null);

  // Forms
  const [clientForm, setClientForm] = useState({
    companyName: '',
    fullName: '',
    email: '',
    phone: '',
    country: 'Kenya',
    city: 'Nairobi',
    address: 'Industrial Area, Enterprise Road',
    taxId: '',
    accountStatus: 'ACTIVE' as Client['accountStatus'],
    notes: '',
  });

  const [quotationForm, setQuotationForm] = useState({
    clientName: '',
    companyName: '',
    clientEmail: '',
    clientPhone: '',
    origin: 'Mombasa Port, Kenya',
    destination: 'Kampala Logistics Yard, Uganda',
    cargoDescription: 'Heavy Industrial Pumps and Pipes',
    weightKg: 28000,
    baseTransportCost: 2800,
    fuelSurcharge: 420,
    handlingCharges: 250,
    customsCharges: 350,
    insuranceCharges: 180,
    additionalCharges: 0,
    discount: 0,
    currency: 'USD' as Quotation['currency'],
    validUntil: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    terms: 'Valid for 14 calendar days. Demurrage after 48h at destination applies.',
    notes: 'Escort required for border transit clearance.',
    status: 'SENT' as Quotation['status'],
  });

  const [invoiceForm, setInvoiceForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    shipmentNumber: '',
    amount: 4000,
    currency: 'USD' as Invoice['currency'],
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    description: 'Cross-border corridor transport charges',
    status: 'PENDING' as Invoice['status'],
    items: [{ description: 'Main Corridor Haulage (Mombasa - Kampala)', quantity: 1, unitPrice: 4000, total: 4000 }],
  });

  const [paymentForm, setPaymentForm] = useState({
    customerName: '',
    invoiceReference: '',
    amount: 4000,
    currency: 'USD',
    paymentMethod: 'Bank Wire (RTGS / SWIFT)',
    transactionReference: '',
    status: 'SUCCESS' as Payment['status'],
    notes: 'Confirmed by Central Treasury Desk.',
  });

  const [expenseForm, setExpenseForm] = useState({
    category: 'Fuel' as OperationalExpense['category'],
    description: '',
    amount: 320,
    currency: 'USD',
    linkedType: 'OPERATION' as OperationalExpense['linkedType'],
    linkedLabel: 'Mombasa - Kampala Corridor Transit',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [cList, qList, quoList, iList, pList, eList] = await Promise.all([
        db.getAll<Client>(COLLECTIONS.CLIENTS),
        db.getAll<Quote>(COLLECTIONS.QUOTES),
        db.getAll<Quotation>(COLLECTIONS.QUOTATIONS),
        db.getAll<Invoice>(COLLECTIONS.INVOICES),
        db.getAll<Payment>(COLLECTIONS.PAYMENTS),
        db.getAll<OperationalExpense>(COLLECTIONS.OPERATIONAL_EXPENSES),
      ]);
      setClients(cList);
      setQuoteRequests(qList);
      setQuotations(quoList);
      setInvoices(iList);
      setPayments(pList);
      setExpenses(eList);
      if (onRefreshStats) onRefreshStats();
    } catch (err) {
      console.error('Error loading commercial data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsubC = db.subscribe(COLLECTIONS.CLIENTS, loadData);
    const unsubQ = db.subscribe(COLLECTIONS.QUOTES, loadData);
    const unsubQuo = db.subscribe(COLLECTIONS.QUOTATIONS, loadData);
    const unsubI = db.subscribe(COLLECTIONS.INVOICES, loadData);
    const unsubP = db.subscribe(COLLECTIONS.PAYMENTS, loadData);
    const unsubE = db.subscribe(COLLECTIONS.OPERATIONAL_EXPENSES, loadData);
    return () => {
      unsubC();
      unsubQ();
      unsubQuo();
      unsubI();
      unsubP();
      unsubE();
    };
  }, []);

  // Submit Handlers
  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const clientReference = `KCC-CLI-${Math.floor(1000 + Math.random() * 9000)}`;
      const newClient = await db.add<Client>(COLLECTIONS.CLIENTS, {
        ...clientForm,
        clientReference,
      });

      await db.logAudit({
        actorUid: userProfile?.uid,
        actorRole: userProfile?.role || 'ADMIN',
        action: 'CLIENT_CREATED',
        targetUid: newClient.id,
        details: `Registered corporate client ${newClient.companyName} (${newClient.clientReference})`,
      });

      setShowAddClientModal(false);
      setClientForm({
        companyName: '',
        fullName: '',
        email: '',
        phone: '',
        country: 'Kenya',
        city: 'Nairobi',
        address: 'Industrial Area, Enterprise Road',
        taxId: '',
        accountStatus: 'ACTIVE',
        notes: '',
      });
      showToast(`Client ${newClient.companyName} registered.`);
      loadData();
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
  };

  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const quoteNumber = `KCC-QUO-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const total =
        Number(quotationForm.baseTransportCost) +
        Number(quotationForm.fuelSurcharge) +
        Number(quotationForm.handlingCharges) +
        Number(quotationForm.customsCharges) +
        Number(quotationForm.insuranceCharges) +
        Number(quotationForm.additionalCharges) -
        Number(quotationForm.discount);

      const newQuo = await db.add<Quotation>(COLLECTIONS.QUOTATIONS, {
        ...quotationForm,
        quoteNumber,
        total,
      });

      await db.logAudit({
        actorUid: userProfile?.uid,
        actorRole: userProfile?.role || 'ADMIN',
        action: 'QUOTATION_CREATED',
        targetUid: newQuo.id,
        details: `Generated formal quotation ${quoteNumber} for ${newQuo.clientName} (Total: $${total})`,
      });

      setShowCreateQuotationModal(false);
      showToast(`Quotation ${quoteNumber} generated successfully.`);
      loadData();
    } catch (err: any) {
      showToast(`Error creating quotation: ${err.message}`);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const invoiceReference = `KCC-INV-2026-${Math.floor(10000 + Math.random() * 90000)}`;
      const newInv = await db.add<Invoice>(COLLECTIONS.INVOICES, {
        ...invoiceForm,
        invoiceReference,
      });

      await db.logAudit({
        actorUid: userProfile?.uid,
        actorRole: userProfile?.role || 'ADMIN',
        action: 'INVOICE_ISSUED',
        targetUid: newInv.id,
        details: `Issued commercial invoice ${invoiceReference} to ${newInv.customerName} ($${newInv.amount})`,
      });

      setShowCreateInvoiceModal(false);
      showToast(`Invoice ${invoiceReference} issued.`);
      loadData();
    } catch (err: any) {
      showToast(`Error generating invoice: ${err.message}`);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const transactionReference =
        paymentForm.transactionReference.trim() || `TXN-${Date.now().toString().slice(-8)}`;

      const newPay = await db.add<Payment>(COLLECTIONS.PAYMENTS, {
        ...paymentForm,
        transactionReference,
        timestamp: new Date().toISOString(),
      });

      // If matched with invoice, update invoice status
      const matchedInv = invoices.find((i) => i.invoiceReference === paymentForm.invoiceReference);
      if (matchedInv) {
        await db.update<Invoice>(COLLECTIONS.INVOICES, matchedInv.id, {
          status: 'SUCCESS',
        });
      }

      await db.logAudit({
        actorUid: userProfile?.uid,
        actorRole: userProfile?.role || 'ADMIN',
        action: 'PAYMENT_RECORDED',
        targetUid: newPay.id,
        details: `Recorded payment of ${newPay.currency} ${newPay.amount} via ${newPay.paymentMethod} (Ref: ${transactionReference})`,
      });

      setShowRecordPaymentModal(false);
      showToast(`Payment ${transactionReference} logged successfully.`);
      loadData();
    } catch (err: any) {
      showToast(`Error recording payment: ${err.message}`);
    }
  };

  const handleRecordExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const expenseNumber = `EXP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const newExp = await db.add<OperationalExpense>(COLLECTIONS.OPERATIONAL_EXPENSES, {
        ...expenseForm,
        expenseNumber,
        recordedBy: userProfile?.fullName || 'Finance Operations',
      });

      await db.logAudit({
        actorUid: userProfile?.uid,
        actorRole: userProfile?.role || 'ADMIN',
        action: 'EXPENSE_RECORDED',
        targetUid: newExp.id,
        details: `Recorded ${newExp.category} expense: ${newExp.currency} ${newExp.amount} (${newExp.description})`,
      });

      setShowRecordExpenseModal(false);
      showToast(`Expense ${expenseNumber} logged.`);
      loadData();
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
  };

  const totalInvoiced = invoices.reduce((acc, i) => acc + (i.amount || 0), 0);
  const totalPaid = payments.filter((p) => p.status === 'SUCCESS').reduce((acc, p) => acc + (p.amount || 0), 0);
  const totalExpensesAmount = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 p-4 rounded-xl bg-cyan-950 border border-cyan-500/50 text-cyan-200 text-xs shadow-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-[#0A1024]/80 p-6 rounded-2xl border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-cyan-400" />
            <span className="text-xs font-mono uppercase text-cyan-400 font-semibold tracking-wider">
              Commercial & Financial Management
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white font-['Poppins'] mt-1">
            Clients, Quotations, Invoices & Financial Ledger
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Enterprise customer billing, formal corridor tariffs, verified payments, and operational expenditure ledger.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={() => setShowAddClientModal(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold text-xs shadow-lg shadow-cyan-600/25 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Client</span>
          </button>
          <button
            onClick={() => setShowCreateQuotationModal(true)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4 text-cyan-400" />
            <span>Generate Quote</span>
          </button>
          <button
            onClick={() => setShowCreateInvoiceModal(true)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5"
          >
            <Receipt className="w-4 h-4 text-teal-400" />
            <span>Issue Invoice</span>
          </button>
          <button
            onClick={() => setShowRecordPaymentModal(true)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5"
          >
            <CreditCard className="w-4 h-4 text-emerald-400" />
            <span>Record Payment</span>
          </button>
          <button
            onClick={() => setShowRecordExpenseModal(true)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5"
          >
            <TrendingDown className="w-4 h-4 text-amber-400" />
            <span>Log Expense</span>
          </button>
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            title="Refresh Ledger"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Financial KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#0A1024]/80 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Total Invoiced</span>
            <Receipt className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono mt-2">
            USD {totalInvoiced.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">{invoices.length} invoices generated</div>
        </div>

        <div className="bg-[#0A1024]/80 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Collected Revenue</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono mt-2">
            USD {totalPaid.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">{payments.length} verified transactions</div>
        </div>

        <div className="bg-[#0A1024]/80 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Operational Expenses</span>
            <TrendingDown className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono mt-2">
            USD {totalExpensesAmount.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">{expenses.length} expense vouchers</div>
        </div>

        <div className="bg-[#0A1024]/80 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Corporate Clients</span>
            <Building className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-400 font-mono mt-2">{clients.length} Accounts</div>
          <div className="text-[11px] text-slate-500 mt-1">Cross-border freight partners</div>
        </div>
      </div>

      {/* Sub-Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        {[
          { key: 'clients', label: `Corporate Clients (${clients.length})`, icon: Users },
          { key: 'quotes', label: `Public Quote Requests (${quoteRequests.length})`, icon: Clock },
          { key: 'quotations', label: `Formal Quotations (${quotations.length})`, icon: FileText },
          { key: 'invoices', label: `Invoices (${invoices.length})`, icon: Receipt },
          { key: 'payments', label: `Payment Ledger (${payments.length})`, icon: CreditCard },
          { key: 'expenses', label: `Operational Expenses (${expenses.length})`, icon: TrendingDown },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600/30 to-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: CLIENTS */}
      {activeTab === 'clients' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0A1024]/60 p-3 rounded-xl border border-slate-800">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search clients, company, country..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>
            <button
              onClick={() => setShowAddClientModal(true)}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center gap-1.5 self-end sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Client</span>
            </button>
          </div>

          {clients.length === 0 ? (
            <EmptyState
              title="No clients registered"
              description="Register international logistics clients and shippers to track shipment histories, invoices, and rates."
              icon={<Users className="w-8 h-8 text-cyan-400" />}
              action={{
                label: 'Register First Client',
                onClick: () => setShowAddClientModal(true),
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clients.map((c) => (
                <div
                  key={c.id}
                  className="bg-[#0A1024]/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-3 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-cyan-400 font-bold">{c.clientReference}</span>
                      <h4 className="text-base font-bold text-white font-['Poppins']">{c.companyName}</h4>
                      <div className="text-xs text-slate-300 mt-0.5">Contact: {c.fullName}</div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase ${
                        c.accountStatus === 'ACTIVE'
                          ? 'bg-emerald-950 border border-emerald-500/40 text-emerald-300'
                          : 'bg-red-950 border border-red-500/40 text-red-300'
                      }`}
                    >
                      {c.accountStatus}
                    </span>
                  </div>

                  <div className="text-xs text-slate-400 space-y-1.5 border-t border-slate-800 pt-3">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-slate-300">{c.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-slate-300">{c.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-slate-300">{c.address}, {c.country}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: QUOTE REQUESTS */}
      {activeTab === 'quotes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-[#0A1024]/60 p-3 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 font-mono">Incoming Public Freight Quote Requests</span>
            <span className="text-xs text-cyan-400 font-mono font-bold">{quoteRequests.length} Inquiries</span>
          </div>

          {quoteRequests.length === 0 ? (
            <EmptyState
              title="No quote requests received"
              description="Freight requests submitted via the public quote tool will appear here for commercial review."
              icon={<Clock className="w-8 h-8 text-amber-400" />}
            />
          ) : (
            <div className="space-y-3">
              {quoteRequests.map((q) => (
                <div
                  key={q.id}
                  className="bg-[#0A1024]/80 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="font-mono text-xs text-amber-400 font-bold">{q.quoteReference}</div>
                    <div className="text-sm font-semibold text-white mt-1">
                      {q.origin} → {q.destination}
                    </div>
                    <div className="text-xs text-slate-400">
                      Client: {q.customerName} ({q.customerEmail}) • Cargo: {q.cargoType} ({q.weightKg} KG)
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setQuotationForm((prev) => ({
                        ...prev,
                        clientName: q.customerName,
                        clientEmail: q.customerEmail,
                        clientPhone: q.customerPhone,
                        origin: q.origin,
                        destination: q.destination,
                        cargoDescription: `${q.cargoType} (${q.weightKg} KG)`,
                        weightKg: q.weightKg,
                      }));
                      setShowCreateQuotationModal(true);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl text-xs font-semibold"
                  >
                    Generate Official Quotation
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: FORMAL QUOTATIONS */}
      {activeTab === 'quotations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-[#0A1024]/60 p-3 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 font-mono">Formal International Logistics Quotations</span>
            <button
              onClick={() => setShowCreateQuotationModal(true)}
              className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Quotation</span>
            </button>
          </div>

          {quotations.length === 0 ? (
            <EmptyState
              title="No quotations generated"
              description="Create formal breakdown quotations covering base transport, fuel surcharges, border customs, and insurance."
              icon={<FileText className="w-8 h-8 text-cyan-400" />}
              action={{
                label: 'Create First Quotation',
                onClick: () => setShowCreateQuotationModal(true),
              }}
            />
          ) : (
            <div className="space-y-3">
              {quotations.map((q) => (
                <div
                  key={q.id}
                  className="bg-[#0A1024]/80 border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="text-cyan-400 font-bold">{q.quoteNumber}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-white font-semibold">{q.clientName}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-400">Valid until {q.validUntil}</span>
                    </div>
                    <div className="text-sm font-semibold text-slate-200 mt-1">
                      {q.origin} → {q.destination}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {q.cargoDescription} • {q.weightKg?.toLocaleString()} KG
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-mono text-base font-bold text-white">
                        {q.currency} {q.total?.toLocaleString()}
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-950 text-blue-300 border border-blue-500/40">
                        {q.status}
                      </span>
                    </div>
                    <button
                      onClick={() => setViewQuotationPrint(q)}
                      className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-slate-300"
                      title="Print / View Quotation"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: INVOICES */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-[#0A1024]/60 p-3 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 font-mono">Customer Invoices & Billing Ledger</span>
            <button
              onClick={() => setShowCreateInvoiceModal(true)}
              className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Issue Invoice</span>
            </button>
          </div>

          {invoices.length === 0 ? (
            <EmptyState
              title="No invoices found"
              description="Issue commercial invoices with unique tracking references, payment due dates, and line item breakdowns."
              icon={<Receipt className="w-8 h-8 text-teal-400" />}
              action={{
                label: 'Issue First Invoice',
                onClick: () => setShowCreateInvoiceModal(true),
              }}
            />
          ) : (
            <div className="space-y-3">
              {invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="bg-[#0A1024]/80 border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="text-teal-400 font-bold">{inv.invoiceReference}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-white font-semibold">{inv.customerName}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-400">Due: {inv.dueDate}</span>
                    </div>
                    <div className="text-sm font-semibold text-slate-200 mt-1">{inv.description}</div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-mono text-base font-bold text-white">
                        {inv.currency} {inv.amount?.toLocaleString()}
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                          inv.status === 'SUCCESS'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                            : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {inv.status === 'SUCCESS' ? 'PAID' : inv.status}
                      </span>
                    </div>
                    <button
                      onClick={() => setViewInvoicePrint(inv)}
                      className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-slate-300"
                      title="Print Invoice"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: PAYMENTS */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-[#0A1024]/60 p-3 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 font-mono">Verified Revenue Transactions & Bank Wires</span>
            <button
              onClick={() => setShowRecordPaymentModal(true)}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Payment</span>
            </button>
          </div>

          {payments.length === 0 ? (
            <EmptyState
              title="No payments recorded"
              description="Track bank wires, letters of credit, and electronic payment ledger receipts from corporate clients."
              icon={<CreditCard className="w-8 h-8 text-emerald-400" />}
              action={{
                label: 'Record First Payment',
                onClick: () => setShowRecordPaymentModal(true),
              }}
            />
          ) : (
            <div className="space-y-3">
              {payments.map((p) => (
                <div
                  key={p.id}
                  className="bg-[#0A1024]/80 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="text-emerald-400 font-bold">{p.transactionReference}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-white font-semibold">{p.customerName}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-400">{p.timestamp?.slice(0, 10)}</span>
                    </div>
                    <div className="text-xs text-slate-300 mt-1">
                      Method: {p.paymentMethod} {p.invoiceReference && `• Invoice: ${p.invoiceReference}`}
                    </div>
                  </div>

                  <div className="font-mono text-base font-bold text-emerald-400">
                    {p.currency} {p.amount?.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: EXPENSES */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-[#0A1024]/60 p-3 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 font-mono">Corridor Operational & Administrative Expenses</span>
            <button
              onClick={() => setShowRecordExpenseModal(true)}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Expense</span>
            </button>
          </div>

          {expenses.length === 0 ? (
            <EmptyState
              title="No expenses logged"
              description="Record fuel stops, toll fees, customs clearance, repair costs, and driver allowances."
              icon={<TrendingDown className="w-8 h-8 text-amber-400" />}
              action={{
                label: 'Log Operational Expense',
                onClick: () => setShowRecordExpenseModal(true),
              }}
            />
          ) : (
            <div className="space-y-3">
              {expenses.map((e) => (
                <div
                  key={e.id}
                  className="bg-[#0A1024]/80 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="text-amber-400 font-bold">{e.expenseNumber}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-white font-bold">{e.category}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-400">{e.date}</span>
                    </div>
                    <div className="text-sm text-slate-200 mt-1">{e.description}</div>
                    <div className="text-xs text-slate-400 mt-0.5">Linked: {e.linkedLabel}</div>
                  </div>

                  <div className="font-mono text-base font-bold text-amber-400">
                    {e.currency} {e.amount?.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================
          MODALS
          ========================================================= */}

      {/* ADD CLIENT MODAL */}
      {showAddClientModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A1024] border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white font-['Poppins']">Register Corporate Client</h3>
              <button onClick={() => setShowAddClientModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddClient} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  value={clientForm.companyName}
                  onChange={(e) => setClientForm({ ...clientForm, companyName: e.target.value })}
                  placeholder="e.g. Bolloré Logistics Africa"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Primary Contact Person *</label>
                  <input
                    type="text"
                    required
                    value={clientForm.fullName}
                    onChange={(e) => setClientForm({ ...clientForm, fullName: e.target.value })}
                    placeholder="Operations Director"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Tax ID / PIN</label>
                  <input
                    type="text"
                    value={clientForm.taxId}
                    onChange={(e) => setClientForm({ ...clientForm, taxId: e.target.value })}
                    placeholder="e.g. P051283921X"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={clientForm.email}
                    onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Phone *</label>
                  <input
                    type="tel"
                    required
                    value={clientForm.phone}
                    onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Country</label>
                  <select
                    value={clientForm.country}
                    onChange={(e) => setClientForm({ ...clientForm, country: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="Kenya">Kenya</option>
                    <option value="Uganda">Uganda</option>
                    <option value="Tanzania">Tanzania</option>
                    <option value="Rwanda">Rwanda</option>
                    <option value="DR Congo">DR Congo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">City / Region</label>
                  <input
                    type="text"
                    value={clientForm.city}
                    onChange={(e) => setClientForm({ ...clientForm, city: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddClientModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-xl"
                >
                  Save Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE QUOTATION MODAL */}
      {showCreateQuotationModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A1024] border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white font-['Poppins']">Generate Logistics Quotation</h3>
              <button onClick={() => setShowCreateQuotationModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQuotation} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Client / Company Name *</label>
                  <input
                    type="text"
                    required
                    value={quotationForm.clientName}
                    onChange={(e) => setQuotationForm({ ...quotationForm, clientName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Client Email *</label>
                  <input
                    type="email"
                    required
                    value={quotationForm.clientEmail}
                    onChange={(e) => setQuotationForm({ ...quotationForm, clientEmail: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Origin *</label>
                  <input
                    type="text"
                    required
                    value={quotationForm.origin}
                    onChange={(e) => setQuotationForm({ ...quotationForm, origin: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Destination *</label>
                  <input
                    type="text"
                    required
                    value={quotationForm.destination}
                    onChange={(e) => setQuotationForm({ ...quotationForm, destination: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-3">
                <div className="text-[11px] font-mono text-cyan-400 uppercase font-bold">Tariff Breakdown (USD)</div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Base Transport Cost</label>
                    <input
                      type="number"
                      value={quotationForm.baseTransportCost}
                      onChange={(e) => setQuotationForm({ ...quotationForm, baseTransportCost: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Fuel Surcharge</label>
                    <input
                      type="number"
                      value={quotationForm.fuelSurcharge}
                      onChange={(e) => setQuotationForm({ ...quotationForm, fuelSurcharge: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Handling Charges</label>
                    <input
                      type="number"
                      value={quotationForm.handlingCharges}
                      onChange={(e) => setQuotationForm({ ...quotationForm, handlingCharges: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Customs Clearance</label>
                    <input
                      type="number"
                      value={quotationForm.customsCharges}
                      onChange={(e) => setQuotationForm({ ...quotationForm, customsCharges: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Transit Insurance</label>
                    <input
                      type="number"
                      value={quotationForm.insuranceCharges}
                      onChange={(e) => setQuotationForm({ ...quotationForm, insuranceCharges: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Discount (USD)</label>
                    <input
                      type="number"
                      value={quotationForm.discount}
                      onChange={(e) => setQuotationForm({ ...quotationForm, discount: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-emerald-400 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateQuotationModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-xl"
                >
                  Generate Official Quotation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE INVOICE MODAL */}
      {showCreateInvoiceModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A1024] border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white font-['Poppins']">Issue Commercial Invoice</h3>
              <button onClick={() => setShowCreateInvoiceModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Customer / Company *</label>
                <input
                  type="text"
                  required
                  value={invoiceForm.customerName}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, customerName: e.target.value })}
                  placeholder="e.g. Bolloré Africa Logistics"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Total Amount (USD) *</label>
                  <input
                    type="number"
                    required
                    value={invoiceForm.amount}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Payment Due Date</label>
                  <input
                    type="date"
                    value={invoiceForm.dueDate}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Invoice Description</label>
                <input
                  type="text"
                  value={invoiceForm.description}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateInvoiceModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-teal-600 to-teal-500 text-white font-semibold rounded-xl"
                >
                  Issue Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD PAYMENT MODAL */}
      {showRecordPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A1024] border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white font-['Poppins']">Record Verified Payment</h3>
              <button onClick={() => setShowRecordPaymentModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Client Name / Company *</label>
                <input
                  type="text"
                  required
                  value={paymentForm.customerName}
                  onChange={(e) => setPaymentForm({ ...paymentForm, customerName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Amount Paid (USD) *</label>
                  <input
                    type="number"
                    required
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Matched Invoice Ref</label>
                  <input
                    type="text"
                    value={paymentForm.invoiceReference}
                    onChange={(e) => setPaymentForm({ ...paymentForm, invoiceReference: e.target.value })}
                    placeholder="e.g. KCC-INV-2026-0012"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Payment Method</label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                >
                  <option value="Bank Wire (RTGS / SWIFT)">Bank Wire (RTGS / SWIFT)</option>
                  <option value="Letter of Credit (LC)">Letter of Credit (LC)</option>
                  <option value="Corporate Cheque">Corporate Cheque</option>
                  <option value="Electronic Funds Transfer">Electronic Funds Transfer</option>
                  <option value="Mobile Money (M-Pesa / Airtel Money)">Mobile Money (M-Pesa / Airtel Money)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Bank Transaction Reference / Cheque #</label>
                <input
                  type="text"
                  value={paymentForm.transactionReference}
                  onChange={(e) => setPaymentForm({ ...paymentForm, transactionReference: e.target.value })}
                  placeholder="e.g. FT260849201948"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono uppercase"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRecordPaymentModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold rounded-xl"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD EXPENSE MODAL */}
      {showRecordExpenseModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A1024] border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white font-['Poppins']">Log Operational Expense</h3>
              <button onClick={() => setShowRecordExpenseModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordExpense} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Expense Category *</label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="Fuel">Fuel</option>
                    <option value="Tolls">Road Tolls / Weighbridges</option>
                    <option value="Customs">Customs Clearance Fees</option>
                    <option value="Repairs">Emergency Road Repairs</option>
                    <option value="Driver Allowances">Driver Corridor Allowance</option>
                    <option value="Parking">Parking & Escort Fees</option>
                    <option value="Office Expenses">Administrative / Office</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Amount (USD) *</label>
                  <input
                    type="number"
                    required
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Description *</label>
                <input
                  type="text"
                  required
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  placeholder="e.g. Mutukula border transit clearance permit"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRecordExpenseModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-amber-600 to-amber-500 text-white font-semibold rounded-xl"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINT QUOTATION PREVIEW MODAL */}
      {viewQuotationPrint && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl max-w-2xl w-full p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto print:m-0 print:p-0">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h2 className="text-xl font-black tracking-wider uppercase text-blue-900">
                  Kirenga Cargo Carriers
                </h2>
                <p className="text-xs text-slate-500">Official Freight Quotation • East & Central Africa Corridors</p>
              </div>
              <button
                onClick={() => setViewQuotationPrint(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 print:hidden"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <div className="text-slate-500 font-bold uppercase text-[10px]">Client Recipient:</div>
                <div className="font-bold text-sm text-slate-900">{viewQuotationPrint.clientName}</div>
                <div className="text-slate-600">{viewQuotationPrint.clientEmail}</div>
              </div>
              <div className="text-right font-mono">
                <div className="text-slate-500 font-bold uppercase text-[10px]">Quote Reference:</div>
                <div className="font-bold text-sm text-blue-700">{viewQuotationPrint.quoteNumber}</div>
                <div className="text-slate-600">Valid Until: {viewQuotationPrint.validUntil}</div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="font-bold text-slate-700">Corridor Route: </span>
              <span>{viewQuotationPrint.origin} → {viewQuotationPrint.destination}</span>
              <div className="mt-1 text-slate-600">Cargo: {viewQuotationPrint.cargoDescription} ({viewQuotationPrint.weightKg} KG)</div>
            </div>

            {/* Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <div className="bg-slate-100 p-2.5 font-bold text-slate-700 flex justify-between">
                <span>Service Item</span>
                <span>Amount ({viewQuotationPrint.currency})</span>
              </div>
              <div className="p-2.5 flex justify-between border-b">
                <span>Base Haulage Freight</span>
                <span className="font-mono">{viewQuotationPrint.baseTransportCost}</span>
              </div>
              <div className="p-2.5 flex justify-between border-b">
                <span>Fuel Surcharge</span>
                <span className="font-mono">{viewQuotationPrint.fuelSurcharge}</span>
              </div>
              <div className="p-2.5 flex justify-between border-b">
                <span>Port & Depot Handling</span>
                <span className="font-mono">{viewQuotationPrint.handlingCharges}</span>
              </div>
              <div className="p-2.5 flex justify-between border-b">
                <span>Border Customs Clearance</span>
                <span className="font-mono">{viewQuotationPrint.customsCharges}</span>
              </div>
              <div className="p-2.5 flex justify-between border-b">
                <span>Transit Goods Insurance</span>
                <span className="font-mono">{viewQuotationPrint.insuranceCharges}</span>
              </div>
              <div className="p-3 bg-blue-50 flex justify-between font-bold text-sm text-blue-900">
                <span>TOTAL QUOTED TARIFF</span>
                <span className="font-mono">{viewQuotationPrint.currency} {viewQuotationPrint.total?.toLocaleString()}</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 italic">
              Terms: {viewQuotationPrint.terms || 'Payment within agreed corporate credit terms.'}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t print:hidden">
              <button
                onClick={() => window.print()}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Save as PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT INVOICE PREVIEW MODAL */}
      {viewInvoicePrint && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl max-w-2xl w-full p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto print:m-0 print:p-0">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h2 className="text-xl font-black tracking-wider uppercase text-teal-900">
                  Kirenga Cargo Carriers
                </h2>
                <p className="text-xs text-slate-500">Commercial Tax Invoice</p>
              </div>
              <button
                onClick={() => setViewInvoicePrint(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 print:hidden"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <div className="text-slate-500 font-bold uppercase text-[10px]">Billed To:</div>
                <div className="font-bold text-sm text-slate-900">{viewInvoicePrint.customerName}</div>
                <div className="text-slate-600">{viewInvoicePrint.customerEmail}</div>
              </div>
              <div className="text-right font-mono">
                <div className="text-slate-500 font-bold uppercase text-[10px]">Invoice Number:</div>
                <div className="font-bold text-sm text-teal-700">{viewInvoicePrint.invoiceReference}</div>
                <div className="text-slate-600">Due Date: {viewInvoicePrint.dueDate}</div>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <div className="bg-slate-100 p-2.5 font-bold text-slate-700 flex justify-between">
                <span>Description</span>
                <span>Amount ({viewInvoicePrint.currency})</span>
              </div>
              <div className="p-3 flex justify-between border-b">
                <span>{viewInvoicePrint.description}</span>
                <span className="font-mono">{viewInvoicePrint.amount?.toLocaleString()}</span>
              </div>
              <div className="p-3 bg-teal-50 flex justify-between font-bold text-sm text-teal-900">
                <span>TOTAL DUE</span>
                <span className="font-mono">{viewInvoicePrint.currency} {viewInvoicePrint.amount?.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t print:hidden">
              <button
                onClick={() => window.print()}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs rounded-xl flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Save as PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
