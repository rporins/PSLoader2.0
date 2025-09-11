// Import specific React and ReactDOM functions
import React, { useState, useEffect, useCallback, useRef  } from "react";
import { styled, useTheme, Theme, CSSObject } from "@mui/material/styles";
// Import specific components from react-router-dom
import { Routes, Route, Outlet, Link, useNavigate, useMatches } from "react-router-dom";
import Button from "@mui/material/Button";
import MuiAppBar, { AppBarProps as MuiAppBarProps } from "@mui/material/AppBar";
import MuiDrawer from "@mui/material/Drawer";
import CssBaseline from "@mui/material/CssBaseline";
import List from "@mui/material/List";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import InboxIcon from "@mui/icons-material/MoveToInbox";
import MailIcon from "@mui/icons-material/Mail";
import Toolbar from "@mui/material/Toolbar";
import Box from "@mui/material/Box";
import GridOnIcon from "@mui/icons-material/GridOn";
import HomeIcon from "@mui/icons-material/Home";
import ApartmentIcon from "@mui/icons-material/Apartment";
import AccountCircle from "@mui/icons-material/AccountCircle";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import LogoutIcon from "@mui/icons-material/Logout";
import Avatar from "@mui/material/Avatar";
import SettingsIcon from "@mui/icons-material/Settings";
import PersonIcon from "@mui/icons-material/Person";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import NotificationsIcon from "@mui/icons-material/Notifications";
import Badge from "@mui/material/Badge";
import Tooltip from "@mui/material/Tooltip";
import { alpha } from "@mui/material/styles";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import ThemeToggle from "./customComponents/themeToggle";

// IPC API types
interface IpcApi {
  sendIpcRequest: (channel: string, ...args: any[]) => Promise<any>;
  onAuthSuccess: (cb: (event: any, data: any) => void) => void;
  onAuthError: (cb: (event: any, message: string) => void) => void;
  onAuthLogout: (cb: (event: any) => void) => void;
  offAuthSuccess?: (cb: (event: any, data: any) => void) => void;
  offAuthError?: (cb: (event: any, message: string) => void) => void;
  offAuthLogout?: (cb: (event: any) => void) => void;
}

declare global {
  interface Window {
    ipcApi?: IpcApi;
  }
}

// Helper function to decode JWT token (client-side)
function decodeJWT(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

// Helper function to get display name from user data
function getDisplayName(user: any): string {
  console.log("getDisplayName called with user:", user);
  
  if (!user) {
    console.log("No user data, returning 'User'");
    return "User";
  }
  
  // Try to decode the ID token to get user claims
  let decodedClaims = null;
  if (user.id_token) {
    console.log("Found id_token, attempting to decode...");
    decodedClaims = decodeJWT(user.id_token);
    console.log("Decoded claims from id_token:", decodedClaims);
  }
  
  // Try different ways to access the claims data
  const claimsFunction = typeof user.claims === 'function' ? user.claims() : null;
  const claimsObject = user.claims;
  const idTokenClaims = user.idTokenClaims;
  const userinfo = user.userinfo;
  
  console.log("Claims function result:", claimsFunction);
  console.log("Claims object:", claimsObject);
  console.log("ID token claims:", idTokenClaims);
  console.log("Userinfo:", userinfo);
  console.log("Direct user properties:", { 
    given_name: user.given_name,
    name: user.name,
    preferred_username: user.preferred_username,
    email: user.email
  });
  
  // Try all possible sources, prioritizing decoded claims
  const claims = decodedClaims ?? claimsFunction ?? claimsObject ?? idTokenClaims ?? userinfo ?? user;
  
  // Try to get first name first, then full name, then other fallbacks
  const firstName = claims?.given_name || claims?.first_name;
  const fullName = claims?.name;
  const preferredUsername = claims?.preferred_username;
  const email = claims?.email;
  
  console.log("Extracted values:", { firstName, fullName, preferredUsername, email });
  
  // If we have a first name, use that
  if (firstName) {
    console.log("Returning first name:", firstName);
    return String(firstName);
  }
  
  // If we have a full name, try to extract first name
  if (fullName) {
    const nameParts = String(fullName).split(' ');
    console.log("Returning first part of full name:", nameParts[0]);
    return nameParts[0]; // Return first part of the name
  }
  
  // Fallback to other options
  const fromClaims = preferredUsername || email;
  const loose = user.preferred_username || user.name || user.email || user.sub;
  const result = String(fromClaims || loose || "User");
  
  console.log("Returning fallback:", result);
  return result;
}

// Helper function to get user email
function getUserEmail(user: any): string {
  if (!user) return "";
  
  let decodedClaims = null;
  if (user.id_token) {
    decodedClaims = decodeJWT(user.id_token);
  }
  
  const claims = decodedClaims ?? user.claims ?? user.idTokenClaims ?? user.userinfo ?? user;
  return claims?.email || user.email || "";
}

// Custom styled components for modern menu
const StyledMenu = styled(Menu)(({ theme }) => ({
  '& .MuiPaper-root': {
    borderRadius: 12,
    marginTop: theme.spacing(1),
    minWidth: 280,
    boxShadow: '0px 5px 25px rgba(0,0,0,0.15)',
    '& .MuiMenu-list': {
      padding: '8px',
    },
  },
}));

const StyledMenuItem = styled(MenuItem)(({ theme }) => ({
  borderRadius: 8,
  padding: '10px 12px',
  margin: '2px 0',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
  },
  '& .MuiListItemIcon-root': {
    minWidth: 36,
  },
}));

