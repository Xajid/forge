import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import yaml from 'js-yaml';

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

function extractSchemaFromResponse(
  spec: ParsedSpec,
  responses: Record<string, Record<string, unknown>>
): { schema: Record<string, unknown> | undefined; statusCode: number } {
  // Try 200, then 201, then first 2xx
  const priorityCodes = ['200', '201', '202', '204'];
  let targetCode = priorityCodes.find(code => code in responses);

  if (!targetCode) {
    const first2xx = Object.keys(responses).find(code => code.startsWith('2'));
    targetCode = first2xx || Object.keys(responses)[0];
  }

  if (!targetCode) return { schema: undefined, statusCode: 200 };

  const response = responses[targetCode];
  const statusCode = parseInt(targetCode, 10) || 200;

  // Navigate content -> application/json -> schema
  const content = response?.content as Record<string, unknown> | undefined;
  if (content) {
    const jsonContent = content['application/json'] as Record<string, unknown> | undefined;
    if (jsonContent?.schema) {
      let schema = jsonContent.schema as Record<string, unknown>;
      if (schema.$ref) {
        const resolved = resolveRef(spec, schema.$ref as string);
        if (resolved) schema = resolved;
      }
      return { schema, statusCode };
    }
  }

  // Fallback: check for schema directly
  if (response?.schema) {
    let schema = response.schema as Record<string, unknown>;
    if (schema.$ref) {
      const resolved = resolveRef(spec, schema.$ref as string);
      if (resolved) schema = resolved;
    }
    return { schema, statusCode };
  }

  return { schema: undefined, statusCode };
}

function extractRequestBodySchema(
  spec: ParsedSpec,
  requestBody: Record<string, unknown>
): Record<string, unknown> | undefined {
  const content = requestBody?.content as Record<string, unknown> | undefined;
  if (!content) return undefined;

  const jsonContent = content['application/json'] as Record<string, unknown> | undefined;
  if (!jsonContent?.schema) return undefined;

  let schema = jsonContent.schema as Record<string, unknown>;
  if (schema.$ref) {
    const resolved = resolveRef(spec, schema.$ref as string);
    if (resolved) schema = resolved;
  }
  return schema;
}

function parseSpec(content: string): { spec: ParsedSpec; endpoints: OpenApiEndpoint[] } {
  let parsed: unknown;

  // Try JSON first
  if (content.trim().startsWith('{')) {
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error('Invalid JSON format');
    }
  } else {
    // Try YAML
    try {
      parsed = yaml.load(content);
    } catch {
      throw new Error('Invalid YAML format');
    }
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Invalid OpenAPI spec: must be an object');
  }

  const spec = parsed as ParsedSpec;

  if (!spec.openapi && !spec.swagger) {
    throw new Error('Invalid OpenAPI spec: missing openapi or swagger version');
  }

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

        const { schema: responseSchema, statusCode } = op.responses
          ? extractSchemaFromResponse(spec, op.responses)
          : { schema: undefined, statusCode: 200 };

        const requestSchema = op.requestBody
          ? extractRequestBodySchema(spec, op.requestBody)
          : undefined;

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

// POST /api/openapi/specs - Upload and parse an OpenAPI spec
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, content } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    const { spec, endpoints } = parseSpec(content);

    // Store in database
    const record = await db.openApiSpec.create({
      data: {
        name,
        content,
        isActive: true,
      },
    });

    return NextResponse.json({
      id: record.id,
      name: record.name,
      info: spec.info || {},
      openApiVersion: spec.openapi || spec.swagger,
      endpoints,
      endpointCount: endpoints.length,
      createdAt: record.createdAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to parse spec';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// GET /api/openapi/specs - List all specs
export async function GET() {
  try {
    const specs = await db.openApiSpec.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Parse endpoint counts for each spec
    const result = await Promise.all(
      specs.map(async (spec) => {
        let endpointCount = 0;
        try {
          const { endpoints } = parseSpec(spec.content);
          endpointCount = endpoints.length;
        } catch {
          // If parsing fails, show 0
        }

        return {
          id: spec.id,
          name: spec.name,
          isActive: spec.isActive,
          endpointCount,
          createdAt: spec.createdAt,
        };
      })
    );

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch specs' },
      { status: 500 }
    );
  }
}