import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config();

const COINBASE_WS_URL = process.env.COINBASE_WS_URL as string;

const setupWebSocketServer = (wss: WebSocket.Server) => {
  const coinbaseSocket = new WebSocket(COINBASE_WS_URL);
  const userSubscriptions = new Map<WebSocket, Set<string>>();

  coinbaseSocket.on('open', () => console.log('Connected to Coinbase Pro WebSocket'));

  wss.on('connection', (client: WebSocket) => {
    userSubscriptions.set(client, new Set());

    client.on('message', (msg: string) => {
      const data = JSON.parse(msg);
      const { type, product_id } = data;

      if (type === 'subscribe') {
        const subs = userSubscriptions.get(client);
        subs?.add(product_id);

        const subscribeMsg = {
          type: 'subscribe',
          product_ids: [product_id],
          channels: ['level2', 'matches'],
        };
        coinbaseSocket.send(JSON.stringify(subscribeMsg));
      }

      if (type === 'unsubscribe') {
        const subs = userSubscriptions.get(client);
        subs?.delete(product_id);

        const unsubscribeMsg = {
          type: 'unsubscribe',
          product_ids: [product_id],
          channels: ['level2', 'matches'],
        };
        coinbaseSocket.send(JSON.stringify(unsubscribeMsg));
      }
    });

    client.on('close', () => {
      userSubscriptions.delete(client);
    });
  });

  coinbaseSocket.on('message', (msg: string) => {
    const data = JSON.parse(msg);

    userSubscriptions.forEach((subs, client) => {
      if (client.readyState === WebSocket.OPEN && subs.has(data.product_id)) {
        client.send(JSON.stringify(data));
      }
    });
  });
};

export default setupWebSocketServer;
