const themes = [
  "無人島に持っていきたいもの", "人気の食べ物", "こわいもの", "なりたい職業", "強そうな動物",
  "テンションが上がること", "おにぎりの具の人気", "言われて嬉しい言葉", "かっこいい必殺技", "歴史上の人物の強さ",
  "一家に一台欲しいもの", "デートで行きたい場所", "小学生が好きなもの", "重いもの", "透明になったらやりたいこと",
  "100万円あったら買いたいもの", "もらって困るプレゼント", "一生に一度は経験したいこと", "ストレス解消法", "美味しいと思うお菓子の味",
  "生まれ変わったらなりたいもの", "休日によくやること", "絶対に笑ってしまうこと", "学生時代の思い出", "好きなスポーツ",
  "宝くじが当たったら", "お弁当に入っていると嬉しいおかず", "朝起きて一番にすること", "寝る前にすること", "カラオケでよく歌う曲",
  "行ってみたい国", "タイムマシンで行きたい時代", "無人島に持っていきたくないもの", "好きな映画のジャンル", "好きな言葉",
  "ペットにしたい動物", "超能力が使えるなら", "子供の頃の夢", "好きな給食のメニュー", "一番痛かった思い出",
  "好きなボードゲーム", "好きなテレビ番組", "休日の理想の過ごし方", "好きな寿司のネタ", "一番欲しいドラえもんの道具"
];

const getInitialState = (ctx, random, setupData) => {
  let deck = [];
  for (let i = 1; i <= 100; i++) deck.push(i);
  deck = random.Shuffle(deck);

  const players = {};
  for (let i = 0; i < ctx.numPlayers; i++) {
    players[i] = {
      hand: [deck.pop()]
    };
  }

  const customThemes = setupData?.customThemes || [];
  const themeMode = setupData?.themeMode || 'random';

  return {
    theme: null,
    themeMode,
    submittedThemes: [],
    players,
    playedCards: [],
    discardedCards: [],
    lives: 3,
    round: 1,
    deck,
    gameState: 'lobby', // Starts in lobby to collect themes
    nextMatchId: null,
    customThemes,
  };
};

export const Ito = {
  name: 'ito',
  
  setup: ({ ctx, random }, setupData) => getInitialState(ctx, random, setupData),

  turn: {
    activePlayers: { all: 'play' },
  },

  moves: {
    submitTheme: ({ G }, themeString) => {
      if (themeString.trim()) {
        G.submittedThemes.push(themeString.trim());
      }
    },
    startGame: ({ G, random }) => {
      if (G.gameState !== 'lobby') return;
      if (G.themeMode === 'manual' && G.submittedThemes.length > 0) {
        G.theme = G.submittedThemes[random.Die(G.submittedThemes.length) - 1];
      } else {
        const allThemes = [...themes, ...G.customThemes];
        G.theme = allThemes[random.Die(allThemes.length) - 1];
      }
      G.gameState = 'playing';
    },
    playCard: ({ G, ctx }, playerID, card) => {
      if (G.gameState !== 'playing' || !G.theme) return;
      
      const player = G.players[playerID];
      if (!player.hand.includes(card)) return;

      // Remove from hand
      player.hand = player.hand.filter(c => c !== card);

      // Check for failure (if anyone else has a smaller card)
      let failure = false;
      let discardedThisTurn = [];

      Object.keys(G.players).forEach(pid => {
        const p = G.players[pid];
        const lowerCards = p.hand.filter(c => c < card);
        if (lowerCards.length > 0) {
          failure = true;
          discardedThisTurn.push(...lowerCards);
          p.hand = p.hand.filter(c => c >= card);
        }
      });

      if (failure) {
        G.lives -= 1;
        G.discardedCards.push(...discardedThisTurn);
      }

      G.playedCards.push(card);

      // Check win/loss condition
      if (G.lives <= 0) {
        G.gameState = 'game_over';
      } else {
        const totalCardsLeft = Object.values(G.players).reduce((acc, p) => acc + p.hand.length, 0);
        if (totalCardsLeft === 0) {
          if (G.round >= 3) {
            G.gameState = 'game_clear';
          } else {
            G.gameState = 'round_clear';
          }
        }
      }
    },

    nextRound: ({ G, ctx, random }) => {
      if (G.gameState !== 'round_clear') return;
      
      G.round += 1;
      let deck = [];
      for (let i = 1; i <= 100; i++) deck.push(i);
      deck = random.Shuffle(deck);

      G.deck = deck;
      Object.keys(G.players).forEach(pid => {
        const hand = [];
        for (let i = 0; i < G.round; i++) {
          hand.push(deck.pop());
        }
        G.players[pid].hand = hand;
      });

      if (G.themeMode === 'manual' && G.submittedThemes.length > 0) {
        G.theme = G.submittedThemes[random.Die(G.submittedThemes.length) - 1];
      } else {
        const allThemes = [...themes, ...(G.customThemes || [])];
        G.theme = allThemes[random.Die(allThemes.length) - 1];
      }
      G.playedCards = [];
      G.discardedCards = [];
      G.gameState = 'playing';
    },

    proposeRematch: ({ G }, nextMatchId) => {
      G.nextMatchId = nextMatchId;
    }
  }
};
