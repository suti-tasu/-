// src/data/lifeErasData.js - ニンテンドースイッチ風 5大時代（ライフステージ）データ定義
// 各時代 46〜66マス＆A/Bルート分岐システム＆最大値前提・ループ完全撤廃設計
// ターン規定：時代1〜4は各6ターン、時代5は4ターン（全28ターン）

export const LIFE_ERAS = [
  {
    id: 1,
    key: 'childhood',
    name: '子ども時代',
    sub: '幼少期・小学生・のびのび成長期',
    icon: '👶',
    color: '#10b981',
    maxTurns: 6, // 規定6ターン
    branchInfo: {
      branchSpaceId: 5,
      branchTitle: '【小学生の成長コース分岐点】',
      branchDesc: '放課後や休日の過ごし方を選択！文武両道で学力・特技を磨くか、大自然でわんぱくに遊ぶか！？',
      routes: {
        A: { key: 'A', name: '文武両道エリートコース', icon: '📖', desc: '科学実験・ピアノ・算数五輪！知性と才能を開花させる', start: 6, end: 25, color: '#38bdf8' },
        B: { key: 'B', name: 'わんぱく冒険・遊びコース', icon: '🌲', desc: '秘密基地・お年玉・夏祭り・温泉旅行！大自然を満喫', start: 26, end: 45, color: '#f59e0b' },
      },
      mergeSpaceId: 46
    },
    spaces: [
      // --- 共通スタート区間 (0〜4) ---
      { id: 0, title: '【誕生と小学校入学】', desc: '桜咲く通学路！ピカピカのランドセルを背負って人生のスタート！', type: 'money', amount: 10, icon: '🎒', route: 'common' },
      { id: 1, title: '【近所の駄菓子屋】', desc: '10円ゲームで見事大当たり！お菓子山盛りサービス！', type: 'money', amount: 5, icon: '🍬', route: 'common' },
      { id: 2, title: '【朝のラジオ体操皆勤賞】', desc: '毎朝早起きしてスタンプカード満杯！ご褒美文具セット獲得！', type: 'money', amount: 10, staminaDelta: 4, icon: '📻', route: 'common' },
      { id: 3, title: '【通学路でお手柄】', desc: '迷子の子犬を助けて飼い主から感謝の図書カード進呈！', type: 'money', amount: 15, academicDelta: 2, icon: '🐶', route: 'common' },
      { id: 4, title: '【深夜までゲーム＆アニメ三昧】', desc: '宿題を忘れて夜更かし続き…！寝不足で学力も体力もガクッと低下！', type: 'stat_down', amount: -10, academicDelta: -7, staminaDelta: -5, hensachiDelta: -2, icon: '🎮', route: 'common' },

      // --- 分岐点 (5) ---
      { id: 5, title: '【小学生の成長コース分岐点】', desc: '文武両道で才能を磨く「エリートコース」か、元気に遊ぶ「わんぱく冒険コース」か選択！', type: 'branch_route', icon: '🚩', stop: true, route: 'common' },

      // --- A: 文武両道エリートコース (6〜25) ---
      { id: 6, title: '【図書館で読書感想文・県知事賞】', desc: '夏休みの自由研究が県知事賞受賞！知性向上！', type: 'study', amount: 20, academicDelta: 7, hensachiDelta: 2, icon: '📖', route: 'A' },
      { id: 7, title: '【子ども科学実験教室】', desc: '自作ロボット工作コンテストで優秀賞！理科の才能開花！', type: 'study', amount: 25, academicDelta: 8, hensachiDelta: 3, icon: '🔬', route: 'A' },
      { id: 8, title: '【ピアノ・音楽発表会】', desc: '猛練習の成果を発揮して大喝采を浴びる！特別賞授与！', type: 'study', amount: 30, academicDelta: 7, hensachiDelta: 2, icon: '🎹', route: 'A' },
      { id: 9, title: '【算数オリンピック挑戦】', desc: 'ひらめきが冴え渡り金メダル！特別奨学金獲得！', type: 'study', amount: 35, academicDelta: 12, hensachiDelta: 5, icon: '📐', route: 'A' },
      { id: 10, title: '【少年スポーツ少年団】', desc: '県大会で優勝しチームメイトと歓喜の涙！運動能力大幅UP！', type: 'sports', amount: 25, staminaDelta: 10, icon: '⚽', route: 'A' },
      { id: 11, title: '【英検・そろばん検定合格】', desc: '集中力発揮！珠算検定と実用英検にスピード合格！', type: 'study', amount: 25, academicDelta: 8, hensachiDelta: 3, icon: '🧮', route: 'A' },
      { id: 12, title: '【名門私立中学受験対策特訓】', desc: '模擬試験で全国上位！努力が実を結び特待生資格を獲得！', type: 'study', amount: 30, academicDelta: 12, hensachiDelta: 5, staminaDelta: -3, icon: '📝', route: 'A' },
      { id: 13, title: '【児童会長就任・リーダーシップ】', desc: '全校生徒から圧倒的信頼！リーダーシップを発揮して表彰！', type: 'study', amount: 35, academicDelta: 9, hensachiDelta: 3, icon: '🏅', route: 'A' },
      { id: 14, title: '【全国絵画コンクール特選】', desc: '写生大会の作品が美術館に展示！お祝い金受取！', type: 'study', amount: 25, academicDelta: 6, hensachiDelta: 2, icon: '🎨', route: 'A' },
      { id: 15, title: '【水泳記録会で新記録樹立】', desc: '毎日の早朝スイミングで自己ベスト更新！体力満点！', type: 'sports', amount: 25, staminaDelta: 9, icon: '🏊', route: 'A' },
      { id: 16, title: '【将棋・チェス大会入賞】', desc: '先読みの才能開花！地域名人戦で敢闘賞受賞！', type: 'study', amount: 20, academicDelta: 8, hensachiDelta: 3, icon: '♟️', route: 'A' },
      { id: 17, title: '【習い事の月謝支払い】', desc: '学習塾と英会話の月謝で出費（でも基礎学力は着実にアップ！）', type: 'money', amount: -15, academicDelta: 4, icon: '💸', route: 'A' },
      { id: 18, title: '【自由研究で全国理科大賞】', desc: '身近な自然を観察した大作レポートが全国表彰！', type: 'study', amount: 35, academicDelta: 11, hensachiDelta: 4, icon: '🌿', route: 'A' },
      { id: 19, title: '【百人一首かるた大会制覇】', desc: '暗記力と俊敏さで全校かるた大会優勝！', type: 'study', amount: 20, academicDelta: 7, hensachiDelta: 2, staminaDelta: 3, icon: '📜', route: 'A' },
      { id: 20, title: '【塾の居眠り＆テストでミス連発】', desc: '疲労がたまり集中力が切れてケアレスミス連発…！成績と体力がダウン！', type: 'stat_down', amount: -10, academicDelta: -8, staminaDelta: -4, hensachiDelta: -3, icon: '💤', route: 'A' },
      { id: 21, title: '【子どもプログラミング大会入賞】', desc: '自作ゲームを開発して審査員特別賞を受賞！', type: 'study', amount: 35, academicDelta: 10, hensachiDelta: 4, icon: '💻', route: 'A' },
      { id: 22, title: '【全国ジュニアマラソン完走】', desc: '最後まで粘り強く走り抜きメダル獲得！', type: 'sports', amount: 25, staminaDelta: 11, icon: '🏃', route: 'A' },
      { id: 23, title: '【読書100冊達成記念】', desc: '学校の図書館の本を読破！校長先生から記念盾授与！', type: 'study', amount: 20, academicDelta: 8, hensachiDelta: 3, icon: '📚', route: 'A' },
      { id: 24, title: '【天才キッズとして地元TV取材】', desc: '地元ニュースで紹介され一躍街の有名人に！出演料獲得！', type: 'money', amount: 30, academicDelta: 5, hensachiDelta: 2, icon: '📺', route: 'A' },
      { id: 25, title: '【特待生奨学金の確定】', desc: 'これまでの優秀な成績により中学進学時の奨学金内定！', type: 'study', amount: 40, academicDelta: 12, hensachiDelta: 5, icon: '🎓', route: 'A' },

      // --- B: わんぱく冒険・遊びコース (26〜45) ---
      { id: 26, title: '【秘密基地作りと昆虫採集】', desc: '森の中に秘密基地完成！珍しいオオクワガタを捕獲して大喜び！', type: 'money', amount: 20, staminaDelta: 6, icon: '🌲', route: 'B' },
      { id: 27, title: '【お年玉フィーバー】', desc: '親戚一同からたくさんのお年玉をもらいホクホク顔！', type: 'money', amount: 35, icon: '🧧', route: 'B' },
      { id: 28, title: '【ご近所のメンコ・ベイブレード】', desc: '昔遊びで地域大会無敗！遊びに熱中してちょっぴり勉強おろそかに', type: 'money', amount: 15, academicDelta: -3, staminaDelta: 3, icon: '🪀', route: 'B' },
      { id: 29, title: '【地元の夏祭り屋台巡り】', desc: '盆踊りと金魚すくいで大はしゃぎ！地元屋台で散財', type: 'money', amount: -10, staminaDelta: 2, icon: '🎆', route: 'B' },
      { id: 30, title: '【家族で全国ご当地温泉旅行】', desc: '家族で全国名所へ小旅行！旅先のご当地名産品とお祝い金を入手！', type: 'travel', amount: -15, icon: '♨️', route: 'B' },
      { id: 31, title: '【川の大冒険・巨大魚釣り】', desc: '自作の釣り竿で大物を釣り上げ、近所のおじさんからお小遣い！', type: 'money', amount: 25, staminaDelta: 6, icon: '🎣', route: 'B' },
      { id: 32, title: '【真夏の炎天下で熱中症ダウン】', desc: '外で遊びすぎて脱水症状…！しばらく運動も勉強もお休みに', type: 'stat_down', amount: -20, staminaDelta: -9, academicDelta: -4, icon: '🥵', route: 'B' },
      { id: 33, title: '【豚の貯金箱満杯・大入り利息】', desc: 'コツコツ貯めた小銭がいっぱいに！臨時ボーナス受領！', type: 'money', amount: 25, icon: '🐖', route: 'B' },
      { id: 34, title: '【雪合戦＆巨大かまくら作り】', desc: '冬の大決戦！みんなで温かいお汁粉を食べてポカポカ！', type: 'money', amount: 15, staminaDelta: 6, icon: '⛄', route: 'B' },
      { id: 35, title: '【ドッジボール大会で大活躍】', desc: '最後の1人まで残り大逆転！体育館は大歓声！', type: 'sports', amount: 25, staminaDelta: 11, icon: '🏐', route: 'B' },
      { id: 36, title: '【自転車で遠くの町まで大冒険】', desc: '友達と隣町までサイクリング！未知の世界を探検！', type: 'money', amount: 15, staminaDelta: 8, icon: '🚲', route: 'B' },
      { id: 37, title: '【近所のお手伝いでお小遣い】', desc: '庭の草むしりや雪かきを手伝って感謝の謝礼受領！', type: 'money', amount: 20, staminaDelta: 4, icon: '🧹', route: 'B' },
      { id: 38, title: '【ミニ四駆・ホビーカスタム】', desc: 'パーツを買い足して最速マシンに改造！宿題忘れて没頭！', type: 'money', amount: -15, academicDelta: -4, icon: '🏎️', route: 'B' },
      { id: 39, title: '【泥んこ田植え体験】', desc: '地元農家で農業体験！美味しいお米とおにぎりをもらう！', type: 'money', amount: 20, staminaDelta: 6, icon: '🌾', route: 'B' },
      { id: 40, title: '【宝探しマップ作り】', desc: '宝の地図を作って公園に隠す！お宝発掘で大興奮！', type: 'money', amount: 15, staminaDelta: 4, icon: '🗺️', route: 'B' },
      { id: 41, title: '【全国名産フルーツ狩りツアー】', desc: 'イチゴやぶどうをお腹いっぱい食べる！ご当地名産品獲得！', type: 'travel', amount: -15, icon: '🍓', route: 'B' },
      { id: 42, title: '【拾った小銭を交番へ】', desc: '落とし物を届けて感謝状と記念グッズをもらう！', type: 'money', amount: 15, icon: '👮', route: 'B' },
      { id: 43, title: '【ツリーハウスの秘密基地】', desc: '廃材を集めて本格的なツリーハウス完成！遊びの天才！', type: 'money', amount: 20, staminaDelta: 7, academicDelta: -2, icon: '🏡', route: 'B' },
      { id: 44, title: '【落とし物！お小遣い紛失騒動】', desc: 'ポケットに穴が空いてお小遣いを落としてしまった…！', type: 'money', amount: -20, icon: '💸', route: 'B' },
      { id: 45, title: '【わんぱく仲間との大宴会】', desc: 'カレーライス作り大成功！みんなで最高の思い出作り！', type: 'money', amount: 25, staminaDelta: 5, icon: '🍛', route: 'B' },

      // --- 共通合流・卒業クライマックス区間 (46〜65) ---
      { id: 46, title: '【小学校大運動会アンカー激走】', desc: '圧倒的な俊足で逆転の白星！全校のヒーローに！', type: 'sports', amount: 25, staminaDelta: 9, icon: '🏃', route: 'common' },
      { id: 47, title: '【林間学校・キャンプファイヤー】', desc: '炎を囲んでフォークダンス！仲間との絆が最高潮！', type: 'money', amount: 20, staminaDelta: 3, icon: '🔥', route: 'common' },
      { id: 48, title: '【校内合唱コンクール指揮者】', desc: 'クラス全員の歌声が一つになり見事最優秀賞！', type: 'study', amount: 25, academicDelta: 5, hensachiDelta: 2, icon: '🎵', route: 'common' },
      { id: 49, title: '【全国修学旅行・歴史探訪】', desc: '京都・奈良や東京へ！日本の歴史と文化に触れて名産品獲得！', type: 'travel', amount: -20, icon: '🏯', route: 'common' },
      { id: 50, title: '【修学旅行・夜の枕投げと語らい】', desc: '消灯後に将来の夢を語り合い、一生の親友と誓い合う！', type: 'money', amount: 20, icon: '🛌', route: 'common' },
      { id: 51, title: '【虫歯＆夜更かしマンガ沼】', desc: 'お菓子を食べすぎて虫歯＆夜更かし！痛い治療で体力も学力もダウン', type: 'stat_down', amount: -15, academicDelta: -5, staminaDelta: -6, icon: '🦷', route: 'common' },
      { id: 52, title: '【卒業記念制作・大壁画完成】', desc: '学び舎の壁にみんなの手形アート！一生残る記念碑！', type: 'study', amount: 25, icon: '🎨', route: 'common' },
      { id: 53, title: '【タイムカプセル埋設式典】', desc: '10年後の自分へ手紙と宝物を封入！記念品受領！', type: 'money', amount: 25, icon: '⏳', route: 'common' },
      { id: 54, title: '【卒業文集『将来の夢』執筆】', desc: '堂々たる夢の作文が文集の巻頭を飾る！', type: 'study', amount: 25, icon: '🖋️', route: 'common' },
      { id: 55, title: '【先生からの心温まる通信簿】', desc: '「6年間よく頑張りました」先生からの温かい言葉と記念ペン！', type: 'money', amount: 20, icon: '📖', route: 'common' },
      { id: 56, title: '【小学校卒業記念旅行】', desc: '家族でご当地の名湯へ！小学校卒業のお祝い金受取！', type: 'travel', amount: -15, icon: '♨️', route: 'common' },
      { id: 57, title: '【幼馴染との約束】', desc: '別の中学へ進む友と「大人になっても集まろう」と乾杯！', type: 'money', amount: 20, icon: '🤝', route: 'common' },
      { id: 58, title: '【春休みの自転車一人旅】', desc: '少し大人になった気分で隣県まで小旅行！名産品発見！', type: 'travel', amount: -15, icon: '🚲', route: 'common' },
      { id: 59, title: '【親戚一同からの卒業祝い金】', desc: 'ランドセル姿の見納めに親戚からたくさんのお祝い！', type: 'money', amount: 35, icon: '🧧', route: 'common' },
      { id: 60, title: '【新しい制服の採寸】', desc: '少し大きめの中学校の学生服・セーラー服を試着！身が引き締まる！', type: 'money', amount: -20, icon: '👔', route: 'common' },
      { id: 61, title: '【部活見学と未来の憧れ】', desc: '先輩たちの迫力ある部活に感動！入部したい部活が決定！', type: 'sports', amount: 20, icon: '🏸', route: 'common' },
      { id: 62, title: '【中学校の教科書受領】', desc: '分厚い英語や数学の教科書！新しい学びへの好奇心！', type: 'study', amount: 25, icon: '📘', route: 'common' },
      { id: 63, title: '【小学校卒業アルバム受領】', desc: '一生の笑顔が詰まったアルバム！宝物の思い出！', type: 'money', amount: 25, icon: '📷', route: 'common' },
      { id: 64, title: '【小学校卒業式】', desc: '涙と笑顔の旅立ち！6年間の思い出を胸に学び舎を巣立つ！', type: 'study', amount: 40, icon: '🎓', route: 'common' },
      { id: 65, title: '【子ども時代・卒業大団円ゴール】', desc: '子ども時代見事修了！立派に成長し青年期へ進級！卒業お祝い金 +50万円 授与！', type: 'era_goal', amount: 50, icon: '🏁', stop: true, route: 'common' },
    ]
  },
  {
    id: 2,
    key: 'youth',
    name: '青年期',
    sub: '中高生・青春・受験・進路選択',
    icon: '🎓',
    color: '#38bdf8',
    maxTurns: 6, // 規定6ターン
    branchInfo: {
      branchSpaceId: 5,
      branchTitle: '【青春の進路・コース分岐点】',
      branchDesc: '高校生活の方向性を選択！難関大進学・資格取得の「アカデミックコース」か、部活・バイト・青春実戦の「スキルコース」か！？',
      routes: {
        A: { key: 'A', name: 'アカデミック進学＆難関資格コース', icon: '📝', desc: '予備校・模試・国家資格！偏差値と学問を極める', start: 6, end: 25, color: '#818cf8' },
        B: { key: 'B', name: '青春バイト＆部活実戦コース', icon: '🎸', desc: 'バイト・免許合宿・インターハイ・全国旅行！行動力抜群', start: 26, end: 45, color: '#38bdf8' },
      },
      mergeSpaceId: 46
    },
    spaces: [
      // --- 共通スタート区間 (0〜4) ---
      { id: 0, title: '【中学・高校進学】', desc: '新しい制服と仲間たち！部活と青春の幕開け！', type: 'money', amount: 20, icon: '🏫', route: 'common' },
      { id: 1, title: '【学園祭のヒーロー】', desc: 'バンド演奏やクラス演劇で全校の大喝采を浴びる！', type: 'money', amount: 30, icon: '🎸', route: 'common' },
      { id: 2, title: '【甘酸っぱい初恋】', desc: '放課後の告白！淡い青春の忘れられない思い出', type: 'money', amount: 20, icon: '💌', route: 'common' },
      { id: 3, title: '【スマホ・SNS依存で昼夜逆転生活】', desc: '動画とSNSを見続けて昼夜逆転…！授業も体育もボロボロで学力・体力・偏差値が大幅ダウン！', type: 'stat_down', amount: -20, academicDelta: -8, staminaDelta: -7, hensachiDelta: -3, icon: '📱', route: 'common' },
      { id: 4, title: '【全国統一模試】', desc: '日頃の努力が実を結び、第一志望校判定でA判定獲得！', type: 'study', amount: 30, academicDelta: 10, hensachiDelta: 4, icon: '📊', route: 'common' },

      // --- 分岐点 (5) ---
      { id: 5, title: '【青春の進路・コース分岐点】', desc: '受験と資格に没頭する「アカデミックコース」か、部活とバイトで青春を謳歌する「実戦コース」か選択！', type: 'branch_route', icon: '🚩', stop: true, route: 'common' },

      // --- A: アカデミック進学＆難関資格コース (6〜25) ---
      { id: 6, title: '【有名予備校で猛特訓】', desc: '深夜までの猛勉強！模試の偏差値が急上昇！', type: 'study', amount: 30, academicDelta: 10, hensachiDelta: 4, staminaDelta: -4, icon: '📝', route: 'A' },
      { id: 7, title: '【ITパスポート＆基本情報技術者合格】', desc: '情報技術者試験に見事一発合格！ITスキル向上！', type: 'study', amount: 35, academicDelta: 9, hensachiDelta: 3, icon: '💻', route: 'A' },
      { id: 8, title: '【海外短期語学留学】', desc: '世界各国の仲間と異文化交流！グローバル視野を獲得！', type: 'study', amount: -25, academicDelta: 8, hensachiDelta: 3, icon: '✈️', route: 'A' },
      { id: 9, title: '【高校生ビジネスコンテスト最優秀賞】', desc: '革新的なアイデアで全国優勝！賞金獲得！', type: 'money', amount: 45, academicDelta: 6, hensachiDelta: 2, icon: '💡', route: 'A' },
      { id: 10, title: '【第一志望大学に特待生合格】', desc: '努力が最高の栄冠をもたらす！授業料免除＆特別奨学金受給！', type: 'study', amount: 50, academicDelta: 12, hensachiDelta: 5, icon: '🎓', route: 'A' },
      { id: 11, title: '【大学ゼミの研究論文表彰】', desc: '学会発表で若手研究者奨励賞を受賞！', type: 'study', amount: 40, academicDelta: 9, hensachiDelta: 4, icon: '📑', route: 'A' },
      { id: 12, title: '【難関国家資格（簿記1級・宅建）合格】', desc: '社会に出る前に強力な武器を獲得！就活無双確定！', type: 'study', amount: 45, academicDelta: 11, hensachiDelta: 4, icon: '📜', route: 'A' },
      { id: 13, title: '【学術シンポジウムで英語プレゼン】', desc: '国際学会で流暢な英語発表！教授陣から大絶賛！', type: 'study', amount: 40, academicDelta: 9, hensachiDelta: 3, icon: '🎤', route: 'A' },
      { id: 14, title: '【徹夜続きで体調崩壊・点滴通院】', desc: '期末試験前の無理がたたり高熱ダウン…！体力ガタ落ち＆頭も働かず学力ダウン', type: 'stat_down', amount: -25, staminaDelta: -11, academicDelta: -4, hensachiDelta: -2, icon: '🏥', route: 'A' },
      { id: 15, title: '【専門書・高額テキスト購入】', desc: '専門分野の洋書や学術書を大人買い！知識がぐんと深まる', type: 'money', amount: -20, academicDelta: 5, hensachiDelta: 2, icon: '📚', route: 'A' },
      { id: 16, title: '【産学共同研究プロジェクト参画】', desc: '大手メーカーと共同開発！特許申請に貢献！', type: 'study', amount: 50, academicDelta: 10, hensachiDelta: 4, icon: '🔬', route: 'A' },
      { id: 17, title: '【難関公認会計士・司法予備試験模試1位】', desc: '全国模試でトップ！合格確実の太鼓判！', type: 'study', amount: 45, academicDelta: 14, hensachiDelta: 6, staminaDelta: -3, icon: '⚖️', route: 'A' },
      { id: 18, title: '【資格試験の受験料＆テキスト代】', desc: '難関国家資格の出願費用と模擬試験代で財布がピンチ！', type: 'money', amount: -20, academicDelta: 4, icon: '💸', route: 'A' },
      { id: 19, title: '【研究助成金の獲得】', desc: '文部科学省の学生研究助成金を獲得！研究費支給！', type: 'study', amount: 40, academicDelta: 9, hensachiDelta: 3, icon: '💰', route: 'A' },
      { id: 20, title: '【知性派クイズ番組で賞金獲得】', desc: 'テレビの学生クイズ選手権で優勝！賞金受領！', type: 'money', amount: 50, academicDelta: 6, hensachiDelta: 2, icon: '📺', route: 'A' },
      { id: 21, title: '【教授推薦の海外フェローシップ】', desc: '名門海外大学での客員研究員プログラム選抜！', type: 'study', amount: 45, academicDelta: 10, hensachiDelta: 4, icon: '🌍', route: 'A' },
      { id: 22, title: '【学術誌への論文採択】', desc: '国際査読付きジャーナルに筆頭著者として掲載！', type: 'study', amount: 50, academicDelta: 12, hensachiDelta: 5, icon: '📄', route: 'A' },
      { id: 23, title: '【学長賞・総代としての卒業内定】', desc: '学部首席の栄誉！卒業式総代に選出！', type: 'study', amount: 50, academicDelta: 12, hensachiDelta: 5, icon: '🎖️', route: 'A' },
      { id: 24, title: '【外資・シンクタンクからの特別オファー】', desc: '卓越した頭脳に国内外のトップ企業からスカウト殺到！', type: 'study', amount: 50, academicDelta: 10, hensachiDelta: 4, icon: '💼', route: 'A' },
      { id: 25, title: '【学問の道・揺るぎなき知性】', desc: '培った専門知識を胸に、いざ社会の第一線へ！', type: 'study', amount: 40, academicDelta: 8, hensachiDelta: 3, icon: '🌟', route: 'A' },

      // --- B: 青春バイト＆部活実戦コース (26〜45) ---
      { id: 26, title: '【人気カフェ・居酒屋でバイト三昧】', desc: '接客術とコミュ力爆上がり！シフト入れすぎで勉強時間は少なめ', type: 'money', amount: 30, staminaDelta: 4, academicDelta: -3, icon: '☕', route: 'B' },
      { id: 27, title: '【自動車運転免許合宿】', desc: '友達と地方合宿！一発合格で免許証ゲット！', type: 'money', amount: -25, icon: '🚗', route: 'B' },
      { id: 28, title: '【部活動で全国インターハイ出場】', desc: '血のにじむ特訓が結実！全国大会の大舞台で躍動！', type: 'sports', amount: 40, staminaDelta: 14, icon: '🏆', route: 'B' },
      { id: 29, title: '【青春18きっぷ・日本縦断一人旅】', desc: 'ガタゴト列車で全国へ！旅先のご当地名産品を獲得！', type: 'travel', amount: -15, staminaDelta: 4, icon: '🚆', route: 'B' },
      { id: 30, title: '【学園祭実行委員長として大成功】', desc: '前代未聞の来場者数を記録！圧倒的統率力で表彰！', type: 'money', amount: 35, staminaDelta: 4, icon: '🎪', route: 'B' },
      { id: 31, title: '【推し活・全国遠征ライブで大散財】', desc: '限定グッズと遠征宿泊費で預金残高が激減…授業も休みがちに！', type: 'money', amount: -30, academicDelta: -5, staminaDelta: -3, icon: '🎤', route: 'B' },
      { id: 32, title: '【サークル仲間と富士登山】', desc: 'ご来光に全員で感涙！一生モノの友情を誓う！', type: 'sports', amount: 30, staminaDelta: 11, icon: '🗻', route: 'B' },
      { id: 33, title: '【スキー場リゾートバイト】', desc: '滑り放題＆生活費タダ！貯金と体力がガッツリ増える！', type: 'money', amount: 35, staminaDelta: 6, icon: '⛷️', route: 'B' },
      { id: 34, title: '【深夜のカラオケオール＆単位ピンチ】', desc: '朝まで騒ぎすぎて翌日全休！体力も学力も偏差値もゴッソリ低下！', type: 'stat_down', amount: -15, staminaDelta: -7, academicDelta: -9, hensachiDelta: -3, icon: '🎤', route: 'B' },
      { id: 35, title: '【路上ライブでファン急増】', desc: '駅前弾き語りで人だかり！投げ銭とおひねり獲得！', type: 'money', amount: 30, icon: '🎸', route: 'B' },
      { id: 36, title: '【ヒッチハイクで全国制覇】', desc: '人の温かさに触れる大冒険！ご当地名産品ゲット！', type: 'travel', amount: -10, staminaDelta: 5, icon: '👍', route: 'B' },
      { id: 37, title: '【居酒屋バイトリーダー就任】', desc: 'バイトのシフト管理も完璧！特別手当支給！', type: 'money', amount: 30, staminaDelta: 4, icon: '🍺', route: 'B' },
      { id: 38, title: '【部活サボり＆運動不足で体なまる】', desc: 'ダラダラ過ごして筋力も集中力もダウン…！さらに原付の反則金まで支払い！', type: 'stat_down', amount: -20, staminaDelta: -10, academicDelta: -3, icon: '🛋️', route: 'B' },
      { id: 39, title: '【バイクツーリングで海岸線爆走】', desc: '風を感じて岬へ！ご当地海の幸を堪能！', type: 'travel', amount: -15, icon: '🏍️', route: 'B' },
      { id: 40, title: '【地元のお祭り神輿担ぎ】', desc: '威勢のいい掛け声で町中を練り歩く！ご祝儀＆体力UP！', type: 'money', amount: 25, staminaDelta: 6, icon: '🏮', route: 'B' },
      { id: 41, title: '【マリンスポーツ・サーフィン挑戦】', desc: '波を乗りこなして爽快！体力と度胸がアップ！', type: 'sports', amount: 25, staminaDelta: 9, icon: '🏄', route: 'B' },
      { id: 42, title: '【フットサル大会で優勝】', desc: '仲間との息の合ったパスワークで大会制覇！賞金受取！', type: 'sports', amount: 30, staminaDelta: 10, icon: '⚽', route: 'B' },
      { id: 43, title: '【イベント司会で大ウケ】', desc: '軽妙なトークで会場を沸かせプロ並みの謝礼！', type: 'money', amount: 30, icon: '🎙️', route: 'B' },
      { id: 44, title: '【SNS動画が大バズり】', desc: '青春の日常動画が100万再生！広告収入ゲット！', type: 'money', amount: 40, academicDelta: -2, icon: '📱', route: 'B' },
      { id: 45, title: '【圧倒的現場力・バイタリティ】', desc: 'どんな修羅場も笑顔で乗り切る人間力と体力を完成！', type: 'money', amount: 35, staminaDelta: 8, icon: '💪', route: 'B' },

      // --- 共通合流・進路就活クライマックス区間 (46〜65) ---
      { id: 46, title: '【大学祭・後夜祭のキャンプファイヤー】', desc: '肩を組んで歌い明かす！青春の最高潮！', type: 'money', amount: 25, icon: '🔥', route: 'common' },
      { id: 47, title: '【全国温泉地での卒業旅行】', desc: '親友たちと全国名所へ！旅先のご当地名産品を獲得！', type: 'travel', amount: -20, icon: '♨️', route: 'common' },
      { id: 48, title: '【リクルートスーツ新調】', desc: '就活に向けてビシッと勝負服を購入！', type: 'money', amount: -25, icon: '👔', route: 'common' },
      { id: 49, title: '【合同企業説明会】', desc: '多数の企業ブースを回り社会の仕組みを学ぶ！', type: 'study', amount: 25, icon: '🏢', route: 'common' },
      { id: 50, title: '【インターンシップで高評価】', desc: '実務課題で抜群の成果！早期選考パスを獲得！', type: 'study', amount: 30, icon: '💼', route: 'common' },
      { id: 51, title: '【全国就活遠征・新幹線代の嵐】', desc: '東京・大阪への面接往復で交通費とホテル代が激しい出費…！', type: 'money', amount: -30, icon: '🚄', route: 'common' },
      { id: 52, title: '【グループディスカッション突破】', desc: '鋭いファシリテーションで審査員を唸らせる！', type: 'study', amount: 25, icon: '🗣️', route: 'common' },
      { id: 53, title: '【役員最終面接の手応え】', desc: 'これまでの人生の歩みを堂々とアピール！', type: 'study', amount: 30, icon: '🎯', route: 'common' },
      { id: 54, title: '【卒業論文の口頭試問パス】', desc: '集大成の研究発表を完遂！晴れて単位取得確定！', type: 'study', amount: 30, icon: '📑', route: 'common' },
      { id: 55, title: '【自動車の初心者マーク卒業】', desc: '安全運転でドライブ技術向上！家族を乗せて温泉へ！', type: 'travel', amount: -15, icon: '🚗', route: 'common' },
      { id: 56, title: '【友人の結婚式ラッシュでご祝儀貧乏】', desc: '大学時代の仲間が次々ゴールイン！温かい祝福とお祝い金出費！', type: 'money', amount: -30, icon: '💒', route: 'common' },
      { id: 57, title: '【一人暮らしの部屋探し】', desc: '敷金礼金と家電の準備！社会人生活へのワクワク！', type: 'money', amount: -30, icon: '🔑', route: 'common' },
      { id: 58, title: '【親への感謝の初任給プレゼント予約】', desc: '育ててくれた両親へ感謝の手紙と旅行券を準備！', type: 'money', amount: 20, icon: '💌', route: 'common' },
      { id: 59, title: '【内定者懇親会】', desc: '同期の仲間と意気投合！これからの挑戦に胸を躍らせる！', type: 'money', amount: 20, icon: '🥂', route: 'common' },
      { id: 60, title: '【成人式・晴れ着の誓い】', desc: '地元の成人式！旧友と再会し親戚からお祝い金受取！', type: 'money', amount: 35, icon: '👘', route: 'common' },
      { id: 61, title: '【大学・専門学校の卒業式】', desc: '学び舎に別れを告げ、いよいよ社会の大海原へ！', type: 'study', amount: 35, icon: '🎓', route: 'common' },
      { id: 62, title: '【卒業謝恩会パーティー】', desc: 'お世話になった恩師へ感謝の花束！記念品受贈！', type: 'money', amount: 25, icon: '💐', route: 'common' },
      { id: 63, title: '【社会人スタートの準備万端】', desc: '名刺入れと腕時計を新調！大人の第一歩！', type: 'money', amount: 20, icon: '⌚', route: 'common' },
      { id: 64, title: '【運命の就職内定確定】', desc: '努力が実を結び、志望企業への正式内定を確定！', type: 'study', amount: 40, icon: '🤝', route: 'common' },
      { id: 65, title: '【青年期・大団円ゴール】', desc: '青年期を見事駆け抜けた！大人の社会人へ！卒業お祝い金 +50万円 授与！', type: 'era_goal', amount: 50, icon: '🏁', stop: true, route: 'common' },
    ]
  },
  {
    id: 3,
    key: 'adulthood_early',
    name: '壮年期',
    sub: '社会人・結婚・マイホーム・キャリア形成',
    icon: '💼',
    color: '#f59e0b',
    maxTurns: 6, // 規定6ターン
    branchInfo: {
      branchSpaceId: 5,
      branchTitle: '【大人のライフスタイル分岐点】',
      branchDesc: '人生の拠点をどこに置くか？温かい家庭を築く「マイホーム＆ファミリーコース」か、都心で稼ぎまくる「都会派バリキャリコース」か！？',
      routes: {
        A: { key: 'A', name: 'マイホーム＆ファミリー繁栄コース', icon: '🏡', desc: '一軒家購入・家族旅行・子育て！愛と温もりに満ちた人生', start: 6, end: 25, color: '#10b981' },
        B: { key: 'B', name: '都会派バリキャリ＆資産形成コース', icon: '🏢', desc: 'タワマン・海外出張・投資運用・高級車！富と地位を極める', start: 26, end: 45, color: '#f59e0b' },
      },
      mergeSpaceId: 46
    },
    spaces: [
      // --- 共通スタート区間 (0〜4) ---
      { id: 0, title: '【社会人デビュー＆初給料日】', desc: '初めての本格的な給料！自分の力で稼いだ実感が湧く！', type: 'salary', icon: '💴', route: 'common' },
      { id: 1, title: '【新入社員研修でのMVP表彰】', desc: '抜群のチームワークと提案力で新人研修トップ表彰！特別報奨金＋スピード昇進！', type: 'money', amount: 100, promoteDelta: 1, icon: '🏅', route: 'common' },
      { id: 2, title: '【運命の出会い・プロポーズ】', desc: '生涯を共にしたい最高のパートナーと出会い結婚！お祝い金受領！', type: 'marriage', amount: 150, icon: '💍', route: 'common' },
      { id: 3, title: '【おめでた！出産・赤ちゃんの誕生】', desc: '家族が増えて笑顔満開！既婚なら子どもピン追加＆出産祝い金を受領！（未婚時はお祝い参列）', type: 'baby', amount: 120, icon: '👶', route: 'common' },
      { id: 4, title: '【定期給料日＆業績賞与】', desc: '日頃の業務の成果！基本給とボーナスが口座に振り込まれる！', type: 'salary', icon: '💰', route: 'common' },

      // --- 分岐点 (5) ---
      { id: 5, title: '【大人のライフスタイル分岐点】', desc: '家庭を第一に育む「ファミリーコース」か、都心で野心を燃やす「バリキャリコース」か選択！', type: 'branch_route', icon: '🚩', stop: true, route: 'common' },

      // --- A: マイホーム＆ファミリー繁栄コース (6〜25) ---
      { id: 6, title: '【マイホーム購入相談フェア】', desc: '理想の住まいを検討！モデルルームで夢が膨らむ！', type: 'house', icon: '🏡', route: 'A' },
      { id: 7, title: '【全国ご当地テーマパーク旅行】', desc: '全国の有名レジャーランドへ！名産品とお土産を入手！', type: 'travel', amount: -40, icon: '🎡', route: 'A' },
      { id: 8, title: '【七五三・成長のお祝い慶事】', desc: '親戚や身近な子どもの健やかな成長をみんなで祈願！お祝い金受領！（子どもがいない場合は親戚の祝宴に参列）', type: 'child_event', amount: 100, icon: '👘', route: 'A' },
      { id: 9, title: '【定期給料日】', desc: '家族の暮らしを支える大切なお給料！', type: 'salary', icon: '💴', route: 'A' },
      { id: 10, title: '【各種税金の納税通知・一括納付】', desc: '住民税や各種税金が一括請求！社会人の義務としてしっかり納税！', type: 'money', amount: -120, icon: '📜', route: 'A' },
      { id: 11, title: '【おめでた！出産・赤ちゃんの誕生】', desc: '家族に新しい命が誕生！既婚なら子どもピン追加＆出産祝い金受給！（未婚時はお祝い参列）', type: 'baby', amount: 150, icon: '🍼', route: 'A' },
      { id: 12, title: '【カルチャースクール＆習い事の月謝】', desc: '自分磨きや趣味、スキルの向上のため習い事の月謝支払い', type: 'money', amount: -40, academicDelta: 5, staminaDelta: 3, icon: '⚽', route: 'A' },
      { id: 13, title: '【愛を誓うウェディングベル！】', desc: '大切なパートナーと晴れて結婚式！未婚なら結婚＆ご祝儀、既婚なら記念日祝い金！', type: 'marriage', amount: 150, icon: '💒', route: 'A' },
      { id: 14, title: '【夏休みの全国キャンプツアー】', desc: '満天の星空の下でBBQ！ご当地食材を満喫！', type: 'travel', amount: -50, icon: '⛺', route: 'A' },
      { id: 15, title: '【定期給料日＆諸手当支給】', desc: '業績評価や各種手当が加算されてホクホク！', type: 'salary', icon: '💰', route: 'A' },
      { id: 16, title: '【こだわりの新車購入】', desc: '日々の通勤やドライブを快適にする新しいクルマを納車！', type: 'money', amount: -150, icon: '🚐', route: 'A' },
      { id: 17, title: '【ピカピカの小学校入学式とお祝い】', desc: '黄色い帽子に笑顔！ランドセルとお祝い金のやり取り！（子どもがいない場合は親戚のお祝いに参列）', type: 'child_event', amount: 120, icon: '🎒', route: 'A' },
      { id: 18, title: '【運動不足＆勉強怠慢のマンネリ期】', desc: '日々の忙しさに甘えて運動も自己研鑽もゼロ…！体力と学力がじわじわ低下！', type: 'stat_down', amount: -40, academicDelta: -6, staminaDelta: -8, hensachiDelta: -2, icon: '🪫', route: 'A' },
      { id: 19, title: '【異業種交流会＆ヘッドハンティング！転職チャンス】', desc: '地域コミュニティでの活躍が認められスカウト到来！資格があれば新しい職業へ転職可能！', type: 'job_change', icon: '💼', route: 'A' },
      { id: 20, title: '【最優秀社員賞・スピード昇格！】', desc: '日々の堅実な努力が評価され表彰＆役職昇進！昇進祝い金支給！', type: 'promotion', amount: 80, promoteDelta: 1, icon: '🏅', route: 'A' },
      { id: 21, title: '【実家への親孝行ご当地温泉旅行】', desc: '両親をご当地名湯へ招待！旅先の名産品を入手！', type: 'travel', amount: -50, icon: '♨️', route: 'A' },
      { id: 22, title: '【定期給料日】', desc: '毎月の安定収入！堅実に貯金！', type: 'salary', icon: '💴', route: 'A' },
      { id: 23, title: '【リビングのリフレッシュ＆音響設備導入】', desc: '大画面モニターを導入！至福のおうち時間を満喫！', type: 'money', amount: -60, icon: '🍿', route: 'A' },
      { id: 24, title: '【キャリアアップ！転職チャンス】', desc: 'これまでの学力と体力を活かして新しい職業へステップアップ！転職するか現状維持か選択！', type: 'job_change', icon: '💼', route: 'A' },
      { id: 25, title: '【大切な人たちとの絆・幸福度MAX】', desc: '周囲の笑顔や支えに感謝！心温まる充実した毎日！', type: 'money', amount: 150, icon: '💖', route: 'A' },

      // --- B: 都会派バリキャリ＆資産形成コース (26〜45) ---
      { id: 26, title: '【都心タワマン・レジデンス購入】', desc: '夜景を一望する最上階！ステータスの証！', type: 'house', icon: '🏢', route: 'B' },
      { id: 27, title: '【グローバル大型プロジェクト統括】', desc: '数十億円規模の案件をリーダーとして完遂！巨額特別賞与＆役職昇進！', type: 'money', amount: 250, promoteDelta: 1, icon: '💼', route: 'B' },
      { id: 28, title: '【海外出張・ファーストクラス】', desc: 'ニューヨーク・ロンドンへ！世界のエグゼクティブと商談！', type: 'travel', amount: -80, icon: '✈️', route: 'B' },
      { id: 29, title: '【定期給料日＆役職手当】', desc: '高額な役職給が毎月しっかり振り込まれる！', type: 'salary', icon: '💴', route: 'B' },
      { id: 30, title: '【株式投資＆暗号資産の大当たり】', desc: '成長銘柄に早期投資し資産が倍増！大成功！', type: 'money', amount: 350, icon: '📈', route: 'B' },
      { id: 31, title: '【高級外車（スポーツカー）納車】', desc: '憧れの高級クーペを購入！休日のハイウェイドライブ！', type: 'money', amount: -250, icon: '🏎️', route: 'B' },
      { id: 32, title: '【会員制高級ジム＆サウナ】', desc: '心身をととのえて常に最高のパフォーマンスを維持！', type: 'money', amount: -50, staminaDelta: 7, icon: '🧖', route: 'B' },
      { id: 33, title: '【連日の接待飲み会＆寝不足二日酔い】', desc: '高級料亭での連夜の接待で持ち出し＆体調と集中力が激減…！', type: 'stat_down', amount: -100, staminaDelta: -10, academicDelta: -4, icon: '🍶', route: 'B' },
      { id: 34, title: '【全国プレミアム美食巡り】', desc: 'ミシュラン星付きの名店をハシゴ！ご当地名産品獲得！', type: 'travel', amount: -60, icon: '🍣', route: 'B' },
      { id: 35, title: '【定期給料日＆ストックオプション】', desc: '自社株配当と業績連動報酬で高額受取！', type: 'salary', icon: '💰', route: 'B' },
      { id: 36, title: '【業界スカウト到来！転職チャンス】', desc: '実力を評価され他社・異業種からオファー！条件を満たした職へ転職するか現状維持を選択！', type: 'job_change', icon: '💼', route: 'B' },
      { id: 37, title: '【オーダーメイドスーツ＆高級時計】', desc: 'スイス製高級時計で一流の貫禄！自己プロデュース！', type: 'money', amount: -120, icon: '⌚', route: 'B' },
      { id: 38, title: '【不動産小口投資からの配当】', desc: '都心商業ビルからの安定インカムゲイン獲得！', type: 'money', amount: 200, icon: '🏦', route: 'B' },
      { id: 39, title: '【華麗なるセレブ婚・ウェディングパーティー】', desc: '社交界での運命的な出会いから結婚へ！未婚なら結婚＆ご祝儀、既婚なら記念日祝い金！', type: 'marriage', amount: 150, icon: '💍', route: 'B' },
      { id: 40, title: '【ヘッドハンティング！転職チャンス】', desc: '他社や異業界から熱烈オファー！学力・体力を活かして高給職へ転職する大チャンス！', type: 'job_change', icon: '🤝', route: 'B' },
      { id: 41, title: '【プライベートジェットでの国内周遊】', desc: '優雅に全国の絶景スポットを旅する！特産品入手！', type: 'travel', amount: -80, icon: '🛩️', route: 'B' },
      { id: 42, title: '【ネット詐欺・フィッシング被害】', desc: '巧妙な偽メールに騙されカード不正利用！セキュリティ対策と損失補填！', type: 'money', amount: -180, icon: '💻', route: 'B' },
      { id: 43, title: '【最年少マネージャー大抜擢！】', desc: '突出した成果で異例の大抜擢！役職昇進＆特別賞与獲得！', type: 'promotion', amount: 120, promoteDelta: 1, icon: '🚀', route: 'B' },
      { id: 44, title: '【定期給料日】', desc: '一流の成果に見合ったトップクラスの月給！', type: 'salary', icon: '💴', route: 'B' },
      { id: 45, title: '【揺るぎなき金融資産の確立】', desc: '多角的な資産ポートフォリオが完成！富の基盤盤石！', type: 'money', amount: 300, icon: '💎', route: 'B' },

      // --- 共通合流・キャリア円熟クライマックス区間 (46〜65) ---
      { id: 46, title: '【定期給料日】', desc: '毎月の安定した収入が生活を支える！', type: 'salary', icon: '💴', route: 'common' },
      { id: 47, title: '【全国ご当地温泉旅行】', desc: '全国の有名温泉で心身リフレッシュ！旅先の名産品を入手！', type: 'travel', amount: -50, icon: '♨️', route: 'common' },
      { id: 48, title: '【中期キャリア面談！転職チャンス】', desc: 'これからのキャリアを見直す絶好の機会！別の高給職や出身県企業へ転職するチャンス！', type: 'job_change', icon: '📋', route: 'common' },
      { id: 49, title: '【愛車の定期点検・車検メンテナンス】', desc: '安心安全のため消耗品とタイヤを交換！しっかり整備！', type: 'money', amount: -80, icon: '🔧', route: 'common' },
      { id: 50, title: '【進学・進級のお祝い慶事】', desc: '親戚や身近な子どもの進級・進学をみんなでお祝い！お祝い金受給！（子どもがいない場合は親戚のお祝い）', type: 'child_event', amount: 120, icon: '🎒', route: 'common' },
      { id: 51, title: '【定期給料日＆決算ボーナス】', desc: '会社の決算好調に伴い決算特別賞与支給！', type: 'salary', icon: '💰', route: 'common' },
      { id: 52, title: '【実家の両親への仕送り・親孝行】', desc: '故郷へ感謝を込めて贈り物！実家から地元の特産品が届く！', type: 'travel', amount: -40, icon: '🎁', route: 'common' },
      { id: 53, title: '【人間ドックでオールA判定】', desc: '日頃の健康管理が功を奏し健康そのもの！生命保険割引！', type: 'money', amount: 80, staminaDelta: 5, icon: '🩺', route: 'common' },
      { id: 54, title: '【趣味のゴルフ・テニスコンペ優勝】', desc: '週末スポーツで見事ベスグロ優勝！豪華景品受取！', type: 'sports', amount: 100, staminaDelta: 9, icon: '⛳', route: 'common' },
      { id: 55, title: '【各種ローンや借入の繰り上げ返済】', desc: '余裕資金で繰り上げ返済！将来の利息負担が激減！', type: 'money', amount: -150, icon: '🏡', route: 'common' },
      { id: 56, title: '【全国グルメ物産展めぐり】', desc: '全国の美味しい名産品をお腹いっぱい堪能！名産品入手！', type: 'travel', amount: -40, icon: '🍱', route: 'common' },
      { id: 57, title: '【キャリア再構築！転職チャンス】', desc: '経験と実力を武器に転職活動！自らの学力・体力に見合った憧れの職業へ転職可能！', type: 'job_change', icon: '📋', route: 'common' },
      { id: 58, title: '【定期給料日】', desc: '確かな実績に裏打ちされたお給料！', type: 'salary', icon: '💴', route: 'common' },
      { id: 59, title: '【住まいの定期修繕・リフレッシュ工事】', desc: '快適な暮らしを保つため修繕工事！しっかりメンテナンス！', type: 'money', amount: -180, icon: '🏡', route: 'common' },
      { id: 60, title: '【ふるさと納税での豪華返礼品】', desc: '全国の自治体へ寄付！最高の牛肉と海鮮が食卓に届く！', type: 'money', amount: 80, icon: '🥩', route: 'common' },
      { id: 61, title: '【若者たちの卒業式と新たな門出】', desc: '若い世代の晴れ舞台に涙！親しい人たちと門出を祝福！（子どもがいない場合は親戚の門出を祝福）', type: 'child_event', amount: 100, icon: '🎓', route: 'common' },
      { id: 62, title: '【定期預金の満期利息受取】', desc: '長年積み立てた定期預金が満期！まとまった利息獲得！', type: 'money', amount: 150, icon: '🏦', route: 'common' },
      { id: 63, title: '【社内外の功績表彰・昇進辞令！】', desc: '壮年期の確かな実績が認められワンランク上の役職へ昇進！', type: 'promotion', amount: 100, promoteDelta: 1, icon: '🎖️', route: 'common' },
      { id: 64, title: '【壮年期の総決算・確固たる人生の土台】', desc: '仕事も家庭も円熟味を増し、人生の黄金期へ向かう！', type: 'money', amount: 250, icon: '🌟', route: 'common' },
      { id: 65, title: '【大人時代前半・大団円ゴール】', desc: '社会人・壮年期を見事完走！人生の基盤が確立！達成お祝い金 +300万円 授与！', type: 'era_goal', amount: 300, icon: '🏁', stop: true, route: 'common' },
    ]
  },
  {
    id: 4,
    key: 'adulthood_late',
    name: '熟年期',
    sub: '中高年・役員昇進・起業挑戦・キャリア完成',
    icon: '⚖️',
    color: '#8b5cf6',
    maxTurns: 6, // 規定6ターン
    branchInfo: {
      branchSpaceId: 4,
      branchTitle: '【キャリア成熟・決断コース分岐点】',
      branchDesc: '人生最大の勝負に出るか！？一国一城の主を目指す「ベンチャー起業コース」か、組織の頂点を極める「大企業重鎮コース」か！？',
      routes: {
        A: { key: 'A', name: 'ベンチャー起業・大勝負コース', icon: '🚀', desc: '新会社設立・VC出資・特許独占！億万長者を目指す大冒険', start: 5, end: 24, color: '#ec4899' },
        B: { key: 'B', name: '大企業重鎮・堅実昇進コース', icon: '🏛️', desc: '執行役員・支社長・役員報酬！組織の信頼と最高権力', start: 25, end: 44, color: '#8b5cf6' },
      },
      mergeSpaceId: 45
    },
    spaces: [
      // --- 共通スタート区間 (0〜3) ---
      { id: 0, title: '【40代・50代熟年期突入＆給料日】', desc: '人生の円熟期！これまでの経験が最大限に評価される給料！', type: 'salary', icon: '💴', route: 'common' },
      { id: 1, title: '【長年の功績による特別勤続手当】', desc: '社業発展への長年の貢献が表彰され特別手当受領＆役職昇進！', type: 'money', amount: 200, promoteDelta: 1, icon: '🎖️', route: 'common' },
      { id: 2, title: '【全国業界フォーラムの基調講演】', desc: '業界の第一人者として登壇！大盛況で高額謝礼受取＆役職昇進！', type: 'money', amount: 200, promoteDelta: 1, icon: '🎤', route: 'common' },
      { id: 3, title: '【健康維持のための人間ドック】', desc: '健康第一！定期精密検査で体のメンテナンス！', type: 'money', amount: -50, icon: '🩺', route: 'common' },

      // --- 分岐点 (4) ---
      { id: 4, title: '【キャリア成熟・決断コース分岐点】', desc: '自らの旗を掲げる「起業コース」か、大企業の階段を登りつめる「重鎮コース」か選択！', type: 'branch_route', icon: '🚩', stop: true, route: 'common' },

      // --- A: ベンチャー起業・大勝負コース (5〜24) ---
      { id: 5, title: '【新会社設立・登記完了】', desc: '夢の起業！自らのビジョンを世界へ発信！設立祝い金！', type: 'money', amount: 300, icon: '🚀', route: 'A' },
      { id: 6, title: '【ベンチャーキャピタルからの巨額出資】', desc: '事業計画が絶賛されシリーズAで億単位の資金調達成功！特別配当金！', type: 'money', amount: 800, icon: '💰', route: 'A' },
      { id: 7, title: '【画期的な新技術の国際特許取得】', desc: '独自開発のコア技術が特許認定！独占市場を確立！特許ロイヤリティ受取！', type: 'money', amount: 600, icon: '💡', route: 'A' },
      { id: 8, title: '【創業メンバーとの定期役員報酬】', desc: '自ら定めた役員報酬が安定支給される！', type: 'salary', icon: '💴', route: 'A' },
      { id: 9, title: '【新オフィスの立ち上げ費用】', desc: '一等地へ本社移転！最新オフィス機器を導入！', type: 'money', amount: -300, icon: '🏢', route: 'A' },
      { id: 10, title: '【主力新製品の全国爆発的ヒット】', desc: 'メディアで話題沸騰！注文殺到で売上記録更新！巨額ボーナス！', type: 'money', amount: 1000, icon: '💥', route: 'A' },
      { id: 11, title: '【世界最大の見本市に出展】', desc: 'ラスベガスの展示会で注目度No.1！海外名産品獲得！', type: 'travel', amount: -80, icon: '🌍', route: 'A' },
      { id: 12, title: '【業界トップカンファレンスで特別講演】', desc: '経営の手腕が高く評価され、大型講演オファー＆特別顧問料獲得！', type: 'money', amount: 350, academicDelta: 4, icon: '🎤', route: 'A' },
      { id: 13, title: '【定期役員報酬＆配当金】', desc: '会社の利益から株主配当金と役員報酬受取！', type: 'salary', icon: '💰', route: 'A' },
      { id: 14, title: '【経済紙『今年の最優秀企業家』選出】', desc: 'アントレプレナー・オブ・ザ・イヤーを受賞！名声と特別報奨金獲得＆昇進！', type: 'money', amount: 500, promoteDelta: 1, icon: '🏆', route: 'A' },
      { id: 15, title: '【相場暴落＆不眠不休のトラブル対応】', desc: '資産急落のショックと徹夜対応で心身ともにボロボロ…！', type: 'stat_down', amount: -400, staminaDelta: -10, academicDelta: -5, icon: '📉', route: 'A' },
      { id: 16, title: '【グローバルM&Aバイアウトの大勝負】', desc: '同業他社を買収してシェアトップへ！大勝負の買収資金！', type: 'money', amount: -400, icon: '🤝', route: 'A' },
      { id: 17, title: '【自社クラウドサービスのサブスク爆増】', desc: '毎月安定した高収益ストックビジネスが完成！特別収益！', type: 'money', amount: 700, icon: '📈', route: 'A' },
      { id: 18, title: '【創業感謝の全国社員旅行】', desc: '全社員を連れて全国の名所へ！旅先の名産品を入手！', type: 'travel', amount: -80, icon: '♨️', route: 'A' },
      { id: 19, title: '【定期役員報酬】', desc: '毎月高額な役員報酬受領！', type: 'salary', icon: '💴', route: 'A' },
      { id: 20, title: '【自社株の上場（IPO）達成！巨額創業者利得】', desc: '東証プライムへ新規上場！株式公開により莫大な創業者利得を獲得！', type: 'money', amount: 1500, icon: '🔔', route: 'A' },
      { id: 21, title: '【経営手腕の極み・大抜擢昇進！】', desc: '数々の新規事業を成功させ最高クラスの役職へ昇進！特別功労賞与獲得！', type: 'promotion', amount: 400, promoteDelta: 1, icon: '🚀', route: 'A' },
      { id: 22, title: '【本社ビル自社購入】', desc: '自社ビルを建設！不動産資産の確立！', type: 'house', icon: '🏙️', route: 'A' },
      { id: 23, title: '【起業家エンジェルとしての後進育成】', desc: '若手起業家を支援！出資リターンと多方面からの尊敬！', type: 'money', amount: 300, icon: '🌱', route: 'A' },
      { id: 24, title: '【大勝負の完勝・名声と莫大な富】', desc: '自らの信念で道を切り拓き、伝説の起業家へ！最高峰の報酬！', type: 'money', amount: 800, icon: '👑', route: 'A' },

      // --- B: 大企業重鎮・堅実昇進コース (25〜44) ---
      { id: 25, title: '【取締役・執行役員へ就任】', desc: 'ついに役員フロアへ進出！役員就任特別一時金受領＆昇進！', type: 'promotion', amount: 400, promoteDelta: 1, icon: '🏛️', route: 'B' },
      { id: 26, title: '【高額役員報酬の定期受取】', desc: 'これまでの重責に見合った超高額役員報酬！', type: 'salary', icon: '💰', route: 'B' },
      { id: 27, title: '【専属運転手付き社用車の配車】', desc: '移動も快適そのもの！社会的ステータス最高峰！手当支給！', type: 'money', amount: 150, icon: '🚗', route: 'B' },
      { id: 28, title: '【社内政治の派閥争い・接待痛手】', desc: '派閥の結束を高めるため高級料亭で奢り！ポケットマネーから大出費！', type: 'money', amount: -300, icon: '♟️', route: 'B' },
      { id: 29, title: '【全国支社巡回・名産品贈呈】', desc: '全国の拠点を視察！各支社から地元の銘酒・名産品を拝受！', type: 'travel', amount: -40, icon: '🚄', route: 'B' },
      { id: 30, title: '【関連会社の社外取締役就任】', desc: '豊富な実績と人望を買われ他社ボードに参画！高額役員報酬を受領！', type: 'money', amount: 350, icon: '🏛️', route: 'B' },
      { id: 31, title: '【定期役員報酬＆特別賞与】', desc: '会社全体の過去最高益に伴い役員賞与満額支給！', type: 'salary', icon: '💴', route: 'B' },
      { id: 32, title: '【海外グループ会社の総代表兼任】', desc: '欧米・アジア拠点を統括！国際的リーダーシップ！', type: 'travel', amount: -60, icon: '✈️', route: 'B' },
      { id: 33, title: '【名門ゴルフ倶楽部でのトップ会談】', desc: '政財界の重鎮たちとラウンド！大口案件成立で特別配当！', type: 'sports', amount: 250, icon: '⛳', route: 'B' },
      { id: 34, title: '【創業家からの絶大な信頼】', desc: 'オーナーファミリーから信頼され自社株信託を特別付与！', type: 'money', amount: 700, icon: '🤝', route: 'B' },
      { id: 35, title: '【定期役員報酬】', desc: '安定かつ高額な役員報酬！', type: 'salary', icon: '💰', route: 'B' },
      { id: 36, title: '【老朽化した自宅水回りの全面リフォーム】', desc: 'キッチンとお風呂の配管老朽化！最新設備へ一新して大出費！', type: 'money', amount: -300, icon: '🛁', route: 'B' },
      { id: 37, title: '【財界レセプションの主賓挨拶】', desc: '経済界の祝宴で堂々たるスピーチ！取引先からの厚い信頼と特別謝礼獲得！', type: 'money', amount: 300, icon: '🥂', route: 'B' },
      { id: 38, title: '【高級保養所での優雅な週末】', desc: '会社の専用リゾートで英気を養う！名産品入手！', type: 'travel', amount: -50, icon: '🏰', route: 'B' },
      { id: 39, title: '【定期役員報酬＆ストックグラント】', desc: '継続的な自社株付与により資産がさらに積み上がる！', type: 'salary', icon: '💴', route: 'B' },
      { id: 40, title: '【代表取締役副社長へ昇格】', desc: '組織の頂点の一角へ！副社長就任特別祝い金＆昇進！', type: 'promotion', amount: 800, promoteDelta: 1, icon: '👑', route: 'B' },
      { id: 41, title: '【母校大学の客員教授就任】', desc: '若者たちに企業経営の神髄を講義！名誉と特別謝礼！', type: 'money', amount: 200, academicDelta: 6, icon: '🎓', route: 'B' },
      { id: 42, title: '【後継者の指名と体制確立】', desc: '自らの信念を受け継ぐ次世代リーダーを育成完了！特別功労金！', type: 'money', amount: 250, icon: '👥', route: 'B' },
      { id: 43, title: '【定期役員報酬】', desc: '最高峰の役員月給！', type: 'salary', icon: '💰', route: 'B' },
      { id: 44, title: '【栄光の大企業統括・盤石のキャリア】', desc: '組織を日本屈指の企業へと導いた偉大なる功労者！特別退職金準備！', type: 'money', amount: 600, icon: '🏛️', route: 'B' },

      // --- 共通合流・定年退職クライマックス区間 (45〜64) ---
      { id: 45, title: '【定期役員報酬・給料日】', desc: '最後の現役時代を飾る高額報酬！', type: 'salary', icon: '💴', route: 'common' },
      { id: 46, title: '【全国老舗旅館への慰労ご褒美旅行】', desc: '長年の激務をねぎらい名湯へ！旅先のご当地名産品を獲得！', type: 'travel', amount: -60, icon: '♨️', route: 'common' },
      { id: 47, title: '【長寿の節目・還暦のお祝い金】', desc: '親しい仲間や親戚から赤いちゃんちゃんことお祝い金！', type: 'money', amount: 200, icon: '㊗️', route: 'common' },
      { id: 48, title: '【心温まる結婚式への参列・人生の門出】', desc: '若い世代の晴れ姿に感涙！お祝い金を贈りつつ親戚から祝儀！（子どもや親戚・友人の結婚式参列）', type: 'child_event', amount: 150, icon: '💒', route: 'common' },
      { id: 49, title: '【新たな命の誕生！天使の笑顔とお祝い】', desc: '新しい命の誕生に心洗われる！目に入れても痛くない愛らしさ！（親戚や身内の赤ちゃん誕生祝い）', type: 'child_event', amount: 200, icon: '👶', route: 'common' },
      { id: 50, title: '【定期給料日＆業績報奨金】', desc: '現役最後のラストスパート！特別手当受取！', type: 'salary', icon: '💰', route: 'common' },
      { id: 51, title: '【全国美味探訪・旬の味覚お取り寄せ】', desc: '全国の美味しい名産品を自宅で味わう！', type: 'travel', amount: -40, icon: '🦀', route: 'common' },
      { id: 52, title: '【長年培った人脈と経験の結晶】', desc: '多方面からのコンサル相談・講演依頼が殺到し特別報酬を受取！', type: 'money', amount: 250, icon: '🤝', route: 'common' },
      { id: 53, title: '【四半世紀の歩みを祝う記念祝宴】', desc: '25年間の努力と歩みを振り返る！大切な人たちから温かい贈り物！', type: 'money', amount: 200, icon: '💍', route: 'common' },
      { id: 54, title: '【愛車のクラシックカーへの買い替え】', desc: '長年憧れた名車を購入！優雅な週末ドライブ！', type: 'money', amount: -300, icon: '🚗', route: 'common' },
      { id: 55, title: '【定期給料日】', desc: '長年会社を支え続けたお給料！', type: 'salary', icon: '💴', route: 'common' },
      { id: 56, title: '【後輩たちからの手作りの送別寄せ書き】', desc: '感謝の言葉がぎっしり詰まった色紙と記念品！胸が熱くなる！', type: 'money', amount: 100, icon: '💌', route: 'common' },
      { id: 57, title: '【全国思い出の地巡礼ツアー】', desc: '青春時代やかつて訪れた思い出の地へ！旅先の名産品を入手！', type: 'travel', amount: -60, icon: '🚆', route: 'common' },
      { id: 58, title: '【ぎっくり腰＆最新AIに置いてけぼり】', desc: '体の節々が痛み最新技術にもついていけず…！体力・学力ともにダウン！', type: 'stat_down', amount: -150, staminaDelta: -9, academicDelta: -7, hensachiDelta: -2, icon: '🩺', route: 'common' },
      { id: 59, title: '【小さな子どもたちへ笑顔のプレゼント】', desc: '親戚や身近な子どもの喜ぶ顔が見たくてとっておきのプレゼント購入！', type: 'money', amount: -50, icon: '🧸', route: 'common' },
      { id: 60, title: '【現役最後の定期給料日】', desc: '数十年続いた現役サラリーマン・役員生活最後のお給料！', type: 'salary', icon: '💰', route: 'common' },
      { id: 61, title: '【功労盾と花束の贈呈式】', desc: '役員会議室で全役員から起立拍手！記念の黄金盾受領＆昇進！', type: 'money', amount: 250, promoteDelta: 1, icon: '🏅', route: 'common' },
      { id: 62, title: '【定年退職パーティー・盛大な乾杯】', desc: '大勢の仲間たちに見送られ笑顔の卒業！特別慰労金！', type: 'money', amount: 250, icon: '🥂', route: 'common' },
      { id: 63, title: '【定年退職式典・巨額退職金の受取】', desc: '長年の激務本当にお疲れ様でした！感謝の退職金が満額口座に入金！', type: 'money', amount: 1000, icon: '🎖️', route: 'common' },
      { id: 64, title: '【大人時代後半・定年大団円ゴール】', desc: 'ビジネスマン人生堂々完走！いよいよ悠々自適のシニア期へ！退職記念祝儀 +500万円 授与！', type: 'era_goal', amount: 500, icon: '🏁', stop: true, route: 'common' },
    ]
  },
  {
    id: 5,
    key: 'senior',
    name: 'シニア・老後時代',
    sub: '悠々自適・セカンドライフ・人生の集大成',
    icon: '🏰',
    color: '#ec4899',
    maxTurns: 4, // 規定4ターン（旧3 -> 4ターン）
    branchInfo: {
      branchSpaceId: 3,
      branchTitle: '【セカンドライフ満喫コース分岐点】',
      branchDesc: '老後をどのように満喫するか？日本中を旅する「全国美食クルーズコース」か、地域で趣味に生きる「シニア趣味＆地域名士コース」か！？',
      routes: {
        A: { key: 'A', name: '全国美食クルーズ＆ご当地探訪コース', icon: '🚢', desc: '豪華客船・日本一周・老舗温泉旅館！全国の特産品をコンプリート', start: 4, end: 18, color: '#06b6d4' },
        B: { key: 'B', name: 'シニア趣味＆地域名士コース', icon: '🪴', desc: '家庭菜園・陶芸・シニアゴルフ・地域交流！穏やかで豊かな毎日', start: 19, end: 33, color: '#ec4899' },
      },
      mergeSpaceId: 34
    },
    spaces: [
      // --- 共通スタート区間 (0〜2) ---
      { id: 0, title: '【シニアライフスタート＆公的年金受給】', desc: '悠々自適の第二の人生！毎月の公的年金が振り込まれる！', type: 'pension', amount: 80, icon: '👴', route: 'common' },
      { id: 1, title: '【住まいのバリアフリー改修工事】', desc: '手すりの取り付けと段差解消工事！安心安全な暮らしへ出費！', type: 'money', amount: -150, icon: '🔨', route: 'common' },
      { id: 2, title: '【健康ウォーキング大会完歩】', desc: '毎朝の散歩が実を結び元気ハツラツ！記念品受贈！', type: 'sports', amount: 100, icon: '👟', route: 'common' },

      // --- 分岐点 (3) ---
      { id: 3, title: '【セカンドライフ満喫コース分岐点】', desc: '全国を旅する「豪華クルーズコース」か、地域に根ざす「趣味・名士コース」か選択！', type: 'branch_route', icon: '🚩', stop: true, route: 'common' },

      // --- A: 全国美食クルーズ＆ご当地探訪コース (4〜18) ---
      { id: 4, title: '【豪華客船・日本一周クルーズ出航】', desc: '横浜港から出航！洋上の優雅な旅がスタート！', type: 'travel', amount: -250, icon: '🚢', route: 'A' },
      { id: 5, title: '【北海海鮮づくし＆オホーツク流氷鑑賞】', desc: '北海道の大自然！最高級カニとウニを堪能！名産品入手！', type: 'travel', amount: -60, icon: '🦀', route: 'A' },
      { id: 6, title: '【公的年金受給日】', desc: '老後の生活を支える定期年金が入金！', type: 'pension', amount: 80, icon: '💴', route: 'A' },
      { id: 7, title: '【みちのく名湯・秘湯めぐり】', desc: '乳頭温泉や蔵王温泉で極上の癒やし！名産品入手！', type: 'travel', amount: -50, icon: '♨️', route: 'A' },
      { id: 8, title: '【越後・信州の地酒蔵めぐり】', desc: '銘酒の利き酒ツアー！全国の銘酒をお取り寄せ！名産品入手！', type: 'travel', amount: -50, icon: '🍶', route: 'A' },
      { id: 9, title: '【古都京都・金沢の歴史風情と老舗懐石】', desc: '伝統文化とミシュラン料亭！雅な時間を満喫！特産品入手！', type: 'travel', amount: -80, icon: '🍵', route: 'A' },
      { id: 10, title: '【公的年金受給日】', desc: '安定した年金支給！', type: 'pension', amount: 80, icon: '💰', route: 'A' },
      { id: 11, title: '【瀬戸内海アートクルーズ＆しまなみ海道】', desc: '多島美の絶景と新鮮な鯛めし！名産品入手！', type: 'travel', amount: -60, icon: '⛵', route: 'A' },
      { id: 12, title: '【九州の名城・温泉郷大周遊】', desc: '別府・黒川温泉と黒豚・和牛ステーキ！名産品入手！', type: 'travel', amount: -60, icon: '🥩', route: 'A' },
      { id: 13, title: '【沖縄・八重山諸島アイランドホッピング】', desc: 'エメラルドグリーンの海と長寿の島料理！名産品入手！', type: 'travel', amount: -80, icon: '🌺', route: 'A' },
      { id: 14, title: '【公的年金受給日】', desc: '定期年金受領！', type: 'pension', amount: 80, icon: '💴', route: 'A' },
      { id: 15, title: '【全都道府県ご当地スタンプ帳完成】', desc: '全国47都道府県の思い出がびっしり！記念表彰！', type: 'money', amount: 300, icon: '🗾', route: 'A' },
      { id: 16, title: '【豪華客船のキャプテンディナー】', desc: '船長主催の晩餐会！タキシード・ドレスで優雅に乾杯！特別記念品！', type: 'money', amount: 150, icon: '🥂', route: 'A' },
      { id: 17, title: '【老眼鏡＆オーダーメイド高級補聴器】', desc: '快適な毎日のため最新の医療用補聴器と老眼鏡を調製！', type: 'money', amount: -150, icon: '👓', route: 'A' },
      { id: 18, title: '【日本一周グランドトラベラー達成】', desc: '日本の美しさを全て見届けた至高の旅人！特別報奨金！', type: 'money', amount: 400, icon: '👑', route: 'A' },

      // --- B: シニア趣味＆地域名士コース (19〜33) ---
      { id: 19, title: '【本格陶芸・ろくろ回しで名作完成】', desc: '独自の釉薬で焼き上げた茶碗が美術展に入選！特別賞金！', type: 'study', amount: 150, icon: '🏺', route: 'B' },
      { id: 20, title: '【庭先・ベランダの家庭菜園・有機無農薬】', desc: '甘い野菜やハーブが豊作！近所にお裾分けで大人気！', type: 'money', amount: 100, icon: '🍉', route: 'B' },
      { id: 21, title: '【公的年金受給日】', desc: '毎月の安定年金受領！', type: 'pension', amount: 80, icon: '💴', route: 'B' },
      { id: 22, title: '【シニアゴルフマスターズ大会優勝】', desc: '年齢を感じさせない正確なショットでエイジシュート達成！', type: 'sports', amount: 200, staminaDelta: 10, icon: '⛳', route: 'B' },
      { id: 23, title: '【引きこもり＆昼寝三昧で気力体力ダウン】', desc: '外に出るのが億劫になり読書も散歩もサボり気味…！体力と学力が低下！', type: 'stat_down', amount: -50, staminaDelta: -9, academicDelta: -7, icon: '🛌', route: 'B' },
      { id: 24, title: '【地域の歴史ガイドボランティア】', desc: '地元の名所を観光客に案内！温かいお礼とお菓子！', type: 'money', amount: 80, icon: '🏮', route: 'B' },
      { id: 25, title: '【公的年金受給日】', desc: '定期年金支給！', type: 'pension', amount: 80, icon: '💰', route: 'B' },
      { id: 26, title: '【夏休みの帰省・親戚一同のおもてなし】', desc: '「おかえり！」笑顔に囲まれにぎやかな夏！最高のおもてなし！', type: 'money', amount: -60, icon: '👧', route: 'B' },
      { id: 27, title: '【町内会長・自治会長に就任】', desc: '地域のみんなから頼りにされ防災訓練を指揮！活動費受領！', type: 'money', amount: 150, icon: '🏛️', route: 'B' },
      { id: 28, title: '【趣味の手打ち蕎麦名人】', desc: '蕎麦打ちの腕前はプロ級！近所の人たちへ振る舞い大盛況！', type: 'money', amount: 100, icon: '🥢', route: 'B' },
      { id: 29, title: '【公的年金受給日】', desc: '年金受給日！生活安心！', type: 'pension', amount: 80, icon: '💴', route: 'B' },
      { id: 30, title: '【名誉市民章・地域功労賞の受賞】', desc: '多年にわたる地域社会への貢献で市長から名誉市民章授与！特別報奨金！', type: 'money', amount: 350, icon: '🎖️', route: 'B' },
      { id: 31, title: '【公民館での子ども囲碁・将棋教室】', desc: '地域の子供たちに囲碁将棋を指導！笑顔と感謝！', type: 'study', amount: 100, icon: '♟️', route: 'B' },
      { id: 32, title: '【縁側で日向ぼっこ・至福の茶の湯】', desc: '小鳥のさえずりを聞きながらゆったりお茶！極楽の時間！', type: 'money', amount: 80, icon: '🍵', route: 'B' },
      { id: 33, title: '【地域に愛される名士・豊かな人望】', desc: '世代を超えて人々が集い、慕われる温かい長老へ！', type: 'money', amount: 300, icon: '🌟', route: 'B' },

      // --- 共通合流・人生の集大成・フィナーレ区間 (34〜48) ---
      { id: 34, title: '【公的年金受給日】', desc: '毎月の安定した公的年金！', type: 'pension', amount: 80, icon: '💴', route: 'common' },
      { id: 35, title: '【古希・喜寿・傘寿の祝い】', desc: '親族全員がホテルに集まり盛大な長寿の宴！お祝い金受領！', type: 'money', amount: 250, icon: '🎊', route: 'common' },
      { id: 36, title: '【半世紀の感謝・人生の記念祝宴】', desc: '50年の長き道のりを支えてくれた人々へ感謝！感涙の祝杯！', type: 'money', amount: 350, icon: '💍', route: 'common' },
      { id: 37, title: '【次世代の誕生！世代をつなぐ慶事】', desc: '小さな可愛い手！一族や地域の繁栄を心から祝福！（子どもがいない場合は一族の慶事）', type: 'child_event', amount: 250, icon: '👶', route: 'common' },
      { id: 38, title: '【自叙伝『我が歩みし道』の出版】', desc: '波乱万丈の人生を一冊の本に！記念配本と印税！', type: 'study', amount: 250, academicDelta: 10, hensachiDelta: 3, icon: '📚', route: 'common' },
      { id: 39, title: '【公的年金受給日】', desc: '最後の定期年金受領！', type: 'pension', amount: 80, icon: '💰', route: 'common' },
      { id: 40, title: '【全国の友から届く季節の便り】', desc: '生涯で出会った大切な仲間たちからの温かい手紙と特産品！', type: 'money', amount: 150, icon: '✉️', route: 'common' },
      { id: 41, title: '【大切な人たちとの温泉慰労会】', desc: '親しい仲間や親戚に囲まれて温かい湯と料理を楽しむ！', type: 'travel', amount: -60, icon: '♨️', route: 'common' },
      { id: 42, title: '【健康長寿・百寿のお祝い金】', desc: '県知事と市長から銀杯と長寿褒賞金を授与される！', type: 'money', amount: 400, icon: '🏆', route: 'common' },
      { id: 43, title: '【終活準備・人生の総整理と感謝】', desc: '身の回りの生前整理と未来への準備！後顧の憂いなし！', type: 'money', amount: -250, icon: '🪦', route: 'common' },
      { id: 44, title: '【大切な人々から贈られる感謝の手紙集】', desc: '「いつも見守ってくれてありがとう」温かい言葉の詰まった涙の宝物！', type: 'money', amount: 200, icon: '💌', route: 'common' },
      { id: 45, title: '【人生回想のアルバム・万感の思い】', desc: '誕生から小学生、青春、仕事、生きがい…全てが輝いていた！', type: 'money', amount: 150, icon: '📷', route: 'common' },
      { id: 46, title: '【愛と笑顔に包まれた平穏な日々】', desc: '何一つ思い残すことのない、満ち足りた心の境地！', type: 'money', amount: 200, icon: '🕊️', route: 'common' },
      { id: 47, title: '【後世へ受け継がれる人生の教訓】', desc: '自分の生きた証が次の世代の胸に永遠に輝く！', type: 'money', amount: 300, icon: '✨', route: 'common' },
      { id: 48, title: '【大団円・人生のフィナーレゴール】', desc: '見事一生涯を完走！波乱万丈の素晴らしい人生！生涯ゴール祝儀 +1000万円 授与！', type: 'era_goal', amount: 1000, icon: '👑', stop: true, route: 'common' },
    ]
  }
];

