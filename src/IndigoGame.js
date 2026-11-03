// IndigoGame.js - Indigo (インディゴ) boardgame.io Game Definition
// Designer: Reiner Knizia | 2-4 Players | Hexagonal Route & Gemstone Game

// 軸座標 (q, r) の6方向ベクトル (0: 東, 1: 南東, 2: 南西, 3: 西, 4: 北西, 5: 北東)
export const HEX_DIRECTIONS = [
  { q: 1, r: 0 },   // 0: +q
  { q: 0, r: 1 },   // 1: +r
  { q: -1, r: 1 },  // 2: -q, +r
  { q: -1, r: 0 },  // 3: -q
  { q: 0, r: -1 },  // 4: -r
  { q: 1, r: -1 },  // 5: +q, -r
];

// 向かい合う辺のインデックス ((side + 3) % 6)
export const getOppositeSide = (side) => (side + 3) % 6;

// 中心 (0, 0) からの軸距離
export const getHexDistance = (q, r) => (Math.abs(q) + Math.abs(r) + Math.abs(q + r)) / 2;

// 6隅の宝島（外周アイランド）の座標
export const CORNER_ISLANDS = [
  { q: 4, r: 0, inwardSide: 3 },   // 0
  { q: 0, r: 4, inwardSide: 4 },   // 1
  { q: -4, r: 4, inwardSide: 5 },  // 2
  { q: -4, r: 0, inwardSide: 0 },  // 3
  { q: 0, r: -4, inwardSide: 1 },  // 4
  { q: 4, r: -4, inwardSide: 2 },  // 5
];

// 54枚のルートタイル定義 (6辺: 0〜5 を2つずつペアで結ぶ3本の水路)
const BASE_TILE_TEMPLATES = [
  // Type A: 3つの隣接カーブ (急カーブ3本)
  { type: 'A', paths: [[0, 1], [2, 3], [4, 5]] },
  // Type B: 直線1本 + 隣接カーブ2本
  { type: 'B', paths: [[0, 3], [1, 2], [4, 5]] },
  // Type C: 中カーブ + 直線 + 急カーブ
  { type: 'C', paths: [[0, 2], [1, 4], [3, 5]] },
  // Type D: なだらかなカーブ
  { type: 'D', paths: [[0, 4], [1, 3], [2, 5]] },
];

export const generateDeck = () => {
  const deck = [];
  let id = 1;
  // 各テンプレートをバランスよく合計54枚生成
  const counts = [14, 14, 13, 13];
  BASE_TILE_TEMPLATES.forEach((tpl, idx) => {
    const count = counts[idx];
    for (let i = 0; i < count; i++) {
      deck.push({
        id: `tile-${id++}`,
        type: tpl.type,
        paths: tpl.paths.map(([a, b]) => [a, b]),
      });
    }
  });
  return deck;
};

// タイルを指定角度（0〜5ステップ: 各60度）回転させたパスを返す
export const getRotatedPaths = (paths, rotation = 0) => {
  const r = (rotation % 6 + 6) % 6;
  return paths.map(([a, b]) => [
    (a + r) % 6,
    (b + r) % 6
  ]);
};

// プレイヤー人数に応じたゲート所有権テーブル (6つのゲート: 0〜5)
export const getGatewayOwners = (numPlayers) => {
  if (numPlayers === 2) {
    // 2人: 交互に3ゲートずつ単独所有
    return [
      ['0'], ['1'], ['0'], ['1'], ['0'], ['1']
    ];
  }
  if (numPlayers === 3) {
    // 3人: 1つは単独、2つは隣人と共有
    return [
      ['0'],
      ['0', '1'],
      ['1'],
      ['1', '2'],
      ['2'],
      ['2', '0']
    ];
  }
  // 4人: 全ゲートを2人ずつ共有
  return [
    ['0', '1'],
    ['1', '2'],
    ['2', '3'],
    ['3', '0'],
    ['0', '2'],
    ['1', '3']
  ];
};

// 外周からどのゲートに出たかを判定 (0〜5)
export const getExitGatewayIndex = (q, r, exitSide) => {
  // コーナー0 (4, 0) と コーナー1 (0, 4) の間
  if (q > 0 && r > 0 && (q + r === 4)) return 0;
  // コーナー1 (0, 4) と コーナー2 (-4, 4) の間
  if (r === 4 && q < 0) return 1;
  // コーナー2 (-4, 4) と コーナー3 (-4, 0) の間
  if (q === -4 && r > 0) return 2;
  // コーナー3 (-4, 0) と コーナー4 (0, -4) の間
  if (q < 0 && r < 0 && (q + r === -4)) return 3;
  // コーナー4 (0, -4) と コーナー5 (4, -4) の間
  if (r === -4 && q > 0) return 4;
  // コーナー5 (4, -4) と コーナー0 (4, 0) の間
  if (q === 4 && r < 0) return 5;

  // 近接判定のフォールバック
  const angle = Math.atan2(r * 1.5, Math.sqrt(3) * (q + r / 2));
  let deg = (angle * 180 / Math.PI + 360) % 360;
  return Math.floor(deg / 60) % 6;
};

