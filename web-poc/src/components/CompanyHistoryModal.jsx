import React, { useEffect, useMemo, useState } from 'react';
import { X, Loader2 } from 'lucide-react';

const ACTIVITY_FIELD_LABELS = {
  company_name: 'Company',
  product_name: 'Produk',
  installation_date: 'Tgl Instalasi',
  replacement_date: 'Target Ganti',
  maintenance_cycle: 'Siklus',
  visit_schedule_date: 'Jadwal Kunjungan',
  followup_date: 'Tgl Follow Up',
  status: 'Status',
  status_active: 'Status Data',
  notes: 'Catatan',
  assigned_to_name: 'PIC Sales'
};

const formatActivityFieldLabel = (key) => ACTIVITY_FIELD_LABELS[key] || key.replace(/_/g, ' ');

const formatActivityFieldValue = (key, value) => {
  if (value === null || value === undefined || value === '') return '-';
  if (key === 'status_active') return String(value) === '1' ? 'Aktif' : 'Non-Aktif';
  return String(value);
};

const parseActivityPayload = (raw) => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return [];
    return Object.entries(parsed).map(([key, value]) => ({
      key,
      label: formatActivityFieldLabel(key),
      value: formatActivityFieldValue(key, value)
    }));
  } catch {
    return [];
  }
};

const getActivityChanges = (oldRaw, newRaw) => {
  const oldVals = parseActivityPayload(oldRaw);
  const newVals = parseActivityPayload(newRaw);
  const allKeys = new Set([...oldVals.map(o => o.key), ...newVals.map(n => n.key)]);
  const changes = [];

  allKeys.forEach(key => {
    const oldV = oldVals.find(o => o.key === key);
    const newV = newVals.find(n => n.key === key);
    const oldValue = oldV ? oldV.value : '-';
    const newValue = newV ? newV.value : '-';

    if (oldValue !== newValue) {
      changes.push({ label: formatActivityFieldLabel(key), old: oldValue, new: newValue });
    }
  });

  return changes;
};

const getLogBadgeClass = (action) => {
  switch (action) {
    case 'RENEW': return 'badge-success';
    case 'CREATE': return 'badge-info';
    case 'EDIT': return 'badge-warning';
    case 'STATUS_CHANGE': return 'badge-danger';
    default: return 'badge-secondary';
  }
};

function Pagination({ totalItems, itemsPerPage, currentPage, onPageChange }) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  if (totalPages <= 1) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '16px', padding: '16px', borderTop: '1px solid var(--border)' }}>
      <button
        className="btn btn-secondary"
        style={{ padding: '8px', borderRadius: '50%' }}
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
      </button>
      <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)' }}>
        Halaman {currentPage} dari {totalPages}
      </span>
      <button
        className="btn btn-secondary"
        style={{ padding: '8px', borderRadius: '50%' }}
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
      </button>
    </div>
  );
}

