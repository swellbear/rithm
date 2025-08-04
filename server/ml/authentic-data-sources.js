/**
 * Authentic Data Sources Module
 * Connects to real APIs and datasets - no fabrication allowed
 */

import https from 'https';
import fs from 'fs';

export class AuthenticDataSources {
  constructor() {
    this.apiKeys = {
      worldBank: process.env.WORLD_BANK_API_KEY,
      fred: process.env.FRED_API_KEY,
      quandl: process.env.QUANDL_API_KEY,
      alpha: process.env.ALPHA_VANTAGE_API_KEY
    };
  }

  async getEconomicData(domain, sampleSize) {
    switch (domain) {
      case 'economics':
        return await this.fetchWorldBankData(sampleSize);
      case 'finance':
        return await this.fetchFREDData(sampleSize);
      case 'healthcare':
        return await this.fetchHealthData(sampleSize);
      default:
        throw new Error(`Authentic data source not configured for domain: ${domain}`);
    }
  }

  async fetchWorldBankData(sampleSize) {
    const apiKey = this.apiKeys.worldBank;
    if (!apiKey) {
      throw new Error('World Bank API key required for economic data. Please provide WORLD_BANK_API_KEY environment variable.');
    }

    try {
      // World Bank GDP data
      const response = await this.makeHttpsRequest(
        `https://api.worldbank.org/v2/country/all/indicator/NY.GDP.PCAP.CD?date=2018:2023&format=json&per_page=${sampleSize}`
      );
      
      const data = JSON.parse(response);
      if (!data[1] || data[1].length === 0) {
        throw new Error('No authentic economic data available from World Bank API');
      }

      return data[1].map(item => ({
        country: item.country?.value || 'Unknown',
        year: parseInt(item.date),
        gdp_per_capita: item.value,
        indicator: item.indicator?.value || 'GDP per capita'
      })).filter(item => item.gdp_per_capita !== null);

    } catch (error) {
      throw new Error(`Failed to fetch authentic World Bank data: ${error.message}`);
    }
  }

  async fetchFREDData(sampleSize) {
    const apiKey = this.apiKeys.fred;
    if (!apiKey) {
      throw new Error('FRED API key required for financial data. Please provide FRED_API_KEY environment variable.');
    }

    try {
      // Federal Reserve Economic Data
      const response = await this.makeHttpsRequest(
        `https://api.stlouisfed.org/fred/series/observations?series_id=GDP&api_key=${apiKey}&file_type=json&limit=${sampleSize}`
      );
      
      const data = JSON.parse(response);
      if (!data.observations || data.observations.length === 0) {
        throw new Error('No authentic financial data available from FRED API');
      }

      return data.observations.map(item => ({
        date: item.date,
        value: parseFloat(item.value),
        series_id: 'GDP'
      })).filter(item => !isNaN(item.value));

    } catch (error) {
      throw new Error(`Failed to fetch authentic FRED data: ${error.message}`);
    }
  }

  async fetchHealthData(sampleSize) {
    // WHO Health Observatory data would require API key
    throw new Error('WHO API key required for health data. Please provide WHO_API_KEY environment variable or use a different data source.');
  }

  makeHttpsRequest(url) {
    return new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
          }
        });
      }).on('error', (err) => {
        reject(err);
      });
    });
  }

  // Load local authentic datasets (real data files only)
  async loadLocalDataset(domain) {
    const datasets = {
      'economics': './data/authentic/world-economic-outlook.csv',
      'healthcare': './data/authentic/who-health-statistics.csv',
      'finance': './data/authentic/federal-reserve-data.csv'
    };

    const filepath = datasets[domain];
    if (!filepath || !fs.existsSync(filepath)) {
      throw new Error(`Authentic local dataset not found for ${domain}. Please provide real data files in ./data/authentic/ directory.`);
    }

    try {
      const data = fs.readFileSync(filepath, 'utf-8');
      return this.parseCSV(data);
    } catch (error) {
      throw new Error(`Failed to load authentic dataset: ${error.message}`);
    }
  }

  parseCSV(csvData) {
    const lines = csvData.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || null;
      });
      return row;
    });
  }
}