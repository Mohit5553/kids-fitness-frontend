import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/api.js';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function InvoiceView() {
   const { bookingId } = useParams();
   const navigate = useNavigate();
   const [invoice, setInvoice] = useState(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState(null);
   const printRef = useRef();

   useEffect(() => {
      const fetchInvoice = async () => {
         try {
            const res = await api.get(`/invoices/booking/${bookingId}`);
            setInvoice(res.data);
         } catch (err) {
            console.error('Invoice fetch error:', err);
            setError('Invoice not found or could not be generated.');
         } finally {
            setLoading(false);
         }
      };
      fetchInvoice();
   }, [bookingId]);

   if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-brand-blue uppercase tracking-widest animate-pulse">Generating Secure Invoice...</div>;
   if (error || !invoice) return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
         <div className="soft-card p-12 text-center max-w-md">
            <span className="text-6xl mb-6 block grayscale">📄</span>
            <h2 className="text-2xl font-black text-ink mb-4">Invoice Processing</h2>
            <p className="text-sm font-bold text-ink/40 mb-8 leading-relaxed">The invoice for this booking is being finalized. Please check back in a moment.</p>
            <button onClick={() => navigate(-1)} className="w-full py-4 bg-brand-blue text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-brand-blue/20">Go Back</button>
         </div>
      </div>
   );

   return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
         <style>
            {`
          @media print {
            @page {
              size: A4;
              margin: 0mm;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              background: white !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            .print\\:hidden, 
            .site-header, 
            .site-footer, 
            button, 
            [id*="chat"], 
            [class*="chat"], 
            iframe {
              display: none !important;
            }
            main {
              margin: 0 !important;
              padding: 0 !important;
              display: block !important;
            }
            .invoice-container {
              width: 210mm !important;
              margin: 0 auto !important;
              padding: 0 !important;
              box-shadow: none !important;
              border: none !important;
              border-radius: 0 !important;
              display: block !important;
            }
            .invoice-content {
               padding: 15mm !important;
               box-sizing: border-box;
            }
          }
        `}
         </style>

         <Navbar className="print:hidden" />

         <main className="flex-1 py-12 px-4 md:py-20 flex justify-center print:p-0 print:bg-white overflow-x-hidden">
            <div className="invoice-container w-full max-w-[900px]">
               <div className="invoice-content bg-white rounded-[3rem] shadow-2xl border border-slate-100/50 overflow-hidden relative">
                  
                  {/* Decorative Elements - Hidden on Print */}
                  <div className="absolute top-0 right-0 w-96 h-96 bg-brand-blue/5 rounded-full -mr-48 -mt-48 blur-3xl print:hidden" />
                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-coral/5 rounded-full -ml-32 -mb-32 blur-3xl print:hidden" />

                  {/* Header Section */}
                  <div className="relative p-12 md:p-16 border-b border-slate-50 print:p-8">
                     
                     <div className="absolute top-12 right-12 z-20 print:top-8 print:right-8">
                        <div className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg ${
                              invoice.status === 'paid' ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 
                              invoice.status === 'cancelled' ? 'bg-slate-400 text-white shadow-slate-400/20' : 
                              'bg-amber-500 text-white shadow-amber-500/20'}`}>
                           {invoice.status === 'paid' ? '✓ Paid In Full' : 
                            invoice.status === 'cancelled' ? '✕ Cancelled / Refunded' : 
                            '! Payment Due'}
                        </div>
                     </div>

                     <div className="grid md:grid-cols-2 gap-12 items-start print:grid-cols-2 print:gap-4">
                        <div className="space-y-6">
                           <h1 className="font-display text-4xl font-black text-ink flex items-center gap-4 tracking-tighter print:text-3xl">
                              <span className="bg-brand-blue text-white p-2 rounded-xl not-italic text-2xl h-12 w-12 flex items-center justify-center">JTS</span>
                              FITNESS
                           </h1>
                           <div className="flex flex-col items-start gap-4">
                              <h2 className="text-sm font-black text-brand-blue uppercase tracking-[0.3em] opacity-60">Official Receipt</h2>
                              <button 
                                 onClick={() => window.print()} 
                                 className="px-8 py-3 bg-brand-blue text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-xl shadow-brand-blue/20 hover:shadow-brand-blue/30 hover:-translate-y-0.5 transition-all flex items-center gap-3 print:hidden"
                              >
                                 <span>🖨️</span> Print Invoice
                              </button>
                           </div>
                        </div>
                        <div className="text-left md:text-right pt-6 md:pt-16 print:pt-6">
                           <div className="space-y-3">
                              <div className="flex items-center gap-4 md:justify-end">
                                 <span className="text-[10px] font-black text-ink/20 uppercase tracking-[0.2em]">Invoice No</span>
                                 <span className="text-xl font-black text-brand-blue tracking-tighter leading-none print:text-lg">{invoice.invoiceNumber}</span>
                              </div>
                              <div className="flex items-center gap-4 md:justify-end">
                                 <span className="text-[10px] font-black text-ink/20 uppercase tracking-[0.2em]">Date</span>
                                 <span className="text-sm font-black text-ink leading-none">{new Date(invoice.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                              </div>
                              {invoice.bookingId?.bookingNumber && (
                                 <div className="flex items-center gap-4 md:justify-end">
                                    <span className="text-[10px] font-black text-ink/20 uppercase tracking-[0.2em]">Reference</span>
                                    <span className="text-sm font-black text-ink leading-none">#{invoice.bookingId.bookingNumber}</span>
                                 </div>
                              )}
                           </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-12 mb-16 mt-16 relative z-10 px-2 print:mb-10 print:mt-10 print:gap-8">
                        <div className="space-y-6 print:space-y-3">
                           <p className="inline-block px-3 py-1 bg-brand-blue/5 rounded-lg text-[10px] font-black text-brand-blue uppercase tracking-[0.2em]">Bill From</p>
                           <div>
                              <h3 className="font-black text-ink text-2xl tracking-tight print:text-xl">JTS Kids Fitness</h3>
                              <p className="text-sm text-ink/50 mt-2 whitespace-pre-line leading-relaxed font-bold print:text-xs">
                                 Dubai, UAE\nUnited Arab Emirates
                              </p>
                           </div>
                        </div>
                        <div className="space-y-6 print:space-y-3">
                           <p className="inline-block px-3 py-1 bg-brand-blue/5 rounded-lg text-[10px] font-black text-brand-blue uppercase tracking-[0.2em]">Bill To</p>
                           <div>
                              <h3 className="font-black text-ink text-2xl tracking-tight print:text-xl">{invoice.userId?.name || invoice.guestDetails?.name || 'Valued Customer'}</h3>
                              <p className="text-sm text-ink/50 mt-2 whitespace-pre-line leading-relaxed font-bold print:text-xs">
                                 {invoice.userId?.email || invoice.guestDetails?.email}
                              </p>
                           </div>
                        </div>
                     </div>

                     <div className="mb-16 print:mb-8">
                        <table className="w-full border-collapse">
                           <thead>
                              <tr className="border-b-4 border-slate-50">
                                 <th className="py-6 text-[11px] font-black text-ink/30 uppercase tracking-[0.3em] text-left">Description</th>
                                 <th className="py-6 px-4 text-[11px] font-black text-ink/30 uppercase tracking-[0.3em] text-center">Qty</th>
                                 <th className="py-6 px-4 text-[11px] font-black text-ink/30 uppercase tracking-[0.3em] text-right">Rate</th>
                                 <th className="py-6 text-[11px] font-black text-ink/30 uppercase tracking-[0.3em] text-right">Amount</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-50">
                              {invoice.items.map((item, idx) => (
                                 <tr key={idx}>
                                    <td className="py-8 print:py-4">
                                       <p className="font-black text-ink text-xl tracking-tight print:text-lg">{item.description}</p>
                                       {invoice.bookingId?.participants?.length > 0 && (
                                         <p className="text-xs font-black text-brand-blue uppercase tracking-widest mt-1">
                                           Participant: {invoice.bookingId.participants[0].name}
                                         </p>
                                       )}
                                       <p className="text-xs text-ink/20 font-black uppercase tracking-widest mt-2 italic">Professional Training Services</p>
                                    </td>
                                    <td className="py-8 px-4 text-center font-black text-ink/40 print:py-4">{item.quantity}</td>
                                    <td className="py-8 px-4 text-right font-black text-ink/40 print:py-4">AED {item.unitPrice.toFixed(2)}</td>
                                    <td className="py-8 text-right font-black text-ink text-2xl tracking-tighter print:py-4 print:text-xl">AED {item.total.toFixed(2)}</td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>

                     <div className="flex flex-col items-end gap-3 p-12 bg-slate-50/50 rounded-[2.5rem] print:p-6 print:bg-white print:border print:border-slate-100">
                        <div className="flex items-center gap-8 justify-between w-full max-w-[300px]">
                           <span className="text-[10px] font-black text-ink/30 uppercase tracking-[0.3em]">Subtotal</span>
                           <span className="text-sm font-black text-ink/60 tracking-tight">AED {invoice.totalAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-8 justify-between w-full max-w-[300px]">
                           <span className="text-[10px] font-black text-ink/30 uppercase tracking-[0.3em]">Tax (VAT 0%)</span>
                           <span className="text-sm font-black text-ink/60 tracking-tight">AED 0.00</span>
                        </div>
                        <div className="h-px w-full max-w-[300px] bg-slate-200 mt-4 mb-2" />
                        <div className="flex items-center gap-8 justify-between w-full max-w-[300px]">
                           <span className="text-xs font-black text-ink uppercase tracking-[0.3em]">Grand Total</span>
                           <span className="text-3xl font-black text-brand-blue tracking-tighter">AED {invoice.totalAmount.toFixed(2)}</span>
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
