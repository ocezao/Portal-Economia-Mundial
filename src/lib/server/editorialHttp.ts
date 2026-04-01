import { randomUUID } from 'crypto';

interface EditorialResponseMeta {
  requestId: string;
  timestamp: string;
  version: string;
}

interface EditorialSuccessEnvelope<T> {
  ok: true;
  data: T;
  meta: EditorialResponseMeta;
}

interface EditorialErrorEnvelope {
  ok: false;
  error: {
    message: string;
    code: string;
    details?: unknown;
  };
  meta: EditorialResponseMeta;
}

function buildMeta(): EditorialResponseMeta {
  return {
    requestId: randomUUID(),
    timestamp: new Date().toISOString(),
    version: '1.1.0',
  };
}

export function editorialSuccess<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify({
    ok: true,
    data,
    meta: buildMeta(),
  } satisfies EditorialSuccessEnvelope<T>), {
    status,
    headers: {
      'content-type': 'application/json',
    },
  });
}

export function editorialError(
  message: string,
  status = 500,
  options?: { code?: string; details?: unknown },
): Response {
  return new Response(JSON.stringify({
    ok: false,
    error: {
      message,
      code: options?.code ?? 'EDITORIAL_ERROR',
      ...(options?.details !== undefined ? { details: options.details } : {}),
    },
    meta: buildMeta(),
  } satisfies EditorialErrorEnvelope), {
    status,
    headers: {
      'content-type': 'application/json',
    },
  });
}

export function mapEditorialError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Erro interno do servidor';

  if (message === 'Artigo nao encontrado') {
    return { message, status: 404, code: 'NOT_FOUND' };
  }

  if (message === 'Fluxo editorial exige criacao inicial como draft') {
    return { message, status: 409, code: 'WORKFLOW_CONFLICT' };
  }

  if (
    message === 'Artigo ainda nao pode ser aprovado; execute validate e corrija os erros pendentes' ||
    message === 'Artigo nao esta apto para publicacao; execute validate e corrija os erros antes de publicar ou agendar'
  ) {
    return { message, status: 409, code: 'VALIDATION_REQUIRED' };
  }

  return { message, status: 500, code: 'EDITORIAL_ERROR' };
}