function CompanyHistoryModalInner({ onClose, company, historyItems }) {
  const [companyLogs, setCompanyLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [modalPage, setModalPage] = useState(1);
  const [modalProductFilter, setModalProductFilter] = useState('');
  const [modalTypeFilter, setModalTypeFilter] = useState('');
  const [modalExpandedDiffs, setModalExpandedDiffs] = useState(new Set());
  const MODAL_LOGS_PER_PAGE = 10;

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    let cancelled = false;
    setLoadingLogs(true);
    fetch(`${import.meta.env.VITE_API_URL}/activity_logs.php?action=list&company_id=${company.id}`)
      .then(r => r.json())
      .then(json => {
        if (!cancelled) setCompanyLogs(json.status === 'success' ? json.data : []);
      })
      .catch(err => {
        console.error('Failed to fetch logs:', err);
        if (!cancelled) setCompanyLogs([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingLogs(false);
      });
    return () => { cancelled = true; };
  }, [company.id]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const matchedIds = useMemo(() => {
    if (!modalProductFilter) return new Set();
    return new Set(
      historyItems
        .filter(i => i.product_name === modalProductFilter)
        .map(i => String(i.id))
    );
  }, [historyItems, modalProductFilter]);

  const modalLogs = useMemo(() => {
    let all = [...companyLogs].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    if (modalProductFilter) {
      all = all.filter(log => matchedIds.has(String(log.installation_id)));
    }
    if (modalTypeFilter) {
      all = all.filter(log => log.action_type === modalTypeFilter);
    }
    return all.slice((modalPage - 1) * MODAL_LOGS_PER_PAGE, modalPage * MODAL_LOGS_PER_PAGE);
  }, [companyLogs, modalPage, modalProductFilter, modalTypeFilter, matchedIds]);

  const toggleModalDiff = (logId) => {
    setModalExpandedDiffs(prev => {
      const next = new Set(prev);
      if (next.has(logId)) next.delete(logId);
      else next.add(logId);
      return next;
    });
  };

  const renderDiff = (oldRaw, newRaw) => {
    const changes = getActivityChanges(oldRaw, newRaw);
    if (!changes.length) return <em style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Tidak ada perubahan field</em>;

    return (
      <table style={{ width: '100%', fontSize: '0.75rem', marginTop: '8px', borderCollapse: 'collapse' }}>
        <thead><tr style={{ background: '#f1f5f9' }}>
          <th style={{ textAlign: 'left', padding: '4px 8px' }}>Field</th>
          <th style={{ textAlign: 'left', padding: '4px 8px' }}>Lama</th>
          <th style={{ textAlign: 'left', padding: '4px 8px' }}>Baru</th>
        </tr></thead>
        <tbody>
          {changes.map((c, idx) => (
            <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '4px 8px', fontWeight: 600 }}>{c.label}</td>
              <td style={{ padding: '4px 8px', color: '#ef4444' }}>{c.old}</td>
              <td style={{ padding: '4px 8px', color: '#22c55e' }}>{c.new}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const formatHistoryLogDate = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString('id-ID');
  };

  const uniqueProductNames = Array.from(
    new Set(historyItems.map(i => i.product_name).filter(Boolean))
  ).sort();

  return (
    <div className="modal-overlay" onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="modal-content" style={{ maxWidth: '1000px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '16px' }}>
          <div>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
              {company.name}
              <span className={`badge ${company.type === 'Customer' ? 'badge-success' : 'badge-warning'}`}>{company.type}</span>
            </h2>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '8px' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: 'middle' }}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              {' '}{company.region || company.region_name || '-'}
            </div>
          </div>
          <button className="btn btn-secondary" onClick={onClose} style={{ padding: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <X size={18} /> Tutup
          </button>
        </div>

        <div className="modal-body" style={{ overflowY: 'auto', flex: 1, paddingRight: '12px' }}>
          {/* Log Aktivitas */}
          <h3 style={{ fontSize: '1rem', marginBottom: '16px', color: '#0369a1' }}>Log Aktivitas</h3>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {uniqueProductNames.length > 0 && (
              <select
                className="form-control"
                style={{ flex: 1, minWidth: '180px' }}
                value={modalProductFilter}
                onChange={e => { setModalProductFilter(e.target.value); setModalPage(1); }}
              >
                <option value="">Semua Produk</option>
                {uniqueProductNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            )}
            <select
              className="form-control"
              style={{ flex: 1, minWidth: '180px' }}
              value={modalTypeFilter}
              onChange={e => { setModalTypeFilter(e.target.value); setModalPage(1); }}
            >
              <option value="">Semua Tipe Log</option>
              {Array.from(new Set(companyLogs.map(l => l.action_type)))
                .filter(Boolean)
                .sort()
                .map(type => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>

          {loadingLogs ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '40px 0', color: 'var(--text-muted)' }}>
              <Loader2 className="animate-spin" size={20} /> Memuat log aktivitas...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {companyLogs.length === 0 ? (
                <em style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Tidak ada log aktivitas untuk perusahaan ini.</em>
              ) : (
                <>
                  {modalLogs.map((log) => (
                    <div key={log.id} style={{ background: '#f8fafc', borderRadius: '8px', padding: '14px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                        <span className={`badge ${getLogBadgeClass(log.action_type)}`}>{log.action_type}</span>
                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{formatHistoryLogDate(log.created_at)}</span>
                      </div>
                      <div style={{ fontSize: '0.9rem', marginBottom: '4px' }}>
                        <strong>Oleh:</strong> {log.user_name || 'System'}
                      </div>
                      {log.description && (
                        <div style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '10px' }}>
                          {log.description}
                        </div>
                      )}
                      {(log.old_values || log.new_values) && (
                        <>
                          <button
                            onClick={() => toggleModalDiff(log.id)}
                            style={{ fontSize: '0.8rem', background: 'none', border: 'none', color: '#0ea5e9', cursor: 'pointer', padding: 0 }}
                          >
                            {modalExpandedDiffs.has(log.id) ? '▲ Sembunyikan Detail Perubahan' : '▼ Lihat Detail Perubahan'}
                          </button>
                          {modalExpandedDiffs.has(log.id) && renderDiff(log.old_values, log.new_values)}
                        </>
                      )}
                    </div>
                  ))}
                  <Pagination
                    totalItems={companyLogs.filter(log =>
                      (!modalProductFilter || matchedIds.has(String(log.installation_id))) &&
                      (!modalTypeFilter || log.action_type === modalTypeFilter)
                    ).length}
                    itemsPerPage={MODAL_LOGS_PER_PAGE}
                    currentPage={modalPage}
                    onPageChange={(page) => {
                      setModalPage(page);
                      setModalExpandedDiffs(new Set());
                    }}
                  />
                </>
              )}
            </div>
          )}
        </div>
        <div className="modal-footer" style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={onClose}>Selesai & Tutup Jendela</button>
        </div>
      </div>
    </div>
  );
}

export default function CompanyHistoryModal({ isOpen, onClose, company, historyItems }) {
  if (!isOpen || !company) return null;
  return (
    <CompanyHistoryModalInner
      key={company.id}
      onClose={onClose}
      company={company}
      historyItems={historyItems}
    />
  );
}
