import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  HelpCircle,
  Clock,
  CheckCircle2,
  Mail,
  User,
  Send,
  AlertTriangle,
  ChevronRight,
  Search
} from 'lucide-react';
import { db, COLLECTIONS } from '../../lib/firestoreService';
import { SupportTicket, ContactMessage } from '../../types';
import { EmptyState } from '../common/EmptyState';

interface SupportWorkplaceProps {
  onNavigate: (view: string) => void;
}

export const SupportWorkplace: React.FC<SupportWorkplaceProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'tickets' | 'inquiries'>('tickets');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [tList, mList] = await Promise.all([
        db.getAll<SupportTicket>(COLLECTIONS.SUPPORT_TICKETS),
        db.getAll<ContactMessage>(COLLECTIONS.CONTACT_MESSAGES),
      ]);
      setTickets(tList);
      setMessages(mList);
      if (selectedTicket) {
        const refreshed = tList.find((t) => t.id === selectedTicket.id);
        if (refreshed) setSelectedTicket(refreshed);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsubT = db.subscribe(COLLECTIONS.SUPPORT_TICKETS, loadData);
    const unsubM = db.subscribe(COLLECTIONS.CONTACT_MESSAGES, loadData);
    return () => {
      unsubT();
      unsubM();
    };
  }, []);

  const handleResolveTicket = async (ticketId: string) => {
    try {
      await db.update<SupportTicket>(COLLECTIONS.SUPPORT_TICKETS, ticketId, {
        status: 'RESOLVED',
      });
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim()) return;

    try {
      const newMessages = [
        ...selectedTicket.messages,
        {
          sender: 'Customer Support Desk',
          role: 'ADMIN',
          message: replyText.trim(),
          timestamp: new Date().toISOString(),
        },
      ];
      await db.update<SupportTicket>(COLLECTIONS.SUPPORT_TICKETS, selectedTicket.id, {
        messages: newMessages,
        status: 'IN_PROGRESS',
      });
      setReplyText('');
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const openTickets = tickets.filter((t) => t.status !== 'RESOLVED');

  return (
    <div className="min-h-screen bg-[#050816] text-[#F8FAFC]">
      {/* Header */}
      <div className="bg-[#080D1F] border-b border-slate-800 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-500 flex items-center justify-center text-white font-bold shadow-lg shadow-violet-600/30">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold font-['Poppins'] text-white">Client & Driver Support Desk</h1>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                HELPDESK
              </span>
            </div>
            <p className="text-xs text-slate-400">Resolve client inquiries, track emergency requests, and handle public contact messages</p>
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
          onClick={() => setActiveTab('tickets')}
          className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'tickets' ? 'border-violet-400 text-violet-300 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Support Tickets ({openTickets.length} open)</span>
        </button>
        <button
          onClick={() => setActiveTab('inquiries')}
          className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'inquiries' ? 'border-violet-400 text-violet-300 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Website Inquiries ({messages.length})</span>
        </button>
      </div>

      {/* Main Area */}
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {activeTab === 'tickets' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Tickets list */}
            <div className="lg:col-span-1 space-y-3">
              <h2 className="text-sm font-bold text-white font-['Poppins']">Open Support Cases</h2>
              {tickets.length === 0 ? (
                <EmptyState
                  icon={<MessageSquare className="w-7 h-7 text-cyan-400" />}
                  title="No Tickets"
                  description="No tickets currently open."
                />
              ) : (
                tickets.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all text-xs ${
                      selectedTicket?.id === t.id
                        ? 'bg-[#0B1329] border-violet-500 shadow-md shadow-violet-900/20'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-white">{t.ticketNumber}</span>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                          t.status === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-blue-500/20 text-cyan-300'
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>
                    <div className="font-semibold text-slate-200 mt-1 truncate">{t.subject}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      From: {t.requesterName} ({t.requesterRole})
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Ticket Conversation Detail */}
            <div className="lg:col-span-2">
              {selectedTicket ? (
                <div className="bg-[#0B1329] border border-slate-800 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white text-base">{selectedTicket.ticketNumber}</span>
                        <span className="text-xs text-violet-400 font-semibold">• {selectedTicket.category}</span>
                      </div>
                      <h3 className="text-lg font-bold text-white mt-0.5">{selectedTicket.subject}</h3>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Requester: {selectedTicket.requesterName} ({selectedTicket.requesterRole}) • Shipment: {selectedTicket.relatedShipmentNumber || 'None'}
                      </div>
                    </div>

                    {selectedTicket.status !== 'RESOLVED' && (
                      <button
                        onClick={() => handleResolveTicket(selectedTicket.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                      >
                        Mark as Resolved
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 leading-relaxed">
                    {selectedTicket.description}
                  </p>

                  {/* Correspondence */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Response Thread</h4>
                    {selectedTicket.messages && selectedTicket.messages.map((m, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl text-xs ${
                          m.role === 'ADMIN'
                            ? 'bg-violet-950/30 border border-violet-800/40 text-slate-200 ml-4'
                            : 'bg-slate-900 border border-slate-800 text-slate-300 mr-4'
                        }`}
                      >
                        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                          <span className="font-bold text-white">{m.sender}</span>
                          <span className="font-mono">{new Date(m.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p>{m.message}</p>
                      </div>
                    ))}
                  </div>

                  {/* Send reply */}
                  <form onSubmit={handleSendReply} className="pt-2 flex gap-2">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type official response to requester..."
                      className="flex-1 px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Reply</span>
                    </button>
                  </form>
                </div>
              ) : (
                <div className="bg-[#0B1329] border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-xs">
                  Select a support ticket from the list to view the full dialogue thread and send an operational response.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Contact Inquiries */}
        {activeTab === 'inquiries' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white font-['Poppins']">Public Contact Submissions</h2>
            {messages.length === 0 ? (
              <EmptyState
                icon={<Mail className="w-7 h-7 text-cyan-400" />}
                title="No Contact Inquiries"
                description="No inquiries submitted from the website contact form."
              />
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {messages.map((m) => (
                  <div key={m.id} className="p-4 rounded-2xl bg-[#0B1329] border border-slate-800 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">{m.subject}</span>
                      <span className="font-mono text-slate-500 text-[10px]">{new Date(m.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="text-cyan-400 font-medium">{m.name} ({m.email} • {m.phone || 'No phone'})</div>
                    <p className="text-slate-300 leading-relaxed pt-1">{m.message}</p>
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
