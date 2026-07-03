'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WorkspaceLayout } from '@/components/layout/WorkspaceLayout';
import { GlassCard } from '@/components/forge/GlassCard';
import { GlowButton } from '@/components/forge/GlowButton';
import { MethodBadge, StatusBadge, ForgeBadge } from '@/components/forge/ForgeBadge';
import { CodeViewer } from '@/components/forge/CodeViewer';
import { EmptyState } from '@/components/forge/EmptyState';
import { AnimatedInput, AnimatedTextarea } from '@/components/forge/AnimatedInput';
import { Shimmer, ShimmerCard } from '@/components/forge/Shimmer';
import { GradientBorder } from '@/components/forge/GradientBorder';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Upload,
  FileText,
  Trash2,
  Play,
  Server,
  Clock,
  ArrowRight,
  Copy,
  Check,
  FileUp,
  X,
  ChevronRight,
  Zap,
  List,
  FileCode,
  Send,
  RefreshCw,
  Link2,
  Layers,
} from 'lucide-react';

// ---- Types ----

interface SpecSummary {
  id: string;
  name: string;
  isActive: boolean;
  endpointCount: number;
  createdAt: string;
}

interface Endpoint {
  method: string;
  path: string;
  summary: string;
  operationId?: string;
  tags: string[];
  requestSchema?: Record<string, unknown>;
  responseSchema?: Record<string, unknown>;
  statusCode: number;
}

interface SpecDetail extends SpecSummary {
  info: { title?: string; version?: string; description?: string };
  openApiVersion?: string;
  endpoints: Endpoint[];
  tags: string[];
}

interface MockResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: unknown;
  meta: {
    endpoint: string;
    method: string;
    summary: string;
    operationId?: string;
    tags: string[];
  };
}

interface RequestLogEntry {
  id: string;
  specId: string;
  specName: string;
  method: string;
  path: string;
  statusCode: number;
  timestamp: string;
  duration: number;
}

// ---- Sample spec for quick start ----

const SAMPLE_SPEC = `openapi: 3.0.3
info:
  title: Pet Store API
  version: 1.0.0
  description: A sample Pet Store API for testing the OpenAPI Mock Server
paths:
  /pets:
    get:
      summary: List all pets
      operationId: listPets
      tags:
        - Pets
      parameters:
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
        - name: offset
          in: query
          schema:
            type: integer
            default: 0
      responses:
        '200':
          description: A list of pets
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/Pet'
                  total:
                    type: integer
                  limit:
                    type: integer
                  offset:
                    type: integer
    post:
      summary: Create a pet
      operationId: createPet
      tags:
        - Pets
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreatePetInput'
      responses:
        '201':
          description: Pet created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Pet'
  /pets/{petId}:
    get:
      summary: Get a pet by ID
      operationId: getPetById
      tags:
        - Pets
      parameters:
        - name: petId
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: A pet
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Pet'
        '404':
          description: Pet not found
    delete:
      summary: Delete a pet
      operationId: deletePet
      tags:
        - Pets
      parameters:
        - name: petId
          in: path
          required: true
          schema:
            type: string
      responses:
        '204':
          description: Pet deleted
  /users:
    get:
      summary: List all users
      operationId: listUsers
      tags:
        - Users
      responses:
        '200':
          description: A list of users
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/User'
                  total:
                    type: integer
    post:
      summary: Create a user
      operationId: createUser
      tags:
        - Users
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateUserInput'
      responses:
        '201':
          description: User created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
  /users/{userId}:
    get:
      summary: Get user by ID
      operationId: getUserById
      tags:
        - Users
      parameters:
        - name: userId
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: A user
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
components:
  schemas:
    Pet:
      type: object
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
        species:
          type: string
          enum: [dog, cat, bird, fish, hamster, rabbit]
        breed:
          type: string
        age:
          type: integer
        status:
          type: string
          enum: [available, pending, sold]
        owner:
          type: object
          properties:
            id:
              type: string
            name:
              type: string
            email:
              type: string
              format: email
        tags:
          type: array
          items:
            type: string
        createdAt:
          type: string
          format: date-time
        imageUrl:
          type: string
          format: uri
    CreatePetInput:
      type: object
      required:
        - name
        - species
      properties:
        name:
          type: string
        species:
          type: string
          enum: [dog, cat, bird, fish, hamster, rabbit]
        breed:
          type: string
        age:
          type: integer
    User:
      type: object
      properties:
        id:
          type: string
          format: uuid
        username:
          type: string
        email:
          type: string
          format: email
        firstName:
          type: string
        lastName:
          type: string
        role:
          type: string
          enum: [admin, user, editor, viewer]
        avatar:
          type: string
          format: uri
        isActive:
          type: boolean
        createdAt:
          type: string
          format: date-time
        lastLoginAt:
          type: string
          format: date-time
    CreateUserInput:
      type: object
      required:
        - username
        - email
        - password
      properties:
        username:
          type: string
        email:
          type: string
          format: email
        password:
          type: string
          format: password
        firstName:
          type: string
        lastName:
          type: string
        role:
          type: string
          enum: [admin, user, editor, viewer]
`;

