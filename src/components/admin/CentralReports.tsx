import React, { useState, useEffect } from 'react';
import {
  FileText,
  Printer,
  Download,
  Filter,
  Search,
  Calendar,
  RefreshCw,
  Truck,
  Package,
  CheckCircle2,
  Users,
  Wrench,
  Fuel,
  Receipt,
  CreditCard,
  TrendingDown,
  Globe,
  Shield,
} from 'lucide-react';
import { db, COLLECTIONS } from '../../lib/firestoreService';
import { CompanyLogo } from '../common/CompanyLogo';
import { useBranding } from '../../context/BrandingContext';
import {
  Shipment,
  Vehicle,
  Driver,
  MaintenanceRecord,
  FuelRecord,
  OperationalExpense,
  Invoice,
  Payment,
  Client,
  LogisticsRoute,
  LogisticsDocument,
} from '../../types';

export type ReportType =
  | 'shipments'
  | 'deliveries'
  | 'drivers'
  | 'vehicles'
  | 'maintenance'
  | 'fuel'
  | 'expenses'
  | 'invoices'
  | 'payments'
  | 'clients'
  | 'routes'
  | 'compliance';

interface CentralReportsProps {
  initialReport?: ReportType;
}

export const CentralReports: React.FC<CentralReportsProps> = ({ initialReport = 'shipments' }) => {
  const { branding } = useBranding();
  const [selectedReport, setSelectedReport] = useState<ReportType>(initialReport);

  useEffect(() => {
    if (initialReport) {
      setSelectedReport(initialReport);
    }
  }, [initialReport]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [countryFilter, setCountryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Datasets
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>([]);
  const [fuel, setFuel] = useState<FuelRecord[]>([]);
  const [expenses, setExpenses] = useState<OperationalExpense[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [routes, setRoutes] = useState<LogisticsRoute[]>([]);
  const [documents, setDocuments] = useState<LogisticsDocument[]>([]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [s, v, d, m, f, e, i, p, c, r, doc] = await Promise.all([
        db.getAll<Shipment>(COLLECTIONS.SHIPMENTS),
        db.getAll<Vehicle>(COLLECTIONS.VEHICLES),
        db.getAll<Driver>(COLLECTIONS.DRIVERS),
        db.getAll<MaintenanceRecord>(COLLECTIONS.MAINTENANCE),
        db.getAll<FuelRecord>(COLLECTIONS.FUEL_RECORDS),
        db.getAll<OperationalExpense>(COLLECTIONS.OPERATIONAL_EXPENSES),
        db.getAll<Invoice>(COLLECTIONS.INVOICES),
        db.getAll<Payment>(COLLECTIONS.PAYMENTS),
        db.getAll<Client>(COLLECTIONS.CLIENTS),
        db.getAll<LogisticsRoute>(COLLECTIONS.ROUTES),
        db.getAll<LogisticsDocument>(COLLECTIONS.DOCUMENTS),
      ]);
      setShipments(s);
      setVehicles(v);
      setDrivers(d);
      setMaintenance(m);
      setFuel(f);
      setExpenses(e);
      setInvoices(i);
      setPayments(p);
      setClients(c);
      setRoutes(r);
      setDocuments(doc);
    } catch (err) {
      console.error('Error loading report data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-[#0A1024]/80 p-6 rounded-2xl border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <span className="text-xs font-mono uppercase text-cyan-400 font-semibold tracking-wider">
              Central Command Executive Reporting
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white font-['Poppins'] mt-1">
            Operational Ledgers & Printable Audit Statements
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Comprehensive printable operational tables for freight tonnage, fleet maintenance, transit fuel, expenses, and compliance.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold text-xs rounded-xl shadow-lg shadow-cyan-600/25 flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report / Export PDF</span>
          </button>
          <button
            onClick={loadAll}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Report Selector Pills */}
      <div className="bg-[#0A1024]/80 p-3 rounded-2xl border border-slate-800 overflow-x-auto flex items-center gap-2 print:hidden">
        {[
          { key: 'shipments', label: 'Shipments', icon: Package },
          { key: 'deliveries', label: 'Deliveries', icon: CheckCircle2 },
          { key: 'drivers', label: 'Drivers', icon: Users },
          { key: 'vehicles', label: 'Vehicles', icon: Truck },
          { key: 'maintenance', label: 'Maintenance', icon: Wrench },
          { key: 'fuel', label: 'Fuel Ledger', icon: Fuel },
          { key: 'expenses', label: 'Expenses', icon: TrendingDown },
          { key: 'invoices', label: 'Invoices', icon: Receipt },
          { key: 'payments', label: 'Payments', icon: CreditCard },
          { key: 'clients', label: 'Clients', icon: Users },
          { key: 'routes', label: 'Routes', icon: Globe },
          { key: 'compliance', label: 'Compliance', icon: Shield },
        ].map((r) => {
          const Icon = r.icon;
          const isActive = selectedReport === r.key;
          return (
            <button
              key={r.key}
              onClick={() => setSelectedReport(r.key as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{r.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="bg-[#0A1024]/60 p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center gap-3 text-xs print:hidden">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search report records..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-300"
            title="Start Date"
          />
          <span className="text-slate-500">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-300"
            title="End Date"
          />
        </div>

        <select
          value={countryFilter}
          onChange={(e) => setCountryFilter(e.target.value)}
          className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300"
        >
          <option value="ALL">All Countries</option>
          <option value="Kenya">Kenya</option>
          <option value="Uganda">Uganda</option>
          <option value="Tanzania">Tanzania</option>
          <option value="Rwanda">Rwanda</option>
          <option value="DR Congo">DR Congo</option>
        </select>
      </div>

      {/* PRINTABLE REPORT DOCUMENT CONTAINER */}
      <div className="bg-[#0A1024]/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 print:bg-white print:text-black print:border-none print:p-0 print:shadow-none">
        {/* Printable Letterhead */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-5 print:border-slate-300 gap-4">
          <div className="flex items-center gap-4">
            <CompanyLogo size={48} variant="full" />
            <div>
              <p className="text-xs text-slate-400 print:text-slate-600 mt-0.5">
                {branding.tagline || 'East & Central Africa International Freight & Logistics Network'}
              </p>
              <div className="text-[11px] text-slate-500 print:text-slate-700 font-mono mt-1">
                {branding.headquartersAddress || 'Kampala, Uganda | Mombasa & Nairobi, Kenya | Dar es Salaam | Kigali | Goma'}
              </div>
            </div>
          </div>

          <div className="text-right text-xs font-mono">
            <div className="text-cyan-400 print:text-blue-800 font-bold uppercase tracking-wider">
              {selectedReport.toUpperCase()} OPERATIONAL STATEMENT
            </div>
            <div className="text-slate-400 print:text-slate-600 mt-1">
              Generated: {new Date().toISOString().replace('T', ' ').slice(0, 19)}
            </div>
            <div className="text-slate-500 print:text-slate-700 text-[10px]">
              Confidential Central Command Audit Record
            </div>
          </div>
        </div>

        {/* REPORT 1: SHIPMENTS REPORT */}
        {selectedReport === 'shipments' && (
          <div className="overflow-x-auto">
            {shipments.length === 0 ? (
              <div className="py-12 text-center text-slate-400 print:text-slate-600 text-xs">
                No shipment records available in the database.
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 print:bg-slate-100 text-slate-400 print:text-slate-700 font-mono">
                    <th className="p-3">Shipment Ref</th>
                    <th className="p-3">Client</th>
                    <th className="p-3">Corridor Route</th>
                    <th className="p-3">Weight (KG)</th>
                    <th className="p-3">Vehicle</th>
                    <th className="p-3">Driver</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 print:divide-slate-200">
                  {shipments.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-900/30">
                      <td className="p-3 font-mono text-cyan-400 print:text-blue-800 font-semibold">{s.shipmentNumber}</td>
                      <td className="p-3 text-white print:text-black font-medium">{s.customerName}</td>
                      <td className="p-3">{s.originCity} → {s.destinationCity}</td>
                      <td className="p-3 font-mono">{s.weightKg?.toLocaleString()}</td>
                      <td className="p-3 font-mono">{s.assignedVehicleReg || '-'}</td>
                      <td className="p-3">{s.assignedDriverName || '-'}</td>
                      <td className="p-3 font-mono font-bold text-[11px] uppercase">{s.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* REPORT 2: DELIVERIES REPORT */}
        {selectedReport === 'deliveries' && (
          <div className="overflow-x-auto">
            {shipments.filter((s) => s.status === 'DELIVERED').length === 0 ? (
              <div className="py-12 text-center text-slate-400 print:text-slate-600 text-xs">
                No confirmed delivered consignments recorded yet.
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 print:bg-slate-100 text-slate-400 print:text-slate-700 font-mono">
                    <th className="p-3">Shipment Ref</th>
                    <th className="p-3">Client</th>
                    <th className="p-3">Destination</th>
                    <th className="p-3">Delivered At</th>
                    <th className="p-3">Assigned Driver</th>
                    <th className="p-3">Tonnage</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 print:divide-slate-200">
                  {shipments.filter((s) => s.status === 'DELIVERED').map((s) => (
                    <tr key={s.id} className="hover:bg-slate-900/30">
                      <td className="p-3 font-mono text-emerald-400 print:text-emerald-800 font-bold">{s.shipmentNumber}</td>
                      <td className="p-3 text-white print:text-black">{s.customerName}</td>
                      <td className="p-3">{s.destinationCity}, {s.destinationCountry}</td>
                      <td className="p-3 font-mono">{s.actualDelivery || s.updatedAt?.slice(0, 10)}</td>
                      <td className="p-3">{s.assignedDriverName || 'Driver'}</td>
                      <td className="p-3 font-mono">{s.weightKg?.toLocaleString()} KG</td>
                      <td className="p-3 text-emerald-400 print:text-emerald-700 font-mono font-bold">VERIFIED DELIVERED</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* REPORT 3: DRIVERS REPORT */}
        {selectedReport === 'drivers' && (
          <div className="overflow-x-auto">
            {drivers.length === 0 ? (
              <div className="py-12 text-center text-slate-400 print:text-slate-600 text-xs">
                No driver records available.
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 print:bg-slate-100 text-slate-400 print:text-slate-700 font-mono">
                    <th className="p-3">Driver Ref</th>
                    <th className="p-3">Full Name</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">Licence Number</th>
                    <th className="p-3">Assigned Fleet</th>
                    <th className="p-3">Country</th>
                    <th className="p-3">Duty Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 print:divide-slate-200">
                  {drivers.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-900/30">
                      <td className="p-3 font-mono text-cyan-400 print:text-blue-800 font-semibold">{d.driverId || d.id.slice(0, 8)}</td>
                      <td className="p-3 text-white print:text-black font-semibold">{d.fullName}</td>
                      <td className="p-3">{d.phone}</td>
                      <td className="p-3 font-mono">{d.licenseNumber}</td>
                      <td className="p-3 font-mono">{d.assignedVehicleReg || 'Unassigned'}</td>
                      <td className="p-3">{d.country}</td>
                      <td className="p-3 font-mono font-bold uppercase">{d.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* REPORT 4: VEHICLES REPORT */}
        {selectedReport === 'vehicles' && (
          <div className="overflow-x-auto">
            {vehicles.length === 0 ? (
              <div className="py-12 text-center text-slate-400 print:text-slate-600 text-xs">
                No vehicles registered.
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 print:bg-slate-100 text-slate-400 print:text-slate-700 font-mono">
                    <th className="p-3">Registration</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Make / Model</th>
                    <th className="p-3">Capacity (KG)</th>
                    <th className="p-3">Assigned Driver</th>
                    <th className="p-3">Location Hub</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 print:divide-slate-200">
                  {vehicles.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-900/30">
                      <td className="p-3 font-mono text-cyan-400 print:text-blue-800 font-bold">{v.registrationNumber}</td>
                      <td className="p-3">{v.vehicleType}</td>
                      <td className="p-3">{v.make} {v.model}</td>
                      <td className="p-3 font-mono">{v.capacityKg?.toLocaleString()}</td>
                      <td className="p-3">{v.assignedDriverName || 'None'}</td>
                      <td className="p-3">{v.currentLocation || 'Depot'}</td>
                      <td className="p-3 font-mono font-bold uppercase">{v.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* REPORT 5: MAINTENANCE REPORT */}
        {selectedReport === 'maintenance' && (
          <div className="overflow-x-auto">
            {maintenance.length === 0 ? (
              <div className="py-12 text-center text-slate-400 print:text-slate-600 text-xs">
                No maintenance jobs recorded.
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 print:bg-slate-100 text-slate-400 print:text-slate-700 font-mono">
                    <th className="p-3">Job Number</th>
                    <th className="p-3">Vehicle</th>
                    <th className="p-3">Service Type</th>
                    <th className="p-3">Mechanic</th>
                    <th className="p-3">Reported Date</th>
                    <th className="p-3">Cost (USD)</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 print:divide-slate-200">
                  {maintenance.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-900/30">
                      <td className="p-3 font-mono text-amber-400 print:text-amber-800 font-bold">{m.recordNumber}</td>
                      <td className="p-3 font-mono font-bold">{m.vehicleReg}</td>
                      <td className="p-3 text-white print:text-black">{m.serviceType}</td>
                      <td className="p-3">{m.assignedMechanic}</td>
                      <td className="p-3 font-mono">{m.dateReported}</td>
                      <td className="p-3 font-mono font-bold">${m.estimatedCost.toLocaleString()}</td>
                      <td className="p-3 font-mono font-bold uppercase">{m.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* REPORT 6: FUEL REPORT */}
        {selectedReport === 'fuel' && (
          <div className="overflow-x-auto">
            {fuel.length === 0 ? (
              <div className="py-12 text-center text-slate-400 print:text-slate-600 text-xs">
                No transit fuel logs recorded.
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 print:bg-slate-100 text-slate-400 print:text-slate-700 font-mono">
                    <th className="p-3">Receipt Ref</th>
                    <th className="p-3">Vehicle</th>
                    <th className="p-3">Driver</th>
                    <th className="p-3">Station</th>
                    <th className="p-3">Litres</th>
                    <th className="p-3">Rate</th>
                    <th className="p-3">Total Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 print:divide-slate-200">
                  {fuel.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-900/30">
                      <td className="p-3 font-mono text-emerald-400 print:text-emerald-800 font-bold">{f.receiptNumber}</td>
                      <td className="p-3 font-mono font-bold">{f.vehicleReg}</td>
                      <td className="p-3">{f.driverName}</td>
                      <td className="p-3">{f.fuelStation}</td>
                      <td className="p-3 font-mono">{f.litres} L</td>
                      <td className="p-3 font-mono">${f.pricePerLitre}/L</td>
                      <td className="p-3 font-mono font-bold text-emerald-400 print:text-emerald-800">${f.totalCost.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* REPORT 7: EXPENSES REPORT */}
        {selectedReport === 'expenses' && (
          <div className="overflow-x-auto">
            {expenses.length === 0 ? (
              <div className="py-12 text-center text-slate-400 print:text-slate-600 text-xs">
                No expense vouchers recorded.
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 print:bg-slate-100 text-slate-400 print:text-slate-700 font-mono">
                    <th className="p-3">Voucher #</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Linked Asset / Route</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Recorded By</th>
                    <th className="p-3">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 print:divide-slate-200">
                  {expenses.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-900/30">
                      <td className="p-3 font-mono text-amber-400 print:text-amber-800 font-bold">{e.expenseNumber}</td>
                      <td className="p-3 font-semibold text-white print:text-black">{e.category}</td>
                      <td className="p-3">{e.description}</td>
                      <td className="p-3 font-mono text-slate-300 print:text-slate-700">{e.linkedLabel}</td>
                      <td className="p-3 font-mono">{e.date}</td>
                      <td className="p-3">{e.recordedBy}</td>
                      <td className="p-3 font-mono font-bold text-amber-400 print:text-amber-800">${e.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* REPORT 8: INVOICES REPORT */}
        {selectedReport === 'invoices' && (
          <div className="overflow-x-auto">
            {invoices.length === 0 ? (
              <div className="py-12 text-center text-slate-400 print:text-slate-600 text-xs">
                No invoices generated.
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 print:bg-slate-100 text-slate-400 print:text-slate-700 font-mono">
                    <th className="p-3">Invoice #</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Due Date</th>
                    <th className="p-3">Total Amount</th>
                    <th className="p-3">Payment Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 print:divide-slate-200">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-900/30">
                      <td className="p-3 font-mono text-teal-400 print:text-teal-800 font-bold">{inv.invoiceReference}</td>
                      <td className="p-3 text-white print:text-black font-semibold">{inv.customerName}</td>
                      <td className="p-3">{inv.description}</td>
                      <td className="p-3 font-mono">{inv.dueDate}</td>
                      <td className="p-3 font-mono font-bold">${inv.amount?.toLocaleString()}</td>
                      <td className="p-3 font-mono font-bold uppercase">{inv.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* REPORT 9: PAYMENTS REPORT */}
        {selectedReport === 'payments' && (
          <div className="overflow-x-auto">
            {payments.length === 0 ? (
              <div className="py-12 text-center text-slate-400 print:text-slate-600 text-xs">
                No payments recorded.
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 print:bg-slate-100 text-slate-400 print:text-slate-700 font-mono">
                    <th className="p-3">Transaction Ref</th>
                    <th className="p-3">Client</th>
                    <th className="p-3">Invoice Ref</th>
                    <th className="p-3">Payment Method</th>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 print:divide-slate-200">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-900/30">
                      <td className="p-3 font-mono text-emerald-400 print:text-emerald-800 font-bold">{p.transactionReference}</td>
                      <td className="p-3 text-white print:text-black font-semibold">{p.customerName}</td>
                      <td className="p-3 font-mono">{p.invoiceReference || '-'}</td>
                      <td className="p-3">{p.paymentMethod}</td>
                      <td className="p-3 font-mono">{p.timestamp?.slice(0, 16)}</td>
                      <td className="p-3 font-mono font-bold text-emerald-400 print:text-emerald-800">${p.amount?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* REPORT 10: CLIENTS REPORT */}
        {selectedReport === 'clients' && (
          <div className="overflow-x-auto">
            {clients.length === 0 ? (
              <div className="py-12 text-center text-slate-400 print:text-slate-600 text-xs">
                No client accounts registered.
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 print:bg-slate-100 text-slate-400 print:text-slate-700 font-mono">
                    <th className="p-3">Client ID</th>
                    <th className="p-3">Company Name</th>
                    <th className="p-3">Contact Person</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">Country</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 print:divide-slate-200">
                  {clients.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-900/30">
                      <td className="p-3 font-mono text-cyan-400 print:text-blue-800 font-bold">{c.clientReference}</td>
                      <td className="p-3 text-white print:text-black font-bold">{c.companyName}</td>
                      <td className="p-3">{c.fullName}</td>
                      <td className="p-3">{c.email}</td>
                      <td className="p-3 font-mono">{c.phone}</td>
                      <td className="p-3">{c.country}</td>
                      <td className="p-3 font-mono font-bold uppercase">{c.accountStatus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* REPORT 11: ROUTES REPORT */}
        {selectedReport === 'routes' && (
          <div className="overflow-x-auto">
            {routes.length === 0 ? (
              <div className="py-12 text-center text-slate-400 print:text-slate-600 text-xs">
                No transit routes defined.
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 print:bg-slate-100 text-slate-400 print:text-slate-700 font-mono">
                    <th className="p-3">Route Code</th>
                    <th className="p-3">Route Name</th>
                    <th className="p-3">Origin Hub</th>
                    <th className="p-3">Destination Hub</th>
                    <th className="p-3">Distance (KM)</th>
                    <th className="p-3">Transit Days</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 print:divide-slate-200">
                  {routes.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-900/30">
                      <td className="p-3 font-mono text-cyan-400 print:text-blue-800 font-bold">{r.routeCode}</td>
                      <td className="p-3 text-white print:text-black font-semibold">{r.routeName}</td>
                      <td className="p-3">{r.originCity} ({r.originCountry})</td>
                      <td className="p-3">{r.destinationCity} ({r.destinationCountry})</td>
                      <td className="p-3 font-mono font-bold">{r.distanceKm} KM</td>
                      <td className="p-3 font-mono">{r.estimatedTransitDays} Days</td>
                      <td className="p-3 text-emerald-400 print:text-emerald-700 font-mono font-bold">OPERATIONAL</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* REPORT 12: COMPLIANCE REPORT */}
        {selectedReport === 'compliance' && (
          <div className="overflow-x-auto">
            {documents.length === 0 ? (
              <div className="py-12 text-center text-slate-400 print:text-slate-600 text-xs">
                No compliance certificates archived.
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 print:bg-slate-100 text-slate-400 print:text-slate-700 font-mono">
                    <th className="p-3">Document Title</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Linked Asset / ID</th>
                    <th className="p-3">File Name</th>
                    <th className="p-3">Expiry Date</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 print:divide-slate-200">
                  {documents.map((doc) => {
                    const isExp = doc.expiryDate && new Date(doc.expiryDate) < new Date();
                    return (
                      <tr key={doc.id} className="hover:bg-slate-900/30">
                        <td className="p-3 text-white print:text-black font-semibold">{doc.title}</td>
                        <td className="p-3 font-mono text-cyan-400 print:text-blue-800">{doc.category}</td>
                        <td className="p-3 font-mono">{doc.referenceLabel || '-'}</td>
                        <td className="p-3 text-slate-400 print:text-slate-600">{doc.fileName}</td>
                        <td className="p-3 font-mono">{doc.expiryDate || 'Permanent'}</td>
                        <td
                          className={`p-3 font-mono font-bold ${
                            isExp ? 'text-red-400 print:text-red-700' : 'text-emerald-400 print:text-emerald-700'
                          }`}
                        >
                          {isExp ? 'EXPIRED' : 'VALID'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
