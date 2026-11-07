// src/data/lifeErasData.js - ニンテンドースイッチ風 5大時代（ライフステージ）データ定義

export const LIFE_ERAS = [
  {
    id: 1,
    key: 'childhood',
    name: '子ども時代',
    sub: '幼少期・小学生・のびのび成長期',
    icon: '👶',
    color: '#10b981',
    maxTurns: 4,
    spaces: [
      { id: 0, title: '【誕生と小学校入学】', desc: '桜咲く通学路！ピカピカのランドセルを背負って人生のスタート！', type: 'money', amount: 10, icon: '🎒' },
      { id: 1, title: '【近所の駄菓子屋】', desc: '10円ゲームで見事大当たり！お菓子山盛りサービス！', type: 'money', amount: 5, icon: '🍬' },
      { id: 2, title: '【図書館で猛勉強】', desc: '夏休みの自由研究と読書感想文で県知事賞受賞！知性向上！', type: 'study', amount: 20, icon: '📖' },
      { id: 3, title: '【わんぱく相撲・運動会】', desc: '圧倒的な俊足で徒競走1等賞！運動能力が大幅UP！', type: 'sports', amount: 10, icon: '🏃' },
      { id: 4, title: '【お年玉フィーバー】', desc: '親戚一同からたくさんのお年玉をもらいホクホク顔！', type: 'money', amount: 30, icon: '🧧' },
      { id: 5, title: '【ご近所の昔遊び】', desc: 'メンコとベーゴマで地域大会優勝！地域の人気者に！', type: 'money', amount: 10, icon: '🪀' },
      { id: 6, title: '【子ども科学実験教室】', desc: '自作ロボット工作コンテストで優秀賞！理科の才能開花！', type: 'study', amount: 25, icon: '🔬' },
      { id: 7, title: '【地元の夏祭り】', desc: '盆踊りと金魚すくいで大はしゃぎ！地元屋台で散財', type: 'money', amount: -10, icon: '🎆' },
      { id: 8, title: '【山・川の大冒険】', desc: '秘密基地作りとカブトムシ採集！自然の豊かさを満喫！', type: 'money', amount: 15, icon: '🌲' },
      { id: 9, title: '【ピアノ・習い事発表会】', desc: '猛練習の成果を発揮して大喝采を浴びる！', type: 'study', amount: 20, icon: '🎹' },
      { id: 10, title: '【わんぱくの代償】', desc: '木登りに失敗して生傷…近所の病院でお手当て費用', type: 'money', amount: -10, icon: '🩹' },
      { id: 11, title: '【少年スポーツ少年団】', desc: '県大会で優勝しチームメイトと歓喜の涙！', type: 'sports', amount: 20, icon: '⚽' },
      { id: 12, title: '【算数オリンピック挑戦】', desc: 'ひらめきが冴え渡り全国上位入賞！特別奨学金獲得！', type: 'study', amount: 30, icon: '📐' },
      { id: 13, title: '【家族で全国ご当地温泉旅行】', desc: '家族で全国名所へ小旅行！旅先のご当地名産品（お土産）とお祝い金を入手！', type: 'travel', amount: -15, icon: '♨️' },
      { id: 14, title: '【子どもお小遣い運用】', desc: '豚の貯金箱をコツコツ満杯にして臨時ボーナス利息！', type: 'money', amount: 20, icon: '🐖' },
      { id: 15, title: '【小学校卒業式】', desc: '6年間の思い出を胸に、立派に学び舎から巣立ち！', type: 'study', amount: 40, icon: '🎓' },
    ]
  },
  {
    id: 2,
    key: 'youth',
    name: '青年期',
    sub: '中高生・青春・受験・進路選択',
    icon: '🎓',
    color: '#38bdf8',
    maxTurns: 4,
    spaces: [
      { id: 0, title: '【中学・高校進学】', desc: '新しい制服と仲間たち！部活と青春の幕開け！', type: 'money', amount: 20, icon: '🏫' },
      { id: 1, title: '【学園祭のヒーロー】', desc: 'バンド演奏やクラス演劇で全校の大喝采を浴びる！', type: 'money', amount: 30, icon: '🎸' },
      { id: 2, title: '【塾・予備校で猛特訓】', desc: '深夜までの猛勉強！模試の判定が急上昇！', type: 'study', amount: 30, icon: '📝' },
      { id: 3, title: '【初めてのアルバイト】', desc: 'ファミレスとコンビニで社会の厳しさと楽しさを知る！', type: 'money', amount: 40, icon: '🏪' },
      { id: 4, title: '【部活のインターハイ激闘】', desc: '汗と涙の青春！全国大会の舞台で堂々の大活躍！', type: 'sports', amount: 30, icon: '🏆' },
      { id: 5, title: '【甘酸っぱい初恋】', desc: '放課後の告白！淡い青春の忘れられない思い出', type: 'money', amount: 20, icon: '💌' },
      { id: 6, title: '【難関資格取得に挑戦】', desc: 'ITパスポートや簿記検定に見事一発合格！', type: 'study', amount: 40, icon: '💻' },
      { id: 7, title: '【青春の修学旅行＆全国一人旅】', desc: '仲間と日本全国の名所へ！旅先のご当地名産品をゲットして見聞を広げる！', type: 'travel', amount: -20, icon: '🚄' },
      { id: 8, title: '【自動車免許取得】', desc: '教習所に通い第一種普通免許を取得！行動範囲が拡大！', type: 'money', amount: -30, icon: '🚗' },
      { id: 9, title: '【高校総体・コンクール入賞】', desc: '研ぎ澄まされた実力で表彰台に登る！', type: 'sports', amount: 35, icon: '🥇' },
      { id: 10, title: '【最新スマホ買い替え】', desc: '最新スマートフォンを購入！通信費とアプリ課金', type: 'money', amount: -15, icon: '📱' },
      { id: 11, title: '【ディープな趣味の世界】', desc: '熱中する趣味で全国の仲間と繋がりスキルアップ！', type: 'money', amount: 20, icon: '🎨' },
      { id: 12, title: '【全国統一模試】', desc: '努力が実を結び、第一志望校判定でA判定獲得！', type: 'study', amount: 50, icon: '📊' },
      { id: 13, title: '【成人式・20歳の集い】', desc: '旧友たちと再会し、大人の仲間入りを祝福！', type: 'money', amount: 40, icon: '👘' },
      { id: 14, title: '【合同企業説明会＆インターン】', desc: 'スーツに身を包み就活本番へ！面接対策万全！', type: 'study', amount: 30, icon: '👔' },
      { id: 15, title: '【運命の進路・就職関門】', desc: '青年期ラスト！自立か地方か、そして就職ルーレットへ挑む！', type: 'branch_career', amount: 0, icon: '🚩', stop: true },
    ]
  },
  {
    id: 3,
    key: 'adulthood_early',
    name: '大人時代・前半',
    sub: '社会人スタート・給料・結婚・マイホーム',
    icon: '💼',
    color: '#f472b6',
    maxTurns: 4,
    spaces: [
      { id: 0, title: '【社会人デビュー】', desc: '期待と緊張の入社式！初任給支給！', type: 'payday', icon: '🏢' },
      { id: 1, title: '【新人研修・現場研修】', desc: '先輩社員からビジネスのイロハを叩き込まれる！', type: 'money', amount: 30, icon: '📚' },
      { id: 2, title: '【初任給で親孝行】', desc: '初任給で両親をご馳走に招待！感謝の気持ちを伝える', type: 'money', amount: -20, icon: '💐' },
      { id: 3, title: '【定期昇給＆初ボーナス】', desc: '仕事ぶりが評価され査定アップ！定期給料日！', type: 'payday', icon: '💵' },
      { id: 4, title: '【マイホーム購入チャンス】', desc: '将来の安心と資産形成！夢のマイホームを手に入れるか？', type: 'buy_house', icon: '🏡', stop: true },
      { id: 5, title: '【運命の出会い・大恋愛】', desc: '生涯のパートナーと劇的な出会い！デートを重ねる', type: 'money', amount: -20, icon: '💖' },
      { id: 6, title: '【祝・華燭の典（結婚式）】', desc: '参列者からの温かい祝福とご祝儀！車に配偶者ピン追加！', type: 'marriage', icon: '💍', stop: true },
      { id: 7, title: '【新婚旅行・全国名所巡り】', desc: '夫婦で日本各地の憧れの観光地へハネムーン！旅先のご当地名産品（お土産）をゲット！', type: 'travel', amount: -30, icon: '✈️' },
      { id: 8, title: '【定期給料日＆決算賞与】', desc: '業績好調！定期給料と決算賞与をダブル受給！', type: 'payday', icon: '💰' },
      { id: 9, title: '【第1子誕生・子宝の恵み】', desc: '元気な産声！自治体と国からお祝い金！車に子供ピン追加！', type: 'baby', count: 1, amount: 100, icon: '🍼' },
      { id: 10, title: '【大型台風襲来】', desc: '猛烈な暴風雨で屋根瓦が破損！保険加入の有無で運命が分かれる！', type: 'typhoon', icon: '🌀' },
      { id: 11, title: '【副業・インデックス投資】', desc: 'コツコツ積み立てた資産運用と副業が大成功！', type: 'money', amount: 50, icon: '📈' },
      { id: 12, title: '【定期給料日】', desc: '家族と生活のために今日も全力投球！給料支給！', type: 'payday', icon: '💵' },
      { id: 13, title: '【第2子誕生・家族繁栄】', desc: '待望の二人目が誕生！車に子供ピン追加！お祝い金支給！', type: 'baby', count: 1, amount: 100, icon: '👶' },
      { id: 14, title: '【お盆の実家帰省】', desc: '家族を連れて故郷へ里帰り！両親からの仕送りと特産品！', type: 'homecoming', icon: '📦' },
      { id: 15, title: '【大人前半の総括】', desc: '若手から中堅へステップアップ！社内表彰と昇格金獲得！', type: 'money', amount: 80, icon: '🌟' },
    ]
  },
  {
    id: 4,
    key: 'adulthood_late',
    name: '大人時代・後半',
    sub: 'キャリア大勝負・昇進・帰省・定年退職',
    icon: '⚖️',
    color: '#c084fc',
    maxTurns: 4,
    spaces: [
      { id: 0, title: '【40代突入・管理職昇格】', desc: '部下を持ち重要プロジェクトを牽引！定期給料日！', type: 'payday', icon: '👔' },
      { id: 1, title: '【中年の岐路・キャリア勝負】', desc: '起業して大勝負に出るか、大企業で堅実に昇進を目指すか選択！', type: 'branch_midlife', icon: '⚖️', stop: true },
      { id: 2, title: '【役員・部長昇進試験】', desc: 'リーダーシップを発揮し見事合格！役員報酬アップ！', type: 'money', amount: 120, icon: '🎖️' },
      { id: 3, title: '【健康診断・人間ドック】', desc: '体のメンテナンスは必須！保険加入の有無をチェック！', type: 'health_check', icon: '🏥' },
      { id: 4, title: '【定期給料日】', desc: '円熟味を増したプロフェッショナル！高額給与を受給！', type: 'payday', icon: '💵' },
      { id: 5, title: '【子供の進路・大学進学】', desc: '子供がいる場合は大学学費を支援！子供がいない場合は自己投資でスキルアップ！', type: 'child_education', icon: '🎓' },
      { id: 6, title: '【地元実家のリフォーム】', desc: '両親のために実家をバリアフリー改修！親孝行の極み', type: 'money', amount: -50, icon: '🔨' },
      { id: 7, title: '【定期給料日】', desc: '長年の信用と実績が生み出す安定の高収入！', type: 'payday', icon: '💵' },
      { id: 8, title: '【故郷へ親孝行帰省】', desc: '故郷の温かい空気を吸い、郷土の味覚を家族で堪能！', type: 'homecoming', icon: '📦' },
      { id: 9, title: '【年末ジャンボ宝くじ大勝負】', desc: '運命の1等当せんを狙ってルーレット勝負！', type: 'lottery', icon: '🎰' },
      { id: 10, title: '【業界の重鎮・名誉職就任】', desc: '長年の業界貢献が認められ、特別功労金受給！', type: 'money', amount: 150, icon: '👑' },
      { id: 11, title: '【定期給料日】', desc: '現役最高峰の年収！定期給料支給！', type: 'payday', icon: '💵' },
      { id: 12, title: '【夫婦水入らずの全国ご当地名湯巡り】', desc: '子供たちも巣立ち、夫婦で全国の名湯をのんびり旅してご当地名産品をコレクション！', type: 'travel', amount: -30, icon: '♨️' },
      { id: 13, title: '【後輩育成と技術継承】', desc: '次世代を担う若手たちを温かく育成し指導手当獲得！', type: 'money', amount: 60, icon: '🤝' },
      { id: 14, title: '【定期給料日・現役ラスト】', desc: '最後の大型プロジェクトを完遂！現役最後の給料日！', type: 'payday', icon: '💵' },
      { id: 15, title: '【栄光の定年退職式典】', desc: '長年の勤続に心からの敬意を！全員に退職金支給！', type: 'retirement', icon: '🎖️', stop: true },
    ]
  },
  {
    id: 5,
    key: 'senior',
    name: 'シニア・老後時代',
    sub: '悠々自適セカンドライフ・年金・最終決算',
    icon: '🏰',
    color: '#facc15',
    maxTurns: 3,
    spaces: [
      { id: 0, title: '【セカンドライフ開幕】', desc: '時間に追われない優雅な朝！第2の人生がスタート！', type: 'pension', icon: '🌅' },
      { id: 1, title: '【家庭菜園・シルバー趣味】', desc: '自家製野菜が大豊作！ご近所に配って大感謝される', type: 'money', amount: 40, icon: '🥬' },
      { id: 2, title: '【お孫さん誕生・家族の絆】', desc: '子供がいるとお孫さん誕生でお祝い！子供がいない場合は看板ペットをお迎えして大人気！', type: 'grandchild_birth', icon: '🧸' },
      { id: 3, title: '【定期年金支給日】', desc: '国と自治体から手厚い年金を受給！ゆとりある生活', type: 'pension', icon: '👵' },
      { id: 4, title: '【地域ボランティア表彰】', desc: '長年の知恵と人脈で町内会を支え、自治体から表彰金受領！', type: 'money', amount: 50, icon: '🤝' },
      { id: 5, title: '【豪華全国周遊クルーズ＆ご当地美食旅】', desc: '生涯の憧れだった全国周遊の旅！各地の極上グルメと伝統工芸お土産を収集！', type: 'travel', amount: -40, icon: '🚢' },
      { id: 6, title: '【定期年金支給日】', desc: '安心・安全の年金受給日！穏やかな日々を過ごす', type: 'pension', icon: '👵' },
      { id: 7, title: '【お孫さんの入学祝い】', desc: '子供がいるとお孫さんへ入学祝い！子供がいない場合はシニア趣味で表彰！', type: 'grandchild_gift', icon: '🎁' },
      { id: 8, title: '【シニアスポーツ大会優勝】', desc: '毎日の散歩と体操の成果！ゲートボール大会で金メダル！', type: 'money', amount: 50, icon: '🥇' },
      { id: 9, title: '【ゴールド宝くじ大勝負】', desc: '老後の大勝負！幸運の女神が微笑むか！？', type: 'lottery', icon: '🎰' },
      { id: 10, title: '【定期年金支給日＆長寿祝い】', desc: '百寿・米寿の祝福金が県から特別贈呈！', type: 'pension', icon: '🎌' },
      { id: 11, title: '【故郷への恩返し・記念植樹】', desc: '生まれ育った故郷の森に記念植樹！郷土への感謝', type: 'homecoming', icon: '🌳' },
      { id: 12, title: '【我が人生に一片の悔いなし】', desc: '穏やかな夕日を眺め、波乱万丈の人生を振り返る感謝の時間', type: 'money', amount: 100, icon: '✨' },
      { id: 13, title: '【人生の栄光・グランドフィナーレ】', desc: '激動の人生を駆け抜けた全員の集大成！最終決算へ！', type: 'goal', icon: '🏁', stop: true },
    ]
  }
];

