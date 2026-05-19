import express from 'express';
import cors from 'cors';
import { FileDB } from './db.js';

const app = express();
const PORT = process.env.PORT || 3005;

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Support W-2 scans, documents, and cursive signatures

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Server health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    database: FileDB.isMongoActive ? 'MongoDB-Atlas' : 'FileDB-Resilient', 
    time: new Date() 
  });
});

// Fetch full persistent database state
app.get('/api/state', async (req, res) => {
  try {
    const state = await FileDB.read();
    res.json(state);
  } catch (error) {
    console.error('Error fetching state:', error);
    res.status(500).json({ error: 'Failed to read database state' });
  }
});

// Mutate and save full persistent database state
app.post('/api/state', async (req, res) => {
  try {
    const newState = req.body;
    if (!newState || typeof newState !== 'object') {
      res.status(400).json({ error: 'Invalid state payload' });
      return;
    }
    await FileDB.write(newState);
    const updatedState = await FileDB.read();
    res.json({ success: true, state: updatedState });
  } catch (error) {
    console.error('Error updating state:', error);
    res.status(500).json({ error: 'Failed to write database state' });
  }
});

// Reset database state to mock initial data
app.post('/api/reset', async (req, res) => {
  try {
    await FileDB.reset();
    const state = await FileDB.read();
    res.json({ success: true, state });
  } catch (error) {
    console.error('Error resetting database:', error);
    res.status(500).json({ error: 'Failed to reset database' });
  }
});

// Start Full-Stack Service securely
const startServer = async () => {
  try {
    // 1. Initialize persistent storage engine
    await FileDB.init();
    
    // 2. Launch listener
    app.listen(PORT, () => {
      console.log(`⚡ [LuminaRental Server] running live on http://localhost:${PORT}`);
      console.log(`📡 Database mode: ${FileDB.isMongoActive ? '🍃 Cloud MongoDB Atlas' : '💾 Local File DB'}`);
    });
  } catch (error) {
    console.error('Failed to initialize server:', error);
    process.exit(1);
  }
};

startServer();
