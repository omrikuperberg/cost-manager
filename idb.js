// Vanilla JS version of idb.js library for IndexedDB operations
// This version is for automatic testing and can be used in HTML files

(function(global) {
  'use strict';

  const idb = {
    db: null,
    storeName: 'costs',

    /**
     * Opens or creates the IndexedDB database
     * @param {string} databaseName - Name of the database
     * @param {number} databaseVersion - Version number of the database
     * @returns {Promise<IDBDatabase>} Promise that resolves with the database object
     */
    openCostsDB: function(databaseName, databaseVersion) {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(databaseName, databaseVersion);

        request.onerror = () => {
          reject(new Error('Failed to open database: ' + request.error));
        };

        request.onsuccess = () => {
          this.db = request.result;
          resolve(this.db);
        };

        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          
          // Create object store if it doesn't exist
          if (!db.objectStoreNames.contains(this.storeName)) {
            const objectStore = db.createObjectStore(this.storeName, {
              keyPath: 'id',
              autoIncrement: true
            });
            
            // Create indexes for efficient queries
            objectStore.createIndex('date', 'date', { unique: false });
            objectStore.createIndex('year', 'year', { unique: false });
            objectStore.createIndex('month', 'month', { unique: false });
            objectStore.createIndex('category', 'category', { unique: false });
          }
        };
      });
    },

    /**
     * Adds a new cost item to the database
     * @param {Object} cost - Cost object with sum, currency, category, description
     * @returns {Promise<Object>} Promise that resolves with the added cost item
     */
    addCost: function(cost) {
      return new Promise((resolve, reject) => {
        if (!this.db) {
          reject(new Error('Database not opened. Call openCostsDB first.'));
          return;
        }

        // Validate cost object
        if (!cost || typeof cost.sum !== 'number' || 
            typeof cost.currency !== 'string' || 
            typeof cost.category !== 'string' || 
            typeof cost.description !== 'string') {
          reject(new Error('Invalid cost object. Must have sum (number), currency (string), category (string), and description (string).'));
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
            fullDate: now.toISOString()
          },
          year: now.getFullYear(),
          month: now.getMonth() + 1
        };

        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const objectStore = transaction.objectStore(this.storeName);
        const request = objectStore.add(costItem);

        request.onsuccess = () => {
          // Return the cost item without the id (as per requirements)
          resolve({
            sum: costItem.sum,
            currency: costItem.currency,
            category: costItem.category,
            description: costItem.description
          });
        };

        request.onerror = () => {
          reject(new Error('Failed to add cost: ' + request.error));
        };
      });
    },

    /**
     * Gets a detailed report for a specific month and year in a specific currency
     * @param {number} year - Year number
     * @param {number} month - Month number (1-12)
     * @param {string} currency - Target currency for the report
     * @returns {Promise<Object>} Promise that resolves with the report object
     */
    getReport: function(year, month, currency) {
      return new Promise((resolve, reject) => {
        if (!this.db) {
          reject(new Error('Database not opened. Call openCostsDB first.'));
          return;
        }

        const transaction = this.db.transaction([this.storeName], 'readonly');
        const objectStore = transaction.objectStore(this.storeName);
        const index = objectStore.index('year');
        const request = index.openCursor(IDBKeyRange.only(year));

        const costs = [];

        request.onsuccess = (event) => {
          const cursor = event.target.result;
          
          if (cursor) {
            const item = cursor.value;
            // Filter by month
            if (item.month === month) {
              costs.push({
                sum: item.sum,
                currency: item.currency,
                category: item.category,
                description: item.description,
                Date: {
                  day: item.date.day
                }
              });
            }
            cursor.continue();
          } else {
            // All items processed, now convert to target currency
            this._convertCostsToCurrency(costs, currency)
              .then((convertedCosts) => {
                const total = convertedCosts.reduce((sum, cost) => sum + cost.sum, 0);
                
                resolve({
                  year: year,
                  month: month,
                  costs: convertedCosts,
                  total: {
                    currency: currency,
                    total: total
                  }
                });
              })
              .catch(reject);
          }
        };

        request.onerror = () => {
          reject(new Error('Failed to get report: ' + request.error));
        };
      });
    },

    /**
     * Helper method to convert costs to target currency
     * @private
     */
    _convertCostsToCurrency: function(costs, targetCurrency) {
      return new Promise((resolve, reject) => {
        // Default exchange rates (fallback)
        const defaultRates = {
          USD: 1,
          GBP: 0.6,
          EURO: 0.7,
          ILS: 3.4
        };

        // Helper function to convert costs using rates
        const convertWithRates = (rates) => {
          const convertedCosts = costs.map(cost => {
            const costRate = rates[cost.currency] || 1;
            const targetRate = rates[targetCurrency] || 1;
            // Convert to USD first, then to target currency
            const usdValue = cost.sum / costRate;
            const convertedSum = usdValue * targetRate;
            
            return {
              sum: Math.round(convertedSum * 100) / 100, // Round to 2 decimal places
              currency: targetCurrency,
              category: cost.category,
              description: cost.description,
              Date: cost.Date
            };
          });
          return convertedCosts;
        };

        // Get exchange rates from localStorage if available
        let exchangeRateUrl;
        try {
          exchangeRateUrl = localStorage.getItem('exchangeRateUrl');
        } catch (e) {
          // localStorage not available, use default rates
          resolve(convertWithRates(defaultRates));
          return;
        }

        // If no URL configured, use default rates
        if (!exchangeRateUrl) {
          resolve(convertWithRates(defaultRates));
          return;
        }

        // Try to fetch exchange rates from configured URL
        fetch(exchangeRateUrl)
          .then(response => {
            if (!response.ok) {
              throw new Error('Failed to fetch exchange rates');
            }
            return response.json();
          })
          .then(data => {
            // Handle different response formats
            let rates = {};
            
            if (data.rates) {
              // Format: {rates: {USD: 1, GBP: 0.6, ...}}
              rates = data.rates;
            } else if (data.USD !== undefined) {
              // Format: {USD: 1, GBP: 0.6, ...}
              rates = data;
            } else {
              throw new Error('Invalid exchange rate format');
            }

            // Ensure all required currencies are present, fallback to defaults if missing
            ['USD', 'GBP', 'EURO', 'ILS'].forEach(curr => {
              if (rates[curr] === undefined) {
                rates[curr] = defaultRates[curr];
              }
            });

            resolve(convertWithRates(rates));
          })
          .catch(error => {
            // Fallback to default rates if fetch fails
            console.warn('Failed to fetch exchange rates, using default rates:', error);
            resolve(convertWithRates(defaultRates));
          });
      });
    }
  };

  // Export to global object
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = idb;
  } else {
    global.idb = idb;
  }
})(typeof window !== 'undefined' ? window : this);

