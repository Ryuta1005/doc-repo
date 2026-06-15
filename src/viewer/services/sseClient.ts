export interface SseClientHandle {
  close: () => void;
}

interface SseClientInput {
  onReload: () => void;
  onError?: () => void;
}

export const startSseClient = (input: SseClientInput): SseClientHandle => {
  const source = new EventSource("/events");

  source.addEventListener("reload", () => {
    input.onReload();
  });

  source.onerror = () => {
    input.onError?.();
  };

  return {
    close: () => {
      source.close();
    },
  };
};
