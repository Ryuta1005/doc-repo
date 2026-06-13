export interface DocumentSummaryResponse {
  identifier: string;
  title: string;
}

export interface DocumentDetailResponse {
  identifier: string;
  title: string;
  html: string;
  metadata: Record<string, unknown>;
}

export interface SiteConfigResponse {
  name: string;
}

const ensureOk = async (response: Response): Promise<Response> => {
  if (response.ok) {
    return response;
  }

  const text = await response.text();
  let parsed: { error?: { code?: string; message?: string } } | undefined;
  try {
    parsed = JSON.parse(text) as { error?: { code?: string; message?: string } };
  } catch {
    // Fall through to generic message when payload is not JSON.
  }

  if (parsed?.error?.message) {
    throw new Error(parsed.error.message);
  }

  throw new Error(text || `Request failed with status ${response.status}`);
};

export const fetchDocuments = async (): Promise<DocumentSummaryResponse[]> => {
  const response = await ensureOk(await fetch("/api/documents"));
  return (await response.json()) as DocumentSummaryResponse[];
};

export const fetchSiteConfig = async (): Promise<SiteConfigResponse> => {
  const response = await ensureOk(await fetch("/api/site-config"));
  return (await response.json()) as SiteConfigResponse;
};

export const fetchDocument = async (identifier: string): Promise<DocumentDetailResponse> => {
  const response = await ensureOk(await fetch(`/api/document?path=${encodeURIComponent(identifier)}`));
  return (await response.json()) as DocumentDetailResponse;
};
