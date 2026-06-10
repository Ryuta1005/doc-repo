import http from "node:http";
import { describe, expect, it } from "vitest";

import { createSseConnectionRegistry } from "./sseConnectionRegistry.js";

describe("sseConnectionRegistry", () => {
  it("dispatchReload sends event payload to active clients", () => {
    const registry = createSseConnectionRegistry();
    const response = {
      writableEnded: false,
      destroyed: false,
      write: () => true,
      end: () => undefined,
    } as unknown as http.ServerResponse;

    registry.add(response);
    const count = registry.dispatchReload();

    expect(count).toBe(1);
    expect(registry.size()).toBe(1);
  });

  it("closeAll closes all clients and clears registry", async () => {
    const registry = createSseConnectionRegistry();
    const response = {
      writableEnded: false,
      destroyed: false,
      write: () => true,
      end: () => undefined,
    } as unknown as http.ServerResponse;

    registry.add(response);
    await registry.closeAll();

    expect(registry.size()).toBe(0);
  });
});
