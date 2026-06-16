import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { shiftApi } from '../api/shiftApi.js';

export default function ShiftModal({ isOpen, onClose, currentShift, onShiftChange }) {
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (amount === '' || isNaN(amount) || Number(amount) < 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      if (currentShift) {
        // Closing Shift
        await shiftApi.closeShift({ actualCash: Number(amount), notes });
        toast.success('Shift closed successfully');
      } else {
        // Opening Shift
        await shiftApi.openShift({ startingCash: Number(amount) });
        toast.success('Shift opened successfully');
      }
      onShiftChange();
      onClose();
      setAmount('');
      setNotes('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update shift');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl text-ink">
            {currentShift ? 'Close Shift' : 'Open Shift'}
          </h2>
          <button onClick={onClose} className="text-ink/40 hover:text-ink transition-colors">
            ✕
          </button>
        </div>

        {currentShift && (
          <div className="mb-6 rounded-2xl bg-amber-50 p-4 border border-amber-100">
            <p className="text-xs font-bold text-amber-800 uppercase tracking-widest mb-1">Shift Started</p>
            <p className="text-sm font-medium text-amber-900">
              {new Date(currentShift.openedAt).toLocaleString()}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-bold text-ink">
              {currentShift ? 'Actual Cash in Drawer' : 'Starting Cash in Drawer'}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40 font-bold">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 py-4 pl-8 pr-4 text-lg font-black outline-none transition-colors focus:border-brand-blue focus:bg-white"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          {currentShift && (
            <div>
              <label className="mb-2 block text-sm font-bold text-ink">Closing Notes (Optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 p-4 text-sm outline-none transition-colors focus:border-brand-blue focus:bg-white min-h-[100px]"
                placeholder="Any discrepancies or comments..."
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-6 py-3 text-sm font-bold text-ink/60 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`rounded-xl px-8 py-3 text-sm font-black text-white transition-colors disabled:opacity-50 ${
                currentShift ? 'bg-rose-500 hover:bg-rose-600' : 'bg-emerald-500 hover:bg-emerald-600'
              }`}
            >
              {loading ? 'Processing...' : currentShift ? 'Close Shift' : 'Open Shift'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
