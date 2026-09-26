import React, { useState } from 'react';
import { FileText, CheckCircle2, AlertCircle, Calculator, Send } from 'lucide-react';
import { db, COLLECTIONS } from '../../lib/firestoreService';
import { Quote } from '../../types';
import { CompanyLogo } from '../common/CompanyLogo';
import { useBranding } from '../../context/BrandingContext';

interface QuoteFormProps {
  onSuccess?: () => void;
}

export const QuoteForm: React.FC<QuoteFormProps> = ({ onSuccess }) => {
  const { companyName } = useBranding();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState<Quote | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    origin: 'Mombasa Port, Kenya',
    destination: 'Kampala, Uganda',
    cargoType: 'Containerized (FCL)',
    weightKg: '28000',
    currency: 'USD' as 'USD' | 'KES' | 'UGX',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.customerName.trim() || !formData.customerEmail.trim() || !formData.customerPhone.trim()) {
      return setError('Please fill in your name, email, and phone number.');
    }
    const weight = parseFloat(formData.weightKg);
    if (isNaN(weight) || weight <= 0) {
      return setError('Please specify a valid cargo weight.');
    }

    setLoading(true);
    try {
      const year = new Date().getFullYear();
      const quoteReference = `KCC-QT-${year}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

      // Calculate an initial estimated transport rate based on weight and corridor
      const baseRate = formData.currency === 'USD' ? 2400 : 310000;
      const weightFactor = weight > 20000 ? 1.25 : 1.0;
      const estimatedCost = Math.round(baseRate * weightFactor);

      const quote: Quote = {
        id: `qt_${Date.now()}`,
        quoteReference,
        customerName: formData.customerName.trim(),
        customerEmail: formData.customerEmail.trim(),
        customerPhone: formData.customerPhone.trim(),
        origin: formData.origin.trim(),
        destination: formData.destination.trim(),
        cargoType: formData.cargoType,
        weightKg: weight,
        transportCost: estimatedCost,
        additionalCharges: formData.currency === 'USD' ? 150 : 20000, // transit clearance fee
        taxes: 0,
        total: estimatedCost + (formData.currency === 'USD' ? 150 : 20000),
        currency: formData.currency,
        validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        terms: 'Includes transit insurance, fuel surcharge, and customs documentation coordination.',
        status: 'SENT',
        createdAt: new Date().toISOString(),
      };

      const saved = await db.add<Quote>(COLLECTIONS.QUOTES, quote);

      await db.logActivity({
        action: 'Quotation Requested',
        actor: quote.customerName,
        role: 'CUSTOMER',
        relatedRecordType: 'BOOKING',
        relatedRecordId: saved.id,
        details: `Quote ${quoteReference} created for ${quote.origin} to ${quote.destination}`,
      });

      setSubmitted(saved);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Quote error:', err);
      setError(err.message || 'Failed to submit quote request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto bg-[#0F172A] border border-slate-800 rounded-3xl p-8 text-center shadow-2xl animate-fadeIn">
        <div className="w-14 h-14 rounded-2xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto mb-4">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <span className="text-xs uppercase tracking-widest text-cyan-400 font-semibold">
          Quotation Generated
        </span>
        <h3 className="text-2xl font-bold text-white font-['Poppins'] mt-1 mb-2">
          Freight Estimate Ready
        </h3>
        <p className="text-slate-300 text-sm max-w-md mx-auto mb-6">
          Your quote request has been generated and logged with the commercial desk under reference:
        </p>

        <div className="bg-[#050816] p-5 rounded-2xl border border-slate-800 text-left space-y-2.5 text-xs mb-6">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="text-slate-400">Quote Reference</span>
            <span className="font-mono text-sm font-bold text-cyan-400">{submitted.quoteReference}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Route</span>
            <span className="text-white font-medium">{submitted.origin} → {submitted.destination}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Estimated Total</span>
            <span className="text-emerald-400 font-bold text-sm">
              {submitted.currency} {submitted.total.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1 border-t border-slate-800">
            <span>Valid Until: {submitted.validUntil}</span>
            <span className="text-blue-400">Available in Customer Portal</span>
          </div>
        </div>

        <button
          onClick={() => setSubmitted(null)}
          className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-all"
        >
          Request Another Quote
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-[#0F172A] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-950 flex items-center justify-center text-cyan-400 border border-blue-500/30">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white font-['Poppins']">
              Request an Instant Freight Quotation
            </h3>
            <p className="text-xs text-slate-400">
              Transparent cross-border freight rates from {companyName || 'Kirenga Cargo Carriers'}.
            </p>
          </div>
        </div>
        <CompanyLogo size={34} variant="compact" />
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Company / Name *</label>
            <input
              type="text"
              required
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              placeholder="e.g. Great Lakes Trading"
              className="w-full px-3 py-2 bg-[#050816] border border-slate-700 rounded-xl text-white text-xs focus:border-cyan-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Email Address *</label>
            <input
              type="email"
              required
              value={formData.customerEmail}
              onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
              placeholder="e.g. freight@greatlakes.com"
              className="w-full px-3 py-2 bg-[#050816] border border-slate-700 rounded-xl text-white text-xs focus:border-cyan-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number *</label>
            <input
              type="tel"
              required
              value={formData.customerPhone}
              onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
              placeholder="+254 700 000 000"
              className="w-full px-3 py-2 bg-[#050816] border border-slate-700 rounded-xl text-white text-xs focus:border-cyan-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Preferred Currency</label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value as any })}
              className="w-full px-3 py-2 bg-[#050816] border border-slate-700 rounded-xl text-white text-xs focus:border-cyan-400 focus:outline-none"
            >
              <option value="USD">USD ($)</option>
              <option value="KES">KES (KSh)</option>
              <option value="UGX">UGX (USh)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Pickup Location *</label>
            <input
              type="text"
              required
              value={formData.origin}
              onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
              className="w-full px-3 py-2 bg-[#050816] border border-slate-700 rounded-xl text-white text-xs focus:border-cyan-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Destination *</label>
            <input
              type="text"
              required
              value={formData.destination}
              onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              className="w-full px-3 py-2 bg-[#050816] border border-slate-700 rounded-xl text-white text-xs focus:border-cyan-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Cargo Type</label>
            <select
              value={formData.cargoType}
              onChange={(e) => setFormData({ ...formData, cargoType: e.target.value })}
              className="w-full px-3 py-2 bg-[#050816] border border-slate-700 rounded-xl text-white text-xs focus:border-cyan-400 focus:outline-none"
            >
              <option value="Containerized (FCL)">Containerized (FCL)</option>
              <option value="Loose Cargo / LCL">Loose Cargo / LCL</option>
              <option value="Flatbed Heavy Equipment">Flatbed Heavy Equipment</option>
              <option value="Bulk Commodities">Bulk Commodities</option>
              <option value="Perishables / Reefer">Perishables / Reefer</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Approximate Weight (kg) *</label>
            <input
              type="number"
              required
              value={formData.weightKg}
              onChange={(e) => setFormData({ ...formData, weightKg: e.target.value })}
              className="w-full px-3 py-2 bg-[#050816] border border-slate-700 rounded-xl text-white text-xs focus:border-cyan-400 focus:outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>Generate Commercial Quote</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
