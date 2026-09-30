/**
 * @name Audio Enhancer
 * @author Custom
 * @description Polished UI enhancer for Discord native audio with seamless loop styling, persistent background playback, and synced mini widget.
 * @version 1.3.0
 */

module.exports = class DiscordNativeAudioEnhancer {
    constructor() {
        this.bgAudio = new Audio();
        this.isLooping = false;
        this.currentSrc = "";
        this.miniWidget = null;

        this.bgAudio.addEventListener('ended', () => {
            if (this.isLooping) {
                this.bgAudio.currentTime = 0;
                this.bgAudio.play();
            }
        });

        this.bgAudio.addEventListener('timeupdate', () => this.updateSync());
    }

    start() {
        this.injectStyles();
        this.createMiniWidget();
        this.observer = new MutationObserver(() => this.enhanceAudioPlayers());
        this.observer.observe(document.body, { childList: true, subtree: true });
        this.enhanceAudioPlayers();
        BdApi.UI.showToast("Native Audio Enhancer UI Updated!", { type: "success" });
    }

    stop() {
        if (this.observer) this.observer.disconnect();
        if (this.bgAudio) {
            this.bgAudio.pause();
            this.bgAudio.src = "";
        }
        if (this.miniWidget) this.miniWidget.remove();
        document.querySelectorAll('.custom-audio-tools').forEach(el => el.remove());
        const style = document.getElementById("native-audio-enhancer-style");
        if (style) style.remove();
    }

    injectStyles() {
        const style = document.createElement("style");
        style.id = "native-audio-enhancer-style";
        style.innerHTML = `
            .custom-audio-tools {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                margin-left: 10px;
            }
            .custom-enhancer-btn {
                background: rgba(255, 255, 255, 0.07);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 50%;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                color: #b5bac1;
                transition: all 0.2s ease-in-out;
            }
            .custom-enhancer-btn:hover {
                background: rgba(255, 255, 255, 0.15);
                color: #ffffff;
                transform: scale(1.08);
            }
            .custom-enhancer-btn.active {
                background: rgba(87, 242, 135, 0.2);
                border-color: #57f287;
                color: #57f287;
                box-shadow: 0 0 10px rgba(87, 242, 135, 0.3);
            }
            .custom-enhancer-btn svg {
                width: 16px;
                height: 16px;
                fill: currentColor;
            }

            /* Mini Floating Widget Styling */
            #global-mini-audio-widget {
                position: fixed;
                bottom: 24px;
                right: 24px;
                background: #111214;
                border: 1px solid #232428;
                border-radius: 12px;
                padding: 10px 14px;
                display: none;
                align-items: center;
                gap: 12px;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
                z-index: 9999;
                color: #f2f3f5;
                font-family: var(--font-primary);
                backdrop-filter: blur(8px);
            }
            #global-mini-audio-widget.show { display: flex; }
            .g-title { font-size: 12px; font-weight: 600; color: #5865f2; display: flex; align-items: center; gap: 4px; }
            .g-time { font-size: 11px; color: #949ba4; font-family: monospace; }
            .g-slider {
                -webkit-appearance: none;
                width: 80px;
                height: 4px;
                border-radius: 2px;
                background: #35363c;
                outline: none;
                cursor: pointer;
            }
            .g-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                width: 10px;
                height: 10px;
                border-radius: 50%;
                background: #5865f2;
                cursor: pointer;
            }
        `;
        document.head.appendChild(style);
    }

    createMiniWidget() {
        this.miniWidget = document.createElement("div");
        this.miniWidget.id = "global-mini-audio-widget";
        this.miniWidget.innerHTML = `
            <span class="g-title">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
                Background Play
            </span>
            <span class="g-time" id="g-time-text">0:00 / 0:00</span>
            <button class="custom-enhancer-btn" id="g-play-btn" title="Play / Pause">
                <svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            </button>
            <button class="custom-enhancer-btn" id="g-loop-btn" title="Loop Toggle">
                <svg viewBox="0 0 24 24"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg>
            </button>
            <input type="range" class="g-slider" id="g-volume" min="0" max="1" step="0.01" value="1">
            <button class="custom-enhancer-btn" id="g-close-btn" style="color:#f23f43; border-color:rgba(242, 63, 67, 0.2);" title="Close">
                <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            </button>
        `;

        document.body.appendChild(this.miniWidget);

        const $ = (id) => this.miniWidget.querySelector(id);

        $('#g-play-btn').onclick = () => {
            if (this.bgAudio.paused) {
                this.bgAudio.play();
                $('#g-play-btn').innerHTML = `<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;
            } else {
                this.bgAudio.pause();
                $('#g-play-btn').innerHTML = `<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`;
            }
        };

        $('#g-loop-btn').onclick = () => {
            this.isLooping = !this.isLooping;
            $('#g-loop-btn').classList.toggle('active', this.isLooping);
        };

        $('#g-volume').oninput = (e) => {
            this.bgAudio.volume = parseFloat(e.target.value);
        };

        $('#g-close-btn').onclick = () => {
            this.bgAudio.pause();
            this.bgAudio.src = "";
            this.miniWidget.classList.remove('show');
        };
    }

    enhanceAudioPlayers() {
        const audioElements = document.querySelectorAll('audio');

        audioElements.forEach(audio => {
            const playerContainer = audio.closest('[class*="audioControls"]') || audio.parentElement;
            if (!playerContainer || playerContainer.querySelector('.custom-audio-tools')) return;

            const toolsContainer = document.createElement('div');
            toolsContainer.className = 'custom-audio-tools';

            // 1. زر التكرار المصمم (Loop Button)
            const loopBtn = document.createElement('button');
            loopBtn.className = 'custom-enhancer-btn';
            loopBtn.title = 'تكرار المقطع (Loop)';
            loopBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg>`;
            
            if (this.isLooping) loopBtn.classList.add('active');

            loopBtn.onclick = (e) => {
                e.stopPropagation();
                this.isLooping = !this.isLooping;
                loopBtn.classList.toggle('active', this.isLooping);
                const gLoop = this.miniWidget.querySelector('#g-loop-btn');
                if (gLoop) gLoop.classList.toggle('active', this.isLooping);
                BdApi.UI.showToast(this.isLooping ? "Loop Enabled" : "Loop Disabled", { type: "info" });
            };

            // 2. زر البث في الخلفية المصمم (Background Sync)
            const bgBtn = document.createElement('button');
            bgBtn.className = 'custom-enhancer-btn';
            bgBtn.title = 'تشغيل بالخلفية عند التنقل بين الشاتات';
            bgBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 0 0-9 9v7c0 1.1.9 2 2 2h3v-8H5v-1c0-3.87 3.13-7 7-7s7 3.13 7 7v1h-3v8h3c1.1 0 2-.9 2-2v-7a9 9 0 0 0-9-9z"/></svg>`;

            bgBtn.onclick = (e) => {
                e.stopPropagation();
                const streamUrl = audio.src || audio.querySelector('source')?.src;

                if (!streamUrl) return;

                audio.pause();

                if (this.currentSrc === streamUrl && !this.bgAudio.paused) {
                    this.bgAudio.pause();
                    this.miniWidget.classList.remove('show');
                } else {
                    this.currentSrc = streamUrl;
                    this.bgAudio.src = streamUrl;
                    this.bgAudio.currentTime = audio.currentTime || 0;
                    this.bgAudio.volume = audio.volume || 1;
                    this.bgAudio.play();

                    this.miniWidget.classList.add('show');
                    this.miniWidget.querySelector('#g-volume').value = this.bgAudio.volume;
                    BdApi.UI.showToast("شغال بالخلفية! يمكنك التنقل بحرية بين الشاتات", { type: "success" });
                }
            };

            audio.onvolumechange = () => {
                if (this.currentSrc === (audio.src || audio.querySelector('source')?.src)) {
                    this.bgAudio.volume = audio.volume;
                    this.miniWidget.querySelector('#g-volume').value = audio.volume;
                }
            };

            audio.onseeking = () => {
                if (this.currentSrc === (audio.src || audio.querySelector('source')?.src)) {
                    this.bgAudio.currentTime = audio.currentTime;
                }
            };

            toolsContainer.appendChild(loopBtn);
            toolsContainer.appendChild(bgBtn);
            playerContainer.appendChild(toolsContainer);
        });
    }

    updateSync() {
        if (!this.bgAudio.duration) return;

        const current = this.formatTime(this.bgAudio.currentTime);
        const total = this.formatTime(this.bgAudio.duration);
        const gTimeText = this.miniWidget.querySelector('#g-time-text');
        if (gTimeText) gTimeText.innerText = `${current} / ${total}`;

        const activeAudios = document.querySelectorAll('audio');
        activeAudios.forEach(audio => {
            const src = audio.src || audio.querySelector('source')?.src;
            if (src === this.currentSrc) {
                audio.currentTime = this.bgAudio.currentTime;
            }
        });
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
};