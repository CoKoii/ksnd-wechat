const UI_TEXT = {
  title: '新对话',
  sidebarTitle: '历史对话',
  sidebarEmpty: '暂无历史对话',
  placeholder: '发消息或按住说话',
  emptyTitle: '今天有什么可以帮到你?',
  think: '思考',
  search: '搜索',
  errorFallback: '请求失败，请稍后再试。',
};

const CHAT_CONFIG = {
  apiKey: 'sk-583f98038a7f4df99f4f86c740ee7bbf',
  baseUrl: 'https://api.deepseek.com',
  chatPath: '/chat/completions',
  timeout: 60000,
  modelChat: 'deepseek-chat',
  systemPrompt: 'You are a helpful assistant.',
  temperature: 0.7,
  top_p: 1,
  max_tokens: 1024,
};

const UI_CONFIG = {
  maxMessages: 50,
  maxConversations: 30,
  titleMaxLength: 12,
  streamThrottleMs: 60,
};

const STORAGE_KEYS = {
  conversations: 'chat_conversations_v1',
};

module.exports = {
  UI_TEXT,
  CHAT_CONFIG,
  UI_CONFIG,
  STORAGE_KEYS,
};
