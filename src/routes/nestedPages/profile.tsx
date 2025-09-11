import React, { useEffect, useMemo, useState } from "react";
import { Box, Typography, Avatar, Card, CardContent, Divider, Stack, Button, Chip } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

interface IpcApi {
  sendIpcRequest: (channel: string, ...args: any[]) => Promise<any>;
}

declare global {
  interface Window {
    ipcApi?: IpcApi;
  }
}

function decodeJWT(token: string): any {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function extractUser(user: any) {
  if (!user) return { name: "User", email: "" };
  const decoded = user.id_token ? decodeJWT(user.id_token) : null;
  const claims = decoded ?? user.claims ?? user.idTokenClaims ?? user.userinfo ?? user;
  const fullName = claims?.name || user.name;
  const firstName = claims?.given_name;
  const name = firstName ? String(firstName) : (fullName ? String(String(fullName).split(" ")[0]) : "User");
  const email = claims?.email || user.email || "";
  return { name, email };
}

export default function Profile() {
  const theme = useTheme();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (window.ipcApi) {
          const authState = await window.ipcApi.sendIpcRequest("auth-check");
          if (authState?.user) setUser(authState.user);
        }
      } catch (e) {
        // no-op for mock page
      }
    };
    fetchUser();
  }, []);

  const { name, email } = useMemo(() => extractUser(user), [user]);
  const initials = useMemo(
    () => name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2),
    [name]
  );

  return (
    <Box sx={{ maxWidth: 900, mx: "auto" }}>
      <Card variant="outlined" sx={{ mb: 2, borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
        <CardContent>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "flex-start", sm: "center" }}>
            <Avatar sx={{ width: 64, height: 64, bgcolor: theme.palette.primary.main, fontWeight: 700 }}>
              {initials}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                {name}
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>{email}</Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Chip size="small" color="primary" variant="outlined" label="Pro Plan" />
                <Chip size="small" variant="outlined" label="Member since 2025" />
              </Stack>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button variant="contained" disabled>Edit Profile</Button>
              <Button variant="outlined" disabled sx={{ bgcolor: alpha(theme.palette.text.primary, 0.02) }}>
                Change Password
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ borderRadius: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
            Account Details
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Stack spacing={1.5}>
            <Box>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>Full Name</Typography>
              <Typography variant="body1">{name}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>Email</Typography>
              <Typography variant="body1">{email || "—"}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>Status</Typography>
              <Typography variant="body1">Active</Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
