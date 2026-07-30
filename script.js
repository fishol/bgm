document.addEventListener('DOMContentLoaded', () => {
    /* ==========================
       1. 获取页面中的核心 DOM 节点
       ========================== */
    const audio = document.getElementById('audioPlayer');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const muteBtn = document.getElementById('muteBtn');
    const volumeSlider = document.getElementById('volumeSlider');
    const progressBar = document.getElementById('progressBar');
    const timeDisplay = document.getElementById('timeDisplay');
    const leftReel = document.getElementById('leftReel');
    const rightReel = document.getElementById('rightReel');
    const tapeLabel = document.getElementById('tapeLabel');
    const bgmGenBtn = document.getElementById('bgmGenBtn');
    const brandLogoText = document.getElementById('brandLogoText');
    const trackList = document.getElementById('trackList');
    const addFieldsBtn = document.getElementById('addFieldsBtn');

    const iconPlay = playPauseBtn.querySelector('.icon-play');
    const iconPause = playPauseBtn.querySelector('.icon-pause');
    const iconVolOn = muteBtn.querySelector('.icon-vol-on');
    const iconVolMute = muteBtn.querySelector('.icon-vol-mute');

    const BASE_URL = 'https://fishol.github.io/music-link/';
    let currentActiveRow = null;
    let lastVolume = 0.8;

    const updateProgressVisual = value => {
        const percent = Math.max(0, Math.min(100, value));
        progressBar.style.setProperty('--progress', `${percent}%`);
        progressBar.value = percent;
    };

    /* ==========================
       2. 通用工具函数
       ========================== */
    const formatTime = seconds => {
        if (isNaN(seconds) || seconds < 0) return '00:00';
        const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
        const secs = String(Math.floor(seconds % 60)).padStart(2, '0');
        return `${mins}:${secs}`;
    };

    function setPlayState(isPlaying) {
        leftReel.classList.toggle('spinning', isPlaying);
        rightReel.classList.toggle('spinning', isPlaying);
        iconPlay.style.display = isPlaying ? 'none' : 'block';
        iconPause.style.display = isPlaying ? 'block' : 'none';
        playPauseBtn.classList.toggle('active', isPlaying);
        brandLogoText.classList.toggle('playing-glow', isPlaying);
    }

    function setMuteState(isMuted) {
        audio.muted = isMuted;
        iconVolOn.style.display = isMuted ? 'none' : 'block';
        iconVolMute.style.display = isMuted ? 'block' : 'none';
    }

    function updateIndexes() {
        const rows = trackList.querySelectorAll('.track-row');
        rows.forEach((row, idx) => {
            const indexSpan = row.querySelector('.track-index');
            if (indexSpan) indexSpan.textContent = idx + 1;
        });
    }

    function updateTapeLabel(text) {
        tapeLabel.textContent = text;
        tapeLabel.classList.toggle('marquee', tapeLabel.scrollWidth > 140);
    }

    function setActiveRow(row) {
        if (currentActiveRow) currentActiveRow.classList.remove('active-track');
        currentActiveRow = row;
        if (currentActiveRow) currentActiveRow.classList.add('active-track');
    }

    function resetPlaybackUI() {
        audio.pause();
        audio.src = '';
        updateTapeLabel('Nothing');
        timeDisplay.textContent = '00:00 / 00:00';
    }

    function syncTitleToUrl(titleInput, urlInput) {
        const val = titleInput.value.trim();
        urlInput.value = val ? (/^https?:\/\//i.test(val) ? val : BASE_URL + val) : BASE_URL;
    }

    function getTrackInfo(row) {
        // 统一读取当前行的标题和链接，减少重复查询 DOM 的代码。
        const titleInput = row.querySelector('.input-title');
        const urlInput = row.querySelector('.input-url');
        return {
            titleInput,
            urlInput,
            title: titleInput.value.trim(),
            url: urlInput.value.trim()
        };
    }

    function playTrackRow(targetRow) {
        // 选中行后直接加载并播放，避免重复编写相同的播放逻辑。
        const { title, url } = getTrackInfo(targetRow);
        if (!url) {
            alert('Please enter a valid external audio link first.');
            return false;
        }

        setActiveRow(targetRow);
        loadAndPlaySong(title, url);
        return true;
    }

    /* ==========================
       3. 初始化初始曲目列表
       ========================== */
    const initialTracks = ['Canon.mp3', 'The Ardent Sky.m4a', '', '', ''];

    initialTracks.forEach(title => {
        const url = title ? `${BASE_URL}${title}` : BASE_URL;
        createTrackRow(title, url, false);
    });

    /* ==========================
       4. 事件绑定与播放器行为
       ========================== */
    bgmGenBtn.addEventListener('click', () => alert('F I S H O L'));

    addFieldsBtn.addEventListener('click', () => {
        createTrackRow('', BASE_URL, true);
    });

    function createTrackRow(title = '', url = BASE_URL, animate = false) {
        const row = document.createElement('div');
        row.className = `track-row${animate ? ' fade-in' : ''}`;

        row.innerHTML = `
            <span class="track-index"></span>
            <input type="text" class="input-title" placeholder="Glory to Hong Kong.mp3" value="${title}">
            <input type="text" class="input-url" placeholder="Audio Direct Link URL" value="${url || BASE_URL}">
            <button class="delete-row-btn" title="Delete input field">×</button>
        `;

        const titleInput = row.querySelector('.input-title');
        const urlInput = row.querySelector('.input-url');
        const deleteBtn = row.querySelector('.delete-row-btn');

        titleInput.addEventListener('input', () => {
            syncTitleToUrl(titleInput, urlInput);
            setActiveRow(row);
        });

        deleteBtn.addEventListener('click', () => {
            const totalRows = trackList.querySelectorAll('.track-row').length;
            if (totalRows <= 1) {
                alert('The last song cannot be deleted.');
                return;
            }

            if (row === currentActiveRow) {
                resetPlaybackUI();
                currentActiveRow = null;
            }

            row.style.opacity = '0';
            setTimeout(() => {
                row.remove();
                updateIndexes();
            }, 150);
        });

        const handleSelectTrack = () => setActiveRow(row);
        titleInput.addEventListener('focus', handleSelectTrack);
        urlInput.addEventListener('focus', handleSelectTrack);

        trackList.appendChild(row);
        updateIndexes();

        if (animate) {
            trackList.scrollTop = trackList.scrollHeight;
        }
    }

    function loadAndPlaySong(title, url) {
        updateTapeLabel(title);
        audio.src = url;
        audio.load();
        audio.play().catch(err => {
            console.error('Playback failed:', err);
            updateTapeLabel('Loading failed');
        });
    }

    function playCurrentTrack() {
        // 优先使用当前激活行；若没有则使用第一行作为默认播放目标。
        const targetRow = currentActiveRow || trackList.querySelector('.track-row');
        if (!targetRow) return;

        const { url } = getTrackInfo(targetRow);
        if (!url) {
            alert('Please enter a valid external audio link first.');
            return;
        }

        if (audio.src !== url) {
            playTrackRow(targetRow);
            return;
        }

        audio.play().catch(console.error);
    }

    playPauseBtn.addEventListener('click', () => {
        if (audio.paused) {
            playCurrentTrack();
        } else {
            audio.pause();
        }
    });

    muteBtn.addEventListener('click', () => {
        const isMutedNow = !(audio.muted || audio.volume === 0);
        if (isMutedNow) {
            lastVolume = audio.volume > 0 ? audio.volume : 0.8;
            audio.volume = 0;
            volumeSlider.value = 0;
        } else {
            audio.volume = lastVolume;
            volumeSlider.value = lastVolume;
        }
        setMuteState(isMutedNow);
    });

    volumeSlider.addEventListener('input', e => {
        const val = parseFloat(e.target.value);
        audio.volume = val;
        if (val > 0) lastVolume = val;
        setMuteState(val === 0);
    });

    const switchTrack = isNext => {
        // 通过统一的播放入口实现上一首/下一首逻辑，减少重复分支。
        const rows = Array.from(trackList.querySelectorAll('.track-row'));
        if (!rows.length) return;

        let index = rows.indexOf(currentActiveRow);
        index = isNext
            ? (index < rows.length - 1 ? index + 1 : 0)
            : (index > 0 ? index - 1 : rows.length - 1);

        const targetRow = rows[index];
        playTrackRow(targetRow);
    };

    prevBtn.addEventListener('click', () => switchTrack(false));
    nextBtn.addEventListener('click', () => switchTrack(true));

    audio.addEventListener('play', () => setPlayState(true));
    audio.addEventListener('pause', () => setPlayState(false));

    updateProgressVisual(0);

    audio.addEventListener('timeupdate', () => {
        if (audio.duration) {
            updateProgressVisual((audio.currentTime / audio.duration) * 100);
            timeDisplay.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
        }
    });

    audio.addEventListener('loadedmetadata', () => {
        if (audio.duration) {
            timeDisplay.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
        }
    });

    progressBar.addEventListener('input', e => {
        const percent = parseFloat(e.target.value);
        updateProgressVisual(percent);
        if (audio.duration) audio.currentTime = (percent / 100) * audio.duration;
    });

    audio.addEventListener('ended', () => {
        nextBtn.click();
    });
});