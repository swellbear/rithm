import { Router } from 'express';
import { economicDataIntegration } from './economic-data-integration';

const router = Router();

// FRED Economic Data Integration Routes
router.post('/fred/series/:seriesId', async (req, res) => {
  try {
    const { seriesId } = req.params;
    const { startDate, endDate } = req.body;
    
    const result = await economicDataIntegration.fred.getEconomicSeries(
      seriesId, 
      startDate, 
      endDate
    );
    
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
      requiresApiKey: error.message.includes('API key')
    });
  }
});

router.post('/fred/multiple-series', async (req, res) => {
  try {
    const { seriesIds } = req.body;
    
    if (!Array.isArray(seriesIds)) {
      return res.status(400).json({
        success: false,
        error: 'seriesIds must be an array'
      });
    }
    
    const results = await economicDataIntegration.fred.getMultipleEconomicSeries(seriesIds);
    
    res.json({
      success: true,
      results,
      totalSeries: seriesIds.length,
      successfulSeries: results.filter(r => r.success).length
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// World Bank Data Integration Routes
router.post('/worldbank/country/:countryCode/indicator/:indicator', async (req, res) => {
  try {
    const { countryCode, indicator } = req.params;
    const { startYear, endYear } = req.body;
    
    const result = await economicDataIntegration.worldBank.getCountryIndicator(
      countryCode, 
      indicator,
      startYear,
      endYear
    );
    
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/worldbank/multiple-indicators', async (req, res) => {
  try {
    const { requests } = req.body;
    
    if (!Array.isArray(requests)) {
      return res.status(400).json({
        success: false,
        error: 'requests must be an array of {countryCode, indicator} objects'
      });
    }
    
    const results = await economicDataIntegration.worldBank.getMultipleCountryIndicators(requests);
    
    res.json({
      success: true,
      results,
      totalRequests: requests.length,
      successfulRequests: results.filter(r => r.success).length
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Rithm Economic Convergence Analysis Routes
router.post('/convergence-analysis', async (req, res) => {
  try {
    const analysisRequest = req.body;
    
    // Validate request structure
    if (!analysisRequest.type || !analysisRequest.series) {
      return res.status(400).json({
        success: false,
        error: 'Request must include type and series fields'
      });
    }
    
    if (analysisRequest.type === 'worldbank' && !analysisRequest.countries) {
      return res.status(400).json({
        success: false,
        error: 'World Bank analysis requires countries field'
      });
    }
    
    const result = await economicDataIntegration.convergenceAnalysis.analyzeEconomicConvergence(analysisRequest);
    
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get stored economic data
router.get('/stored-data', async (req, res) => {
  try {
    const storedData = await economicDataIntegration.convergenceAnalysis['worldBankData']['storage']?.getAllEconomicData?.() || []; // Empty array fallback is authentic - no hardcoded data when storage unavailable
    
    res.json({
      success: true,
      storedDatasets: storedData.length,
      datasets: storedData.map(d => ({
        datasetId: d.datasetId,
        seriesName: d.seriesName,
        dataSource: d.dataSource,
        lastUpdated: d.lastUpdated,
        dataPointCount: Array.isArray(d.dataPoints) ? d.dataPoints.length : 0
      }))
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Test route to verify API is working
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Economic data integration API is working',
    endpoints: {
      'POST /fred/series/:seriesId': 'Get FRED economic series data',
      'POST /fred/multiple-series': 'Get multiple FRED series',
      'POST /worldbank/country/:countryCode/indicator/:indicator': 'Get World Bank country indicator',
      'POST /worldbank/multiple-indicators': 'Get multiple World Bank indicators',
      'POST /convergence-analysis': 'Run Rithm convergence analysis on economic data',
      'GET /stored-data': 'Get stored economic datasets'
    },
    requiresApiKey: {
      fred: !process.env.FRED_API_KEY,
      worldBank: false
    }
  });
});

export default router;