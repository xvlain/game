/**
 * story.js - 剧情/地图/关卡管理器
 * 节点图系统：玩家沿不同故事线浏览剧情
 * 支持剧情对话、战斗关卡、分支选择
 */

// ============ 剧情数据（占位，后期由"元首"填充） ============
const StoryData = {
  // 章节定义
  chapters: [
    {
      id: 'ch1',
      name: '序章·黎明之前',
      description: '一切的起点，命运的齿轮开始转动…',
      unlockCondition: null, // 第一章无前置条件
      // 剧情背景映射：节点 ID → 背景图路径（美术 2026-09-19 产出）
      backgrounds: {
        'ch1_n1': 'assets/maps/story/awakening_void.png',
        'ch1_n2': 'assets/maps/story/awakening_void.png',
        'ch1_n3': 'assets/maps/battle/arena_default.png',
        'ch1_n4': 'assets/maps/story/ancient_path.png',
        'ch1_n5a': 'assets/maps/story/ancient_ruins.png',
        'ch1_n5b': 'assets/maps/story/dark_forest.png',
        'ch1_n6': 'assets/maps/battle/arena_default.png',
        'ch1_end': 'assets/maps/story/ancient_path.png'
      },
      nodes: [
        {
          id: 'ch1_n1',
          type: 'dialogue',
          title: '神秘的声音',
          position: { x: 100, y: 360 },
          content: [
            { speaker: '???', text: '你…终于醒了。' },
            { speaker: '???', text: '这里是世界的尽头，也是新旅途的起点。' },
            { speaker: '旁白', text: '一道刺眼的光芒穿透了黑暗，你缓缓睁开了双眼。' },
            { speaker: '旁白', text: '面前站着一位银发少女，她似乎已经在这里等候多时了。' }
          ],
          next: 'ch1_n2',
          rewards: null
        },
        {
          id: 'ch1_n2',
          type: 'dialogue',
          title: '少女的指引',
          position: { x: 280, y: 300 },
          content: [
            { speaker: '银发少女', text: '你醒了就好。我是"织星"，负责引导新来的旅者。' },
            { speaker: '织星', text: '你的记忆…大概已经模糊了吧？这是正常的。' },
            { speaker: '织星', text: '不过没关系，从这里开始，你会慢慢想起一切——也会认识新的同伴。' },
            { speaker: '织星', text: '跟我来吧，前方有你需要的东西。' }
          ],
          next: 'ch1_n3',
          rewards: { characters: ['healer'], items: { crystals: 100 } }
        },
        {
          id: 'ch1_n3',
          type: 'battle',
          title: '初次战斗',
          position: { x: 460, y: 360 },
          description: '遭遇了不明生物的袭击！',
          enemyConfig: [
            { id: 'slime_1', name: '暗影史莱姆', hp: 500, atk: 60, def: 30, spd: 80, element: 'none' },
            { id: 'slime_2', name: '暗影史莱姆', hp: 400, atk: 50, def: 25, spd: 75, element: 'none' }
          ],
          requiredParty: ['warrior', 'healer'], // 推荐编队
          next: 'ch1_n4',
          rewards: { items: { coins: 200, crystals: 50 } }
        },
        {
          id: 'ch1_n4',
          type: 'choice',
          title: '分岔路',
          position: { x: 640, y: 360 },
          content: [
            { speaker: '织星', text: '前面有两条路。左边通往古老的遗迹，右边是幽暗的森林。' },
            { speaker: '织星', text: '你想走哪条路？' }
          ],
          choices: [
            { text: '遗迹之路', next: 'ch1_n5a' },
            { text: '森林之路', next: 'ch1_n5b' }
          ]
        },
        {
          id: 'ch1_n5a',
          type: 'dialogue',
          title: '遗迹探索',
          position: { x: 820, y: 260 },
          content: [
            { speaker: '旁白', text: '你选择了通往古老遗迹的道路。' },
            { speaker: '织星', text: '这里曾是文明的中心…现在只剩下这些残垣断壁了。' },
            { speaker: '织星', text: '小心点，遗迹里的守护者可不友善。' }
          ],
          next: 'ch1_n6',
          rewards: { characters: ['mage'] }
        },
        {
          id: 'ch1_n5b',
          type: 'dialogue',
          title: '森林深处',
          position: { x: 820, y: 460 },
          content: [
            { speaker: '旁白', text: '你选择了通往幽暗森林的道路。' },
            { speaker: '织星', text: '森林里有不少灵兽，有些可以成为同伴哦。' },
            { speaker: '织星', text: '不过大多数…还是会攻击你的。做好准备。' }
          ],
          next: 'ch1_n6',
          rewards: { characters: ['tank'] }
        },
        {
          id: 'ch1_n6',
          type: 'battle',
          title: '守卫之战',
          position: { x: 1000, y: 360 },
          description: '前方出现了强大的守卫者！',
          enemyConfig: [
            { id: 'guardian', name: '遗迹守卫', hp: 1500, atk: 120, def: 80, spd: 70, element: 'earth' },
            { id: 'minion_1', name: '石像兵', hp: 600, atk: 70, def: 50, spd: 85, element: 'metal' }
          ],
          next: 'ch1_end',
          rewards: { items: { crystals: 200, coins: 500 } }
        },
        {
          id: 'ch1_end',
          type: 'dialogue',
          title: '序章结束',
          position: { x: 1160, y: 360 },
          content: [
            { speaker: '织星', text: '做得不错。你已经证明了自己的实力。' },
            { speaker: '织星', text: '但这只是开始…前方还有更大的挑战在等着你。' },
            { speaker: '织星', text: '准备好了吗？真正的旅途，现在才开始。' },
            { speaker: '旁白', text: '序章·完' }
          ],
          next: null, // 序章结束
          rewards: { items: { crystals: 500 } }
        }
      ]
    },
    {
      id: 'ch2',
      name: '第二章·命运交汇',
      description: '离开觉醒之地，前方是更广阔的世界…',
      unlockCondition: { completedChapter: 'ch1' }, // 需完成序章
      // 剧情背景映射（v0.18.0 第二章专属背景）
      backgrounds: {
        'ch2_n1': 'assets/maps/story/morning_town.png',
        'ch2_n2': 'assets/maps/story/ancient_crossroads.png',
        'ch2_n3': 'assets/maps/battle/forest_dark.png',
        'ch2_n4': 'assets/maps/story/fork_crossroads.png',
        'ch2_n5a': 'assets/maps/battle/crystal_cave.png',
        'ch2_n5b': 'assets/maps/battle/training_arena.png',
        'ch2_n6': 'assets/maps/story/moonlit_clearing.png',
        'ch2_n7': 'assets/maps/battle/arena_default.png',
        'ch2_end': 'assets/maps/story/moonlit_clearing.png'
      },
      nodes: [
        {
          id: 'ch2_n1',
          type: 'dialogue',
          title: '旅途的开始',
          position: { x: 100, y: 360 },
          content: [
            { speaker: '织星', text: '终于离开了觉醒之地。' },
            { speaker: '织星', text: '从这里开始，你会遇到更多的旅者…也会遇到更多的敌人。' },
            { speaker: '旁白', text: '你们沿着古道前行，远处的山峦在晨雾中若隐若现。' },
            { speaker: '织星', text: '前面有个小镇，可以去补给一下。' }
          ],
          next: 'ch2_n2',
          rewards: null
        },
        {
          id: 'ch2_n2',
          type: 'dialogue',
          title: '神秘的旅者',
          position: { x: 280, y: 300 },
          content: [
            { speaker: '???', text: '等等！你们也是旅者吗？' },
            { speaker: '旁白', text: '一个身穿深色斗篷的人从路边跳了出来。' },
            { speaker: '神秘旅者', text: '我叫"影"，一个人旅行太无聊了…能一起走吗？' },
            { speaker: '织星', text: '（小声）这个人…感觉有点可疑。' }
          ],
          next: 'ch2_n3',
          rewards: { items: { crystals: 150 } }
        },
        {
          id: 'ch2_n3',
          type: 'battle',
          title: '遭遇战',
          position: { x: 460, y: 360 },
          description: '一群暗影生物挡住了去路！',
          enemyConfig: [
            { id: 'shadow_1', name: '暗影狼', hp: 800, atk: 90, def: 45, spd: 95, element: 'water' },
            { id: 'shadow_2', name: '暗影狼', hp: 750, atk: 85, def: 40, spd: 90, element: 'water' },
            { id: 'shadow_3', name: '暗影蝠', hp: 600, atk: 100, def: 30, spd: 110, element: 'none' }
          ],
          requiredParty: ['warrior', 'healer', 'mage'],
          next: 'ch2_n4',
          rewards: { items: { coins: 400, crystals: 80 } }
        },
        {
          id: 'ch2_n4',
          type: 'choice',
          title: '分歧的路',
          position: { x: 640, y: 360 },
          content: [
            { speaker: '影', text: '前面有两条路可以走。' },
            { speaker: '影', text: '左边是水晶矿洞，听说里面有稀有材料。右边是修炼场，可以锻炼实力。' },
            { speaker: '织星', text: '你想去哪边？' }
          ],
          choices: [
            { text: '水晶矿洞', next: 'ch2_n5a' },
            { text: '修炼场', next: 'ch2_n5b' }
          ]
        },
        {
          id: 'ch2_n5a',
          type: 'dialogue',
          title: '矿洞探索',
          position: { x: 820, y: 260 },
          content: [
            { speaker: '旁白', text: '你们进入了幽暗的水晶矿洞。' },
            { speaker: '影', text: '哇…这些水晶好漂亮！' },
            { speaker: '织星', text: '小心，矿洞深处通常有守卫者。' },
            { speaker: '旁白', text: '远处传来沉重的脚步声…' }
          ],
          next: 'ch2_n6',
          rewards: { characters: ['mage'], items: { asc_stone_1: 3 } }
        },
        {
          id: 'ch2_n5b',
          type: 'dialogue',
          title: '修炼场',
          position: { x: 820, y: 460 },
          content: [
            { speaker: '旁白', text: '你们来到了古老的修炼场。' },
            { speaker: '影', text: '这里好像是旅者们切磋技艺的地方。' },
            { speaker: '织星', text: '正好可以检验一下我们的实力。' }
          ],
          next: 'ch2_n6',
          rewards: { characters: ['tank'], items: { exp_book_2: 2 } }
        },
        {
          id: 'ch2_n6',
          type: 'dialogue',
          title: '真相初现',
          position: { x: 920, y: 360 },
          content: [
            { speaker: '影', text: '那个…其实我有件事一直没告诉你们。' },
            { speaker: '织星', text: '（果然…）什么事？' },
            { speaker: '影', text: '我不是普通的旅者。我在寻找一样东西…一样很重要的东西。' },
            { speaker: '影', text: '但我需要帮手。你们愿意帮忙吗？' }
          ],
          next: 'ch2_n7',
          rewards: null
        },
        {
          id: 'ch2_n7',
          type: 'battle',
          title: '精英守卫',
          position: { x: 1060, y: 360 },
          description: '前方出现了强大的精英守卫！',
          enemyConfig: [
            { id: 'elite_1', name: '暗影骑士', hp: 2000, atk: 150, def: 100, spd: 85, element: 'metal' },
            { id: 'elite_2', name: '暗影法师', hp: 1200, atk: 180, def: 60, spd: 95, element: 'fire' },
            { id: 'elite_3', name: '暗影祭司', hp: 1400, atk: 120, def: 80, spd: 90, element: 'wood' }
          ],
          next: 'ch2_end',
          rewards: { items: { crystals: 300, coins: 800 } }
        },
        {
          id: 'ch2_end',
          type: 'dialogue',
          title: '第二章结束',
          position: { x: 1200, y: 360 },
          content: [
            { speaker: '影', text: '谢谢你们…愿意相信我。' },
            { speaker: '影', text: '接下来我要去的地方很危险…但我觉得有你们在就没问题。' },
            { speaker: '织星', text: '（这个人的秘密…以后再说吧。）' },
            { speaker: '旁白', text: '第二章·完' },
            { speaker: '旁白', text: '新的冒险，即将展开…' }
          ],
          next: null,
          rewards: { items: { crystals: 800, coins: 1500 } }
        }
      ]
    },
    {
      id: 'ch3',
      name: '第三章·暗影之源',
      description: '影的秘密逐渐揭开，暗影组织的阴谋浮出水面…',
      unlockCondition: { completedChapter: 'ch2' },
      // 剧情背景映射（复用现有素材，后期替换为第三章专用背景）
      backgrounds: {
        'ch3_n1': 'assets/maps/story/ancient_path.png',
        'ch3_n2': 'assets/maps/battle/crystal_cave.png',
        'ch3_n3': 'assets/maps/battle/crystal_cave.png',
        'ch3_n4': 'assets/maps/story/ancient_ruins.png',
        'ch3_n5a': 'assets/maps/battle/star_abyss.png',
        'ch3_n5b': 'assets/maps/battle/holy_sanctuary.png',
        'ch3_n6': 'assets/maps/battle/chaos_void.png',
        'ch3_n7': 'assets/maps/battle/chaos_void.png',
        'ch3_end': 'assets/maps/story/ancient_path.png'
      },
      nodes: [
        {
          id: 'ch3_n1',
          type: 'dialogue',
          title: '影的告白',
          position: { x: 100, y: 360 },
          content: [
            { speaker: '旁白', text: '离开小镇后，影突然停下了脚步。' },
            { speaker: '影', text: '我有件事必须告诉你们…关于我的真实身份。' },
            { speaker: '织星', text: '（终于要说了吗…）' },
            { speaker: '影', text: '我其实是"暗影组织"的逃亡者。他们…在进行某种危险的实验。' },
            { speaker: '影', text: '我在寻找他们隐藏的"暗影之源"——那是一切暗影生物的力量根基。' },
            { speaker: '织星', text: '暗影组织…我听说过。据说他们试图掌控世界的元素之力。' },
            { speaker: '影', text: '没错。而且他们已经成功了…一部分。' }
          ],
          next: 'ch3_n2',
          rewards: null
        },
        {
          id: 'ch3_n2',
          type: 'dialogue',
          title: '追踪线索',
          position: { x: 280, y: 300 },
          content: [
            { speaker: '影', text: '暗影之源的入口…应该就在这片区域附近。' },
            { speaker: '织星', text: '这些水晶…散发着不寻常的能量。' },
            { speaker: '旁白', text: '你们来到了一片被暗影侵蚀的水晶矿洞。' },
            { speaker: '影', text: '没错，这些水晶被暗影污染了。顺着它们就能找到源头。' },
            { speaker: '织星', text: '小心，有守卫。' }
          ],
          next: 'ch3_n3',
          rewards: { items: { crystals: 200 } }
        },
        {
          id: 'ch3_n3',
          type: 'battle',
          title: '暗影精锐',
          position: { x: 460, y: 360 },
          description: '暗影组织的精锐部队出现了！',
          enemyConfig: [
            { id: 'shadow_elite_1', name: '暗影刺客', hp: 1200, atk: 160, def: 70, spd: 120, element: 'water' },
            { id: 'shadow_elite_2', name: '暗影术士', hp: 1000, atk: 200, def: 50, spd: 100, element: 'fire' },
            { id: 'shadow_elite_3', name: '暗影盾卫', hp: 1800, atk: 100, def: 130, spd: 75, element: 'earth' }
          ],
          requiredParty: ['warrior', 'healer', 'mage', 'guard'],
          next: 'ch3_n4',
          rewards: { items: { coins: 600, crystals: 100, asc_stone_2: 2 } }
        },
        {
          id: 'ch3_n4',
          type: 'dialogue',
          title: '遗迹中的秘密',
          position: { x: 640, y: 360 },
          content: [
            { speaker: '旁白', text: '击败暗影精锐后，你们在矿洞深处发现了一座古老的遗迹。' },
            { speaker: '织星', text: '这些符文…是上古文明的记载。' },
            { speaker: '织星', text: '上面说…暗影之源其实是被封印的"混沌之力"。' },
            { speaker: '影', text: '混沌之力…难怪暗影组织如此执着。' },
            { speaker: '织星', text: '如果让暗影组织完全掌控这股力量，整个世界都会陷入混沌。' },
            { speaker: '影', text: '我们必须阻止他们。' }
          ],
          next: 'ch3_n5a',
          rewards: { characters: ['ssr_03'], items: { exp_book_3: 1 } }
        },
        {
          id: 'ch3_n5a',
          type: 'choice',
          title: '命运的抉择',
          position: { x: 820, y: 360 },
          content: [
            { speaker: '影', text: '前方有两条路。左边通往暗影组织的核心实验室，右边是他们的能量供给站。' },
            { speaker: '织星', text: '摧毁实验室可以直接削弱他们的战力，但供给站也很重要。' },
            { speaker: '影', text: '你来决定吧。' }
          ],
          choices: [
            { text: '突袭核心实验室', next: 'ch3_n5b' },
            { text: '摧毁能量供给站', next: 'ch3_n5c' }
          ]
        },
        {
          id: 'ch3_n5b',
          type: 'dialogue',
          title: '核心实验室',
          position: { x: 1000, y: 260 },
          content: [
            { speaker: '旁白', text: '你们潜入了暗影组织的核心实验室。' },
            { speaker: '影', text: '这里…比我想象的还要恐怖。' },
            { speaker: '织星', text: '他们在用活人做实验…把人类转化为暗影生物。' },
            { speaker: '影', text: '…我必须摧毁这一切。' },
            { speaker: '旁白', text: '影的眼中闪过坚定的光芒。' }
          ],
          next: 'ch3_n6',
          rewards: { items: { crystals: 300, asc_stone_3: 1 } }
        },
        {
          id: 'ch3_n5c',
          type: 'dialogue',
          title: '能量供给站',
          position: { x: 1000, y: 460 },
          content: [
            { speaker: '旁白', text: '你们来到了暗影组织的能量供给站。' },
            { speaker: '织星', text: '这些巨大的水晶柱…在源源不断地向某处输送能量。' },
            { speaker: '影', text: '如果切断供给，暗影之源的力量会大幅削弱。' },
            { speaker: '织星', text: '但也一定会惊动他们的首领。' },
            { speaker: '影', text: '无所谓。反正迟早要面对的。' }
          ],
          next: 'ch3_n6',
          rewards: { items: { crystals: 300, asc_stone_2: 3 } }
        },
        {
          id: 'ch3_n6',
          type: 'battle',
          title: '暗影首领',
          position: { x: 1160, y: 360 },
          description: '暗影组织的首领亲自出现了！',
          enemyConfig: [
            { id: 'shadow_lord', name: '暗影领主·墨', hp: 4000, atk: 250, def: 120, spd: 95, element: 'water' },
            { id: 'shadow_bodyguard_1', name: '暗影近卫', hp: 2000, atk: 180, def: 110, spd: 90, element: 'metal' },
            { id: 'shadow_bodyguard_2', name: '暗影近卫', hp: 2000, atk: 180, def: 110, spd: 90, element: 'fire' }
          ],
          next: 'ch3_n7',
          rewards: { items: { crystals: 500, coins: 1200 } }
        },
        {
          id: 'ch3_n7',
          type: 'dialogue',
          title: '真相大白',
          position: { x: 1340, y: 360 },
          content: [
            { speaker: '暗影领主·墨', text: '呵…你以为摧毁这里就结束了吗？' },
            { speaker: '暗影领主·墨', text: '暗影之源…早已被我转移到了别处。' },
            { speaker: '影', text: '什么！？' },
            { speaker: '暗影领主·墨', text: '而且…你以为你是逃亡者？不，你只是我放出去的棋子。' },
            { speaker: '暗影领主·墨', text: '是你把我们引到了混沌之力的封印之地。哈哈哈…' },
            { speaker: '影', text: '……！' },
            { speaker: '织星', text: '别听他的！影，你不是棋子。你选择了站在我们这边。' },
            { speaker: '旁白', text: '暗影领主在狂笑中化作黑烟消散。' },
            { speaker: '影', text: '…谢谢你们。不管怎样，我一定会找到暗影之源，亲手摧毁它。' }
          ],
          next: 'ch3_end',
          rewards: null
        },
        {
          id: 'ch3_end',
          type: 'dialogue',
          title: '第三章结束',
          position: { x: 1520, y: 360 },
          content: [
            { speaker: '织星', text: '暗影之源被转移了…看来我们的旅途还很长。' },
            { speaker: '影', text: '不管它在哪里，我都会找到它。这是我的责任。' },
            { speaker: '织星', text: '不是"你的"责任——是"我们"的责任。' },
            { speaker: '旁白', text: '三人相视而笑，踏上了新的征程。' },
            { speaker: '旁白', text: '暗影的阴谋远未终结，但旅者们不再迷茫。' },
            { speaker: '旁白', text: '第三章·完' }
          ],
          next: null,
          rewards: { items: { crystals: 1200, coins: 2500 } }
        }
      ]
    }
  ],

  // 获取章节
  getChapter(chapterId) {
    return this.chapters.find(ch => ch.id === chapterId);
  },

  // 获取节点
  getNode(chapterId, nodeId) {
    const chapter = this.getChapter(chapterId);
    if (!chapter) return null;
    return chapter.nodes.find(n => n.id === nodeId);
  },

  // 获取节点背景图路径
  getNodeBackground(chapterId, nodeId) {
    const chapter = this.getChapter(chapterId);
    if (!chapter || !chapter.backgrounds) return null;
    return chapter.backgrounds[nodeId] || null;
  }
};

