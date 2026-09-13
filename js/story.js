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
            { id: 'minion_1', name: '石像兵', hp: 600, atk: 70, def: 50, spd: 85, element: 'earth' }
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
      // 章节结束
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
