/**
 * KISHOLOY Phase 05: Bulk Supplier Import Modal
 * Supports drag-and-drop & manual file upload (.csv & .json), direct text pasting,
 * sample template downloads, client-side validation preview, and server-authoritative ingestion.
 * @license Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { useModalA11y } from '../hooks/useModalA11y';
import { 
  UploadCloud, FileSpreadsheet, Download, Trash2, AlertCircle, 
  CheckCircle2, X, FileText, ArrowRight, RefreshCw, AlertTriangle, 
  HelpCircle, Eye, ShieldCheck, Check
} from 'lucide-react';

interface ParsedSupplierRow {
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  district: string;
  address: string;
  categoriesSupplied: string[];
  paymentTerms: string;
  tradeLicenseNumber?: string;
  tinNumber?: string;
  bankDetails?: {
    bankName: string;
    accountName?: string;
    accountNumber: string;
    branchName?: string;
  };
  mfsDetails?: {
    provider: 'BKASH' | 'NAGAD';
    accountNumber: string;
  };
  notes?: string;
  validationError?: string;
}

interface BulkSupplierImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (importedCount: number) => void;
  language: 'EN' | 'BN';
  notify: (msg: string) => void;
}

export function BulkSupplierImportModal({
  isOpen,
  onClose,
  onSuccess,
  language,
  notify
}: BulkSupplierImportModalProps) {
  // F-307: Escape to close, focus trap, focus restore and ARIA dialog roles.
  const { containerRef, dialogProps } = useModalA11y({
    open: isOpen,
    onClose,
    label: 'Bulk Supplier Import',
  });

  const [inputMode, setInputMode] = useState<'upload' | 'paste'>('upload');
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [rawText, setRawText] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedSupplierRow[]>([]);
  const [serverErrors, setServerErrors] = useState<{ row: number; companyName?: string; error: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [importSummary, setImportSummary] = useState<{ successCount: number; total: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // CSV line parser taking quotes into account
  const parseCsvLine = (line: string): string[] => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // Skip escaped quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  };

  const parseCsvContent = (content: string): ParsedSupplierRow[] => {
    const lines = content.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length < 2) {
      throw new Error(language === 'BN' ? 'CSV ফাইলে অন্তত হেডার এবং একটি ডেটা সারি থাকতে হবে।' : 'CSV must contain a header and at least one data row.');
    }

    const headers = parseCsvLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
    
    // Header index mapping
    const getIndex = (matches: string[]): number => {
      return headers.findIndex(h => matches.some(m => h.includes(m)));
    };

    const companyIdx = getIndex(['companyname', 'company', 'organization', 'vendor', 'name']);
    const contactIdx = getIndex(['contactperson', 'contact', 'person', 'owner', 'manager']);
    const phoneIdx = getIndex(['phone', 'mobile', 'cell', 'tel']);
    const emailIdx = getIndex(['email', 'mail']);
    const districtIdx = getIndex(['district', 'city', 'zila', 'region']);
    const addressIdx = getIndex(['address', 'location', 'factory']);
    const categoriesIdx = getIndex(['categories', 'category', 'item', 'products']);
    const termsIdx = getIndex(['paymentterms', 'terms', 'payment']);
    const licenseIdx = getIndex(['tradelicense', 'license', 'trade']);
    const tinIdx = getIndex(['tin', 'tax']);
    const bankNameIdx = getIndex(['bankname', 'bank']);
    const bankAccIdx = getIndex(['bankaccount', 'accountnumber', 'bankacc']);
    const mfsProviderIdx = getIndex(['mfsprovider', 'mfs']);
    const mfsAccIdx = getIndex(['mfsaccount', 'mfsnumber', 'bkash', 'nagad']);
    const notesIdx = getIndex(['notes', 'note', 'remarks']);

    const rows: ParsedSupplierRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCsvLine(lines[i]);
      if (cols.length === 0 || cols.every(c => c === '')) continue;

      const companyName = companyIdx !== -1 ? cols[companyIdx] || '' : cols[0] || '';
      const contactPerson = contactIdx !== -1 ? cols[contactIdx] || '' : cols[1] || '';
      const phone = phoneIdx !== -1 ? cols[phoneIdx] || '' : cols[2] || '';
      const email = emailIdx !== -1 ? cols[emailIdx] || '' : '';
      const district = districtIdx !== -1 ? cols[districtIdx] || 'Dhaka' : 'Dhaka';
      const address = addressIdx !== -1 ? cols[addressIdx] || 'Bangladesh' : 'Bangladesh';
      
      const rawCategories = categoriesIdx !== -1 ? cols[categoriesIdx] || '' : '';
      const categoriesSupplied = rawCategories ? rawCategories.split(/[,;|]/).map(c => c.trim()).filter(Boolean) : ['General Merchandise'];

      let paymentTerms = termsIdx !== -1 ? cols[termsIdx] || 'NET_15' : 'NET_15';
      paymentTerms = paymentTerms.toUpperCase().replace(/\s+/g, '_');
      if (!['ADVANCE', 'NET_15', 'NET_30', 'COD', 'CONSIGNMENT'].includes(paymentTerms)) {
        paymentTerms = 'NET_15';
      }

      let bankDetails = undefined;
      const bName = bankNameIdx !== -1 ? cols[bankNameIdx] : undefined;
      const bAcc = bankAccIdx !== -1 ? cols[bankAccIdx] : undefined;
      if (bName && bAcc) {
        bankDetails = {
          bankName: bName,
          accountNumber: bAcc,
          accountName: companyName
        };
      }

      let mfsDetails = undefined;
      let mfsProv = mfsProviderIdx !== -1 ? cols[mfsProviderIdx]?.toUpperCase() : undefined;
      const mfsNum = mfsAccIdx !== -1 ? cols[mfsAccIdx] : undefined;
      if (mfsNum) {
        if (!mfsProv || (!mfsProv.includes('BKASH') && !mfsProv.includes('NAGAD'))) {
          mfsProv = 'BKASH';
        }
        mfsDetails = {
          provider: (mfsProv.includes('NAGAD') ? 'NAGAD' : 'BKASH') as 'BKASH' | 'NAGAD',
          accountNumber: mfsNum
        };
      }

      // Validation
      let validationError: string | undefined;
      if (!companyName.trim()) {
        validationError = 'Company name is missing';
      } else if (!phone.trim()) {
        validationError = 'Phone number is missing';
      }

      rows.push({
        companyName: companyName.trim(),
        contactPerson: contactPerson.trim() || 'Authorized Representative',
        phone: phone.trim(),
        email: email.trim().toLowerCase() || `supplier.${rows.length + 1}@kisholoy-vendor.bd`,
        district: district.trim() || 'Dhaka',
        address: address.trim() || 'Bangladesh',
        categoriesSupplied: categoriesSupplied.length > 0 ? categoriesSupplied : ['General Merchandise'],
        paymentTerms,
        tradeLicenseNumber: licenseIdx !== -1 ? cols[licenseIdx] : undefined,
        tinNumber: tinIdx !== -1 ? cols[tinIdx] : undefined,
        bankDetails,
        mfsDetails,
        notes: notesIdx !== -1 ? cols[notesIdx] : undefined,
        validationError
      });
    }

    return rows;
  };

  const parseJsonContent = (content: string): ParsedSupplierRow[] => {
    const raw = JSON.parse(content);
    const items = Array.isArray(raw) ? raw : (raw.suppliers || raw.data || [raw]);

    if (!Array.isArray(items) || items.length === 0) {
      throw new Error(language === 'BN' ? 'JSON ফাইলে সরবরাহকারীর তালিকা পাওয়া যায়নি।' : 'JSON file must contain an array of supplier objects.');
    }

    return items.map((item: any, idx: number) => {
      const companyName = String(item.companyName || item.company_name || item.name || '').trim();
      const contactPerson = String(item.contactPerson || item.contact_person || item.contact || '').trim();
      const phone = String(item.phone || item.phone_number || item.mobile || '').trim();
      const email = String(item.email || '').trim().toLowerCase();
      const district = String(item.district || item.city || 'Dhaka').trim();
      const address = String(item.address || 'Bangladesh').trim();

      let categories = ['General Merchandise'];
      if (Array.isArray(item.categoriesSupplied)) {
        categories = item.categoriesSupplied.map((c: any) => String(c).trim()).filter(Boolean);
      } else if (typeof item.categoriesSupplied === 'string') {
        categories = item.categoriesSupplied.split(/[,;|]/).map((c: any) => c.trim()).filter(Boolean);
      } else if (Array.isArray(item.categories)) {
        categories = item.categories.map((c: any) => String(c).trim()).filter(Boolean);
      }

      let paymentTerms = String(item.paymentTerms || item.payment_terms || 'NET_15').toUpperCase().trim();
      if (!['ADVANCE', 'NET_15', 'NET_30', 'COD', 'CONSIGNMENT'].includes(paymentTerms)) {
        paymentTerms = 'NET_15';
      }

      let validationError: string | undefined;
      if (!companyName) {
        validationError = 'Company name is missing';
      } else if (!phone) {
        validationError = 'Phone number is missing';
      }

      return {
        companyName,
        contactPerson: contactPerson || 'Authorized Representative',
        phone,
        email: email || `supplier.${idx + 1}@kisholoy-vendor.bd`,
        district,
        address,
        categoriesSupplied: categories.length > 0 ? categories : ['General Merchandise'],
        paymentTerms,
        tradeLicenseNumber: item.tradeLicenseNumber || item.trade_license,
        tinNumber: item.tinNumber || item.tin,
        bankDetails: item.bankDetails,
        mfsDetails: item.mfsDetails,
        notes: item.notes,
        validationError
      };
    });
  };

  const processFileContent = (content: string, name: string, size?: number) => {
    setFileName(name);
    if (size) setFileSize(size);
    setServerErrors([]);
    setImportSummary(null);

    try {
      let rows: ParsedSupplierRow[] = [];
      const trimmed = content.trim();

      if (name.endsWith('.json') || trimmed.startsWith('[') || trimmed.startsWith('{')) {
        rows = parseJsonContent(trimmed);
      } else {
        rows = parseCsvContent(trimmed);
      }

      if (rows.length === 0) {
        notify(language === 'BN' ? 'কোন ডেটা সারি পাওয়া যায়নি।' : 'No valid records found in file.');
        return;
      }

      setParsedRows(rows);
      notify(
        language === 'BN'
          ? `${rows.length}টি সরবরাহকারী রেকর্ড সফলভাবে পার্স করা হয়েছে। পর্যালোচনার জন্য প্রস্তুত।`
          : `Parsed ${rows.length} supplier records. Ready for review.`
      );
    } catch (err: any) {
      console.error('Import parse error:', err);
      notify(err.message || 'Failed to parse file.');
    }
  };

  // Drag and Drop Event Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        processFileContent(text, file.name, file.size);
      };
      reader.readAsText(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        processFileContent(text, file.name, file.size);
      };
      reader.readAsText(file);
    }
  };

  const handleParseRawText = () => {
    if (!rawText.trim()) {
      notify(language === 'BN' ? 'অনুগ্রহ করে JSON বা CSV ডেটা পেস্ট করুন।' : 'Please paste JSON or CSV text to parse.');
      return;
    }
    const detectedName = rawText.trim().startsWith('[') || rawText.trim().startsWith('{') ? 'pasted-data.json' : 'pasted-data.csv';
    processFileContent(rawText, detectedName);
  };

  const handleRemoveRow = (index: number) => {
    setParsedRows(prev => prev.filter((_, i) => i !== index));
  };

  const handleDownloadCsvTemplate = () => {
    const sampleCsv = `Company Name,Contact Person,Phone,Email,District,Address,Categories,Payment Terms,Bank Name,Bank Account Number,MFS Provider,MFS Account
Rajshahi Pure Silk Weavers,Abdur Rahim,+8801711223344,procurement@rajshahisilk.bd,Rajshahi,Bholahat Silk Cluster,"Traditional Clothing, Silk Fabrics",NET_30,BRAC Bank PLC,1501209988770001,BKASH,01711223344
Dhamrai Brass Artisans Guild,Sukumar Banik,+8801822334455,sukumar@dhamraibrass.bd,Dhaka,Kashimpur Road, Dhamrai,"Handicrafts & Decor, Metal Crafts",NET_15,Sonali Bank PLC,44019922881100,NAGAD,01822334455
Chittagong Hill Loom Co.,Chingmung Marma,+8801933445566,procurement@hillloom.bd,Rangamati,Tabalchhari Bazar,"Handloom Fabric, Shawls",COD,,,BKASH,01933445566
Sylhet Cane & Bamboo Crafts,Farhan Chowdhury,+8801644556677,cane@sylhetcrafts.bd,Sylhet,Ghashitula Artisan Row,Handicrafts & Decor,ADVANCE,Islami Bank Bangladesh PLC,20501199228833,BKASH,01644556677`;

    const blob = new Blob([sampleCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'kisholoy_suppliers_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    notify(language === 'BN' ? 'CSV টেমপ্লেট ডাউনলোড হয়েছে।' : 'CSV sample template downloaded.');
  };

  const handleDownloadJsonTemplate = () => {
    const sampleJson = [
      {
        companyName: "Rajshahi Pure Silk Weavers",
        contactPerson: "Abdur Rahim",
        phone: "+8801711223344",
        email: "procurement@rajshahisilk.bd",
        district: "Rajshahi",
        address: "Bholahat Silk Cluster, Rajshahi",
        categoriesSupplied: ["Traditional Clothing", "Silk Fabrics"],
        paymentTerms: "NET_30",
        tradeLicenseNumber: "TRAD/RAJ/2023/1029",
        tinNumber: "6612-4411-9988",
        bankDetails: {
          bankName: "BRAC Bank PLC",
          accountName: "Rajshahi Pure Silk Weavers Coop",
          accountNumber: "1501209988770001",
          branchName: "Rajshahi Main Branch"
        },
        mfsDetails: {
          provider: "BKASH",
          accountType: "MERCHANT",
          accountNumber: "01711223344"
        },
        notes: "Direct silk sericulture master artisans with mulberry cocoon farming."
      },
      {
        companyName: "Dhamrai Brass Artisans Guild",
        contactPerson: "Sukumar Banik",
        phone: "+8801822334455",
        email: "sukumar@dhamraibrass.bd",
        district: "Dhaka",
        address: "Kashimpur Road, Dhamrai Artisan Quarter",
        categoriesSupplied: ["Handicrafts & Decor", "Metal Crafts"],
        paymentTerms: "NET_15",
        tradeLicenseNumber: "TRAD/DHM/2022/8812",
        bankDetails: {
          bankName: "Sonali Bank PLC",
          accountName: "Dhamrai Brass Crafts",
          accountNumber: "44019922881100",
          branchName: "Dhamrai Branch"
        },
        mfsDetails: {
          provider: "NAGAD",
          accountType: "MERCHANT",
          accountNumber: "01822334455"
        },
        notes: "Centuries-old lost-wax bell metal casting master artisans."
      }
    ];

    const blob = new Blob([JSON.stringify(sampleJson, null, 2)], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'kisholoy_suppliers_template.json');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    notify(language === 'BN' ? 'JSON টেমপ্লেট ডাউনলোড হয়েছে।' : 'JSON sample template downloaded.');
  };

  const handleCommitImport = async () => {
    const validRows = parsedRows.filter(r => !r.validationError);
    if (validRows.length === 0) {
      notify(language === 'BN' ? 'কোন বৈধ রেকর্ড পাওয়া যায়নি।' : 'No valid supplier records to import.');
      return;
    }

    setIsSubmitting(true);
    setServerErrors([]);

    try {
      const res = await fetch('/api/suppliers/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          suppliers: validRows,
          operator: 'Admin Bulk Importer'
        })
      });

      const data = await res.json();
      if (data.success) {
        setImportSummary({
          successCount: data.successCount,
          total: data.total
        });

        if (data.errors && data.errors.length > 0) {
          setServerErrors(data.errors);
          notify(
            language === 'BN'
              ? `${data.successCount}টি সরবরাহকারী সংরক্ষিত হয়েছে। ${data.errors.length}টিতে ত্রুটি/ডুপ্লিকেট ছিল।`
              : `Imported ${data.successCount} suppliers. ${data.errors.length} skipped due to duplicates or issues.`
          );
        } else {
          notify(
            language === 'BN'
              ? `সফল! ${data.successCount}টি সরবরাহকারী ডাটাবেজে যুক্ত করা হয়েছে।`
              : `Success! ${data.successCount} suppliers registered in database.`
          );
        }

        onSuccess(data.successCount);
      } else {
        notify(data.error || 'Server rejected bulk import.');
      }
    } catch (err: any) {
      console.error('Bulk import error:', err);
      notify(err.message || 'Network error during bulk import.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const validCount = parsedRows.filter(r => !r.validationError).length;
  const invalidCount = parsedRows.length - validCount;

  return (
    <div ref={containerRef} {...dialogProps} className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full border border-stone-200 shadow-xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-stone-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-800 rounded-xl">
              <UploadCloud className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <h2 className="text-base font-bold font-serif">
                {language === 'BN' ? 'বাল্ক সরবরাহকারী আপলোড (CSV / JSON)' : 'Bulk Supplier Ingestion (CSV / JSON)'}
              </h2>
              <p className="text-xs text-stone-300 mt-0.5">
                {language === 'BN'
                  ? 'দ্রুত ডাটাবেজ পপুলেশনের জন্য স্প্রেডশীট বা ফাইল ড্রপ করুন এবং তাৎক্ষণিক প্রিভিউ দেখুন।'
                  : 'Fast-track vendor database population with spreadsheet drag & drop, client validation, and server deduplication.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action / Template Download Bar */}
        <div className="bg-stone-50 border-b border-stone-200 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-600">
              {language === 'BN' ? 'রেফারেন্স টেমপ্লেট:' : 'Download Sample Templates:'}
            </span>
            <button
              onClick={handleDownloadCsvTemplate}
              className="px-2.5 py-1.5 bg-white border border-stone-300 hover:border-teal-700 hover:text-teal-800 rounded-lg flex items-center gap-1.5 text-stone-700 font-medium transition-colors shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>sample_suppliers.csv</span>
              <Download className="w-3 h-3 text-stone-400" />
            </button>
            <button
              onClick={handleDownloadJsonTemplate}
              className="px-2.5 py-1.5 bg-white border border-stone-300 hover:border-teal-700 hover:text-teal-800 rounded-lg flex items-center gap-1.5 text-stone-700 font-medium transition-colors shadow-2xs"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>sample_suppliers.json</span>
              <Download className="w-3 h-3 text-stone-400" />
            </button>
          </div>

          <div className="flex items-center gap-1 bg-stone-200/60 p-1 rounded-lg">
            <button
              onClick={() => setInputMode('upload')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                inputMode === 'upload' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {language === 'BN' ? 'ফাইল আপলোড' : 'File Upload'}
            </button>
            <button
              onClick={() => setInputMode('paste')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                inputMode === 'paste' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {language === 'BN' ? 'সরাসরি পেস্ট' : 'Direct Paste'}
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-h-[calc(85vh-200px)] overflow-y-auto">
          {/* File Upload Zone */}
          {inputMode === 'upload' ? (
            <div>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  dragActive
                    ? 'border-teal-600 bg-teal-50/60 scale-[0.99]'
                    : 'border-stone-300 hover:border-teal-700 hover:bg-stone-50/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.json,text/csv,application/json"
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-900 mx-auto flex items-center justify-center mb-3">
                  <UploadCloud className="w-6 h-6" />
                </div>

                <h3 className="text-sm font-bold text-stone-900 mb-1">
                  {language === 'BN'
                    ? 'আপনার CSV বা JSON ফাইলটি এখানে ড্র্যাগ করে ফেলুন'
                    : 'Drag & Drop your CSV or JSON file here'}
                </h3>
                <p className="text-xs text-stone-500 mb-4 max-w-md mx-auto">
                  {language === 'BN'
                    ? 'অথবা আপনার কম্পিউটার থেকে ফাইল নির্বাচন করতে ক্লিক করুন। সমর্থিত ফরম্যাট: .csv, .json'
                    : 'or click to browse from your device. Automatically parses headers and validates Bangladesh contact fields.'}
                </p>

                <div className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition-colors">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>{language === 'BN' ? 'ফাইল পছন্দ করুন' : 'Browse File'}</span>
                </div>

                {fileName && (
                  <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-mono">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Selected: {fileName}</span>
                    {fileSize && <span>({(fileSize / 1024).toFixed(1)} KB)</span>}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Direct Text Paste Area */
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-stone-700">
                  {language === 'BN' ? 'কাঁচা CSV বা JSON টেক্সট পেস্ট করুন:' : 'Paste Raw CSV or JSON Text:'}
                </label>
                <button
                  onClick={() => setRawText('')}
                  className="text-xs text-stone-400 hover:text-rose-600 flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>{language === 'BN' ? 'মুছে ফেলুন' : 'Clear'}</span>
                </button>
              </div>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                rows={6}
                placeholder={
                  language === 'BN'
                    ? `উদাহরণ CSV:\nCompany Name,Contact Person,Phone,District\nKisholoy Jamdani,Master Weavers,+8801711223344,Narayanganj`
                    : `Example CSV:\nCompany Name,Contact Person,Phone,District\nKisholoy Jamdani,Master Weavers,+8801711223344,Narayanganj\n\nOr JSON:\n[{"companyName": "Kisholoy Jamdani", "contactPerson": "Master Weavers", "phone": "+8801711223344"}]`
                }
                className="w-full text-xs font-mono p-3 bg-stone-50 border border-stone-300 rounded-xl focus:outline-teal-800 focus:bg-white"
              />
              <div className="mt-2 flex justify-end">
                <button
                  onClick={handleParseRawText}
                  className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 flex items-center gap-2 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-teal-300" />
                  <span>{language === 'BN' ? 'টেক্সট পার্স করুন' : 'Parse Pasted Text'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Parsed Staging Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-2">
                <div className="flex items-center gap-3">
                  <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider font-mono">
                    {language === 'BN' ? 'আমদানি পর্যালোচনা স্টেজ' : 'Staged Rows Preview'}
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-900 font-mono">
                    {parsedRows.length} Total Rows
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 font-mono">
                    {validCount} Ready
                  </span>
                  {invalidCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 font-mono">
                      {invalidCount} Issues
                    </span>
                  )}
                </div>

                <button
                  onClick={() => { setParsedRows([]); setFileName(null); setRawText(''); }}
                  className="text-xs text-stone-500 hover:text-rose-600 transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{language === 'BN' ? 'তালিকা রিসেট' : 'Reset List'}</span>
                </button>
              </div>

              <div className="border border-stone-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="max-h-60 overflow-y-auto">
                  <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0"><table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-stone-100 text-stone-700 font-semibold border-b border-stone-200 sticky top-0 z-10">
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">{language === 'BN' ? 'প্রতিষ্ঠান' : 'Company'}</th>
                        <th className="py-2.5 px-3">{language === 'BN' ? 'যোগাযোগ ও ফোন' : 'Contact & Phone'}</th>
                        <th className="py-2.5 px-3">{language === 'BN' ? 'জেলা' : 'District'}</th>
                        <th className="py-2.5 px-3">{language === 'BN' ? 'পেমেন্ট শর্ত' : 'Payment Terms'}</th>
                        <th className="py-2.5 px-3">{language === 'BN' ? 'ব্যাংক / MFS' : 'Bank / MFS'}</th>
                        <th className="py-2.5 px-3">{language === 'BN' ? 'স্ট্যাটাস' : 'Status'}</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200 font-mono">
                      {parsedRows.map((row, idx) => (
                        <tr
                          key={idx}
                          className={`hover:bg-stone-50 transition-colors ${
                            row.validationError ? 'bg-rose-50/40 text-rose-950' : ''
                          }`}
                        >
                          <td className="py-2 px-3 text-stone-400">{idx + 1}</td>
                          <td className="py-2 px-3 font-medium text-stone-900">
                            {row.companyName || <span className="text-rose-600 italic">Missing Name</span>}
                          </td>
                          <td className="py-2 px-3">
                            <div>{row.contactPerson}</div>
                            <div className="text-[11px] text-stone-500">{row.phone}</div>
                          </td>
                          <td className="py-2 px-3 text-stone-600">{row.district}</td>
                          <td className="py-2 px-3">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-stone-100 text-stone-800">
                              {row.paymentTerms}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-[11px] text-stone-600">
                            {row.bankDetails?.bankName ? (
                              <div>{row.bankDetails.bankName}</div>
                            ) : row.mfsDetails?.accountNumber ? (
                              <div>{row.mfsDetails.provider}: {row.mfsDetails.accountNumber}</div>
                            ) : (
                              <span className="text-stone-400">COD / Cash</span>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            {row.validationError ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                                <AlertCircle className="w-3 h-3" />
                                <span>{row.validationError}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Valid</span>
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <button
                              onClick={() => handleRemoveRow(idx)}
                              className="p-1 text-stone-400 hover:text-rose-600 rounded transition-colors"
                              title="Remove row"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table></div>
                </div>
              </div>
            </div>
          )}

          {/* Server Response Errors / Feedback */}
          {serverErrors.length > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                <span>
                  {language === 'BN'
                    ? `কিছু রেকর্ডে ডুপ্লিকেট বা ত্রুটি পাওয়া গেছে (${serverErrors.length}টি বাদ পড়েছে):`
                    : `Server flagged ${serverErrors.length} entries (skipped to prevent duplicates):`}
                </span>
              </div>
              <ul className="text-xs text-amber-800 space-y-1 max-h-32 overflow-y-auto font-mono pl-4 list-disc">
                {serverErrors.map((err, i) => (
                  <li key={i}>
                    <strong>Row {err.row} ({err.companyName}):</strong> {err.error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Import Summary */}
          {importSummary && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-900">
                <Check className="w-5 h-5 text-emerald-600" />
                <span>
                  {language === 'BN'
                    ? `মোট ${importSummary.successCount}টি সরবরাহকারী সফলভাবে ডাটাবেজে যুক্ত করা হয়েছে!`
                    : `Successfully imported ${importSummary.successCount} of ${importSummary.total} suppliers to the ledger!`}
                </span>
              </div>
              <button
                onClick={onClose}
                className="px-3 py-1.5 bg-emerald-700 text-white rounded-lg text-xs font-semibold hover:bg-emerald-800 transition-colors"
              >
                {language === 'BN' ? 'সম্পন্ন ও বন্ধ করুন' : 'Done & Close'}
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-stone-50 border-t border-stone-200 p-4 sm:px-6 flex flex-wrap gap-3 items-center justify-between">
          <div className="text-xs text-stone-500">
            {language === 'BN'
              ? 'ডুপ্লিকেট চেক: বিদ্যমান ফোন নম্বর বা কোম্পানির নামের সাথে মেলালে স্বয়ংক্রিয়ভাবে সংরক্ষিত তথ্য সুরক্ষিত থাকবে।'
              : 'Deduplication active: Existing phone numbers and company names are protected from duplicate creation.'}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-stone-700 bg-white border border-stone-300 hover:bg-stone-100 rounded-xl transition-colors"
            >
              {language === 'BN' ? 'বাতিল' : 'Cancel'}
            </button>

            <button
              onClick={handleCommitImport}
              disabled={isSubmitting || validCount === 0}
              className="px-5 py-2 text-xs font-bold text-white bg-teal-900 hover:bg-teal-950 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl flex items-center gap-2 shadow-xs transition-colors"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{language === 'BN' ? 'সংরক্ষণ হচ্ছে...' : 'Importing...'}</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4 text-teal-300" />
                  <span>
                    {language === 'BN'
                      ? `${validCount}টি সরবরাহকারী ডাটাবেজে সংরক্ষণ করুন`
                      : `Commit ${validCount} Suppliers`}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
