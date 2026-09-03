/**
 * @file src/components/admin/SupplierFinancialTrendChart.tsx
 * @description Recharts-based 12-Month Financial Performance Trend Chart
 * Visualizes the month-by-month fluctuation of 'Total Purchased' versus 'Amount Paid'
 * for suppliers with interactive analytical views, settlement efficiency, and bilingual support.
 * @license Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  BarChart, 
  AreaChart, 
  Bar, 
  Area, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  BarChart3, 
  LineChart as LineChartIcon,
  Percent, 
  FileText,
  Clock
} from 'lucide-react';
import { 
  SupplierPurchaseOrder, 
  SupplierPayment, 
  SupplierMonthlyFinancialTrend 
} from '../../types';

interface SupplierFinancialTrendChartProps {
  trends?: SupplierMonthlyFinancialTrend[];
  purchaseOrders: SupplierPurchaseOrder[];
  payments: SupplierPayment[];
  supplierName: string;
  supplierCode: string;
  compact?: boolean;
}

export const SupplierFinancialTrendChart: React.FC<SupplierFinancialTrendChartProps> = ({
  trends: providedTrends,
  purchaseOrders,
  payments,
  supplierName,
  supplierCode,
  compact = false
}) => {
  const [chartMode, setChartMode] = useState<'composed' | 'bars' | 'cumulative'>('composed');
  const [timeRange, setTimeRange] = useState<'12M' | '6M' | '3M'>('12M');
  const [showTable, setShowTable] = useState(false);

  const formatBdt = (val: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0
    }).format(val).replace('BDT', '৳');
  };

  const formatShortBdt = (val: number) => {
    if (val >= 100000) {
      return `৳${(val / 100000).toFixed(1)}L`;
    }
    if (val >= 1000) {
      return `৳${(val / 1000).toFixed(0)}k`;
    }
    return `৳${val}`;
  };

  // Compute 12-month rolling window dataset dynamically
  const monthlyData = useMemo(() => {
    if (providedTrends && providedTrends.length > 0) {
      return providedTrends;
    }

    // Default reference date (current calendar time: September 2026)
    const refDate = new Date('2026-09-03T00:00:00.000Z');
    const monthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthNamesBn = ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'];

    const result: SupplierMonthlyFinancialTrend[] = [];
    const windowStart = new Date(refDate.getFullYear(), refDate.getMonth() - 11, 1);

    // Initial cumulative due balance prior to 12-month window
    let runningDue = 0;
    for (const po of purchaseOrders) {
      const d = new Date(po.orderDate);
      if (d < windowStart) runningDue += po.totalAmount;
    }
    for (const pmt of payments) {
      const d = new Date(pmt.paymentDate);
      if (d < windowStart) runningDue -= pmt.amount;
    }

    for (let i = 11; i >= 0; i--) {
      const d = new Date(refDate.getFullYear(), refDate.getMonth() - i, 1);
      const year = d.getFullYear();
      const monthIdx = d.getMonth();
      const monthKey = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;
      const shortYear = String(year).slice(-2);
      const monthLabel = `${monthNamesEn[monthIdx]} '${shortYear}`;
      const monthLabelBn = `${monthNamesBn[monthIdx]} '${shortYear}`;

      const monthPos = purchaseOrders.filter(p => {
        const pd = new Date(p.orderDate);
        return pd.getFullYear() === year && pd.getMonth() === monthIdx;
      });

      const monthPmts = payments.filter(p => {
        const pd = new Date(p.paymentDate);
        return pd.getFullYear() === year && pd.getMonth() === monthIdx;
      });

      const purchased = monthPos.reduce((sum, p) => sum + p.totalAmount, 0);
      const paid = monthPmts.reduce((sum, p) => sum + p.amount, 0);
      const netBalance = purchased - paid;
      runningDue += netBalance;

      result.push({
        monthKey,
        monthLabel,
        monthLabelBn,
        purchased,
        paid,
        netBalance,
        cumulativeDue: Math.max(0, runningDue),
        poCount: monthPos.length,
        paymentCount: monthPmts.length
      });
    }

    return result;
  }, [providedTrends, purchaseOrders, payments]);

  // Filtered dataset according to timeRange
  const displayedData = useMemo(() => {
    if (timeRange === '3M') return monthlyData.slice(-3);
    if (timeRange === '6M') return monthlyData.slice(-6);
    return monthlyData;
  }, [monthlyData, timeRange]);

  // Aggregate Metrics over displayed window
  const summary = useMemo(() => {
    const totalPurchased = displayedData.reduce((sum, d) => sum + d.purchased, 0);
    const totalPaid = displayedData.reduce((sum, d) => sum + d.paid, 0);
    const netDifference = totalPurchased - totalPaid;
    const ratio = totalPurchased > 0 ? Math.round((totalPaid / totalPurchased) * 100) : 100;
    const avgMonthlyPurchased = Math.round(totalPurchased / (displayedData.length || 1));
    const avgMonthlyPaid = Math.round(totalPaid / (displayedData.length || 1));

    let peakMonth = displayedData[0] || null;
    for (const item of displayedData) {
      if (!peakMonth || item.purchased > peakMonth.purchased) {
        peakMonth = item;
      }
    }

    return {
      totalPurchased,
      totalPaid,
      netDifference,
      ratio,
      avgMonthlyPurchased,
      avgMonthlyPaid,
      peakMonth
    };
  }, [displayedData]);

  // Custom Tooltip Component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload as SupplierMonthlyFinancialTrend;
      const monthPurchased = dataPoint.purchased;
      const monthPaid = dataPoint.paid;
      const gap = monthPurchased - monthPaid;
      const settlementPct = monthPurchased > 0 ? Math.round((monthPaid / monthPurchased) * 100) : 100;

      return (
        <div className="bg-stone-900 text-white p-3.5 rounded-xl shadow-xl border border-stone-700 text-xs min-w-[220px] space-y-2">
          <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
            <span className="font-bold text-amber-300">{dataPoint.monthLabel} ({dataPoint.monthLabelBn})</span>
            <span className="text-[10px] font-mono text-stone-400">{dataPoint.monthKey}</span>
          </div>

          <div className="space-y-1.5">
            {/* Total Purchased */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-stone-300">
                <span className="w-2.5 h-2.5 rounded-xs bg-amber-500 inline-block" />
                <span>মোট ক্রয় (Purchased):</span>
              </div>
              <span className="font-mono font-bold text-amber-400">{formatBdt(monthPurchased)}</span>
            </div>
            {dataPoint.poCount > 0 && (
              <div className="text-[10px] text-stone-400 pl-4">
                {dataPoint.poCount}টি ক্রয়াদেশ চালান
              </div>
            )}

            {/* Amount Paid */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-stone-300">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block" />
                <span>পরিশোধিত (Paid):</span>
              </div>
              <span className="font-mono font-bold text-emerald-400">{formatBdt(monthPaid)}</span>
            </div>
            {dataPoint.paymentCount > 0 && (
              <div className="text-[10px] text-stone-400 pl-4">
                {dataPoint.paymentCount}টি পেমেন্ট ভাউচার
              </div>
            )}

            {/* Monthly Net Gap */}
            <div className="border-t border-stone-800 pt-1.5 flex items-center justify-between text-[11px]">
              <span className="text-stone-400">মাসিক ব্যবধান (Net Gap):</span>
              <span className={`font-mono font-semibold ${gap > 0 ? 'text-rose-400' : gap < 0 ? 'text-emerald-400' : 'text-stone-300'}`}>
                {gap > 0 ? `+${formatBdt(gap)} বাকি` : gap < 0 ? `${formatBdt(Math.abs(gap))} অতিরিক্ত পরিশোধ` : 'সম্পূর্ণ সমান'}
              </span>
            </div>

            {/* Cumulative Due Balance */}
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-stone-400">ক্রমপুঞ্জিত বকেয়া (Cumulative):</span>
              <span className="font-mono font-bold text-sky-400">{formatBdt(dataPoint.cumulativeDue)}</span>
            </div>

            {/* Settlement Ratio */}
            {monthPurchased > 0 && (
              <div className="flex items-center justify-between text-[10px] text-stone-400 pt-0.5">
                <span>পরিশোধের হার:</span>
                <span className="font-semibold text-stone-200">{settlementPct}%</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-4 sm:p-5 space-y-4 shadow-xs">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-stone-700" />
            <h3 className="text-sm font-bold text-stone-900">
              ১২ মাসের ক্রয় বনাম পরিশোধের আর্থিক ট্রেন্ড (12-Month Performance Trend)
            </h3>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            মাসিক মোট ক্রয়াদেশ বিল ও ভেন্ডরকে পরিশোধিত অর্থের তুলনামূলক গতিপ্রকৃতি এবং বকেয়া ট্র্যাকিং।
          </p>
        </div>

        {/* Action Toggles */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Timeframe selector */}
          <div className="inline-flex rounded-lg border border-stone-200 p-0.5 bg-stone-50 text-[11px]">
            <button
              onClick={() => setTimeRange('12M')}
              className={`px-2.5 py-1 rounded font-semibold transition-colors ${
                timeRange === '12M' ? 'bg-white shadow-xs text-stone-900' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              ১২ মাস (12M)
            </button>
            <button
              onClick={() => setTimeRange('6M')}
              className={`px-2.5 py-1 rounded font-semibold transition-colors ${
                timeRange === '6M' ? 'bg-white shadow-xs text-stone-900' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              ৬ মাস (6M)
            </button>
            <button
              onClick={() => setTimeRange('3M')}
              className={`px-2.5 py-1 rounded font-semibold transition-colors ${
                timeRange === '3M' ? 'bg-white shadow-xs text-stone-900' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              ৩ মাস (3M)
            </button>
          </div>

          {/* Chart mode selector */}
          <div className="inline-flex rounded-lg border border-stone-200 p-0.5 bg-stone-50 text-[11px]">
            <button
              onClick={() => setChartMode('composed')}
              title="বার ও ট্রেন্ড সমন্বিত চার্ট"
              className={`px-2.5 py-1 rounded font-semibold transition-colors flex items-center gap-1 ${
                chartMode === 'composed' ? 'bg-white shadow-xs text-stone-900' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <BarChart3 className="w-3 h-3" />
              <span>সমন্বিত (Composed)</span>
            </button>
            <button
              onClick={() => setChartMode('bars')}
              title="পাশাপাশি বার তুলনা"
              className={`px-2.5 py-1 rounded font-semibold transition-colors flex items-center gap-1 ${
                chartMode === 'bars' ? 'bg-white shadow-xs text-stone-900' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>পাশাপাশি বার</span>
            </button>
            <button
              onClick={() => setChartMode('cumulative')}
              title="ক্রমপুঞ্জিত বকেয়ার ট্রেন্ড"
              className={`px-2.5 py-1 rounded font-semibold transition-colors flex items-center gap-1 ${
                chartMode === 'cumulative' ? 'bg-white shadow-xs text-stone-900' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <LineChartIcon className="w-3 h-3" />
              <span>বকেয়া ট্রেন্ড</span>
            </button>
          </div>

          <button
            onClick={() => setShowTable(!showTable)}
            className={`px-2.5 py-1 text-[11px] rounded-lg font-semibold border transition-colors flex items-center gap-1 ${
              showTable ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
            }`}
          >
            <FileText className="w-3 h-3" />
            <span>{showTable ? 'চার্ট দেখুন' : 'টেবিল দেখুন'}</span>
          </button>
        </div>
      </div>

      {/* Analytical KPI Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-50 p-3.5 rounded-xl border border-stone-200">
        <div>
          <div className="text-[11px] text-stone-500 font-medium flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-600" />
            <span>মোট ক্রয়াদেশ (Purchased)</span>
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-stone-900 mt-0.5">
            {formatBdt(summary.totalPurchased)}
          </div>
          <div className="text-[10px] text-stone-400 mt-0.5">
            গড় মাসিক: {formatBdt(summary.avgMonthlyPurchased)}
          </div>
        </div>

        <div>
          <div className="text-[11px] text-stone-500 font-medium flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            <span>পরিশোধিত অর্থ (Paid)</span>
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-emerald-700 mt-0.5">
            {formatBdt(summary.totalPaid)}
          </div>
          <div className="text-[10px] text-stone-400 mt-0.5">
            গড় মাসিক: {formatBdt(summary.avgMonthlyPaid)}
          </div>
        </div>

        <div>
          <div className="text-[11px] text-stone-500 font-medium flex items-center gap-1">
            <Percent className="w-3 h-3 text-stone-400" />
            <span>পরিশোধ অনুপাত (Fulfillment)</span>
          </div>
          <div className={`text-base sm:text-lg font-bold font-mono mt-0.5 ${
            summary.ratio >= 90 ? 'text-emerald-700' : summary.ratio >= 70 ? 'text-amber-700' : 'text-rose-700'
          }`}>
            {summary.ratio}%
          </div>
          <div className="text-[10px] text-stone-400 mt-0.5">
            ফারাক: {formatBdt(Math.abs(summary.netDifference))}
          </div>
        </div>

        <div>
          <div className="text-[11px] text-stone-500 font-medium flex items-center gap-1">
            <Clock className="w-3 h-3 text-stone-400" />
            <span>সর্বোচ্চ ক্রয়ের মাস</span>
          </div>
          <div className="text-sm sm:text-base font-bold text-stone-900 mt-0.5 truncate">
            {summary.peakMonth ? `${summary.peakMonth.monthLabel} (${summary.peakMonth.monthLabelBn})` : 'N/A'}
          </div>
          <div className="text-[10px] font-mono text-amber-700 mt-0.5">
            {summary.peakMonth ? formatBdt(summary.peakMonth.purchased) : '৳০'}
          </div>
        </div>
      </div>

      {/* Main Visual: Recharts Trend Graphic */}
      {!showTable ? (
        <div className="space-y-2">
          <div className="h-72 sm:h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              {chartMode === 'composed' ? (
                <ComposedChart data={displayedData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis 
                    dataKey="monthLabel" 
                    tick={{ fontSize: 11, fill: '#64748b' }} 
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                  />
                  <YAxis 
                    tickFormatter={formatShortBdt} 
                    tick={{ fontSize: 10, fill: '#64748b' }} 
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                    formatter={(value) => {
                      if (value === 'purchased') return 'মোট ক্রয়াদেশ (Total Purchased)';
                      if (value === 'paid') return 'পরিশোধিত অর্থ (Amount Paid)';
                      if (value === 'cumulativeDue') return 'বকেয়া ব্যালেন্স (Running Due)';
                      return value;
                    }}
                  />
                  {/* Total Purchased Bar */}
                  <Bar 
                    dataKey="purchased" 
                    fill="#d97706" 
                    radius={[4, 4, 0, 0]} 
                    maxBarSize={32}
                    name="purchased"
                  />
                  {/* Amount Paid Bar */}
                  <Bar 
                    dataKey="paid" 
                    fill="#059669" 
                    radius={[4, 4, 0, 0]} 
                    maxBarSize={32}
                    name="paid"
                  />
                  {/* Running Due Line */}
                  <Line 
                    type="monotone" 
                    dataKey="cumulativeDue" 
                    stroke="#0284c7" 
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#0284c7' }}
                    name="cumulativeDue"
                  />
                </ComposedChart>
              ) : chartMode === 'bars' ? (
                <BarChart data={displayedData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis 
                    dataKey="monthLabel" 
                    tick={{ fontSize: 11, fill: '#64748b' }} 
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                  />
                  <YAxis 
                    tickFormatter={formatShortBdt} 
                    tick={{ fontSize: 10, fill: '#64748b' }} 
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                    formatter={(value) => {
                      if (value === 'purchased') return 'মোট ক্রয়াদেশ (Total Purchased)';
                      if (value === 'paid') return 'পরিশোধিত অর্থ (Amount Paid)';
                      return value;
                    }}
                  />
                  <Bar 
                    dataKey="purchased" 
                    fill="#d97706" 
                    radius={[4, 4, 0, 0]} 
                    maxBarSize={36}
                    name="purchased"
                  />
                  <Bar 
                    dataKey="paid" 
                    fill="#059669" 
                    radius={[4, 4, 0, 0]} 
                    maxBarSize={36}
                    name="paid"
                  />
                </BarChart>
              ) : (
                <AreaChart data={displayedData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#0284c7" stopOpacity={0.02}/>
                    </linearGradient>
                    <linearGradient id="purchasedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d97706" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#d97706" stopOpacity={0.02}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis 
                    dataKey="monthLabel" 
                    tick={{ fontSize: 11, fill: '#64748b' }} 
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                  />
                  <YAxis 
                    tickFormatter={formatShortBdt} 
                    tick={{ fontSize: 10, fill: '#64748b' }} 
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                    formatter={(value) => {
                      if (value === 'cumulativeDue') return 'ক্রমপুঞ্জিত বকেয়া (Cumulative Unsettled Balance)';
                      if (value === 'purchased') return 'মাসিক ক্রয়াদেশ (Monthly Purchased)';
                      return value;
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="cumulativeDue" 
                    stroke="#0284c7" 
                    fillOpacity={1} 
                    fill="url(#dueGradient)" 
                    strokeWidth={2.5}
                    name="cumulativeDue"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="purchased" 
                    stroke="#d97706" 
                    fillOpacity={1} 
                    fill="url(#purchasedGradient)" 
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    name="purchased"
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-[11px] text-stone-500 pt-2 border-t border-stone-100">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-amber-600 inline-block" />
                <span>ক্রয় চালান (Total Purchased)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-emerald-600 inline-block" />
                <span>পরিশোধিত ভাউচার (Amount Paid)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-1 bg-sky-600 inline-block rounded-full" />
                <span>বকেয়া দায় (Running Due)</span>
              </span>
            </div>
            <span className="text-[10px] text-stone-400">
              *সার্ভার অডিট লেজার ও রিসিভিং চালান থেকে স্বয়ংক্রিয়ভাবে গণনাকৃত
            </span>
          </div>
        </div>
      ) : (
        /* Month-by-Month Tabular Breakdown */
        <div className="overflow-x-auto border border-stone-200 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-50 text-stone-700 font-bold border-b border-stone-200">
                <th className="py-2.5 px-3">মাস (Month)</th>
                <th className="py-2.5 px-3 text-right">ক্রয়াদেশ চালান (Purchased)</th>
                <th className="py-2.5 px-3 text-right">পরিশোধিত অর্থ (Paid)</th>
                <th className="py-2.5 px-3 text-right">মাসিক ব্যবধান (Net Gap)</th>
                <th className="py-2.5 px-3 text-right">বকেয়া দায় (Running Due)</th>
                <th className="py-2.5 px-3 text-center">পরিশোধ অনুপাত</th>
                <th className="py-2.5 px-3 text-center">স্ট্যাটাস</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {displayedData.map((item, idx) => {
                const gap = item.purchased - item.paid;
                const ratio = item.purchased > 0 ? Math.round((item.paid / item.purchased) * 100) : (item.paid > 0 ? 100 : 100);
                const isFullySettled = gap <= 0;

                return (
                  <tr key={idx} className="hover:bg-stone-50/80 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-stone-900">{item.monthLabel}</div>
                      <div className="text-[10px] text-stone-400">{item.monthLabelBn} • {item.monthKey}</div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-800">
                      {formatBdt(item.purchased)}
                      {item.poCount > 0 && (
                        <div className="text-[10px] font-normal text-stone-400 font-sans">{item.poCount}টি PO</div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800">
                      {formatBdt(item.paid)}
                      {item.paymentCount > 0 && (
                        <div className="text-[10px] font-normal text-stone-400 font-sans">{item.paymentCount}টি ভাউচার</div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold">
                      <span className={gap > 0 ? 'text-rose-700' : gap < 0 ? 'text-emerald-700' : 'text-stone-400'}>
                        {gap > 0 ? `+${formatBdt(gap)}` : gap < 0 ? `-${formatBdt(Math.abs(gap))}` : '৳০'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-sky-800">
                      {formatBdt(item.cumulativeDue)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`font-mono text-[11px] font-bold ${
                        ratio >= 100 ? 'text-emerald-700' : ratio >= 70 ? 'text-amber-700' : 'text-rose-700'
                      }`}>
                        {item.purchased === 0 && item.paid === 0 ? '—' : `${ratio}%`}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {item.purchased === 0 && item.paid === 0 ? (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-stone-100 text-stone-500 font-medium">
                          লেনদেন নেই
                        </span>
                      ) : isFullySettled ? (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold flex items-center justify-center gap-1 w-fit mx-auto">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>পরিশোধিত</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-amber-50 text-amber-700 border border-amber-200 font-bold flex items-center justify-center gap-1 w-fit mx-auto">
                          <AlertCircle className="w-2.5 h-2.5" />
                          <span>বকেয়া বাকি</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
