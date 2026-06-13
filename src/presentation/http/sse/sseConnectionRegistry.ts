export interface SseWritableConnection {
  writableEnded: boolean;
  destroyed: boolean;
  write: (chunk: string) => unknown;
  end: () => void | Promise<void>;
}

import type { SseReloadPayload } from "../../../shared/types.js";

interface SseConnection {
  id: string;
  response: SseWritableConnection;
}

export interface SseConnectionRegistry {
  add: (response: SseWritableConnection) => string;
  remove: (id: string) => void;
  dispatchReload: () => number;
  closeAll: () => Promise<void>;
  size: () => number;
}

const eventPayload = (event: string, data: unknown): string => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

export const createSseConnectionRegistry = (): SseConnectionRegistry => {
  const connections = new Map<string, SseConnection>();

  const add = (response: SseWritableConnection): string => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    connections.set(id, { id, response });
    return id;
  };

  const remove = (id: string): void => {
    connections.delete(id);
  };

  const dispatchReload = (): number => {
    const payload: SseReloadPayload = {
      type: "reload",
      reason: "regenerate-succeeded",
      occurredAt: new Date().toISOString(),
    };

    let dispatched = 0;
    for (const [id, conn] of connections.entries()) {
      if (conn.response.writableEnded || conn.response.destroyed) {
        connections.delete(id);
        continue;
      }

      conn.response.write(eventPayload("reload", payload));
      dispatched += 1;
    }

    return dispatched;
  };

  const closeAll = async (): Promise<void> => {
    for (const conn of connections.values()) {
      if (!conn.response.writableEnded) {
        conn.response.end();
      }
    }
    connections.clear();
  };

  return {
    add,
    remove,
    dispatchReload,
    closeAll,
    size: () => connections.size,
  };
};
