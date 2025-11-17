import React, { useEffect, useState } from "react";
import { CircularProgress, Box, Typography } from "@mui/material";
import { useSettingsStore } from "../store/settings";

interface AppInitializerProps {
  children: React.ReactNode;
}

/**
 * AppInitializer Component
 * Ensures all app settings are loaded from the database before rendering children
 * This prevents any race conditions with settings persistence
 */
const AppInitializer: React.FC<AppInitializerProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadSettingsFromDb = useSettingsStore((s) => s.loadSettingsFromDb);
  const storeInitialized = useSettingsStore((s) => s.initialized);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log("Initializing app settings...");

        // Load settings from database
        await loadSettingsFromDb();

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
    }
  }, [loadSettingsFromDb, storeInitialized, isInitialized]);

  // Show loading screen while initializing
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