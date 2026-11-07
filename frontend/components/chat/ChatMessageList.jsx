import React, { memo, useRef, useState, useEffect, useCallback } from 'react';
import ThinkingOrbStage from './ThinkingOrbStage.jsx';

const SMART_SCROLL_THRESHOLD_PX = 64;

/**
 * Merender inline formatting aman (**bold**, `code`, [judul](https://url)) tanpa dangerouslySetInnerHTML.
 */
function renderInlineTokens(text) {
  if (!text) return null;
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^\s)]+\))/g;
  const parts = String(text).split(pattern);

  return parts.map((part, idx) => {
    if (!part) return null;

    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={idx}>{part.slice(2, -2)}</strong>;
    }

    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code key={idx} className="chat-inline-code">
          {part.slice(1, -1)}
        </code>
      );
    }

    const linkMatch = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
    if (linkMatch) {
      return (
        <a
          key={idx}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="chat-inline-link"
        >
          {linkMatch[1]}
        </a>
      );
    }

    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

function FormattedMessageContent({ text }) {
  if (!text) return null;
  const lines = String(text).replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let currentList = null;

  const flushList = () => {
    if (currentList) {
      blocks.push(currentList);
      currentList = null;
    }
  };

  lines.forEach((rawLine, idx) => {
    const trimmed = rawLine.trim();

    if (!trimmed) {
      flushList();
      return;
    }

    const bulletMatch = trimmed.match(/^[-*•]\s+(.+)$/);
    const numberedMatch = trimmed.match(/^\d+\.\s+(.+)$/);

    if (bulletMatch || numberedMatch) {
      const ordered = Boolean(numberedMatch);
      const itemText = (bulletMatch ? bulletMatch[1] : numberedMatch[1]).trim();

      if (!currentList || currentList.ordered !== ordered) {
        flushList();
        currentList = {
          type: 'list',
          ordered,
          key: `list-${idx}`,
          items: [],
        };
      }
      currentList.items.push({ key: `li-${idx}`, text: itemText });
      return;
    }

    flushList();

    const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length,
        key: `h-${idx}`,
        text: headingMatch[2],
      });
      return;
    }

    blocks.push({
      type: 'paragraph',
      key: `p-${idx}`,
      text: rawLine,
    });
  });

  flushList();

  return (
    <div className="chat-formatted-body">
      {blocks.map((block) => {
        if (block.type === 'heading') {
          return (
            <h4 key={block.key} className="chat-msg-heading">
              {renderInlineTokens(block.text)}
            </h4>
          );
        }

        if (block.type === 'list') {
          const ListTag = block.ordered ? 'ol' : 'ul';
          return (
            <ListTag key={block.key} className="chat-msg-list">
              {block.items.map((item) => (
                <li key={item.key}>{renderInlineTokens(item.text)}</li>
              ))}
            </ListTag>
          );
        }

        return (
          <p key={block.key} className="chat-msg-paragraph">
            {renderInlineTokens(block.text)}
          </p>
        );
      })}
    </div>
  );
}

