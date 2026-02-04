import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Settings, 
  Globe, 
  Layers, 
  Download, 
  RefreshCw, 
  ScanLine, 
  ShoppingCart, 
  Archive,
  Calculator,
  CheckCircle2,
  Landmark,
  Briefcase,
  Sun,
  Moon,
  ChevronDown
} from 'lucide-react';

/**
 * MOCKUMENTS v2.2 (Final)
 */

// --- Constants & Config ---

const REGIONS = {
  UK: { label: 'United Kingdom', currency: '£', locale: 'en-GB', taxLabel: 'VAT', taxRate: 0.20, dateFormat: 'DD/MM/YYYY' },
  AU: { label: 'Australia', currency: '$', locale: 'en-AU', taxLabel: 'ABN', taxRate: 0.10, dateFormat: 'DD/MM/YYYY' },
  US: { label: 'United States', currency: '$', locale: 'en-US', taxLabel: 'Tax ID', taxRate: 0.07, dateFormat: 'MM/DD/YYYY' },
  FR: { label: 'France', currency: '€', locale: 'fr-FR', taxLabel: 'TVA', taxRate: 0.20, dateFormat: 'DD/MM/YYYY' },
};

const CATEGORIES = {
  COSTS: { id: 'Costs', icon: ShoppingCart, types: ['Receipt', 'Invoice', 'Credit Note'] },
  SALES: { id: 'Sales', icon: FileText, types: ['Sales Invoice', 'Sales Receipt', 'Sales Credit Note'] },
  VAULT: { id: 'Vault', icon: Archive, types: ['Insurance Policy', 'Tax Filing', 'Tenancy Agreement'] },
  BANK: { id: 'Bank Statements', icon: Landmark, types: ['Bank Statement'] },
  SUPPLIER: { id: 'Supplier Statements', icon: Briefcase, types: ['Supplier Statement'] }
};

const DUMMY_DATA = {
  UK: {
    suppliers: ["Joe's Coffee", "The London Pub", "British Gas", "Thames Water", "Tesco Express", "Global Bank Inc.", "Barclays"],
    addresses: ["45 O'Connell St, London, EC1A 1BB", "10 Downing St, London", "221B Baker St, London"],
  },
  AU: {
    suppliers: ["Outback Bistro", "4Birds Pty Ltd", "Sydney Tech Supplies", "Woolworths", "Bunnings", "Commonwealth Bank", "ANZ"],
    addresses: ["123 George St, Sydney, NSW 2000", "42 Wallaby Way, Sydney"],
  },
  US: {
    suppliers: ["Liberty Cafe", "Main St. Hardware", "Starbucks Corp", "Walmart Supercenter", "Chase Bank", "Bank of America"],
    addresses: ["742 Evergreen Terrace, Springfield, IL", "1600 Penn Ave, Washington DC"],
  },
  FR: {
    suppliers: ["Le Bistrot de Paris", "Boulangerie Dupont", "Bouygues Telecom", "Carrefour City", "BNP Paribas", "Société Générale"],
    addresses: ["23 Rue de Grenelle, 75700 Paris", "Champ de Mars, 5 Avenue Anatole France, Paris"],
  }
};

const PAPER_NOISE = "data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.1'/%3E%3C/svg%3E";

// --- Utilities ---

const loadScript = (src) => {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
};

const formatDate = (dateObj, locale) => {
  if (!dateObj) return "";
  if (typeof dateObj === 'string') dateObj = new Date(dateObj);
  return new Intl.DateTimeFormat(locale).format(dateObj);
};

const formatCurrency = (amount, currency) => {
  return `${currency}${parseFloat(amount).toFixed(2)}`;
};

const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

// --- Main Component ---

