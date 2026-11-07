import React, { useState, useRef, useEffect, useCallback } from 'react';

const MAX_TEXTAREA_HEIGHT = 180;

/**
 * Static 5-bar Wave icon (tanpa animasi sama sekali sesuai spesifikasi).
 */
const StaticWaveIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    className="composer-wave-svg"
  >
    <path
      d="M4.5 10v4M8.25 7v10M12 4.5v15M15.75 7.5v9M19.5 10v4"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
    />
  </svg>
);

const MinimalSendIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12 19V5M12 5l-6 6M12 5l6 6"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const StopSquareIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <rect x="2.5" y="2.5" width="11" height="11" rx="2.5" />
  </svg>
);

export function ChatComposer({
  value = '',
  onChange,
  onSubmit,
  onStopStreaming,
  onOpenVoice,
  thinkingEnabled = false,
  onToggleThinking,
  attachments = [],
  onSelectFiles,
  onRemoveAttachment,
  isStreaming = false,
  placeholder = 'Tanya Teralio...',
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const textareaRef = useRef(null);
  const menuWrapRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  const adjustTextareaHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    if (!el.value) {
      el.style.height = '24px';
      el.style.overflowY = 'hidden';
      return;
    }
    el.style.height = 'auto';
    const scrollHeight = el.scrollHeight || 24;
    const bounded = Math.min(scrollHeight, MAX_TEXTAREA_HEIGHT);
    el.style.height = `${bounded}px`;
    el.style.overflowY = scrollHeight > MAX_TEXTAREA_HEIGHT ? 'auto' : 'hidden';

    // Pastikan caret tetap terlihat saat mengetik di baris paling bawah
    if (document.activeElement === el && el.selectionStart === el.value.length) {
      el.scrollTop = el.scrollHeight;
    }
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [value, adjustTextareaHeight]);

  // Tutup menu attachment saat klik di luar atau tekan Escape
  useEffect(() => {
    if (!menuOpen) return undefined;

    const handlePointerDown = (e) => {
      if (menuWrapRef.current && !menuWrapRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  const hasAnyText = value.length > 0;
  const hasReadyAttachment = attachments.some((att) => att.status === 'ready');
  const hasUploadingAttachment = attachments.some((att) => att.status === 'uploading');
  const showSendButton = !isStreaming && (hasAnyText || hasReadyAttachment || hasUploadingAttachment);
  const canSubmit =
    !isStreaming &&
    !hasUploadingAttachment &&
    (value.trim().length > 0 || hasReadyAttachment);

  const handleFormSubmit = (e) => {
    if (e) e.preventDefault();
    if (!canSubmit) return;
    onSubmit?.();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent?.isComposing) {
      e.preventDefault();
      if (canSubmit) {
        onSubmit?.();
      }
    }
  };

  const handleTriggerUpload = (category) => {
    setMenuOpen(false);
    if (category === 'image') {
      imageInputRef.current?.click();
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleInputFiles = (e, category) => {
    const fileList = e.target.files ? Array.from(e.target.files) : [];
    e.target.value = '';
    if (fileList.length > 0) {
      onSelectFiles?.(fileList, category);
    }
  };

  return (
    <form
      className={`teralio-composer ${attachments.length > 0 ? 'has-attachments' : ''}`}
      onSubmit={handleFormSubmit}
      data-testid="chat-composer"
    >
      {/* Hidden native inputs for Upload File & Upload Image */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.txt,.md,.markdown,.csv,.tsv,.json,application/pdf,text/plain,text/markdown,text/csv,application/json"
        multiple
        className="composer-hidden-input"
        onChange={(e) => handleInputFiles(e, 'file')}
        data-testid="composer-file-input"
        tabIndex={-1}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        multiple
        className="composer-hidden-input"
        onChange={(e) => handleInputFiles(e, 'image')}
        data-testid="composer-image-input"
        tabIndex={-1}
      />

      {/* Attachment Preview Strip */}
      {attachments.length > 0 && (
        <div className="composer-attachments-strip" data-testid="composer-attachments-strip">
          {attachments.map((att) => (
            <div
              key={att.localId}
              className={`composer-attachment-chip status-${att.status}`}
              data-testid={`attachment-chip-${att.localId}`}
            >
              {att.previewUrl ? (
                <img
                  src={att.previewUrl}
                  alt={att.filename}
                  className="composer-attachment-chip__thumb"
                />
              ) : (
                <span className="composer-attachment-chip__icon" aria-hidden="true">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </span>
              )}

              <div className="composer-attachment-chip__meta">
                <span className="composer-attachment-chip__name" title={att.filename}>
                  {att.filename}
                </span>
                <span className="composer-attachment-chip__sub">
                  {att.status === 'uploading' && 'Mengunggah...'}
                  {att.status === 'ready' && (att.kind === 'image' ? 'Gambar siap' : 'Dokumen siap')}
                  {att.status === 'error' && (att.errorMessage || 'Gagal diunggah')}
                </span>
              </div>

              <button
                type="button"
                className="composer-attachment-chip__remove"
                onClick={() => onRemoveAttachment?.(att.localId)}
                aria-label={`Hapus lampiran ${att.filename}`}
                data-testid={`remove-attachment-${att.localId}`}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Composer Row: Left (+ Menu) | Center (Multiline Input) | Right (Thinking Toggle + Action Button) */}
      <div className="composer-main-row">
        {/* Left: Plus (+) Button & Attachment Popover */}
        <div className="composer-left" ref={menuWrapRef}>
          <button
            type="button"
            className={`composer-plus-btn ${menuOpen ? 'is-open' : ''}`}
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Tambah lampiran"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            data-testid="composer-plus-btn"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>

          {menuOpen && (
            <div
              className="composer-attach-menu"
              role="menu"
              aria-label="Menu lampiran"
              data-testid="composer-attachment-menu"
            >
              <button
                type="button"
                role="menuitem"
                className="composer-attach-menu__item"
                onClick={() => handleTriggerUpload('file')}
                data-testid="composer-upload-file-btn"
              >
                <span className="composer-attach-menu__icon" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </span>
                <span>Upload File</span>
              </button>

              <button
                type="button"
                role="menuitem"
                className="composer-attach-menu__item"
                onClick={() => handleTriggerUpload('image')}
                data-testid="composer-upload-image-btn"
              >
                <span className="composer-attach-menu__icon" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2.5" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </span>
                <span>Upload Image</span>
              </button>
            </div>
          )}
        </div>

        {/* Center: Auto-growing Multiline Textarea */}
        <div className="composer-center">
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            aria-label="Tulis pesan untuk Teralio"
            className="composer-textarea"
            data-testid="chat-composer-input"
          />
        </div>

        {/* Right: Thinking On/Off ONLY + Dynamic Wave / Send / Stop Button */}
        <div className="composer-right">
          <button
            type="button"
            className={`composer-thinking-btn ${thinkingEnabled ? 'is-on' : 'is-off'}`}
            onClick={() => onToggleThinking?.(!thinkingEnabled)}
            aria-pressed={thinkingEnabled}
            title={thinkingEnabled ? 'Thinking aktif (penalaran mendalam)' : 'Aktifkan Thinking'}
            data-testid="composer-thinking-toggle"
          >
            <span className="composer-thinking-btn__dot" aria-hidden="true" />
            <span className="composer-thinking-btn__text">
              Thinking {thinkingEnabled ? 'On' : 'Off'}
            </span>
          </button>

          {isStreaming ? (
            <button
              type="button"
              className="composer-action-btn is-stop"
              onClick={onStopStreaming}
              aria-label="Hentikan respons AI"
              title="Hentikan respons"
              data-testid="composer-stop-btn"
            >
              <StopSquareIcon />
            </button>
          ) : showSendButton ? (
            <button
              type="submit"
              className="composer-action-btn is-send"
              disabled={!canSubmit}
              aria-label="Kirim pesan"
              title="Kirim pesan"
              data-testid="composer-send-btn"
            >
              <MinimalSendIcon />
            </button>
          ) : (
            <button
              type="button"
              className="composer-action-btn is-wave"
              onClick={onOpenVoice}
              aria-label="Mulai percakapan suara (Voice Conversation)"
              title="Mulai percakapan suara"
              data-testid="composer-wave-btn"
            >
              <StaticWaveIcon />
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

export default ChatComposer;
