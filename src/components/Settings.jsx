import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  Grid,
} from "@mui/material";

function Settings() {
  const [exchangeRateUrl, setExchangeRateUrl] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Load saved URL from localStorage
    const savedUrl = localStorage.getItem("exchangeRateUrl");
    if (savedUrl) {
      setExchangeRateUrl(savedUrl);
    }
  }, []);

  const handleSave = async () => {
    setSuccess(false);
    setError("");

    if (!exchangeRateUrl.trim()) {
      setError("Please enter a valid URL");
      return;
    }

    // Validate URL format
    try {
      new URL(exchangeRateUrl);
    } catch (e) {
      setError("Please enter a valid URL format");
      return;
    }

    // Test the URL by fetching
    try {
      const response = await fetch(exchangeRateUrl);
      if (!response.ok) {
        throw new Error("Failed to fetch from URL");
      }
      const data = await response.json();

      // Validate JSON structure
      if (
        data.USD === undefined &&
        (!data.rates || data.rates.USD === undefined)
      ) {
        setError(
          'Invalid exchange rate format. Expected format: {"USD":1, "GBP":0.6, ...} or {"rates": {"USD":1, ...}}'
        );
        return;
      }

      // Save to localStorage
      localStorage.setItem("exchangeRateUrl", exchangeRateUrl.trim());
      setSuccess(true);
    } catch (err) {
      setError(
        "Failed to validate URL: " +
          err.message +
          ". Please ensure the URL is accessible and returns valid JSON."
      );
    }
  };

  const handleReset = () => {
    localStorage.removeItem("exchangeRateUrl");
    setExchangeRateUrl("");
    setSuccess(true);
    setError("");
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Settings
      </Typography>
      <Paper elevation={3} sx={{ p: 3, mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          Exchange Rate URL Configuration
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Configure the URL for fetching currency exchange rates. The URL should
          return a JSON object with the format:{" "}
          {'{"USD":1, "GBP":0.6, "EURO":0.7, "ILS":3.4}'} or{" "}
          {'{"rates": {"USD":1, ...}}'}. The server must include the
          Access-Control-Allow-Origin header with value "*".
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Exchange Rate URL"
              value={exchangeRateUrl}
              onChange={(e) => {
                setExchangeRateUrl(e.target.value);
                setSuccess(false);
                setError("");
              }}
              placeholder="https://example.com/api/exchange-rates.json"
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Settings saved successfully!
              </Alert>
            )}
          </Grid>
          <Grid item xs={12} sm={6}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={handleSave}
              size="large"
            >
              Save Settings
            </Button>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Button
              fullWidth
              variant="outlined"
              color="secondary"
              onClick={handleReset}
              size="large"
            >
              Reset to Default
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}

export default Settings;
