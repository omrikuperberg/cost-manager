import React, { useState } from "react";
import {
  Box,
  Paper,
  TextField,
  Button,
  MenuItem,
  Typography,
  Alert,
  Grid,
  CircularProgress,
} from "@mui/material";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { getCostsByYear, convertCostsToCurrency } from "../lib/idb";

const currencies = ["USD", "ILS", "GBP", "EURO"];
const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function BarChart() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [currency, setCurrency] = useState("USD");
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGetChart = async () => {
    setLoading(true);
    setError("");
    setChartData(null);

    try {
      const costs = await getCostsByYear(year);

      if (costs.length === 0) {
        setError("No costs found for this year.");
        setLoading(false);
        return;
      }

      // Convert to target currency
      const convertedCosts = await convertCostsToCurrency(costs, currency);

      // Initialize monthly totals
      const monthlyTotals = {};
      for (let i = 1; i <= 12; i++) {
        monthlyTotals[i] = 0;
      }

      // Sum costs by month
      convertedCosts.forEach((cost) => {
        monthlyTotals[cost.month] += cost.sum;
      });

      // Convert to chart data format
      const data = Object.entries(monthlyTotals).map(([month, total]) => ({
        month: monthNames[parseInt(month) - 1],
        total: Math.round(total * 100) / 100,
      }));

      setChartData(data);
    } catch (err) {
      setError("Failed to get chart data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Monthly Costs (Bar Chart)
      </Typography>
      <Paper elevation={3} sx={{ p: 3, mt: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Year"
              type="number"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              inputProps={{ min: 2000, max: 2100 }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              select
              label="Currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              {currencies.map((curr) => (
                <MenuItem key={curr} value={curr}>
                  {curr}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleGetChart}
              disabled={loading}
              size="large"
            >
              {loading ? <CircularProgress size={24} /> : "Show Chart"}
            </Button>
          </Grid>
        </Grid>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {chartData && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              {year} - Monthly Costs ({currency})
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <RechartsBarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value) => `${value.toFixed(2)} ${currency}`}
                />
                <Legend />
                <Bar
                  dataKey="total"
                  fill="#8884d8"
                  name={`Total (${currency})`}
                />
              </RechartsBarChart>
            </ResponsiveContainer>
          </Box>
        )}
      </Paper>
    </Box>
  );
}

export default BarChart;
