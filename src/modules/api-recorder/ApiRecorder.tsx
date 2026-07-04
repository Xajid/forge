'use client';

import { useState, useEffect, useCallback } from 'react';
import { WorkspaceLayout } from '@/components/layout/WorkspaceLayout';
import { GlassCard } from '@/components/forge/GlassCard';
import { GlowButton } from '@/components/forge/GlowButton';
import { MethodBadge } from '@/components/forge/ForgeBadge';
import { StatusBadge } from '@/components/forge/ForgeBadge';
import { JsonViewer } from '@/components/forge/JsonViewer';
import { EmptyState } from '@/components/forge/EmptyState';
import { AnimatedInput } from '@/components/forge/AnimatedInput';
import { ShimmerCard } from '@/components/forge/Shimmer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Radio,
  Plus,
  Copy,
  Check,
  Trash2,
  ArrowLeft,
  Search,
  Download,
  Link2,
  Clock,
  Globe,
  ChevronDown,
  Zap,
  BarChart3,
} from 'lucide-react';

// Types
interface Endpoint {
  id: string;
  name: string;
  slug: string;
  url: string;
  isActive: boolean;
  createdAt: string;
  requestCount: number;
}

interface RecordedRequest {
  id: string;
  method: string;
  path: string;
  headers: string;
  query: string | null;
  body: string | null;
  statusCode: number | null;
  responseTime: number | null;
  ipAddress: string | null;
  createdAt: string;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
};

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 5) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${diffDay}d ago`;
}

function formatTimestamp(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function safeParseJson(str: string | null): unknown {
  if (!str) return null;
  try {
    return JSON.parse(str);
  } catch {
    return str;
  }
}

// Endpoint List View
function EndpointList({
  onSelect,
  onCreateNew,
}: {
  onSelect: (ep: Endpoint) => void;
  onCreateNew: () => void;
}) {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEndpoints = useCallback(async () => {
    try {
      const res = await fetch('/api/recorder/endpoints');
      if (res.ok) {
        const data = await res.json();
        setEndpoints(data);
      }
    } catch (err) {
      console.error('Failed to fetch endpoints:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEndpoints();
  }, [fetchEndpoints]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await fetch(`/api/recorder/endpoints/${id}`, { method: 'DELETE' });
      setEndpoints((prev) => prev.filter((ep) => ep.id !== id));
    } catch (err) {
      console.error('Failed to delete endpoint:', err);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <ShimmerCard />
        <ShimmerCard />
        <ShimmerCard />
      </div>
    );
  }

  if (endpoints.length === 0) {
    return (
      <EmptyState
        icon={<Radio className="w-12 h-12" />}
        title="No endpoints yet"
        description="Create your first endpoint to start recording HTTP requests. Each endpoint gets a unique URL you can share."
        action={
          <GlowButton variant="primary" onClick={onCreateNew}>
            <Plus className="w-4 h-4" />
            Create Endpoint
          </GlowButton>
        }
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-[#8888a0]">
          {endpoints.length} endpoint{endpoints.length !== 1 ? 's' : ''}
        </p>
        <GlowButton variant="primary" size="sm" onClick={onCreateNew}>
          <Plus className="w-4 h-4" />
          New Endpoint
        </GlowButton>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid gap-4 md:grid-cols-2"
      >
        {endpoints.map((ep) => (
          <motion.div key={ep.id} variants={itemVariants}>
            <GlassCard
              hover
              glow="purple"
              className="p-4 cursor-pointer group"
              onClick={() => onSelect(ep)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[rgba(139,92,246,0.1)] border border-[rgba(139,92,246,0.2)] flex items-center justify-center flex-shrink-0">
                    <Link2 className="w-4 h-4 text-[#a78bfa]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium text-[#f0f0f5] truncate">
                      {ep.name}
                    </h3>
                    <p className="text-xs text-[#55556a] mt-0.5 truncate font-mono">
                      /{ep.slug}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <CopyUrlButton url={ep.url} />
                  <GlowButton
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-[#55556a] hover:text-red-400"
                    onClick={(e) => handleDelete(e, ep.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </GlowButton>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-[#55556a]">
                <span className="flex items-center gap-1">
                  <BarChart3 className="w-3 h-3" />
                  {ep.requestCount} request{ep.requestCount !== 1 ? 's' : ''}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTimeAgo(ep.createdAt)}
                </span>
                <span
                  className={`ml-auto flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                    ep.isActive
                      ? 'bg-[rgba(34,197,94,0.1)] text-[#4ade80]'
                      : 'bg-[rgba(239,68,68,0.1)] text-[#f87171]'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      ep.isActive ? 'bg-[#4ade80]' : 'bg-[#f87171]'
                    }`}
                  />
                  {ep.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

// Copy URL button
function CopyUrlButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <GlowButton
      variant="ghost"
      size="icon"
      className="h-7 w-7 text-[#55556a] hover:text-[#f0f0f5]"
      onClick={handleCopy}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
    </GlowButton>
  );
}

// New endpoint creation panel
function NewEndpointPanel({
  onCreated,
  onCancel,
}: {
  onCreated: (ep: Endpoint) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [useCustomSlug, setUseCustomSlug] = useState(false);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<Endpoint | null>(null);
  const [error, setError] = useState<string | null>(null);

  const autoSlugPreview = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32) || 'my-endpoint';

  const handleCreate = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Please enter an endpoint name');
      return;
    }

    const slug = useCustomSlug ? customSlug.trim() : autoSlugPreview;
    if (!slug) {
      setError('Endpoint path cannot be empty');
      return;
    }
    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/.test(slug)) {
      setError('Path must be lowercase letters, numbers, and hyphens only');
      return;
    }

    setCreating(true);
    setError(null);
    try {
      const res = await fetch('/api/recorder/endpoints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName, slug }),
      });
      if (res.ok) {
        const data = await res.json();
        setCreated(data);
      } else {
        const err = await res.json().catch(() => ({}));
        setError(err.error || 'Failed to create endpoint');
      }
    } catch (err) {
      console.error('Failed to create endpoint:', err);
      setError('Network error — please try again');
    } finally {
      setCreating(false);
    }
  };

  if (created) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <GlassCard glow="purple" className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.2)] flex items-center justify-center">
              <Zap className="w-4 h-4 text-[#4ade80]" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-[#f0f0f5]">
                Endpoint Created
              </h3>
              <p className="text-xs text-[#55556a]">
                Send requests to this URL to record them
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] mb-4">
            <Globe className="w-4 h-4 text-[#55556a] flex-shrink-0" />
            <code className="text-sm text-[#a78bfa] font-mono truncate flex-1">
              {created.url}
            </code>
            <CopyUrlButton url={created.url} />
          </div>

          <div className="flex items-center gap-2">
            <GlowButton
              variant="primary"
              size="sm"
              onClick={() => onCreated(created)}
            >
              View Requests
            </GlowButton>
            <GlowButton
              variant="secondary"
              size="sm"
              onClick={onCancel}
            >
              Back to List
            </GlowButton>
          </div>
        </GlassCard>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <GlassCard className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-[rgba(139,92,246,0.1)] border border-[rgba(139,92,246,0.2)] flex items-center justify-center">
            <Plus className="w-4 h-4 text-[#a78bfa]" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-[#f0f0f5]">
              Create New Endpoint
            </h3>
            <p className="text-xs text-[#55556a]">
              Set up a unique URL to record incoming HTTP requests
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Endpoint Name */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-[#8888a0]">
              Endpoint Name <span className="text-red-400">*</span>
            </label>
            <AnimatedInput
              icon={<Link2 className="w-4 h-4" />}
              placeholder="e.g. My Webhook, Production API, Staging Hook"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate();
              }}
              autoFocus
            />
          </div>

          {/* Custom Slug Toggle */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-[#8888a0]">
                Custom Path
              </label>
              <button
                onClick={() => setUseCustomSlug(!useCustomSlug)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  useCustomSlug
                    ? 'bg-[#8b5cf6]'
                    : 'bg-[rgba(255,255,255,0.1)]'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    useCustomSlug ? 'translate-x-4.5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {useCustomSlug ? (
              <div className="flex items-center gap-0 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] focus-within:border-[#8b5cf6]/50 focus-within:ring-1 focus-within:ring-[#8b5cf6]/20 transition-all">
                <span className="pl-3 text-xs text-[#55556a] font-mono select-none whitespace-nowrap">
                  /api/recorder/catch/
                </span>
                <input
                  type="text"
                  className="flex-1 bg-transparent text-sm text-[#f0f0f5] font-mono placeholder:text-[#55556a] focus:outline-none pr-3 py-2.5"
                  placeholder="my-custom-path"
                  value={customSlug}
                  onChange={(e) => setCustomSlug(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreate();
                  }}
                  autoFocus
                />
              </div>
            ) : (
              <div className="flex items-center gap-0 p-2.5 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)]">
                <span className="text-xs text-[#55556a] font-mono select-none whitespace-nowrap">
                  /api/recorder/catch/
                </span>
                <span className="text-xs text-[#a78bfa] font-mono truncate">
                  {autoSlugPreview}
                </span>
              </div>
            )}

            <p className="text-[11px] text-[#55556a]">
              {useCustomSlug
                ? 'Lowercase letters, numbers, and hyphens only. This will be part of your public recording URL.'
                : 'Auto-generated from your endpoint name. Toggle to set a custom path.'}
            </p>
          </div>

          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 rounded-lg bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.15)]"
            >
              <span className="text-xs text-red-400">{error}</span>
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <GlowButton
              variant="primary"
              size="sm"
              onClick={handleCreate}
              disabled={creating}
              className="gap-1.5"
            >
              {creating ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  Create Endpoint
                </>
              )}
            </GlowButton>
            <GlowButton
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={creating}
            >
              Cancel
            </GlowButton>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

// Request card component
function RequestCard({ request }: { request: RecordedRequest }) {
  const [copied, setCopied] = useState(false);

  const handleCopyPayload = () => {
    const payload = {
      method: request.method,
      path: request.path,
      headers: safeParseJson(request.headers),
      query: safeParseJson(request.query),
      body: safeParseJson(request.body),
      timestamp: request.createdAt,
      ip: request.ipAddress,
    };
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const parsedHeaders = safeParseJson(request.headers);
  const parsedBody = safeParseJson(request.body);
  const parsedQuery = safeParseJson(request.query);

  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MethodBadge method={request.method} />
          {request.statusCode && <StatusBadge status={request.statusCode} />}
          {request.responseTime != null && (
            <span className="flex items-center gap-1 text-xs text-[#55556a]">
              <Clock className="w-3 h-3" />
              {request.responseTime}ms
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#55556a]">
            {formatTimeAgo(request.createdAt)}
          </span>
          <GlowButton
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs gap-1"
            onClick={handleCopyPayload}
          >
            {copied ? (
              <Check className="w-3 h-3" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
            {copied ? 'Copied' : 'Copy'}
          </GlowButton>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-[#55556a] mb-3">
        <span className="font-mono truncate">{request.path}</span>
        {request.ipAddress && (
          <>
            <span className="text-[rgba(255,255,255,0.1)]">|</span>
            <span className="flex items-center gap-1">
              <Globe className="w-3 h-3" />
              {request.ipAddress}
            </span>
          </>
        )}
      </div>

      <div className="space-y-2">
        {/* Headers */}
        {parsedHeaders && typeof parsedHeaders === 'object' && Object.keys(parsedHeaders as Record<string, unknown>).length > 0 && (
          <Collapsible>
            <CollapsibleTrigger className="flex items-center gap-1.5 text-xs text-[#8888a0] hover:text-[#f0f0f5] transition-colors w-full py-1">
              <ChevronDown className="w-3 h-3 transition-transform [[data-state=open]>&]:rotate-0" />
              Headers
              <span className="text-[#55556a]">
                ({Object.keys(parsedHeaders as Record<string, unknown>).length})
              </span>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-1">
                <JsonViewer data={parsedHeaders} maxDepth={3} />
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Query Params */}
        {parsedQuery && typeof parsedQuery === 'object' && Object.keys(parsedQuery as Record<string, unknown>).length > 0 && (
          <Collapsible>
            <CollapsibleTrigger className="flex items-center gap-1.5 text-xs text-[#8888a0] hover:text-[#f0f0f5] transition-colors w-full py-1">
              <ChevronDown className="w-3 h-3 transition-transform [[data-state=open]>&]:rotate-0" />
              Query Params
              <span className="text-[#55556a]">
                ({Object.keys(parsedQuery as Record<string, unknown>).length})
              </span>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-1">
                <JsonViewer data={parsedQuery} maxDepth={3} />
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Body */}
        {request.body && request.body !== 'null' && (
          <Collapsible>
            <CollapsibleTrigger className="flex items-center gap-1.5 text-xs text-[#8888a0] hover:text-[#f0f0f5] transition-colors w-full py-1">
              <ChevronDown className="w-3 h-3 transition-transform [[data-state=open]>&]:rotate-0" />
              Body
              <span className="text-[#55556a]">
                ({(request.body.length / 1024).toFixed(1)} KB)
              </span>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-1">
                {parsedBody && typeof parsedBody === 'object' ? (
                  <JsonViewer data={parsedBody} maxDepth={4} />
                ) : (
                  <div className="forge-code text-sm p-3 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] text-[#8888a0] whitespace-pre-wrap break-all max-h-64 overflow-auto">
                    {request.body}
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Timestamp */}
        <div className="text-[10px] text-[#55556a] pt-1 border-t border-[rgba(255,255,255,0.04)]">
          {formatTimestamp(request.createdAt)}
        </div>
      </div>
    </GlassCard>
  );
}

// Request detail panel
function RequestDetailPanel({
  endpoint,
  onBack,
}: {
  endpoint: Endpoint;
  onBack: () => void;
}) {
  const [requests, setRequests] = useState<RecordedRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [methodFilter, setMethodFilter] = useState<string>('all');

  const fetchRequests = useCallback(async () => {
    try {
      const res = await fetch(`/api/recorder/endpoints/${endpoint.id}`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch (err) {
      console.error('Failed to fetch requests:', err);
    } finally {
      setLoading(false);
    }
  }, [endpoint.id]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Auto-refresh every 3 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchRequests();
    }, 3000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchRequests]);

  const filteredRequests = requests.filter((r) => {
    const matchesSearch =
      !search ||
      r.method.toLowerCase().includes(search.toLowerCase()) ||
      r.path.toLowerCase().includes(search.toLowerCase()) ||
      r.ipAddress?.toLowerCase().includes(search.toLowerCase()) ||
      r.body?.toLowerCase().includes(search.toLowerCase());
    const matchesMethod = methodFilter === 'all' || r.method === methodFilter;
    return matchesSearch && matchesMethod;
  });

  const methods = ['all', ...new Set(requests.map((r) => r.method))];

  const handleExport = () => {
    const exportData = filteredRequests.map((r) => ({
      method: r.method,
      path: r.path,
      headers: safeParseJson(r.headers),
      query: safeParseJson(r.query),
      body: safeParseJson(r.body),
      statusCode: r.statusCode,
      responseTime: r.responseTime,
      ipAddress: r.ipAddress,
      createdAt: r.createdAt,
    }));
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${endpoint.slug}-requests.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Endpoint URL bar */}
      <GlassCard className="p-4 mb-4">
        <div className="flex items-center gap-3">
          <GlowButton
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0"
            onClick={onBack}
          >
            <ArrowLeft className="w-4 h-4" />
          </GlowButton>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-medium text-[#f0f0f5] truncate">
              {endpoint.name}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <code className="text-xs text-[#a78bfa] font-mono truncate">
                {endpoint.url}
              </code>
              <CopyUrlButton url={endpoint.url} />
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <GlowButton
              variant={autoRefresh ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="gap-1.5"
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  autoRefresh ? 'bg-green-400 animate-pulse' : 'bg-[#55556a]'
                }`}
              />
              {autoRefresh ? 'Live' : 'Paused'}
            </GlowButton>
          </div>
        </div>
      </GlassCard>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
        <AnimatedInput
          icon={<Search className="w-4 h-4" />}
          size="sm"
          placeholder="Search requests..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-[3px] rounded-lg bg-[rgba(255,255,255,0.04)]">
            {methods.map((m) => (
              <button
                key={m}
                onClick={() => setMethodFilter(m)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  methodFilter === m
                    ? 'bg-[rgba(255,255,255,0.1)] text-[#f0f0f5]'
                    : 'text-[#55556a] hover:text-[#8888a0]'
                }`}
              >
                {m === 'all' ? 'All' : m}
              </button>
            ))}
          </div>
          <GlowButton
            variant="secondary"
            size="sm"
            className="gap-1.5"
            onClick={handleExport}
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </GlowButton>
        </div>
      </div>

      {/* Requests list */}
      {loading ? (
        <div className="space-y-4">
          <ShimmerCard />
          <ShimmerCard />
          <ShimmerCard />
        </div>
      ) : filteredRequests.length === 0 ? (
        <EmptyState
          icon={<Radio className="w-12 h-12" />}
          title={
            requests.length === 0
              ? 'No requests recorded yet'
              : 'No matching requests'
          }
          description={
            requests.length === 0
              ? `Send an HTTP request to the endpoint URL above. Any method (GET, POST, PUT, PATCH, DELETE) will be recorded.`
              : 'Try adjusting your search or filter criteria.'
          }
        />
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-3"
        >
          <div className="text-xs text-[#55556a] px-1 flex items-center justify-between">
            <span>
              {filteredRequests.length} request
              {filteredRequests.length !== 1 ? 's' : ''}
              {methodFilter !== 'all' && ` (${methodFilter})`}
            </span>
            {search && <span>filtered by &ldquo;{search}&rdquo;</span>}
          </div>
          <ScrollArea className="h-[calc(100vh-22rem)]">
            <div className="space-y-3 pr-2">
              {filteredRequests.map((r) => (
                <motion.div key={r.id} variants={itemVariants}>
                  <RequestCard request={r} />
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </motion.div>
      )}
    </motion.div>
  );
}

// Main component
export default function ApiRecorder() {
  const [view, setView] = useState<'list' | 'new' | 'detail'>('list');
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint | null>(null);

  const handleSelectEndpoint = (ep: Endpoint) => {
    setSelectedEndpoint(ep);
    setView('detail');
  };

  const handleEndpointCreated = (ep: Endpoint) => {
    setSelectedEndpoint(ep);
    setView('detail');
  };

  return (
    <WorkspaceLayout
      actions={
        view !== 'new' && (
          <GlowButton
            variant="primary"
            size="sm"
            onClick={() => setView('new')}
          >
            <Plus className="w-4 h-4" />
            New Endpoint
          </GlowButton>
        )
      }
    >
      <AnimatePresence mode="wait">
        {view === 'list' && (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <EndpointList
              onSelect={handleSelectEndpoint}
              onCreateNew={() => setView('new')}
            />
          </motion.div>
        )}

        {view === 'new' && (
          <motion.div
            key="new"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <NewEndpointPanel
              onCreated={handleEndpointCreated}
              onCancel={() => setView('list')}
            />
          </motion.div>
        )}

        {view === 'detail' && selectedEndpoint && (
          <RequestDetailPanel
            key={selectedEndpoint.id}
            endpoint={selectedEndpoint}
            onBack={() => setView('list')}
          />
        )}
      </AnimatePresence>
    </WorkspaceLayout>
  );
}