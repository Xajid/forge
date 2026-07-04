'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WorkspaceLayout } from '@/components/layout/WorkspaceLayout';
import { GlassCard } from '@/components/forge/GlassCard';
import { GlowButton } from '@/components/forge/GlowButton';
import { useToast } from '@/hooks/use-toast';
import { AnimatedInput } from '@/components/forge/AnimatedInput';
import { ForgeBadge } from '@/components/forge/ForgeBadge';
import { ShimmerCard } from '@/components/forge/Shimmer';
import { EmptyState } from '@/components/forge/EmptyState';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import ReactMarkdown from 'react-markdown';
import {
  Flame,
  Zap,
  Database,
  HardDrive,
  Shield,
  Globe,
  Server,
  TrendingDown,
  DollarSign,
  BarChart3,
  History,
  Trash2,
  Eye,
  Loader2,
  Sparkles,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';

// ── Types ───────────────────────────────────────────────────────────────────

interface FormData {
  name: string;
  period: string;
  firestore: { reads: number; writes: number; deletes: number };
  storage: { storedGB: number; downloadGB: number; uploadGB: number };
  auth: { monthlyActiveUsers: number };
  hosting: { transferGB: number; functionInvocations: number; functionComputeGBs: number };
}

interface CostLineItem {
  service: string;
  metric: string;
  usage: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  freeTierUsage?: number;
  billableUsage?: number;
}

interface CostByService {
  name: string;
  cost: number;
}

interface TopDriver {
  service: string;
  metric: string;
  cost: number;
}

interface AnalysisResult {
  id: string;
  name: string;
  createdAt: string;
  analysis: {
    items: CostLineItem[];
    total: number;
    costByService: CostByService[];
    topDriver: TopDriver;
    estimatedSavingsLow: number;
    estimatedSavingsHigh: number;
  };
  recommendations: string;
}

interface ReportListItem {
  id: string;
  name: string;
  createdAt: string;
  totalCost: number | null;
  period: string | null;
}

interface ViewReportData {
  id: string;
  name: string;
  createdAt: string;
  recommendations: string;
  analysis: {
    items: CostLineItem[];
    total: number;
    costByService: CostByService[];
    topDriver: TopDriver;
    estimatedSavingsLow: number;
    estimatedSavingsHigh: number;
  } | null;
  inputData: {
    name: string;
    period?: string;
    firestore: { reads: number; writes: number; deletes: number };
    storage: { storedGB: number; downloadGB: number; uploadGB: number };
    auth: { monthlyActiveUsers: number };
    hosting: { transferGB: number; functionInvocations: number; functionComputeGBs: number };
  };
}

// ── Chart colors ────────────────────────────────────────────────────────────

const CHART_COLORS = ['#8b5cf6', '#3b82f6', '#06b6d4', '#a78bfa', '#60a5fa'];
const SERVICE_COLOR_MAP: Record<string, string> = {
  Firestore: '#8b5cf6',
  'Cloud Storage': '#3b82f6',
  Authentication: '#06b6d4',
  Hosting: '#a78bfa',
  'Cloud Functions': '#60a5fa',
};

// ── Formatters ──────────────────────────────────────────────────────────────

function formatCurrency(n: number): string {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ── Empty form data ─────────────────────────────────────────────────────────

const emptyForm: FormData = {
  name: '',
  period: new Date().toISOString().slice(0, 7),
  firestore: { reads: 0, writes: 0, deletes: 0 },
  storage: { storedGB: 0, downloadGB: 0, uploadGB: 0 },
  auth: { monthlyActiveUsers: 0 },
  hosting: { transferGB: 0, functionInvocations: 0, functionComputeGBs: 0 },
};

// ── Custom Tooltip for charts ───────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="forge-glass rounded-lg px-3 py-2 border border-[rgba(255,255,255,0.08)] shadow-xl">
      {label && <p className="text-xs text-[#8888a0] mb-1">{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} className="text-xs font-medium" style={{ color: entry.color }}>
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
}

// ── Pie chart label ─────────────────────────────────────────────────────────

function renderCustomLabel({ name, percent }: { name: string; percent: number }) {
  return `${name} ${(percent * 100).toFixed(0)}%`;
}

// ── Component ───────────────────────────────────────────────────────────────

export default function FirebaseAnalyzer() {
  const [activeTab, setActiveTab] = useState('analyze');
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [analyzing, setAnalyzing] = useState(false);
  const [loadingSample, setLoadingSample] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [viewingReport, setViewingReport] = useState<ViewReportData | null>(null);
  const [loadingViewReport, setLoadingViewReport] = useState(false);
  const { toast } = useToast();

  // Update a nested field
  const updateField = useCallback(
    (section: keyof FormData, field: string, value: string | number) => {
      setFormData((prev) => ({
        ...prev,
        [section]:
          typeof prev[section] === 'object'
            ? { ...(prev[section] as Record<string, unknown>), [field]: Number(value) || 0 }
            : value,
      }));
    },
    []
  );

  // Load sample data
  const loadSample = async () => {
    setLoadingSample(true);
    try {
      const res = await fetch('/api/firebase-analyzer/sample-data');
      const data = await res.json();
      setFormData((prev) => ({
        ...prev,
        name: data.name || prev.name,
        period: data.period || prev.period,
        firestore: data.firestore || prev.firestore,
        storage: data.storage || prev.storage,
        auth: data.auth || prev.auth,
        hosting: data.hosting || prev.hosting,
      }));
      toast({ title: 'Sample data loaded', description: `Project: ${data.name}` });
    } catch {
      toast({ title: 'Failed to load sample', variant: 'destructive' });
    } finally {
      setLoadingSample(false);
    }
  };

  // Run analysis
  const runAnalysis = async () => {
    if (!formData.name.trim()) return;
    setAnalyzing(true);
    setResult(null);
    try {
      const res = await fetch('/api/firebase-analyzer/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.error) {
        toast({ title: 'Analysis failed', description: data.error, variant: 'destructive' });
        setResult(null);
        return;
      }
      setResult(data);
      setActiveTab('results');
    } catch {
      toast({ title: 'Analysis failed', description: 'Network error — please try again.', variant: 'destructive' });
    } finally {
      setAnalyzing(false);
    }
  };

  // Load reports
  const loadReports = async () => {
    setLoadingReports(true);
    try {
      const res = await fetch('/api/firebase-analyzer/reports');
      const data = await res.json();
      setReports(data);
    } catch {
      toast({ title: 'Failed to load reports', variant: 'destructive' });
    } finally {
      setLoadingReports(false);
    }
  };

  // View a report
  const viewReport = async (id: string) => {
    setLoadingViewReport(true);
    try {
      const res = await fetch(`/api/firebase-analyzer/reports/${id}`);
      const data = await res.json();
      if (data.error) {
        toast({ title: 'Failed to load report', variant: 'destructive' });
        return;
      }

      const reportResult: AnalysisResult = {
        id: data.id,
        name: data.name,
        createdAt: data.createdAt,
        analysis: data.analysis || {
          items: [],
          total: 0,
          costByService: [],
          topDriver: { service: 'N/A', metric: 'N/A', cost: 0 },
          estimatedSavingsLow: 0,
          estimatedSavingsHigh: 0,
        },
        recommendations: data.recommendations || '',
      };
      setResult(reportResult);
      setViewingReport(data);
      setActiveTab('results');
    } catch {
      toast({ title: 'Failed to load report', variant: 'destructive' });
    } finally {
      setLoadingViewReport(false);
    }
  };

  // Delete a report
  const deleteReport = async (id: string) => {
    try {
      const res = await fetch(`/api/firebase-analyzer/reports/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setReports((prev) => prev.filter((r) => r.id !== id));
        if (viewingReport?.id === id) setViewingReport(null);
        toast({ title: 'Report deleted' });
      }
    } catch {
      toast({ title: 'Failed to delete report', variant: 'destructive' });
    }
  };

  // Tab change handler for history
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'history' && reports.length === 0) {
      loadReports();
    }
  };

  // ── Input Field Component ────────────────────────────────────────────────
  const NumberField = ({
    label,
    icon,
    section,
    field,
    placeholder,
    suffix,
  }: {
    label: string;
    icon: React.ReactNode;
    section: keyof FormData;
    field: string;
    placeholder: string;
    suffix?: string;
  }) => (
    <div className="flex flex-col gap-1.5">
      <Label className="text-[#8888a0] text-xs">{label}</Label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#55556a] pointer-events-none">
          {icon}
        </div>
        <input
          type="number"
          min="0"
          value={
            (formData[section] as Record<string, number>)?.[field] ?? 0
          }
          onChange={(e) => updateField(section, field, e.target.value)}
          placeholder={placeholder}
          className="w-full h-9 pl-9 pr-10 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] text-[#f0f0f5] text-sm placeholder:text-[#44445a] focus:outline-none focus:border-[#8b5cf6]/50 focus:ring-1 focus:ring-[#8b5cf6]/20 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#55556a] text-xs pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );

  // ── Render input form ────────────────────────────────────────────────────
  const renderForm = () => (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Project info */}
      <GlassCard className="p-5">
        <h3 className="text-sm font-medium text-[#f0f0f5] mb-4 flex items-center gap-2">
          <Flame className="w-4 h-4 text-[#8b5cf6]" />
          Project Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-[#8888a0] text-xs">Project Name *</Label>
            <AnimatedInput
              placeholder="e.g. My Firebase Project"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[#8888a0] text-xs">Billing Period</Label>
            <AnimatedInput
              type="month"
              value={formData.period}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, period: e.target.value }))
              }
            />
          </div>
        </div>
      </GlassCard>

      {/* Firestore */}
      <GlassCard className="p-5">
        <h3 className="text-sm font-medium text-[#f0f0f5] mb-4 flex items-center gap-2">
          <Database className="w-4 h-4 text-[#8b5cf6]" />
          Cloud Firestore
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <NumberField
            label="Document Reads"
            icon={<Zap className="w-3.5 h-3.5" />}
            section="firestore"
            field="reads"
            placeholder="1,500,000"
            suffix="reads"
          />
          <NumberField
            label="Document Writes"
            icon={<Zap className="w-3.5 h-3.5" />}
            section="firestore"
            field="writes"
            placeholder="300,000"
            suffix="writes"
          />
          <NumberField
            label="Document Deletes"
            icon={<Zap className="w-3.5 h-3.5" />}
            section="firestore"
            field="deletes"
            placeholder="50,000"
            suffix="deletes"
          />
        </div>
      </GlassCard>

      {/* Storage */}
      <GlassCard className="p-5">
        <h3 className="text-sm font-medium text-[#f0f0f5] mb-4 flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-[#3b82f6]" />
          Cloud Storage
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <NumberField
            label="Stored Data"
            icon={<HardDrive className="w-3.5 h-3.5" />}
            section="storage"
            field="storedGB"
            placeholder="45"
            suffix="GB"
          />
          <NumberField
            label="Downloaded Data"
            icon={<ArrowRight className="w-3.5 h-3.5" />}
            section="storage"
            field="downloadGB"
            placeholder="120"
            suffix="GB"
          />
          <NumberField
            label="Uploaded Data"
            icon={<ArrowRight className="w-3.5 h-3.5 rotate-180" />}
            section="storage"
            field="uploadGB"
            placeholder="30"
            suffix="GB"
          />
        </div>
      </GlassCard>

      {/* Auth */}
      <GlassCard className="p-5">
        <h3 className="text-sm font-medium text-[#f0f0f5] mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#06b6d4]" />
          Authentication (Identity Platform)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <NumberField
            label="Monthly Active Users"
            icon={<Shield className="w-3.5 h-3.5" />}
            section="auth"
            field="monthlyActiveUsers"
            placeholder="25,000"
            suffix="MAU"
          />
        </div>
      </GlassCard>

      {/* Hosting & Functions */}
      <GlassCard className="p-5">
        <h3 className="text-sm font-medium text-[#f0f0f5] mb-4 flex items-center gap-2">
          <Globe className="w-4 h-4 text-[#a78bfa]" />
          Hosting & Cloud Functions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <NumberField
            label="Hosting Transfer"
            icon={<Globe className="w-3.5 h-3.5" />}
            section="hosting"
            field="transferGB"
            placeholder="200"
            suffix="GB"
          />
          <NumberField
            label="Function Invocations"
            icon={<Server className="w-3.5 h-3.5" />}
            section="hosting"
            field="functionInvocations"
            placeholder="500,000"
            suffix="invocations"
          />
          <NumberField
            label="Function Compute"
            icon={<Server className="w-3.5 h-3.5" />}
            section="hosting"
            field="functionComputeGBs"
            placeholder="800"
            suffix="GB-sec"
          />
        </div>
      </GlassCard>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <GlowButton
          variant="secondary"
          size="md"
          onClick={loadSample}
          disabled={loadingSample}
        >
          {loadingSample ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          Load Sample Data
        </GlowButton>
        <GlowButton
          size="lg"
          onClick={runAnalysis}
          disabled={analyzing || !formData.name.trim()}
        >
          {analyzing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <BarChart3 className="w-4 h-4" />
          )}
          {analyzing ? 'Analyzing...' : 'Analyze Costs'}
        </GlowButton>
      </div>
    </motion.div>
  );

  // ── Render results dashboard ─────────────────────────────────────────────
  const renderResults = () => {
    if (analyzing) {
      return (
        <div className="space-y-4">
          <ShimmerCard />
          <ShimmerCard />
          <ShimmerCard />
        </div>
      );
    }

    if (!result) {
      return (
        <EmptyState
          icon={<BarChart3 className="w-12 h-12" />}
          title="No Analysis Yet"
          description="Fill in your Firebase usage metrics and run an analysis to see detailed cost breakdowns and AI recommendations."
          action={
            <GlowButton variant="secondary" onClick={() => setActiveTab('analyze')}>
              Go to Input Form
            </GlowButton>
          }
        />
      );
    }

    const { analysis, recommendations } = result;
    const pieData = analysis.costByService.map((s) => ({
      ...s,
      color: SERVICE_COLOR_MAP[s.name] || '#55556a',
    }));

    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Cost */}
          <GlassCard glow="purple" hover className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-[#8b5cf6]" />
              <span className="text-xs text-[#8888a0] font-medium">Total Monthly Cost</span>
            </div>
            <p className="text-2xl font-bold text-[#f0f0f5]">{formatCurrency(analysis.total)}</p>
            <p className="text-xs text-[#55556a] mt-1">{result.name}</p>
          </GlassCard>

          {/* Top Cost Driver */}
          <GlassCard glow="blue" hover className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-[#3b82f6]" />
              <span className="text-xs text-[#8888a0] font-medium">Biggest Cost Driver</span>
            </div>
            <p className="text-lg font-bold text-[#f0f0f5]">{analysis.topDriver.metric}</p>
            <p className="text-sm text-[#60a5fa] mt-1">{formatCurrency(analysis.topDriver.cost)}</p>
          </GlassCard>

          {/* Estimated Savings Low */}
          <GlassCard glow="cyan" hover className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-[#06b6d4]" />
              <span className="text-xs text-[#8888a0] font-medium">Min. Potential Savings</span>
            </div>
            <p className="text-lg font-bold text-[#f0f0f5]">
              {formatCurrency(analysis.estimatedSavingsLow)}
            </p>
            <p className="text-xs text-[#55556a] mt-1">~15% with optimizations</p>
          </GlassCard>

          {/* Estimated Savings High */}
          <GlassCard glow="purple" hover className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-[#a78bfa]" />
              <span className="text-xs text-[#8888a0] font-medium">Max. Potential Savings</span>
            </div>
            <p className="text-lg font-bold text-[#f0f0f5]">
              {formatCurrency(analysis.estimatedSavingsHigh)}
            </p>
            <p className="text-xs text-[#55556a] mt-1">~35% with optimizations</p>
          </GlassCard>
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart - Cost by Service */}
          <GlassCard className="p-5">
            <h3 className="text-sm font-medium text-[#f0f0f5] mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#8b5cf6]" />
              Cost Breakdown by Service
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analysis.costByService}
                  margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#8888a0', fontSize: 11 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#8888a0', fontSize: 11 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                    tickLine={false}
                    tickFormatter={(v: number) => '$' + v.toFixed(0)}
                  />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Bar dataKey="cost" name="Cost" radius={[4, 4, 0, 0]}>
                    {analysis.costByService.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={SERVICE_COLOR_MAP[entry.name] || CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          {/* Pie Chart - Distribution */}
          <GlassCard className="p-5">
            <h3 className="text-sm font-medium text-[#f0f0f5] mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#3b82f6]" />
              Cost Distribution
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={85}
                    dataKey="cost"
                    nameKey="name"
                    paddingAngle={2}
                    label={renderCustomLabel}
                    labelLine={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={8}
                    formatter={(value: string) => (
                      <span className="text-xs text-[#8888a0]">{value}</span>
                    )}
                  />
                  <RechartsTooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>

        {/* Detailed Table */}
        <GlassCard className="p-5">
          <h3 className="text-sm font-medium text-[#f0f0f5] mb-4 flex items-center gap-2">
            <Database className="w-4 h-4 text-[#06b6d4]" />
            Detailed Cost Breakdown
          </h3>
          <ScrollArea className="max-h-96">
            <Table>
              <TableHeader>
                <TableRow className="border-[rgba(255,255,255,0.06)]">
                  <TableHead className="text-[#8888a0] text-xs">Service</TableHead>
                  <TableHead className="text-[#8888a0] text-xs">Metric</TableHead>
                  <TableHead className="text-[#8888a0] text-xs text-right">Usage</TableHead>
                  <TableHead className="text-[#8888a0] text-xs text-right">Unit Cost</TableHead>
                  <TableHead className="text-[#8888a0] text-xs text-right">Total Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analysis.items.map((item, i) => (
                  <TableRow key={i} className="border-[rgba(255,255,255,0.04)]">
                    <TableCell>
                      <ForgeBadge
                        variant={
                          item.service === 'Firestore'
                            ? 'purple'
                            : item.service === 'Cloud Storage'
                              ? 'blue'
                              : item.service === 'Authentication'
                                ? 'cyan'
                                : item.service === 'Hosting'
                                  ? 'purple'
                                  : 'blue'
                        }
                      >
                        {item.service}
                      </ForgeBadge>
                    </TableCell>
                    <TableCell className="text-[#f0f0f5] text-sm">{item.metric}</TableCell>
                    <TableCell className="text-right text-sm text-[#8888a0]">
                      {formatNumber(item.usage)} {item.unit}
                    </TableCell>
                    <TableCell className="text-right text-sm text-[#8888a0]">
                      {item.unitCost < 0.001
                        ? `$${item.unitCost}`
                        : item.unitCost < 1
                          ? `$${item.unitCost}/100K`
                          : `$${item.unitCost}/${item.unit}`}
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium text-[#f0f0f5]">
                      {formatCurrency(item.totalCost)}
                    </TableCell>
                  </TableRow>
                ))}
                {/* Total row */}
                <TableRow className="border-t border-[rgba(139,92,246,0.2)] bg-[rgba(139,92,246,0.04)]">
                  <TableCell colSpan={4} className="text-right text-sm font-bold text-[#f0f0f5]">
                    Total
                  </TableCell>
                  <TableCell className="text-right text-sm font-bold text-[#a78bfa]">
                    {formatCurrency(analysis.total)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </ScrollArea>
        </GlassCard>

        {/* Cost Comparison */}
        <GlassCard className="p-5">
          <h3 className="text-sm font-medium text-[#f0f0f5] mb-4 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-[#4ade80]" />
            Cost Comparison
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-lg bg-[rgba(239,68,68,0.06)] border border-[rgba(239,68,68,0.12)] p-4 text-center">
              <p className="text-xs text-[#f87171] mb-1 font-medium">Current Cost</p>
              <p className="text-xl font-bold text-[#f0f0f5]">{formatCurrency(analysis.total)}</p>
            </div>
            <div className="rounded-lg bg-[rgba(34,197,94,0.06)] border border-[rgba(34,197,94,0.12)] p-4 text-center">
              <p className="text-xs text-[#4ade80] mb-1 font-medium">
                After Optimizations (est.)
              </p>
              <p className="text-xl font-bold text-[#f0f0f5]">
                {formatCurrency(analysis.estimatedSavingsHigh)}
              </p>
            </div>
            <div className="rounded-lg bg-[rgba(139,92,246,0.06)] border border-[rgba(139,92,246,0.12)] p-4 text-center">
              <p className="text-xs text-[#a78bfa] mb-1 font-medium">Potential Savings</p>
              <p className="text-xl font-bold text-[#f0f0f5]">
                {formatCurrency(analysis.total - analysis.estimatedSavingsHigh)}
              </p>
              <p className="text-xs text-[#55556a] mt-1">
                {analysis.total > 0
                  ? `${((analysis.estimatedSavingsHigh / analysis.total) * 100).toFixed(0)}% reduction`
                  : 'N/A'}
              </p>
            </div>
          </div>
        </GlassCard>

        {/* AI Recommendations */}
        {recommendations && (
          <GlassCard glow="purple" className="p-5">
            <h3 className="text-sm font-medium text-[#f0f0f5] mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#a78bfa]" />
              AI-Powered Recommendations
            </h3>
            <ScrollArea className="max-h-96">
              <div className="prose prose-invert prose-sm max-w-none [&_h2]:text-[#f0f0f5] [&_h2]:text-base [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:font-semibold [&_h3]:text-[#c0c0d0] [&_h3]:text-sm [&_h3]:mt-3 [&_h3]:mb-1 [&_h3]:font-medium [&_p]:text-[#8888a0] [&_p]:leading-relaxed [&_li]:text-[#8888a0] [&_li]:leading-relaxed [&_strong]:text-[#c0c0d0] [&_ul]:space-y-1 [&_ol]:space-y-1 [&_code]:text-[#a78bfa] [&_code]:bg-[rgba(139,92,246,0.08)] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_pre]:bg-[rgba(0,0,0,0.3)] [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-[#8b5cf6]/40 [&_blockquote]:pl-3 [&_blockquote]:text-[#8888a0]">
                <ReactMarkdown>{recommendations}</ReactMarkdown>
              </div>
            </ScrollArea>
          </GlassCard>
        )}
      </motion.div>
    );
  };

  // ── Render report history ────────────────────────────────────────────────
  const renderHistory = () => (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {loadingReports ? (
        <div className="space-y-4">
          <ShimmerCard />
          <ShimmerCard />
        </div>
      ) : reports.length === 0 ? (
        <EmptyState
          icon={<History className="w-12 h-12" />}
          title="No Reports Yet"
          description="Run your first Firebase cost analysis to start building a history of reports."
          action={
            <GlowButton variant="secondary" onClick={() => setActiveTab('analyze')}>
              Run First Analysis
            </GlowButton>
          }
        />
      ) : (
        <ScrollArea className="max-h-[600px]">
          <div className="space-y-3">
            {reports.map((report, i) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <GlassCard
                  hover
                  className="p-4 flex items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Flame className="w-4 h-4 text-[#8b5cf6] shrink-0" />
                      <h4 className="text-sm font-medium text-[#f0f0f5] truncate">
                        {report.name}
                      </h4>
                      {report.period && (
                        <ForgeBadge variant="default">{report.period}</ForgeBadge>
                      )}
                    </div>
                    <p className="text-xs text-[#55556a]">
                      {formatDate(report.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {report.totalCost !== null && (
                      <span className="text-sm font-semibold text-[#a78bfa]">
                        {formatCurrency(report.totalCost)}
                      </span>
                    )}
                    <GlowButton
                      variant="ghost"
                      size="sm"
                      onClick={() => viewReport(report.id)}
                      disabled={loadingViewReport}
                    >
                      {loadingViewReport ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                      View
                    </GlowButton>
                    <GlowButton
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteReport(report.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </GlowButton>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      )}
    </motion.div>
  );

  // ── Main render ──────────────────────────────────────────────────────────
  return (
    <WorkspaceLayout>
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)]">
          <TabsTrigger
            value="analyze"
            className="data-[state=active]:bg-[rgba(139,92,246,0.15)] data-[state=active]:text-[#a78bfa] text-[#8888a0] text-xs gap-1.5"
          >
            <Flame className="w-3.5 h-3.5" />
            Input & Analyze
          </TabsTrigger>
          <TabsTrigger
            value="results"
            className="data-[state=active]:bg-[rgba(139,92,246,0.15)] data-[state=active]:text-[#a78bfa] text-[#8888a0] text-xs gap-1.5"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Results
            {result && !analyzing && (
              <ForgeBadge variant="purple" className="ml-1">New</ForgeBadge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="data-[state=active]:bg-[rgba(139,92,246,0.15)] data-[state=active]:text-[#a78bfa] text-[#8888a0] text-xs gap-1.5"
          >
            <History className="w-3.5 h-3.5" />
            History
            {reports.length > 0 && (
              <ForgeBadge variant="default" className="ml-1">{reports.length}</ForgeBadge>
            )}
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <TabsContent value="analyze">{renderForm()}</TabsContent>
            <TabsContent value="results">{renderResults()}</TabsContent>
            <TabsContent value="history">{renderHistory()}</TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </WorkspaceLayout>
  );
}