import { ToolDef, ToolId } from './types';

export const TOOLS: ToolDef[] = [
  {
    id: 'api-recorder',
    name: 'API Request Recorder',
    description: 'Receive and inspect HTTP requests through unique endpoints. Log headers, body, and metadata.',
    icon: 'Radio',
    category: 'testing',
    color: 'blue',
  },
  {
    id: 'openapi-mock',
    name: 'OpenAPI Mock Server',
    description: 'Upload an OpenAPI spec and get instant mock endpoints with realistic fake data.',
    icon: 'Server',
    category: 'testing',
    color: 'cyan',
  },
  {
    id: 'prompt-manager',
    name: 'AI Prompt Version Manager',
    description: 'Git-like version control for your AI prompts. Compare, rollback, and track changes.',
    icon: 'GitBranch',
    category: 'ai',
    color: 'purple',
  },
  {
    id: 'firebase-analyzer',
    name: 'Firebase Cost Analyzer',
    description: 'Analyze Firebase usage patterns and identify unnecessary costs with AI recommendations.',
    icon: 'Flame',
    category: 'ai',
    color: 'cyan',
  },
  {
    id: 'pr-review',
    name: 'PR Review Assistant',
    description: 'Paste a Git diff and get an AI-powered code review with bug detection and suggestions.',
    icon: 'CodeReview',
    category: 'ai',
    color: 'purple',
  },
];

export function getTool(id: ToolId): ToolDef | undefined {
  return TOOLS.find(t => t.id === id);
}

export function getToolsByCategory(category: ToolDef['category']): ToolDef[] {
  return TOOLS.filter(t => t.category === category);
}

export const TOOL_COLORS = {
  blue: {
    bg: 'rgba(59, 130, 246, 0.1)',
    border: 'rgba(59, 130, 246, 0.2)',
    text: '#60a5fa',
    glow: 'rgba(59, 130, 246, 0.15)',
  },
  purple: {
    bg: 'rgba(139, 92, 246, 0.1)',
    border: 'rgba(139, 92, 246, 0.2)',
    text: '#a78bfa',
    glow: 'rgba(139, 92, 246, 0.15)',
  },
  cyan: {
    bg: 'rgba(6, 182, 212, 0.1)',
    border: 'rgba(6, 182, 212, 0.2)',
    text: '#22d3ee',
    glow: 'rgba(6, 182, 212, 0.15)',
  },
} as const;