import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/api.js';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';

export default function InvoiceView() {
  const { id, bookingId } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    const endpoint = bookingId ? `/invoices/booking/${bookingId}` : `/invoices/${id}`;
    api.get(endpoint)
      .then((res) => {
        setInvoice(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Invoice not found');
        setLoading(false);
      });
  }, [id, bookingId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <div className="text-6xl mb-4">📄</div>
        <h1 className="text-2xl font-black text-ink mb-2">Invoice Not Found</h1>
        <p className="text-ink/40 mb-8">{error || 'We could not find the invoice you requested.'}</p>
        <button onClick={() => navigate(-1)} className="bg-brand-blue text-white px-8 py-3 rounded-2xl font-bold shadow-xl">Go Back</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar className="print:hidden" />
      
      <main className="flex-1 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Actions - Hidden on Print */}
          <div className="flex justify-between items-center mb-8 print:hidden">
            <button onClick={() => navigate(-1)} className="text-sm font-bold text-ink/40 hover:text-ink flex items-center gap-2">
               <span>←</span> Back to Bookings
            </button>
            <button
               onClick={handlePrint}
               className="bg-brand-blue text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-brand-blue/20 hover:scale-105 transition-all flex items-center gap-2"
            >
               <span>🖨️</span> Print Invoice
            </button>
          </div>

          {/* Invoice Document */}
          <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden print:shadow-none print:rounded-none border border-slate-100 print:border-none">
            {/* Header */}
            <div className="bg-brand-blue p-12 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
               <div>
                  <h1 className="text-4xl font-black italic tracking-tighter">JTS FITNESS</h1>
                  <p className="mt-2 text-white/70 font-medium">{invoice.locationId?.name || 'Main Center'}</p>
                  <p className="text-white/50 text-xs font-bold uppercase tracking-widest mt-1">{invoice.locationId?.address || 'Junior Training Systems'}</p>
               </div>
               <div className="text-left md:text-right">
                   <h2 className="text-5xl font-black uppercase opacity-20">Invoice</h2>
                   <p className="mt-4 text-xl font-bold">{invoice.invoiceNumber}</p>
                   {invoice.bookingId?.bookingNumber && (
                     <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mt-1">Booking #{invoice.bookingId.bookingNumber}</p>
                   )}
                   <p className="text-white/60 text-sm font-medium italic mt-2">Issued on {new Date(invoice.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
               </div>
            </div>

            <div className="p-12">
               {/* Addresses */}
               <div className="grid md:grid-cols-2 gap-12 mb-16">
                  <div>
                     <p className="text-[10px] font-black text-ink/20 uppercase tracking-widest mb-4">Invoice From</p>
                     <h3 className="font-bold text-ink text-lg">JTS Kids Fitness</h3>
                     <p className="text-sm text-ink/50 mt-2 whitespace-pre-line leading-relaxed">
                        {invoice.locationId?.address || 'Dubai, UAE\nUnited Arab Emirates'}
                     </p>
                     <p className="text-sm font-bold text-brand-blue mt-2">{invoice.locationId?.email || 'hello@jtsfitness.com'}</p>
                     <p className="text-sm font-medium text-ink/40">{invoice.locationId?.phone || '+971 00 000 0000'}</p>
                  </div>
                  <div>
                     <p className="text-[10px] font-black text-ink/20 uppercase tracking-widest mb-4">Invoice To</p>
                     <h3 className="font-bold text-ink text-lg">{invoice.userId?.name || invoice.guestDetails?.name || 'Valued Customer'}</h3>
                     <p className="text-sm text-ink/50 mt-2 whitespace-pre-line leading-relaxed">
                        {invoice.userId?.address || 'Customer Address Not Provided'}
                     </p>
                     <p className="text-sm font-bold text-brand-blue mt-2">{invoice.userId?.email || invoice.guestDetails?.email || 'customer@example.com'}</p>
                     <p className="text-sm font-medium text-ink/40">{invoice.userId?.phone || invoice.guestDetails?.phone || ''}</p>
                  </div>
               </div>

               {/* Table */}
               <div className="mb-12 overflow-x-auto">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="border-b-2 border-slate-50">
                           <th className="py-4 text-[10px] font-black text-ink/30 uppercase tracking-widest">Description</th>
                           <th className="py-4 px-4 text-[10px] font-black text-ink/30 uppercase tracking-widest text-center">Qty</th>
                           <th className="py-4 px-4 text-[10px] font-black text-ink/30 uppercase tracking-widest text-right">Unit Price</th>
                           <th className="py-4 text-[10px] font-black text-ink/30 uppercase tracking-widest text-right">Total</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        {invoice.items.map((item, idx) => (
                           <tr key={idx}>
                              <td className="py-6">
                                 <p className="font-bold text-ink">{item.description}</p>
                              </td>
                              <td className="py-6 px-4 text-center font-bold text-ink/40">{item.quantity}</td>
                              <td className="py-6 px-4 text-right font-bold text-ink/40">AED {item.unitPrice.toFixed(2)}</td>
                              <td className="py-6 text-right font-black text-ink">AED {item.total.toFixed(2)}</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>

               {/* Summary */}
               <div className="flex justify-end pt-8 border-t-2 border-slate-50">
                  <div className="w-full md:w-64 space-y-4">
                     <div className="flex justify-between items-center text-sm">
                        <span className="font-bold text-ink/30 uppercase tracking-widest">Subtotal</span>
                        <span className="font-bold text-ink">AED {invoice.amount.toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between items-center text-sm">
                        <span className="font-bold text-ink/30 uppercase tracking-widest">Tax (0%)</span>
                        <span className="font-bold text-ink">AED 0.00</span>
                     </div>
                     <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                        <span className="text-lg font-black text-ink uppercase tracking-tighter">Total Due</span>
                        <div className="text-right">
                           <span className="text-2xl font-black text-brand-blue tracking-tighter">AED {invoice.amount.toFixed(2)}</span>
                           <span className={`block text-[8px] font-black uppercase mt-1 ${invoice.status === 'paid' ? 'text-emerald-500' : 'text-amber-500'}`}>
                              {invoice.status}
                           </span>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Footer */}
               <div className="mt-24 pt-12 border-t border-slate-50 text-center">
                  <p className="text-[10px] font-black text-ink/20 uppercase tracking-[0.2em] mb-4">Terms & Conditions</p>
                  <p className="text-[10px] text-ink/40 leading-relaxed max-w-lg mx-auto">
                     Please make payment at the center reception before the class starts. Invoices for card payments are generated automatically. 
                     For any queries, contact our support team at hello@jtsfitness.com.
                  </p>
                  <div className="mt-8 flex justify-center gap-8 opacity-20 filter grayscale print:opacity-100">
                     <div className="text-[2rem]">🦾</div>
                     <div className="text-[2rem]">👟</div>
                     <div className="text-[2rem]">🎖️</div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </main>

      <Footer className="print:hidden" />
    </div>
  );
}
