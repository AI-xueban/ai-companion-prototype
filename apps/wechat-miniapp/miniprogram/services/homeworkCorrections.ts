import {getTaskStudentRows} from './homeworkMock';
import type {HomeworkTask} from './homeworkMock';
import {isFormalGrade} from './homeworkGrading';
// encouragement 保存所选鼓励文案；旧记录只有 liked 时仍按“有进步”展示。
export interface CorrectionFeedback {result:'pass'|'again';liked:boolean;encouragement?:string;comment:string;teacherId:string;teacherName:string;at:string}
export interface ParentCorrection {key:string;studentId:string;taskId:string;itemId:string;version:number;questionId:string;at:string;text:string;images:string[];audioPath:string;audioDuration:number;teacherFeedback?:CorrectionFeedback}
export const CORRECTION_KEY='homework-parent-corrections-v1';
export const readCorrections=():ParentCorrection[]=>{const rows=wx.getStorageSync(CORRECTION_KEY);return Array.isArray(rows)?rows:[];};
export function correctionRows(task:HomeworkTask){const entries=readCorrections();return getTaskStudentRows(task).flatMap(s=>s.submissions.flatMap(record=>record.questions.flatMap(q=>{const matches=entries.filter(e=>e.taskId===task.id&&e.studentId===s.student.id&&e.itemId===record.itemId&&e.version===(record.version||1)&&e.questionId===q.id).sort((a,b)=>b.at.localeCompare(a.at));const entry=matches[0];if(!(isFormalGrade(q)&&q.correct===false)&&!entry)return [];return [{id:[s.student.id,record.itemId,q.id].join('|'),studentId:s.student.id,name:s.student.name,originalPaths:record.photos?.length?record.photos.map(p=>p.path):record.mediaPath?[record.mediaPath]:[],record,q,entry,status:entry?(entry.teacherFeedback?(entry.teacherFeedback.result==='pass'?'done':'todo'):'pending'):'todo'}];})));}
