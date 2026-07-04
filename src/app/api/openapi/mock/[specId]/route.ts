import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import yaml from 'js-yaml';

// ---- Fake data generators ----

const FIRST_NAMES = ['Alice', 'Bob', 'Charlie', 'Diana', 'Ethan', 'Fiona', 'George', 'Hannah', 'Isaac', 'Julia', 'Kevin', 'Laura', 'Michael', 'Nina', 'Oscar', 'Patricia', 'Quinn', 'Rachel', 'Samuel', 'Tanya'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Wilson', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White'];
const DOMAINS = ['example.com', 'mail.com', 'company.org', 'test.io', 'dev.net', 'api.co'];
const WORDS = ['alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel', 'india', 'juliet', 'kilo', 'lima', 'mike', 'november', 'oscar', 'papa', 'quebec', 'romeo', 'sierra', 'tango', 'uniform', 'victor', 'whiskey', 'xray', 'yankee', 'zulu'];
const CITIES = ['San Francisco', 'New York', 'London', 'Tokyo', 'Berlin', 'Paris', 'Sydney', 'Toronto', 'Singapore', 'Dubai'];
const COMPANIES = ['Acme Corp', 'TechNova', 'DataFlow', 'CloudPeak', 'NexGen', 'VeloCity', 'SynapseAI', 'QuantumBit', 'PrismWorks', 'Stratos'];
const STATUSES = ['active', 'inactive', 'pending', 'completed', 'archived'];
const ROLES = ['admin', 'user', 'editor', 'viewer', 'moderator'];
const COLORS = ['#8b5cf6', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1'];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(): string {
  const start = new Date(2023, 0, 1);
  const end = new Date(2025, 5, 1);
  const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return d.toISOString();
}

function randomBool(): boolean {
  return Math.random() > 0.5;
}

