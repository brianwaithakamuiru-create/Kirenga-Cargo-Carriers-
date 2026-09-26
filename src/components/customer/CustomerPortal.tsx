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
  RefreshCw
} from 'lucide-react';
import { db, COLLECTIONS } from '../../lib/firestoreService';
import { useAuth } from '../../context/AuthContext';
import { Shipment, Quote, Invoice, Payment, SupportTicket } from '../../types';
import { EmptyState } from '../common/EmptyState';
import { BookingForm } from '../public/BookingForm';
import { QuoteForm } from '../public/QuoteForm';

interface CustomerPortalProps {
  onNavigate: (view: string) => void;
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({ onNavigate }) => {
  const { currentUser, userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'shipments' | 'quotes' | 'invoices' | 'support' | 'new-booking'>('overview');
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // New Support Ticket modal / form
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCategory, setTicketCategory] = useState('Shipment Inquiry');
  const [ticketDescription, setTicketDescription] = useState('');
  const [ticketShipmentNumber, setTicketShipmentNumber] = useState('');


  const loadCustomerData = async () => {
    if (!currentUser?.uid || !currentUser.email) {
      setShipments([]);
      setQuotes([]);
      setInvoices([]);
      setTickets([]);
      setLoadError('Sign in with a verified client account to view your records.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const [shList, qtList, invList, tckList] = await Promise.all([
        db.getByField<Shipment>(COLLECTIONS.SHIPMENTS, 'customerEmail', currentUser.email),
        db.getByField<Quote>(COLLECTIONS.QUOTES, 'customerEmail', currentUser.email),
        db.getByField<Invoice>(COLLECTIONS.INVOICES, 'customerEmail', currentUser.email),
        db.getByField<SupportTicket>(COLLECTIONS.SUPPORT_TICKETS, 'requesterId', currentUser.uid),
      ]);
      setShipments(shList);
      setQuotes(qtList);
      setInvoices(invList);
      setTickets(tckList);
    } catch (e: any) {
      console.error('Error loading customer data:', e);
      setLoadError('Your client records could not be loaded. Check your account access and connection, then retry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCustomerData();
  }, [currentUser?.uid, currentUser?.email]);

  const handleAcceptQuote = async (quoteId: string) => {
    try {
      await db.update<Quote>(COLLECTIONS.QUOTES, quoteId, { status: 'ACCEPTED' });
      await db.logActivity({
        action: 'Quotation Accepted by Customer',
        actor: 'Customer',
        role: 'CUSTOMER',
        relatedRecordType: 'BOOKING',
        relatedRecordId: quoteId,
        details: 'Customer formally accepted logistics quotation.',
      });
      loadCustomerData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !userProfile || !ticketSubject.trim() || !ticketDescription.trim()) return;
    const now = new Date().toISOString();
    try {
      await db.add<SupportTicket>(COLLECTIONS.SUPPORT_TICKETS, {
        id: 'ticket_' + currentUser.uid + '_' + Date.now(),
        ticketNumber: 'KCC-SUP-' + Date.now().toString().slice(-8),
        requesterName: userProfile.fullName,
        requesterRole: 'CUSTOMER',
        requesterId: currentUser.uid,
        subject: ticketSubject.trim(),
        category: ticketCategory,
        description: ticketDescription.trim(),
        relatedShipmentNumber: ticketShipmentNumber.trim() || undefined,
        status: 'OPEN',
        urgency: 'NORMAL',
        createdAt: now,
        updatedAt: now,
        messages: [],
      });
      setShowNewTicketModal(false);
      setTicketSubject('');
      setTicketDescription('');
      setTicketShipmentNumber('');
      await loadCustomerData();
    } catch (err: any) {
      console.error(err);
      setLoadError('Your support request could not be saved. Please try again.');
    }
  };

  const activeShipments = shipments.filter((s) => s.status !== 'DELIVERED' && s.status !== 'CANCELLED');
  const deliveredShipments = shipments.filter((s) => s.status === 'DELIVERED');

  return (
    <div className="min-h-screen bg-[#050816] text-[#F8FAFC]">
      {/* Top Banner */}
      <div className="border-b border-slate-800 bg-[#0B1329]/80 px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono mb-1">
              <span>CLIENT CARGO PORTAL</span>
              <span>•</span>
              <span className="text-slate-400">{userProfile?.companyName || userProfile?.fullName || 'Secure client account'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-['Poppins'] text-white">
              Customer Consignment Desk
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => void loadCustomerData()} className="px-3 py-2.5 rounded-xl bg-slate-900 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-2"><RefreshCw className="h-3.5 w-3.5" />Refresh</button>
            <button
              onClick={() => setActiveTab('new-booking')}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Book New Cargo</span>
            </button>
            <button
              onClick={() => onNavigate('track')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
            >
              Track by Number
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto mt-6 flex gap-2 border-b border-slate-800/80 overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-cyan-400 text-cyan-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('shipments')}
            className={`pb-3 px-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'shipments'
                ? 'border-cyan-400 text-cyan-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>My Consignments</span>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-[10px]">{shipments.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('quotes')}
            className={`pb-3 px-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'quotes'
                ? 'border-cyan-400 text-cyan-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Freight Quotes</span>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-[10px]">{quotes.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`pb-3 px-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'invoices'
                ? 'border-cyan-400 text-cyan-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Invoices & Receipts</span>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-[10px]">{invoices.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('support')}
            className={`pb-3 px-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'support'
                ? 'border-cyan-400 text-cyan-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Support Tickets</span>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-[10px]">{tickets.length}</span>
          </button>
        </div>
      </div>

      {loadError && <div role="alert" className="mx-auto mt-5 max-w-7xl px-4 sm:px-6 lg:px-8"><div className="flex items-center justify-between gap-4 rounded-xl border border-amber-500/30 bg-amber-950/30 p-4 text-sm text-amber-100"><span>{loadError}</span><button onClick={() => void loadCustomerData()} className="shrink-0 underline">Retry</button></div></div>}

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'new-booking' ? (
          <div>
            <div className="mb-4">
              <button
                onClick={() => setActiveTab('overview')}
                className="text-xs text-slate-400 hover:text-white"
              >
                ← Return to Customer Portal
              </button>
            </div>
            <BookingForm
              onSuccess={() => {
                loadCustomerData();
                setActiveTab('shipments');
              }}
              onNavigate={onNavigate}
            />
          </div>
        ) : activeTab === 'overview' ? (
          <div className="space-y-8">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#0F172A] border border-slate-800 p-5 rounded-2xl">
                <span className="text-xs text-slate-400 block mb-1">Active Consignments</span>
                <div className="text-2xl font-bold font-mono text-cyan-400">{activeShipments.length}</div>
                <span className="text-[11px] text-slate-500 mt-1 block">In transit or loading</span>
              </div>
              <div className="bg-[#0F172A] border border-slate-800 p-5 rounded-2xl">
                <span className="text-xs text-slate-400 block mb-1">Delivered Consignments</span>
                <div className="text-2xl font-bold font-mono text-emerald-400">{deliveredShipments.length}</div>
                <span className="text-[11px] text-slate-500 mt-1 block">Proof of delivery verified</span>
              </div>
              <div className="bg-[#0F172A] border border-slate-800 p-5 rounded-2xl">
                <span className="text-xs text-slate-400 block mb-1">Active Quotations</span>
                <div className="text-2xl font-bold font-mono text-blue-400">{quotes.length}</div>
                <span className="text-[11px] text-slate-500 mt-1 block">Commercial proposals</span>
              </div>
              <div className="bg-[#0F172A] border border-slate-800 p-5 rounded-2xl">
                <span className="text-xs text-slate-400 block mb-1">Invoices</span>
                <div className="text-2xl font-bold font-mono text-amber-400">{invoices.length}</div>
                <span className="text-[11px] text-slate-500 mt-1 block">Billing & transit charges</span>
              </div>
            </div>

            {/* Active Consignments Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white font-['Poppins'] flex items-center gap-2">
                  <Truck className="w-4 h-4 text-cyan-400" />
                  <span>Recent Consignments</span>
                </h3>
                {shipments.length > 0 && (
                  <button
                    onClick={() => setActiveTab('shipments')}
                    className="text-xs text-cyan-400 hover:underline"
                  >
                    View All ({shipments.length})
                  </button>
                )}
              </div>

              {shipments.length === 0 ? (
                <EmptyState
                  title="No active shipments recorded"
                  description="You have not created or booked any cargo shipments yet. Submit a cargo booking to reserve carrier capacity."
                  actionText="Book Cargo Transit"
                  onAction={() => setActiveTab('new-booking')}
                  icon={<Package className="w-6 h-6" />}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {shipments.slice(0, 4).map((sh) => (
                    <div
                      key={sh.id}
                      className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-sm font-bold text-cyan-400">{sh.shipmentNumber}</span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-blue-950 text-cyan-300 border border-blue-500/30">
                          {sh.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="text-xs text-slate-300 mb-2">
                        <strong className="text-white">{sh.originCity}</strong> ({sh.originCountry}) →{' '}
                        <strong className="text-white">{sh.destinationCity}</strong> ({sh.destinationCountry})
                      </div>
                      <div className="text-[11px] text-slate-400 mb-3">
                        Cargo: {sh.cargoType} • {sh.weightKg.toLocaleString()} kg
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
                        <span className="text-slate-500 font-mono text-[11px]">
                          {new Date(sh.createdAt).toLocaleDateString()}
                        </span>
                        <button
                          onClick={() => onNavigate('track')}
                          className="text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
                        >
                          <span>Track Live</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'shipments' ? (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white font-['Poppins']">My Cargo Consignments</h3>
            {shipments.length === 0 ? (
              <EmptyState
                title="No shipments found"
                description="No shipment records exist under your account in Firestore."
                actionText="Book Cargo"
                onAction={() => setActiveTab('new-booking')}
              />
            ) : (
              <div className="overflow-x-auto bg-[#0F172A] border border-slate-800 rounded-2xl">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#050816] text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider font-mono">
                    <tr>
                      <th className="p-4">Shipment #</th>
                      <th className="p-4">Shipper / Receiver</th>
                      <th className="p-4">Corridor Route</th>
                      <th className="p-4">Cargo / Weight</th>
                      <th className="p-4">Vehicle / Driver</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {shipments.map((sh) => (
                      <tr key={sh.id} className="hover:bg-slate-800/40">
                        <td className="p-4 font-mono font-bold text-cyan-400">{sh.shipmentNumber}</td>
                        <td className="p-4">
                          <div className="text-white font-medium">{sh.customerName}</div>
                          <div className="text-[11px] text-slate-500">{sh.customerPhone}</div>
                        </td>
                        <td className="p-4">
                          {sh.originCity} ({sh.originCountry}) → {sh.destinationCity} ({sh.destinationCountry})
                        </td>
                        <td className="p-4">
                          <div>{sh.cargoType}</div>
                          <div className="text-slate-500">{sh.weightKg.toLocaleString()} kg</div>
                        </td>
                        <td className="p-4">
                          <div className="font-mono text-slate-200">{sh.assignedVehicleReg || 'Pending'}</div>
                          <div className="text-[11px] text-slate-500">{sh.assignedDriverName || 'Unassigned'}</div>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-950 text-cyan-300 border border-blue-500/20">
                            {sh.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => onNavigate('track')}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-medium"
                          >
                            Track
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : activeTab === 'quotes' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white font-['Poppins']">Freight Quotations</h3>
              <button
                onClick={() => onNavigate('quote')}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
              >
                Request New Quote
              </button>
            </div>

            {quotes.length === 0 ? (
              <EmptyState
                title="No quotations on record"
                description="You have not requested any rate quotes yet. Submit a freight quote request to receive commercial pricing."
                actionText="Request a Quote"
                onAction={() => onNavigate('quote')}
                icon={<FileText className="w-6 h-6" />}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quotes.map((q) => (
                  <div key={q.id} className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-sm font-bold text-cyan-400">{q.quoteReference}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        q.status === 'ACCEPTED' ? 'bg-emerald-950 text-emerald-300' : 'bg-blue-950 text-blue-300'
                      }`}>
                        {q.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-300 mb-1">
                      <span className="text-slate-500">Route: </span>
                      {q.origin} → {q.destination}
                    </div>
                    <div className="text-xs text-slate-400 mb-3">
                      Cargo: {q.cargoType} ({q.weightKg.toLocaleString()} kg)
                    </div>
                    <div className="p-3 bg-[#050816] rounded-xl border border-slate-800 flex justify-between items-center text-xs mb-4">
                      <span className="text-slate-400">Total Freight Cost</span>
                      <span className="text-emerald-400 font-bold text-base font-mono">
                        {q.currency} {q.total.toLocaleString()}
                      </span>
                    </div>
                    {q.status !== 'ACCEPTED' && (
                      <button
                        onClick={() => handleAcceptQuote(q.id)}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold"
                      >
                        Accept Quotation
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'invoices' ? (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white font-['Poppins']">Billing, Invoices & Receipts</h3>
            {invoices.length === 0 ? (
              <EmptyState
                title="No invoices generated"
                description="There are no billing records or outstanding invoices associated with your account in Firestore."
                icon={<CreditCard className="w-6 h-6" />}
              />
            ) : (
              <div className="overflow-x-auto bg-[#0F172A] border border-slate-800 rounded-2xl">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#050816] text-slate-400 border-b border-slate-800 text-[11px] uppercase font-mono">
                    <tr>
                      <th className="p-4">Invoice #</th>
                      <th className="p-4">Shipment #</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Due Date</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-800/40">
                        <td className="p-4 font-mono font-bold text-cyan-400">{inv.invoiceReference}</td>
                        <td className="p-4 font-mono text-slate-300">{inv.shipmentNumber || 'N/A'}</td>
                        <td className="p-4 font-bold text-emerald-400">{inv.currency} {inv.amount.toLocaleString()}</td>
                        <td className="p-4 text-slate-400">{inv.dueDate}</td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-200">
                            {inv.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => window.print()}
                            className="inline-flex items-center gap-1 text-slate-400 hover:text-white text-xs"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Receipt</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* Support Tickets Tab */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white font-['Poppins']">Customer Support Tickets</h3>
              <button
                onClick={() => setShowNewTicketModal(true)}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Ticket</span>
              </button>
            </div>

            {tickets.length === 0 ? (
              <EmptyState
                title="No support tickets opened"
                description="You have no active support requests. Open a ticket if you require assistance with an existing consignment or documentation."
                actionText="Open Support Ticket"
                onAction={() => setShowNewTicketModal(true)}
                icon={<MessageSquare className="w-6 h-6" />}
              />
            ) : (
              <div className="space-y-3">
                {tickets.map((tck) => (
                  <div key={tck.id} className="p-4 rounded-2xl bg-[#0F172A] border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-cyan-400">{tck.ticketNumber}</span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs font-semibold text-white">{tck.subject}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-950 text-blue-300">
                        {tck.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{tck.description}</p>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800">
                      <span>Category: {tck.category} {tck.relatedShipmentNumber && `• Consignment ${tck.relatedShipmentNumber}`}</span>
                      <span>{new Date(tck.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* New Ticket Modal */}
      {showNewTicketModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-fadeIn">
            <h3 className="text-lg font-bold text-white font-['Poppins']">Create Support Ticket</h3>
            <form onSubmit={handleCreateTicket} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Your Name / Company</label>
                <input
                  type="text"
                  required
                  value={ticketCustomerName}
                  onChange={(e) => setTicketCustomerName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#050816] border border-slate-700 rounded-xl text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Inquiry Subject *</label>
                <input
                  type="text"
                  required
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  placeholder="e.g. Inquire about border customs clearance status"
                  className="w-full px-3 py-2 bg-[#050816] border border-slate-700 rounded-xl text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1">Category</label>
                  <select
                    value={ticketCategory}
                    onChange={(e) => setTicketCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-[#050816] border border-slate-700 rounded-xl text-white"
                  >
                    <option value="Shipment Inquiry">Shipment Inquiry</option>
                    <option value="Customs Documentation">Customs Documentation</option>
                    <option value="Billing & Invoicing">Billing & Invoicing</option>
                    <option value="Delivery Coordination">Delivery Coordination</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Shipment # (Optional)</label>
                  <input
                    type="text"
                    value={ticketShipmentNumber}
                    onChange={(e) => setTicketShipmentNumber(e.target.value)}
                    placeholder="e.g. KCC-2026-000001"
                    className="w-full px-3 py-2 bg-[#050816] border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Detailed Description *</label>
                <textarea
                  rows={4}
                  required
                  value={ticketDescription}
                  onChange={(e) => setTicketDescription(e.target.value)}
                  placeholder="Describe your question or issue in detail..."
                  className="w-full px-3 py-2 bg-[#050816] border border-slate-700 rounded-xl text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewTicketModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