export const getEraById = (id) => {
  return LIFE_ERAS.find((era) => era.id === id) || LIFE_ERAS[0];
};

export const getAllSpacesFlat = () => {
  return LIFE_ERAS.flatMap((era) =>
    era.spaces.map((s) => ({
      ...s,
      eraId: era.id,
      eraName: era.name,
      eraColor: era.color,
      globalId: `${era.id}-${s.id}`,
    }))
  );
};

// 分岐ルート対応の移動経路・到達マス算出関数（通過マスの給料日・年金判定に対応）
export function calculateMovePath(currentPos, steps, playerRoute, branchInfo, totalSpaces) {
  let pos = currentPos;
  const lastSpaceId = totalSpaces - 1;
  const visited = [];

  for (let s = 0; s < steps; s++) {
    // 時代の最終マス（ゴール）に達したらその場でストップ！絶対に0マス目（小学校入学等）へループしない
    if (pos >= lastSpaceId) {
      pos = lastSpaceId;
      break;
    }

    if (branchInfo && pos === branchInfo.branchSpaceId) {
      if (playerRoute === 'B') {
        pos = branchInfo.routes.B.start;
      } else {
        pos = branchInfo.routes.A.start;
      }
    } else if (branchInfo && playerRoute === 'A' && pos === branchInfo.routes.A.end) {
      pos = branchInfo.mergeSpaceId;
    } else if (branchInfo && playerRoute === 'B' && pos === branchInfo.routes.B.end) {
      pos = branchInfo.mergeSpaceId;
    } else {
      pos = pos + 1;
    }

    if (pos >= lastSpaceId) {
      pos = lastSpaceId;
      visited.push(pos);
      break;
    }
    visited.push(pos);
  }

  // 通過したマス（最終着地マス targetPos 自体は resolveSpaceEffects で解決するため除外）
  const passedIds = visited.length > 1 ? visited.slice(0, -1) : [];
  return { targetPos: pos, passedIds };
}

