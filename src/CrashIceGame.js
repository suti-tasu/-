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
      // (対面2点、一つ空き3点、片側3点、単独点などすべて < 4 なので崩落する)
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

// 弱すぎ（ミス）回数に応じた強打ゾーンの拡大しきい値
export const getPowerThresholds = (missCount = 0) => {
  if (missCount === 0) {
    return { missMax: 24, safeMax: 60, strongMax: 84 };
  } else if (missCount === 1) {
    return { missMax: 15, safeMax: 45, strongMax: 75 };
  } else {
    return { missMax: 10, safeMax: 35, strongMax: 65 };
  }
};

export const CrashIceGame = {
  name: 'crashice',

  setup: ({ ctx, random }) => {
    return {
      gameState: 'lobby',
      board: createInitialBoard(random),
      penguinPos: { q: 0, r: 0 },
      penguinFallen: false,
      rouletteResult: null,
      rouletteResultIndex: null,
      remainingStrikes: 0,
      missCount: 0, // 弱すぎによるペナルティ回数
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
    // 待機ルームからのゲーム開始
    startGame: ({ G }) => {
      G.gameState = 'playing';
      G.logs.push('ゲームを開始しました！最初のプレイヤーはルーレットを回してください。');
    },

    // 1. ルーレットを回す
    spinRoulette: ({ G, ctx, random, events }, targetIndex) => {
      if (G.gameState !== 'playing' || G.turnStep !== 'spin' || G.winner) return INVALID_MOVE;

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
        G.missCount = 0;
        events.endTurn();
      } else {
        G.remainingStrikes = result.count;
        G.missCount = 0;
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
      if (G.gameState !== 'playing' || G.winner || G.turnStep !== 'strike') return INVALID_MOVE;
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

      const currentMiss = G.missCount || 0;
      const thresholds = getPowerThresholds(currentMiss);

      // パワー判定 (0〜100)
      if (power <= thresholds.missMax) {
        G.missCount = currentMiss + 1;
        G.logs.push(`【${pName}】力が弱すぎた！（パワー: ${power}%）焦りで強打の危険性が増大！（ミス${G.missCount}回目）`);
        // 叩き直すチャンス (ターン終了せず続行)
        return;
      }

      // 氷を落とせたのでミス回数リセット
      G.missCount = 0;

      // 狙ったブロックを落とす
      delete G.board[blockKey];
      dropped.push(blockKey);

      const [tq, tr] = blockKey.split(',').map(Number);

      if (G.mode === 'structural') {
        // ==========================================
        // 方式A: 構造力学モード (Arch Equilibrium)
        // ==========================================
        // 超強打の場合、衝撃で隣接ブロックも確率で1つ巻き込む
        if (power > thresholds.strongMax) {
          const neighbors = HEX_DIRECTIONS.map(d => `${tq + d.q},${tr + d.r}`).filter(k => G.board[k]);
          if (neighbors.length > 0) {
            const extraDrop = neighbors[random.Die(neighbors.length) - 1];
            delete G.board[extraDrop];
            dropped.push(extraDrop);
            G.logs.push(`💥 超強打！（パワー: ${power}%）強烈な打撃で隣の氷も吹き飛んだ！`);
          }
        }

        // 構造力学・アーチ安定性シミュレーション実行
        // （支持3点以下、対面2点、一つ空き3点などが連鎖的にドサッと崩落）
        const collapses = simulateStructuralCollapses(G.board);
        for (const k of collapses) {
          if (G.board[k]) {
            delete G.board[k];
            dropped.push(k);
          }
        }

      } else {
        // ==========================================
        // 方式B: 衝撃波物理演算モード (Dynamic Shockwave)
        // ==========================================
        // 叩いた衝撃波を周囲の氷に伝播（パワーに応じて波及）
        const impact = Math.min(1.0, (power + currentMiss * 12) / 100);
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

              // 高衝撃波によって外枠でない氷が摩擦限界を超えて崩落
              if (G.board[nKey].stability <= 0 || (curr.force > 0.65 && !G.board[nKey].isEdge && random.Die(100) < 50)) {
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
      }

      G.lastDroppedKeys = dropped;
      if (dropped.length > 1) {
        G.logs.push(`⚠️ アーチ支持崩壊！連鎖崩落により氷が合計 ${dropped.length} 個落下しました！`);
      } else {
        G.logs.push(`【${pName}】（パワー: ${power}%）で叩き、氷を1個落としました。`);
      }

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
      G.gameState = 'lobby';
      G.board = createInitialBoard(random);
      G.penguinPos = { q: 0, r: 0 };
      G.penguinFallen = false;
      G.rouletteResult = null;
      G.rouletteResultIndex = null;
      G.remainingStrikes = 0;
      G.missCount = 0;
      G.turnStep = 'spin';
      G.lastDroppedKeys = [];
      G.winner = null;
      G.loser = null;
      G.winnerDetails = '';
      G.logs = ['待機ルームに戻りました。全員が揃ったら開始してください。'];
    }
  }
};
