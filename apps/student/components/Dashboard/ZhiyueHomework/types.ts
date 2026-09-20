export type ZhiyueMode = 'single' | 'multi';
export type ZhiyueStep = 'camera' | 'crop' | 'analyzing' | 'result' | 'history';
export type ZhiyueGradeMark = 'correct' | 'incorrect';
export type ZhiyueDisputeStep = 'idle' | 'prompt' | 'pick' | 'done';

export interface ZhiyueCapturedPage {
  id: string;
  src: string;
}

export interface ZhiyueQuestionGrade {
  systemGrade: ZhiyueGradeMark;
  systemAt: number;
  userGrade: ZhiyueGradeMark | null;
  userAt: number | null;
  step: ZhiyueDisputeStep;
}

export interface ZhiyueRecord {
  id: string;
  dateKey: string;
  dateLabel: string;
  time: string;
  mode: ZhiyueMode;
  pageCount: number;
  questionGrades?: Record<string, ZhiyueQuestionGrade>;
}

export interface ZhiyueCapturedPage {
  id: string;
  src: string;
}

export interface ZhiyueRecord {
  id: string;
  dateKey: string;
  dateLabel: string;
  time: string;
  mode: ZhiyueMode;
  pageCount: number;
}