const UserInfoSection = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
}));

export default function SignedInLanding() {
  const drawerWidth = 240;

  const openedMixin = (theme: Theme): CSSObject => ({
    width: drawerWidth,
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    overflowX: "hidden",
  });

  const closedMixin = (theme: Theme): CSSObject => ({
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    overflowX: "hidden",
    width: `calc(${theme.spacing(7)} + 1px)`,
    [theme.breakpoints.up("sm")]: {
      width: `calc(${theme.spacing(8)} + 1px)`,
    },
  });

  const DrawerHeader = styled("div")(({ theme }) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    padding: theme.spacing(0, 1),
    // necessary for content to be below app bar
    minHeight: 48,
    height: 48,
  }));

  interface AppBarProps extends MuiAppBarProps {
    open?: boolean;
  }

  const AppBar = styled(MuiAppBar, {
    shouldForwardProp: (prop) => prop !== "open",
  })<AppBarProps>(({ theme }) => ({
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
    variants: [
      {
        props: ({ open }) => open,
        style: {
          marginLeft: drawerWidth,
          width: `calc(100% - ${drawerWidth}px)`,
          transition: theme.transitions.create(["width", "margin"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        },
      },
    ],
  }));

  const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== "open" })(({ theme }) => ({
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: "nowrap",
    boxSizing: "border-box",
    variants: [
      {
        props: ({ open }) => open,
        style: {
          ...openedMixin(theme),
          "& .MuiDrawer-paper": openedMixin(theme),
        },
      },
      {
        props: ({ open }) => !open,
        style: {
          ...closedMixin(theme),
          "& .MuiDrawer-paper": closedMixin(theme),
        },
      },
    ],
  }));

  const theme = useTheme();
  const [open, setOpen] = React.useState(false);
  const [user, setUser] = useState<any>(null);
  const [notificationCount, setNotificationCount] = useState(3); // Example notification count
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const accountMenuOpen = Boolean(anchorEl);

  // Determine page title from route handle metadata
  const matches = useMatches();
  const pageTitle = React.useMemo(() => {
    const withTitles = [...matches].reverse().find((m: any) => m.handle && (m.handle as any).title);
    return (withTitles?.handle as any)?.title ?? "Planning Tool";
  }, [matches]);


  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const listItemButtonStyle = [{ minHeight: 48, px: 2.5 }, open ? { justifyContent: "initial" } : { justifyContent: "center" }];
  const listItemIconStyle = [{ minWidth: 0, justifyContent: "center" }, open ? { mr: 3 } : { mr: "auto" }];
  const listItemTextStyle = [open ? { opacity: 1 } : { opacity: 0 }];


const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
  setAnchorEl(event.currentTarget);
};

const handleMenuClose = () => {
  setAnchorEl(null);
};

// Menu item handlers
const handleProfile = () => {
  navigate("/signed-in-landing/profile");
  handleMenuClose();
};

const handleSettings = () => {
  navigate("/signed-in-landing/settings");
  handleMenuClose();
};

const handleHelp = () => {
  navigate("/signed-in-landing/help");
  handleMenuClose();
};

