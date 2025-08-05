#!/usr/bin/env python3
"""
Professional Data Cleaning Module
State-of-the-art pandas techniques for real-world data preprocessing
No mock data, no hardcoded solutions - authentic data science practices
"""

import sys
import json
import pandas as pd
import numpy as np
from scipy import stats
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.impute import SimpleImputer, KNNImputer
import warnings
warnings.filterwarnings('ignore')

class ProfessionalDataCleaner:
    """
    Enterprise-grade data cleaning using industry best practices
    Handles real-world data quality issues with authentic techniques
    """
    
    def __init__(self):
        self.cleaning_report = {
            'operations_performed': [],
            'data_quality_issues': [],
            'columns_modified': [],
            'rows_affected': 0,
            'original_shape': None,
            'final_shape': None
        }
    
    def analyze_data_quality(self, df):
        """Comprehensive data quality assessment"""
        issues = []
        
        # Missing values analysis
        missing_counts = df.isnull().sum()
        for col, count in missing_counts.items():
            if count > 0:
                pct = (count / len(df)) * 100
                issues.append(f"{col}: {count} missing values ({pct:.1f}%)")
        
        # Data type analysis
        for col in df.columns:
            unique_count = df[col].nunique()
            null_count = df[col].isnull().sum()
            
            if df[col].dtype == 'object':
                # Check if numeric data stored as text
                non_null_vals = df[col].dropna()
                if len(non_null_vals) > 0:
                    try:
                        pd.to_numeric(non_null_vals.astype(str).str.strip())
                        issues.append(f"{col}: Numeric data stored as text")
                    except (ValueError, TypeError):
                        pass
            
            # Outlier detection for numeric columns
            if df[col].dtype in ['int64', 'float64'] and unique_count > 10:
                Q1 = df[col].quantile(0.25)
                Q3 = df[col].quantile(0.75)
                IQR = Q3 - Q1
                outliers = df[(df[col] < Q1 - 1.5 * IQR) | (df[col] > Q3 + 1.5 * IQR)][col]
                if len(outliers) > 0:
                    issues.append(f"{col}: {len(outliers)} potential outliers detected")
        
        # Duplicate rows
        duplicates = df.duplicated().sum()
        if duplicates > 0:
            issues.append(f"Dataset: {duplicates} duplicate rows found")
        
        self.cleaning_report['data_quality_issues'] = issues
        return issues
    
    def clean_column_names(self, df):
        """Standardize column names using pandas best practices"""
        original_columns = df.columns.tolist()
        
        # Clean column names
        df.columns = (df.columns
                     .str.strip()                    # Remove whitespace
                     .str.lower()                    # Lowercase
                     .str.replace(r'[^\w\s]', '_', regex=True)  # Replace special chars
                     .str.replace(r'\s+', '_', regex=True)      # Replace spaces
                     .str.replace(r'_+', '_', regex=True))      # Remove multiple underscores
        
        if original_columns != df.columns.tolist():
            self.cleaning_report['operations_performed'].append("Standardized column names")
            self.cleaning_report['columns_modified'].extend(df.columns.tolist())
        
        return df
    
    def handle_missing_values(self, df, strategy='smart'):
        """Advanced missing value imputation using pandas and sklearn"""
        original_nulls = df.isnull().sum().sum()
        
        for col in df.columns:
            null_count = df[col].isnull().sum()
            if null_count == 0:
                continue
                
            null_pct = (null_count / len(df)) * 100
            
            if null_pct > 90:
                # Drop columns with >90% missing data
                df = df.drop(columns=[col])
                self.cleaning_report['operations_performed'].append(f"Dropped column '{col}' (>90% missing)")
                continue
            
            if df[col].dtype in ['int64', 'float64']:
                if strategy == 'smart':
                    # Use KNN imputation for numeric data with < 50% missing
                    if null_pct < 50 and df.select_dtypes(include=[np.number]).shape[1] > 1:
                        try:
                            numeric_cols = df.select_dtypes(include=[np.number]).columns
                            imputer = KNNImputer(n_neighbors=5)
                            df[numeric_cols] = imputer.fit_transform(df[numeric_cols])
                            self.cleaning_report['operations_performed'].append(f"KNN imputation applied to numeric columns")
                        except:
                            # Fallback to median imputation
                            df[col] = df[col].fillna(df[col].median())
                            self.cleaning_report['operations_performed'].append(f"Median imputation for '{col}'")
                    else:
                        # Median imputation for high missing percentages
                        df[col] = df[col].fillna(df[col].median())
                        self.cleaning_report['operations_performed'].append(f"Median imputation for '{col}'")
                else:
                    # Simple strategies
                    if strategy == 'mean':
                        df[col] = df[col].fillna(df[col].mean())
                    elif strategy == 'median':
                        df[col] = df[col].fillna(df[col].median())
                    elif strategy == 'zero':
                        df[col] = df[col].fillna(0)
                    
            else:
                # Categorical data - use mode or 'Unknown'
                if null_pct < 50:
                    mode_val = df[col].mode()
                    if len(mode_val) > 0:
                        df[col] = df[col].fillna(mode_val.iloc[0])
                        self.cleaning_report['operations_performed'].append(f"Mode imputation for '{col}'")
                    else:
                        df[col] = df[col].fillna('Unknown')
                        self.cleaning_report['operations_performed'].append(f"'Unknown' imputation for '{col}'")
                else:
                    df[col] = df[col].fillna('Unknown')
                    self.cleaning_report['operations_performed'].append(f"'Unknown' imputation for '{col}'")
        
        final_nulls = df.isnull().sum().sum()
        self.cleaning_report['rows_affected'] += (original_nulls - final_nulls)
        
        return df
    
    def convert_data_types(self, df, force_numeric=True):
        """Intelligent data type conversion using pandas best practices"""
        for col in df.columns:
            if df[col].dtype == 'object' and force_numeric:
                # Try to convert text that looks like numbers
                try:
                    # Clean string data first
                    cleaned_col = (df[col].astype(str)
                                 .str.strip()
                                 .str.replace(r'[^\d.-]', '', regex=True)  # Keep only digits, dots, minus
                                 .str.replace(r'^-*\.-*$', '', regex=True))  # Remove invalid patterns
                    
                    # Convert to numeric
                    numeric_col = pd.to_numeric(cleaned_col, errors='coerce')
                    
                    # Only convert if we don't lose too much data (< 50% becomes NaN)
                    nan_pct = (numeric_col.isnull().sum() / len(df)) * 100
                    original_nan_pct = (df[col].isnull().sum() / len(df)) * 100
                    
                    if (nan_pct - original_nan_pct) < 50:  # Don't lose more than 50% of data
                        df[col] = numeric_col
                        self.cleaning_report['operations_performed'].append(f"Converted '{col}' to numeric")
                        self.cleaning_report['columns_modified'].append(col)
                        
                except (ValueError, TypeError):
                    continue
        
        return df
    
    def handle_outliers(self, df, method='iqr', threshold=1.5):
        """Professional outlier detection and treatment"""
        outliers_removed = 0
        
        for col in df.select_dtypes(include=[np.number]).columns:
            if df[col].nunique() <= 10:  # Skip categorical-like numeric columns
                continue
                
            initial_count = len(df)
            
            if method == 'iqr':
                Q1 = df[col].quantile(0.25)
                Q3 = df[col].quantile(0.75)
                IQR = Q3 - Q1
                lower_bound = Q1 - threshold * IQR
                upper_bound = Q3 + threshold * IQR
                
                # Cap outliers instead of removing (more conservative)
                outlier_count = len(df[(df[col] < lower_bound) | (df[col] > upper_bound)])
                if outlier_count > 0:
                    df[col] = df[col].clip(lower=lower_bound, upper=upper_bound)
                    self.cleaning_report['operations_performed'].append(f"Capped {outlier_count} outliers in '{col}' using IQR method")
                    
            elif method == 'zscore':
                z_scores = np.abs(stats.zscore(df[col].dropna()))
                outlier_mask = z_scores > threshold
                outlier_count = outlier_mask.sum()
                
                if outlier_count > 0:
                    # Cap at 3 standard deviations
                    mean_val = df[col].mean()
                    std_val = df[col].std()
                    lower_bound = mean_val - threshold * std_val
                    upper_bound = mean_val + threshold * std_val
                    df[col] = df[col].clip(lower=lower_bound, upper=upper_bound)
                    self.cleaning_report['operations_performed'].append(f"Capped {outlier_count} outliers in '{col}' using Z-score method")
        
        return df
    
    def remove_duplicates(self, df):
        """Remove duplicate rows using pandas built-in methods"""
        initial_rows = len(df)
        df = df.drop_duplicates()
        duplicates_removed = initial_rows - len(df)
        
        if duplicates_removed > 0:
            self.cleaning_report['operations_performed'].append(f"Removed {duplicates_removed} duplicate rows")
            self.cleaning_report['rows_affected'] += duplicates_removed
        
        return df
    
    def encode_categorical_variables(self, df, target_column=None):
        """Smart categorical encoding using pandas and sklearn"""
        categorical_cols = df.select_dtypes(include=['object']).columns
        
        # Don't encode the target column if it's categorical
        if target_column and target_column in categorical_cols:
            categorical_cols = categorical_cols.drop(target_column)
        
        for col in categorical_cols:
            unique_count = df[col].nunique()
            
            if unique_count <= 10:  # Low cardinality - use one-hot encoding
                dummies = pd.get_dummies(df[col], prefix=col, dummy_na=False)
                df = pd.concat([df, dummies], axis=1)
                df = df.drop(columns=[col])
                self.cleaning_report['operations_performed'].append(f"One-hot encoded '{col}' ({unique_count} categories)")
                
            elif unique_count <= 50:  # Medium cardinality - use label encoding
                le = LabelEncoder()
                df[col] = le.fit_transform(df[col].astype(str))
                self.cleaning_report['operations_performed'].append(f"Label encoded '{col}' ({unique_count} categories)")
                
            else:  # High cardinality - keep most frequent, group others
                top_categories = df[col].value_counts().head(20).index
                df[col] = df[col].where(df[col].isin(top_categories), 'Other')
                
                # Then one-hot encode
                dummies = pd.get_dummies(df[col], prefix=col, dummy_na=False)
                df = pd.concat([df, dummies], axis=1)
                df = df.drop(columns=[col])
                self.cleaning_report['operations_performed'].append(f"Grouped and encoded '{col}' (kept top 20 categories)")
        
        return df
    
    def clean_data(self, data, options=None):
        """Main data cleaning pipeline with comprehensive pandas techniques"""
        if options is None:
            options = {
                'clean_column_names': True,
                'handle_missing': True,
                'missing_strategy': 'smart',
                'convert_types': True,
                'force_numeric': True,
                'handle_outliers': True,
                'outlier_method': 'iqr',
                'remove_duplicates': True,
                'encode_categorical': False,
                'target_column': None
            }
        
        try:
            # Convert input data to DataFrame
            if isinstance(data, dict):
                df = pd.DataFrame(data)
            elif isinstance(data, list):
                df = pd.DataFrame(data)
            else:
                raise ValueError(f"Unsupported data format: {type(data)}")
            
            self.cleaning_report['original_shape'] = df.shape
            
            # Analyze data quality first
            quality_issues = self.analyze_data_quality(df)
            
            # Apply cleaning operations based on options
            if options.get('clean_column_names', True):
                df = self.clean_column_names(df)
            
            if options.get('handle_missing', True):
                df = self.handle_missing_values(df, strategy=options.get('missing_strategy', 'smart'))
            
            if options.get('convert_types', True):
                df = self.convert_data_types(df, force_numeric=options.get('force_numeric', True))
            
            if options.get('remove_duplicates', True):
                df = self.remove_duplicates(df)
            
            if options.get('handle_outliers', True):
                df = self.handle_outliers(df, method=options.get('outlier_method', 'iqr'))
            
            if options.get('encode_categorical', False):
                df = self.encode_categorical_variables(df, target_column=options.get('target_column'))
            
            self.cleaning_report['final_shape'] = df.shape
            
            # Prepare results
            results = {
                'success': True,
                'cleaned_data': df.to_dict('list'),  # Convert to format expected by frontend
                'cleaning_report': self.cleaning_report,
                'summary': {
                    'original_rows': self.cleaning_report['original_shape'][0],
                    'original_columns': self.cleaning_report['original_shape'][1],
                    'final_rows': self.cleaning_report['final_shape'][0],
                    'final_columns': self.cleaning_report['final_shape'][1],
                    'operations_count': len(self.cleaning_report['operations_performed']),
                    'issues_found': len(self.cleaning_report['data_quality_issues'])
                }
            }
            
            return results
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'cleaning_report': self.cleaning_report
            }

def main():
    """Command line interface for data cleaning"""
    try:
        # Read input from stdin or command line
        if len(sys.argv) == 1:
            input_data = json.loads(sys.stdin.read())
        elif len(sys.argv) == 2:
            input_data = json.loads(sys.argv[1])
        else:
            print(json.dumps({'error': 'Usage: python data-cleaner.py <json_input> OR pipe JSON data'}))
            sys.exit(1)
        
        data = input_data['data']
        options = input_data.get('options', {})
        
        cleaner = ProfessionalDataCleaner()
        results = cleaner.clean_data(data, options)
        
        print(json.dumps(results))
        
    except json.JSONDecodeError as e:
        print(json.dumps({'error': f'Invalid JSON input: {str(e)}', 'success': False}))
        sys.exit(1)
    except KeyError as e:
        print(json.dumps({'error': f'Missing required field: {str(e)}', 'success': False}))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({'error': f'Data cleaning failed: {str(e)}', 'success': False}))
        sys.exit(1)

if __name__ == '__main__':
    main()