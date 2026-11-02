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

// 六角形盤面の初期化
export const createInitialBoard = (random) => {
  const blocks = {};
  const colors = ['blue', 'white'];
  
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

      // 白と青をほぼ半々でランダム配置
      const color = colors[random.Die(2) - 1];
      
      blocks[key] = {
        q,
        r,
        color,
        isEdge,
        stability: 100, // 耐久度 (方式B用)
        cracked: false, // ヒビ状態
      };
    }
  }
  return blocks;
};

// 方式A: 枠（フレーム）からの連結判定 (BFS)
export const getConnectedBlocks = (blocks) => {
  const connected = new Set();
  const queue = [];

  // 外枠に接していて、現在存在しているブロックを探索開始点とする
  Object.keys(blocks).forEach(key => {
    const b = blocks[key];
    if (b && b.isEdge) {
      connected.add(key);
      queue.push(key);
    }
  });

  // BFSで枠と繋がっている氷を全て探索
  while (queue.length > 0) {
    const currentKey = queue.shift();
    const [q, r] = currentKey.split(',').map(Number);

    for (const dir of HEX_DIRECTIONS) {
      const nq = q + dir.q;
      const nr = r + dir.r;
      const neighborKey = `${nq},${nr}`;

      if (blocks[neighborKey] && !connected.has(neighborKey)) {
        connected.add(neighborKey);
        queue.push(neighborKey);
      }
    }
  }

  return connected;
};

export const ROULETTE_ITEMS = [
  { id: 'blue', label: '青の氷を1個落とす', color: '#1976d2', targetColor: 'blue', count: 1 },
  { id: 'white', label: '白の氷を1個落とす', color: '#78909c', targetColor: 'white', count: 1 },
  { id: 'any', label: '好きな氷を1個落とす', color: '#4caf50', targetColor: 'any', count: 1 },
  { id: 'two', label: '好きな氷を2個落とす', color: '#ff9800', targetColor: 'any', count: 2 },
  { id: 'skip', label: 'パス（次の人へ）', color: '#f44336', targetColor: 'none', count: 0 },
];

