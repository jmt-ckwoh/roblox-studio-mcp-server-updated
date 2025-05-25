// Simple test server that definitely stays running
import express from 'express';
import cors from 'cors';

const app = express();
const port = 44755;

app.use(cors());
app.use(express.json());

// Basic logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Test endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/request', (req, res) => {
  console.log('📤 Studio polling for commands...');
  res.json(null); // No commands for now
});

app.post('/response', (req, res) => {
  console.log('📥 Received response from Studio:', req.body);
  res.json({ status: 'received' });
});

app.post('/test-tool', (req, res) => {
  const { tool, args } = req.body;
  console.log(`🔧 Test tool request: ${tool}`, args);
  res.json({ success: true, result: `Mock result for ${tool}` });
});

// Start server
const server = app.listen(port, () => {
  console.log(`🚀 Simple test server running on port ${port}`);
  console.log(`📡 Test at: http://localhost:${port}/health`);
  console.log('Server is running... Press Ctrl+C to stop');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n💀 Shutting down...');
  server.close(() => {
    process.exit(0);
  });
});

console.log('✅ Server script loaded and starting...');