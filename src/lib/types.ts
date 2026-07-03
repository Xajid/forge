export type ToolId = 'api-recorder' | 'openapi-mock' | 'prompt-manager' | 'firebase-analyzer' | 'pr-review';

export type ViewType = 'home' | ToolId;

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export interface ToolDef {
  id: ToolId;
  name: string;
  description: string;
  icon: string;
  category: 'ai' | 'utility' | 'testing';
  color: 'blue' | 'purple' | 'cyan';
  shortcut?: string;
}

export interface RecordedRequest {
  id: string;
  endpointId: string;
  method: HttpMethod;
  path: string;
  headers: Record<string, string>;
  query?: Record<string, string>;
  body?: string;
  statusCode?: number;
  responseTime?: number;
  ipAddress?: string;
  createdAt: string;
}

export interface RequestEndpoint {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  requestCount?: number;
}

export interface PromptProject {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  versionCount?: number;
}

export interface PromptVersion {
  id: string;
  projectId: string;
  title: string;
  content: string;
  version: number;
  tags?: string[];
  notes?: string;
  variables?: string[];
  parentId?: string;
  createdAt: string;
}

export interface AiResponse {
  id: string;
  promptVersionId?: string;
  prompt: string;
  response: string;
  model?: string;
  tokens?: number;
  createdAt: string;
}

export interface PrReview {
  id: string;
  title?: string;
  diff: string;
  review?: string;
  model?: string;
  score?: number;
  createdAt: string;
}

export interface OpenApiSpec {
  id: string;
  name: string;
  content: string;
  isActive: boolean;
  createdAt: string;
}

export interface FirebaseReport {
  id: string;
  name: string;
  data: string;
  recommendations?: string;
  createdAt: string;
}

export interface NavItem {
  id: ViewType;
  label: string;
  icon: string;
  shortcut?: string;
}

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  action: () => void;
  category?: string;
  shortcut?: string;
}