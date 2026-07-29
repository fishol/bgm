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

    // 状态函数 1: 绝对控制 播放/暂停 互斥显隐
    function setPlayState(isPlaying) {
        leftReel.classList.toggle('spinning', isPlaying);
        rightReel.classList.toggle('spinning', isPlaying);
        
        // 播放时只展示暂停图标，暂停时只展示播放图标
        iconPlay.style.display = isPlaying ? 'none' : 'block';
        iconPause.style.display = isPlaying ? 'block' : 'none';
        
        playPauseBtn.classList.toggle('active', isPlaying);
        brandLogoText.classList.toggle('playing-glow', isPlaying);
    }

    // 状态函数 2: 绝对控制 静音/正常音量 互斥显隐
    function setMuteState(isMuted) {
        audio.muted = isMuted;
        iconVolOn.style.display = isMuted ? 'none' : 'block';
        iconVolMute.style.display = isMuted ? 'block' : 'none';
    }

    // 初始化默认歌曲
    const defaultTrackName = 'Håll Om Mig - Nanne Grönvall.mp3';
    createTrackRow(defaultTrackName, BASE_URL + defaultTrackName);

    bgmGenBtn.addEventListener('click', () => alert('生成背景音乐外链功能提示框'));

    // 一次性添加 3 栏
    addFieldsBtn.addEventListener('click', () => {
        for (let i = 0; i < 3; i++) {
            setTimeout(() => createTrackRow('', BASE_URL, true), i * 60);
        }
    });

    // 创建行模板
    function createTrackRow(title = '', url = BASE_URL, animate = false) {
        const row = document.createElement('div');
        row.className = `track-row${animate ? ' fade-in' : ''}`;

        row.innerHTML = `
            <input type="text" class="input-title" placeholder="歌名 (例: 1945.m4a)" value="${title}">
            <input type="text" class="input-url" placeholder="音频直链 URL" value="${url || BASE_URL}">
            <button class="delete-row-btn" title="删除此栏">×</button>
        `;

        const titleInput = row.querySelector('.input-title');
        const urlInput = row.querySelector('.input-url');
        const deleteBtn = row.querySelector('.delete-row-btn');

        titleInput.addEventListener('input', () => {
            const val = titleInput.value.trim();
            urlInput.value = val ? (/^https?:\/\//i.test(val) ? val : BASE_URL + val) : BASE_URL;
        });

        deleteBtn.addEventListener('click', () => {
            if (row === currentActiveRow) {
                audio.pause();
                audio.src = '';
                setPlayState(false);
                updateTapeLabel('无磁带');
                timeDisplay.textContent = '00:00 / 00:00';
                currentActiveRow = null;
            }
            row.style.opacity = '0';
            row.style.transform = 'translateY(-10px)';
            setTimeout(() => row.remove(), 200);
        });

        const handleSelectTrack = () => {
            const currentTitle = titleInput.value.trim() || '未命名磁带';
            const currentUrl = urlInput.value.trim();

            if (currentActiveRow === row && audio.src === currentUrl && currentUrl !== '') return;

            if (currentUrl) {
                setActiveRow(row);
                loadAndPlaySong(currentTitle, currentUrl);
            }
        };

        titleInput.addEventListener('focus', handleSelectTrack);
        urlInput.addEventListener('change', handleSelectTrack);

        trackList.appendChild(row);
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
        audio.play().then(() => setPlayState(true)).catch(err => {
            console.error("播放失败:", err);
            updateTapeLabel('加载失败');
            setPlayState(false);
        });
    }

    // 播放 / 暂停 按钮事件触发
    playPauseBtn.addEventListener('click', () => {
        if (audio.paused) {
            if (!audio.src) {
                const firstRow = trackList.querySelector('.track-row');
                if (firstRow) {
                    const title = firstRow.querySelector('.input-title').value || '未命名磁带';
                    const url = firstRow.querySelector('.input-url').value;
                    if (url) {
                        setActiveRow(firstRow);
                        loadAndPlaySong(title, url);
                        return;
                    }
                }
                alert('请先输入有效的音频外链 URL！');
                return;
            }
            audio.play().then(() => setPlayState(true)).catch(console.error);
        } else {
            audio.pause();
            setPlayState(false);
        }
    });

    // 静音 / 恢复 按钮事件触发
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

    // 音量条拖拽监听
    volumeSlider.addEventListener('input', e => {
        const val = parseFloat(e.target.value);
        audio.volume = val;
        if (val > 0) lastVolume = val;
        setMuteState(val === 0);
    });

    // 切歌方法
    const switchTrack = isNext => {
        const rows = Array.from(trackList.querySelectorAll('.track-row'));
        if (!rows.length) return;
        let index = rows.indexOf(currentActiveRow);
        index = isNext ? (index < rows.length - 1 ? index + 1 : 0) : (index > 0 ? index - 1 : rows.length - 1);
        
        const targetRow = rows[index];
        const title = targetRow.querySelector('.input-title').value || '未命名磁带';
        const url = targetRow.querySelector('.input-url').value;
        if (url) {
            setActiveRow(targetRow);
            loadAndPlaySong(title, url);
        }
    };

    prevBtn.addEventListener('click', () => switchTrack(false));
    nextBtn.addEventListener('click', () => switchTrack(true));

    // 音频播放进度监听与自动连播
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
        setPlayState(false);
        nextBtn.click();
    });

    // 防止切标签页被暂停重置
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && !audio.paused) {
            setPlayState(true);
        }
    });
});