import { detectPackageManager, installDependencies } from "nypm";

export async function installDeps(projectPath: string): Promise<void> {
  const pm = await detectPackageManager(projectPath);
  await installDependencies({
    cwd: projectPath,
    packageManager: pm?.name,
  });
}
