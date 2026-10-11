export type PrintedFileStatus = 'success' | 'failed' | 'unknown' | 'cancelled' | 'saved';
export type PaperContentMode = 'paper_only' | 'paper_answer' | 'paper_answer_analysis';
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
  documentId?: string;
  version?: number;
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
  void documentOperation('readwrite', (store) => store.delete(id)).catch(console.error);
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
  const id = `pdf-${crypto.randomUUID()}`;
  await documentOperation('readwrite', (store) => store.put(document, id));
  const now = new Date().toISOString();
  const record: PrintedFileRecord = { ...input, id, documentId: id, createdAt: now, updatedAt: now, attempts: 0 };
  try { write([record, ...listPrintedFiles()]); }
  catch (error) { await documentOperation('readwrite', (store) => store.delete(id)); throw error; }
  return record;
}

export { STORAGE_KEY as PRINTED_FILE_STORAGE_KEY };
