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
      // 剧情背景映射（v0.18.0 含第三章专用背景）
      backgrounds: {
        'ch3_n1': 'assets/maps/story/shadow_confession.png',
        'ch3_n2': 'assets/maps/story/shadow_base.png',
        'ch3_n3': 'assets/maps/story/shadow_base.png',
        'ch3_n4': 'assets/maps/story/shadow_ruins.png',
        'ch3_n5a': 'assets/maps/battle/star_abyss.png',
        'ch3_n5b': 'assets/maps/story/shadow_base.png',
        'ch3_n5c': 'assets/maps/story/shadow_base.png',
        'ch3_n6': 'assets/maps/story/shadow_realm.png',
        'ch3_n7': 'assets/maps/story/shadow_realm.png',
        'ch3_end': 'assets/maps/story/shadow_dawn.png'
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
    },
    {
      id: 'ch4',
      name: '第四章·光之残响',
      description: '暗影之源的去向指向了古代光之文明的遗迹，追寻光明的残响…',
      unlockCondition: { completedChapter: 'ch3' },
      // 剧情背景映射（v0.20.0 第四章专属背景）
      backgrounds: {
        'ch4_n1': 'assets/maps/story/light_ruins_entrance.png',
        'ch4_n2': 'assets/maps/story/light_ruins_entrance.png',
        'ch4_n3': 'assets/maps/battle/holy_sanctuary.png',
        'ch4_n4': 'assets/maps/story/light_sanctuary.png',
        'ch4_n5': 'assets/maps/story/light_sanctuary.png',
        'ch4_n6': 'assets/maps/battle/star_abyss.png',
        'ch4_n7': 'assets/maps/story/light_sanctuary.png',
        'ch4_n8a': 'assets/maps/battle/holy_sanctuary.png',
        'ch4_n8b': 'assets/maps/battle/star_abyss.png',
        'ch4_n9': 'assets/maps/story/light_nexus.png',
        'ch4_n10': 'assets/maps/story/light_nexus.png',
        'ch4_end': 'assets/maps/story/light_dawn.png'
      },
      nodes: [
        {
          id: 'ch4_n1',
          type: 'dialogue',
          title: '古卷的指引',
          position: { x: 100, y: 360 },
          content: [
            { speaker: '旁白', text: '击败暗影领主后，你们在遗迹深处发现了一卷古老卷轴。' },
            { speaker: '织星', text: '这上面记载的是…上古"光之文明"的文字。' },
            { speaker: '织星', text: '让我看看…上面写着："当暗影笼罩大地，唯有光之残响能驱散混沌。"' },
            { speaker: '影', text: '光之残响？那是什么？' },
            { speaker: '织星', text: '传说中，远古有一个文明掌握了纯粹的光之力量。他们在一场大灾变中消亡，但力量被封印在各地的遗迹中。' },
            { speaker: '织星', text: '卷轴指向了最近的遗迹——就在北方的"辉光高原"上。' },
            { speaker: '影', text: '如果能找到对抗暗影的力量…我们走。' }
          ],
          next: 'ch4_n2',
          rewards: null
        },
        {
          id: 'ch4_n2',
          type: 'dialogue',
          title: '辉光遗迹',
          position: { x: 280, y: 300 },
          content: [
            { speaker: '旁白', text: '经过长途跋涉，你们终于来到了辉光高原。' },
            { speaker: '旁白', text: '巨大的白色石柱从地面延伸到天空，表面刻满了发光的符文。空气中弥漫着温暖而微弱的光芒。' },
            { speaker: '影', text: '这里…感觉和暗影基地完全相反。空气都不一样。' },
            { speaker: '织星', text: '光之力量虽然已经衰微，但残响依然存在。' },
            { speaker: '织星', text: '不过…这些封印好像在被什么东西侵蚀。' },
            { speaker: '旁白', text: '你注意到白色石柱的根部有暗紫色的裂纹在蔓延。' }
          ],
          next: 'ch4_n3',
          rewards: { items: { crystals: 200 } }
        },
        {
          id: 'ch4_n3',
          type: 'battle',
          title: '遗迹守卫',
          position: { x: 460, y: 360 },
          description: '古代光之守卫将你们误认为入侵者！',
          enemyConfig: [
            { id: 'light_guardian_1', name: '光之哨兵', hp: 1800, atk: 140, def: 120, spd: 85, element: 'metal' },
            { id: 'light_guardian_2', name: '光之哨兵', hp: 1800, atk: 140, def: 120, spd: 85, element: 'metal' },
            { id: 'light_golem', name: '辉光石像', hp: 2500, atk: 120, def: 160, spd: 65, element: 'earth' }
          ],
          requiredParty: ['warrior', 'healer', 'mage', 'guard'],
          next: 'ch4_n4',
          rewards: { items: { coins: 800, crystals: 150, asc_stone_3: 1 } }
        },
        {
          id: 'ch4_n4',
          type: 'dialogue',
          title: '光之圣女',
          position: { x: 640, y: 300 },
          content: [
            { speaker: '旁白', text: '击败守卫后，圣殿深处传来一道柔和的声音。' },
            { speaker: '???', text: '请…不要伤害它们。它们只是在执行守护的职责。' },
            { speaker: '旁白', text: '一位身着白色长袍的少女从光芒中走出。她的银色长发泛着淡金色的光泽，眼眸中仿佛盛满了星辰。' },
            { speaker: '光之少女', text: '我叫"曦"。是这座遗迹最后的守护者。' },
            { speaker: '曦', text: '你们…是旅者？已经很久没有人类能走到这里了。' },
            { speaker: '织星', text: '我们在寻找"光之残响"——用来对抗暗影之源的力量。' },
            { speaker: '曦', text: '…光之残响。你说的是"光之枢纽"吧。' },
            { speaker: '曦', text: '它就在圣殿最深处。但…它已经沉睡了很久。' }
          ],
          next: 'ch4_n5',
          rewards: { characters: ['sr_xi'], items: { crystals: 300 } }
        },
        {
          id: 'ch4_n5',
          type: 'dialogue',
          title: '沉睡的枢纽',
          position: { x: 820, y: 360 },
          content: [
            { speaker: '旁白', text: '曦带领你们穿过层层封印的走廊，来到圣殿核心。' },
            { speaker: '旁白', text: '一个巨大的水晶球悬浮在祭坛上方，表面黯淡无光，只有偶尔闪过的微弱光芒证明它还没有完全死去。' },
            { speaker: '曦', text: '这就是"光之枢纽"——上古文明留下的最后遗产。' },
            { speaker: '曦', text: '它曾经连接着世界各地的光之遗迹，形成一个巨大的防护网络。' },
            { speaker: '影', text: '暗影之源…会不会就是这个网络的对立面？' },
            { speaker: '曦', text: '没错。光与暗，本就是世界的一体两面。但当暗影之源被人为激活后，光之枢纽就因力量失衡而沉睡了。' },
            { speaker: '织星', text: '能重新唤醒它吗？' },
            { speaker: '曦', text: '理论上…可以。但需要收集四散的光之碎片，还要…付出代价。' }
          ],
          next: 'ch4_n6',
          rewards: { items: { exp_book_3: 2, asc_stone_3: 1 } }
        },
        {
          id: 'ch4_n6',
          type: 'battle',
          title: '暗影追兵',
          position: { x: 1000, y: 360 },
          description: '暗影组织的追兵追踪你们来到了遗迹！',
          enemyConfig: [
            { id: 'shadow_tracker_1', name: '暗影猎手', hp: 1500, atk: 200, def: 80, spd: 115, element: 'fire' },
            { id: 'shadow_tracker_2', name: '暗影猎手', hp: 1500, atk: 200, def: 80, spd: 115, element: 'water' },
            { id: 'shadow_commander', name: '暗影指挥官', hp: 2800, atk: 220, def: 130, spd: 95, element: 'metal' }
          ],
          next: 'ch4_n7',
          rewards: { items: { coins: 1000, crystals: 200 } }
        },
        {
          id: 'ch4_n7',
          type: 'dialogue',
          title: '碎片与真相',
          position: { x: 1180, y: 300 },
          content: [
            { speaker: '旁白', text: '击退暗影追兵后，战斗的冲击意外激活了光之枢纽的一部分。' },
            { speaker: '曦', text: '看！枢纽…它在回应你们的战斗。' },
            { speaker: '旁白', text: '水晶球表面裂开了一道缝隙，从中飞出了几颗光之碎片，飘散到远方。' },
            { speaker: '织星', text: '光之碎片飞走了…我们需要把它们收集回来。' },
            { speaker: '曦', text: '等一下…我感受到了什么。' },
            { speaker: '曦', text: '这些碎片…它们不是随意飞散的。它们在飞向其他光之遗迹。' },
            { speaker: '影', text: '也就是说，还有其他像这里一样的遗迹？' },
            { speaker: '曦', text: '是的。而且…暗影之源就在其中一座被暗影侵蚀的遗迹中。' },
            { speaker: '曦', text: '暗影领主说的没错——他把暗影之源转移了。转移到了…光之文明的心脏。' }
          ],
          next: 'ch4_n8a',
          rewards: null
        },
        {
          id: 'ch4_n8a',
          type: 'choice',
          title: '追寻之路',
          position: { x: 1360, y: 360 },
          content: [
            { speaker: '织星', text: '我们现在面临一个选择。' },
            { speaker: '织星', text: '是先收集光之碎片增强力量，还是直接追击暗影之源？' },
            { speaker: '曦', text: '收集碎片更安全，但需要时间。直接追击…很危险但能打他们措手不及。' },
            { speaker: '影', text: '你来决定。不管选哪条路，我都跟你走。' }
          ],
          choices: [
            { text: '收集光之碎片', next: 'ch4_n8b_frag' },
            { text: '直接追击暗影之源', next: 'ch4_n8b_rush' }
          ]
        },
        {
          id: 'ch4_n8b_frag',
          type: 'dialogue',
          title: '碎片收集',
          position: { x: 1540, y: 260 },
          content: [
            { speaker: '旁白', text: '你决定先收集光之碎片，稳步前进。' },
            { speaker: '曦', text: '明智的选择。有了碎片的力量，我们才能正面对抗暗影之源。' },
            { speaker: '织星', text: '碎片散落在各地的光之遗迹中…看来我们的旅途还要继续。' },
            { speaker: '影', text: '至少我们知道方向了。' },
            { speaker: '曦', text: '我跟你们一起走。作为光之守护者，找回碎片也是我的责任。' }
          ],
          next: 'ch4_n9',
          rewards: { items: { crystals: 500, asc_stone_4: 1 } }
        },
        {
          id: 'ch4_n8b_rush',
          type: 'dialogue',
          title: '闪电突袭',
          position: { x: 1540, y: 460 },
          content: [
            { speaker: '旁白', text: '你决定直接追击暗影之源，不给敌人更多准备时间。' },
            { speaker: '影', text: '好！趁他们还没反应过来，直接冲进去。' },
            { speaker: '曦', text: '…很冒险。但有时候，勇气本身就是最好的武器。' },
            { speaker: '织星', text: '那我们需要尽快出发。暗影领主不会坐以待毙的。' },
            { speaker: '曦', text: '我知道一条近路…跟我来。' }
          ],
          next: 'ch4_n9',
          rewards: { items: { crystals: 500, asc_stone_3: 2 } }
        },
        {
          id: 'ch4_n9',
          type: 'battle',
          title: '暗影先锋',
          position: { x: 1720, y: 360 },
          description: '暗影组织的先锋部队挡住了去路！',
          enemyConfig: [
            { id: 'shadow_vanguard_1', name: '暗影先锋·炎', hp: 2200, atk: 230, def: 100, spd: 105, element: 'fire' },
            { id: 'shadow_vanguard_2', name: '暗影先锋·冰', hp: 2000, atk: 210, def: 110, spd: 100, element: 'water' },
            { id: 'shadow_vanguard_3', name: '暗影先锋·钢', hp: 2500, atk: 180, def: 150, spd: 85, element: 'metal' },
            { id: 'shadow_vanguard_4', name: '暗影先锋·木', hp: 2000, atk: 190, def: 100, spd: 95, element: 'wood' }
          ],
          next: 'ch4_n10',
          rewards: { items: { coins: 1500, crystals: 400, asc_stone_4: 1 } }
        },
        {
          id: 'ch4_n10',
          type: 'dialogue',
          title: '旅途继续',
          position: { x: 1900, y: 360 },
          content: [
            { speaker: '旁白', text: '击退暗影先锋后，你们终于迎来了短暂的平静。' },
            { speaker: '曦', text: '前方的路还很长…但我相信，只要我们一起走，就一定能到达终点。' },
            { speaker: '织星', text: '现在我们有了明确的目标——找到光之碎片，摧毁暗影之源。' },
            { speaker: '影', text: '而且不再是一个人了。' },
            { speaker: '旁白', text: '影看向身旁的同伴们，嘴角露出罕见的微笑。' },
            { speaker: '织星', text: '暗影之源…不管它藏在哪里，我们都会找到它。' },
            { speaker: '曦', text: '光之残响会为我们指引方向。' },
            { speaker: '旁白', text: '四位旅者并肩而立，望着远方的天际线。新的冒险，正在前方等待着他们。' }
          ],
          next: 'ch4_end',
          rewards: null
        },
        {
          id: 'ch4_end',
          type: 'dialogue',
          title: '第四章结束',
          position: { x: 2080, y: 360 },
          content: [
            { speaker: '旁白', text: '从觉醒之地的迷茫，到辉光遗迹的觉醒。' },
            { speaker: '旁白', text: '从一个人的逃亡，到四个人的并肩。' },
            { speaker: '旁白', text: '光与暗的战争已经延续了千年，而现在——' },
            { speaker: '旁白', text: '命运的齿轮终于开始转动了。' },
            { speaker: '旁白', text: '第四章·完' }
          ],
          next: null,
          rewards: { items: { crystals: 2000, coins: 4000, asc_stone_4: 2 } }
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
