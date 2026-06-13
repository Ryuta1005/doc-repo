import { describe, expect, it, vi } from "vitest";

import { createRefreshCoordinator } from "./refreshCoordinator.js";

describe("refreshCoordinator", () => {
  it("runs regenerate after debounce", async () => {
    const onRegenerate = vi.fn(async () => ({ ok: true as const }));
    const onReload = vi.fn(() => 1);
    const coordinator = createRefreshCoordinator({ onRegenerate, onReload, debounceMs: 10 });

    coordinator.notifyChange({
      eventType: "change",
      absolutePath: "/repo/docs/a.md",
      notificationPath: "docs/a.md",
    });
    await new Promise((resolve) => setTimeout(resolve, 30));

    expect(onRegenerate).toHaveBeenCalledTimes(1);
    expect(onReload).toHaveBeenCalledTimes(1);
  });

  it("queues pending change while running and executes exactly one extra run", async () => {
    const onReload = vi.fn(() => 1);
    let resolveRun: (() => void) | undefined;
    const firstRun = new Promise<void>((resolve) => {
      resolveRun = resolve;
    });

    let runCount = 0;
    const onRegenerate = vi.fn(async () => {
      runCount += 1;
      if (runCount === 1) {
        await firstRun;
      }
      return { ok: true as const };
    });

    const coordinator = createRefreshCoordinator({ onRegenerate, onReload, debounceMs: 5 });
    coordinator.notifyChange({
      eventType: "change",
      absolutePath: "/repo/docs/a.md",
      notificationPath: "docs/a.md",
    });
    await new Promise((resolve) => setTimeout(resolve, 20));

    coordinator.notifyChange({
      eventType: "change",
      absolutePath: "/repo/docs/a.md",
      notificationPath: "docs/a.md",
    });
    resolveRun?.();

    await coordinator.drain();

    expect(onRegenerate).toHaveBeenCalledTimes(2);
    expect(onReload).toHaveBeenCalledTimes(2);
  });

  it("does not dispatch reload when regenerate fails", async () => {
    const onRegenerate = vi.fn(async () => ({ ok: false as const, reason: "failed" }));
    const onReload = vi.fn(() => 1);
    const coordinator = createRefreshCoordinator({ onRegenerate, onReload, debounceMs: 10 });

    coordinator.notifyChange({
      eventType: "change",
      absolutePath: "/repo/docs/a.md",
      notificationPath: "docs/a.md",
    });
    await coordinator.drain();

    expect(onRegenerate).toHaveBeenCalledTimes(1);
    expect(onReload).not.toHaveBeenCalled();
  });
});
