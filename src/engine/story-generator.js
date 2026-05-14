// Story Generator — Vietnamese Drama Content Writing App
// No imports/exports. Exposes window.StoryGenerator globally.
// Reads from window.DNA_PRESETS.

window.StoryGenerator = (function () {

  function getRandomElement(arr) {
    if (!arr || arr.length === 0) return null;
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function shuffle(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  // ── Scene pools per preset ────────────────────────────────────────────

  const SCENE_POOLS = {
    doanhTraiHanQuoc: [
      (ctx) => `Buổi huấn luyện ${ctx.setting || "ngoài thao trường"} — ${ctx.protagonist} và ${ctx.antagonist} chạm mặt nhau trong bài tập chiến thuật, tia lửa âm ỉ bùng lên.`,
      (ctx) => `Đêm gác một mình dưới bầu trời đầy sao — ${ctx.protagonist} lần đầu hé lộ một mảnh ký ức đau với người không ngờ lại lắng nghe.`,
      (ctx) => `Lệnh khẩn từ cấp trên ập đến giữa chừng — cả đội phải phối hợp, và khoảng cách giữa ${ctx.protagonist} và ${ctx.antagonist} bỗng biến mất trong tích tắc nguy hiểm.`,
      () => `Phòng y tế doanh trại — vết thương được băng bó trong im lặng, nhưng mỗi giây yên tĩnh lại nặng hơn tiếng súng bên ngoài.`,
      () => `Cuộc họp tác chiến — bản đồ trải trên bàn, nhưng mọi ánh mắt đều đang đọc thứ gì đó hoàn toàn khác nhau.`,
      () => `Bữa cơm tập thể — ai cũng nói cười, nhưng một người ngồi đó mà như không ở đó, tay siết muỗng đến trắng khớp.`,
      () => `Hầm trú ẩn bí mật — lần đầu tiên không có cấp bậc, chỉ có hai con người và sự thật chưa kịp nói ra.`,
    ],
    quanDoiTraDuaHanQuoc: [
      (ctx) => `Tiệc chiêu đãi cấp cao — ${ctx.protagonist} đứng sau lưng kẻ thù mỉm cười, tay cầm ly rượu mà trong đầu là toàn bộ bản đồ trả thù.`,
      (ctx) => `Văn phòng lúc nửa đêm — ${ctx.protagonist} sao chép tài liệu mật, tiếng bước chân trong hành lang ngày càng gần hơn.`,
      () => `Flashback — cảnh tượng năm xưa bùng lên không cảnh báo, rõ nét đến mức đau, nhắc nhở tại sao tất cả điều này cần phải xảy ra.`,
      (ctx) => `Đối mặt gián tiếp — ${ctx.protagonist} và ${ctx.antagonist} trong cùng phòng, đều biết sự thật về nhau nhưng chưa ai lật bài.`,
      () => `Người đồng minh trao thông tin rủi ro — cái giá phải trả cho mảnh ghép tiếp theo của kế hoạch.`,
      () => `Căn hầm bí mật — hàng chục hộp bằng chứng, mỗi tờ giấy là một tội ác được chứng minh, và cũng là một vết thương mới.`,
      () => `Khoảnh khắc một mình — mặt nạ rơi xuống, bàn tay run nhẹ, nước mắt không khóc được dù muốn.`,
    ],
    haoMonLatMatNhatBan: [
      (ctx) => `Bữa tối gia đình — mọi thứ hoàn hảo đến từng chiếc đũa, mọi nụ cười đều được tính toán, và ${ctx.protagonist} bắt đầu nhận ra điều gì đó không ổn.`,
      () => `Phòng trà — chủ nhà rót nước với đôi bàn tay thoăn thoắt, từng động tác là nghi lễ, nhưng câu hỏi được đặt ra nhẹ nhàng như một bản án.`,
      (ctx) => `Hành lang sau buổi lễ — ${ctx.protagonist} vô tình nghe được cuộc trò chuyện không dành cho tai mình, và thế giới vừa thay đổi không thể đảo ngược.`,
      () => `Vườn zen lúc sáng sớm — người lớn tuổi nhất gia tộc ngồi đó, im lặng, và cái im lặng đó đáng sợ hơn bất kỳ lời đe dọa nào.`,
      () => `Phòng lưu trữ tài liệu gia tộc — bụi bặm và bí mật, mỗi tờ giấy cũ là một phần của sự thật đã bị chôn vùi.`,
      () => `Cuộc gặp riêng được sắp xếp — lịch sự đến mức lạnh người, ai cũng biết đây là thương lượng, không ai nói ra.`,
    ],
    giaDinhCamXucNhatBan: [
      (ctx) => `Nhà bếp sáng sớm — ${ctx.protagonist} thức dậy thấy bố/mẹ đã dậy từ lúc nào, làm điều gì đó thầm lặng như mọi ngày, và hôm nay điều đó bỗng làm đau lòng.`,
      () => `Bữa cơm tối — mọi người ngồi đủ mặt nhưng ai cũng nhìn vào chén riêng, và tiếng đũa chạm bát nghe rõ đến lạ.`,
      () => `Chuyến tàu hỏa — khoảng không gian bị giam cầm cùng nhau đủ lâu để lần đầu ai đó nói thật.`,
      () => `Album ảnh cũ — từng tấm hình là một phiên bản gia đình khác, và câu hỏi tự nó xuất hiện: hồi đó chúng ta có hạnh phúc không?`,
      () => `Bệnh viện — khủng hoảng không ai mong muốn nhưng kéo mọi người lại gần nhau, dù không ai biết phải nói gì.`,
      () => `Đêm mưa — một cuộc trò chuyện không ai định bắt đầu, nhưng đã bắt đầu, và giờ không thể dừng lại.`,
    ],
    japanShockSerialized: [
      (ctx) => `${ctx.protagonist} xem lại đoạn ghi hình — và lần này nhận ra chi tiết nhỏ không khớp với ký ức, tim đập nhanh hơn.`,
      () => `Cuộc gặp với người biết nhiều hơn nói — mỗi câu trả lời chỉ là câu hỏi khác, nhưng lần này có thứ gì đó bị trượt ra ngoài tầm kiểm soát.`,
      () => `Căn phòng ghi chú — dây kéo từ điểm này sang điểm khác, và nhân vật chính nhìn vào đó như nhìn vào bản đồ não của chính mình.`,
      () => `Đêm khuya trên đường phố — đèn neon phản chiếu trên mặt đường ướt, và bóng người theo sau từ lúc nào không rõ.`,
      () => `Flashback xuất hiện không mời — rõ ràng, hoàn hảo, và hoàn toàn mâu thuẫn với những gì vừa được chứng minh là thật.`,
      (ctx) => `Đối mặt trực tiếp — ${ctx.protagonist} hỏi câu hỏi biết câu trả lời, ${ctx.antagonist} trả lời câu hỏi không được hỏi, và cả hai đều biết trò chơi vừa sang giai đoạn mới.`,
    ],
  };

  function getScenesForPreset(preset, episodeNum, totalEpisodes, storyContext) {
    const pool = SCENE_POOLS[preset.id] || SCENE_POOLS.doanhTraiHanQuoc;
    const count = 3 + Math.floor(Math.random() * 3);
    const picked = shuffle(pool).slice(0, count);
    return picked.map((fn, i) => ({
      sceneNumber: i + 1,
      description: fn(storyContext),
    }));
  }

  // ── Character generation ──────────────────────────────────────────────

  function generateCharacter(archetype, customName) {
    const presets = window.DNA_PRESETS;
    let baseArchetype = null;
    for (const key in presets) {
      const found = presets[key].characterArchetypes.find(
        (a) => a.role === archetype || a.name === archetype
      );
      if (found) { baseArchetype = found; break; }
    }

    const name = customName || (baseArchetype ? baseArchetype.name : archetype || "Nhân Vật Bí Ẩn");
    const traits = baseArchetype ? baseArchetype.traits.slice() : ["kiên cường", "đa cảm"];
    const motivation = baseArchetype ? baseArchetype.motivation : "Tìm kiếm ý nghĩa trong thế giới hỗn loạn";

    const arcs = [
      "Từ chối hiện thực → Đối mặt bắt buộc → Thay đổi đau đớn → Chấp nhận và lớn lên",
      "Tự tin thái quá → Thất bại nặng → Tìm lại bản thân → Trỗi dậy thật sự",
      "Ẩn giấu bản thân → Dần hé lộ → Bị tổn thương khi mở lòng → Chọn tin tưởng tiếp",
      "Sứ mệnh trả thù → Gặp điều làm lung lay → Cuộc chiến nội tâm → Tái định nghĩa mục tiêu",
    ];

    const backstories = [
      "Lớn lên trong môi trường đòi hỏi cao, học cách giỏi thay vì học cách cảm nhận.",
      "Mất đi người quan trọng nhất trong một biến cố không ai ngờ — và từ đó không còn như trước.",
      "Từng tin tưởng tuyệt đối vào ai đó, bị phản bội, và thề không bao giờ lặp lại sai lầm đó.",
      "Xuất thân bình thường nhưng số phận đặt vào hoàn cảnh phi thường, buộc phải chọn con người mình muốn trở thành.",
    ];

    const speechPatterns = [
      "Nói ít, mỗi câu đều có trọng lượng. Im lặng lâu trước khi trả lời câu hỏi quan trọng.",
      "Nói thẳng đến mức gây khó chịu, hiếm khi nói vòng vo, ngại lời khen.",
      "Dùng ẩn dụ và câu chuyện để nói điều mình thật sự muốn nói.",
      "Bề ngoài nhẹ nhàng, lịch sự — nhưng khi chạm đến giới hạn thì cực kỳ quyết đoán.",
    ];

    return {
      name,
      role: archetype || (baseArchetype ? baseArchetype.role : "Nhân Vật Phụ"),
      traits,
      motivation,
      backstory: getRandomElement(backstories),
      speechPattern: getRandomElement(speechPatterns),
      arc: getRandomElement(arcs),
    };
  }

  // ── Synopsis generation ───────────────────────────────────────────────

  function generateSynopsis(preset, options) {
    const hero = options.protagonist || "nhân vật chính";
    const villain = options.antagonist || "thế lực đối lập";
    const setting = options.setting || getRandomElement(preset.settingElements) || "bối cảnh đặc biệt";
    const dna1 = getRandomElement(preset.coreDNA);
    const dna2 = getRandomElement(preset.coreDNA.filter(d => d !== dna1)) || dna1;
    const arc = getRandomElement(preset.arcStructure);

    const p1 = `Trong ${setting}, ${hero} bước vào một thế giới nơi ${dna1.toLowerCase()}. Cuộc sống tưởng như được kiểm soát hoàn toàn cho đến khi ${villain} xuất hiện — không phải như một kẻ thù đơn giản, mà như một lực lượng buộc ${hero} phải đối mặt với những điều họ đã cố tình lảng tránh.`;

    const p2 = `${arc.name} mở ra khi ${getRandomElement(arc.beats).toLowerCase()}. ${dna2}. Mỗi bước tiến về phía sự thật lại kéo theo một mất mát, và ${hero} dần nhận ra rằng câu hỏi thật sự không phải là thắng hay thua — mà là họ còn lại là ai sau tất cả.`;

    const p3 = `Một câu chuyện về ${preset.coreDNA[0].toLowerCase()} — nơi ranh giới giữa đúng và sai mờ nhạt, và giá trị thật sự của một con người chỉ hiện ra khi tất cả vỏ bọc bị lột đi.`;

    return [p1, p2, p3].join("\n\n");
  }

  // ── Hook generation ───────────────────────────────────────────────────

  function generateHook(preset) {
    const pool = preset.hooks || [];
    const extras = [
      `Có những câu chuyện bắt đầu bằng một lựa chọn. Câu chuyện này bắt đầu bằng một sai lầm mà không ai nhận ra cho đến khi quá muộn.`,
      `Tôi đã tự hỏi mình hàng trăm lần: nếu được làm lại, tôi có chọn khác không? Câu trả lời luôn làm tôi sợ.`,
      `Người ta nói thời gian chữa lành tất cả. Người ta sai. Thời gian chỉ dạy ta cách giả vờ ổn hơn.`,
    ];
    return getRandomElement([...pool, ...extras]);
  }

  // ── Twist generation ─────────────────────────────────────────────────

  function generateTwist(preset, episodeNum, totalEpisodes) {
    const position = episodeNum / totalEpisodes;
    const twists = preset.plotTwistFormulas || [];
    const earlyTwists = [
      "Một nhân vật phụ tưởng vô hại hóa ra đang quan sát mọi thứ từ đầu.",
      "Thứ được coi là ngẫu nhiên thật ra đã được dàn xếp.",
      "Thông tin quan trọng đã có từ tập 1 — chỉ là chưa ai đặt đúng câu hỏi.",
    ];
    const midTwists = [
      "Đồng minh thân thiết vừa làm điều không thể giải thích theo logic tốt bụng.",
      "Kẻ xấu có lý do — và lý do đó không hoàn toàn sai.",
      "Nạn nhân và thủ phạm hoán đổi vị trí khi nhìn từ góc độ khác.",
    ];
    const lateTwists = [
      ...twists,
      "Tất cả những gì đã xảy ra đều nằm trong kế hoạch của người ít nghi ngờ nhất.",
      "Chiến thắng đến — nhưng cái giá phải trả không phải thứ nhân vật chính đã sẵn sàng.",
    ];

    if (position < 0.3) return getRandomElement(earlyTwists);
    if (position < 0.7) return getRandomElement([...midTwists, ...twists]);
    return getRandomElement(lateTwists);
  }

  // ── Episode generation ────────────────────────────────────────────────

  function generateEpisode(preset, episodeNum, totalEpisodes, storyContext) {
    const arcIndex = Math.floor((episodeNum / totalEpisodes) * preset.arcStructure.length);
    const arc = preset.arcStructure[Math.min(arcIndex, preset.arcStructure.length - 1)];
    const beat = getRandomElement(arc.beats);

    const titlePrefixes = ["Khi", "Sau", "Trước khi", "Giữa", "Cuối", "Đêm", "Buổi sáng của"];
    const titleCore = beat.split("—")[0].trim().toLowerCase();
    const episodeTitle = `${getRandomElement(titlePrefixes)} ${titleCore}`;

    const hook = generateHook(preset);
    const scenes = getScenesForPreset(preset, episodeNum, totalEpisodes, storyContext);
    const emotionalPeak = getRandomElement(preset.emotionalBeats);
    const twist = generateTwist(preset, episodeNum, totalEpisodes);

    const cliffhangerTemplates = [
      `Và đúng lúc ${storyContext.protagonist || "nhân vật chính"} nghĩ mọi thứ đã rõ — ${twist.toLowerCase()}`,
      `Câu trả lời vừa có được thì câu hỏi lớn hơn xuất hiện: ${twist.toLowerCase()}`,
      `${beat.split("—")[0].trim()} — nhưng sự thật thật sự còn chưa lộ mặt.`,
      `Màn hạ xuống với hình ảnh: ${getRandomElement(preset.settingElements)} — và một chi tiết nhỏ mà đến tập sau mới rõ ý nghĩa.`,
    ];

    return {
      number: episodeNum,
      title: episodeTitle,
      hook,
      scenes,
      emotionalPeak,
      cliffhanger: getRandomElement(cliffhangerTemplates),
      wordCount: 1800 + Math.floor(Math.random() * 800),
    };
  }

  // ── Main story generation ─────────────────────────────────────────────

  function generateStory(presetId, options) {
    options = options || {};
    const preset = window.DNA_PRESETS && window.DNA_PRESETS[presetId];
    if (!preset) throw new Error('Preset "' + presetId + '" không tồn tại.');

    const totalEpisodes = Math.min(Math.max(parseInt(options.episodeCount) || 8, 1), 20);
    const title = options.title || (preset.name + ': ' + getRandomElement(preset.coreDNA).split(' ').slice(0, 5).join(' ') + '...');

    const storyContext = {
      protagonist: options.protagonist || getRandomElement(preset.characterArchetypes).name,
      antagonist: options.antagonist || getRandomElement(preset.characterArchetypes.slice(1)).name,
      setting: options.setting || getRandomElement(preset.settingElements),
      tone: options.tone || preset.dialogueStyle.split('.')[0],
    };

    const characters = preset.characterArchetypes.map((arch) =>
      generateCharacter(arch.role, arch.name)
    );

    if (options.protagonist) characters[0].name = options.protagonist;
    if (options.antagonist && characters[1]) characters[1].name = options.antagonist;

    storyContext.protagonist = characters[0].name;
    storyContext.antagonist = characters[1] ? characters[1].name : storyContext.antagonist;

    const synopsis = generateSynopsis(preset, Object.assign({}, options, storyContext));
    const themes = shuffle(preset.coreDNA).slice(0, 3);

    const episodes = [];
    for (let i = 1; i <= totalEpisodes; i++) {
      episodes.push(generateEpisode(preset, i, totalEpisodes, storyContext));
    }

    return {
      id: uid(),
      presetId,
      title,
      synopsis,
      episodes,
      characters,
      themes,
      createdAt: new Date().toISOString(),
    };
  }

  return {
    generateStory,
    generateEpisode,
    generateCharacter,
    generateSynopsis,
    generateHook,
    generateTwist,
    getRandomElement,
    shuffle,
  };

})();
