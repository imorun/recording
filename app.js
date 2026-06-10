const imageInput = document.getElementById("images");
const audioInput = document.getElementById("audio");
const lyricsInput = document.getElementById("lyrics");

const imagePreview = document.getElementById("imagePreview");
const audioPreview = document.getElementById("audioPreview");
const previewCanvas = document.getElementById("previewCanvas");
const lyricsPreview = document.getElementById("lyricsPreview");

const bgmVolumeSlider = document.getElementById("bgmVolume");
const bgmVolumeText = document.getElementById("bgmVolumeText");
const voiceVolumeSlider = document.getElementById("voiceVolume");
const voiceVolumeText = document.getElementById("voiceVolumeText");

const resolutionSelect = document.getElementById("resolution");
const formatSelect = document.getElementById("format");
const durationInput = document.getElementById("duration");
const fadeInput = document.getElementById("fade");
const statusText = document.getElementById("status");

const lyricsColorInput = document.getElementById("lyricsColor");
const lyricsSizeInput = document.getElementById("lyricsSize");
const lyricsPosSelect = document.getElementById("lyricsPos");
const lyricsFontSelect = document.getElementById("lyricsFont");
const lyricsBgCheck = document.getElementById("lyricsBg");

const transitionTypeSelect = document.getElementById("transitionType");
const zoomEnabledCheck = document.getElementById("zoomEnabled");

const startSpeechBtn = document.getElementById("startSpeechBtn");
const stopSpeechBtn = document.getElementById("stopSpeechBtn");
const speechStatus = document.getElementById("speechStatus");
const recordTimer = document.getElementById("recordTimer");

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let isRecognizing = false;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = 'ja-JP';
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                const text = event.results[i][0].transcript.trim();
                if (text) {
                    transcript += text + "\n";
                }
            }
        }
        if (transcript) {
            lyricsInput.value += transcript;
            saveSettings();
            slideshowStartTime = performance.now();
        }
    };

    recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === 'not-allowed') {
            alert("マイクの使用許可が得られませんでした。");
            stopSpeechRecognition();
        }
    };

    recognition.onend = () => {
        if (isRecognizing) {
            try {
                recognition.start();
            } catch(e) {}
        }
    };
}

function startSpeechRecognition() {
    if (!recognition) {
        alert("お使いのブラウザは音声認識に対応していません。Google ChromeまたはMicrosoft Edgeを使用してください。");
        return;
    }
    if (isRecognizing) return;
    
    isRecognizing = true;
    try {
        recognition.start();
    } catch(e) {}
    
    if (startSpeechBtn) startSpeechBtn.style.display = "none";
    if (stopSpeechBtn) stopSpeechBtn.style.display = "inline-block";
    if (speechStatus) {
        speechStatus.style.display = "block";
        speechStatus.textContent = "🎙️ 音声認識中... マイクに向かって話してください";
    }
}

function stopSpeechRecognition() {
    if (!recognition || !isRecognizing) return;
    
    isRecognizing = false;
    try {
        recognition.stop();
    } catch(e) {}
    
    if (startSpeechBtn) startSpeechBtn.style.display = "inline-block";
    if (stopSpeechBtn) stopSpeechBtn.style.display = "none";
    if (speechStatus) speechStatus.style.display = "none";
}

if (startSpeechBtn) {
    startSpeechBtn.addEventListener("click", startSpeechRecognition);
}
if (stopSpeechBtn) {
    stopSpeechBtn.addEventListener("click", stopSpeechRecognition);
}

const ctx = previewCanvas.getContext("2d");

let imageFiles = [];
let imageUrls = [];
let preloadedImages = [];
let currentImage = 0;

let waveSurfer = null;

let audioCtx = null;
let bgmSourceNode = null;
let voiceSourceNode = null;
let bgmGainNode = null;
let voiceGainNode = null;
let audioDestNode = null;

let slideshowStartTime = 0;
let previewLoopRunning = false;

