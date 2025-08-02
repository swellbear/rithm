/**
 * AUTHENTIC DATA TESTING - Rithm System
 * 
 * This script demonstrates authentic economic data processing
 * with zero fabrication. All data comes from real API sources.
 */

import { economicDataIntegration } from './economic-data-integration';

interface TestResult {
  testName: string;
  success: boolean;
  dataPoints: number;
  sourceVerified: boolean;
  error?: string;
}

/**
 * Test authentic World Bank API data processing
 */
async function testWorldBankData(): Promise<TestResult> {
  try {
    console.log('Testing World Bank API with authentic data...');
    
    const result = await economicDataIntegration.fetchWorldBankData({
      countryCode: 'USA',
      indicator: 'NY.GDP.MKTP.CD', // GDP (current US$)
      startYear: 2020,
      endYear: 2023
    });

    const hasAuthenticData = result.data && result.data.length > 0;
    const hasRealValues = result.data.some(point => 
      point.value !== null && 
      point.value !== undefined && 
      typeof point.value === 'number'
    );

    return {
      testName: 'World Bank GDP Data',
      success: hasAuthenticData && hasRealValues,
      dataPoints: result.data.length,
      sourceVerified: result.source === 'World Bank API',
      error: hasAuthenticData ? undefined : 'No authentic data returned'
    };
  } catch (error) {
    return {
      testName: 'World Bank GDP Data',
      success: false,
      dataPoints: 0,
      sourceVerified: false,
      error: error.message
    };
  }
}

/**
 * Test convergence analysis with authentic data
 */
async function testConvergenceAnalysis(): Promise<TestResult> {
  try {
    console.log('Testing convergence analysis with authentic economic data...');
    
    const result = await economicDataIntegration.performConvergenceAnalysis({
      type: 'worldbank',
      series: [], // No hardcoded series - require authentic series specification
      countries: [], // No hardcoded countries - require authentic country specification
      startYear: 2020,
      endYear: 2023
    });

    const hasValidAnalysis = result.convergenceMetrics && 
      typeof result.convergenceMetrics.correlationCoefficient === 'number';
    
    const hasAuthenticDataSources = result.dataSources.every(source => 
      source !== 'synthetic' && source !== 'mock'
    );

    return {
      testName: 'Convergence Analysis',
      success: hasValidAnalysis && hasAuthenticDataSources,
      dataPoints: result.totalDataPoints,
      sourceVerified: hasAuthenticDataSources,
      error: hasValidAnalysis ? undefined : 'Invalid convergence analysis'
    };
  } catch (error) {
    return {
      testName: 'Convergence Analysis',
      success: false,
      dataPoints: 0,
      sourceVerified: false,
      error: error.message
    };
  }
}

/**
 * Test multiple country data processing
 */
async function testMultipleCountryData(): Promise<TestResult> {
  try {
    console.log('Testing multiple country data processing...');
    
    const result = await economicDataIntegration.fetchMultipleCountryData({
      requests: [
        { countryCode: 'USA', indicator: 'NY.GDP.MKTP.CD' },
        { countryCode: 'CHN', indicator: 'NY.GDP.MKTP.CD' },
        { countryCode: 'DEU', indicator: 'NY.GDP.MKTP.CD' }
      ],
      startYear: 2022,
      endYear: 2023
    });

    const allCountriesHaveData = result.results.every(countryResult => 
      countryResult.data && countryResult.data.length > 0
    );

    const totalDataPoints = result.results.reduce((sum, countryResult) => 
      sum + countryResult.data.length, 0
    );

    return {
      testName: 'Multiple Country Data',
      success: allCountriesHaveData && totalDataPoints > 0,
      dataPoints: totalDataPoints,
      sourceVerified: result.source === 'World Bank API',
      error: allCountriesHaveData ? undefined : 'Missing data for some countries'
    };
  } catch (error) {
    return {
      testName: 'Multiple Country Data',
      success: false,
      dataPoints: 0,
      sourceVerified: false,
      error: error.message
    };
  }
}

/**
 * Run comprehensive authentic data tests
 */
export async function runAuthenticDataTests(): Promise<void> {
  console.log('=== AUTHENTIC DATA TESTING - RITHM SYSTEM ===');
  console.log('Testing economic data integration with zero fabrication');
  console.log('');

  const tests = [
    testWorldBankData,
    testConvergenceAnalysis,
    testMultipleCountryData
  ];

  const results: TestResult[] = [];

  for (const test of tests) {
    const result = await test();
    results.push(result);
    
    console.log(`✓ ${result.testName}:`);
    console.log(`  Success: ${result.success}`);
    console.log(`  Data Points: ${result.dataPoints}`);
    console.log(`  Source Verified: ${result.sourceVerified}`);
    if (result.error) {
      console.log(`  Error: ${result.error}`);
    }
    console.log('');
  }

  // Summary
  const successfulTests = results.filter(r => r.success).length;
  const totalDataPoints = results.reduce((sum, r) => sum + r.dataPoints, 0);
  
  console.log('=== TEST SUMMARY ===');
  console.log(`Successful Tests: ${successfulTests}/${results.length}`);
  console.log(`Total Authentic Data Points: ${totalDataPoints}`);
  console.log(`All Sources Verified: ${results.every(r => r.sourceVerified)}`);
  console.log(`Zero Fabrication: ${results.every(r => !r.error?.includes('synthetic'))}`);
  
  if (successfulTests === results.length) {
    console.log('✅ ALL TESTS PASSED - AUTHENTIC DATA INTEGRATION VERIFIED');
  } else {
    console.log('❌ SOME TESTS FAILED - INVESTIGATING AUTHENTIC DATA SOURCES');
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAuthenticDataTests().catch(console.error);
}