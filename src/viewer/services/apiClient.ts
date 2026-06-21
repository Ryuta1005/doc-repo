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
  originalIdentifier?: string;
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

export interface UploadDocumentImageResponse {
  status: "uploaded";
  imagePath: string;
}

export interface CreateDocumentRequest {
  anchor: {
    nodeType: "file" | "folder";
    nodePath: string;
  };
  filename: string;
}

export interface CreateDocumentSuccessResponse {
  status: "created";
  document: {
    identifier: string;
    displayName: string;
  };
}

export interface CreateDocumentFailureResponse {
  status: "rejected";
  error: {
    code: "INVALID_INPUT" | "OUT_OF_SCOPE" | "ALREADY_EXISTS" | "UNWRITABLE_TARGET" | "TRANSIENT_IO";
    reason:
      | "filename:required"
      | "filename:path-segment"
      | "filename:path-separator"
      | "filename:empty-display-name"
      | "filename:invalid"
      | "target:out-of-scope"
      | "target:already-exists"
      | "target:unavailable"
      | "target:temporary-failure";
    message: string;
    retryable: boolean;
  };
}

export type CreateDocumentResponse = CreateDocumentSuccessResponse | CreateDocumentFailureResponse;

export interface DeleteDocumentRequest {
  target: {
    targetType: "file" | "folder";
    path: string;
    displayName: string;
  };
}

export interface DeleteDocumentSuccessResponse {
  status: "deleted";
  removed: {
    identifiers: string[];
    directories: string[];
  };
}

export interface DeleteDocumentFailureResponse {
  status: "rejected";
  error: {
    code: "INVALID_TARGET" | "OUT_OF_SCOPE" | "NOT_FOUND" | "CONTAINS_UNMANAGED_CONTENT" | "TRANSIENT_IO";
    reason:
      | "target:invalid"
      | "target:out-of-scope"
      | "target:not-found"
      | "folder:contains-unmanaged-content"
      | "target:temporary-failure";
    message: string;
    retryable: boolean;
  };
}

export type DeleteDocumentResponse = DeleteDocumentSuccessResponse | DeleteDocumentFailureResponse;

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

export class CreateDocumentError extends Error {
  public readonly code: CreateDocumentFailureResponse["error"]["code"];
  public readonly reason: CreateDocumentFailureResponse["error"]["reason"];
  public readonly retryable: boolean;

  public constructor(input: {
    message: string;
    code: CreateDocumentFailureResponse["error"]["code"];
    reason: CreateDocumentFailureResponse["error"]["reason"];
    retryable: boolean;
  }) {
    super(input.message);
    this.name = "CreateDocumentError";
    this.code = input.code;
    this.reason = input.reason;
    this.retryable = input.retryable;
  }
}

export class DeleteDocumentError extends Error {
  public readonly code: DeleteDocumentFailureResponse["error"]["code"];
  public readonly reason: DeleteDocumentFailureResponse["error"]["reason"];
  public readonly retryable: boolean;

  public constructor(input: {
    message: string;
    code: DeleteDocumentFailureResponse["error"]["code"];
    reason: DeleteDocumentFailureResponse["error"]["reason"];
    retryable: boolean;
  }) {
    super(input.message);
    this.name = "DeleteDocumentError";
    this.code = input.code;
    this.reason = input.reason;
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
    | {
        error?: { code?: string; reason?: string; message?: string; category?: string; retryable?: boolean };
        status?: string;
      }
    | undefined;
  try {
    parsed = JSON.parse(text) as {
      error?: { code?: string; reason?: string; message?: string; category?: string; retryable?: boolean };
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

  if (
    parsed?.status === "rejected" &&
    parsed.error?.code &&
    parsed.error?.reason &&
    parsed.error?.message &&
    typeof parsed.error.retryable === "boolean"
  ) {
    throw new CreateDocumentError({
      message: parsed.error.message,
      code: parsed.error.code as CreateDocumentFailureResponse["error"]["code"],
      reason: parsed.error.reason as CreateDocumentFailureResponse["error"]["reason"],
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

export const uploadDocumentImage = async (identifier: string, file: File): Promise<UploadDocumentImageResponse> => {
  const formData = new FormData();
  formData.set("identifier", identifier);
  formData.set("image", file);

  const response = await ensureOk(
    await fetch("/api/document/image", {
      method: "POST",
      body: formData,
    }),
  );

  return (await response.json()) as UploadDocumentImageResponse;
};

export const createDocument = async (request: CreateDocumentRequest): Promise<CreateDocumentResponse> => {
  const response = await fetch("/api/document/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  return (await response.json()) as CreateDocumentResponse;
};

export const deleteDocument = async (request: DeleteDocumentRequest): Promise<DeleteDocumentResponse> => {
  const response = await fetch("/api/document/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  return (await response.json()) as DeleteDocumentResponse;
};