function saveSettings(){
    localStorage.setItem(
        "movieCreatorSettings",
        JSON.stringify({
            resolution: resolutionSelect.value,
            format: formatSelect.value,
            duration: durationInput.value,
            fade: fadeInput.value,
            lyrics: lyricsInput.value,
            bgmVolume: bgmVolumeSlider.value,
            voiceVolume: voiceVolumeSlider.value,
            lyricsColor: lyricsColorInput.value,
            lyricsSize: lyricsSizeInput.value,
            lyricsPos: lyricsPosSelect.value,
            lyricsFont: lyricsFontSelect.value,
            lyricsBg: lyricsBgCheck.checked,
            transitionType: transitionTypeSelect.value,
            zoomEnabled: zoomEnabledCheck.checked
        })
    );
}

function loadSettings(){
    const raw = localStorage.getItem("movieCreatorSettings");
    if(!raw) return;
    try{
        const s = JSON.parse(raw);
        if(s.resolution) resolutionSelect.value = s.resolution;
        if(s.format) formatSelect.value = s.format;
        if(s.duration) durationInput.value = s.duration;
        if(s.fade) fadeInput.value = s.fade;
        if(s.lyrics) lyricsInput.value = s.lyrics;
        
        if(s.bgmVolume) {
            bgmVolumeSlider.value = s.bgmVolume;
            bgmVolumeText.textContent = s.bgmVolume + "%";
        }
        if(s.voiceVolume) {
            voiceVolumeSlider.value = s.voiceVolume;
            voiceVolumeText.textContent = s.voiceVolume + "%";
        }
        if(s.lyricsColor) lyricsColorInput.value = s.lyricsColor;
        if(s.lyricsSize) lyricsSizeInput.value = s.lyricsSize;
        if(s.lyricsPos) lyricsPosSelect.value = s.lyricsPos;
        if(s.lyricsFont) lyricsFontSelect.value = s.lyricsFont;
        if(s.lyricsBg !== undefined) lyricsBgCheck.checked = s.lyricsBg;
        if(s.transitionType) transitionTypeSelect.value = s.transitionType;
        if(s.zoomEnabled !== undefined) zoomEnabledCheck.checked = s.zoomEnabled;
    }catch(e){}
}

loadSettings();

[
resolutionSelect,
formatSelect,
durationInput,
fadeInput,
lyricsInput,
lyricsColorInput,
lyricsSizeInput,
lyricsPosSelect,
lyricsFontSelect,
lyricsBgCheck,
transitionTypeSelect,
zoomEnabledCheck
].forEach(el => {
    el.addEventListener("change", saveSettings);
});

bgmVolumeSlider.addEventListener("input", () => {
    bgmVolumeText.textContent = bgmVolumeSlider.value + "%";
    if (bgmGainNode) {
        bgmGainNode.gain.value = bgmVolumeSlider.value / 100;
    }
    saveSettings();
});

voiceVolumeSlider.addEventListener("input", () => {
    voiceVolumeText.textContent = voiceVolumeSlider.value + "%";
    if (voiceGainNode) {
        voiceGainNode.gain.value = voiceVolumeSlider.value / 100;
    }
    saveSettings();
});

imageInput.addEventListener("change", loadImages);

function loadImages(){
    imageFiles = [...imageInput.files];
    imagePreview.innerHTML = "";
    imageUrls = [];
    preloadedImages = [];

    imageFiles.forEach(file => {
        const url = URL.createObjectURL(file);
        imageUrls.push(url);

        const img = new Image();
        img.src = url;
        preloadedImages.push(img);
    });

    rebuildImagePreview();
    startSlideshowLoop();
}

audioInput.addEventListener("change", loadAudio);

function loadAudio(){
    const file = audioInput.files[0];
    if(!file) return;

    const url = URL.createObjectURL(file);
    audioPreview.src = url;

    if(waveSurfer){
        waveSurfer.destroy();
    }

    waveSurfer = WaveSurfer.create({
        container: "#waveform",
        waveColor: "#3b82f6",
        progressColor: "#10b981",
        height: 80,
        responsive: true
    });

    waveSurfer.load(url);
}

