const themes = [
  "無人島に持っていきたいもの",
  "人気の食べ物",
  "こわいもの",
  "なりたい職業",
  "強そうな動物",
  "テンションが上がること",
  "おにぎりの具の人気",
  "言われて嬉しい言葉",
  "かっこいい必殺技",
  "歴史上の人物の強さ",
  "一家に一台欲しいもの",
  "デートで行きたい場所",
  "小学生が好きなもの",
  "重いもの",
  "透明になったらやりたいこと"
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
  const allThemes = [...themes, ...customThemes];

  return {
    theme: allThemes[random.Die(allThemes.length) - 1],
    players,
    playedCards: [],
    discardedCards: [],
    lives: 3,
    round: 1,
    deck,
    gameState: 'playing', // 'playing', 'round_clear', 'game_over', 'game_clear'
    nextMatchId: null,
    customThemes, // Save them in state so nextRound can use them
  };
};

export const Ito = {
  name: 'ito',
  
  setup: ({ ctx, random }, setupData) => getInitialState(ctx, random, setupData),

  turn: {
    activePlayers: { all: 'play' },
  },

  moves: {
    playCard: ({ G, ctx }, playerID, card) => {
      if (G.gameState !== 'playing') return;
      
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

      const allThemes = [...themes, ...(G.customThemes || [])];
      G.theme = allThemes[random.Die(allThemes.length) - 1];
      G.playedCards = [];
      G.discardedCards = [];
      G.gameState = 'playing';
    },

    proposeRematch: ({ G }, nextMatchId) => {
      G.nextMatchId = nextMatchId;
    }
  }
};
