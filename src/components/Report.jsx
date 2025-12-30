import React, { useState } from "react";
import {
  Box,
  Paper,
  TextField,
  Button,
  MenuItem,
  Typography,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
  CircularProgress,
  IconButton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { getReport, deleteCost } from "../lib/idb";

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

function Report() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [currency, setCurrency] = useState("USD");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGetReport = async () => {
    setLoading(true);
    setError("");
    setReport(null);

    try {
      const result = await getReport(year, month, currency);
      setReport(result);
    } catch (err) {
      setError("Failed to get report: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this cost item?")) {
      return;
    }

    try {
      await deleteCost(id);
      // Refresh the report after deletion
      const result = await getReport(year, month, currency);
      setReport(result);
    } catch (err) {
      setError("Failed to delete cost: " + err.message);
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Detailed Report
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
              onClick={handleGetReport}
              disabled={loading}
              size="large"
            >
              {loading ? <CircularProgress size={24} /> : "Get Report"}
            </Button>
          </Grid>
        </Grid>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {report && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Report for {months.find((m) => m.value === report.month)?.label}{" "}
              {report.year}
            </Typography>
            <Typography variant="body1" gutterBottom>
              Total: {report.total.total.toFixed(2)} {report.total.currency}
            </Typography>

            {report.costs.length === 0 ? (
              <Alert severity="info" sx={{ mt: 2 }}>
                No costs found for this period.
              </Alert>
            ) : (
              <TableContainer sx={{ mt: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Day</TableCell>
                      <TableCell>Sum</TableCell>
                      <TableCell>Currency</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {report.costs.map((cost, index) => (
                      <TableRow key={index}>
                        <TableCell>{cost.Date.day}</TableCell>
                        <TableCell>{cost.sum.toFixed(2)}</TableCell>
                        <TableCell>{cost.currency}</TableCell>
                        <TableCell>{cost.category}</TableCell>
                        <TableCell>{cost.description}</TableCell>
                        <TableCell align="center">
                          <IconButton
                            onClick={() => handleDelete(cost.id)}
                            color="error"
                            aria-label="delete"
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
}

export default Report;