// ---- Main Component ----

export default function OpenApiMock() {
  // State
  const [specs, setSpecs] = useState<SpecSummary[]>([]);
  const [selectedSpec, setSelectedSpec] = useState<SpecDetail | null>(null);
  const [specName, setSpecName] = useState('');
  const [specContent, setSpecContent] = useState('');
  const [loadingSpecs, setLoadingSpecs] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [mocking, setMocking] = useState<string | null>(null);
  const [mockResponse, setMockResponse] = useState<MockResponse | null>(null);
  const [requestLog, setRequestLog] = useState<RequestLogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'upload' | 'specs' | 'detail'>('upload');
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch specs on mount
  const fetchSpecs = useCallback(async () => {
    setLoadingSpecs(true);
    try {
      const res = await fetch('/api/openapi/specs');
      const data = await res.json();
      setSpecs(data);
    } catch {
      setError('Failed to fetch specs');
    } finally {
      setLoadingSpecs(false);
    }
  }, []);

  useEffect(() => {
    fetchSpecs();
  }, [fetchSpecs]);

  // Upload spec
  const handleUpload = async () => {
    if (!specName.trim() || !specContent.trim()) {
      setError('Name and content are required');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const res = await fetch('/api/openapi/specs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: specName.trim(), content: specContent.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to upload spec');
        return;
      }

      setSpecName('');
      setSpecContent('');
      await fetchSpecs();

      // Auto-select the newly uploaded spec
      await handleSelectSpec(data.id);
    } catch {
      setError('Failed to upload spec');
    } finally {
      setUploading(false);
    }
  };

  // Load sample spec
  const loadSample = () => {
    setSpecName('Pet Store API');
    setSpecContent(SAMPLE_SPEC);
    setActiveView('upload');
  };

  // Select a spec
  const handleSelectSpec = async (id: string) => {
    setMockResponse(null);
    setExpandedEndpoint(null);
    try {
      const res = await fetch(`/api/openapi/specs/${id}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to load spec');
        return;
      }

      setSelectedSpec(data);
      setActiveView('detail');
    } catch {
      setError('Failed to load spec');
    }
  };

  // Delete a spec
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/openapi/specs/${id}`, { method: 'DELETE' });
      if (selectedSpec?.id === id) {
        setSelectedSpec(null);
        setMockResponse(null);
        setActiveView('specs');
      }
      await fetchSpecs();
    } catch {
      setError('Failed to delete spec');
    }
  };

  // Test/mock an endpoint
  const handleMock = async (endpoint: Endpoint) => {
    if (!selectedSpec) return;

    const endpointKey = `${endpoint.method}:${endpoint.path}`;
    setMocking(endpointKey);
    setExpandedEndpoint(endpointKey);

    const startTime = Date.now();

    try {
      const res = await fetch(`/api/openapi/mock/${selectedSpec.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: endpoint.method, path: endpoint.path }),
      });

      const data = await res.json();
      const duration = Date.now() - startTime;

      if (!res.ok) {
        setError(data.error || 'Failed to generate mock');
        setMocking(null);
        return;
      }

      setMockResponse(data);
      setError(null);

      // Add to request log
      const logEntry: RequestLogEntry = {
        id: crypto.randomUUID(),
        specId: selectedSpec.id,
        specName: selectedSpec.name,
        method: endpoint.method,
        path: endpoint.path,
        statusCode: data.statusCode,
        timestamp: new Date().toISOString(),
        duration,
      };
      setRequestLog(prev => [logEntry, ...prev].slice(0, 50));
    } catch {
      setError('Failed to generate mock response');
    } finally {
      setMocking(null);
    }
  };

  // File handling
  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setSpecContent(content);
      if (!specName) {
        setSpecName(file.name.replace(/\.(yaml|yml|json)$/, ''));
      }
      setActiveView('upload');
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Group endpoints by tag
  const getGroupedEndpoints = () => {
    if (!selectedSpec?.endpoints) return {};
    const groups: Record<string, Endpoint[]> = {};
    for (const ep of selectedSpec.endpoints) {
      const tag = ep.tags?.[0] || 'Default';
      if (!groups[tag]) groups[tag] = [];
      groups[tag].push(ep);
    }
    return groups;
  };

  const groupedEndpoints = getGroupedEndpoints();

  return (
    <WorkspaceLayout>
      <div className="flex flex-col gap-6">
        {/* Error toast */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
            >
              <span>{error}</span>
              <button onClick={() => setError(null)} className="shrink-0 hover:text-red-300">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload View */}
        <AnimatePresence mode="wait">
          {activeView === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex flex-col gap-6"
            >
              <GradientBorder color="cyan">
                <GlassCard className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <FileCode className="w-5 h-5 text-[#22d3ee]" />
                    <h2 className="text-sm font-medium text-[#f0f0f5]">Upload OpenAPI Spec</h2>
                  </div>

                  {/* Name input */}
                  <div className="mb-4">
                    <label className="block text-xs text-[#55556a] mb-1.5 font-medium">Spec Name</label>
                    <AnimatedInput
                      placeholder="e.g., Pet Store API"
                      value={specName}
                      onChange={(e) => setSpecName(e.target.value)}
                      icon={<FileText className="w-4 h-4" />}
                    />
                  </div>

                  {/* Textarea for spec content */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs text-[#55556a] font-medium">Spec Content (YAML or JSON)</label>
                      <button
                        onClick={loadSample}
                        className="text-xs text-[#22d3ee] hover:text-[#67e8f9] transition-colors flex items-center gap-1"
                      >
                        <Zap className="w-3 h-3" />
                        Load sample
                      </button>
                    </div>
                    <AnimatedTextarea
                      placeholder="Paste your OpenAPI 3.0 or Swagger 2.0 spec here..."
                      value={specContent}
                      onChange={(e) => setSpecContent(e.target.value)}
                      size="lg"
                      className="min-h-[260px] font-mono text-xs"
                    />
                  </div>

                  {/* Drop zone */}
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={`relative mb-4 flex flex-col items-center justify-center gap-2 py-8 rounded-lg border-2 border-dashed transition-colors cursor-pointer ${
                      isDragOver
                        ? 'border-[#22d3ee]/50 bg-[#22d3ee]/5'
                        : 'border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)]'
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".yaml,.yml,.json"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFile(file);
                        e.target.value = '';
                      }}
                    />
                    <FileUp className={`w-6 h-6 ${isDragOver ? 'text-[#22d3ee]' : 'text-[#55556a]'}`} />
                    <p className="text-xs text-[#55556a]">
                      {isDragOver ? 'Drop your file here' : 'Or drag & drop a .yaml / .json file'}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setActiveView('specs')}
                      className="text-sm text-[#55556a] hover:text-[#8888a0] transition-colors"
                    >
                      ← Back to specs
                    </button>
                    <GlowButton
                      onClick={handleUpload}
                      disabled={!specName.trim() || !specContent.trim() || uploading}
                      size="lg"
                    >
                      {uploading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Parsing...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Upload & Parse
                        </>
                      )}
                    </GlowButton>
                  </div>
                </GlassCard>
              </GradientBorder>
            </motion.div>
          )}

          {/* Specs List View */}
          {activeView === 'specs' && (
            <motion.div
              key="specs"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex flex-col gap-6"
            >
              {/* Header actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-medium text-[#8888a0]">Your Specs</h2>
                  {specs.length > 0 && (
                    <ForgeBadge variant="cyan">{specs.length}</ForgeBadge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <GlowButton variant="ghost" size="sm" onClick={loadSample}>
                    <Zap className="w-3.5 h-3.5" />
                    Load Sample
                  </GlowButton>
                  <GlowButton size="sm" onClick={() => setActiveView('upload')}>
                    <Upload className="w-3.5 h-3.5" />
                    Upload Spec
                  </GlowButton>
                </div>
              </div>

              {/* Loading */}
              {loadingSpecs && (
                <div className="space-y-3">
                  <ShimmerCard />
                  <ShimmerCard />
                </div>
              )}

              {/* Empty state */}
              {!loadingSpecs && specs.length === 0 && (
                <EmptyState
                  icon={<Server className="w-12 h-12" />}
                  title="No specs uploaded yet"
                  description="Upload an OpenAPI spec to start generating mock endpoints with realistic fake data."
                  action={
                    <div className="flex items-center gap-2">
                      <GlowButton variant="secondary" onClick={loadSample}>
                        <Zap className="w-4 h-4" />
                        Try Sample Spec
                      </GlowButton>
                      <GlowButton onClick={() => setActiveView('upload')}>
                        <Upload className="w-4 h-4" />
                        Upload Spec
                      </GlowButton>
                    </div>
                  }
                />
              )}

              {/* Spec cards */}
              {!loadingSpecs && specs.length > 0 && (
                <div className="grid gap-3">
                  {specs.map((spec, i) => (
                    <motion.div
                      key={spec.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <GlassCard
                        hover
                        glow="cyan"
                        onClick={() => handleSelectSpec(spec.id)}
                        className="p-4 flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-lg bg-[rgba(6,182,212,0.1)] border border-[rgba(6,182,212,0.2)] flex items-center justify-center shrink-0">
                            <FileCode className="w-5 h-5 text-[#22d3ee]" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-sm font-medium text-[#f0f0f5] truncate">{spec.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <ForgeBadge variant="default">
                                <Layers className="w-3 h-3" />
                                {spec.endpointCount} endpoints
                              </ForgeBadge>
                              <span className="text-xs text-[#44445a]">
                                {new Date(spec.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <GlowButton
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-[#55556a] hover:text-red-400"
                            onClick={(e) => handleDelete(spec.id, e)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </GlowButton>
                          <ChevronRight className="w-4 h-4 text-[#44445a]" />
                        </div>
                      </GlassCard>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Spec Detail View */}
          {activeView === 'detail' && selectedSpec && (
            <motion.div
              key="detail"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex flex-col gap-6"
            >
              {/* Spec info header */}
              <GlassCard className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[rgba(6,182,212,0.1)] border border-[rgba(6,182,212,0.2)] flex items-center justify-center shrink-0 mt-0.5">
                      <FileCode className="w-5 h-5 text-[#22d3ee]" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-[#f0f0f5]">{selectedSpec.name}</h2>
                      {selectedSpec.info?.title && selectedSpec.info.title !== selectedSpec.name && (
                        <p className="text-sm text-[#8888a0] mt-0.5">{selectedSpec.info.title}</p>
                      )}
                      {selectedSpec.info?.description && (
                        <p className="text-xs text-[#55556a] mt-1 max-w-xl">{selectedSpec.info.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {selectedSpec.openApiVersion && (
                          <ForgeBadge variant="cyan">v{selectedSpec.openApiVersion}</ForgeBadge>
                        )}
                        <ForgeBadge variant="default">
                          <List className="w-3 h-3" />
                          {selectedSpec.endpoints.length} endpoints
                        </ForgeBadge>
                        {selectedSpec.info?.version && (
                          <ForgeBadge variant="purple">API v{selectedSpec.info.version}</ForgeBadge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <GlowButton
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        copyToClipboard(selectedSpec.id, 'spec-id');
                      }}
                    >
                      <Link2 className="w-3.5 h-3.5" />
                      {copiedId === 'spec-id' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </GlowButton>
                    <GlowButton
                      variant="secondary"
                      size="sm"
                      onClick={() => setActiveView('upload')}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      New
                    </GlowButton>
                  </div>
                </div>
              </GlassCard>

              {/* Tabs: Endpoints | Mock Response | Request Log */}
              <Tabs defaultValue="endpoints" className="w-full">
                <TabsList className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)]">
                  <TabsTrigger value="endpoints" className="text-xs gap-1.5 data-[state=active]:text-[#22d3ee] data-[state=active]:bg-[rgba(6,182,212,0.08)]">
                    <List className="w-3.5 h-3.5" />
                    Endpoints
                  </TabsTrigger>
                  <TabsTrigger value="response" className="text-xs gap-1.5 data-[state=active]:text-[#22d3ee] data-[state=active]:bg-[rgba(6,182,212,0.08)]">
                    <Send className="w-3.5 h-3.5" />
                    Mock Response
                    {mockResponse && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#22d3ee]" />
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="log" className="text-xs gap-1.5 data-[state=active]:text-[#22d3ee] data-[state=active]:bg-[rgba(6,182,212,0.08)]">
                    <Clock className="w-3.5 h-3.5" />
                    History
                    {requestLog.length > 0 && (
                      <ForgeBadge variant="cyan" className="ml-1">{requestLog.length}</ForgeBadge>
                    )}
                  </TabsTrigger>
                </TabsList>

                {/* Endpoints Tab */}
                <TabsContent value="endpoints">
                  <ScrollArea className="max-h-[60vh]">
                    <div className="flex flex-col gap-4 pr-4">
                      {Object.entries(groupedEndpoints).map(([tag, endpoints]) => (
                        <div key={tag}>
                          <h3 className="text-xs font-medium text-[#55556a] uppercase tracking-wider mb-2 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#22d3ee]/50" />
                            {tag}
                            <ForgeBadge variant="default">{endpoints.length}</ForgeBadge>
                          </h3>
                          <div className="flex flex-col gap-2">
                            {endpoints.map((ep) => {
                              const key = `${ep.method}:${ep.path}`;
                              const isExpanded = expandedEndpoint === key;
                              const isLoading = mocking === key;

                              return (
                                <motion.div key={key}>
                                  <GlassCard
                                    hover
                                    glow="none"
                                    className={`p-3 transition-all ${
                                      isExpanded ? 'border-[rgba(6,182,212,0.2)]' : ''
                                    }`}
                                    onClick={() => {
                                      if (!isExpanded) handleMock(ep);
                                    }}
                                  >
                                    <div className="flex items-center justify-between gap-3">
                                      <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <MethodBadge method={ep.method} />
                                        <code className="text-sm text-[#c0c0d0] font-mono truncate">
                                          {ep.path}
                                        </code>
                                      </div>
                                      <div className="flex items-center gap-2 shrink-0">
                                        {ep.summary && (
                                          <span className="text-xs text-[#55556a] hidden sm:block max-w-[200px] truncate">
                                            {ep.summary}
                                          </span>
                                        )}
                                        {isLoading ? (
                                          <div className="w-6 h-6 flex items-center justify-center">
                                            <RefreshCw className="w-4 h-4 animate-spin text-[#22d3ee]" />
                                          </div>
                                        ) : (
                                          <GlowButton
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 text-xs gap-1 text-[#22d3ee] hover:text-[#67e8f9]"
                                          >
                                            <Play className="w-3 h-3" />
                                            Mock
                                          </GlowButton>
                                        )}
                                      </div>
                                    </div>
                                    {ep.summary && (
                                      <p className="text-xs text-[#55556a] mt-1.5 ml-[68px] sm:hidden">
                                        {ep.summary}
                                      </p>
                                    )}
                                  </GlassCard>
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                {/* Mock Response Tab */}
                <TabsContent value="response">
                  <AnimatePresence mode="wait">
                    {mockResponse ? (
                      <motion.div
                        key="response"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col gap-4"
                      >
                        {/* Response meta */}
                        <GlassCard className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <MethodBadge method={mockResponse.meta.method} />
                              <code className="text-sm text-[#c0c0d0] font-mono">{mockResponse.meta.endpoint}</code>
                              <StatusBadge status={mockResponse.statusCode} />
                            </div>
                            <div className="flex items-center gap-2">
                              {mockResponse.meta.summary && (
                                <span className="text-xs text-[#55556a] hidden md:block">{mockResponse.meta.summary}</span>
                              )}
                              <GlowButton
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  copyToClipboard(JSON.stringify(mockResponse.body, null, 2), 'mock-response');
                                }}
                              >
                                {copiedId === 'mock-response' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                Copy
                              </GlowButton>
                            </div>
                          </div>

                          {/* Headers */}
                          <div className="mb-3">
                            <h4 className="text-xs font-medium text-[#55556a] mb-1.5">Response Headers</h4>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(mockResponse.headers).map(([key, value]) => (
                                <ForgeBadge key={key} variant="default" className="font-mono text-[10px]">
                                  {key}: {value}
                                </ForgeBadge>
                              ))}
                            </div>
                          </div>
                        </GlassCard>

                        {/* Response body */}
                        <CodeViewer
                          code={JSON.stringify(mockResponse.body, null, 2)}
                          language="json"
                          filename="response.json"
                          className="max-h-[50vh]"
                        />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <EmptyState
                          icon={<Send className="w-10 h-10" />}
                          title="No mock response yet"
                          description="Click the Mock button on any endpoint to generate a realistic fake response based on the schema."
                          action={
                            <GlowButton variant="secondary" size="sm" onClick={() => {}}>
                              <ArrowRight className="w-4 h-4" />
                              Select an endpoint above
                            </GlowButton>
                          }
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </TabsContent>

                {/* Request Log Tab */}
                <TabsContent value="log">
                  {requestLog.length === 0 ? (
                    <EmptyState
                      icon={<Clock className="w-10 h-10" />}
                      title="No requests logged"
                      description="Mock requests will appear here as you test endpoints."
                    />
                  ) : (
                    <ScrollArea className="max-h-[60vh]">
                      <div className="flex flex-col gap-1 pr-4">
                        {requestLog.map((entry, i) => (
                          <motion.div
                            key={entry.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-[rgba(255,255,255,0.02)] transition-colors group"
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <MethodBadge method={entry.method} />
                              <code className="text-xs text-[#8888a0] font-mono truncate">{entry.path}</code>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <StatusBadge status={entry.statusCode} />
                              <span className="text-xs text-[#44445a] w-16 text-right">{entry.duration}ms</span>
                              <span className="text-xs text-[#44445a] w-20 text-right hidden sm:block">
                                {new Date(entry.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </WorkspaceLayout>
  );
}