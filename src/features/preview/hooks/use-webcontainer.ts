import { useCallback, useEffect, useRef, useState } from "react";
import { WebContainer } from "@webcontainer/api";

import { buildFileTree, getFilePath } from "@/features/preview/utils/file-tree";
import { useFiles } from "@/features/projects/hooks/use-files";

import { Id } from "../../../../convex/_generated/dataModel";

// Singleton WebContainer instance with improved cleanup
let webcontainerInstance: WebContainer | null = null;
let bootPromise: Promise<WebContainer> | null = null;
let isBootingOrTearingDown = false;

const getWebContainer = async (): Promise<WebContainer> => {
  // If already booted, return immediately
  if (webcontainerInstance && !isBootingOrTearingDown) {
    return webcontainerInstance;
  }

  // Wait if currently booting/tearing down
  if (isBootingOrTearingDown) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return getWebContainer();
  }

  // Try to boot if not already in progress
  if (!bootPromise && !webcontainerInstance) {
    isBootingOrTearingDown = true;
    bootPromise = WebContainer.boot({ coep: "credentialless" }).catch(
      (error) => {
        console.error("WebContainer boot error:", error);
        bootPromise = null;
        isBootingOrTearingDown = false;
        throw error;
      },
    );
  }

  if (!bootPromise) {
    throw new Error("Failed to create WebContainer boot promise");
  }

  try {
    webcontainerInstance = await bootPromise;
    isBootingOrTearingDown = false;
    return webcontainerInstance;
  } catch (error) {
    console.error("Failed to get WebContainer:", error);
    bootPromise = null;
    isBootingOrTearingDown = false;
    throw error;
  }
};

const teardownWebContainer = async () => {
  isBootingOrTearingDown = true;
  if (webcontainerInstance) {
    try {
      // Properly await the teardown
      await webcontainerInstance.teardown();
    } catch (error) {
      console.error("Error during WebContainer teardown:", error);
    }
    webcontainerInstance = null;
  }
  bootPromise = null;
  // Add a longer delay to ensure WebContainer is fully released
  await new Promise((resolve) => setTimeout(resolve, 1000));
  isBootingOrTearingDown = false;
};

interface UseWebContainerProps {
  projectId: Id<"projects">;
  enabled: boolean;
  settings?: {
    installCommand?: string;
    devCommand?: string;
  };
}

