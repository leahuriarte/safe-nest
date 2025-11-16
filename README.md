# SafeNest - Pregnancy Safety & Health Assistant

SafeNest is a comprehensive web application designed to help pregnant individuals make informed decisions about their health and safety. The app provides environmental risk assessment, clinic evaluation, community support, and document analysis capabilities.

## Features

### 🗺️ Interactive Risk Map
- Real-time environmental risk assessment for pregnancy
- Air quality monitoring with PM2.5 data
- Healthcare facility locations and accessibility
- Environmental hazard identification
- Risk scoring and recommendations

### 🏥 Clinic Evaluator
- Healthcare facility information and reviews
- Service availability and quality ratings
- Distance and accessibility analysis

### 👥 Community Experience
- User reviews and experiences
- Community-driven safety insights
- Local recommendations and tips

### 📄 Document Helper (AI-Powered)
- Upload and analyze medical documents (PDF/TXT)
- AI-powered question answering using Google Gemini
- Intelligent document chunking and retrieval
- Markdown-formatted responses with source citations

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **ArcGIS Maps SDK** for interactive mapping
- **Material-UI** for UI components
- **React Markdown** for formatted AI responses
- **PDF.js** for document processing

### Backend
- **Node.js** with Express
- **Google Generative AI (Gemini 2.5)** for document analysis
- **CORS** enabled for cross-origin requests
- **dotenv** for environment configuration

## Prerequisites

- **Node.js** (v18 or higher)
- **npm** (v8 or higher)
- **Google Gemini API Key** ([Get one here](https://makersuite.google.com/app/apikey))

## Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd safe-nest
```

### 2. Install Dependencies
```bash
npm run install:all
```
This installs dependencies for both the frontend and backend.

### 3. Configure Environment Variables

#### Backend Configuration
Create `server/.env` file:
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3001
```

#### Frontend Configuration
The frontend is pre-configured to connect to `http://localhost:3001`. For production, update `web-app/.env`:
```env
VITE_API_URL=https://your-production-backend.com
```

## Running the Application

### Option 1: Single Command (Recommended)
```bash
npm run dev
```
This starts both the backend and frontend servers concurrently.

### Option 2: Separate Terminals
If the single command doesn't work, run in separate terminals:

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd web-app
npm run dev
```

### Access the Application
- **Frontend**: http://localhost:5173 (or next available port)
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## Usage Guide

### 1. Risk Map
- Navigate to the Map tab
- View real-time environmental data overlays
- Click on facilities and hazards for detailed information
- Use the risk assessment panel to understand pregnancy-related risks
- Toggle different data layers (air quality, healthcare, environmental hazards)

### 2. Document Helper
- Navigate to the Document Helper tab
- Upload PDF or TXT medical documents
- Ask questions about your documents in natural language
- Receive AI-powered answers with source citations
- View document previews and manage multiple files

### 3. Clinic Evaluator & Community
- Browse healthcare facilities and community reviews
- Access local recommendations and experiences

## API Endpoints

### Backend API
- `GET /health` - Health check endpoint
- `POST /api/rag` - Document analysis and question answering

#### RAG Endpoint Usage
```javascript
POST /api/rag
Content-Type: application/json

{
  "query": "What medications are recommended?",
  "chunks": [
    {
      "text": "Document content...",
      "pageNumber": 1,
      "chunkIndex": 0,
      "documentName": "medical-report.pdf"
    }
  ]
}
```

## Development

### Project Structure
```
safe-nest/
├── web-app/                 # React frontend
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── screens/         # Main application screens
│   │   ├── utils/           # Utility functions
│   │   └── services/        # API services
│   ├── public/              # Static assets
│   └── package.json
├── server/                  # Node.js backend
│   ├── server.js           # Main server file
│   ├── .env                # Environment variables
│   └── package.json
├── package.json            # Root package.json
└── README.md
```

### Available Scripts

#### Root Level
- `npm run dev` - Start both frontend and backend
- `npm run build` - Build frontend for production
- `npm run install:all` - Install all dependencies

#### Frontend (web-app/)
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

#### Backend (server/)
- `npm run dev` - Start development server with auto-reload
- `npm start` - Start production server

## Troubleshooting

### Common Issues

#### "Failed to fetch" errors
1. Ensure both servers are running
2. Check backend health: `curl http://localhost:3001/health`
3. Verify Gemini API key is set in `server/.env`

#### PDF upload fails
1. Check browser console for specific errors
2. Ensure PDF worker file is accessible
3. Try with a different PDF file

#### Map not loading
1. Check ArcGIS API key configuration
2. Verify internet connection for map tiles
3. Check browser console for API errors

#### Port conflicts
- Frontend will automatically use next available port if 5173 is busy
- Backend uses port 3001 by default (configurable via PORT env var)

### Environment Variables

#### Required
- `GEMINI_API_KEY` - Google Gemini API key for document analysis

#### Optional
- `PORT` - Backend server port (default: 3001)
- `VITE_API_URL` - Frontend API URL (default: http://localhost:3001)

## Production Deployment

### Frontend
1. Build the frontend: `npm run build`
2. Deploy the `web-app/dist` folder to your hosting service
3. Update `VITE_API_URL` to point to your production backend

### Backend
1. Deploy the `server/` folder to your hosting service
2. Set environment variables:
   - `GEMINI_API_KEY`
   - `PORT` (if different from 3001)
3. Install dependencies: `npm install`
4. Start the server: `npm start`

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Review the browser console for error messages
3. Ensure all environment variables are properly configured
4. Verify API keys and network connectivity

## Acknowledgments

- **ArcGIS** for mapping capabilities
- **Google Gemini AI** for document analysis
- **OpenAQ** for air quality data
- **React** and **Vite** communities for excellent development tools