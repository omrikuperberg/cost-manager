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
} from "@mui/material";
import { addCost } from "../lib/idb";

const currencies = ["USD", "ILS", "GBP", "EURO"];
const categories = [
  "Food",
  "Transportation",
  "Education",
  "Entertainment",
  "Health",
  "Shopping",
  "Bills",
  "Other",
];

function AddCost() {
  const [formData, setFormData] = useState({
    sum: "",
    currency: "USD",
    category: "",
    description: "",
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "sum" ? parseFloat(value) || "" : value,
    }));
    setSuccess(false);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(false);
    setError("");

    // Validation
    if (!formData.sum || formData.sum <= 0) {
      setError("Please enter a valid sum greater than 0");
      return;
    }
    if (!formData.category) {
      setError("Please select a category");
      return;
    }
    if (!formData.description.trim()) {
      setError("Please enter a description");
      return;
    }

    try {
      await addCost({
        sum: parseFloat(formData.sum),
        currency: formData.currency,
        category: formData.category,
        description: formData.description.trim(),
      });

      setSuccess(true);
      setFormData({
        sum: "",
        currency: "USD",
        category: "",
        description: "",
      });
    } catch (err) {
      setError("Failed to add cost: " + err.message);
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Add New Cost Item
      </Typography>
      <Paper elevation={3} sx={{ p: 3, mt: 2 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Sum"
                name="sum"
                type="number"
                value={formData.sum}
                onChange={handleChange}
                required
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Currency"
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                required
              >
                {currencies.map((currency) => (
                  <MenuItem key={currency} value={currency}>
                    {currency}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                multiline
                rows={3}
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
                  Cost item added successfully!
                </Alert>
              )}
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                fullWidth
              >
                Add Cost Item
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
}

export default AddCost;
