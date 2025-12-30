import React, { useEffect, useState } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import {
  Container,
  AppBar,
  Toolbar,
  Typography,
  Tabs,
  Tab,
  Box,
} from "@mui/material";
import { openCostsDB } from "./lib/idb";
import AddCost from "./components/AddCost";
import Report from "./components/Report";
import PieChart from "./components/PieChart";
import BarChart from "./components/BarChart";
import Settings from "./components/Settings";

const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
  },
});

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function App() {
  const [tabValue, setTabValue] = useState(0);
  const [dbInitialized, setDbInitialized] = useState(false);

  useEffect(() => {
    // Initialize database on app load
    openCostsDB("costsDB", 1)
      .then(() => {
        setDbInitialized(true);
      })
      .catch((error) => {
        console.error("Failed to initialize database:", error);
        alert("Failed to initialize database. Please refresh the page.");
      });
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  if (!dbInitialized) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Container>
          <Typography variant="h6" sx={{ mt: 4, textAlign: "center" }}>
            Initializing database...
          </Typography>
        </Container>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Cost Manager Application
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="cost manager tabs"
          >
            <Tab label="Add Cost" />
            <Tab label="Report" />
            <Tab label="Pie Chart" />
            <Tab label="Bar Chart" />
            <Tab label="Settings" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <AddCost />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <Report />
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <PieChart />
        </TabPanel>
        <TabPanel value={tabValue} index={3}>
          <BarChart />
        </TabPanel>
        <TabPanel value={tabValue} index={4}>
          <Settings />
        </TabPanel>
      </Container>
    </ThemeProvider>
  );
}

export default App;