function generateFakeValue(schema: Record<string, unknown>, propName?: string): unknown {
  const type = schema.type as string | undefined;
  const format = schema.format as string | undefined;
  const enumVals = schema.enum as unknown[] | undefined;

  if (enumVals && enumVals.length > 0) {
    return pick(enumVals);
  }

  if (schema.example !== undefined) {
    return schema.example;
  }

  switch (type) {
    case 'string': {
      // Use property name or format to generate contextually relevant data
      if (format === 'email' || propName?.toLowerCase().includes('email')) {
        const first = pick(FIRST_NAMES).toLowerCase();
        const last = pick(LAST_NAMES).toLowerCase();
        return `${first}.${last}@${pick(DOMAINS)}`;
      }
      if (format === 'uri' || format === 'url' || propName?.toLowerCase().includes('url') || propName?.toLowerCase().includes('link') || propName?.toLowerCase().includes('href')) {
        return `https://${pick(COMPANIES).toLowerCase().replace(/\s/g, '')}.${pick(['com', 'io', 'dev'])}/${pick(WORDS)}`;
      }
      if (format === 'uuid' || propName?.toLowerCase().includes('id')) {
        return crypto.randomUUID();
      }
      if (format === 'date') {
        return randomDate().split('T')[0];
      }
      if (format === 'date-time' || propName?.toLowerCase().includes('at') || propName?.toLowerCase().includes('date') || propName?.toLowerCase().includes('time') || propName?.toLowerCase().includes('created') || propName?.toLowerCase().includes('updated')) {
        return randomDate();
      }
      if (format === 'password') return '$2b$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
      if (format === 'byte') return btoa(pick(WORDS));
      if (format === 'binary') return 'data:application/octet-stream;base64,' + btoa('fake-binary-data');

      // Property name heuristics
      const pn = (propName || '').toLowerCase();
      if (pn.includes('name') || pn.includes('title')) return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
      if (pn.includes('first') && pn.includes('name')) return pick(FIRST_NAMES);
      if (pn.includes('last') && pn.includes('name')) return pick(LAST_NAMES);
      if (pn.includes('city')) return pick(CITIES);
      if (pn.includes('company') || pn.includes('organization') || pn.includes('org')) return pick(COMPANIES);
      if (pn.includes('status')) return pick(STATUSES);
      if (pn.includes('role')) return pick(ROLES);
      if (pn.includes('color')) return pick(COLORS);
      if (pn.includes('description') || pn.includes('desc') || pn.includes('bio')) {
        return `${pick(WORDS)} ${pick(WORDS)} ${pick(WORDS)} — a brief ${pick(WORDS)} description for testing.`;
      }
      if (pn.includes('phone') || pn.includes('tel')) return `+1-${randomInt(200, 999)}-${randomInt(200, 999)}-${randomInt(1000, 9999)}`;
      if (pn.includes('zip') || pn.includes('postal')) return `${randomInt(10000, 99999)}`;
      if (pn.includes('country') || pn.includes('nation')) return pick(['USA', 'UK', 'Germany', 'Japan', 'Canada', 'Australia', 'France']);
      if (pn.includes('state') || pn.includes('province')) return pick(['California', 'New York', 'Texas', 'Florida', 'Washington', 'Illinois']);
      if (pn.includes('address') || pn.includes('street')) return `${randomInt(1, 9999)} ${pick(WORDS)} ${pick(['St', 'Ave', 'Blvd', 'Dr', 'Ln'])}`;
      if (pn.includes('username') || pn.includes('user')) return `${pick(FIRST_NAMES).toLowerCase()}${randomInt(100, 999)}`;
      if (pn.includes('token') || pn.includes('key') || pn.includes('secret')) {
        return `sk_${pick(WORDS)}_${crypto.randomUUID().slice(0, 8)}`;
      }
      if (pn.includes('avatar') || pn.includes('image') || pn.includes('logo')) {
        return `https://picsum.photos/seed/${randomInt(1, 100)}/200/200`;
      }
      if (pn.includes('message') || pn.includes('note') || pn.includes('content') || pn.includes('body') || pn.includes('text')) {
        return `This is a generated ${pick(WORDS)} message for testing the ${pick(WORDS)} endpoint.`;
      }

      // Default string
      return pick(WORDS);
    }

    case 'integer':
    case 'number': {
      const min = typeof schema.minimum === 'number' ? schema.minimum : 0;
      const max = typeof schema.maximum === 'number' ? schema.maximum : (type === 'integer' ? 10000 : 1000);

      if (format === 'int64' || propName?.toLowerCase().includes('timestamp') || propName?.toLowerCase().includes('id')) {
        return randomInt(1000000000000, 9999999999999);
      }
      if (format === 'float' || format === 'double' || type === 'number') {
        return parseFloat((Math.random() * (max - min) + min).toFixed(2));
      }
      if (format === 'int32' || type === 'integer') {
        return randomInt(min, max);
      }
      return randomInt(min, max);
    }

    case 'boolean':
      return randomBool();

    case 'array': {
      const items = schema.items as Record<string, unknown> | undefined;
      const minItems = typeof schema.minItems === 'number' ? schema.minItems : 1;
      const maxItems = typeof schema.maxItems === 'number' ? schema.maxItems : Math.min(minItems + 4, 10);
      const count = randomInt(minItems, maxItems);

      if (!items) return Array.from({ length: count }, () => pick(WORDS));

      return Array.from({ length: count }, () => generateFakeValue(items));
    }

    case 'object': {
      const properties = schema.properties as Record<string, Record<string, unknown>> | undefined;
      const required = (schema.required as string[]) || [];

      if (!properties) return {};

      const result: Record<string, unknown> = {};
      for (const [key, propSchema] of Object.entries(properties)) {
        if (required.length === 0 || required.includes(key)) {
          result[key] = generateFakeValue(propSchema, key);
        } else if (randomBool()) {
          result[key] = generateFakeValue(propSchema, key);
        }
      }
      return result;
    }

    default: {
      // If no type but has properties, treat as object
      if (schema.properties) {
        return generateFakeValue({ ...schema, type: 'object' }, propName);
      }
      // If no type but has items, treat as array
      if (schema.items) {
        return generateFakeValue({ ...schema, type: 'array' }, propName);
      }
      return null;
    }
  }
}

// ---- Spec parsing helpers ----

interface ParsedSpec {
  openapi?: string;
  swagger?: string;
  paths?: Record<string, Record<string, Record<string, unknown>>>;
  components?: {
    schemas?: Record<string, Record<string, unknown>>;
  };
}

function resolveRef(spec: ParsedSpec, ref: string): Record<string, unknown> | undefined {
  if (!ref.startsWith('#/components/schemas/')) return undefined;
  const schemaName = ref.replace('#/components/schemas/', '');
  return spec.components?.schemas?.[schemaName] as Record<string, unknown> | undefined;
}

