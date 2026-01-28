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

const markdownToHtml = (markdown = '') => {
  if (!markdown) return '';
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const html = [];
  let inCodeBlock = false;
  let codeBuffer = [];
  let listType = null;
  let listBuffer = [];
  let paragraphBuffer = [];

  const flushParagraph = () => {
    if (!paragraphBuffer.length) return;
    const content = paragraphBuffer.join('<br/>');
    html.push(`<p>${formatInline(content)}</p>`);
    paragraphBuffer = [];
  };

  const flushList = () => {
    if (!listType || !listBuffer.length) return;
    html.push(`<${listType}>${listBuffer.join('')}</${listType}>`);
    listType = null;
    listBuffer = [];
  };

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
        flushList();
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
      flushList();
      return;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      const level = headingMatch[1].length;
      html.push(`<h${level}>${formatInline(headingMatch[2])}</h${level}>`);
      return;
    }

    const blockquoteMatch = line.match(/^>\s?(.+)$/);
    if (blockquoteMatch) {
      flushParagraph();
      flushList();
      html.push(`<blockquote>${formatInline(blockquoteMatch[1])}</blockquote>`);
      return;
    }

    const unorderedMatch = line.match(/^[-*]\s+(.+)$/);
    if (unorderedMatch) {
      flushParagraph();
      if (listType && listType !== 'ul') flushList();
      listType = 'ul';
      listBuffer.push(`<li>${formatInline(unorderedMatch[1])}</li>`);
      return;
    }

    const orderedMatch = line.match(/^\d+\.\s+(.+)$/);
    if (orderedMatch) {
      flushParagraph();
      if (listType && listType !== 'ol') flushList();
      listType = 'ol';
      listBuffer.push(`<li>${formatInline(orderedMatch[1])}</li>`);
      return;
    }

    paragraphBuffer.push(line);
  });

  flushParagraph();
  flushList();
  flushCode();

  return html.join('');
};

module.exports = {
  markdownToHtml,
};
