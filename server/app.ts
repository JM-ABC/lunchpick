import express from 'express';
import { createServer, type Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { nanoid } from 'nanoid';
import { RESTAURANTS } from './restaurants.js';
import { CAFES } from './cafes.js';
import { GROUP_VENUES } from './group-venues.js';

export const WS_PATH = '/api/ws';

interface TeamState {
  status: 'voting' | 'done';
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

  const RESTAURANT_RECENT_LIMIT = 5;
  const CAFE_RECENT_LIMIT = 2;
  const GROUP_RECENT_LIMIT = 3;
  const TEAM_CANDIDATE_ROUNDS_REMEMBERED = 2;
  const recentRestaurantIds: string[] = [];
  const recentCafeIds: string[] = [];
  const recentGroupIds: string[] = [];
  const recentTeamCandidateIds: string[] = [];

  function pickAvoidingRecent<T extends { id: string }>(pool: T[], recentIds: string[]): T {
    const candidates = pool.filter(item => !recentIds.includes(item.id));
    const list = candidates.length > 0 ? candidates : pool;
    return list[Math.floor(Math.random() * list.length)];
  }

  function rememberRecent(recentIds: string[], id: string, limit: number) {
    recentIds.push(id);
    if (recentIds.length > limit) recentIds.shift();
  }

  function broadCategory(category: string): string {
    return category.split('/')[0];
  }

  function pickTeamCandidates(): typeof RESTAURANTS {
    const pool = RESTAURANTS.filter(r => !recentTeamCandidateIds.includes(r.id));
    const source = pool.length >= 4 ? pool : RESTAURANTS;
    const picks = [...source].sort(() => 0.5 - Math.random()).slice(0, 4);
    const limit = 4 * TEAM_CANDIDATE_ROUNDS_REMEMBERED;
    picks.forEach(p => rememberRecent(recentTeamCandidateIds, p.id, limit));
    return picks;
  }

  let teamState: TeamState = {
    status: 'voting',
    candidates: pickTeamCandidates(),
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
        case 'SUBMIT_VOTE': {
          if (teamState.status !== 'voting') break;
          const { restaurantId } = data;
          teamState.votes[userId] = restaurantId;
          broadcast({ type: 'STATE_UPDATED', state: teamState });
          break;
        }

        case 'FINISH_VOTING': {
          teamState.status = 'done';

          // Map preserves true vote order; a plain object would reorder
          // numeric-string keys (restaurant ids) ascending, silently
          // favoring lower ids on ties instead of whoever got voted first.
          const voteCounts = new Map<string, number>();
          Object.values(teamState.votes).forEach(rid => {
            voteCounts.set(rid, (voteCounts.get(rid) || 0) + 1);
          });

          let winnerId = '';
          let maxVotes = -1;

          if (voteCounts.size === 0) {
            winnerId = teamState.candidates[Math.floor(Math.random() * teamState.candidates.length)].id;
          } else {
            voteCounts.forEach((count, rid) => {
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
          if (teamState.status !== 'voting') break;
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
            status: 'voting',
            candidates: pickTeamCandidates(),
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

  app.get('/api/restaurant-categories', (req, res) => {
    const categories = Array.from(new Set(RESTAURANTS.map(r => broadCategory(r.category)))).sort();
    res.json(categories);
  });

  app.get('/api/daily-recommend', (req, res) => {
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    const soloOnly = req.query.solo === 'true';
    let filtered = category ? RESTAURANTS.filter(r => broadCategory(r.category) === category) : RESTAURANTS;
    if (soloOnly) filtered = filtered.filter(r => r.isSoloFriendly);
    if (filtered.length === 0) {
      // Category + solo-only combined match nothing — don't silently fall
      // back to the full list, that would ignore both filters the user
      // picked and return an unrelated restaurant.
      res.status(404).json({ error: 'no_match' });
      return;
    }
    const restaurant = pickAvoidingRecent(filtered, recentRestaurantIds);
    rememberRecent(recentRestaurantIds, restaurant.id, RESTAURANT_RECENT_LIMIT);
    res.json(restaurant);
  });

  app.get('/api/daily-cafe-recommend', (req, res) => {
    const cafe = pickAvoidingRecent(CAFES, recentCafeIds);
    rememberRecent(recentCafeIds, cafe.id, CAFE_RECENT_LIMIT);
    res.json(cafe);
  });

  app.get('/api/daily-group-recommend', (req, res) => {
    const venue = pickAvoidingRecent(GROUP_VENUES, recentGroupIds);
    rememberRecent(recentGroupIds, venue.id, GROUP_RECENT_LIMIT);
    res.json(venue);
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