// ============ 剧情管理器 ============
class StoryManager {
  constructor() {
    this.currentChapter = null;
    this.currentNode = null;
    this.dialogueIndex = 0;
    this.completedNodes = new Set();
    this.unlockedChapters = new Set(['ch1']);
    this.onDialogueAdvance = null;
    this.onNodeComplete = null;
    this.onChoicePresented = null;
    this.onBattleStart = null;
  }

  // 加载进度
  loadProgress(progress) {
    if (progress.completedNodes) {
      this.completedNodes = new Set(progress.completedNodes);
    }
    if (progress.unlockedChapters) {
      this.unlockedChapters = new Set(progress.unlockedChapters);
    }
  }

  // 导出进度
  saveProgress() {
    return {
      completedNodes: [...this.completedNodes],
      unlockedChapters: [...this.unlockedChapters]
    };
  }

  // 进入章节
  enterChapter(chapterId) {
    const chapter = StoryData.getChapter(chapterId);
    if (!chapter) return false;
    if (!this.unlockedChapters.has(chapterId)) return false;

    this.currentChapter = chapter;
    // 找到第一个未完成的节点
    const firstUncompleted = chapter.nodes.find(n => !this.completedNodes.has(n.id));
    this.currentNode = firstUncompleted || chapter.nodes[0];
    this.dialogueIndex = 0;

    return true;
  }

