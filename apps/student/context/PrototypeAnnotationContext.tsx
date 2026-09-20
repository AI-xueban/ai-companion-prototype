import type { ExpeditionSimScenario } from '../components/PersonalizedLearning/expeditionCatalog';

type PrototypeAnnotationContextValue = {
  expeditionSimScenario: ExpeditionSimScenario;
};

/**
 * 合并版不挂载源原型的标注工作台；个性化学习组件保留可选读取接口，
 * 未进入标注模式时按真实默认场景运行。
 */
export const usePrototypeAnnotationOptional = (): PrototypeAnnotationContextValue | null => null;
