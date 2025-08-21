#!/usr/bin/env python3
"""
Simple test script for medication endpoints
Run this after starting the FastAPI server
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"

def test_medications():
    print("Testing Medication Endpoints...")
    
    # Test 1: Get medications (should be empty initially)
    print("\n1. Testing GET /api/medications")
    response = requests.get(f"{BASE_URL}/api/medications")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    
    # Test 2: Create a medication
    print("\n2. Testing POST /api/medications")
    medication_data = {
        "name": "Test Medication",
        "dosage": "100mg",
        "frequency": "Twice daily",
        "timeToTake": ["08:00", "20:00"],
        "prescribedBy": "Dr. Test",
        "startDate": datetime.now().isoformat(),
        "instructions": "Take with food"
    }
    
    response = requests.post(
        f"{BASE_URL}/api/medications",
        json=medication_data,
        headers={"Content-Type": "application/json"}
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    
    if response.status_code == 200:
        created_med = response.json().get("medication", {})
        med_id = created_med.get("id")
        
        # Test 3: Get medications again (should have one now)
        print("\n3. Testing GET /api/medications (should have one medication)")
        response = requests.get(f"{BASE_URL}/api/medications")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        # Test 4: Delete the medication
        if med_id:
            print(f"\n4. Testing DELETE /api/medications/{med_id}")
            response = requests.delete(f"{BASE_URL}/api/medications/{med_id}")
            print(f"Status: {response.status_code}")
            print(f"Response: {response.json()}")
            
            # Test 5: Verify deletion
            print("\n5. Testing GET /api/medications (should be empty again)")
            response = requests.get(f"{BASE_URL}/api/medications")
            print(f"Status: {response.status_code}")
            print(f"Response: {response.json()}")
    
    print("\nTest completed!")

if __name__ == "__main__":
    try:
        test_medications()
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to server. Make sure the FastAPI server is running on http://localhost:8000")
    except Exception as e:
        print(f"Error: {e}")
