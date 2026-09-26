import React, { useState, useEffect } from 'react';
import {
  Warehouse,
  Package,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  X,
  ArrowRight,
  DollarSign,
  MapPin,
  Calendar,
} from 'lucide-react';
import { db, COLLECTIONS } from '../../lib/firestoreService';
import { WarehouseItem } from '../../types';
import { EmptyState } from '../common/EmptyState';
import { useAuth } from '../../context/AuthContext';

interface WarehouseManagementProps {
  initialStatusFilter?: string;
}

export const WarehouseManagement: React.FC<WarehouseManagementProps> = ({ initialStatusFilter = 'ALL' }) => {
  const { userProfile } = useAuth();
  const [items, setItems] = useState<WarehouseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter);

  useEffect(() => {
    if (initialStatusFilter) {
      setStatusFilter(initialStatusFilter);
    }
  }, [initialStatusFilter]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItemForStatus, setSelectedItemForStatus] = useState<WarehouseItem | null>(null);

  // Form state
  const [form, setForm] = useState({
    trackingNumber: '',
    cargoDescription: '',
    cargoOwner: '',
    ownerContact: '',
    storageLocation: 'Mombasa Port Logistics Depot',
    binReference: 'Bay A-14, Shelf 03',
    status: 'RECEIVED' as WarehouseItem['status'],
    weightKg: 4500,
    packagesCount: 12,
    dateReceived: new Date().toISOString().split('T')[0],
    expectedDispatchDate: '',
    storageCharges: 150,
    currency: 'USD',
    notes: '',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await db.getAll<WarehouseItem>(COLLECTIONS.WAREHOUSE);
      setItems(data);
    } catch (err) {
      console.error('Error loading warehouse items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
    const unsub = db.subscribe(COLLECTIONS.WAREHOUSE, loadItems);
    return () => unsub();
  }, []);

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const trackingNumber =
        form.trackingNumber.trim() || `KCC-WH-${Math.floor(10000 + Math.random() * 90000)}`;

      const newItem = await db.add<WarehouseItem>(COLLECTIONS.WAREHOUSE, {
        ...form,
        trackingNumber,
      });

      await db.logAudit({
        actorUid: userProfile?.uid,
        actorRole: userProfile?.role || 'ADMIN',
        action: 'WAREHOUSE_ITEM_LOGGED',
        targetUid: newItem.id,
        details: `Stored cargo ${newItem.trackingNumber} (${newItem.cargoDescription}) in ${newItem.binReference}`,
      });

      setShowAddModal(false);
      setForm({
        trackingNumber: '',
        cargoDescription: '',
        cargoOwner: '',
        ownerContact: '',
        storageLocation: 'Mombasa Port Logistics Depot',
        binReference: 'Bay A-14, Shelf 03',
        status: 'RECEIVED',
        weightKg: 4500,
        packagesCount: 12,
        dateReceived: new Date().toISOString().split('T')[0],
        expectedDispatchDate: '',
        storageCharges: 150,
        currency: 'USD',
        notes: '',
      });
      showToast(`Cargo ${trackingNumber} logged in warehouse.`);
      loadItems();
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
  };

  const handleUpdateStatus = async (newStatus: WarehouseItem['status']) => {
    if (!selectedItemForStatus) return;
    try {
      await db.update<WarehouseItem>(COLLECTIONS.WAREHOUSE, selectedItemForStatus.id, {
        status: newStatus,
        releaseDate: newStatus === 'RELEASED' ? new Date().toISOString().split('T')[0] : undefined,
      });

      await db.logAudit({
        actorUid: userProfile?.uid,
        actorRole: userProfile?.role || 'ADMIN',
        action: 'WAREHOUSE_STATUS_CHANGE',
        targetUid: selectedItemForStatus.id,
        details: `Warehouse item ${selectedItemForStatus.trackingNumber} transitioned to ${newStatus}`,
      });

      setSelectedItemForStatus(null);
      showToast(`Status updated to ${newStatus}`);
      loadItems();
    } catch (err: any) {
      showToast(`Error updating status: ${err.message}`);
    }
  };

  const filteredItems = items.filter((i) => {
    const q = searchQuery.toLowerCase();
    const matchesQ =
      !searchQuery ||
      i.trackingNumber.toLowerCase().includes(q) ||
      i.cargoOwner.toLowerCase().includes(q) ||
      i.cargoDescription.toLowerCase().includes(q) ||
      i.binReference.toLowerCase().includes(q);
    const matchesS = statusFilter === 'ALL' || i.status === statusFilter;
    return matchesQ && matchesS;
  });

  const storedCount = items.filter((i) => i.status === 'STORED' || i.status === 'RECEIVED').length;
  const readyCount = items.filter((i) => i.status === 'READY_FOR_DISPATCH').length;
  const releasedCount = items.filter((i) => i.status === 'RELEASED' || i.status === 'DISPATCHED').length;

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
            <Warehouse className="w-5 h-5 text-cyan-400" />
            <span className="text-xs font-mono uppercase text-cyan-400 font-semibold tracking-wider">
              Consolidated Warehouse & Transit Depots
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white font-['Poppins'] mt-1">
            Incoming, Stored & Released Freight
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Bin/shelf allocations, custody logging, storage charges, and dispatch-ready consolidation across regional yards.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold text-xs shadow-lg shadow-cyan-600/25 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Receive Cargo</span>
          </button>
          <button
            onClick={loadItems}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0A1024]/80 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400">Currently in Storage / Received</div>
          <div className="text-2xl font-bold text-cyan-400 font-mono mt-1">{storedCount} Consignments</div>
          <div className="text-[11px] text-slate-500 mt-1">Stored in bays and secured yards</div>
        </div>

        <div className="bg-[#0A1024]/80 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400">Ready for Corridor Dispatch</div>
          <div className="text-2xl font-bold text-teal-400 font-mono mt-1">{readyCount} Lots</div>
          <div className="text-[11px] text-slate-500 mt-1">Awaiting vehicle loading</div>
        </div>

        <div className="bg-[#0A1024]/80 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400">Dispatched & Released</div>
          <div className="text-2xl font-bold text-white font-mono mt-1">{releasedCount} Consignments</div>
          <div className="text-[11px] text-slate-500 mt-1">Historical released custody</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0A1024]/60 p-3 rounded-xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search tracking, owner, bin shelf, commodity..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="RECEIVED">RECEIVED</option>
            <option value="STORED">STORED</option>
            <option value="READY_FOR_DISPATCH">READY FOR DISPATCH</option>
            <option value="DISPATCHED">DISPATCHED</option>
            <option value="RELEASED">RELEASED</option>
          </select>
        </div>
      </div>

      {/* Items List */}
      {filteredItems.length === 0 ? (
        <EmptyState
          title="No warehouse cargo records found"
          description="Log inbound consolidated goods, container de-stuffing, and secured storage locations."
          icon={<Warehouse className="w-8 h-8 text-cyan-400" />}
          action={{
            label: 'Receive Cargo into Warehouse',
            onClick: () => setShowAddModal(true),
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-[#0A1024]/80 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-mono text-cyan-400 font-bold">{item.trackingNumber}</span>
                  <h4 className="text-sm font-bold text-white font-['Poppins']">{item.cargoDescription}</h4>
                  <div className="text-xs text-slate-300">Owner: {item.cargoOwner}</div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase ${
                    item.status === 'RELEASED' || item.status === 'DISPATCHED'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                      : item.status === 'READY_FOR_DISPATCH'
                      ? 'bg-blue-950 text-blue-300 border border-blue-500/40'
                      : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  {item.status.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="text-xs text-slate-400 space-y-1.5 border-t border-slate-800 pt-3">
                <div className="flex justify-between">
                  <span>Storage Location:</span>
                  <span className="text-white truncate max-w-[180px]">{item.storageLocation}</span>
                </div>
                <div className="flex justify-between">
                  <span>Bin / Shelf:</span>
                  <span className="font-mono text-cyan-300 font-semibold">{item.binReference}</span>
                </div>
                <div className="flex justify-between">
                  <span>Weight & Packages:</span>
                  <span className="text-slate-200">
                    {item.weightKg.toLocaleString()} KG • {item.packagesCount} Packages
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Received Date:</span>
                  <span className="font-mono text-slate-400">{item.dateReceived}</span>
                </div>
                <div className="flex justify-between">
                  <span>Storage Charges:</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {item.currency} {item.storageCharges}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setSelectedItemForStatus(item)}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs text-cyan-400 font-medium"
                >
                  Update Status
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* RECEIVE CARGO MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A1024] border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white font-['Poppins']">Receive Warehouse Cargo</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Tracking Number (Optional)</label>
                  <input
                    type="text"
                    value={form.trackingNumber}
                    onChange={(e) => setForm({ ...form, trackingNumber: e.target.value })}
                    placeholder="Auto-generated if empty"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Cargo Owner / Shipper *</label>
                  <input
                    type="text"
                    required
                    value={form.cargoOwner}
                    onChange={(e) => setForm({ ...form, cargoOwner: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Cargo Description *</label>
                <input
                  type="text"
                  required
                  value={form.cargoDescription}
                  onChange={(e) => setForm({ ...form, cargoDescription: e.target.value })}
                  placeholder="e.g. 12 Pallets Medical Supplies"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Storage Location Hub</label>
                  <input
                    type="text"
                    value={form.storageLocation}
                    onChange={(e) => setForm({ ...form, storageLocation: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Bin / Shelf Reference *</label>
                  <input
                    type="text"
                    required
                    value={form.binReference}
                    onChange={(e) => setForm({ ...form, binReference: e.target.value })}
                    placeholder="e.g. Bay C-02, Tier 4"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Weight (KG) *</label>
                  <input
                    type="number"
                    required
                    value={form.weightKg}
                    onChange={(e) => setForm({ ...form, weightKg: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Packages Count</label>
                  <input
                    type="number"
                    value={form.packagesCount}
                    onChange={(e) => setForm({ ...form, packagesCount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Storage Fee (USD)</label>
                  <input
                    type="number"
                    value={form.storageCharges}
                    onChange={(e) => setForm({ ...form, storageCharges: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-xl"
                >
                  Confirm Cargo Storage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPDATE STATUS MODAL */}
      {selectedItemForStatus && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A1024] border border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white font-['Poppins']">Update Cargo Custody Status</h3>
            <div className="text-xs text-slate-300">
              Cargo: <span className="font-mono text-cyan-400 font-bold">{selectedItemForStatus.trackingNumber}</span>
            </div>

            <div className="space-y-2 pt-2">
              {[
                { s: 'RECEIVED', label: 'RECEIVED (Unloaded at warehouse)' },
                { s: 'STORED', label: 'STORED (Positioned on assigned bin/shelf)' },
                { s: 'READY_FOR_DISPATCH', label: 'READY FOR DISPATCH (Staged at dock)' },
                { s: 'DISPATCHED', label: 'DISPATCHED (Loaded onto outbound vehicle)' },
                { s: 'RELEASED', label: 'RELEASED (Picked up by client / cleared)' },
              ].map((opt) => (
                <button
                  key={opt.s}
                  onClick={() => handleUpdateStatus(opt.s as any)}
                  className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold text-left border transition-all ${
                    selectedItemForStatus.status === opt.s
                      ? 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setSelectedItemForStatus(null)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
