export const INVALID_MOVE = 'INVALID_MOVE';

// 六角形の隣接方向ベクトル (アキシアル座標: q, r)
export const HEX_DIRECTIONS = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
];

export const BOARD_RADIUS = 3; // 半径3の六角形 (全37マス)

// 六角形盤面の初期化 (全37マス：実物玩具に準拠し青19個・白18個の密な整列配置)
export const createInitialBoard = (random) => {
  const blocks = {};
  
  // 青19個・白18個 (計37個) のカラー配列を作成しシャッフル
  const colorList = [
    ...Array(19).fill('blue'),
    ...Array(18).fill('white')
  ];
  for (let i = colorList.length - 1; i > 0; i--) {
    const j = random.Die(i + 1) - 1;
    [colorList[i], colorList[j]] = [colorList[j], colorList[i]];
  }

  let colorIdx = 0;
  for (let q = -BOARD_RADIUS; q <= BOARD_RADIUS; q++) {
    const r1 = Math.max(-BOARD_RADIUS, -q - BOARD_RADIUS);
    const r2 = Math.min(BOARD_RADIUS, -q + BOARD_RADIUS);
    for (let r = r1; r <= r2; r++) {
      const key = `${q},${r}`;
      // 外枠に接しているか判定
      const isEdge = (
        Math.abs(q) === BOARD_RADIUS || 
        Math.abs(r) === BOARD_RADIUS || 
        Math.abs(q + r) === BOARD_RADIUS
      );

      blocks[key] = {
        q,
        r,
        color: colorList[colorIdx++],
        isEdge,
        stability: 100, // 耐久度 (方式B用)
        cracked: false, // ヒビ状態
      };
    }
  }
  return blocks;
};

// 六角形盤面における外枠外周判定
export const isOutsideBoard = (q, r) => {
  return Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r)) > BOARD_RADIUS;
};

// 各マスの外枠（プラスチック壁）からの支持面数を計算
export const getFrameSupportCount = (q, r) => {
  let count = 0;
  for (const dir of HEX_DIRECTIONS) {
    if (isOutsideBoard(q + dir.q, r + dir.r)) {
      count++;
    }
  }
  return count;
};

// 構造力学・アーチ安定性物理シミュレーション (Structural Arch Physics Simulation)
// 六角形の氷ブロックが自重や外力に耐えて浮いていられる条件：
// 側面の摩擦力・アーチ圧縮力による「有効支持点数（枠の壁＋安定した隣接ブロック）」が4点以上（フォームクロージャ）であること。
// ・接続点が2点（対面や隣接）→ 回転モーメントや横滑りに耐えられず崩落
// ・接続点が3点（一つ空き含む）→ 不静定アーチを形成できず隙間にすり抜けて崩落
// ・支持が4点未満に低下したブロックは連鎖的に崩落（アバランシェ現象）
export const simulateStructuralCollapses = (currentBoard) => {
  const remainingKeys = new Set(Object.keys(currentBoard));
  const collapsedKeys = [];

  let changed = true;
  while (changed) {
    changed = false;
    const toRemove = [];

    for (const key of remainingKeys) {
      const [q, r] = key.split(',').map(Number);
      const frameSupports = getFrameSupportCount(q, r);

      let neighborSupports = 0;
      for (const dir of HEX_DIRECTIONS) {
        const nKey = `${q + dir.q},${r + dir.r}`;
        if (remainingKeys.has(nKey)) {
          neighborSupports++;
        }
      }

      const totalSupport = frameSupports + neighborSupports;

      // 4点未満の支持しか持たないブロックは自立できず崩落
      if (totalSupport < 4) {
        toRemove.push(key);
      }
    }

    if (toRemove.length > 0) {
      for (const key of toRemove) {
        remainingKeys.delete(key);
        collapsedKeys.push(key);
      }
      changed = true;
    }
  }

  // 枠から物理的に連結されているか (BFS)
  const connectedToFrame = new Set();
  const queue = [];

  for (const key of remainingKeys) {
    const [q, r] = key.split(',').map(Number);
    if (getFrameSupportCount(q, r) > 0) {
      connectedToFrame.add(key);
      queue.push(key);
    }
  }

  while (queue.length > 0) {
    const curr = queue.shift();
    const [q, r] = curr.split(',').map(Number);

    for (const dir of HEX_DIRECTIONS) {
      const nKey = `${q + dir.q},${r + dir.r}`;
      if (remainingKeys.has(nKey) && !connectedToFrame.has(nKey)) {
        connectedToFrame.add(nKey);
        queue.push(nKey);
      }
    }
  }

  // 浮島を崩落
  for (const key of remainingKeys) {
    if (!connectedToFrame.has(key)) {
      if (!collapsedKeys.includes(key)) {
        collapsedKeys.push(key);
      }
    }
  }

  return collapsedKeys;
};

