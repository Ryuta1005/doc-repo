import { describe, expect, it } from "vitest";
import path from "node:path";
import net from "node:net";
import fs from "fs-extra";

import { AppError } from "../../shared/errors.js";

describe("startStaticServer.ts", () => {
  it("close 実行後に同一ポートを再利用できること。", async () => {
    const tempRoot = await fs.mkdtemp(path.join(process.cwd(), "tests/.tmp/start-server-"));
    await fs.outputFile(path.join(tempRoot, "index.html"), "<h1>ok</h1>");

    const freePort = await new Promise<number>((resolve, reject) => {
      const server = net.createServer();
      server.listen(0, () => {
        const address = server.address();
        if (!address || typeof address === "string") {
          reject(new Error("failed to resolve free port"));
          return;
        }
        const { port } = address;
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(port);
        });
      });
    });

    const { startStaticServer } = await import("./startStaticServer.js");
    const started = await startStaticServer({ outputDir: tempRoot, port: freePort });
    await started.close();

    await new Promise<void>((resolve, reject) => {
      const probe = net.createServer();
      probe.once("error", reject);
      probe.listen(freePort, () => {
        probe.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    });

    await fs.remove(tempRoot);
  });

  it("ポート競合時に PORT_CONFLICT を返すこと。", async () => {
    const { mapServerStartError } = await import("./startStaticServer.js");
    const error = new Error("listen EADDRINUSE");
    (error as NodeJS.ErrnoException).code = "EADDRINUSE";

    const mapped = mapServerStartError(error, 4000);

    expect(mapped).toBeInstanceOf(AppError);
    expect((mapped as AppError).code).toBe("PORT_CONFLICT");
  });
});