export const getEraById = (eraId) => {
  return LIFE_ERAS.find((e) => e.id === Number(eraId)) || LIFE_ERAS[0];
};

export const getAllSpacesFlat = () => {
  return LIFE_ERAS.flatMap((era) =>
    era.spaces.map((s) => ({
      ...s,
      eraId: era.id,
      eraName: era.name,
      globalId: `${era.id}-${s.id}`,
    }))
  );
};

// マスのお金の増減・上限・収支目安の算出関数
export const getSpaceMoneyDetails = (space, player = null) => {
  if (!space) return { badge: '', color: '#94a3b8', detail: '変動なし', maxLimit: 'なし' };

  switch (space.type) {
    case 'money': {
      const amt = space.amount || 0;
      return {
        badge: amt > 0 ? `+${amt}万` : `${amt}万`,
        color: amt > 0 ? '#34d399' : '#f87171',
        detail: amt > 0 ? `固定受取: +${amt}万円` : `固定支払: ${Math.abs(amt)}万円`,
        maxLimit: amt > 0 ? `上限: +${amt}万円` : `負担: ${Math.abs(amt)}万円`
      };
    }
    case 'study': {
      const amt = space.amount || 20;
      return {
        badge: `+${amt}万/学力`,
        color: '#34d399',
        detail: `奨励金: +${amt}万円（ハード時は偏差値+3）`,
        maxLimit: `上限: +${amt}万円`
      };
    }
    case 'sports': {
      const amt = space.amount || 20;
      return {
        badge: `+${amt}万/体力`,
        color: '#34d399',
        detail: `賞金: +${amt}万円（ハード時は偏差値+1）`,
        maxLimit: `上限: +${amt}万円`
      };
    }
    case 'payday': {
      let estSalary = player?.salary || (player?.occupation?.baseSalary || 130);
      if (player?.car?.spouse) estSalary += 20;
      if (player?.car?.kids) estSalary += player.car.kids * 15;
      return {
        badge: `給料 (+${estSalary}万~)`,
        color: '#34d399',
        detail: player?.occupation
          ? `現在給料: ${estSalary}万円（基本給${player.salary}万＋手当）`
          : '定期給料支給（初任給80〜220万、役職・家族手当で増額）',
        maxLimit: '給料上限: 550万円/回（ドクター・アイドル等）'
      };
    }
    case 'marriage': {
      return {
        badge: '祝儀 (+160万~)',
        color: '#f472b6',
        detail: '結婚ご祝儀（他プレイヤー全員から30万＋国から100万）',
        maxLimit: '上限目安: 人数×30万 + 100万円（最大+190万円）'
      };
    }
    case 'baby': {
      const count = space.count || 1;
      const bAmt = count * 100;
      return {
        badge: `祝金 (+${bAmt}万)`,
        color: '#f472b6',
        detail: `出産祝い金（国・自治体より+${bAmt}万円＆子供ピン追加）`,
        maxLimit: `上限: +${bAmt}万円`
      };
    }
    case 'child_education': {
      const hasKids = (player?.car?.kids || 0) > 0;
      if (hasKids) {
        const cost = player.car.kids * 40;
        return {
          badge: `学費 (-${cost}万)`,
          color: '#f87171',
          detail: `子供${player.car.kids}人の大学進学！学費支援（1人あたり-40万円）`,
          maxLimit: `学費負担: -${cost}万円`
        };
      }
      return {
        badge: '自己投資 (+30万)',
        color: '#34d399',
        detail: '子供なしのため自分の学びに集中！リスキリング成功手当 +30万円！',
        maxLimit: '手当受取: +30万円'
      };
    }
    case 'grandchild_birth': {
      const hasKids = (player?.car?.kids || 0) > 0;
      if (hasKids) {
        return {
          badge: 'お孫さん (-30万)',
          color: '#f87171',
          detail: 'お孫さん誕生！お祝いとおもちゃプレゼント（費用 -30万円）',
          maxLimit: '費用: -30万円'
        };
      }
      return {
        badge: '看板ペット (+20万)',
        color: '#34d399',
        detail: '癒やしの看板犬・猫をお迎え！ご近所からの差し入れ +20万円！',
        maxLimit: '受取: +20万円'
      };
    }
    case 'grandchild_gift': {
      const hasKids = (player?.car?.kids || 0) > 0;
      if (hasKids) {
        return {
          badge: '入学祝 (-20万)',
          color: '#f87171',
          detail: 'お孫さんの入学祝い！ランドセル・お祝い金（費用 -20万円）',
          maxLimit: '費用: -20万円'
        };
      }
      return {
        badge: '趣味表彰 (+30万)',
        color: '#34d399',
        detail: 'シルバーフェスタで長年の趣味が入賞！特別賞金 +30万円！',
        maxLimit: '賞金受取: +30万円'
      };
    }
    case 'buy_house': {
      return {
        badge: '物件 (900~2000万)',
        color: '#fb923c',
        detail: 'マイホーム購入（古民家900万、郊外1500万、都心2000万）',
        maxLimit: '価格帯: 900万〜2000万円（決算資産価値 1300万〜2400万円）'
      };
    }
    case 'branch_career': {
      return {
        badge: '進路 (+30/-20万)',
        color: '#38bdf8',
        detail: '進路決定（自立/上京:-20万円、地方/地元:+30万円）',
        maxLimit: '上限: 地元定着金 +30万円'
      };
    }
    case 'branch_midlife': {
      return {
        badge: 'キャリア (+30~80万)',
        color: '#c084fc',
        detail: '起業・昇進（ベンチャー起業:+80万円、堅実安定:+30万円）',
        maxLimit: '上限: ベンチャー出資金 +80万円'
      };
    }
    case 'health_check': {
      const hasIns = player?.insurance?.life;
      return {
        badge: hasIns ? '健診 (0円 保険済)' : '健診 (-20万)',
        color: hasIns ? '#38bdf8' : '#f87171',
        detail: hasIns ? '生命保険加入済みのため自己負担0円！' : '人間ドック検査費用 20万円（生命保険で無料）',
        maxLimit: '最大負担: 20万円（保険適用時は0円）'
      };
    }
    case 'typhoon': {
      const hasIns = player?.insurance?.fire;
      return {
        badge: hasIns ? '台風 (0円 保険済)' : '台風 (-50万)',
        color: hasIns ? '#38bdf8' : '#f87171',
        detail: hasIns ? '火災保険加入済みのため屋根修理代全額補償！' : '暴風雨被害修理費用 50万円（火災保険で無料）',
        maxLimit: '最大被害額: 50万円（保険適用時は0円）'
      };
    }
    case 'homecoming': {
      let hcMoney = player?.prefecture?.homecoming?.money || 50;
      if (player?.prefecture?.passiveType === 'rice_double') hcMoney *= 2;
      return {
        badge: `仕送り (+${hcMoney}万)`,
        color: '#34d399',
        detail: `実家からの仕送り+${hcMoney}万円＆故郷の名産品GET！（米俵・特産品）`,
        maxLimit: `上限: 実家仕送り +${hcMoney}万円`
      };
    }
    case 'lottery': {
      return {
        badge: '宝くじ (10~100万)',
        color: '#facc15',
        detail: '抽せんルーレット（出目8以上で1等100万円、それ以外10万円）',
        maxLimit: '上限: 1等当せん +100万円（最低でも+10万円）'
      };
    }
    case 'travel': {
      const cost = Math.abs(space.amount || 25);
      let note = `旅費 -${cost}万円`;
      if (player?.prefecture?.passiveType === 'real_estate_discount') note += '（北海道恩恵で常に+50万ボーナス）';
      if (player?.prefecture?.passiveType === 'amusement_bonus') note += '（千葉恩恵で+40万ボーナス）';
      if (player?.prefecture?.passiveType === 'onsen_heal_bonus') note += '（大分恩恵で+60万ボーナス）';
      if (player?.prefecture?.passiveType === 'udon_cost_saver') note = '（香川恩恵で旅費0円）';
      return {
        badge: '旅＆特産品',
        color: '#38bdf8',
        detail: `全国ご当地旅行！各地の名産品（資産価値80〜150万）獲得＆${note}`,
        maxLimit: `名産品価値: +80〜150万円（旅費: -${cost}万円）`
      };
    }
    case 'pension': {
      const pAmt = player?.prefecture?.passiveType === 'pension_boost' ? 150 : 100;
      return {
        badge: `年金 (+${pAmt}万)`,
        color: '#34d399',
        detail: `定期年金受給日: +${pAmt}万円`,
        maxLimit: '年金上限: +150万円/回（徳島県民ボーナス時）'
      };
    }
    case 'retirement': {
      return {
        badge: '退職金 (+500万~)',
        color: '#facc15',
        detail: '定年退職金支給（基本400万＋給与実績換算で約500万〜700万円）',
        maxLimit: '退職金目安: 500万〜750万円'
      };
    }
    case 'goal': {
      return {
        badge: 'ゴール (+100~500万)',
        color: '#facc15',
        detail: '着順賞金（1位:500万、2位:300万、3位以降:100万）',
        maxLimit: '1位最高賞金: +500万円'
      };
    }
    default: {
      return {
        badge: 'イベント',
        color: '#94a3b8',
        detail: space.desc || 'イベント発生',
        maxLimit: 'なし'
      };
    }
  }
};
