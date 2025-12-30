# Cost Manager Application

A front-end cost management application built with React, Material-UI, and IndexedDB.

## Features

1. **Add Cost Items**: Users can add new cost items with sum, currency, category, and description
2. **Detailed Reports**: Get detailed reports for specific months and years in selected currencies
3. **Pie Chart**: Visualize total costs by category for a selected month and year
4. **Bar Chart**: View total costs for each month in a selected year
5. **Currency Conversion**: Support for USD, ILS, GBP, and EURO with exchange rate fetching
6. **Settings**: Configure the URL for fetching currency exchange rates

## Technology Stack

- **React 18**: UI framework
- **Material-UI (MUI)**: Component library
- **IndexedDB**: Client-side database
- **Recharts**: Charting library
- **Vite**: Build tool

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## Project Structure

```
├── idb.js                 # Vanilla JS version of IndexedDB library (for testing)
├── src/
│   ├── lib/
│   │   └── idb.js        # React/Module version of IndexedDB library
│   ├── components/
│   │   ├── AddCost.jsx   # Component for adding cost items
│   │   ├── Report.jsx    # Component for detailed reports
│   │   ├── PieChart.jsx  # Component for category pie chart
│   │   ├── BarChart.jsx  # Component for monthly bar chart
│   │   └── Settings.jsx  # Component for settings
│   ├── App.jsx           # Main application component
│   ├── main.jsx         # Application entry point
│   └── index.css        # Global styles
├── test-idb.html        # Test file for idb.js library
└── exchange-rates.json  # Sample exchange rates file
```

## idb.js Library

The application includes two versions of the IndexedDB wrapper library:

1. **Vanilla JS version** (`idb.js`): For use in HTML files and testing
2. **React/Module version** (`src/lib/idb.js`): For use with React modules

### API

- `openCostsDB(databaseName, databaseVersion)`: Opens or creates the database
- `addCost(cost)`: Adds a new cost item
- `getReport(year, month, currency)`: Gets a detailed report for a month/year in a currency

## Exchange Rates

The application fetches exchange rates from a configurable URL. The default format expected is:

```json
{
  "USD": 1,
  "GBP": 0.6,
  "EURO": 0.7,
  "ILS": 3.4
}
```

Or with a `rates` wrapper:

```json
{
  "rates": {
    "USD": 1,
    "GBP": 0.6,
    "EURO": 0.7,
    "ILS": 3.4
  }
}
```

The server must include the `Access-Control-Allow-Origin: *` header for CORS.

## Testing

To test the vanilla `idb.js` library, open `test-idb.html` in a web browser.

## Browser Support

The application is designed for desktop web browsers that support:
- IndexedDB
- ES6+ JavaScript
- Fetch API

