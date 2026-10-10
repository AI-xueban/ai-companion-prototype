export type PrintedFileStatus = 'success' | 'failed' | 'unknown' | 'cancelled';

export interface PrintedFileRecord {
  id: string;
  title: string;
  subject: string;
  questionCount: number;
  pageCount: number;
  createdAt: string;
  updatedAt: string;
  status: PrintedFileStatus;
  statusLabel: string;
  failureReason?: string;
  printerName?: string;
  attempts: number;
  includeAnswerAnalysis?: boolean;
}

const STORAGE_KEY = 'ai-companion:printed-files:v1';
export const PRINTED_FILES_CHANGED_EVENT = 'ai-companion:printed-files-changed';

export function listPrintedFiles(): PrintedFileRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]') as PrintedFileRecord[];
    return Array.isArray(parsed) ? parsed.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)) : [];
  } catch {
    return [];
  }
}

function write(files: PrintedFileRecord[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(files.slice(0, 100)));
  window.dispatchEvent(new CustomEvent(PRINTED_FILES_CHANGED_EVENT));
}

export function savePrintedFile(input: Omit<PrintedFileRecord, 'id' | 'createdAt' | 'updatedAt' | 'attempts'>) {
  const now = new Date().toISOString();
  const record: PrintedFileRecord = { ...input, id: `print-${Date.now()}`, createdAt: now, updatedAt: now, attempts: 1 };
  write([record, ...listPrintedFiles()]);
  return record;
}

export function retryPrintedFile(id: string, status: PrintedFileStatus = 'success') {
  const files = listPrintedFiles().map((file) => file.id === id ? {
    ...file,
    status,
    statusLabel: status === 'success' ? '打印成功' : '已发送，待确认',
    failureReason: undefined,
    attempts: file.attempts + 1,
    updatedAt: new Date().toISOString(),
  } : file);
  write(files);
}

export function deletePrintedFile(id: string) {
  write(listPrintedFiles().filter((file) => file.id !== id));
}

export { STORAGE_KEY as PRINTED_FILE_STORAGE_KEY };
