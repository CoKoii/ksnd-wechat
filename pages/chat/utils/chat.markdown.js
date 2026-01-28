// 轻量 Markdown -> HTML（仅覆盖聊天场景）
const escapeHtml = (value = '') =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const escapeAttr = (value = '') => escapeHtml(value).replace(/`/g, '&#96;');

const formatInline = (value = '') => {
  let text = escapeHtml(value);
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_match, label, url) => {
    const safeUrl = escapeAttr(url);
    return `<a href="${safeUrl}">${label}</a>`;
  });
  return text;
};

const normalizeMarkdown = (markdown = '') =>
  markdown.replace(/\r\n/g, '\n').replace(/<br\s*\/?>/gi, '\n');

const markdownToHtml = (markdown = '') => {
  if (!markdown) return '';
  const lines = normalizeMarkdown(markdown).split('\n');
  const html = [];
  let inCodeBlock = false;
  let codeBuffer = [];
  // 使用栈支持有序/无序列表与嵌套
  const listStack = [];
  let paragraphBuffer = [];

  const flushParagraph = () => {
    if (!paragraphBuffer.length) return;
    const content = paragraphBuffer.join('<br/>');
    html.push(`<p>${formatInline(content)}</p>`);
    paragraphBuffer = [];
  };

  const flushListItem = (list) => {
    if (!list || list.currentItem === null) return;
    list.items.push(`<li>${list.currentItem}</li>`);
    list.currentItem = null;
  };

  const closeList = () => {
    const list = listStack.pop();
    if (!list) return;
    flushListItem(list);
    if (!list.items.length) return;
    const markup = `<${list.type}>${list.items.join('')}</${list.type}>`;
    const parent = listStack[listStack.length - 1];
    if (parent) {
      parent.currentItem = parent.currentItem ? `${parent.currentItem}${markup}` : markup;
      return;
    }
    html.push(markup);
  };

  const closeListsToDepth = (depth) => {
    while (listStack.length > depth) {
      closeList();
    }
  };

  const openList = (type) => {
    listStack.push({ type, items: [], currentItem: null });
  };

  const flushAllLists = () => closeListsToDepth(0);

  const flushCode = () => {
    if (!codeBuffer.length) return;
    html.push(`<pre><code>${escapeHtml(codeBuffer.join('\n'))}</code></pre>`);
    codeBuffer = [];
  };

  lines.forEach((rawLine) => {
    const line = rawLine || '';

    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        inCodeBlock = false;
        flushCode();
      } else {
        flushParagraph();
        flushAllLists();
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      return;
    }

    if (line.trim() === '') {
      flushParagraph();
      flushAllLists();
      return;
    }

    const headingMatch = line.match(/^\s{0,3}(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      flushAllLists();
      const level = headingMatch[1].length;
      html.push(`<h${level}>${formatInline(headingMatch[2])}</h${level}>`);
      return;
    }

    const blockquoteMatch = line.match(/^\s*>\s?(.+)$/);
    if (blockquoteMatch) {
      flushParagraph();
      flushAllLists();
      html.push(`<blockquote>${formatInline(blockquoteMatch[1])}</blockquote>`);
      return;
    }

    const unorderedMatch = line.match(/^\s*[-*]\s+(.+)$/);
    const orderedMatch = unorderedMatch ? null : line.match(/^\s*\d+\.\s+(.+)$/);
    if (unorderedMatch || orderedMatch) {
      flushParagraph();
      const content = unorderedMatch ? unorderedMatch[1] : orderedMatch[1];
      const type = unorderedMatch ? 'ul' : 'ol';
      const indentRaw = line.replace(/\t/g, '  ');
      const leadingSpaces = (indentRaw.match(/^\s*/) || [''])[0].length;
      const indentLevel = Math.max(0, Math.floor(leadingSpaces / 2));
      const desiredDepth = Math.min(indentLevel + 1, listStack.length + 1);
      closeListsToDepth(desiredDepth);
      while (listStack.length < desiredDepth) {
        openList(type);
      }
      let currentList = listStack[listStack.length - 1];
      if (!currentList || currentList.type !== type) {
        closeList();
        openList(type);
        currentList = listStack[listStack.length - 1];
      }
      flushListItem(currentList);
      currentList.currentItem = formatInline(content);
      return;
    }

    if (listStack.length) {
      const indentedMatch = line.match(/^\s{2,}(.+)$/);
      if (indentedMatch) {
        const currentList = listStack[listStack.length - 1];
        currentList.currentItem = currentList.currentItem
          ? `${currentList.currentItem}<br/>${formatInline(indentedMatch[1])}`
          : formatInline(indentedMatch[1]);
        return;
      }
      flushAllLists();
    }

    paragraphBuffer.push(line);
  });

  flushParagraph();
  flushAllLists();
  flushCode();

  return html.join('');
};

module.exports = {
  markdownToHtml,
};
