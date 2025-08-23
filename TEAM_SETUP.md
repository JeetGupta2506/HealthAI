# Team Setup Guide - Shared Database

## 🚀 Quick Start for Team Members

### Prerequisites
- Docker Desktop installed
- Git access to the repository
- Python 3.8+ with virtual environment

## 📋 Step-by-Step Setup

### 1. Get the Latest Code
```bash
git checkout main
git pull origin main
```

### 2. Start the Shared Database
```bash
# Start PostgreSQL and pgAdmin
docker-compose up -d

# Check if services are running
docker-compose ps
```

### 3. Verify Database Connection
```bash
# Test database connection
docker exec -it healthchatbot-postgres psql -U postgres -d healthchatbot -c "SELECT * FROM db_setup_check;"
```

### 4. Set Up Your Environment
```bash
cd backend

# Create .env file (use the shared database)
echo "DATABASE_URL=postgresql://postgres:password123@localhost:5432/healthchatbot" > .env
echo "GOOGLE_API_KEY=your_google_api_key" >> .env
```

### 5. Install Dependencies
```bash
# Activate your virtual environment
myvenv\Scripts\Activate.ps1  # Windows
# source myvenv/bin/activate  # Mac/Linux

# Install packages
pip install -r requirements.txt
```

### 6. Initialize Database Tables
```bash
python -c "from database import create_tables; create_tables()"
```

### 7. Start Your Application
```bash
python -m uvicorn main:app --reload
```

## 🔧 Database Management

### Access pgAdmin (Web Interface)
- **URL**: http://localhost:5050
- **Email**: admin@healthchatbot.com
- **Password**: admin123

### Connect to Database in pgAdmin
1. Right-click "Servers" → "Register" → "Server"
2. **General Tab**: Name = "HealthChatbot"
3. **Connection Tab**: 
   - Host: `postgres` (or `localhost` if accessing from outside Docker)
   - Port: `5432`
   - Database: `healthchatbot`
   - Username: `postgres`
   - Password: `password123`

### Command Line Access
```bash
# Connect to database
docker exec -it healthchatbot-postgres psql -U postgres -d healthchatbot

# List tables
\dt

# Exit
\q
```

## 🚨 Important Notes

### Data Persistence
- **Database data is persistent** - stored in Docker volume
- **All team members share the same data**
- **Be careful with destructive operations**

### User Management
- **Use different user IDs** in your tests to avoid conflicts
- **Don't delete other users' data** without coordination
- **Test with user_id > 100** to avoid conflicts with existing data

### Development Best Practices
1. **Always pull latest changes** before starting work
2. **Test your changes** with the shared database
3. **Coordinate database schema changes** with the team
4. **Use descriptive test data** to avoid confusion

## 🆘 Troubleshooting

### Database Won't Start
```bash
# Check logs
docker-compose logs postgres

# Restart services
docker-compose restart
```

### Connection Refused
```bash
# Check if PostgreSQL is running
docker-compose ps

# Check port availability
netstat -an | findstr 5432  # Windows
netstat -an | grep 5432      # Mac/Linux
```

### Permission Denied
```bash
# Reset database (WARNING: This deletes all data!)
docker-compose down -v
docker-compose up -d
```

## 🔄 Daily Workflow

### Start of Day
```bash
# 1. Pull latest changes
git pull origin main

# 2. Start database
docker-compose up -d

# 3. Start your app
cd backend
python -m uvicorn main:app --reload
```

### End of Day
```bash
# 1. Stop your app (Ctrl+C)
# 2. Commit your changes
git add .
git commit -m "Your changes description"
git push origin your-branch

# 3. Database stays running (shared)
```

## 📊 Monitoring

### Check Database Status
```bash
# Database health
docker-compose ps

# Database logs
docker-compose logs postgres

# Database size
docker exec -it healthchatbot-postgres psql -U postgres -d healthchatbot -c "SELECT pg_size_pretty(pg_database_size('healthchatbot'));"
```

### Check Application Logs
```bash
# Your app logs (in the terminal where uvicorn is running)
# Look for database connection messages and errors
```

## 🎯 Testing the Setup

### 1. Test Database Connection
```bash
python check_tables.py
```

### 2. Test Authentication
```bash
# Create a test user
curl -X POST "http://127.0.0.1:8000/api/signup" \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "email": "test@example.com", "password": "password123"}'

# Sign in
curl -X POST "http://127.0.0.1:8000/api/signin" \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "password123"}'
```

### 3. Test Chat
```bash
# Send a chat message
curl -X POST "http://127.0.0.1:8000/chat" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, how are you?", "agent_type": "general"}'
```

## 🎉 Success Indicators

✅ **Database running**: `docker-compose ps` shows all services as "Up"  
✅ **Tables created**: `python check_tables.py` shows all tables  
✅ **API responding**: Health check at `http://127.0.0.1:8000/health`  
✅ **Authentication working**: Can create users and get JWT tokens  
✅ **Chat working**: Can send messages and get AI responses  

## 📞 Team Coordination

### Before Making Changes
1. **Inform the team** about planned database changes
2. **Test locally** first
3. **Coordinate timing** to avoid conflicts

### After Making Changes
1. **Commit and push** your changes
2. **Update documentation** if needed
3. **Notify team** about new features/changes

---

**Happy coding with your shared database! 🚀**


