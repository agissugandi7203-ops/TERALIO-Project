import { buildAuthHeaders } from './chatApi.js';

function computeRmsLevel(analyser, buffer) {
  if (!analyser || !buffer) return 0;
  try {
    analyser.getByteTimeDomainData(buffer);
    let sumSquares = 0;
    for (let i = 0; i < buffer.length; i += 1) {
      const centered = (buffer[i] - 128) / 128;
      sumSquares += centered * centered;
    }
    const rms = Math.sqrt(sumSquares / buffer.length);
    return Math.min(1, Math.max(0, rms * 3.4));
  } catch {
    return 0;
  }
}

function describeVoiceTool(toolName = '') {
  switch (toolName) {
    case 'maps_search_places':
    case 'maps_get_place_details':
      return 'Mencari lokasi & kontak di Google Maps...';
    case 'maps_compute_route':
      return 'Menghitung jarak & waktu tempuh...';
    case 'teralio_search_accommodations':
    case 'teralio_get_accommodation_details':
      return 'Mencari data kos di database Teralio...';
    case 'teralio_focus_map_location':
      return 'Mengarahkan kamera peta ke lokasi kos...';
    case 'teralio_get_current_datetime':
      return 'Memeriksa waktu & tanggal hari ini...';
    case 'teralio_list_visit_schedules':
      return 'Memeriksa kalender janji temu...';
    case 'teralio_create_visit_schedule':
      return 'Menjadwalkan survei & membuka Visit Schedule...';
    case 'teralio_update_visit_schedule':
      return 'Memperbarui jam janji temu di Visit Schedule...';
    case 'teralio_web_search':
      return 'Menelusuri informasi terkini di web...';
    default:
      return 'Menjalankan pencarian pendukung...';
  }
}

let activeGlobalVoiceClient = null;

export class RealtimeVoiceClient {
  constructor({
    onStateChange,
    onTranscript,
    onRecommendations,
    onUiAction,
    onAudioLevels,
    onError,
  } = {}) {
    this.onStateChange = onStateChange;
    this.onTranscript = onTranscript;
    this.onRecommendations = onRecommendations;
    this.onUiAction = onUiAction;
    this.onAudioLevels = onAudioLevels;
    this.onError = onError;

    this.pc = null;
    this.dc = null;
    this.localStream = null;
    this.remoteStream = null;
    this.audioEl = null;
    this.audioCtx = null;
    this.micAnalyser = null;
    this.aiAnalyser = null;
    this.rafId = 0;
    this.callId = null;
    this.isMuted = false;
    this.isConnected = false;
    this.isAiSpeaking = false;
    this.disposed = false;
    this.shouldAutoGreet = true;
    this.hasSentInitialGreeting = false;
    this.isGreetingPhase = false;
    this.greetingMuteTimeout = null;
  }

  emitState(statePatch) {
    if (this.disposed) return;
    this.onStateChange?.(statePatch);
  }

  triggerInitialGreetingIfNeeded() {
    if (this.disposed || !this.shouldAutoGreet || this.hasSentInitialGreeting) return;
    if (!this.dc || this.dc.readyState !== 'open') return;
    this.hasSentInitialGreeting = true;
    this.isGreetingPhase = true;

    // Redam sementara mikrofon lokal saat greeting awal agar speaker HP/laptop tidak memantul ke mic
    if (this.localStream) {
      for (const track of this.localStream.getAudioTracks()) {
        track.enabled = false;
      }
    }

    if (this.greetingMuteTimeout) {
      clearTimeout(this.greetingMuteTimeout);
    }
    this.greetingMuteTimeout = setTimeout(() => {
      this.finishGreetingPhase();
    }, 3500);

    this.sendClientEvent({
      type: 'response.create',
      response: {
        instructions:
          'Sapa pengguna secara singkat, ramah, dan natural dalam Bahasa Indonesia (cukup 1-2 kalimat pendek), lalu tanyakan apakah ingin dicarikan kos (misal sekitar UTB, Telkom, atau ITB) atau mengatur jadwal kunjungan survei.',
      },
    });
  }