const ChatMessageItem = memo(function ChatMessageItem({
  message,
  onOpenRecommendations,
  onRetry,
}) {
  const isUser = message.role === 'user';
  const hasAttachments = Array.isArray(message.attachments) && message.attachments.length > 0;
  const hasCitations = Array.isArray(message.citations) && message.citations.length > 0;
  const showOrb =
    !isUser &&
    (message.status === 'streaming' || message.status === 'retrying') &&
    message.orbState;

  return (
    <article
      className={`chat-turn ${isUser ? 'is-user' : 'is-assistant'} ${
        message.modality === 'voice' ? 'is-voice-turn' : ''
      }`}
      data-testid={`chat-message-${message.role}`}
    >
      <div className="chat-turn__bubble">
        {/* Lampiran pada pesan pengguna */}
        {hasAttachments && (
          <div className="chat-turn__attachments">
            {message.attachments.map((att, index) => (
              <div key={att.id || index} className="chat-turn__attachment-item">
                {att.previewUrl || (att.dataUrl && att.kind === 'image') ? (
                  <img
                    src={att.previewUrl || att.dataUrl}
                    alt={att.filename || 'Lampiran gambar'}
                    className="chat-turn__attachment-img"
                  />
                ) : (
                  <div className="chat-turn__attachment-doc">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    <span>{att.filename || 'Dokumen'}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Indikator Thinking Orb sinkron dengan aktivitas aktual AI */}
        {showOrb && (
          <div className="chat-turn__status-row">
            <ThinkingOrbStage
              mode="inline"
              state={message.orbState}
              variant={message.orbVariant || 'default'}
              size={20}
              label={message.statusLabel || 'Memproses...'}
            />
          </div>
        )}

        {/* Teks percakapan progresif */}
        {message.content ? (
          isUser ? (
            <p className="chat-user-text">{message.content}</p>
          ) : (
            <FormattedMessageContent text={message.content} />
          )
        ) : null}

        {/* Pesan error transparan & jujur */}
        {message.error && (
          <div className="chat-turn__error" role="alert" data-testid="chat-message-error">
            <p className="chat-turn__error-text">{message.error}</p>
            {onRetry && (
              <button
                type="button"
                className="chat-turn__retry-btn"
                onClick={() => onRetry(message)}
                data-testid="chat-retry-btn"
              >
                Coba Lagi
              </button>
            )}
          </div>
        )}

        {/* Sitasi sumber pencarian web jika tersedia */}
        {hasCitations && (
          <div className="chat-turn__citations" aria-label="Sumber referensi web">
            {message.citations.map((cit, idx) => (
              <a
                key={`${cit.url}-${idx}`}
                href={cit.url}
                target="_blank"
                rel="noopener noreferrer"
                className="chat-citation-pill"
              >
                <span>{cit.title || new URL(cit.url).hostname.replace(/^www\./, '')}</span>
                <span aria-hidden="true">↗</span>
              </a>
            ))}
          </div>
        )}

        {/* Akses cepat membuka kembali panel rekomendasi jika turn ini menemukan lokasi */}
        {!isUser && message.recommendationCount > 0 && onOpenRecommendations && (
          <div className="chat-turn__rec-trigger-row">
            <button
              type="button"
              className="chat-turn__rec-pill"
              onClick={onOpenRecommendations}
              data-testid="chat-reopen-recommendations-btn"
            >
              <span>Lihat {message.recommendationCount} rekomendasi lokasi</span>
              <span aria-hidden="true">→</span>
            </button>
          </div>
        )}
      </div>
    </article>
  );
});

export function ChatMessageList({
  messages = [],
  isStreaming = false,
  onOpenRecommendations,
  onRetryMessage,
}) {
  const scrollContainerRef = useRef(null);
  const pinnedRef = useRef(true);
  const prevCountRef = useRef(messages.length);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const scrollToBottom = useCallback((behavior = 'auto') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    pinnedRef.current = true;
    setShowScrollButton(false);
    if (typeof el.scrollTo === 'function') {
      el.scrollTo({ top: el.scrollHeight, behavior });
    } else {
      el.scrollTop = el.scrollHeight;
    }
  }, []);

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const isNearBottom = distanceFromBottom <= SMART_SCROLL_THRESHOLD_PX;
    pinnedRef.current = isNearBottom;
    setShowScrollButton(!isNearBottom && el.scrollHeight > el.clientHeight + 80);
  }, []);

  // Saat pesan baru dari user masuk, otomatis scroll ke bawah; saat streaming delta, scroll hanya bila pinned
  const lastMsgContent = messages.at(-1)?.content || '';
  const lastMsgStatus = messages.at(-1)?.statusLabel || '';

  useEffect(() => {
    const addedNewMessage = messages.length > prevCountRef.current;
    const newestIsUser = messages.at(-1)?.role === 'user';
    prevCountRef.current = messages.length;

    if (addedNewMessage && newestIsUser) {
      scrollToBottom('smooth');
      return;
    }

    if (pinnedRef.current) {
      scrollToBottom('auto');
    }
  }, [messages.length, lastMsgContent, lastMsgStatus, isStreaming, scrollToBottom]);

  return (
    <div className="chat-stream-wrapper">
      <div
        ref={scrollContainerRef}
        className="chat-stream-scroll"
        onScroll={handleScroll}
        data-testid="chat-message-scroll"
      >
        <div className="chat-stream-inner" data-testid="chat-message-list">
          {messages.map((msg) => (
            <ChatMessageItem
              key={msg.id}
              message={msg}
              onOpenRecommendations={onOpenRecommendations}
              onRetry={onRetryMessage}
            />
          ))}
        </div>
      </div>

      {showScrollButton && (
        <button
          type="button"
          className="chat-scroll-bottom-pill"
          onClick={() => scrollToBottom('smooth')}
          aria-label="Gulir ke pesan terbaru"
          data-testid="chat-scroll-bottom-btn"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <polyline points="19 12 12 19 5 12" />
          </svg>
          <span>Pesan terbaru</span>
        </button>
      )}
    </div>
  );
}

export default ChatMessageList;
