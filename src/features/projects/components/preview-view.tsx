"use client";

import { useState, useRef } from "react";
import { Allotment } from "allotment";
import {
  Loader2Icon,
  TerminalSquareIcon,
  AlertTriangleIcon,
  RefreshCwIcon,
  RotateCcwIcon,
  MessageCircleIcon,
} from "lucide-react";
import { toast } from "sonner";

import { useWebContainer } from "@/features/preview/hooks/use-webcontainer";
import { PreviewSettingsPopover } from "@/features/preview/components/preview-settings-popover";
import { PreviewTerminal } from "@/features/preview/components/preview-terminal";

import { Button } from "@/components/ui/button";

import { useProject } from "../hooks/use-projects";

import { Id } from "../../../../convex/_generated/dataModel";

export const PreviewView = ({ projectId }: { projectId: Id<"projects"> }) => {
  const project = useProject(projectId);
  const [showTerminal, setShowTerminal] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const { status, previewUrl, error, restart, terminalOutput } =
    useWebContainer({
      projectId,
      enabled: true,
      settings: project?.settings,
    });

  const isLoading = status === "booting" || status === "installing";

  const handleReloadIframe = () => {
    setIframeKey((k) => k + 1);
    if (iframeRef.current) {
      iframeRef.current.src = previewUrl || "";
    }
  };

  const handleAddToChat = () => {
    try {
      if (!previewUrl) {
        toast.error("Preview Not Ready");
        return;
      }

      const context = `Here's the Current Preview:
      - Preview URL: ${previewUrl}
      - Status: ${status === "running" ? "Running" : "Loading"}
      - The App is Currently Displayed in the iframe Above`;

      const event = new CustomEvent("addPreviewToChat", {
        detail: {
          context,
          previewUrl,
        },
      });
      window.dispatchEvent(event);
      toast.success("Preview Context Added to Chat");
    } catch (error) {
      console.error("Error Adding Preview to Chat:", error);
      toast.error("Failed to Add Preview to Chat");
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="h-8.75 flex items-center border-b bg-sidebar shrink-0 gap-1">
        <Button
          size="sm"
          variant="ghost"
          className="h-full rounded-none"
          disabled={isLoading}
          onClick={restart}
          title="Restart Container"
        >
          <RefreshCwIcon className="size-3" />
        </Button>

        {previewUrl && (
          <Button
            size="sm"
            variant="ghost"
            className="h-full rounded-none"
            onClick={handleReloadIframe}
            title="Reload Preview"
          >
            <RotateCcwIcon className="size-3" />
          </Button>
        )}

        <div className="flex-1 h-full flex items-center px-3 bg-background border-x text-xs text-muted-foreground truncate font-mono">
          {isLoading && (
            <div className="flex items-center gap-1.5">
              <Loader2Icon className="size-3 animate-spin" />
              {status === "booting" ? "Starting..." : "Installing..."}
            </div>
          )}
          {previewUrl && <span className="truncate">{previewUrl}</span>}
          {!isLoading && !previewUrl && !error && <span>Ready to Preview</span>}
        </div>

        <Button
          size="sm"
          variant="ghost"
          className="h-full rounded-none"
          title="Add to Chat"
          onClick={handleAddToChat}
          disabled={!previewUrl}
        >
          <MessageCircleIcon className="size-3" />
        </Button>

        <Button
          size="sm"
          variant="ghost"
          className="h-full rounded-none"
          title="Toggle Terminal"
          onClick={() => setShowTerminal((value) => !value)}
        >
          <TerminalSquareIcon className="size-3" />
        </Button>
        <PreviewSettingsPopover
          projectId={projectId}
          initialValues={project?.settings}
          onSave={restart}
        />
      </div>

      <div className="flex-1 min-h-0">
        <Allotment vertical>
          <Allotment.Pane>
            {error && (
              <div className="size-full flex items-center justify-center text-muted-foreground">
                <div className="flex flex-col items-center gap-2 max-w-md mx-auto text-center">
                  <AlertTriangleIcon className="size-6" />
                  <p className="text-sm font-medium">{error}</p>
                  <Button size="sm" variant="outline" onClick={restart}>
                    <RefreshCwIcon className="size-4" />
                    Restart
                  </Button>
                </div>
              </div>
            )}

            {isLoading && !error && (
              <div className="size-full flex items-center justify-center text-muted-foreground">
                <div className="flex flex-col items-center gap-2 max-w-md mx-auto text-center">
                  <Loader2Icon className="size-6 animate-spin" />
                  <p className="text-sm font-medium">Installing...</p>
                </div>
              </div>
            )}

            {previewUrl && (
              <iframe
                key={iframeKey}
                ref={iframeRef}
                src={previewUrl}
                className="size-full border-0"
                title="Preview"
                onError={() => {
                  toast.error("Failed to Load Preview. Try Restarting.");
                }}
              />
            )}
          </Allotment.Pane>

          {showTerminal && (
            <Allotment.Pane minSize={100} maxSize={500} preferredSize={200}>
              <div className="h-full flex flex-col bg-background border-t">
                <div className="h-7 flex items-center px-3 text-xs gap-1.5 text-muted-foreground border-b border-border/50 shrink-0">
                  <TerminalSquareIcon className="size-3" />
                  Terminal
                </div>
                <PreviewTerminal output={terminalOutput} />
              </div>
            </Allotment.Pane>
          )}
        </Allotment>
      </div>
    </div>
  );
};