export const useWebContainer = ({
  projectId,
  enabled,
  settings,
}: UseWebContainerProps) => {
  const [status, setStatus] = useState<
    "idle" | "booting" | "installing" | "running" | "error"
  >("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [restartKey, setRestartKey] = useState(0);
  const [terminalOutput, setTerminalOutput] = useState("");

  const containerRef = useRef<WebContainer | null>(null);
  const hasStartedRef = useRef(false);

  const files = useFiles(projectId);

  useEffect(() => {
    if (!enabled || !files || files.length === 0 || hasStartedRef.current) {
      return;
    }

    hasStartedRef.current = true;

    const start = async () => {
      try {
        setStatus("booting");
        setError(null);
        setTerminalOutput("");

        const appendOutput = (data: string) => {
          setTerminalOutput((prev) => prev + data);
        };

        const container = await getWebContainer();
        containerRef.current = container;

        const fileTree = buildFileTree(files);
        await container.mount(fileTree);

        // Give the file system a moment to sync
        await new Promise((resolve) => setTimeout(resolve, 500));

        container.on("server-ready", (_port, url) => {
          setPreviewUrl(url);
          setStatus("running");
        });

        // Check if package.json exists (npm projects)
        let hasPackageJson = false;
        try {
          const content = await container.fs.readFile("/package.json", "utf-8");
          JSON.parse(content);
          hasPackageJson = true;
        } catch {
          hasPackageJson = false;
        }

        // Only run npm install if package.json exists
        if (hasPackageJson) {
          setStatus("installing");

          // Parse install command (default: npm install with legacy-peer-deps)
          const installCmd = settings?.installCommand || "npm install --legacy-peer-deps";
          const [installBin, ...installArgs] = installCmd.split(" ");
          appendOutput(`$ ${installCmd}\n`);

          let installExitCode = 1;
          let retries = 0;
          const maxRetries = 3;

          // Retry logic for transient failures
          while (installExitCode !== 0 && retries < maxRetries) {
            const installProcess = await container.spawn(
              installBin,
              installArgs,
            );
            installProcess.output.pipeTo(
              new WritableStream({
                write(data) {
                  appendOutput(data);
                },
              }),
            );
            installExitCode = await installProcess.exit;

            if (installExitCode !== 0 && retries < maxRetries - 1) {
              retries++;
              appendOutput(
                `\n⚠ Install failed, retrying (${retries}/${maxRetries - 1})...\n`,
              );
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }
          }

          if (installExitCode !== 0) {
            throw new Error(
              `${installCmd} failed after ${maxRetries} attempts. Check package.json and dependencies.`,
            );
          }
        } else {
          appendOutput("ℹ Plain HTML App Detected\n");
        }

        if (hasPackageJson) {
          const devCmd = settings?.devCommand || "npm run dev";
          const [devBin, ...devArgs] = devCmd.split(" ");
          appendOutput(`\n$ ${devCmd}\n`);

          try {
            const devProcess = await container.spawn(devBin, devArgs);
            let devOutputBuffer = "";
            let urlDetected = false;
            let hasViteOutput = false;

            devProcess.output.pipeTo(
              new WritableStream({
                write(data) {
                  appendOutput(data);
                  devOutputBuffer += data;
                },
              }),
            );
          } catch (devError) {
            appendOutput(
              `\n⚠ Dev Command Error: ${
                devError instanceof Error ? devError.message : "Unknown error"
              }\n`,
            );
          }
        } else {
          // For plain HTML apps, start a simple HTTP server
          appendOutput("\n$ npx --yes serve . --listen 3000 --no-clipboard\n");
          try {
            const serveProcess = await container.spawn("npx", [
              "--yes",
              "serve",
              ".",
              "--listen",
              "3000",
              "--no-clipboard",
            ]);
            serveProcess.output.pipeTo(
              new WritableStream({
                write(data) {
                  appendOutput(data);
                },
              }),
            );
          } catch (serveError) {
            // If serve fails, try with python
            appendOutput(
              `\n⚠ npx serve not available, trying python http.server\n`,
            );
            try {
              const pythonProcess = await container.spawn("python3", [
                "-m",
                "http.server",
                "3000",
              ]);
              pythonProcess.output.pipeTo(
                new WritableStream({
                  write(data) {
                    appendOutput(data);
                  },
                }),
              );
            } catch (pythonError) {
              appendOutput(
                `\n⚠ Could not start web server. Ensure index.html exists at root.\n`,
              );
            }
          }
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : "Unknown error");
        setStatus("error");
      }
    };

    start();
  }, [
    enabled,
    files,
    restartKey,
    settings?.devCommand,
    settings?.installCommand,
  ]);

  // Sync file changes (hot-reload)
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !files || status !== "running") return;

    const filesMap = new Map(files.map((f) => [f._id, f]));

    for (const file of files) {
      if (file.type !== "file" || file.storageId || !file.content) continue;

      const filePath = getFilePath(file, filesMap);
      container.fs.writeFile(filePath, file.content);
    }
  }, [files, status]);

  // Reset when disabled
  useEffect(() => {
    if (!enabled) {
      hasStartedRef.current = false;
      setStatus("idle");
      setPreviewUrl(null);
      setError(null);
    }
  }, [enabled]);

  // Restart the entire WebContainer process
  const restart = useCallback(async () => {
    try {
      await teardownWebContainer();
      containerRef.current = null;
      hasStartedRef.current = false;
      setStatus("idle");
      setPreviewUrl(null);
      setError(null);
      setRestartKey((k) => k + 1);
    } catch (error) {
      console.error("Error during restart:", error);
      // Force reset even if teardown fails
      webcontainerInstance = null;
      bootPromise = null;
      isBootingOrTearingDown = false;
      containerRef.current = null;
      hasStartedRef.current = false;
      setStatus("idle");
      setPreviewUrl(null);
      setError("Failed to restart. Please refresh the page.");
      setRestartKey((k) => k + 1);
    }
  }, []);

  return {
    status,
    previewUrl,
    error,
    restart,
    terminalOutput,
  };
};
