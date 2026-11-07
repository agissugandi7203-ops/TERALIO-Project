import React, { memo, useRef, useState, useEffect, useCallback } from 'react';
import ThinkingOrbStage from './ThinkingOrbStage.jsx';

const SMART_SCROLL_THRESHOLD_PX = 64;

/**
 * Merender inline formatting aman (**bold**, __bold__, *italic*, `code`, currency pill, dan [judul](https://url)) tanpa dangerouslySetInnerHTML.
 */
function renderInlineTokens(text) {
  if (!text) return null;
  // Deteksi bold, inline code, link, dan currency tag
  const pattern = /(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^\s)]+\)|Rp\s?[\d.,]+(?:\s*\/\s*(?:bln|bulan))?)/g;
  const parts = String(text).split(pattern);

  return parts.map((part, idx) => {
    if (!part) return null;

    // Bold (**text** atau __text__)
    if (
      (part.startsWith('**') && part.endsWith('**') && part.length > 4) ||
      (part.startsWith('__') && part.endsWith('__') && part.length > 4)
    ) {
      return (
        <strong key={idx} className="chat-bold">
          {part.slice(2, -2)}
        </strong>
      );
    }

    // Inline Code (`code`)
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code key={idx} className="chat-inline-code">
          {part.slice(1, -1)}
        </code>
      );
    }

    // Link ([title](url))
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

    // Currency highlight (Rp 1.xxx.xxx)
    if (/^Rp\s?[\d.,]+/i.test(part)) {
      return (
        <span key={idx} className="chat-currency-pill">
          {part}
        </span>
      );
    }

    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

/**
 * Cek apakah baris berupa baris tabel markdown (| col1 | col2 | ...)
 */
function isTableRow(line) {
  const trimmed = line.trim();
  return trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.split('|').length >= 3;
}

/**
 * Cek apakah baris pemisah header tabel (|---|---|:---:|)
 */
function isTableDivider(line) {
  const trimmed = line.trim();
  return /^\|(?:\s*:?-+:?\s*\|)+$/.test(trimmed);
}

/**
 * Komponen render tabel markdown interaktif dan elegan
 */
