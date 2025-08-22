#!/usr/bin/env python3
"""
Quick script to check what tables exist in your database
"""

import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Load environment variables
load_dotenv()

def check_tables():
    """Check what tables exist in the database"""
    
    print("🔍 Checking Database Tables...")
    print("=" * 50)
    
    # Get database URL from environment
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("❌ DATABASE_URL not found in .env file!")
        return
    
    print(f"📡 Connecting to: {database_url}")
    
    try:
        # Create engine and connect
        engine = create_engine(database_url)
        
        with engine.connect() as connection:
            print("✅ Connected to database!")
            
            # Check what tables exist
            print("\n📋 Checking existing tables...")
            result = connection.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                ORDER BY table_name
            """))
            
            tables = [row[0] for row in result.fetchall()]
            
            if tables:
                print(f"✅ Found {len(tables)} table(s):")
                for table in tables:
                    print(f"   📊 {table}")
            else:
                print("❌ No tables found!")
                print("   This means the tables haven't been created yet.")
                print("   Try running your FastAPI app to create them.")
            
            # Check if our expected tables exist
            expected_tables = ['users', 'chat_sessions', 'chat_messages', 'medications']
            missing_tables = [table for table in expected_tables if table not in tables]
            
            if missing_tables:
                print(f"\n⚠️  Missing expected tables: {missing_tables}")
                print("   These will be created when you run your FastAPI app.")
            else:
                print(f"\n🎉 All expected tables are present!")
            
            # Show table details if they exist
            if tables:
                print(f"\n📊 Table Details:")
                for table in tables:
                    print(f"\n--- {table} ---")
                    try:
                        result = connection.execute(text(f"SELECT COUNT(*) FROM {table}"))
                        count = result.fetchone()[0]
                        print(f"   Rows: {count}")
                        
                        # Show columns
                        result = connection.execute(text(f"""
                            SELECT column_name, data_type, is_nullable
                            FROM information_schema.columns 
                            WHERE table_name = '{table}' 
                            ORDER BY ordinal_position
                        """))
                        
                        columns = result.fetchall()
                        for col in columns:
                            nullable = "NULL" if col[2] == "YES" else "NOT NULL"
                            print(f"   {col[0]}: {col[1]} ({nullable})")
                            
                    except Exception as e:
                        print(f"   Error reading table: {e}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    check_tables()
