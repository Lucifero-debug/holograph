import sqlite3
import random
from datetime import datetime, timedelta

def create_dummy_database():
    # Connect to SQLite (creates the file if it doesn't exist)
    conn = sqlite3.connect('holograph.db')
    cursor = conn.cursor()

    print("--- Setting up Database ---")

    # ---------------------------------------------------------
    # 1. Create Tables
    # ---------------------------------------------------------
    
    # Table: sales (Supports queries about revenue, region, quarter)
    cursor.execute('DROP TABLE IF EXISTS sales')
    cursor.execute('''
        CREATE TABLE sales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            region TEXT,
            country TEXT,
            product_category TEXT,
            quarter TEXT,
            year INTEGER,
            sales_amount REAL,
            revenue REAL,
            transaction_date DATE
        )
    ''')

    # Table: customers (Supports queries about demographics)
    cursor.execute('DROP TABLE IF EXISTS customers')
    cursor.execute('''
        CREATE TABLE customers (
            customer_id INTEGER PRIMARY KEY,
            age_group TEXT,
            signup_date DATE,
            region TEXT
        )
    ''')

    # ---------------------------------------------------------
    # 2. Insert Dummy Data
    # ---------------------------------------------------------
    
    print("Inserting data...")
    
    # --- SALES DATA ---
    regions = ['North America', 'Asia', 'Europe', 'South America']
    quarters = ['Q1', 'Q2', 'Q3', 'Q4']
    years = [2024, 2025]
    categories = ['Electronics', 'Clothing', 'Home', 'Software']

    sales_data = []
    
    # Generate 100 random sales records
    for _ in range(100):
        r = random.choice(regions)
        q = random.choice(quarters)
        y = random.choice(years)
        amount = round(random.uniform(1000.0, 50000.0), 2)
        
        sales_data.append((
            r, 
            "Country_X", 
            random.choice(categories), 
            q, 
            y, 
            amount, 
            amount * 1.2, # Revenue is slightly higher than sales_amount for this demo
            f"{y}-01-15"  # Dummy date
        ))

    cursor.executemany('''
        INSERT INTO sales (region, country, product_category, quarter, year, sales_amount, revenue, transaction_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', sales_data)

    # --- CUSTOMER DATA ---
    age_groups = ['18-24', '25-34', '35-44', '45+']
    customer_data = []
    for i in range(50):
        customer_data.append((
            i, 
            random.choice(age_groups), 
            "2024-01-10", 
            random.choice(regions)
        ))

    cursor.executemany('INSERT INTO customers VALUES (?, ?, ?, ?)', customer_data)

    # ---------------------------------------------------------
    # 3. Commit and Close
    # ---------------------------------------------------------
    conn.commit()
    print("✅ Database 'holograph.db' created successfully with dummy data.")
    
    # Verify by running a quick test query
    print("\n--- Verification Query (Sales in Asia 2025) ---")
    cursor.execute("SELECT * FROM sales WHERE region='Asia' AND year=2025 LIMIT 3")
    rows = cursor.fetchall()
    for row in rows:
        print(row)

    conn.close()

if __name__ == "__main__":
    create_dummy_database()