export interface DocumentSummaryResponse {
  identifier: string;
  title: string;
}

export interface DocumentDetailResponse {
  identifier: string;
  title: string;
  html: string;
  markdown: string;
  metadata: Record<string, unknown>;
}

export interface SaveDocumentRequest {
  identifier: string;
  markdownContent: string;
  options: {
    newlineStyle: "lf" | "crlf";
    hasTrailingNewline: boolean;
  };
  proceed?: boolean;
}

export interface SaveWarningResponse {
  status: "warning";
  warnings: Array<{ code: "UNSUPPORTED_SEGMENT_DETECTED"; message: string }>;
  allowProceed: true;
}

export interface SaveSuccessResponse {
  status: "saved";
  savedDocument: { identifier: string };
  warnings: Array<{ code: "UNSUPPORTED_SEGMENT_DETECTED"; message: string }>;
}

export interface SaveFailureResponse {
  status: "failed";
  error: {
    category: "invalid-target" | "unwritable-target" | "transient-io";
    code: "SAVE_TARGET_INVALID" | "SAVE_TARGET_UNWRITABLE" | "SAVE_IO_TEMPORARY";
    message: string;
    retryable: boolean;
  };
}

export type SaveDocumentResponse = SaveWarningResponse | SaveSuccessResponse | SaveFailureResponse;

export class SaveDocumentError extends Error {
  public readonly category: SaveFailureResponse["error"]["category"];
  public readonly code: SaveFailureResponse["error"]["code"];
  public readonly retryable: boolean;

  public constructor(input: {
    message: string;
    category: SaveFailureResponse["error"]["category"];
    code: SaveFailureResponse["error"]["code"];
    retryable: boolean;
  }) {
    super(input.message);
    this.name = "SaveDocumentError";
    this.category = input.category;
    this.code = input.code;
    this.retryable = input.retryable;
  }
}

export interface SiteConfigResponse {
  name: string;
}

const ensureOk = async (response: Response): Promise<Response> => {
  if (response.ok) {
    return response;
  }

  const text = await response.text();
  let parsed:
    | { error?: { code?: string; message?: string; category?: string; retryable?: boolean }; status?: string }
    | undefined;
  try {
    parsed = JSON.parse(text) as {
      error?: { code?: string; message?: string; category?: string; retryable?: boolean };
      status?: string;
    };
  } catch {
    // Fall through to generic message when payload is not JSON.
  }

  if (
    parsed?.status === "failed" &&
    parsed.error?.category &&
    parsed.error?.code &&
    parsed.error?.message &&
    typeof parsed.error.retryable === "boolean"
  ) {
    throw new SaveDocumentError({
      message: parsed.error.message,
      category: parsed.error.category as SaveFailureResponse["error"]["category"],
      code: parsed.error.code as SaveFailureResponse["error"]["code"],
      retryable: parsed.error.retryable,
    });
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

export const saveDocument = async (request: SaveDocumentRequest): Promise<SaveDocumentResponse> => {
  const response = await ensureOk(
    await fetch("/api/document/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    }),
  );

  return (await response.json()) as SaveDocumentResponse;
};
