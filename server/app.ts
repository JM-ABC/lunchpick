import express from 'express';
import { createServer, type Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { nanoid } from 'nanoid';
import { RESTAURANTS } from './restaurants.js';

export const WS_PATH = '/api/ws';

interface TeamState {
  status: 'waiting' | 'voting' | 'done';
  candidates: typeof RESTAURANTS;
  votes: Record<string, string>; // userId -> restaurantId
  userNames: Record<string, string>; // userId -> nickname
  winnerId?: string;
  userCount: number;
}

export function createApp(): { app: express.Express; server: Server } {
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ server, path: WS_PATH });

  let teamState: TeamState = {
    status: 'waiting',
    candidates: [...RESTAURANTS].sort(() => 0.5 - Math.random()).slice(0, 4),
    votes: {},
    userNames: {},
    userCount: 0,
  };

  function broadcast(message: any) {
    const payload = JSON.stringify(message);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  }

  wss.on('connection', (ws: WebSocket) => {
    let userId = nanoid(5);
    teamState.userCount = wss.clients.size;

    ws.on('close', () => {
      teamState.userCount = wss.clients.size;
      broadcast({ type: 'STATE_UPDATED', state: teamState });
    });

    ws.on('message', (message: string) => {
      const data = JSON.parse(message);

      switch (data.type) {
        case 'IDENTIFY': {
          if (data.userId) {
            userId = data.userId;
          }
          const nickname = teamState.userNames[userId];
          ws.send(JSON.stringify({ type: 'SYNC_STATE', state: teamState, userId, nickname }));
          broadcast({ type: 'STATE_UPDATED', state: teamState });
          break;
        }
        case 'SET_NICKNAME': {
          const { nickname } = data;
          teamState.userNames[userId] = nickname;
          broadcast({ type: 'STATE_UPDATED', state: teamState });
          break;
        }
        case 'START_VOTING': {
          teamState.status = 'voting';
          broadcast({ type: 'STATE_UPDATED', state: teamState });
          break;
        }

        case 'SUBMIT_VOTE': {
          const { restaurantId } = data;
          teamState.votes[userId] = restaurantId;
          broadcast({ type: 'STATE_UPDATED', state: teamState });
          break;
        }

        case 'FINISH_VOTING': {
          teamState.status = 'done';

          const voteCounts: Record<string, number> = {};
          Object.values(teamState.votes).forEach(rid => {
            voteCounts[rid] = (voteCounts[rid] || 0) + 1;
          });

          let winnerId = '';
          let maxVotes = -1;

          if (Object.keys(voteCounts).length === 0) {
            winnerId = teamState.candidates[Math.floor(Math.random() * teamState.candidates.length)].id;
          } else {
            Object.entries(voteCounts).forEach(([rid, count]) => {
              if (count > maxVotes) {
                maxVotes = count;
                winnerId = rid;
              }
            });
          }

          teamState.winnerId = winnerId;
          broadcast({ type: 'STATE_UPDATED', state: teamState });
          break;
        }

        case 'ADD_CANDIDATE': {
          const { name, category } = data;
          const newCandidate = {
            id: nanoid(5),
            name,
            category,
            rating: 5.0,
            price: '₩₩',
            distance: '직접 입력',
            isSoloFriendly: true
          };
          teamState.candidates.push(newCandidate);
          broadcast({ type: 'STATE_UPDATED', state: teamState });
          break;
        }

        case 'RESET_VOTE': {
          teamState = {
            status: 'waiting',
            candidates: [...RESTAURANTS].sort(() => 0.5 - Math.random()).slice(0, 4),
            votes: {},
            userNames: teamState.userNames, // Keep user names
            userCount: wss.clients.size,
          };
          broadcast({ type: 'STATE_UPDATED', state: teamState });
          break;
        }
      }
    });
  });

  app.use(express.json());

  app.get('/api/daily-recommend', (req, res) => {
    const randomRestaurant = RESTAURANTS[Math.floor(Math.random() * RESTAURANTS.length)];
    res.json(randomRestaurant);
  });

  app.get('/api/recommend', (req, res) => {
    const soloFriendly = RESTAURANTS.filter(r => r.isSoloFriendly);
    const random = soloFriendly[Math.floor(Math.random() * soloFriendly.length)];
    res.json(random);
  });

  app.post('/api/restaurants', (req, res) => {
    const { name, category, distance } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const newRes = {
      id: nanoid(5),
      name,
      category: category || '기타',
      rating: 5.0,
      price: '₩₩',
      distance: distance || '직접 입력',
      isSoloFriendly: true
    };
    RESTAURANTS.push(newRes);
    res.json(newRes);
  });

  return { app, server };
}
