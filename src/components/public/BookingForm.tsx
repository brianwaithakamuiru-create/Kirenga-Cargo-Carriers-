import React, { useState } from 'react';
import { Truck, Calendar, MapPin, Package, FileUp, CheckCircle, AlertCircle, ArrowRight, Printer } from 'lucide-react';
import { db } from '../../lib/firestoreService';
import { Booking } from '../../types';
import { CompanyLogo } from '../common/CompanyLogo';
import { useBranding } from '../../context/BrandingContext';

interface BookingFormProps {
  onSuccess?: (booking: Booking) => void;
  onNavigate?: (view: string) => void;
}

export const BookingForm: React.FC<BookingFormProps> = ({ onSuccess, onNavigate }) => {
  const { companyName } = useBranding();
  const [loading, setLoading] = useState(false);
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    pickupCountry: 'Kenya',
    pickupLocation: '',
    deliveryCountry: 'Uganda',
    deliveryLocation: '',
    cargoType: 'General Cargo',
    cargoDescription: '',
    weightKg: '',
    quantity: '1',
    dimensions: '',
    pickupDate: new Date().toISOString().split('T')[0],
    deliveryRequirements: 'Standard Transit',
    specialInstructions: '',
    documentName: '',
    documentData: '',
  });

  const countries = [
    'Kenya',
    'Uganda',
    'Tanzania',
    'Rwanda',
    'Democratic Republic of Congo',
    'South Sudan',
  ];

  const cargoTypes = [
    'General Cargo',
    'Commercial Merchandise',
    'Containerized Freight (FCL/LCL)',
    'Heavy Machinery & Industrial Equipment',
    'Agricultural Produce & Food Commodities',
    'Construction Materials & Steel',
    'FMCG & Dry Packaged Goods',
    'Mining Supplies',
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({
        ...prev,
        documentName: file.name,
        documentData: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.fullName.trim()) return setError('Please enter your full name or company name.');
    if (!formData.phone.trim()) return setError('Please enter a contact phone number.');
    if (!formData.email.trim() || !formData.email.includes('@')) return setError('Please enter a valid email address.');
    if (!formData.pickupLocation.trim()) return setError('Please provide the pickup address or warehouse city.');
    if (!formData.deliveryLocation.trim()) return setError('Please provide the destination delivery location.');
    if (!formData.cargoDescription.trim()) return setError('Please provide a description of the cargo.');
    const weight = parseFloat(formData.weightKg);
    if (isNaN(weight) || weight <= 0) return setError('Please enter a valid cargo weight in kilograms.');

    setLoading(true);
    try {
      const saved = await db.createBooking({
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        pickupCountry: formData.pickupCountry,
        pickupLocation: formData.pickupLocation.trim(),
        deliveryCountry: formData.deliveryCountry,
        deliveryLocation: formData.deliveryLocation.trim(),
        cargoType: formData.cargoType,
        cargoDescription: formData.cargoDescription.trim(),
        weightKg: weight,
        quantity: parseInt(formData.quantity, 10) || 1,
        dimensions: formData.dimensions.trim() || undefined,
        pickupDate: formData.pickupDate,
        deliveryRequirements: formData.deliveryRequirements,
        specialInstructions: formData.specialInstructions.trim() || undefined,
        documentName: formData.documentName || undefined,
        documentData: formData.documentData || undefined,
      });

      setCreatedBooking(saved);
      if (onSuccess) onSuccess(saved);
    } catch (err: any) {
      console.error('Booking error:', err);
      setError(err.message || 'Failed to submit booking. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  };

  if (createdBooking) {
    return (
      <div id="booking-receipt" className="max-w-2xl mx-auto bg-[#0A1024]/95 border border-cyan-500/40 rounded-3xl p-8 sm:p-10 text-center shadow-2xl animate-fadeIn text-[#F8FAFC]">
        <style>{`@media print { body * { visibility: hidden !important; } #booking-receipt, #booking-receipt * { visibility: visible !important; } #booking-receipt { position: absolute; inset: 0; width: 100%; max-width: none; color: #111 !important; background: #fff !important; border: 0 !important; box-shadow: none !important; } #booking-receipt .no-print { display: none !important; } }`}</style>
        <div className="w-16 h-16 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 mx-auto mb-4 shadow-lg shadow-cyan-950/50">
          <CheckCircle className="w-8 h-8 text-cyan-400" />
        </div>
        <span className="text-xs uppercase tracking-widest text-cyan-400 font-mono font-bold">
          Booking Request Received
        </span>
        <h3 className="text-2xl sm:text-3xl font-black text-white font-['Montserrat'] mt-1 mb-2">
          Your booking receipt
        </h3>
        <p className="text-slate-300 text-xs sm:text-sm max-w-md mx-auto mb-6 font-light">
          Your booking is recorded with {companyName || 'KIRENGA CARGO CARRIERS'}. Keep this receipt and use its reference with your booking phone number to check progress. A team member will confirm dispatch details.
        </p>

        <div className="bg-[#050816] p-6 rounded-2xl border border-slate-800 text-left mb-6 space-y-3">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <span className="text-xs text-slate-400">Tracking / Booking Reference</span>
            <span className="font-mono text-base font-black text-cyan-400">{createdBooking.bookingReference}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Booked By</span>
            <span className="text-white font-medium">{createdBooking.fullName} · {createdBooking.phone}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Corridor Route</span>
            <span className="text-white font-medium">{createdBooking.pickupCountry} → {createdBooking.deliveryCountry}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Cargo Particulars</span>
            <span className="text-white font-medium">{createdBooking.cargoType} ({createdBooking.weightKg.toLocaleString()} kg)</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Booking Status</span>
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-[11px] font-bold font-mono">RECEIVED · AWAITING REVIEW</span>
          </div>
        </div>

        <div className="no-print flex flex-col sm:flex-row gap-3 justify-center">
          {onNavigate && (
            <button
              onClick={() => onNavigate('track')}
              className="px-6 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <span>Track this Booking</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
          <button type="button" onClick={() => window.print()} className="px-6 py-3 rounded-xl border border-cyan-500/40 text-cyan-200 hover:bg-cyan-950/50 text-sm font-semibold flex items-center justify-center gap-2"><Printer className="w-4 h-4" /> Print / Save receipt</button>
          <button
            onClick={() => {
              setCreatedBooking(null);
              setFormData({
                fullName: '',
                phone: '',
                email: '',
                pickupCountry: 'Kenya',
                pickupLocation: '',
                deliveryCountry: 'Uganda',
                deliveryLocation: '',
                cargoType: 'General Cargo',
                cargoDescription: '',
                weightKg: '',
                quantity: '1',
                dimensions: '',
                pickupDate: new Date().toISOString().split('T')[0],
                deliveryRequirements: 'Standard Transit',
                specialInstructions: '',
                documentName: '',
                documentData: '',
              });
            }}
            className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-all"
          >
            Create Another Booking
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-[#0A1024]/95 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl text-[#F8FAFC]">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-2">
            <Truck className="w-3.5 h-3.5 text-cyan-400" />
            <span>{companyName || 'KIRENGA CARGO CARRIERS'} · Express Dispatch</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white font-['Montserrat']">
            Book Commercial Cargo & Freight Transit
          </h2>
          <p className="text-sm text-slate-300 mt-1 font-light">
            Complete the consignment form below to reserve transport capacity across East Africa.
          </p>
        </div>
        <CompanyLogo size={42} variant="compact" />
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Customer Contact */}
        <div>
          <h3 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-3">
            1. Shipper / Contact Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Full Name / Company Name *</label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="e.g. Apex Minerals Ltd"
                className="w-full px-3.5 py-2.5 bg-[#050816] border border-slate-700 rounded-xl text-white text-sm focus:border-cyan-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Phone Number *</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g. +254 712 345 678"
                className="w-full px-3.5 py-2.5 bg-[#050816] border border-slate-700 rounded-xl text-white text-sm focus:border-cyan-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. logistics@company.com"
                className="w-full px-3.5 py-2.5 bg-[#050816] border border-slate-700 rounded-xl text-white text-sm focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Route Origin & Destination */}
        <div>
          <h3 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-3">
            2. Origin & Destination Route
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-[#050816]/60 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span>Pickup / Loading Point</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Country</label>
                  <select
                    value={formData.pickupCountry}
                    onChange={(e) => setFormData({ ...formData, pickupCountry: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0F172A] border border-slate-700 rounded-lg text-white text-xs"
                  >
                    {countries.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">City / Warehouse Address *</label>
                  <input
                    type="text"
                    required
                    value={formData.pickupLocation}
                    onChange={(e) => setFormData({ ...formData, pickupLocation: e.target.value })}
                    placeholder="e.g. Mombasa Port, Berth 5"
                    className="w-full px-3 py-2 bg-[#0F172A] border border-slate-700 rounded-lg text-white text-xs focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#050816]/60 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>Delivery / Destination Point</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Country</label>
                  <select
                    value={formData.deliveryCountry}
                    onChange={(e) => setFormData({ ...formData, deliveryCountry: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0F172A] border border-slate-700 rounded-lg text-white text-xs"
                  >
                    {countries.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">City / Consignee Address *</label>
                  <input
                    type="text"
                    required
                    value={formData.deliveryLocation}
                    onChange={(e) => setFormData({ ...formData, deliveryLocation: e.target.value })}
                    placeholder="e.g. Kampala Industrial Area"
                    className="w-full px-3 py-2 bg-[#0F172A] border border-slate-700 rounded-lg text-white text-xs focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Cargo Details */}
        <div>
          <h3 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-3">
            3. Cargo Specifications
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Cargo Category</label>
              <select
                value={formData.cargoType}
                onChange={(e) => setFormData({ ...formData, cargoType: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#050816] border border-slate-700 rounded-xl text-white text-xs"
              >
                {cargoTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Estimated Weight (kg) *</label>
              <input
                type="number"
                min="1"
                required
                value={formData.weightKg}
                onChange={(e) => setFormData({ ...formData, weightKg: e.target.value })}
                placeholder="e.g. 24000"
                className="w-full px-3.5 py-2.5 bg-[#050816] border border-slate-700 rounded-xl text-white text-sm focus:border-cyan-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Quantity / Units</label>
              <input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#050816] border border-slate-700 rounded-xl text-white text-sm focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Cargo Description *</label>
              <textarea
                rows={3}
                required
                value={formData.cargoDescription}
                onChange={(e) => setFormData({ ...formData, cargoDescription: e.target.value })}
                placeholder="Describe merchandise, packaging (pallets, sacks, crates, coils), handling requirements..."
                className="w-full px-3.5 py-2 bg-[#050816] border border-slate-700 rounded-xl text-white text-xs focus:border-cyan-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Special Instructions / Dimensions</label>
              <textarea
                rows={3}
                value={formData.specialInstructions}
                onChange={(e) => setFormData({ ...formData, specialInstructions: e.target.value })}
                placeholder="Over-dimensional specifications, customs broker contact, tarpaulin requirements..."
                className="w-full px-3.5 py-2 bg-[#050816] border border-slate-700 rounded-xl text-white text-xs focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Date & Document */}
        <div>
          <h3 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-3">
            4. Scheduling & Documents
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Desired Loading Date *</label>
              <input
                type="date"
                required
                value={formData.pickupDate}
                onChange={(e) => setFormData({ ...formData, pickupDate: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#050816] border border-slate-700 rounded-xl text-white text-sm focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Attach Consignment Note / Invoice (Optional)</label>
              <label className="flex items-center justify-center gap-2 w-full px-3.5 py-2.5 bg-[#050816] border border-dashed border-slate-700 hover:border-cyan-500 rounded-xl text-xs text-slate-400 cursor-pointer transition-colors">
                <FileUp className="w-4 h-4 text-cyan-400" />
                <span className="truncate">{formData.documentName || 'Select PDF or Image'}</span>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Submit button */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-semibold text-sm rounded-xl shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                <Truck className="w-4 h-4" />
                <span>Submit Cargo Booking</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