export const ROULETTE_ITEMS = [
  { id: 'blue', label: '青の氷を1個落とす', shortLabel: '青 1個', icon: '🟦', color: '#1976d2', textColor: '#ffffff', targetColor: 'blue', count: 1 },
  { id: 'white', label: '白の氷を1個落とす', shortLabel: '白 1個', icon: '⬜', color: '#b0bec5', textColor: '#263238', targetColor: 'white', count: 1 },
  { id: 'any', label: '好きな氷を1個落とす', shortLabel: '自由 1個', icon: '🧊', color: '#43a047', textColor: '#ffffff', targetColor: 'any', count: 1 },
  { id: 'two', label: '好きな氷を2個落とす', shortLabel: '自由 2個', icon: '⚡', color: '#fb8c00', textColor: '#ffffff', targetColor: 'any', count: 2 },
  { id: 'skip', label: 'パス（次の人へ）', shortLabel: 'パス', icon: '🛑', color: '#e53935', textColor: '#ffffff', targetColor: 'none', count: 0 },
];

// 1対1トーナメント表ジェネレーター (2人〜8人対応)
export const buildTournament = (playerIds) => {
  const n = playerIds ? playerIds.length : 0;
  if (n < 2) return [];

  if (n === 2) {
    return [
      {
        id: 0,
        round: 1,
        roundName: '決勝戦',
        name: '決勝戦',
        p1: playerIds[0],
        p2: playerIds[1],
        winner: null,
        loser: null,
        nextMatchId: null,
        nextSlot: null,
      }
    ];
  }

  if (n === 3) {
    return [
      {
        id: 0,
        round: 1,
        roundName: '準決勝',
        name: '準決勝',
        p1: playerIds[1],
        p2: playerIds[2],
        winner: null,
        loser: null,
        nextMatchId: 1,
        nextSlot: 'p2',
      },
      {
        id: 1,
        round: 2,
        roundName: '決勝戦',
        name: '決勝戦',
        p1: playerIds[0],
        p2: null,
        winner: null,
        loser: null,
        nextMatchId: null,
        nextSlot: null,
      }
    ];
  }

  if (n === 4) {
    return [
      {
        id: 0,
        round: 1,
        roundName: '準決勝',
        name: '準決勝 第1試合',
        p1: playerIds[0],
        p2: playerIds[1],
        winner: null,
        loser: null,
        nextMatchId: 2,
        nextSlot: 'p1',
      },
      {
        id: 1,
        round: 1,
        roundName: '準決勝',
        name: '準決勝 第2試合',
        p1: playerIds[2],
        p2: playerIds[3],
        winner: null,
        loser: null,
        nextMatchId: 2,
        nextSlot: 'p2',
      },
      {
        id: 2,
        round: 2,
        roundName: '決勝戦',
        name: '決勝戦',
        p1: null,
        p2: null,
        winner: null,
        loser: null,
        nextMatchId: null,
        nextSlot: null,
      }
    ];
  }

  if (n === 5) {
    return [
      {
        id: 0,
        round: 1,
        roundName: '1回戦',
        name: '1回戦 (準々決勝)',
        p1: playerIds[3],
        p2: playerIds[4],
        winner: null,
        loser: null,
        nextMatchId: 2,
        nextSlot: 'p2',
      },
      {
        id: 1,
        round: 2,
        roundName: '準決勝',
        name: '準決勝 第1試合',
        p1: playerIds[0],
        p2: playerIds[1],
        winner: null,
        loser: null,
        nextMatchId: 3,
        nextSlot: 'p1',
      },
      {
        id: 2,
        round: 2,
        roundName: '準決勝',
        name: '準決勝 第2試合',
        p1: playerIds[2],
        p2: null,
        winner: null,
        loser: null,
        nextMatchId: 3,
        nextSlot: 'p2',
      },
      {
        id: 3,
        round: 3,
        roundName: '決勝戦',
        name: '決勝戦',
        p1: null,
        p2: null,
        winner: null,
        loser: null,
        nextMatchId: null,
        nextSlot: null,
      }
    ];
  }

  if (n === 6) {
    return [
      {
        id: 0,
        round: 1,
        roundName: '1回戦',
        name: '1回戦 第1試合',
        p1: playerIds[2],
        p2: playerIds[3],
        winner: null,
        loser: null,
        nextMatchId: 2,
        nextSlot: 'p2',
      },
      {
        id: 1,
        round: 1,
        roundName: '1回戦',
        name: '1回戦 第2試合',
        p1: playerIds[4],
        p2: playerIds[5],
        winner: null,
        loser: null,
        nextMatchId: 3,
        nextSlot: 'p2',
      },
      {
        id: 2,
        round: 2,
        roundName: '準決勝',
        name: '準決勝 第1試合',
        p1: playerIds[0],
        p2: null,
        winner: null,
        loser: null,
        nextMatchId: 4,
        nextSlot: 'p1',
      },
      {
        id: 3,
        round: 2,
        roundName: '準決勝',
        name: '準決勝 第2試合',
        p1: playerIds[1],
        p2: null,
        winner: null,
        loser: null,
        nextMatchId: 4,
        nextSlot: 'p2',
      },
      {
        id: 4,
        round: 3,
        roundName: '決勝戦',
        name: '決勝戦',
        p1: null,
        p2: null,
        winner: null,
        loser: null,
        nextMatchId: null,
        nextSlot: null,
      }
    ];
  }

  if (n === 7) {
    return [
      {
        id: 0,
        round: 1,
        roundName: '1回戦',
        name: '1回戦 第1試合',
        p1: playerIds[1],
        p2: playerIds[2],
        winner: null,
        loser: null,
        nextMatchId: 3,
        nextSlot: 'p2',
      },
      {
        id: 1,
        round: 1,
        roundName: '1回戦',
        name: '1回戦 第2試合',
        p1: playerIds[3],
        p2: playerIds[4],
        winner: null,
        loser: null,
        nextMatchId: 4,
        nextSlot: 'p1',
      },
      {
        id: 2,
        round: 1,
        roundName: '1回戦',
        name: '1回戦 第3試合',
        p1: playerIds[5],
        p2: playerIds[6],
        winner: null,
        loser: null,
        nextMatchId: 4,
        nextSlot: 'p2',
      },
      {
        id: 3,
        round: 2,
        roundName: '準決勝',
        name: '準決勝 第1試合',
        p1: playerIds[0],
        p2: null,
        winner: null,
        loser: null,
        nextMatchId: 5,
        nextSlot: 'p1',
      },
      {
        id: 4,
        round: 2,
        roundName: '準決勝',
        name: '準決勝 第2試合',
        p1: null,
        p2: null,
        winner: null,
        loser: null,
        nextMatchId: 5,
        nextSlot: 'p2',
      },
      {
        id: 5,
        round: 3,
        roundName: '決勝戦',
        name: '決勝戦',
        p1: null,
        p2: null,
        winner: null,
        loser: null,
        nextMatchId: null,
        nextSlot: null,
      }
    ];
  }

  // n >= 8 (8人トーナメント)
  return [
    {
      id: 0,
      round: 1,
      roundName: '準々決勝',
      name: '準々決勝 第1試合',
      p1: playerIds[0],
      p2: playerIds[1],
      winner: null,
      loser: null,
      nextMatchId: 4,
      nextSlot: 'p1',
    },
    {
      id: 1,
      round: 1,
      roundName: '準々決勝',
      name: '準々決勝 第2試合',
      p1: playerIds[2],
      p2: playerIds[3],
      winner: null,
      loser: null,
      nextMatchId: 4,
      nextSlot: 'p2',
    },
    {
      id: 2,
      round: 1,
      roundName: '準々決勝',
      name: '準々決勝 第3試合',
      p1: playerIds[4],
      p2: playerIds[5],
      winner: null,
      loser: null,
      nextMatchId: 5,
      nextSlot: 'p1',
    },
    {
      id: 3,
      round: 1,
      roundName: '準々決勝',
      name: '準々決勝 第4試合',
      p1: playerIds[6],
      p2: playerIds[7],
      winner: null,
      loser: null,
      nextMatchId: 5,
      nextSlot: 'p2',
    },
    {
      id: 4,
      round: 2,
      roundName: '準決勝',
      name: '準決勝 第1試合',
      p1: null,
      p2: null,
      winner: null,
      loser: null,
      nextMatchId: 6,
      nextSlot: 'p1',
    },
    {
      id: 5,
      round: 2,
      roundName: '準決勝',
      name: '準決勝 第2試合',
      p1: null,
      p2: null,
      winner: null,
      loser: null,
      nextMatchId: 6,
      nextSlot: 'p2',
    },
    {
      id: 6,
      round: 3,
      roundName: '決勝戦',
      name: '決勝戦',
      p1: null,
      p2: null,
      winner: null,
      loser: null,
      nextMatchId: null,
      nextSlot: null,
    }
  ];
};

