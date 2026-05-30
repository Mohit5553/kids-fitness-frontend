import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../../components/Navbar.jsx';
import Footer from '../../components/Footer.jsx';
import AdminHeader from '../../components/AdminHeader.jsx';
import api from '../../api/api.js';
import * as XLSX from 'xlsx';

export default function ProfitLoss() {
  const { roleSlug } = useParams();
  const [locations, setLocations] = useState([]);
  
  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [locationId, setLocationId] = useState('');
  const [excludedCategories, setExcludedCategories] = useState([]);
  
  const [reportData, setReportData] = useState({ revenues: [], expenses: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
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
      const res = await api.get(`/reports/profit_loss`, { params });
      setReportData(res.data || { revenues: [], expenses: [] });
    } catch (error) {
      console.error('Failed to fetch profit loss report:', error);
      alert('Failed to fetch report data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const activeExpenses = reportData.expenses.filter(e => !excludedCategories.includes(e.category));

  const totalRevenue = reportData.revenues.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const totalExpenses = activeExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const netProfit = totalRevenue - totalExpenses;

  const uniqueCategories = Array.from(new Set(reportData.expenses.map(e => e.category))).filter(Boolean);

  const toggleCategory = (cat) => {
    setExcludedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleExport = () => {
    if (reportData.revenues.length === 0 && reportData.expenses.length === 0) {
      alert('No data to export');
      return;
    }

    const wb = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
      { Metric: 'Total Sales', Amount: totalRevenue },
      { Metric: 'Total Expenses', Amount: totalExpenses },
      { Metric: 'Net Profit', Amount: netProfit }
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

    // Sales Sheet
    if (reportData.revenues.length > 0) {
      const salesData = reportData.revenues.map(item => ({
        Date: new Date(item.date).toLocaleDateString('en-GB'),
        Type: item.type,
        Customer: item.customerName,
        Location: item.location,
        Amount: item.amount
      }));
      const wsSales = XLSX.utils.json_to_sheet(salesData);
      XLSX.utils.book_append_sheet(wb, wsSales, "Sales");
    }

    // Expenses Sheet
    if (activeExpenses.length > 0) {
      const expensesData = activeExpenses.map(item => ({
        Date: new Date(item.date).toLocaleDateString('en-GB'),
        Title: item.title,
        Category: item.category,
        Location: item.location,
        Amount: item.amount
      }));
      const wsExpenses = XLSX.utils.json_to_sheet(expensesData);
      XLSX.utils.book_append_sheet(wb, wsExpenses, "Expenses");
    }

    let filename = `Profit_Loss_Report`;
    if (startDate && endDate) {
      filename += `_${startDate}_to_${endDate}`;
    }
    XLSX.writeFile(wb, `${filename}.xlsx`);
  };

  // Render helpers
  const formatCurrency = (val) => `AED ${Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />
      <main className="page-shell py-12">
        <AdminHeader 
          title="Profit & Loss" 
          description="Analyze total sales versus expenses for your business."
          backTo={`/${roleSlug}`}
        />

        <div className="bg-white rounded-[32px] p-8 mb-8 mt-8 shadow-sm border border-slate-200/60">
          <div className="grid gap-6 md:grid-cols-5 items-end">
             <div className="md:col-span-1">
              <label className="block text-[10px] font-black text-ink/40 uppercase tracking-widest mb-2.5 px-0.5">Location / Store</label>
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
                {loading ? 'Calculating...' : 'Calculate'}
              </button>
            </div>
            <div>
              <button
                onClick={handleExport}
                className="w-full bg-white border border-slate-200 text-ink py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 active:scale-[0.98] transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-moss" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Category Exclusion Filters */}
        {uniqueCategories.length > 0 && (
          <div className="mb-8 max-w-sm">
            <label className="block text-[10px] font-black text-ink/40 uppercase tracking-widest mb-2.5 px-0.5">Exclude Expense Categories</label>
            <select
                className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl py-3 px-4 text-xs font-bold text-ink focus:ring-2 focus:ring-brand-blue/10 outline-none transition-all cursor-pointer"
                value=""
                onChange={(e) => {
                  if (e.target.value && !excludedCategories.includes(e.target.value)) {
                    setExcludedCategories(prev => [...prev, e.target.value]);
                  }
                }}
            >
              <option value="">Select category to exclude...</option>
              {uniqueCategories.filter(cat => !excludedCategories.includes(cat)).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            
            {excludedCategories.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {excludedCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className="px-4 py-2 rounded-xl text-xs font-bold transition-all border bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100 flex items-center gap-2"
                  >
                    <span>{cat}</span>
                    <span>✕</span>
                  </button>
                ))}
              </div>
            )}
            
            {excludedCategories.length > 0 && (
              <p className="mt-3 text-[10px] text-rose-500 font-bold">
                * Note: Excluded categories are not counted in Total Expense or Net Profit.
              </p>
            )}
          </div>
        )}

        {/* Summary Cards */}
        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="soft-card block rounded-2xl p-6 transition-all shadow-sm bg-white border border-slate-200">
            <p className="text-xs font-bold text-ink/40 uppercase tracking-widest">Total Sales</p>
            <p className={`mt-3 text-3xl font-black text-moss ${loading ? 'animate-pulse' : ''}`}>
              {loading ? '—' : formatCurrency(totalRevenue)}
            </p>
            <div className="mt-4 h-1 w-10 rounded-full bg-moss/70" />
          </div>
          <div className="soft-card block rounded-2xl p-6 transition-all shadow-sm bg-white border border-slate-200">
            <p className="text-xs font-bold text-ink/40 uppercase tracking-widest">Total Expense</p>
            <p className={`mt-3 text-3xl font-black text-rose-500 ${loading ? 'animate-pulse' : ''}`}>
              {loading ? '—' : formatCurrency(totalExpenses)}
            </p>
            <div className="mt-4 h-1 w-10 rounded-full bg-rose-500/70" />
          </div>
          <div className={`soft-card block rounded-2xl p-6 transition-all shadow-sm border ${netProfit >= 0 ? 'bg-moss/5 border-moss/20' : 'bg-rose-50 border-rose-200'}`}>
            <p className={`text-xs font-bold uppercase tracking-widest ${netProfit >= 0 ? 'text-moss/70' : 'text-rose-500/70'}`}>Net Profit</p>
            <p className={`mt-3 text-3xl font-black ${loading ? 'animate-pulse' : ''} ${netProfit >= 0 ? 'text-moss' : 'text-rose-600'}`}>
              {loading ? '—' : formatCurrency(netProfit)}
            </p>
            <div className={`mt-4 h-1 w-10 rounded-full ${netProfit >= 0 ? 'bg-moss' : 'bg-rose-500'}`} />
          </div>
        </section>

        <div className="mt-10 grid md:grid-cols-2 gap-8">
          {/* Revenue Breakdown */}
          <div className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-slate-200/60">
             <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/30">
               <h2 className="text-[11px] font-black text-brand-blue uppercase tracking-[0.2em]">Sales Details</h2>
             </div>
             <div className="p-6 max-h-[500px] overflow-y-auto">
               {reportData.revenues.length === 0 ? (
                 <p className="text-sm text-ink/40 text-center py-10">No sales in this period.</p>
               ) : (
                 <ul className="space-y-4">
                   {reportData.revenues.map(item => (
                     <li key={item._id} className="flex justify-between items-center p-4 border border-slate-100 rounded-2xl bg-slate-50/50">
                       <div>
                         <p className="text-xs font-bold text-ink">{item.type} - {item.customerName}</p>
                         <p className="text-[10px] text-ink/40 mt-1">{new Date(item.date).toLocaleDateString()} • {item.location}</p>
                       </div>
                       <span className="font-black text-moss text-sm">{formatCurrency(item.amount)}</span>
                     </li>
                   ))}
                 </ul>
               )}
             </div>
          </div>
          
          {/* Expense Breakdown */}
          <div className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-slate-200/60">
             <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/30">
               <h2 className="text-[11px] font-black text-brand-blue uppercase tracking-[0.2em]">Expense Details</h2>
             </div>
             <div className="p-6 max-h-[500px] overflow-y-auto">
               {activeExpenses.length === 0 ? (
                 <p className="text-sm text-ink/40 text-center py-10">No expenses in this period.</p>
               ) : (
                 <ul className="space-y-4">
                   {activeExpenses.map(item => (
                     <li key={item._id} className="flex justify-between items-center p-4 border border-slate-100 rounded-2xl bg-slate-50/50">
                       <div>
                         <p className="text-xs font-bold text-ink">{item.title}</p>
                         <p className="text-[10px] text-ink/40 mt-1">
                           <span className="px-1.5 py-0.5 bg-slate-200 rounded text-ink/60 uppercase font-bold mr-2">{item.category}</span>
                           {new Date(item.date).toLocaleDateString()} • {item.location}
                         </p>
                       </div>
                       <span className="font-black text-rose-500 text-sm">-{formatCurrency(item.amount)}</span>
                     </li>
                   ))}
                 </ul>
               )}
             </div>
          </div>
        </div>

      </main>
      <Footer />
    </div>
  );
}
