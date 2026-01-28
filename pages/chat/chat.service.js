const { CHAT_CONFIG } = require('./chat.constants');
const { requestChatCompletionStream } = require('./chat.api');

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

const parseChatResponse = (data) => {
  const choice = data && data.choices && data.choices[0];
  const message = choice && choice.message ? choice.message : {};
  return {
    content: message.content || '',
    reasoning: message.reasoning_content || '',
  };
};

const parseChatDelta = (data) => {
  const choice = data && data.choices && data.choices[0];
  const delta = choice && choice.delta ? choice.delta : {};
  return {
    content: delta.content || '',
    reasoning: delta.reasoning_content || '',
  };
};

const fetchAssistantReplyStream = ({ messages, onDelta }) => {
  const payload = buildChatPayload({ messages, stream: true });
  return requestChatCompletionStream({
    payload,
    onDelta: (data) => {
      if (data && data.choices) {
        const choice = data.choices[0];
        if (choice && choice.delta) {
          const delta = parseChatDelta(data);
          if (delta.content || delta.reasoning) onDelta(delta);
          return;
        }
        const parsed = parseChatResponse(data);
        if (parsed.content || parsed.reasoning) onDelta(parsed);
        return;
      }
      const parsed = parseChatResponse(data);
      if (parsed.content || parsed.reasoning) onDelta(parsed);
    },
  });
};

module.exports = {
  buildChatPayload,
  fetchAssistantReplyStream,
};