// 宝石の連続走行シミュレーション
// 盤面にタイルが置かれた結果、連結された宝石をゴールまたは行き止まりまで走らせる
const simulateGemMovements = (G, ctx) => {
  let anyMoved = false;

  // 1. 各宝石の移動チェック
  // 盤面上の各宝石について、現在位置から水路を辿る
  G.gems.forEach(gem => {
    if (gem.status !== 'board') return;

    let currQ = gem.q;
    let currR = gem.r;
    let currSide = gem.edgeSide; // 現在タイル内で向かっている出口辺 (0〜5)

    // ループ防止カウンター
    let steps = 0;
    while (steps < 40) {
      steps++;
      // 隣接ヘックスの座標
      const dir = HEX_DIRECTIONS[currSide];
      const nextQ = currQ + dir.q;
      const nextR = currR + dir.r;
      const entrySide = getOppositeSide(currSide);

      // 外周に出た場合 (ゲート到達)
      if (getHexDistance(nextQ, nextR) > 4) {
        const gateIdx = getExitGatewayIndex(currQ, currR, currSide);
        const owners = G.gatewayOwners[gateIdx] || [];

        // ゲート所有者に得点加算
        owners.forEach(pid => {
          if (G.players[pid]) {
            G.players[pid].score += gem.points;
            G.players[pid].collectedGems.push({ ...gem });
          }
        });

        gem.status = 'exited';
        gem.exitedGate = gateIdx;
        G.logs.unshift(`🎉 【宝石ゴール！】${gem.name}（${gem.points}点）が ゲート ${gateIdx + 1} を通過！ 所有者 [${owners.map(o => `Player ${o}`).join(', ')}] に得点加算！`);
        anyMoved = true;
        break;
      }

      // 次のヘックスにタイルがあるか確認
      const nextTile = G.board[`${nextQ},${nextR}`];
      if (!nextTile) {
        // 次が空きマス：このタイルの出口辺で一時停止
        gem.q = currQ;
        gem.r = currR;
        gem.edgeSide = currSide;
        break;
      }

      // 次のタイル内の水路を探す
      const connectedPath = nextTile.paths.find(([a, b]) => a === entrySide || b === entrySide);
      if (!connectedPath) {
        // 水路が繋がっていない（行き止まり）
        gem.q = currQ;
        gem.r = currR;
        gem.edgeSide = currSide;
        break;
      }

      // 出口辺を決定
      const nextExitSide = connectedPath[0] === entrySide ? connectedPath[1] : connectedPath[0];
      currQ = nextQ;
      currR = nextR;
      currSide = nextExitSide;
      anyMoved = true;

      // 衝突判定：既に他の宝石が同じヘックスの同じ辺にいる場合
      const collidedGem = G.gems.find(other => 
        other.id !== gem.id && 
        other.status === 'board' && 
        other.q === currQ && 
        other.r === currR && 
        (other.edgeSide === currSide || other.edgeSide === entrySide)
      );

      if (collidedGem) {
        gem.status = 'destroyed';
        collidedGem.status = 'destroyed';
        G.logs.unshift(`💥【大激突！】${gem.name} と ${collidedGem.name} が水路上で正面衝突！ 2つの宝石が消滅しました！`);
        break;
      }
    }
  });

  // 2. 中央島のエメラルド＆サファイア放出チェック
  // 中央 (0,0) の周りのタイルが置かれ、水路が繋がっているか
  [0, 1, 2, 3, 4, 5].forEach(side => {
    const dir = HEX_DIRECTIONS[side];
    const nTile = G.board[`${dir.q},${dir.r}`];
    if (!nTile) return;

    const entrySide = getOppositeSide(side);
    const connPath = nTile.paths.find(([a, b]) => a === entrySide || b === entrySide);
    if (!connPath) return;

    // 中央島にある未放出宝石を探す
    // エメラルドがまだ残っていればエメラルド、全て放出済みならサファイア
    const waitingEmerald = G.gems.find(g => g.status === 'center' && g.type === 'emerald' && g.centerSlot === side);
    if (waitingEmerald) {
      waitingEmerald.status = 'board';
      waitingEmerald.q = dir.q;
      waitingEmerald.r = dir.r;
      waitingEmerald.edgeSide = connPath[0] === entrySide ? connPath[1] : connPath[0];
      G.logs.unshift(`🟢 中央島からエメラルド（2点）が水路に滑り出しました！`);
      simulateGemMovements(G, ctx);
      return;
    }

    // 全エメラルド放出済みかつサファイア未放出ならサファイアを放出
    const remainingEmeralds = G.gems.filter(g => g.status === 'center' && g.type === 'emerald');
    const waitingSapphire = G.gems.find(g => g.status === 'center' && g.type === 'sapphire');
    if (remainingEmeralds.length === 0 && waitingSapphire) {
      waitingSapphire.status = 'board';
      waitingSapphire.q = dir.q;
      waitingSapphire.r = dir.r;
      waitingSapphire.edgeSide = connPath[0] === entrySide ? connPath[1] : connPath[0];
      G.logs.unshift(`💎【主宝解放！】中央島からサファイア（3点）が水路に滑り出しました！`);
      simulateGemMovements(G, ctx);
      return;
    }
  });

  // 3. 隅の島（アンバー）放出チェック
  CORNER_ISLANDS.forEach((island, idx) => {
    const waitingAmber = G.gems.find(g => g.status === 'corner' && g.cornerIndex === idx);
    if (!waitingAmber) return;

    const inDir = HEX_DIRECTIONS[island.inwardSide];
    const targetQ = island.q + inDir.q;
    const targetR = island.r + inDir.r;
    const nTile = G.board[`${targetQ},${targetR}`];
    if (!nTile) return;

    const entrySide = getOppositeSide(island.inwardSide);
    const connPath = nTile.paths.find(([a, b]) => a === entrySide || b === entrySide);
    if (!connPath) return;

    waitingAmber.status = 'board';
    waitingAmber.q = targetQ;
    waitingAmber.r = targetR;
    waitingAmber.edgeSide = connPath[0] === entrySide ? connPath[1] : connPath[0];
    G.logs.unshift(`🟡 隅の島からアンバー（1点）が水路に滑り出しました！`);
    simulateGemMovements(G, ctx);
  });

  // 4. ゲーム終了判定：全ての宝石が盤上から退場したか、またはタイル置き場が満杯
  const activeGems = G.gems.filter(g => g.status === 'board' || g.status === 'center' || g.status === 'corner');
  const placedTileCount = Object.keys(G.board).length;

  if (activeGems.length === 0 || placedTileCount >= 54) {
    G.gameState = 'game_over';
    G.rankings = Object.entries(G.players)
      .map(([pid, p]) => ({ playerID: pid, score: p.score, gems: p.collectedGems }))
      .sort((a, b) => b.score - a.score);
    G.winner = G.rankings[0].playerID;
    G.logs.unshift(`🏆 ゲーム終了！ Player ${G.winner} が最高得点 (${G.rankings[0].score}点) で勝利しました！`);
  }
};

