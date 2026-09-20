export interface QwenChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const SYSTEM_PROMPT =
  '你是 AI 学伴「小晤」，一位温暖、耐心、善于引导的 K12 学习伴侣。' +
  '用简洁、鼓励的语气回答，适当使用 emoji。' +
  '若涉及具体学科，给出可操作的下一步建议，避免空泛说教。';

const API_PATH = '/api/qwen/chat/completions';

/** 开发服务器是否已配置千问代理（生产构建需自备后端转发） */
export function isQwenEnabled(): boolean {
  return import.meta.env.VITE_QWEN_ENABLED === 'true' || import.meta.env.VITE_QWEN_ENABLED === true;
}

export function getQwenModel(): string {
  return import.meta.env.VITE_DASHSCOPE_MODEL || 'qwen-plus';
}

function parseApiError(status: number, detail: string): string {
  if (status === 401) return '千问 API Key 无效或未配置，请检查 .env.local 中的 DASHSCOPE_API_KEY';
  if (status === 404) return '千问接口地址有误，请检查 DASHSCOPE_BASE_URL 是否为 compatible-mode 网关';
  try {
    const json = JSON.parse(detail);
    return json?.error?.message || json?.message || detail;
  } catch {
    return detail || `千问 API 请求失败 (${status})`;
  }
}

export async function chatWithQwen(
  messages: QwenChatMessage[],
  options?: { model?: string; signal?: AbortSignal; systemPrompt?: string }
): Promise<string> {
  if (!isQwenEnabled()) {
    throw new Error(
      '千问未配置：请在 .env.local 设置 DASHSCOPE_API_KEY，或执行 bl auth login 后重启 npm run dev'
    );
  }

  const model = options?.model || getQwenModel();

  const response = await fetch(API_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: options?.signal,
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: options?.systemPrompt || SYSTEM_PROMPT },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(parseApiError(response.status, detail));
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('千问 API 返回为空');
  }
  return content.trim();
}
