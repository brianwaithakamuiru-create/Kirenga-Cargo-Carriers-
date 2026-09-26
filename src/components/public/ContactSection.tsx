import React, { useState } from 'react';
import { Phone, Mail, MessageSquare, MapPin, Clock, Send, CheckCircle2, AlertCircle, PackageCheck } from 'lucide-react';
import { db } from '../../lib/firestoreService';

interface ContactSectionProps {
  onNavigate?: (view: string) => void;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ onNavigate }) => {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      return setError('Please fill in your name, email, and message.');
    }

    setLoading(true);
    try {
      await db.submitContactMessage({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        subject: formData.subject.trim() || 'General Cargo Inquiry',
        message: formData.message.trim(),
      });
      setSubmitted(true);
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err: any) {
      console.error('Contact submit error:', err);
      setError('Unable to send message. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-20 md:py-28 bg-[#4A0E18] text-[#F5E6D3] relative overflow-hidden border-t border-[#D4A017]/20">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/4 right-1/3 w-96 h-96 bg-[#5A174F]/25 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-couriers uppercase tracking-[0.25em] text-[#E6C76A] font-semibold mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4A017]" />
              <span>Contact & Booking Desk</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white font-['Montserrat'] tracking-tight">
              Connect With <span className="text-[#D4A017]">KIRENGA Central Command</span>
            </h2>
          </div>
          <p className="text-sm sm:text-base text-[#F5E6D3]/85 max-w-md leading-relaxed font-light">
            Our multi-hub dispatch controllers and commercial logistics managers are available 24/7 across Nairobi, Kampala, Kigali, and Dar es Salaam.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Details Column */}
          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-[#360810] border border-[#D4A017]/25 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-[#4A0E18] border border-[#D4A017]/40 flex items-center justify-center text-[#D4A017]">
                <Phone className="w-5 h-5 text-[#E6C76A]" />
              </div>
              <div className="text-xs">
                <span className="text-[#F5E6D3]/60 block font-medium">24/7 Dispatch Hotline</span>
                <a href="tel:+254700123456" className="text-white font-bold hover:text-[#E6C76A] text-base font-mono">
                  +254 700 123 456
                </a>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#360810] border border-[#D4A017]/25 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-[#4A0E18] border border-[#D4A017]/40 flex items-center justify-center text-[#D4A017]">
                <Mail className="w-5 h-5 text-[#E6C76A]" />
              </div>
              <div className="text-xs">
                <span className="text-[#F5E6D3]/60 block font-medium">Commercial & Corporate Desk</span>
                <a href="mailto:ops@kirengacargo.com" className="text-white font-bold hover:text-[#E6C76A] text-sm font-mono">
                  ops@kirengacargo.com
                </a>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#360810] border border-[#D4A017]/25 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-[#4A0E18] border border-[#D4A017]/40 flex items-center justify-center text-[#C2185B]">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <span className="text-[#F5E6D3]/60 block font-medium">Instant WhatsApp Dispatch</span>
                <a
                  href="https://wa.me/254700000000"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#E6C76A] font-semibold hover:underline text-sm block"
                >
                  Live Route Coordinator Chat
                </a>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#360810] border border-[#D4A017]/25 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-[#4A0E18] border border-[#D4A017]/40 flex items-center justify-center text-[#D4A017]">
                <MapPin className="w-5 h-5 text-[#E6C76A]" />
              </div>
              <div className="text-xs">
                <span className="text-[#F5E6D3]/60 block font-medium">Headquarters & Fleet Terminal</span>
                <span className="text-white font-medium block">
                  KIRENGA Logistics Terminal, Airport North Road, Nairobi, Kenya
                </span>
                <span className="text-[#F5E6D3]/70 block mt-1">
                  Kigali Hub: Free Trade Zone, Masoro · Mombasa Port Liaison: Mbaraki Terminal
                </span>
              </div>
            </div>
          </div>

          {/* Direct Message Form / Booking */}
          <div className="lg:col-span-2 bg-[#360810]/95 border-2 border-[#D4A017]/35 rounded-3xl p-7 sm:p-9 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-white font-['Montserrat']">
                  Direct Dispatch & Consignment Booking
                </h3>
                <p className="text-xs text-[#F5E6D3]/75 mt-0.5 font-light">
                  Submit consignment inquiries directly to our central routing desk.
                </p>
              </div>
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('book')}
                  className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#D4A017] hover:bg-[#E6C76A] text-[#4A0E18] text-xs font-bold uppercase tracking-wider transition-colors shadow-md"
                >
                  <PackageCheck className="w-4 h-4" />
                  <span>Full Booking Portal</span>
                </button>
              )}
            </div>

            {submitted ? (
              <div className="p-10 rounded-2xl bg-[#4A0E18] border border-[#D4A017]/40 text-center">
                <CheckCircle2 className="w-12 h-12 text-[#E6C76A] mx-auto mb-3" />
                <h4 className="text-lg font-bold text-white font-['Montserrat'] mb-1">Message Transmitted</h4>
                <p className="text-xs sm:text-sm text-[#F5E6D3]/85 max-w-sm mx-auto mb-6 font-light">
                  Thank you. A KIRENGA corridor coordinator will contact you promptly at your specified contact info.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="px-6 py-2.5 bg-[#D4A017] hover:bg-[#E6C76A] text-[#4A0E18] rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  Send Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3.5 rounded-xl bg-[#5C0A0A] border border-[#D4A017]/40 text-[#E6C76A] text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-[#D4A017]" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#F5E6D3] mb-1.5">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Samuel Karanja"
                      className="w-full px-4 py-3 bg-[#4A0E18] border border-[#D4A017]/35 rounded-xl text-white text-xs placeholder-[#F5E6D3]/40 focus:border-[#E6C76A] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#F5E6D3] mb-1.5">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. samuel@enterprise.com"
                      className="w-full px-4 py-3 bg-[#4A0E18] border border-[#D4A017]/35 rounded-xl text-white text-xs placeholder-[#F5E6D3]/40 focus:border-[#E6C76A] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#F5E6D3] mb-1.5">Phone / WhatsApp *</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+254 700 000 000"
                      className="w-full px-4 py-3 bg-[#4A0E18] border border-[#D4A017]/35 rounded-xl text-white text-xs placeholder-[#F5E6D3]/40 focus:border-[#E6C76A] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#F5E6D3] mb-1.5">Corridor / Service Route</label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="e.g. Mombasa to Kigali Container Transit"
                      className="w-full px-4 py-3 bg-[#4A0E18] border border-[#D4A017]/35 rounded-xl text-white text-xs placeholder-[#F5E6D3]/40 focus:border-[#E6C76A] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#F5E6D3] mb-1.5">Consignment Details / Message *</label>
                  <textarea
                    rows={4}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Describe cargo category, estimated weight/dimensions, pickup city, and desired delivery date..."
                    className="w-full px-4 py-3 bg-[#4A0E18] border border-[#D4A017]/35 rounded-xl text-white text-xs placeholder-[#F5E6D3]/40 focus:border-[#E6C76A] focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto px-8 py-3.5 bg-[#D4A017] hover:bg-[#E6C76A] text-[#4A0E18] font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-[#D4A017]/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
                  >
                    {loading ? (
                      <span className="inline-block w-4 h-4 border-2 border-[#4A0E18]/30 border-t-[#4A0E18] rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Transmit Consignment Inquiry</span>
                      </>
                    )}
                  </button>

                  {onNavigate && (
                    <button
                      type="button"
                      onClick={() => onNavigate('book')}
                      className="text-xs text-[#E6C76A] hover:underline font-semibold"
                    >
                      Or open dedicated Booking Form →
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