export const IndigoGame = {
  name: 'indigo',

  setup: ({ ctx, random }) => {
    const numPlayers = ctx.numPlayers;
    const deck = random.Shuffle(generateDeck());

    // 各プレイヤーの初期化
    const players = {};
    for (let i = 0; i < numPlayers; i++) {
      const pid = i.toString();
      players[pid] = {
        hand: deck.pop(), // 1枚手札
        score: 0,
        collectedGems: []
      };
    }

    // 宝石の初期配置
    // 中央島 (0,0): サファイア1個 (3点) + エメラルド5個 (2点)
    // 隅の島 (6箇所): アンバー各1個 (1点)
    const gems = [
      { id: 'gem-sapphire', name: 'サファイア', type: 'sapphire', points: 3, status: 'center', q: 0, r: 0, edgeSide: null },
      { id: 'gem-emerald-0', name: 'エメラルド', type: 'emerald', points: 2, status: 'center', centerSlot: 0, q: 0, r: 0, edgeSide: 0 },
      { id: 'gem-emerald-1', name: 'エメラルド', type: 'emerald', points: 2, status: 'center', centerSlot: 1, q: 0, r: 0, edgeSide: 1 },
      { id: 'gem-emerald-2', name: 'エメラルド', type: 'emerald', points: 2, status: 'center', centerSlot: 2, q: 0, r: 0, edgeSide: 2 },
      { id: 'gem-emerald-3', name: 'エメラルド', type: 'emerald', points: 2, status: 'center', centerSlot: 3, q: 0, r: 0, edgeSide: 3 },
      { id: 'gem-emerald-4', name: 'エメラルド', type: 'emerald', points: 2, status: 'center', centerSlot: 4, q: 0, r: 0, edgeSide: 4 },
    ];

    // 6隅のアンバー
    for (let i = 0; i < 6; i++) {
      gems.push({
        id: `gem-amber-${i}`,
        name: 'アンバー',
        type: 'amber',
        points: 1,
        status: 'corner',
        cornerIndex: i,
        q: CORNER_ISLANDS[i].q,
        r: CORNER_ISLANDS[i].r,
        edgeSide: CORNER_ISLANDS[i].inwardSide
      });
    }

    return {
      gameState: 'lobby', // 'lobby' | 'playing' | 'game_over'
      board: {}, // "q,r" -> { tileId, type, rotation, paths, placedBy }
      deck,
      gems,
      players,
      gatewayOwners: getGatewayOwners(numPlayers),
      rankings: [],
      winner: null,
      logs: []
    };
  },

  moves: {
    // ロビーからゲームスタート
    startGame: ({ G }) => {
      if (G.gameState !== 'lobby') return;
      G.gameState = 'playing';
      G.logs.unshift('🎮 インディゴがスタートしました！ 手番のプレイヤーはタイルを配置してください。');
    },

    // タイル配置 (q, r, rotation)
    placeTile: ({ G, ctx, events }, q, r, rotation = 0) => {
      if (G.gameState !== 'playing') return;
      const key = `${q},${r}`;

      // 配置バリデーション
      // 1. 範囲内 (dist <= 4)
      if (getHexDistance(q, r) > 4) return;
      // 2. 中央島 (0,0) には配置不可
      if (q === 0 && r === 0) return;
      // 3. 6隅の島には配置不可
      if (CORNER_ISLANDS.some(ci => ci.q === q && ci.r === r)) return;
      // 4. すでにタイルがある場合は不可
      if (G.board[key]) return;

      const pid = ctx.currentPlayer;
      const player = G.players[pid];
      if (!player || !player.hand) return;

      const tile = player.hand;
      const rotatedPaths = getRotatedPaths(tile.paths, rotation);

      // タイルを配置
      G.board[key] = {
        tileId: tile.id,
        type: tile.type,
        rotation,
        paths: rotatedPaths,
        placedBy: pid
      };

      G.logs.unshift(`Player ${pid} が (${q}, ${r}) に水路タイルを配置しました。`);

      // 宝石の連続走行をシミュレート
      simulateGemMovements(G, ctx);

      // 山札から新しい手札を引く
      if (G.deck.length > 0) {
        player.hand = G.deck.pop();
      } else {
        player.hand = null;
      }

      // 次のプレイヤーの手番へ
      if (G.gameState === 'playing') {
        events.endTurn();
      }
    },

    // ゲーム再戦
    restartGame: ({ G, ctx, random }) => {
      const numPlayers = ctx.numPlayers;
      const deck = random.Shuffle(generateDeck());
      G.board = {};
      G.deck = deck;
      G.gameState = 'lobby';
      G.rankings = [];
      G.winner = null;
      G.logs = [];

      for (let i = 0; i < numPlayers; i++) {
        const pid = i.toString();
        G.players[pid] = {
          hand: G.deck.pop(),
          score: 0,
          collectedGems: []
        };
      }

      // 宝石リセット
      G.gems = [
        { id: 'gem-sapphire', name: 'サファイア', type: 'sapphire', points: 3, status: 'center', q: 0, r: 0, edgeSide: null },
        { id: 'gem-emerald-0', name: 'エメラルド', type: 'emerald', points: 2, status: 'center', centerSlot: 0, q: 0, r: 0, edgeSide: 0 },
        { id: 'gem-emerald-1', name: 'エメラルド', type: 'emerald', points: 2, status: 'center', centerSlot: 1, q: 0, r: 0, edgeSide: 1 },
        { id: 'gem-emerald-2', name: 'エメラルド', type: 'emerald', points: 2, status: 'center', centerSlot: 2, q: 0, r: 0, edgeSide: 2 },
        { id: 'gem-emerald-3', name: 'エメラルド', type: 'emerald', points: 2, status: 'center', centerSlot: 3, q: 0, r: 0, edgeSide: 3 },
        { id: 'gem-emerald-4', name: 'エメラルド', type: 'emerald', points: 2, status: 'center', centerSlot: 4, q: 0, r: 0, edgeSide: 4 },
      ];
      for (let i = 0; i < 6; i++) {
        G.gems.push({
          id: `gem-amber-${i}`,
          name: 'アンバー',
          type: 'amber',
          points: 1,
          status: 'corner',
          cornerIndex: i,
          q: CORNER_ISLANDS[i].q,
          r: CORNER_ISLANDS[i].r,
          edgeSide: CORNER_ISLANDS[i].inwardSide
        });
      }
    }
  }
};
