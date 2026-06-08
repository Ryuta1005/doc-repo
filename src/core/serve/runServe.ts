import { generateSite } from "../site/generateSite.js";
import { startStaticServer } from "./startStaticServer.js";
import { createSseConnectionRegistry } from "./sseConnectionRegistry.js";
import { createWatchTargetFilter } from "./watchTargetFilter.js";
import { createRefreshCoordinator } from "./refreshCoordinator.js";
import { startMarkdownWatcher } from "./startMarkdownWatcher.js";
import { createWatchStatusReporter } from "./watchStatusReporter.js";
import { createLogger } from "../../shared/logger.js";
import { toServeUserGuidance } from "../../shared/errors.js";
import type { GenerationResult, ServeSession, ServeStepResult } from "../../shared/types.js";

interface ServerHandle {
  url: string;
  close: () => Promise<void>;
}

interface RunServeInput {
  cwd?: string;
  rootDir?: string;
  outputDir: string;
  port?: number;
  includePatterns?: string[];
  excludePatterns?: string[];
  generate?: () => Promise<GenerationResult>;
  startServer?: (input: { outputDir: string; port: number }) => Promise<ServerHandle>;
  registerSignalHandler?: (signal: NodeJS.Signals, handler: () => void | Promise<void>) => void;
}

const elapsedMs = (start: number): number => Date.now() - start;

const buildFailedSession = (steps: ServeStepResult[], reason: string, hint: string): ServeSession => ({
  status: "failed",
  exitCode: 1,
  steps,
  failures: [
    {
      type: "initial-generate-failed",
      message: reason,
      hint,
      exitCode: 1,
    },
  ],
});

export const runServe = async (input: RunServeInput): Promise<ServeSession> => {
  const resolvedPort = input.port ?? 4000;
  const logger = createLogger();
  const reporter = createWatchStatusReporter(logger);
  const generate = input.generate ?? (async () => await generateSite({ cwd: input.cwd ?? process.cwd() }));
  const rootDir = input.rootDir ?? input.cwd ?? process.cwd();
  const registerSignalHandler = input.registerSignalHandler ?? ((signal, handler) => process.once(signal, handler));
  const sseRegistry = createSseConnectionRegistry();
  const targetFilter = createWatchTargetFilter({
    rootDir,
    includePatterns: input.includePatterns,
    excludePatterns: input.excludePatterns,
  });

  const steps: ServeStepResult[] = [];

  const genStart = Date.now();
  const generated = await generate();
  if (generated.status === "failure") {
    steps.push({
      step: "initial-generate",
      status: "failure",
      message: generated.errorReason ?? generated.message,
      durationMs: elapsedMs(genStart),
    });

    return buildFailedSession(
      steps,
      generated.errorReason ?? generated.message,
      generated.hint ?? "入力を確認してください。",
    );
  }

  steps.push({
    step: "initial-generate",
    status: "success",
    message: generated.message,
    durationMs: elapsedMs(genStart),
  });

  try {
    const startServer =
      input.startServer ??
      (async (x) =>
        await startStaticServer({
          ...x,
          sseHooks: {
            onSseConnect: (response) => ({
              connectionId: sseRegistry.add(response),
            }),
            onSseDisconnect: (connectionId) => {
              sseRegistry.remove(connectionId);
            },
          },
        }));

    const serverStart = Date.now();
    const server = await startServer({ outputDir: input.outputDir, port: resolvedPort });
    steps.push({
      step: "start-server",
      status: "success",
      message: `serving on ${server.url}`,
      durationMs: elapsedMs(serverStart),
    });

    const coordinator = createRefreshCoordinator({
      onRegenerate: async () => {
        const result = await generate();
        if (result.status === "success") {
          return { ok: true };
        }

        return {
          ok: false,
          reason: result.errorReason ?? result.message,
        };
      },
      onReload: () => sseRegistry.dispatchReload(),
    });

    const watchStart = Date.now();
    const watchHandle = await startMarkdownWatcher({
      rootDir,
      isTargetPath: (absolutePath) => targetFilter.isTargetPath(absolutePath),
      onEvent: (event) => {
        coordinator.notifyChange(event);
      },
    });
    steps.push({
      step: "start-watch",
      status: "success",
      message: "watch started",
      durationMs: elapsedMs(watchStart),
    });
    reporter.watchStarted();

    const session: ServeSession = {
      status: "watching",
      publicUrl: server.url,
      exitCode: 0,
      steps,
      failures: [],
    };

    let shutdownInProgress = false;
    const stop = async (): Promise<void> => {
      if (shutdownInProgress) {
        return;
      }

      shutdownInProgress = true;
      reporter.shutdownStarted();
      session.status = "stopped";

      try {
        await watchHandle.close();
      } catch (error) {
        reporter.shutdownError("watcher", error instanceof Error ? error.message : String(error));
      }

      try {
        await coordinator.drain();
        await sseRegistry.closeAll();
      } catch (error) {
        reporter.shutdownError("sse", error instanceof Error ? error.message : String(error));
      }

      try {
        await server.close();
      } catch (error) {
        reporter.shutdownError("http", error instanceof Error ? error.message : String(error));
      }

      session.status = "stopped";
      session.exitCode = 0;
      reporter.shutdownCompleted();
    };

    registerSignalHandler("SIGINT", () => {
      void stop();
    });
    registerSignalHandler("SIGTERM", () => {
      void stop();
    });

    return session;
  } catch (error) {
    const guidance = toServeUserGuidance(error);
    steps.push({
      step: "start-server",
      status: "failure",
      message: guidance.reason,
      durationMs: 0,
    });

    return {
      status: "failed",
      exitCode: 1,
      steps,
      failures: [
        {
          type: guidance.type,
          message: guidance.reason,
          hint: guidance.hint,
          field: guidance.field,
          exitCode: 1,
        },
      ],
    };
  }
};