  // 推进对话
  advanceDialogue() {
    if (!this.currentNode) return { type: 'none' };

    if (this.currentNode.type === 'dialogue' || this.currentNode.type === 'choice') {
      const content = this.currentNode.content || [];
      this.dialogueIndex++;

      if (this.dialogueIndex >= content.length) {
        // 对话结束
        if (this.currentNode.type === 'choice') {
          // 等待选择
          return { type: 'choice', choices: this.currentNode.choices };
        }
        return this._completeNode();
      }

      return { type: 'dialogue', line: content[this.dialogueIndex] };
    }

    return { type: 'none' };
  }

  // 做出选择
  makeChoice(choiceIndex) {
    if (!this.currentNode || this.currentNode.type !== 'choice') return;

    const choice = this.currentNode.choices[choiceIndex];
    if (!choice) return;

    this.completedNodes.add(this.currentNode.id);
    this.currentNode = StoryData.getNode(this.currentChapter.id, choice.next);
    this.dialogueIndex = 0;

    if (this.currentNode && this.currentNode.type === 'battle') {
      return { type: 'battle', config: this.currentNode.enemyConfig };
    }

    if (this.currentNode && this.currentNode.content) {
      return { type: 'dialogue', line: this.currentNode.content[0] };
    }

    return { type: 'none' };
  }

