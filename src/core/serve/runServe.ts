import { generateSite } from "../site/generateSite.js";
import { startStaticServer } from "./startStaticServer.js";
import { toServeUserGuidance } from "../../shared/errors.js";
import type { GenerationResult, ServeSession, ServeStepResult } from "../../shared/types.js";

interface ServerHandle {
  url: string;
  close: () => Promise<void>;
}

interface RunServeInput {
  cwd?: string;
  outputDir: string;
  port?: number;
  generate?: () => Promise<GenerationResult>;
  startServer?: (input: { outputDir: string; port: number }) => Promise<ServerHandle>;
  startWatch?: () => Promise<void>;
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
  const generate = input.generate ?? (async () => await generateSite({ cwd: input.cwd ?? process.cwd() }));
  const startServer = input.startServer ?? (async (x) => await startStaticServer(x));
  const startWatch = input.startWatch ?? (async () => undefined);
  const registerSignalHandler = input.registerSignalHandler ?? ((signal, handler) => process.once(signal, handler));

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
    const serverStart = Date.now();
    const server = await startServer({ outputDir: input.outputDir, port: resolvedPort });
    steps.push({
      step: "start-server",
      status: "success",
      message: `serving on ${server.url}`,
      durationMs: elapsedMs(serverStart),
    });

    const watchStart = Date.now();
    await startWatch();
    steps.push({
      step: "start-watch",
      status: "success",
      message: "watch started",
      durationMs: elapsedMs(watchStart),
    });

    const session: ServeSession = {
      status: "watching",
      publicUrl: server.url,
      exitCode: 0,
      steps,
      failures: [],
    };

    const stop = async (): Promise<void> => {
      await server.close();
      session.status = "stopped";
      session.exitCode = 0;
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