// Canvas Rendering Helper
function renderCanvas(t) {
    const width = previewCanvas.width;
    const height = previewCanvas.height;
    ctx.clearRect(0, 0, width, height);

    const duration = Number(durationInput.value) || 3;
    const fade = Number(fadeInput.value) || 1;
    const transitionType = transitionTypeSelect.value;
    const zoomEnabled = zoomEnabledCheck.checked;
    
    const totalImages = preloadedImages.length;
    
    if (totalImages > 0) {
        const index = Math.floor(t / duration) % totalImages;
        const localTime = t % duration;
        
        function drawImageCentered(img, scale, alpha, xOffset = 0) {
            ctx.globalAlpha = alpha;
            const w = width * scale;
            const h = height * scale;
            const x = (width - w) / 2 + xOffset;
            const y = (height - h) / 2;
            ctx.drawImage(img, x, y, w, h);
        }

        const currentImg = preloadedImages[index];
        
        if (currentImg && currentImg.complete) {
            let currScale = 1.0;
            if (zoomEnabled) {
                currScale = 1.0 + (localTime / duration) * 0.08;
            }

            const hasPrev = totalImages > 1;
            const isTransitioning = hasPrev && localTime < fade && fade > 0;
            
            if (isTransitioning) {
                const prevIndex = (index - 1 + totalImages) % totalImages;
                const prevImg = preloadedImages[prevIndex];
                
                if (prevImg && prevImg.complete) {
                    let prevScale = 1.0;
                    if (zoomEnabled) {
                        prevScale = 1.0 + ((localTime + duration - fade) / duration) * 0.08;
                    }
                    
                    const progress = localTime / fade; // 0 to 1

                    if (transitionType === "fade") {
                        drawImageCentered(prevImg, prevScale, 1.0);
                        drawImageCentered(currentImg, currScale, progress);
                    } else if (transitionType === "slide") {
                        const offset = progress * width;
                        drawImageCentered(prevImg, prevScale, 1.0, -offset);
                        drawImageCentered(currentImg, currScale, 1.0, width - offset);
                    } else {
                        drawImageCentered(currentImg, currScale, 1.0);
                    }
                } else {
                    drawImageCentered(currentImg, currScale, 1.0);
                }
            } else {
                drawImageCentered(currentImg, currScale, 1.0);
            }
        }
    }
    
    // Draw lyrics/subtitles
    const lines = lyricsInput.value.split("\n").map(l => l.trim());
    const lyricsIndex = Math.floor(t / 5);
    const currentLine = lines[lyricsIndex] || "";

    if (currentLine) {
        ctx.globalAlpha = 1.0;
        
        const size = Number(lyricsSizeInput.value) || 48;
        const color = lyricsColorInput.value || "#ffffff";
        const font = lyricsFontSelect.value || "sans-serif";
        const pos = lyricsPosSelect.value || "bottom";
        const showBg = lyricsBgCheck.checked;
        
        ctx.font = `bold ${size}px ${font}`;
        ctx.textAlign = "center";
        
        let y = height - (height * 0.1); // default bottom
        if (pos === "center") {
            y = height / 2;
            ctx.textBaseline = "middle";
        } else if (pos === "top") {
            y = height * 0.15;
            ctx.textBaseline = "top";
        } else {
            ctx.textBaseline = "bottom";
        }
        
        const x = width / 2;
        
        if (showBg) {
            const metrics = ctx.measureText(currentLine);
            const textWidth = metrics.width;
            const paddingX = size * 0.5;
            const paddingY = size * 0.25;
            
            ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
            
            let bgY = y - size;
            if (pos === "center") bgY = y - size/2 - paddingY;
            else if (pos === "top") bgY = y - paddingY;
            else bgY = y - size - paddingY * 2;
            
            ctx.fillRect(
                x - textWidth / 2 - paddingX,
                bgY,
                textWidth + paddingX * 2,
                size + paddingY * 2
            );
        }

        ctx.strokeStyle = "black";
        ctx.lineWidth = Math.max(3, size * 0.1);
        ctx.strokeText(currentLine, x, y);

        ctx.fillStyle = color;
        ctx.fillText(currentLine, x, y);
    }
}

