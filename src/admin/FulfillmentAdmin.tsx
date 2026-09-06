import React, { useState, useMemo } from 'react';
import { 
  Building2, MapPin, Truck, ArrowRightLeft, ClipboardList, 
  FileText, CheckCircle2, Clock, AlertTriangle, Search, Filter, 
  Plus, Edit3, Eye, Printer, PackageCheck, ShieldCheck, Box,
  ChevronRight, ArrowUpRight, BarChart3, Layers, Check, X,
  Compass, RefreshCw, Send, UserCheck, AlertCircle, Phone, Navigation, SlidersHorizontal
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AdminModalShell } from '../components/admin/AdminModalShell';
import { 
  WarehouseHub, WarehouseStockItem, StockTransferOrder, 
  PickList, DispatchManifest, Order, Division 
} from '../types';

export const FulfillmentAdmin: React.FC = () => {
  const { 
    language, currentRole, warehouses, warehouseStocks, 
    stockTransfers, routingRules, pickLists, dispatchManifests, 
    orders, products, saveWarehouse, toggleWarehouse, updateBinLocation,
    createStockTransfer, approveStockTransfer, dispatchStockTransfer, 
    receiveStockTransfer, generatePickList, togglePickItem,
    generateDispatchManifest, handoverManifest, routeOrderSimulation,
    isFulfillmentOptional, setIsFulfillmentOptional,
    showToast 
  } = useApp();

  const isBn = language === 'BN';

  // Active Tab
  const [activeTab, setActiveTab] = useState<'hubs' | 'stock-matrix' | 'routing' | 'transfers' | 'pick-lists' | 'manifests'>('hubs');

  // Hub Modal
  const [isHubModalOpen, setIsHubModalOpen] = useState(false);
  const [editingHub, setEditingHub] = useState<Partial<WarehouseHub> | null>(null);

  // Bin Edit Modal
  const [editingBinStock, setEditingBinStock] = useState<WarehouseStockItem | null>(null);
  const [binFormData, setBinFormData] = useState({ aisle: '', shelf: '', bin: '', reorderLevel: 5, reorderQuantity: 20 });

  // STO Modal
  const [isStoModalOpen, setIsStoModalOpen] = useState(false);
  const [stoFormData, setStoFormData] = useState({
    sourceWarehouseId: '',
    destinationWarehouseId: '',
    carrier: 'Kisholoy Internal Logistics Fleet',
    notes: '',
    items: [{ productId: '', sku: '', productTitle: '', quantityRequested: 5, unitCost: 1000, notes: '' }]
  });

  // Pick List Modal
  const [isPickModalOpen, setIsPickModalOpen] = useState(false);
  const [selectedPickWarehouse, setSelectedPickWarehouse] = useState('');
  const [selectedPickOrders, setSelectedPickOrders] = useState<string[]>([]);
  const [pickerName, setPickerName] = useState('Warehouse Lead #01');
  const [viewingPickList, setViewingPickList] = useState<PickList | null>(null);

  // Manifest Modal
  const [isManifestModalOpen, setIsManifestModalOpen] = useState(false);
  const [manifestCourier, setManifestCourier] = useState<'Steadfast' | 'Pathao' | 'RedX' | 'Paperfly' | 'eCourier'>('Steadfast');
  const [manifestWarehouse, setManifestWarehouse] = useState('');
  const [manifestOrders, setManifestOrders] = useState<string[]>([]);
  const [manifestDriver, setManifestDriver] = useState({ name: 'Md. Al-Amin', phone: '01712987654', vehicleNumber: 'Dhaka Metro-Ta 11-4589' });
  const [viewingManifest, setViewingManifest] = useState<DispatchManifest | null>(null);

  // Routing Simulator
  const [simSelectedOrder, setSimSelectedOrder] = useState<string>('');
  const [simDecision, setSimDecision] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Stock Matrix Filter
  const [matrixWhFilter, setMatrixWhFilter] = useState('ALL');
  const [matrixSearch, setMatrixSearch] = useState('');

  // Total calculations
  const totalCapacity = warehouses.reduce((sum, w) => sum + w.capacityUnits, 0);
  const totalOccupied = warehouses.reduce((sum, w) => sum + w.currentUnits, 0);
  const activeHubsCount = warehouses.filter(w => w.isActive).length;
  const pendingTransfers = stockTransfers.filter(t => t.status === 'REQUESTED' || t.status === 'APPROVED').length;
  const inTransitTransfers = stockTransfers.filter(t => t.status === 'IN_TRANSIT').length;

  const filteredStockMatrix = useMemo(() => {
    return warehouseStocks.filter(s => {
      if (matrixWhFilter !== 'ALL' && s.warehouseId !== matrixWhFilter) return false;
      if (matrixSearch.trim()) {
        const q = matrixSearch.toLowerCase();
        return s.productTitle.toLowerCase().includes(q) || s.sku.toLowerCase().includes(q) || s.warehouseName.toLowerCase().includes(q);
      }
      return true;
    });
  }, [warehouseStocks, matrixWhFilter, matrixSearch]);

  const handleOpenHubModal = (hub?: WarehouseHub) => {
    if (hub) {
      setEditingHub(hub);
    } else {
      setEditingHub({
        name: '',
        nameBn: '',
        code: `HUB-0${warehouses.length + 1}`,
        type: 'REGIONAL_DEPOT',
        division: 'Dhaka',
        district: 'Dhaka',
        address: '',
        contactPerson: '',
        phone: '',
        capacityUnits: 10000,
        currentUnits: 0,
        dispatchCutoffTime: '17:00',
        isActive: true,
        courierPartners: ['Steadfast', 'Pathao'],
        coverageDivisions: ['Dhaka']
      });
    }
    setIsHubModalOpen(true);
  };

  const handleSaveHub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHub || !editingHub.name || !editingHub.district) {
      showToast('Please fill all required warehouse fields');
      return;
    }
    await saveWarehouse(editingHub as any);
    setIsHubModalOpen(false);
  };

  const handleOpenBinModal = (stock: WarehouseStockItem) => {
    setEditingBinStock(stock);
    setBinFormData({
      aisle: stock.aisle || 'Aisle-A',
      shelf: stock.shelf || 'Shelf-01',
      bin: stock.bin || 'Bin-01',
      reorderLevel: stock.reorderLevel || 5,
      reorderQuantity: stock.reorderQuantity || 20
    });
  };

  const handleSaveBin = async () => {
    if (!editingBinStock) return;
    await updateBinLocation({
      stockId: editingBinStock.id,
      ...binFormData
    });
    setEditingBinStock(null);
  };

  const handleCreateSto = async () => {
    if (!stoFormData.sourceWarehouseId || !stoFormData.destinationWarehouseId) {
      showToast('Select both source and destination warehouses');
      return;
    }
    if (stoFormData.sourceWarehouseId === stoFormData.destinationWarehouseId) {
      showToast('Source and destination cannot be the same hub');
      return;
    }
    const validItems = stoFormData.items.filter(i => i.productId && i.quantityRequested > 0);
    if (validItems.length === 0) {
      showToast('Please add at least one valid product item to transfer');
      return;
    }

    await createStockTransfer({
      sourceWarehouseId: stoFormData.sourceWarehouseId,
      destinationWarehouseId: stoFormData.destinationWarehouseId,
      items: validItems,
      carrier: stoFormData.carrier,
      notes: stoFormData.notes
    });

    setIsStoModalOpen(false);
    setStoFormData({
      sourceWarehouseId: '',
      destinationWarehouseId: '',
      carrier: 'Kisholoy Internal Logistics Fleet',
      notes: '',
      items: [{ productId: '', sku: '', productTitle: '', quantityRequested: 5, unitCost: 1000, notes: '' }]
    });
  };

  const handleRunSimulation = async () => {
    if (!simSelectedOrder) return;
    const ord = orders.find(o => o.id === simSelectedOrder);
    if (!ord) return;
    setIsSimulating(true);
    const decision = await routeOrderSimulation(ord);
    setSimDecision(decision);
    setIsSimulating(false);
  };

  const handleCreatePickList = async () => {
    if (!selectedPickWarehouse || selectedPickOrders.length === 0) {
      showToast('Select warehouse and at least 1 order for pick list');
      return;
    }
    const pl = await generatePickList({
      warehouseId: selectedPickWarehouse,
      orderIds: selectedPickOrders,
      assignedPicker: pickerName
    });
    if (pl) {
      setIsPickModalOpen(false);
      setSelectedPickOrders([]);
      setViewingPickList(pl);
    }
  };

  const handleCreateManifest = async () => {
    if (!manifestWarehouse || manifestOrders.length === 0) {
      showToast('Select warehouse and orders to generate manifest');
      return;
    }
    const mnf = await generateDispatchManifest({
      warehouseId: manifestWarehouse,
      courier: manifestCourier,
      orderIds: manifestOrders,
      driverName: manifestDriver.name,
      driverPhone: manifestDriver.phone,
      vehicleNumber: manifestDriver.vehicleNumber
    });
    if (mnf) {
      setIsManifestModalOpen(false);
      setManifestOrders([]);
      setViewingManifest(mnf);
    }
  };

  const divisionsList: Division[] = ['Dhaka', 'Chattogram', 'Rajshahi', 'Khulna', 'Barishal', 'Sylhet', 'Rangpur', 'Mymensingh'];

  return (
    <div id="fulfillment-admin-container" className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded bg-teal-50 text-teal-700 border border-teal-200">
              Phase 13: Core Operations
            </span>
            <span className="text-xs font-medium text-stone-500">
              {isBn ? 'মাল্টি-ওয়্যারহাউস ও উন্নত ফুলফিলমেন্ট ইঞ্জিন' : 'Multi-Warehouse, Hub Routing & Dispatch Matrix'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2.5">
            <Building2 className="w-7 h-7 text-teal-600" />
            {isBn ? 'ওয়্যারহাউস ও ফুলফিলমেন্ট কন্ট্রোল সেন্টার' : 'Fulfillment & Warehouse Control Center'}
          </h1>
          <p className="text-sm text-stone-600 mt-1">
            {isBn 
              ? 'হাব-ভিত্তিক রুটিন, আন্তঃডিপো স্টক ট্রান্সফার (STO), ডিজিটাল পিক লিস্ট এবং কুরিয়ার ব্যাচ ডিসপ্যাচ ম্যানেজমেন্ট।' 
              : 'Decentralized hub inventory, dynamic geospatial order routing, inter-hub stock transfers (STOs), and batch manifests.'}
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            id="btn-new-warehouse"
            onClick={() => handleOpenHubModal()}
            className="px-4 py-2 text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-sm transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {isBn ? 'নতুন ওয়্যারহাউস হাব' : 'Add Warehouse Hub'}
          </button>
          <button
            id="btn-new-transfer"
            onClick={() => {
              if (warehouses.length < 2) {
                showToast('At least 2 active warehouses are required to create a stock transfer.');
                return;
              }
              setStoFormData({
                sourceWarehouseId: warehouses[0]?.id || '',
                destinationWarehouseId: warehouses[1]?.id || '',
                carrier: 'Kisholoy Internal Logistics Fleet',
                notes: '',
                items: [{ productId: products[0]?.id || '', sku: products[0]?.sku || '', productTitle: products[0]?.title || '', quantityRequested: 5, unitCost: 1200, notes: '' }]
              });
              setIsStoModalOpen(true);
            }}
            className="px-4 py-2 text-sm font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition flex items-center gap-2 border border-stone-300"
          >
            <ArrowRightLeft className="w-4 h-4 text-stone-600" />
            {isBn ? 'নতুন স্টক ট্রান্সফার (STO)' : 'New Stock Transfer (STO)'}
          </button>
        </div>
      </div>

      {/* Optional Mode Banner & Direct Dispatch Preference */}
      <div className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
        isFulfillmentOptional 
          ? 'bg-amber-50/80 border-amber-200 text-amber-900 shadow-xs' 
          : 'bg-teal-50/80 border-teal-200 text-teal-900 shadow-xs'
      }`}>
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg mt-0.5 ${
            isFulfillmentOptional ? 'bg-amber-100 text-amber-800' : 'bg-teal-100 text-teal-800'
          }`}>
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">
                {isBn ? 'হাব ও ফুলফিলমেন্ট মোড:' : 'Hubs & Multi-Warehouse Routing Mode:'}
              </span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                isFulfillmentOptional ? 'bg-amber-200 text-amber-950' : 'bg-teal-200 text-teal-950'
              }`}>
                {isFulfillmentOptional 
                  ? (isBn ? 'ঐচ্ছিক (সরাসরি কুরিয়ার প্রেরণ অগ্রাধিকার)' : 'OPTIONAL (Direct Dispatch Preferred)')
                  : (isBn ? 'সক্রিয় (মাল্টি-হাব রাউটিং প্রযোজ্য)' : 'ACTIVE (Mandatory Hub Partitioning)')}
              </span>
            </div>
            <p className="text-xs mt-1 text-stone-600 max-w-3xl">
              {isFulfillmentOptional
                ? (isBn 
                    ? 'ফুলফিলমেন্ট হাব ব্যবস্থাপনা বর্তমানে ঐচ্ছিক করা হয়েছে। যেকোনো অর্ডার জটিল ডিপো রাউটিং বা পিকলিস্ট ছাড়াই সরাসরি "Shipments & Couriers" থেকে যেকোনো কুরিয়ারে বুকিং করে পাঠানো যাবে।' 
                    : 'Fulfillment hub partition is optional. You can directly ship orders via Shipments & Couriers without requiring complex multi-hub assignment, split shipments, or pick list processing.')
                : (isBn 
                    ? 'মাল্টি-হাব রাউটিং সক্রিয় রয়েছে। বিভাগ ও এলাকা অনুযায়ী স্বয়ংক্রিয়ভাবে ওয়্যারহাউস নির্ধারিত হবে।' 
                    : 'Enterprise multi-hub partitioning is active. Orders require hub routing and digital pick-list allocation before courier dispatch.')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsFulfillmentOptional(!isFulfillmentOptional)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-2 ${
              isFulfillmentOptional
                ? 'bg-amber-800 hover:bg-amber-900 text-white'
                : 'bg-teal-900 hover:bg-teal-950 text-white'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>
              {isFulfillmentOptional
                ? (isBn ? 'মাল্টি-হাব বাধ্যতামূলক করুন' : 'Enable Mandatory Hub Routing')
                : (isBn ? 'ঐচ্ছিক করুন (সহজ মোড)' : 'Make Hubs Optional (Direct Mode)')}
            </span>
          </button>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              {isBn ? 'সক্রিয় হাব সমূহ' : 'Active Hubs'}
            </span>
            <div className="p-2 bg-teal-50 text-teal-700 rounded-lg">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-stone-900">{activeHubsCount}</span>
            <span className="text-xs text-stone-500">/ {warehouses.length} Total</span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            {warehouses.find(w => w.isPrimary)?.name || 'Central Hub'} is Primary
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              {isBn ? 'স্টক ক্যাপাসিটি ব্যবহার' : 'Capacity Utilization'}
            </span>
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-stone-900">
              {totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0}%
            </span>
            <span className="text-xs text-stone-500">
              ({totalOccupied.toLocaleString()} / {totalCapacity.toLocaleString()} Units)
            </span>
          </div>
          <div className="w-full bg-stone-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div 
              className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
              style={{ width: `${totalCapacity > 0 ? Math.min(100, Math.round((totalOccupied / totalCapacity) * 100)) : 0}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              {isBn ? 'চলমান ট্রান্সফার (STO)' : 'Active STO Transfers'}
            </span>
            <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-stone-900">{inTransitTransfers + pendingTransfers}</span>
            <span className="text-xs text-amber-700 font-medium">({inTransitTransfers} in-transit)</span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            {pendingTransfers} pending approval/dispatch
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              {isBn ? 'কুরিয়ার ব্যাচ ম্যানিফেস্ট' : 'Batch Manifests'}
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-stone-900">{dispatchManifests.length}</span>
            <span className="text-xs text-emerald-700 font-medium">
              ({dispatchManifests.filter(m => m.status === 'HANDED_OVER').length} handed over)
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            {dispatchManifests.reduce((s, m) => s + m.ordersCount, 0)} Total orders batched
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-stone-200 gap-2 overflow-x-auto">
        <button
          id="tab-hubs"
          onClick={() => setActiveTab('hubs')}
          className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition flex items-center gap-2 ${
            activeTab === 'hubs'
              ? 'border-teal-700 text-teal-800 bg-teal-50/50'
              : 'border-transparent text-stone-600 hover:text-stone-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          {isBn ? 'ওয়্যারহাউস ও ডিপো' : 'Hubs & Depots'} ({warehouses.length})
        </button>

        <button
          id="tab-stock-matrix"
          onClick={() => setActiveTab('stock-matrix')}
          className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition flex items-center gap-2 ${
            activeTab === 'stock-matrix'
              ? 'border-teal-700 text-teal-800 bg-teal-50/50'
              : 'border-transparent text-stone-600 hover:text-stone-900'
          }`}
        >
          <Box className="w-4 h-4" />
          {isBn ? 'স্টক ও বিন ম্যাট্রিক্স' : 'Stock & Bin Matrix'} ({warehouseStocks.length})
        </button>

        <button
          id="tab-routing"
          onClick={() => setActiveTab('routing')}
          className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition flex items-center gap-2 ${
            activeTab === 'routing'
              ? 'border-teal-700 text-teal-800 bg-teal-50/50'
              : 'border-transparent text-stone-600 hover:text-stone-900'
          }`}
        >
          <Compass className="w-4 h-4" />
          {isBn ? 'স্মার্ট রুটিন ইঞ্জিন ও সিমুলেটর' : 'Routing Engine & Simulator'}
        </button>

        <button
          id="tab-transfers"
          onClick={() => setActiveTab('transfers')}
          className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition flex items-center gap-2 ${
            activeTab === 'transfers'
              ? 'border-teal-700 text-teal-800 bg-teal-50/50'
              : 'border-transparent text-stone-600 hover:text-stone-900'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          {isBn ? 'স্টক ট্রান্সফার অর্ডার (STO)' : 'Stock Transfers (STOs)'} ({stockTransfers.length})
        </button>

        <button
          id="tab-pick-lists"
          onClick={() => setActiveTab('pick-lists')}
          className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition flex items-center gap-2 ${
            activeTab === 'pick-lists'
              ? 'border-teal-700 text-teal-800 bg-teal-50/50'
              : 'border-transparent text-stone-600 hover:text-stone-900'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          {isBn ? 'ডিজিটাল পিক লিস্ট ও ওয়েভ' : 'Digital Pick Lists'} ({pickLists.length})
        </button>

        <button
          id="tab-manifests"
          onClick={() => setActiveTab('manifests')}
          className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition flex items-center gap-2 ${
            activeTab === 'manifests'
              ? 'border-teal-700 text-teal-800 bg-teal-50/50'
              : 'border-transparent text-stone-600 hover:text-stone-900'
          }`}
        >
          <Truck className="w-4 h-4" />
          {isBn ? 'কুরিয়ার ব্যাচ ম্যানিফেস্ট' : 'Courier Manifests'} ({dispatchManifests.length})
        </button>
      </div>

      {/* TAB 1: HUBS & WAREHOUSES */}
      {activeTab === 'hubs' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {warehouses.map(wh => {
              const utilPercent = wh.capacityUnits > 0 ? Math.round((wh.currentUnits / wh.capacityUnits) * 100) : 0;
              return (
                <div 
                  key={wh.id} 
                  className={`bg-white rounded-xl border p-5 transition hover:shadow-md ${
                    wh.isPrimary ? 'border-teal-500 shadow-teal-50/50' : 'border-stone-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-xs font-bold rounded bg-stone-100 text-stone-700 font-mono">
                          {wh.code}
                        </span>
                        {wh.isPrimary && (
                          <span className="px-2 py-0.5 text-xs font-bold rounded bg-teal-600 text-white flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Primary Central
                          </span>
                        )}
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                          wh.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {wh.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-stone-900 mt-2">
                        {isBn ? wh.nameBn || wh.name : wh.name}
                      </h3>
                    </div>

                    <button
                      onClick={() => handleOpenHubModal(wh)}
                      className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100"
                      title="Edit Warehouse Hub"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-4 space-y-2 text-xs text-stone-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>{wh.address}, {wh.district}, {wh.division}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>{isBn ? 'দৈনিক ডিসপ্যাচ কাটঅফ:' : 'Daily Cutoff:'} <strong>{wh.dispatchCutoffTime} BST</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>{wh.contactPerson} ({wh.phone})</span>
                    </div>
                  </div>

                  {/* Coverage Divisions */}
                  <div className="mt-4 pt-3 border-t border-stone-100">
                    <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block mb-1.5">
                      {isBn ? 'কভারেজ বিভাগসমূহ:' : 'Coverage Divisions:'}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {wh.coverageDivisions?.map(div => (
                        <span key={div} className="px-2 py-0.5 text-[11px] font-medium bg-stone-100 text-stone-700 rounded">
                          {div}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Capacity Bar */}
                  <div className="mt-4 pt-3 border-t border-stone-100">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-stone-500">{isBn ? 'ক্যাপাসিটি ব্যবহার:' : 'Capacity:'}</span>
                      <span className="font-semibold text-stone-800">
                        {wh.currentUnits.toLocaleString()} / {wh.capacityUnits.toLocaleString()} units ({utilPercent}%)
                      </span>
                    </div>
                    <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          utilPercent > 85 ? 'bg-rose-500' : utilPercent > 60 ? 'bg-amber-500' : 'bg-teal-600'
                        }`}
                        style={{ width: `${Math.min(100, utilPercent)}%` }}
                      />
                    </div>
                  </div>

                  {/* Toggle Active Button */}
                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                    <div className="flex gap-1">
                      {wh.courierPartners?.map(cp => (
                        <span key={cp} className="px-1.5 py-0.5 text-[10px] bg-teal-50 text-teal-800 rounded font-medium border border-teal-100">
                          {cp}
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={() => toggleWarehouse(wh.id, !wh.isActive)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded transition ${
                        wh.isActive 
                          ? 'text-rose-700 hover:bg-rose-50' 
                          : 'text-emerald-700 hover:bg-emerald-50'
                      }`}
                    >
                      {wh.isActive ? (isBn ? 'নিষ্ক্রিয় করুন' : 'Deactivate') : (isBn ? 'সক্রিয় করুন' : 'Activate')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: STOCK & BIN MATRIX */}
      {activeTab === 'stock-matrix' && (
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={isBn ? 'প্রোডাক্ট বা SKU সার্চ করুন...' : 'Search by product title or SKU...'}
                  value={matrixSearch}
                  onChange={e => setMatrixSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-stone-500">{isBn ? 'হাব ফিল্টার:' : 'Filter Hub:'}</span>
              <select
                value={matrixWhFilter}
                onChange={e => setMatrixWhFilter(e.target.value)}
                className="text-sm border border-stone-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 font-medium"
              >
                <option value="ALL">{isBn ? 'সকল ওয়্যারহাউস' : 'All Warehouses'}</option>
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto border border-stone-200 rounded-lg">
            <table className="w-full text-left text-sm text-stone-700">
              <thead className="bg-stone-50 text-xs font-semibold text-stone-600 uppercase tracking-wider border-b border-stone-200">
                <tr>
                  <th className="px-4 py-3">{isBn ? 'পণ্য ও SKU' : 'Product & SKU'}</th>
                  <th className="px-4 py-3">{isBn ? 'ওয়্যারহাউস' : 'Warehouse'}</th>
                  <th className="px-4 py-3">{isBn ? 'বিন লোকেশন (Aisle/Shelf/Bin)' : 'Bin Coordinates'}</th>
                  <th className="px-4 py-3 text-right">{isBn ? 'মোট স্টক' : 'On Hand'}</th>
                  <th className="px-4 py-3 text-right">{isBn ? 'রিজার্ভড' : 'Reserved'}</th>
                  <th className="px-4 py-3 text-right">{isBn ? 'উপলব্ধ' : 'Available'}</th>
                  <th className="px-4 py-3 text-center">{isBn ? 'স্ট্যাটাস' : 'Status'}</th>
                  <th className="px-4 py-3 text-right">{isBn ? 'অ্যাকশন' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {filteredStockMatrix.map(item => {
                  const isLow = item.available <= (item.reorderLevel || 3);
                  return (
                    <tr key={item.id} className="hover:bg-stone-50 transition">
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-stone-900">{item.productTitle}</div>
                        <div className="text-xs font-mono text-stone-500">{item.sku}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-stone-800">{item.warehouseName}</div>
                        <div className="text-xs text-stone-500 font-mono">{item.warehouseCode}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="px-2.5 py-1 text-xs font-mono font-bold rounded bg-stone-100 text-stone-800 border border-stone-300">
                          {item.aisle} / {item.shelf} / {item.bin}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-medium text-stone-800">
                        {item.stock}
                      </td>
                      <td className="px-4 py-3.5 text-right text-stone-500">
                        {item.reserved}
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-stone-900">
                        <span className={isLow ? 'text-rose-600' : 'text-emerald-700'}>
                          {item.available}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {isLow ? (
                          <span className="px-2 py-0.5 text-xs font-bold rounded bg-rose-50 text-rose-700 border border-rose-200">
                            Low Stock (Reorder: {item.reorderLevel})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-xs font-medium rounded bg-emerald-50 text-emerald-700">
                            Healthy
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => handleOpenBinModal(item)}
                          className="px-2.5 py-1 text-xs font-medium text-teal-800 hover:bg-teal-50 rounded border border-teal-200 transition"
                        >
                          {isBn ? 'বিন আপডেট' : 'Edit Bin'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SMART ROUTING ENGINE & SIMULATOR */}
      {activeTab === 'routing' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Rules List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5">
              <h2 className="text-base font-bold text-stone-900 flex items-center gap-2 mb-2">
                <Compass className="w-5 h-5 text-teal-600" />
                {isBn ? 'স্বয়ংক্রিয় জিওস্পেশিয়াল রুটিন রুলস' : 'Active Geospatial Routing Rules'}
              </h2>
              <p className="text-xs text-stone-600 mb-4">
                {isBn 
                  ? 'অর্ডার প্লেসমেন্টের সাথে সাথে কাস্টমারের বিভাগ ও জেলার ভিত্তিতে সবচেয়ে কাছের ডিপো নির্ধারণ করা হয়।' 
                  : 'Orders are evaluated in real-time. The engine checks inventory proximity, regional coverage, and cutoff times.'}
              </p>

              <div className="space-y-3">
                {routingRules.map(rule => (
                  <div key={rule.id} className="p-4 rounded-lg border border-stone-200 bg-stone-50/50 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-teal-100 text-teal-800 font-mono">
                          Priority #{rule.priority}
                        </span>
                        <span className="text-sm font-bold text-stone-900">{rule.name}</span>
                        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded ${rule.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'}`}>
                          {rule.enabled ? 'ENABLED' : 'DISABLED'}
                        </span>
                      </div>
                      <div className="text-xs text-stone-600 mt-1">
                        Condition: <strong>Customer Division = {rule.matchValue}</strong> &rarr; Target Hub: <strong>{rule.targetWarehouseName}</strong>
                      </div>
                      <div className="text-[11px] text-stone-500 mt-0.5">
                        Fallback: {rule.fallbackWarehouseName} (Central Primary)
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-medium text-stone-600 bg-white px-2 py-1 rounded border border-stone-200">
                        {rule.strategy}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Real-Time Order Routing Simulator */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5">
              <h2 className="text-base font-bold text-stone-900 flex items-center gap-2 mb-2">
                <Navigation className="w-5 h-5 text-indigo-600" />
                {isBn ? 'লাইভ অর্ডার রুটিন সিমুলেটর' : 'Live Order Routing Simulator'}
              </h2>
              <p className="text-xs text-stone-600 mb-4">
                {isBn 
                  ? 'যেকোনো বিদ্যমান অর্ডার নির্বাচন করে দেখুন ইঞ্জিন কীভাবে ডিপো ও ডিসপ্যাচ সময় নির্ধারণ করে।' 
                  : 'Select an existing order to simulate the real-time fulfillment routing decision.'}
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    {isBn ? 'অর্ডার নির্বাচন করুন:' : 'Select Order to Evaluate:'}
                  </label>
                  <select
                    value={simSelectedOrder}
                    onChange={e => {
                      setSimSelectedOrder(e.target.value);
                      setSimDecision(null);
                    }}
                    className="w-full text-sm border border-stone-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-teal-600"
                  >
                    <option value="">-- Choose Order --</option>
                    {orders.slice(0, 15).map(o => (
                      <option key={o.id} value={o.id}>
                        {o.orderNumber} - {o.customer.name} ({o.shippingAddress?.district}, {o.shippingAddress?.division})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  id="btn-run-routing-sim"
                  disabled={!simSelectedOrder || isSimulating}
                  onClick={handleRunSimulation}
                  className="w-full py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition flex items-center justify-center gap-2 shadow-sm"
                >
                  {isSimulating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {isBn ? 'সিমুলেশন রান করুন' : 'Run Routing Engine Simulation'}
                </button>

                {simDecision && (
                  <div className="mt-4 p-4 rounded-lg bg-teal-50/70 border border-teal-200 text-xs text-stone-800 space-y-2">
                    <div className="flex items-center justify-between border-b border-teal-200 pb-2">
                      <span className="font-bold text-teal-900">Decision Outcome</span>
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-teal-700 text-white rounded">
                        {simDecision.strategyUsed}
                      </span>
                    </div>

                    <div>
                      <span className="text-stone-500 block">Assigned Warehouse Hub:</span>
                      <span className="font-bold text-stone-900 text-sm">{simDecision.assignedWarehouseName} ({simDecision.assignedWarehouseCode})</span>
                    </div>

                    <div>
                      <span className="text-stone-500 block">Reasoning:</span>
                      <span className="text-stone-700">{simDecision.routingReason}</span>
                    </div>

                    <div>
                      <span className="text-stone-500 block">Estimated Dispatch Cutoff:</span>
                      <span className="font-medium text-stone-900">{simDecision.estimatedDispatchTime}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: STOCK TRANSFER ORDERS (STOs) */}
      {activeTab === 'transfers' && (
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-stone-900">
                {isBn ? 'আন্তঃডিপো স্টক ট্রান্সফার অর্ডার (STOs)' : 'Inter-Warehouse Stock Transfer Orders (STOs)'}
              </h2>
              <p className="text-xs text-stone-600">
                {isBn 
                  ? 'সেন্ট্রাল ওয়্যারহাউস থেকে রিজিওনাল হাবে বা ডিপোগুলোর মাঝে রি-ব্যালেন্সিং ও ইন-ট্রানজিট বুকিং।' 
                  : 'Inter-hub inventory movements, gate passes, transit carriers, and ledger reconciliations.'}
              </p>
            </div>
            <button
              onClick={() => setIsStoModalOpen(true)}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              {isBn ? 'নতুন STO ক্রিয়েট করুন' : 'New Transfer Order'}
            </button>
          </div>

          <div className="overflow-x-auto border border-stone-200 rounded-lg">
            <table className="w-full text-left text-sm text-stone-700">
              <thead className="bg-stone-50 text-xs font-semibold text-stone-600 uppercase tracking-wider border-b border-stone-200">
                <tr>
                  <th className="px-4 py-3">{isBn ? 'ট্রান্সফার #' : 'Transfer #'}</th>
                  <th className="px-4 py-3">{isBn ? 'সোর্স -> গন্তব্য' : 'Source -> Destination'}</th>
                  <th className="px-4 py-3">{isBn ? 'পণ্য ও ইউনিট' : 'Items & Units'}</th>
                  <th className="px-4 py-3 text-right">{isBn ? 'ভ্যালুয়েশন' : 'Total Valuation'}</th>
                  <th className="px-4 py-3">{isBn ? 'গেট পাস / ট্র্যাকিং' : 'Gate Pass / Tracking'}</th>
                  <th className="px-4 py-3 text-center">{isBn ? 'স্ট্যাটাস' : 'Status'}</th>
                  <th className="px-4 py-3 text-right">{isBn ? 'অ্যাকশন' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {stockTransfers.map(sto => {
                  return (
                    <tr key={sto.id} className="hover:bg-stone-50 transition">
                      <td className="px-4 py-3.5 font-mono font-bold text-stone-900">
                        {sto.transferNumber}
                        <div className="text-[11px] font-sans font-normal text-stone-500">
                          {new Date(sto.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-stone-800 flex items-center gap-1.5">
                          <span>{sto.sourceWarehouseCode}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                          <span className="text-teal-700">{sto.destinationWarehouseCode}</span>
                        </div>
                        <div className="text-xs text-stone-500">
                          {sto.sourceWarehouseName} to {sto.destinationWarehouseName}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-stone-900">{sto.totalUnitsRequested} Units</div>
                        <div className="text-xs text-stone-500">
                          {sto.items.map(i => i.productTitle).slice(0, 2).join(', ')}
                          {sto.items.length > 2 && ` +${sto.items.length - 2} more`}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-stone-900">
                        ৳{sto.totalCostValue.toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-stone-600">
                        {sto.trackingOrGatePass || '-'}
                        <div className="text-[10px] font-sans text-stone-400">{sto.carrier}</div>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`px-2.5 py-1 text-xs font-bold rounded ${
                          sto.status === 'RECEIVED' ? 'bg-emerald-100 text-emerald-800' :
                          sto.status === 'IN_TRANSIT' ? 'bg-indigo-100 text-indigo-800' :
                          sto.status === 'APPROVED' ? 'bg-teal-100 text-teal-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {sto.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                        {sto.status === 'REQUESTED' && (
                          <button
                            onClick={() => approveStockTransfer(sto.id)}
                            className="px-2.5 py-1 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded transition"
                          >
                            Approve
                          </button>
                        )}
                        {sto.status === 'APPROVED' && (
                          <button
                            onClick={() => dispatchStockTransfer({ transferId: sto.id })}
                            className="px-2.5 py-1 text-xs font-semibold text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded transition"
                          >
                            Dispatch Gate Pass
                          </button>
                        )}
                        {sto.status === 'IN_TRANSIT' && (
                          <button
                            onClick={() => receiveStockTransfer({ transferId: sto.id })}
                            className="px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition"
                          >
                            Receive & Book
                          </button>
                        )}
                        {sto.status === 'RECEIVED' && (
                          <span className="text-xs text-emerald-600 font-medium flex items-center justify-end gap-1">
                            <Check className="w-3.5 h-3.5" /> Booked
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: DIGITAL PICK LISTS */}
      {activeTab === 'pick-lists' && (
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-stone-900">
                {isBn ? 'ওয়্যারহাউস ডিজিটাল পিক লিস্ট ও ওয়েভ কালেকশন' : 'Digital Pick Lists & Wave Route Sequencing'}
              </h2>
              <p className="text-xs text-stone-600">
                {isBn 
                  ? 'অর্ডারের পণ্যসমূহকে ওয়্যারহাউসের আইল, সেলফ ও বিন অনুসারে অপ্টিমাইজড হাঁটার রুটে সাজানো হয়।' 
                  : 'Multi-order batch aggregation ordered by physical aisle, shelf, and bin coordinates.'}
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedPickWarehouse(warehouses[0]?.id || '');
                setSelectedPickOrders(orders.filter(o => o.orderStatus === 'PROCESSING' || o.orderStatus === 'PENDING').slice(0, 5).map(o => o.id));
                setIsPickModalOpen(true);
              }}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              {isBn ? 'নতুন পিক লিস্ট তৈরি করুন' : 'Generate Wave Pick List'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pickLists.map(pl => {
              const progress = pl.totalUnits > 0 ? Math.round((pl.pickedUnits / pl.totalUnits) * 100) : 0;
              return (
                <div key={pl.id} className="border border-stone-200 rounded-xl p-4 bg-stone-50/50 hover:bg-white transition space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-sm text-stone-900">{pl.pickListNumber}</span>
                      <div className="text-xs text-stone-500">{pl.warehouseName} ({pl.warehouseCode})</div>
                    </div>
                    <span className={`px-2.5 py-0.5 text-xs font-bold rounded ${
                      pl.status === 'PICKED' ? 'bg-emerald-100 text-emerald-800' :
                      pl.status === 'IN_PROGRESS' ? 'bg-indigo-100 text-indigo-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {pl.status}
                    </span>
                  </div>

                  <div className="text-xs text-stone-600 space-y-1">
                    <div>Assigned Picker: <strong>{pl.assignedPicker}</strong></div>
                    <div>Orders Included ({pl.orderNumbers.length}): <span className="font-mono text-stone-700">{pl.orderNumbers.join(', ')}</span></div>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-stone-500">Pick Progress:</span>
                      <span className="font-bold text-stone-800">{pl.pickedUnits} / {pl.totalUnits} Units ({progress}%)</span>
                    </div>
                    <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-teal-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-stone-200 flex justify-end">
                    <button
                      onClick={() => setViewingPickList(pl)}
                      className="px-3 py-1 text-xs font-semibold text-teal-800 hover:bg-teal-50 border border-teal-200 rounded-lg transition flex items-center gap-1"
                    >
                      <ClipboardList className="w-3.5 h-3.5" />
                      {isBn ? 'পিক রানার খুলুন' : 'Open Pick Runner'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 6: COURIER BATCH MANIFESTS */}
      {activeTab === 'manifests' && (
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-stone-900">
                {isBn ? 'কুরিয়ার ব্যাচ ডিসপ্যাচ ম্যানিফেস্ট' : 'Courier Dispatch & Vehicle Handover Manifests'}
              </h2>
              <p className="text-xs text-stone-600">
                {isBn 
                  ? 'Steadfast, Pathao, RedX কুরিয়ার রাইডারদের কাছে বাল্ক পার্সেল হ্যান্ডওভার ও সিগনেচার শিট।' 
                  : 'Generate printable handover manifests with COD breakdowns, weight sums, and driver signatures.'}
              </p>
            </div>
            <button
              onClick={() => {
                setManifestWarehouse(warehouses[0]?.id || '');
                setManifestOrders(orders.filter(o => o.orderStatus === 'PROCESSING' || o.orderStatus === 'PENDING').slice(0, 5).map(o => o.id));
                setIsManifestModalOpen(true);
              }}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              {isBn ? 'নতুন ম্যানিফেস্ট ক্রিয়েট' : 'Generate Courier Manifest'}
            </button>
          </div>

          <div className="overflow-x-auto border border-stone-200 rounded-lg">
            <table className="w-full text-left text-sm text-stone-700">
              <thead className="bg-stone-50 text-xs font-semibold text-stone-600 uppercase tracking-wider border-b border-stone-200">
                <tr>
                  <th className="px-4 py-3">{isBn ? 'ম্যানিফেস্ট #' : 'Manifest #'}</th>
                  <th className="px-4 py-3">{isBn ? 'কুরিয়ার ও হাব' : 'Courier & Hub'}</th>
                  <th className="px-4 py-3 text-center">{isBn ? 'পার্সেল সংখ্যা' : 'Parcels'}</th>
                  <th className="px-4 py-3 text-right">{isBn ? 'মোট COD পরিমাণ' : 'Total COD'}</th>
                  <th className="px-4 py-3">{isBn ? 'ড্রাইভার / রাইডার' : 'Driver / Rider'}</th>
                  <th className="px-4 py-3 text-center">{isBn ? 'স্ট্যাটাস' : 'Status'}</th>
                  <th className="px-4 py-3 text-right">{isBn ? 'অ্যাকশন' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {dispatchManifests.map(mnf => (
                  <tr key={mnf.id} className="hover:bg-stone-50 transition">
                    <td className="px-4 py-3.5 font-mono font-bold text-stone-900">
                      {mnf.manifestNumber}
                      <div className="text-[11px] font-sans font-normal text-stone-500">
                        {new Date(mnf.createdAt).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-semibold text-stone-900">{mnf.courier}</span>
                      <div className="text-xs text-stone-500">{mnf.warehouseName}</div>
                    </td>
                    <td className="px-4 py-3.5 text-center font-bold text-stone-800">
                      {mnf.ordersCount}
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-teal-800">
                      ৳{mnf.totalCodAmount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-stone-700">
                      <div>{mnf.driverName || 'Rider Assigned'}</div>
                      <div className="text-stone-400">{mnf.driverPhone} | {mnf.vehicleNumber}</div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded ${
                        mnf.status === 'HANDED_OVER' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {mnf.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => setViewingManifest(mnf)}
                        className="px-2.5 py-1 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded border border-stone-300 transition inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View / Print
                      </button>
                      {mnf.status === 'CREATED' && (
                        <button
                          onClick={() => handoverManifest(mnf.id)}
                          className="px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition"
                        >
                          Handover
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: ADD / EDIT WAREHOUSE HUB */}
      {/* ======================================================== */}
      <AdminModalShell
        open={!!(isHubModalOpen && editingHub)}
        onClose={() => setIsHubModalOpen(false)}
        label=""
        // Contains a form: a stray backdrop click must not discard entered data.
        closeOnBackdrop={false}
        overlayClassName="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      >
        {editingHub && (
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-stone-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-teal-600" />
                {editingHub.id ? (isBn ? 'ওয়্যারহাউস এডিট করুন' : 'Edit Warehouse Hub') : (isBn ? 'নতুন ওয়্যারহাউস যোগ করুন' : 'Add Warehouse Hub')}
              </h3>
              <button onClick={() => setIsHubModalOpen(false)} className="p-1 text-stone-400 hover:text-stone-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHub} className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Hub Name (EN)*</label>
                  <input
                    type="text"
                    required
                    value={editingHub.name || ''}
                    onChange={e => setEditingHub({ ...editingHub, name: e.target.value })}
                    className="w-full border border-stone-300 rounded-lg p-2 focus:ring-2 focus:ring-teal-600"
                    placeholder="e.g. Chattogram Agrabad Regional Depot"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Hub Name (BN)</label>
                  <input
                    type="text"
                    value={editingHub.nameBn || ''}
                    onChange={e => setEditingHub({ ...editingHub, nameBn: e.target.value })}
                    className="w-full border border-stone-300 rounded-lg p-2 focus:ring-2 focus:ring-teal-600"
                    placeholder="যেমন: চট্টগ্রাম আগ্রাবাদ আঞ্চলিক ডিপো"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Hub Code*</label>
                  <input
                    type="text"
                    required
                    value={editingHub.code || ''}
                    onChange={e => setEditingHub({ ...editingHub, code: e.target.value })}
                    className="w-full border border-stone-300 rounded-lg p-2 font-mono"
                    placeholder="e.g. CTG-01"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Division*</label>
                  <select
                    value={editingHub.division || 'Dhaka'}
                    onChange={e => setEditingHub({ ...editingHub, division: e.target.value as any })}
                    className="w-full border border-stone-300 rounded-lg p-2 bg-white"
                  >
                    {divisionsList.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">District*</label>
                  <input
                    type="text"
                    required
                    value={editingHub.district || ''}
                    onChange={e => setEditingHub({ ...editingHub, district: e.target.value })}
                    className="w-full border border-stone-300 rounded-lg p-2"
                    placeholder="e.g. Chattogram"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Full Physical Address</label>
                <input
                  type="text"
                  value={editingHub.address || ''}
                  onChange={e => setEditingHub({ ...editingHub, address: e.target.value })}
                  className="w-full border border-stone-300 rounded-lg p-2"
                  placeholder="e.g. Plot 14, Commercial Area, Agrabad, Chattogram"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={editingHub.contactPerson || ''}
                    onChange={e => setEditingHub({ ...editingHub, contactPerson: e.target.value })}
                    className="w-full border border-stone-300 rounded-lg p-2"
                    placeholder="Hub In-Charge"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={editingHub.phone || ''}
                    onChange={e => setEditingHub({ ...editingHub, phone: e.target.value })}
                    className="w-full border border-stone-300 rounded-lg p-2"
                    placeholder="+8801700000000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Dispatch Cutoff (BST)</label>
                  <input
                    type="text"
                    value={editingHub.dispatchCutoffTime || '17:00'}
                    onChange={e => setEditingHub({ ...editingHub, dispatchCutoffTime: e.target.value })}
                    className="w-full border border-stone-300 rounded-lg p-2"
                    placeholder="17:00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Storage Capacity (Units)</label>
                  <input
                    type="number"
                    value={editingHub.capacityUnits || 10000}
                    onChange={e => setEditingHub({ ...editingHub, capacityUnits: Number(e.target.value) })}
                    className="w-full border border-stone-300 rounded-lg p-2"
                  />
                </div>
                <div className="flex items-center gap-4 pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-800">
                    <input
                      type="checkbox"
                      checked={Boolean(editingHub.isPrimary)}
                      onChange={e => setEditingHub({ ...editingHub, isPrimary: e.target.checked })}
                      className="rounded border-stone-300 text-teal-600 focus:ring-teal-500 w-4 h-4"
                    />
                    Primary Central Hub
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-800">
                    <input
                      type="checkbox"
                      checked={editingHub.isActive !== false}
                      onChange={e => setEditingHub({ ...editingHub, isActive: e.target.checked })}
                      className="rounded border-stone-300 text-teal-600 focus:ring-teal-500 w-4 h-4"
                    />
                    Active Hub
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsHubModalOpen(false)}
                  className="px-4 py-2 text-sm text-stone-600 hover:bg-stone-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition shadow-sm"
                >
                  Save Warehouse
                </button>
              </div>
            </form>
          </div>
        )}
      </AdminModalShell>

      {/* ======================================================== */}
      {/* MODAL 2: EDIT BIN LOCATION COORDINATES */}
      {/* ======================================================== */}
      <AdminModalShell
        open={!!editingBinStock}
        onClose={() => setEditingBinStock(null)}
        label=""
        // Contains a form: a stray backdrop click must not discard entered data.
        closeOnBackdrop={false}
        overlayClassName="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      >
        {editingBinStock && (
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-stone-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Box className="w-5 h-5 text-teal-600" />
                {isBn ? 'বিন লোকেশন ও রিঅর্ডার সেটআপ' : 'Update Bin Location & Reorder'}
              </h3>
              <button onClick={() => setEditingBinStock(null)} className="p-1 text-stone-400 hover:text-stone-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-stone-600 bg-stone-50 p-3 rounded-lg">
              <div className="font-semibold text-stone-900">{editingBinStock.productTitle}</div>
              <div>SKU: <span className="font-mono">{editingBinStock.sku}</span> | Hub: <strong>{editingBinStock.warehouseName}</strong></div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Aisle</label>
                  <input
                    type="text"
                    value={binFormData.aisle}
                    onChange={e => setBinFormData({ ...binFormData, aisle: e.target.value })}
                    className="w-full border border-stone-300 rounded-lg p-2 text-center font-mono font-bold"
                    placeholder="Aisle-A"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Shelf</label>
                  <input
                    type="text"
                    value={binFormData.shelf}
                    onChange={e => setBinFormData({ ...binFormData, shelf: e.target.value })}
                    className="w-full border border-stone-300 rounded-lg p-2 text-center font-mono font-bold"
                    placeholder="Shelf-01"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Bin</label>
                  <input
                    type="text"
                    value={binFormData.bin}
                    onChange={e => setBinFormData({ ...binFormData, bin: e.target.value })}
                    className="w-full border border-stone-300 rounded-lg p-2 text-center font-mono font-bold"
                    placeholder="Bin-01"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Reorder Alert Level</label>
                  <input
                    type="number"
                    value={binFormData.reorderLevel}
                    onChange={e => setBinFormData({ ...binFormData, reorderLevel: Number(e.target.value) })}
                    className="w-full border border-stone-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Reorder Quantity</label>
                  <input
                    type="number"
                    value={binFormData.reorderQuantity}
                    onChange={e => setBinFormData({ ...binFormData, reorderQuantity: Number(e.target.value) })}
                    className="w-full border border-stone-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setEditingBinStock(null)}
                  className="px-3.5 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveBin}
                  className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition shadow-sm"
                >
                  Save Bin Coordinates
                </button>
              </div>
            </div>
          </div>
        )}
      </AdminModalShell>

      {/* ======================================================== */}
      {/* MODAL 3: CREATE STOCK TRANSFER ORDER (STO) */}
      {/* ======================================================== */}
      <AdminModalShell
        open={!!isStoModalOpen}
        onClose={() => setIsStoModalOpen(false)}
        label=""
        // Contains a form: a stray backdrop click must not discard entered data.
        closeOnBackdrop={false}
        overlayClassName="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      >
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-stone-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-teal-600" />
                {isBn ? 'নতুন ইন্টার-ডিপো স্টক ট্রান্সফার (STO)' : 'Create Stock Transfer Order (STO)'}
              </h3>
              <button onClick={() => setIsStoModalOpen(false)} className="p-1 text-stone-400 hover:text-stone-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Source Hub (Dispatching From)*</label>
                  <select
                    value={stoFormData.sourceWarehouseId}
                    onChange={e => setStoFormData({ ...stoFormData, sourceWarehouseId: e.target.value })}
                    className="w-full border border-stone-300 rounded-lg p-2.5 bg-white font-medium"
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Destination Hub (Receiving At)*</label>
                  <select
                    value={stoFormData.destinationWarehouseId}
                    onChange={e => setStoFormData({ ...stoFormData, destinationWarehouseId: e.target.value })}
                    className="w-full border border-stone-300 rounded-lg p-2.5 bg-white font-medium"
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Internal Logistics Carrier</label>
                <input
                  type="text"
                  value={stoFormData.carrier}
                  onChange={e => setStoFormData({ ...stoFormData, carrier: e.target.value })}
                  className="w-full border border-stone-300 rounded-lg p-2"
                  placeholder="e.g. Kisholoy Fleet Dedicated Truck #12"
                />
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-stone-700">Transfer Items List</label>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-stone-200 rounded-lg p-3 bg-stone-50">
                  {stoFormData.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <select
                        value={item.productId}
                        onChange={e => {
                          const prod = products.find(p => p.id === e.target.value);
                          const updated = [...stoFormData.items];
                          updated[idx] = {
                            ...updated[idx],
                            productId: e.target.value,
                            sku: prod?.sku || '',
                            productTitle: prod?.title || '',
                            unitCost: prod?.price ? prod.price * 0.7 : 1000
                          };
                          setStoFormData({ ...stoFormData, items: updated });
                        }}
                        className="flex-1 text-xs border border-stone-300 rounded p-1.5 bg-white font-medium"
                      >
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.title} ({p.sku})</option>
                        ))}
                      </select>

                      <input
                        type="number"
                        min="1"
                        value={item.quantityRequested}
                        onChange={e => {
                          const updated = [...stoFormData.items];
                          updated[idx].quantityRequested = Math.max(1, Number(e.target.value));
                          setStoFormData({ ...stoFormData, items: updated });
                        }}
                        className="w-20 text-xs border border-stone-300 rounded p-1.5 text-center font-bold"
                        placeholder="Qty"
                      />

                      {stoFormData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setStoFormData({
                              ...stoFormData,
                              items: stoFormData.items.filter((_, i) => i !== idx)
                            });
                          }}
                          className="text-rose-600 hover:text-rose-800 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => {
                      setStoFormData({
                        ...stoFormData,
                        items: [
                          ...stoFormData.items,
                          { productId: products[0]?.id || '', sku: products[0]?.sku || '', productTitle: products[0]?.title || '', quantityRequested: 5, unitCost: 1000, notes: '' }
                        ]
                      });
                    }}
                    className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1 mt-2"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Another Item
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Transfer Notes / Reason</label>
                <input
                  type="text"
                  value={stoFormData.notes}
                  onChange={e => setStoFormData({ ...stoFormData, notes: e.target.value })}
                  className="w-full border border-stone-300 rounded-lg p-2"
                  placeholder="e.g. Seasonal festive stock replenishment for Chattogram region."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsStoModalOpen(false)}
                  className="px-4 py-2 text-sm text-stone-600 hover:bg-stone-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateSto}
                  className="px-5 py-2 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition shadow-sm"
                >
                  Issue Stock Transfer Order
                </button>
              </div>
            </div>
          </div>
      </AdminModalShell>

      {/* ======================================================== */}
      {/* MODAL 4: GENERATE DIGITAL PICK LIST */}
      {/* ======================================================== */}
      <AdminModalShell
        open={!!isPickModalOpen}
        onClose={() => setIsPickModalOpen(false)}
        label=""
        // Contains a form: a stray backdrop click must not discard entered data.
        closeOnBackdrop={false}
        overlayClassName="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      >
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full border border-stone-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-teal-600" />
                {isBn ? 'ওয়েভ পিক লিস্ট তৈরি করুন' : 'Generate Wave Pick List'}
              </h3>
              <button onClick={() => setIsPickModalOpen(false)} className="p-1 text-stone-400 hover:text-stone-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Select Warehouse Hub*</label>
                <select
                  value={selectedPickWarehouse}
                  onChange={e => setSelectedPickWarehouse(e.target.value)}
                  className="w-full border border-stone-300 rounded-lg p-2.5 bg-white font-medium"
                >
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Assigned Picker Name</label>
                <input
                  type="text"
                  value={pickerName}
                  onChange={e => setPickerName(e.target.value)}
                  className="w-full border border-stone-300 rounded-lg p-2"
                  placeholder="e.g. Warehouse Picker #02"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Select Orders to Include ({selectedPickOrders.length} Selected):
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-stone-200 rounded-lg p-3 bg-stone-50">
                  {orders.slice(0, 10).map(ord => (
                    <label key={ord.id} className="flex items-center gap-2 text-xs text-stone-800 cursor-pointer hover:bg-white p-1.5 rounded">
                      <input
                        type="checkbox"
                        checked={selectedPickOrders.includes(ord.id)}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedPickOrders([...selectedPickOrders, ord.id]);
                          } else {
                            setSelectedPickOrders(selectedPickOrders.filter(id => id !== ord.id));
                          }
                        }}
                        className="rounded border-stone-300 text-teal-600 focus:ring-teal-500 w-4 h-4"
                      />
                      <span className="font-mono font-bold">{ord.orderNumber}</span>
                      <span>- {ord.customer.name} ({ord.items?.length || 0} items, ৳{ord.total.toLocaleString()})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsPickModalOpen(false)}
                  className="px-4 py-2 text-sm text-stone-600 hover:bg-stone-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreatePickList}
                  className="px-5 py-2 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition shadow-sm"
                >
                  Generate Optimized Pick Route
                </button>
              </div>
            </div>
          </div>
      </AdminModalShell>

      {/* ======================================================== */}
      {/* MODAL 5: INTERACTIVE PICK RUNNER VIEW */}
      {/* ======================================================== */}
      <AdminModalShell
        open={!!viewingPickList}
        onClose={() => setViewingPickList(null)}
        label=""
        overlayClassName="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      >
        {viewingPickList && (
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-stone-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  {viewingPickList.pickListNumber}
                </span>
                <h3 className="text-lg font-bold text-stone-900 mt-1">
                  Digital Pick Runner - {viewingPickList.warehouseName}
                </h3>
              </div>
              <button onClick={() => setViewingPickList(null)} className="p-1 text-stone-400 hover:text-stone-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex justify-between items-center bg-stone-50 p-3 rounded-lg text-xs text-stone-700">
              <div>Assigned: <strong>{viewingPickList.assignedPicker}</strong></div>
              <div>Progress: <strong>{viewingPickList.pickedUnits} / {viewingPickList.totalUnits} Units Picked</strong></div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold text-stone-700 uppercase tracking-wider">
                Sequenced Warehouse Route (Aisle &rarr; Shelf &rarr; Bin):
              </div>

              <div className="divide-y divide-stone-200 border border-stone-200 rounded-lg">
                {viewingPickList.items.map((item, idx) => (
                  <div 
                    key={idx} 
                    className={`p-3.5 flex items-center justify-between transition ${
                      item.picked ? 'bg-emerald-50/60' : 'bg-white hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={item.picked}
                        onChange={e => togglePickItem(viewingPickList.id, item.sku, e.target.checked)}
                        className="rounded border-stone-300 text-teal-600 focus:ring-teal-500 w-5 h-5 cursor-pointer"
                      />
                      <div>
                        <div className={`font-semibold text-sm ${item.picked ? 'line-through text-stone-500' : 'text-stone-900'}`}>
                          {item.productTitle}
                        </div>
                        <div className="text-xs text-stone-500 font-mono">
                          SKU: {item.sku} | Orders: {item.orderNumbers.join(', ')}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="px-2.5 py-1 text-xs font-mono font-bold rounded bg-stone-100 text-stone-800 border border-stone-300 block mb-1">
                        {item.aisle} / {item.shelf} / {item.bin}
                      </span>
                      <span className="text-xs font-bold text-teal-800">
                        Qty: {item.quantity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setViewingPickList(null)}
                className="px-5 py-2 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition"
              >
                Close Pick Runner
              </button>
            </div>
          </div>
        )}
      </AdminModalShell>

      {/* ======================================================== */}
      {/* MODAL 6: CREATE COURIER BATCH MANIFEST */}
      {/* ======================================================== */}
      <AdminModalShell
        open={!!isManifestModalOpen}
        onClose={() => setIsManifestModalOpen(false)}
        label=""
        // Contains a form: a stray backdrop click must not discard entered data.
        closeOnBackdrop={false}
        overlayClassName="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      >
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full border border-stone-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-teal-600" />
                {isBn ? 'কুরিয়ার ডিসপ্যাচ ম্যানিফেস্ট তৈরি' : 'Generate Courier Dispatch Manifest'}
              </h3>
              <button onClick={() => setIsManifestModalOpen(false)} className="p-1 text-stone-400 hover:text-stone-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Courier Partner*</label>
                  <select
                    value={manifestCourier}
                    onChange={e => setManifestCourier(e.target.value as any)}
                    className="w-full border border-stone-300 rounded-lg p-2.5 bg-white font-medium"
                  >
                    <option value="Steadfast">Steadfast Courier</option>
                    <option value="Pathao">Pathao Express</option>
                    <option value="RedX">RedX Logistics</option>
                    <option value="Paperfly">Paperfly</option>
                    <option value="eCourier">eCourier</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Dispatching Warehouse*</label>
                  <select
                    value={manifestWarehouse}
                    onChange={e => setManifestWarehouse(e.target.value)}
                    className="w-full border border-stone-300 rounded-lg p-2.5 bg-white font-medium"
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Driver/Rider Name</label>
                  <input
                    type="text"
                    value={manifestDriver.name}
                    onChange={e => setManifestDriver({ ...manifestDriver, name: e.target.value })}
                    className="w-full border border-stone-300 rounded-lg p-2 text-xs"
                    placeholder="Md. Al-Amin"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Driver Phone</label>
                  <input
                    type="text"
                    value={manifestDriver.phone}
                    onChange={e => setManifestDriver({ ...manifestDriver, phone: e.target.value })}
                    className="w-full border border-stone-300 rounded-lg p-2 text-xs"
                    placeholder="01712000000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Vehicle Plate #</label>
                  <input
                    type="text"
                    value={manifestDriver.vehicleNumber}
                    onChange={e => setManifestDriver({ ...manifestDriver, vehicleNumber: e.target.value })}
                    className="w-full border border-stone-300 rounded-lg p-2 text-xs font-mono"
                    placeholder="Dhaka Metro-Ta 11"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Select Packed Parcels ({manifestOrders.length} Selected):
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-stone-200 rounded-lg p-3 bg-stone-50">
                  {orders.slice(0, 10).map(ord => (
                    <label key={ord.id} className="flex items-center gap-2 text-xs text-stone-800 cursor-pointer hover:bg-white p-1.5 rounded">
                      <input
                        type="checkbox"
                        checked={manifestOrders.includes(ord.id)}
                        onChange={e => {
                          if (e.target.checked) {
                            setManifestOrders([...manifestOrders, ord.id]);
                          } else {
                            setManifestOrders(manifestOrders.filter(id => id !== ord.id));
                          }
                        }}
                        className="rounded border-stone-300 text-teal-600 focus:ring-teal-500 w-4 h-4"
                      />
                      <span className="font-mono font-bold">{ord.orderNumber}</span>
                      <span>- {ord.customer.name} ({ord.shippingAddress?.district}) - COD: ৳{ord.paymentMethod === 'COD' ? ord.total.toLocaleString() : '0 (Paid)'}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsManifestModalOpen(false)}
                  className="px-4 py-2 text-sm text-stone-600 hover:bg-stone-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateManifest}
                  className="px-5 py-2 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition shadow-sm"
                >
                  Generate Batch Manifest
                </button>
              </div>
            </div>
          </div>
      </AdminModalShell>

      {/* ======================================================== */}
      {/* MODAL 7: VIEW / PRINT COURIER MANIFEST */}
      {/* ======================================================== */}
      <AdminModalShell
        open={!!viewingManifest}
        onClose={() => setViewingManifest(null)}
        label=""
        overlayClassName="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      >
        {viewingManifest && (
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-stone-200 p-8 space-y-6">
            <div className="flex items-start justify-between border-b border-stone-300 pb-4">
              <div>
                <div className="text-xl font-black text-stone-900 tracking-tight">
                  KISHOLOY LOGISTICS DISPATCH MANIFEST
                </div>
                <div className="text-xs text-stone-600 mt-1">
                  Courier: <strong>{viewingManifest.courier}</strong> | Hub: <strong>{viewingManifest.warehouseName}</strong>
                </div>
              </div>

              <div className="text-right">
                <div className="font-mono font-bold text-sm text-stone-900">{viewingManifest.manifestNumber}</div>
                <div className="text-xs text-stone-500">{new Date(viewingManifest.createdAt).toLocaleString()}</div>
              </div>
            </div>

            {/* Driver Block */}
            <div className="grid grid-cols-3 gap-4 bg-stone-50 p-4 rounded-lg text-xs text-stone-700 border border-stone-200">
              <div>Driver: <strong>{viewingManifest.driverName || 'Rider Assigned'}</strong></div>
              <div>Phone: <strong>{viewingManifest.driverPhone || 'N/A'}</strong></div>
              <div>Vehicle: <strong className="font-mono">{viewingManifest.vehicleNumber || 'Fleet Van'}</strong></div>
            </div>

            {/* Orders Table */}
            <div className="overflow-x-auto border border-stone-200 rounded-lg">
              <table className="w-full text-left text-xs text-stone-700">
                <thead className="bg-stone-100 font-bold text-stone-800 border-b border-stone-200 uppercase">
                  <tr>
                    <th className="px-3 py-2.5">SL</th>
                    <th className="px-3 py-2.5">Order Number</th>
                    <th className="px-3 py-2.5">Tracking ID</th>
                    <th className="px-3 py-2.5">Customer & Phone</th>
                    <th className="px-3 py-2.5">District</th>
                    <th className="px-3 py-2.5 text-right">COD Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {viewingManifest.orders.map((ord, idx) => (
                    <tr key={ord.orderId}>
                      <td className="px-3 py-2 font-bold">{idx + 1}</td>
                      <td className="px-3 py-2 font-mono font-bold text-stone-900">{ord.orderNumber}</td>
                      <td className="px-3 py-2 font-mono text-teal-800">{ord.trackingId}</td>
                      <td className="px-3 py-2">
                        <div className="font-medium text-stone-900">{ord.customerName}</div>
                        <div className="text-stone-500">{ord.customerPhone}</div>
                      </td>
                      <td className="px-3 py-2">{ord.district}</td>
                      <td className="px-3 py-2 text-right font-bold text-stone-900">
                        ৳{ord.codAmount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-stone-50 font-bold border-t border-stone-200">
                  <tr>
                    <td colSpan={2} className="px-3 py-2.5">Total Parcels: {viewingManifest.ordersCount}</td>
                    <td colSpan={3} className="px-3 py-2.5 text-right">Total COD Collectible:</td>
                    <td className="px-3 py-2.5 text-right text-teal-900 text-sm">৳{viewingManifest.totalCodAmount.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Handover Signatures */}
            <div className="grid grid-cols-2 gap-12 pt-8 text-xs text-stone-600">
              <div className="border-t border-stone-400 pt-2 text-center">
                <strong>Warehouse Dispatch Lead Signature</strong>
                <div className="text-[11px] text-stone-400 mt-1">{viewingManifest.operator}</div>
              </div>
              <div className="border-t border-stone-400 pt-2 text-center">
                <strong>Courier Rider / Driver Signature</strong>
                <div className="text-[11px] text-stone-400 mt-1">{viewingManifest.driverName || 'Authorized Courier Representative'}</div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-stone-200">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-lg transition flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Print Manifest
              </button>
              <button
                onClick={() => setViewingManifest(null)}
                className="px-5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </AdminModalShell>
    </div>
  );
};
