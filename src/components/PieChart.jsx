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
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { getCostsByMonth, convertCostsToCurrency } from "../lib/idb";

const currencies = ["USD", "ILS", "GBP", "EURO"];
const months = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const COLORS = [
  "#4fc3f7",
  "#4dd0e1",
  "#81c784",
  "#ffb74d",
  "#ba68c8",
  "#64b5f6",
  "#ffa726",
  "#ef5350",
];

function PieChart() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [currency, setCurrency] = useState("USD");
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGetChart = async () => {
    setLoading(true);
    setError("");
    setChartData(null);

    try {
      const costs = await getCostsByMonth(year, month);

      if (costs.length === 0) {
        setError("No costs found for this period.");
        setLoading(false);
        return;
      }

      // Convert to target currency
      const convertedCosts = await convertCostsToCurrency(costs, currency);

      // Group by category
      const categoryMap = {};
      convertedCosts.forEach((cost) => {
        if (!categoryMap[cost.category]) {
          categoryMap[cost.category] = 0;
        }
        categoryMap[cost.category] += cost.sum;
      });

      // Convert to chart data format
      const data = Object.entries(categoryMap).map(([name, value]) => ({
        name,
        value: Math.round(value * 100) / 100,
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
        Costs by Category (Pie Chart)
      </Typography>
      <Paper elevation={3} sx={{ p: 3, mt: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="Year"
              type="number"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              inputProps={{ min: 2000, max: 2100 }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              select
              label="Month"
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
            >
              {months.map((m) => (
                <MenuItem key={m.value} value={m.value}>
                  {m.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={3}>
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
          <Grid item xs={12} sm={3}>
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

        {chartData && chartData.length > 0 && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              {months.find((m) => m.value === month)?.label} {year} - Total by
              Category ({currency})
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <RechartsPieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => `${value.toFixed(2)} ${currency}`}
                  contentStyle={{
                    backgroundColor: "#1e1e1e",
                    border: "1px solid #424242",
                    color: "#ffffff",
                  }}
                />
                <Legend wrapperStyle={{ color: "#ffffff" }} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </Box>
        )}
      </Paper>
    </Box>
  );
}

export default PieChart;
