// OnsokuGame.js - 音速飯店 (Onsoku Hanten) boardgame.io Game Definition

export const PLAYER_COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#a855f7', '#ec4899'];

// 具材カードの種類と枚数構成（全65枚）
const DECK_RECIPE = [
  { word: 'ラー', count: 6, color: '#ef4444', role: 'start_mid' },
  { word: 'タン', count: 7, color: '#f97316', role: 'start_mid' },
  { word: 'チャー', count: 7, color: '#eab308', role: 'start_mid' },
  { word: 'エビ', count: 5, color: '#ec4899', role: 'start' },
  { word: 'テン', count: 4, color: '#8b5cf6', role: 'start' },
  { word: 'シオ', count: 4, color: '#06b6d4', role: 'start' },
  { word: 'シュー', count: 5, color: '#d97706', role: 'mid' },
  { word: 'シン', count: 4, color: '#6366f1', role: 'mid' },
  { word: 'メン', count: 9, color: '#10b981', role: 'finish' },
  { word: 'ハン', count: 7, color: '#14b8a6', role: 'finish' },
  { word: 'チリ', count: 4, color: '#dc2626', role: 'finish' },
  { word: 'とりけし', count: 3, color: '#475569', role: 'cancel' },
];

export const FINISHING_WORDS = new Set(['メン', 'ハン', 'チリ']);

// 現在のトレー状態（単語配列）に対して次に出せるカード一覧を返す
export const getAllowedNextWords = (trayWords) => {
  if (!trayWords || trayWords.length === 0) {
    return ['ラー', 'タン', 'チャー', 'エビ', 'テン', 'シオ'];
  }

  const key = trayWords.join('>');
  const rules = {
    'ラー': ['メン'],
    'タン': ['タン', 'メン'],
    'タン>タン': ['メン'],
    'チャー': ['ハン', 'シュー'],
    'チャー>シュー': ['メン'],
    'エビ': ['チリ', 'チャー', 'シオ'],
    'エビ>チャー': ['ハン', 'シュー'],
    'エビ>チャー>シュー': ['メン'],
    'エビ>シオ': ['ラー', 'タン'],
    'エビ>シオ>ラー': ['メン'],
    'エビ>シオ>タン': ['メン'],
    'テン': ['シン'],
    'テン>シン': ['ハン'],
    'シオ': ['ラー', 'タン', 'チャー'],
    'シオ>ラー': ['メン'],
    'シオ>タン': ['メン', 'タン'],
    'シオ>タン>タン': ['メン'],
    'シオ>チャー': ['ハン', 'シュー'],
    'シオ>チャー>シュー': ['メン'],
  };

  const nexts = rules[key] || [];
  // 場が空でなければ「とりけし」はいつでも出せる
  return [...nexts, 'とりけし'];
};

export const canPlayWord = (trayWords, word) => {
  return getAllowedNextWords(trayWords).includes(word);
};

// 全未上がりプレイヤーの中で、現在の場に出せるカードがあるかチェック（手詰まり自動検知）
const hasAnyPlayableCard = (G) => {
  const trayWords = G.tray.map((c) => c.word);
  const allowed = new Set(getAllowedNextWords(trayWords));
  for (const p of Object.values(G.players)) {
    if (p.finished) continue;
    if (p.hand.some((c) => allowed.has(c.word))) {
      return true;
    }
  }
  return false;
};

const createShuffledDeck = (random) => {
  const deck = [];
  let idCounter = 0;
  for (const spec of DECK_RECIPE) {
    for (let i = 0; i < spec.count; i++) {
      idCounter += 1;
      deck.push({
        id: `oh-${idCounter}-${spec.word}`,
        word: spec.word,
        color: spec.color,
        role: spec.role,
      });
    }
  }
  return random ? random.Shuffle(deck) : deck.sort(() => Math.random() - 0.5);
};

const setupRound = (G, ctx, random) => {
  const deck = createShuffledDeck(random);
  const numPlayers = ctx.numPlayers;
  const perPlayer = Math.floor(deck.length / numPlayers);

  for (let i = 0; i < numPlayers; i++) {
    const pid = i.toString();
    const hand = deck.splice(0, perPlayer);
    // 整理しやすいように種類別にソート
    hand.sort((a, b) => a.word.localeCompare(b.word, 'ja'));
    G.players[pid] = {
      ...(G.players[pid] || {}),
      id: pid,
      color: PLAYER_COLORS[i % PLAYER_COLORS.length],
      hand,
      finished: false,
      finishRank: null,
      score: G.players[pid]?.score || 0,
      ordersCompleted: G.players[pid]?.ordersCompleted || 0,
    };
  }

  G.tray = [];
  G.finishOrder = [];
  G.lastCompletedDish = null;
  G.lastRejectNotice = {};
  G.roundResult = null;
};

