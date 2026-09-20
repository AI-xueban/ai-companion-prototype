/**
 * 知识图谱 · 视觉方案开关（互斥使用，可随时回退）
 *
 * KG_SCHEME_E_ENABLED = true  → 方案 E：全量图谱（尺寸分层 + 左→右树形布局）
 * KG_SCHEME_D_ENABLED = true  → 方案 D：聚焦下钻折叠（旧实验）
 * 两者均为 false            → 经典版：统一圆点力导向图
 */
export const KG_SCHEME_E_ENABLED = true;
export const KG_SCHEME_D_ENABLED = false;

/** 方案 D：节点数超过此阈值且为语文时，默认折叠到主题层 */
export const KG_COLLAPSE_NODE_THRESHOLD = 20;

/** scope 切图时，向上补齐的 KnowledgeNode 主题祖先最多层数（0=不补，1=仅直接父主题） */
export const KG_MAX_THEME_ANCESTOR_DEPTH = 1;

/** 英语 Unit 内词汇 TestingPoint 达到此数量时，用语义列表替代关系图谱 */
export const KG_ENGLISH_VOCAB_LIST_THRESHOLD = 8;

/**
 * 语文切图：仅在当前课本（年级+册）的 knowledge_tree 内，
 * 用节点 catalog_id 匹配 catalog_tree 划定的 scope，不读 catalog_tree.knowledge_points。
 */
export const KG_CHINESE_TREE_ONLY_ENABLED = true;