// Sign out function
const handleSignOut = useCallback(async () => {
  try {
    if (window.ipcApi) {
      await window.ipcApi.sendIpcRequest("auth-logout");
      navigate("/", { replace: true });
    }
  } catch (error) {
    console.error("Sign out failed:", error);
  }
  handleMenuClose();
}, [navigate]);

  // Get current user data
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        if (window.ipcApi) {
          const authState = await window.ipcApi.sendIpcRequest("auth-check");
          console.log("Auth state from IPC:", authState);
          if (authState?.user) {
            console.log("Setting user in component:", authState.user);
            setUser(authState.user);
          }
        }
      } catch (error) {
        console.error("Failed to get user data:", error);
      }
    };

    getCurrentUser();
  }, []);

  const displayName = user ? getDisplayName(user) : 'User';
  const userEmail = user ? getUserEmail(user) : '';
  const userInitials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar position="fixed" open={open}>
        <Toolbar variant="dense">
          <IconButton
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={[
              {
                marginRight: 5,
                color: 'inherit',
              },
              open && { display: "none" },
            ]}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
            {pageTitle}
          </Typography>
          
          {/* Modern User menu section */}
          <Stack direction="row" spacing={1} alignItems="center">
            {/* Theme toggle (global) */}
            <ThemeToggle />
            {/* Notifications */}
            <Tooltip title="Notifications">
              <IconButton 
                sx={{ 
                  color: 'text.secondary',
                  '&:hover': { 
                    backgroundColor: alpha(theme.palette.primary.main, 0.08) 
                  }
                }}
              >
                <Badge badgeContent={notificationCount} color="error" variant="dot">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* User Avatar and Menu */}
            <IconButton
              onClick={handleMenuOpen}
              size="small"
              sx={{
                ml: 1,
                p: 0.5,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.08),
                },
              }}
              aria-controls={accountMenuOpen ? 'account-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={accountMenuOpen ? 'true' : undefined}
            >
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: theme.palette.primary.main,
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  },
                }}
              >
                {userInitials}
              </Avatar>
            </IconButton>

            <StyledMenu
              id="account-menu"
              anchorEl={anchorEl}
              open={accountMenuOpen}
              onClose={handleMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              slotProps={{
                paper: {
                  sx: {
                    // Force position to right side of screen
                    position: 'fixed !important',
                    right: '16px !important',
                    left: 'auto !important',
                    top: '56px !important', // Adjust based on your AppBar height
                    maxWidth: 320,
                    minWidth: 280,
                    overflow: 'visible',
                    filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.15))',
                    '&:before': {
                      content: '""',
                      display: 'block',
                      position: 'absolute',
                      top: 0,
                      right: 28, // Adjust to align with avatar
                      width: 10,
                      height: 10,
                      bgcolor: 'background.paper',
                      transform: 'translateY(-50%) rotate(45deg)',
                      zIndex: 0,
                    },
                  },
                },
              }}
            >
    {/* User Info Section */}
    <UserInfoSection>
      <Avatar 
        sx={{ 
          width: 48, 
          height: 48, 
          bgcolor: theme.palette.primary.main,
          fontWeight: 600,
        }}
      >
        {userInitials}
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
          {displayName}
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            color: 'text.secondary', 
            fontSize: '0.875rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {userEmail}
        </Typography>
        <Chip 
          label="Pro Plan" 
          size="small" 
          color="primary" 
          variant="outlined"
          sx={{ mt: 0.5, height: 20, fontSize: '0.75rem' }}
        />
      </Box>
    </UserInfoSection>

    {/* Menu Items */}
    <Box sx={{ p: 1 }}>
      <StyledMenuItem onClick={handleProfile}>
        <ListItemIcon>
          <PersonIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>My Profile</ListItemText>
      </StyledMenuItem>

      <StyledMenuItem onClick={handleSettings}>
        <ListItemIcon>
          <SettingsIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Settings</ListItemText>
      </StyledMenuItem>

      <StyledMenuItem onClick={handleHelp}>
        <ListItemIcon>
          <HelpOutlineIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Help & Support</ListItemText>
      </StyledMenuItem>

      <Divider sx={{ my: 1 }} />

      <StyledMenuItem 
        onClick={handleSignOut}
        sx={{
          color: 'error.main',
          '&:hover': {
            backgroundColor: alpha(theme.palette.error.main, 0.08),
          }
        }}
      >
        <ListItemIcon>
          <LogoutIcon fontSize="small" color="error" />
        </ListItemIcon>
        <ListItemText>Sign Out</ListItemText>
              </StyledMenuItem>
            </Box>
            </StyledMenu>
          </Stack>
        </Toolbar>
      </AppBar>
      <Drawer variant="permanent" open={open}>
        <DrawerHeader>
          <IconButton size="small" onClick={handleDrawerClose}>
            {theme.direction === "rtl" ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </DrawerHeader>
        <Divider />
        <List>
          <ListItem key="create_new" disablePadding sx={{ display: "block" }}>
            <ListItemButton sx={listItemButtonStyle} onClick={() => navigate("/signed-in-landing/create-new")}>
              <ListItemIcon sx={listItemIconStyle}>
                <ApartmentIcon />
              </ListItemIcon>
              <ListItemText primary="Create New" sx={listItemTextStyle} />
            </ListItemButton>
          </ListItem>

          <ListItem key="data_table" disablePadding sx={{ display: "block" }}>
            <ListItemButton sx={listItemButtonStyle} onClick={() => navigate("/signed-in-landing/data-table")}>
              <ListItemIcon sx={listItemIconStyle}>
                <GridOnIcon />
              </ListItemIcon>
              <ListItemText primary="Data Table" sx={listItemTextStyle} />
            </ListItemButton>
          </ListItem>

          <ListItem key="navigate" disablePadding sx={{ display: "block" }}>
            <ListItemButton sx={listItemButtonStyle} onClick={() => navigate("/signed-in-landing/report")}>
              <ListItemIcon sx={listItemIconStyle}>
                <HomeIcon />
              </ListItemIcon>
              <ListItemText primary="Report" sx={listItemTextStyle} />
            </ListItemButton>
          </ListItem>

          <ListItem key="COA" disablePadding sx={{ display: "block" }}>
            <ListItemButton sx={listItemButtonStyle} onClick={() => navigate("/signed-in-landing/coa")}>
              <ListItemIcon sx={listItemIconStyle}>
                <AccountBalanceIcon />
              </ListItemIcon>
              <ListItemText primary="COA" sx={listItemTextStyle} />
            </ListItemButton>
          </ListItem>

          <ListItem key="Drafts" disablePadding sx={{ display: "block" }}>
            <ListItemButton sx={listItemButtonStyle}>
              <ListItemIcon sx={listItemIconStyle}>
                <MailIcon />
              </ListItemIcon>
              <ListItemText primary="Drafts" sx={listItemTextStyle} />
            </ListItemButton>
          </ListItem>
        </List>
        <Divider />
        <List>
          <ListItem key="Inbox" disablePadding sx={{ display: "block" }}>
            <ListItemButton sx={listItemButtonStyle}>
              <ListItemIcon sx={listItemIconStyle}>
                <InboxIcon />
              </ListItemIcon>
              <ListItemText primary="Inbox" sx={listItemTextStyle} />
            </ListItemButton>
          </ListItem>

          <ListItem key="Starred" disablePadding sx={{ display: "block" }}>
            <ListItemButton sx={listItemButtonStyle}>
              <ListItemIcon sx={listItemIconStyle}>
                <MailIcon />
              </ListItemIcon>
              <ListItemText primary="Starred" sx={listItemTextStyle} />
            </ListItemButton>
          </ListItem>

          <ListItem key="Send email" disablePadding sx={{ display: "block" }}>
            <ListItemButton sx={listItemButtonStyle}>
              <ListItemIcon sx={listItemIconStyle}>
                <InboxIcon />
              </ListItemIcon>
              <ListItemText primary="Send email" sx={listItemTextStyle} />
            </ListItemButton>
          </ListItem>

          <ListItem key="Drafts" disablePadding sx={{ display: "block" }}>
            <ListItemButton sx={listItemButtonStyle}>
              <ListItemIcon sx={listItemIconStyle}>
                <MailIcon />
              </ListItemIcon>
              <ListItemText primary="Drafts" sx={listItemTextStyle} />
            </ListItemButton>
          </ListItem>
        </List>
        <Divider />
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 2 }}>
        <DrawerHeader />
        <Outlet />
      </Box>
    </Box>
  );
}
