// NimmtGame.js - 6 Nimmt! (ニムト) boardgame.io Game Definition

// 1〜104のカードの牛マーク（失点ペナルティ）数を計算
export const getBullheads = (num) => {
  if (num === 55) return 7; // 55はダブルゾロ目かつ5の倍数
  if (num % 11 === 0) return 5; // 11, 22, 33, 44, 66, 77, 88, 99
  if (num % 10 === 0) return 3; // 10, 20, 30, 40, 50, 60, 70, 80, 90, 100
  if (num % 5 === 0) return 2;  // 5, 15, 25, 35, 45, 65, 75, 85, 95
  return 1; // その他の数字
};

// 1ラウンドの初期化（104枚のカードをシャッフルして10枚ずつ配布、場に4枚配置）
const setupRound = (G, ctx, random) => {
  let deck = [];
  for (let i = 1; i <= 104; i++) {
    deck.push({
      number: i,
      bullheads: getBullheads(i)
    });
  }
  deck = random.Shuffle(deck);

  // 各プレイヤーに10枚ずつ手札を配り、数字昇順にソート
  const numPlayers = ctx.numPlayers;
  for (let i = 0; i < numPlayers; i++) {
    const pid = i.toString();
    const hand = deck.splice(0, 10);
    hand.sort((a, b) => a.number - b.number);
    G.players[pid] = {
      ...(G.players[pid] || { totalPenalty: 0 }),
      hand,
      selectedCard: null,
      isReady: false,
      roundPenalty: 0,
      penaltyCards: []
    };
  }

  // 場の4列の先頭カードを配置
  G.rows = [
    [deck.pop()],
    [deck.pop()],
    [deck.pop()],
    [deck.pop()]
  ];

  G.turn = 1;
  G.turnStep = 'select'; // 'select' | 'resolving' | 'choose_row' | 'round_summary'
  G.resolvingQueue = [];
  G.currentResolving = null;
  G.waitingForPlayer = null;
  G.recentBustEvent = null;
  G.lastRevealedCards = [];
};

