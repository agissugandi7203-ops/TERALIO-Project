import React, { memo, useRef, useState, useEffect, useCallback } from 'react';
import ThinkingOrbStage from './ThinkingOrbStage.jsx';

const SMART_SCROLL_THRESHOLD_PX = 64;

/**
 * Normalisasi penulisan merek platform agar tidak capslock ("TERALIO" -> "Teralio")
 */
export function normalizeBrandCasing(text) {
  if (!text) return '';
  return String(text).replace(/\bTERALIO\b/g, 'Teralio');
}

/**
 * Merender inline formatting aman (**bold**, __bold__, *italic*, `code`, currency pill, dan [judul](https://url)) tanpa dangerouslySetInnerHTML.
 */
function renderInlineTokens(text) {
  if (!text) return null;
  const safeText = normalizeBrandCasing(text);
  // Deteksi bold, inline code, link, dan currency tag
  const pattern = /(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^\s)]+\)|Rp\s?[\d.,]+(?:\s*\/\s*(?:bln|bulan))?)/g;
  const parts = String(safeText).split(pattern);

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
 * Membersihkan sel tabel dari spasi dan delimiter luar
 */
function cleanTableCells(line) {
  let s = String(line || '').trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|')) s = s.slice(0, -1);
  return s.split('|').map((c) => c.trim());
}

/**
 * Cek apakah baris berupa baris tabel markdown (mengandung pipa dan minimal 2 sel)
 */
function isPotentialTableRow(line) {
  if (!line) return false;
  const trimmed = line.trim();
  if (!trimmed.includes('|')) return false;
  let core = trimmed;
  if (core.startsWith('|')) core = core.slice(1);
  if (core.endsWith('|')) core = core.slice(0, -1);
  return core.split('|').length >= 2;
}

/**
 * Cek apakah baris pemisah header tabel (|---|---|:---:| dll)
 */
function isTableDivider(line) {
  if (!line) return false;
  const trimmed = line.trim();
  if (!trimmed.includes('-')) return false;
  let core = trimmed;
  if (core.startsWith('|')) core = core.slice(1);
  if (core.endsWith('|')) core = core.slice(0, -1);
  const parts = core.split('|').map((p) => p.trim());
  if (parts.length === 0) return false;
  return parts.every((p) => /^:?-{2,}:?$/.test(p));
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

                // Deteksi kolom tipe kos (Putri / Putra / Campur / Putra-putri)
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
                  } else if (lower.includes('putra') && lower.includes('putri')) {
                    badgeClass = 'is-putra-putri';
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
                        {cellText}
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
  const safeText = normalizeBrandCasing(text);
  const lines = safeText.replace(/\r\n/g, '\n').split('\n');
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

    // 1. Deteksi Tabel Markdown (| header | header | ...) tahan baris kosong antar-baris
    if (isPotentialTableRow(trimmed)) {
      let nextNonEmptyIdx = idx + 1;
      while (nextNonEmptyIdx < lines.length && !lines[nextNonEmptyIdx].trim()) {
        nextNonEmptyIdx++;
      }

      if (
        nextNonEmptyIdx < lines.length &&
        isTableDivider(lines[nextNonEmptyIdx])
      ) {
        flushList();

        const tableLines = [trimmed, lines[nextNonEmptyIdx].trim()];
        let cur = nextNonEmptyIdx + 1;

        while (cur < lines.length) {
          const l = lines[cur].trim();
          if (!l) {
            let lookAhead = cur + 1;
            while (lookAhead < lines.length && !lines[lookAhead].trim()) {
              lookAhead++;
            }
            if (lookAhead < lines.length && isPotentialTableRow(lines[lookAhead])) {
              cur = lookAhead;
              continue;
            } else {
              break;
            }
          }

          if (isPotentialTableRow(l)) {
            tableLines.push(l);
            cur++;
          } else {
            break;
          }
        }

        const headers = cleanTableCells(tableLines[0]);
        const dividerCells = cleanTableCells(tableLines[1]);
        const rows = tableLines.slice(2).map(cleanTableCells).filter((r) => r.length > 0 && r.some(Boolean));

        const alignments = dividerCells.map((d) => {
          const t = d.trim();
          const left = t.startsWith(':');
          const right = t.endsWith(':');
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

        idx = cur;
        continue;
      }
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
              {normalizeBrandCasing(
                message.statusLabel ||
                  (message.orbVariant === 'twins'
                    ? 'Menalar secara mendalam (Thinking High)...'
                    : 'Memproses respons...'),
              )}
            </span>
          </div>
        )}

        {/* Teks percakapan terstruktur progresif (Markdown table, bold, pills, callout) */}
        {message.content ? (
          isUser ? (
            <p className="chat-user-text">{normalizeBrandCasing(message.content)}</p>
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
  const rafScrollRef = useRef(0);
  const [showScrollButton, setShowScrollButton] = useState(false);

  useEffect(() => {
    return () => {
      if (rafScrollRef.current && typeof window !== 'undefined' && typeof window.cancelAnimationFrame === 'function') {
        window.cancelAnimationFrame(rafScrollRef.current);
      }
    };
  }, []);

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

  const requestScrollPin = useCallback(() => {
    if (!pinnedRef.current) return;
    if (rafScrollRef.current) return;
    if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
      rafScrollRef.current = window.requestAnimationFrame(() => {
        rafScrollRef.current = 0;
        const el = scrollContainerRef.current;
        if (el && pinnedRef.current) {
          el.scrollTop = el.scrollHeight;
        }
      });
    } else {
      const el = scrollContainerRef.current;
      if (el && pinnedRef.current) {
        el.scrollTop = el.scrollHeight;
      }
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

  // Saat pesan baru dari user masuk, otomatis scroll ke bawah; saat streaming delta, scroll dengan rAF pin anti tersendat
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
      requestScrollPin();
    }
  }, [messages.length, lastMsgContent, lastMsgStatus, isStreaming, scrollToBottom, requestScrollPin]);

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
          {/* Invisible anchor for native browser scroll anchoring */}
          <div className="chat-scroll-anchor" aria-hidden="true" />
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
