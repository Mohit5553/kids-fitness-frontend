import { useState } from 'react';
import api from '../api/api.js';
import toast from 'react-hot-toast';

export default function ExtensionRequestForm({ membershipId, sessionId, onClose, onSuccess, type = 'reschedule' }) {
  const [reason, setReason] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newSlot, setNewSlot] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/extensions/request', {
        membershipId,
        targetSessionId: sessionId,
        type,
        reason,
        newDate: type === 'reschedule' ? newDate : undefined,
        newSlot: type === 'reschedule' ? newSlot : undefined
      });
      toast.success('Request submitted for admin approval');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-[2rem] bg-white p-8 shadow-2xl animate-scale-up">
        <h3 className="font-display text-2xl font-black text-ink mb-2">
          {type === 'reschedule' ? 'Reschedule Session' : 'Extend Membership'}
        </h3>
        <p className="text-xs font-bold text-ink/40 uppercase tracking-widest mb-6">
          Admin Approval Required
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-ink/30 mb-2 ml-2">Reason</label>
            <textarea
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-2xl border-none bg-slate-50 p-4 text-sm font-bold text-ink focus:ring-4 focus:ring-brand-blue/5 outline-none transition-all placeholder:text-ink/20 min-h-[100px]"
              placeholder="e.g. Health issues, travelling..."
            />
          </div>

          {type === 'reschedule' && (
            <>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-ink/30 mb-2 ml-2">Suggested New Date</label>
                <input
                  type="date"
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full rounded-2xl border-none bg-slate-50 p-4 text-sm font-bold text-ink focus:ring-4 focus:ring-brand-blue/5 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-ink/30 mb-2 ml-2">Suggested New Slot</label>
                <input
                  type="text"
                  required
                  value={newSlot}
                  onChange={(e) => setNewSlot(e.target.value)}
                  className="w-full rounded-2xl border-none bg-slate-50 p-4 text-sm font-bold text-ink focus:ring-4 focus:ring-brand-blue/5 outline-none transition-all"
                  placeholder="e.g. 10:00 AM"
                />
              </div>
            </>
          )}

          <div className="flex flex-col gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-brand-blue py-4 text-sm font-black text-white shadow-xl shadow-brand-blue/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 text-xs font-black uppercase tracking-widest text-ink/30 hover:text-ink/60 transition-all"
            >
              Go Back
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
