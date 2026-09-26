import React, { useState, useEffect } from 'react';
import {
  Package,
  FileText,
  CreditCard,
  Truck,
  Plus,
  Search,
  ExternalLink,
  MessageSquare,
  CheckCircle2,
  Clock,
  Download,
  AlertCircle,
  FileCheck,
  ChevronRight,
  ChevronLeft,
  Bell,
  User,
  Settings as SettingsIcon,
  Shield,
  Receipt,
  Layers,
  MapPin,
  Calendar,
  Building2,
  Phone,
  Mail,
  Filter,
  Check,
  X,
  Printer,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Compass,
  AlertTriangle,
  Send
} from 'lucide-react';
import { db, COLLECTIONS } from '../../lib/firestoreService';
import {
  Shipment,
  Quote,
  Invoice,
  Payment,
  SupportTicket,
  Customer,
  ClientNotification,
  ClientDocument,
  Booking
} from '../../types';
import { EmptyState } from '../common/EmptyState';
import { BookingForm } from '../public/BookingForm';

interface ClientPortalProps {
  initialSubView?: string;
  onNavigate: (view: string) => void;
}

export const ClientPortal: React.FC<ClientPortalProps> = ({ initialSubView = 'overview', onNavigate }) => {
  // Navigation State
  const [activeTab, setActiveTab] = useState<string>(initialSubView || 'overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Authorized Customer Account State
  const [authorizedCustomers, setAuthorizedCustomers] = useState<Customer[]>([]);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  // Data Collections
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [notifications, setNotifications] = useState<ClientNotification[]>([]);
  const [documents, setDocuments] = useState<ClientDocument[]>([]);

  // Modals & Details
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('Bank Wire Transfer');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccessMessage, setPaymentSuccessMessage] = useState<string | null>(null);

  // New Support Ticket
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCategory, setTicketCategory] = useState('Shipment Inquiry');
  const [ticketUrgency, setTicketUrgency] = useState<'NORMAL' | 'HIGH' | 'CRITICAL'>('NORMAL');
  const [ticketDescription, setTicketDescription] = useState('');
  const [ticketShipmentNumber, setTicketShipmentNumber] = useState('');

  // Selected Ticket Conversation
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketReplyMessage, setTicketReplyMessage] = useState('');

  // Tracking Query
  const [trackQuery, setTrackQuery] = useState('');
  const [searchedShipment, setSearchedShipment] = useState<Shipment | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Search & Filter
  const [shipmentFilter, setShipmentFilter] = useState<'ALL' | 'IN_TRANSIT' | 'LOADING' | 'CONFIRMED' | 'DELIVERED'>('ALL');
  const [shipmentSearch, setShipmentSearch] = useState('');

  // Initial Load & Subscriptions
  const loadData = async () => {
    try {
      const custs = await db.getAuthorizedCustomers();
      setAuthorizedCustomers(custs);
      
      // Determine active customer
      const activeCust = currentCustomer || custs[0] || null;
      if (!currentCustomer && custs.length > 0) {
        setCurrentCustomer(custs[0]);
      }

      const [shList, bkList, qtList, invList, payList, tckList, notifList, docList] = await Promise.all([
        db.getAll<Shipment>(COLLECTIONS.SHIPMENTS),
        db.getAll<Booking>(COLLECTIONS.BOOKINGS),
        db.getAll<Quote>(COLLECTIONS.QUOTES),
        db.getAll<Invoice>(COLLECTIONS.INVOICES),
        db.getAll<Payment>(COLLECTIONS.PAYMENTS),
        db.getAll<SupportTicket>(COLLECTIONS.SUPPORT_TICKETS),
        db.getAll<ClientNotification>(COLLECTIONS.CLIENT_NOTIFICATIONS),
        db.getAll<ClientDocument>(COLLECTIONS.CLIENT_DOCUMENTS),
      ]);

      setShipments(shList);
      setBookings(bkList);
      setQuotes(qtList);
      setInvoices(invList);
      setPayments(payList);
      setTickets(tckList);
      setNotifications(notifList);
      setDocuments(docList);
    } catch (e) {
      console.error('Error loading client data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsubSh = db.subscribe(COLLECTIONS.SHIPMENTS, loadData);
    const unsubBk = db.subscribe(COLLECTIONS.BOOKINGS, loadData);
    const unsubQt = db.subscribe(COLLECTIONS.QUOTES, loadData);
    const unsubInv = db.subscribe(COLLECTIONS.INVOICES, loadData);
    const unsubPay = db.subscribe(COLLECTIONS.PAYMENTS, loadData);
    const unsubTck = db.subscribe(COLLECTIONS.SUPPORT_TICKETS, loadData);
    const unsubNotif = db.subscribe(COLLECTIONS.CLIENT_NOTIFICATIONS, loadData);
    const unsubDoc = db.subscribe(COLLECTIONS.CLIENT_DOCUMENTS, loadData);

    return () => {
      unsubSh();
      unsubBk();
      unsubQt();
      unsubInv();
      unsubPay();
      unsubTck();
      unsubNotif();
      unsubDoc();
    };
  }, []);

  // Update tab if initialSubView changes
  useEffect(() => {
    if (initialSubView) {
      setActiveTab(initialSubView);
    }
  }, [initialSubView]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    window.location.hash = `/client/${tabId === 'overview' ? '' : tabId}`;
    setMobileMenuOpen(false);
  };

  // Filtered lists for current corporate customer
  const custName = currentCustomer?.companyName || '';
  const custEmail = currentCustomer?.email || '';

  const clientShipments = shipments.filter(
    (s) => !custName || s.customerName?.toLowerCase().includes(custName.toLowerCase()) || s.customerEmail === custEmail
  );

  const clientBookings = bookings.filter(
    (b) => !custName || b.fullName?.toLowerCase().includes(custName.toLowerCase()) || b.email === custEmail
  );

  const clientQuotes = quotes.filter(
    (q) => !custName || q.customerName?.toLowerCase().includes(custName.toLowerCase()) || q.customerEmail === custEmail
  );

  const clientInvoices = invoices.filter(
    (inv) => !custName || inv.customerName?.toLowerCase().includes(custName.toLowerCase()) || inv.customerEmail === custEmail
  );

  const clientPayments = payments.filter(
    (p) => !custName || p.customerName?.toLowerCase().includes(custName.toLowerCase())
  );

  const clientTickets = tickets.filter(
    (t) => t.requesterRole === 'CUSTOMER' && (!custName || t.requesterName?.toLowerCase().includes(custName.toLowerCase()))
  );

  const clientNotifs = notifications.filter(
    (n) => n.customerId === '*' || !custName || n.customerId?.toLowerCase().includes(custName.toLowerCase())
  );

  const unreadNotifsCount = clientNotifs.filter((n) => !n.read).length;

  const clientDocs = documents.filter(
    (d) => !custName || d.customerId?.toLowerCase().includes(custName.toLowerCase()) || d.customerId === '*'
  );

  // Active vs Delivered Shipments
  const activeShipments = clientShipments.filter((s) => s.status !== 'DELIVERED' && s.status !== 'CANCELLED');
  const deliveredShipments = clientShipments.filter((s) => s.status === 'DELIVERED');

  // Handle Accept / Reject Quote
  const handleAcceptQuote = async (quote: Quote) => {
    try {
      await db.acceptQuote(quote.id, currentCustomer?.companyName || 'Corporate Client');
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRejectQuote = async (quote: Quote) => {
    const reason = prompt('Please specify reason for declining quotation (e.g. Rate higher than budget, Schedule conflict):');
    if (reason === null) return;
    try {
      await db.rejectQuote(quote.id, currentCustomer?.companyName || 'Corporate Client', reason);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Settle Invoice Payment
  const handleOpenPayment = (inv: Invoice) => {
    setPaymentInvoice(inv);
    setShowPaymentModal(true);
    setPaymentSuccessMessage(null);
  };

  const handleConfirmPayment = async () => {
    if (!paymentInvoice) return;
    setPaymentProcessing(true);
    try {
      await db.payInvoice({
        invoiceId: paymentInvoice.id,
        invoiceReference: paymentInvoice.invoiceReference,
        shipmentNumber: paymentInvoice.shipmentNumber,
        customerName: currentCustomer?.companyName || paymentInvoice.customerName,
        amount: paymentInvoice.amount,
        currency: paymentInvoice.currency,
        paymentMethod: paymentMethod,
      });
      setPaymentSuccessMessage(`Payment confirmed! Reference issued and invoice settled.`);
      setTimeout(() => {
        setShowPaymentModal(false);
        setPaymentInvoice(null);
        setPaymentProcessing(false);
        setPaymentSuccessMessage(null);
        loadData();
      }, 1500);
    } catch (e) {
      console.error(e);
      setPaymentProcessing(false);
    }
  };

  // Handle Mark Notifications
  const handleMarkAllNotifs = async () => {
    if (!currentCustomer) return;
    try {
      await db.markAllClientNotificationsAsRead(currentCustomer.companyName);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Create Support Ticket
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketDescription.trim()) return;
    try {
      await db.createSupportTicket({
        requesterName: currentCustomer?.companyName || 'Corporate Shipper',
        requesterRole: 'CUSTOMER',
        requesterId: currentCustomer?.customerReference,
        subject: ticketSubject.trim(),
        category: ticketCategory,
        urgency: ticketUrgency,
        description: ticketDescription.trim(),
        relatedShipmentNumber: ticketShipmentNumber.trim() || undefined,
      });
      setShowNewTicketModal(false);
      setTicketSubject('');
      setTicketDescription('');
      setTicketShipmentNumber('');
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Reply to Ticket
  const handleSendTicketReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !ticketReplyMessage.trim()) return;
    try {
      const updatedMessages = [
        ...selectedTicket.messages,
        {
          sender: currentCustomer?.companyName || 'Customer',
          role: 'CUSTOMER',
          message: ticketReplyMessage.trim(),
          timestamp: new Date().toISOString(),
        },
      ];
      await db.update<SupportTicket>(COLLECTIONS.SUPPORT_TICKETS, selectedTicket.id, {
        messages: updatedMessages,
        status: 'IN_PROGRESS',
      });
      setTicketReplyMessage('');
      const updated = await db.getById<SupportTicket>(COLLECTIONS.SUPPORT_TICKETS, selectedTicket.id);
      if (updated) setSelectedTicket(updated);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  // Search Shipment for Tracking
  const handleSearchTracking = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError(null);
    if (!trackQuery.trim()) return;
    const clean = trackQuery.trim().toUpperCase();
    const found = shipments.find(
      (s) => s.shipmentNumber.toUpperCase() === clean || s.bookingReference?.toUpperCase() === clean
    );
    if (found) {
      setSearchedShipment(found);
    } else {
      setSearchedShipment(null);
      setSearchError(`Consignment reference "${trackQuery}" not found. Verify your reference format (e.g. KCC-2026-000001).`);
    }
  };

  // Filtered Shipments view
  const displayShipments = clientShipments.filter((s) => {
    const matchesSearch =
      !shipmentSearch ||
      s.shipmentNumber.toLowerCase().includes(shipmentSearch.toLowerCase()) ||
      s.cargoDescription.toLowerCase().includes(shipmentSearch.toLowerCase()) ||
      s.destinationCity.toLowerCase().includes(shipmentSearch.toLowerCase());

    if (shipmentFilter === 'ALL') return matchesSearch;
    if (shipmentFilter === 'IN_TRANSIT') return matchesSearch && (s.status === 'IN_TRANSIT' || s.status === 'OUT_FOR_DELIVERY');
    if (shipmentFilter === 'LOADING') return matchesSearch && (s.status === 'LOADING' || s.status === 'ASSIGNED');
    if (shipmentFilter === 'CONFIRMED') return matchesSearch && (s.status === 'CONFIRMED' || s.status === 'PENDING');
    if (shipmentFilter === 'DELIVERED') return matchesSearch && s.status === 'DELIVERED';
    return matchesSearch;
  });

  // Navigation Items Definition for Client Workplace
  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: Layers },
    { id: 'shipments', label: 'My Shipments', icon: Package, badge: activeShipments.length > 0 ? activeShipments.length : undefined },
    { id: 'track', label: 'Track Cargo', icon: Compass },
    { id: 'book', label: 'Book Cargo', icon: Plus, highlight: true },
    { id: 'bookings', label: 'My Bookings', icon: FileText, badge: clientBookings.length > 0 ? clientBookings.length : undefined },
    { id: 'quotes', label: 'Quotes', icon: Sparkles, badge: clientQuotes.filter((q) => q.status === 'SENT').length || undefined },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'invoices', label: 'Invoices', icon: Receipt, badge: clientInvoices.filter((i) => i.status === 'PENDING').length || undefined },
    { id: 'receipts', label: 'Receipts', icon: FileCheck },
    { id: 'documents', label: 'Documents', icon: Download },
  ];

  const bottomNavItems = [
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotifsCount || undefined },
    { id: 'support', label: 'Support', icon: HelpCircle },
    { id: 'profile', label: 'My Profile', icon: Building2 },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-[#050816] text-[#F8FAFC] flex flex-col lg:flex-row font-sans">
      {/* ========================================================================= */}
      {/* DESKTOP SIDEBAR NAVIGATION                                               */}
      {/* ========================================================================= */}
      <aside
        className={`hidden lg:flex flex-col border-r border-slate-800/80 bg-[#080D1F] transition-all duration-300 z-30 sticky top-0 h-screen ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Sidebar Header: Brand & Workplace Identity */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div
            onClick={() => onNavigate('home')}
            className="flex items-center gap-3 cursor-pointer overflow-hidden group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex-shrink-0 flex items-center justify-center text-white shadow-lg shadow-blue-600/30 group-hover:scale-105 transition-transform">
              <Truck className="w-5 h-5" />
            </div>
            {!sidebarCollapsed && (
              <div className="truncate">
                <div className="text-sm font-bold tracking-tight text-white font-['Poppins']">
                  KIRENGA <span className="text-cyan-400 font-light">CARGO</span>
                </div>
                <div className="text-[10px] tracking-wider text-cyan-400/90 uppercase font-semibold flex items-center gap-1">
                  <span>CLIENT PORTAL</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Authorized Customer Account Switcher Chip */}
        {!sidebarCollapsed ? (
          <div className="p-3 mx-3 my-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                {currentCustomer?.companyName.slice(0, 2).toUpperCase() || 'CC'}
              </div>
              <div className="truncate">
                <div className="text-xs font-semibold text-slate-200 truncate">
                  {currentCustomer?.companyName || 'Corporate Client'}
                </div>
                <div className="text-[10px] font-mono text-cyan-400 truncate">
                  {currentCustomer?.customerReference || 'KCC-CLI-001'}
                </div>
              </div>
            </div>
            {authorizedCustomers.length > 1 && (
              <select
                aria-label="Switch authorized account"
                value={currentCustomer?.id || ''}
                onChange={(e) => {
                  const target = authorizedCustomers.find((c) => c.id === e.target.value);
                  if (target) setCurrentCustomer(target);
                }}
                className="bg-transparent text-slate-400 text-xs focus:outline-none cursor-pointer"
              >
                {authorizedCustomers.map((c) => (
                  <option key={c.id} value={c.id} className="bg-slate-900 text-slate-200">
                    {c.companyName.split(' ')[0]}
                  </option>
                ))}
              </select>
            )}
          </div>
        ) : (
          <div className="py-3 flex justify-center border-b border-slate-800/60">
            <div
              title={`${currentCustomer?.companyName} (${currentCustomer?.customerReference})`}
              className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs cursor-pointer"
            >
              {currentCustomer?.companyName.slice(0, 2).toUpperCase() || 'CC'}
            </div>
          </div>
        )}

        {/* Main Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 custom-scrollbar">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 py-1.5">
            {!sidebarCollapsed ? 'Workplace Navigation' : '•••'}
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group relative ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600/30 to-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                    : item.highlight
                    ? 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon
                  className={`w-4 h-4 flex-shrink-0 transition-colors ${
                    isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                {!sidebarCollapsed && (
                  <span className="truncate flex-1 text-left">{item.label}</span>
                )}
                {!sidebarCollapsed && item.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-full ${
                      isActive ? 'bg-cyan-500/30 text-cyan-300' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {sidebarCollapsed && item.badge !== undefined && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-400"></span>
                )}
              </button>
            );
          })}

          <div className="pt-4 pb-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 py-1.5">
              {!sidebarCollapsed ? 'Account & Support' : '•••'}
            </div>
            {bottomNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group relative ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600/30 to-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 transition-colors ${
                      isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  {!sidebarCollapsed && (
                    <span className="truncate flex-1 text-left">{item.label}</span>
                  )}
                  {!sidebarCollapsed && item.badge !== undefined && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-red-500/30 text-red-400 border border-red-500/40">
                      {item.badge}
                    </span>
                  )}
                  {sidebarCollapsed && item.badge !== undefined && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500"></span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar Footer: Back to Public Website */}
        <div className="p-3 border-t border-slate-800/80">
          <button
            onClick={() => onNavigate('home')}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs transition-colors border border-slate-800"
            title="Return to Public Website"
          >
            <Compass className="w-3.5 h-3.5" />
            {!sidebarCollapsed && <span>Public Website</span>}
          </button>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* MAIN VIEW AREA                                                            */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
        {/* Top Header Bar for Client Workplace */}
        <header className="sticky top-0 z-20 bg-[#080D1F]/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              aria-label="Toggle navigation drawer"
            >
              <Layers className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="text-cyan-400 font-semibold font-mono">KIRENGA</span>
                <span>/</span>
                <span className="text-slate-300 capitalize">{activeTab}</span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold font-['Poppins'] text-white truncate">
                {activeTab === 'overview' && 'Consignment Command Dashboard'}
                {activeTab === 'shipments' && 'My Active & Historical Consignments'}
                {activeTab === 'track' && 'Corridor Milestone Tracking'}
                {activeTab === 'book' && 'Book New Heavy Cargo Consignment'}
                {activeTab === 'bookings' && 'Booking Requisitions & Status'}
                {activeTab === 'quotes' && 'Freight Quotations & Commercial Proposals'}
                {activeTab === 'payments' && 'Financial Transactions & Ledgers'}
                {activeTab === 'invoices' && 'Invoices & Commercial Billing'}
                {activeTab === 'receipts' && 'Verified Payment Receipts'}
                {activeTab === 'documents' && 'Consignment Documents & Proof of Delivery'}
                {activeTab === 'notifications' && 'Operational Notifications'}
                {activeTab === 'support' && 'Direct Support & Assistance Desk'}
                {activeTab === 'profile' && 'Corporate Shipper Profile'}
                {activeTab === 'settings' && 'Client Preferences & Configuration'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Action: Book */}
            {activeTab !== 'book' && (
              <button
                onClick={() => handleTabChange('book')}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Book Cargo</span>
              </button>
            )}

            {/* Notifications Button */}
            <button
              onClick={() => handleTabChange('notifications')}
              className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
              aria-label="View notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifsCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 ring-2 ring-[#080D1F]"></span>
              )}
            </button>

            {/* Account Badge */}
            <div className="hidden md:flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-mono text-xs font-bold">
                {currentCustomer?.companyName.slice(0, 2).toUpperCase() || 'CC'}
              </div>
              <div className="text-left leading-tight hidden xl:block">
                <div className="text-xs font-medium text-slate-200 truncate max-w-[130px]">
                  {currentCustomer?.companyName || 'Shipper'}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {currentCustomer?.customerReference || 'KCC-CLI'}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Full Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="w-4/5 max-w-sm h-full bg-[#080D1F] border-r border-slate-800 flex flex-col p-4">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white font-['Poppins']">KIRENGA CARGO</div>
                    <div className="text-[10px] text-cyan-400 font-semibold">CLIENT PORTAL</div>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Account details in drawer */}
              <div className="py-3 border-b border-slate-800">
                <div className="text-xs font-semibold text-slate-300">{currentCustomer?.companyName}</div>
                <div className="text-[10px] font-mono text-cyan-400">{currentCustomer?.customerReference}</div>
              </div>

              <div className="flex-1 overflow-y-auto py-3 space-y-1">
                {[...navItems, ...bottomNavItems].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabChange(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium ${
                        isActive
                          ? 'bg-blue-600 text-white font-semibold'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-slate-800 text-cyan-300">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-slate-800">
                <button
                  onClick={() => onNavigate('home')}
                  className="w-full py-2.5 rounded-xl bg-slate-900 text-slate-300 text-xs font-medium flex items-center justify-center gap-2"
                >
                  <Compass className="w-4 h-4" />
                  <span>Exit to Public Website</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* WORKPLACE CONTENT BY TAB                                                  */}
        {/* ========================================================================= */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto">
          {/* TAB 1: OVERVIEW / DASHBOARD */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Corridor Banner */}
              <div className="rounded-2xl bg-gradient-to-r from-blue-950/60 via-[#0B132B] to-slate-900/80 border border-blue-800/40 p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono mb-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>EAST & CENTRAL AFRICA LOGISTICS CORRIDOR ACTIVE</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white font-['Poppins']">
                    Welcome back, {currentCustomer?.contactPerson || 'Logistics Controller'}
                  </h2>
                  <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl">
                    Operating under account <span className="text-slate-200 font-medium">{currentCustomer?.companyName}</span> ({currentCustomer?.customerReference}). Live tracking, dispatched vehicles, and real-time electronic Proof of Delivery (e-POD) sync enabled.
                  </p>
                </div>
                <div className="flex items-center gap-2.5 flex-shrink-0">
                  <button
                    onClick={() => handleTabChange('book')}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-transform active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Book New Cargo</span>
                  </button>
                  <button
                    onClick={() => handleTabChange('track')}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors flex items-center gap-2"
                  >
                    <Compass className="w-4 h-4 text-cyan-400" />
                    <span>Track Cargo</span>
                  </button>
                </div>
              </div>

              {/* Metric Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div
                  onClick={() => handleTabChange('shipments')}
                  className="bg-[#0B1329] border border-slate-800/80 p-5 rounded-2xl hover:border-cyan-500/40 cursor-pointer transition-all group"
                >
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-medium">Active Shipments</span>
                    <Package className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold font-mono text-cyan-300">
                    {activeShipments.length}
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">In transit or loading</span>
                </div>

                <div
                  onClick={() => handleTabChange('shipments')}
                  className="bg-[#0B1329] border border-slate-800/80 p-5 rounded-2xl hover:border-emerald-500/40 cursor-pointer transition-all group"
                >
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-medium">Delivered Cargo</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400">
                    {deliveredShipments.length}
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">Signed e-POD on file</span>
                </div>

                <div
                  onClick={() => handleTabChange('quotes')}
                  className="bg-[#0B1329] border border-slate-800/80 p-5 rounded-2xl hover:border-blue-500/40 cursor-pointer transition-all group"
                >
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-medium">Active Quotations</span>
                    <Sparkles className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold font-mono text-blue-400">
                    {clientQuotes.length}
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">Commercial proposals</span>
                </div>

                <div
                  onClick={() => handleTabChange('invoices')}
                  className="bg-[#0B1329] border border-slate-800/80 p-5 rounded-2xl hover:border-amber-500/40 cursor-pointer transition-all group"
                >
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-medium">Pending Invoices</span>
                    <Receipt className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold font-mono text-amber-400">
                    {clientInvoices.filter((i) => i.status === 'PENDING').length}
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">Awaiting settlement</span>
                </div>
              </div>

              {/* Active Consignments Quick View */}
              <div className="bg-[#0B1329] border border-slate-800/80 rounded-2xl p-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-white font-['Poppins']">Live Consignments in Transit</h3>
                    <p className="text-xs text-slate-400">Real-time status updates directly from dispatched drivers</p>
                  </div>
                  <button
                    onClick={() => handleTabChange('shipments')}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
                  >
                    <span>View All</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {activeShipments.length === 0 ? (
                  <EmptyState
                    icon={<Package className="w-7 h-7 text-cyan-400" />}
                    title="No Active Consignments"
                    description="You do not currently have any consignments in transit. Submit a new cargo booking to dispatch your freight."
                    actionText="Book Cargo Now"
                    onAction={() => handleTabChange('book')}
                  />
                ) : (
                  <div className="space-y-3">
                    {activeShipments.slice(0, 4).map((shipment) => (
                      <div
                        key={shipment.id}
                        onClick={() => {
                          setSelectedShipment(shipment);
                          handleTabChange('shipments');
                        }}
                        className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Truck className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                                {shipment.shipmentNumber}
                              </span>
                              <span
                                className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                                  shipment.status === 'IN_TRANSIT'
                                    ? 'bg-blue-500/20 text-cyan-300 border border-cyan-500/30'
                                    : shipment.status === 'LOADING'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : 'bg-slate-800 text-slate-300'
                                }`}
                              >
                                {shipment.status.replace(/_/g, ' ')}
                              </span>
                            </div>
                            <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                              <span>{shipment.originCity}, {shipment.originCountry}</span>
                              <span>→</span>
                              <span className="text-slate-200">{shipment.destinationCity}, {shipment.destinationCountry}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-slate-400 border-t md:border-t-0 pt-2 md:pt-0 border-slate-800">
                          <div>
                            <span className="text-[10px] text-slate-500 block">Cargo</span>
                            <span className="font-medium text-slate-200">{shipment.cargoDescription}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">Assigned Carrier</span>
                            <span className="font-medium text-slate-200">
                              {shipment.assignedVehicleReg || 'Awaiting Dispatch'}
                            </span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Two-column overview widgets: Recent Quotes + Recent Notifications */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Quotations widget */}
                <div className="bg-[#0B1329] border border-slate-800/80 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-white font-['Poppins']">Freight Proposals & Quotes</h3>
                    <button
                      onClick={() => handleTabChange('quotes')}
                      className="text-xs text-cyan-400 hover:text-cyan-300"
                    >
                      View all ({clientQuotes.length})
                    </button>
                  </div>
                  {clientQuotes.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-xs">
                      No quotations issued yet. Contact Kirenga Commercial Desk or submit a booking.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {clientQuotes.slice(0, 3).map((q) => (
                        <div
                          key={q.id}
                          className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-mono font-bold text-white">{q.quoteReference}</div>
                            <div className="text-slate-400 text-[11px] mt-0.5">
                              {q.origin} → {q.destination} ({q.cargoType})
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono font-bold text-cyan-400">
                              {q.currency} {q.total.toLocaleString()}
                            </div>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                q.status === 'ACCEPTED'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : q.status === 'REJECTED'
                                  ? 'bg-rose-500/20 text-rose-300'
                                  : 'bg-blue-500/20 text-blue-300'
                              }`}
                            >
                              {q.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Notifications widget */}
                <div className="bg-[#0B1329] border border-slate-800/80 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-white font-['Poppins']">Operational Alerts & Updates</h3>
                    <button
                      onClick={() => handleTabChange('notifications')}
                      className="text-xs text-cyan-400 hover:text-cyan-300"
                    >
                      View all
                    </button>
                  </div>
                  {clientNotifs.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-xs">
                      No new operational alerts. All consignments operating smoothly.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {clientNotifs.slice(0, 3).map((notif) => (
                        <div
                          key={notif.id}
                          className={`p-3 rounded-xl border text-xs ${
                            notif.read
                              ? 'bg-slate-900/40 border-slate-800/60 text-slate-400'
                              : 'bg-blue-950/30 border-blue-500/30 text-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="font-semibold text-cyan-400">{notif.title}</span>
                            <span className="text-[10px] text-slate-500">
                              {new Date(notif.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 leading-relaxed">{notif.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MY SHIPMENTS */}
          {activeTab === 'shipments' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Filter and Search Bar */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-[#0B1329] border border-slate-800 p-4 rounded-2xl">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={shipmentSearch}
                    onChange={(e) => setShipmentSearch(e.target.value)}
                    placeholder="Search by shipment #, cargo, city..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                  {(['ALL', 'IN_TRANSIT', 'LOADING', 'CONFIRMED', 'DELIVERED'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setShipmentFilter(filter)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                        shipmentFilter === filter
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      {filter.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Shipments List */}
              {displayShipments.length === 0 ? (
                <EmptyState
                  icon={<Package className="w-7 h-7 text-cyan-400" />}
                  title="No Consignments Found"
                  description={
                    shipmentSearch
                      ? `No records matching "${shipmentSearch}".`
                      : 'No shipments recorded in this status category.'
                  }
                  actionText="Book New Consignment"
                  onAction={() => handleTabChange('book')}
                />
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {displayShipments.map((shipment) => (
                    <div
                      key={shipment.id}
                      className="bg-[#0B1329] border border-slate-800/90 hover:border-cyan-500/40 rounded-2xl p-5 transition-all"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                            <Package className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-3">
                              <span className="text-base font-bold font-mono text-white">
                                {shipment.shipmentNumber}
                              </span>
                              <span
                                className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                                  shipment.status === 'DELIVERED'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : shipment.status === 'IN_TRANSIT'
                                    ? 'bg-blue-500/20 text-cyan-300 border border-cyan-500/30'
                                    : shipment.status === 'LOADING'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                                }`}
                              >
                                {shipment.status.replace(/_/g, ' ')}
                              </span>
                            </div>
                            <div className="text-xs text-slate-400 mt-1">
                              Booking Ref: <span className="font-mono text-slate-300">{shipment.bookingReference || 'Direct Dispatch'}</span> • Created: {new Date(shipment.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedShipment(shipment);
                              setTrackQuery(shipment.shipmentNumber);
                              setSearchedShipment(shipment);
                              handleTabChange('track');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
                          >
                            <Compass className="w-3.5 h-3.5" />
                            <span>Track Milestone</span>
                          </button>

                          {shipment.status === 'DELIVERED' && (
                            <button
                              onClick={() => handleTabChange('documents')}
                              className="px-3 py-1.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-300 text-xs font-medium border border-emerald-500/30 flex items-center gap-1.5 transition-colors"
                            >
                              <FileCheck className="w-3.5 h-3.5" />
                              <span>View e-POD</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Route & Cargo Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase font-semibold">Origin</span>
                          <span className="font-medium text-slate-200 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                            {shipment.originCity}, {shipment.originCountry}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase font-semibold">Destination</span>
                          <span className="font-medium text-slate-200 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                            {shipment.destinationCity}, {shipment.destinationCountry}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase font-semibold">Cargo Specification</span>
                          <span className="font-medium text-slate-200 block mt-0.5 truncate">
                            {shipment.cargoDescription} ({shipment.weightKg.toLocaleString()} kg)
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase font-semibold">Dispatched Vehicle</span>
                          <span className="font-medium text-slate-200 block mt-0.5">
                            {shipment.assignedVehicleReg ? (
                              <span className="text-cyan-300 font-mono font-semibold">{shipment.assignedVehicleReg} ({shipment.assignedDriverName})</span>
                            ) : (
                              <span className="text-slate-500 italic">Operations Dispatch Pending</span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TRACK CARGO */}
          {activeTab === 'track' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Search Bar */}
              <div className="bg-[#0B1329] border border-slate-800 p-6 rounded-2xl text-center max-w-2xl mx-auto">
                <span className="text-xs font-mono text-cyan-400 uppercase font-semibold">Real-Time Consignment Stepper</span>
                <h2 className="text-xl font-bold text-white font-['Poppins'] mt-1">
                  Corridor Milestone Tracking
                </h2>
                <p className="text-slate-400 text-xs mt-1 mb-4">
                  Enter your shipment or trip reference to inspect checkpoints, driver transit updates, and signed handover.
                </p>

                <form onSubmit={handleSearchTracking} className="flex gap-2 max-w-md mx-auto">
                  <input
                    type="text"
                    value={trackQuery}
                    onChange={(e) => setTrackQuery(e.target.value)}
                    placeholder="e.g. KCC-2026-000001"
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30 transition-all"
                  >
                    Track
                  </button>
                </form>

                {searchError && (
                  <div className="mt-3 text-xs text-rose-400 bg-rose-950/30 border border-rose-900/50 p-2.5 rounded-xl flex items-center justify-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>{searchError}</span>
                  </div>
                )}
              </div>

              {/* Display tracking result or prompt to pick a shipment */}
              {searchedShipment ? (
                <div className="bg-[#0B1329] border border-slate-800 rounded-2xl p-6 space-y-6">
                  {/* Header info */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold font-mono text-white">{searchedShipment.shipmentNumber}</h3>
                        <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase">
                          {searchedShipment.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        Cargo: {searchedShipment.cargoDescription} • Weight: {searchedShipment.weightKg.toLocaleString()} kg
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-400">Carrier Unit</div>
                      <div className="font-mono font-bold text-white text-sm">
                        {searchedShipment.assignedVehicleReg || 'Assigning...'}
                      </div>
                    </div>
                  </div>

                  {/* Route Bar */}
                  <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Origin Terminal</span>
                      <span className="text-slate-200 font-medium flex items-center gap-1.5 mt-1">
                        <MapPin className="w-4 h-4 text-cyan-400" />
                        {searchedShipment.originCity}, {searchedShipment.originCountry}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Delivery Handover</span>
                      <span className="text-slate-200 font-medium flex items-center gap-1.5 mt-1">
                        <MapPin className="w-4 h-4 text-emerald-400" />
                        {searchedShipment.destinationCity}, {searchedShipment.destinationCountry}
                      </span>
                    </div>
                  </div>

                  {/* Timeline Stepper */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                      Corridor Transit Milestones
                    </h4>
                    <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                      {searchedShipment.timeline && searchedShipment.timeline.length > 0 ? (
                        searchedShipment.timeline.map((step, idx) => (
                          <div key={idx} className="relative">
                            <div
                              className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                step.completed
                                  ? 'bg-emerald-500 border-emerald-400 text-black'
                                  : 'bg-slate-900 border-slate-700'
                              }`}
                            >
                              {step.completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </div>
                            <div className="text-xs">
                              <div className="flex items-center gap-3">
                                <span className="font-semibold text-slate-200 text-sm">{step.stage}</span>
                                <span className="text-[10px] text-slate-500 font-mono">
                                  {new Date(step.timestamp).toLocaleString()}
                                </span>
                              </div>
                              {step.notes && <p className="text-slate-400 mt-1 text-xs">{step.notes}</p>}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-slate-500">Milestone updates being initialized...</div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                activeShipments.length > 0 && (
                  <div className="bg-[#0B1329] border border-slate-800 rounded-2xl p-5">
                    <h3 className="text-sm font-bold text-white mb-3">Quick Select an Active Shipment to Track</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {activeShipments.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => {
                            setTrackQuery(s.shipmentNumber);
                            setSearchedShipment(s);
                          }}
                          className="p-3 rounded-xl bg-slate-900 text-left border border-slate-800 hover:border-cyan-500/40 text-xs transition-colors"
                        >
                          <div className="font-mono font-bold text-cyan-400">{s.shipmentNumber}</div>
                          <div className="text-slate-300 mt-1 truncate">{s.originCity} → {s.destinationCity}</div>
                          <div className="text-slate-500 text-[10px] mt-0.5 capitalize">{s.status.toLowerCase()}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          {/* TAB 4: BOOK CARGO */}
          {activeTab === 'book' && (
            <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
              <div className="bg-[#0B1329] border border-slate-800 p-6 rounded-2xl">
                <div className="mb-6">
                  <span className="text-xs font-mono text-cyan-400 uppercase font-semibold">Direct Firestore Requisition</span>
                  <h2 className="text-2xl font-bold font-['Poppins'] text-white mt-1">
                    Book Freight & Heavy Haulage
                  </h2>
                  <p className="text-slate-400 text-xs mt-1">
                    Direct booking for verified client <span className="text-slate-200 font-semibold">{currentCustomer?.companyName}</span>. Generates an instant booking record reviewed by Kirenga central operations.
                  </p>
                </div>

                <BookingForm
                  onSuccess={() => {
                    loadData();
                    handleTabChange('bookings');
                  }}
                  onNavigate={onNavigate}
                />
              </div>
            </div>
          )}

          {/* TAB 5: MY BOOKINGS */}
          {activeTab === 'bookings' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold font-['Poppins'] text-white">Consignment Booking Log</h2>
                  <p className="text-slate-400 text-xs">Direct record of all cargo booking requisitions submitted to Kirenga</p>
                </div>
                <button
                  onClick={() => handleTabChange('book')}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-blue-600/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Booking</span>
                </button>
              </div>

              {clientBookings.length === 0 ? (
                <EmptyState
                  icon={<FileText className="w-7 h-7 text-cyan-400" />}
                  title="No Booking Requests Yet"
                  description="You have not submitted any freight bookings under this corporate account."
                  actionText="Book Your First Cargo"
                  onAction={() => handleTabChange('book')}
                />
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {clientBookings.map((b) => (
                    <div
                      key={b.id}
                      className="p-5 rounded-2xl bg-[#0B1329] border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm font-bold text-white">{b.bookingReference}</span>
                          <span
                            className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                              b.status === 'CONFIRMED'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : b.status === 'ASSIGNED'
                                ? 'bg-blue-500/20 text-cyan-300 border border-cyan-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {b.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-300 mt-1.5">
                          {b.pickupLocation}, {b.pickupCountry} → {b.deliveryLocation}, {b.deliveryCountry}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1">
                          Cargo: {b.cargoDescription} • Weight: {b.weightKg.toLocaleString()} kg • Date: {b.pickupDate}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs">
                        {b.status === 'CONFIRMED' || b.status === 'ASSIGNED' ? (
                          <button
                            onClick={() => handleTabChange('shipments')}
                            className="px-3 py-1.5 rounded-lg bg-blue-600/30 text-cyan-300 border border-cyan-500/30 hover:bg-blue-600/50 transition-colors"
                          >
                            View Active Shipment
                          </button>
                        ) : (
                          <span className="text-[11px] text-amber-400/90 italic">
                            In Review by Dispatch Operations
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: QUOTES */}
          {activeTab === 'quotes' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-xl font-bold font-['Poppins'] text-white">Commercial Freight Quotations</h2>
                <p className="text-slate-400 text-xs">Formal route quotations issued by Kirenga Commercial Operations</p>
              </div>

              {clientQuotes.length === 0 ? (
                <EmptyState
                  icon={<Sparkles className="w-7 h-7 text-cyan-400" />}
                  title="No Quotations Issued"
                  description="There are no pending or accepted quotations for your account. You can request a custom rate proposal anytime."
                  actionText="Request Quotation"
                  onAction={() => onNavigate('quote')}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {clientQuotes.map((quote) => (
                    <div
                      key={quote.id}
                      className="p-5 rounded-2xl bg-[#0B1329] border border-slate-800 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                          <div>
                            <span className="font-mono text-sm font-bold text-white">{quote.quoteReference}</span>
                            <div className="text-[10px] text-slate-400 mt-0.5">Valid until: {quote.validUntil}</div>
                          </div>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                              quote.status === 'ACCEPTED'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : quote.status === 'REJECTED'
                                ? 'bg-rose-500/20 text-rose-300'
                                : 'bg-blue-500/20 text-blue-300'
                            }`}
                          >
                            {quote.status}
                          </span>
                        </div>

                        <div className="py-4 space-y-2 text-xs">
                          <div className="flex justify-between text-slate-300">
                            <span>Corridor Route:</span>
                            <span className="font-medium text-white">{quote.origin} → {quote.destination}</span>
                          </div>
                          <div className="flex justify-between text-slate-300">
                            <span>Cargo Type:</span>
                            <span className="font-medium text-white">{quote.cargoType}</span>
                          </div>
                          <div className="flex justify-between text-slate-300">
                            <span>Cargo Weight:</span>
                            <span className="font-medium text-white">{quote.weightKg.toLocaleString()} kg</span>
                          </div>
                          <div className="flex justify-between text-slate-400 pt-2 border-t border-slate-800/60">
                            <span>Base Haulage:</span>
                            <span>{quote.currency} {quote.transportCost.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-slate-400">
                            <span>Additional / Customs Fees:</span>
                            <span>{quote.currency} {quote.additionalCharges.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-base font-bold font-mono text-cyan-400 pt-2 border-t border-slate-800">
                            <span>Total Quote:</span>
                            <span>{quote.currency} {quote.total.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {quote.status === 'SENT' && (
                        <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
                          <button
                            onClick={() => handleAcceptQuote(quote)}
                            className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors shadow-sm"
                          >
                            Accept Quotation
                          </button>
                          <button
                            onClick={() => handleRejectQuote(quote)}
                            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                          >
                            Decline
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 7: PAYMENTS */}
          {activeTab === 'payments' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-xl font-bold font-['Poppins'] text-white">Payment Ledger & Receipts</h2>
                <p className="text-slate-400 text-xs">Official transaction records verified by Kirenga Central Finance</p>
              </div>

              {clientPayments.length === 0 ? (
                <EmptyState
                  icon={<CreditCard className="w-7 h-7 text-cyan-400" />}
                  title="No Payment Records"
                  description="There are currently no recorded payments under this corporate shipper account."
                />
              ) : (
                <div className="overflow-x-auto bg-[#0B1329] border border-slate-800 rounded-2xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-900/80 text-slate-400 text-[10px] uppercase font-mono border-b border-slate-800">
                      <tr>
                        <th className="px-5 py-3">Transaction Reference</th>
                        <th className="px-5 py-3">Invoice Ref</th>
                        <th className="px-5 py-3">Method</th>
                        <th className="px-5 py-3">Date</th>
                        <th className="px-5 py-3 text-right">Amount</th>
                        <th className="px-5 py-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {clientPayments.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-900/50">
                          <td className="px-5 py-3.5 font-mono font-bold text-white">{p.transactionReference}</td>
                          <td className="px-5 py-3.5 font-mono text-cyan-400">{p.invoiceReference || '—'}</td>
                          <td className="px-5 py-3.5">{p.paymentMethod}</td>
                          <td className="px-5 py-3.5 text-slate-400 font-mono">{new Date(p.timestamp).toLocaleDateString()}</td>
                          <td className="px-5 py-3.5 text-right font-mono font-bold text-emerald-400">
                            {p.currency} {p.amount.toLocaleString()}
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              {p.status}
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

          {/* TAB 8: INVOICES */}
          {activeTab === 'invoices' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-xl font-bold font-['Poppins'] text-white">Commercial Invoices</h2>
                <p className="text-slate-400 text-xs">Freight transport bills and official taxation invoices</p>
              </div>

              {clientInvoices.length === 0 ? (
                <EmptyState
                  icon={<Receipt className="w-7 h-7 text-cyan-400" />}
                  title="No Invoices Issued"
                  description="There are no commercial invoices requiring settlement under your corporate profile."
                />
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {clientInvoices.map((inv) => (
                    <div
                      key={inv.id}
                      className="p-5 rounded-2xl bg-[#0B1329] border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm font-bold text-white">{inv.invoiceReference}</span>
                          <span
                            className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                              inv.status === 'SUCCESS'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {inv.status === 'SUCCESS' ? 'PAID / SETTLED' : 'PENDING PAYMENT'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-300 mt-1">{inv.description}</div>
                        <div className="text-[11px] text-slate-500 mt-1 font-mono">
                          Due Date: {inv.dueDate} • Shipment: {inv.shipmentNumber || 'General Service'}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 block uppercase">Invoice Total</span>
                          <span className="font-mono text-base font-bold text-white">
                            {inv.currency} {inv.amount.toLocaleString()}
                          </span>
                        </div>

                        {inv.status !== 'SUCCESS' ? (
                          <button
                            onClick={() => handleOpenPayment(inv)}
                            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all"
                          >
                            Pay Online
                          </button>
                        ) : (
                          <button
                            onClick={() => handleTabChange('receipts')}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700 flex items-center gap-1"
                          >
                            <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Receipt</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 9: RECEIPTS */}
          {activeTab === 'receipts' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-xl font-bold font-['Poppins'] text-white">Payment Receipts</h2>
                <p className="text-slate-400 text-xs">Official proof of payment stamps for your corporate accounting records</p>
              </div>

              {clientPayments.length === 0 ? (
                <EmptyState
                  icon={<FileCheck className="w-7 h-7 text-cyan-400" />}
                  title="No Payment Receipts"
                  description="When you settle freight invoices, verified receipts with transaction stamps will appear here."
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {clientPayments.map((p) => (
                    <div
                      key={p.id}
                      className="p-5 rounded-2xl bg-[#0B1329] border border-slate-800 flex flex-col justify-between"
                    >
                      <div className="border-b border-slate-800 pb-3 mb-3">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-cyan-400">{p.transactionReference}</span>
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300">
                            OFFICIAL RECEIPT
                          </span>
                        </div>
                        <div className="text-xs text-white font-medium mt-1">
                          Kirenga Cargo Carriers Logistics Desk
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-300 mb-4">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Payer:</span>
                          <span className="font-medium text-white">{p.customerName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Settled Invoice:</span>
                          <span className="font-mono text-slate-300">{p.invoiceReference || 'Direct Remittance'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Method:</span>
                          <span>{p.paymentMethod}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Payment Date:</span>
                          <span className="font-mono">{new Date(p.timestamp).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-slate-800 font-bold font-mono text-sm text-emerald-400">
                          <span>Amount Paid:</span>
                          <span>{p.currency} {p.amount.toLocaleString()}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => window.print()}
                        className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium flex items-center justify-center gap-1.5 border border-slate-800 transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Official Voucher</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 10: DOCUMENTS (PROOF OF DELIVERY & CONSIGNMENT NOTES) */}
          {activeTab === 'documents' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-xl font-bold font-['Poppins'] text-white">Consignment Documents & e-POD Repository</h2>
                <p className="text-slate-400 text-xs">
                  Access signed electronic Proof of Delivery (e-POD) certificates, bills of lading, and customs manifests.
                </p>
              </div>

              {deliveredShipments.length === 0 && clientDocs.length === 0 ? (
                <EmptyState
                  icon={<Download className="w-7 h-7 text-cyan-400" />}
                  title="No Documents Available"
                  description="Verified electronic Proof of Delivery certificates and consignment notes will appear here once driver handover is confirmed."
                />
              ) : (
                <div className="space-y-4">
                  {/* Proof of Delivery from Delivered Shipments */}
                  {deliveredShipments.map((shipment) => (
                    <div
                      key={shipment.id}
                      className="p-5 rounded-2xl bg-[#0B1329] border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                          <FileCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold text-white">
                              Proof of Delivery — {shipment.shipmentNumber}
                            </span>
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              SIGNED & VERIFIED
                            </span>
                          </div>
                          <div className="text-xs text-slate-300 mt-1">
                            Destination: {shipment.destinationCity}, {shipment.destinationCountry} • Delivered on: {new Date(shipment.actualDelivery || shipment.updatedAt).toLocaleString()}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Carrier: {shipment.assignedVehicleReg} • Dispatched Driver: {shipment.assignedDriverName}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          alert(`Viewing e-POD Certificate for ${shipment.shipmentNumber}\nVerified handover confirmed at ${shipment.destinationCity}.\nRecipient signature recorded.`);
                        }}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download e-POD</span>
                      </button>
                    </div>
                  ))}

                  {/* Other client documents */}
                  {clientDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-4 rounded-xl bg-[#0B1329] border border-slate-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-cyan-400" />
                        <div>
                          <div className="font-semibold text-white">{doc.title}</div>
                          <div className="text-slate-500 text-[11px]">{doc.fileName} • {doc.fileSize || '1.2 MB'}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => alert(`Downloading ${doc.fileName}...`)}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 11: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="space-y-6 animate-fadeIn max-w-3xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold font-['Poppins'] text-white">Notifications & Alerts</h2>
                  <p className="text-slate-400 text-xs">Real-time alerts regarding your cargo transit milestones and billing</p>
                </div>
                {unreadNotifsCount > 0 && (
                  <button
                    onClick={handleMarkAllNotifs}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-medium border border-slate-700 transition-colors"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              {clientNotifs.length === 0 ? (
                <EmptyState
                  icon={<Bell className="w-7 h-7 text-cyan-400" />}
                  title="No Notifications"
                  description="Your notification feed is empty. All consignment milestones will appear here in real time."
                />
              ) : (
                <div className="space-y-3">
                  {clientNotifs.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        notif.read
                          ? 'bg-[#0B1329]/60 border-slate-800/80 text-slate-400'
                          : 'bg-[#0B1329] border-blue-500/40 text-slate-200 shadow-md shadow-blue-900/10'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <div className="flex items-center gap-2 font-semibold text-white">
                          <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                          <span>{notif.title}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(notif.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed pl-4">{notif.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 12: SUPPORT */}
          {activeTab === 'support' && (
            <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold font-['Poppins'] text-white">Client Support Desk</h2>
                  <p className="text-slate-400 text-xs">Connect directly with Kirenga dispatch managers and customer service</p>
                </div>
                <button
                  onClick={() => setShowNewTicketModal(true)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-blue-600/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>Open Ticket</span>
                </button>
              </div>

              {clientTickets.length === 0 ? (
                <EmptyState
                  icon={<MessageSquare className="w-7 h-7 text-cyan-400" />}
                  title="No Support Tickets"
                  description="Need assistance with a route, customs clearance, or invoice? Open a direct priority ticket."
                  actionText="Create Support Ticket"
                  onAction={() => setShowNewTicketModal(true)}
                />
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {clientTickets.map((t) => (
                    <div
                      key={t.id}
                      className="p-5 rounded-2xl bg-[#0B1329] border border-slate-800 space-y-3"
                    >
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold text-white">{t.ticketNumber}</span>
                            <span className="text-xs text-cyan-400 font-medium">• {t.category}</span>
                          </div>
                          <h4 className="text-sm font-semibold text-slate-200 mt-0.5">{t.subject}</h4>
                        </div>
                        <span
                          className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${
                            t.status === 'RESOLVED'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-blue-500/20 text-cyan-300'
                          }`}
                        >
                          {t.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">{t.description}</p>

                      {/* Reply Messages Thread */}
                      {t.messages && t.messages.length > 0 && (
                        <div className="bg-slate-900/80 rounded-xl p-3 space-y-2 border border-slate-800">
                          <span className="text-[10px] text-slate-500 uppercase font-semibold block">Correspondence</span>
                          {t.messages.map((m, idx) => (
                            <div key={idx} className="text-xs border-b border-slate-800/40 pb-2 last:border-b-0">
                              <div className="flex justify-between text-[11px] text-slate-400">
                                <span className="font-semibold text-slate-200">{m.sender} ({m.role})</span>
                                <span className="font-mono text-[10px]">{new Date(m.timestamp).toLocaleTimeString()}</span>
                              </div>
                              <p className="text-slate-300 mt-0.5">{m.message}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Reply Box */}
                      <button
                        onClick={() => setSelectedTicket(t)}
                        className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Add Reply</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 13: MY PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-fadeIn max-w-3xl mx-auto">
              <div className="bg-[#0B1329] border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center gap-4 pb-6 border-b border-slate-800">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white font-bold text-2xl font-mono shadow-lg shadow-blue-600/30">
                    {currentCustomer?.companyName.slice(0, 2).toUpperCase() || 'CC'}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold font-['Poppins'] text-white">
                      {currentCustomer?.companyName}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-mono text-cyan-400">{currentCustomer?.customerReference}</span>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {currentCustomer?.accountStatus}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/20 text-blue-300">
                        {currentCustomer?.tier} TIER
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block uppercase font-semibold">Primary Contact Person</span>
                    <span className="font-semibold text-slate-200 mt-1 block">{currentCustomer?.contactPerson}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block uppercase font-semibold">Corporate Email</span>
                    <span className="font-semibold text-slate-200 mt-1 block">{currentCustomer?.email}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block uppercase font-semibold">Phone / WhatsApp Dispatch</span>
                    <span className="font-semibold text-slate-200 mt-1 block">{currentCustomer?.phone}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block uppercase font-semibold">Tax ID / PIN Number</span>
                    <span className="font-mono font-semibold text-cyan-300 mt-1 block">{currentCustomer?.taxId || 'VERIFIED-PIN'}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 md:col-span-2">
                    <span className="text-[10px] text-slate-500 block uppercase font-semibold">Registered Operational Address</span>
                    <span className="font-medium text-slate-200 mt-1 block">
                      {currentCustomer?.address}, {currentCustomer?.city}, {currentCustomer?.country}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 14: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6 animate-fadeIn max-w-3xl mx-auto">
              <div className="bg-[#0B1329] border border-slate-800 rounded-2xl p-6">
                <h2 className="text-xl font-bold font-['Poppins'] text-white mb-4">
                  Account Preferences
                </h2>

                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800">
                    <div>
                      <div className="font-semibold text-slate-200">Electronic Proof of Delivery (e-POD) Auto-Alerts</div>
                      <div className="text-slate-400 text-[11px] mt-0.5">Receive immediate notification when cargo recipient signs for delivery</div>
                    </div>
                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800">
                    <div>
                      <div className="font-semibold text-slate-200">Corridor Checkpoint SMS Updates</div>
                      <div className="text-slate-400 text-[11px] mt-0.5">Send border & customs milestone updates to registered mobile</div>
                    </div>
                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" />
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="font-semibold text-slate-200 mb-2">Preferred Billing & Ledger Currency</div>
                    <select
                      aria-label="Preferred currency"
                      defaultValue={currentCustomer?.preferredCurrency || 'USD'}
                      className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none"
                    >
                      <option value="USD">USD ($) — United States Dollar (Corridor Default)</option>
                      <option value="KES">KES (KSh) — Kenya Shilling</option>
                      <option value="UGX">UGX (USh) — Uganda Shilling</option>
                      <option value="TZS">TZS (TSh) — Tanzania Shilling</option>
                      <option value="RWF">RWF (FRw) — Rwanda Franc</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* MOBILE BOTTOM NAVIGATION BAR (FOR CLIENT WORKPLACE)                       */}
      {/* ========================================================================= */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#080D1F]/95 backdrop-blur-md border-t border-slate-800 px-2 py-1.5 flex items-center justify-around">
        <button
          onClick={() => handleTabChange('overview')}
          className={`flex flex-col items-center py-1 px-2 text-[10px] font-medium transition-colors ${
            activeTab === 'overview' ? 'text-cyan-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-5 h-5" />
          <span>Home</span>
        </button>

        <button
          onClick={() => handleTabChange('shipments')}
          className={`flex flex-col items-center py-1 px-2 text-[10px] font-medium transition-colors relative ${
            activeTab === 'shipments' ? 'text-cyan-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Package className="w-5 h-5" />
          <span>Shipments</span>
          {activeShipments.length > 0 && (
            <span className="absolute top-1 right-3 w-2 h-2 rounded-full bg-cyan-400"></span>
          )}
        </button>

        <button
          onClick={() => handleTabChange('track')}
          className={`flex flex-col items-center py-1 px-2 text-[10px] font-medium transition-colors ${
            activeTab === 'track' ? 'text-cyan-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Compass className="w-5 h-5" />
          <span>Track</span>
        </button>

        <button
          onClick={() => handleTabChange('book')}
          className={`flex flex-col items-center py-1 px-2 text-[10px] font-medium text-blue-400 hover:text-blue-300`}
        >
          <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/30">
            <Plus className="w-4 h-4" />
          </div>
          <span>Book</span>
        </button>

        <button
          onClick={() => setMobileMenuOpen(true)}
          className={`flex flex-col items-center py-1 px-2 text-[10px] font-medium text-slate-400 hover:text-white`}
        >
          <div className="relative">
            <SettingsIcon className="w-5 h-5" />
            {unreadNotifsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400"></span>
            )}
          </div>
          <span>More</span>
        </button>
      </nav>

      {/* ========================================================================= */}
      {/* MODAL: PAY INVOICE ONLINE                                                 */}
      {/* ========================================================================= */}
      {showPaymentModal && paymentInvoice && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B1329] border border-slate-800 w-full max-w-md rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white font-['Poppins']">Settle Invoice Online</h3>
                <span className="text-xs font-mono text-cyan-400">{paymentInvoice.invoiceReference}</span>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs flex justify-between items-center">
              <span className="text-slate-400">Amount Due:</span>
              <span className="font-mono text-lg font-bold text-emerald-400">
                {paymentInvoice.currency} {paymentInvoice.amount.toLocaleString()}
              </span>
            </div>

            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1.5">
                Corporate Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none"
              >
                <option value="Bank Wire Transfer">Bank Wire Transfer (SWIFT / RTGS)</option>
                <option value="Letter of Credit">Confirmed Irrevocable Letter of Credit (L/C)</option>
                <option value="Corporate Fleet Card">Corporate Logistics Card</option>
                <option value="M-Pesa Business Remittance">M-Pesa Kenya / Africa Paybill</option>
              </select>
            </div>

            {paymentSuccessMessage ? (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{paymentSuccessMessage}</span>
              </div>
            ) : (
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPayment}
                  disabled={paymentProcessing}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2"
                >
                  {paymentProcessing ? (
                    <span>Processing...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm & Issue Receipt</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE SUPPORT TICKET                                              */}
      {/* ========================================================================= */}
      {showNewTicketModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B1329] border border-slate-800 w-full max-w-lg rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white font-['Poppins']">Create Priority Support Ticket</h3>
                <p className="text-xs text-slate-400">Direct transmission to dispatch & customs controllers</p>
              </div>
              <button
                onClick={() => setShowNewTicketModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Inquiry Category</label>
                <select
                  value={ticketCategory}
                  onChange={(e) => setTicketCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none"
                >
                  <option value="Shipment Inquiry">Shipment Tracking & Status Inquiry</option>
                  <option value="Customs & Border">Border Clearance & Customs Documentation</option>
                  <option value="Billing & Invoicing">Billing, Invoices & Receipt Discrepancy</option>
                  <option value="Route Delay">Transit Route Exception or Delay</option>
                  <option value="Special Handling">Hazardous / Reefer / Heavy Haul Assistance</option>
                  <option value="Other">General Customer Care</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  placeholder="Summary of inquiry or cargo issue..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Related Consignment # (Optional)</label>
                <input
                  type="text"
                  value={ticketShipmentNumber}
                  onChange={(e) => setTicketShipmentNumber(e.target.value)}
                  placeholder="e.g. KCC-2026-000001"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Detailed Message</label>
                <textarea
                  required
                  rows={4}
                  value={ticketDescription}
                  onChange={(e) => setTicketDescription(e.target.value)}
                  placeholder="Provide exact details for rapid resolution..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewTicketModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REPLY TO TICKET                                                    */}
      {/* ========================================================================= */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B1329] border border-slate-800 w-full max-w-lg rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white font-['Poppins']">Ticket Reply</h3>
                <span className="text-xs font-mono text-cyan-400">{selectedTicket.ticketNumber} • {selectedTicket.subject}</span>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendTicketReply} className="space-y-3">
              <textarea
                required
                rows={4}
                value={ticketReplyMessage}
                onChange={(e) => setTicketReplyMessage(e.target.value)}
                placeholder="Type your response to the logistics controller..."
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none resize-none"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Reply</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
