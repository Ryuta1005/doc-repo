import { getDocument } from "../../../application/documents/getDocument.js";

export interface DocumentsDetailRouteInput {
  rootDir: string;
  identifier: string;
}

export const handleDocumentsDetailRoute = async (input: DocumentsDetailRouteInput) => {
  return await getDocument({
    rootDir: input.rootDir,
    identifier: input.identifier,
  });
};
