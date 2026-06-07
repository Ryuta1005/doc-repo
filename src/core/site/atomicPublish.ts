import fs from "fs-extra";

export const atomicPublish = async (stagingDir: string, outputDir: string): Promise<void> => {
  const backupDir = `${outputDir}.__backup__`;

  await fs.remove(backupDir);

  try {
    if (await fs.pathExists(outputDir)) {
      await fs.move(outputDir, backupDir, { overwrite: true });
    }

    await fs.move(stagingDir, outputDir, { overwrite: true });
    await fs.remove(backupDir);
  } catch (error) {
    if (!(await fs.pathExists(outputDir)) && (await fs.pathExists(backupDir))) {
      await fs.move(backupDir, outputDir, { overwrite: true });
    }

    if (await fs.pathExists(stagingDir)) {
      await fs.remove(stagingDir);
    }

    throw error;
  }
};
