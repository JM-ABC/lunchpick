import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { nanoid } from 'nanoid';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const PORT = 3000;

// 잠실 롯데월드몰/백화점 맛집 데이터
let RESTAURANTS = [
  { id: '1', name: '유미분분식', category: '분식', rating: 4.4, price: '₩', distance: '롯데월드몰', isSoloFriendly: true },
  { id: '2', name: '만옥', category: '중식', rating: 4.3, price: '₩₩', distance: '롯데월드몰', isSoloFriendly: true },
  { id: '3', name: '쌤쌤쌤 (Sam Sam Sam)', category: '양식', rating: 4.7, price: '₩₩', distance: '롯데월드몰', isSoloFriendly: true },
  { id: '4', name: '포브라더스', category: '아시안', rating: 4.5, price: '₩₩', distance: '롯데월드몰', isSoloFriendly: true },
  { id: '5', name: '고봉삼계탕', category: '한식', rating: 4.6, price: '₩₩', distance: '롯데백화점', isSoloFriendly: true },
  { id: '6', name: '구워주는집', category: '고기/구이', rating: 4.5, price: '₩₩', distance: '롯데백화점', isSoloFriendly: false },
  { id: '7', name: '하이디라오 훠궈', category: '중식/훠궈', rating: 4.8, price: '₩₩₩', distance: '롯데월드몰', isSoloFriendly: false },
  { id: '8', name: '바이킹스 워프', category: '해산물 뷔페', rating: 4.7, price: '₩₩₩₩', distance: '롯데월드몰', isSoloFriendly: false },
  { id: '10', name: '해목', category: '일식/덮밥', rating: 4.3, price: '₩₩₩', distance: '롯데월드몰', isSoloFriendly: true },
  { id: '11', name: '오레노라멘', category: '일식/라멘', rating: 4.4, price: '₩₩', distance: '롯데월드몰', isSoloFriendly: true },
  { id: '12', name: '치즈룸&테이스팅룸', category: '양식', rating: 4.6, price: '₩₩₩', distance: '롯데월드몰', isSoloFriendly: false },
  { id: '13', name: '갓덴스시', category: '일식/스시', rating: 4.5, price: '₩₩', distance: '롯데월드몰', isSoloFriendly: true },
  { id: '14', name: '빌즈 (Bills)', category: '양식/브런치', rating: 4.2, price: '₩₩₩', distance: '롯데월드몰', isSoloFriendly: true },
  { id: '15', name: '온더보더', category: '멕시칸', rating: 4.1, price: '₩₩₩', distance: '롯데월드몰', isSoloFriendly: false },
  { id: '16', name: '피에프창', category: '중식/아시안', rating: 4.3, price: '₩₩₩', distance: '롯데월드몰', isSoloFriendly: false },
  { id: '17', name: '칸다소바', category: '일식/마제소바', rating: 4.5, price: '₩₩', distance: '롯데월드몰', isSoloFriendly: true },
  { id: '18', name: '브루클린 더 버거 조인트', category: '양식/버거', rating: 4.4, price: '₩₩', distance: '롯데월드몰', isSoloFriendly: true },
  { id: '19', name: '쉑쉑버거', category: '양식/버거', rating: 4.3, price: '₩₩', distance: '롯데월드몰', isSoloFriendly: true },
  { id: '20', name: '아그라', category: '인도음식', rating: 4.4, price: '₩₩₩', distance: '롯데월드몰', isSoloFriendly: false },
  { id: '21', name: '스페인클럽', category: '스페인음식', rating: 4.1, price: '₩₩₩', distance: '롯데월드몰', isSoloFriendly: false },
  { id: '22', name: '차이797', category: '중식', rating: 4.2, price: '₩₩₩', distance: '롯데월드몰', isSoloFriendly: false },
  { id: '23', name: '부탄츄', category: '일식/라멘', rating: 4.3, price: '₩₩', distance: '롯데월드몰', isSoloFriendly: true },
  { id: '25', name: '미미네', category: '분식', rating: 4.1, price: '₩', distance: '롯데월드몰', isSoloFriendly: true },
  { id: '26', name: '코코이찌방야', category: '일식/카레', rating: 4.2, price: '₩₩', distance: '롯데월드몰', isSoloFriendly: true },
  { id: '27', name: '사이드쇼', category: '분식/떡볶이', rating: 4.3, price: '₩₩', distance: '롯데월드몰', isSoloFriendly: true },
  { id: '28', name: '리틀사이공', category: '베트남음식', rating: 4.2, price: '₩₩', distance: '롯데월드몰', isSoloFriendly: true },
  { id: '29', name: '강가', category: '인도음식', rating: 4.3, price: '₩₩₩', distance: '롯데월드몰', isSoloFriendly: false },
  { id: '30', name: '피에프창', category: '아시안 퓨전', rating: 4.4, price: '₩₩₩', distance: '롯데월드몰', isSoloFriendly: false },
  { id: '31', name: '베테랑칼국수', category: '한식/칼국수', rating: 4.2, price: '₩', distance: '롯데백화점', isSoloFriendly: true },
  { id: '32', name: '라 세느 (La Seine)', category: '호텔뷔페', rating: 4.3, price: '₩₩₩₩', distance: '롯데호텔', isSoloFriendly: false },
  { id: '33', name: '땀땀', category: '베트남음식', rating: 4.1, price: '₩₩', distance: '롯데백화점', isSoloFriendly: true },
  { id: '34', name: '한국집', category: '한식/비빔밥', rating: 4.0, price: '₩₩', distance: '롯데백화점', isSoloFriendly: true },
  { id: '35', name: '마즈야', category: '일식/돈까스', rating: 4.1, price: '₩₩', distance: '롯데백화점', isSoloFriendly: true },
  { id: '36', name: '봉피양', category: '한식/냉면', rating: 4.4, price: '₩₩', distance: '롯데백화점', isSoloFriendly: true },
  { id: '37', name: '다이치', category: '일식/돈까스', rating: 4.2, price: '₩₩', distance: '롯데백화점', isSoloFriendly: true },
  { id: '41', name: '대치동함흥면옥', category: '한식/냉면', rating: 4.1, price: '₩₩', distance: '롯데백화점', isSoloFriendly: true },
  { id: '43', name: '촙촙 (Chop Chop)', category: '아시안/베트남', rating: 4.2, price: '₩₩', distance: '롯데백화점', isSoloFriendly: true },
  { id: '45', name: '딤딤섬', category: '중식/딤섬', rating: 4.3, price: '₩₩', distance: '롯데백화점', isSoloFriendly: true },
];

