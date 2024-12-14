// Import specific React and ReactDOM functions
import React from "react";
import { styled, useTheme, Theme, CSSObject } from "@mui/material/styles";
// Import specific components from react-router-dom
import { Routes, Route, Outlet, Link, useNavigate } from "react-router-dom";
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

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const listItemButtonStyle = [{ minHeight: 48, px: 2.5 }, open ? { justifyContent: "initial" } : { justifyContent: "center" }];
  const listItemIconStyle = [{ minWidth: 0, justifyContent: "center" }, open ? { mr: 3 } : { mr: "auto" }];
  const listItemTextStyle = [open ? { opacity: 1 } : { opacity: 0 }];

  //navigation
  const navigate = useNavigate();

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar position="fixed" open={open}>
        <Toolbar variant="dense">
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={[
              {
                marginRight: 5,
              },
              open && { display: "none" },
            ]}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            Planning Tool
          </Typography>
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
            <ListItemButton sx={listItemButtonStyle} onClick={() => navigate("/signed-in-landing/hello")}>
              <ListItemIcon sx={listItemIconStyle}>
                <HomeIcon />
              </ListItemIcon>
              <ListItemText primary="Navigate" sx={listItemTextStyle} />
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