function startSlideshowLoop() {
    if (previewLoopRunning) return;
    previewLoopRunning = true;
    slideshowStartTime = performance.now();
    
    function loop() {
        if (!previewLoopRunning) return;
        
        if (generateBtn.disabled) {
            requestAnimationFrame(loop);
            return;
        }

        previewCanvas.width = 1280;
        previewCanvas.height = 720;
        
        let t = 0;
        const totalDuration = imageUrls.length * (Number(durationInput.value) || 3);
        
        const isBgmPlaying = !audioPreview.paused;
        const isVoicePlaying = !recordPreview.paused;
        
        if (isBgmPlaying || isVoicePlaying) {
            const bgmTime = audioPreview.currentTime;
            const voiceTime = recordPreview.currentTime;
            t = Math.max(bgmTime, voiceTime);
        } else {
            t = ((performance.now() - slideshowStartTime) / 1000);
            if (totalDuration > 0) {
                t = t % totalDuration;
            }
        }
        
        renderCanvas(t);
        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
}

// Drag & Drop specific to ImageDropZone
const imageDropZone = document.getElementById("imageDropZone");
if (imageDropZone) {
    imageDropZone.addEventListener("dragover", e => {
        e.preventDefault();
        imageDropZone.classList.add("dragover");
    });

    imageDropZone.addEventListener("dragleave", () => {
        imageDropZone.classList.remove("dragover");
    });

    imageDropZone.addEventListener("drop", e => {
        e.preventDefault();
        imageDropZone.classList.remove("dragover");

        const files = [...e.dataTransfer.files];
        const images = files.filter(f => f.type.startsWith("image/") || f.name.toLowerCase().endsWith(".gif"));

        if (images.length) {
            const dt = new DataTransfer();
            imageFiles = [...imageFiles, ...images];
            imageFiles.forEach(file => dt.items.add(file));
            
            imageInput.files = dt.files;
            loadImages();
        }
    });
}

// Global Drag & Drop on document body (for audio drop)
document.addEventListener("dragover", e => {
    e.preventDefault();
    document.body.classList.add("dragover");
});

document.addEventListener("dragleave", () => {
    document.body.classList.remove("dragover");
});

document.addEventListener("drop", e => {
    e.preventDefault();
    document.body.classList.remove("dragover");

    const files = [...e.dataTransfer.files];
    const audioFile = files.find(f => f.type.startsWith("audio/"));

    if (audioFile) {
        const dt = new DataTransfer();
        dt.items.add(audioFile);
        audioInput.files = dt.files;
        loadAudio();
    }
});

statusText.textContent = "準備完了";

const generateBtn = document.getElementById("generateBtn");
const progressBar = document.getElementById("progressBar");
const outputVideo = document.getElementById("outputVideo");
const downloadBtn = document.getElementById("downloadBtn");

function getAudioStream() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        bgmGainNode = audioCtx.createGain();
        voiceGainNode = audioCtx.createGain();
        audioDestNode = audioCtx.createMediaStreamDestination();
        
        bgmSourceNode = audioCtx.createMediaElementSource(audioPreview);
        bgmSourceNode.connect(bgmGainNode);
        bgmGainNode.connect(audioDestNode);
        bgmGainNode.connect(audioCtx.destination);
        
        voiceSourceNode = audioCtx.createMediaElementSource(recordPreview);
        voiceSourceNode.connect(voiceGainNode);
        voiceGainNode.connect(audioDestNode);
        voiceGainNode.connect(audioCtx.destination);
    }
    
    bgmGainNode.gain.value = Number(bgmVolumeSlider.value) / 100;
    voiceGainNode.gain.value = Number(voiceVolumeSlider.value) / 100;
    
    return audioDestNode.stream;
}

function getSupportedMimeType(format) {
    const types = {
        mp4: [
            'video/mp4;codecs=h264,aac',
            'video/mp4;codecs=h264,mp4a.40.2',
            'video/mp4;codecs=avc1,mp4a.40.2',
            'video/mp4;codecs=vp9,opus',
            'video/mp4'
        ],
        webm: [
            'video/webm;codecs=vp9,opus',
            'video/webm;codecs=vp8,opus',
            'video/webm;codecs=h264,opus',
            'video/webm'
        ],
        mov: [
            'video/quicktime;codecs=h264,aac',
            'video/quicktime;codecs=h264',
            'video/quicktime'
        ]
    };
    
    const candidates = types[format] || types['webm'];
    for (const type of candidates) {
        if (MediaRecorder.isTypeSupported(type)) {
            return type;
        }
    }
    
    for (const key of Object.keys(types)) {
        for (const type of types[key]) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }
    }
    return '';
}

generateBtn.addEventListener("click", generateMovie);

