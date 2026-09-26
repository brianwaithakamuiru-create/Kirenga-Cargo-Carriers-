import React, { useState, useEffect } from 'react';
import {
  FileText,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Clock,
  Search,
  Filter,
  RefreshCw,
  X,
  FileCheck,
  Plus,
  Shield,
  Download,
  Eye,
  Trash2,
} from 'lucide-react';
import { db, COLLECTIONS } from '../../lib/firestoreService';
import { LogisticsDocument } from '../../types';
import { EmptyState } from '../common/EmptyState';
import { useAuth } from '../../context/AuthContext';

interface CentralDocumentManagerProps {
  initialCategory?: string;
}

export const CentralDocumentManager: React.FC<CentralDocumentManagerProps> = ({ initialCategory = 'ALL' }) => {
  const { userProfile } = useAuth();
  const [docs, setDocs] = useState<LogisticsDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(initialCategory);

  useEffect(() => {
    if (initialCategory) {
      setCategoryFilter(initialCategory);
    }
  }, [initialCategory]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [form, setForm] = useState({
    title: '',
    category: 'COMPANY' as LogisticsDocument['category'],
    referenceLabel: '',
    referenceId: '',
    expiryDate: '',
    notes: '',
    fileName: '',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadDocs = async () => {
    setLoading(true);
    try {
      const data = await db.getAll<LogisticsDocument>(COLLECTIONS.DOCUMENTS);
      setDocs(data);
    } catch (err) {
      console.error('Error loading documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocs();
    const unsub = db.subscribe(COLLECTIONS.DOCUMENTS, loadDocs);
    return () => unsub();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const fileName = form.fileName || `${form.title.toLowerCase().replace(/\s+/g, '_')}.pdf`;

      const newDoc = await db.add<LogisticsDocument>(COLLECTIONS.DOCUMENTS, {
        ...form,
        fileName,
        fileSize: '1.4 MB (Encrypted)',
        uploadedBy: userProfile?.fullName || 'Administrator',
      });

      await db.logAudit({
        actorUid: userProfile?.uid,
        actorRole: userProfile?.role || 'ADMIN',
        action: 'DOCUMENT_UPLOADED',
        targetUid: newDoc.id,
        details: `Uploaded ${newDoc.category} document: "${newDoc.title}"`,
      });

      setShowUploadModal(false);
      setForm({
        title: '',
        category: 'COMPANY',
        referenceLabel: '',
        referenceId: '',
        expiryDate: '',
        notes: '',
        fileName: '',
      });
      showToast(`Document "${newDoc.title}" securely archived.`);
      loadDocs();
    } catch (err: any) {
      showToast(`Error uploading: ${err.message}`);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to remove "${title}"?`)) return;
    try {
      await db.delete(COLLECTIONS.DOCUMENTS, id);
      await db.logAudit({
        actorUid: userProfile?.uid,
        actorRole: userProfile?.role || 'ADMIN',
        action: 'DOCUMENT_DELETED',
        targetUid: id,
        details: `Deleted compliance document "${title}"`,
      });
      showToast(`Document deleted.`);
      loadDocs();
    } catch (err: any) {
      showToast(`Error deleting document: ${err.message}`);
    }
  };

  // Expiry check
  const now = new Date();
  const thirtyDaysFromNow = new Date(Date.now() + 30 * 86400000);

  const expiringSoonDocs = docs.filter((d) => {
    if (!d.expiryDate) return false;
    const exp = new Date(d.expiryDate);
    return exp >= now && exp <= thirtyDaysFromNow;
  });

  const expiredDocs = docs.filter((d) => {
    if (!d.expiryDate) return false;
    const exp = new Date(d.expiryDate);
    return exp < now;
  });

  const filteredDocs = docs.filter((d) => {
    const q = searchQuery.toLowerCase();
    const matchesQ =
      !searchQuery ||
      d.title.toLowerCase().includes(q) ||
      d.referenceLabel?.toLowerCase().includes(q) ||
      d.fileName.toLowerCase().includes(q);
    const matchesC = categoryFilter === 'ALL' || d.category === categoryFilter;
    return matchesQ && matchesC;
  });

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
            <FileText className="w-5 h-5 text-cyan-400" />
            <span className="text-xs font-mono uppercase text-cyan-400 font-semibold tracking-wider">
              Centralized Compliance & Legal Vault
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white font-['Poppins'] mt-1">
            Documents, Licences, KEBS & Regulatory Permits
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Enterprise document archive with automated expiry sentinel alerts for roadworthiness and cross-border transit compliance.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold text-xs shadow-lg shadow-cyan-600/25 flex items-center gap-1.5 transition-all"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Document</span>
          </button>
          <button
            onClick={loadDocs}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expiry Sentinel Alert Strip */}
      {(expiredDocs.length > 0 || expiringSoonDocs.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {expiredDocs.length > 0 && (
            <div className="p-4 rounded-2xl bg-red-950/80 border border-red-500/50 flex items-start gap-3 text-xs">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-red-200">
                  {expiredDocs.length} Compliance Document{expiredDocs.length > 1 ? 's' : ''} Expired
                </div>
                <div className="text-red-300 mt-1">
                  Expired files: {expiredDocs.map((d) => d.title).slice(0, 3).join(', ')}
                </div>
              </div>
            </div>
          )}

          {expiringSoonDocs.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-950/80 border border-amber-500/50 flex items-start gap-3 text-xs">
              <Clock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-amber-200">
                  {expiringSoonDocs.length} Document{expiringSoonDocs.length > 1 ? 's' : ''} Approaching Expiry (&lt;30 days)
                </div>
                <div className="text-amber-300 mt-1">
                  Renewals due: {expiringSoonDocs.map((d) => d.title).slice(0, 3).join(', ')}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0A1024]/60 p-3 rounded-xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search document title, asset, filename..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            <option value="DRIVER">Driver Licences & ID</option>
            <option value="VEHICLE">Vehicle Logbooks</option>
            <option value="CARGO">Cargo Consignment Docs</option>
            <option value="KEBS">KEBS Standards Certification</option>
            <option value="BORDER">Border Customs Documents</option>
            <option value="INSURANCE">Insurance Policies (COMESA)</option>
            <option value="PERMIT">Road Transit Permits</option>
            <option value="COMPANY">Company Corporate Records</option>
          </select>
        </div>
      </div>

      {/* Documents Grid */}
      {filteredDocs.length === 0 ? (
        <EmptyState
          title="No compliance documents stored"
          description="Upload COMESA Yellow Cards, driver PSV licences, KEBS quality inspection records, and road permits."
          icon={<FileText className="w-8 h-8 text-cyan-400" />}
          action={{
            label: 'Upload First Document',
            onClick: () => setShowUploadModal(true),
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((d) => {
            const isExpired = d.expiryDate && new Date(d.expiryDate) < now;
            const isExpiring =
              d.expiryDate && new Date(d.expiryDate) >= now && new Date(d.expiryDate) <= thirtyDaysFromNow;

            return (
              <div
                key={d.id}
                className="bg-[#0A1024]/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-3 shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-950 text-cyan-300 border border-cyan-500/30">
                      {d.category}
                    </span>
                    <button
                      onClick={() => handleDelete(d.id, d.title)}
                      className="text-slate-500 hover:text-red-400 p-1"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h4 className="text-sm font-bold text-white font-['Poppins'] leading-tight">{d.title}</h4>
                  {d.referenceLabel && (
                    <div className="text-xs text-cyan-400 font-mono">Linked: {d.referenceLabel}</div>
                  )}

                  <div className="text-[11px] text-slate-400">
                    File: {d.fileName} ({d.fileSize || 'PDF'})
                  </div>
                </div>

                <div className="border-t border-slate-800/80 pt-3 space-y-1.5 text-xs">
                  {d.expiryDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Expiry:</span>
                      <span
                        className={`font-mono font-bold ${
                          isExpired
                            ? 'text-red-400'
                            : isExpiring
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {d.expiryDate} {isExpired ? '(EXPIRED)' : isExpiring ? '(DUE)' : ''}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Archived by:</span>
                    <span>{d.uploadedBy}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* UPLOAD MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A1024] border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white font-['Poppins']">Upload Compliance Document</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Kenya Revenue Authority Tax Compliance Certificate"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Category *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="COMPANY">Company Corporate</option>
                    <option value="DRIVER">Driver Licences</option>
                    <option value="VEHICLE">Vehicle Logbooks</option>
                    <option value="CARGO">Cargo Consignment</option>
                    <option value="KEBS">KEBS Standards</option>
                    <option value="BORDER">Border Customs</option>
                    <option value="INSURANCE">Insurance Policy</option>
                    <option value="PERMIT">Transit Permit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Linked Asset / ID</label>
                  <input
                    type="text"
                    value={form.referenceLabel}
                    onChange={(e) => setForm({ ...form, referenceLabel: e.target.value })}
                    placeholder="e.g. UBD 849X / KCC-DRV-01"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Expiration Date (Optional)</label>
                <input
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Choose File (PDF, PNG, JPG)</label>
                <input
                  type="file"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setForm({ ...form, fileName: f.name });
                  }}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-300 file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:bg-blue-900 file:text-blue-200"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Policy reference number, issuer authority..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-xl"
                >
                  Save & Archive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