  finishGreetingPhase() {
    if (this.greetingMuteTimeout) {
      clearTimeout(this.greetingMuteTimeout);
      this.greetingMuteTimeout = null;
    }
    this.isGreetingPhase = false;
    if (!this.disposed && this.localStream) {
      for (const track of this.localStream.getAudioTracks()) {
        track.enabled = !this.isMuted;
      }
    }
  }

  async connect({ userContext, reasoningEffort = 'low', voice, autoGreet = true } = {}) {
    // Pastikan tidak pernah ada 2 sesi suara atau browser TTS yang tumpang tindih!
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
    if (activeGlobalVoiceClient && activeGlobalVoiceClient !== this) {
      try {
        activeGlobalVoiceClient.cleanupResources();
      } catch {
        // ignore
      }
    }
    activeGlobalVoiceClient = this;

    this.disposed = false;
    this.shouldAutoGreet = autoGreet !== false;
    this.hasSentInitialGreeting = false;

    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      typeof navigator.mediaDevices.getUserMedia !== 'function'
    ) {
      const err = new Error('Browser ini belum mendukung akses mikrofon WebRTC.');
      err.code = 'WEBRTC_UNSUPPORTED';
      this.onError?.(err);
      throw err;
    }

    if (typeof RTCPeerConnection === 'undefined') {
      const err = new Error('Koneksi WebRTC tidak tersedia pada perangkat atau lingkungan ini.');
      err.code = 'WEBRTC_UNSUPPORTED';
      this.onError?.(err);
      throw err;
    }