export const OnsokuGame = {
  name: 'onsoku',

  setup: ({ ctx }) => {
    const players = {};
    for (let i = 0; i < ctx.numPlayers; i++) {
      const pid = i.toString();
      players[pid] = {
        id: pid,
        color: PLAYER_COLORS[i % PLAYER_COLORS.length],
        hand: [],
        finished: false,
        finishRank: null,
        score: 0,
        ordersCompleted: 0,
      };
    }

    return {
      gameState: 'lobby', // 'lobby' | 'playing' | 'round_end' | 'game_over'
      gameMode: 'tournament3', // 'quick' (1戦勝負) | 'tournament3' (3回戦ポイント制)
      round: 1,
      maxRounds: 3,
      tray: [], // 現在中華トレイに出ているカード [{ id, word, color, role, playerID }]
      players,
      finishOrder: [], // 勝ち抜け順 [playerID, ...]
      completedCount: 0,
      lastCompletedDish: null, // { dishName, playerID, cards, type: 'dish' | 'cancel' | 'deadlock', id }
      lastRejectNotice: {},
      roundResult: null,
      rankings: [],
      winner: null,
      logs: [],
    };
  },

  turn: {
    activePlayers: { all: 'play' },
  },

  moves: {
    setGameMode: ({ G }, mode) => {
      if (G.gameState !== 'lobby') return;
      G.gameMode = mode;
      G.maxRounds = mode === 'quick' ? 1 : 3;
    },

    startGame: ({ G, ctx, random }) => {
      if (G.gameState !== 'lobby') return;
      G.round = 1;
      G.maxRounds = G.gameMode === 'quick' ? 1 : 3;
      G.completedCount = 0;
      for (const p of Object.values(G.players)) {
        p.score = 0;
        p.ordersCompleted = 0;
      }
      setupRound(G, ctx, random);
      G.gameState = 'playing';
      G.logs.unshift('🍜【音速飯店 開店！】注文に合わせてカードを早出し！手札をすべて出し切ろう！');
    },

    // リアルタイム早出しカードプレイ
    playCard: ({ G, ctx }, playerID, cardId) => {
      if (G.gameState !== 'playing') return;
      const p = G.players[playerID];
      if (!p || p.finished) return;

      const cardIdx = p.hand.findIndex((c) => c.id === cardId);
      if (cardIdx === -1) return;
      const card = p.hand[cardIdx];

      const currentWords = G.tray.map((c) => c.word);
      if (!canPlayWord(currentWords, card.word)) {
        // タッチの差で場が変わった場合など
        G.lastRejectNotice[playerID] = {
          word: card.word,
          reason: `現在の場「${currentWords.join('') || '（空）'}」には【${card.word}】は出せません！`,
          ts: Date.now(),
        };
        return;
      }

      // 受理！手札から取り除く
      p.hand.splice(cardIdx, 1);
      delete G.lastRejectNotice[playerID];

      // 1. 「とりけし」カードの場合
      if (card.word === 'とりけし') {
        const prevDish = currentWords.join('');
        G.tray = [];
        G.completedCount += 1;
        G.lastCompletedDish = {
          dishName: `❌「${prevDish}」とりけし！`,
          playerID,
          cards: [card],
          type: 'cancel',
          id: `${G.round}-${G.completedCount}`,
        };
        G.logs.unshift(`❌ Player ${playerID} が「とりけし！」発動！場の中華「${prevDish}」がキャンセルされました！`);
      } else {
        // 具材カードをトレーに追加
        const playedCard = { ...card, playerID };
        G.tray.push(playedCard);

        // 2. 完成ワード（メン / ハン / チリ）か判定
        if (FINISHING_WORDS.has(card.word)) {
          const dishName = G.tray.map((c) => c.word).join('');
          const dishCards = [...G.tray];
          G.tray = [];
          G.completedCount += 1;
          p.ordersCompleted += 1;
          G.lastCompletedDish = {
            dishName: `🍜 ${dishName} 一丁あがり！！`,
            playerID,
            cards: dishCards,
            type: 'dish',
            id: `${G.round}-${G.completedCount}`,
          };
          G.logs.unshift(`🛎️【注文完成！】Player ${playerID} が「${dishName}」を仕上げた！`);
        } else {
          G.logs.unshift(`🗣️ Player ${playerID}：「${card.word}！」（現在の注文: ${G.tray.map((c) => c.word).join('')}）`);
        }
      }

      // 3. 手札が0枚になったら勝ち抜け！
      if (p.hand.length === 0) {
        p.finished = true;
        G.finishOrder.push(playerID);
        p.finishRank = G.finishOrder.length;
        G.logs.unshift(`🎉【上がり！】Player ${playerID} が ${p.finishRank}位 で手札を出し切りました！`);
      }

      // 4. ラウンド終了チェック（未上がりが1人以下になった場合）
      const remaining = Object.values(G.players).filter((pl) => !pl.finished);
      if (remaining.length <= 1) {
        // 最後の1人を最下位として確定
        if (remaining.length === 1) {
          const lastP = remaining[0];
          lastP.finished = true;
          G.finishOrder.push(lastP.id);
          lastP.finishRank = G.finishOrder.length;
        }

        // ポイント加算（1位: 人数-1点, 2位: 人数-2点 ... 最下位: 0点）
        const totalP = ctx.numPlayers;
        const roundRows = G.finishOrder.map((fPid, idx) => {
          const pts = Math.max(0, totalP - 1 - idx);
          if (G.players[fPid]) {
            G.players[fPid].score += pts;
          }
          return {
            playerID: fPid,
            rank: idx + 1,
            gainedPts: pts,
            totalScore: G.players[fPid]?.score || 0,
            remainingCards: G.players[fPid]?.hand?.length || 0,
          };
        });

        G.roundResult = {
          round: G.round,
          rows: roundRows,
        };

        if (G.round >= G.maxRounds) {
          G.rankings = Object.values(G.players)
            .map((pl) => ({
              playerID: pl.id,
              score: pl.score,
              ordersCompleted: pl.ordersCompleted,
              color: pl.color,
            }))
            .sort((a, b) => {
              if (b.score !== a.score) return b.score - a.score;
              return b.ordersCompleted - a.ordersCompleted;
            });
          G.winner = G.rankings[0]?.playerID || '0';
          G.gameState = 'game_over';
          G.logs.unshift(`🏆【閉店＆表彰式】全${G.maxRounds}回戦終了！優勝は Player ${G.winner}（${G.rankings[0]?.score}pt）です！`);
        } else {
          G.gameState = 'round_end';
          G.logs.unshift(`🏁 第 ${G.round} 戦終了！1位抜けは Player ${G.finishOrder[0]} でした！`);
        }
        return;
      }

      // 5. デッドロック（全員出せるカードなし）チェック
      if (!hasAnyPlayableCard(G)) {
        // トレーが空でなくても誰も出せない場合は強制リセット
        if (G.tray.length > 0) {
          const stuckDish = G.tray.map((c) => c.word).join('');
          G.tray = [];
          G.completedCount += 1;
          G.lastCompletedDish = {
            dishName: `🛑「${stuckDish}」材料切れリセット！`,
            playerID,
            cards: [],
            type: 'deadlock',
            id: `${G.round}-${G.completedCount}`,
          };
          G.logs.unshift(`🛑【材料切れ仕切り直し】誰も「${stuckDish}」を続けられないため、トレーをリセットしました！`);
        }
        // もし空のトレーでも誰も開始カードを持っていない場合は、ラウンド強制終了（手札枚数順で順位付け）
        if (!hasAnyPlayableCard(G)) {
          const remainingSorted = remaining.sort((a, b) => a.hand.length - b.hand.length);
          for (const remP of remainingSorted) {
            remP.finished = true;
            G.finishOrder.push(remP.id);
            remP.finishRank = G.finishOrder.length;
          }
          const totalP = ctx.numPlayers;
          const roundRows = G.finishOrder.map((fPid, idx) => {
            const pts = Math.max(0, totalP - 1 - idx);
            if (G.players[fPid]) G.players[fPid].score += pts;
            return {
              playerID: fPid,
              rank: idx + 1,
              gainedPts: pts,
              totalScore: G.players[fPid]?.score || 0,
              remainingCards: G.players[fPid]?.hand?.length || 0,
            };
          });
          G.roundResult = { round: G.round, rows: roundRows, endedByDeadlock: true };
          G.logs.unshift(`🛑【完全材料切れ！】誰も出せるカードがなくなったため残り枚数で順位決定！`);
          if (G.round >= G.maxRounds) {
            G.rankings = Object.values(G.players)
              .map((pl) => ({ playerID: pl.id, score: pl.score, ordersCompleted: pl.ordersCompleted, color: pl.color }))
              .sort((a, b) => (b.score !== a.score ? b.score - a.score : b.ordersCompleted - a.ordersCompleted));
            G.winner = G.rankings[0]?.playerID || '0';
            G.gameState = 'game_over';
          } else {
            G.gameState = 'round_end';
          }
        }
      }
    },

    startNextRound: ({ G, ctx, random }) => {
      if (G.gameState !== 'round_end') return;
      G.round += 1;
      setupRound(G, ctx, random);
      G.gameState = 'playing';
      G.logs.unshift(`🔥【第 ${G.round} 戦スタート！】さあ、音速で料理を仕上げろ！`);
    },

    restartGame: ({ G, ctx }) => {
      G.gameState = 'lobby';
      G.round = 1;
      G.tray = [];
      G.finishOrder = [];
      G.completedCount = 0;
      G.lastCompletedDish = null;
      G.lastRejectNotice = {};
      G.roundResult = null;
      G.rankings = [];
      G.winner = null;
      G.logs = [];
      for (let i = 0; i < ctx.numPlayers; i++) {
        const pid = i.toString();
        G.players[pid] = {
          id: pid,
          color: PLAYER_COLORS[i % PLAYER_COLORS.length],
          hand: [],
          finished: false,
          finishRank: null,
          score: 0,
          ordersCompleted: 0,
        };
      }
    },
  },
};
