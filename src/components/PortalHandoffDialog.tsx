/**
 * PortalHandoffDialog — "this opens in your browser, here is the link".
 * ---------------------------------------------------------------------
 * One dialog for every permission dead-end: not registered, no hotel access,
 * no app grant, account on hold, or just "I want to change my access". It always
 * offers both affordances — open the default browser, or copy the URL — because
 * a locked-down desktop can fail to launch a browser and the link still has to
 * be reachable.
 *
 * MUI is safe on every screen including the plain-CSS auth screens, because
 * AppThemeProvider wraps the whole router (src/app.tsx).
 */

import React, { useCallback, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  Typography,
} from "@mui/material";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import { usePortalLink } from "../hooks/usePortalLink";

const ACTION_SX = {
  borderRadius: 2,
  textTransform: "none" as const,
  fontWeight: 600,
};

export interface PortalHandoffDialogProps {
  open: boolean;
  onClose: () => void;
  /** Heading — defaults to the generic "manage your access" framing. */
  title?: string;
  /** Explanation of why the user is here. */
  body?: string;
}

export const PortalHandoffDialog: React.FC<PortalHandoffDialogProps> = ({
  open,
  onClose,
  title,
  body,
}) => {
  const portal = usePortalLink();

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>
          {title ?? `Manage your access in the ${portal.name} portal`}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" color="text.secondary" mb={2}>
            {body ??
              `Registering, requesting hotel or report access and checking the status of a request all happen in the ${portal.name} portal. Your device stays registered to this app — only your permissions are managed there.`}
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            This opens in your default browser. You'll sign in there with the same
            Marriott SSO account.
          </Typography>

          <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
            Portal link
          </Typography>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              fontFamily: "monospace",
              fontSize: 13,
              wordBreak: "break-all",
              bgcolor: (theme) =>
                theme.palette.mode === "dark"
                  ? "rgba(255,255,255,0.08)"
                  : "rgba(0,0,0,0.06)",
            }}
          >
            {portal.url}
          </Box>

          {portal.openError && (
            <Alert severity="warning" sx={{ mt: 2, borderRadius: 2 }}>
              {portal.openError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ContentCopyRoundedIcon />}
            onClick={portal.copy}
            sx={ACTION_SX}
          >
            {portal.copied ? "Copied" : "Copy link"}
          </Button>
          <Button
            variant="contained"
            startIcon={<OpenInNewRoundedIcon />}
            onClick={portal.openInBrowser}
            sx={ACTION_SX}
          >
            Open in browser
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={portal.copied}
        autoHideDuration={2500}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" sx={{ borderRadius: 2 }}>
          Portal link copied
        </Alert>
      </Snackbar>
    </>
  );
};

/**
 * Convenience seam for call sites: render `dialog` once, call `openPortal()`
 * from any control (menu item, button, card action).
 */
export function usePortalHandoff(opts?: { title?: string; body?: string }) {
  const [open, setOpen] = useState(false);
  const openPortal = useCallback(() => setOpen(true), []);
  const closePortal = useCallback(() => setOpen(false), []);

  const dialog = (
    <PortalHandoffDialog
      open={open}
      onClose={closePortal}
      title={opts?.title}
      body={opts?.body}
    />
  );

  return { openPortal, closePortal, dialog };
}

export default PortalHandoffDialog;