async function generateMovie() {
    try {
        if (imageFiles.length === 0) {
            alert("画像を選択してください");
            return;
        }

        if (!audioInput.files[0] && !recordPreview.src) {
            alert("音声ファイルを選択するか、マイク録音を行ってください");
            return;
        }

        generateBtn.disabled = true;
        statusText.textContent = "準備中...";
        progressBar.style.width = "0%";

        previewLoopRunning = false;

        for (let i = 0; i < preloadedImages.length; i++) {
            const img = preloadedImages[i];
            if (!img.complete) {
                await new Promise((resolve) => {
                    img.onload = resolve;
                    img.onerror = resolve;
                });
            }
        }

        const resolution = resolutionSelect.value.split("x");
        const width = Number(resolution[0]);
        const height = Number(resolution[1]);
        const fps = Number(document.getElementById("fps").value) || 30;

        previewCanvas.width = width;
        previewCanvas.height = height;

        audioPreview.currentTime = 0;
        recordPreview.currentTime = 0;
        
        if (!audioCtx) {
            getAudioStream();
        } else {
            bgmGainNode.gain.value = Number(bgmVolumeSlider.value) / 100;
            voiceGainNode.gain.value = Number(voiceVolumeSlider.value) / 100;
        }
        
        if (audioCtx.state === "suspended") {
            await audioCtx.resume();
        }

        const audioStream = getAudioStream();
        const canvasStream = previewCanvas.captureStream(fps);

        const combinedStream = new MediaStream();
        combinedStream.addTrack(canvasStream.getVideoTracks()[0]);
        if (audioStream.getAudioTracks().length > 0) {
            combinedStream.addTrack(audioStream.getAudioTracks()[0]);
        }

        const format = formatSelect.value;
        const mimeType = getSupportedMimeType(format);
        const options = mimeType ? { mimeType } : {};

        const recordedChunks = [];
        const mediaRecorder = new MediaRecorder(combinedStream, options);

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                recordedChunks.push(e.data);
            }
        };

        let durationSec = 0;
        const bgmDuration = audioPreview.duration;
        const voiceDuration = recordPreview.duration;

        if (bgmDuration && isFinite(bgmDuration)) {
            durationSec = Math.max(durationSec, bgmDuration);
        }
        if (voiceDuration && isFinite(voiceDuration)) {
            durationSec = Math.max(durationSec, voiceDuration);
        }
        if (durationSec === 0) {
            durationSec = imageFiles.length * (Number(durationInput.value) || 3);
        }

        mediaRecorder.onstop = () => {
            let extension = format;
            const actualMime = mediaRecorder.mimeType.toLowerCase();
            
            if (actualMime.includes("webm")) {
                extension = "webm";
            } else if (actualMime.includes("mp4")) {
                extension = "mp4";
            } else if (actualMime.includes("quicktime") || actualMime.includes("mov")) {
                extension = "mov";
            }

            const blob = new Blob(recordedChunks, { type: mediaRecorder.mimeType });
            const url = URL.createObjectURL(blob);

            outputVideo.src = url;
            downloadBtn.href = url;
            downloadBtn.download = `output.${extension}`;
            downloadBtn.style.display = "inline-block";
            downloadBtn.textContent = `output.${extension} をダウンロード`;

            if (extension !== format) {
                statusText.textContent = `完成（ブラウザが${format.toUpperCase()}形式の録画をサポートしていないため、${extension.toUpperCase()}形式で出力されました）`;
            } else {
                statusText.textContent = "完成";
            }
            progressBar.style.width = "100%";
            generateBtn.disabled = false;

            startSlideshowLoop();
        };

        statusText.textContent = "動画生成中...";
        mediaRecorder.start();
        
        audioPreview.play();
        if (recordPreview.src) {
            recordPreview.play();
        }

        function recordRenderLoop() {
            const currentBgmTime = audioPreview.currentTime;
            const currentVoiceTime = recordPreview.currentTime;
            const t = Math.max(currentBgmTime, currentVoiceTime);

            const isBgmPlaying = !audioPreview.paused && !audioPreview.ended;
            const isVoicePlaying = recordPreview.src ? (!recordPreview.paused && !recordPreview.ended) : false;

            if ((!isBgmPlaying && !isVoicePlaying) || t >= durationSec || mediaRecorder.state === "inactive") {
                audioPreview.pause();
                recordPreview.pause();
                if (mediaRecorder.state !== "inactive") {
                    mediaRecorder.stop();
                }
                return;
            }

            renderCanvas(t);

            const progressPercent = Math.min(99, Math.floor((t / durationSec) * 100));
            progressBar.style.width = `${progressPercent}%`;
            statusText.textContent = `動画生成中: ${progressPercent}% (生成中はタブを開いたままにしてください)`;

            requestAnimationFrame(recordRenderLoop);
        }

        requestAnimationFrame(recordRenderLoop);

    } catch (error) {
        console.error(error);
        statusText.textContent = "エラー";
        alert(error.message);
        generateBtn.disabled = false;
        startSlideshowLoop();
    }
}

