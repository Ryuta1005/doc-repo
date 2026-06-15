import path from "node:path";
import chokidar from "chokidar";

import type { WatchEvent, WatchEventType, WatchHandle } from "../../shared/types.js";

interface StartMarkdownWatcherInput {
  rootDir: string;
  isTargetPath: (absolutePath: string) => boolean;
  isIgnoredWatchPath?: (absolutePath: string, isFile: boolean) => boolean;
  onEvent: (event: WatchEvent) => void;
}

const toPosixPath = (value: string): string => value.split(path.sep).join(path.posix.sep);

export const startMarkdownWatcher = async (input: StartMarkdownWatcherInput): Promise<WatchHandle> => {
  const rootDir = path.resolve(input.rootDir);
  const watcher = chokidar.watch(rootDir, {
    ignoreInitial: true,
    ignored: (watchPath, stats) => {
      const absolutePath = path.isAbsolute(watchPath) ? path.resolve(watchPath) : path.resolve(rootDir, watchPath);
      return input.isIgnoredWatchPath?.(absolutePath, stats?.isFile() ?? false) ?? false;
    },
  });

  const onEvent = (eventType: WatchEventType) => (eventPath: string) => {
    const absolutePath = path.isAbsolute(eventPath) ? path.resolve(eventPath) : path.resolve(rootDir, eventPath);
    if (!input.isTargetPath(absolutePath)) {
      return;
    }

    const relativePath = path.relative(rootDir, absolutePath);
    if (relativePath.startsWith("..") || path.isAbsolute(relativePath) || !relativePath) {
      return;
    }

    input.onEvent({
      eventType,
      absolutePath,
      notificationPath: toPosixPath(relativePath),
    });
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
