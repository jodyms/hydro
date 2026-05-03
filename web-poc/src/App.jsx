import React, { useState, useMemo, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Database, Users, Wrench, MapPin, ClipboardList, Plus, PlusSquare, PlusCircle, Search, Map, X, Cake, Calendar, Filter, Eye, ChevronLeft, ChevronRight, Archive, User, Shield, ShieldCheck, Lock, AlertCircle, CheckCircle2, Loader2, LogOut, Settings, Download, Send, Info, Bell, BarChart3, Clock, MessageSquare } from 'lucide-react';
// --- Constants (no more dataMock.js) ---
let STATUS_OPTIONS = ['Reminder Sent', 'Offering Product', 'Scheduled for Replacement', 'Done', 'Skip', 'Follow up'];
const COMPANY_TYPES = ['Customer', 'Prospek'];
const DASHBOARD_SCHEDULE_FIELDS = [
  { value: 'installation_date', label: 'Tanggal Instalasi', shortLabel: 'Pasang' },
  { value: 'replacement_date', label: 'Tanggal Penggantian Filter', shortLabel: 'Target' },
  { value: 'visit_schedule_date', label: 'Jadwal Kunjungan Sales', shortLabel: 'Visit' },
  { value: 'followup_date', label: 'Tanggal Follow Up', shortLabel: 'Follow Up' }
];
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