const RECOMMENDATION_COMMENTS: Record<string, string[]> = {
  '한식': ['든든한 한 끼로 오후 업무도 화이팅!', '한국인은 역시 밥심이죠.', '정갈하고 깔끔한 한식 한 상.'],
  '중식': ['스트레스 풀리는 매콤한 짬뽕 어때요?', '짜장면과 탕수육의 완벽한 조화.', '딤섬과 함께 즐기는 홍콩의 맛.'],
  '일식': ['깔끔하고 담백한 일식으로 점심 해결!', '신선한 재료로 만든 스시 한 점.', '따뜻한 라멘 국물이 생각나는 날.'],
  '양식': ['분위기 있게 즐기는 파스타와 스테이크.', '벚꽃과 어울리는 이탈리안 레스토랑.', '가볍게 즐기는 브런치 타임.'],
  '분식': ['추억의 맛, 매콤달콤한 떡볶이.', '간편하지만 확실한 행복, 분식 타임.', '바삭한 튀김과 순대의 환상 궁합.'],
  '아시안': ['이국적인 향신료의 매력에 빠져보세요.', '베트남 쌀국수로 시원하게 해장!', '태국 요리의 다채로운 맛.'],
  '기타': ['오늘따라 특별한 메뉴가 당긴다면?', '새로운 맛의 세계로 초대합니다.', '실패 없는 오늘의 추천 메뉴.'],
};

function getCommentForRestaurant(restaurant: any) {
  const category = Object.keys(RECOMMENDATION_COMMENTS).find(c => restaurant.category.includes(c)) || '기타';
  const comments = RECOMMENDATION_COMMENTS[category];
  return comments[Math.floor(Math.random() * comments.length)];
}

app.use(express.json());

// 단일 팀 상태 관리
interface TeamState {
  status: 'waiting' | 'voting' | 'done';
  candidates: typeof RESTAURANTS;
  votes: Record<string, string>; // userId -> restaurantId
  userNames: Record<string, string>; // userId -> nickname
  winnerId?: string;
  userCount: number;
}

let teamState: TeamState = {
  status: 'waiting',
  candidates: [...RESTAURANTS].sort(() => 0.5 - Math.random()).slice(0, 4),
  votes: {},
  userNames: {},
  userCount: 0,
};

// WebSocket Logic
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

function broadcast(message: any) {
  const payload = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

// API Routes
app.get('/api/daily-recommend', (req, res) => {
  const randomRestaurant = RESTAURANTS[Math.floor(Math.random() * RESTAURANTS.length)];
  const comment = getCommentForRestaurant(randomRestaurant);
  res.json({ ...randomRestaurant, comment });
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

// Vite Integration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`LunchPick Server running on http://localhost:${PORT}`);
  });
}

startServer();
