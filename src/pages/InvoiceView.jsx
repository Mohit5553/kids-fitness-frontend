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
   const { id, bookingId } = useParams();
   const navigate = useNavigate();
   const [invoice, setInvoice] = useState(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState(null);

   useEffect(() => {
      const fetchInvoice = async () => {
         try {
            const url = bookingId ? `/invoices/booking/${bookingId}` : `/invoices/${id}`;
            const res = await api.get(url);
            setInvoice(res.data);
         } catch (err) {
            console.error('Invoice fetch error:', err);
            setError('Invoice not found or could not be generated.');
         } finally {
            setLoading(false);
         }
      };
      fetchInvoice();
   }, [id, bookingId]);

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

   // ── Financial Breakdown ──────────────────────────────────────
   // 1. Item Amount = sum of positive line items only (before discounts & tax)
   const itemAmount = invoice.items?.reduce((sum, item) => {
      const val = (item.unitPrice || 0) * (item.quantity || 1);
      return val > 0 ? sum + val : sum;
   }, 0) || 0;

   // 2. Discount — read stored fields first, then fall back to negative line items
   const storedDiscount = (invoice.discountAmount || 0) + (invoice.couponAmount || 0);
   const itemsDiscount = invoice.items?.reduce((sum, item) => {
      const val = (item.unitPrice || 0) * (item.quantity || 1);
      return val < 0 ? sum + Math.abs(val) : sum;
   }, 0) || 0;
   const discountAmount = storedDiscount > 0 ? storedDiscount : itemsDiscount;

   // Detect discount label from item descriptions for display
   const discountItem = invoice.items?.find(i => (i.unitPrice || 0) * (i.quantity || 1) < 0);
   const discountLabel = discountItem?.description ||
      (invoice.couponCode ? `Coupon: ${invoice.couponCode}` : 'Promotion Applied');

   // 3. Amount After Discount
   const amountAfterDiscount = itemAmount - discountAmount;

   // 4. VAT / Tax — use stored taxAmount, with item-level fallback
   const taxAmount = invoice.taxAmount || invoice.items?.reduce((sum, i) => {
      const expected = (i.unitPrice || 0) * (i.quantity || 1);
      const detected = (i.total > expected + 0.01) ? (i.total - expected) : (i.taxAmount || 0);
      return sum + detected;
   }, 0) || 0;

   // 5. Total Amount — use stored amount (source of truth), fallback to computed
   const totalAmount = invoice.amount || (amountAfterDiscount + taxAmount);
   const totalInWords = numberToWords(totalAmount);

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
                        {invoice.bookingId?.paymentMethod && (
                            <div className="px-5 py-2 rounded-full bg-brand-blue/5 text-brand-blue text-[10px] font-black uppercase tracking-[0.2em] shadow-sm flex items-center gap-2 border border-brand-blue/10">
                               <span>{
                                  invoice.bookingId.paymentMethod.includes('cash') ? '💵' : 
                                  invoice.bookingId.paymentMethod.includes('card') ? '💳' : '🌐'
                               }</span> 
                               {invoice.bookingId.paymentMethod.replace('center_', '').toUpperCase()}
                            </div>
                         )}
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

                     {/* ── Financial Summary Box ── */}
                     <div className="rounded-[2rem] overflow-hidden border border-slate-100 shadow-sm">

                        {/* Row helper: reusable label + value row */}
                        {/* 1. Item Amount */}
                        <div className="flex items-center justify-between px-8 py-4 bg-slate-50/80 border-b border-slate-100">
                           <span className="text-[10px] font-black text-ink/40 uppercase tracking-[0.3em]">Item Amount</span>
                           <span className="text-sm font-black text-ink tracking-tight">AED {itemAmount.toFixed(2)}</span>
                        </div>

                        {/* 2. Discount — only shown if > 0 */}
                        {discountAmount > 0 && (
                           <div className="flex items-center justify-between px-8 py-4 bg-emerald-50/60 border-b border-emerald-100">
                              <div className="flex items-center gap-2">
                                 <span className="text-[8px] bg-emerald-100 text-emerald-600 font-black uppercase tracking-widest px-2 py-0.5 rounded-md">Discount</span>
                                 <span className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.3em]">
                                    {discountLabel}
                                 </span>
                              </div>
                              <span className="text-sm font-black text-emerald-600 tracking-tight">- AED {discountAmount.toFixed(2)}</span>
                           </div>
                        )}

                        {/* 3. Amount After Discount — only shown if discount exists */}
                        {discountAmount > 0 && (
                           <div className="flex items-center justify-between px-8 py-4 bg-white border-b border-slate-100">
                              <span className="text-[10px] font-black text-ink/40 uppercase tracking-[0.3em]">Amount After Discount</span>
                              <span className="text-sm font-black text-ink tracking-tight">AED {amountAfterDiscount.toFixed(2)}</span>
                           </div>
                        )}

                        {/* 4. VAT */}
                        <div className="flex items-center justify-between px-8 py-4 bg-slate-50/80 border-b border-slate-100">
                           <div className="flex items-center gap-2">
                              <span className="text-[8px] bg-brand-blue/10 text-brand-blue font-black uppercase tracking-widest px-2 py-0.5 rounded-md">VAT 5%</span>
                              <span className="text-[10px] font-black text-ink/40 uppercase tracking-[0.3em]">Tax Amount</span>
                           </div>
                           <span className="text-sm font-black text-ink/60 tracking-tight">AED {taxAmount.toFixed(2)}</span>
                        </div>

                        {/* Payment Method - Bottom Row */}
                        {invoice.bookingId?.paymentMethod && (
                           <div className="flex items-center justify-between px-8 py-3 bg-white border-b border-slate-100">
                              <span className="text-[9px] font-black text-ink/20 uppercase tracking-[0.3em]">Payment Mode</span>
                              <span className="text-xs font-black text-ink uppercase tracking-widest italic opacity-60">
                                 {invoice.bookingId.paymentMethod.replace('center_', '')}
                              </span>
                           </div>
                        )}

                        {/* 5. Total Amount — prominent */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-8 py-6 bg-brand-blue">
                           <div className="space-y-1">
                              <h4 className="text-[10px] font-black text-white/60 uppercase tracking-[0.4em]">Total Amount</h4>
                              <p className="text-[8px] font-black text-white/30 uppercase tracking-widest leading-relaxed max-w-[260px]">
                                 {totalInWords}
                              </p>
                           </div>
                           <span className="text-5xl font-black text-white tracking-tighter leading-none">
                              AED {totalAmount.toFixed(2)}
                           </span>
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