export const CrashIceGame = {
  name: 'crashice',

  setup: ({ ctx, random }) => {
    return {
      board: createInitialBoard(random),
      penguinPos: { q: 0, r: 0 },
      penguinFallen: false,
      rouletteResult: null,
      remainingStrikes: 0,
      mode: 'structural', // 'structural' (方式A) or 'physics' (方式B)
      turnStep: 'spin', // 'spin' -> 'aim' -> 'strike'
      lastDroppedKeys: [],
      logs: ['クラッシュアイスゲームが始まりました！ルーレットを回してください。'],
      winner: null,
      loser: null,
      winnerDetails: '',
    };
  },

  turn: {
    order: {
      first: () => 0,
      next: ({ ctx }) => (ctx.playOrderPos + 1) % ctx.numPlayers,
    },
  },

  moves: {
    // 1. ルーレットを回す
    spinRoulette: ({ G, ctx, random, events }) => {
      if (G.turnStep !== 'spin' || G.winner) return INVALID_MOVE;

      const idx = random.Die(ROULETTE_ITEMS.length) - 1;
      const result = ROULETTE_ITEMS[idx];
      G.rouletteResult = result;

      const pName = `Player ${ctx.currentPlayer}`;
      G.logs.push(`【${pName}】ルーレット結果：[${result.label}]`);

      if (result.id === 'skip') {
        G.turnStep = 'spin';
        G.rouletteResult = null;
        G.remainingStrikes = 0;
        events.endTurn();
      } else {
        G.remainingStrikes = result.count;
        G.turnStep = 'strike';
      }
    },

    // 2. モード切り替え (方式A ⇄ 方式B)
    switchMode: ({ G }, newMode) => {
      if (newMode === 'structural' || newMode === 'physics') {
        G.mode = newMode;
        G.logs.push(`ゲームモードを【${newMode === 'structural' ? '方式A：構造連結モード' : '方式B：物理演算モード'}】に変更しました。`);
      }
    },

    // 3. 氷を叩く (パワー値 0〜100)
    strikeBlock: ({ G, ctx, random, events }, blockKey, power) => {
      if (G.winner || G.turnStep !== 'strike') return INVALID_MOVE;
      if (!G.board[blockKey]) return INVALID_MOVE;

      const targetBlock = G.board[blockKey];

      // ルーレットの指定色チェック
      if (G.rouletteResult) {
        if (G.rouletteResult.targetColor !== 'any' && targetBlock.color !== G.rouletteResult.targetColor) {
          return INVALID_MOVE;
        }
      }

      const pName = `Player ${ctx.currentPlayer}`;
      G.lastDroppedKeys = [];
      const dropped = [];

      // パワー判定 (0〜100)
      // 0〜24: 弱すぎ (不発/ミス)
      if (power < 25) {
        G.logs.push(`【${pName}】力が弱すぎた！（パワー: ${power}%）氷はビクともしない！`);
        // 叩き直すチャンス (ターン終了せず続行)
        return;
      }

      // 狙ったブロックを落とす
      delete G.board[blockKey];
      dropped.push(blockKey);

      const [tq, tr] = blockKey.split(',').map(Number);

      if (G.mode === 'structural') {
        // ==========================================
        // 方式A: 構造連結モード
        // ==========================================
        // 超強打 (85以上) の場合、周囲のブロックも確率で1つ巻き込む
        if (power >= 85) {
          const neighbors = HEX_DIRECTIONS.map(d => `${tq + d.q},${tr + d.r}`).filter(k => G.board[k]);
          if (neighbors.length > 0) {
            const extraDrop = neighbors[random.Die(neighbors.length) - 1];
            delete G.board[extraDrop];
            dropped.push(extraDrop);
            G.logs.push(`💥 超強打！（パワー: ${power}%）衝撃で隣の氷も吹き飛んだ！`);
          }
        }

        // 枠と繋がっている氷を全探索
        const connected = getConnectedBlocks(G.board);

        // 枠と繋がっていない氷（浮島）を全て崩落させる
        Object.keys(G.board).forEach(k => {
          if (!connected.has(k)) {
            dropped.push(k);
            delete G.board[k];
          }
        });

      } else {
        // ==========================================
        // 方式B: 物理シミュレーションモード
        // ==========================================
        // 叩いた衝撃を周囲に伝播
        const impact = power / 100; // 0.25 〜 1.0
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
              // 衝撃による耐久度減少 (距離に応じて減衰)
              const dmg = Math.round(curr.force * 60);
              G.board[nKey].stability -= dmg;
              if (G.board[nKey].stability < 70) {
                G.board[nKey].cracked = true;
              }

              // 耐久度ゼロ、または高衝撃で外枠でない場合は崩落
              if (G.board[nKey].stability <= 0 || (curr.force > 0.7 && !G.board[nKey].isEdge && random.Die(100) < 40)) {
                dropped.push(nKey);
                delete G.board[nKey];
              } else if (curr.force * 0.5 > 0.2) {
                queue.push({ q: nq, r: nr, force: curr.force * 0.5 });
              }
            }
          }
        }

        // 物理モードでも完全に孤立した氷は重力で落下
        const connected = getConnectedBlocks(G.board);
        Object.keys(G.board).forEach(k => {
          if (!connected.has(k)) {
            dropped.push(k);
            delete G.board[k];
          }
        });
      }

      G.lastDroppedKeys = dropped;
      G.logs.push(`【${pName}】（パワー: ${power}%）で叩き、氷が ${dropped.length} 個落下！`);

      // ペンギンの足元チェック
      const pKey = `${G.penguinPos.q},${G.penguinPos.r}`;
      if (!G.board[pKey]) {
        // ペンギンの足場の氷が消失！ペンギン落下！
        G.penguinFallen = true;
        G.loser = ctx.currentPlayer;
        G.winner = 'survivors';
        G.winnerDetails = `【Player ${ctx.currentPlayer}】がペンギンを落としてしまいました！`;
        G.logs.push(`🐧 ペンギンが下に落ちた！！ ${G.winnerDetails}`);
        return;
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
    rematchGame: ({ G, ctx, random }) => {
      G.board = createInitialBoard(random);
      G.penguinPos = { q: 0, r: 0 };
      G.penguinFallen = false;
      G.rouletteResult = null;
      G.remainingStrikes = 0;
      G.turnStep = 'spin';
      G.lastDroppedKeys = [];
      G.winner = null;
      G.loser = null;
      G.winnerDetails = '';
      G.logs = ['再戦がスタートしました！ルーレットを回してください。'];
    }
  }
};
