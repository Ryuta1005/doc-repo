import { beforeEach, describe, expect, it, vi } from "vitest";

const handlers = new Map<string, (value: string) => void>();
const onceHandlers = new Map<string, () => void>();

const closeMock = vi.fn(async () => undefined);

interface WatchMockOptions {
  ignored: (watchPath: string, stats: { isFile: () => boolean } | undefined) => boolean;
}

const watchMock = vi.fn((_path: string, _options: WatchMockOptions) => ({
  on: (event: string, handler: (value: string) => void) => {
    handlers.set(event, handler);
    return undefined;
  },
  once: (event: string, handler: () => void) => {
    onceHandlers.set(event, handler);
    return undefined;
  },
  close: closeMock,
}));

vi.mock("chokidar", () => ({
  default: {
    watch: watchMock,
  },
}));

describe("startMarkdownWatcher", () => {
  beforeEach(() => {
    handlers.clear();
    onceHandlers.clear();
    closeMock.mockClear();
    watchMock.mockClear();
  });

  it("forwards add/change/unlink events to callback", async () => {
    const { startMarkdownWatcher } = await import("./startMarkdownWatcher.js");

    const events: string[] = [];
    const startedPromise = startMarkdownWatcher({
      rootDir: "/repo",
      isTargetPath: () => true,
      onEvent: (event) => {
        events.push(event.eventType);
      },
    });

    onceHandlers.get("ready")?.();
    const watcher = await startedPromise;

    handlers.get("add")?.("docs/a.md");
    handlers.get("change")?.("docs/a.md");
    handlers.get("unlink")?.("docs/a.md");

    expect(events).toEqual(["add", "change", "unlink"]);
    await watcher.close();
    expect(closeMock).toHaveBeenCalledTimes(1);
  });

  it("passes ignored watch paths to chokidar before events are emitted", async () => {
    const { startMarkdownWatcher } = await import("./startMarkdownWatcher.js");
    const isIgnoredWatchPath = vi.fn(() => true);

    const startedPromise = startMarkdownWatcher({
      rootDir: "/repo",
      isTargetPath: () => true,
      isIgnoredWatchPath,
      onEvent: () => undefined,
    });

    onceHandlers.get("ready")?.();
    await startedPromise;

    const options = watchMock.mock.calls[0]?.[1];
    if (!options) {
      throw new Error("watch options were not passed");
    }
    options.ignored("/repo/node_modules", undefined);

    expect(isIgnoredWatchPath).toHaveBeenCalledWith("/repo/node_modules", false);
  });
});
