import { StudentControl } from './hierarchicalDeviceControl';
export const usesDefaultHomeworkRule = (control: StudentControl) => !control.answer && !control.explanation
  && control.homeworkSource !== 'teacher'
  && (control.homeworkUsesDefault === true || (!control.homeworkSource && !control.updated.homework));
export const restoreDefaultHomeworkRule = (control: StudentControl): StudentControl => ({
  ...control, answer: false, explanation: false, homeworkSource: undefined, homeworkUsesDefault: true,
});
