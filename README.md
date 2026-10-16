
# AquaScan - qMarine Debris Detection

### AI-Driven Marine Debris Detection and Mapping System for Ocean Conservation

BuildFest 2.0 | Problem Statement: PS-17

## About the Project

Marine Debris Detection is an environmental-monitoring prototype designed to analyze marine and coastal images using AI-assisted debris detection. It aims to help users review observations, associate them with geographic locations, and support ocean conservation efforts.

## Objectives

- Detect potential marine debris in images using AI.
- Allow users to review and verify observations.
- Associate observations with geographic locations.
- Present environmental observations through a user-friendly interface.

## Team Runtime Rebels

- Japleen Arora (Team Leader)
- Arshpreet Kaur
- Karandeep Kaur
- Vanshika

## Technology Stack

Frontend: React, Vite, JavaScript, Bootstrap 5, React Router, Leaflet, React Leaflet.

Backend: Python, FastAPI, SQLite.

AI Integration: Roboflow.

Version Control: Git and GitHub.

Planned Technology: Chart.js for data visualization.

## Getting Started

### Prerequisites

- Node.js and npm
- Python
- Git

### Frontend Setup

1\. Clone the repository:

`git clone https://github.com/japleen-arora77/marine-debris-detection.git`

2\. Navigate to the project folder:

`cd marine-debris-detection`

3\. Install dependencies:

`npm install`

4\. Start the development server:

`npm run dev`

5\. Open the local URL displayed in the terminal.

### Backend Setup

1. Navigate to the backend directory.
2. Create a virtual environment:

`python -m venv .venv`

3\. Activate it in Windows PowerShell:

`.venv\Scripts\Activate.ps1`

4\. Install dependencies using the project's requirements file, if available:

`pip install -r requirements.txt`

5\. Start the FastAPI server using the project's configured entry point.

When the backend is running, its interactive API documentation is generally available at `/docs`.

## Development Status

- React frontend setup completed.
- Image upload and observation-summary interface implemented.
- Location search and map selection available in the upload interface.
- Complete AI detection workflow.
- Human verification implemented.
- Interactive pollution map completed.
- PDF export for summary and individuals sites are completed.

## Limitations

This project is a prototype and does not provide scientific measurements of ocean pollution.

- AI detections may be inaccurate and require human verification.
- Model confidence scores should not be interpreted as calibrated probabilities.
- A selected site coordinate does not necessarily represent the exact location of an individual debris object.
- Missing data must not be presented as confirmed detections.

## Future Improvements

- Complete and test the AI detection workflow.
- Develop interactive observation mapping.
- Add charts in reports.
- Improve observation verification and data visualization.
- Enhance usability and UX.


Developed by Team Runtime Rebels for BuildFest 2.0.
