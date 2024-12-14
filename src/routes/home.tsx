// Import specific React and ReactDOM functions
import React from "react";
import { createRoot } from "react-dom/client";
import { styled } from "@mui/material/styles";
// Import specific components from react-router-dom
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Grid from "@mui/material/Grid2";
import { Box } from "@mui/material";
import TextField from "@mui/material/TextField";
import Card from "@mui/material/Card";
import InputLabel from "@mui/material/InputLabel";
import InputAdornment from "@mui/material/InputAdornment";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import FormHelperText from "@mui/material/FormHelperText";
import FormControl from "@mui/material/FormControl";
import FilledInput from "@mui/material/FilledInput";
import IconButton from "@mui/material/IconButton";
import OutlinedInput from "@mui/material/OutlinedInput";
import Typography from "@mui/material/Typography";
import { WidthFull } from "@mui/icons-material";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const [showPassword, setShowPassword] = React.useState(false);
  const handleClickShowPassword = () => setShowPassword((show) => !show);
  const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };
  const handleMouseUpPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  const navigate = useNavigate();
  const handleNavigation = () => {
    navigate("/landing", { replace: true });
  };

  return (
    <div
      style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1445019980597-93fa8acb246c?q=80&w=2074&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        height: "100vh", // Optional: Full screen height
        width: "100%", // Optional: Full width
      }}
    >
      <Box
        sx={{
          height: "100vh", // Full height of the viewport
          display: "flex",
          justifyContent: "center", // Centers horizontally
          alignItems: "center", // Centers vertically
        }}
      >
        <Card
          sx={{
            minWidth: 275,
            maxWidth: 400,
            margin: 4,
            padding: 2,
            background: "rgba(255, 255, 255, 0.85)",
          }}
        >
          <Box
            component="form"
            sx={{
              flexGrow: 1,
              width: "100%",
            }}
          >
            <Grid container spacing={2}>
              <Grid size={12}>
                <Typography variant="h4" align="center" margin={2}>
                  Planning Tool
                </Typography>
              </Grid>
              <Grid size={12}>
                <TextField sx={{ m: 0, width: "100%" }} id="outlined-required" label="Username" defaultValue="" />
              </Grid>
              <Grid size={12}>
                <FormControl variant="outlined" sx={{ m: 0, width: "100%" }}>
                  <InputLabel htmlFor="outlined-adornment-password">Password</InputLabel>
                  <OutlinedInput
                    id="outlined-adornment-password"
                    type={showPassword ? "text" : "password"}
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleClickShowPassword}
                          onMouseDown={handleMouseDownPassword}
                          onMouseUp={handleMouseUpPassword}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    }
                    label="Password"
                  />
                </FormControl>
              </Grid>
              <Grid size={12}>
                <Button variant="contained" sx={{ marginTop: 1, width: "100%" }} onClick={handleNavigation}>
                  Sign In
                </Button>
              </Grid>
              <Grid size={12}>
                <Typography variant="subtitle2" align="center" margin={1}>
                  Don't have an account? <a href="#">Sign Up</a>
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </Card>
      </Box>
    </div>
  );
}
