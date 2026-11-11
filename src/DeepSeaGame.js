// DeepSeaGame.js - 海底探険 (Deep Sea Adventure) boardgame.io Game Definition

export const DIVER_COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#a855f7', '#ec4899'];

// 特殊ダイス（1, 1, 2, 2, 3, 3）
export const DICE_FACES = [1, 1, 2, 2, 3, 3];

// レベル別の遺跡チップ設定（各レベル8枚＝計32枚）
const LEVEL_CONFIGS = [
  { level: 1, values: [0, 0, 1, 1, 2, 2, 3, 3] },
  { level: 2, values: [4, 4, 5, 5, 6, 6, 7, 7] },
  { level: 3, values: [8, 8, 9, 9, 10, 10, 11, 11] },
  { level: 4, values: [12, 12, 13, 13, 14, 14, 15, 15] },
];

const createInitialTrack = (random) => {
  const track = [];
  let uid = 0;
  for (const cfg of LEVEL_CONFIGS) {
    const vals = random ? random.Shuffle([...cfg.values]) : [...cfg.values].sort(() => Math.random() - 0.5);
    for (const val of vals) {
      uid += 1;
      track.push({
        id: `ruin-${uid}`,
        type: 'treasure', // 'treasure' | 'stack' | 'blank'
        level: cfg.level,
        count: 1,
        items: [{ level: cfg.level, value: val }],
        totalValue: val,
      });
    }
  }
  return track;
};

const calcItemsValue = (carried) => {
  return carried.reduce((sum, tile) => sum + (tile.totalValue || 0), 0);
};

// プレイヤーが持っている未確定アイテムがすべて何点か（帰還時公開）
const flattenCarriedItems = (carried) => {
  const list = [];
  for (const tile of carried) {
    if (tile.items && tile.items.length > 0) {
      list.push(...tile.items);
    }
  }
  return list;
};

