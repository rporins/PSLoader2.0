import React, { useEffect, useState } from "react";
import { CircularProgress, Box, Typography } from "@mui/material";
import { useSettingsStore } from "../store/settings";
import UpdateChecker from "./UpdateChecker";
import backgroundSyncService from "../services/backgroundSync";

interface AppInitializerProps {
  children: React.ReactNode;
}

/**
 * AppInitializer Component
 * 1. Checks for updates first (blocking - user must wait for download/install)
 * 2. Then loads app settings from database
 * 3. Finally renders the main app
 */
const AppInitializer: React.FC<AppInitializerProps> = ({ children }) => {
  const [updateCheckComplete, setUpdateCheckComplete] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadSettingsFromDb = useSettingsStore((s) => s.loadSettingsFromDb);
  const storeInitialized = useSettingsStore((s) => s.initialized);

  // Step 1: Check for updates (blocking)
  const handleUpdateComplete = () => {
    console.log("Update check completed, proceeding to app initialization");
    setUpdateCheckComplete(true);
  };

  // Step 2: Initialize app settings after update check
  useEffect(() => {
    if (!updateCheckComplete) return;

    const initializeApp = async () => {
      try {
        console.log("Initializing app settings...");

        // Load settings from database
        await loadSettingsFromDb();

        // Start background sync service
        backgroundSyncService.start();
        console.log("Background sync service started");

        console.log("App settings initialized successfully");
        setIsInitialized(true);
      } catch (err) {
        console.error("Failed to initialize app:", err);
        setError(err instanceof Error ? err.message : "Failed to initialize app");
        // Still mark as initialized to allow app to run with defaults
        setIsInitialized(true);
      }
    };

    // Only initialize if not already done
    if (!storeInitialized && !isInitialized) {
      initializeApp();
    } else if (storeInitialized) {
      setIsInitialized(true);
      // Still start background sync if already initialized
      backgroundSyncService.start();
    }

    // Cleanup: stop background sync on unmount
    return () => {
      backgroundSyncService.stop();
    };
  }, [updateCheckComplete, loadSettingsFromDb, storeInitialized, isInitialized]);

  // Show update checker first (blocks app until update complete)
  if (!updateCheckComplete) {
    return <UpdateChecker onUpdateComplete={handleUpdateComplete} />;
  }

  // Show loading screen while initializing settings
  if (!isInitialized) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          gap: 2,
        }}
      >
        <CircularProgress />
        <Typography variant="body1" color="text.secondary">
          Loading settings...
        </Typography>
      </Box>
    );
  }

  // Show error if initialization failed (optional - you might want to still render the app)
  if (error) {
    console.warn("App initialized with error:", error);
    // We still render children to allow the app to work with defaults
  }

  return <>{children}</>;
};

export default AppInitializer;