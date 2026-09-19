export const haaThemes = [
  {
    word: "はぁ",
    situations: ["怒りの「はぁ」", "とぼける「はぁ」", "驚きの「はぁ」", "感心の「はぁ」", "怒られる「はぁ」", "力をためる「はぁ」", "ぼうぜんの「はぁ」", "失恋の「はぁ」"]
  },
  {
    word: "えー",
    situations: ["不満の「えー」", "なっとくの「えー」", "驚きの「えー」", "疑いの「えー」", "マジで？の「えー」", "いやいやの「えー」", "思い出しの「えー」", "がっかりの「えー」"]
  },
  {
    word: "なんで",
    situations: ["怒りの「なんで」", "悲しみの「なんで」", "喜びの「なんで」", "笑いながらの「なんで」", "絶望の「なんで」", "疑問の「なんで」", "あきれの「なんで」", "パニックの「なんで」"]
  },
  {
    word: "好き",
    situations: ["本命への「好き」", "冗談の「好き」", "アイドルへの「好き」", "嘘の「好き」", "感謝の「好き」", "親目線の「好き」", "自分勝手な「好き」", "慰めの「好き」"]
  },
  {
    word: "ヤバい",
    situations: ["感動の「ヤバい」", "ピンチの「ヤバい」", "美味しい「ヤバい」", "遅刻しそうな「ヤバい」", "笑いが止まらない「ヤバい」", "引いてる「ヤバい」", "かっこいい「ヤバい」", "秘密がバレた「ヤバい」"]
  }
];

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

const getInitialState = (ctx) => {
  const players = {};
  for (let i = 0; i < ctx.numPlayers; i++) {
    players[i.toString()] = { isReady: false, score: 0 };
  }
  
  return {
    gameState: 'lobby', // 'lobby', 'voting', 'results'
    players,
    theme: null,
    assignments: {}, // { '0': 'A', '1': 'C' }
    votes: {}, // { '0': { '1': 'A', '2': 'B' } }
    nextMatchId: null,
    usedThemes: [],
    results: null
  };
};

export const Haa = {
  name: 'haa',
  
  setup: ({ ctx }) => getInitialState(ctx),

  turn: {
    activePlayers: { all: 'play' }
  },

  moves: {
    startGame: ({ G, random, ctx }) => {
      if (G.gameState !== 'lobby' && G.gameState !== 'results') return;
      
      let availableThemes = haaThemes.filter(t => !G.usedThemes.includes(t.word));
      if (availableThemes.length === 0) availableThemes = haaThemes; // Fallback
      
      const pickedTheme = availableThemes[random.Die(availableThemes.length) - 1];
      G.usedThemes.push(pickedTheme.word);
      
      // format situations
      G.theme = {
        word: pickedTheme.word,
        situations: pickedTheme.situations.map((text, i) => ({ letter: LETTERS[i], text }))
      };
      
      // Assign unique letters to players
      let shuffledLetters = random.Shuffle(LETTERS);
      G.assignments = {};
      G.votes = {};
      for (let i = 0; i < ctx.numPlayers; i++) {
        const pid = i.toString();
        G.assignments[pid] = shuffledLetters[i];
        G.players[pid].isReady = false;
        G.votes[pid] = {}; // Initialize empty votes
      }
      
      G.results = null;
      G.gameState = 'voting';
    },

    setVote: ({ G }, targetID, letter) => {
      // Not allowed to vote in anything other than voting phase
      // Cannot vote for self
      if (G.gameState !== 'voting') return;
      return (playerID) => {
        if (targetID !== playerID) {
          G.votes[playerID][targetID] = letter;
        }
      };
    },
    
    // We need an explicit wrapper because moves usually take (context, ...args)
    // and if we use context.playerID we can just use the signature:
    submitVote: ({ G, playerID }, targetID, letter) => {
       if (G.gameState !== 'voting' || targetID === playerID) return;
       G.votes[playerID][targetID] = letter;
    },

    toggleReady: ({ G, playerID, ctx }) => {
      if (G.gameState !== 'voting') return;
      G.players[playerID].isReady = !G.players[playerID].isReady;
      
      // Check if everyone is ready
      const allReady = Object.values(G.players).every(p => p.isReady);
      if (allReady) {
        // Compute scores
        let roundResults = {};
        for (let i = 0; i < ctx.numPlayers; i++) {
           roundResults[i.toString()] = {
             actual: G.assignments[i.toString()],
             guessedBy: [],
             pointsEarned: 0
           };
        }
        
        for (let voter = 0; voter < ctx.numPlayers; voter++) {
          const vID = voter.toString();
          for (let actor = 0; actor < ctx.numPlayers; actor++) {
            const aID = actor.toString();
            if (vID === aID) continue;
            
            const guessed = G.votes[vID][aID];
            const actual = G.assignments[aID];
            if (guessed === actual) {
              // Voter gets 1 point
              G.players[vID].score += 1;
              // Actor gets 1 point
              G.players[aID].score += 1;
              
              roundResults[aID].guessedBy.push(vID);
              roundResults[aID].pointsEarned += 1;
              
              // track voter's points too for UI
              if (!roundResults[vID].pointsFromGuessing) roundResults[vID].pointsFromGuessing = 0;
              roundResults[vID].pointsFromGuessing += 1;
            }
          }
        }
        
        G.results = roundResults;
        G.gameState = 'results';
      }
    },

    proposeRematch: ({ G }, nextMatchId) => {
      G.nextMatchId = nextMatchId;
    }
  }
};
