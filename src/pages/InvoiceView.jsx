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
            /* Hide specific non-invoice elements */
            .print\\:hidden, 
            .site-header, 
            .site-footer, 
            button, 
            [id*="chat"], 
            [class*="chat"], 
            iframe {
              display: none !important;
            }
            /* Reset main container for print */
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
      <main className="flex-1 py-12 px-4 bg-slate-100/50">
        <div className="max-w-4xl mx-auto">
          {/* Action Row - Improved Spacing */}
          <div className="flex justify-between items-center mb-10 print:hidden px-4">
            <button onClick={() => navigate(-1)} className="text-sm font-black text-ink/30 hover:text-brand-blue flex items-center gap-2 transition-all group">
               <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Bookings
            </button>
            <button
               onClick={handlePrint}
               className="bg-brand-blue text-white px-10 py-4 rounded-2xl font-black shadow-2xl shadow-brand-blue/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
            >
               <span className="text-xl">🖨️</span> Print Official Invoice
            </button>
          </div>

          {/* Invoice Document - Responsive Design for Web, Optimized for Print */}
          <div className="invoice-container bg-white shadow-[0_35px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden border border-slate-100 mx-auto relative rounded-[2rem] print:rounded-none print:shadow-none print:border-none print:m-0">
            <div className="invoice-content p-12 md:p-16 print:p-10">
              {/* Status Badge - Explicit handling for Paid, Cancelled, and Unpaid */}
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

              {/* Header - Compact for Print */}
              <div className="border-b-8 border-brand-blue/10 pb-12 mb-10 flex flex-col md:flex-row justify-between items-start gap-8 relative z-10 print:pb-8 print:mb-8">
                <div className="space-y-2">
                  <h1 className="text-5xl font-black italic tracking-tighter text-brand-blue flex items-center gap-3 print:text-4xl">
                    <span className="bg-brand-blue text-white p-2 rounded-xl not-italic text-2xl h-12 w-12 flex items-center justify-center">JTS</span>
                    FITNESS
                  </h1>
                  <p className="text-ink font-black text-xl tracking-tight print:text-lg">{invoice.locationId?.name || 'Main Center'}</p>
                  <p className="text-ink/40 text-xs font-bold uppercase tracking-[0.1em] mt-1 max-w-[300px] leading-relaxed">
                    {invoice.locationId?.address || 'Junior Training Systems'}
                  </p>
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

              {/* Addresses - Fixed 2 Columns, Tighter spacing for Print */}
              <div className="grid grid-cols-2 gap-12 mb-16 relative z-10 px-2 print:mb-10 print:gap-8">
                 <div className="space-y-6 print:space-y-3">
                    <p className="inline-block px-3 py-1 bg-brand-blue/5 rounded-lg text-[10px] font-black text-brand-blue uppercase tracking-[0.2em]">Bill From</p>
                    <div>
                       <h3 className="font-black text-ink text-2xl tracking-tight print:text-xl">JTS Kids Fitness</h3>
                       <p className="text-sm text-ink/50 mt-2 whitespace-pre-line leading-relaxed font-bold print:text-xs">
                          {invoice.locationId?.address || 'Dubai, UAE\nUnited Arab Emirates'}
                       </p>
                       <div className="mt-6 flex flex-col gap-2 print:mt-3">
                          <p className="text-xs font-black text-ink/40">T: <span className="text-brand-blue ml-2">{invoice.locationId?.phone || '+971 00 000 0000'}</span></p>
                          <p className="text-xs font-black text-ink/40">E: <span className="text-brand-blue ml-2">{invoice.locationId?.email || 'hello@jtsfitness.com'}</span></p>
                       </div>
                    </div>
                 </div>
                 <div className="space-y-6 print:space-y-3">
                    <p className="inline-block px-3 py-1 bg-brand-blue/5 rounded-lg text-[10px] font-black text-brand-blue uppercase tracking-[0.2em]">Bill To</p>
                    <div>
                       <h3 className="font-black text-ink text-2xl tracking-tight print:text-xl">{invoice.userId?.name || invoice.guestDetails?.name || 'Valued Customer'}</h3>
                       <p className="text-sm text-ink/50 mt-2 whitespace-pre-line leading-relaxed font-bold print:text-xs">
                          {invoice.userId?.address || 'Customer Address Not Provided'}
                       </p>
                       <div className="mt-6 flex flex-col gap-2 print:mt-3">
                          <p className="text-xs font-black text-ink/40">E: <span className="text-brand-blue ml-2">{invoice.userId?.email || invoice.guestDetails?.email}</span></p>
                          {invoice.userId?.phone || invoice.guestDetails?.phone ? (
                             <p className="text-xs font-black text-ink/40">T: <span className="text-brand-blue ml-2">{invoice.userId?.phone || invoice.guestDetails?.phone}</span></p>
                          ) : null}
                       </div>
                    </div>
                 </div>
              </div>

              {/* Items Table - Compressed padding for Print */}
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

              {/* Totals - Polished, tighter for Print */}
              <div className="flex justify-end mt-8 bg-slate-50 p-10 rounded-[2.5rem] print:p-6 print:rounded-2xl print:mt-0">
                 <div className="w-full md:w-96 space-y-5 print:space-y-3">
                    <div className="flex justify-between items-center text-sm">
                       <span className="font-black text-ink/30 uppercase tracking-[0.2em] print:text-[10px]">Subtotal</span>
                       <span className="font-black text-ink text-lg font-mono tracking-tight print:text-sm">AED {invoice.amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                       <span className="font-black text-ink/30 uppercase tracking-[0.2em] print:text-[10px]">VAT (0%)</span>
                       <span className="font-black text-ink text-lg font-mono tracking-tight print:text-sm">AED 0.00</span>
                    </div>
                    <div className="pt-8 border-t-4 border-white flex justify-between items-baseline print:pt-4">
                       <span className="text-2xl font-black text-brand-blue uppercase tracking-tighter print:text-xl">Total Due</span>
                       <div className="text-right">
                          <span className="text-5xl font-black text-brand-blue tracking-tighter print:text-3xl">AED {invoice.amount.toFixed(2)}</span>
                          <p className="text-[10px] font-black text-ink/20 uppercase tracking-[0.4em] mt-2 print:mt-1 print:text-[8px]">DHS ONE AND ZERO FILS ONLY</p>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Formal Footer - Hide on Print to ensure 1 page */}
              <div className="mt-20 pt-16 border-t-4 border-slate-50 text-center print:hidden">
                 <div className="flex justify-center gap-20 mb-12 opacity-40 select-none grayscale scale-125">
                    <div className="text-4xl">👟</div>
                    <div className="text-4xl">🤸</div>
                    <div className="text-4xl">🏆</div>
                 </div>
                 <p className="text-[12px] font-black text-ink uppercase tracking-[0.5em] mb-6">Official Receipt</p>
                 <div className="max-w-2xl mx-auto space-y-5">
                    <p className="text-[10px] text-ink/30 leading-relaxed font-black uppercase tracking-widest">
                       This is an electronically generated document. No signature or stamp is required. 
                       Payment is subject to terms and conditions of JTS Kids Fitness membership.
                    </p>
                    <p className="text-[11px] font-black text-brand-blue uppercase tracking-[0.3em]">
                       Thank you for training with us!
                    </p>
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
