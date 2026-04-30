import pandas as pd
import numpy as np
import os

os.makedirs('sample_data', exist_ok=True)
np.random.seed(42)
n = 300

# ── Dataset 1: Credit Default (Classification) ────────────────────────────
age              = np.random.randint(22, 65, n)
income           = np.random.randint(25000, 120000, n).astype(float)
loan_amount      = np.random.randint(5000, 50000, n).astype(float)
credit_score     = np.random.randint(550, 800, n)
employment_yrs   = np.random.randint(0, 20, n)
home_ownership   = np.random.choice(['RENT', 'OWN', 'MORTGAGE'], n)
num_credit_lines = np.random.randint(1, 10, n)

ratio     = loan_amount / income
p_default = 1 / (1 + np.exp(-(-3 + 4*ratio + (-0.008)*(credit_score-650) + (-0.05)*employment_yrs)))
default   = (np.random.rand(n) < p_default).astype(int)

df1 = pd.DataFrame({
    'age': age, 'income': income, 'loan_amount': loan_amount,
    'credit_score': credit_score, 'employment_years': employment_yrs,
    'home_ownership': home_ownership, 'num_credit_lines': num_credit_lines,
    'default': default
})
df1.to_csv('sample_data/credit_default_classification.csv', index=False)
print("Dataset 1 created:", df1.shape, "| default rate:", round(default.mean()*100,1), "%")
print(df1.head(3).to_string())

# ── Dataset 2: House Price (Regression) ───────────────────────────────────
sqft         = np.random.randint(800, 4500, n)
bedrooms     = np.random.randint(1, 6, n)
bathrooms    = np.random.choice([1.0, 1.5, 2.0, 2.5, 3.0, 3.5], n)
age_years    = np.random.randint(1, 60, n)
garage       = np.random.randint(0, 2, n)
neighborhood = np.random.choice(['Downtown', 'Suburbs', 'Rural', 'Uptown'], n)
school_rating= np.round(np.random.uniform(4.0, 10.0, n), 1)

price = (
    120 * sqft
    + 15000 * bedrooms
    + 12000 * bathrooms
    - 800   * age_years
    + 10000 * garage
    + np.where(neighborhood == 'Downtown', 40000,
      np.where(neighborhood == 'Uptown',   30000,
      np.where(neighborhood == 'Suburbs',  10000, -5000)))
    + 3000  * school_rating
    + np.random.normal(0, 15000, n)
).round(2)

df2 = pd.DataFrame({
    'sqft': sqft, 'bedrooms': bedrooms, 'bathrooms': bathrooms,
    'age_years': age_years, 'garage': garage, 'neighborhood': neighborhood,
    'school_rating': school_rating, 'price': price
})
df2.to_csv('sample_data/house_price_regression.csv', index=False)
print("\nDataset 2 created:", df2.shape, "| price min:", round(price.min(),0), "max:", round(price.max(),0))
print(df2.head(3).to_string())
print("\nBoth datasets saved to sample_data/")
