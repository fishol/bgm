document.addEventListener('DOMContentLoaded', () => {
    // 获取核心 DOM 节点
    const audio = document.getElementById('audioPlayer');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const iconPlay = playPauseBtn.querySelector('.icon-play');
    const iconPause = playPauseBtn.querySelector('.icon-pause');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    const muteBtn = document.getElementById('muteBtn');
    const iconVolOn = muteBtn.querySelector('.icon-vol-on');
    const iconVolMute = muteBtn.querySelector('.icon-vol-mute');
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

    const BASE_URL = 'https://fishol.github.io/music-link/';
    let currentActiveRow = null;
    let lastVolume = 0.8;

    // 工具函数：秒转 MM:SS 格式
    const formatTime = seconds => {
        if (isNaN(seconds) || seconds < 0) return '00:00';
        const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
        const secs = String(Math.floor(seconds % 60)).padStart(2, '0');
        return `${mins}:${secs}`;
    };

    // 设置播放/暂停 UI 状态
    function setPlayState(isPlaying) {
        leftReel.classList.toggle('spinning', isPlaying);
        rightReel.classList.toggle('spinning', isPlaying);
        iconPlay.style.display = isPlaying ? 'none' : 'block';
        iconPause.style.display = isPlaying ? 'block' : 'none';
        playPauseBtn.classList.toggle('active', isPlaying);
        brandLogoText.classList.toggle('playing-glow', isPlaying);
    }

    audio.addEventListener('play', () => setPlayState(true));
    audio.addEventListener('pause', () => setPlayState(false));

    function setMuteState(isMuted) {
        audio.muted = isMuted;
        iconVolOn.style.display = isMuted ? 'none' : 'block';
        iconVolMute.style.display = isMuted ? 'block' : 'none';
    }

    // 更新列表行的数字序号
    function updateIndexes() {
        const rows = trackList.querySelectorAll('.track-row');
        rows.forEach((row, idx) => {
            const indexSpan = row.querySelector('.track-index');
            if (indexSpan) indexSpan.textContent = idx + 1;
        });
    }

    // 初始化 5 首曲目（前两首填入初始值，后三首空槽等待填入）
    const initialTracks = [
        'Canon.mp3',
        'The Ardent Sky.m4a',
        '',
        '',
        ''
    ];

    initialTracks.forEach(title => {
        const url = title ? BASE_URL + title : BASE_URL;
        createTrackRow(title, url, false);
    });

    bgmGenBtn.addEventListener('click', () => alert('生成背景音乐外链功能提示框'));

    // 点击 + 按钮添加一行（无限制添加）
    addFieldsBtn.addEventListener('click', () => {
        createTrackRow('', BASE_URL, true);
    });

    // 创建新行元素
    function createTrackRow(title = '', url = BASE_URL, animate = false) {
        const row = document.createElement('div');
        row.className = `track-row${animate ? ' fade-in' : ''}`;

        row.innerHTML = `
            <span class="track-index"></span>
            <input type="text" class="input-title" placeholder="Glory to Hong Kong.mp3" value="${title}">
            <input type="text" class="input-url" placeholder="音频直链 URL" value="${url || BASE_URL}">
            <button class="delete-row-btn" title="删除此栏">×</button>
        `;

        const titleInput = row.querySelector('.input-title');
        const urlInput = row.querySelector('.input-url');
        const deleteBtn = row.querySelector('.delete-row-btn');

        titleInput.addEventListener('input', () => {
            const val = titleInput.value.trim();
            urlInput.value = val ? (/^https?:\/\//i.test(val) ? val : BASE_URL + val) : BASE_URL;
            setActiveRow(row);
        });

        deleteBtn.addEventListener('click', () => {
            if (trackList.querySelectorAll('.track-row').length <= 1) {
                alert('播放列表只剩一首歌曲，无法删除！');
                return;
            }

            if (row === currentActiveRow) {
                audio.pause();
                audio.src = '';
                updateTapeLabel('无磁带');
                timeDisplay.textContent = '00:00 / 00:00';
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

    function updateTapeLabel(text) {
        tapeLabel.textContent = text;
        tapeLabel.classList.toggle('marquee', tapeLabel.scrollWidth > 140);
    }

    function setActiveRow(row) {
        if (currentActiveRow) currentActiveRow.classList.remove('active-track');
        currentActiveRow = row;
        if (currentActiveRow) currentActiveRow.classList.add('active-track');
    }

    function loadAndPlaySong(title, url) {
        updateTapeLabel(title);
        audio.src = url;
        audio.load();
        audio.play().catch(err => {
            console.error("播放失败:", err);
            updateTapeLabel('加载失败');
        });
    }

    // 播放 / 暂停 逻辑
    playPauseBtn.addEventListener('click', () => {
        if (audio.paused) {
            const targetRow = currentActiveRow || trackList.querySelector('.track-row');
            if (targetRow) {
                const title = targetRow.querySelector('.input-title').value.trim() || '未命名磁带';
                const url = targetRow.querySelector('.input-url').value.trim();
                
                if (audio.src !== url) {
                    setActiveRow(targetRow);
                    loadAndPlaySong(title, url);
                    return;
                }
            }

            if (!audio.src) {
                alert('请先输入有效的音频外链！');
                return;
            }

            audio.play().catch(console.error);
        } else {
            audio.pause();
        }
    });

    // 静音逻辑
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

    // 上一首 / 下一首
    const switchTrack = isNext => {
        const rows = Array.from(trackList.querySelectorAll('.track-row'));
        if (!rows.length) return;
        let index = rows.indexOf(currentActiveRow);
        index = isNext ? (index < rows.length - 1 ? index + 1 : 0) : (index > 0 ? index - 1 : rows.length - 1);
        
        const targetRow = rows[index];
        const title = targetRow.querySelector('.input-title').value.trim() || '未命名磁带';
        const url = targetRow.querySelector('.input-url').value.trim();
        if (url) {
            setActiveRow(targetRow);
            loadAndPlaySong(title, url);
        }
    };

    prevBtn.addEventListener('click', () => switchTrack(false));
    nextBtn.addEventListener('click', () => switchTrack(true));

    // 时间更新与进度条
    audio.addEventListener('timeupdate', () => {
        if (audio.duration) {
            progressBar.value = (audio.currentTime / audio.duration) * 100;
            timeDisplay.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
        }
    });

    audio.addEventListener('loadedmetadata', () => {
        if (audio.duration) {
            timeDisplay.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
        }
    });

    progressBar.addEventListener('input', e => {
        if (audio.duration) audio.currentTime = (e.target.value / 100) * audio.duration;
    });

    audio.addEventListener('ended', () => {
        nextBtn.click();
    });
});