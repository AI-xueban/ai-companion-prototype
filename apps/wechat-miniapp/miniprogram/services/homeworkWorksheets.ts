export type WorksheetSubject = '数学' | '语文' | '英语' | '科学';

export interface HomeworkWorksheetTemplate {
  id: string;
  grade: 4 | 5 | 6 | 7;
  subject: WorksheetSubject;
  title: string;
  description: string;
  requirement: string;
  blankPath: string;
  answeredPath: string;
}

const asset = (name: string) => `/assets/homework-worksheets/${name}`;

export const HOMEWORK_WORKSHEET_LIBRARY: HomeworkWorksheetTemplate[] = [
  {
    id: 'math-basic-grade4', grade: 4, subject: '数学', title: '四年级数学家庭作业',
    description: '完成四则运算、竖式计算和生活应用题，保留完整计算过程。',
    requirement: '下载或查看空白作业纸，完成后拍摄整张 A4 作答页上传。',
    blankPath: asset('math-basic-blank.webp'), answeredPath: asset('math-basic-answered.webp'),
  },
  {
    id: 'chinese-grade4', grade: 4, subject: '语文', title: '四年级语文综合练习',
    description: '完成字词、读音、仿写和短文阅读题。',
    requirement: '完成 A4 练习，保持页面平整清晰，整页拍照上传。',
    blankPath: asset('chinese-grade4-blank.webp'), answeredPath: asset('chinese-grade4-answered.webp'),
  },
  {
    id: 'english-grade4', grade: 4, subject: '英语', title: '四年级英语 Unit 3 练习',
    description: '完成单词补全、图文连线、语法选择和阅读判断。',
    requirement: '在纸上完成练习，提交一张包含整页内容的清晰照片。',
    blankPath: asset('english-grade4-blank.webp'), answeredPath: asset('english-grade4-answered.webp'),
  },
  {
    id: 'science-grade4', grade: 4, subject: '科学', title: '四年级科学探究记录',
    description: '围绕声音的产生完成选择、判断、连线和实验观察记录。',
    requirement: '完成探究记录表后拍摄整张作业纸，确保观察记录可辨认。',
    blankPath: asset('science-grade4-blank.webp'), answeredPath: asset('science-grade4-answered.webp'),
  },
  {
    id: 'math-application-grade4', grade: 4, subject: '数学', title: '四年级数学 · 生活中的应用题',
    description: '完成乘除法、人数统计、平均分配和长方形实践园问题。',
    requirement: '逐题写出列式和答语，完成后上传整张 A4 作答页。',
    blankPath: asset('math-grade4-application-blank.webp'), answeredPath: asset('math-grade4-application-answered.webp'),
  },
  {
    id: 'math-application-grade5', grade: 5, subject: '数学', title: '五年级数学 · 生活情境应用题',
    description: '完成小数运算、多边形面积和列方程解决问题。',
    requirement: '写清思考与列式过程，完成后由家长拍摄整页并提交。',
    blankPath: asset('math-grade5-application-blank.webp'), answeredPath: asset('math-grade5-application-answered.webp'),
  },
  {
    id: 'math-application-grade6', grade: 6, subject: '数学', title: '六年级数学 · 综合应用题',
    description: '完成折扣、按比分配、比例尺和圆周长综合应用题。',
    requirement: '保留完整分析与列式过程，拍摄整张 A4 作答页上传。',
    blankPath: asset('math-grade6-application-blank.webp'), answeredPath: asset('math-grade6-application-answered.webp'),
  },
  {
    id: 'math-application-grade7', grade: 7, subject: '数学', title: '七年级数学 · 综合应用题',
    description: '完成有理数运算、一元一次方程、整式求值和线段关系四道题。',
    requirement: '写清计算或推理过程，完成后由家长拍摄整页并提交。',
    blankPath: asset('math-grade7-application-blank.png'), answeredPath: asset('math-grade7-application-answered.png'),
  },
];

export const getHomeworkWorksheet = (id: string) => HOMEWORK_WORKSHEET_LIBRARY.find(item => item.id === id);
