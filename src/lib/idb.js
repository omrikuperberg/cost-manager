// React/Module version of idb.js library for IndexedDB operations
// This version is for use with React modules

const DB_NAME = "costsDB";
const DB_VERSION = 1;
const STORE_NAME = "costs";

let dbInstance = null;

/**
 * Opens or creates the IndexedDB database
 * @param {string} databaseName - Name of the database
 * @param {number} databaseVersion - Version number of the database
 * @returns {Promise<IDBDatabase>} Promise that resolves with the database object
 */
export function openCostsDB(
  databaseName = DB_NAME,
  databaseVersion = DB_VERSION
) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, databaseVersion);

    request.onerror = () => {
      reject(new Error("Failed to open database: " + request.error));
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, {
          keyPath: "id",
          autoIncrement: true,
        });

        // Create indexes for efficient queries
        objectStore.createIndex("date", "date", { unique: false });
        objectStore.createIndex("year", "year", { unique: false });
        objectStore.createIndex("month", "month", { unique: false });
        objectStore.createIndex("category", "category", { unique: false });
      }
    };
  });
}

/**
 * Adds a new cost item to the database
 * @param {Object} cost - Cost object with sum, currency, category, description
 * @returns {Promise<Object>} Promise that resolves with the added cost item
 */
export function addCost(cost) {
  return new Promise((resolve, reject) => {
    if (!dbInstance) {
      reject(new Error("Database not opened. Call openCostsDB first."));
      return;
    }

    // Validate cost object
    if (
      !cost ||
      typeof cost.sum !== "number" ||
      typeof cost.currency !== "string" ||
      typeof cost.category !== "string" ||
      typeof cost.description !== "string"
    ) {
      reject(
        new Error(
          "Invalid cost object. Must have sum (number), currency (string), category (string), and description (string)."
        )
      );
      return;
    }

    // Create date object
    const now = new Date();
    const costItem = {
      sum: cost.sum,
      currency: cost.currency,
      category: cost.category,
      description: cost.description,
      date: {
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        day: now.getDate(),
        fullDate: now.toISOString(),
      },
      year: now.getFullYear(),
      month: now.getMonth() + 1,
    };

    const transaction = dbInstance.transaction([STORE_NAME], "readwrite");
    const objectStore = transaction.objectStore(STORE_NAME);
    const request = objectStore.add(costItem);

    request.onsuccess = () => {
      // Return the cost item without the id (as per requirements)
      resolve({
        sum: costItem.sum,
        currency: costItem.currency,
        category: costItem.category,
        description: costItem.description,
      });
    };

    request.onerror = () => {
      reject(new Error("Failed to add cost: " + request.error));
    };
  });
}

/**
 * Gets a detailed report for a specific month and year in a specific currency
 * @param {number} year - Year number
 * @param {number} month - Month number (1-12)
 * @param {string} currency - Target currency for the report
 * @returns {Promise<Object>} Promise that resolves with the report object
 */
export function getReport(year, month, currency) {
  return new Promise((resolve, reject) => {
    if (!dbInstance) {
      reject(new Error("Database not opened. Call openCostsDB first."));
      return;
    }

    const transaction = dbInstance.transaction([STORE_NAME], "readonly");
    const objectStore = transaction.objectStore(STORE_NAME);
    const index = objectStore.index("year");
    const request = index.openCursor(IDBKeyRange.only(year));

    const costs = [];

    request.onsuccess = (event) => {
      const cursor = event.target.result;

      if (cursor) {
        const item = cursor.value;
        // Filter by month
        if (item.month === month) {
          costs.push({
            id: item.id,
            sum: item.sum,
            currency: item.currency,
            category: item.category,
            description: item.description,
            Date: {
              day: item.date.day,
            },
          });
        }
        cursor.continue();
      } else {
        // All items processed, now convert to target currency
        convertCostsToCurrency(costs, currency)
          .then((convertedCosts) => {
            const total = convertedCosts.reduce(
              (sum, cost) => sum + cost.sum,
              0
            );

            resolve({
              year: year,
              month: month,
              costs: convertedCosts,
              total: {
                currency: currency,
                total: total,
              },
            });
          })
          .catch(reject);
      }
    };

    request.onerror = () => {
      reject(new Error("Failed to get report: " + request.error));
    };
  });
}

/**
 * Gets all costs for a specific year (for bar chart)
 * @param {number} year - Year number
 * @returns {Promise<Array>} Promise that resolves with array of cost items
 */