  // 进入战斗节点
  enterBattleNode() {
    if (!this.currentNode || this.currentNode.type !== 'battle') return null;
    return {
      enemies: this.currentNode.enemyConfig,
      description: this.currentNode.description
    };
  }

  // 战斗胜利后完成节点
  completeBattleNode() {
    return this._completeNode();
  }

  // 完成当前节点
  _completeNode() {
    if (!this.currentNode) return { type: 'none' };

    this.completedNodes.add(this.currentNode.id);

    // 发放奖励
    const rewards = this.currentNode.rewards;
    if (rewards && this.onNodeComplete) {
      this.onNodeComplete(this.currentNode, rewards);
    }

    // 推进到下一节点
    const nextId = this.currentNode.next;
    if (!nextId) {
      // 章节结束 - 检查并解锁后续章节
      const currentChapterId = this.currentChapter.id;
      for (const ch of StoryData.chapters) {
        if (ch.unlockCondition && ch.unlockCondition.completedChapter === currentChapterId) {
          this.unlockedChapters.add(ch.id);
          console.log(`[Story] 已解锁章节: ${ch.name}`);
        }
      }
      return { type: 'chapter_end', chapter: this.currentChapter };
    }

    this.currentNode = StoryData.getNode(this.currentChapter.id, nextId);
    this.dialogueIndex = 0;

    if (!this.currentNode) return { type: 'error' };

    if (this.currentNode.type === 'battle') {
      if (this.onBattleStart) this.onBattleStart(this.currentNode);
      return { type: 'battle', config: this.currentNode.enemyConfig };
    }

    if (this.currentNode.content && this.currentNode.content.length > 0) {
      return { type: 'dialogue', line: this.currentNode.content[0] };
    }

    return { type: 'none' };
  }

  // 获取当前对话行
  getCurrentDialogue() {
    if (!this.currentNode || !this.currentNode.content) return null;
    return this.currentNode.content[this.dialogueIndex] || null;
  }

  // 获取章节列表（含解锁状态）
  getChapterList() {
    return StoryData.chapters.map(ch => ({
      id: ch.id,
      name: ch.name,
      description: ch.description,
      unlocked: this.unlockedChapters.has(ch.id),
      completed: ch.nodes.every(n => this.completedNodes.has(n.id)),
      nodeCount: ch.nodes.length,
      completedCount: ch.nodes.filter(n => this.completedNodes.has(n.id)).length
    }));
  }
}

// 导出
window.StoryManager = StoryManager;
window.StoryData = StoryData;