// カード配置処理（昇順に1枚ずつ場に配置）
const processNextResolvingCard = (G, ctx) => {
  if (!G.resolvingQueue || G.resolvingQueue.length === 0) {
    // 全員のカード配置が完了
    if (G.turn < 10) {
      // 次のターンへ
      G.turn += 1;
      G.turnStep = 'select';
      G.currentResolving = null;
      G.waitingForPlayer = null;
      for (let i = 0; i < ctx.numPlayers; i++) {
        const pid = i.toString();
        if (G.players[pid]) {
          G.players[pid].selectedCard = null;
          G.players[pid].isReady = false;
        }
      }
    } else {
      // 10ターン終了：ラウンド終了処理
      for (let i = 0; i < ctx.numPlayers; i++) {
        const pid = i.toString();
        if (G.players[pid]) {
          G.players[pid].totalPenalty += G.players[pid].roundPenalty;
        }
      }

      // ゲーム終了判定（規定失点到達または1ラウンド制）
      const anyExceeded = Object.values(G.players).some(p => p.totalPenalty >= G.targetPenalty);
      if (anyExceeded || G.gameMode === 'quick') {
        G.gameState = 'game_over';
        G.turnStep = 'game_over';
        // ランキング作成（失点が少ない順が勝ち）
        G.rankings = Object.entries(G.players)
          .map(([pid, p]) => ({ playerID: pid, totalPenalty: p.totalPenalty, roundPenalty: p.roundPenalty }))
          .sort((a, b) => a.totalPenalty - b.totalPenalty);
        G.winner = G.rankings[0].playerID;
        G.logs.unshift(`🏆 ゲーム終了！ Player ${G.winner} が最少失点で勝利しました！`);
      } else {
        G.gameState = 'round_end';
        G.turnStep = 'round_summary';
        G.logs.unshift(`🏁 ラウンド ${G.round} 終了！結果を確認して次へ進んでください。`);
      }
    }
    return;
  }

  // 次に置くカードを取得
  const nextItem = G.resolvingQueue[0];
  const { playerID, card } = nextItem;
  G.currentResolving = nextItem;

  // 4列の末尾カードと比較
  const diffs = G.rows.map((row, idx) => {
    const lastCard = row[row.length - 1];
    return {
      idx,
      diff: card.number - lastCard.number,
      lastCard
    };
  });

  const validDiffs = diffs.filter(d => d.diff > 0);

  if (validDiffs.length === 0) {
    // どの列の末尾よりも数字が小さい場合：引き取る列を選択させる
    G.waitingForPlayer = playerID;
    G.turnStep = 'choose_row';
    G.logs.unshift(`⚠️ Player ${playerID} のカード [${card.number}] は全列より小さいため、引き取る列を選択してください！`);
    return;
  }

  // 数字の差が最小の列に置く
  validDiffs.sort((a, b) => a.diff - b.diff);
  const bestRowIdx = validDiffs[0].idx;
  const targetRow = G.rows[bestRowIdx];

  G.resolvingQueue.shift();

  if (targetRow.length < 5) {
    // 5枚目までなら通常配置
    targetRow.push({ ...card, playedBy: playerID });
    G.logs.unshift(`Player ${playerID} が列 ${bestRowIdx + 1} に [${card.number}] を配置しました。`);
    // 次のカードへ
    processNextResolvingCard(G, ctx);
  } else {
    // 6枚目バースト！（ニムト発動！）
    const takenCards = [...targetRow];
    const penaltyPoints = takenCards.reduce((sum, c) => sum + c.bullheads, 0);

    G.players[playerID].roundPenalty += penaltyPoints;
    G.players[playerID].penaltyCards.push(...takenCards);

    // 列を自分のカード1枚で置き換え
    G.rows[bestRowIdx] = [{ ...card, playedBy: playerID }];

    G.recentBustEvent = {
      playerID,
      rowIdx: bestRowIdx,
      takenCards,
      placedCard: card,
      penaltyPoints,
      id: Date.now()
    };

    G.logs.unshift(`💥【6枚目バースト！】Player ${playerID} が列 ${bestRowIdx + 1} の5枚（${penaltyPoints}牛）を引き取りました！`);

    // 次のカードへ
    processNextResolvingCard(G, ctx);
  }
};