export const CrashIceGame = {
  name: 'crashice',

  setup: ({ ctx, random }) => {
    return {
      gameState: 'lobby', // 'lobby' | 'playing' | 'intermission'
      gameFormat: 'standard', // 'standard' (通常対戦) | 'tournament' (1対1トーナメント)
      tournament: {
        seeds: [], // プレイヤーID順
        matches: [],
        activeMatchId: null,
        activeMatch: null,
        champion: null,
        lastMatchResult: null,
      },
      board: createInitialBoard(random),
      penguinPos: { q: 0, r: 0 },
      penguinFallen: false,
      rouletteResult: null,
      rouletteResultIndex: null,
      remainingStrikes: 0,
      mode: 'physics', // Bモード（物理演算モード）のみ
      turnStep: 'spin', // 'spin' -> 'aim' -> 'strike'
      lastDroppedKeys: [],
      lastStrikeEvent: null,
      logs: ['クラッシュアイスゲームが始まりました！ルーレットを回してください。'],
      winner: null,
      loser: null,
      winnerDetails: '',
    };
  },

  turn: {
    order: {
      first: () => 0,
      next: ({ G, ctx }) => {
        // トーナメントモード中は対戦中の2人（p1とp2）のみでターンを交互に回す
        if (G.gameFormat === 'tournament' && G.tournament?.activeMatch) {
          const { p1, p2 } = G.tournament.activeMatch;
          const targetPlayerId = ctx.currentPlayer === p1 ? p2 : p1;
          const targetPos = ctx.playOrder.indexOf(targetPlayerId);
          return targetPos >= 0 ? targetPos : 0;
        }
        return (ctx.playOrderPos + 1) % ctx.numPlayers;
      },
    },
    onBegin: ({ G, events }) => {
      if (G.gameState === 'lobby') {
        events.setActivePlayers({ all: 'lobby' });
      } else if (G.gameState === 'intermission') {
        events.setActivePlayers({ all: 'intermission' });
      } else if (G.winner) {
        events.setActivePlayers({ all: 'gameover' });
      }
    },
    stages: {
      lobby: {
        moves: {
          startGame: ({ G, ctx, random, events }) => {
            G.gameState = 'playing';
            if (G.gameFormat === 'tournament') {
              if (!G.tournament.seeds || G.tournament.seeds.length !== ctx.numPlayers) {
                G.tournament.seeds = ctx.playOrder.slice();
              }
              G.tournament.matches = buildTournament(G.tournament.seeds);
              const firstMatch = G.tournament.matches.find(m => m.p1 !== null && m.p2 !== null);
              G.tournament.activeMatchId = firstMatch.id;
              G.tournament.activeMatch = firstMatch;
              G.tournament.champion = null;
              G.tournament.lastMatchResult = null;
              G.board = createInitialBoard(random);
              G.penguinPos = { q: 0, r: 0 };
              G.penguinFallen = false;
              G.turnStep = 'spin';
              G.logs.push('🏆 【1対1トーナメント】が開幕しました！');
              G.logs.push(`⚔️ 【${firstMatch.name}】: Player ${firstMatch.p1} vs Player ${firstMatch.p2}`);
              events.endTurn({ next: firstMatch.p1.toString() });
            } else {
              G.logs.push('ゲームを開始しました！最初のプレイヤーはルーレットを回してください。');
              events.endTurn({ next: '0' });
            }
          },
          setGameFormat: ({ G, ctx }, format) => {
            if (G.gameState !== 'lobby') return;
            G.gameFormat = format;
            if (format === 'tournament') {
              if (!G.tournament.seeds || G.tournament.seeds.length !== ctx.numPlayers) {
                G.tournament.seeds = ctx.playOrder.slice();
              }
              G.tournament.matches = buildTournament(G.tournament.seeds);
            }
          },
          shuffleTournamentSeeds: ({ G, ctx, random }) => {
            if (G.gameState !== 'lobby') return;
            const seeds = (G.tournament.seeds && G.tournament.seeds.length === ctx.numPlayers) 
              ? [...G.tournament.seeds] 
              : ctx.playOrder.slice();
            for (let i = seeds.length - 1; i > 0; i--) {
              const j = random.Die(i + 1) - 1;
              [seeds[i], seeds[j]] = [seeds[j], seeds[i]];
            }
            G.tournament.seeds = seeds;
            G.tournament.matches = buildTournament(seeds);
            G.logs.push('🎲 トーナメントの組み合わせ（シード順）をシャッフルしました。');
          },
          switchMode: () => {},
        }
      },
      intermission: {
        moves: {
          startNextTournamentMatch: ({ G, random, events }) => {
            if (G.gameState !== 'intermission' || G.gameFormat !== 'tournament') return;
            const nextMatch = G.tournament.matches.find(m => m.winner === null && m.p1 !== null && m.p2 !== null);
            if (!nextMatch) return;

            G.tournament.activeMatchId = nextMatch.id;
            G.tournament.activeMatch = nextMatch;
            G.board = createInitialBoard(random);
            G.penguinPos = { q: 0, r: 0 };
            G.penguinFallen = false;
            G.rouletteResult = null;
            G.rouletteResultIndex = null;
            G.remainingStrikes = 0;
            G.turnStep = 'spin';
            G.lastDroppedKeys = [];
            G.lastStrikeEvent = null;
            G.gameState = 'playing';

            G.logs.push(`⚔️ 【${nextMatch.name}】が始まります！ Player ${nextMatch.p1} vs Player ${nextMatch.p2}`);
            events.endTurn({ next: nextMatch.p1.toString() });
          },
          rematchGame: ({ G, random, events }) => {
            G.gameState = 'lobby';
            G.board = createInitialBoard(random);
            G.penguinPos = { q: 0, r: 0 };
            G.penguinFallen = false;
            G.rouletteResult = null;
            G.rouletteResultIndex = null;
            G.remainingStrikes = 0;
            G.turnStep = 'spin';
            G.lastDroppedKeys = [];
            G.lastStrikeEvent = null;
            G.winner = null;
            G.loser = null;
            G.winnerDetails = '';
            G.tournament.matches = [];
            G.tournament.activeMatchId = null;
            G.tournament.activeMatch = null;
            G.tournament.champion = null;
            G.tournament.lastMatchResult = null;
            G.logs = ['待機ルームに戻りました。全員が揃ったら開始してください。'];
            events.endTurn({ next: '0' });
            events.setActivePlayers({ all: 'lobby' });
          }
        }
      },
      gameover: {
        moves: {
          rematchGame: ({ G, random, events }) => {
            G.gameState = 'lobby';
            G.board = createInitialBoard(random);
            G.penguinPos = { q: 0, r: 0 };
            G.penguinFallen = false;
            G.rouletteResult = null;
            G.rouletteResultIndex = null;
            G.remainingStrikes = 0;
            G.turnStep = 'spin';
            G.lastDroppedKeys = [];
            G.lastStrikeEvent = null;
            G.winner = null;
            G.loser = null;
            G.winnerDetails = '';
            G.tournament.matches = [];
            G.tournament.activeMatchId = null;
            G.tournament.activeMatch = null;
            G.tournament.champion = null;
            G.tournament.lastMatchResult = null;
            G.logs = ['待機ルームに戻りました。全員が揃ったら開始してください。'];
            events.endTurn({ next: '0' });
            events.setActivePlayers({ all: 'lobby' });
          }
        }
      }
    }
  },

  moves: {
    // 待機ルームからのゲーム開始
    startGame: ({ G, ctx, random, events }) => {
      G.gameState = 'playing';
      if (G.gameFormat === 'tournament') {
        if (!G.tournament.seeds || G.tournament.seeds.length !== ctx.numPlayers) {
          G.tournament.seeds = ctx.playOrder.slice();
        }
        G.tournament.matches = buildTournament(G.tournament.seeds);
        const firstMatch = G.tournament.matches.find(m => m.p1 !== null && m.p2 !== null);
        G.tournament.activeMatchId = firstMatch.id;
        G.tournament.activeMatch = firstMatch;
        G.tournament.champion = null;
        G.tournament.lastMatchResult = null;
        G.board = createInitialBoard(random);
        G.penguinPos = { q: 0, r: 0 };
        G.penguinFallen = false;
        G.turnStep = 'spin';
        G.logs.push('🏆 【1対1トーナメント】が開幕しました！');
        G.logs.push(`⚔️ 【${firstMatch.name}】: Player ${firstMatch.p1} vs Player ${firstMatch.p2}`);
        events.endTurn({ next: firstMatch.p1.toString() });
      } else {
        G.logs.push('ゲームを開始しました！最初のプレイヤーはルーレットを回してください。');
        events.endTurn({ next: '0' });
      }
    },

    // ゲームフォーマット切替 (通常対戦 / 1対1トーナメント)
    setGameFormat: ({ G, ctx }, format) => {
      if (G.gameState !== 'lobby') return;
      G.gameFormat = format;
      if (format === 'tournament') {
        if (!G.tournament.seeds || G.tournament.seeds.length !== ctx.numPlayers) {
          G.tournament.seeds = ctx.playOrder.slice();
        }
        G.tournament.matches = buildTournament(G.tournament.seeds);
      }
    },

    // トーナメントのシード順シャッフル
    shuffleTournamentSeeds: ({ G, ctx, random }) => {
      if (G.gameState !== 'lobby') return;
      const seeds = (G.tournament.seeds && G.tournament.seeds.length === ctx.numPlayers) 
        ? [...G.tournament.seeds] 
        : ctx.playOrder.slice();
      for (let i = seeds.length - 1; i > 0; i--) {
        const j = random.Die(i + 1) - 1;
        [seeds[i], seeds[j]] = [seeds[j], seeds[i]];
      }
      G.tournament.seeds = seeds;
      G.tournament.matches = buildTournament(seeds);
      G.logs.push('🎲 トーナメントの組み合わせ（シード順）をシャッフルしました。');
    },

    // 次のトーナメント試合へ進む
    startNextTournamentMatch: ({ G, random, events }) => {
      if (G.gameState !== 'intermission' || G.gameFormat !== 'tournament') return;
      const nextMatch = G.tournament.matches.find(m => m.winner === null && m.p1 !== null && m.p2 !== null);
      if (!nextMatch) return;

      G.tournament.activeMatchId = nextMatch.id;
      G.tournament.activeMatch = nextMatch;
      G.board = createInitialBoard(random);
      G.penguinPos = { q: 0, r: 0 };
      G.penguinFallen = false;
      G.rouletteResult = null;
      G.rouletteResultIndex = null;
      G.remainingStrikes = 0;
      G.turnStep = 'spin';
      G.lastDroppedKeys = [];
      G.lastStrikeEvent = null;
      G.gameState = 'playing';

      G.logs.push(`⚔️ 【${nextMatch.name}】が始まります！ Player ${nextMatch.p1} vs Player ${nextMatch.p2}`);
      events.endTurn({ next: nextMatch.p1.toString() });
    },

    // 1. ルーレットを回す
    spinRoulette: ({ G, ctx, random, events }, targetIndex) => {
      if (G.gameState !== 'playing' || G.turnStep !== 'spin' || G.winner) return INVALID_MOVE;

      // トーナメント中の観戦者制限
      if (G.gameFormat === 'tournament' && G.tournament?.activeMatch) {
        const { p1, p2 } = G.tournament.activeMatch;
        if (ctx.currentPlayer !== p1 && ctx.currentPlayer !== p2) return INVALID_MOVE;
      }

      let idx;
      if (typeof targetIndex === 'number' && targetIndex >= 0 && targetIndex < ROULETTE_ITEMS.length) {
        idx = targetIndex;
      } else {
        idx = random.Die(ROULETTE_ITEMS.length) - 1;
      }

      const result = ROULETTE_ITEMS[idx];
      G.rouletteResult = result;
      G.rouletteResultIndex = idx;

      const pName = `Player ${ctx.currentPlayer}`;
      G.logs.push(`【${pName}】ルーレット結果：[${result.label}]`);

      if (result.id === 'skip') {
        G.turnStep = 'spin';
        G.remainingStrikes = 0;
        events.endTurn();
      } else {
        G.remainingStrikes = result.count;
        G.turnStep = 'strike';
      }
    },

    // 2. モード切り替え (Bモード固定のため互換用noop)
    switchMode: () => {},

    // 3. 氷を叩く (ドラッグで決定したパワー値 0〜100 と角度 angle)
    strikeBlock: ({ G, ctx, random, events }, blockKey, power = 50, angle = 0) => {
      if (G.gameState !== 'playing' || G.winner || G.turnStep !== 'strike') return INVALID_MOVE;
      if (!G.board[blockKey]) return INVALID_MOVE;

      // トーナメント中の観戦者制限
      if (G.gameFormat === 'tournament' && G.tournament?.activeMatch) {
        const { p1, p2 } = G.tournament.activeMatch;
        if (ctx.currentPlayer !== p1 && ctx.currentPlayer !== p2) return INVALID_MOVE;
      }

      const targetBlock = G.board[blockKey];

      // ルーレットの指定色チェック
      if (G.rouletteResult) {
        if (G.rouletteResult.targetColor !== 'any' && targetBlock.color !== G.rouletteResult.targetColor) {
          return INVALID_MOVE;
        }
      }

      const pName = `Player ${ctx.currentPlayer}`;
      G.lastDroppedKeys = [];

      // 力が弱すぎた場合 (power < 15): 氷が抜けず、同じブロックを再度叩く
      if (power < 15) {
        G.lastStrikeEvent = { key: blockKey, power, angle, isWeak: true, id: Date.now() };
        G.logs.push(`【${pName}】打撃力が弱く、氷を打ち抜けませんでした！（同じブロックをもう一度叩いてください）`);
        return;
      }

      // 充分な打撃力がある場合 (power >= 15):
      G.lastStrikeEvent = { key: blockKey, power, angle, isWeak: false, id: Date.now() };
      const dropped = [];

      // 狙ったブロックを落とす
      delete G.board[blockKey];
      dropped.push(blockKey);

      const [tq, tr] = blockKey.split(',').map(Number);

      // ==========================================
      // Bモード: 衝撃波物理演算 (Dynamic Shockwave Physics)
      // ==========================================
      // 叩いた衝撃波を周囲の氷に伝播（カラーバーのパワー値に応じて直接波及）
      const impact = Math.min(1.0, Math.max(0.05, power / 100));
      const queue = [{ q: tq, r: tr, force: impact }];
      const visited = new Set([blockKey]);

      while (queue.length > 0) {
        const curr = queue.shift();
        for (const dir of HEX_DIRECTIONS) {
          const nq = curr.q + dir.q;
          const nr = curr.r + dir.r;
          const nKey = `${nq},${nr}`;

          if (G.board[nKey] && !visited.has(nKey)) {
            visited.add(nKey);
            // 衝撃による耐久度減少 (距離・力に応じて減衰)
            const dmg = Math.round(curr.force * 65);
            G.board[nKey].stability -= dmg;

            // 高衝撃波によって外枠でない氷が摩擦限界を超えて崩落
            if (G.board[nKey].stability <= 0 || (curr.force > 0.65 && !G.board[nKey].isEdge && random.Die(100) < curr.force * 60)) {
              dropped.push(nKey);
              delete G.board[nKey];
            } else if (curr.force * 0.5 > 0.2) {
              queue.push({ q: nq, r: nr, force: curr.force * 0.5 });
            }
          }
        }
      }

      // 衝撃波を受けた後の盤面で構造力学・アーチ安定性シミュレーションを実行
      const collapses = simulateStructuralCollapses(G.board);
      for (const k of collapses) {
        if (G.board[k]) {
          delete G.board[k];
          dropped.push(k);
        }
      }

      G.lastDroppedKeys = dropped;
      if (dropped.length > 1) {
        G.logs.push(`⚠️ 支持力不足！連鎖崩落により氷が崩れ落ちました（計 ${dropped.length} 個）！`);
      } else {
        G.logs.push(`【${pName}】氷を打ち抜きました。`);
      }

      // ペンギンの足元チェック
      const pKey = `${G.penguinPos.q},${G.penguinPos.r}`;
      if (!G.board[pKey]) {
        // ペンギンの足場の氷が消失！ペンギン落下！
        G.penguinFallen = true;
        const loser = ctx.currentPlayer;

        // トーナメントモードでの決着処理
        if (G.gameFormat === 'tournament' && G.tournament?.activeMatch) {
          const activeMatch = G.tournament.activeMatch;
          const winner = (loser === activeMatch.p1) ? activeMatch.p2 : activeMatch.p1;
          activeMatch.winner = winner;
          activeMatch.loser = loser;

          const m = G.tournament.matches.find(item => item.id === activeMatch.id);
          if (m) {
            m.winner = winner;
            m.loser = loser;
          }

          if (activeMatch.nextMatchId === null) {
            // 決勝戦終了！トーナメント制覇！
            G.tournament.champion = winner;
            G.winner = winner;
            G.loser = loser;
            G.winnerDetails = `🏆 トーナメント制覇！ 【Player ${winner}】が全勝し、王者に輝きました！`;
            G.logs.push(`🐧 ペンギン落下！ 【${activeMatch.name}】 勝者: Player ${winner} / 敗者: Player ${loser}`);
            G.logs.push(`🎉 祝・優勝！！ 【Player ${winner}】がクラッシュアイス・トーナメントを制覇しました！`);
            events.setActivePlayers({ all: 'gameover' });
            return;
          } else {
            // 次のラウンドへ勝者進出
            const nextMatch = G.tournament.matches.find(item => item.id === activeMatch.nextMatchId);
            if (nextMatch) {
              nextMatch[activeMatch.nextSlot] = winner;
            }
            G.tournament.lastMatchResult = {
              matchId: activeMatch.id,
              matchName: activeMatch.name,
              winner,
              loser,
            };
            G.tournament.activeMatch = null;
            G.gameState = 'intermission';
            G.logs.push(`🐧 ペンギン落下！ 【${activeMatch.name}】 勝者: Player ${winner} （勝ち抜け！）/ 敗者: Player ${loser}`);
            events.setActivePlayers({ all: 'intermission' });
            return;
          }
        } else {
          // 通常対戦モード
          G.loser = loser;
          G.winner = 'survivors';
          G.winnerDetails = `【Player ${ctx.currentPlayer}】がペンギンを落としてしまいました！`;
          G.logs.push(`🐧 ペンギンが下に落ちた！！ ${G.winnerDetails}`);
          events.setActivePlayers({ all: 'gameover' });
          return;
        }
      }

      // 残り打撃数の処理
      G.remainingStrikes -= 1;
      if (G.remainingStrikes <= 0) {
        G.turnStep = 'spin';
        G.rouletteResult = null;
        events.endTurn();
      }
    },

    // 再戦リセット
    rematchGame: ({ G, random, events }) => {
      G.gameState = 'lobby';
      G.board = createInitialBoard(random);
      G.penguinPos = { q: 0, r: 0 };
      G.penguinFallen = false;
      G.rouletteResult = null;
      G.rouletteResultIndex = null;
      G.remainingStrikes = 0;
      G.turnStep = 'spin';
      G.lastDroppedKeys = [];
      G.lastStrikeEvent = null;
      G.winner = null;
      G.loser = null;
      G.winnerDetails = '';
      G.tournament.matches = [];
      G.tournament.activeMatchId = null;
      G.tournament.activeMatch = null;
      G.tournament.champion = null;
      G.tournament.lastMatchResult = null;
      G.logs = ['待機ルームに戻りました。全員が揃ったら開始してください。'];
      if (events) {
        events.endTurn({ next: '0' });
        events.setActivePlayers({ all: 'lobby' });
      }
    }
  }
};