function extractSchema(spec: ParsedSpec, schemaObj: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!schemaObj) return undefined;
  if (schemaObj.$ref) {
    const resolved = resolveRef(spec, schemaObj.$ref as string);
    if (resolved) return resolved;
  }
  if (schemaObj.allOf) {
    const items = schemaObj.allOf as Record<string, unknown>[];
    const merged: Record<string, unknown> = { type: 'object', properties: {} };
    for (const item of items) {
      const resolved = extractSchema(spec, item);
      if (resolved?.properties) {
        Object.assign(merged.properties as Record<string, unknown>, resolved.properties);
      }
      if (resolved?.required) {
        if (!merged.required) merged.required = [];
        (merged.required as string[]).push(...(resolved.required as string[]));
      }
    }
    return merged;
  }
  return schemaObj;
}

function parseSpec(content: string): ParsedSpec {
  let parsed: unknown;
  if (content.trim().startsWith('{')) {
    parsed = JSON.parse(content);
  } else {
    parsed = yaml.load(content);
  }
  return parsed as ParsedSpec;
}

function matchPath(specPath: string, requestPath: string): boolean {
  // Convert OpenAPI path params {param} to regex
  const regexStr = '^' + specPath.replace(/\{[^}]+\}/g, '[^/]+') + '$';
  return new RegExp(regexStr).test(requestPath);
}

// POST /api/openapi/mock/[specId] - Mock request handler
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ specId: string }> }
) {
  try {
    const { specId } = await params;
    const record = await db.openApiSpec.findUnique({ where: { id: specId } });

    if (!record) {
      return NextResponse.json({ error: 'Spec not found' }, { status: 404 });
    }

    const body = await request.json();
    const { method, path } = body;

    if (!method || !path) {
      return NextResponse.json(
        { error: 'Method and path are required' },
        { status: 400 }
      );
    }

    const spec = parseSpec(record.content);
    const paths = spec.paths || {};
    const normalizedMethod = method.toUpperCase();

    // Find matching endpoint
    let matchedPath: string | null = null;
    let matchedOperation: Record<string, unknown> | null = null;
    let matchedMethod: string | null = null;

    for (const [specPath, methods] of Object.entries(paths)) {
      if (matchPath(specPath, path)) {
        for (const [m, operation] of Object.entries(methods)) {
          if (m.toUpperCase() === normalizedMethod) {
            matchedPath = specPath;
            matchedOperation = operation;
            matchedMethod = normalizedMethod;
            break;
          }
        }
        if (matchedOperation) break;
      }
    }

    if (!matchedOperation || !matchedPath) {
      return NextResponse.json(
        {
          error: 'No matching endpoint found',
          hint: `Checked ${normalizedMethod} ${path} against spec paths`,
        },
        { status: 404 }
      );
    }

    // Extract response schema
    let responseSchema: Record<string, unknown> | undefined;
    let statusCode = 200;

    const responses = matchedOperation.responses as Record<string, Record<string, unknown>> | undefined;
    if (responses) {
      const priorityCodes = ['200', '201', '202', '204'];
      let targetCode = priorityCodes.find(code => code in responses);
      if (!targetCode) {
        targetCode = Object.keys(responses).find(c => c.startsWith('2')) || Object.keys(responses)[0];
      }
      if (targetCode) {
        statusCode = parseInt(targetCode, 10) || 200;
        const response = responses[targetCode];
        const content = response?.content as Record<string, unknown> | undefined;
        if (content) {
          const jsonContent = content['application/json'] as Record<string, unknown> | undefined;
          if (jsonContent?.schema) {
            responseSchema = extractSchema(spec, jsonContent.schema as Record<string, unknown>);
          }
        }
      }
    }

    // Generate mock data
    let mockData: unknown;
    if (responseSchema) {
      mockData = generateFakeValue(responseSchema);
    } else {
      // No schema found, return a generic success response
      mockData = {
        message: 'Mock response generated successfully',
        method: matchedMethod,
        path: matchedPath,
        timestamp: new Date().toISOString(),
      };
    }

    return NextResponse.json({
      statusCode,
      headers: {
        'Content-Type': 'application/json',
        'X-Mock-Server': 'Forge',
        'X-Request-Id': crypto.randomUUID(),
      },
      body: mockData,
      meta: {
        endpoint: matchedPath,
        method: matchedMethod,
        summary: (matchedOperation.summary as string) || '',
        operationId: (matchedOperation.operationId as string) || undefined,
        tags: (matchedOperation.tags as string[]) || [],
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate mock response';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}