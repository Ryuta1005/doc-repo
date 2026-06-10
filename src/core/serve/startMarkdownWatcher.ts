import path from "node:path";
import chokidar from "chokidar";

import type { WatchEventType, WatchHandle } from "../../shared/types.js";

interface StartMarkdownWatcherInput {
  rootDir: string;
  isTargetPath: (absolutePath: string) => boolean;
  onEvent: (event: { eventType: WatchEventType; absolutePath: string }) => void;
}

export const startMarkdownWatcher = async (input: StartMarkdownWatcherInput): Promise<WatchHandle> => {
  const watcher = chokidar.watch(input.rootDir, {
    ignoreInitial: true,
  });

  const onEvent = (eventType: WatchEventType) => (relativePath: string) => {
    const absolutePath = path.resolve(input.rootDir, relativePath);
    if (!input.isTargetPath(absolutePath)) {
      return;
    }

    input.onEvent({ eventType, absolutePath });
  };

  watcher.on("add", onEvent("add"));
  watcher.on("change", onEvent("change"));
  watcher.on("unlink", onEvent("unlink"));

  await new Promise<void>((resolve) => {
    watcher.once("ready", () => resolve());
  });

  return {
    close: async () => {
      await watcher.close();
    },
  };
};
