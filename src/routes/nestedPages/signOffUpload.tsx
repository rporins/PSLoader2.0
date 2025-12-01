import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Stack,
  Divider,
  Alert,
  TextField,
  Paper,
  LinearProgress,
  Chip,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import UploadIcon from "@mui/icons-material/Upload";
import EditIcon from "@mui/icons-material/Edit";

const StyledCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  boxShadow: theme.shadows[3],
}));

interface ValidationStatus {
  name: string;
  status: "pass" | "fail" | "warning";
  message?: string;
}

export default function SignOffUpload() {
  const [validations, setValidations] = useState<ValidationStatus[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [signature, setSignature] = useState<string>("");
  const [signedOff, setSignedOff] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadComplete, setUploadComplete] = useState<boolean>(false);

  // Fetch validation status
  useEffect(() => {
    const fetchValidations = async () => {
      setLoading(true);
      try {
        if (window.ipcApi) {
          const response = await window.ipcApi.sendIpcRequest("db:get-validation-summary");

          if (response.success && response.data) {
            const data = JSON.parse(response.data);
            setValidations(data);
          }
        }
      } catch (error) {
        console.error("Error fetching validations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchValidations();
  }, []);

  const allValidationsPassed = validations.every(v => v.status === "pass");
  const hasWarnings = validations.some(v => v.status === "warning");

  const handleSignOff = () => {
    if (signature.trim().length > 0) {
      setSignedOff(true);
    }
  };

  const handleUpload = async () => {
    setUploading(true);
    try {
      if (window.ipcApi) {
        // Implement actual upload logic here
        const response = await window.ipcApi.sendIpcRequest("db:upload-data", {
          signature,
          timestamp: new Date().toISOString(),
        });

        if (response.success) {
          setUploadComplete(true);
        }
      }
    } catch (error) {
      console.error("Error uploading data:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Sign-Off & Upload
      </Typography>

      {/* Validation Status Card */}
      <StyledCard>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Validation Status
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {loading ? (
            <LinearProgress />
          ) : (
            <>
              {validations.length === 0 ? (
                <Alert severity="info">
                  No validation data available. Please import data and run validations first.
                </Alert>
              ) : (
                <Stack spacing={1}>
                  {validations.map((validation, index) => (
                    <Paper
                      key={index}
                      sx={{
                        p: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        bgcolor: 'background.default'
                      }}
                    >
                      <Stack direction="row" spacing={2} alignItems="center">
                        {validation.status === "pass" ? (
                          <CheckCircleIcon color="success" />
                        ) : (
                          <ErrorIcon color={validation.status === "fail" ? "error" : "warning"} />
                        )}
                        <Box>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {validation.name}
                          </Typography>
                          {validation.message && (
                            <Typography variant="body2" color="text.secondary">
                              {validation.message}
                            </Typography>
                          )}
                        </Box>
                      </Stack>
                      <Chip
                        label={validation.status.toUpperCase()}
                        color={
                          validation.status === "pass"
                            ? "success"
                            : validation.status === "fail"
                            ? "error"
                            : "warning"
                        }
                        size="small"
                      />
                    </Paper>
                  ))}
                </Stack>
              )}

              {!allValidationsPassed && validations.length > 0 && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  Some validations have not passed. Please review your data before proceeding.
                </Alert>
              )}

              {allValidationsPassed && hasWarnings && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  All critical validations passed, but there are warnings to review.
                </Alert>
              )}

              {allValidationsPassed && !hasWarnings && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  All validations passed successfully!
                </Alert>
              )}
            </>
          )}
        </CardContent>
      </StyledCard>

      {/* Sign-Off Card */}
      <StyledCard>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Digital Sign-Off
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Alert severity="info" sx={{ mb: 3 }}>
            By signing off, you confirm that you have reviewed your P&L for accuracy and that all data
            is correct and ready for upload.
          </Alert>

          {!signedOff ? (
            <Stack spacing={2}>
              <TextField
                label="Enter Your Name to Sign"
                variant="outlined"
                fullWidth
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="Type your full name"
                disabled={!allValidationsPassed}
                InputProps={{
                  startAdornment: <EditIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={handleSignOff}
                disabled={!allValidationsPassed || signature.trim().length === 0}
                fullWidth
              >
                Sign Off
              </Button>
            </Stack>
          ) : (
            <Paper sx={{ p: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <CheckCircleIcon />
                <Box>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Signed by: {signature}
                  </Typography>
                  <Typography variant="body2">
                    {new Date().toLocaleString()}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          )}
        </CardContent>
      </StyledCard>

      {/* Upload Card */}
      {signedOff && (
        <StyledCard>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Upload Data
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {uploadComplete ? (
              <Alert severity="success" icon={<CheckCircleIcon />}>
                Data uploaded successfully!
              </Alert>
            ) : (
              <>
                <Typography variant="body1" paragraph>
                  Ready to upload your data. Click the button below to proceed.
                </Typography>
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleUpload}
                  disabled={uploading}
                  fullWidth
                  startIcon={<UploadIcon />}
                  size="large"
                >
                  {uploading ? "Uploading..." : "Upload Data"}
                </Button>
                {uploading && <LinearProgress sx={{ mt: 2 }} />}
              </>
            )}
          </CardContent>
        </StyledCard>
      )}
    </Box>
  );
}
