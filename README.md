# Classroom Participation Tracker

A web-based classroom participation tracking system inspired by ClassDojo's interface. Track student engagement with visual indicators and export weekly reports.

## Features

- 📊 **Visual Participation Tracking**: 5-light indicator system with color progression
- 👥 **Class Management**: Create and manage multiple classes with dropdown selection
- 📈 **Point System**: 0-20 point range with easy +/- buttons
- 📅 **Weekly Reset**: Automatic weekly reset with manual override
- 📁 **CSV Import/Export**: Load class rosters and export participation data
- 💾 **Data Persistence**: Local storage with weekly history tracking
- 🎨 **Modern UI**: Clean, responsive design with Tailwind CSS

## Quick Start

### Docker (Recommended)

1. Clone this repository
2. Run with Docker Compose:
```bash
docker-compose up -d

Open http://localhost:3000

Local Development
Prerequisites

Node.js 16+ and npm
Git

Setup Steps

Clone the repository:

bashgit clone https://github.com/yourusername/classroom-participation-tracker.git
cd classroom-participation-tracker

Install dependencies:

bashnpm install

Start the development server:

bashnpm start

Open your browser to http://localhost:3000

The development server includes:

⚡ Hot reload for instant code changes
🔧 Built-in error overlay for debugging
📱 Responsive design testing tools
🌐 Network access for mobile testing

Development Commands
bash# Start development server
npm start

# Run tests
npm test

# Build for production
npm run build

# Serve production build locally
npx serve -s build
File Structure for Development
src/
├── App.js          # Main component with all tracker logic
├── index.js        # React app entry point
└── index.css       # Global styles
Making Changes

Edit src/App.js for component logic and UI changes
The app uses Tailwind CSS classes for styling
Data is stored in localStorage (inspect via browser dev tools)
CSV import/export functionality works with local files

Usage

Create a Class: Enter a class name and click "Create Class"
Import Students: Use "Import CSV" to load a roster (CSV with student names)
Track Participation: Click +/- buttons to award/remove points
Export Data: Download weekly reports as CSV files
Weekly Reset: Points automatically reset each week

Color System

🟢 Green (1-5 points): Initial participation level
🔵 Blue (6-10 points): Good participation
🟣 Purple (11-15 points): Excellent participation
🟡 Gold (16-20 points): Outstanding participation

CSV Format
Import CSV files with student names:
csvName
John Doe
Jane Smith
Mike Johnson
Technology Stack

React 18
Tailwind CSS
Lucide React Icons
Local Storage API

Repository Structure
classroom-participation-tracker/
├── README.md
├── package.json
├── package-lock.json
├── Dockerfile
├── docker-compose.yml
├── .dockerignore
├── .gitignore
├── public/
│   ├── index.html
│   └── manifest.json
└── src/
    ├── App.js
    ├── index.js
    └── index.css
