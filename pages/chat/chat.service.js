const { CHAT_CONFIG } = require('./chat.constants');
const { requestChatCompletionStream } = require('./chat.api');

const getFirstChoice = (data) => (data && data.choices && data.choices[0]) || null;
const pickChatFields = (payload = {}) => ({
  content: payload.content || '',
  reasoning: payload.reasoning_content || '',
});

const buildChatPayload = ({ messages, stream = false }) => {
  const model = CHAT_CONFIG.modelChat;
  return {
    model,
    messages,
    stream,
    temperature: CHAT_CONFIG.temperature,
    top_p: CHAT_CONFIG.top_p,
    max_tokens: CHAT_CONFIG.max_tokens,
  };
};

const parseChatEvent = (data) => {
  const choice = getFirstChoice(data);
  if (choice && choice.delta) return pickChatFields(choice.delta);
  if (choice && choice.message) return pickChatFields(choice.message);
  return pickChatFields();
};

const fetchAssistantReplyStream = ({ messages, onDelta }) => {
  const payload = buildChatPayload({ messages, stream: true });
  return requestChatCompletionStream({
    payload,
    onDelta: (data) => {
      const parsed = parseChatEvent(data);
      if (parsed.content || parsed.reasoning) onDelta(parsed);
    },
  });
};

module.exports = {
  buildChatPayload,
  fetchAssistantReplyStream,
};
