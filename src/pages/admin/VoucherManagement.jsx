import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/api.js';
import Navbar from '../../components/Navbar.jsx';
import Footer from '../../components/Footer.jsx';
import AdminHeader from '../../components/AdminHeader.jsx';
import { usePermissions } from '../../hooks/usePermissions.js';
import toast from 'react-hot-toast';

export default function VoucherManagement() {
  const { roleSlug } = useParams();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    code: '',
    amount: '',
    expiryDate: '',
    type: 'gift',
    description: '',
    count: 1
  });

  const canManage = can('settings:view'); // Using settings permission for vouchers

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/coupons');
      setCoupons(res.data);
    } catch (err) {
      toast.error('Failed to load vouchers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await api.post('/coupons', formData);
      toast.success(formData.count > 1 ? `${formData.count} vouchers generated` : 'Voucher created');
      resetForm();
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save voucher');
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      amount: '',
      expiryDate: '',
      type: 'gift',
      description: '',
      count: 1
    });
    setIsSidebarOpen(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to revoke this voucher?')) return;
    try {
      await api.delete(`/coupons/${id}`);
      toast.success('Voucher revoked');
      loadData();
    } catch (err) {
      toast.error('Failed to revoke');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="page-shell py-12">
        <AdminHeader 
          title="Voucher Management" 
          description="Generate and track pre-paid gift vouchers and promo codes."
          backTo={`/${roleSlug}`}
        />

        <div className="mt-8 flex justify-between items-center">
          <div className="flex gap-4">
            <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm">
               <p className="text-[10px] font-black text-ink/30 uppercase tracking-widest">Active Vouchers</p>
               <p className="text-2xl font-black text-brand-blue">{coupons.filter(c => c.status === 'active').length}</p>
            </div>
          </div>
          {canManage && (
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="bg-brand-blue text-white px-8 py-4 rounded-2xl font-black shadow-glow hover:scale-105 active:scale-95 transition-all"
            >
              + Generate Voucher
            </button>
          )}
        </div>

        {/* Voucher List */}
        <div className="mt-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-6 text-[10px] font-black text-ink/30 uppercase tracking-widest">Voucher Code</th>
                  <th className="px-8 py-6 text-[10px] font-black text-ink/30 uppercase tracking-widest">Type</th>
                  <th className="px-8 py-6 text-[10px] font-black text-ink/30 uppercase tracking-widest">Value</th>
                  <th className="px-8 py-6 text-[10px] font-black text-ink/30 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-6 text-[10px] font-black text-ink/30 uppercase tracking-widest">Expiry</th>
                  <th className="px-8 py-6 text-[10px] font-black text-ink/30 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {coupons.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-8 py-20 text-center">
                       <p className="text-sm font-bold text-ink/20 italic">No vouchers generated yet.</p>
                    </td>
                  </tr>
                ) : coupons.map(coupon => (
                  <tr key={coupon._id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <span className="font-mono font-black text-brand-blue bg-brand-blue/5 px-3 py-1.5 rounded-lg border border-brand-blue/10">
                        {coupon.code}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-[10px] font-black text-ink uppercase tracking-widest opacity-60">
                        {coupon.type}
                      </span>
                    </td>
                    <td className="px-8 py-6 font-black text-ink">
                      AED {coupon.amount}
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        coupon.status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                        coupon.status === 'redeemed' ? 'bg-brand-blue/5 text-brand-blue border border-brand-blue/10' :
                        'bg-rose-50 text-rose-600 border border-rose-100'
                      }`}>
                        {coupon.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-sm font-bold text-ink/40">
                      {new Date(coupon.expiryDate).toLocaleDateString()}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={() => window.open(`/print/voucher/${coupon._id}`, '_blank')}
                          className="p-2.5 bg-brand-blue/5 text-brand-blue hover:bg-brand-blue hover:text-white rounded-xl transition-all"
                          title="Print Voucher"
                        >
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                        </button>
                        <button 
                          onClick={() => handleDelete(coupon._id)} 
                          className="p-2.5 bg-rose-50 text-rose-400 hover:bg-rose-500 hover:text-white rounded-xl transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar Form */}
        {isSidebarOpen && (
          <div className="fixed inset-0 z-[100] flex justify-end animate-fade-in">
            <div className="absolute inset-0 bg-ink/20 backdrop-blur-sm" onClick={resetForm}></div>
            <div className="relative w-full max-w-lg bg-white shadow-2xl h-screen overflow-y-auto custom-scrollbar animate-slide-left p-10">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="font-display text-3xl font-bold text-ink">Generate Voucher</h2>
                  <p className="text-xs font-black text-brand-blue uppercase tracking-widest mt-1">Configure Issued Properties</p>
                </div>
                <button onClick={resetForm} className="w-12 h-12 rounded-2xl bg-slate-50 text-ink/40 flex items-center justify-center hover:bg-slate-100 transition-all text-xl">×</button>
              </div>

              <form onSubmit={handleSave} className="space-y-8 pb-20">
                <div className="grid gap-6">
                  <div>
                    <label className="text-[10px] font-black text-ink/30 uppercase tracking-[0.2em] block mb-3 px-1">Voucher Type</label>
                    <div className="grid grid-cols-2 gap-3">
                       {['gift', 'promo', 'referral'].map(t => (
                         <button
                           key={t} type="button"
                           onClick={() => setFormData({...formData, type: t})}
                           className={`py-4 rounded-2xl border-2 transition-all font-black uppercase text-[10px] tracking-widest ${formData.type === t ? 'border-brand-blue bg-brand-blue/5 text-brand-blue shadow-md' : 'border-slate-50 bg-white hover:border-slate-200 opacity-60'}`}
                         >
                           {t}
                         </button>
                       ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-ink/30 uppercase tracking-[0.2em] block mb-3 px-1">Voucher Code (Optional)</label>
                    <input 
                      type="text"
                      className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-ink focus:ring-2 focus:ring-brand-blue/20 outline-none uppercase"
                      placeholder="LEAVE EMPTY FOR AUTO-GEN"
                      value={formData.code}
                      onChange={e => setFormData({...formData, code: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] font-black text-ink/30 uppercase tracking-[0.2em] block mb-3 px-1">Value (AED)</label>
                      <input 
                        type="number" required min="1"
                        className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-ink focus:ring-2 focus:ring-brand-blue/20 outline-none"
                        value={formData.amount}
                        onChange={e => setFormData({...formData, amount: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-ink/30 uppercase tracking-[0.2em] block mb-3 px-1">Count (Batch)</label>
                      <input 
                        type="number" required min="1" max="50"
                        className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-ink focus:ring-2 focus:ring-brand-blue/20 outline-none"
                        value={formData.count}
                        onChange={e => setFormData({...formData, count: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-ink/30 uppercase tracking-[0.2em] block mb-3 px-1">Expiry Date</label>
                    <input 
                      type="date" required
                      className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-ink focus:ring-2 focus:ring-brand-blue/20 outline-none"
                      value={formData.expiryDate}
                      onChange={e => setFormData({...formData, expiryDate: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-ink/30 uppercase tracking-[0.2em] block mb-3 px-1">Internal Description</label>
                    <textarea 
                      className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-ink focus:ring-2 focus:ring-brand-blue/20 outline-none min-h-[100px]"
                      placeholder="e.g. Gift for Winner of Summer Camp Tournament"
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                    />
                  </div>
                </div>

                <div className="pt-8">
                   <button 
                     type="submit"
                     className="w-full bg-brand-blue text-white py-5 rounded-[24px] font-black text-lg shadow-glow hover:scale-[1.02] active:scale-95 transition-all"
                   >
                     {formData.count > 1 ? `Generate ${formData.count} Vouchers` : 'Issue Voucher'}
                   </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
