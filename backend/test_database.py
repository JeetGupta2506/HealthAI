#!/usr/bin/env python3
"""
Database Connection Test Script
Run this to check if your PostgreSQL database is working properly.
"""

import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError, ProgrammingError

# Load environment variables
load_dotenv()

def test_database_connection():
    """Test the database connection and basic operations"""
    
    print("🔍 Testing Database Connection...")
    print("=" * 50)
    
    # Get database URL from environment
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("❌ DATABASE_URL not found in .env file!")
        return False
    
    print(f"📡 Database URL: {database_url}")
    
    try:
        # Test connection
        print("\n1️⃣ Testing connection...")
        engine = create_engine(database_url)
        
        with engine.connect() as connection:
            print("✅ Database connection successful!")
            
            # Test basic query
            print("\n2️⃣ Testing basic query...")
            result = connection.execute(text("SELECT version()"))
            version = result.fetchone()[0]
            print(f"✅ PostgreSQL version: {version}")
            
            # Test if database exists and is accessible
            print("\n3️⃣ Testing database access...")
            result = connection.execute(text("SELECT current_database()"))
            db_name = result.fetchone()[0]
            print(f"✅ Connected to database: {db_name}")
            
            # Test if we can create a simple table
            print("\n4️⃣ Testing table creation...")
            connection.execute(text("""
                CREATE TABLE IF NOT EXISTS test_connection (
                    id SERIAL PRIMARY KEY,
                    test_column TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """))
            print("✅ Test table created successfully!")
            
            # Test insert
            print("\n5️⃣ Testing insert operation...")
            connection.execute(text("""
                INSERT INTO test_connection (test_column) VALUES ('test_value')
            """))
            print("✅ Insert operation successful!")
            
            # Test select
            print("\n6️⃣ Testing select operation...")
            result = connection.execute(text("SELECT * FROM test_connection"))
            rows = result.fetchall()
            print(f"✅ Select operation successful! Found {len(rows)} rows")
            
            # Clean up test table
            print("\n7️⃣ Cleaning up test table...")
            connection.execute(text("DROP TABLE test_connection"))
            print("✅ Test table cleaned up!")
            
            connection.commit()
            
        print("\n🎉 All database tests passed! Your PostgreSQL is working perfectly.")
        return True
        
    except OperationalError as e:
        print(f"\n❌ Connection failed: {e}")
        print("\n🔧 Troubleshooting tips:")
        print("   - Make sure PostgreSQL service is running")
        print("   - Check if the database 'healthchatbot' exists")
        print("   - Verify username/password in DATABASE_URL")
        print("   - Check if port 5432 is accessible")
        return False
        
    except ProgrammingError as e:
        print(f"\n❌ SQL error: {e}")
        return False
        
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        return False

def test_models():
    """Test if our SQLAlchemy models can create tables"""
    
    print("\n🔍 Testing SQLAlchemy Models...")
    print("=" * 50)
    
    try:
        from database import create_tables
        from models import Base
        
        print("1️⃣ Importing models...")
        print("✅ Models imported successfully!")
        
        print("\n2️⃣ Testing table creation...")
        create_tables()
        print("✅ Tables created successfully!")
        
        print("\n🎉 Model tests passed! Your database schema is ready.")
        return True
        
    except Exception as e:
        print(f"\n❌ Model test failed: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Health Chatbot Database Test Suite")
    print("=" * 50)
    
    # Test basic connection
    connection_ok = test_database_connection()
    
    if connection_ok:
        # Test models
        models_ok = test_models()
        
        if models_ok:
            print("\n🎉 SUCCESS: Your database is fully working!")
            print("You can now run your FastAPI application.")
        else:
            print("\n⚠️  WARNING: Connection works but models have issues.")
    else:
        print("\n❌ FAILED: Database connection issues need to be resolved.")
    
    print("\n" + "=" * 50)
