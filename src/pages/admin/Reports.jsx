import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar.jsx';
import Footer from '../../components/Footer.jsx';
import api from '../../api/api.js';
import * as XLSX from 'xlsx';

const REPORT_TYPES = [
  { id: 'classes', label: 'Classes Report' },
  { id: 'trainers', label: 'Trainers Report' },
  { id: 'pricing', label: 'Pricing & Plans Report' },
  { id: 'bookings', label: 'Bookings Report' },
  { id: 'trials', label: 'Trial Requests Report' },
  { id: 'payments', label: 'Payments Report' },
  { id: 'users', label: 'Users Report' },
  { id: 'trainer_sales', label: 'Trainer Sales Report' },
];

export default function Reports() {
  const [summary, setSummary] = useState(null);
  const [reportType, setReportType] = useState('bookings');
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState([]);
  
  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [locationId, setLocationId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    api.get('/reports/summary').then((res) => setSummary(res.data)).catch(() => {});
    api.get('/locations?all=true').then(res => setLocations(res.data || [])).catch(() => {});
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = {
        startDate,
        endDate,
        locationId,
        all: !locationId ? 'true' : 'false'
      };
      const res = await api.get(`/reports/${reportType}`, { params });
      setReportData(res.data || []);
    } catch (error) {
      console.error('Failed to fetch report:', error);
      alert('Failed to fetch report data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType]);

  const handleExport = () => {
    if (reportData.length === 0) {
      alert('No data to export');
      return;
    }

    // Flatten data for Excel
    const flattenedData = reportData.map(item => {
      const flat = {};
      
      // Determine columns based on report type for better organization
      Object.keys(item).forEach(key => {
        if (['_id', '__v', 'updatedAt'].includes(key)) return;
        
        let value = item[key];
        
        // Handle specific nested fields
        if (key === 'userId' && typeof value === 'object') {
          flat['User Name'] = value?.name || 'N/A';
          flat['User Email'] = value?.email || 'N/A';
          return;
        }
        if (key === 'classId' && typeof value === 'object') {
          flat['Class'] = value?.title || 'N/A';
          return;
        }
        if (key === 'locationId' && typeof value === 'object') {
          flat['Location'] = value?.name || 'N/A';
          return;
        }
        if (key === 'availableTrainers' && Array.isArray(value)) {
          flat['Trainers'] = value.map(t => t.name).join(', ');
          return;
        }
        if (key === 'sessionId' && typeof value === 'object') {
          flat['Trainer'] = value?.trainerId?.name || 'TBA';
          return;
        }
        if (key === 'participants' && Array.isArray(value)) {
          flat['Participants'] = value.map(p => `${p.name} (${p.relation})`).join(', ');
          return;
        }
        if (Array.isArray(value)) {
          flat[key] = value.join(', ');
          return;
        }
        
        flat[key] = value;
      });
      
      return flat;
    });

    const worksheet = XLSX.utils.json_to_sheet(flattenedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
    XLSX.writeFile(workbook, `${reportType}_report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const COLUMNS = {
    bookings: [
      { key: 'bookingNumber', label: 'Booking No.' },
      { key: 'userId', label: 'User' },
      { key: 'participants', label: 'Participants' },
      { key: 'classId', label: 'Class' },
      { key: 'sessionId', label: 'Trainer' },
      { key: 'date', label: 'Date' },
      { key: 'totalAmount', label: 'Amount' },
      { key: 'status', label: 'Status' },
      { key: 'paymentMethod', label: 'Method' },
      { key: 'paymentStatus', label: 'Payment' },
      { key: 'locationId', label: 'Location' },
    ],
    classes: [
      { key: 'title', label: 'Title' },
      { key: 'price', label: 'Price (AED)' },
      { key: 'ageGroup', label: 'Age Group' },
      { key: 'duration', label: 'Duration' },
      { key: 'capacity', label: 'Capacity' },
      { key: 'availableTrainers', label: 'Trainers' },
      { key: 'locationId', label: 'Branch' },
    ],
    trainers: [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'specialties', label: 'Specialties' },
      { key: 'status', label: 'Status' },
      { key: 'locationId', label: 'Branch' },
    ],
    pricing: [
      { key: 'name', label: 'Plan Name' },
      { key: 'price', label: 'Price' },
      { key: 'type', label: 'Type' },
      { key: 'durationWeeks', label: 'Weeks' },
      { key: 'classesIncluded', label: 'Classes' },
      { key: 'locationId', label: 'Branch' },
    ],
    trials: [
      { key: 'parentName', label: 'Parent' },
      { key: 'childName', label: 'Child' },
      { key: 'parentPhone', label: 'Phone' },
      { key: 'preferredClass', label: 'Class' },
      { key: 'preferredTime', label: 'Time' },
      { key: 'status', label: 'Status' },
      { key: 'locationId', label: 'Branch' },
      { key: 'createdAt', label: 'Requested' },
    ],
    payments: [
      { key: 'userId', label: 'User' },
      { key: 'amount', label: 'Amount' },
      { key: 'paymentMethod', label: 'Method' },
      { key: 'status', label: 'Status' },
      { key: 'reference', label: 'Reference' },
      { key: 'createdAt', label: 'Date' },
    ],
    users: [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'role', label: 'Role' },
      { key: 'locationId', label: 'Branch' },
      { key: 'createdAt', label: 'Joined' },
    ],
    trainer_sales: [
      { key: 'date', label: 'Session Date' },
      { key: 'classTitle', label: 'Class' },
      { key: 'trainerName', label: 'Trainer' },
      { key: 'bookingsCount', label: 'Bookings' },
      { key: 'totalRevenue', label: 'Total Sales (AED)' },
      { key: 'sessionStatus', label: 'Session Status' },
      { key: 'branchName', label: 'Branch' },
    ]
  };

  const renderValue = (key, value) => {
    if (value === null || value === undefined) return <span className="text-ink/20">—</span>;
    
    if (key === 'createdAt' || key === 'date' || key === 'paymentDate') {
      try {
        const d = new Date(value);
        if (isNaN(d.getTime())) return String(value);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      } catch (e) { return String(value); }
    }

    if (Array.isArray(value)) {
      if (value.length === 0) return <span className="text-ink/20">None</span>;
      return (
        <div className="flex flex-wrap gap-1">
          {value.map((v, i) => (
            <span key={i} className="px-2 py-0.5 bg-slate-100 rounded text-[9px] text-ink/60 font-bold">
              {typeof v === 'object' ? (v.name || v.title || v.childId?.name || 'Item') : String(v)}
            </span>
          ))}
        </div>
      );
    }

    if (typeof value === 'object') {
      return value.name || value.title || value.email || (value.trainerId ? value.trainerId.name : null) || <span className="text-[10px] text-brand-blue truncate max-w-[100px] inline-block">ID: ..{String(value._id || value).slice(-6)}</span>;
    }

    if (typeof value === 'string' && value.length > 50) {
      return <span title={value} className="truncate max-w-[150px] inline-block">{value}</span>;
    }

    if (key === 'status' || key === 'paymentStatus' || key === 'sessionStatus') {
      const colors = {
        active: 'text-moss bg-moss/10',
        inactive: 'text-ink/40 bg-slate-100',
        confirmed: 'text-moss bg-moss/10',
        completed: 'text-moss bg-moss/10',
        paid: 'text-moss bg-moss/10',
        pending: 'text-amber-600 bg-amber-50',
        cancelled: 'text-red-600 bg-red-50',
        failed: 'text-red-600 bg-red-50',
        new: 'text-brand-blue bg-brand-blue/10',
        open: 'text-brand-blue bg-brand-blue/10',
        closed: 'text-ink/40 bg-slate-100'
      };
      const statusValue = String(value).toLowerCase();
      return <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${colors[statusValue] || 'bg-slate-50'}`}>{value}</span>;
    }

    return String(value);
  };

  const filteredData = reportData.filter(item => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return JSON.stringify(item).toLowerCase().includes(q);
  });

  const columns = COLUMNS[reportType] || [];

  if (!summary) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />
      <main className="page-shell py-12">
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="font-display text-4xl font-black text-ink tracking-tight">Reports Center</h1>
            <p className="mt-2 text-sm text-ink/50 font-medium">Analytics, activity logs and data exports.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 bg-white border border-slate-200 text-ink px-5 py-2.5 rounded-2xl text-xs font-bold hover:bg-slate-50 transition-all shadow-sm active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-moss" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Export Excel
            </button>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white rounded-[32px] p-8 mb-8 shadow-sm border border-slate-200/60">
          <div className="grid gap-6 md:grid-cols-4 items-end">
            <div className="md:col-span-1">
              <label className="block text-[10px] font-black text-ink/40 uppercase tracking-widest mb-2.5 px-0.5">Data Source</label>
              <select 
                className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl py-3 px-4 text-xs font-bold text-ink focus:ring-2 focus:ring-brand-blue/10 outline-none transition-all cursor-pointer"
                value={reportType}
                onChange={e => setReportType(e.target.value)}
              >
                {REPORT_TYPES.map(type => (
                  <option key={type.id} value={type.id}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black text-ink/40 uppercase tracking-widest mb-2.5 px-0.5">From Date</label>
              <input 
                type="date"
                className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl py-3 px-4 text-xs font-bold text-ink focus:ring-2 focus:ring-brand-blue/10 outline-none transition-all"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-ink/40 uppercase tracking-widest mb-2.5 px-0.5">To Date</label>
              <input 
                type="date"
                className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl py-3 px-4 text-xs font-bold text-ink focus:ring-2 focus:ring-brand-blue/10 outline-none transition-all"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>

            <div>
              <button 
                onClick={fetchReport}
                disabled={loading}
                className="w-full bg-brand-blue text-white py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-brand-blue/15 disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </span>
                ) : 'Refresh Report'}
              </button>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-100 grid gap-6 md:grid-cols-4 items-end">
             <div className="md:col-span-1">
              <label className="block text-[10px] font-black text-ink/40 uppercase tracking-widest mb-2.5 px-0.5">Location</label>
              <select 
                className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl py-3 px-4 text-xs font-bold text-ink focus:ring-2 focus:ring-brand-blue/10 outline-none transition-all cursor-pointer"
                value={locationId}
                onChange={e => setLocationId(e.target.value)}
              >
                <option value="">All Branches</option>
                {locations.map(loc => (
                  <option key={loc._id} value={loc._id}>{loc.name}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-3">
              <label className="block text-[10px] font-black text-ink/40 uppercase tracking-widest mb-2.5 px-0.5">Filter results</label>
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-ink/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input 
                  type="text"
                  placeholder="Filter by name, ID, or any value..."
                  className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl py-3 pl-11 pr-4 text-xs font-bold text-ink focus:ring-2 focus:ring-brand-blue/10 outline-none transition-all"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-slate-200/60">
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left border-collapse table-auto">
              <thead className="bg-[#F8FAFC] border-b border-slate-100">
                <tr>
                  {columns.map(col => (
                    <th key={col.key} className="px-6 py-5 text-[10px] font-black text-ink/40 uppercase tracking-widest whitespace-nowrap">{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {columns.map((_, j) => (
                        <td key={j} className="px-6 py-5"><div className="h-4 bg-slate-50 rounded-lg w-full"></div></td>
                      ))}
                    </tr>
                  ))
                ) : filteredData.length > 0 ? filteredData.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/40 transition-colors group">
                    {columns.map(col => (
                      <td key={col.key} className="px-6 py-5 text-[11px] font-bold text-ink/70">
                        {renderValue(col.key, item[col.key])}
                      </td>
                    ))}
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="100" className="px-6 py-32 text-center">
                       <div className="text-5xl mb-6 opacity-20">📊</div>
                       <h3 className="font-display text-2xl text-ink font-bold">No results found</h3>
                       <p className="text-sm text-ink/40 mt-2 max-w-xs mx-auto font-medium">Try broadening your filters or selecting a different data source.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {filteredData.length > 0 && (
            <div className="px-8 py-5 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center">
              <p className="text-[10px] font-black text-ink/30 uppercase tracking-widest">
                Showing {filteredData.length} records
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

