import type { KnowledgeNode, UniverseData } from '../knowledgeGraphTypes';

export type EnglishVocabLayoutMode = 'grid' | 'letter' | 'theme';
export type EnglishUnitLayoutMode = 'vocab_circle' | 'mixed_blocks' | 'skill_focus';

export const ENGLISH_VOCAB_HUB_LABEL = '词汇';
export const ENGLISH_SKILL_HUB_LABEL = '语法·语音';
export const ENGLISH_UNIT_THEME_ID = '__english_unit_theme__';
export const ENGLISH_SKILL_THEME_ID = '__english_skill_theme__';
export const ENGLISH_VOCAB_THEME_ID = '__english_vocab_theme__';

export const ENGLISH_SYNTHETIC_THEME_IDS = new Set([
  ENGLISH_UNIT_THEME_ID,
  ENGLISH_SKILL_THEME_ID,
  ENGLISH_VOCAB_THEME_ID,
]);

export interface EnglishSubClusterHull {
  id: string;
  label: string;
  cx: number;
  cy: number;
  r: number;
}

export interface EnglishLetterZone {
  letter: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface LayoutPosition {
  x: number;
  y: number;
  fx: number;
  fy: number;
}

export function letterGroupKey(label: string): string {
  const ch = label.trim().charAt(0).toUpperCase();
  return /^[A-Z]$/.test(ch) ? ch : '#';
}

function fitPositions(
  positions: Map<string, LayoutPosition>,
  viewportWidth: number,
  viewportHeight: number,
  zones?: EnglishLetterZone[]
): {
  positions: Map<string, LayoutPosition>;
  scale: number;
  offsetX: number;
  offsetY: number;
} {
  if (positions.size === 0 && !zones?.length) {
    return { positions, scale: 1, offsetX: 0, offsetY: 0 };
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  positions.forEach(p => {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  });
  zones?.forEach(z => {
    minX = Math.min(minX, z.x);
    maxX = Math.max(maxX, z.x + z.width);
    minY = Math.min(minY, z.y);
    maxY = Math.max(maxY, z.y + z.height);
  });

  const graphW = maxX - minX || 1;
  const graphH = maxY - minY || 1;
  const padX = 56;
  const padY = 52;
  const scaleX = graphW > viewportWidth - padX * 2 ? (viewportWidth - padX * 2) / graphW : 1;
  const scaleY = graphH > viewportHeight - padY * 2 ? (viewportHeight - padY * 2) / graphH : 1;
  const scale = Math.min(scaleX, scaleY, 1);
  const offsetX = (viewportWidth - graphW * scale) / 2 - minX * scale;
  const offsetY = (viewportHeight - graphH * scale) / 2 - minY * scale;

  const fitted = new Map<string, LayoutPosition>();
  positions.forEach((p, id) => {
    fitted.set(id, {
      x: p.x * scale + offsetX,
      y: p.y * scale + offsetY,
      fx: p.x * scale + offsetX,
      fy: p.y * scale + offsetY,
    });
  });
  return { positions: fitted, scale, offsetX, offsetY };
}

function fitZones(
  zones: EnglishLetterZone[],
  scale: number,
  offsetX: number,
  offsetY: number
): EnglishLetterZone[] {
  return zones.map(z => ({
    ...z,
    x: z.x * scale + offsetX,
    y: z.y * scale + offsetY,
    width: z.width * scale,
    height: z.height * scale,
  }));
}

/** 方案 1：纯网格排布，无连线 */
export function layoutEnglishVocabGrid(
  nodes: KnowledgeNode[],
  viewportWidth: number,
  viewportHeight: number
): Map<string, LayoutPosition> {
  const sorted = [...nodes].sort((a, b) =>
    a.label.localeCompare(b.label, 'en', { sensitivity: 'base' })
  );
  const count = sorted.length;
  const cols = Math.max(2, Math.ceil(Math.sqrt(count)));
  const cellW = 108;
  const cellH = 58;
  const startX = 64;
  const startY = 72;

  const positions = new Map<string, LayoutPosition>();
  sorted.forEach((node, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = startX + col * cellW;
    const y = startY + row * cellH;
    positions.set(node.id, { x, y, fx: x, fy: y });
  });

  return fitPositions(positions, viewportWidth, viewportHeight).positions;
}

/** 方案 2：按首字母分区，区内网格排布单词点 */
export function layoutEnglishVocabLetter(
  nodes: KnowledgeNode[],
  viewportWidth: number,
  viewportHeight: number
): { positions: Map<string, LayoutPosition>; zones: EnglishLetterZone[] } {
  const grouped = new Map<string, KnowledgeNode[]>();
  [...nodes]
    .sort((a, b) => a.label.localeCompare(b.label, 'en', { sensitivity: 'base' }))
    .forEach(node => {
      const key = letterGroupKey(node.label);
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(node);
    });

  const letters = [...grouped.keys()].sort((a, b) => {
    if (a === '#') return 1;
    if (b === '#') return -1;
    return a.localeCompare(b);
  });

  const zonePad = 14;
  const zoneHeaderH = 26;
  const cellW = 96;
  const cellH = 50;
  const zoneGap = 18;
  const startX = 48;
  const startY = 56;

  const zoneSpecs = letters.map(letter => {
    const items = grouped.get(letter)!;
    const cols = Math.min(3, Math.max(1, Math.ceil(Math.sqrt(items.length))));
    const rows = Math.ceil(items.length / cols);
    const width = cols * cellW + zonePad * 2;
    const height = zoneHeaderH + rows * cellH + zonePad;
    return { letter, items, cols, rows, width, height };
  });

  const maxRowW = Math.max(280, viewportWidth - 96);
  const positions = new Map<string, LayoutPosition>();
  const zones: EnglishLetterZone[] = [];

  let cursorX = startX;
  let cursorY = startY;
  let rowMaxH = 0;

  zoneSpecs.forEach(spec => {
    if (cursorX > startX && cursorX + spec.width > startX + maxRowW) {
      cursorX = startX;
      cursorY += rowMaxH + zoneGap;
      rowMaxH = 0;
    }

    const zoneX = cursorX;
    const zoneY = cursorY;
    zones.push({
      letter: spec.letter,
      x: zoneX,
      y: zoneY,
      width: spec.width,
      height: spec.height,
    });

    const innerX = zoneX + zonePad;
    const innerY = zoneY + zoneHeaderH;
    spec.items.forEach((node, i) => {
      const col = i % spec.cols;
      const row = Math.floor(i / spec.cols);
      const x = innerX + col * cellW + cellW / 2;
      const y = innerY + row * cellH + cellH / 2;
      positions.set(node.id, { x, y, fx: x, fy: y });
    });

    cursorX += spec.width + zoneGap;
    rowMaxH = Math.max(rowMaxH, spec.height);
  });

  const fittedLayout = fitPositions(positions, viewportWidth, viewportHeight, zones);
  const fittedZones = fitZones(
    zones,
    fittedLayout.scale,
    fittedLayout.offsetX,
    fittedLayout.offsetY
  );

  return { positions: fittedLayout.positions, zones: fittedZones };
}

export function formatEnglishUnitCenterLabel(scopeLabel: string): string {
  /** @deprecated 画布内禁止展示 Unit 名称；仅左栏 scopeLabel 使用 */
  const trimmed = scopeLabel.trim();
  const match = trimmed.match(/^(Unit\s*\d+)\s*(.*)$/i);
  if (!match) return trimmed;
  const unitCode = match[1];
  const topic = match[2].trim();
  return topic ? `${unitCode}\n${topic}` : unitCode;
}

/** 方案 3：Unit 名称在圆心，词汇环绕分布 */
export function layoutEnglishVocabTheme(
  nodes: KnowledgeNode[],
  viewportWidth: number,
  viewportHeight: number
): Map<string, LayoutPosition> {
  const cx = viewportWidth / 2;
  const cy = viewportHeight / 2;
  const count = nodes.length;

  const positions = new Map<string, LayoutPosition>();
  positions.set(ENGLISH_UNIT_THEME_ID, { x: cx, y: cy, fx: cx, fy: cy });

  if (count === 0) return positions;

  const sorted = [...nodes].sort((a, b) =>
    a.label.localeCompare(b.label, 'en', { sensitivity: 'base' })
  );

  const minDim = Math.min(viewportWidth, viewportHeight);
  const centerGap = Math.max(92, minDim * 0.17);
  const ringGap = Math.max(50, minDim * 0.1);
  const ringCount =
    count <= 8 ? 1 : count <= 18 ? 2 : count <= 32 ? 3 : Math.ceil(count / 12);

  const perRing = Math.ceil(count / ringCount);
  let index = 0;

  for (let ring = 0; ring < ringCount; ring++) {
    const ringNodes = sorted.slice(index, index + perRing);
    index += ringNodes.length;
    if (!ringNodes.length) continue;

    const radius = centerGap + ring * ringGap;
    const angleOffset = ring % 2 === 0 ? -Math.PI / 2 : -Math.PI / 2 + Math.PI / ringNodes.length;

    ringNodes.forEach((node, i) => {
      const angle = angleOffset + (i / ringNodes.length) * Math.PI * 2;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      positions.set(node.id, { x, y, fx: x, fy: y });
    });
  }

  const fitted = fitPositions(positions, viewportWidth, viewportHeight);
  const themePos = fitted.positions.get(ENGLISH_UNIT_THEME_ID);
  if (!themePos) return fitted.positions;

  const targetCx = viewportWidth / 2;
  const targetCy = viewportHeight / 2;
  const dx = targetCx - themePos.x;
  const dy = targetCy - themePos.y;

  const recentered = new Map<string, LayoutPosition>();
  fitted.positions.forEach((p, id) => {
    recentered.set(id, {
      x: p.x + dx,
      y: p.y + dy,
      fx: p.x + dx,
      fy: p.y + dy,
    });
  });

  return recentered;
}

function placeNodesInRings(
  centerX: number,
  centerY: number,
  nodes: KnowledgeNode[],
  positions: Map<string, LayoutPosition>,
  innerRadius: number,
  ringGap: number,
  sortLocale: 'zh-CN' | 'en' = 'zh-CN'
) {
  if (!nodes.length) return;
  const sorted = [...nodes].sort((a, b) =>
    a.label.localeCompare(b.label, sortLocale, { sensitivity: 'base' })
  );
  const ringCount =
    sorted.length <= 4 ? 1 : sorted.length <= 10 ? 2 : Math.ceil(sorted.length / 8);
  const perRing = Math.ceil(sorted.length / ringCount);
  let index = 0;

  for (let ring = 0; ring < ringCount; ring++) {
    const ringNodes = sorted.slice(index, index + perRing);
    index += ringNodes.length;
    if (!ringNodes.length) continue;
    const radius = innerRadius + ring * ringGap;
    const angleOffset = -Math.PI / 2 + (ring % 2 ? Math.PI / ringNodes.length : 0);
    ringNodes.forEach((node, i) => {
      const angle = angleOffset + (i / ringNodes.length) * Math.PI * 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      positions.set(node.id, { x, y, fx: x, fy: y });
    });
  }
}

function makeSyntheticTheme(
  id: string,
  label: string,
  subject: KnowledgeNode['subject'],
  childCount: number
): KnowledgeNode {
  return {
    id,
    label,
    subject,
    status: 'unknown',
    group: 0,
    val: 20,
    nodeType: 'KnowledgeNode',
    displayRole: 'theme',
    depth: 0,
    isPracticable: false,
    isDrillable: false,
    childCount,
  };
}

/** 语法 + 词汇双区块：仅左右两个主题圈，画布不展示 Unit 名称 */
export function layoutEnglishMixedBlocks(
  skillNodes: KnowledgeNode[],
  vocabNodes: KnowledgeNode[],
  viewportWidth: number,
  viewportHeight: number
): Map<string, LayoutPosition> {
  const cx = viewportWidth / 2;
  const blockY = viewportHeight * 0.52;
  const spread = Math.min(viewportWidth * 0.24, 168);
  const skillCx = cx - spread;
  const vocabCx = cx + spread;

  const positions = new Map<string, LayoutPosition>();
  positions.set(ENGLISH_SKILL_THEME_ID, { x: skillCx, y: blockY - 28, fx: skillCx, fy: blockY - 28 });
  positions.set(ENGLISH_VOCAB_THEME_ID, { x: vocabCx, y: blockY - 28, fx: vocabCx, fy: blockY - 28 });

  const minDim = Math.min(viewportWidth, viewportHeight);
  placeNodesInRings(
    skillCx,
    blockY + 8,
    skillNodes,
    positions,
    Math.max(52, minDim * 0.1),
    Math.max(40, minDim * 0.07)
  );
  placeNodesInRings(
    vocabCx,
    blockY + 8,
    vocabNodes,
    positions,
    Math.max(64, minDim * 0.12),
    Math.max(46, minDim * 0.08),
    'en'
  );

  return fitPositions(positions, viewportWidth, viewportHeight).positions;
}

/** 仅语法/语音点：Unit 名称在圆心 */
export function layoutEnglishSkillFocus(
  skillNodes: KnowledgeNode[],
  viewportWidth: number,
  viewportHeight: number
): Map<string, LayoutPosition> {
  const positions = new Map<string, LayoutPosition>();
  const cx = viewportWidth / 2;
  const cy = viewportHeight / 2;
  positions.set(ENGLISH_UNIT_THEME_ID, { x: cx, y: cy, fx: cx, fy: cy });
  placeNodesInRings(
    cx,
    cy,
    skillNodes,
    positions,
    Math.max(78, Math.min(viewportWidth, viewportHeight) * 0.14),
    Math.max(48, Math.min(viewportWidth, viewportHeight) * 0.09)
  );

  const fitted = fitPositions(positions, viewportWidth, viewportHeight);
  const unitPos = fitted.positions.get(ENGLISH_UNIT_THEME_ID);
  if (!unitPos) return fitted.positions;
  const dx = cx - unitPos.x;
  const dy = cy - unitPos.y;
  const recentered = new Map<string, LayoutPosition>();
  fitted.positions.forEach((p, id) => {
    recentered.set(id, { x: p.x + dx, y: p.y + dy, fx: p.x + dx, fy: p.y + dy });
  });
  return recentered;
}

export function buildEnglishUnitDisplayGraph(
  skillNodes: KnowledgeNode[],
  vocabNodes: KnowledgeNode[],
  mode: EnglishUnitLayoutMode,
  unitLabel: string,
  viewportWidth: number,
  viewportHeight: number
): UniverseData & { letterZones?: EnglishLetterZone[]; subClusterHulls?: EnglishSubClusterHull[] } {
  const subject = skillNodes[0]?.subject ?? vocabNodes[0]?.subject ?? '英语';
  const styledSkill = skillNodes.map(n => ({ ...n, displayRole: 'knowledge' as const, depth: 1, group: 1 }));
  const styledVocab = vocabNodes.map(n => ({ ...n, displayRole: 'knowledge' as const, depth: 1, group: 1 }));

  if (mode === 'mixed_blocks') {
    const skillTheme = makeSyntheticTheme(
      ENGLISH_SKILL_THEME_ID,
      ENGLISH_SKILL_HUB_LABEL,
      subject,
      styledSkill.length
    );
    const vocabTheme = makeSyntheticTheme(
      ENGLISH_VOCAB_THEME_ID,
      ENGLISH_VOCAB_HUB_LABEL,
      subject,
      styledVocab.length
    );
    const positions = layoutEnglishMixedBlocks(
      styledSkill,
      styledVocab,
      viewportWidth,
      viewportHeight
    );
    const nodes = [skillTheme, vocabTheme, ...styledSkill, ...styledVocab].map(n => {
      const pos = positions.get(n.id);
      return pos ? { ...n, x: pos.x, y: pos.y, fx: pos.fx, fy: pos.fy } : n;
    });
    const subClusterHulls: EnglishSubClusterHull[] = (
      [
        [ENGLISH_SKILL_THEME_ID, styledSkill, 40] as const,
        [ENGLISH_VOCAB_THEME_ID, styledVocab, 44] as const,
      ]
    ).map(([id, cluster, padding]) => {
      const theme = nodes.find(n => n.id === id)!;
      const childPos = cluster
        .map(n => nodes.find(nn => nn.id === n.id))
        .filter((n): n is KnowledgeNode & { x: number; y: number } => n?.x != null && n?.y != null)
        .map(n => ({ x: n.x, y: n.y }));
      const hull = computeEnglishThemeHull({ x: theme.x!, y: theme.y! }, childPos, padding, true);
      return { id, label: theme.label, ...hull };
    });
    return { nodes, links: [], subClusterHulls };
  }

  if (mode === 'skill_focus') {
    const unitTheme = makeSyntheticTheme(
      ENGLISH_UNIT_THEME_ID,
      ENGLISH_SKILL_HUB_LABEL,
      subject,
      styledSkill.length
    );
    const positions = layoutEnglishSkillFocus(styledSkill, viewportWidth, viewportHeight);
    const nodes = [unitTheme, ...styledSkill].map(n => {
      const pos = positions.get(n.id);
      return pos ? { ...n, x: pos.x, y: pos.y, fx: pos.fx, fy: pos.fy } : n;
    });
    return { nodes, links: [] };
  }

  const unitTheme = makeSyntheticTheme(
    ENGLISH_UNIT_THEME_ID,
    ENGLISH_VOCAB_HUB_LABEL,
    subject,
    styledVocab.length
  );
  const positions = layoutEnglishVocabTheme(styledVocab, viewportWidth, viewportHeight);
  const nodes = [unitTheme, ...styledVocab].map(n => {
    const pos = positions.get(n.id);
    return pos ? { ...n, x: pos.x, y: pos.y, fx: pos.fx, fy: pos.fy } : n;
  });
  return { nodes, links: [] };
}

export function buildEnglishVocabDisplayGraph(
  vocabNodes: KnowledgeNode[],
  mode: EnglishVocabLayoutMode,
  unitLabel: string,
  viewportWidth: number,
  viewportHeight: number
): UniverseData & { letterZones?: EnglishLetterZone[] } {
  const wordNodes: KnowledgeNode[] = vocabNodes.map(n => ({
    ...n,
    displayRole: 'knowledge',
    depth: 1,
    group: 1,
  }));

  if (mode === 'grid') {
    const positions = layoutEnglishVocabGrid(wordNodes, viewportWidth, viewportHeight);
    const nodes = wordNodes.map(n => {
      const pos = positions.get(n.id);
      return pos ? { ...n, x: pos.x, y: pos.y, fx: pos.fx, fy: pos.fy } : n;
    });
    return { nodes, links: [] };
  }

  if (mode === 'letter') {
    const { positions, zones } = layoutEnglishVocabLetter(
      wordNodes,
      viewportWidth,
      viewportHeight
    );
    const nodes = wordNodes.map(n => {
      const pos = positions.get(n.id);
      return pos ? { ...n, x: pos.x, y: pos.y, fx: pos.fx, fy: pos.fy } : n;
    });
    return { nodes, links: [], letterZones: zones };
  }

  const themeNode: KnowledgeNode = {
    id: ENGLISH_UNIT_THEME_ID,
    label: ENGLISH_VOCAB_HUB_LABEL,
    subject: wordNodes[0]?.subject ?? '英语',
    status: 'unknown',
    group: 0,
    val: 20,
    nodeType: 'KnowledgeNode',
    displayRole: 'theme',
    depth: 0,
    isPracticable: false,
    isDrillable: false,
    childCount: wordNodes.length,
  };

  const positions = layoutEnglishVocabTheme(wordNodes, viewportWidth, viewportHeight);
  const nodes = [themeNode, ...wordNodes].map(n => {
    const pos = positions.get(n.id);
    return pos ? { ...n, x: pos.x, y: pos.y, fx: pos.fx, fy: pos.fy } : n;
  });

  return { nodes, links: [] };
}

/** 计算主题圈包围盒（方案 3：以锚点或子节点质心为圆心） */
export function computeEnglishThemeHull(
  center: { x: number; y: number },
  words: { x: number; y: number }[],
  padding = 44,
  useChildCentroid = false
): { cx: number; cy: number; r: number } {
  if (!words.length) {
    return { cx: center.x, cy: center.y, r: 72 };
  }

  let cx = center.x;
  let cy = center.y;
  if (useChildCentroid) {
    cx = words.reduce((s, p) => s + p.x, 0) / words.length;
    cy = words.reduce((s, p) => s + p.y, 0) / words.length;
  }

  const wordRadius = Math.max(...words.map(p => Math.hypot(p.x - cx, p.y - cy)));
  const labelRadius = useChildCentroid ? 0 : 52;
  return { cx, cy, r: Math.max(wordRadius, labelRadius) + padding };
}
