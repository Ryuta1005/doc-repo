export interface ViewerDocumentSummary {
  identifier: string;
}

export const resolveSelectedIdentifier = (
  selectedIdentifier: string | null,
  documents: ViewerDocumentSummary[],
): string | null => {
  if (!documents.length) {
    return null;
  }

  if (!selectedIdentifier) {
    return documents[0]?.identifier ?? null;
  }

  return selectedIdentifier;
};
