export type PrintedFileStatus = 'success' | 'failed' | 'unknown' | 'cancelled' | 'saved';
export type PaperContentMode = 'paper_only' | 'paper_answer' | 'paper_answer_analysis';
export type PrintedFileSource = 'lumi_space' | 'precision_practice' | 'unit_test' | 'mistake_print' | 'other';
export const PRINTED_FILE_SOURCE_LABELS: Record<PrintedFileSource, string> = {
  lumi_space: '小晤组卷',
  precision_practice: '精准练习',
  unit_test: '单元测试',
  mistake_print: '错题打印',
  other: '其他来源',
};
export const PAPER_CONTENT_LABELS: Record<PaperContentMode, string> = {
  paper_only: '试卷', paper_answer: '试卷 + 答案', paper_answer_analysis: '试卷 + 答案 + 解析',
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
  failureReason?: string;
  printerName?: string;
  attempts: number;
  includeAnswerAnalysis?: boolean;
  contentMode?: PaperContentMode;
  source?: PrintedFileSource;
  documentId?: string;
  version?: number;
  storageBytes?: number;
}

const STORAGE_KEY = 'ai-companion:printed-files:v1';
export const MAX_SAVED_PRINTED_FILES = 100;
export const MAX_SAVED_PRINTED_BYTES = 500 * 1024 * 1024;
export const MAX_SINGLE_PRINTED_FILE_BYTES = 50 * 1024 * 1024;
export const PRINTED_FILES_CHANGED_EVENT = 'ai-companion:printed-files-changed';

export function listPrintedFiles(): PrintedFileRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]') as PrintedFileRecord[];
    if (!Array.isArray(parsed)) return [];
    const ordered = [...parsed].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    const retained = ordered.slice(0, MAX_SAVED_PRINTED_FILES);
    if (retained.length < ordered.length) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(retained));
      removeStoredDocuments(ordered.slice(MAX_SAVED_PRINTED_FILES));
    }
    return retained;
  } catch {
    return [];
  }
}

function write(files: PrintedFileRecord[]) {
  const ordered = [...files].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const retained: PrintedFileRecord[] = [];
  let retainedBytes = 0;
  for (const file of ordered) {
    const fileBytes = Math.max(0, file.storageBytes ?? 0);
    if (retained.length >= MAX_SAVED_PRINTED_FILES || retainedBytes + fileBytes > MAX_SAVED_PRINTED_BYTES) break;
    retained.push(file);
    retainedBytes += fileBytes;
  }
  const retainedIds = new Set(retained.map((file) => file.id));
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(retained));
  removeStoredDocuments(ordered.filter((file) => !retainedIds.has(file.id)));
  window.dispatchEvent(new CustomEvent(PRINTED_FILES_CHANGED_EVENT));
}

function removeStoredDocuments(files: PrintedFileRecord[]) {
  for (const file of files) {
    const documentId = file.documentId ?? file.id;
    void documentOperation('readwrite', (store) => store.delete(documentId)).catch(console.error);
  }
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
  const file = listPrintedFiles().find((item) => item.id === id);
  write(listPrintedFiles().filter((item) => item.id !== id));
  if (file) removeStoredDocuments([file]);
}

export interface StoredPaperDocument { pdf: Blob; previewPages: Blob[]; }
const DOCUMENT_DATABASE = 'ai-companion:paper-documents:v1';

function documentOperation<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DOCUMENT_DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore('documents');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction('documents', mode);
      const operation = action(transaction.objectStore('documents'));
      transaction.oncomplete = () => { db.close(); resolve(operation.result); };
      transaction.onabort = () => { db.close(); reject(transaction.error ?? new Error('文档存储失败')); };
      transaction.onerror = () => { db.close(); reject(transaction.error); };
    };
  });
}

export function loadPaperDocument(id: string): Promise<StoredPaperDocument | undefined> {
  return documentOperation('readonly', (store) => store.get(id));
}

export function clearPaperDocuments() {
  return documentOperation('readwrite', (store) => store.clear());
}

export async function savePaperDocument(
  input: Omit<PrintedFileRecord, 'id' | 'createdAt' | 'updatedAt' | 'attempts' | 'documentId'>,
  document: StoredPaperDocument,
) {
  const storageBytes = document.pdf.size + document.previewPages.reduce((total, page) => total + page.size, 0);
  if (storageBytes > MAX_SINGLE_PRINTED_FILE_BYTES) {
    throw new Error('单份文件超过 50 MB，无法保存。');
  }
  const existingFiles = await Promise.all(listPrintedFiles().map(async (file) => {
    if (typeof file.storageBytes === 'number') return file;
    const stored = await loadPaperDocument(file.documentId ?? file.id);
    const legacyBytes = stored ? stored.pdf.size + stored.previewPages.reduce((total, page) => total + page.size, 0) : 0;
    return { ...file, storageBytes: legacyBytes };
  }));
  const id = `pdf-${crypto.randomUUID()}`;
  await documentOperation('readwrite', (store) => store.put(document, id));
  const now = new Date().toISOString();
  const record: PrintedFileRecord = { ...input, id, documentId: id, createdAt: now, updatedAt: now, attempts: 0, storageBytes };
  try { write([record, ...existingFiles]); }
  catch (error) { await documentOperation('readwrite', (store) => store.delete(id)); throw error; }
  return record;
}

export { STORAGE_KEY as PRINTED_FILE_STORAGE_KEY };