// 分岐ルート対応の次の移動先算出関数（最大値前提・ループ完全撤廃）
export function calculateNextPosition(currentPos, steps, playerRoute, branchInfo, totalSpaces) {
  return calculateMovePath(currentPos, steps, playerRoute, branchInfo, totalSpaces).targetPos;
}

// マスのお金の増減・上限・収支目安の算出関数
export const getSpaceMoneyDetails = (space, player = null) => {
  if (!space) return { badge: '', color: '#94a3b8', detail: '変動なし', maxLimit: 'なし' };

  switch (space.type) {
    case 'money': {
      const amt = space.amount || 0;
      const hasPromote = (space.promoteDelta || 0) > 0;
      return {
        badge: `${amt > 0 ? `+${amt}万` : `${amt}万`}${hasPromote ? ' / 昇進!' : ''}`,
        color: amt > 0 ? '#34d399' : '#f87171',
        detail: `${amt > 0 ? `固定受取: +${amt}万円` : `固定支払: ${Math.abs(amt)}万円`}${hasPromote ? '（🏅 役職昇進＆給料UP！）' : ''}`,
        maxLimit: amt > 0 ? `上限: +${amt}万円` : `負担: ${Math.abs(amt)}万円`
      };
    }
    case 'promotion': {
      const amt = space.amount || 0;
      return {
        badge: amt > 0 ? `昇進! +${amt}万` : '役職昇進!',
        color: '#fbbf24',
        detail: `🎖️ 役職が1ランク昇進（給料UP！）${amt > 0 ? `＋昇進祝い金 +${amt}万円` : ''}`,
        maxLimit: amt > 0 ? `祝金: +${amt}万円` : '役職＆給料UP'
      };
    }
    case 'study': {
      const amt = space.amount || 20;
      const acad = space.academicDelta ?? 8;
      return {
        badge: `+${amt}万/学力+${acad}`,
        color: '#38bdf8',
        detail: `奨励金: +${amt}万円（📚 学力 +${acad} UP！偏差値+${space.hensachiDelta ?? 3}）`,
        maxLimit: `上限: +${amt}万円`
      };
    }
    case 'sports': {
      const amt = space.amount || 20;
      const stam = space.staminaDelta ?? 8;
      return {
        badge: `+${amt}万/体力+${stam}`,
        color: '#34d399',
        detail: `報奨金: +${amt}万円（🏃 体力 +${stam} UP！運動・部活表彰）`,
        maxLimit: `上限: +${amt}万円`
      };
    }
    case 'stat_down': {
      const amt = space.amount || 0;
      const parts = [];
      if (space.academicDelta) parts.push(`📚学力${space.academicDelta}`);
      if (space.staminaDelta) parts.push(`🏃体力${space.staminaDelta}`);
      if (space.hensachiDelta) parts.push(`🎓偏差値${space.hensachiDelta}`);
      return {
        badge: parts.join(' '),
        color: '#f87171',
        detail: `${amt < 0 ? `出費: ${Math.abs(amt)}万円 / ` : ''}能力低下: ${parts.join('・')}`,
        maxLimit: amt < 0 ? `負担: ${Math.abs(amt)}万円` : '能力低下マス'
      };
    }
    case 'salary': {
      const salary = player?.salary || 100;
      return {
        badge: `給料:+${salary}万`,
        color: '#38bdf8',
        detail: `職業基本給: +${salary}万円（ボーナス時は1.5倍）`,
        maxLimit: `給料上限: +${player?.occupation?.maxSalary || 550}万円`
      };
    }
    case 'pension': {
      const amt = space.amount || 35;
      return {
        badge: `年金:+${amt}万`,
        color: '#a78bfa',
        detail: `定期公的年金: +${amt}万円`,
        maxLimit: `上限: +${amt}万円`
      };
    }
    case 'marriage': {
      return {
        badge: '結婚:全員から徴収',
        color: '#f43f5e',
        detail: '他プレイヤー全員から結婚祝い金（1人50万円）を徴収！（配偶者が同乗、最終資産+500万）',
        maxLimit: '1人50万 × 他人数'
      };
    }
    case 'child':
    case 'baby': {
      const perPlayer = (space.amount || 120) >= 150 ? 50 : 40;
      return {
        badge: `出産:+${perPlayer}万×人数`,
        color: '#ec4899',
        detail: `既婚時、他プレイヤー全員から出産祝い金（1人${perPlayer}万円）を徴収！（子どもピン追加、毎月手当+15万/人＆決算+300万/人）`,
        maxLimit: `1人${perPlayer}万 × 他人数`
      };
    }
    case 'child_event': {
      const amt = space.amount || 30;
      return {
        badge: `慶事:+${amt}万`,
        color: '#f472b6',
        detail: `お祝い金: +${amt}万円（子どもがいない場合は親戚慶事）`,
        maxLimit: `上限: +${amt}万円`
      };
    }
    case 'travel': {
      const cost = Math.abs(space.amount || 20);
      return {
        badge: `旅行:-${cost}万`,
        color: '#f59e0b',
        detail: `旅費: -${cost}万円（📚学力+2・🏃体力+2・全国名産品+100万円相当入手！）`,
        maxLimit: `収支目安: 差額+${100 - cost}万円（資産増）`
      };
    }
    case 'house': {
      return {
        badge: '物件購入',
        color: '#6366f1',
        detail: 'マイホーム購入選択マス（資産価値は購入額以上！）',
        maxLimit: '上限目安: 900万〜2000万円'
      };
    }
    case 'job_change': {
      return {
        badge: '転職チャンス',
        color: '#38bdf8',
        detail: '学力・体力を活かして職業を変更可能！高給職を目指そう！',
        maxLimit: '選択制'
      };
    }
    case 'branch_career':
    case 'branch_route': {
      return {
        badge: '進路分岐',
        color: '#c084fc',
        detail: '人生のコースを選択する運命の分岐点！',
        maxLimit: '選択制'
      };
    }
    case 'era_goal': {
      const amt = space.amount || 50;
      return {
        badge: `ゴール:+${amt}万`,
        color: '#f59e0b',
        detail: `時代のゴール到達祝儀: +${amt}万円！`,
        maxLimit: `上限: +${amt}万円`
      };
    }
    case 'goal_standby': {
      const amt = space.amount || 30;
      return {
        badge: `待機:+${amt}万`,
        color: '#f59e0b',
        detail: `ゴール待機ボーナス: +${amt}万円！`,
        maxLimit: `上限: +${amt}万円`
      };
    }
    default:
      return { badge: 'イベント', color: '#94a3b8', detail: 'マス固有イベント', maxLimit: 'なし' };
  }
};