// Drag reordering for image list
let dragIndex = -1;

function rebuildImagePreview(){
    imagePreview.innerHTML = "";
    imageFiles.forEach((file, index) => {
        const img = document.createElement("img");
        img.draggable = true;
        img.src = imageUrls[index];

        img.addEventListener("dragstart", () => {
            dragIndex = index;
        });

        img.addEventListener("dragover", e => {
            e.preventDefault();
        });

        img.addEventListener("drop", () => {
            const item = imageFiles[dragIndex];
            imageFiles.splice(dragIndex, 1);
            imageFiles.splice(index, 0, item);

            const urlItem = imageUrls[dragIndex];
            imageUrls.splice(dragIndex, 1);
            imageUrls.splice(index, 0, urlItem);

            const preloadItem = preloadedImages[dragIndex];
            preloadedImages.splice(dragIndex, 1);
            preloadedImages.splice(index, 0, preloadItem);

            rebuildImagePreview();
            saveSettings();
        });

        imagePreview.appendChild(img);
    });
}

// Microphone record setup
let voiceMediaRecorder;
let voiceRecordedChunks = [];
let voiceTimerInterval = null;
let voiceStartTime = 0;

const recordBtn = document.getElementById("recordBtn");
const stopRecordBtn = document.getElementById("stopRecordBtn");
const recordPreview = document.getElementById("recordPreview");

recordBtn.addEventListener("click", startRecording);
stopRecordBtn.addEventListener("click", stopRecording);

async function startRecording(){
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        voiceRecordedChunks = [];
        voiceMediaRecorder = new MediaRecorder(stream);

        voiceMediaRecorder.ondataavailable = e => {
            if (e.data.size > 0) {
                voiceRecordedChunks.push(e.data);
            }
        };

        voiceMediaRecorder.onstop = () => {
            const blob = new Blob(voiceRecordedChunks, { type: "audio/webm" });
            const url = URL.createObjectURL(blob);
            recordPreview.src = url;
            statusText.textContent = "録音完了";
            
            clearInterval(voiceTimerInterval);
            const totalRecordedSec = ((performance.now() - voiceStartTime) / 1000).toFixed(1);
            recordTimer.textContent = `録音時間: ${totalRecordedSec}秒`;

            // ナレーション録音と同時に音声認識を停止
            if (recognition && isRecognizing) {
                isRecognizing = false;
                try {
                    recognition.stop();
                } catch(e) {}
                if (speechStatus) speechStatus.style.display = "none";
            }
        };

        voiceMediaRecorder.start();
        recordBtn.disabled = true;
        stopRecordBtn.disabled = false;
        statusText.textContent = "録音中...";
        
        // 録音タイマーの開始
        voiceStartTime = performance.now();
        recordTimer.style.display = "inline-block";
        recordTimer.textContent = "録音時間: 0.0秒";
        voiceTimerInterval = setInterval(() => {
            const elapsed = ((performance.now() - voiceStartTime) / 1000).toFixed(1);
            recordTimer.textContent = `録音時間: ${elapsed}秒`;
        }, 100);

        // ナレーション録音と同時に音声認識を自動開始
        if (recognition && !isRecognizing) {
            isRecognizing = true;
            try {
                recognition.start();
            } catch(e) {}
            if (speechStatus) {
                speechStatus.style.display = "block";
                speechStatus.textContent = "🎙️ ナレーション音声を自動文字起こし中...";
            }
        }
        
    } catch(err) {
        alert("マイクが使用できません");
        console.error(err);
    }
}

function stopRecording(){
    if(voiceMediaRecorder){
        voiceMediaRecorder.stop();
    }
    recordBtn.disabled = false;
    stopRecordBtn.disabled = true;
    clearInterval(voiceTimerInterval);
}

startSlideshowLoop();
console.log("Movie Creator Pro Loaded successfully.");
