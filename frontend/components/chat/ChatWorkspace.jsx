import React, { useState, useRef, useEffect, useCallback } from 'react';
import ChatComposer from './ChatComposer.jsx';
import ChatMessageList from './ChatMessageList.jsx';
import RecommendationSidebar from './RecommendationSidebar.jsx';
import FullscreenVoiceOverlay from './FullscreenVoiceOverlay.jsx';
import { chatApi } from '../../services/chatApi.js';
import '../../styles/chat.css';

function makeId(prefix = 'msg') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function ChatWorkspace({
  user = null,
  onOpenMobileMenu,
  pendingPrompt = '',
  onConsumePendingPrompt,
  openVoiceSignal = 0,
  onOpenInSmartKos,
  onUiAction,
}) {
  const [messages, setMessages] = useState([]);
  const [composerText, setComposerText] = useState('');
  const [thinkingEnabled, setThinkingEnabled] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [previousResponseId, setPreviousResponseId] = useState(null);

  // Dynamic Recommendation Sidebar state (tertutup secara default, hanya buka saat valid)
  const [recommendations, setRecommendations] = useState([]);
  const [recommendationQuery, setRecommendationQuery] = useState(null);
  const [isRecSidebarOpen, setIsRecSidebarOpen] = useState(false);

  // Fullscreen Voice Conversation state
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);

  const abortControllerRef = useRef(null);
  const rafFlushRef = useRef(0);
  const bufferedDeltaRef = useRef('');
  const activeAssistantIdRef = useRef(null);
  const previewUrlsRef = useRef(new Set());

  // Bersihkan URL blob preview & stream aktif saat unmount
  useEffect(() => {
    const trackedUrls = previewUrlsRef.current;
    return () => {
      abortControllerRef.current?.abort();
      if (rafFlushRef.current) {
        cancelAnimationFrame(rafFlushRef.current);
      }
      for (const url of trackedUrls) {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // ignore
        }
      }
      trackedUrls.clear();
    };
  }, []);

  // Buka Fullscreen Voice jika dipicu dari CTA Dashboard (mis. Hero Explore Now)
  useEffect(() => {
    if (openVoiceSignal > 0) {
      setIsVoiceOpen(true);
    }
  }, [openVoiceSignal]);

  // Pastikan textarea input langsung terfokus saat masuk ke halaman Chat
  useEffect(() => {
    const focusComposer = () => {
      const inputEl = document.querySelector('[data-testid="chat-composer-input"]');
      if (inputEl) {
        inputEl.focus();
        try {
          const len = inputEl.value.length;
          inputEl.setSelectionRange?.(len, len);
        } catch {
          // ignore
        }
      }
    };
    focusComposer();
    const t = setTimeout(focusComposer, 60);
    return () => clearTimeout(t);
  }, []);

  // Isi composer jika ada prompt awal dari kartu lain (mis. Smart Kos Match)
  useEffect(() => {
    if (pendingPrompt && pendingPrompt.trim()) {
      setComposerText(pendingPrompt.trim());
      onConsumePendingPrompt?.();
    }
  }, [pendingPrompt, onConsumePendingPrompt]);

  const flushBufferedDelta = useCallback(() => {
    rafFlushRef.current = 0;
    const chunk = bufferedDeltaRef.current;
    const targetId = activeAssistantIdRef.current;
    if (!chunk || !targetId) return;
    bufferedDeltaRef.current = '';

    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === targetId
          ? {
              ...msg,
              content: (msg.content || '') + chunk,
            }
          : msg,
      ),
    );
  }, []);

  const scheduleDeltaAppend = useCallback(
    (delta) => {
      if (!delta) return;
      bufferedDeltaRef.current += delta;
      if (!rafFlushRef.current) {
        if (typeof requestAnimationFrame === 'function') {
          rafFlushRef.current = requestAnimationFrame(flushBufferedDelta);
        } else {
          flushBufferedDelta();
        }
      }
    },
    [flushBufferedDelta],
  );

  const handleApplyVerifiedRecommendations = useCallback((recPayload, assistantMsgId = null) => {
    if (
      !recPayload ||
      recPayload.hasValidRecommendations !== true ||
      !Array.isArray(recPayload.items) ||
      recPayload.items.length === 0
    ) {
      return;
    }

    setRecommendations(recPayload.items);
    setRecommendationQuery(recPayload.queryContext || null);
    setIsRecSidebarOpen(true);

    if (assistantMsgId) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? { ...m, recommendationCount: recPayload.items.length }
            : m,
        ),
      );
    }
  }, []);

  const handleSelectFiles = useCallback(async (files, category) => {
    const selected = Array.isArray(files) ? files.slice(0, 6) : [];
    if (selected.length === 0) return;

    const initialEntries = selected.map((file) => {
      const isImage =
        category === 'image' || String(file.type || '').toLowerCase().startsWith('image/');
      let previewUrl = null;
      if (isImage && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
        try {
          previewUrl = URL.createObjectURL(file);
          previewUrlsRef.current.add(previewUrl);
        } catch {
          previewUrl = null;
        }
      }
      return {
        localId: makeId('att'),
        file,
        filename: file.name || 'attachment',
        kind: isImage ? 'image' : 'file',
        previewUrl,
        status: 'uploading',
        uploaded: null,
        errorMessage: null,
      };
    });

    setAttachments((prev) => [...prev, ...initialEntries].slice(0, 6));

    await Promise.all(
      initialEntries.map(async (entry) => {
        try {
          const uploadedData = await chatApi.uploadAttachment(entry.file, { category });
          setAttachments((prev) =>
            prev.map((item) =>
              item.localId === entry.localId
                ? {
                    ...item,
                    kind: uploadedData.kind || item.kind,
                    filename: uploadedData.filename || item.filename,
                    status: 'ready',
                    uploaded: uploadedData,
                  }
                : item,
            ),
          );
        } catch (err) {
          setAttachments((prev) =>
            prev.map((item) =>
              item.localId === entry.localId
                ? {
                    ...item,
                    status: 'error',
                    errorMessage: err?.message || 'Gagal mengunggah file',
                  }
                : item,
            ),
          );
        }
      }),
    );
  }, []);

  const handleRemoveAttachment = useCallback((localId) => {
    setAttachments((prev) => prev.filter((item) => item.localId !== localId));
  }, []);

  const handleStopStreaming = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    if (rafFlushRef.current) {
      cancelAnimationFrame(rafFlushRef.current);
      flushBufferedDelta();
    }
    const targetId = activeAssistantIdRef.current;
    activeAssistantIdRef.current = null;
    setIsStreaming(false);

    if (targetId) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === targetId
            ? {
                ...m,
                status: 'cancelled',
                orbState: null,
                statusLabel: null,
              }
            : m,
        ),
      );
    }
  }, [flushBufferedDelta]);

  const sendTurn = useCallback(
    async ({ textToSend, readyAttachmentItems }) => {
      const trimmedText = (textToSend || '').trim();
      const validAttachments = Array.isArray(readyAttachmentItems) ? readyAttachmentItems : [];

      if (!trimmedText && validAttachments.length === 0) return;

      const userMsgId = makeId('usr');
      const assistantMsgId = makeId('ast');

      const userMessageAttachments = validAttachments.map((att) => ({
        id: att.uploaded?.id || att.localId,
        kind: att.uploaded?.kind || att.kind,
        filename: att.filename,
        previewUrl: att.previewUrl || null,
        dataUrl: att.uploaded?.dataUrl || null,
      }));

      const apiAttachments = validAttachments
        .map((att) => att.uploaded)
        .filter(Boolean);

      const initialOrbVariant = thinkingEnabled ? 'twins' : 'default';
      const initialStatusLabel = thinkingEnabled
        ? 'Menalar secara mendalam...'
        : 'Memproses permintaan...';

      setMessages((prev) => [
        ...prev,
        {
          id: userMsgId,
          role: 'user',
          modality: 'text',
          content: trimmedText,
          attachments: userMessageAttachments,
          status: 'completed',
        },
        {
          id: assistantMsgId,
          role: 'assistant',
          modality: 'text',
          content: '',
          citations: [],
          recommendationCount: 0,
          status: 'streaming',
          orbState: 'reasoning',
          orbVariant: initialOrbVariant,
          statusLabel: initialStatusLabel,
          retryPayload: {
            textToSend: trimmedText,
            apiAttachments,
          },
        },
      ]);

      activeAssistantIdRef.current = assistantMsgId;
      bufferedDeltaRef.current = '';
      setIsStreaming(true);

      const requestStartTime = performance.now();

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const userContext = user?.fullName
        ? { userName: user.fullName, city: 'Bandung' }
        : { city: 'Bandung' };

      try {
        await chatApi.streamChatResponse(
          {
            message: trimmedText,
            ...(apiAttachments.length > 0 ? { attachments: apiAttachments } : {}),
            ...(previousResponseId ? { previousResponseId } : {}),
            reasoningEffort: thinkingEnabled ? 'high' : 'low',
            userContext,
            userLocation: { country: 'ID', city: 'Bandung' },
          },
          {
            signal: controller.signal,
            onStatus: (statusData) => {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        orbState: statusData?.orbState || m.orbState,
                        orbVariant: statusData?.variant || 'default',
                        statusLabel: statusData?.label || m.statusLabel,
                      }
                    : m,
                ),
              );
            },
            onToolStart: (toolData) => {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        orbState: toolData?.orbState || 'working',
                        orbVariant: toolData?.variant || 'gyro',
                        statusLabel: toolData?.label || 'Menjalankan pencarian...',
                      }
                    : m,
                ),
              );
            },
            onRecommendations: (recData) => {
              handleApplyVerifiedRecommendations(recData, assistantMsgId);
            },
            onUiAction: (actionData) => {
              if (actionData) {
                onUiAction?.(actionData);
              }
            },
            onTextDelta: ({ delta }) => {
              scheduleDeltaAppend(delta);
            },
            onCitation: (citation) => {
              if (!citation?.url) return;
              setMessages((prev) =>
                prev.map((m) => {
                  if (m.id !== assistantMsgId) return m;
                  const existing = Array.isArray(m.citations) ? m.citations : [];
                  if (existing.some((c) => c.url === citation.url)) return m;
                  return {
                    ...m,
                    citations: [...existing, citation],
                  };
                }),
              );
            },
            onDone: (donePayload) => {
              if (rafFlushRef.current) {
                cancelAnimationFrame(rafFlushRef.current);
                flushBufferedDelta();
              }
              if (donePayload?.responseId) {
                setPreviousResponseId(donePayload.responseId);
              }
              if (donePayload?.recommendations?.hasValidRecommendations) {
                handleApplyVerifiedRecommendations(donePayload.recommendations, assistantMsgId);
              }
              setMessages((prev) =>
                prev.map((m) => {
                  if (m.id !== assistantMsgId) return m;
                  const finalContent = m.content || donePayload?.outputText || '';
                  const sources = Array.isArray(donePayload?.webSearch?.sources)
                    ? donePayload.webSearch.sources
                    : [];
                  const mergedCitations = [...(m.citations || [])];
                  for (const src of sources) {
                    if (src?.url && !mergedCitations.some((c) => c.url === src.url)) {
                      mergedCitations.push({ title: src.title || null, url: src.url });
                    }
                  }

                  const elapsedSeconds = Number(
                    Math.max(0.2, (performance.now() - requestStartTime) / 1000).toFixed(1),
                  );
                  const outputTokens =
                    donePayload?.metrics?.outputTokens ||
                    donePayload?.usage?.output_tokens ||
                    Math.max(1, Math.round(finalContent.length / 3.8));
                  const throughput =
                    donePayload?.metrics?.throughput ||
                    Number((outputTokens / elapsedSeconds).toFixed(1));

                  const metrics = {
                    elapsedSeconds,
                    outputTokens,
                    throughput,
                    isDeepThinking: thinkingEnabled,
                  };

                  return {
                    ...m,
                    content: finalContent,
                    citations: mergedCitations,
                    status: 'completed',
                    orbState: null,
                    statusLabel: null,
                    metrics,
                  };
                }),
              );
            },
          },
        );
      } catch (err) {
        if (controller.signal.aborted || err?.name === 'AbortError') {
          return;
        }
        if (rafFlushRef.current) {
          cancelAnimationFrame(rafFlushRef.current);
          flushBufferedDelta();
        }
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  status: 'failed',
                  orbState: null,
                  statusLabel: null,
                  error:
                    err?.message ||
                    'Tidak dapat terhubung ke layanan AI Teralio. Silakan periksa koneksi atau konfigurasi API.',
                }
              : m,
          ),
        );
      } finally {
        if (activeAssistantIdRef.current === assistantMsgId) {
          activeAssistantIdRef.current = null;
          setIsStreaming(false);
        }
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
      }
    },
    [
      thinkingEnabled,
      user,
      previousResponseId,
      scheduleDeltaAppend,
      flushBufferedDelta,
      handleApplyVerifiedRecommendations,
    ],
  );

  const handleComposerSubmit = useCallback(() => {
    const readyItems = attachments.filter((att) => att.status === 'ready');
    const text = composerText;
    if (!text.trim() && readyItems.length === 0) return;

    setComposerText('');
    setAttachments([]);
    sendTurn({ textToSend: text, readyAttachmentItems: readyItems });
  }, [attachments, composerText, sendTurn]);

  const handleRetryFailedMessage = useCallback(
    (failedMsg) => {
      if (isStreaming || !failedMsg?.retryPayload) return;
      const { textToSend, apiAttachments } = failedMsg.retryPayload;
      // Hapus turn gagal lalu kirim ulang
      setMessages((prev) => prev.filter((m) => m.id !== failedMsg.id));
      const syntheticReady = (apiAttachments || []).map((up) => ({
        localId: makeId('retry_att'),
        filename: up.filename || 'attachment',
        kind: up.kind || 'file',
        previewUrl: null,
        uploaded: up,
      }));
      sendTurn({ textToSend, readyAttachmentItems: syntheticReady });
    },
    [isStreaming, sendTurn],
  );

  const handleVoiceTurnCompleted = useCallback(({ role, content }) => {
    if (!content || !content.trim()) return;
    setMessages((prev) => [
      ...prev,
      {
        id: makeId('voice'),
        role: role === 'user' ? 'user' : 'assistant',
        modality: 'voice',
        content: content.trim(),
        status: 'completed',
      },
    ]);
  }, []);

  const handleVoiceRecommendations = useCallback(
    (recPayload) => {
      handleApplyVerifiedRecommendations(recPayload);
    },
    [handleApplyVerifiedRecommendations],
  );

  const isEmptyState = messages.length === 0;
  const hasSavedRecommendations = recommendations.length > 0;

  return (
    <section
      className={`teralio-chat-workspace ${isEmptyState ? 'is-empty' : 'is-active-thread'} ${
        isRecSidebarOpen && hasSavedRecommendations ? 'has-rec-sidebar' : ''
      }`}
      data-testid="teralio-chat-workspace"
    >
      {/* Ambient Radial Sky-Blue Glow (sesuai screenshot referensi) */}
      <div className="teralio-chat-ambient" aria-hidden="true" />

      {/* Minimal Mobile Menu Trigger & Reopen Recommendations Pill */}
      <div className="teralio-chat-floating-bar">
        {onOpenMobileMenu && (
          <button
            type="button"
            className="chat-mobile-menu-btn"
            onClick={onOpenMobileMenu}
            aria-label="Buka menu navigasi"
            data-testid="chat-mobile-menu-btn"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="4" y1="7" x2="20" y2="7" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="17" x2="20" y2="17" />
            </svg>
          </button>
        )}

        {hasSavedRecommendations && !isRecSidebarOpen && (
          <button
            type="button"
            className="chat-reopen-sidebar-chip"
            onClick={() => setIsRecSidebarOpen(true)}
            data-testid="reopen-recommendation-sidebar-chip"
          >
            <span>Rekomendasi Lokasi ({recommendations.length})</span>
          </button>
        )}
      </div>

      {/* Main Column: Empty Hero atau Active Conversation Stream + Composer */}
      <div className="teralio-chat-main">
        {isEmptyState ? (
          <div className="teralio-chat-empty-stage" data-testid="chat-empty-stage">
            <h1 className="teralio-chat-empty-title" data-testid="chat-empty-headline">
              Sebaiknya kita mulai dari mana?
            </h1>

            <div className="teralio-chat-composer-shell is-centered">
              <ChatComposer
                value={composerText}
                onChange={setComposerText}
                onSubmit={handleComposerSubmit}
                onStopStreaming={handleStopStreaming}
                onOpenVoice={() => setIsVoiceOpen(true)}
                thinkingEnabled={thinkingEnabled}
                onToggleThinking={setThinkingEnabled}
                attachments={attachments}
                onSelectFiles={handleSelectFiles}
                onRemoveAttachment={handleRemoveAttachment}
                isStreaming={isStreaming}
                autoFocus={true}
              />
            </div>
          </div>
        ) : (
          <div className="teralio-chat-thread-stage" data-testid="chat-thread-stage">
            <ChatMessageList
              messages={messages}
              isStreaming={isStreaming}
              onOpenRecommendations={
                hasSavedRecommendations ? () => setIsRecSidebarOpen(true) : undefined
              }
              onRetryMessage={handleRetryFailedMessage}
            />

            <div className="teralio-chat-composer-shell is-docked">
              <ChatComposer
                value={composerText}
                onChange={setComposerText}
                onSubmit={handleComposerSubmit}
                onStopStreaming={handleStopStreaming}
                onOpenVoice={() => setIsVoiceOpen(true)}
                thinkingEnabled={thinkingEnabled}
                onToggleThinking={setThinkingEnabled}
                attachments={attachments}
                onSelectFiles={handleSelectFiles}
                onRemoveAttachment={handleRemoveAttachment}
                isStreaming={isStreaming}
                autoFocus={true}
              />
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Right Sidebar for Verified Kos & Location Recommendations */}
      <RecommendationSidebar
        isOpen={isRecSidebarOpen && hasSavedRecommendations}
        items={recommendations}
        queryContext={recommendationQuery}
        onOpenInSmartKos={onOpenInSmartKos}
        onClose={() => setIsRecSidebarOpen(false)}
      />

      {/* Fullscreen Voice Conversation View */}
      <FullscreenVoiceOverlay
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        thinkingEnabled={thinkingEnabled}
        userContext={user?.fullName ? { userName: user.fullName, city: 'Bandung' } : { city: 'Bandung' }}
        onVoiceTurnCompleted={handleVoiceTurnCompleted}
        onVoiceRecommendations={handleVoiceRecommendations}
        onVoiceUiAction={(actionData) => {
          if (actionData?.type === 'open_schedule') {
            setIsVoiceOpen(false);
          }
          onUiAction?.(actionData);
        }}
      />
    </section>
  );
}

export default ChatWorkspace;
