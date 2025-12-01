import { Box, Typography, Card, CardContent, Stack, Divider, Paper } from "@mui/material";
import { styled } from "@mui/material/styles";
import InfoIcon from "@mui/icons-material/Info";

const StyledCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  boxShadow: theme.shadows[3],
}));

export default function Home() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Welcome to PSLoader
      </Typography>

      <StyledCard>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <InfoIcon color="primary" />
            <Typography variant="h6">About This Tool</Typography>
          </Stack>
          <Divider sx={{ mb: 2 }} />

          <Typography variant="body1" paragraph>
            PSLoader is a comprehensive financial planning and data management tool designed to streamline
            your workflow for importing, validating, and reporting financial data.
          </Typography>

          <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
            Getting Started
          </Typography>

          <Stack spacing={2}>
            <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                1. Import Your Data
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Navigate to <strong>Data Import</strong> to upload your financial data files.
              </Typography>
            </Paper>

            <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                2. Review Validations
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Check the <strong>Validations</strong> page to ensure your data meets all requirements.
              </Typography>
            </Paper>

            <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                3. Sign-Off & Upload
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Once validated, proceed to <strong>Sign-Off & Upload</strong> to finalize and submit your data.
              </Typography>
            </Paper>

            <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                4. View Reports
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Access various reports including <strong>P&L</strong>, <strong>Data Table</strong>, and custom <strong>Reports</strong>.
              </Typography>
            </Paper>
          </Stack>
        </CardContent>
      </StyledCard>
    </Box>
  );
}
