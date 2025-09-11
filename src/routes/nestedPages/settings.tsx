import React from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Divider,
} from "@mui/material";
import { useSettingsStore } from "../../store/settings";

export default function Settings() {
  const themeMode = useSettingsStore((s) => s.themeMode);
  const setThemeMode = useSettingsStore((s) => s.setThemeMode);
  const saveSettings = useSettingsStore((s) => s.saveSettingsToDb);

  const handleThemeChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const mode = event.target.value as "light" | "dark";
    setThemeMode(mode);
    await saveSettings();
  };

  return (
    <Box sx={{ maxWidth: 800, mx: "auto" }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
        Settings
      </Typography>
      
      <Card variant="outlined" sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Appearance
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          <FormControl component="fieldset">
            <FormLabel component="legend" sx={{ mb: 2 }}>
              Theme
            </FormLabel>
            <RadioGroup
              value={themeMode}
              onChange={handleThemeChange}
            >
              <FormControlLabel
                value="light"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body1">Light</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Clean and bright interface
                    </Typography>
                  </Box>
                }
                sx={{ mb: 1 }}
              />
              <FormControlLabel
                value="dark"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body1">Dark</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Easy on the eyes in low light
                    </Typography>
                  </Box>
                }
              />
            </RadioGroup>
          </FormControl>
        </CardContent>
      </Card>
    </Box>
  );
}