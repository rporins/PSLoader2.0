import React, { useState, useEffect } from "react";
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
  Select,
  MenuItem,
  InputLabel,
  Alert,
  CircularProgress,
  Button,
  Stack,
  Tooltip,
  IconButton,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import CachedIcon from "@mui/icons-material/Cached";
import { useSettingsStore } from "../../store/settings";
import authService, { Hotel } from "../../services/auth";

// IPC API types
interface IpcApi {
  sendIpcRequest: (channel: string, ...args: any[]) => Promise<any>;
}

declare global {
  interface Window {
    ipcApi?: IpcApi;
  }
}

export default function Settings() {
  const themeMode = useSettingsStore((s) => s.themeMode);
  const setThemeMode = useSettingsStore((s) => s.setThemeMode);
  const selectedHotelOu = useSettingsStore((s) => s.selectedHotelOu);
  const setSelectedHotelOu = useSettingsStore((s) => s.setSelectedHotelOu);

  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loadingHotels, setLoadingHotels] = useState(false);
  const [hotelsError, setHotelsError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [usingCache, setUsingCache] = useState(false);

  const loadHotels = async (forceRefresh = false) => {
    try {
      setLoadingHotels(true);
      setHotelsError(null);

      let hotelList: Hotel[] = [];

      if (!forceRefresh && window.ipcApi) {
        // Try to get from cache first
        try {
          const cachedHotelsResponse = await window.ipcApi.sendIpcRequest("db:get-cached-hotels");
          if (cachedHotelsResponse?.data) {
            const cachedHotels = JSON.parse(cachedHotelsResponse.data);
            if (cachedHotels && cachedHotels.length > 0) {
              hotelList = cachedHotels;
              setUsingCache(true);
              console.log("Using cached hotels in settings");
            }
          }
        } catch (cacheError) {
          console.warn("Failed to get cached hotels:", cacheError);
        }
      }

      // If no cache or force refresh, fetch from API
      if (hotelList.length === 0 || forceRefresh) {
        if (forceRefresh) {
          // Clear cache first if refreshing
          hotelList = await authService.refreshHotelsCache();
        } else {
          hotelList = await authService.getHotels();
        }
        setUsingCache(false);
      }

      setHotels(hotelList);
    } catch (err: any) {
      console.error('Failed to load hotels:', err);
      setHotelsError(err.message || 'Failed to load hotels');
    } finally {
      setLoadingHotels(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadHotels();
  }, []);

  const handleRefreshHotels = async () => {
    setIsRefreshing(true);
    await loadHotels(true);
  };

  const handleThemeChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const mode = event.target.value as "light" | "dark";
    await setThemeMode(mode);
    // Settings are now saved automatically within setThemeMode
  };

  const handleHotelChange = async (event: any) => {
    const ou = event.target.value;
    await setSelectedHotelOu(ou);
    // Settings are now saved automatically within setSelectedHotelOu
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

      <Card variant="outlined" sx={{ mt: 2, borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Hotel Settings
              </Typography>
              {usingCache && (
                <Tooltip title="Using cached data">
                  <CachedIcon fontSize="small" color="action" />
                </Tooltip>
              )}
            </Stack>
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={handleRefreshHotels}
              disabled={isRefreshing}
              sx={{
                borderRadius: 1,
                textTransform: 'none',
                minWidth: 'auto',
                px: 2,
              }}
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </Stack>
          <Divider sx={{ mb: 3 }} />

          {hotelsError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {hotelsError}
            </Alert>
          )}

          <FormControl fullWidth>
            <InputLabel id="hotel-select-label">Select Hotel OU</InputLabel>
            <Select
              labelId="hotel-select-label"
              id="hotel-select"
              value={selectedHotelOu || ''}
              label="Select Hotel OU"
              onChange={handleHotelChange}
              disabled={loadingHotels}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {hotels.map((hotel) => (
                <MenuItem key={hotel.ou} value={hotel.ou}>
                  {hotel.hotel_name} ({hotel.ou}) - {hotel.room_count} rooms
                </MenuItem>
              ))}
            </Select>
            {loadingHotels && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <CircularProgress size={20} />
              </Box>
            )}
          </FormControl>
        </CardContent>
      </Card>
    </Box>
  );
}