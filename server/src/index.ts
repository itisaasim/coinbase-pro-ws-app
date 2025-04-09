import express from 'express';
import http from 'http';
import WebSocket from 'ws';
import dotenv from 'dotenv';
import path from 'path';
import setupWebSocketServer from './websocketServer';
import fs from 'fs';

dotenv.config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

setupWebSocketServer(wss);

app.use(express.static(path.join(__dirname, '../../client/build')));

app.get('/*', (req, res) => {
  const indexPath = path.join(__dirname, '../../client/build/index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('index.html not found');
  }
});


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server started on http://localhost:${PORT}`));
