export type FileVisualKind = 'pdf' | 'word' | 'sheet' | 'slides' | 'text' | 'video' | 'audio' | 'image' | 'generic';

export function fileVisual(name: string, type = 'file'): { kind: FileVisualKind; mark: string } {
  const extension = String(name || '').split('.').pop()?.toLowerCase() || '';
  if (type === 'video' || /^(mp4|mov|m4v|webm)$/.test(extension)) return { kind: 'video', mark: '▶' };
  if (type === 'audio' || /^(mp3|m4a|wav|aac|ogg)$/.test(extension)) return { kind: 'audio', mark: '♫' };
  if (type === 'image' || /^(png|jpe?g|webp|gif|bmp|heic)$/.test(extension)) return { kind: 'image', mark: '▣' };
  if (extension === 'pdf') return { kind: 'pdf', mark: 'PDF' };
  if (/^docx?$/.test(extension)) return { kind: 'word', mark: 'W' };
  if (/^xlsx?$/.test(extension)) return { kind: 'sheet', mark: 'X' };
  if (/^pptx?$/.test(extension)) return { kind: 'slides', mark: 'P' };
  if (extension === 'txt') return { kind: 'text', mark: 'TXT' };
  return { kind: 'generic', mark: 'FILE' };
}