const getLocalDateString = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const calculateNextDate = (currentDate, value, unit) => {
  if (!currentDate || !value) return currentDate;
  const parts = currentDate.split('-');
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  const val = parseInt(value);
  const u = (unit || '').toLowerCase();
  if (u === 'days' || u === 'hari') date.setDate(date.getDate() + val);
  else if (u === 'months' || u === 'bulan') date.setMonth(date.getMonth() + val);
  else if (u === 'years' || u === 'tahun') date.setFullYear(date.getFullYear() + val);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getInitialProduct = () => {
  const d = getLocalDateString();
  return { productName: '', installationDate: d, replacementDate: calculateNextDate(d, '1', 'years'), recurringValue: '1', recurringUnit: 'years' };
};

const formatActivityFieldLabel = (key) => ACTIVITY_FIELD_LABELS[key] || key.replace(/_/g, ' ');

const formatActivityFieldValue = (key, value) => {
  if (value === null || value === undefined || value === '') return '-';
  if (key === 'status_active') return String(value) === '1' ? 'Aktif' : 'Non-Aktif';
  return String(value);
};

const parseDateValue = (value) => {
  if (!value || typeof value !== 'string') return null;
  const [year, month, day] = value.split('-').map(Number);
  if ([year, month, day].some(Number.isNaN)) return null;
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getDiffDaysFromToday = (value) => {
  const targetDate = parseDateValue(value);
  if (!targetDate) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.ceil((targetDate - today) / 86400000);
};

const formatDiffDaysLabel = (diffDays) => {
  if (diffDays === null || diffDays === undefined) return '-';
  if (diffDays < 0) return `Terlewat ${Math.abs(diffDays)} hari!`;
  if (diffDays === 0) return 'HARI INI!';
  return `H - ${diffDays}`;
};

const toDateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const formatShortDate = (date) => {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${d}/${m}`;
};

const buildLinePath = (points, valueKey, width, height, padding, maxValue) => {
  if (!points.length || maxValue <= 0) return '';
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  return points.map((point, index) => {
    const x = padding.left + (innerW * (points.length === 1 ? 0 : index / (points.length - 1)));
    const y = padding.top + innerH - ((point[valueKey] || 0) / maxValue) * innerH;
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');
};

const buildAreaPath = (points, valueKey, width, height, padding, maxValue) => {
  if (!points.length || maxValue <= 0) return '';
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const topPoints = points.map((point, index) => {
    const x = padding.left + (innerW * (points.length === 1 ? 0 : index / (points.length - 1)));
    const y = padding.top + innerH - ((point[valueKey] || 0) / maxValue) * innerH;
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  });
  const endX = padding.left + innerW;
  const baseY = padding.top + innerH;
  const startX = padding.left;
  return [...topPoints, `L ${endX} ${baseY}`, `L ${startX} ${baseY}`, 'Z'].join(' ');
};

function ScheduleDateSummary({ item, activeField, includeProduct = false }) {
  if (!item) return <span style={{ color: 'var(--text-muted)' }}>-</span>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '190px' }}>
      {includeProduct && (
        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.85rem' }}>
          {item.product_name || '-'}
        </div>
      )}
      {DASHBOARD_SCHEDULE_FIELDS.map(field => {
        const isActive = field.value === activeField;
        return (
          <div
            key={field.value}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '8px',
              alignItems: 'center',
              fontSize: '0.75rem',
              background: isActive ? '#e0f2fe' : '#f8fafc',
              border: `1px solid ${isActive ? '#bae6fd' : '#e2e8f0'}`,
              borderRadius: '8px',
              padding: '5px 8px'
            }}
          >
            <span style={{ color: isActive ? '#0369a1' : '#64748b', fontWeight: isActive ? 700 : 600 }}>
              {field.shortLabel}
            </span>
            <span style={{ color: '#0f172a', fontWeight: isActive ? 700 : 500, whiteSpace: 'nowrap' }}>
              {item[field.value] || '-'}
            </span>
          </div>
        );
      })}
    </div>
  );
}

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

const csvEscape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

const downloadCsvFile = (fileName, headers, rows) => {
  const content = [headers, ...rows].map(row => row.map(csvEscape).join(',')).join('\n');
  const blob = new Blob([`\ufeff${content}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
import Login from './pages/Login';
import CompanyHistoryModal from './components/CompanyHistoryModal';

// --- Shared Components ---

function Header({ user, setUser }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();
  const currentUser = user || { username: 'Guest', role_name: 'Unknown', email: '', phone: '' };

  const [formData, setFormData] = useState({ id: currentUser.id || '', email: currentUser.email || '', phone: currentUser.phone || '', password: '' });
  const [statusMsg, setStatusMsg] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');
    setUser(null);
    navigate('/login');
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMsg(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth.php?action=update_profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (json.status === 'success') {
        setStatusMsg(json.message);
        localStorage.setItem('auth_user', JSON.stringify(json.user));
        setUser(json.user);
        setTimeout(() => { setModalOpen(false); setStatusMsg(null); }, 1500);
      } else {
        setStatusMsg(json.message);
      }
    } catch (err) {
      setStatusMsg("Gagal menghubungi server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <header className="top-header">
        <div className="search-bar" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
          <img src="/hui-logo.png" alt="Logo" style={{ height: '20px', opacity: 0.8 }} /> <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Hydromart Sales Database</span>
        </div>
        <div className="user-profile" style={{ cursor: 'pointer', position: 'relative' }} onClick={() => setDropdownOpen(!dropdownOpen)}>
          <span className="user-role">{currentUser.role_name}</span>
          <div className="avatar" style={{ background: '#0ea5e9' }}>{currentUser.username.substring(0, 2).toUpperCase()}</div>

          {dropdownOpen && (
            <div style={{ position: 'absolute', top: '45px', right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', zIndex: 50, width: '200px', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: 600, fontSize: '14px', color: '#0f172a' }}>{currentUser.username}</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>{currentUser.email}</div>
              </div>
              <div className="dropdown-item" onClick={() => setModalOpen(true)} style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#334155' }} onMouseOver={e => e.currentTarget.style.background = '#f8fafc'} onMouseOut={e => e.currentTarget.style.background = 'white'}>
                <Settings size={16} /> Pengaturan Profil
              </div>
              <div className="dropdown-item" onClick={handleLogout} style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#dc2626', borderTop: '1px solid #f1f5f9' }} onMouseOver={e => e.currentTarget.style.background = '#fef2f2'} onMouseOut={e => e.currentTarget.style.background = 'white'}>
                <LogOut size={16} /> Keluar (Logout)
              </div>
            </div>
          )}
        </div>
      </header>

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '450px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Pengaturan Profil Akun</h2>
              <button className="close-btn" onClick={() => setModalOpen(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleSaveProfile}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Email Baru</label>
                  <input required className="form-control" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Nomor Telepon</label>
                  <input className="form-control" type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="081234xxx" />
                </div>
                <div className="form-group">
                  <label>Ubah Kata Sandi</label>
                  <input className="form-control" type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="Kosongkan jika tidak ingin diubah" />
                </div>
                {statusMsg && <div style={{ marginTop: '12px', color: '#059669', fontSize: '14px', background: '#ecfdf5', padding: '8px', borderRadius: '4px' }}>{statusMsg}</div>}
              </div>
              <div className="modal-footer">
                <button type="submit" className="btn btn-primary" disabled={isLoading}>{isLoading ? 'Menyimpan...' : 'Simpan Profil'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function Sidebar({ permissions, user }) {
  const location = useLocation();
  const menuItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard_read' },
    { type: 'header', label: 'Sales & Field' },
    { path: '/sales', label: 'Input Instalasi/Offer', icon: PlusSquare, permission: 'sales_read' },
    { path: '/installation', label: 'Data Instalasi', icon: Wrench, permission: 'installation_read' },
    { path: '/prospecting', label: 'Smart Prospecting', icon: MapPin, permission: 'prospecting_read' },
    { path: '/history', label: 'History & Rekam Jejak', icon: Archive, permission: 'history_read' },
    { type: 'header', label: 'Master Data' },
    { path: '/company', label: 'Data Company', icon: Database, permission: 'company_read' },
    { path: '/pic', label: 'Data PIC', icon: Users, permission: 'pic_read' },
    { path: '/master-region', label: 'Master Region', icon: Map },
    { type: 'header', label: 'User Management' },
    { path: '/master-user', label: 'Master User', icon: User, permission: 'user_read' },
    { path: '/master-role', label: 'Master Role', icon: Shield, permission: 'role_read' },
    { path: '/master-team', label: 'Master Team', icon: Users, permission: 'team_read' },
  ];

  const filteredItems = menuItems.filter(item => {
    if (item.type === 'header') return true;
    if (!item.permission) return true;
    return permissions.includes(item.permission) || permissions.includes('all_access');
  });

  return (
    <div className="sidebar">
      <div className="sidebar-header" style={{
        padding: '20px',
        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
        borderBottom: 'none',
        justifyContent: 'center',
        height: '70px'
      }}>
        <img src="/hui-logo.png" alt="HUI Logo" style={{ height: '32px', filter: 'brightness(0) invert(1)' }} />
      </div>
      <nav className="sidebar-nav">
        {filteredItems.map((item, index) => {
          if (item.type === 'header') {
            const nextItems = filteredItems.slice(index + 1);
            const hasContent = nextItems.length > 0 && nextItems[0].type !== 'header';
            if (!hasContent) return null;
            return <div key={index} className="nav-section">{item.label}</div>;
          }
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link key={index} to={item.path} className={`nav-link ${isActive ? 'active' : ''}`}>
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function DataTable({ data, columns, fileName = 'export-data' }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => { setCurrentPage(1); }, [searchTerm, sortField, sortDir]);

  const filtered = useMemo(() => {
    let list = [...data];
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(row => columns.some(col =>
        col.accessor && String(row[col.accessor] || '').toLowerCase().includes(q)
      ));
    }
    if (sortField) {
      list.sort((a, b) => {
        let va = a[sortField] ?? '', vb = b[sortField] ?? '';
        if (typeof va === 'string') va = va.toLowerCase();
        if (typeof vb === 'string') vb = vb.toLowerCase();
        if (va < vb) return sortDir === 'asc' ? -1 : 1;
        if (va > vb) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return list;
  }, [data, searchTerm, sortField, sortDir, columns]);

  const currentData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const exportToCSV = () => {
    const visibleCols = columns.filter(c => c.accessor);
    const headers = visibleCols.map(c => c.header).join(',');
    const rows = filtered.map(row =>
      visibleCols.map(c => `"${String(row[c.accessor] || '').replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}-${getLocalDateString()}.csv`;
    a.click();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input className="form-control" style={{ paddingLeft: '34px' }} placeholder="Cari di tabel..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <button className="btn btn-secondary" onClick={exportToCSV} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Download size={18} /> Export CSV
        </button>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th key={idx}
                  style={{ cursor: col.accessor ? 'pointer' : 'default' }}
                  onClick={() => col.accessor && (sortField === col.accessor ? setSortDir(d => d === 'asc' ? 'desc' : 'asc') : (setSortField(col.accessor), setSortDir('asc')))}>
                  {col.header}
                  {col.accessor && sortField === col.accessor && (sortDir === 'asc' ? ' ▲' : ' ▼')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentData.length === 0 ? (
              <tr><td colSpan={columns.length} style={{ textAlign: 'center', padding: '32px' }}>Data tidak ditemukan</td></tr>
            ) : currentData.map((row, idx) => (
              <tr key={idx}>
                {columns.map((col, cidx) => (
                  <td key={cidx}>{col.render ? col.render(row) : row[col.accessor]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination totalItems={filtered.length} itemsPerPage={itemsPerPage} currentPage={currentPage} onPageChange={setCurrentPage} />
    </div>
  );
}

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
        <ChevronLeft size={18} />
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
        <ChevronRight size={18} />
      </button>
    </div>
  );
}

function CompanyProductsModal({ company, title, items, onClose, renderAction, showWorkOrderFields = false, updateStatus, updateDate, updateNotes, onBulkRenew, scheduleDateField = 'replacement_date', scheduleDateLabel = 'Target Ganti/Offer', showDateSummary = false }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const MODAL_ITEMS_PER_PAGE = 5;

  if (!company) return null;

  const currentItems = items.slice((currentPage - 1) * MODAL_ITEMS_PER_PAGE, currentPage * MODAL_ITEMS_PER_PAGE);

  const toggleSelectAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map(i => i.id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const getBadgeClass = (status) => {
    switch (status) {
      case 'Done': return 'badge-success';
      case 'Reminder Sent': return 'badge-info';
      case 'Offering Product': return 'badge-info';
      case 'Scheduled for Replacement': return 'badge-warning';
      case 'Skip': return 'badge-danger';
      default: return 'badge-warning';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="modal-content" style={{ maxWidth: '1200px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '16px' }}>
          <div>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
              {company.name}
              <span className={`badge ${company.type === 'Customer' ? 'badge-success' : 'badge-warning'}`}>{company.type}</span>
            </h2>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '8px' }}>
              <MapPin size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> {company.address} ({company.region})
            </div>
          </div>
          <button className="btn btn-secondary" onClick={onClose} style={{ padding: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <X size={18} /> Tutup
          </button>
        </div>
        <div className="modal-body" style={{ overflowY: 'auto', flex: 1, paddingRight: '12px' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '16px', color: '#0369a1' }}>{title} ({items.length} Item)</h3>
          <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '8px' }}>
            <table className="data-table">
              <thead>
                <tr>
                  {onBulkRenew && (
                    <th style={{ width: '40px' }}>
                      <input type="checkbox" checked={items.length > 0 && selectedIds.length === items.length} onChange={toggleSelectAll} />
                    </th>
                  )}
                  <th>Nama Produk</th>
                  <th>Tgl Pasang</th>
                  <th>{scheduleDateLabel}</th>
                  <th>Status Transaksi</th>
                  {showWorkOrderFields && <th>Update Status</th>}
                  {showWorkOrderFields && <th>Follow Up Note</th>}
                  {renderAction && <th>Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {currentItems.map(item => {
                  const isSelected = selectedIds.includes(item.id);
                  const scheduleDateValue = item[scheduleDateField] || '';
                  const diffDays = getDiffDaysFromToday(scheduleDateValue);
                  return (
                    <tr key={item.id} style={isSelected ? { backgroundColor: '#f0f9ff' } : {}}>
                      {onBulkRenew && (
                        <td>
                          <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(item.id)} />
                        </td>
                      )}
                      <td style={{ fontWeight: 600 }}>{item.product_name}</td>
                      <td style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{item.installation_date || '-'}</td>
                      {showWorkOrderFields ? (
                        <td>
                          <input type="date" className="form-control" style={{ padding: '6px', width: '130px', borderColor: item.status === 'Follow up' ? '#0ea5e9' : 'var(--border)' }} value={item.replacement_date} onChange={(e) => updateDate(item.id, e.target.value)} title="Ubah jadwal jika diundur" />
                          <div style={{ marginTop: '4px', fontSize: '0.75rem', color: diffDays !== null && diffDays <= 7 ? '#ef4444' : '#64748b', fontWeight: 'bold' }}>
                            {formatDiffDaysLabel(diffDays)}
                          </div>
                        </td>
                      ) : (
                        <td>
                          <div>{scheduleDateValue || '-'}</div>
                          <div style={{ fontSize: '0.75rem', color: diffDays !== null && diffDays <= 7 ? '#ef4444' : '#64748b', fontWeight: 'bold' }}>
                            {formatDiffDaysLabel(diffDays)}
                          </div>
                          {showDateSummary && (
                            <div style={{ marginTop: '8px' }}>
                              <ScheduleDateSummary item={item} activeField={scheduleDateField} />
                            </div>
                          )}
                        </td>
                      )}

                      {showWorkOrderFields ? (
                        <td>
                          <div style={{ marginBottom: '8px' }}><span className={`badge ${getBadgeClass(item.status)}`}>{item.status}</span></div>
                        </td>
                      ) : (
                        <td><span className={`badge ${getBadgeClass(item.status)}`}>{item.status}</span></td>
                      )}

                      {showWorkOrderFields && (
                        <td style={{ width: '160px' }}>
                          <select className="form-control" style={{ width: '100%', padding: '6px', fontSize: '0.75rem' }} value={item.status} onChange={(e) => updateStatus(item.id, e.target.value)}>
                            {STATUS_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}
                          </select>
                        </td>
                      )}

                      {showWorkOrderFields && (
                        <td>
                          <textarea
                            className="form-control"
                            style={{ width: '200px', height: '60px', padding: '6px', resize: 'vertical', fontSize: '0.75rem' }}
                            value={item.notes || ''}
                            placeholder="Catatan..."
                            onChange={(e) => updateNotes(item.id, e.target.value)}
                            onBlur={(e) => updateNotes(item.id, e.target.value)}
                          />
                        </td>
                      )}

                      {renderAction && <td>{renderAction(item)}</td>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {items.length > MODAL_ITEMS_PER_PAGE && (
            <Pagination totalItems={items.length} itemsPerPage={MODAL_ITEMS_PER_PAGE} currentPage={currentPage} onPageChange={setCurrentPage} />
          )}
        </div>
        <div className="modal-footer" style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          {onBulkRenew && (
            <button
              className="btn btn-primary"
              style={{ background: selectedIds.length > 0 ? '#10b981' : '#94a3b8', cursor: selectedIds.length > 0 ? 'pointer' : 'not-allowed' }}
              onClick={() => selectedIds.length > 0 && onBulkRenew(selectedIds)}
              disabled={selectedIds.length === 0}
            >
              🔄 Perpanjang Item Terpilih ({selectedIds.length})
            </button>
          )}
          <button className="btn btn-primary" onClick={onClose}>Selesai & Tutup Jendela</button>
        </div>
      </div>
    </div>
  );
}

// --- Transfer Modal (Shared by InstallationPage & WorkOrderPage) ---
function TransferModal({ isOpen, onClose, companyId, companyName, fromUserId, fromUserName, currentUser, onTransferDone, installationId }) {
  const [allUsers, setAllUsers] = useState([]);
  const [toUserId, setToUserId] = useState('');
  const [reason, setReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const [affectedCount, setAffectedCount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setToUserId('');
      setReason('');
      setStatusMsg(null);
      // Fetch all active users for the picker
      fetch(`${import.meta.env.VITE_API_URL}/users.php?user_id=${currentUser?.id || ''}&show_all=true`)
        .then(r => r.json())
        .then(j => { if (j.status === 'success') setAllUsers(j.data.filter(u => u.status === 'active')); })
        .catch(console.error);

      if (installationId) {
        setAffectedCount(1);
      } else {
        // Count affected installations - Sync with user permissions to avoid 16 vs 7 discrepancy
        const showAll = currentUser?.permissions?.includes('workorder_showall') || currentUser?.role_name === 'Super Admin';
        fetch(`${import.meta.env.VITE_API_URL}/installations.php?action=list&user_id=${currentUser?.id || ''}&show_all=${showAll}`)
          .then(r => r.json())
          .then(j => {
            if (j.status === 'success') {
              const count = j.data.filter(i =>
                String(i.company_id) === String(companyId) &&
                (!fromUserId || String(i.assigned_to) === String(fromUserId)) &&
                (!i.is_history && Number(i.is_history) !== 1)
              ).length;
              setAffectedCount(count);
            }
          })
          .catch(console.error);
      }
    }
  }, [isOpen, companyId, fromUserId, installationId, currentUser]);

  if (!isOpen) return null;

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!toUserId) return;
    setIsSaving(true);
    setStatusMsg(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/installations.php?action=transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: companyId,
          installation_id: installationId || null,
          from_user_id: fromUserId || null,
          to_user_id: toUserId,
          reason: reason,
          user_id: currentUser.id
        })
      });
      const d = await res.json();
      if (d.status === 'success') {
        setStatusMsg(`✅ ${d.message}`);
        setTimeout(() => { onTransferDone(); onClose(); }, 1500);
      } else {
        setStatusMsg(`❌ ${d.message}`);
      }
    } catch (e) {
      setStatusMsg('❌ Gagal menghubungi server.');
      console.error(e);
    } finally { setIsSaving(false); }
  };

  const selectedUser = allUsers.find(u => String(u.id) === String(toUserId));

  return (
    <div className="modal-overlay" onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="modal-content" style={{ maxWidth: '520px', width: '100%' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
          <div>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>🔄 Transfer {installationId ? 'Produk' : 'Instalasi'}</h2>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>{installationId ? 'Pindahkan data produk terpilih ke user lain' : 'Pindahkan semua data instalasi per company'}</div>
          </div>
          <button className="close-btn" onClick={onClose}><X size={24} /></button>
        </div>
        <form onSubmit={handleTransfer}>
          <div className="modal-body">
            {/* Transfer Info */}
            <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <AlertCircle size={18} color="#92400e" />
                <span style={{ fontWeight: 700, color: '#92400e', fontSize: '0.85rem' }}>Perhatian</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#78350f' }}>
                {installationId ? (
                  <>Produk terpilih untuk company <strong>{companyName}</strong> akan dipindahkan.</>
                ) : (
                  <>Semua instalasi untuk company <strong>{companyName}</strong> yang di-assign ke <strong>{fromUserName || 'Semua User'}</strong> akan dipindahkan. Total: <strong>{affectedCount} record</strong> aktif.</>
                )}
              </div>
            </div>

            {/* From */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 30px 1fr', gap: '8px', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ background: '#fee2e2', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: '#991b1b', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>Dari</div>
                <div style={{ fontWeight: 600, color: '#dc2626', fontSize: '0.9rem' }}>{fromUserName || '-'}</div>
              </div>
              <div style={{ textAlign: 'center', fontSize: '1.2rem' }}>➡</div>
              <div style={{ background: '#dcfce7', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: '#166534', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>Ke</div>
                <div style={{ fontWeight: 600, color: '#16a34a', fontSize: '0.9rem' }}>{selectedUser?.username || '(Pilih user)'}</div>
              </div>
            </div>

            {/* To User Picker */}
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Pilih User Tujuan <span style={{ color: '#ef4444' }}>*</span></label>
              <select required className="form-control" value={toUserId} onChange={e => setToUserId(e.target.value)}>
                <option value="">-- Pilih Sales / User --</option>
                {allUsers.filter(u => String(u.id) !== String(fromUserId)).map(u => (
                  <option key={u.id} value={u.id}>{u.username} ({u.role_name})</option>
                ))}
              </select>
            </div>

            {/* Reason */}
            <div className="form-group">
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Alasan Transfer (Opsional)</label>
              <textarea className="form-control" style={{ height: '70px', resize: 'vertical' }} value={reason} onChange={e => setReason(e.target.value)} placeholder="Mis: Mutasi area, resign, rotasi tim..." />
            </div>

            {statusMsg && (
              <div style={{ marginTop: '14px', padding: '10px', borderRadius: '8px', background: statusMsg.startsWith('✅') ? '#ecfdf5' : '#fef2f2', color: statusMsg.startsWith('✅') ? '#059669' : '#dc2626', fontSize: '0.85rem', fontWeight: 500, border: `1px solid ${statusMsg.startsWith('✅') ? '#86efac' : '#fecaca'}` }}>
                {statusMsg}
              </div>
            )}
          </div>
          <div className="modal-footer" style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={isSaving || !toUserId} style={{ background: '#f59e0b', minWidth: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              {isSaving ? <><Loader2 size={16} className="spin" /> Memproses...</> : '🔄 Transfer Sekarang'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Pages ---
const ITEMS_PER_PAGE = 5;

function Dashboard({ companies, regions, installations, pics, systemNotice, setSystemNotice, can }) {
  const [search, setSearch] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterDays, setFilterDays] = useState('90');
  const [scheduleField, setScheduleField] = useState('installation_date');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedCompanies, setExpandedCompanies] = useState({});
  const [filterMonth, setFilterMonth] = useState('');

  const selectedScheduleOption = DASHBOARD_SCHEDULE_FIELDS.find(option => option.value === scheduleField) || DASHBOARD_SCHEDULE_FIELDS[0];

  const dashboardBaseItems = useMemo(() => {
    return installations.map(inst => {
      const comp = companies.find(c => Number(c.id) === Number(inst.company_id));
      const scheduleDate = inst[scheduleField];
      const diffDays = getDiffDaysFromToday(scheduleDate);
      return { ...inst, comp, scheduleDate, diffDays };
    }).filter(i => {
      if (!i.comp) return false;
      if (i.is_history) return false;
      if (!i.scheduleDate || i.diffDays === null) return false;
      if (filterRegion && i.comp.region_name !== filterRegion) return false;
      if (filterType && i.comp.type !== filterType) return false;
      const keyword = search.toLowerCase();
      if (search && !(String(i.comp.name || '').toLowerCase().includes(keyword) || String(i.product_name || '').toLowerCase().includes(keyword))) return false;
      return true;
    });
  }, [installations, companies, search, filterRegion, filterType, scheduleField]);

  const groupedUpcoming = useMemo(() => {
    const list = dashboardBaseItems.filter(i => {
      if (i.status === 'Done') return false;
      if (filterDays !== 'all' && i.diffDays > parseInt(filterDays, 10)) return false;
      return true;
    });

    const groups = {};
    list.forEach(i => {
      if (!groups[i.company_id]) {
        groups[i.company_id] = { company: i.comp, items: [], minDiffDays: i.diffDays };
      }
      groups[i.company_id].items.push(i);
      if (i.diffDays < groups[i.company_id].minDiffDays) groups[i.company_id].minDiffDays = i.diffDays;
    });

    return Object.values(groups)
      .map(group => ({ ...group, items: group.items.sort((a, b) => a.diffDays - b.diffDays) }))
      .sort((a, b) => a.minDiffDays - b.minDiffDays);
  }, [dashboardBaseItems, filterDays]);

  const trendWindowDays = useMemo(() => {
    if (filterDays === 'all') return 30;
    const parsed = parseInt(filterDays, 10);
    if (Number.isNaN(parsed)) return 30;
    return Math.max(14, parsed);
  }, [filterDays]);

  const trendSeries = useMemo(() => {
    const pastDays = 6;
    const todayRaw = new Date();
    const today = new Date(todayRaw.getFullYear(), todayRaw.getMonth(), todayRaw.getDate());
    const start = new Date(today);
    start.setDate(start.getDate() - pastDays);
    const totalSpan = pastDays + trendWindowDays + 1;
    const buckets = {};

    dashboardBaseItems.forEach(item => {
      const date = parseDateValue(item.scheduleDate);
      if (!date) return;
      const key = toDateKey(date);
      if (!buckets[key]) buckets[key] = { open: 0, done: 0, total: 0 };
      buckets[key].total += 1;
      if (item.status === 'Done') buckets[key].done += 1;
      else buckets[key].open += 1;
    });

    const points = [];
    for (let i = 0; i < totalSpan; i += 1) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const key = toDateKey(date);
      const bucket = buckets[key] || { open: 0, done: 0, total: 0 };
      points.push({
        key,
        label: formatShortDate(date),
        open: bucket.open,
        done: bucket.done,
        total: bucket.total,
        isToday: key === toDateKey(today)
      });
    }

    const maxValue = Math.max(1, ...points.map(point => Math.max(point.open, point.done, point.total)));
    return { points, maxValue, pastDays, futureDays: trendWindowDays };
  }, [dashboardBaseItems, trendWindowDays]);

  const workloadByRegion = useMemo(() => {
    const map = {};
    const companySets = {};
    dashboardBaseItems.forEach(item => {
      // Filter by selected month if any
      if (filterMonth) {
        const dateValue = item[scheduleField];
        if (!dateValue || !dateValue.startsWith(filterMonth)) return;
      }

      const region = item.comp?.region_name || '-';
      if (!map[region]) {
        map[region] = { region, totalProducts: 0, totalCustomers: 0 };
        companySets[region] = new Set();
      }
      map[region].totalProducts += 1;
      companySets[region].add(item.company_id);
    });

    const rows = Object.keys(map).map(region => ({
      ...map[region],
      totalCustomers: companySets[region].size
    })).sort((a, b) => b.totalProducts - a.totalProducts);

    const maxProducts = Math.max(1, ...rows.map(row => row.totalProducts));
    return { rows, maxProducts };
  }, [dashboardBaseItems, filterMonth, scheduleField]);

  const availableMonths = useMemo(() => {
    const months = new Set();
    dashboardBaseItems.forEach(item => {
      const dateValue = item[scheduleField];
      if (dateValue && typeof dateValue === 'string' && dateValue.length >= 7) {
        months.add(dateValue.slice(0, 7)); // YYYY-MM
      }
    });
    return Array.from(months).sort();
  }, [dashboardBaseItems, scheduleField]);

  if (!can('dashboard_read')) return <div className="page-container"><h1 className="page-title">⛔ Akses Ditolak</h1><p>Anda tidak memiliki otoritas <code>dashboard_read</code> untuk melihat ringkasan ini.</p></div>;

  const totalPages = Math.max(1, Math.ceil(groupedUpcoming.length / ITEMS_PER_PAGE));
  const visiblePage = Math.min(currentPage, totalPages);
  const currentData = groupedUpcoming.slice((visiblePage - 1) * ITEMS_PER_PAGE, visiblePage * ITEMS_PER_PAGE);

  const toggleExpandCompany = (companyId) => {
    setExpandedCompanies(prev => ({ ...prev, [companyId]: !prev[companyId] }));
  };

  const currentMonth = new Date().getMonth() + 1;
  const birthdaysThisMonth = pics.filter(p => {
    if (!p.dob) return false;
    const [, month] = p.dob.split('-');
    return parseInt(month, 10) === currentMonth;
  });

  const trendChartWidth = 760;
  const trendChartHeight = 220;
  const trendChartPadding = { top: 16, right: 16, bottom: 28, left: 28 };
  const trendAreaPath = buildAreaPath(trendSeries.points, 'total', trendChartWidth, trendChartHeight, trendChartPadding, trendSeries.maxValue);
  const trendTotalPath = buildLinePath(trendSeries.points, 'total', trendChartWidth, trendChartHeight, trendChartPadding, trendSeries.maxValue);
  const trendOpenPath = buildLinePath(trendSeries.points, 'open', trendChartWidth, trendChartHeight, trendChartPadding, trendSeries.maxValue);
  const trendDonePath = buildLinePath(trendSeries.points, 'done', trendChartWidth, trendChartHeight, trendChartPadding, trendSeries.maxValue);
  const trendTickStep = Math.max(1, Math.floor(trendSeries.points.length / 6));

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title" style={{ margin: 0, fontSize: '2rem', fontWeight: 800, background: 'linear-gradient(to right, #0f172a, #334155)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Dashboard Analytics</h1>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>Selamat datang kembali! Berikut ringkasan performa hari ini.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', background: 'white', padding: '6px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <button className={`btn ${filterDays === '30' ? 'btn-primary' : ''}`} style={filterDays === '30' ? { padding: '8px 16px', fontSize: '0.8rem' } : { background: 'transparent', color: '#64748b', boxShadow: 'none', padding: '8px 16px', fontSize: '0.8rem' }} onClick={() => setFilterDays('30')}>30 Hari</button>
          <button className={`btn ${filterDays === '90' ? 'btn-primary' : ''}`} style={filterDays === '90' ? { padding: '8px 16px', fontSize: '0.8rem' } : { background: 'transparent', color: '#64748b', boxShadow: 'none', padding: '8px 16px', fontSize: '0.8rem' }} onClick={() => setFilterDays('90')}>3 Bulan</button>
        </div>
      </div>

      {systemNotice && (
        <div style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', border: '1px solid #fde68a', color: '#92400e', padding: '16px 20px', borderRadius: '16px', marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 15px -3px rgba(251, 191, 36, 0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ background: '#fef3c7', padding: '8px', borderRadius: '10px' }}><Bell size={20} className="shake" /></div>
            <span><strong>Notifikasi:</strong> {systemNotice}</span>
          </div>
          <button onClick={() => setSystemNotice(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#92400e', padding: '8px' }}>
            <X size={20} />
          </button>
        </div>
      )}

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div className="stat-card" style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid #e2e8f0', display: 'flex', gap: '16px', alignItems: 'center', transition: 'all 0.3s ease', cursor: 'default' }}>
          <div style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', color: '#2563eb', padding: '16px', borderRadius: '16px' }}><Database size={28} /></div>
          <div>
            <h3 style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Customers</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>{companies.filter(c => Number(c.status_active) === 1 && c.type === 'Customer').length}</p>
          </div>
        </div>
        <div className="stat-card" style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid #e2e8f0', display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)', color: '#ea580c', padding: '16px', borderRadius: '16px' }}><Users size={28} /></div>
          <div>
            <h3 style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Prospects</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>{companies.filter(c => Number(c.status_active) === 1 && c.type === 'Prospek').length}</p>
          </div>
        </div>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)', borderRadius: '20px', padding: '24px', border: 'none', display: 'flex', gap: '16px', alignItems: 'center', color: 'white' }}>
          <div style={{ background: 'rgba(255,255,255,0.2)', color: 'white', padding: '16px', borderRadius: '16px' }}><AlertCircle size={28} /></div>
          <div>
            <h3 style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Action Needed</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '1.75rem', fontWeight: 800 }}>{groupedUpcoming.length}</p>
          </div>
        </div>
        <div className="stat-card" style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid #e2e8f0', display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ background: 'linear-gradient(135deg, #fdf4ff 0%, #fae8ff 100%)', color: '#c026d3', padding: '16px', borderRadius: '16px' }}><Cake size={28} /></div>
          <div>
            <h3 style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>PIC Birthdays</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>{birthdaysThisMonth.length}</p>
          </div>
        </div>
      </div>

      <div className="card-view" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="card-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <Calendar size={24} color="#0ea5e9" /> Reminder Hari Ini (H - X)
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0369a1', background: '#e0f2fe', padding: '4px 10px', borderRadius: '999px', border: '1px solid #bae6fd' }}>
                Berdasarkan: {selectedScheduleOption.label}
              </span>
            </h2>
          </div>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', width: '100%', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Filter size={18} color="var(--text-muted)" />
              <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Advanced Filters:</span>
            </div>
            <input type="text" placeholder="Search Klien..." className="form-control" style={{ width: '200px' }} value={search} onChange={e => setSearch(e.target.value)} />
            <select className="form-control" value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="">Semua Tipe (Customer & Prospek)</option>
              {COMPANY_TYPES.map(opt => <option key={opt}>{opt}</option>)}
            </select>
            <select className="form-control" value={filterRegion} onChange={e => setFilterRegion(e.target.value)}>
              <option value="">Semua Wilayah</option>
              {regions.map(r => <option key={r.id} value={r.region_name}>{r.region_name}</option>)}
            </select>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f0f9ff', padding: '0 12px', borderRadius: '4px', border: '1px solid #bae6fd' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0369a1' }}>Berdasarkan:</span>
              <select className="form-control" style={{ border: 'none', background: 'transparent', width: '170px', cursor: 'pointer' }} value={scheduleField} onChange={e => setScheduleField(e.target.value)}>
                {DASHBOARD_SCHEDULE_FIELDS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f0f9ff', padding: '0 12px', borderRadius: '4px', border: '1px solid #bae6fd' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0369a1' }}>Urutan Jadwal:</span>
              <select className="form-control" style={{ border: 'none', background: 'transparent', width: '150px', cursor: 'pointer' }} value={filterDays} onChange={e => setFilterDays(e.target.value)}>
                <option value="7">H - 7 Hari</option>
                <option value="14">H - 14 Hari</option>
                <option value="30">H - 30 Hari</option>
                <option value="60">H - 60 Hari</option>
                <option value="90">H - 90 Hari (3 Bulan)</option>
                <option value="180">H - 180 Hari (6 Bulan)</option>
                <option value="all">Tampilkan Semua (H- & H+)</option>
              </select>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {currentData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 24px', color: 'var(--text-muted)', border: '1px dashed #cbd5e1', borderRadius: '16px', background: '#f8fafc' }}>
              Mantaap! Tidak ada jadwal yang perlu ditangani sesuai filter ini.
            </div>
          ) : currentData.map((group, idx) => {
            if (!group.company) return null;
            const isExpanded = !!expandedCompanies[group.company.id];
            const primaryItem = group.items[0] || null;
            return (
              <div key={group.company.id || idx} style={{ border: '1px solid #e2e8f0', borderRadius: '18px', overflow: 'hidden', background: 'white', boxShadow: isExpanded ? '0 12px 24px -18px rgba(15, 23, 42, 0.35)' : 'none' }}>
                <div
                  onClick={() => toggleExpandCompany(group.company.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '18px 20px',
                    cursor: 'pointer',
                    background: isExpanded ? '#f8fafc' : 'white',
                    borderLeft: '4px solid #cbd5e1'
                  }}
                >
                  <div style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                    <ChevronRight size={18} color="#64748b" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem' }}>{group.company.name}</span>
                      <span className={`badge ${group.company.type === 'Customer' ? 'badge-success' : 'badge-warning'}`}>{group.company.type}</span>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '4px 10px', borderRadius: '999px' }}>
                        {group.items.length} Product
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '6px', fontSize: '0.82rem', color: '#64748b' }}>
                      <span><MapPin size={12} style={{ verticalAlign: 'middle' }} /> {group.company.region_name || '-'}</span>
                      <span>Prioritas: <strong style={{ color: '#0f172a' }}>{primaryItem?.product_name || '-'}</strong></span>
                      <span>{selectedScheduleOption.shortLabel}: <strong style={{ color: '#0369a1' }}>{primaryItem?.[scheduleField] || '-'}</strong></span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', minWidth: '140px' }}>
                    <div style={{ marginTop: '6px', fontSize: '0.76rem', color: '#64748b' }}>
                      {isExpanded ? 'Sembunyikan detail' : 'Lihat detail product'}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ borderTop: '1px solid #e2e8f0', padding: '18px 20px 20px 20px' }}>
                    <div style={{ overflowX: 'auto' }}>
                      <table className="data-table" style={{ margin: 0 }}>
                        <thead style={{ background: '#f8fafc' }}>
                          <tr>
                            <th>Product</th>
                            {DASHBOARD_SCHEDULE_FIELDS.map(field => (
                              <th
                                key={field.value}
                                style={field.value === scheduleField ? { background: '#e0f2fe', color: '#0369a1' } : undefined}
                              >
                                {field.label}
                              </th>
                            ))}
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.items.map(item => (
                            <tr key={item.id}>
                              <td>
                                <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.product_name}</div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>PIC: {item.assigned_to_name || 'Unassigned'}</div>
                              </td>
                              {DASHBOARD_SCHEDULE_FIELDS.map(field => (
                                <td
                                  key={field.value}
                                  style={field.value === scheduleField ? { background: '#f0f9ff' } : undefined}
                                >
                                  {item[field.value] || '-'}
                                </td>
                              ))}
                              <td>
                                <span className={`badge ${item.status === 'Done' ? 'badge-success' : item.status === 'Skip' ? 'badge-danger' : 'badge-info'}`}>
                                  {item.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <Pagination totalItems={groupedUpcoming.length} itemsPerPage={ITEMS_PER_PAGE} currentPage={visiblePage} onPageChange={setCurrentPage} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', marginTop: '24px' }}>
        <div className="card-view" style={{ margin: 0, borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div className="card-header" style={{ background: '#f8fafc', padding: '18px 20px', borderBottom: '1px solid #e2e8f0' }}>
            <h2 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} /> Trend Jadwal ({selectedScheduleOption.label})
            </h2>
            <p style={{ margin: '6px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
              7 hari terakhir hingga {trendSeries.futureDays} hari ke depan
            </p>
          </div>
          <div style={{ padding: '16px 18px 20px 18px' }}>
            {trendSeries.points.every(point => point.total === 0) ? (
              <div style={{ textAlign: 'center', padding: '36px 12px', color: '#94a3b8' }}>
                Tidak ada data trend pada range waktu ini.
              </div>
            ) : (
              <>
                <div style={{ width: '100%', overflowX: 'auto' }}>
                  <svg viewBox={`0 0 ${trendChartWidth} ${trendChartHeight}`} style={{ minWidth: '640px', width: '100%', height: '220px' }}>
                    <path d={trendAreaPath} fill="rgba(14, 165, 233, 0.15)" />
                    <path d={trendTotalPath} fill="none" stroke="#0ea5e9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d={trendOpenPath} fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="5 4" />
                    <path d={trendDonePath} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    {trendSeries.points.map((point, index) => {
                      if (index % trendTickStep !== 0 && !point.isToday) return null;
                      const innerW = trendChartWidth - trendChartPadding.left - trendChartPadding.right;
                      const x = trendChartPadding.left + (innerW * (trendSeries.points.length === 1 ? 0 : index / (trendSeries.points.length - 1)));
                      return (
                        <g key={point.key}>
                          <line x1={x} y1={trendChartHeight - trendChartPadding.bottom} x2={x} y2={trendChartHeight - trendChartPadding.bottom + 6} stroke="#cbd5e1" strokeWidth="1" />
                          <text x={x} y={trendChartHeight - 4} textAnchor="middle" fontSize="10" fill={point.isToday ? '#0369a1' : '#94a3b8'} fontWeight={point.isToday ? 700 : 500}>
                            {point.isToday ? 'Hari Ini' : point.label}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
                <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginTop: '10px', fontSize: '0.78rem', color: '#475569' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '12px', height: '3px', borderRadius: '999px', background: '#0ea5e9' }} /> Total</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '12px', height: '3px', borderRadius: '999px', background: '#f59e0b' }} /> Open</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '12px', height: '3px', borderRadius: '999px', background: '#10b981' }} /> Done</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="card-view" style={{ margin: 0, borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div className="card-header" style={{ background: '#f8fafc', padding: '18px 20px', borderBottom: '1px solid #e2e8f0' }}>
            <h2 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={18} /> Workload per Region
            </h2>
            <p style={{ margin: '6px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
              Total customer & product berdasarkan region
            </p>
            {availableMonths.length > 0 && (
              <div style={{ marginTop: '12px' }}>
                <select
                  className="form-control"
                  style={{ width: '100%' }}
                  value={filterMonth}
                  onChange={e => setFilterMonth(e.target.value)}
                >
                  <option value="">Semua Bulan</option>
                  {availableMonths.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div style={{ padding: '16px 20px 20px 20px' }}>
            {workloadByRegion.rows.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '28px 8px', color: '#94a3b8' }}>
                Tidak ada data untuk filter ini.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {workloadByRegion.rows.map(row => {
                  const pct = Math.round((row.totalProducts / workloadByRegion.maxProducts) * 100);
                  return (
                    <div key={row.region} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '10px 12px', background: '#fff' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{row.region}</div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                          <strong style={{ color: '#0f172a' }}>{row.totalProducts}</strong> Produk
                        </div>
                      </div>
                      <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(to right, #0ea5e9, #0284c7)', borderRadius: '999px' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.75rem', color: '#64748b' }}>
                        <span>Customer: <strong style={{ color: '#0f172a' }}>{row.totalCustomers}</strong></span>
                        <span>Product: <strong style={{ color: '#0f172a' }}>{row.totalProducts}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar: Birthdays & Quick Stats */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '24px' }}>

        {/* Birthdays Card */}
        <div className="card-view" style={{ margin: 0, borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div className="card-header" style={{ background: 'linear-gradient(to right, #fdf4ff, #fae8ff)', padding: '20px', borderBottom: '1px solid #f5d0fe' }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#86198f', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cake size={20} /> Ultah PIC Bulan Ini
            </h2>
          </div>
          <div style={{ padding: '20px' }}>
            {birthdaysThisMonth.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
                <p style={{ margin: 0, fontSize: '0.9rem' }}>Tidak ada ulang tahun di bulan ini.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {birthdaysThisMonth.map(p => (
                  <div key={p.id} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '12px', background: '#fdf4ff', borderRadius: '16px', border: '1px solid #f5d0fe' }}>
                    <div style={{ background: 'white', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c026d3', fontWeight: 800 }}>
                      {p.dob.split('-')[2]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#4a044e' }}>{p.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#a21caf' }}>{p.company_name || 'Klien'}</div>
                    </div>
                    <a href={`https://wa.me/${p.phone?.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" style={{ background: '#25d366', color: 'white', padding: '8px', borderRadius: '10px', display: 'flex', alignItems: 'center' }}>
                      <MessageSquare size={16} />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Analytics Summary */}
        <div className="card-view" style={{ margin: 0, borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div className="card-header" style={{ background: '#f8fafc', padding: '20px', borderBottom: '1px solid #e2e8f0' }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart3 size={20} /> Sebaran Status
            </h2>
          </div>
          <div style={{ padding: '20px' }}>
            {STATUS_OPTIONS.map(status => {
              const count = installations.filter(i => i.status === status && !Number(i.is_history)).length;
              const totalActive = installations.filter(i => !Number(i.is_history)).length || 1;
              const pct = (count / totalActive) * 100;
              return (
                <div key={status} style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                    <span>{status}</span>
                    <span>{count}</span>
                  </div>
                  <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: status === 'Done' ? '#10b981' : status === 'Scheduled' ? '#3b82f6' : '#94a3b8', borderRadius: '4px' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}

function CompanyPage({ can, currentUser }) {
  const [companies, setCompanies] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [regions, setRegions] = useState([]);
  const [compTypes, setCompTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({ id: '', name: '', address: '', industry_id: '', region_id: '', type_id: '2' });
  const [newIndustry, setNewIndustry] = useState('');
  const [filterRegions, setFilterRegions] = useState([]);
  const [regionSearch, setRegionSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const showAll = can('company_showall');
      const [resC, resM, resR] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/companies.php?action=list&user_id=${currentUser?.id || ''}&show_all=${showAll}`),
        fetch(`${import.meta.env.VITE_API_URL}/companies.php?action=list_metadata`),
        fetch(`${import.meta.env.VITE_API_URL}/regions.php?action=list`)
      ]);
      const dataC = await resC.json();
      const dataM = await resM.json();
      const dataR = await resR.json();
      if (dataC.status === 'success') setCompanies(dataC.data);
      if (dataM.status === 'success') {
        setIndustries(dataM.industries);
        setCompTypes(dataM.types);
      }
      if (dataR.status === 'success') setRegions(dataR.data);
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const selectedInd = industries.find(i => Number(i.id) === Number(formData.industry_id));
      const payload = { ...formData, user_id: currentUser?.id };
      if (selectedInd?.industry_name === 'Lainnya') {
        if (!newIndustry) { alert("Nama industri baru wajib diisi."); setIsSaving(false); return; }
        payload.industry_name = newIndustry;
      }
      const action = formData.id ? 'update' : 'create';
      const res = await fetch(`${import.meta.env.VITE_API_URL}/companies.php?action=${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const d = await res.json();
      if (d.status === 'success') {
        setModalOpen(false);
        fetchData();
        setFormData({ id: '', name: '', address: '', industry_id: '', region_id: '', type_id: '2' });
        setNewIndustry('');
      } else alert(d.message);
    } catch (err) { alert("Error connecting to API"); } finally { setIsSaving(false); }
  };

  const handleToggleStatus = async (id) => {
    if (window.confirm("Ubah status keaktifan perusahaan ini?")) {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/companies.php?action=toggle_status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id })
        });
        const d = await res.json();
        if (d.status === 'success') fetchData();
        else alert(d.message);
      } catch (e) { console.error(e); }
    }
  };

  const columns = [
    { header: 'ID', accessor: 'id' },
    { header: 'Nama Perusahaan', accessor: 'name', render: (row) => <strong>{row.name}</strong> },
    { header: 'Tipe', accessor: 'type', render: (row) => <span className={`badge ${row.type === 'Customer' ? 'badge-success' : 'badge-warning'}`}>{row.type}</span> },
    { header: 'Alamat', accessor: 'address' },
    { header: 'Industri', accessor: 'industry_name' },
    { header: 'Region', accessor: 'region_name' },
    { header: 'Dibuat Oleh', accessor: 'creator_name' },
    { header: 'Diubah Oleh', accessor: 'last_editor_name' },
    { header: 'Status', render: (row) => <span className={`badge ${Number(row.status_active) ? 'badge-success' : 'badge-danger'}`}>{Number(row.status_active) ? 'Aktif' : 'Non-Aktif'}</span> },
    {
      header: 'Aksi',
      render: (row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          {can('company_update') && <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => { setFormData({ id: row.id, name: row.name, address: row.address || '', industry_id: row.industry_id, region_id: row.region_id, type_id: row.type_id }); setModalOpen(true); }}>Edit</button>}
          {can('company_delete') && <button className="btn" style={{ padding: '4px 8px', fontSize: '12px', background: row.status_active ? '#fef2f2' : '#f0fdf4', color: row.status_active ? '#dc2626' : '#16a34a', border: '1px solid', borderColor: row.status_active ? '#fecaca' : '#bbf7d0' }} onClick={() => handleToggleStatus(row.id)}>{row.status_active ? 'Nonaktifkan' : 'Aktifkan'}</button>}
        </div>
      )
    }
  ];

  const filteredData = companies.filter(item => {
    const matchesRegion = filterRegions.length === 0 || filterRegions.includes(String(item.region_id));
    const matchesStatus = showInactive ? true : Number(item.status_active) === 1;
    return matchesRegion && matchesStatus;
  });

  if (!can('company_read')) return <div className="page-container"><h1 className="page-title">⛔ Akses Ditolak</h1></div>;

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '16px', flexWrap: 'wrap' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Data Company & Prospek</h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'stretch', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem', color: '#64748b', background: 'white', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#0ea5e9' }} />
            Tampilkan Nonaktif
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', flexWrap: 'wrap', flex: 1, minWidth: '220px' }}>
            <Filter size={16} color="#64748b" />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {filterRegions.map(rid => {
                const r = regions.find(reg => String(reg.id) === rid);
                return (
                  <span key={rid} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#e0f2fe', color: '#0369a1', fontSize: '11px', padding: '2px 6px', borderRadius: '4px' }}>
                    {r?.region_name || rid}
                    <button onClick={() => setFilterRegions(filterRegions.filter(id => id !== rid))} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}><X size={12} /></button>
                  </span>
                );
              })}
            </div>
            <input list="region-list" className="form-control" style={{ border: 'none', padding: '8px 12px', fontSize: '0.875rem', flex: 1, minWidth: '140px' }} placeholder="Select Region..." value={regionSearch} onChange={e => {
              const val = e.target.value;
              setRegionSearch(val);
              const found = regions.find(r => r.region_name.toLowerCase() === val.toLowerCase());
              if (found && !filterRegions.includes(String(found.id))) {
                setFilterRegions([...filterRegions, String(found.id)]);
                setRegionSearch('');
              }
            }} />
            <datalist id="region-list">{regions.map(r => <option key={r.id} value={r.region_name} />)}</datalist>
          </div>
          {can('company_create') && <button className="btn btn-primary" onClick={() => { setFormData({ id: '', name: '', address: '', industry_id: '', region_id: '', type_id: '2' }); setModalOpen(true); }} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px' }}><Plus size={18} /> Tambah Company</button>}
        </div>
      </div>
      <div className="card-view" style={{ padding: '20px' }}>
        {isLoading ? <div style={{ padding: '40px', textAlign: 'center' }}><Loader2 className="animate-spin" size={32} style={{ margin: '0 auto' }} color="#0ea5e9" /></div> : <DataTable data={filteredData} columns={columns} fileName="companies" />}
      </div>
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}><div className="modal-content" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}><div className="modal-header"><h2>{formData.id ? 'Edit Company' : 'Tambah Company'}</h2><button className="close-btn" onClick={() => setModalOpen(false)}><X size={24} /></button></div>
          <form onSubmit={handleSave}><div className="modal-body">
            <div style={{ display: 'flex', gap: '16px' }}><div className="form-group" style={{ flex: 1 }}><label>Tipe Data</label><select className="form-control" value={formData.type_id} onChange={e => setFormData({ ...formData, type_id: e.target.value })}>{compTypes.map(t => <option key={t.id} value={t.id}>{t.type_name}</option>)}</select></div><div className="form-group" style={{ flex: 1 }}><label>Nama Perusahaan</label><input required className="form-control" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div></div>
            <div className="form-group"><label>Alamat</label><textarea className="form-control" style={{ height: '80px' }} value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} /></div>
            <div style={{ display: 'flex', gap: '16px' }}><div className="form-group" style={{ flex: 1 }}><label>Industri</label><select required className="form-control" value={formData.industry_id} onChange={e => setFormData({ ...formData, industry_id: e.target.value })}><option value="">Pilih Industri...</option>{industries.sort((a, b) => a.industry_name === 'Lainnya' ? 1 : b.industry_name === 'Lainnya' ? -1 : a.industry_name.localeCompare(b.industry_name)).map(ind => <option key={ind.id} value={ind.id}>{ind.industry_name}</option>)}</select></div>
              <div className="form-group" style={{ flex: 1 }}><label>Region / Kota</label><select required className="form-control" value={formData.region_id} onChange={e => setFormData({ ...formData, region_id: e.target.value })}><option value="">Pilih Region...</option>{regions.map(r => <option key={r.id} value={r.id}>{r.region_name}</option>)}</select></div></div>
            {industries.find(i => Number(i.id) === Number(formData.industry_id))?.industry_name === 'Lainnya' && <div className="form-group" style={{ background: '#f0f9ff', padding: '12px', borderRadius: '4px', border: '1px dashed #0284c7' }}><label style={{ color: '#0369a1', fontWeight: 'bold' }}>Input Nama Industri Baru</label><input className="form-control" type="text" placeholder="Contoh: Otomotif, Tekstil..." value={newIndustry} onChange={e => setNewIndustry(e.target.value)} /></div>}
          </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Batal</button><button type="submit" className="btn btn-primary" disabled={isSaving}>{isSaving ? 'Menyimpan...' : 'Simpan'}</button></div></form></div></div>
      )}
    </div>
  );
}

function RegionPage({ can, currentUser }) {
  const [regions, setRegions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ id: '', name: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [showInactive, setShowInactive] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/regions.php?action=list`);
      const d = await res.json();
      if (d.status === 'success') setRegions(d.data || []);
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const action = formData.id ? 'update' : 'create';
      const res = await fetch(`${import.meta.env.VITE_API_URL}/regions.php?action=${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: formData.id, region_name: formData.name, user_id: currentUser?.id })
      });
      const d = await res.json();
      if (d.status === 'success') { setModalOpen(false); fetchData(); setFormData({ id: '', name: '' }); }
      else alert(d.message);
    } catch (err) { alert("Error connecting to API"); } finally { setIsSaving(false); }
  };

  const handleToggleStatus = async (id) => {
    if (window.confirm("Ubah status keaktifan region ini?")) {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/regions.php?action=toggle_status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id })
        });
        const d = await res.json();
        if (d.status === 'success') fetchData();
        else alert(d.message);
      } catch (e) { console.error(e); }
    }
  };

  const columns = [
    { header: 'ID', accessor: 'id' },
    { header: 'Nama Region', accessor: 'region_name', render: (row) => <strong>{row.region_name}</strong> },
    { header: 'Diubah Oleh', accessor: 'last_editor_name' },
    { header: 'Status', render: (row) => <span className={`badge ${(row.status || 'active') === 'active' ? 'badge-success' : 'badge-danger'}`}>{(row.status || 'active') === 'active' ? 'Aktif' : 'Non-Aktif'}</span> },
    {
      header: 'Aksi',
      render: (row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          {can('region_update') && <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => { setFormData({ id: row.id, name: row.region_name }); setModalOpen(true); }}>Edit</button>}
          {can('region_delete') && <button className="btn" style={{ padding: '4px 8px', fontSize: '12px', background: (row.status || 'active') === 'active' ? '#fef2f2' : '#f0fdf4', color: (row.status || 'active') === 'active' ? '#dc2626' : '#16a34a', border: '1px solid', borderColor: (row.status || 'active') === 'active' ? '#fecaca' : '#bbf7d0' }} onClick={() => handleToggleStatus(row.id)}>{(row.status || 'active') === 'active' ? 'Nonaktifkan' : 'Aktifkan'}</button>}
        </div>
      )
    }
  ];

  if (!can('region_read')) return <div className="page-container"><h1 className="page-title">⛔ Akses Ditolak</h1></div>;

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Master Region</h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'stretch', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem', color: '#64748b', background: 'white', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#0ea5e9' }} />
            Tampilkan Nonaktif
          </label>
          {can('region_create') && <button className="btn btn-primary" onClick={() => { setFormData({ id: '', name: '' }); setModalOpen(true); }} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px' }}><Plus size={18} /> Tambah Region</button>}
        </div>
      </div>
      <div className="card-view" style={{ padding: '20px' }}>
        {isLoading ? <div style={{ padding: '40px', textAlign: 'center' }}><Loader2 className="animate-spin" size={32} style={{ margin: '0 auto' }} color="#0ea5e9" /></div> : <DataTable data={regions.filter(r => showInactive || (r.status || 'active') === 'active')} columns={columns} fileName="regions" />}
      </div>
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}><div className="modal-content" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}><div className="modal-header"><h2>{formData.id ? 'Edit Region' : 'Tambah Region'}</h2><button className="close-btn" onClick={() => setModalOpen(false)}><X size={24} /></button></div>
          <form onSubmit={handleSave}><div className="modal-body"><div className="form-group"><label>Nama Region</label><input required className="form-control" type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div></div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Batal</button><button type="submit" className="btn btn-primary" disabled={isSaving}>{isSaving ? 'Menyimpan...' : 'Simpan'}</button></div></form>
        </div></div>
      )}
    </div>
  );
}

function PICPage({ can, currentUser }) {
  const [pics, setPics] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({ id: '', name: '', company_id: '', job_title: '', phone: '', email: '', dob: '', address: '' });
  const [filterCompanies, setFilterCompanies] = useState([]);
  const [companySearch, setCompanySearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const picShowAll = can('pic_showall');
      const compShowAll = can('company_showall');
      const [resP, resC] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/pics.php?action=list&user_id=${currentUser?.id || ''}&show_all=${picShowAll}`),
        fetch(`${import.meta.env.VITE_API_URL}/companies.php?action=list&user_id=${currentUser?.id || ''}&show_all=${compShowAll}`)
      ]);
      const dP = await resP.json();
      const dC = await resC.json();
      if (dP.status === 'success') setPics(dP.data || []);
      if (dC.status === 'success') setCompanies(dC.data || []);
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const action = formData.id ? 'update' : 'create';
      const res = await fetch(`${import.meta.env.VITE_API_URL}/pics.php?action=${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, user_id: currentUser?.id })
      });
      const d = await res.json();
      if (d.status === 'success') { setModalOpen(false); fetchData(); setFormData({ id: '', name: '', company_id: '', job_title: '', phone: '', email: '', dob: '', address: '' }); }
      else alert(d.message);
    } catch (err) { alert("Error connecting to API"); } finally { setIsSaving(false); }
  };

  const handleToggleStatus = async (id) => {
    if (window.confirm("Ubah status keaktifan PIC ini?")) {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/pics.php?action=toggle_status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id })
        });
        const d = await res.json();
        if (d.status === 'success') fetchData();
        else alert(d.message);
      } catch (e) { console.error(e); }
    }
  };

  const columns = [
    { header: 'ID', accessor: 'id' },
    { header: 'Nama PIC', accessor: 'name', render: (row) => <strong>{row.name}</strong> },
    { header: 'Company', accessor: 'company_name' },
    { header: 'Jabatan', accessor: 'job_title' },
    { header: 'Alamat', accessor: 'address' },
    { header: 'Handphone', accessor: 'phone' },
    { header: 'Diubah Oleh', accessor: 'last_editor_name' },
    { header: 'Status', render: (row) => <span className={`badge ${(row.status || 'active') === 'active' ? 'badge-success' : 'badge-danger'}`}>{(row.status || 'active') === 'active' ? 'Aktif' : 'Non-Aktif'}</span> },
    {
      header: 'Aksi',
      render: (row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          {can('pic_update') && <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => { setFormData({ id: row.id, name: row.name, company_id: row.company_id, job_title: row.job_title || '', phone: row.phone || '', email: row.email || '', dob: row.dob || '', address: row.address || '' }); setModalOpen(true); }}>Edit</button>}
          {can('pic_delete') && <button className="btn" style={{ padding: '4px 8px', fontSize: '12px', background: (row.status || 'active') === 'active' ? '#fef2f2' : '#f0fdf4', color: (row.status || 'active') === 'active' ? '#dc2626' : '#16a34a', border: '1px solid', borderColor: (row.status || 'active') === 'active' ? '#fecaca' : '#bbf7d0' }} onClick={() => handleToggleStatus(row.id)}>{(row.status || 'active') === 'active' ? 'Nonaktifkan' : 'Aktifkan'}</button>}
        </div>
      )
    }
  ];

  const filteredData = pics.filter(item => {
    const matchesCompany = filterCompanies.length === 0 || filterCompanies.includes(String(item.company_id));
    const matchesStatus = showInactive ? true : (item.status || 'active') === 'active';
    return matchesCompany && matchesStatus;
  });

  if (!can('pic_read')) return <div className="page-container"><h1 className="page-title">⛔ Akses Ditolak</h1></div>;

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '16px', flexWrap: 'wrap' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Data PIC Customer</h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'stretch', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem', color: '#64748b', background: 'white', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#0ea5e9' }} />
            Tampilkan Nonaktif
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', flexWrap: 'wrap', flex: 1, minWidth: '220px' }}>
            <Filter size={16} color="#64748b" />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {filterCompanies.map(cid => {
                const c = companies.find(comp => String(comp.comp_id || comp.id) === cid);
                return (
                  <span key={cid} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#e0f2fe', color: '#0369a1', fontSize: '11px', padding: '2px 6px', borderRadius: '4px' }}>
                    {c?.name || cid}
                    <button onClick={() => setFilterCompanies(filterCompanies.filter(id => id !== cid))} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}><X size={12} /></button>
                  </span>
                );
              })}
            </div>
            <input list="company-list" className="form-control" style={{ border: 'none', padding: '8px 12px', fontSize: '0.875rem', flex: 1, minWidth: '140px' }} placeholder="Select Company..." value={companySearch} onChange={e => {
              const val = e.target.value;
              setCompanySearch(val);
              const found = companies.find(c => c.name.toLowerCase() === val.toLowerCase());
              if (found && !filterCompanies.includes(String(found.id))) {
                setFilterCompanies([...filterCompanies, String(found.id)]);
                setCompanySearch('');
              }
            }} />
            <datalist id="company-list">{companies.map(c => <option key={c.id} value={c.name} />)}</datalist>
          </div>
          {can('pic_create') && <button className="btn btn-primary" onClick={() => { setFormData({ id: '', name: '', company_id: '', job_title: '', phone: '', email: '', dob: '', address: '' }); setModalOpen(true); }} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px' }}><Plus size={18} /> Tambah PIC</button>}
        </div>
      </div>
      <div className="card-view" style={{ padding: '20px' }}>
        {isLoading ? <div style={{ padding: '40px', textAlign: 'center' }}><Loader2 className="animate-spin" size={32} style={{ margin: '0 auto' }} color="#0ea5e9" /></div> : <DataTable data={filteredData} columns={columns} fileName="pics" />}
      </div>
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}><div className="modal-content" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h2>{formData.id ? 'Edit PIC' : 'Tambah PIC'}</h2><button className="close-btn" onClick={() => setModalOpen(false)}><X size={24} /></button></div>
          <form onSubmit={handleSave}><div className="modal-body">
            <div className="form-group"><label>Nama PIC</label><input required className="form-control" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
            <div className="form-group"><label>Perusahaan</label><select required className="form-control" value={formData.company_id} onChange={e => setFormData({ ...formData, company_id: e.target.value })}><option value="">Pilih Perusahaan...</option>{companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div className="form-group"><label>Alamat PIC</label><textarea className="form-control" style={{ height: '60px' }} value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} /></div>
            <div style={{ display: 'flex', gap: '16px' }}><div className="form-group" style={{ flex: 1 }}><label>Jabatan</label><input className="form-control" value={formData.job_title} onChange={e => setFormData({ ...formData, job_title: e.target.value })} /></div><div className="form-group" style={{ flex: 1 }}><label>Tanggal Lahir</label><input type="date" className="form-control" value={formData.dob} onChange={e => setFormData({ ...formData, dob: e.target.value })} /></div></div>
            <div style={{ display: 'flex', gap: '16px' }}><div className="form-group" style={{ flex: 1 }}><label>Telepon</label><input className="form-control" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} /></div><div className="form-group" style={{ flex: 1 }}><label>Email</label><input type="email" className="form-control" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} /></div></div>
          </div>
            <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Batal</button><button type="submit" className="btn btn-primary" disabled={isSaving}>{isSaving ? 'Menyimpan...' : 'Simpan'}</button></div></form>
        </div></div>
      )}
    </div>
  );
}

function SalesPage({ companies, regions, installations, setInstallations, can, currentUser }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editCompany, setEditCompany] = useState(null);
  const [editItems, setEditItems] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({ companyId: '', products: [getInitialProduct()] });
  const [showInactive, setShowInactive] = useState(false);
  const [filterType, setFilterType] = useState('');
  const [filterRegions, setFilterRegions] = useState([]);
  const [regionSearch, setRegionSearch] = useState('');
  const [expandedCompanies, setExpandedCompanies] = useState({});
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [renewModal, setRenewModal] = useState(false);
  const [renewData, setRenewData] = useState(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyModalCompany, setHistoryModalCompany] = useState(null);
  const [historyModalItems, setHistoryModalItems] = useState([]);
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferTarget, setTransferTarget] = useState({});

  if (!can('sales_read')) return <div className="page-container"><h1 className="page-title">Akses Ditolak</h1></div>;



  const updateProductRow = (idx, field, val) => {
    const newProds = [...formData.products];
    newProds[idx][field] = val;
    if (field === 'recurringValue' || field === 'recurringUnit' || field === 'installationDate') {
      const baseDate = newProds[idx].installationDate || getLocalDateString();
      newProds[idx].replacementDate = calculateNextDate(baseDate, newProds[idx].recurringValue, newProds[idx].recurringUnit);
    }
    setFormData({ ...formData, products: newProds });
  };

  const reloadInstallations = async () => {
    try {
      const showAll = can('sales_showall');
      const resList = await fetch(`${import.meta.env.VITE_API_URL}/installations.php?action=list&user_id=${currentUser.id}&show_all=${showAll}`);
      const jsonList = await resList.json();
      if (jsonList.status === 'success') setInstallations(jsonList.data);
    } catch (e) { console.error(e); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/installations.php?action=create`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, user_id: currentUser.id })
      });
      const d = await res.json();
      if (d.status === 'success') {
        alert("Pencatatan Berhasil!");
        setModalOpen(false);
        setFormData({ companyId: '', products: [getInitialProduct()] });
        await reloadInstallations();
      } else { alert(d.message); }
    } catch (e) { console.error(e); } finally { setIsSaving(false); }
  };

  const handleBulkEditSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/installations.php?action=bulk_update`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: editItems, user_id: currentUser.id })
      });
      const d = await res.json();
      if (d.status === 'success') {
        alert(d.message);
        setEditModal(false);
        await reloadInstallations();
      } else { alert(d.message); }
    } catch (e) { console.error(e); } finally { setIsSaving(false); }
  };

  const handleBulkToggle = async (activate) => {
    if (selectedIds.length === 0) return alert('Pilih item terlebih dahulu.');
    const label = activate ? 'mengaktifkan' : 'menonaktifkan';
    if (!window.confirm(`Anda akan ${label} ${selectedIds.length} item. Lanjutkan?`)) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/installations.php?action=bulk_toggle_status`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds, activate, user_id: currentUser.id })
      });
      const d = await res.json();
      if (d.status === 'success') {
        alert(d.message);
        setSelectedIds([]);
        await reloadInstallations();
      } else { alert(d.message); }
    } catch (e) { console.error(e); }
  };

  const toggleExpand = (companyId) => {
    setExpandedCompanies(prev => ({ ...prev, [companyId]: !prev[companyId] }));
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectCompany = (items) => {
    const ids = items.map(i => i.id);
    const allSelected = ids.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !ids.includes(id)));
    } else {
      setSelectedIds(prev => [...new Set([...prev, ...ids])]);
    }
  };

  const openGroupEdit = (company, items) => {
    setEditCompany(company);
    setEditItems(items.map(i => {
      const base = i.installation_date || getLocalDateString();
      const val = i.maintenance_cycle_value || '1';
      const unit = i.maintenance_cycle_unit || 'years';
      return {
        ...i,
        installation_date: base,
        maintenance_cycle_value: val,
        maintenance_cycle_unit: unit,
        replacement_date: calculateNextDate(base, val, unit)
      };
    }));
    setEditModal(true);
  };

  const updateEditItem = (idx, field, val) => {
    const newItems = [...editItems];
    newItems[idx] = { ...newItems[idx], [field]: val };
    if (field === 'maintenance_cycle_value' || field === 'maintenance_cycle_unit' || field === 'installation_date') {
      const baseDate = newItems[idx].installation_date || getLocalDateString();
      newItems[idx].replacement_date = calculateNextDate(baseDate, newItems[idx].maintenance_cycle_value, newItems[idx].maintenance_cycle_unit);
    }
    setEditItems(newItems);
  };

  const openRenew = (row) => {
    setRenewData({
      id: row.id,
      product_name: row.product_name,
      company_name: row.company_name,
      installation_date: getLocalDateString(),
      maintenance_cycle_value: row.maintenance_cycle_value || '1',
      maintenance_cycle_unit: row.maintenance_cycle_unit || 'years',
      replacement_date: calculateNextDate(getLocalDateString(), row.maintenance_cycle_value || '1', row.maintenance_cycle_unit || 'years'),
      notes: ''
    });
    setRenewModal(true);
  };

  const handleRenew = async () => {
    if (!renewData) return;
    setIsSaving(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/installations.php?action=renew`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: renewData.id,
          nextDate: renewData.replacement_date,
          newProductName: renewData.product_name,
          newInstallDate: renewData.installation_date,
          newCycleValue: renewData.maintenance_cycle_value,
          newCycleUnit: renewData.maintenance_cycle_unit,
          renewNotes: renewData.notes,
          user_id: currentUser.id
        })
      });
      const d = await res.json();
      if (d.status === 'success') {
        alert('Siklus baru berhasil dibuat! Produk lama masuk ke History.');
        setRenewModal(false);
        await reloadInstallations();
      } else { alert(d.message); }
    } catch (e) { console.error(e); } finally { setIsSaving(false); }
  };

  const openHistoryModal = (company) => {
    const items = installations.filter(i =>
      String(i.company_id) === String(company.id) && Number(i.is_history) === 1
    );
    setHistoryModalCompany(company);
    setHistoryModalItems(items);
    setHistoryModalOpen(true);
  };

  const activeInstallations = useMemo(() => installations.filter(i => {
    if (Number(i.is_history) === 1) return false;
    if (!showInactive && (i.status_active === '0' || Number(i.status_active) === 0)) return false;
    if (filterType && i.company_type !== filterType) return false;
    if (filterRegions.length > 0 && !filterRegions.includes(i.region)) return false;
    return true;
  }), [installations, showInactive, filterType, filterRegions]);

  const groupedByCompany = useMemo(() => {
    const groups = {};
    activeInstallations.forEach(inst => {
      if (searchTerm && !inst.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) && !inst.product_name?.toLowerCase().includes(searchTerm.toLowerCase())) return;
      const cid = inst.company_id;
      if (!groups[cid]) {
        groups[cid] = {
          company: { id: cid, name: inst.company_name, type: inst.company_type, region: inst.region },
          items: [], activeCount: 0, inactiveCount: 0
        };
      }
      groups[cid].items.push(inst);
      if (inst.status_active === '0' || Number(inst.status_active) === 0) groups[cid].inactiveCount++;
      else groups[cid].activeCount++;
    });
    return Object.values(groups).sort((a, b) => a.company.name.localeCompare(b.company.name));
  }, [activeInstallations, searchTerm]);

  const ITEMS_PER_PAGE = 10;
  const currentGroups = groupedByCompany.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Input Instalasi / Penawaran</h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'stretch', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem', color: '#64748b', background: 'white', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#0ea5e9' }} />
            Tampilkan Nonaktif
          </label>
          <select className="form-control" style={{ padding: '8px 12px', fontSize: '0.875rem', flex: 1, minWidth: '140px' }} value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">Semua Tipe...</option>
            {COMPANY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', flexWrap: 'wrap', flex: 1, minWidth: '180px' }}>
            <Filter size={16} color="#64748b" />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {filterRegions.map(rid => (
                <span key={rid} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#e0f2fe', color: '#0369a1', fontSize: '11px', padding: '2px 6px', borderRadius: '4px' }}>
                  {rid}
                  <button onClick={() => setFilterRegions(filterRegions.filter(id => id !== rid))} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}><X size={12} /></button>
                </span>
              ))}
            </div>
            <input list="sales-region-list" className="form-control" style={{ border: 'none', padding: '8px 12px', fontSize: '0.875rem', flex: 1, minWidth: '120px' }} placeholder="Filter Region..." value={regionSearch} onChange={e => {
              const val = e.target.value;
              setRegionSearch(val);
              if (regions.find(r => r.region_name.toLowerCase() === val.toLowerCase()) && !filterRegions.includes(val)) {
                setFilterRegions([...filterRegions, val]);
                setRegionSearch('');
              }
            }} />
            <datalist id="sales-region-list">{regions.map(r => <option key={r.id} value={r.region_name} />)}</datalist>
          </div>
          {can('sales_create') && (
            <button className="btn btn-primary" onClick={() => setModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}>
              <PlusCircle size={20} /> Buat Rekaman Baru
            </button>
          )}
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="stat-card">
          <div className="stat-icon"><Database size={24} /></div>
          <div className="stat-content"><h3>Total Klien</h3><p>{groupedByCompany.length}</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Wrench size={24} /></div>
          <div className="stat-content"><h3>Total Produk Aktif</h3><p>{activeInstallations.length}</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#dcfce7', color: '#16a34a' }}><CheckCircle2 size={24} /></div>
          <div className="stat-content"><h3>Selesai (Done)</h3><p>{activeInstallations.filter(i => i.status === 'Done').length}</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#fee2e2', color: '#ef4444' }}><AlertCircle size={24} /></div>
          <div className="stat-content"><h3>Akan Habis (30d)</h3><p>{activeInstallations.filter(i => { const d = Math.ceil((new Date(i.replacement_date) - new Date()) / 86400000); return d <= 30 && i.status !== 'Done'; }).length}</p></div>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', padding: '14px 20px', borderRadius: '14px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #93c5fd' }}>
          <span style={{ fontWeight: 700, color: '#1e40af' }}>{selectedIds.length} item terpilih</span>
          <div style={{ display: 'flex', gap: '10px' }}>
            {can('sales_delete') && <button className="btn" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '8px 16px', fontSize: '0.85rem', borderRadius: '10px' }} onClick={() => handleBulkToggle(false)}>Nonaktifkan Terpilih</button>}
            {can('sales_delete') && showInactive && <button className="btn" style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', padding: '8px 16px', fontSize: '0.85rem', borderRadius: '10px' }} onClick={() => handleBulkToggle(true)}>Aktifkan Terpilih</button>}
            <button className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem', borderRadius: '10px' }} onClick={() => setSelectedIds([])}>Batal Pilih</button>
          </div>
        </div>
      )}

      <div className="card-view" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input className="form-control" style={{ padding: '12px 14px 12px 40px', width: '100%' }} placeholder="Cari klien atau produk..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
          </div>
          <span style={{ fontSize: '0.85rem', color: '#64748b', alignSelf: 'center' }}>Menampilkan {groupedByCompany.length} klien</span>
        </div>

        {currentGroups.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
            <Database size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
            <p style={{ margin: 0 }}>Tidak ada data ditemukan.</p>
          </div>
        ) : currentGroups.map(group => {
          const isExpanded = expandedCompanies[group.company.id];
          const companySelected = group.items.every(i => selectedIds.includes(i.id));
          const nearExpiry = group.items.filter(i => { const d = Math.ceil((new Date(i.replacement_date) - new Date()) / 86400000); return d <= 30 && i.status !== 'Done'; }).length;
          const historyCount = installations.filter(i => String(i.company_id) === String(group.company.id) && Number(i.is_history) === 1).length;
          return (
            <div key={group.company.id} style={{ marginBottom: '12px', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', background: 'white', transition: 'all 0.2s', boxShadow: isExpanded ? '0 4px 12px rgba(0,0,0,0.06)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', cursor: 'pointer', background: isExpanded ? '#f8fafc' : 'white', gap: '16px', transition: 'background 0.2s' }} onClick={() => toggleExpand(group.company.id)}>
                {can('sales_delete') && (
                  <input type="checkbox" checked={companySelected} onClick={e => e.stopPropagation()} onChange={() => toggleSelectCompany(group.items)} style={{ width: '18px', height: '18px', accentColor: '#3b82f6', cursor: 'pointer' }} />
                )}
                <div style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                  <ChevronRight size={18} color="#64748b" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>{group.company.name}</span>
                    <span className={`badge ${group.company.type === 'Customer' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '10px' }}>{group.company.type}</span>
                    {historyCount > 0 && <span style={{ background: '#f1f5f9', color: '#64748b', fontSize: '10px', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>{historyCount} Riwayat</span>}
                    {nearExpiry > 0 && <span style={{ background: '#fef2f2', color: '#dc2626', fontSize: '10px', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>{nearExpiry} akan habis</span>}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}><MapPin size={12} style={{ verticalAlign: 'middle' }} /> {group.company.region || '-'}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ background: '#f0f9ff', color: '#0284c7', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700 }}>{group.items.length} Produk</span>
                  {can('sales_update') && (
                    <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '10px' }} onClick={e => { e.stopPropagation(); openGroupEdit(group.company, group.items); }}>
                      <Settings size={14} style={{ marginRight: '4px' }} /> Edit Semua
                    </button>
                  )}
                  {(can('installation_transfer') || can('sales_update')) && (
                    <button className="btn" style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '10px', background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }} onClick={e => { e.stopPropagation(); setTransferTarget({ companyId: group.company.id, companyName: group.company.name, fromUserId: group.items[0]?.assigned_to, fromUserName: group.items[0]?.assigned_to_name, installationId: null }); setTransferOpen(true); }}>
                      Transfer
                    </button>
                  )}
                  <button className="btn" style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '10px', background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' }} onClick={e => { e.stopPropagation(); openHistoryModal(group.company); }}>
                    <Archive size={14} style={{ marginRight: '4px' }} /> History
                  </button>
                </div>
              </div>
                  {isExpanded && (
                <div style={{ borderTop: '1px solid #e2e8f0' }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table" style={{ margin: 0 }}>
                      <thead style={{ background: '#f8fafc' }}>
                        <tr>
                          {can('sales_delete') && <th style={{ width: '40px' }}></th>}
                          <th>Produk</th>
                          <th>Tgl Instalasi</th>
                          <th>Siklus</th>
                          <th>Target Ganti</th>
                          <th>Tgl Follow Up</th>
                          <th>Visit Schedule</th>
                           <th>Status</th>
                           <th>Status Data</th>
                           <th>PIC Sales</th>
                           <th>Audit</th>
                           <th>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.items.map(row => {
                          const diff = Math.ceil((new Date(row.replacement_date) - new Date()) / 86400000);
                          const isInactive = row.status_active === '0' || Number(row.status_active) === 0;
                          return (
                            <tr key={row.id} style={{ opacity: isInactive ? 0.5 : 1 }}>
                              {can('sales_delete') && <td><input type="checkbox" checked={selectedIds.includes(row.id)} onChange={() => toggleSelect(row.id)} /></td>}
                              <td><strong style={{ color: '#0369a1' }}>{row.product_name}</strong></td>
                              <td>{row.installation_date || '-'}</td>
                              <td>Tiap {row.maintenance_cycle_value} {row.maintenance_cycle_unit}</td>
                              <td>
                                <div style={{ color: diff < 0 ? '#ef4444' : diff <= 30 ? '#f59e0b' : 'inherit' }}>
                                  <div style={{ fontWeight: 600 }}>{row.replacement_date}</div>
                                  <div style={{ fontSize: '0.75rem' }}>{diff < 0 ? `Overdue ${Math.abs(diff)}d` : `H - ${diff}`}</div>
                                </div>
                              </td>
                              <td>{row.followup_date || '-'}</td>
                              <td>{row.visit_schedule_date || '-'}</td>
                              <td><span className={`badge ${row.status === 'Done' ? 'badge-success' : row.status === 'Skip' ? 'badge-danger' : 'badge-info'}`}>{row.status}</span></td>
                              <td><span className={`badge ${isInactive ? 'badge-danger' : 'badge-success'}`}>{isInactive ? 'Non-Aktif' : 'Aktif'}</span></td>
                              <td><div style={{ fontWeight: 600, color: '#0369a1', fontSize: '0.85rem' }}>{row.assigned_to_name || '-'}</div></td>
                              <td><div style={{ fontSize: '10px', color: '#94a3b8' }}><div>Oleh: {row.creator_name || '-'}</div><div>Ubah: {row.last_editor_name || '-'}</div></div></td>
                              <td>
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                  {can('sales_update') && <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => openGroupEdit(group.company, [row])}>Edit</button>}
                                  {can('sales_update') && row.status !== 'Done' && <button className="btn" style={{ padding: '4px 8px', fontSize: '11px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }} onClick={() => openRenew(row)}>Renew</button>}
                                  {can('sales_delete') && <button className="btn" style={{ padding: '4px 8px', fontSize: '11px', background: isInactive ? '#f0fdf4' : '#fef2f2', color: isInactive ? '#16a34a' : '#dc2626', border: '1px solid', borderColor: isInactive ? '#bbf7d0' : '#fecaca' }} onClick={() => { setSelectedIds([row.id]); handleBulkToggle(!isInactive); }}>{isInactive ? 'Aktifkan' : 'Nonaktifkan'}</button>}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <Pagination totalItems={groupedByCompany.length} itemsPerPage={ITEMS_PER_PAGE} currentPage={currentPage} onPageChange={setCurrentPage} />
      </div>


      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '950px', width: '95%' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
              <div>
                <h2 style={{ margin: 0 }}>Form Pencatatan Instalasi / Penawaran Baru</h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Input data produk yang dipasang atau ditawarkan ke klien.</p>
              </div>
              <button className="close-btn" onClick={() => setModalOpen(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body" style={{ display: 'flex', gap: '24px', flexDirection: 'row', flexWrap: 'wrap', maxHeight: '70vh', overflowY: 'auto' }}>
                <div style={{ flex: 1, minWidth: '300px' }}>
                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label style={{ fontWeight: 700, color: '#0f172a' }}>Pilih Klien / Prospek Utama</label>
                    <select required className="form-control" style={{ border: '2px solid #e2e8f0' }} value={formData.companyId} onChange={e => setFormData({ ...formData, companyId: e.target.value })}>
                      <option value="">-- Pilih Company / Prospek --</option>
                      {companies.sort((a, b) => a.name.localeCompare(b.name)).map(c => <option value={c.id} key={c.id}>{c.name} ({c.type})</option>)}
                    </select>
                  </div>
                  {formData.companyId && (() => {
                    const existingProds = installations.filter(i => String(i.company_id) === String(formData.companyId) && !Number(i.is_history));
                    const historyCount = installations.filter(i => String(i.company_id) === String(formData.companyId) && Number(i.is_history) === 1).length;
                    return (
                      <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                          <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Database size={16} color="#0284c7" /> Produk Terpasang Saat Ini
                          </h4>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <span style={{ background: '#e0f2fe', color: '#0284c7', fontSize: '10px', padding: '3px 8px', borderRadius: '10px', fontWeight: 700 }}>{existingProds.length} Aktif</span>
                            {historyCount > 0 && <span style={{ background: '#f1f5f9', color: '#64748b', fontSize: '10px', padding: '3px 8px', borderRadius: '10px', fontWeight: 600 }}>{historyCount} Riwayat</span>}
                          </div>
                        </div>
                        {existingProds.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                            <Wrench size={28} style={{ opacity: 0.3, marginBottom: '8px' }} />
                            <p style={{ fontSize: '0.85rem', margin: 0, fontStyle: 'italic' }}>Belum ada produk aktif untuk klien ini.</p>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {existingProds.map(i => {
                              const diff = Math.ceil((new Date(i.replacement_date) - new Date()) / 86400000);
                              const urgent = diff <= 30 && i.status !== 'Done';
                              return (
                                <div key={i.id} style={{ padding: '12px 14px', background: 'white', border: urgent ? '1px solid #fecaca' : '1px solid #e2e8f0', borderRadius: '12px', borderLeft: urgent ? '4px solid #ef4444' : '4px solid #0ea5e9' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                    <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.85rem' }}>{i.product_name}</span>
                                    <span className={`badge ${i.status === 'Done' ? 'badge-success' : urgent ? 'badge-danger' : 'badge-info'}`} style={{ fontSize: '9px', padding: '2px 6px' }}>{i.status}</span>
                                  </div>
                                  <div style={{ display: 'flex', gap: '16px', fontSize: '0.75rem', color: '#64748b' }}>
                                    <span>Pasang: {i.installation_date || '-'}</span>
                                    <span style={{ color: urgent ? '#ef4444' : '#0284c7', fontWeight: 700 }}>
                                      Target: {i.replacement_date} ({diff < 0 ? `Lewat ${Math.abs(diff)}d` : `H-${diff}`})
                                    </span>
                                    <span>Siklus: {i.maintenance_cycle_value} {i.maintenance_cycle_unit}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
                <div style={{ flex: 1.5, minWidth: '400px' }}>
                  <div style={{ background: '#f0f9ff', padding: '20px', borderRadius: '12px', border: '1px solid #bae6fd' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h3 style={{ fontSize: '1.1rem', margin: 0, color: '#0369a1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <PlusCircle size={20} /> Input Produk Baru
                      </h3>
                      <span className="badge badge-info">{formData.products.length} Item</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {formData.products.map((prod, index) => (
                        <div key={index} style={{ background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #e0f2fe', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', position: 'relative' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                            <div className="form-group" style={{ margin: 0 }}>
                              <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Nama Produk / Tipe</label>
                              <input required className="form-control" style={{ fontSize: '0.875rem' }} placeholder='Mis: Filter Sediment 10"' value={prod.productName} onChange={e => updateProductRow(index, 'productName', e.target.value)} />
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                              <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Tgl Pasang</label>
                              <input className="form-control" style={{ fontSize: '0.875rem' }} type="date" value={prod.installationDate} onChange={e => updateProductRow(index, 'installationDate', e.target.value)} />
                            </div>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', alignItems: 'center' }}>
                            <div className="form-group" style={{ margin: 0 }}>
                              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0ea5e9' }}>Target Ganti Selanjutnya</label>
                              <input required className="form-control" style={{ fontSize: '0.875rem', borderColor: '#0ea5e9' }} type="date" value={prod.replacementDate} onChange={e => updateProductRow(index, 'replacementDate', e.target.value)} />
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                              <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Siklus Ulang</label>
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <input type="number" className="form-control" style={{ width: '60px', padding: '6px', fontSize: '0.875rem' }} value={prod.recurringValue} onChange={e => updateProductRow(index, 'recurringValue', e.target.value)} />
                                <select className="form-control" style={{ flex: 1, padding: '6px', fontSize: '0.875rem' }} value={prod.recurringUnit} onChange={e => updateProductRow(index, 'recurringUnit', e.target.value)}>
                                  <option value="days">Hari</option>
                                  <option value="months">Bulan</option>
                                  <option value="years">Tahun</option>
                                </select>
                              </div>
                            </div>
                          </div>
                          {formData.products.length > 1 && (
                            <button type="button" onClick={() => setFormData({ ...formData, products: formData.products.filter((_, i) => i !== index) })} style={{ position: 'absolute', top: '-10px', right: '-10px', width: '24px', height: '24px', borderRadius: '50%', background: '#ef4444', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button type="button" className="btn btn-secondary" style={{ width: '100%', marginTop: '16px', border: '2px dashed #bae6fd', background: 'white', color: '#0284c7', fontWeight: 600 }} onClick={() => setFormData({ ...formData, products: [...formData.products, getInitialProduct()] })}>
                      <Plus size={18} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Tambah Item Produk Lainnya
                    </button>
                  </div>
                </div>
              </div>
              <div className="modal-footer" style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={isSaving || !formData.companyId} style={{ minWidth: '200px', background: formData.companyId ? 'var(--primary)' : '#94a3b8' }}>
                  {isSaving ? <Loader2 size={18} className="spin" /> : <CheckCircle2 size={18} />} {isSaving ? 'Menyimpan...' : 'Simpan Seluruh Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editModal && editCompany && (
        <div className="modal-overlay" onClick={() => setEditModal(false)}>
          <div className="modal-content" style={{ maxWidth: '1000px', width: '95%' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
              <div>
                <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  Edit Produk: {editCompany.name}
                  <span className={`badge ${editCompany.type === 'Customer' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '11px' }}>{editCompany.type}</span>
                </h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Edit seluruh data produk untuk klien ini sekaligus.</p>
              </div>
              <button className="close-btn" onClick={() => setEditModal(false)}><X size={24} /></button>
            </div>
            <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {editItems.map((item, idx) => {
                  const diff = Math.ceil((new Date(item.replacement_date) - new Date()) / 86400000);
                  return (
                    <div key={item.id} style={{ background: '#f8fafc', padding: '20px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <span style={{ fontWeight: 700, color: '#0369a1', fontSize: '0.95rem' }}>#{idx + 1}</span>
                        <span style={{ fontSize: '0.75rem', color: diff < 0 ? '#ef4444' : '#64748b', fontWeight: 600 }}>
                          {diff < 0 ? `Overdue ${Math.abs(diff)}d` : `H - ${diff}`}
                        </span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Nama Produk</label>
                          <input required className="form-control" value={item.product_name} onChange={e => updateEditItem(idx, 'product_name', e.target.value)} />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Tgl Pasang</label>
                          <input type="date" className="form-control" value={item.installation_date || ''} onChange={e => updateEditItem(idx, 'installation_date', e.target.value)} />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0ea5e9' }}>Target Ganti</label>
                          <input required type="date" className="form-control" style={{ borderColor: '#0ea5e9' }} value={item.replacement_date || ''} onChange={e => updateEditItem(idx, 'replacement_date', e.target.value)} />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Siklus</label>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <input type="number" className="form-control" style={{ width: '60px', padding: '6px' }} value={item.maintenance_cycle_value || ''} onChange={e => updateEditItem(idx, 'maintenance_cycle_value', e.target.value)} />
                            <select className="form-control" style={{ flex: 1, padding: '6px' }} value={item.maintenance_cycle_unit || 'months'} onChange={e => updateEditItem(idx, 'maintenance_cycle_unit', e.target.value)}>
                              <option value="days">Hari</option><option value="months">Bulan</option><option value="years">Tahun</option>
                            </select>
                          </div>
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Status</label>
                          <select className="form-control" value={item.status || 'Scheduled'} onChange={e => updateEditItem(idx, 'status', e.target.value)}>
                            {STATUS_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}
                          </select>
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Tanggal Follow Up</label>
                          <input type="date" className="form-control" value={item.followup_date || ''} onChange={e => updateEditItem(idx, 'followup_date', e.target.value)} />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Catatan</label>
                          <input className="form-control" value={item.notes || ''} onChange={e => updateEditItem(idx, 'notes', e.target.value)} placeholder="Catatan..." />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="modal-footer" style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setEditModal(false)}>Batal</button>
              <button type="button" className="btn btn-primary" disabled={isSaving} onClick={handleBulkEditSave} style={{ minWidth: '200px' }}>
                {isSaving ? <Loader2 size={18} className="spin" /> : <CheckCircle2 size={18} />} {isSaving ? 'Menyimpan...' : `Simpan ${editItems.length} Perubahan`}
              </button>
            </div>
          </div>
        </div>
      )}

      {renewModal && renewData && (
        <div className="modal-overlay" onClick={() => setRenewModal(false)}>
          <div className="modal-content" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
              <div>
                <h2 style={{ margin: 0 }}>Perpanjang / Renew Produk</h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Produk lama akan diarsipkan ke History. Siklus baru akan dibuat.
                </p>
              </div>
              <button className="close-btn" onClick={() => setRenewModal(false)}><X size={24} /></button>
            </div>
            <div className="modal-body">
              <div style={{ background: '#eff6ff', padding: '14px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #bfdbfe' }}>
                <div style={{ fontSize: '0.85rem', color: '#1e40af' }}>
                  <strong>Produk:</strong> {renewData.product_name} &bull; <strong>Klien:</strong> {renewData.company_name}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontWeight: 600, fontSize: '0.8rem' }}>Nama Produk (baru)</label>
                  <input className="form-control" value={renewData.product_name} onChange={e => setRenewData({ ...renewData, product_name: e.target.value })} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontWeight: 600, fontSize: '0.8rem' }}>Tgl Pasang Baru</label>
                  <input type="date" className="form-control" value={renewData.installation_date} onChange={e => {
                    const d = e.target.value;
                    setRenewData({ ...renewData, installation_date: d, replacement_date: calculateNextDate(d, renewData.maintenance_cycle_value, renewData.maintenance_cycle_unit) });
                  }} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontWeight: 700, fontSize: '0.8rem', color: '#0ea5e9' }}>Target Ganti Berikutnya</label>
                  <input type="date" className="form-control" style={{ borderColor: '#0ea5e9' }} value={renewData.replacement_date} onChange={e => setRenewData({ ...renewData, replacement_date: e.target.value })} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontWeight: 600, fontSize: '0.8rem' }}>Siklus Ulang</label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <input type="number" className="form-control" style={{ width: '60px', padding: '6px' }} value={renewData.maintenance_cycle_value} onChange={e => {
                      const v = e.target.value;
                      setRenewData({ ...renewData, maintenance_cycle_value: v, replacement_date: calculateNextDate(renewData.installation_date, v, renewData.maintenance_cycle_unit) });
                    }} />
                    <select className="form-control" style={{ flex: 1, padding: '6px' }} value={renewData.maintenance_cycle_unit} onChange={e => {
                      const u = e.target.value;
                      setRenewData({ ...renewData, maintenance_cycle_unit: u, replacement_date: calculateNextDate(renewData.installation_date, renewData.maintenance_cycle_value, u) });
                    }}>
                      <option value="days">Hari</option><option value="months">Bulan</option><option value="years">Tahun</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="form-group" style={{ marginTop: '16px' }}>
                <label style={{ fontWeight: 600, fontSize: '0.8rem' }}>Catatan Perpanjangan</label>
                <textarea className="form-control" style={{ height: '70px' }} value={renewData.notes} onChange={e => setRenewData({ ...renewData, notes: e.target.value })} placeholder="Mis: Penggantian filter karena sudah kotor..." />
              </div>
            </div>
            <div className="modal-footer" style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setRenewModal(false)}>Batal</button>
              <button type="button" className="btn btn-primary" disabled={isSaving} onClick={handleRenew} style={{ background: '#2563eb' }}>
                {isSaving ? <Loader2 size={18} className="spin" /> : <CheckCircle2 size={18} />} {isSaving ? 'Memproses...' : 'Konfirmasi Renew'}
              </button>
            </div>
          </div>
        </div>
      )}

      <CompanyHistoryModal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        company={historyModalCompany}
        historyItems={historyModalItems}
      />
      <TransferModal
        isOpen={transferOpen}
        onClose={() => setTransferOpen(false)}
        companyId={transferTarget.companyId}
        companyName={transferTarget.companyName}
        fromUserId={transferTarget.fromUserId}
        fromUserName={transferTarget.fromUserName}
        currentUser={currentUser}
        onTransferDone={() => { setTransferOpen(false); reloadInstallations(); }}
      />
    </div>
  );
}



function InstallationPage({ installations, companies, regions, can, currentUser, setInstallations }) {
  const [filterCompanies, setFilterCompanies] = useState([]);
  const [companySearch, setCompanySearch] = useState('');
  const [editModal, setEditModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  // Transfer state
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferTarget, setTransferTarget] = useState({ companyId: '', companyName: '', fromUserId: '', fromUserName: '' });

  if (!can('installation_read')) return <div className="page-container"><h1 className="page-title">⛔ Akses Ditolak</h1></div>;

  const reloadInstallations = async () => {
    try {
      const hasShowAll = can('installation_showall');
      const resL = await fetch(`${import.meta.env.VITE_API_URL}/installations.php?action=list&user_id=${currentUser.id}&show_all=${hasShowAll}`);
      const jsonL = await resL.json();
      if (jsonL.status === 'success') setInstallations(jsonL.data);
    } catch (e) { console.error(e); }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/installations.php?action=update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus, user_id: currentUser?.id })
      });
      const d = await res.json();
      if (d.status === 'success') {
        setInstallations(prev => prev.map(i => i.id === id ? { ...i, status: newStatus, last_editor_name: currentUser?.username } : i));
      }
    } catch (e) { console.error(e); }
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/installations.php?action=update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editData.id,
          status: editData.status,
          replacementDate: editData.replacement_date,
          notes: editData.notes,
          user_id: currentUser?.id
        })
      });
      const d = await res.json();
      if (d.status === 'success') {
        setInstallations(prev => prev.map(i => i.id === editData.id ? { ...i, ...editData, last_editor_name: currentUser?.username } : i));
        setEditModal(false);
      } else {
        alert(d.message);
      }
    } catch (e) { console.error(e); } finally { setIsSaving(false); }
  };

  const filteredData = installations.filter(i => {
    if (Number(i.is_history) === 1) return false;
    if (filterCompanies.length > 0 && !filterCompanies.includes(String(i.company_id))) return false;
    return true;
  });

  const columns = [
    {
      header: 'Klien', accessor: 'company_name', render: (row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.company_name}</div>
          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{row.region} | {row.company_type}</div>
        </div>
      )
    },
    {
      header: 'Produk Terpasang', accessor: 'product_name', render: (row) => (
        <strong style={{ color: '#0369a1' }}>{row.product_name}</strong>
      )
    },
    { header: 'Tgl Instalasi', accessor: 'installation_date' },
    {
      header: 'Siklus Ganti', render: (row) => (
        <span>Tiap {row.maintenance_cycle_value} {row.maintenance_cycle_unit}</span>
      )
    },
    {
      header: 'Target Selanjutnya', accessor: 'replacement_date', render: (row) => {
        const diff = Math.ceil((new Date(row.replacement_date) - new Date()) / (1000 * 60 * 60 * 24));
        return (
          <div style={{ color: diff < 0 ? '#ef4444' : diff <= 30 ? '#f59e0b' : 'inherit' }}>
            <div style={{ fontWeight: 600 }}>{row.replacement_date}</div>
            <div style={{ fontSize: '0.75rem' }}>{diff < 0 ? `Overdue ${Math.abs(diff)}d` : `H - ${diff} Hari`}</div>
          </div>
        );
      }
    },
    {
      header: 'Status', accessor: 'status', render: (row) => (
        can('installation_update') ? (
          <select className="form-control" style={{ width: '155px', padding: '4px', fontSize: '0.75rem' }} value={row.status} onChange={(e) => updateStatus(row.id, e.target.value)}>
            {STATUS_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}
          </select>
        ) : (
          <span className={`badge ${row.status === 'Done' ? 'badge-success' : 'badge-info'}`}>{row.status}</span>
        )
      )
    },
    {
      header: 'PIC Sales', render: (row) => (
        <div style={{ fontSize: '11px' }}>
          <div style={{ fontWeight: 600, color: '#0369a1' }}>{row.assigned_to_name || '-'}</div>
          <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '2px' }}>Oleh: {row.creator_name || '-'}</div>
        </div>
      )
    },
    {
      header: 'Aksi', render: (row) => (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {can('installation_update') && (
            <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => { setEditData({ ...row }); setEditModal(true); }}>Edit</button>
          )}
          {(can('installation_transfer') || can('installation_update')) && (
            <button className="btn" style={{ padding: '4px 10px', fontSize: '11px', background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }} onClick={() => { setTransferTarget({ companyId: row.company_id, companyName: row.company_name, fromUserId: row.assigned_to, fromUserName: row.assigned_to_name, installationId: row.id }); setTransferOpen(true); }}>🔄 Transfer</button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '16px', flexWrap: 'wrap' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Monitoring Data Instalasi Aktif</h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'stretch', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', flexWrap: 'wrap', flex: 1, minWidth: '220px' }}>
            <Filter size={16} color="#64748b" />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {filterCompanies.map(cid => {
                const c = companies.find(comp => String(comp.id) === cid);
                return (
                  <span key={cid} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#e0f2fe', color: '#0369a1', fontSize: '11px', padding: '2px 6px', borderRadius: '4px' }}>
                    {c?.name || cid}
                    <button onClick={() => setFilterCompanies(filterCompanies.filter(id => id !== cid))} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}><X size={12} /></button>
                  </span>
                );
              })}
            </div>
            <input list="inst-company-list" className="form-control" style={{ border: 'none', padding: '8px 12px', fontSize: '0.875rem', flex: 1, minWidth: '140px' }} placeholder="Filter Company..." value={companySearch} onChange={e => {
              setCompanySearch(e.target.value);
              const found = companies.find(c => c.name.toLowerCase() === e.target.value.toLowerCase());
              if (found && !filterCompanies.includes(String(found.id))) {
                setFilterCompanies([...filterCompanies, String(found.id)]);
                setCompanySearch('');
              }
            }} />
            <datalist id="inst-company-list">{companies.map(c => <option key={c.id} value={c.name} />)}</datalist>
          </div>
        </div>
      </div>

      <div className="card-view" style={{ padding: '20px' }}>
        <DataTable data={filteredData} columns={columns} fileName="active-installations" />
      </div>

      {editModal && editData && (
        <div className="modal-overlay" onClick={() => setEditModal(false)}>
          <div className="modal-content" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Detail Instalasi</h2>
              <button className="close-btn" onClick={() => setEditModal(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleEditSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Produk</label>
                  <input className="form-control" value={editData.product_name} disabled style={{ background: '#f1f5f9' }} />
                </div>
                <div className="form-group">
                  <label>Company</label>
                  <input className="form-control" value={editData.company_name} disabled style={{ background: '#f1f5f9' }} />
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Status</label>
                    <select className="form-control" value={editData.status} onChange={e => setEditData({ ...editData, status: e.target.value })}>
                      {STATUS_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label style={{ color: '#0ea5e9', fontWeight: 600 }}>Target Penggantian</label>
                    <input type="date" className="form-control" value={editData.replacement_date} onChange={e => setEditData({ ...editData, replacement_date: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Catatan / Notes</label>
                  <textarea className="form-control" style={{ height: '80px' }} value={editData.notes || ''} onChange={e => setEditData({ ...editData, notes: e.target.value })} placeholder="Tambahkan catatan..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      <TransferModal
        isOpen={transferOpen}
        onClose={() => setTransferOpen(false)}
        companyId={transferTarget.companyId}
        companyName={transferTarget.companyName}
        fromUserId={transferTarget.fromUserId}
        fromUserName={transferTarget.fromUserName}
        currentUser={currentUser}
        onTransferDone={reloadInstallations}
      />
    </div>
  );
}

function ProspectingPage({ installations, can, regions, currentUser, onAssignmentDone }) {
  const [regionFilter, setRegionFilter] = useState('');
  const [picFilter, setPicFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [visitDate, setVisitDate] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [expandedCompanies, setExpandedCompanies] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [regionFilter, picFilter]);

  if (!can('prospecting_read')) return <div className="page-container"><h1 className="page-title">⛔ Akses Ditolak</h1><p>Anda tidak memiliki otoritas <code>prospecting_read</code>.</p></div>;

  const activeInstallations = useMemo(() => installations.filter(i => {
    if (Number(i.is_history) === 1) return false;
    if (!showInactive && (i.status_active === '0' || Number(i.status_active) === 0)) return false;
    if (regionFilter && i.region !== regionFilter) return false;
    if (picFilter === '__unassigned__' && i.assigned_to) return false;
    if (picFilter && picFilter !== '__unassigned__' && String(i.assigned_to || '') !== picFilter) return false;
    return true;
  }), [installations, showInactive, regionFilter, picFilter]);

  const picOptions = useMemo(() => {
    const seen = new globalThis.Map();
    activeInstallations.forEach(inst => {
      const key = inst.assigned_to ? String(inst.assigned_to) : '__unassigned__';
      const label = inst.assigned_to_name || 'Unassigned';
      if (!seen.has(key)) seen.set(key, { value: key, label });
    });
    return Array.from(seen.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [activeInstallations]);

  const groupedByCompany = useMemo(() => {
    const groups = {};
    activeInstallations.forEach(inst => {
      if (searchTerm && !inst.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) && !inst.product_name?.toLowerCase().includes(searchTerm.toLowerCase())) return;
      const cid = inst.company_id;
      if (!groups[cid]) {
        groups[cid] = {
          company: { id: cid, name: inst.company_name, type: inst.company_type, region: inst.region },
          items: [], activeCount: 0, inactiveCount: 0
        };
      }
      groups[cid].items.push(inst);
      if (inst.status_active === '0' || Number(inst.status_active) === 0) groups[cid].inactiveCount++;
      else groups[cid].activeCount++;
    });
    return Object.values(groups).sort((a, b) => a.company.name.localeCompare(b.company.name));
  }, [activeInstallations, searchTerm]);

  const ITEMS_PER_PAGE = 10;
  const currentGroups = groupedByCompany.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const toggleExpand = (companyId) => {
    setExpandedCompanies(prev => ({ ...prev, [companyId]: !prev[companyId] }));
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectCompany = (items) => {
    const ids = items.map(i => i.id);
    const allSelected = ids.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !ids.includes(id)));
    } else {
      setSelectedIds(prev => [...new Set([...prev, ...ids])]);
    }
  };

  const handleBulkAssign = async (e) => {
    e.preventDefault();
    if (!visitDate) return alert('Tentukan tanggal kunjungan terlebih dahulu.');
    setIsAssigning(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/installations.php?action=bulk_schedule_visit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          installation_ids: selectedIds,
          visit_date: visitDate,
          user_id: currentUser.id
        })
      });
      const d = await res.json();
      if (d.status === 'success') {
        alert(d.message);
        setSelectedIds([]);
        setVisitDate('');
        setAssignModalOpen(false);
        if (onAssignmentDone) onAssignmentDone();
      } else {
        alert(d.message);
      }
    } catch (e) { console.error(e); } finally { setIsAssigning(false); }
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Smart Prospecting & Routing</h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'stretch', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem', color: '#64748b', background: 'white', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#0ea5e9' }} />
            Tampilkan Nonaktif
          </label>
          <select className="form-control" style={{ padding: '8px 12px', fontSize: '0.875rem', minWidth: '180px' }} value={regionFilter} onChange={e => setRegionFilter(e.target.value)}>
            <option value="">Semua Wilayah...</option>
            {regions.map(r => <option key={r.id} value={r.region_name}>{r.region_name}</option>)}
          </select>
          <select className="form-control" style={{ padding: '8px 12px', fontSize: '0.875rem', minWidth: '180px' }} value={picFilter} onChange={e => setPicFilter(e.target.value)}>
            <option value="">Semua PIC...</option>
            {picOptions.map(opt => <option key={opt.value || opt.label} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="stat-card">
          <div className="stat-icon"><Database size={24} /></div>
          <div className="stat-content"><h3>Total Klien</h3><p>{groupedByCompany.length}</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Wrench size={24} /></div>
          <div className="stat-content"><h3>Total Produk Aktif</h3><p>{activeInstallations.length}</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#dcfce7', color: '#16a34a' }}><CheckCircle2 size={24} /></div>
          <div className="stat-content"><h3>Selesai (Done)</h3><p>{activeInstallations.filter(i => i.status === 'Done').length}</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#fee2e2', color: '#ef4444' }}><AlertCircle size={24} /></div>
          <div className="stat-content"><h3>Akan Habis (30d)</h3><p>{activeInstallations.filter(i => { const d = Math.ceil((new Date(i.replacement_date) - new Date()) / 86400000); return d <= 30 && i.status !== 'Done'; }).length}</p></div>
        </div>
      </div>

      {selectedIds.length > 0 && can('prospecting_assign') && (
        <div style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', padding: '14px 20px', borderRadius: '14px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #93c5fd' }}>
          <span style={{ fontWeight: 700, color: '#1e40af' }}>{selectedIds.length} item terpilih</span>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '0.85rem', borderRadius: '10px' }} onClick={() => setAssignModalOpen(true)}>
              <Send size={16} /> Atur Jadwal Kunjungan
            </button>
            <button className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem', borderRadius: '10px' }} onClick={() => setSelectedIds([])}>Batal Pilih</button>
          </div>
        </div>
      )}

      <div className="card-view" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input className="form-control" style={{ padding: '12px 14px 12px 40px', width: '100%' }} placeholder="Cari klien atau produk..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
          </div>
          <span style={{ fontSize: '0.85rem', color: '#64748b', alignSelf: 'center' }}>Menampilkan {groupedByCompany.length} klien</span>
        </div>

        {currentGroups.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
            <Database size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
            <p style={{ margin: 0 }}>Tidak ada data ditemukan.</p>
          </div>
        ) : currentGroups.map(group => {
          const isExpanded = expandedCompanies[group.company.id];
          const companySelected = group.items.every(i => selectedIds.includes(i.id));
          const nearExpiry = group.items.filter(i => { const d = Math.ceil((new Date(i.replacement_date) - new Date()) / 86400000); return d <= 30 && i.status !== 'Done'; }).length;
          return (
            <div key={group.company.id} style={{ borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '16px', overflow: 'hidden', background: 'white' }}>
              <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: isExpanded ? '#f8fafc' : 'white' }} onClick={() => toggleExpand(group.company.id)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  <div style={{ color: '#0f172a' }}>{isExpanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <h3 style={{ margin: 0, fontSize: '1rem', color: '#0f172a' }}>{group.company.name}</h3>
                      <span className={`badge ${group.company.type === 'Customer' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '10px' }}>{group.company.type}</span>
                      {nearExpiry > 0 && <span className="badge badge-danger" style={{ fontSize: '10px' }}>{nearExpiry} Akan Habis</span>}
                      {group.inactiveCount > 0 && <span className="badge badge-secondary" style={{ fontSize: '10px' }}>{group.inactiveCount} Non-Aktif</span>}
                    </div>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}><MapPin size={14} style={{ marginRight: '4px' }} />{group.company.region} | {group.items.length} Produk</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  {can('prospecting_assign') && (
                    <input type="checkbox" checked={companySelected} onClick={e => e.stopPropagation()} onChange={() => toggleSelectCompany(group.items)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                  )}
                </div>
              </div>
              {isExpanded && (
                <div style={{ borderTop: '1px solid #e2e8f0' }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table" style={{ margin: 0 }}>
                      <thead style={{ background: '#f8fafc' }}>
                        <tr>
                          {can('prospecting_assign') && <th style={{ width: '40px' }}></th>}
                          <th>Produk</th>
                          <th>Tgl Instalasi</th>
                          <th>Siklus</th>
                          <th>Target Ganti</th>
                          <th>Tgl Follow Up</th>
                          <th>Visit Schedule</th>
                          <th>Status</th>
                          <th>Status Data</th>
                          <th>PIC Sales</th>
                          <th>Audit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.items.map(row => {
                          const diff = Math.ceil((new Date(row.replacement_date) - new Date()) / 86400000);
                          const isInactive = row.status_active === '0' || Number(row.status_active) === 0;
                          return (
                            <tr key={row.id} style={{ opacity: isInactive ? 0.5 : 1 }}>
                              {can('prospecting_assign') && <td><input type="checkbox" checked={selectedIds.includes(row.id)} onChange={() => toggleSelect(row.id)} /></td>}
                              <td><strong style={{ color: '#0369a1' }}>{row.product_name}</strong></td>
                              <td>{row.installation_date || '-'}</td>
                              <td>Tiap {row.maintenance_cycle_value} {row.maintenance_cycle_unit}</td>
                              <td>
                                <div style={{ color: diff < 0 ? '#ef4444' : diff <= 30 ? '#f59e0b' : 'inherit' }}>
                                  <div style={{ fontWeight: 600 }}>{row.replacement_date}</div>
                                  <div style={{ fontSize: '0.75rem' }}>{diff < 0 ? `Overdue ${Math.abs(diff)}d` : `H - ${diff}`}</div>
                                </div>
                              </td>
                              <td>{row.followup_date || '-'}</td>
                              <td>{row.visit_schedule_date || '-'}</td>
                              <td><span className={`badge ${row.status === 'Done' ? 'badge-success' : row.status === 'Skip' ? 'badge-danger' : 'badge-info'}`}>{row.status}</span></td>
                              <td><span className={`badge ${isInactive ? 'badge-danger' : 'badge-success'}`}>{isInactive ? 'Non-Aktif' : 'Aktif'}</span></td>
                              <td><div style={{ fontWeight: 600, color: '#0369a1', fontSize: '0.85rem' }}>{row.assigned_to_name || '-'}</div></td>
                              <td><div style={{ fontSize: '10px', color: '#94a3b8' }}><div>Oleh: {row.creator_name || '-'}</div><div>Ubah: {row.last_editor_name || '-'}</div></div></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <Pagination totalItems={groupedByCompany.length} itemsPerPage={ITEMS_PER_PAGE} currentPage={currentPage} onPageChange={setCurrentPage} />
      </div>

      {assignModalOpen && (
        <div className="modal-overlay" onClick={() => setAssignModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Atur Jadwal Kunjungan</h2>
              <button className="close-btn" onClick={() => setAssignModalOpen(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleBulkAssign}>
              <div className="modal-body">
                <p style={{ marginBottom: '20px', color: 'var(--text-muted)' }}>Anda akan menjadwalkan <strong>{selectedIds.length} item tugas</strong>.</p>
                <div className="form-group">
                  <label>Tentukan Tanggal Kunjungan</label>
                  <input required type="date" className="form-control" value={visitDate} onChange={e => setVisitDate(e.target.value)} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setAssignModalOpen(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={isAssigning}>
                  {isAssigning ? 'Memproses...' : 'Konfirmasi Jadwal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function WorkOrderPage({ installations, setInstallations, companies, can, currentUser }) {
  const [lifecycleFilter, setLifecycleFilter] = useState('ALL');
  const [filterRegions, setFilterRegions] = useState([]);
  const [regionSearch, setRegionSearch] = useState('');
  const [filterCompanies, setFilterCompanies] = useState([]);
  const [companySearch, setCompanySearch] = useState('');


  // --- Renew Modal State ---
  const [renewModalOpen, setRenewModalOpen] = useState(false);
  const [renewSaving, setRenewSaving] = useState(false);
  const [renewStatusMsg, setRenewStatusMsg] = useState(null);
  // --- Transfer State ---
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferTarget, setTransferTarget] = useState({ companyId: '', companyName: '', fromUserId: '', fromUserName: '' });
  const [renewForm, setRenewForm] = useState({
    id: '', companyName: '', currentProductName: '', currentInstallDate: '', currentReplacementDate: '', currentCycleValue: '', currentCycleUnit: '',
    newProductName: '', newInstallDate: '', newReplacementDate: '', newCycleValue: '1', newCycleUnit: 'years', renewNotes: ''
  });

  if (!can('workorder_read')) return <div className="page-container"><h1 className="page-title">⛔ Akses Ditolak</h1></div>;

  const filteredData = installations.filter(i => {
    if (i.is_history || Number(i.is_history) === 1) return false;

    if (filterCompanies.length > 0 && !filterCompanies.includes(String(i.company_id))) return false;

    if (lifecycleFilter === 'URGENT') {
      const diffDays = Math.ceil((new Date(i.replacement_date) - new Date()) / (1000 * 60 * 60 * 24));
      if (diffDays > 30 || i.status === 'Done') return false;
    }
    return true;
  });

  const reloadInstallations = async () => {
    try {
      const hasShowAll = can('workorder_showall');
      const resL = await fetch(`${import.meta.env.VITE_API_URL}/installations.php?action=list&user_id=${currentUser.id}&show_all=${hasShowAll}`);
      const jsonL = await resL.json();
      if (jsonL.status === 'success') setInstallations(jsonL.data);
    } catch (e) { console.error(e); }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/installations.php?action=update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus, user_id: currentUser.id })
      });
      const d = await res.json();
      if (d.status === 'success') {
        setInstallations(prev => prev.map(i => i.id === id ? { ...i, status: newStatus } : i));
      }
    } catch (e) { console.error(e); }
  };

  const updateNotes = async (id, newNotes) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/installations.php?action=update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, notes: newNotes, user_id: currentUser.id })
      });
      const d = await res.json();
      if (d.status === 'success') {
        setInstallations(prev => prev.map(i => i.id === id ? { ...i, notes: newNotes } : i));
      }
    } catch (e) { console.error(e); }
  };


  // --- Open Renew Form ---
  const openRenewForm = (id) => {
    const current = installations.find(i => String(i.id) === String(id));
    if (!current) return;
    let baseDate = current.replacement_date;
    if (new Date(baseDate) < new Date(new Date().toDateString())) {
      baseDate = getLocalDateString();
    }
    const cycleUnit = current.maintenance_cycle_unit?.toLowerCase() || 'years';
    const cycleVal = current.maintenance_cycle_value || '1';
    const autoNextDate = calculateNextDate(baseDate, cycleVal, cycleUnit);
    const comp = companies.find(c => Number(c.id) === Number(current.company_id));
    setRenewForm({
      id: current.id,
      companyName: comp?.name || `Company #${current.company_id}`,
      currentProductName: current.product_name,
      currentInstallDate: current.installation_date || '-',
      currentReplacementDate: current.replacement_date,
      currentCycleValue: cycleVal,
      currentCycleUnit: cycleUnit,
      newProductName: current.product_name,
      newInstallDate: getLocalDateString(),
      newReplacementDate: autoNextDate || getLocalDateString(),
      newCycleValue: cycleVal,
      newCycleUnit: cycleUnit,
      renewNotes: ''
    });
    setRenewStatusMsg(null);
    setRenewModalOpen(true);
  };

  // Auto-recalculate target date when cycle or install date changes in renew form
  const updateRenewField = (field, val) => {
    const updated = { ...renewForm, [field]: val };
    if (field === 'newCycleValue' || field === 'newCycleUnit' || field === 'newInstallDate') {
      const base = updated.newInstallDate || getLocalDateString();
      updated.newReplacementDate = calculateNextDate(base, updated.newCycleValue, updated.newCycleUnit);
    }
    setRenewForm(updated);
  };

  // --- Submit Renew ---
  const handleRenewSubmit = async (e) => {
    e.preventDefault();
    setRenewSaving(true);
    setRenewStatusMsg(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/installations.php?action=renew`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: renewForm.id,
          nextDate: renewForm.newReplacementDate,
          newProductName: renewForm.newProductName,
          newInstallDate: renewForm.newInstallDate,
          newCycleValue: renewForm.newCycleValue,
          newCycleUnit: renewForm.newCycleUnit,
          renewNotes: renewForm.renewNotes,
          user_id: currentUser.id
        })
      });
      const d = await res.json();
      if (d.status === 'success') {
        setRenewStatusMsg('✅ Perpanjangan berhasil! Siklus baru telah dibuat.');
        await reloadInstallations();
        setTimeout(() => { setRenewModalOpen(false); setRenewStatusMsg(null); }, 1800);
      } else {
        setRenewStatusMsg('❌ ' + d.message);
      }
    } catch (e) {
      setRenewStatusMsg('❌ Gagal menghubungi server.');
      console.error(e);
    } finally { setRenewSaving(false); }
  };

  const columns = [
    {
      header: 'Company', accessor: 'company_name', render: (row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.company_name}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{row.region}</div>
        </div>
      )
    },
    {
      header: 'Produk/Item', accessor: 'product_name', render: (row) => (
        <div>
          <div style={{ fontWeight: 500 }}>{row.product_name}</div>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Recurring: {row.maintenance_cycle_value} {row.maintenance_cycle_unit}</div>
        </div>
      )
    },
    { header: 'Tgl Pasang', accessor: 'installation_date' },
    {
      header: 'Target Ganti', accessor: 'replacement_date', render: (row) => {
        const diffDays = Math.ceil((new Date(row.replacement_date) - new Date()) / (1000 * 60 * 60 * 24));
        return (
          <div style={{ color: diffDays <= 7 ? '#ef4444' : diffDays <= 30 ? '#f59e0b' : 'inherit' }}>
            <div style={{ fontWeight: 600 }}>{row.replacement_date}</div>
            <div style={{ fontSize: '0.75rem' }}>{diffDays < 0 ? `Terlewat ${Math.abs(diffDays)} hari!` : diffDays === 0 ? 'HARI INI!' : `H - ${diffDays}`}</div>
          </div>
        );
      }
    },
    {
      header: 'Status', accessor: 'status', render: (row) => (
        <select className="form-control" style={{ width: '130px', padding: '4px', fontSize: '0.75rem' }} value={row.status} onChange={(e) => updateStatus(row.id, e.target.value)}>
          {STATUS_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}
        </select>
      )
    },
    {
      header: 'Notes', render: (row) => (
        <textarea className="form-control" style={{ fontSize: '0.7rem', height: '40px', minWidth: '120px' }} value={row.notes || ''} onChange={(e) => updateNotes(row.id, e.target.value)} placeholder="Catatan..." />
      )
    },
    {
      header: 'PIC Sales', render: (row) => (
        <div style={{ fontSize: '11px' }}>
          <div style={{ fontWeight: 600, color: '#0369a1' }}>{row.assigned_to_name || '-'}</div>
          <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '2px' }}>Oleh: {row.creator_name || '-'}</div>
        </div>
      )
    },
    {
      header: 'Aksi', render: (row) => (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" style={{ padding: '5px 10px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => openRenewForm(row.id)}>🔄 Renew</button>
          {(can('installation_transfer') || can('installation_update')) && (
            <button className="btn" style={{ padding: '5px 10px', fontSize: '0.7rem', background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => { setTransferTarget({ companyId: row.company_id, companyName: row.company_name, fromUserId: row.assigned_to, fromUserName: row.assigned_to_name, installationId: row.id }); setTransferOpen(true); }}>🔄 Transfer</button>
          )}
        </div>
      )
    }
  ];

  // Determine current data scope indicator
  const hasShowAll = can('workorder_showall');

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>Work Order & Lifecycle</h1>
          <div style={{ marginTop: '6px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {hasShowAll ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f0fdf4', color: '#15803d', padding: '3px 10px', borderRadius: '6px', border: '1px solid #bbf7d0', fontWeight: 600 }}>
                <Eye size={14} /> Menampilkan Semua Data (Show All)
              </span>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fef3c7', color: '#92400e', padding: '3px 10px', borderRadius: '6px', border: '1px solid #fde68a', fontWeight: 600 }}>
                <Filter size={14} /> Hanya Data Tim Anda
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
            <button className={`btn ${lifecycleFilter === 'ALL' ? 'btn-primary' : ''}`} style={lifecycleFilter === 'ALL' ? { fontSize: '12px', padding: '6px 12px' } : { background: 'transparent', color: 'var(--text-muted)', boxShadow: 'none', fontSize: '12px', padding: '6px 12px' }} onClick={() => setLifecycleFilter('ALL')}>Semua</button>
            <button className={`btn ${lifecycleFilter === 'URGENT' ? 'btn-primary' : ''}`} style={lifecycleFilter === 'URGENT' ? { background: '#ef4444', fontSize: '12px', padding: '6px 12px' } : { background: 'transparent', color: 'var(--text-muted)', boxShadow: 'none', fontSize: '12px', padding: '6px 12px' }} onClick={() => setLifecycleFilter('URGENT')}>Akan Habis</button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', padding: '4px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
            <Filter size={16} color="#64748b" />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {filterCompanies.map(cid => {
                const c = companies.find(comp => String(comp.id) === cid);
                return (
                  <span key={cid} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#e0f2fe', color: '#0369a1', fontSize: '11px', padding: '2px 6px', borderRadius: '4px' }}>
                    {c?.name || cid}
                    <button onClick={() => setFilterCompanies(filterCompanies.filter(id => id !== cid))} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}><X size={12} /></button>
                  </span>
                );
              })}
            </div>
            <input list="wo-company-list" className="form-control" style={{ border: 'none', padding: '4px', fontSize: '13px', width: '130px' }} placeholder="Filter Company..." value={companySearch} onChange={e => {
              setCompanySearch(e.target.value);
              const found = companies.find(c => c.name.toLowerCase() === e.target.value.toLowerCase());
              if (found && !filterCompanies.includes(String(found.id))) { setFilterCompanies([...filterCompanies, String(found.id)]); setCompanySearch(''); }
            }} />
            <datalist id="wo-company-list">{companies.map(c => <option key={c.id} value={c.name} />)}</datalist>
          </div>


        </div>
      </div>

      <div className="card-view">
        <DataTable data={filteredData} columns={columns} fileName="work-orders" />
      </div>


      {/* === RENEW MODAL FORM === */}
      {renewModalOpen && (
        <div className="modal-overlay" onClick={() => setRenewModalOpen(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="modal-content" style={{ maxWidth: '640px', width: '100%' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
              <div>
                <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>🔄 Form Perpanjangan (Renew)</h2>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>{renewForm.companyName}</div>
              </div>
              <button className="close-btn" onClick={() => setRenewModalOpen(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleRenewSubmit}>
              <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
                {/* Current Info Summary */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>📋 Data Siklus Saat Ini (Akan diarsipkan)</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div style={{ fontSize: '0.85rem' }}><span style={{ color: '#94a3b8' }}>Produk:</span> <strong>{renewForm.currentProductName}</strong></div>
                    <div style={{ fontSize: '0.85rem' }}><span style={{ color: '#94a3b8' }}>Tgl Pasang:</span> <strong>{renewForm.currentInstallDate}</strong></div>
                    <div style={{ fontSize: '0.85rem' }}><span style={{ color: '#94a3b8' }}>Target Ganti:</span> <strong style={{ color: new Date(renewForm.currentReplacementDate) < new Date() ? '#ef4444' : '#0369a1' }}>{renewForm.currentReplacementDate}</strong></div>
                    <div style={{ fontSize: '0.85rem' }}><span style={{ color: '#94a3b8' }}>Siklus:</span> <strong>{renewForm.currentCycleValue} {renewForm.currentCycleUnit}</strong></div>
                  </div>
                </div>

                {/* New Cycle Form */}
                <div style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', border: '1px solid #bae6fd', borderRadius: '10px', padding: '20px' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' }}>🆕 Data Siklus Baru</div>

                  <div className="form-group" style={{ marginBottom: '14px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Nama Produk (Siklus Baru)</label>
                    <input required className="form-control" type="text" value={renewForm.newProductName} onChange={e => updateRenewField('newProductName', e.target.value)} placeholder="Nama produk baru atau tetap sama" />
                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>Kosongkan jika produk tidak berubah.</div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                    <div className="form-group">
                      <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Tanggal Pasang Baru</label>
                      <input required className="form-control" type="date" value={renewForm.newInstallDate} onChange={e => updateRenewField('newInstallDate', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0ea5e9' }}>Target Ganti Selanjutnya</label>
                      <input required className="form-control" type="date" value={renewForm.newReplacementDate} onChange={e => updateRenewField('newReplacementDate', e.target.value)} style={{ borderColor: '#0ea5e9' }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'white', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '14px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0369a1', whiteSpace: 'nowrap' }}>⏲ Siklus Recurring:</span>
                    <input type="number" min="1" required className="form-control" style={{ width: '80px', padding: '6px' }} value={renewForm.newCycleValue} onChange={e => updateRenewField('newCycleValue', e.target.value)} />
                    <select className="form-control" style={{ width: '120px', padding: '6px' }} value={renewForm.newCycleUnit} onChange={e => updateRenewField('newCycleUnit', e.target.value)}>
                      <option value="days">Hari</option>
                      <option value="months">Bulan</option>
                      <option value="years">Tahun</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Catatan Perpanjangan (Opsional)</label>
                    <textarea className="form-control" style={{ height: '70px', resize: 'vertical' }} value={renewForm.renewNotes} onChange={e => updateRenewField('renewNotes', e.target.value)} placeholder="Mis: Customer upgrade ke produk premium, garansi 2 tahun..." />
                  </div>
                </div>

                {renewStatusMsg && (
                  <div style={{ marginTop: '16px', padding: '12px', borderRadius: '8px', background: renewStatusMsg.startsWith('✅') ? '#ecfdf5' : '#fef2f2', color: renewStatusMsg.startsWith('✅') ? '#059669' : '#dc2626', fontSize: '0.875rem', fontWeight: 500, border: `1px solid ${renewStatusMsg.startsWith('✅') ? '#86efac' : '#fecaca'}` }}>
                    {renewStatusMsg}
                  </div>
                )}
              </div>
              <div className="modal-footer" style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setRenewModalOpen(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={renewSaving} style={{ background: '#10b981', minWidth: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  {renewSaving ? <><Loader2 size={16} className="spin" /> Memproses...</> : '🔄 Perpanjang Siklus'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      <TransferModal
        isOpen={transferOpen}
        onClose={() => setTransferOpen(false)}
        companyId={transferTarget.companyId}
        companyName={transferTarget.companyName}
        fromUserId={transferTarget.fromUserId}
        fromUserName={transferTarget.fromUserName}
        currentUser={currentUser}
        onTransferDone={reloadInstallations}
      />
    </div>
  );
}

function HistoryPage({ installations, companies, can, regions, currentUser }) {
  const [search, setSearch] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [companyLogs, setCompanyLogs] = useState({});
  const [isExportingHistory, setIsExportingHistory] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyModalCompany, setHistoryModalCompany] = useState(null);
  const [historyModalItems, setHistoryModalItems] = useState([]);
  const [historyData, setHistoryData] = useState({ installations: null, companies: null });
  const fetchedRef = useRef(new Set());

  const canHistoryShowAll = can('history_showall') || can('all_access');
  const historyInstallations = historyData.installations || installations;
  const historyCompanies = historyData.companies || companies;

  useEffect(() => { setCurrentPage(1); }, [search, filterRegion]);

  useEffect(() => {
    if (!currentUser?.id) return;

    let cancelled = false;
    const showAll = canHistoryShowAll;

    Promise.all([
      fetch(`${import.meta.env.VITE_API_URL}/installations.php?action=list&user_id=${currentUser.id}&show_all=${showAll}`).then(r => r.json()),
      fetch(`${import.meta.env.VITE_API_URL}/companies.php?action=list&user_id=${currentUser.id}&show_all=${showAll}`).then(r => r.json())
    ]).then(([installationsJson, companiesJson]) => {
      if (cancelled) return;

      setHistoryData(prev => ({
        installations: installationsJson.status === 'success' ? installationsJson.data : prev.installations,
        companies: companiesJson.status === 'success' ? companiesJson.data : prev.companies
      }));
    }).catch(err => {
      console.error('Failed to fetch history scoped data:', err);
    });

    return () => { cancelled = true; };
  }, [currentUser?.id, canHistoryShowAll]);

  const historicalGroups = useMemo(() => {
    const list = historyInstallations.filter(i => {
      if (!Number(i.is_history)) return false;
      const comp = historyCompanies.find(c => Number(c.id) === Number(i.company_id));
      if (!comp) return false;
      const searchMatch = comp.name.toLowerCase().includes(search.toLowerCase()) || (i.product_name || '').toLowerCase().includes(search.toLowerCase());
      if (!searchMatch) return false;
      if (filterRegion && comp.region_name !== filterRegion) return false;
      return true;
    });

    const groups = {};
    list.forEach(i => {
      const comp = historyCompanies.find(c => Number(c.id) === Number(i.company_id));
      if (!groups[i.company_id]) groups[i.company_id] = { company: comp, items: [] };
      groups[i.company_id].items.push(i);
    });

    return Object.values(groups).sort((a, b) => b.items.length - a.items.length);
  }, [historyInstallations, historyCompanies, search, filterRegion]);

  const currentData = historicalGroups.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const loadLogsForCompanies = async (companyIds) => {
    const uniqueIds = Array.from(new globalThis.Map(
      companyIds.filter(Boolean).map(id => [String(id), id])
    ).values());
    const missingIds = uniqueIds.filter(id => !Object.prototype.hasOwnProperty.call(companyLogs, String(id)));

    if (!missingIds.length) {
      return { logsByCompany: companyLogs, failedCompanyIds: new Set() };
    }

    const results = await Promise.allSettled(
      missingIds.map(id =>
        fetch(`${import.meta.env.VITE_API_URL}/activity_logs.php?action=list&company_id=${id}`)
          .then(r => r.json())
      )
    );

    const nextLogs = {};
    const failedCompanyIds = new Set();

    results.forEach((res, idx) => {
      const companyId = missingIds[idx];
      fetchedRef.current.add(String(companyId));

      if (res.status === 'fulfilled' && res.value.status === 'success') {
        nextLogs[companyId] = res.value.data;
      } else {
        nextLogs[companyId] = [];
        failedCompanyIds.add(String(companyId));
      }
    });

    setCompanyLogs(prev => ({ ...prev, ...nextLogs }));

    return { logsByCompany: { ...companyLogs, ...nextLogs }, failedCompanyIds };
  };

  const formatHistoryLogDate = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString('id-ID');
  };

  const formatCycle = (item) => {
    const value = item.maintenance_cycle_value || '';
    const unit = item.maintenance_cycle_unit || '';
    const cycle = `${value} ${unit}`.trim();
    return cycle || '-';
  };

  const buildHistoryDetailText = (log, changes) => {
    const changeText = changes.length
      ? changes.map(change => `${change.label}: ${change.old} -> ${change.new}`).join('; ')
      : 'Tidak ada perubahan field';

    return [
      formatHistoryLogDate(log.created_at),
      log.action_type || '-',
      `Oleh: ${log.user_name || 'System'}`,
      log.description || '-',
      changeText
    ].join(' | ');
  };

  const handleExportCsv = async () => {
    if (!historicalGroups.length) {
      alert('Tidak ada data history untuk diexport.');
      return;
    }

    setIsExportingHistory(true);

    try {
      const { logsByCompany, failedCompanyIds } = await loadLogsForCompanies(historicalGroups.map(group => group.company.id));
      const headers = [
        'Perusahaan',
        'Region',
        'ID Produk Histori',
        'Nama Produk',
        'Tgl Instalasi',
        'Target Ganti',
        'Siklus Maintenance',
        'Status',
        'Catatan Produk',
        'Assigned To',
        'Log Tanggal',
        'Log Tipe',
        'Log Oleh',
        'Log Deskripsi',
        'Field Berubah',
        'Nilai Lama',
        'Nilai Baru',
        'Catatan Detail Histori Produk'
      ];
      const rows = [];

      historicalGroups.forEach(group => {
        const companyId = String(group.company.id);
        const logs = logsByCompany[companyId] || [];
        const isLogFailed = failedCompanyIds.has(companyId);

        group.items.forEach(item => {
          const baseRow = [
            group.company.name || '-',
            group.company.region_name || '-',
            item.id || '-',
            item.product_name || '-',
            item.installation_date || '-',
            item.replacement_date || '-',
            formatCycle(item),
            item.status || '-',
            item.notes || '-',
            item.assigned_to_name || '-'
          ];

          if (isLogFailed) {
            rows.push([...baseRow, '', '', '', '', '', '', '', 'Gagal memuat log aktivitas.']);
            return;
          }

          const itemLogs = logs.filter(log => String(log.installation_id) === String(item.id));

          if (!itemLogs.length) {
            rows.push([...baseRow, '', '', '', '', '', '', '', 'Tidak ada log aktivitas untuk produk ini.']);
            return;
          }

          itemLogs.forEach(log => {
            const changes = getActivityChanges(log.old_values, log.new_values);
            const logMeta = [
              formatHistoryLogDate(log.created_at),
              log.action_type || '-',
              log.user_name || 'System',
              log.description || '-'
            ];

            if (!changes.length) {
              rows.push([
                ...baseRow,
                ...logMeta,
                '',
                '',
                '',
                buildHistoryDetailText(log, changes)
              ]);
              return;
            }

            changes.forEach(change => {
              rows.push([
                ...baseRow,
                ...logMeta,
                change.label,
                change.old,
                change.new,
                buildHistoryDetailText(log, [change])
              ]);
            });
          });
        });
      });

      downloadCsvFile(`history-produk-${getLocalDateString()}.csv`, headers, rows);
    } catch (err) {
      console.error('Failed to export history CSV:', err);
      alert('Gagal export CSV history.');
    } finally {
      setIsExportingHistory(false);
    }
  };

  if (!can('history_read')) return <div className="page-container"><h1 className="page-title">⛔ Akses Ditolak</h1><p>Anda tidak memiliki otoritas <code>history_read</code>.</p></div>;

  const openHistoryModal = (company, items) => {
    setHistoryModalCompany(company);
    setHistoryModalItems(items || []);
    setHistoryModalOpen(true);
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Historical & Record Perpanjangan</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Modul khusus menampilkan kumpulan log audit produk terdahulu yang sudah digantikan / diperpanjang (*Historical records*).</p>
      <div className="card-view">
        <div className="card-header" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <input type="text" placeholder="Search company..." className="search-input" value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, minWidth: '200px' }} />
          <select className="form-control" value={filterRegion} onChange={e => setFilterRegion(e.target.value)}>
            <option value="">Semua Wilayah</option>
            {regions.map(r => <option key={r.id} value={r.region_name}>{r.region_name}</option>)}
          </select>
          <button
            className="btn btn-secondary"
            onClick={handleExportCsv}
            disabled={isExportingHistory || historicalGroups.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}
          >
            {isExportingHistory ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
            {isExportingHistory ? 'Menyiapkan CSV...' : 'Export CSV'}
          </button>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Perusahaan</th>
              <th>Region</th>
              <th>Jumlah Produk</th>
              <th style={{ textAlign: 'right' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {currentData.map(group => (
              <tr key={group.company.id} style={{ cursor: 'pointer' }} onClick={() => openHistoryModal(group.company, group.items)}>
                <td style={{ fontWeight: 600, verticalAlign: 'middle' }}>{group.company.name}</td>
                <td style={{ verticalAlign: 'middle' }}>{group.company.region_name}</td>
                <td style={{ verticalAlign: 'middle' }}>{group.items.length} Produk</td>
                <td style={{ verticalAlign: 'middle', textAlign: 'right' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={e => { e.stopPropagation(); openHistoryModal(group.company, group.items); }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '0.85rem' }}
                  >
                    <Archive size={16} />
                    Lihat Log
                  </button>
                </td>
              </tr>
            ))}
            {currentData.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center', color: 'gray' }}>Belum ada data history perpanjangan.</td></tr>}
          </tbody>
        </table>
        <Pagination totalItems={historicalGroups.length} itemsPerPage={ITEMS_PER_PAGE} currentPage={currentPage} onPageChange={setCurrentPage} />
      </div>

      <CompanyHistoryModal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        company={historyModalCompany}
        historyItems={historyModalItems}
      />
    </div>
  );
}

function UserPage({ can, currentUser }) {
  const [usersInfo, setUsersInfo] = useState([]);
  const [rolesInfo, setRolesInfo] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState({ id: '', username: '', email: '', phone: '', password: '', confirmPassword: '', role_id: '3', status: 'active' });
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const [statusType, setStatusType] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  const fetchData = async () => {
    setIsLoadingData(true);
    try {
      const showAll = can('user_showall');
      const [resU, resR] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/users.php?user_id=${currentUser.id}&show_all=${showAll}`),
        fetch(`${import.meta.env.VITE_API_URL}/roles.php`)
      ]);
      const jU = await resU.json(); const jR = await resR.json();
      if (jU.status === 'success') setUsersInfo(jU.data);
      if (jR.status === 'success') setRolesInfo(jR.data);
    } catch (e) { console.error(e); } finally { setIsLoadingData(false); }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openEdit = (u) => { setIsEdit(true); setFormData({ id: u.id, username: u.username, email: u.email, phone: u.phone || '', password: '', confirmPassword: '', role_id: String(u.role_id), status: u.status }); setStatusMsg(null); setModalOpen(true); };
  const openCreate = () => { setIsEdit(false); setFormData({ id: '', username: '', email: '', phone: '', password: '', confirmPassword: '', role_id: '3', status: 'active' }); setStatusMsg(null); setModalOpen(true); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setStatusMsg(null);
    if (!isEdit && formData.password !== formData.confirmPassword) { setStatusType('error'); setStatusMsg('Konfirmasi sandi tidak cocok.'); return; }
    setIsLoading(true);
    try {
      const ep = isEdit ? `${import.meta.env.VITE_API_URL}/users.php?action=update` : `${import.meta.env.VITE_API_URL}/auth.php?action=register`;
      const res = await fetch(ep, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...formData, user_id: currentUser.id }) });
      const d = await res.json();
      if (d.status === 'success') { setStatusType('success'); setStatusMsg(d.message); fetchData(); setTimeout(() => setModalOpen(false), 1000); }
      else { setStatusType('error'); setStatusMsg(d.message); }
    } catch (err) { setStatusType('error'); setStatusMsg('Kesalahan Jaringan API.'); } finally { setIsLoading(false); }
  };

  const handleDeactivate = async (u) => {
    if (!window.confirm(`Nonaktifkan user "${u.username}"?`)) return;
    try { const r = await fetch(`${import.meta.env.VITE_API_URL}/users.php?action=deactivate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: u.id }) }); const d = await r.json(); if (d.status === 'success') fetchData(); } catch (e) { console.error(e); }
  };

  const columns = [
    { header: 'ID', accessor: 'id' },
    { header: 'Username', accessor: 'username', render: (u) => <strong style={{ color: '#0f172a' }}>{u.username}</strong> },
    { header: 'Email', accessor: 'email' },
    { header: 'Phone', accessor: 'phone', render: (u) => u.phone || '-' },
    { header: 'Role', accessor: 'role_name', render: (u) => <span className={`badge ${u.role_name === 'Admin' ? 'badge-info' : 'badge-warning'}`}>{u.role_name}</span> },
    { header: 'Pencipta', accessor: 'creator_name', render: (u) => <span style={{ fontSize: '12px', color: '#64748b' }}>{u.creator_name || 'System'}</span> },
    { header: 'Diubah Oleh', accessor: 'last_editor_name' },
    { header: 'Status', accessor: 'status', render: (u) => <span className={`badge ${u.status === 'active' ? 'badge-success' : 'badge-danger'}`}>{u.status === 'active' ? 'Aktif' : u.status}</span> },
    {
      header: 'Aksi', render: (u) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          {can('user_update') && <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => openEdit(u)}>Edit</button>}
          {can('user_delete') && u.status === 'active' && <button className="btn" style={{ padding: '4px 8px', fontSize: '12px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }} onClick={() => handleDeactivate(u)}>Nonaktifkan</button>}
        </div>
      )
    }
  ];

  if (!isLoadingData && !can('user_read')) return <div className="page-container"><h1 className="page-title">⛔ Akses Ditolak</h1><p>Anda tidak memiliki otoritas <code>user_read</code> untuk halaman ini.</p></div>;

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Master User / Pengguna Sistem</h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'stretch', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem', color: '#64748b', background: 'white', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#0ea5e9' }} />
            Tampilkan Nonaktif
          </label>
          {can('user_create') && <button className="btn btn-primary" onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px' }}><Plus size={18} /> Add New User</button>}
        </div>
      </div>

      <div className="card-view" style={{ padding: '20px' }}>
        {isLoadingData ? (
          <div style={{ textAlign: 'center', padding: '40px' }}><Loader2 className="animate-spin" style={{ margin: '0 auto' }} size={32} color="#0ea5e9" /></div>
        ) : (
          <DataTable data={usersInfo.filter(u => showInactive || u.status === 'active')} columns={columns} fileName="master-users" />
        )}
      </div>
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}><div className="modal-content" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h2>{isEdit ? 'Ubah Data User' : 'Registrasi User Baru'}</h2><button type="button" className="close-btn" onClick={() => setModalOpen(false)}><X size={24} /></button></div>
          <form onSubmit={handleSubmit}><div className="modal-body">
            <div className="form-group"><label>Username</label><input required className="form-control" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} disabled={isEdit} placeholder="Username" /></div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div className="form-group" style={{ flex: 1 }}><label>Email</label><input required className="form-control" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} disabled={isEdit} /></div>
              <div className="form-group" style={{ flex: 1 }}><label>Nomor Telepon</label><input className="form-control" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="081234xxx" /></div>
            </div>
            {!isEdit && <div style={{ display: 'flex', gap: '16px' }}>
              <div className="form-group" style={{ flex: 1 }}><label>Kata Sandi</label><input required className="form-control" type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} /></div>
              <div className="form-group" style={{ flex: 1 }}><label>Konfirmasi Sandi</label><input required className="form-control" type="password" value={formData.confirmPassword} onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })} /></div>
            </div>}
            <div style={{ display: 'flex', gap: '16px' }}>
              <div className="form-group" style={{ flex: 1 }}><label>Role</label><select className="form-control" value={formData.role_id} onChange={e => setFormData({ ...formData, role_id: e.target.value })}>{rolesInfo.map(r => <option key={r.id} value={r.id}>{r.role_name}</option>)}</select></div>
              {isEdit && <div className="form-group" style={{ flex: 1 }}><label>Status</label><select className="form-control" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}><option value="active">Aktif</option><option value="inactive">Nonaktif</option><option value="resigned">Resigned</option></select></div>}
            </div>
            {statusMsg && <div style={{ marginTop: '12px', padding: '12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', background: statusType === 'success' ? '#ecfdf5' : '#fef2f2', color: statusType === 'success' ? '#059669' : '#dc2626', borderLeft: statusType === 'success' ? '4px solid #10b981' : '4px solid #ef4444' }}>{statusType === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />} {statusMsg}</div>}
          </div>
            <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Batal</button><button type="submit" className="btn btn-primary" disabled={isLoading} style={{ minWidth: '130px' }}>{isLoading ? <Loader2 className="animate-spin" size={18} style={{ margin: '0 auto' }} /> : (isEdit ? 'Ubah Data' : 'Simpan User')}</button></div>
          </form></div></div>
      )}
    </div>
  );
}

function RolePage({ can, currentUser }) {
  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editModal, setEditModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editForm, setEditForm] = useState({ id: '', role_name: '', description: '', status: 'active' });
  const [editSaving, setEditSaving] = useState(false);
  const [editStatus, setEditStatus] = useState(null);
  const [permModal, setPermModal] = useState(false);
  const [permRoleId, setPermRoleId] = useState(null);
  const [permRoleName, setPermRoleName] = useState('');
  const [allPerms, setAllPerms] = useState([]);
  const [assignedPerms, setAssignedPerms] = useState([]);
  const [permSaving, setPermSaving] = useState(false);
  const [permStatus, setPermStatus] = useState(null);
  const [showInactive, setShowInactive] = useState(false);

  const fetchRoles = async () => {
    setIsLoading(true);
    try {
      const showAll = can('role_showall');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/roles.php?action=list&user_id=${currentUser.id}&show_all=${showAll}`);
      const json = await res.json();
      if (json.status === 'success') setRoles(json.data);
    }
    catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  useEffect(() => {
    fetchRoles();
  }, []);


  const openEditRole = (r) => { setIsEdit(true); setEditForm({ id: r.id, role_name: r.role_name, description: r.description || '', status: r.status || 'active' }); setEditStatus(null); setEditModal(true); };
  const openCreateRole = () => { setIsEdit(false); setEditForm({ id: '', role_name: '', description: '', status: 'active' }); setEditStatus(null); setEditModal(true); };

  const handleEditSave = async (e) => {
    e.preventDefault(); setEditSaving(true); setEditStatus(null);
    try {
      const action = isEdit ? 'update' : 'create';
      const res = await fetch(`${import.meta.env.VITE_API_URL}/roles.php?action=${action}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...editForm, user_id: currentUser.id }) });
      const d = await res.json();
      setEditStatus(d.message);
      if (d.status === 'success') { fetchRoles(); setTimeout(() => { setEditModal(false); setEditStatus(null); }, 1000); }
    }
    catch (err) { setEditStatus('Gagal menghubungi server.'); } finally { setEditSaving(false); }
  };

  const handleDeactivateRole = async (r) => {
    if (!window.confirm(`Nonaktifkan role "${r.role_name}"?`)) return;
    try { const res = await fetch(`${import.meta.env.VITE_API_URL}/roles.php?action=deactivate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: r.id }) }); const d = await res.json(); if (d.status === 'success') fetchRoles(); } catch (err) { console.error(err); }
  };

  const openPermissions = async (role) => {
    setPermRoleId(role.id); setPermRoleName(role.role_name); setPermStatus(null);
    try { const res = await fetch(`${import.meta.env.VITE_API_URL}/roles.php?action=permissions&role_id=${role.id}`); const json = await res.json(); if (json.status === 'success') { setAllPerms(json.data.all); setAssignedPerms(json.data.assigned.map(Number)); } } catch (err) { console.error(err); }
    setPermModal(true);
  };
  const togglePerm = (pid) => setAssignedPerms(prev => prev.includes(pid) ? prev.filter(x => x !== pid) : [...prev, pid]);
  const toggleGroup = (groupPerms) => {
    const ids = groupPerms.map(p => Number(p.id));
    const allOn = ids.every(id => assignedPerms.includes(id));
    if (allOn) setAssignedPerms(prev => prev.filter(x => !ids.includes(x))); else setAssignedPerms(prev => [...new Set([...prev, ...ids])]);
  };
  const savePermissions = async () => {
    setPermSaving(true); setPermStatus(null);
    try { const res = await fetch(`${import.meta.env.VITE_API_URL}/roles.php?action=save_permissions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role_id: permRoleId, permission_ids: assignedPerms }) }); const json = await res.json(); setPermStatus(json.message); if (json.status === 'success') setTimeout(() => { setPermModal(false); setPermStatus(null); }, 1200); }
    catch (err) { setPermStatus('Gagal menghubungi server.'); } finally { setPermSaving(false); }
  };

  const selectAllPermissions = () => {
    const allIds = allPerms.map(p => Number(p.id));
    setAssignedPerms(allIds);
  };
  const deselectAllPermissions = () => setAssignedPerms([]);

  const groupedPerms = useMemo(() => {
    const groups = {};
    const labels = { user: 'Master User', role: 'Master Role', team: 'Master Team', dashboard: 'Dashboard', sales: 'Instalasi / Sales', prospecting: 'Prospecting', workorder: 'Work Order', company: 'Data Company', pic: 'Data PIC', history: 'History / Arsip', installation: 'Data Instalasi' };
    allPerms.forEach(p => { const prefix = p.permission_name.split('_')[0]; if (!groups[prefix]) groups[prefix] = { label: labels[prefix] || prefix, perms: [] }; groups[prefix].perms.push(p); });
    return groups;
  }, [allPerms]);

  const columns = [
    { header: 'ID', accessor: 'id', render: (r) => <span style={{ fontWeight: 'bold' }}>ROL-00{r.id}</span> },
    { header: 'Nama Role', accessor: 'role_name', render: (r) => <span className="badge badge-info">{r.role_name}</span> },
    { header: 'Deskripsi', accessor: 'description' },
    { header: 'Pencipta', accessor: 'creator_name', render: (r) => <span style={{ fontSize: '12px', color: '#64748b' }}>{r.creator_name || 'System'}</span> },
    { header: 'Diubah Oleh', accessor: 'last_editor_name' },
    { header: 'Status', accessor: 'status', render: (r) => <span className={`badge ${(r.status || 'active') === 'active' ? 'badge-success' : 'badge-danger'}`}>{(r.status || 'active') === 'active' ? 'Aktif' : 'Nonaktif'}</span> },
    {
      header: 'Aksi', render: (r) => (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {can('role_set_authority') && <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={() => openPermissions(r)}><Lock size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />Otoritas</button>}
          {can('role_update') && <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={() => openEditRole(r)}>Edit</button>}
          {can('role_delete') && (r.status || 'active') === 'active' && <button className="btn" style={{ padding: '4px 8px', fontSize: '12px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }} onClick={() => handleDeactivateRole(r)}>Nonaktifkan</button>}
        </div>
      )
    }
  ];

  if (!isLoading && !can('role_read')) return <div className="page-container"><h1 className="page-title">⛔ Akses Ditolak</h1><p>Anda tidak memiliki otoritas <code>role_read</code> untuk halaman ini.</p></div>;

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Master Role / Peran Jabatan</h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'stretch', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem', color: '#64748b', background: 'white', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#0ea5e9' }} />
            Tampilkan Nonaktif
          </label>
          {can('role_create') && <button className="btn btn-primary" onClick={openCreateRole} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px' }}><Plus size={18} /> Tambah Role</button>}
        </div>
      </div>

      <div className="card-view" style={{ padding: '20px' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}><Loader2 className="animate-spin" style={{ margin: '0 auto' }} size={32} color="#0ea5e9" /></div>
        ) : (
          <DataTable data={roles.filter(r => showInactive || (r.status || 'active') === 'active')} columns={columns} fileName="master-roles" />
        )}
      </div>

      {editModal && (
        <div className="modal-overlay" onClick={() => setEditModal(false)}><div className="modal-content" style={{ maxWidth: '450px' }} onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h2>{isEdit ? 'Edit Role' : 'Tambah Role Baru'}</h2><button className="close-btn" onClick={() => setEditModal(false)}><X size={24} /></button></div>
          <form onSubmit={handleEditSave}><div className="modal-body">
            <div className="form-group"><label>Nama Role</label><input required className="form-control" value={editForm.role_name} onChange={e => setEditForm({ ...editForm, role_name: e.target.value })} /></div>
            <div className="form-group"><label>Deskripsi</label><input className="form-control" value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} /></div>
            {isEdit && <div className="form-group"><label>Status</label><select className="form-control" value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}><option value="active">Aktif</option><option value="inactive">Nonaktif</option></select></div>}
            {editStatus && <div style={{ marginTop: '12px', padding: '8px 12px', borderRadius: '6px', background: '#ecfdf5', color: '#059669', fontSize: '13px' }}>{editStatus}</div>}
          </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setEditModal(false)}>Batal</button><button type="submit" className="btn btn-primary" disabled={editSaving}>{editSaving ? 'Menyimpan...' : (isEdit ? 'Simpan' : 'Buat Role')}</button></div></form>
        </div></div>
      )}

      {permModal && (
        <div className="modal-overlay" onClick={() => setPermModal(false)}><div className="modal-content" style={{ maxWidth: '700px' }} onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <h2 style={{ margin: 0 }}>Otoritas Role: <span style={{ color: '#0ea5e9' }}>{permRoleName}</span></h2>
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button type="button" onClick={selectAllPermissions} style={{ background: 'none', border: 'none', color: '#0ea5e9', fontSize: '12px', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>Pilih Semua Otoritas</button>
                <span style={{ color: '#e2e8f0' }}>|</span>
                <button type="button" onClick={deselectAllPermissions} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '12px', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>Batalkan Semua</button>
              </div>
            </div>
            <button className="close-btn" onClick={() => setPermModal(false)}><X size={24} /></button>
          </div>
          <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto', background: '#f8fafc', padding: '20px' }}>
            <p style={{ marginBottom: '20px', fontSize: '14px', color: '#64748b', background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <ShieldCheck size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px', color: '#0ea5e9' }} />
              Pilih hak akses untuk role ini. Perubahan akan langsung disimpan ke database.
            </p>
            {Object.keys(groupedPerms).length === 0 ? <p style={{ textAlign: 'center', color: '#94a3b8' }}>Tidak ada data perizinan.</p>
              : Object.entries(groupedPerms).map(([prefix, group]) => {
                const ids = group.perms.map(p => Number(p.id));
                const allOn = ids.every(id => assignedPerms.includes(id));
                return (
                  <div key={prefix} style={{ marginBottom: '24px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 20px', borderBottom: '1px solid #f1f5f9' }}>
                      <Shield size={18} color="#0ea5e9" />
                      <div style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a', flex: 1 }}>{group.label}</div>
                      <button type="button" className="btn" style={{ fontSize: '11px', padding: '4px 8px', background: '#f1f5f9', color: '#64748b' }} onClick={() => toggleGroup(group.perms)}>
                        {allOn ? 'Batalkan Semua' : 'Pilih Semua Grup'}
                      </button>
                    </div>
                    <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                      {group.perms.map(p => {
                        const active = assignedPerms.includes(Number(p.id));
                        return (
                          <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', border: '1px solid', borderColor: active ? '#bae6fd' : '#f1f5f9', background: active ? '#f0f9ff' : '#fff', cursor: 'pointer', transition: 'all 0.2s' }}>
                            <input type="checkbox" checked={active} onChange={() => togglePerm(Number(p.id))} style={{ width: '18px', height: '18px', accentColor: '#0ea5e9' }} />
                            <span style={{ fontSize: '13px', fontWeight: active ? 600 : 400, color: active ? '#0369a1' : '#475569' }}>{p.permission_name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            {permStatus && <div style={{ marginTop: '12px', padding: '8px 12px', borderRadius: '6px', background: '#ecfdf5', color: '#059669', fontSize: '13px' }}>{permStatus}</div>}
          </div>
          <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setPermModal(false)}>Tutup</button><button type="button" className="btn btn-primary" onClick={savePermissions} disabled={permSaving} style={{ minWidth: '140px' }}>{permSaving ? 'Menyimpan...' : 'Simpan Otoritas'}</button></div>
        </div></div>
      )}
    </div>
  );
}

function TeamPage({ can, currentUser }) {
  const [teams, setTeams] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [formSaving, setFormSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const [formData, setFormData] = useState({ id: '', team_name: '', description: '', status: 'active', members: [] });
  const [userSearch, setUserSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const showAll = can('team_showall');
      const [resT, resU] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/teams.php?action=list&user_id=${currentUser.id}&show_all=${showAll}`),
        fetch(`${import.meta.env.VITE_API_URL}/users.php?user_id=${currentUser.id}&show_all=true`)
      ]);
      const jt = await resT.json(); const ju = await resU.json();
      if (jt.status === 'success') setTeams(jt.data);
      if (ju.status === 'success') setAllUsers(ju.data);
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => { setIsEdit(false); setFormData({ id: '', team_name: '', description: '', status: 'active', members: [] }); setStatusMsg(null); setUserSearch(''); setModalOpen(true); };
  const openEdit = async (t) => {
    setIsEdit(true); setStatusMsg(null); setUserSearch('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/teams.php?action=members&team_id=${t.id}`);
      const json = await res.json();
      setFormData({ id: t.id, team_name: t.team_name, description: t.description || '', status: t.status || 'active', members: json.data || [] });
    } catch (e) { console.error(e); }
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormSaving(true); setStatusMsg(null);
    const action = isEdit ? 'update' : 'create';
    const payload = isEdit ? formData : { ...formData, created_by: currentUser.id };
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/teams.php?action=${action}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, user_id: currentUser.id })
      });
      const d = await res.json();
      setStatusMsg(d.message);
      if (d.status === 'success') { fetchData(); setTimeout(() => setModalOpen(false), 1200); }
    } catch (err) { setStatusMsg('Gagal terhubung API.'); } finally { setFormSaving(false); }
  };

  const handleDeactivate = async (t) => {
    if (!window.confirm(`Nonaktifkan tim "${t.team_name}"?`)) return;
    try { const r = await fetch(`${import.meta.env.VITE_API_URL}/teams.php?action=deactivate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: t.id }) }); const d = await r.json(); if (d.status === 'success') fetchData(); } catch (e) { console.error(e); }
  };

  const toggleMember = (uid) => {
    setFormData(prev => ({
      ...prev,
      members: prev.members.includes(Number(uid)) ? prev.members.filter(x => x !== Number(uid)) : [...prev.members, Number(uid)]
    }));
  };

  const filteredModalUsers = allUsers.filter(u =>
    u.status === 'active' &&
    (u.username.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase()))
  );

  const columns = [
    { header: 'ID', accessor: 'id', render: (t) => <span style={{ fontWeight: 700 }}>TIM-{t.id}</span> },
    { header: 'Nama Tim', accessor: 'team_name', render: (t) => <strong style={{ color: '#0369a1' }}>{t.team_name}</strong> },
    { header: 'Deskripsi', accessor: 'description' },
    { header: 'Anggota', render: (t) => <span className="badge badge-info">{t.member_count || 0} User</span> },
    { header: 'Pembuat', accessor: 'creator_name' },
    { header: 'Diubah Oleh', accessor: 'last_editor_name' },
    { header: 'Status', accessor: 'status', render: (t) => <span className={`badge ${t.status === 'active' ? 'badge-success' : 'badge-danger'}`}>{t.status === 'active' ? 'Aktif' : 'Nonaktif'}</span> },
    {
      header: 'Aksi', render: (t) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          {can('team_update') && <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => openEdit(t)}>Edit</button>}
          {can('team_delete') && t.status === 'active' && <button className="btn" style={{ padding: '4px 8px', fontSize: '12px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }} onClick={() => handleDeactivate(t)}>Nonaktifkan</button>}
        </div>
      )
    }
  ];

  if (!can('team_read')) return <div className="page-container"><h1 className="page-title">⛔ Akses Ditolak</h1><p>Anda tidak memiliki otoritas <code>team_read</code>.</p></div>;

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Master Team / Otoritas Grup</h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'stretch', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem', color: '#64748b', background: 'white', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#0ea5e9' }} />
            Tampilkan Nonaktif
          </label>
          {can('team_create') && <button className="btn btn-primary" onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px' }}><Plus size={18} /> Buat Tim Baru</button>}
        </div>
      </div>

      <div className="card-view" style={{ padding: '20px' }}>
        <DataTable data={teams.filter(t => showInactive || (t.status || 'active') === 'active')} columns={columns} fileName="master-teams" />
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}><div className="modal-content" style={{ maxWidth: '800px', width: '95%' }} onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h2>{isEdit ? 'Ubah Data Tim' : 'Buat Tim Baru'}</h2><button type="button" className="close-btn" onClick={() => setModalOpen(false)}><X size={24} /></button></div>
          <form onSubmit={handleSubmit}><div className="modal-body" style={{ display: 'flex', gap: '24px', flexDirection: 'row', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '300px' }}>
              <div className="form-group"><label>Nama Tim</label><input required className="form-control" value={formData.team_name} onChange={e => setFormData({ ...formData, team_name: e.target.value })} placeholder="Sales Region A" /></div>
              <div className="form-group"><label>Deskripsi</label><textarea className="form-control" style={{ height: '100px' }} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Tim manajemen wilayah..." /></div>
              {isEdit && <div className="form-group"><label>Status</label><select className="form-control" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}><option value="active">Aktif</option><option value="inactive">Nonaktif</option></select></div>}
            </div>

            <div style={{ flex: 1.2, minWidth: '350px', background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <label style={{ fontWeight: 700, margin: 0, fontSize: '15px', color: '#0f172a' }}>Pilih Anggota Tim (Individu)</label>
                <span className="badge badge-info" style={{ fontSize: '11px' }}>{formData.members.length} Terpilih</span>
              </div>

              <div style={{ position: 'relative', marginBottom: '12px' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input type="text" className="form-control" style={{ paddingLeft: '32px', fontSize: '13px', background: 'white' }} placeholder="Cari nama atau email user..." value={userSearch} onChange={e => setUserSearch(e.target.value)} />
              </div>

              <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
                {filteredModalUsers.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontSize: '13px' }}>User tidak ditemukan.</div>
                ) : filteredModalUsers.map(u => {
                  const isChecked = formData.members.includes(Number(u.id));
                  return (
                    <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', background: 'white', border: '1px solid', borderColor: isChecked ? '#0ea5e9' : '#e2e8f0', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: isChecked ? '0 2px 4px rgba(14, 165, 233, 0.1)' : 'none' }}>
                      <input type="checkbox" checked={isChecked} onChange={() => toggleMember(u.id)} style={{ width: '20px', height: '20px', accentColor: '#0ea5e9' }} />
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#0ea5e9', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '12px' }}>
                        {u.username.substring(0, 2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: isChecked ? 700 : 500, color: isChecked ? '#0369a1' : '#1e293b' }}>{u.username}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{u.email} • <span style={{ color: '#0ea5e9' }}>{u.role_name}</span></div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
            {statusMsg && <div style={{ width: '90%', margin: '0 auto 20px auto', padding: '12px', borderRadius: '8px', background: '#ecfdf5', color: '#059669', fontSize: '13px', border: '1px solid #86efac', display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={16} /> {statusMsg}</div>}
            <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Batal</button><button type="submit" className="btn btn-primary" disabled={formSaving} style={{ minWidth: '150px' }}>{formSaving ? 'Menyimpan...' : 'Simpan Tim'}</button></div></form>
        </div></div>
      )}
    </div>
  );
}

export default function App() {
  const [companies, setCompanies] = useState([]);
  const [regions, setRegions] = useState([]);
  const [pics, setPICs] = useState([]);
  const [installations, setInstallations] = useState([]);
  const [systemNotice, setSystemNotice] = useState(null);

  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('auth_user')));
  const [permissions, setPermissions] = useState(() => (user?.permissions || []));

  const fetchData = async () => {
    try {
      const userPerms = user?.permissions || [];
      const hasShowAll = userPerms.includes('workorder_showall') || userPerms.includes('all_access');
      const compShowAll = userPerms.includes('company_showall') || userPerms.includes('all_access');
      const picShowAll = userPerms.includes('pic_showall') || userPerms.includes('all_access');

      const instUrl = `${import.meta.env.VITE_API_URL}/installations.php?action=list&user_id=${user?.id || ''}&show_all=${hasShowAll}`;
      const compUrl = `${import.meta.env.VITE_API_URL}/companies.php?action=list&user_id=${user?.id || ''}&show_all=${compShowAll}`;
      const picUrl = `${import.meta.env.VITE_API_URL}/pics.php?action=list&user_id=${user?.id || ''}&show_all=${picShowAll}`;

      const [resC, resR, resI, resP] = await Promise.all([
        fetch(compUrl),
        fetch(`${import.meta.env.VITE_API_URL}/regions.php?action=list`),
        fetch(instUrl),
        fetch(picUrl)
      ]);
      const jsonC = await resC.json();
      const jsonR = await resR.json();
      const jsonI = await resI.json();
      const jsonP = await resP.json();
      if (jsonC.status === 'success') setCompanies(jsonC.data);
      if (jsonR.status === 'success') setRegions(jsonR.data);
      if (jsonI.status === 'success') setInstallations(jsonI.data);
      if (jsonP.status === 'success') setPICs(jsonP.data);
    } catch (e) {
      console.error("Gagal sync global data:", e);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  useEffect(() => {
    const handleStorage = () => {
      const authUser = JSON.parse(localStorage.getItem('auth_user'));
      if (JSON.stringify(authUser) !== JSON.stringify(user)) {
        setUser(authUser);
        setPermissions(authUser?.permissions || []);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [user]);

  useEffect(() => {
    setPermissions(user?.permissions || []);
  }, [user]);

  const can = (p) => permissions.includes(p);

  useEffect(() => {
    const now = new Date();
    let hasChanges = false;
    const itemsToAdd = [];

    const processedList = installations.map(inst => {
      if (inst.is_history || Number(inst.is_history) === 1 || inst.status === 'Done') return inst;
      const diffDays = Math.ceil((new Date(inst.replacement_date) - now) / (1000 * 60 * 60 * 24));
      if (diffDays < -30) {
        hasChanges = true;
        const archivedItem = { ...inst, status: 'Lapsed (Auto)', is_history: 1, notes: (inst.notes ? inst.notes + ' | ' : '') + 'Sistem: Otomatis di-rollover karena > 1 bulan tidak dikelola.' };
        const nextTarget = new Date(inst.replacement_date);
        nextTarget.setMonth(nextTarget.getMonth() + 1);
        itemsToAdd.push({ ...inst, id: Date.now() + Math.random(), installation_date: getLocalDateString(), replacement_date: nextTarget.toISOString().split('T')[0], status: 'Scheduled for Replacement', notes: 'Sistem: Pengingat baru otomatis (Rollover)', is_history: 0, auditLogs: [{ user: 'System', action: 'Auto Rollover (Overdue > 30 days)', date: new Date().toLocaleString() }] });
        return archivedItem;
      }
      return inst;
    });

    if (hasChanges) {
      setInstallations([...processedList, ...itemsToAdd]);
      setSystemNotice(`Sistem: ${itemsToAdd.length} tugas terlewat (> 1 bulan) telah dibuatkan pengingat baru secara otomatis.`);
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/*" element={
          <div className="app-container">
            <Sidebar permissions={permissions} user={user} />
            <main className="main-content">
              <Header user={user} setUser={setUser} />
              <Routes>
                <Route path="/" element={can('dashboard_read') ? <Dashboard companies={companies} regions={regions} installations={installations} pics={pics} systemNotice={systemNotice} setSystemNotice={setSystemNotice} can={can} /> : <div className="page-container">Akses Ditolak</div>} />
                <Route path="/company" element={can('company_read') ? <CompanyPage can={can} currentUser={user} /> : <div className="page-container">Akses Ditolak</div>} />
                <Route path="/pic" element={can('pic_read') ? <PICPage can={can} currentUser={user} /> : <div className="page-container">Akses Ditolak</div>} />
                <Route path="/master-region" element={can('region_read') ? <RegionPage can={can} currentUser={user} /> : <div className="page-container">Akses Ditolak</div>} />
                <Route path="/sales" element={can('sales_read') ? <SalesPage companies={companies} regions={regions} installations={installations} setInstallations={setInstallations} can={can} currentUser={user} /> : <div className="page-container">Akses Ditolak</div>} />
                <Route path="/installation" element={can('installation_read') ? <InstallationPage installations={installations} companies={companies} regions={regions} can={can} currentUser={user} setInstallations={setInstallations} /> : <div className="page-container">Akses Ditolak</div>} />
                <Route path="/prospecting" element={can('prospecting_read') ? <ProspectingPage installations={installations} can={can} regions={regions} currentUser={user} onAssignmentDone={fetchData} /> : <div className="page-container">Akses Ditolak</div>} />
                <Route path="/work-order" element={can('workorder_read') ? <WorkOrderPage installations={installations} setInstallations={setInstallations} companies={companies} can={can} currentUser={user} /> : <div className="page-container">Akses Ditolak</div>} />
                <Route path="/history" element={can('history_read') ? <HistoryPage installations={installations} companies={companies} can={can} regions={regions} currentUser={user} /> : <div className="page-container">Akses Ditolak</div>} />
                <Route path="/master-user" element={can('user_read') ? <UserPage can={can} currentUser={user} /> : <div className="page-container">Akses Ditolak</div>} />
                <Route path="/master-role" element={can('role_read') ? <RolePage can={can} currentUser={user} /> : <div className="page-container">Akses Ditolak</div>} />
                <Route path="/master-team" element={can('team_read') ? <TeamPage can={can} currentUser={user} /> : <div className="page-container">Akses Ditolak</div>} />
              </Routes>
            </main>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}
