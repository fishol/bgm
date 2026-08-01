document.addEventListener('DOMContentLoaded', () => {
    const audio = document.getElementById('audioPlayer');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const muteBtn = document.getElementById('muteBtn');
    const volumeSlider = document.getElementById('volumeSlider');
    const progressBar = document.getElementById('progressBar');
    const timeDisplay = document.getElementById('timeDisplay');
    const progressSection = document.querySelector('.progress-section');
    const nowPlaying = document.getElementById('nowPlaying');
    const brandLogoText = document.getElementById('brandLogoText');
    const trackList = document.getElementById('trackList');
    const addFieldsBtn = document.getElementById('addFieldsBtn');

    const iconPlay = playPauseBtn.querySelector('.icon-play');
    const iconPause = playPauseBtn.querySelector('.icon-pause');
    const iconVolOn = muteBtn.querySelector('.icon-vol-on');
    const iconVolMute = muteBtn.querySelector('.icon-vol-mute');

    const BASE_URL = 'https://fishol.github.io/music-link/';
    let currentActiveRow = null;
    let lastVolume = 0.77;
    let draggedRow = null;

    audio.volume = lastVolume;
    if (volumeSlider) volumeSlider.value = lastVolume;

    const updateProgressVisual = value => {
        const percent = Math.max(0, Math.min(100, value));
        progressBar.style.setProperty('--progress', `${percent}%`);
        progressBar.value = percent;
    };

    const updateWaveform = () => {
        if (!progressSection || !audio.duration) return;
        const scale = 1 + 0.08 * Math.abs(Math.sin(audio.currentTime * 10));
        progressSection.style.setProperty('--wave-scale', scale.toFixed(3));
    };

    const formatTime = seconds => {
        if (isNaN(seconds) || seconds < 0) return '00:00';
        const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
        const secs = String(Math.floor(seconds % 60)).padStart(2, '0');
        return `${mins}:${secs}`;
    };

    function setPlayState(isPlaying) {
        if (progressSection) progressSection.classList.toggle('playing', isPlaying);
        iconPlay.style.display = isPlaying ? 'none' : 'block';
        iconPause.style.display = isPlaying ? 'block' : 'none';
        playPauseBtn.classList.toggle('active', isPlaying);
        brandLogoText.classList.toggle('playing-glow', isPlaying);
    }

    function clearPlaybackState() {
        setPlayState(false);
        updateNowPlaying('Nothing');
        timeDisplay.textContent = '00:00 / 00:00';
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

    function moveTrackRow(fromRow, toRow) {
        if (!fromRow || !toRow || fromRow === toRow) return;

        const rows = Array.from(trackList.querySelectorAll('.track-row'));
        const fromIndex = rows.indexOf(fromRow);
        const toIndex = rows.indexOf(toRow);

        if (fromIndex === -1 || toIndex === -1) return;

        if (fromIndex < toIndex) {
            trackList.insertBefore(fromRow, toRow.nextSibling);
        } else {
            trackList.insertBefore(fromRow, toRow);
        }

        updateIndexes();
    }

    function updateNowPlaying(text) {
        if (!nowPlaying) return;
        nowPlaying.textContent = text;
        nowPlaying.classList.toggle('marquee', nowPlaying.scrollWidth > nowPlaying.clientWidth);
    }

    function setActiveRow(row) {
        if (currentActiveRow) currentActiveRow.classList.remove('active-track');
        currentActiveRow = row;
        if (currentActiveRow) currentActiveRow.classList.add('active-track');
    }

    function resetPlaybackUI() {
        audio.pause();
        audio.src = '';
        clearPlaybackState();
    }

    function syncTitleToUrl(titleInput, urlInput) {
        const val = titleInput.value.trim();
        if (!val) {
            urlInput.value = '';
            return;
        }

        urlInput.value = /^https?:\/\//i.test(val) ? val : BASE_URL + val;
    }

    function getTrackInfo(row) {
        const titleInput = row.querySelector('.input-title');
        const urlInput = row.querySelector('.input-url');
        return {
            titleInput,
            urlInput,
            title: titleInput.value.trim(),
            url: urlInput.value.trim()
        };
    }

    function isPlayableRow(row) {
        const { url } = getTrackInfo(row);
        return Boolean(url);
    }

    function isEmptyRow(row) {
        const { title, url } = getTrackInfo(row);
        return !title && !url;
    }

    function removeEmptyRows() {
        const rows = Array.from(trackList.querySelectorAll('.track-row'));
        rows.forEach(row => {
            if (isEmptyRow(row)) {
                row.remove();
            }
        });
        updateIndexes();
    }

    function playTrackRow(targetRow) {
        const { title, url } = getTrackInfo(targetRow);
        if (!url) {
            setActiveRow(targetRow);
            audio.pause();
            updateNowPlaying('Nothing');
            return false;
        }

        setActiveRow(targetRow);
        loadAndPlaySong(title, url);
        return true;
    }

    const initialTracks = ['Canon.mp3', 'The Ardent Sky.m4a', '', '', ''];

    initialTracks.forEach(title => {
        if (title) {
            createTrackRow(title, `${BASE_URL}${title}`, false);
        } else {
            createTrackRow('', '', false);
        }
    });

    removeEmptyRows();

    addFieldsBtn.addEventListener('click', () => {
        createTrackRow('', '', true);
    });

    function createTrackRow(title = '', url = '', animate = false) {
        const row = document.createElement('div');
        row.className = `track-row${animate ? ' fade-in' : ''}`;
        row.draggable = true;

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

        const removeIfEmpty = () => {
            if (isEmptyRow(row)) {
                row.remove();
                updateIndexes();
            }
        };

        titleInput.addEventListener('blur', removeIfEmpty);
        urlInput.addEventListener('blur', removeIfEmpty);

        deleteBtn.addEventListener('click', () => {
            const totalRows = trackList.querySelectorAll('.track-row').length;
            if (totalRows <= 1) {
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

        row.addEventListener('dragstart', event => {
            draggedRow = row;
            row.classList.add('dragging');
            if (event.dataTransfer) {
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData('text/plain', 'move');
            }
        });

        row.addEventListener('dragover', event => {
            event.preventDefault();
            if (draggedRow && draggedRow !== row) {
                row.classList.add('drag-over');
            }
        });

        row.addEventListener('dragleave', () => {
            row.classList.remove('drag-over');
        });

        row.addEventListener('drop', event => {
            event.preventDefault();
            event.stopPropagation();
            row.classList.remove('drag-over');
            if (draggedRow && draggedRow !== row) {
                moveTrackRow(draggedRow, row);
            }
            draggedRow = null;
        });

        row.addEventListener('dragend', () => {
            draggedRow = null;
            row.classList.remove('dragging');
            row.classList.remove('drag-over');
        });

        trackList.appendChild(row);
        updateIndexes();

        if (animate) {
            trackList.scrollTop = trackList.scrollHeight;
        }
    }

    function loadAndPlaySong(title, url) {
        updateNowPlaying(title);
        audio.src = url;
        audio.load();
        audio.play().catch(err => {
            console.error('Playback failed:', err);
            clearPlaybackState();
            updateNowPlaying('Loading failed');
        });
    }

    function playCurrentTrack() {
        const targetRow = currentActiveRow || trackList.querySelector('.track-row');
        if (!targetRow || !isPlayableRow(targetRow)) return;

        const { url } = getTrackInfo(targetRow);
        if (!url) return;

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
        removeEmptyRows();
        const rows = Array.from(trackList.querySelectorAll('.track-row'));
        if (!rows.length) return;

        const playableRows = rows.filter(isPlayableRow);
        if (!playableRows.length) {
            audio.pause();
            clearPlaybackState();
            return;
        }

        const currentPlayableIndex = playableRows.indexOf(currentActiveRow);
        const startIndex = currentPlayableIndex >= 0 ? currentPlayableIndex : -1;

        let targetRow = null;
        if (startIndex >= 0) {
            const nextPlayableIndex = isNext
                ? (startIndex + 1) % playableRows.length
                : (startIndex - 1 + playableRows.length) % playableRows.length;
            targetRow = playableRows[nextPlayableIndex];
        } else {
            targetRow = playableRows[isNext ? 0 : playableRows.length - 1];
        }

        const { url, title } = getTrackInfo(targetRow);
        if (!url) return;

        const isSameTrack = audio.src === url && !audio.paused;
        setActiveRow(targetRow);

        if (isSameTrack) {
            audio.pause();
            updateNowPlaying(title || 'Nothing');
            return;
        }

        loadAndPlaySong(title, url);
    };

    prevBtn.addEventListener('click', () => switchTrack(false));
    nextBtn.addEventListener('click', () => switchTrack(true));

    updateProgressVisual(0);

    audio.addEventListener('timeupdate', () => {
        if (audio.duration) {
            updateProgressVisual((audio.currentTime / audio.duration) * 100);
            timeDisplay.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
            updateWaveform();
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

    audio.addEventListener('play', () => {
        setPlayState(true);
        updateWaveform();
    });

    audio.addEventListener('pause', () => {
        setPlayState(false);
        if (progressSection) progressSection.style.setProperty('--wave-scale', '1');
    });

    audio.addEventListener('ended', () => {
        nextBtn.click();
    });
});