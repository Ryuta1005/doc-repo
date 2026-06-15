import path from "node:path";
import fs from "fs-extra";

import { validateDocumentIdentifier } from "../../../shared/documentIdentifier.js";
import { createHttpError } from "../errors/httpErrorTypes.js";

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

interface UploadedImageLike {
  name: string;
  type?: string;
  size?: number;
  arrayBuffer: () => Promise<ArrayBuffer>;
}

export interface DocumentImageUploadRouteInput {
  rootDir: string;
  formData: FormData;
}

interface DocumentImageUploadResponse {
  status: "uploaded";
  imagePath: string;
}

const isUploadedImageLike = (value: FormDataEntryValue | null): boolean => {
  if (!value || typeof value === "string") {
    return false;
  }

  return (
    typeof (value as { name?: unknown }).name === "string" &&
    typeof (value as { arrayBuffer?: unknown }).arrayBuffer === "function"
  );
};

const toSafeBaseName = (name: string): string => {
  const raw = path.posix.basename(name).replace(/\.[^.]+$/, "");
  const normalized = raw
    .replace(/[^A-Za-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  return normalized || "image";
};

const resolveImageExtension = (fileName: string, mimeType: string | undefined): ".png" | ".jpg" | null => {
  const lowerName = fileName.toLowerCase();
  if (mimeType === "image/png" || lowerName.endsWith(".png")) {
    return ".png";
  }

  if (mimeType === "image/jpeg" || lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")) {
    return ".jpg";
  }

  return null;
};

const ensurePathInRoot = (rootDir: string, targetPath: string): void => {
  const relative = path.relative(rootDir, targetPath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw createHttpError(400, "INVALID_REQUEST", "target path must remain inside rootDir");
  }
};

const nextAvailableFilePath = async (
  targetDir: string,
  baseName: string,
  extension: ".png" | ".jpg",
): Promise<string> => {
  const first = path.join(targetDir, `${baseName}${extension}`);
  if (!(await fs.pathExists(first))) {
    return first;
  }

  for (let index = 2; index < 10_000; index += 1) {
    const candidate = path.join(targetDir, `${baseName}-${index}${extension}`);
    if (!(await fs.pathExists(candidate))) {
      return candidate;
    }
  }

  throw createHttpError(500, "INTERNAL_ERROR", "failed to resolve image file name");
};

export const handleDocumentImageUploadRoute = async (
  input: DocumentImageUploadRouteInput,
): Promise<DocumentImageUploadResponse> => {
  const rawIdentifier = input.formData.get("identifier");
  if (typeof rawIdentifier !== "string") {
    throw createHttpError(400, "INVALID_REQUEST", "identifier is required");
  }

  const validated = validateDocumentIdentifier(rawIdentifier);
  if (!validated.ok || !validated.value) {
    throw createHttpError(400, "INVALID_REQUEST", validated.reason ?? "invalid identifier");
  }

  const image = input.formData.get("image");
  if (!isUploadedImageLike(image)) {
    throw createHttpError(400, "INVALID_REQUEST", "image file is required");
  }
  const uploadedImage = image as UploadedImageLike;

  const extension = resolveImageExtension(uploadedImage.name, uploadedImage.type);
  if (!extension) {
    throw createHttpError(400, "INVALID_REQUEST", "supported image types are png and jpeg");
  }

  if (typeof uploadedImage.size === "number" && uploadedImage.size > MAX_IMAGE_SIZE_BYTES) {
    throw createHttpError(
      400,
      "INVALID_REQUEST",
      `image file size must not exceed ${MAX_IMAGE_SIZE_BYTES / (1024 * 1024)} MB`,
    );
  }

  const documentIdentifier = validated.value;
  const documentDirectory = path.posix.dirname(documentIdentifier);
  const relativeAssetDir = documentDirectory === "." ? "assets" : path.posix.join(documentDirectory, "assets");
  const absoluteAssetDir = path.resolve(input.rootDir, relativeAssetDir);
  ensurePathInRoot(input.rootDir, absoluteAssetDir);

  await fs.ensureDir(absoluteAssetDir);

  const safeBaseName = toSafeBaseName(uploadedImage.name);
  const targetPath = await nextAvailableFilePath(absoluteAssetDir, safeBaseName, extension);
  ensurePathInRoot(input.rootDir, targetPath);

  const buffer = Buffer.from(await uploadedImage.arrayBuffer());
  await fs.writeFile(targetPath, buffer);

  const savedFileName = path.basename(targetPath);
  return {
    status: "uploaded",
    imagePath: `./assets/${savedFileName}`,
  };
};
