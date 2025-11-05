import React, { useState } from "react";
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
  AppBar,
  Toolbar,
  Typography,
  Tabs,
  Tab,
  Container,
  Paper,
  Card,
  CardContent,
  Grid,
  Button,
  Fade,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import EqualizerIcon from "@mui/icons-material/Equalizer";
import SNRIcon from "@mui/icons-material/SignalCellularAlt";
import SuppressIcon from "@mui/icons-material/EqualizerOutlined";
import NoiseGenerator from "./components/NoiseGenerator";
import SNRSimulator from "./components/SNRSimulator";
import NoiseSuppression from "./components/NoiseSuppression";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#7b3fe4" },
    background: {
      default: "#181820",
      paper: "rgba(26, 28, 36, 0.75)",
    },
  },
  typography: {
    fontFamily: ["Inter", "Roboto", "Arial", "sans-serif"].join(","),
  },
});

const GradientBackground = styled(Box)({
  minHeight: "100vh",
  minWidth: "100vw",
  position: "fixed",
  top: 0,
  left: 0,
  background: "linear-gradient(135deg, #102a43 0%, #6366f1 100%)",
  zIndex: -2,
});

function LandingHero({ onStart }) {
  return (
    <Fade in timeout={800}>
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        width="100vw"
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: 200,
        }}
      >
        <GradientBackground />
        <Paper
          elevation={16}
          sx={{
            bgcolor: "rgba(18,24,51,0.96)",
            px: { xs: 3, md: 8 },
            py: { xs: 6, md: 12 },
            borderRadius: 6,
            textAlign: "center",
            maxWidth: 600,
            boxShadow: 16,
            backdropFilter: "blur(16px)",
          }}
        >
          <Typography
            variant="h2"
            sx={{ fontWeight: 800, color: "#e3ebff" }}
            gutterBottom
          >
            🎚 Noise Analyzer
          </Typography>
          <Typography variant="h6" sx={{ color: "#b1c5f4", mb: 3 }}>
            Communication Systems - Noise Theory, Simulation & DSP
          </Typography>
          <Typography sx={{ color: "#b3c4dd", mb: 4 }}>
            The definitive learning and demonstration suite for Noise in Analog
            & Digital Communication. Explore beautiful simulations, real DSP,
            and interactive experiments.
          </Typography>
          <Button
            color="primary"
            variant="contained"
            size="large"
            onClick={onStart}
            sx={{
              fontWeight: 700,
              fontSize: 22,
              px: 7,
              py: 2.5,
              borderRadius: 99,
              boxShadow: 6,
              mt: 2,
              transition: "transform 0.2s",
              "&:hover": {
                transform: "scale(1.04)",
                filter: "brightness(1.14)",
              },
            }}
            disableElevation
          >
            🚀 Start Exploring
          </Button>
          {/* Authors Section */}
          <Box mt={6} mb={-2}>
            <Paper
              elevation={0}
              sx={{
                bgcolor: "rgba(44,62,103,0.93)",
                py: 1.6,
                px: 4,
                borderRadius: 4,
                mt: 2,
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  color: "#c7d6ff",
                  letterSpacing: 2,
                  fontWeight: 600,
                  mb: 0.8,
                }}
              >
                Project Authors
              </Typography>
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                gap={1}
              >
                <Typography sx={{ color: "#e0eaff", fontWeight: 500 }}>
                  Shrish V P
                </Typography>
                <Typography sx={{ color: "#e0eaff", fontWeight: 500 }}>
                  Gokul S
                </Typography>
                <Typography sx={{ color: "#e0eaff", fontWeight: 500 }}>
                  Yogesh Kumar N
                </Typography>
              </Box>
            </Paper>
          </Box>
        </Paper>
      </Box>
    </Fade>
  );
}

function ToolTabPanel({ value, index, children }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      style={{ flex: 1, width: "100%" }}
    >
      {value === index && <Box sx={{ py: 4 }}>{children}</Box>}
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState(0);
  const [showMainApp, setShowMainApp] = useState(false);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GradientBackground />
      {!showMainApp && <LandingHero onStart={() => setShowMainApp(true)} />}
      <Fade in={showMainApp} timeout={700}>
        <Box
          minHeight={"100vh"}
          display={showMainApp ? "flex" : "none"}
          flexDirection="column"
          bgcolor="transparent"
          width="100vw"
        >
          <AppBar
            position="sticky"
            elevation={24}
            style={{
              background: "rgba(12,20,35,0.95)",
              backdropFilter: "blur(8px)",
            }}
          >
            <Toolbar>
              <EqualizerIcon sx={{ fontSize: 38, mr: 2, color: "#a78bfa" }} />
              <Typography
                variant="h5"
                component="div"
                sx={{ flexGrow: 1, fontWeight: 700 }}
              >
                Noise Analyzer
              </Typography>
              <Typography
                variant="subtitle1"
                color="#b8c5e6"
                sx={{
                  fontWeight: 400,
                  pr: 4,
                  display: { xs: "none", sm: "block" },
                }}
              >
                Noise Theory Tool Suite
              </Typography>
            </Toolbar>
          </AppBar>
          <Container
            maxWidth={false}
            disableGutters
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "0",
              p: { xs: 1, sm: 2, md: 4 },
            }}
          >
            <Paper
              sx={{
                width: "100%",
                maxWidth: 950,
                py: { xs: 1.5, sm: 2 },
                px: { xs: 0, sm: 2 },
                borderRadius: 5,
                backdropFilter: "blur(8px)",
                boxShadow: 12,
                bgcolor: "rgba(25,32,67,0.89)",
                mb: 3,
                minHeight: { xs: 420, sm: 520 },
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Tabs
                value={tab}
                onChange={(e, v) => setTab(v)}
                centered
                variant="fullWidth"
                textColor="primary"
                indicatorColor="primary"
                sx={{
                  "& .MuiTabs-indicator": { height: 5, borderRadius: 3 },
                  "& button": { fontWeight: 700 },
                  mb: 2,
                }}
              >
                <Tab icon={<EqualizerIcon />} label="Noise Generator" />
                <Tab icon={<SNRIcon />} label="SNR Simulator" />
                <Tab icon={<SuppressIcon />} label="Noise Suppression" />
              </Tabs>
              <Box sx={{ px: { xs: 0, md: 2 }, flex: 1, overflow: "auto" }}>
                <ToolTabPanel value={tab} index={0}>
                  <NoiseGenerator />
                </ToolTabPanel>
                <ToolTabPanel value={tab} index={1}>
                  <SNRSimulator />
                </ToolTabPanel>
                <ToolTabPanel value={tab} index={2}>
                  <NoiseSuppression />
                </ToolTabPanel>
              </Box>
            </Paper>
            <footer
              style={{
                marginTop: 8,
                padding: 18,
                textAlign: "center",
                color: "#aebfda",
                opacity: 0.85,
                width: "100%",
              }}
            >
              <Typography variant="body2" style={{ fontSize: 15 }}>
                📚 Communication Systems Project • Shrish V P • Gokul S • Yogesh
                Kumar N
              </Typography>
              <Typography
                variant="body2"
                style={{ fontStyle: "italic", fontSize: 14 }}
              >
                Made with ❤️ | All rights reserved 2025
              </Typography>
            </footer>
          </Container>
        </Box>
      </Fade>
    </ThemeProvider>
  );
}
