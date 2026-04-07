import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar.jsx';
import Footer from '../../components/Footer.jsx';
import AdminHeader from '../../components/AdminHeader.jsx';
import api from '../../api/api.js';
import toast from 'react-hot-toast';
import { usePermissions } from '../../hooks/usePermissions.js';

export default function SystemSettings() {
  const [counters, setCounters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputValues, setInputValues] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  
  const { can } = usePermissions();

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/settings/counters');
      setCounters(res.data || []);
      // Initialize input values
      const vals = {};
      res.data.forEach(c => { vals[c.name] = c.seq; });
      setInputValues(vals);
    } catch (err) {
      toast.error('Failed to load system settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleUpdateCounter = async (name) => {
    const newSeq = inputValues[name];
    if (newSeq === undefined || isNaN(newSeq)) {
      toast.error('Please enter a valid number');
      return;
    }

    const currentCounter = counters.find(c => c.name === name);
    if (Number(newSeq) === currentCounter?.seq) {
       toast.info('No changes made');
       return;
    }

    if (!window.confirm(`Are you sure you want to change the next sequence for ${name}? Setting this incorrectly may lead to duplicate numbers.`)) return;
    
    setIsSaving(true);
    try {
      await api.put(`/settings/counters/${name}`, { seq: Number(newSeq) });
      toast.success(`${name} sequence updated`);
      loadSettings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update sequence');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <Navbar />
      <main className="page-shell py-12 min-h-[80vh]">
        <AdminHeader 
          title="System Setup" 
          description="Manage global configurations, numbering sequences, and administrative overrides."
        />

        <div className="mt-8 grid gap-8 max-w-4xl">
          {/* Invoice Settings Section */}
          <section className="soft-card rounded-[40px] p-8 border-2 border-slate-50 bg-white/80 backdrop-blur-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-brand-blue/10 flex items-center justify-center text-2xl">
                📄
              </div>
              <div>
                <h2 className="text-2xl font-display text-ink">Invoice Generation</h2>
                <p className="text-sm text-ink/40">Adjust consecutive numbering for billing</p>
              </div>
            </div>

            <div className="space-y-6">
              {loading ? (
                <div className="h-24 bg-slate-50 animate-pulse rounded-2xl" />
              ) : (
                <div className="grid gap-6">
                  {counters.filter(c => c.name === 'invoice').map(c => (
                    <div key={c.name} className="p-6 rounded-3xl bg-slate-50/50 border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div>
                        <h4 className="font-bold text-ink mb-1">Next Sequence Number</h4>
                        <p className="text-xs text-ink/50 leading-relaxed max-w-sm">
                          Set the current high-water mark. If you set this to <strong>5000</strong>, 
                          the next invoice issued will be <strong>5001</strong>.
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1">
                          <input 
                            type="number"
                            className="w-full md:w-40 bg-white rounded-2xl border-2 border-slate-200 p-4 font-black text-xl text-brand-blue focus:border-brand-blue outline-none transition-all"
                            value={inputValues[c.name] || ''}
                            onChange={(e) => setInputValues({ ...inputValues, [c.name]: e.target.value })}
                          />
                        </div>
                        <button 
                          onClick={() => handleUpdateCounter(c.name)}
                          disabled={isSaving}
                          className="p-4 rounded-2xl bg-brand-blue text-white shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 transition-all font-bold text-sm px-6"
                        >
                          {isSaving ? '...' : 'Update'}
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {counters.filter(c => c.name === 'invoice').length === 0 && (
                     <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <p className="text-sm text-ink/30 italic">Invoice counter not initialized. It will appear after the first booking.</p>
                     </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-8 pt-8 border-t border-slate-100 grid gap-4 sm:grid-cols-2">
               <div className="p-4 rounded-2xl bg-ocean/5 border border-ocean/10">
                  <h5 className="text-[10px] font-black text-ocean uppercase tracking-widest mb-1">Prefix Format</h5>
                  <p className="text-sm font-bold text-ink">INV-{new Date().getFullYear()}-XXXX</p>
               </div>
               <div className="p-4 rounded-2xl bg-coral/5 border border-coral/10">
                  <h5 className="text-[10px] font-black text-coral uppercase tracking-widest mb-1">Safety Lock</h5>
                  <p className="text-sm font-bold text-ink">Strict Unique Check Active</p>
               </div>
            </div>
          </section>

          {/* Warning Section */}
          <div className="p-6 rounded-3xl bg-amber-50 border-2 border-amber-100 flex gap-4 items-start">
             <span className="text-2xl">⚠️</span>
             <div>
                <h4 className="text-sm font-black text-amber-800 uppercase tracking-widest">Administrative Warning</h4>
                <p className="mt-1 text-sm text-amber-700/80 leading-relaxed font-medium">
                   Decreasing the sequence number might cause <strong>Duplicate Key Errors</strong> if the invoice number already exists in the system. 
                   Only reset this if you are absolutely sure of your accounting trail.
                </p>
             </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