// ラウンド終了処理（帰還者の得点加算・沈没者の財宝を最深部に3個ずつスタック・空マス除去）
const finishRound = (G, ctx, reason) => {
  const summaryPlayers = [];
  const sunkenDivers = [];

  for (let i = 0; i < ctx.numPlayers; i++) {
    const pid = i.toString();
    const p = G.players[pid];
    if (!p) continue;

    if (p.returned) {
      const gainedChips = flattenCarriedItems(p.carried);
      const gainedScore = gainedChips.reduce((s, c) => s + c.value, 0);
      p.scoredChips.push(...gainedChips);
      p.score += gainedScore;
      summaryPlayers.push({
        playerID: pid,
        returned: true,
        gainedChips,
        gainedScore,
        totalScore: p.score,
        position: -1,
      });
      p.carried = [];
    } else {
      const lostChips = flattenCarriedItems(p.carried);
      sunkenDivers.push({
        playerID: pid,
        position: p.position,
        lostChips,
      });
      summaryPlayers.push({
        playerID: pid,
        returned: false,
        lostChips,
        gainedScore: 0,
        totalScore: p.score,
        position: p.position,
      });
      p.carried = [];
    }
  }

  // 沈没者がいた場合：浅い順（position昇順）に並べて財宝を集め、3個ずつの塊にして最深部へ沈殿
  sunkenDivers.sort((a, b) => a.position - b.position);
  const allSunkenChips = [];
  for (const sd of sunkenDivers) {
    allSunkenChips.push(...sd.lostChips);
  }

  // コースからブランクマスをすべて取り除き圧縮
  const compressedTrack = G.track.filter((t) => t.type !== 'blank');

  // 沈んだ財宝を3個ずつのスタックとして末尾（最深部）に追加
  let stackUid = G.round * 100;
  while (allSunkenChips.length > 0) {
    const chunk = allSunkenChips.splice(0, 3);
    stackUid += 1;
    const maxLevel = Math.max(...chunk.map((c) => c.level));
    const totalValue = chunk.reduce((s, c) => s + c.value, 0);
    compressedTrack.push({
      id: `stack-${stackUid}`,
      type: 'stack',
      level: maxLevel,
      count: chunk.length,
      items: chunk,
      totalValue,
    });
  }
  G.track = compressedTrack;

  // 次ラウンドのスタートプレイヤーを決定（沈没者のうち最も深い人 / 全員帰還なら最後に帰還した人）
  let nextStarter = '0';
  if (sunkenDivers.length > 0) {
    nextStarter = sunkenDivers[sunkenDivers.length - 1].playerID;
  } else {
    let maxOrder = -1;
    for (let i = 0; i < ctx.numPlayers; i++) {
      const pid = i.toString();
      if (G.players[pid] && G.players[pid].lastReturnOrder > maxOrder) {
        maxOrder = G.players[pid].lastReturnOrder;
        nextStarter = pid;
      }
    }
  }
  G.nextStarterId = nextStarter;

  G.roundSummary = {
    round: G.round,
    reason, // 'oxygen_empty' | 'all_returned'
    players: summaryPlayers,
    sunkenCount: sunkenDivers.length,
    sunkenChipsCount: summaryPlayers.reduce((s, sp) => s + (sp.lostChips ? sp.lostChips.length : 0), 0),
    nextStarterId: nextStarter,
  };

  if (reason === 'oxygen_empty') {
    G.logs.unshift(`🚨【酸素枯渇！】共有酸素が0になりラウンド ${G.round} 終了！帰還できなかったダイバーは財宝を失いました…`);
  } else {
    G.logs.unshift(`⚓【全員生還！】すべてのダイバーが潜水艦に帰還しラウンド ${G.round} 終了！`);
  }

  if (G.round >= (G.maxRounds || 3) || G.track.length === 0) {
    // 全ラウンド終了：最終ランキング作成
    const rankings = Object.values(G.players)
      .map((p) => {
        const lvlCounts = [0, 0, 0, 0];
        for (const c of p.scoredChips) {
          if (c.level >= 1 && c.level <= 4) lvlCounts[c.level - 1] += 1;
        }
        return {
          playerID: p.id,
          score: p.score,
          chipCount: p.scoredChips.length,
          scoredChips: p.scoredChips,
          lvlCounts,
          color: p.color,
        };
      })
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        for (let lv = 3; lv >= 0; lv--) {
          if (b.lvlCounts[lv] !== a.lvlCounts[lv]) return b.lvlCounts[lv] - a.lvlCounts[lv];
        }
        return b.chipCount - a.chipCount;
      });

    G.rankings = rankings;
    G.winner = rankings[0]?.playerID || '0';
    G.gameState = 'game_over';
    G.turnStep = 'game_over';
    G.logs.unshift(`🏆【探険終了】全${G.maxRounds || 3}ラウンド完了！優勝は Player ${G.winner}（${rankings[0]?.score || 0}点）です！`);
  } else {
    G.gameState = 'round_end';
    G.turnStep = 'round_end';
  }
};

// 次のアクティブダイバーへ手番を回し、手番開始時の酸素消費を行う
const advanceTurn = (G, ctx) => {
  const numPlayers = ctx.numPlayers;
  const activeCount = Object.values(G.players).filter((p) => !p.returned).length;
  if (activeCount === 0) {
    finishRound(G, ctx, 'all_returned');
    return;
  }

  const curIdx = parseInt(G.currentPlayerId, 10) || 0;
  let nextPid = G.currentPlayerId;
  for (let offset = 1; offset <= numPlayers; offset++) {
    const candPid = ((curIdx + offset) % numPlayers).toString();
    if (G.players[candPid] && !G.players[candPid].returned) {
      nextPid = candPid;
      break;
    }
  }

  G.currentPlayerId = nextPid;
  const nextPlayer = G.players[nextPid];

  // 手番開始時：所持している財宝の数だけ共有酸素が減少
  const oxyCost = nextPlayer.carried.length;
  if (oxyCost > 0) {
    G.oxygen = Math.max(0, G.oxygen - oxyCost);
    G.lastOxygenEvent = {
      playerID: nextPid,
      cost: oxyCost,
      remaining: G.oxygen,
      id: `${G.round}-${G.turnCount}-${nextPid}`,
    };
    G.logs.unshift(`🫧 Player ${nextPid} の重荷（財宝${oxyCost}個）で共有酸素が -${oxyCost}（残り ${G.oxygen}/${G.maxOxygen}）`);
  } else {
    G.lastOxygenEvent = null;
  }

  if (G.oxygen <= 0) {
    finishRound(G, ctx, 'oxygen_empty');
    return;
  }

  G.turnCount += 1;
  G.turnStep = 'roll';
};

