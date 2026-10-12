export type PrintedFileStatus = 'success' | 'failed' | 'unknown' | 'cancelled';
export type PrintedFileSource = 'lumi_space' | 'precision_practice' | 'unit_test' | 'mistake_print';
export const PRINTED_FILE_SOURCE_LABELS: Record<PrintedFileSource, string> = {
  lumi_space: '小晤组卷', precision_practice: '精准练习', unit_test: '单元测试', mistake_print: '错题打印',
};

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
  source?: PrintedFileSource;
  failureReason?: string;
  printerName?: string;
  attempts: number;
  includeAnswerAnalysis?: boolean;
  storageBytes?: number;
}

const STORAGE_KEY = 'ai-companion:printed-files:v1';
export const MAX_SAVED_PRINTED_FILES = 100;
export const MAX_SAVED_PRINTED_BYTES = 500 * 1024 * 1024;
export const MAX_SINGLE_PRINTED_FILE_BYTES = 50 * 1024 * 1024;
export const PRINTED_FILES_CHANGED_EVENT = 'ai-companion:printed-files-changed';
const ESTIMATED_BYTES_PER_PAGE = 128 * 1024;

function estimatedFileBytes(file: PrintedFileRecord) {
  return file.storageBytes ?? Math.max(1, file.pageCount) * ESTIMATED_BYTES_PER_PAGE;
}

function retainWithinLimits(files: PrintedFileRecord[]) {
  const ordered = [...files].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const retained: PrintedFileRecord[] = [];
  let retainedBytes = 0;
  for (const file of ordered) {
    const storageBytes = estimatedFileBytes(file);
    if (retained.length >= MAX_SAVED_PRINTED_FILES || retainedBytes + storageBytes > MAX_SAVED_PRINTED_BYTES) break;
    retained.push({ ...file, storageBytes });
    retainedBytes += storageBytes;
  }
  return retained;
}

export function listPrintedFiles(): PrintedFileRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]') as PrintedFileRecord[];
    if (!Array.isArray(parsed)) return [];
    const ordered = parsed.map((file) => ({ ...file, source: file.source ?? inferPrintedFileSource(file) }));
    const retained = retainWithinLimits(ordered);
    if (retained.length < ordered.length) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(retained));
    }
    return retained;
  } catch {
    return [];
  }
}

function inferPrintedFileSource(file: PrintedFileRecord): PrintedFileSource {
  if (file.title.includes('小晤')) return 'lumi_space';
  if (file.title.includes('单元测试')) return 'unit_test';
  if (file.title.includes('错题')) return 'mistake_print';
  return 'precision_practice';
}

function write(files: PrintedFileRecord[]) {
  const retained = retainWithinLimits(files);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(retained));
  window.dispatchEvent(new CustomEvent(PRINTED_FILES_CHANGED_EVENT));
}

export function savePrintedFile(input: Omit<PrintedFileRecord, 'id' | 'createdAt' | 'updatedAt' | 'attempts'>) {
  const now = new Date().toISOString();
  const record: PrintedFileRecord = { ...input, id: `print-${Date.now()}`, createdAt: now, updatedAt: now, attempts: 1, storageBytes: input.storageBytes ?? Math.max(1, input.pageCount) * ESTIMATED_BYTES_PER_PAGE };
  if (record.storageBytes > MAX_SINGLE_PRINTED_FILE_BYTES) throw new DOMException('文件超过 50 MB，无法保存。', 'QuotaExceededError');
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
