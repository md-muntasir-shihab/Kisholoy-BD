/**
 * @file src/components/scan/ScannerModal.tsx
 * @description Unified KISHOLOY code scanner. Uses the camera (via the ZXing
 *   browser reader) to scan a barcode / QR, or accepts a manually typed code as a
 *   fallback so admins are never forced onto a camera for ordinary work. Scanned
 *   codes resolve to the correct business record (Order / Shipment / Product) and
 *   offer one-click navigation.
 * @license Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, ScanLine, Search, Loader2, Camera, CameraOff, CheckCircle2, AlertTriangle,
  Package, Truck, ShoppingCart, ClipboardType, ExternalLink, RefreshCw,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Order, Product } from '../../types';
import { resolveScanCode, ScanResolution } from './scanResolver';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type ScanMode = 'CAMERA' | 'MANUAL';

export function ScannerModal({ isOpen, onClose }: Props) {
  const { orders, products, language } = useApp();
  const navigate = useNavigate();
  const isBn = language === 'BN';

  const [mode, setMode] = useState<ScanMode>('CAMERA');
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [result, setResult] = useState<ScanResolution | null>(null);
  const [cameraAvailable, setCameraAvailable] = useState<boolean | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const lastCodeRef = useRef<{ code: string; at: number }>({ code: '', at: 0 });
  const [zxingReady, setZxingReady] = useState(false);
  const scannerRef = useRef<any>(null);

  // Stop any running scanner on close / unmount.
  const stopScan = useCallback(() => {
    try {
      controlsRef.current?.stop?.();
    } catch {
      try {
        scannerRef.current?.stopStreams?.();
      } catch {
        /* ignore */
      }
    }
    controlsRef.current = null;
    setScanning(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      stopScan();
      setResult(null);
      setError(null);
      setManualCode('');
    }
  }, [isOpen, stopScan]);

  // Lazily load the ZXing browser reader (keeps it out of the main bundle).
  const ensureZxing = useCallback(async () => {
    if (zxingReady) return;
    try {
      const { BrowserMultiFormatReader } = await import('@zxing/browser');
      const { BarcodeFormat } = await import('@zxing/library');
      scannerRef.current = new BrowserMultiFormatReader(
        undefined,
        { delayBetweenScanAttempts: 200, delayBetweenScanSuccess: 1500 }
      );
      // Enable common formats.
      try {
        scannerRef.current.possibleFormats = [
          BarcodeFormat.QR_CODE,
          BarcodeFormat.CODE_128,
          BarcodeFormat.CODE_39,
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.UPC_A,
          BarcodeFormat.DATA_MATRIX,
          BarcodeFormat.AZTEC,
        ];
      } catch {
        /* possibleFormats setter optional */
      }
      setZxingReady(true);
    } catch (e: any) {
      setError(e?.message || 'Failed to load scanner engine');
    }
  }, [zxingReady]);

  const handleCode = useCallback(
    (code: string) => {
      const cleaned = String(code || '').trim();
      if (!cleaned) return;
      // Debounce rapid duplicate camera frames.
      const now = Date.now();
      if (lastCodeRef.current.code === cleaned && now - lastCodeRef.current.at < 1200) return;
      lastCodeRef.current = { code: cleaned, at: now };
      const res = resolveScanCode(cleaned, orders, products);
      setResult(res);
    },
    [orders, products]
  );

  const startCamera = useCallback(async () => {
    setError(null);
    setResult(null);
    setScanning(true);
    await ensureZxing();
    if (!scannerRef.current) {
      setScanning(false);
      return;
    }
    // Check camera availability + permissions first.
    if (!navigator.mediaDevices?.getUserMedia) {
      setError(isBn ? 'ক্যামেরা সাপোর্ট পাওয়া যায়নি' : 'Camera not supported in this browser.');
      setScanning(false);
      setCameraAvailable(false);
      return;
    }
    setCameraAvailable(true);
    try {
      const controls = await scannerRef.current.decodeFromConstraints(
        { video: { facingMode: 'environment' } },
        videoRef.current || undefined,
        (text: any) => {
          // ZXing calls with a Result; extract text.
          const raw = text?.getText ? text.getText() : (typeof text === 'string' ? text : '');
          handleCode(raw);
        }
      );
      controlsRef.current = controls;
      setScanning(true);
    } catch (e: any) {
      setError(e?.message || 'Unable to access camera. Check permission or use manual entry.');
      setScanning(false);
    }
  }, [ensureZxing, handleCode, isBn]);

  const stopCamera = useCallback(() => {
    stopScan();
  }, [stopScan]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleCode(manualCode);
  };

  const openOrder = () => {
    if (!result?.order) return;
    const search = result.order.orderNumber;
    navigate(`/admin/orders?search=${encodeURIComponent(search)}`);
    onClose();
  };

  const openInventory = () => {
    navigate('/admin/inventory');
    onClose();
  };

  const openShipments = () => {
    navigate('/admin/shipments');
    onClose();
  };

  const openProducts = () => {
    navigate('/admin/products');
    onClose();
  };

  if (!isOpen) return null;

  // Reset manual code box not to hold stale states across opens.

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-stone-900/80 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[94vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-teal-400" />
            <div>
              <h2 className="text-sm font-bold font-serif">{isBn ? 'কোড স্ক্যানার' : 'Code Scanner'}</h2>
              <p className="text-[11px] text-stone-400">Scan order / tracking / SKU → open the right record</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-stone-800 rounded-lg hover:bg-stone-700"><X className="w-5 h-5" /></button>
        </div>

        {/* Mode toggle */}
        <div className="px-4 pt-3 flex items-center gap-2">
          <button
            onClick={() => { setMode('CAMERA'); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 ${mode === 'CAMERA' ? 'bg-teal-900 text-white' : 'bg-stone-100 text-stone-600'}`}
          >
            <Camera className="w-3.5 h-3.5" /> {isBn ? 'ক্যামেরা' : 'Camera'}
          </button>
          <button
            onClick={() => { setMode('MANUAL'); stopCamera(); setError(null); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 ${mode === 'MANUAL' ? 'bg-teal-900 text-white' : 'bg-stone-100 text-stone-600'}`}
          >
            <ClipboardType className="w-3.5 h-3.5" /> {isBn ? 'ম্যানুয়াল' : 'Manual'}
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {mode === 'CAMERA' && (
            <div className="space-y-3">
              <div className="relative rounded-xl border border-stone-200 bg-stone-950 overflow-hidden aspect-video">
                <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
                {!scanning && !error && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-400 space-y-2">
                    {cameraAvailable === false ? (
                      <>
                        <CameraOff className="w-8 h-8" />
                        <p className="text-xs">{isBn ? 'ক্যামেরা পাওয়া যায়নি' : 'No camera detected'}</p>
                      </>
                    ) : (
                      <>
                        <Camera className="w-8 h-8" />
                        <p className="text-xs">{isBn ? 'ক্যামেরা চালু করুন' : 'Press Start to use camera'}</p>
                      </>
                    )}
                  </div>
                )}
                {scanning && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-40 w-60 border-2 border-teal-400 rounded-lg" />
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-teal-300 text-[11px] font-bold">● {isBn ? 'স্ক্যান হচ্ছে' : 'Scanning…'}</div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {scanning ? (
                  <button onClick={stopCamera} className="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5">
                    <CameraOff className="w-4 h-4" /> {isBn ? 'থামুন' : 'Stop'}
                  </button>
                ) : (
                  <button onClick={startCamera} className="px-4 py-2 bg-teal-900 text-white rounded-lg text-xs font-bold flex items-center gap-1.5">
                    {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                    {isBn ? 'ক্যামেরা চালু করুন' : 'Start Camera'}
                  </button>
                )}
                <span className="text-[11px] text-stone-500">{isBn ? 'ব্রাউজারে ক্যামেরা অনুমতি অনুরোধ করা হবে' : 'Camera permission will be requested'}</span>
              </div>
            </div>
          )}

          {mode === 'MANUAL' && (
            <form onSubmit={handleManualSubmit} className="space-y-2">
              <label className="text-xs font-bold text-stone-600">{isBn ? 'কোড লিখুন' : 'Enter code'} (KSH-… / tracking / SKU)</label>
              <div className="flex gap-2">
                <input
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder={isBn ? 'যেমন: KSH-2026-0891 অথবা SKU' : 'e.g. KSH-2026-0891 or a SKU'}
                  className="flex-1 border border-stone-300 rounded-lg px-3 py-2 text-sm"
                  autoFocus
                />
                <button type="submit" className="px-4 py-2 bg-teal-900 text-white rounded-lg text-xs font-bold flex items-center gap-1.5">
                  <Search className="w-4 h-4" /> {isBn ? 'খুঁজুন' : 'Lookup'}
                </button>
              </div>
              <p className="text-[11px] text-stone-500">{isBn ? 'ক্যামেরা ছাড়াই দ্রুত লুকআপের জন্য ব্যবহার করুন' : 'Use this for a quick lookup without the camera.'}</p>
            </form>
          )}

          {error && (
            <div className="flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{error}</span>
              <button onClick={() => setError(null)} className="font-bold hover:underline">×</button>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="border border-stone-200 rounded-xl overflow-hidden">
              <div className={`px-4 py-2 text-xs font-bold flex items-center gap-1.5 ${result.type === 'PRODUCT' ? 'bg-teal-50 text-teal-900' : result.type === 'SHIPMENT' ? 'bg-sky-50 text-sky-900' : 'bg-emerald-50 text-emerald-900'}`}>
                <CheckCircle2 className="w-4 h-4" />
                {isBn ? 'মিলেছে' : 'Matched'}: {result.label} • {result.sourceCode || result.code}
              </div>

              {/* Order / Shipment */}
              {result.order && (
                <div className="p-4 text-xs space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div><span className="text-stone-400 block text-[10px] uppercase">{isBn ? 'অর্ডার নং' : 'Order No.'}</span><b>{result.order.orderNumber}</b></div>
                    <div><span className="text-stone-400 block text-[10px] uppercase">{isBn ? 'গ্রাহক' : 'Customer'}</span><b>{result.order.customer.name}</b></div>
                    <div><span className="text-stone-400 block text-[10px] uppercase">{isBn ? 'অবস্থা' : 'Status'}</span><b>{result.order.orderStatus}</b></div>
                    <div><span className="text-stone-400 block text-[10px] uppercase">{isBn ? 'পেমেন্ট' : 'Payment'}</span><b>{result.order.paymentStatus} • {result.order.paymentMethod}</b></div>
                  </div>
                  {result.order.courier?.trackingId && (
                    <div className="flex items-center gap-1.5 text-sky-800"><Truck className="w-3.5 h-3.5" /> {isBn ? 'ট্র্যাকিং' : 'Tracking'}: <b>{result.order.courier.trackingId}</b> ({result.order.courier.status})</div>
                  )}
                  <div className="flex flex-wrap gap-2 pt-1 border-t border-stone-100">
                    {result.type === 'SHIPMENT' ? (
                      <button onClick={openShipments} className="px-3 py-1.5 bg-sky-900 text-white rounded-lg font-bold flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5" /> {isBn ? 'শিপমেন্ট খুলুন' : 'Open Shipments'}
                      </button>
                    ) : (
                      <button onClick={openOrder} className="px-3 py-1.5 bg-emerald-800 text-white rounded-lg font-bold flex items-center gap-1.5">
                        <ShoppingCart className="w-3.5 h-3.5" /> {isBn ? 'অর্ডার খুলুন' : 'Open Order'}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Product */}
              {result.product && (
                <div className="p-4 text-xs space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2"><span className="text-stone-400 block text-[10px] uppercase">{isBn ? 'পণ্য' : 'Product'}</span><b className="text-sm">{result.product.titleBn || result.product.title}</b></div>
                    <div><span className="text-stone-400 block text-[10px] uppercase">SKU</span><b>{result.product.sku}</b></div>
                    <div><span className="text-stone-400 block text-[10px] uppercase">{isBn ? 'মূল্য' : 'Price'}</span><b>৳{result.product.price.toLocaleString()}</b></div>
                    <div><span className="text-stone-400 block text-[10px] uppercase">{isBn ? 'স্টক' : 'Stock'}</span><b className={result.product.stock === 0 ? 'text-rose-700' : 'text-emerald-800'}>{result.product.stock} {isBn ? 'একক' : 'units'}</b></div>
                    <div><span className="text-stone-400 block text-[10px] uppercase">{isBn ? 'ক্যাটাগরি' : 'Category'}</span><b>{result.product.category}</b></div>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1 border-t border-stone-100">
                    <button onClick={openInventory} className="px-3 py-1.5 bg-teal-900 text-white rounded-lg font-bold flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5" /> {isBn ? 'ইনভেন্টরি খুলুন' : 'Open Inventory'}
                    </button>
                    <button onClick={openProducts} className="px-3 py-1.5 bg-stone-100 text-stone-700 rounded-lg font-bold flex items-center gap-1.5">
                      <ExternalLink className="w-3.5 h-3.5" /> {isBn ? 'প্রোডাক্ট' : 'Product'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Not found */}
          {result === null && !scanning && manualCode.trim() && (
            <div className="flex items-center gap-2 text-stone-600 bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {isBn ? 'এই কোডের সাথে কোনো রেকর্ড মেলেনি।' : 'No record matched this code.'}
            </div>
          )}

          {/* Hint */}
          <p className="text-[11px] text-stone-400 flex items-center gap-1.5">
            <RefreshCw className="w-3 h-3" />
            {isBn ? 'কোডগুলো আসল রেকর্ডে রিজল্ভ করে — কোনো এলোমেলো মিল নেই।' : 'Codes resolve to real records — no random matches.'}
          </p>
        </div>
      </div>
    </div>
  );
}
