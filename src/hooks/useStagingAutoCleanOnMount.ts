import { useEffect } from "react";

// Fire-and-forget housekeeping ping. Drops staging rows already mirrored in
// financial_data — invisible to reports anyway (the UNION's NOT EXISTS already
// suppresses them), so it cannot alter report output. Single indexed DELETE,
// short-circuits when staging is empty, safe to call on every report-tab mount.
export function useStagingAutoCleanOnMount(): void {
  useEffect(() => {
    if (!window.ipcApi) return;
    window.ipcApi
      .sendIpcRequest("db:auto-clean-staging", {})
      .catch((err: unknown) => {
        console.warn("[AutoClean] tab-mount trigger failed:", err);
      });
  }, []);
}