function RenderModernTable({ block }) {
  const { headers, alignments, rows } = block;

  return (
    <div className="chat-table-wrapper" data-testid="chat-markdown-table-wrapper">
      <table className="chat-modern-table" data-testid="chat-markdown-table">
        <thead>
          <tr>
            {headers.map((h, hIdx) => (
              <th
                key={`th-${hIdx}`}
                style={{ textAlign: alignments[hIdx] || 'left' }}
                className={`th-col-${hIdx}`}
              >
                {renderInlineTokens(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rIdx) => (
            <tr key={`tr-${rIdx}`}>
              {row.map((cell, cIdx) => {
                const headerText = headers[cIdx] ? headers[cIdx].toLowerCase() : '';
                const cellText = String(cell).trim();

                // Deteksi kolom tipe kos (Putri / Putra / Campur)
                const isTypeCol =
                  headerText.includes('tipe') ||
                  headerText.includes('gender') ||
                  /^(putri|putra|campur|putra\/putri)$/i.test(cellText);

                if (isTypeCol) {
                  const lower = cellText.toLowerCase();
                  let badgeClass = 'is-campur';
                  if (lower.includes('putri') && !lower.includes('putra')) {
                    badgeClass = 'is-putri';
                  } else if (lower.includes('putra') && !lower.includes('putri')) {
                    badgeClass = 'is-putra';
                  }

                  return (
                    <td
                      key={`td-${cIdx}`}
                      style={{ textAlign: alignments[cIdx] || 'left' }}
                      className="td-badge-cell"
                    >
                      <span className={`table-badge ${badgeClass}`}>
                        <span className="badge-dot" />
                        {cellText}
                      </span>
                    </td>
                  );
                }

                // Deteksi kolom harga
                const isPriceCol =
                  headerText.includes('harga') ||
                  headerText.includes('biaya') ||
                  headerText.includes('price') ||
                  /^Rp/i.test(cellText);

                if (isPriceCol) {
                  return (
                    <td
                      key={`td-${cIdx}`}
                      style={{ textAlign: alignments[cIdx] || 'right' }}
                      className="td-price-cell"
                    >
                      <span className="table-price-tag">
                        {renderInlineTokens(cellText)}
                      </span>
                    </td>
                  );
                }

                // Kolom nama kos (kolom pertama)
                const isFirstCol = cIdx === 0;

                return (
                  <td
                    key={`td-${cIdx}`}
                    style={{ textAlign: alignments[cIdx] || 'left' }}
                    className={isFirstCol ? 'td-kos-name' : undefined}
                  >
                    {renderInlineTokens(cell)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
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

  let idx = 0;
  while (idx < lines.length) {
    const rawLine = lines[idx];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      flushList();
      idx++;
      continue;
    }

    // 1. Deteksi Tabel Markdown (| header | header | ...)
    if (
      isTableRow(trimmed) &&
      idx + 1 < lines.length &&
      isTableDivider(lines[idx + 1])
    ) {
      flushList();

      const tableLines = [];
      while (idx < lines.length && isTableRow(lines[idx])) {
        tableLines.push(lines[idx].trim());
        idx++;
      }

      const cleanCells = (l) =>
        l
          .split('|')
          .slice(1, -1)
          .map((c) => c.trim());

      const headers = cleanCells(tableLines[0]);
      const dividerCells = cleanCells(tableLines[1]);
      const rows = tableLines.slice(2).map(cleanCells).filter((r) => r.length > 0);

      const alignments = dividerCells.map((d) => {
        const left = d.startsWith(':');
        const right = d.endsWith(':');
        if (left && right) return 'center';
        if (right) return 'right';
        return 'left';
      });

      blocks.push({
        type: 'table',
        key: `table-${idx}`,
        headers,
        alignments,
        rows,
      });
      continue;
    }

    // 2. Deteksi Callout Quote (> Catatan atau kutipan)
    if (trimmed.startsWith('> ')) {
      flushList();
      blocks.push({
        type: 'callout',
        key: `callout-${idx}`,
        text: trimmed.slice(2).trim(),
      });
      idx++;
      continue;
    }

    // 3. Deteksi List (Bullet & Numbered)
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
      idx++;
      continue;
    }

    flushList();

    // 4. Deteksi Heading (### Heading 3, ## Heading 2, # Heading 1)
    const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length,
        key: `h-${idx}`,
        text: headingMatch[2],
      });
      idx++;
      continue;
    }

    // 5. Paragraf Normal dengan token inline
    blocks.push({
      type: 'paragraph',
      key: `p-${idx}`,
      text: rawLine,
    });
    idx++;
  }

  flushList();

  return (
    <div className="chat-formatted-body">
      {blocks.map((block) => {
        if (block.type === 'table') {
          return <RenderModernTable key={block.key} block={block} />;
        }

        if (block.type === 'callout') {
          return (
            <div key={block.key} className="chat-callout-card">
              <div className="chat-callout-bar" aria-hidden="true" />
              <p className="chat-callout-text">{renderInlineTokens(block.text)}</p>
            </div>
          );
        }

        if (block.type === 'heading') {
          const Tag = block.level === 1 ? 'h3' : block.level === 2 ? 'h4' : 'h5';
          return (
            <Tag key={block.key} className={`chat-msg-heading level-${block.level}`}>
              {renderInlineTokens(block.text)}
            </Tag>
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

        {/* Indikator Thinking Orb DIPERBESAR & Elegan saat Streaming Aktif */}
        {showOrb && (
          <div className="chat-turn__status-row" data-testid="chat-streaming-indicator">
            <ThinkingOrbStage
              mode="inline"
              state={message.orbState}
              variant={message.orbVariant || 'default'}
              size={28}
              paused={false}
              showLabel={false}
            />
            <span className="chat-turn__status-text">
              {message.statusLabel ||
                (message.orbVariant === 'twins'
                  ? 'Menalar secara mendalam (Thinking High)...'
                  : 'Memproses respons...')}
            </span>
          </div>
        )}

        {/* Teks percakapan terstruktur progresif (Markdown table, bold, pills, callout) */}
        {message.content ? (
          isUser ? (
            <p className="chat-user-text">{message.content}</p>
          ) : (
            <FormattedMessageContent text={message.content} />
          )
        ) : null}

        {/* Baris Metrik Throughput & Thinking Mode Transparan (tok/s, waktu, token) */}
        {!isUser && message.metrics && (
          <div className="chat-turn__metrics-bar" data-testid="chat-metrics-bar">
            <span className="chat-metric-chip is-speed" title="Kecepatan respons token per detik (Throughput)">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              <span>{message.metrics.throughput} tok/s</span>
            </span>
            <span className="chat-metric-chip" title="Durasi pemrosesan respons">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>{message.metrics.elapsedSeconds}s</span>
            </span>
            {message.metrics.isDeepThinking && (
              <span className="chat-metric-chip is-thinking" title="Mode Reasoning Mendalam Aktif">
                <span className="thinking-chip-dot" />
                <span>Deep Reasoning</span>
              </span>
            )}
            <span className="chat-metric-chip is-tokens" title="Total token respons">
              <span>{message.metrics.outputTokens} tok</span>
            </span>
          </div>
        )}

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