export const DeepSeaGame = {
  name: 'deepsea',

  setup: ({ ctx }) => {
    const players = {};
    for (let i = 0; i < ctx.numPlayers; i++) {
      const pid = i.toString();
      players[pid] = {
        id: pid,
        color: DIVER_COLORS[i % DIVER_COLORS.length],
        position: -1,
        direction: 'down',
        returned: false,
        carried: [],
        scoredChips: [],
        score: 0,
        lastReturnOrder: 0,
      };
    }

    return {
      gameState: 'lobby', // 'lobby' | 'playing' | 'round_end' | 'game_over'
      gameMode: 'standard', // 'standard' (全3ラウンド) | 'quick' (1回戦のみ)
      maxRounds: 3,
      round: 1,
      oxygen: 25,
      maxOxygen: 25,
      track: [],
      players,
      currentPlayerId: '0',
      nextStarterId: '0',
      turnStep: 'roll', // 'roll' | 'action' | 'round_end' | 'game_over'
      turnCount: 1,
      returnCounter: 0,
      lastRoll: null,
      lastOxygenEvent: null,
      lastActionBanner: null,
      roundSummary: null,
      rankings: [],
      winner: null,
      logs: [],
    };
  },

  turn: {
    activePlayers: { all: 'play' },
  },

  moves: {
    // 0. ラウンド数モード変更（全3ラウンド / 1回戦のみ）
    setGameMode: ({ G }, mode) => {
      if (G.gameState !== 'lobby') return;
      G.gameMode = mode;
      G.maxRounds = mode === 'quick' ? 1 : 3;
    },

    // 1. ゲーム開始（ロビーからラウンド1スタート）
    startGame: ({ G, ctx, random }) => {
      if (G.gameState !== 'lobby') return;
      const firstPid = (random ? random.Die(ctx.numPlayers) - 1 : Math.floor(Math.random() * ctx.numPlayers)).toString();
      G.track = createInitialTrack(random);
      G.gameState = 'playing';
      G.maxRounds = G.gameMode === 'quick' ? 1 : 3;
      G.round = 1;
      G.oxygen = 25;
      G.currentPlayerId = firstPid;
      G.nextStarterId = firstPid;
      G.turnStep = 'roll';
      G.turnCount = 1;
      G.returnCounter = 0;
      G.lastRoll = null;
      G.lastOxygenEvent = null;
      G.lastActionBanner = null;
      G.roundSummary = null;
      G.logs.unshift(`🌊【海底探険スタート！】全${G.maxRounds}ラウンドの海底トレジャーハント！ランダム抽選で Player ${firstPid} からスタートします！`);
    },

    // 2. 方向宣言＆特殊ダイスを2つ振って移動
    rollDice: ({ G, ctx, random }, playerID, turnBack = false) => {
      if (G.gameState !== 'playing' || G.turnStep !== 'roll') return;
      if (playerID !== G.currentPlayerId) return;
      const p = G.players[playerID];
      if (!p || p.returned) return;

      // 引き返し宣言（往路かつ海に出ている場合のみ可能）
      if (turnBack && p.direction === 'down' && p.position >= 0) {
        p.direction = 'up';
        G.logs.unshift(`⬆️ Player ${playerID} が「潜水艦へ引き返す！」と宣言しました！`);
      }

      const d1 = DICE_FACES[(random ? random.Die(6) : Math.floor(Math.random() * 6) + 1) - 1];
      const d2 = DICE_FACES[(random ? random.Die(6) : Math.floor(Math.random() * 6) + 1) - 1];
      const rawSum = d1 + d2;
      const weightPenalty = p.carried.length;
      const steps = Math.max(0, rawSum - weightPenalty);

      // 他のダイバーがいる位置（潜水艦-1と既帰還者は除く）
      const occupied = new Set();
      for (const [oid, op] of Object.entries(G.players)) {
        if (oid !== playerID && !op.returned && op.position >= 0) {
          occupied.add(op.position);
        }
      }

      const startPos = p.position;
      let currentPos = startPos;
      let arrivedSubmarine = false;

      if (p.direction === 'down') {
        for (let s = 0; s < steps; s++) {
          let cand = currentPos + 1;
          while (cand < G.track.length && occupied.has(cand)) {
            cand += 1;
          }
          if (cand < G.track.length) {
            currentPos = cand;
          } else {
            break;
          }
        }
        p.position = currentPos;
      } else {
        for (let s = 0; s < steps; s++) {
          let cand = currentPos - 1;
          while (cand >= 0 && occupied.has(cand)) {
            cand -= 1;
          }
          if (cand >= 0) {
            currentPos = cand;
          } else {
            arrivedSubmarine = true;
            currentPos = -1;
            break;
          }
        }
        p.position = currentPos;
      }

      G.lastRoll = {
        playerID,
        d1,
        d2,
        rawSum,
        weightPenalty,
        steps,
        fromPos: startPos,
        toPos: currentPos,
        direction: p.direction,
        arrivedSubmarine,
        turnedBack: !!turnBack,
      };

      if (arrivedSubmarine) {
        p.returned = true;
        G.returnCounter += 1;
        p.lastReturnOrder = G.returnCounter;
        const previewVal = calcItemsValue(p.carried);
        G.lastActionBanner = `🚤 Player ${playerID} がダイス【${d1}＋${d2}＝${rawSum}（歩数:${steps}）】で潜水艦に無事帰還！（持ち帰り財宝 ${p.carried.length}個）`;
        G.logs.unshift(`⚓ Player ${playerID} が財宝 ${p.carried.length}個を持って潜水艦に帰還しました！（推定価値:${previewVal > 0 ? '???点' : '0点'}）`);
        advanceTurn(G, ctx);
        return;
      }

      G.logs.unshift(
        `🎲 Player ${playerID}（${p.direction === 'down' ? '潜水中⬇️' : '帰還中⬆️'}）：出目 ${d1}＋${d2}＝${rawSum}` +
        (weightPenalty > 0 ? ` － 重荷${weightPenalty} ＝ ${steps}歩` : ` ＝ ${steps}歩`) +
        ` ➔ ${currentPos + 1}マス目に到着`
      );
      G.lastActionBanner = null;
      G.turnStep = 'action';
    },

    // 3. 足元の財宝を拾う
    pickUpTreasure: ({ G, ctx }, playerID) => {
      if (G.gameState !== 'playing' || G.turnStep !== 'action') return;
      if (playerID !== G.currentPlayerId) return;
      const p = G.players[playerID];
      if (!p || p.returned || p.position < 0) return;

      const tile = G.track[p.position];
      if (!tile || (tile.type !== 'treasure' && tile.type !== 'stack')) return;

      p.carried.push(tile);
      G.track[p.position] = {
        id: `blank-${G.round}-${p.position}-${G.turnCount}`,
        type: 'blank',
        level: 0,
        count: 0,
        items: [],
        totalValue: 0,
      };

      const label = tile.type === 'stack' ? `沈殿塊（${tile.count}枚組/Lv.${tile.level}）` : `遺跡チップ（Lv.${tile.level}）`;
      G.lastActionBanner = `💎 Player ${playerID} が ${p.position + 1}マス目の${label}を拾いました！`;
      G.logs.unshift(`💎 Player ${playerID} が ${p.position + 1}マス目の${label}を回収！（所持重荷: ${p.carried.length}個）`);

      advanceTurn(G, ctx);
    },

    // 4. 空きマスに手持ちの財宝を1つ置く（身軽になる）
    dropTreasure: ({ G, ctx }, playerID, carriedIndex) => {
      if (G.gameState !== 'playing' || G.turnStep !== 'action') return;
      if (playerID !== G.currentPlayerId) return;
      const p = G.players[playerID];
      if (!p || p.returned || p.position < 0) return;

      const tile = G.track[p.position];
      if (!tile || tile.type !== 'blank') return;
      if (carriedIndex < 0 || carriedIndex >= p.carried.length) return;

      const [droppedTile] = p.carried.splice(carriedIndex, 1);
      G.track[p.position] = droppedTile;

      const label = droppedTile.type === 'stack' ? `沈殿塊（${droppedTile.count}枚組）` : `遺跡チップ（Lv.${droppedTile.level}）`;
      G.lastActionBanner = `🗑️ Player ${playerID} が ${p.position + 1}マス目に${label}を置いて身軽になった！`;
      G.logs.unshift(`🗑️ Player ${playerID} が ${label}を ${p.position + 1}マス目に置きました（所持重荷: ${p.carried.length}個）`);

      advanceTurn(G, ctx);
    },

    // 5. 何もしないでターン終了
    skipAction: ({ G, ctx }, playerID) => {
      if (G.gameState !== 'playing' || G.turnStep !== 'action') return;
      if (playerID !== G.currentPlayerId) return;
      const p = G.players[playerID];
      if (!p) return;

      G.lastActionBanner = `➡️ Player ${playerID} は何もせず様子を見た。`;
      advanceTurn(G, ctx);
    },

    // 6. 次のラウンドを開始（round_end から）
    startNextRound: ({ G, ctx }) => {
      if (G.gameState !== 'round_end') return;
      G.round += 1;
      G.oxygen = 25;
      G.returnCounter = 0;
      G.turnCount = 1;
      G.lastRoll = null;
      G.lastOxygenEvent = null;
      G.lastActionBanner = null;
      G.roundSummary = null;

      for (const p of Object.values(G.players)) {
        p.position = -1;
        p.direction = 'down';
        p.returned = false;
        p.carried = [];
        p.lastReturnOrder = 0;
      }

      G.currentPlayerId = G.nextStarterId || '0';
      G.gameState = 'playing';
      G.turnStep = 'roll';
      G.logs.unshift(`🌊【ラウンド ${G.round} 開始！】酸素25満タン！Player ${G.currentPlayerId} からスタートします！（残り海底マス: ${G.track.length}マス）`);
    },

    // 7. ゲームを最初からやり直す
    restartGame: ({ G, ctx }) => {
      G.gameState = 'lobby';
      G.round = 1;
      G.oxygen = 25;
      G.track = [];
      G.currentPlayerId = '0';
      G.nextStarterId = '0';
      G.turnStep = 'roll';
      G.turnCount = 1;
      G.returnCounter = 0;
      G.lastRoll = null;
      G.lastOxygenEvent = null;
      G.lastActionBanner = null;
      G.roundSummary = null;
      G.rankings = [];
      G.winner = null;
      G.logs = [];
      for (let i = 0; i < ctx.numPlayers; i++) {
        const pid = i.toString();
        G.players[pid] = {
          id: pid,
          color: DIVER_COLORS[i % DIVER_COLORS.length],
          position: -1,
          direction: 'down',
          returned: false,
          carried: [],
          scoredChips: [],
          score: 0,
          lastReturnOrder: 0,
        };
      }
    },
  },
};
