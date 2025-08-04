#!/usr/bin/env python3
"""
Authentic ML Training Module
No mock data, no fabricated results - only real machine learning
"""

import sys
import json
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.svm import SVR, SVC
from sklearn.tree import DecisionTreeRegressor, DecisionTreeClassifier
from sklearn.neighbors import KNeighborsRegressor, KNeighborsClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.neural_network import MLPRegressor, MLPClassifier
from sklearn.metrics import mean_squared_error, r2_score, accuracy_score, classification_report
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.impute import SimpleImputer
import warnings
warnings.filterwarnings('ignore')

class AuthenticMLTrainer:
    def __init__(self):
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.imputer = SimpleImputer(strategy='median')
        
        # Real ML algorithms - no mocks
        self.regression_models = {
            'linear_regression': LinearRegression(),
            'random_forest': RandomForestRegressor(n_estimators=100, random_state=42),
            'decision_tree': DecisionTreeRegressor(random_state=42),
            'svr': SVR(kernel='rbf'),
            'knn': KNeighborsRegressor(n_neighbors=5),
            'neural_network': MLPRegressor(hidden_layer_sizes=(100, 50), max_iter=500, random_state=42)
        }
        
        self.classification_models = {
            'logistic_regression': LogisticRegression(random_state=42),
            'random_forest': RandomForestClassifier(n_estimators=100, random_state=42),
            'decision_tree': DecisionTreeClassifier(random_state=42),
            'svc': SVC(kernel='rbf', random_state=42),
            'knn': KNeighborsClassifier(n_neighbors=5),
            'naive_bayes': GaussianNB(),
            'neural_network': MLPClassifier(hidden_layer_sizes=(100, 50), max_iter=500, random_state=42)
        }
    
    def preprocess_data(self, data, target_column):
        """Real data preprocessing - handle missing values, encoding, scaling"""
        try:
            # Handle different data input formats
            if isinstance(data, dict):
                # Convert dictionary format to DataFrame
                if all(isinstance(v, list) for v in data.values()):
                    # Dictionary of lists format (columns -> values)
                    df = pd.DataFrame(data)
                else:
                    # Dictionary of records format - convert to list of records
                    records = []
                    keys = list(data.keys())
                    if keys:
                        # Assume each key represents a column
                        max_len = max(len(v) if isinstance(v, list) else 1 for v in data.values())
                        for i in range(max_len):
                            record = {}
                            for key, values in data.items():
                                if isinstance(values, list):
                                    record[key] = values[i] if i < len(values) else None
                                else:
                                    record[key] = values
                            records.append(record)
                        df = pd.DataFrame(records)
                    else:
                        raise ValueError("Empty data dictionary provided")
            elif isinstance(data, list):
                df = pd.DataFrame(data)
            else:
                raise ValueError(f"Unsupported data format: {type(data)}")
            
            # Clean the DataFrame - remove completely empty rows/columns
            df = df.dropna(how='all')  # Remove rows that are all NaN
            df = df.loc[:, df.notna().any()]  # Remove columns that are all NaN
            
            # Ensure we have data
            if df.empty:
                raise ValueError("No valid data found after cleaning")
            
            # Check if target column exists
            if target_column not in df.columns:
                # Try to find a suitable numeric column as target
                numeric_columns = df.select_dtypes(include=[np.number]).columns.tolist()
                if numeric_columns:
                    target_column = numeric_columns[0]
                    print(f"Target column not found, using first numeric column: {target_column}")
                else:
                    # Use the last column as target
                    target_column = df.columns[-1]
                    print(f"No numeric columns found, using last column: {target_column}")
            
            # Separate features and target
            X = df.drop(columns=[target_column])
            y = df[target_column]
            
            # Convert target to numeric if possible
            if y.dtype == 'object':
                # Try to convert to numeric
                y_numeric = pd.to_numeric(y, errors='coerce')
                if not y_numeric.isna().all():
                    y = y_numeric
            
            # Handle missing values in target
            y_mask = y.notna()
            X = X[y_mask]
            y = y[y_mask]
            
            if len(X) < 5:
                raise ValueError("Insufficient data after removing missing target values")
            
            # Encode categorical variables
            for column in X.columns:
                if X[column].dtype == 'object':
                    le = LabelEncoder()
                    X[column] = X[column].astype(str)
                    X[column] = le.fit_transform(X[column])
                    self.label_encoders[column] = le
            
            # Convert to numeric and handle remaining NaN
            X = X.apply(pd.to_numeric, errors='coerce')
            X = self.imputer.fit_transform(X)
            
            # Determine if classification or regression
            unique_values = len(np.unique(y.dropna()))
            task_type = 'classification' if unique_values <= 20 and y.dtype == 'object' else 'regression'
            
            if task_type == 'classification':
                le_target = LabelEncoder()
                y_clean = y.dropna().astype(str)
                y = le_target.fit_transform(y_clean)
                X = X[:len(y)]  # Match X length to y length
                self.target_encoder = le_target
            else:
                y = pd.to_numeric(y, errors='coerce')
                y_mask = ~np.isnan(y)
                y = y[y_mask]
                X = X[y_mask]
            
            # Scale features
            X = self.scaler.fit_transform(X)
            
            return X, y, task_type
            
        except Exception as e:
            raise Exception(f"Data preprocessing failed: {str(e)}")
    
    def train_model(self, data, algorithm, target_column):
        """Train real ML model with authentic data"""
        try:
            X, y, task_type = self.preprocess_data(data, target_column)
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42
            )
            
            # Select appropriate model
            if task_type == 'regression':
                if algorithm not in self.regression_models:
                    algorithm = 'random_forest'
                model = self.regression_models[algorithm]
            else:
                if algorithm not in self.classification_models:
                    algorithm = 'random_forest'
                model = self.classification_models[algorithm]
            
            # Train model
            model.fit(X_train, y_train)
            
            # Make predictions
            y_pred = model.predict(X_test)
            
            # Calculate real metrics
            if task_type == 'regression':
                mse = float(mean_squared_error(y_test, y_pred))
                r2 = float(r2_score(y_test, y_pred))
                
                # Cross-validation
                cv_scores = cross_val_score(model, X, y, cv=5, scoring='r2')
                
                results = {
                    'algorithm': algorithm,
                    'task_type': task_type,
                    'target_column': target_column,
                    'samples_total': len(data),
                    'samples_used': len(X),
                    'features': X.shape[1],
                    'mse': mse,
                    'r2_score': r2,
                    'cv_mean': float(cv_scores.mean()),
                    'cv_std': float(cv_scores.std()),
                    'training_samples': len(X_train),
                    'test_samples': len(X_test)
                }
                
            else:
                accuracy = float(accuracy_score(y_test, y_pred))
                
                # Cross-validation
                cv_scores = cross_val_score(model, X, y, cv=5, scoring='accuracy')
                
                results = {
                    'algorithm': algorithm,
                    'task_type': task_type,
                    'target_column': target_column,
                    'samples_total': len(data),
                    'samples_used': len(X),
                    'features': X.shape[1],
                    'accuracy': accuracy,
                    'cv_mean': float(cv_scores.mean()),
                    'cv_std': float(cv_scores.std()),
                    'training_samples': len(X_train),
                    'test_samples': len(X_test),
                    'classes': int(len(np.unique(y)) if len(y) > 0 else 0)
                }
            
            # Feature importance (if available)
            if hasattr(model, 'feature_importances_'):
                feature_names = [f'feature_{i}' for i in range(X.shape[1])]
                importance_dict = dict(zip(feature_names, model.feature_importances_.tolist()))
                results['feature_importance'] = importance_dict
            
            results['success'] = True
            return results
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'algorithm': algorithm,
                'target_column': target_column
            }

def main():
    try:
        # Read from stdin if no command line arguments provided
        if len(sys.argv) == 1:
            # Read from stdin
            input_data = json.loads(sys.stdin.read())
        elif len(sys.argv) == 2:
            # Parse input from command line argument
            input_data = json.loads(sys.argv[1])
        else:
            print(json.dumps({'error': 'Usage: python authentic-trainer.py <json_input> OR pipe JSON data'}))
            sys.exit(1)
        
        data = input_data['data']
        algorithm = input_data['algorithm']
        target_column = input_data['target_column']
        
        trainer = AuthenticMLTrainer()
        results = trainer.train_model(data, algorithm, target_column)
        
        print(json.dumps(results))
        
    except json.JSONDecodeError as e:
        print(json.dumps({'error': f'Invalid JSON input: {str(e)}', 'success': False}))
        sys.exit(1)
    except KeyError as e:
        print(json.dumps({'error': f'Missing required field: {str(e)}', 'success': False}))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({'error': f'Training failed: {str(e)}', 'success': False}))
        sys.exit(1)

if __name__ == '__main__':
    main()