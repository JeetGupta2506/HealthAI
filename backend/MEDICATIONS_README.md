# Medication Management System

This document explains the new medication management features added to the HealthAI backend.

## Features

- **Add Medications**: Click the "Add" button to open a popup form
- **Delete Medications**: Each medication has a delete button (trash icon)
- **Persistent Storage**: Medications are saved to a JSON file (`medications.json`)
- **Real-time Updates**: Changes are immediately reflected in the UI

## API Endpoints

### GET /api/medications
Retrieves all medications for the current user.

**Response:**
```json
{
  "medications": [
    {
      "id": "1",
      "name": "Lisinopril",
      "dosage": "10mg",
      "frequency": "Once daily",
      "timeToTake": ["08:00"],
      "prescribedBy": "Dr. Smith",
      "startDate": "2024-01-01T00:00:00",
      "instructions": "Take with food"
    }
  ]
}
```

### POST /api/medications
Creates a new medication.

**Request Body:**
```json
{
  "name": "Medication Name",
  "dosage": "10mg",
  "frequency": "Once daily",
  "timeToTake": ["08:00"],
  "prescribedBy": "Dr. Smith",
  "startDate": "2024-01-01T00:00:00",
  "instructions": "Take with food"
}
```

**Response:**
```json
{
  "success": true,
  "medication": {
    "id": "1",
    "name": "Medication Name",
    ...
  }
}
```

### DELETE /api/medications/{medication_id}
Deletes a specific medication.

**Response:**
```json
{
  "success": true,
  "message": "Medication deleted successfully"
}
```

## Data Storage

Medications are stored in a local JSON file (`medications.json`) in the backend directory. The file is automatically created when the first medication is added.

## Testing

To test the medication endpoints, run the test script:

```bash
cd backend
python test_medications.py
```

Make sure the FastAPI server is running first:

```bash
uvicorn main:app --reload
```

## Frontend Integration

The frontend now includes:
- A popup form for adding new medications
- Delete buttons for each medication
- Real-time updates when medications are added/removed
- Form validation to ensure required fields are filled

## Form Fields

- **Medication Name** (required): The name of the medication
- **Dosage** (required): The dosage amount and unit
- **Frequency** (required): How often to take the medication
- **Times to Take** (required): Array of times when medication should be taken
- **Prescribed By** (required): Name of the prescribing doctor
- **Start Date** (required): When to start taking the medication
- **Instructions** (optional): Special instructions for taking the medication

## Error Handling

The system includes error handling for:
- Network failures
- Invalid data
- File I/O errors
- Missing required fields

All errors are logged to the console and appropriate error messages are shown to the user.