export default function App() {
  const [activeCategory, setActiveCategory] = useState('COSTS');
  const [region, setRegion] = useState('UK');
  const [mode, setMode] = useState('MANUAL'); 
  const [docType, setDocType] = useState(CATEGORIES.COSTS.types[0]);
  const [quantity, setQuantity] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false); 
  const [progress, setProgress] = useState(0);
  const [libsLoaded, setLibsLoaded] = useState(false);
  
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(true);

  const [includeSupportDocs, setIncludeSupportDocs] = useState(false); 
  
  const [manualData, setManualData] = useState({
    supplier: "Joe's Coffee",
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    total: "120.00",
    tax: "24.00",
    autoCalcTax: true,
  });

  const [stableRandomSupplier, setStableRandomSupplier] = useState("");
  const previewRef = useRef(null);

  const [previewData, setPreviewData] = useState({
    type: 'RECEIPT', 
    supplier: '',
    address: '',
    date: new Date(),
    total: '0.00',
    tax: '0.00',
    lines: [],
    meta: {},
  });

  // --- Theme Configuration ---
  const theme = isDarkMode ? {
    bgApp: 'bg-[#121212]',
    bgSidebar: 'bg-[#121212]',
    bgSidebarHover: 'hover:bg-[#121212]/40',
    bgPanel: 'bg-[#1D1D1D]',
    bgInput: 'bg-[#121212]',
    bgCard: 'bg-[#2C2C2C]',
    bgPreview: 'bg-[#0A0A0A]',
    textMain: 'text-gray-100',
    textMuted: 'text-gray-400',
    textInput: 'text-white',
    border: 'border-gray-800',
    borderInput: 'border-gray-700',
    borderHighlight: 'border-[#FF5A02]',
    gridColor: '#333',
    logoBg: 'bg-[#FF5A02]',
    logoIcon: 'text-[#121212]',
    accentText: 'text-[#FF5A02]',
    accentBg: 'bg-[#1D1D1D]',
    navHoverBg: 'hover:bg-[#1D1D1D]',
    navHoverBorder: 'hover:border-gray-700'
  } : {
    bgApp: 'bg-[#F0F2F5]',
    bgSidebar: 'bg-[#FFFFFF]',
    bgSidebarHover: 'hover:bg-[#FFFFFF]/50',
    bgPanel: 'bg-[#FFFFFF]',
    bgInput: 'bg-[#F3F4F6]', 
    bgCard: 'bg-[#E5E7EB]', 
    bgPreview: 'bg-[#E5E7EB]',
    textMain: 'text-gray-900',
    textMuted: 'text-gray-500',
    textInput: 'text-gray-900',
    border: 'border-gray-200',
    borderInput: 'border-gray-300',
    borderHighlight: 'border-[#FF5A02]',
    gridColor: '#CBD5E1',
    logoBg: 'bg-[#FF5A02]',
    logoIcon: 'text-white',
    accentText: 'text-[#FF5A02]',
    accentBg: 'bg-[#FFF0E6]',
    navHoverBg: 'hover:bg-gray-100', 
    navHoverBorder: 'hover:border-gray-400' 
  };

  useEffect(() => {
    const loadLibs = async () => {
      try {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
        setLibsLoaded(true);
      } catch (e) { console.error(e); }
    };
    loadLibs();
  }, []);

  useEffect(() => {
    if (DUMMY_DATA[region]) {
        setStableRandomSupplier(getRandomElement(DUMMY_DATA[region].suppliers));
    }
  }, [region]);

  useEffect(() => {
    if (activeCategory === 'SALES') {
        setManualData(prev => ({ ...prev, supplier: 'Acme Corp' }));
    } else if (activeCategory === 'COSTS') {
        setManualData(prev => ({ ...prev, supplier: "Joe's Coffee" }));
    }
  }, [activeCategory]);

  useEffect(() => {
    if (activeCategory === 'VAULT') {
        setMode('AUTO');
    }
  }, [activeCategory]);

  useEffect(() => {
    if (CATEGORIES[activeCategory]) {
        setDocType(CATEGORIES[activeCategory].types[0]);
    }
  }, [activeCategory]);

  useEffect(() => {
    if (mode === 'MANUAL' && manualData.autoCalcTax) {
      const rate = REGIONS[region].taxRate;
      const totalVal = parseFloat(manualData.total) || 0;
      const taxVal = (totalVal - (totalVal / (1 + rate))).toFixed(2);
      setManualData(prev => ({ ...prev, tax: taxVal }));
    }
  }, [manualData.total, manualData.autoCalcTax, region, mode]);

  useEffect(() => {
    if (!isGenerating) {
      regeneratePreview();
    }
  }, [region, docType, mode, activeCategory, manualData]);

  const generateBankData = () => {
    const rData = DUMMY_DATA[region];
    const openingBal = Math.random() * 5000 + 1000;
    const numTxns = mode === 'AUTO' ? Math.floor(Math.random() * 10) + 5 : 5;
    let runningBal = openingBal;
    const transactions = [];

    for (let i = 0; i < numTxns; i++) {
      const isCredit = Math.random() > 0.7;
      const amount = Math.random() * 200 + 10;
      runningBal = isCredit ? runningBal + amount : runningBal - amount;
      
      const date = new Date();
      date.setDate(date.getDate() - (numTxns - i));

      transactions.push({
        date: date,
        desc: isCredit ? "Deposit" : getRandomElement(["Payment", "Direct Debit", "Card Purchase", "ATM"]),
        debit: isCredit ? "" : amount.toFixed(2),
        credit: isCredit ? amount.toFixed(2) : "",
        balance: runningBal.toFixed(2)
      });
    }

    return {
      type: 'BANK',
      supplier: getRandomElement(rData.suppliers.filter(s => s.includes('Bank') || s.includes('Paribas') || s.includes('Barclays') || s.includes('Commonwealth') || s.includes('Chase'))),
      address: getRandomElement(rData.addresses),
      date: new Date(),
      total: runningBal.toFixed(2), 
      tax: '0.00',
      lines: transactions,
      meta: {
        accountNum: Math.floor(Math.random() * 1000000000),
        sortCode: `${Math.floor(Math.random()*99)}-${Math.floor(Math.random()*99)}-${Math.floor(Math.random()*99)}`,
        openingBalance: openingBal.toFixed(2)
      }
    };
  };

  const generateSupplierStatementData = () => {
    const rData = DUMMY_DATA[region];
    const numInvoices = mode === 'AUTO' ? 5 : 3;
    let totalDue = 0;
    const invoices = [];
    
    const supplierName = getRandomElement(rData.suppliers);
    const supplierAddr = getRandomElement(rData.addresses);

    for (let i = 0; i < numInvoices; i++) {
      const amount = Math.random() * 500 + 50;
      totalDue += amount;
      const date = new Date();
      date.setDate(date.getDate() - (Math.random() * 30));

      invoices.push({
        date: date,
        ref: `INV-${Math.floor(Math.random() * 10000)}`,
        amount: amount.toFixed(2),
        desc: "Services Rendered"
      });
    }

    return {
      type: 'STATEMENT',
      supplier: supplierName,
      address: supplierAddr,
      date: new Date(),
      total: totalDue.toFixed(2),
      tax: '0.00',
      lines: invoices,
      meta: {
        customerRef: `CUST-${Math.floor(Math.random() * 999)}`
      }
    };
  };

  const generateReceiptData = (isInvoice = false) => {
    const rData = DUMMY_DATA[region];
    const isSales = activeCategory === 'SALES';
    const isCredit = docType.includes('Credit Note');

    let supplier = getRandomElement(rData.suppliers);
    let customerName = "Generic Corp Ltd.";

    let address = getRandomElement(rData.addresses);
    let date = new Date();
    let dueDate = new Date(date);
    dueDate.setDate(dueDate.getDate() + 30);
    let total = (Math.random() * 200 + 10).toFixed(2);
    
    if (mode === 'MANUAL') {
        if (isSales) {
            customerName = manualData.supplier;
            supplier = stableRandomSupplier || rData.suppliers[1]; 
        } else {
            supplier = manualData.supplier;
            customerName = "Generic Corp Ltd.";
        }

        address = rData.addresses[0]; 
        date = new Date(manualData.date);
        if (manualData.dueDate) {
             dueDate = new Date(manualData.dueDate);
        }
        total = manualData.total;
    } else {
        if (isSales) {
             supplier = getRandomElement(rData.suppliers);
             customerName = "Generic Corp Ltd.";
        }
    }

    const rate = REGIONS[region].taxRate;
    const tax = mode === 'MANUAL' 
        ? manualData.tax 
        : (total - (total / (1 + rate))).toFixed(2);
    
    const lines = [
        { desc: isCredit ? "Refund: General Goods" : "General Goods", qty: 1, amount: (total * 0.7).toFixed(2) },
        { desc: isCredit ? "Refund: Service Fee" : "Service Fee", qty: 1, amount: (total * 0.3).toFixed(2) }
    ];

    return {
      type: isCredit ? 'CREDIT_NOTE' : (isInvoice ? 'INVOICE' : 'RECEIPT'),
      supplier,
      address,
      date,
      total,
      tax,
      lines,
      meta: {
        poNumber: `PO-${Math.floor(Math.random() * 100000)}`,
        authCode: Math.random().toString(36).substring(7).toUpperCase(),
        dueDate: dueDate,
        originalInvoiceRef: isCredit ? `REF-${Math.floor(Math.random() * 99999)}` : null,
        customerName: customerName
      }
    };
  };

  const generateVaultData = () => {
    const rData = DUMMY_DATA[region];
    let supplier = "Global Assurance Ltd";
    let title = "Official Record";
    let bodyText = ["Lorem ipsum...", "Duis aute..."];

    if (docType === 'Insurance Policy') {
        supplier = "Global Assurance Ltd";
        title = "Certificate of Insurance";
        bodyText = [
            "This policy certifies that the policyholder named herein is insured against loss, damage, or liability as defined in the attached schedule, subject to the terms, conditions, and exclusions of this policy.",
            "Coverage includes standard liability and property protection. This document serves as evidence of insurance and does not amend, extend, or alter the coverage afforded by the policy listed below.",
            "In the event of a claim, please contact your agent immediately. Failure to report within 30 days may result in denial of coverage."
        ];
    } else if (docType === 'Tax Filing') {
        supplier = "Department of Revenue";
        title = "Tax Return Acknowledgement";
        bodyText = [
            "This document serves as confirmation of receipt for the tax return filing for the fiscal period specified below. The tax authority acknowledges that the return has been submitted electronically.",
            "The taxpayer declares that to the best of their knowledge and belief, the information provided is true, correct, and complete. This filing is subject to audit and verification.",
            "Please retain this acknowledgement for your records. Any amendments must be filed within the statutory period."
        ];
    } else if (docType === 'Tenancy Agreement') {
        supplier = "Prime Estate Agents";
        title = "Tenancy Agreement";
        bodyText = [
            "This agreement creates a tenancy in respect of the property described in the schedule. The tenant agrees to pay rent on the due date without deduction or set-off.",
            "The landlord agrees to maintain the property in a habitable condition and to respect the tenant's quiet enjoyment of the premises. The tenant is responsible for minor repairs and general upkeep.",
            "Notice of termination must be given in writing at least 60 days prior to the end of the term. This agreement is governed by the laws of the local jurisdiction."
        ];
    }

    return {
      type: 'VAULT',
      supplier: supplier,
      address: rData.addresses[0],
      date: new Date(),
      total: '0.00',
      tax: '0.00',
      lines: [],
      meta: {
        title: title,
        bodyText: bodyText,
        policyNum: `REF-${Math.floor(Math.random()*10000000)}`,
        ref: `SEC-${Math.floor(Math.random()*1000)}`
      }
    };
  };

  const regeneratePreview = () => {
    let data;
    if (activeCategory === 'BANK') data = generateBankData();
    else if (activeCategory === 'SUPPLIER') data = generateSupplierStatementData();
    else if (docType.includes('Invoice') || docType.includes('Credit Note')) data = generateReceiptData(true);
    else if (docType.includes('Vault') || activeCategory === 'VAULT') data = generateVaultData();
    else data = generateReceiptData(false);

    setPreviewData(data);
  };

  const captureCanvas = async (fileName, zip, rotation = true) => {
    const captureEl = previewRef.current;
    
    // Save original state
    const originalTransform = captureEl.style.transform;
    const originalOrigin = captureEl.style.transformOrigin;
    const originalTransition = captureEl.style.transition;

    // 1. DISABLE TRANSITIONS
    captureEl.style.transition = 'none';

    // 2. SETUP CAPTURE STATE
    captureEl.style.transformOrigin = 'center';

    if (rotation) {
       const randomRot = (Math.random() - 0.5) * 1.5; 
       captureEl.style.transform = `rotate(${randomRot}deg) scale(0.98)`;
    } else {
       captureEl.style.transform = 'scale(1)'; 
    }

    // 3. FORCE REFLOW
    void captureEl.offsetHeight;

    // 4. WAIT FOR PAINT
    await new Promise(resolve => setTimeout(resolve, 50));

    const canvas = await window.html2canvas(captureEl, {
      scale: 2, 
      logging: false, 
      useCORS: true, 
      backgroundColor: '#ffffff'
    });
    
    // 5. RESTORE STATE
    captureEl.style.transformOrigin = originalOrigin;
    captureEl.style.transform = originalTransform;
    
    // 6. RESTORE TRANSITIONS ASYNC
    requestAnimationFrame(() => {
        captureEl.style.transition = originalTransition;
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.8);
    const isLandscape = canvas.width > canvas.height;
    const pdf = new window.jspdf.jsPDF({
       orientation: isLandscape ? 'l' : 'p',
       unit: 'mm',
       format: 'a4'
    });
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    
    if (zip) zip.file(fileName, pdf.output('blob'));
    else pdf.save(fileName);
  };

  const generatePDFs = async () => {
    if (!libsLoaded) return;
    setIsGenerating(true);
    setProgress(0);
    
    // Wait for UI to stabilize
    await new Promise(r => setTimeout(r, 100));
    
    const JSZip = window.JSZip;
    const zip = new JSZip();
    const count = mode === 'MANUAL' ? 1 : quantity;
    const dateStr = new Date().toISOString().slice(0,10);
    const batchName = `Mockuments_Batch_${dateStr}`;

    const isZipMode = count > 1 || (activeCategory === 'SUPPLIER' && includeSupportDocs);

    try {
      for (let i = 0; i < count; i++) {
        let data;
        
        if (activeCategory === 'BANK') data = generateBankData();
        else if (activeCategory === 'SUPPLIER') data = generateSupplierStatementData();
        else if (docType.includes('Invoice') || docType.includes('Credit Note')) data = generateReceiptData(true);
        else if (activeCategory === 'VAULT') data = generateVaultData();
        else data = generateReceiptData(false);

        setPreviewData(data);
        await new Promise(r => setTimeout(r, 150)); 
        const mainFileName = `${activeCategory}_${docType.replace(/\s/g,'')}_${i+1}_${dateStr}.pdf`;
        
        await captureCanvas(mainFileName, isZipMode ? zip : null);

        if (activeCategory === 'SUPPLIER' && includeSupportDocs) {
          const stmtSupplier = data.supplier;
          for (let j = 0; j < data.lines.length; j++) {
            const line = data.lines[j];
            const linkedInvData = {
              type: 'INVOICE',
              supplier: stmtSupplier,
              address: data.address,
              date: line.date,
              total: line.amount,
              tax: (parseFloat(line.amount) * 0.2).toFixed(2), 
              lines: [{ desc: line.desc, qty: 1, amount: line.amount }],
              meta: { poNumber: line.ref, authCode: 'LINKED' }
            };
            setPreviewData(linkedInvData);
            await new Promise(r => setTimeout(r, 150));
            await captureCanvas(`${stmtSupplier}_Invoice_${line.ref}.pdf`, zip);
          }
          setPreviewData(data); 
          await new Promise(r => setTimeout(r, 50));
        }
        setProgress(Math.round(((i + 1) / count) * 100));
      }

      if (isZipMode) {
        const content = await zip.generateAsync({ type: "blob" });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        if (activeCategory === 'SUPPLIER' && includeSupportDocs) {
             link.download = `${previewData.supplier}_Package_${dateStr}.zip`;
        } else {
             link.download = `${batchName}.zip`;
        }
        link.click();
      }
    } catch (err) {
      console.error(err);
      alert("Error. See console.");
    } finally {
      setIsGenerating(false);
      setTimeout(() => {
        if (!document.hasFocus()) {
          const onFocus = () => { setIsSuccess(true); setTimeout(() => setIsSuccess(false), 4000); window.removeEventListener('focus', onFocus); };
          window.addEventListener('focus', onFocus, { once: true });
        } else {
          setTimeout(() => { setIsSuccess(true); setTimeout(() => setIsSuccess(false), 4000); }, 2000); 
        }
      }, 500);
    }
  };

  const renderReceipt = () => (
    <div className="w-[380px] min-h-[600px] bg-white p-8 font-mono text-xs relative shadow-xl mx-auto text-black">
       <div className="absolute inset-0 pointer-events-none mix-blend-multiply opacity-20" style={{backgroundImage: `url("${PAPER_NOISE}")`}}></div>
       
       <div className="text-center mb-6 z-10 relative">
          <h2 className="text-xl font-bold uppercase tracking-tight">{previewData.supplier}</h2>
          <p className="mt-1 font-semibold text-gray-700">{previewData.address}</p>
          <p className="mt-2 text-[10px] font-bold text-gray-600">{previewData.meta.authCode}</p>
       </div>
       
       <div className="border-b-2 border-dashed border-gray-800 mb-4"></div>
       
       <div className="flex justify-between mb-2 font-semibold">
         <span>Date:</span>
         <span>{formatDate(previewData.date, REGIONS[region].locale)}</span>
       </div>

       <div className="space-y-2 mt-4 mb-6 font-medium">
         {previewData.lines.map((l, i) => (
           <div key={i} className="flex justify-between">
             <span>{l.desc}</span>
             <span>{formatCurrency(l.amount, REGIONS[region].currency)}</span>
           </div>
         ))}
       </div>

       <div className="border-t-2 border-dashed border-gray-800 pt-2 space-y-1 font-bold">
         <div className="flex justify-between">
           <span>Subtotal</span>
           <span>{formatCurrency(parseFloat(previewData.total) - parseFloat(previewData.tax), REGIONS[region].currency)}</span>
         </div>
         <div className="flex justify-between">
           <span>{REGIONS[region].taxLabel}</span>
           <span>{formatCurrency(previewData.tax, REGIONS[region].currency)}</span>
         </div>
         <div className="flex justify-between text-lg font-black mt-2">
           <span>TOTAL</span>
           <span>{formatCurrency(previewData.total, REGIONS[region].currency)}</span>
         </div>
       </div>

       <div className="mt-8 text-center font-bold text-gray-500">
         <div className="text-[10px]"> थैंक यू • MERCI • GRAZIE • THANKS </div>
       </div>
    </div>
  );

  const renderInvoice = () => (
    <div className="w-[595px] h-[842px] bg-white p-12 font-sans relative shadow-xl mx-auto text-gray-800">
      <div className="absolute inset-0 pointer-events-none mix-blend-multiply opacity-20" style={{backgroundImage: `url("${PAPER_NOISE}")`}}></div>
      
      <div className="flex justify-between items-start mb-12 relative z-10">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
            {previewData.type === 'CREDIT_NOTE' ? 'CREDIT NOTE' : 'INVOICE'}
          </h1>
          <p className="text-sm mt-2 font-medium">#{previewData.meta.poNumber}</p>
          {previewData.meta.originalInvoiceRef && (
            <p className="text-xs text-gray-500 mt-1">Ref Invoice: #{previewData.meta.originalInvoiceRef}</p>
          )}
        </div>
        <div className="text-right">
          <h2 className="font-bold text-lg">{previewData.supplier}</h2>
          <div className="text-xs text-gray-500 max-w-[150px] ml-auto mt-1">{previewData.address}</div>
        </div>
      </div>

      <div className="flex justify-between mb-12 relative z-10">
        <div className="w-1/3">
          <h3 className="text-xs font-bold uppercase text-gray-400 mb-1">Bill To:</h3>
          <p className="font-bold">{previewData.meta.customerName}</p>
          <p className="text-xs">100 Business Park, Tech City</p>
        </div>
        <div className="w-1/3 text-right">
          <div className="flex justify-between mb-1">
             <span className="text-xs font-bold text-gray-400">Date:</span>
             <span className="text-sm">{formatDate(previewData.date, REGIONS[region].locale)}</span>
          </div>
          <div className="flex justify-between">
             <span className="text-xs font-bold text-gray-400">
               {previewData.type === 'CREDIT_NOTE' ? 'Effective Date:' : 'Due Date:'}
             </span>
             <span className="text-sm">
               {formatDate(previewData.type === 'CREDIT_NOTE' ? previewData.date : previewData.meta.dueDate, REGIONS[region].locale)}
             </span>
          </div>
        </div>
      </div>

      <table className="w-full text-sm mb-8 relative z-10">
        <thead className="border-b-2 border-gray-800">
          <tr>
            <th className="text-left py-2 w-1/2">Description</th>
            <th className="text-center py-2">Qty</th>
            <th className="text-right py-2">Amount</th>
          </tr>
        </thead>
        <tbody>
          {previewData.lines.map((l, i) => (
            <tr key={i} className="border-b border-gray-200">
              <td className="py-3">{l.desc}</td>
              <td className="text-center py-3">{l.qty || 1}</td>
              <td className="text-right py-3">{formatCurrency(l.amount, REGIONS[region].currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end relative z-10">
        <div className="w-1/2 space-y-2">
           <div className="flex justify-between text-sm">
             <span>Subtotal</span>
             <span>{formatCurrency(parseFloat(previewData.total) - parseFloat(previewData.tax), REGIONS[region].currency)}</span>
           </div>
           <div className="flex justify-between text-sm">
             <span>{REGIONS[region].taxLabel} ({REGIONS[region].taxRate*100}%)</span>
             <span>{formatCurrency(previewData.tax, REGIONS[region].currency)}</span>
           </div>
           <div className="flex justify-between text-xl font-bold border-t border-gray-800 pt-2 mt-2">
             <span>Total</span>
             <span>{formatCurrency(previewData.total, REGIONS[region].currency)}</span>
           </div>
        </div>
      </div>
    </div>
  );

  const renderVault = () => (
    <div className="w-[595px] h-[842px] bg-[#fdfdfd] p-16 font-serif text-justify leading-relaxed relative shadow-xl mx-auto text-gray-800">
      <div className="absolute inset-0 pointer-events-none mix-blend-multiply opacity-20" style={{backgroundImage: `url("${PAPER_NOISE}")`}}></div>
      <div className="text-center mb-12 relative z-10">
        <div className="w-12 h-12 border-4 border-double border-black mx-auto mb-4 rounded-full flex items-center justify-center font-bold text-2xl">§</div>
        <h1 className="text-2xl font-bold uppercase tracking-widest">{previewData.supplier}</h1>
        <p className="italic text-sm">{previewData.meta.title}</p>
      </div>
      <div className="mb-8 text-sm relative z-10">
        <p><strong>Reference:</strong> {previewData.meta.ref}</p>
        <p><strong>Date:</strong> {formatDate(previewData.date, REGIONS[region].locale)}</p>
        <p><strong>Document ID:</strong> {previewData.meta.policyNum}</p>
      </div>
      <h2 className="font-bold uppercase text-sm border-b border-black mb-4 pb-1 relative z-10">Terms & Declarations</h2>
      <div className="text-xs space-y-4 text-gray-700 relative z-10">
         {previewData.meta.bodyText && previewData.meta.bodyText.map((paragraph, index) => (
             <p key={index}>{paragraph}</p>
         ))}
      </div>
      <div className="mt-16 pt-8 border-t border-black flex justify-between relative z-10">
         <div className="text-center">
            <div className="h-10 border-b border-gray-400 w-32 mb-1"></div>
            <span className="text-xs uppercase">Authorized Signature</span>
         </div>
         <div className="text-center">
            <div className="h-10 border-b border-gray-400 w-32 mb-1"></div>
            <span className="text-xs uppercase">Date</span>
         </div>
      </div>
    </div>
  );

  const renderBankStatement = () => (
    <div className="w-[595px] h-[842px] bg-white p-10 font-sans relative shadow-xl mx-auto text-gray-800">
      <div className="absolute inset-0 pointer-events-none mix-blend-multiply opacity-20" style={{backgroundImage: `url("${PAPER_NOISE}")`}}></div>
      <div className="border-b-4 border-blue-900 pb-4 mb-8 flex justify-between items-end relative z-10">
         <div>
            <div className="text-2xl font-bold text-blue-900 italic">{previewData.supplier}</div>
            <div className="text-xs text-gray-500">Private Banking Division</div>
         </div>
         <div className="text-right text-xs">
            <div>Statement Date: {formatDate(previewData.date, REGIONS[region].locale)}</div>
            <div>Page 1 of 1</div>
         </div>
      </div>
      <div className="bg-gray-100 p-4 mb-8 flex justify-between text-sm rounded relative z-10">
         <div>
            <div className="text-gray-500 text-xs">Account Name</div>
            <div className="font-bold">John Doe Trading</div>
         </div>
         <div>
            <div className="text-gray-500 text-xs">Sort Code</div>
            <div className="font-bold">{previewData.meta.sortCode}</div>
         </div>
         <div>
            <div className="text-gray-500 text-xs">Account Number</div>
            <div className="font-bold">{previewData.meta.accountNum}</div>
         </div>
      </div>
      <div className="mb-8 grid grid-cols-3 gap-4 text-center relative z-10">
         <div className="border p-2">
            <div className="text-xs text-gray-500">Opening Balance</div>
            <div className="font-medium">{formatCurrency(previewData.meta.openingBalance, REGIONS[region].currency)}</div>
         </div>
         <div className="border p-2 bg-blue-50">
            <div className="text-xs text-gray-500">Closing Balance</div>
            <div className="font-bold text-blue-900">{formatCurrency(previewData.total, REGIONS[region].currency)}</div>
         </div>
      </div>
      <table className="w-full text-xs relative z-10">
         <thead className="bg-blue-900 text-white">
            <tr>
               <th className="p-2 text-left">Date</th>
               <th className="p-2 text-left">Description</th>
               <th className="p-2 text-right">Debit</th>
               <th className="p-2 text-right">Credit</th>
               <th className="p-2 text-right">Balance</th>
            </tr>
         </thead>
         <tbody className="divide-y divide-gray-200">
            {previewData.lines.map((l, i) => (
               <tr key={i}>
                  <td className="p-2">{formatDate(new Date(l.date), REGIONS[region].locale)}</td>
                  <td className="p-2">{l.desc}</td>
                  <td className="p-2 text-right">{l.debit ? formatCurrency(l.debit, '') : ''}</td>
                  <td className="p-2 text-right">{l.credit ? formatCurrency(l.credit, '') : ''}</td>
                  <td className="p-2 text-right font-bold">{formatCurrency(l.balance, '')}</td>
               </tr>
            ))}
         </tbody>
      </table>
    </div>
  );

  const renderSupplierStatement = () => (
    <div className="w-[595px] h-[842px] bg-white p-12 font-sans relative shadow-xl mx-auto text-gray-800">
      <div className="absolute inset-0 pointer-events-none mix-blend-multiply opacity-20" style={{backgroundImage: `url("${PAPER_NOISE}")`}}></div>
      <div className="flex justify-between items-center mb-12 border-b-2 border-black pb-4 relative z-10">
         <div>
            <h1 className="text-3xl font-bold uppercase tracking-wider">Statement</h1>
            <p className="text-sm mt-1 text-gray-500">of Account</p>
         </div>
         <div className="text-right">
            <div className="font-bold text-lg">{previewData.supplier}</div>
            <div className="text-xs">{previewData.address}</div>
         </div>
      </div>
      <div className="flex justify-between mb-8 text-sm relative z-10">
         <div className="border l-4 border-black pl-4">
            <div className="text-xs text-gray-500 uppercase">To:</div>
            <div className="font-bold">Generic Corp Ltd.</div>
            <div>Customer Ref: {previewData.meta.customerRef}</div>
         </div>
         <div className="text-right">
            <div className="text-xs text-gray-500 uppercase">Statement Date:</div>
            <div className="font-bold">{formatDate(previewData.date, REGIONS[region].locale)}</div>
         </div>
      </div>
      <table className="w-full text-sm mb-8 relative z-10">
         <thead className="border-b border-black">
            <tr>
               <th className="text-left py-2">Date</th>
               <th className="text-left py-2">Reference</th>
               <th className="text-left py-2">Details</th>
               <th className="text-right py-2">Amount</th>
            </tr>
         </thead>
         <tbody className="divide-y divide-gray-300">
            {previewData.lines.map((l, i) => (
               <tr key={i}>
                  <td className="py-2">{formatDate(new Date(l.date), REGIONS[region].locale)}</td>
                  <td className="py-2 font-medium">{l.ref}</td>
                  <td className="py-2">{l.desc}</td>
                  <td className="py-2 text-right">{formatCurrency(l.amount, REGIONS[region].currency)}</td>
               </tr>
            ))}
         </tbody>
      </table>
      <div className="flex justify-end mt-8 relative z-10">
         <div className="bg-gray-100 p-4 rounded w-1/3">
            <div className="flex justify-between items-center">
               <span className="font-bold uppercase text-xs">Total Due</span>
               <span className="font-bold text-xl">{formatCurrency(previewData.total, REGIONS[region].currency)}</span>
            </div>
         </div>
      </div>
    </div>
  );

  return (
    <div className={`flex h-screen w-full ${theme.bgApp} ${theme.textMain} font-claude-ui overflow-hidden transition-colors duration-500 ease-in-out`}>
      <style>
        {`
          .font-claude-ui { font-family: "Charter", "Bitstream Charter", "Sitka Text", "Cambria", serif; }
          @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          .animate-spin-slow { animation: spin-slow 3s linear infinite; }
          @keyframes fade-in-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
          .animate-fade-in-up { animation: fade-in-up 0.5s ease-out forwards; }
          /* Updated Scrollbar Styling for Smoother Look */
          ::-webkit-scrollbar { width: 6px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: #55555540; border-radius: 3px; }
          ::-webkit-scrollbar-thumb:hover { background: #55555580; }
        `}
      </style>
      
      {/* SIDEBAR */}
      <div className={`w-20 h-full flex-shrink-0 ${theme.bgSidebar} ${theme.border} border-r z-50 relative transition-colors duration-500`}>
        
        {/* Floating Sidebar Container */}
        <div className={`absolute top-0 left-0 h-full w-20 hover:w-56 ${theme.bgSidebar} ${theme.bgSidebarHover} backdrop-blur-xl ${theme.border} border-r transition-all duration-500 ease-in-out flex flex-col overflow-hidden group shadow-2xl z-50`}>
          
          {/* Logo Area */}
          <div className="h-20 flex items-center px-6 gap-4 flex-shrink-0">
            <div className={`w-8 h-8 ${theme.logoBg} rounded-md flex items-center justify-center flex-shrink-0`}>
              <ScanLine className={`${theme.logoIcon} w-5 h-5`} />
            </div>
            <span className={`font-bold text-lg tracking-wide ${theme.textMain} opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75 whitespace-nowrap`}>
              Mockuments
            </span>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto overflow-x-hidden">
            {Object.values(CATEGORIES).map((cat) => {
              const isActive = activeCategory === (cat.id === 'Bank Statements' ? 'BANK' : cat.id === 'Supplier Statements' ? 'SUPPLIER' : cat.id.toUpperCase());
              return (
                <div key={cat.id}>
                  <button
                    onClick={() => setActiveCategory(cat.id === 'Bank Statements' ? 'BANK' : cat.id === 'Supplier Statements' ? 'SUPPLIER' : cat.id.toUpperCase())}
                    className={`w-full flex items-center gap-4 px-3 py-3 rounded-lg transition-all duration-200 border whitespace-nowrap ${
                      isActive
                        ? `${theme.accentBg} ${theme.accentText} ${theme.borderHighlight} shadow-sm`
                        : `border-transparent ${theme.textMuted} ${theme.navHoverBg} ${theme.navHoverBorder} hover:${theme.textMain}`
                    }`}
                  >
                    <cat.icon size={20} className="flex-shrink-0 min-w-[20px]" />
                    <span className="font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-75">
                      {cat.id}
                    </span>
                  </button>
                </div>
              );
            })}
          </nav>
          
          {/* Theme Switcher */}
          <div className="px-3 pb-2 pt-2">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`w-full flex items-center gap-4 px-3 py-3 rounded-lg transition-all duration-200 border border-transparent whitespace-nowrap ${theme.textMuted} ${theme.navHoverBg} ${theme.navHoverBorder} hover:${theme.textMain}`}
            >
               <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                 {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
               </div>
               <span className="font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-75">
                  {isDarkMode ? 'Light Mode' : 'Dark Mode'}
               </span>
            </button>
          </div>

          {/* Footer Info */}
          <div className={`p-4 ${theme.border} border-t text-xs ${theme.textMuted} opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100 whitespace-nowrap overflow-hidden`}>
            <p>Dext OCR Testing Tool</p>
            <p>v2.2 • React</p>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col md:flex-row h-full relative z-10 transition-colors duration-500">
        
        {/* CONFIG PANEL */}
        <div 
          className={`w-full md:w-96 ${theme.bgPanel} ${theme.border} border-r p-6 flex flex-col gap-6 overflow-y-scroll transition-colors duration-500`}
        >
          <div>
            <h2 className={`text-xl font-semibold ${theme.textMain} mb-1`}>Configuration</h2>
            <p className={`text-sm ${theme.textMuted}`}>Set parameters for generation</p>
          </div>

          {/* Region */}
          <div className="space-y-3">
            <div className="relative group w-fit">
              <label className={`text-xs font-semibold uppercase ${theme.textMuted} tracking-wider flex items-center gap-2 cursor-help`}>
                <Globe size={14} /> Global Region
              </label>
              <div className={`absolute bottom-full left-0 mb-2 w-56 px-3 py-2 ${theme.bgInput} ${theme.border} ${theme.textMuted} rounded-md shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 text-xs leading-tight`}>
                  Updates Currency, Date Formats (DD/MM vs MM/DD), Tax Labels (VAT/ABN), and local Supplier lists.
                  <div className={`absolute top-full left-4 -mt-[1px] border-4 border-transparent border-t-${isDarkMode ? 'gray-700' : 'gray-300'}`}></div>
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-2">
              {Object.keys(REGIONS).map((r) => (
                <button
                  key={r}
                  onClick={() => setRegion(r)}
                  className={`py-2 rounded-md text-sm font-medium transition-colors border ${
                    region === r ? `${theme.bgCard} ${theme.borderHighlight} ${theme.accentText}` : `${theme.bgCard} border-transparent ${theme.textMuted}`
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <hr className={theme.border} />

          {/* Mode */}
          <div className={`${theme.bgCard} p-1 rounded-lg flex`}>
            <div className="flex-1 relative group">
              <button 
                  onClick={() => activeCategory !== 'VAULT' && setMode('MANUAL')} 
                  disabled={activeCategory === 'VAULT'}
                  className={`w-full py-2 text-sm font-medium rounded-md transition-all ${mode === 'MANUAL' ? `${theme.bgPanel} ${theme.textMain} shadow-sm` : theme.textMuted} ${activeCategory === 'VAULT' ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                  Manual
              </button>
              {activeCategory === 'VAULT' && (
                <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 px-3 py-2 ${theme.bgInput} ${theme.border} ${theme.textMuted} rounded-md shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 text-center leading-tight text-xs`}>
                    Manual entry is not available for Vault documents.
                    <div className={`absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-${isDarkMode ? 'gray-700' : 'gray-300'}`}></div>
                </div>
              )}
            </div>
            
            <div className="flex-1 relative group">
                <button 
                    onClick={() => setMode('AUTO')} 
                    className={`w-full py-2 text-sm font-medium rounded-md transition-all ${mode === 'AUTO' ? `${theme.bgPanel} ${theme.textMain} shadow-sm` : theme.textMuted}`}
                >
                    Automated
                </button>
                <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 px-3 py-2 ${theme.bgInput} ${theme.border} ${theme.textMuted} rounded-md shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 text-center leading-tight text-xs`}>
                    Generates randomized data for bulk volume testing.
                    <div className={`absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-${isDarkMode ? 'gray-700' : 'gray-300'}`}></div>
                </div>
            </div>
          </div>

          {/* Dynamic Inputs */}
          <div className="flex-1 space-y-4">
            <div className="space-y-1">
              <label className={`text-xs ${theme.textMuted}`}>Document Type</label>
              {CATEGORIES[activeCategory]?.types.length > 1 ? (
                <div className="relative">
                  <select 
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className={`w-full ${theme.bgInput} ${theme.borderInput} border rounded-md py-2.5 pl-3 pr-10 text-sm ${theme.textInput} focus:outline-none focus:${theme.borderHighlight} appearance-none cursor-pointer`}
                  >
                    {CATEGORIES[activeCategory]?.types.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <ChevronDown 
                    size={16} 
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none ${theme.textMuted}`} 
                  />
                </div>
              ) : (
                <div className="relative group">
                  <div className={`w-full ${theme.bgPanel} ${theme.borderInput} border rounded-md p-2.5 text-sm ${theme.textMuted} select-none cursor-not-allowed`}>
                    {docType}
                  </div>
                  <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 px-3 py-2 ${theme.bgInput} ${theme.border} ${theme.textMuted} rounded-md shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 text-center leading-tight text-xs`}>
                      Only one document type is available for this category.
                      <div className={`absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-${isDarkMode ? 'gray-700' : 'gray-300'}`}></div>
                  </div>
                </div>
              )}
            </div>

            {/* Special Configs for Supplier */}
            {activeCategory === 'SUPPLIER' && (
               <div className={`p-3 ${theme.bgCard} rounded border ${theme.borderInput} flex items-start gap-3`}>
                  <input 
                    type="checkbox" 
                    id="linkDocs"
                    checked={includeSupportDocs}
                    onChange={(e) => setIncludeSupportDocs(e.target.checked)}
                    className="mt-1 accent-[#FF5A02]" 
                  />
                  <div>
                    <label htmlFor="linkDocs" className={`text-sm font-bold ${theme.textMain} block`}>Include Supporting Invoices</label>
                    <p className={`text-[10px] ${theme.textMuted} mt-1`}>Generates individual PDF invoices for every line item, zipped together.</p>
                  </div>
               </div>
            )}

            {/* Manual Mode Inputs */}
            {mode === 'MANUAL' ? (
              <>
                {(activeCategory === 'COSTS' || activeCategory === 'SALES') ? (
                  <>
                     <div className="space-y-1">
                      <label className={`text-xs ${theme.textMuted}`}>
                        {activeCategory === 'SALES' ? 'Customer Name' : 'Supplier Name'}
                      </label>
                      <input 
                        type="text" 
                        value={manualData.supplier}
                        onChange={(e) => setManualData({...manualData, supplier: e.target.value})}
                        className={`w-full ${theme.bgInput} ${theme.borderInput} border rounded-md p-2.5 text-sm ${theme.textInput} focus:outline-none focus:${theme.borderHighlight}`}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className={`text-xs ${theme.textMuted}`}>Date</label>
                        <input 
                          type="date" 
                          value={manualData.date}
                          onChange={(e) => setManualData({...manualData, date: e.target.value})}
                          className={`w-full ${theme.bgInput} ${theme.borderInput} border rounded-md p-2.5 text-sm ${theme.textInput} focus:outline-none focus:${theme.borderHighlight}`}
                        />
                      </div>
                      
                      {/* Conditional Due Date Input for Invoices */}
                      {docType.includes('Invoice') && (
                        <div className="space-y-1 animate-fade-in-up">
                          <label className={`text-xs ${theme.textMuted}`}>Due Date</label>
                          <input 
                            type="date" 
                            value={manualData.dueDate}
                            onChange={(e) => setManualData({...manualData, dueDate: e.target.value})}
                            className={`w-full ${theme.bgInput} ${theme.borderInput} border rounded-md p-2.5 text-sm ${theme.textInput} focus:outline-none focus:${theme.borderHighlight}`}
                          />
                        </div>
                      )}

                      <div className={`space-y-1 ${docType.includes('Invoice') ? 'col-span-2' : ''}`}>
                        <label className={`text-xs ${theme.textMuted}`}>Total ({REGIONS[region].currency})</label>
                        <input 
                          type="number" 
                          value={manualData.total}
                          onChange={(e) => setManualData({...manualData, total: e.target.value})}
                          className={`w-full ${theme.bgInput} ${theme.borderInput} border rounded-md p-2.5 text-sm ${theme.textInput} focus:outline-none focus:${theme.borderHighlight}`}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                       <div className="flex justify-between items-center">
                         <label className={`text-xs ${theme.textMuted}`}>Tax ({REGIONS[region].taxLabel})</label>
                         <button 
                           onClick={() => setManualData(prev => ({...prev, autoCalcTax: !prev.autoCalcTax}))}
                           className={`text-[10px] flex items-center gap-1 ${manualData.autoCalcTax ? theme.accentText : theme.textMuted}`}
                         >
                           <Calculator size={10} /> Auto-Calc
                         </button>
                       </div>
                       
                       <div className="relative group">
                         <input 
                            type="number" 
                            value={manualData.tax}
                            disabled={manualData.autoCalcTax}
                            onChange={(e) => setManualData({...manualData, tax: e.target.value, autoCalcTax: false})}
                            className={`w-full ${theme.bgInput} ${theme.borderInput} border rounded-md p-2.5 text-sm ${theme.textInput} focus:outline-none focus:${theme.borderHighlight} ${manualData.autoCalcTax ? 'opacity-50 cursor-not-allowed' : ''}`}
                          />
                          {manualData.autoCalcTax && (
                            <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-40 px-3 py-2 ${theme.bgInput} ${theme.border} ${theme.textMuted} rounded-md shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 text-center leading-tight text-xs`}>
                                Disable Auto-Calc to edit manually.
                                <div className={`absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-${isDarkMode ? 'gray-700' : 'gray-300'}`}></div>
                            </div>
                          )}
                       </div>
                    </div>
                  </>
                ) : (
                  <div className={`${theme.textMuted} text-sm italic p-4 border border-dashed ${theme.borderInput} rounded`}>
                     For complex layouts like <strong>{docType}</strong>, please use Automated Mode to generate random reconciliations, or switch to Costs/Sales for standard manual entry.
                  </div>
                )}
              </>
            ) : (
              <div className={`space-y-4 p-4 ${theme.bgInput} border ${theme.borderInput} rounded-lg border-dashed`}>
                <div className={`flex items-center gap-2 ${theme.accentText} text-sm font-medium`}>
                  <Layers size={16} /> Bulk Generation
                </div>
                <div className="space-y-2">
                   <label className={`text-xs ${theme.textMuted}`}>Quantity (1-50)</label>
                   <input 
                      type="range" min="1" max="50" 
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#FF5A02]"
                   />
                   <div className={`text-right text-lg font-mono ${theme.textMain}`}>{quantity} docs</div>
                </div>
              </div>
            )}
          </div>

          {/* Action Area */}
          <div className="mt-auto space-y-3">
             {isGenerating ? (
               <div className="h-12 flex flex-col justify-center space-y-2">
                 <div className={`flex justify-between text-xs ${theme.accentText}`}>
                    <span>Processing...</span>
                    <span>{progress}%</span>
                 </div>
                 <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                   <div className="h-full bg-[#FF5A02] transition-all duration-300" style={{ width: `${progress}%` }} />
                 </div>
               </div>
             ) : (
                <button
                  onClick={generatePDFs}
                  onMouseEnter={() => isSuccess && setIsSuccess(false)} 
                  disabled={!libsLoaded}
                  className={`w-full h-12 font-bold rounded-md flex items-center justify-center gap-2 transition-all duration-1000 ease-in-out disabled:opacity-50 focus:outline-none ${
                     isSuccess ? 'bg-[#C6F0D8] text-[#121212] hover:bg-[#C6F0D8]' : 'bg-[#FF5A02] hover:bg-[#ff7a33] text-[#121212]'
                  }`}
                >
                  {isSuccess ? <CheckCircle2 size={18} /> : <Download size={18} />}
                  {isSuccess ? 'Success!' : (mode === 'MANUAL' ? 'Generate PDF' : `Generate ${quantity} PDFs`)}
                </button>
             )}
          </div>
        </div>

        {/* LIVE PREVIEW AREA */}
        <div className={`flex-1 ${theme.bgPreview} p-8 flex items-center justify-center relative overflow-hidden transition-colors duration-500`}>
           <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: `radial-gradient(${theme.gridColor} 1px, transparent 1px)`, backgroundSize: '20px 20px' }}></div>
           
           <div className="flex flex-col gap-4 items-center animate-fade-in-up w-full h-full overflow-y-auto overflow-x-hidden scrollbar-hide">
              <div className={`${theme.textMuted} text-xs uppercase tracking-widest font-semibold flex items-center gap-2 sticky top-0 ${theme.bgPreview} z-20 py-2 transition-colors duration-500`}>
                 <Settings size={12} /> Live Preview: {previewData.type}
              </div>

              {/* FIX: Layout Wrapper Strategy (Reverted)
                  1. Wrapper has the SCALED dimensions (e.g., 386px width) so flexbox centers it perfectly.
                  2. Inner div (previewRef) has the ORIGINAL dimensions (595px) and scales down from top-left.
              */}
              <div className="flex-1 w-full flex justify-center min-h-0 my-4">
                  <div 
                      style={{ 
                          // Reserve exactly the space needed for the visual result
                          width: previewData.type === 'RECEIPT' ? 380 : 595 * 0.65,
                          height: previewData.type === 'RECEIPT' ? 'auto' : 842 * 0.65,
                          overflow: 'visible' 
                      }}
                  >
                      <div 
                          ref={previewRef} 
                          id="doc-preview" 
                          // FIX: Only apply transition when NOT generating to prevent bounce/blur in PDF
                          className={`shadow-2xl overflow-hidden ${theme.bgApp} transition-all duration-500 origin-top-left`}
                          style={{ 
                              // Scale from top-left to fit into the wrapper
                              transform: previewData.type === 'RECEIPT' ? 'scale(1)' : 'scale(0.65)',
                              width: previewData.type === 'RECEIPT' ? '380px' : '595px',
                              minHeight: previewData.type === 'RECEIPT' ? 'auto' : '842px',
                              backgroundColor: 'white', 
                          }}
                      >
                          {previewData.type === 'RECEIPT' && renderReceipt()}
                          {(previewData.type === 'INVOICE' || previewData.type === 'CREDIT_NOTE') && renderInvoice()}
                          {previewData.type === 'VAULT' && renderVault()}
                          {previewData.type === 'BANK' && renderBankStatement()}
                          {previewData.type === 'STATEMENT' && renderSupplierStatement()}
                      </div>
                  </div>
              </div>

              <div className={`flex items-center gap-2 text-xs ${theme.textMuted} ${theme.bgPanel} px-3 py-1 rounded-full ${theme.border} border sticky bottom-4 z-20 mt-4`}>
                  <RefreshCw size={10} className="animate-spin-slow" />
                  Showing sample. Actual data generated on download.
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}