export function getCostsByYear(year) {
  return new Promise((resolve, reject) => {
    if (!dbInstance) {
      reject(new Error("Database not opened. Call openCostsDB first."));
      return;
    }

    const transaction = dbInstance.transaction([STORE_NAME], "readonly");
    const objectStore = transaction.objectStore(STORE_NAME);
    const index = objectStore.index("year");
    const request = index.getAll(IDBKeyRange.only(year));

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(new Error("Failed to get costs: " + request.error));
    };
  });
}

/**
 * Gets all costs for a specific month and year (for pie chart)
 * @param {number} year - Year number
 * @param {number} month - Month number (1-12)
 * @returns {Promise<Array>} Promise that resolves with array of cost items
 */
export function getCostsByMonth(year, month) {
  return new Promise((resolve, reject) => {
    if (!dbInstance) {
      reject(new Error("Database not opened. Call openCostsDB first."));
      return;
    }

    const transaction = dbInstance.transaction([STORE_NAME], "readonly");
    const objectStore = transaction.objectStore(STORE_NAME);
    const index = objectStore.index("year");
    const request = index.openCursor(IDBKeyRange.only(year));

    const costs = [];

    request.onsuccess = (event) => {
      const cursor = event.target.result;

      if (cursor) {
        const item = cursor.value;
        if (item.month === month) {
          costs.push(item);
        }
        cursor.continue();
      } else {
        resolve(costs);
      }
    };

    request.onerror = () => {
      reject(new Error("Failed to get costs: " + request.error));
    };
  });
}

/**
 * Deletes a cost item from the database by its id
 * @param {number} id - The id of the cost item to delete
 * @returns {Promise<void>} Promise that resolves when the item is deleted
 */
export function deleteCost(id) {
  return new Promise((resolve, reject) => {
    if (!dbInstance) {
      reject(new Error("Database not opened. Call openCostsDB first."));
      return;
    }

    if (!id || typeof id !== "number") {
      reject(new Error("Invalid id. Must be a number."));
      return;
    }

    const transaction = dbInstance.transaction([STORE_NAME], "readwrite");
    const objectStore = transaction.objectStore(STORE_NAME);
    const request = objectStore.delete(id);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error("Failed to delete cost: " + request.error));
    };
  });
}

/**
 * Helper function to convert costs to target currency
 * @param {Array} costs - Array of cost items
 * @param {string} targetCurrency - Target currency code
 * @returns {Promise<Array>} Promise that resolves with converted costs
 */
export function convertCostsToCurrency(costs, targetCurrency) {
  return new Promise((resolve, reject) => {
    // Get exchange rates from localStorage
    const exchangeRateUrl =
      localStorage.getItem("exchangeRateUrl") ||
      "https://api.exchangerate-api.com/v4/latest/USD";

    fetch(exchangeRateUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch exchange rates");
        }
        return response.json();
      })
      .then((data) => {
        // Handle different response formats
        let rates = {};

        if (data.rates) {
          // Format: {rates: {USD: 1, GBP: 0.6, ...}}
          rates = data.rates;
        } else if (data.USD !== undefined) {
          // Format: {USD: 1, GBP: 0.6, ...}
          rates = data;
        } else {
          throw new Error("Invalid exchange rate format");
        }

        // Normalize rates to USD base
        const usdRate = rates.USD || 1;
        const targetRate = rates[targetCurrency] || 1;

        const convertedCosts = costs.map((cost) => {
          const costRate = rates[cost.currency] || 1;
          // Convert to USD first, then to target currency
          const usdValue = cost.sum / costRate;
          const convertedSum = usdValue * targetRate;

          return {
            ...cost,
            sum: Math.round(convertedSum * 100) / 100, // Round to 2 decimal places
            currency: targetCurrency,
          };
        });

        resolve(convertedCosts);
      })
      .catch((error) => {
        // Fallback to simple conversion if fetch fails
        console.warn(
          "Failed to fetch exchange rates, using default rates:",
          error
        );
        const defaultRates = {
          USD: 1,
          GBP: 0.6,
          EURO: 0.7,
          ILS: 3.4,
        };

        const convertedCosts = costs.map((cost) => {
          const costRate = defaultRates[cost.currency] || 1;
          const targetRate = defaultRates[targetCurrency] || 1;
          const usdValue = cost.sum / costRate;
          const convertedSum = usdValue * targetRate;

          return {
            ...cost,
            sum: Math.round(convertedSum * 100) / 100,
            currency: targetCurrency,
          };
        });

        resolve(convertedCosts);
      });
  });
}