export const NimmtGame = {
  name: 'nimmt',

  setup: ({ ctx, random }) => {
    const G = {
      gameState: 'lobby', // 'lobby' | 'playing' | 'round_end' | 'game_over'
      gameMode: 'standard', // 'standard' (66牛で終了) | 'quick' (1ラウンド勝負)
      targetPenalty: 66,
      round: 1,
      turn: 1,
      turnStep: 'select',
      rows: [[], [], [], []],
      players: {},
      resolvingQueue: [],
      currentResolving: null,
      waitingForPlayer: null,
      recentBustEvent: null,
      lastRevealedCards: [],
      rankings: [],
      winner: null,
      logs: []
    };

    // 初期プレイヤー枠作成
    for (let i = 0; i < ctx.numPlayers; i++) {
      G.players[i.toString()] = {
        totalPenalty: 0,
        roundPenalty: 0,
        hand: [],
        selectedCard: null,
        isReady: false,
        penaltyCards: []
      };
    }

    return G;
  },

  turn: {
    activePlayers: { all: 'play' },
  },

  moves: {
    // ゲームモード設定（ロビーで変更可能）
    setGameMode: ({ G }, mode) => {
      if (G.gameState !== 'lobby') return;
      G.gameMode = mode;
      G.targetPenalty = mode === 'quick' ? 999 : 66;
    },

    // ゲーム開始（ロビーからプレイ開始）
    startGame: ({ G, ctx, random }) => {
      if (G.gameState !== 'lobby') return;
      G.gameState = 'playing';
      G.round = 1;
      setupRound(G, ctx, random);
      G.logs.unshift('🎮 ニムトがスタートしました！手札からカードを1枚選んでください。');
    },

    // 手札から1枚選んで確定（全員が選ぶと公開・解決開始）
    selectCard: ({ G, ctx }, playerID, cardNumber) => {
      if (G.gameState !== 'playing' || G.turnStep !== 'select') return;

      const player = G.players[playerID];
      if (!player) return;

      // 手札に対象カードがあるか確認
      const cardObj = player.hand.find(c => c.number === cardNumber);
      if (!cardObj) return;

      player.selectedCard = cardObj;
      player.isReady = true;

      // 全プレイヤーが選択完了したかチェック
      const allReady = Object.keys(G.players).every(pid => G.players[pid].isReady && G.players[pid].selectedCard);

      if (allReady) {
        // 手札から選択したカードを取り除く
        const revealed = [];
        for (let i = 0; i < ctx.numPlayers; i++) {
          const pid = i.toString();
          const p = G.players[pid];
          p.hand = p.hand.filter(c => c.number !== p.selectedCard.number);
          revealed.push({
            playerID: pid,
            card: p.selectedCard
          });
        }

        // 数字昇順にソートして解決キューを作成
        revealed.sort((a, b) => a.card.number - b.card.number);
        G.resolvingQueue = [...revealed];
        G.lastRevealedCards = [...revealed];
        G.turnStep = 'resolving';

        G.logs.unshift(`🃏 全員のカードが公開されました！ (最小: ${revealed[0].card.number}番 〜 最大: ${revealed[revealed.length - 1].card.number}番)`);

        // 最初のカードから配置処理を開始
        processNextResolvingCard(G, ctx);
      }
    },

    // どの列よりも小さいカードを出したプレイヤーが引き取る列を選択
    chooseRow: ({ G, ctx }, playerID, rowIndex) => {
      if (G.gameState !== 'playing' || G.turnStep !== 'choose_row') return;
      if (G.waitingForPlayer !== playerID) return;
      if (rowIndex < 0 || rowIndex >= 4) return;

      const nextItem = G.currentResolving;
      if (!nextItem || nextItem.playerID !== playerID) return;

      G.resolvingQueue.shift();

      const takenCards = [...G.rows[rowIndex]];
      const penaltyPoints = takenCards.reduce((sum, c) => sum + c.bullheads, 0);

      G.players[playerID].roundPenalty += penaltyPoints;
      G.players[playerID].penaltyCards.push(...takenCards);

      // 選んだ列を自分のカード1枚で置き換え
      G.rows[rowIndex] = [{ ...nextItem.card, playedBy: playerID }];

      G.recentBustEvent = {
        playerID,
        rowIdx: rowIndex,
        takenCards,
        placedCard: nextItem.card,
        penaltyPoints,
        isManualTake: true,
        id: Date.now()
      };

      G.logs.unshift(`⚡ Player ${playerID} が列 ${rowIndex + 1} を引き取りました（+${penaltyPoints}牛）！`);

      G.waitingForPlayer = null;
      G.currentResolving = null;
      G.turnStep = 'resolving';

      // 解決キューの次のカードを処理
      processNextResolvingCard(G, ctx);
    },

    // 次のラウンドを開始
    startNextRound: ({ G, ctx, random }) => {
      if (G.gameState !== 'round_end') return;
      G.round += 1;
      G.gameState = 'playing';
      setupRound(G, ctx, random);
      G.logs.unshift(`🔔 ラウンド ${G.round} がスタートしました！`);
    },

    // ゲームを最初からやり直す
    restartGame: ({ G, ctx, random }) => {
      G.gameState = 'lobby';
      G.round = 1;
      G.turn = 1;
      G.winner = null;
      G.rankings = [];
      G.logs = [];
      for (let i = 0; i < ctx.numPlayers; i++) {
        G.players[i.toString()] = {
          totalPenalty: 0,
          roundPenalty: 0,
          hand: [],
          selectedCard: null,
          isReady: false,
          penaltyCards: []
        };
      }
    }
  }
};