    this.emitState({
      phase: 'connecting',
      orbState: 'waiting',
      variant: 'default',
      speed: 1,
      paused: false,
      label: 'Meminta izin mikrofon...',
    });

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });
      if (this.disposed) {
        this.cleanupResources();
        return;
      }
    } catch (micErr) {
      const denied =
        micErr?.name === 'NotAllowedError' || micErr?.name === 'PermissionDeniedError';
      const err = new Error(
        denied
          ? 'Izin mikrofon ditolak. Aktifkan akses mikrofon pada browser untuk memulai percakapan suara.'
          : 'Mikrofon tidak terdeteksi atau sedang digunakan aplikasi lain.',
      );
      err.code = denied ? 'MIC_PERMISSION_DENIED' : 'MIC_UNAVAILABLE';
      this.cleanupResources();
      this.onError?.(err);
      throw err;
    }

    this.emitState({
      phase: 'connecting',
      orbState: 'waiting',
      variant: 'default',
      speed: 1.05,
      paused: false,
      label: 'Menyiapkan sesi suara aman Teralio...',
    });

    try {
      // 1. Minta ephemeral client secret dari backend (tanpa mengekspos OPENAI_API_KEY)
      // Gunakan server_vad dengan threshold 0.78, silence_duration 1200ms & near_field agar tidak mudah terpotong bising sekitar atau pantulan speaker
      const tokenRes = await fetch('/api/realtime/client-secrets', {
        method: 'POST',
        headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          turnDetection: 'server_vad',
          vadThreshold: 0.78,
          vadSilenceDurationMs: 1200,
          vadPrefixPaddingMs: 300,
          noiseReduction: 'near_field',
          reasoningEffort: reasoningEffort === 'high' ? 'high' : 'low',
          enableTools: true,
          ...(voice ? { voice } : {}),
          ...(userContext ? { userContext } : {}),
        }),
      });
      if (this.disposed) {
        this.cleanupResources();
        return;
      }

      const tokenPayload = await tokenRes.json().catch(() => ({}));
      if (!tokenRes.ok || !tokenPayload?.success) {
        const err = new Error(
          tokenPayload?.message ||
            'Gagal menginisialisasi sesi suara Realtime. Pastikan OPENAI_API_KEY aktif di backend.',
        );
        err.status = tokenRes.status;
        err.code = tokenPayload?.code || 'REALTIME_INIT_FAILED';
        throw err;
      }

      const ephemeralKey = tokenPayload.data?.clientSecret?.value;
      const callsUrl =
        tokenPayload.data?.webrtc?.callsUrl || 'https://api.openai.com/v1/realtime/calls';
      const dcLabel = tokenPayload.data?.webrtc?.dataChannelLabel || 'oai-events';

      if (!ephemeralKey) {
        const err = new Error('Token ephemeral Realtime tidak ditemukan pada respons server.');
        err.code = 'INVALID_CLIENT_SECRET';
        throw err;
      }

      // 2. Bangun RTCPeerConnection, elemen audio output, & analyser audio dua arah
      const pc = new RTCPeerConnection();
      this.pc = pc;

      const audioEl = document.createElement('audio');
      audioEl.autoplay = true;
      audioEl.playsInline = true;
      this.audioEl = audioEl;

      this.setupAudioMetering(this.localStream, null);

      pc.ontrack = (event) => {
        if (this.disposed) return;
        const [remoteStream] = event.streams;
        if (remoteStream) {
          this.remoteStream = remoteStream;
          audioEl.srcObject = remoteStream;
          audioEl.play?.().catch(() => {});
          this.attachRemoteAnalyser(remoteStream);
        }
      };

      pc.onconnectionstatechange = () => {
        if (this.disposed) return;
        const st = pc.connectionState;
        if (st === 'disconnected') {
          this.emitState({
            phase: 'retrying',
            orbState: 'retrying',
            variant: 'surge',
            speed: 1.15,
            paused: false,
            label: 'Koneksi suara terganggu, mencoba menyambung ulang...',
          });
        } else if (st === 'failed') {
          const err = new Error('Koneksi WebRTC terputus. Silakan mulai ulang percakapan.');
          err.code = 'WEBRTC_CONNECTION_FAILED';
          this.onError?.(err);
          this.disconnect();
        }
      };

      for (const track of this.localStream.getAudioTracks()) {
        pc.addTrack(track, this.localStream);
      }

      const dc = pc.createDataChannel(dcLabel);
      this.dc = dc;
      this.bindDataChannel(dc);

      const offer = await pc.createOffer();
      if (this.disposed) {
        this.cleanupResources();
        return;
      }
      await pc.setLocalDescription(offer);
      if (this.disposed) {
        this.cleanupResources();
        return;
      }

      this.emitState({
        phase: 'connecting',
        orbState: 'waiting',
        variant: 'default',
        speed: 1.1,
        paused: false,
        label: 'Menghubungkan saluran suara full-duplex...',
      });

      // 3. Tukar SDP offer dengan OpenAI Realtime Calls endpoint
      const sdpRes = await fetch(callsUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${ephemeralKey}`,
          'Content-Type': 'application/sdp',
        },
        body: offer.sdp,
      });
      if (this.disposed) {
        this.cleanupResources();
        return;
      }

      if (!sdpRes.ok) {
        let errorDetail = '';
        try {
          const rawErr = await sdpRes.text();
          const parsed = JSON.parse(rawErr);
          errorDetail = parsed?.error?.message || '';
        } catch {
          // ignore parse error
        }

        let userMsg = `Pertukaran SDP Realtime gagal (HTTP ${sdpRes.status}).`;
        let code = 'SDP_EXCHANGE_FAILED';
        if (sdpRes.status === 429) {
          userMsg =
            'Batas kuota atau panggilan bersamaan OpenAI tercapai (HTTP 429 Rate Limit). Mohon tunggu sekitar 30 detik sebelum mencoba kembali, atau periksa saldo/kuota API key Anda di platform.openai.com.';
          code = 'RATE_LIMIT_EXCEEDED';
        } else if (errorDetail) {
          userMsg = `${userMsg} Detail: ${errorDetail}`;
        }

        const err = new Error(userMsg);
        err.status = sdpRes.status;
        err.code = code;
        throw err;
      }

      const answerSdp = await sdpRes.text();
      if (this.disposed) {
        this.cleanupResources();
        return;
      }
      const locationHeader = sdpRes.headers?.get?.('location') || '';
      if (locationHeader) {
        const segments = locationHeader.replace(/\/+$/, '').split('/');
        this.callId = segments[segments.length - 1] || null;
      }

      await pc.setRemoteDescription({
        type: 'answer',
        sdp: answerSdp,
      });
      if (this.disposed) {
        this.cleanupResources();
        return;
      }

      this.isConnected = true;
      this.emitState({
        phase: 'listening',
        orbState: 'idle',
        variant: 'blink',
        speed: 1.05,
        paused: false,
        label: 'Mendengarkan Anda...',
      });
    } catch (err) {
      this.cleanupResources();
      this.onError?.(err);
      throw err;
    }
  }

  setupAudioMetering(localStream, remoteStream) {
    if (typeof window === 'undefined') return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    try {
      const ctx = new AudioCtx();
      this.audioCtx = ctx;

      if (localStream) {
        const micSource = ctx.createMediaStreamSource(localStream);
        const micAnalyser = ctx.createAnalyser();
        micAnalyser.fftSize = 256;
        micSource.connect(micAnalyser);
        this.micAnalyser = micAnalyser;
      }

      if (remoteStream) {
        this.attachRemoteAnalyser(remoteStream);
      }

      const micBuf = new Uint8Array(128);
      const aiBuf = new Uint8Array(128);

      const sampleFrame = () => {
        if (this.disposed) return;
        const micLevel = this.isMuted ? 0 : computeRmsLevel(this.micAnalyser, micBuf);
        const aiLevel = computeRmsLevel(this.aiAnalyser, aiBuf);
        this.onAudioLevels?.({ micLevel, aiLevel });
        this.rafId = requestAnimationFrame(sampleFrame);
      };

      this.rafId = requestAnimationFrame(sampleFrame);
    } catch {
      // Metering bersifat progresif; jangan gagalkan panggilan suara jika AudioContext dibatasi
    }
  }

  attachRemoteAnalyser(remoteStream) {
    if (!this.audioCtx || !remoteStream) return;
    try {
      const aiSource = this.audioCtx.createMediaStreamSource(remoteStream);
      const aiAnalyser = this.audioCtx.createAnalyser();
      aiAnalyser.fftSize = 256;
      aiSource.connect(aiAnalyser);
      this.aiAnalyser = aiAnalyser;
    } catch {
      // ignore analyser attach errors
    }
  }

  bindDataChannel(dc) {
    dc.onopen = () => {
      if (this.disposed) return;
      this.emitState({
        phase: 'listening',
        orbState: 'idle',
        variant: 'blink',
        speed: 1.05,
        paused: false,
        label: 'Menyapa Anda...',
      });
      this.triggerInitialGreetingIfNeeded();
    };

    dc.onmessage = (msgEvent) => {
      if (this.disposed || typeof msgEvent.data !== 'string') return;
      let event = null;
      try {
        event = JSON.parse(msgEvent.data);
      } catch {
        return;
      }
      if (event && typeof event === 'object') {
        this.handleServerEvent(event);
      }
    };
  }

  sendClientEvent(eventObj) {
    if (this.dc && this.dc.readyState === 'open') {
      this.dc.send(JSON.stringify(eventObj));
      return true;
    }
    return false;
  }

  async handleServerEvent(event) {
    switch (event.type) {
      case 'session.created':
      case 'session.updated':
        this.triggerInitialGreetingIfNeeded();
        if (!this.isAiSpeaking) {
          this.emitState({
            phase: 'listening',
            orbState: 'idle',
            variant: 'blink',
            speed: 1.05,
            paused: false,
            label: this.isMuted ? 'Mikrofon dibisukan' : 'Mendengarkan Anda...',
          });
        }
        break;

      case 'input_audio_buffer.speech_started':
        if (this.isGreetingPhase) {
          // Abaikan deteksi suara selama fase awal sapaan agar AI tidak terinterupsi oleh pantulan speakernya sendiri
          break;
        }
        this.isAiSpeaking = false;
        this.emitState({
          phase: 'user_speaking',
          orbState: 'idle',
          variant: 'default',
          speed: 1.35,
          paused: false,
          label: 'Mendengarkan ucapan Anda...',
        });
        break;

      case 'input_audio_buffer.speech_stopped':
      case 'input_audio_buffer.committed':
        this.emitState({
          phase: 'processing_voice',
          orbState: 'reasoning',
          variant: 'default',
          speed: 1.15,
          paused: false,
          label: 'Memproses suara Anda...',
        });
        break;

      case 'conversation.item.input_audio_transcription.delta':
        if (event.delta) {
          this.onTranscript?.({
            role: 'user',
            itemId: event.item_id || 'user_live',
            delta: event.delta,
            final: false,
          });
        }
        break;

      case 'conversation.item.input_audio_transcription.completed':
        if (event.transcript && event.transcript.trim()) {
          this.onTranscript?.({
            role: 'user',
            itemId: event.item_id || `user_${Date.now()}`,
            text: event.transcript.trim(),
            final: true,
          });
        }
        break;

      case 'response.created':
        if (!this.isAiSpeaking) {
          this.emitState({
            phase: 'ai_thinking',
            orbState: 'reasoning',
            variant: 'twins',
            speed: 1.2,
            paused: false,
            label: 'Menyiapkan respons...',
          });
        }
        break;

      case 'response.mcp_call.in_progress':
        this.emitState({
          phase: 'tool_running',
          orbState: 'working',
          variant: 'gyro',
          speed: 1.25,
          paused: false,
          label: 'Menjalankan konektor MCP...',
        });
        break;

      case 'response.function_call_arguments.done': {
        const toolName = event.name || '';
        const isWeb = toolName === 'teralio_web_search';
        this.emitState({
          phase: 'tool_running',
          orbState: isWeb ? 'searching' : 'working',
          variant: isWeb ? 'lighthouse' : 'gyro',
          speed: 1.25,
          paused: false,
          label: describeVoiceTool(toolName),
        });
        await this.relayFunctionCall(event);
        break;
      }

      case 'output_audio_buffer.started':
        this.isAiSpeaking = true;
        this.emitState({
          phase: 'ai_speaking',
          orbState: 'working',
          variant: 'default',
          speed: 1.25,
          paused: false,
          label: 'Teralio sedang berbicara...',
        });
        break;

      case 'response.output_audio_transcript.delta':
      case 'response.audio_transcript.delta':
        if (!this.isAiSpeaking) {
          this.isAiSpeaking = true;
          this.emitState({
            phase: 'ai_speaking',
            orbState: 'working',
            variant: 'default',
            speed: 1.25,
            paused: false,
            label: 'Teralio sedang berbicara...',
          });
        }
        if (event.delta) {
          this.onTranscript?.({
            role: 'assistant',
            itemId: event.item_id || event.response_id || 'assistant_live',
            delta: event.delta,
            final: false,
          });
        }
        break;

      case 'response.output_audio_transcript.done':
      case 'response.audio_transcript.done':
        if (event.transcript && event.transcript.trim()) {
          this.onTranscript?.({
            role: 'assistant',
            itemId: event.item_id || event.response_id || `assistant_${Date.now()}`,
            text: event.transcript.trim(),
            final: true,
          });
        }
        break;

      case 'output_audio_buffer.stopped':
      case 'response.done':
        this.finishGreetingPhase();
        this.isAiSpeaking = false;
        this.emitState({
          phase: 'listening',
          orbState: 'idle',
          variant: 'blink',
          speed: 1.05,
          paused: false,
          label: this.isMuted ? 'Mikrofon dibisukan' : 'Mendengarkan Anda...',
        });
        break;

      case 'output_audio_buffer.cleared':
        this.finishGreetingPhase();
        this.isAiSpeaking = false;
        if (this.audioEl) {
          try {
            this.audioEl.pause?.();
            this.audioEl.currentTime = 0;
          } catch {
            // ignore
          }
        }
        this.emitState({
          phase: 'interrupted',
          orbState: 'idle',
          variant: 'blink',
          speed: 1,
          paused: false,
          label: 'Respons dihentikan — mendengarkan Anda...',
        });
        break;

      case 'error': {
        const msg = event.error?.message || 'Terjadi kendala pada sesi suara Realtime.';
        // Abaikan warning cancel ketika user sengaja melakukan interrupt
        if (/cancellation failed|no active response/i.test(msg)) {
          break;
        }
        const err = new Error(msg);
        err.code = event.error?.code || 'REALTIME_SERVER_ERROR';
        this.onError?.(err);
        break;
      }

      default:
        break;
    }
  }

  async relayFunctionCall(event) {
    const callId = event.call_id;
    const name = event.name;
    if (!callId || !name) return;

    try {
      const res = await fetch('/api/realtime/tool-call', {
        method: 'POST',
        headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          callId,
          name,
          arguments: event.arguments || '{}',
          autoCreateResponse: true,
        }),
      });

      const payload = await res.json().catch(() => ({}));
      if (res.ok && payload?.success && payload.data) {
        if (payload.data.recommendations?.hasValidRecommendations) {
          this.onRecommendations?.(payload.data.recommendations);
        }
        if (payload.data.uiAction) {
          this.onUiAction?.(payload.data.uiAction);
        }
        const clientEvents = Array.isArray(payload.data.clientEvents)
          ? payload.data.clientEvents
          : [];
        for (const clientEv of clientEvents) {
          this.sendClientEvent(clientEv);
        }
      } else {
        this.sendClientEvent({
          type: 'conversation.item.create',
          item: {
            type: 'function_call_output',
            call_id: callId,
            output: JSON.stringify({
              ok: false,
              error: payload?.message || 'Gagal menjalankan tool pencarian.',
            }),
          },
        });
        this.sendClientEvent({ type: 'response.create' });
      }
    } catch (err) {
      this.sendClientEvent({
        type: 'conversation.item.create',
        item: {
          type: 'function_call_output',
          call_id: callId,
          output: JSON.stringify({ ok: false, error: err.message }),
        },
      });
      this.sendClientEvent({ type: 'response.create' });
    }
  }

  setMuted(muted) {
    this.isMuted = Boolean(muted);
    if (this.localStream) {
      for (const track of this.localStream.getAudioTracks()) {
        track.enabled = !this.isMuted;
      }
    }
    if (this.isConnected && !this.isAiSpeaking) {
      this.emitState({
        phase: 'listening',
        orbState: 'idle',
        variant: 'blink',
        speed: this.isMuted ? 0.8 : 1.05,
        paused: false,
        label: this.isMuted ? 'Mikrofon dibisukan' : 'Mendengarkan Anda...',
      });
    }
  }

  interrupt() {
    this.sendClientEvent({ type: 'response.cancel' });
    this.sendClientEvent({ type: 'output_audio_buffer.clear' });
    this.isAiSpeaking = false;
    this.emitState({
      phase: 'interrupted',
      orbState: 'idle',
      variant: 'blink',
      speed: 1,
      paused: false,
      label: 'Respons dihentikan — silakan berbicara...',
    });
  }

  cleanupResources() {
    this.disposed = true;
    this.isConnected = false;
    this.isAiSpeaking = false;
    if (this.greetingMuteTimeout) {
      clearTimeout(this.greetingMuteTimeout);
      this.greetingMuteTimeout = null;
    }
    this.isGreetingPhase = false;
    if (activeGlobalVoiceClient === this) {
      activeGlobalVoiceClient = null;
    }

    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }

    if (this.dc) {
      try {
        this.dc.close();
      } catch {
        // ignore
      }
      this.dc = null;
    }

    if (this.pc) {
      try {
        this.pc.close();
      } catch {
        // ignore
      }
      this.pc = null;
    }

    if (this.localStream) {
      for (const track of this.localStream.getTracks()) {
        try {
          track.stop();
        } catch {
          // ignore
        }
      }
      this.localStream = null;
    }

    if (this.remoteStream) {
      for (const track of this.remoteStream.getTracks()) {
        try {
          track.stop();
        } catch {
          // ignore
        }
      }
      this.remoteStream = null;
    }

    if (this.audioEl) {
      try {
        this.audioEl.pause?.();
        this.audioEl.srcObject = null;
        if (
          typeof this.audioEl.load === 'function' &&
          typeof window !== 'undefined' &&
          !window.navigator?.userAgent?.includes('jsdom')
        ) {
          this.audioEl.load();
        }
      } catch {
        // ignore
      }
      this.audioEl = null;
    }

    if (this.audioCtx) {
      try {
        this.audioCtx.close();
      } catch {
        // ignore
      }
      this.audioCtx = null;
    }

    this.micAnalyser = null;
    this.aiAnalyser = null;
  }

  async disconnect() {
    const activeCallId = this.callId;
    this.callId = null;
    this.cleanupResources();

    if (activeCallId) {
      fetch(`/api/realtime/calls/${encodeURIComponent(activeCallId)}/hangup`, {
        method: 'POST',
        headers: buildAuthHeaders(),
      }).catch(() => {});
    }

    this.onStateChange?.({
      phase: 'idle',
      orbState: 'idle',
      variant: 'default',
      speed: 1,
      paused: true,
      label: 'Siap memulai percakapan suara',
    });
  }
}

export default RealtimeVoiceClient;
