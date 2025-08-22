#!/usr/bin/env python3
"""
Manual table creation test script
"""

import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Load environment variables
load_dotenv()

def test_manual_table_creation():
    """Test creating tables manually to see what errors occur"""
    
    print("🔍 Testing Manual Table Creation...")
    print("=" * 50)
    
    # Get database URL from environment
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("❌ DATABASE_URL not found in .env file!")
        print("   Make sure you have a .env file in the backend folder")
        return False
    
    print(f"📡 Database URL: {database_url}")
    
    try:
        # Test connection
        print("\n1️⃣ Testing connection...")
        engine = create_engine(database_url)
        
        with engine.connect() as connection:
            print("✅ Database connection successful!")
            
            # Test if we can create a simple table
            print("\n2️⃣ Testing simple table creation...")
            connection.execute(text("""
                CREATE TABLE IF NOT EXISTS test_table (
                    id SERIAL PRIMARY KEY,
                    name TEXT
                )
            """))
            print("✅ Simple table created successfully!")
            
            # Test if we can create our actual tables
            print("\n3️⃣ Testing users table creation...")
            connection.execute(text("""
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    email VARCHAR(100) UNIQUE NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """))
            print("✅ Users table created successfully!")
            
            # Test chat_sessions table
            print("\n4️⃣ Testing chat_sessions table creation...")
            connection.execute(text("""
                CREATE TABLE IF NOT EXISTS chat_sessions (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    session_id VARCHAR(100) UNIQUE NOT NULL,
                    agent_type VARCHAR(50) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """))
            print("✅ Chat sessions table created successfully!")
            
            # Test chat_messages table
            print("\n5️⃣ Testing chat_messages table creation...")
            connection.execute(text("""
                CREATE TABLE IF NOT EXISTS chat_messages (
                    id SERIAL PRIMARY KEY,
                    session_id INTEGER NOT NULL,
                    message_type VARCHAR(20) NOT NULL,
                    content TEXT NOT NULL,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    message_metadata JSON
                )
            """))
            print("✅ Chat messages table created successfully!")
            
            # Test medications table
            print("\n6️⃣ Testing medications table creation...")
            connection.execute(text("""
                CREATE TABLE IF NOT EXISTS medications (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    name VARCHAR(100) NOT NULL,
                    dosage VARCHAR(50) NOT NULL,
                    frequency VARCHAR(50) NOT NULL,
                    time_to_take TEXT[] NOT NULL,
                    prescribed_by VARCHAR(100) NOT NULL,
                    start_date DATE NOT NULL,
                    instructions TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """))
            print("✅ Medications table created successfully!")
            
            # Commit all changes
            connection.commit()
            print("\n🎉 All tables created successfully!")
            
            # Clean up test table
            print("\n7️⃣ Cleaning up test table...")
            connection.execute(text("DROP TABLE test_table"))
            connection.commit()
            print("✅ Test table cleaned up!")
            
            return True
            
    except Exception as e:
        print(f"\n❌ Error during table creation: {e}")
        print(f"\n🔧 Error type: {type(e).__name__}")
        return False

if __name__ == "__main__":
    success = test_manual_table_creation()
    
    if success:
        print("\n🎉 SUCCESS: Tables created manually!")
        print("Now try running your FastAPI app again.")
    else:
        print("\n❌ FAILED: Could not create tables manually.")
        print("Check the error message above for details.")
    
    print("\n" + "=" * 50)
