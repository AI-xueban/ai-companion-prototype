/** 纠正讲题页易混淆数字（如 40 在部分字体下误显为 4o） */
export function normalizeTutorDisplayText(text: string): string {
  return text.replace(/4o/gi, '40');
}
