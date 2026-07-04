import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as yaml from 'js-yaml';
interface OpenApiEndpoint {
  method: string;
  path: string;
  summary: string;
  operationId?: string;
  tags: string[];
  requestSchema?: Record<string, unknown>;
  responseSchema?: Record<string, unknown>;
  statusCode: number;
}

interface ParsedSpec {
  openapi?: string;
  swagger?: string;
  info?: {
    title?: string;
    version?: string;
    description?: string;
  };
  paths?: Record<string, Record<string, {
    summary?: string;
    operationId?: string;
    tags?: string[];
    parameters?: Array<Record<string, unknown>>;
    requestBody?: Record<string, unknown>;
    responses?: Record<string, Record<string, unknown>>;
  }>>;
  components?: {
    schemas?: Record<string, Record<string, unknown>>;
  };
}

function resolveRef(spec: ParsedSpec, ref: string): Record<string, unknown> | undefined {
  if (!ref.startsWith('#/components/schemas/')) return undefined;
  const schemaName = ref.replace('#/components/schemas/', '');
  return spec.components?.schemas?.[schemaName] as Record<string, unknown> | undefined;
}

function extractSchema(spec: ParsedSpec, schemaObj: Record<string, unknown>): Record<string, unknown> {
  if (schemaObj.$ref) {
    const resolved = resolveRef(spec, schemaObj.$ref as string);
    if (resolved) return resolved;
  }
  // Handle allOf, oneOf, anyOf
  if (schemaObj.allOf) {
    const items = schemaObj.allOf as Record<string, unknown>[];
    const merged: Record<string, unknown> = { type: 'object', properties: {} };
    for (const item of items) {
      const resolved = extractSchema(spec, item);
      if (resolved.properties) {
        Object.assign(merged.properties, resolved.properties);
      }
      if (resolved.required) {
        if (!merged.required) merged.required = [];
        (merged.required as string[]).push(...(resolved.required as string[]));
      }
    }
    return merged;
  }
  return schemaObj;
}

function parseSpec(content: string): { spec: ParsedSpec; endpoints: OpenApiEndpoint[] } {
  let parsed: unknown;

  if (content.trim().startsWith('{')) {
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error('Invalid JSON format');
    }
  } else {
    try {
      parsed = yaml.load(content);
    } catch {
      throw new Error('Invalid YAML format');
    }
  }

  const spec = parsed as ParsedSpec;

  const endpoints: OpenApiEndpoint[] = [];
  const paths = spec.paths || {};

  for (const [path, methods] of Object.entries(paths)) {
    if (!methods || typeof methods !== 'object') continue;

    for (const [method, operation] of Object.entries(methods)) {
      if (['get', 'post', 'put', 'patch', 'delete', 'head', 'options'].includes(method.toLowerCase())) {
        const op = operation as {
          summary?: string;
          operationId?: string;
          tags?: string[];
          responses?: Record<string, Record<string, unknown>>;
          requestBody?: Record<string, unknown>;
        };

        let responseSchema: Record<string, unknown> | undefined;
        let statusCode = 200;

        if (op.responses) {
          const priorityCodes = ['200', '201', '202', '204'];
          let targetCode = priorityCodes.find(code => code in op.responses);
          if (!targetCode) {
            targetCode = Object.keys(op.responses).find(c => c.startsWith('2')) || Object.keys(op.responses)[0];
          }
          if (targetCode) {
            statusCode = parseInt(targetCode, 10) || 200;
            const response = op.responses[targetCode];
            const content2 = response?.content as Record<string, unknown> | undefined;
            if (content2) {
              const jsonContent = content2['application/json'] as Record<string, unknown> | undefined;
              if (jsonContent?.schema) {
                responseSchema = extractSchema(spec, jsonContent.schema as Record<string, unknown>);
              }
            }
          }
        }

        let requestSchema: Record<string, unknown> | undefined;
        if (op.requestBody) {
          const rbc = (op.requestBody as Record<string, unknown>).content as Record<string, unknown> | undefined;
          if (rbc) {
            const jc = rbc['application/json'] as Record<string, unknown> | undefined;
            if (jc?.schema) {
              requestSchema = extractSchema(spec, jc.schema as Record<string, unknown>);
            }
          }
        }

        endpoints.push({
          method: method.toUpperCase(),
          path,
          summary: op.summary || '',
          operationId: op.operationId,
          tags: op.tags || [],
          requestSchema,
          responseSchema,
          statusCode,
        });
      }
    }
  }

  return { spec, endpoints };
}

// GET /api/openapi/specs/[id] - Get spec details with endpoints
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const record = await db.openApiSpec.findUnique({ where: { id } });

    if (!record) {
      return NextResponse.json({ error: 'Spec not found' }, { status: 404 });
    }

    const { spec, endpoints } = parseSpec(record.content);

    return NextResponse.json({
      id: record.id,
      name: record.name,
      info: spec.info || {},
      openApiVersion: spec.openapi || spec.swagger,
      endpoints,
      endpointCount: endpoints.length,
      tags: [...new Set(endpoints.flatMap(e => e.tags))],
      createdAt: record.createdAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch spec';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/openapi/specs/[id] - Delete a spec
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const record = await db.openApiSpec.findUnique({ where: { id } });

    if (!record) {
      return NextResponse.json({ error: 'Spec not found' }, { status: 404 });
    }

    await db.openApiSpec.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete spec' }, { status: 500 });
  }
}