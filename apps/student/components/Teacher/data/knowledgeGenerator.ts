import { mathKnowledgeDir } from '../../../data/math_knowledge_dir';
import chineseKnowledgeDir from '../../../data/chinese_knowlege_dir';
import englishKnowledgeDir from '../../../data/english_knowlege_dir';
import { KnowledgeNode, KnowledgeLink, UniverseData, KnowledgeNodeStatus } from '../../../knowledgeGraphTypes';

type SourceNode = {
  name: string;
  level: string;
  children?: SourceNode[];
};

const statuses: KnowledgeNodeStatus[] = ['mastered', 'weak', 'reviewing', 'exploring', 'unknown'];

const hashString = (input: string) => {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = input.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};

const pickStatus = (id: string) => statuses[hashString(id) % statuses.length];

const randomBetween = (id: string, min: number, max: number) => {
  const h = hashString(id) % 1000;
  return min + (h / 1000) * (max - min);
};

const buildStats = (id: string, status: KnowledgeNodeStatus) => {
  const baseScore = Math.round(randomBetween(id, 35, 95));
  const totalQuestions = Math.round(randomBetween(id, 5, 60));
  const wrongCount = Math.max(1, Math.round(totalQuestions * randomBetween(id + 'w', 0.15, 0.6)));
  const correctCount = Math.max(0, totalQuestions - wrongCount);
  const lastPracticeDays = Math.round(randomBetween(id + 'd', 0, 20));
  const lastPractice = lastPracticeDays === 0 ? '刚刚' : `${lastPracticeDays}天前`;

  const mastered = Math.max(0, Math.round(correctCount * randomBetween(id + 'm', 0.6, 0.95)));
  const review = Math.max(0, Math.round(wrongCount * randomBetween(id + 'r', 0.2, 0.6)));
  const weak = Math.max(0, wrongCount - review);

  const score =
    status === 'mastered'
      ? Math.max(85, baseScore)
      : status === 'weak'
      ? Math.min(55, baseScore)
      : baseScore;

  return {
    totalQuestions,
    correctCount,
    wrongCount,
    lastPractice,
    masteryScore: score,
    masteryDistribution: {
      mastered,
      review,
      weak,
    },
  };
};

const mapFileLevelToGroup = (fileLevel: number) => {
  if (fileLevel <= 1) return 1; // 文件 level 1 -> UI L2 -> group 1
  if (fileLevel === 2) return 2; // 文件 level 2 -> UI L3 -> group 2
  return 3; // 文件 level 3/4 -> UI L4 -> group 3
};

const slugify = (name: string) =>
  name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const flattenNodes = (nodes: SourceNode[], parentId: string, accNodes: KnowledgeNode[], accLinks: KnowledgeLink[], subject: KnowledgeNode['subject']) => {
  nodes.forEach((node, idx) => {
    const fileLevel = Number(node.level) || 1;
    const group = mapFileLevelToGroup(fileLevel);
    const id = `${parentId}-${slugify(node.name) || idx}`;
    const status = pickStatus(id);
    const val = Math.round(randomBetween(id + 'v', 8, 20));

    accNodes.push({
      id,
      label: node.name,
      subject,
      parentId,
      status,
      group,
      val,
      stats: buildStats(id, status),
    });

    accLinks.push({ source: parentId, target: id, value: 1 });

    if (node.children && node.children.length > 0) {
      flattenNodes(node.children, id, accNodes, accLinks, subject);
    }
  });
};

const buildSubjectUniverse = (directory: SourceNode[], subject: KnowledgeNode['subject'], rootId: string): UniverseData => {
  const nodes: KnowledgeNode[] = [
    {
      id: rootId,
      label: subject,
      subject,
      status: 'mastered',
      group: 0, // UI L1
      val: 50,
      stats: buildStats(rootId, 'mastered'),
    },
  ];
  const links: KnowledgeLink[] = [];

  flattenNodes(directory, rootId, nodes, links, subject);

  return { nodes, links };
};

export const buildMathUniverseFromDir = (): UniverseData => buildSubjectUniverse(mathKnowledgeDir as SourceNode[], '数学', 'math-root');

export const buildTeacherUniverseFromDirs = (): UniverseData => {
  const groups = [
    buildMathUniverseFromDir(),
    buildSubjectUniverse(chineseKnowledgeDir as SourceNode[], '语文', 'chinese-root'),
    buildSubjectUniverse(englishKnowledgeDir as SourceNode[], '英语', 'english-root'),
  ];
  return { nodes: groups.flatMap(group => group.nodes), links: groups.flatMap(group => group.links) };
};
