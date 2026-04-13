import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/api.js';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// Helper function to convert number to words for AED
const numberToWords = (num) => {
   const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'];
   const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
   const teens = ['TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];

   const convert = (n) => {
      if (n < 10) return ones[n];
      if (n < 20) return teens[n - 10];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
      if (n < 1000) return ones[Math.floor(n / 100)] + ' HUNDRED' + (n % 100 !== 0 ? ' AND ' + convert(n % 100) : '');
      return n.toString();
   };

   if (num === 0) return 'ZERO FILS';
   
   const integerPart = Math.floor(num);
   const decimalPart = Math.round((num - integerPart) * 100);

   let words = convert(integerPart);
   if (decimalPart > 0) {
      words += ' AND ' + convert(decimalPart) + ' FILS';
   } else {
      words += ' AND ZERO FILS';
   }
   
   return words + ' ONLY';
};

export default function InvoiceView() {
   const { bookingId } = useParams();
   const navigate = useNavigate();
   const [invoice, setInvoice] = useState(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState(null);

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

   if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-brand-blue uppercase tracking-widest animate-pulse font-display">Generating Official Receipt...</div>;
   
   if (error || !invoice) return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 font-display">
         <div className="soft-card p-12 text-center max-w-md">
            <span className="text-6xl mb-6 block grayscale">📄</span>
            <h2 className="text-2xl font-black text-ink mb-4">Invoice Processing</h2>
            <p className="text-sm font-bold text-ink/40 mb-8 leading-relaxed uppercase tracking-widest">The invoice for this booking is being finalized. Please check back in a moment.</p>
            <button onClick={() => navigate(-1)} className="w-full py-4 bg-brand-blue text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-brand-blue/20 transition-all hover:-translate-y-1">Go Back</button>
         </div>
      </div>
   );

   const subtotal = invoice.items?.reduce((sum, item) => sum + (item.total || 0), 0) || 0;
   const finalTotal = invoice.totalAmount || subtotal;
   const totalInWords = numberToWords(finalTotal);

   return (
      <div className="min-h-screen bg-white md:bg-slate-50 flex flex-col font-display">
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
               min-height: 297mm;
            }
          }
        `}
         </style>

         <Navbar className="print:hidden" />
          <main className="flex-1 py-12 px-4 md:py-16 flex justify-center print:p-0 print:bg-white overflow-x-hidden">
            <div className="invoice-container w-full max-w-[850px] print:w-full">
               <div className="invoice-content bg-white md:rounded-[2.5rem] md:shadow-2xl md:border md:border-slate-100/50 overflow-hidden relative">
                  
                  {/* Decorative Elements - Hidden on Print */}
                  <div className="absolute top-0 right-0 w-96 h-96 bg-brand-blue/5 rounded-full -mr-48 -mt-48 blur-3xl print:hidden" />
                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-coral/5 rounded-full -ml-32 -mb-32 blur-3xl print:hidden" />

                  <div className="relative p-6 md:p-12 print:p-10">
                     {/* Top Actions & Badge */}
                     <div className="flex flex-col md:flex-row justify-end items-end md:items-center gap-4 mb-8 print:hidden">
                        <button 
                           onClick={() => window.print()} 
                           className="px-6 py-2.5 bg-brand-blue text-white text-[9px] font-black uppercase tracking-widest rounded-xl shadow-xl shadow-brand-blue/20 hover:shadow-brand-blue/30 hover:-translate-y-0.5 transition-all flex items-center gap-3"
                        >
                           <span>🖨️</span> Print Receipt
                        </button>
                        <div className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm flex items-center gap-2 border ${
                               invoice.status === 'paid' ? 'bg-emerald-50 text-emerald-500 border-emerald-100' : 
                               invoice.status === 'cancelled' ? 'bg-slate-50 text-slate-400 border-slate-100' : 
                               'bg-amber-50 text-amber-500 border-amber-100'}`}>
                           <span className="text-xs">✓</span> {invoice.status === 'paid' ? 'Paid In Full' : 
                            invoice.status === 'cancelled' ? 'Cancelled / Refunded' : 
                            'Payment Due'}
                        </div>
                     </div>

                     {/* Header Redesign */}
                     <div className="grid md:grid-cols-2 gap-12 items-start print:grid-cols-2 print:gap-4 mb-12 print:mb-8">
                        <div className="space-y-4">
                           <div className="flex items-center gap-4">
                              <span className="bg-brand-blue text-white p-2 rounded-xl not-italic text-2xl h-10 w-10 flex items-center justify-center font-black">JTS</span>
                              <h1 className="font-display text-4xl font-black text-brand-blue italic tracking-tighter print:text-3xl uppercase">FITNESS</h1>
                           </div>
                           <div className="pl-1 space-y-1">
                              <h4 className="text-base font-black text-ink tracking-tight">{invoice.locationId?.name || 'Dubai Al Wasl'}</h4>
                              <p className="text-[9px] font-black text-ink/20 uppercase tracking-[0.3em]">Dubai</p>
                           </div>
                        </div>

                        <div className="md:text-right pt-2 md:pt-4">
                           <div className="space-y-3 inline-block text-left md:text-right">
                              <div className="grid grid-cols-[80px_1fr] md:flex md:items-baseline md:justify-end gap-2">
                                 <span className="text-[8px] font-black text-ink/20 uppercase tracking-[0.3em] whitespace-nowrap">Invoice No</span>
                                 <span className="text-lg font-black text-brand-blue tracking-tighter leading-none">{invoice.invoiceNumber}</span>
                              </div>
                              <div className="grid grid-cols-[80px_1fr] md:flex md:items-baseline md:justify-end gap-2">
                                 <span className="text-[8px] font-black text-ink/20 uppercase tracking-[0.3em] whitespace-nowrap">Date</span>
                                 <span className="text-xs font-black text-ink">{new Date(invoice.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                              </div>
                              {invoice.bookingId?.bookingNumber && (
                                 <div className="grid grid-cols-[80px_1fr] md:flex md:items-baseline md:justify-end gap-2">
                                    <span className="text-[8px] font-black text-ink/20 uppercase tracking-[0.3em] whitespace-nowrap">Reference</span>
                                    <span className="text-xs font-black text-ink">#{invoice.bookingId.bookingNumber}</span>
                                 </div>
                              )}
                           </div>
                        </div>
                     </div>

                     {/* Bill From / To Section */}
                     <div className="grid grid-cols-2 gap-12 mb-12 print:mb-8 print:gap-8">
                        <div className="space-y-4">
                           <p className="inline-block px-3 py-1 bg-brand-blue/5 rounded-lg text-[9px] font-black text-brand-blue uppercase tracking-[0.3em]">Bill From</p>
                           <div className="space-y-2">
                              <h3 className="font-black text-ink text-xl tracking-tight">JTS Kids Fitness</h3>
                              <div className="text-[10px] text-ink/40 leading-relaxed font-bold uppercase tracking-wider">
                                 <p>Dubai, UAE</p>
                                 <div className="mt-2 space-y-0.5">
                                    <p><span className="text-brand-blue/30 mr-2">T:</span> +971 00 000 0000</p>
                                    <p><span className="text-brand-blue/30 mr-2">E:</span> hello@jtsfitness.com</p>
                                 </div>
                              </div>
                           </div>
                        </div>
                        <div className="space-y-4">
                           <p className="inline-block px-3 py-1 bg-brand-blue/5 rounded-lg text-[9px] font-black text-brand-blue uppercase tracking-[0.3em]">Bill To</p>
                           <div className="space-y-2">
                              <h3 className="font-black text-ink text-xl tracking-tight leading-tight">
                                 {invoice.userId?.companyName || invoice.userId?.name || invoice.guestDetails?.name || (invoice.userId?.firstName && `${invoice.userId.firstName} ${invoice.userId.lastName}`) || 'Valued Customer'}
                              </h3>
                              <div className="text-[10px] text-ink/40 leading-relaxed font-bold uppercase tracking-wider">
                                 {/* Company Credentials */}
                                 {(invoice.userId?.tradeLicenseNo || invoice.userId?.taxNumber) && (
                                    <div className="mb-2 space-y-0.5 text-brand-blue">
                                       {invoice.userId?.tradeLicenseNo && <p><span className="opacity-40 mr-1">T.L NO:</span> {invoice.userId.tradeLicenseNo}</p>}
                                       {invoice.userId?.taxNumber && <p><span className="opacity-40 mr-1">TRN:</span> {invoice.userId.taxNumber}</p>}
                                    </div>
                                 )}

                                 <p className="max-w-[200px]">
                                    {invoice.userId?.companyAddress || invoice.userId?.address || 'Customer Address Not Provided'}
                                 </p>
                                 
                                 <div className="mt-2 space-y-0.5">
                                    <p><span className="text-brand-blue/30 mr-2">E:</span> {invoice.userId?.email || invoice.guestDetails?.email}</p>
                                    <p><span className="text-brand-blue/30 mr-2">T:</span> {invoice.userId?.phone || 'Not Provided'}</p>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>

                     {/* Items Table */}
                     <div className="mb-12 print:mb-8">
                        <table className="w-full border-collapse">
                           <thead>
                              <tr className="border-b-2 border-slate-100">
                                 <th className="py-4 text-[9px] font-black text-ink/20 uppercase tracking-[0.3em] text-left">Description</th>
                                 <th className="py-4 px-4 text-[9px] font-black text-ink/20 uppercase tracking-[0.3em] text-center">Qty</th>
                                 <th className="py-4 px-4 text-[9px] font-black text-ink/20 uppercase tracking-[0.3em] text-right whitespace-nowrap">Rate</th>
                                 <th className="py-4 text-[9px] font-black text-ink/20 uppercase tracking-[0.3em] text-right">Amount</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-50">
                               {invoice.items.filter(item => item.quantity > 0 || item.unitPrice !== 0 || item.total !== 0).map((item, idx) => {
                                  const itemRate = item.unitPrice || 0;
                                  const expectedTotal = itemRate * (item.quantity || 1);
                                  // HEALING: If saved total is higher than base total, the difference is tax
                                  const itemTax = (item.total > expectedTotal + 0.01) ? (item.total - expectedTotal) : (item.taxAmount || 0);
                                  const itemTotal = expectedTotal; // Always show base total for Rate x Qty consistency
                                  
                                  return (
                                     <tr key={idx}>
                                        <td className="py-6">
                                           <p className="font-black text-ink text-lg tracking-tighter uppercase">{item.description}</p>
                                           <div className="flex flex-col gap-0.5 mt-1">
                                              <p className="text-[9px] font-black text-brand-blue uppercase tracking-widest italic opacity-40">Professional Training Services</p>
                                              {invoice.bookingId?.participants?.length > 0 && (
                                                 <p className="text-[9px] font-black text-brand-blue uppercase tracking-widest">
                                                    Participant: {invoice.bookingId.participants[0].name}
                                                 </p>
                                              )}
                                           </div>
                                        </td>
                                        <td className="py-6 px-4 text-center font-black text-ink/40 leading-none">{item.quantity}</td>
                                        <td className="py-6 px-4 text-right font-black text-ink/40 whitespace-nowrap text-xs">
                                           AED {itemRate.toFixed(2)}
                                           {itemTax > 0 && <span className="block text-[7px] font-bold text-brand-blue/40 italic">+ AED {itemTax.toFixed(2)} TAX</span>}
                                        </td>
                                        <td className="py-6 text-right font-black text-ink text-xl tracking-tighter">AED {itemTotal.toFixed(2)}</td>
                                     </tr>
                                  );
                               })}
                            </tbody>
                        </table>
                     </div>

                     {/* Highlighted Totals Box */}
                     <div className="bg-brand-blue/5 rounded-[2rem] p-8 print:p-6 space-y-8">
                        <div className="space-y-3 max-w-[350px] ml-auto font-display">
                           <div className="flex items-center justify-between text-[11px] font-black">
                              <span className="text-ink/30 uppercase tracking-[0.3em]">Gross Subtotal</span>
                              <span className="text-ink/60 tracking-tight">
                                 AED {(invoice.items.reduce((sum, i) => {
                                    // Only sum positive items for Gross Subtotal to avoid confusing subtraction math
                                    const val = (i.unitPrice || 0) * (i.quantity || 1);
                                    return val > 0 ? sum + val : sum;
                                 }, 0)).toFixed(2)}
                              </span>
                           </div>
                           
                           {(invoice.discountAmount > 0 || invoice.couponAmount > 0) && (
                              <div className="pt-2 border-t border-white/40">
                                 <div className="flex items-center justify-between text-emerald-600 text-[11px] font-black">
                                    <span className="uppercase tracking-[0.3em]">Total Savings</span>
                                    <span className="tracking-tight">- AED {(invoice.discountAmount + invoice.couponAmount).toFixed(2)}</span>
                                 </div>
                              </div>
                           )}

                           <div className="flex items-center justify-between text-[11px] font-black">
                              <span className="text-ink/30 uppercase tracking-[0.3em]">Total Tax</span>
                              <span className="text-ink/60 tracking-tight">
                                 AED {(invoice.taxAmount || invoice.items.reduce((sum, i) => {
                                    // Fallback detection for older or group records
                                    const expected = (i.unitPrice || 0) * (i.quantity || 1);
                                    const detectedTax = (i.total > expected + 0.01) ? (i.total - expected) : (i.taxAmount || 0);
                                    return sum + detectedTax;
                                 }, 0)).toFixed(2)}
                              </span>
                           </div>
                        </div>

                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-8 border-t-2 border-white/50">
                           <div className="space-y-2">
                              <h4 className="text-[10px] font-black text-brand-blue uppercase tracking-[0.4em]">Net Amount Due</h4>
                              <p className="text-[8px] font-black text-ink/20 uppercase tracking-widest leading-relaxed max-w-[250px]">
                                 {totalInWords}
                              </p>
                           </div>
                           <div className="text-left md:text-right">
                              <span className="text-5xl font-black text-brand-blue tracking-tighter leading-none block">AED {invoice.amount.toFixed(2)}</span>
                           </div>
                        </div>
                     </div>

                     {/* Footer Redesign with Icons - Hidden on Print to save space */}
                     <div className="mt-12 pt-8 border-t border-slate-50 text-center space-y-6 print:hidden">
                        <div className="flex justify-center items-center gap-12 opacity-10">
                           <div className="text-3xl">👟</div>
                           <div className="text-3xl">🤸</div>
                           <div className="text-3xl">🏆</div>
                        </div>
                        <p className="text-[9px] font-black uppercase tracking-[1em] text-ink/10 pl-[1em]">Official Receipt</p>
                     </div>
                  </div>
               </div>
            </div>
         </main>

         <Footer className="print:hidden" />
      </div>
   );
}
