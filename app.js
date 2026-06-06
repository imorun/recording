const imageInput = document.getElementById("images");
const audioInput = document.getElementById("audio");
const lyricsInput = document.getElementById("lyrics");

const imagePreview = document.getElementById("imagePreview");

const audioPreview = document.getElementById("audioPreview");

const previewCanvas =
document.getElementById("previewCanvas");

const lyricsPreview =
document.getElementById("lyricsPreview");

const volumeSlider =
document.getElementById("volume");

const volumeText =
document.getElementById("volumeText");

const resolutionSelect =
document.getElementById("resolution");

const formatSelect =
document.getElementById("format");

const durationInput =
document.getElementById("duration");

const fadeInput =
document.getElementById("fade");

const statusText =
document.getElementById("status");

const ctx =
previewCanvas.getContext("2d");

let imageFiles = [];
let imageUrls = [];
let currentImage = 0;
let slideTimer = null;

let waveSurfer = null;

function saveSettings(){


localStorage.setItem(
    "movieCreatorSettings",
    JSON.stringify({

        resolution:
            resolutionSelect.value,

        format:
            formatSelect.value,

        volume:
            volumeSlider.value,

        duration:
            durationInput.value,

        fade:
            fadeInput.value,

        lyrics:
            lyricsInput.value

    })
);


}

function loadSettings(){


const raw =
    localStorage.getItem(
        "movieCreatorSettings"
    );

if(!raw){
    return;
}

try{

    const s =
        JSON.parse(raw);

    if(s.resolution)
        resolutionSelect.value =
            s.resolution;

    if(s.format)
        formatSelect.value =
            s.format;

    if(s.volume)
        volumeSlider.value =
            s.volume;

    if(s.duration)
        durationInput.value =
            s.duration;

    if(s.fade)
        fadeInput.value =
            s.fade;

    if(s.lyrics)
        lyricsInput.value =
            s.lyrics;

}catch(e){}


}

loadSettings();

[
resolutionSelect,
formatSelect,
volumeSlider,
durationInput,
fadeInput,
lyricsInput
].forEach(el=>{


el.addEventListener(
    "change",
    saveSettings
);


});

volumeSlider.addEventListener(
"input",
()=>{


    volumeText.textContent =
        volumeSlider.value + "%";

    audioPreview.volume =
        volumeSlider.value / 100;

    saveSettings();
}


);

lyricsInput.addEventListener(
"input",
()=>{


    const lines =
        lyricsInput.value
        .split("\n");

    lyricsPreview.textContent =
        lines[0] || "";

    saveSettings();
}


);

imageInput.addEventListener(
"change",
loadImages
);

function loadImages(){


imageFiles =
    [...imageInput.files];

imagePreview.innerHTML = "";

imageUrls = [];

imageFiles.forEach(file=>{

    const url =
        URL.createObjectURL(file);

    imageUrls.push(url);

    const img =
        document.createElement("img");

    img.src = url;

    imagePreview.appendChild(img);

});

startSlideshow();


}

audioInput.addEventListener(
"change",
loadAudio
);

function loadAudio(){


const file =
    audioInput.files[0];

if(!file){
    return;
}

const url =
    URL.createObjectURL(file);

audioPreview.src = url;

if(waveSurfer){

    waveSurfer.destroy();
}

waveSurfer =
    WaveSurfer.create({

        container:"#waveform",

        waveColor:"#60a5fa",

        progressColor:"#2563eb",

        height:120

    });

waveSurfer.load(url);


}

function startSlideshow(){


if(slideTimer){

    clearInterval(slideTimer);
}

currentImage = 0;

drawCurrentImage();

slideTimer =
    setInterval(()=>{

        if(
            imageUrls.length === 0
        ){
            return;
        }

        currentImage++;

        if(
            currentImage >=
            imageUrls.length
        ){

            currentImage = 0;
        }

        drawCurrentImage();

    },
    Number(
        durationInput.value
    ) * 1000);


}

function drawCurrentImage(){


if(
    imageUrls.length === 0
){
    return;
}

const img =
    new Image();

img.onload = ()=>{

    previewCanvas.width =
        1280;

    previewCanvas.height =
        720;

    ctx.clearRect(
        0,
        0,
        previewCanvas.width,
        previewCanvas.height
    );

    ctx.drawImage(
        img,
        0,
        0,
        previewCanvas.width,
        previewCanvas.height
    );

};

img.src =
    imageUrls[currentImage];


}

[
durationInput
].forEach(el=>{


el.addEventListener(
    "change",
    startSlideshow
);


});

document.addEventListener(
"dragover",
e=>{


    e.preventDefault();

    document.body.classList.add(
        "dragover"
    );
}


);

document.addEventListener(
"dragleave",
()=>{


    document.body.classList.remove(
        "dragover"
    );
}


);

document.addEventListener(
"drop",
e=>{


    e.preventDefault();

    document.body.classList.remove(
        "dragover"
    );

    const files =
        [...e.dataTransfer.files];

    const images =
        files.filter(f=>
            f.type.startsWith(
                "image/"
            )
        );

    if(images.length){

        const dt =
            new DataTransfer();

        images.forEach(
            file=>
            dt.items.add(file)
        );

        imageInput.files =
            dt.files;

        loadImages();
    }

}


);

statusText.textContent =
"準備完了";
const generateBtn =
document.getElementById(
"generateBtn"
);

const progressBar =
document.getElementById(
"progressBar"
);

const outputVideo =
document.getElementById(
"outputVideo"
);

const downloadBtn =
document.getElementById(
"downloadBtn"
);

const {
createFFmpeg,
fetchFile
} = FFmpeg;

const ffmpeg =
createFFmpeg({
log:true
});

let ffmpegLoaded =
false;

async function loadFFmpeg(){


if(ffmpegLoaded){
    return;
}

statusText.textContent =
    "FFmpeg読込中...";

await ffmpeg.load();

ffmpegLoaded = true;

statusText.textContent =
    "FFmpeg準備完了";


}

generateBtn.addEventListener(
"click",
generateMovie
);

async function generateMovie(){


try{

    if(
        imageFiles.length === 0
    ){
        alert(
            "画像を選択してください"
        );
        return;
    }

    if(
        !audioInput.files[0]
    ){
        alert(
            "音声を選択してください"
        );
        return;
    }

    await loadFFmpeg();

    statusText.textContent =
        "画像変換中";

    progressBar.style.width =
        "5%";

    ffmpeg.setProgress(
        ({ratio})=>{

            progressBar.style.width =
                Math.floor(
                    ratio * 100
                ) + "%";
        }
    );

    const resolution =
        resolutionSelect.value
        .split("x");

    const width =
        Number(
            resolution[0]
        );

    const height =
        Number(
            resolution[1]
        );

    const duration =
        Number(
            durationInput.value
        );

    for(
        let i=0;
        i<imageFiles.length;
        i++
    ){

        const file =
            imageFiles[i];

        ffmpeg.FS(
            "writeFile",
            `img${i}.png`,
            await fetchFile(
                file
            )
        );
    }

    ffmpeg.FS(
        "writeFile",
        "audio",
        await fetchFile(
            audioInput.files[0]
        )
    );

    let list = "";

    imageFiles.forEach(
        (f,index)=>{

        list +=


`file img${index}.png
duration ${duration}
`;


    });

    ffmpeg.FS(
        "writeFile",
        "list.txt",
        new TextEncoder()
        .encode(list)
    );

    statusText.textContent =
        "動画生成中";

    const format =
        formatSelect.value;

    let outputFile =
        "output." +
        format;

    let codecArgs;

    if(
        format === "webm"
    ){

        codecArgs = [

            "-c:v",
            "libvpx-vp9",

            "-c:a",
            "libopus"
        ];

    }else{

        codecArgs = [

            "-c:v",
            "libx264",

            "-c:a",
            "aac",

            "-pix_fmt",
            "yuv420p"
        ];
    }

    await ffmpeg.run(

        "-f",
        "concat",

        "-safe",
        "0",

        "-i",
        "list.txt",

        "-i",
        "audio",

        "-vf",

        `scale=${width}:${height}`,

        "-shortest",

        ...codecArgs,

        outputFile
    );

    progressBar.style.width =
        "100%";

    statusText.textContent =
        "完成";

    const data =
        ffmpeg.FS(
            "readFile",
            outputFile
        );

    const blob =
        new Blob(
            [data.buffer]
        );

    const url =
        URL.createObjectURL(
            blob
        );

    outputVideo.src =
        url;

    downloadBtn.href =
        url;

    downloadBtn.download =
        outputFile;

    downloadBtn.style.display =
        "inline-block";

    downloadBtn.textContent =
        outputFile +
        " をダウンロード";

}catch(error){

    console.error(
        error
    );

    statusText.textContent =
        "エラー";

    alert(
        error.message
    );
}


}
/* =========================
GIF対応
========================= */

async function isGif(file){


return (
    file.type === "image/gif" ||
    file.name
    .toLowerCase()
    .endsWith(".gif")
);


}

/* =========================
ドラッグ＆ドロップ音声
========================= */

document.addEventListener(
"drop",
e=>{


    const files =
        [...e.dataTransfer.files];

    const audio =
        files.find(f=>
            f.type.startsWith(
                "audio/"
            )
        );

    if(audio){

        const dt =
            new DataTransfer();

        dt.items.add(audio);

        audioInput.files =
            dt.files;

        loadAudio();
    }

}


);

/* =========================
歌詞焼き込み
========================= */

function escapeDrawText(text){


return text
    .replace(/:/g,"\\:")
    .replace(/'/g,"\\'")
    .replace(/\[/g,"\\[")
    .replace(/\]/g,"\\]");


}

function buildLyricsFilter(){


const lines =
    lyricsInput.value
    .split("\n")
    .filter(v=>v.trim());

if(lines.length === 0){
    return "";
}

let filter = "";

lines.forEach(
    (line,index)=>{

        const start =
            index * 5;

        const end =
            start + 5;

        filter +=


`drawtext=text='${escapeDrawText(line)}':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=h-120:enable='between(t,${start},${end})',`;


    }
);

return filter
    .replace(/,$/,"");


}

/* =========================
フェード
========================= */

function buildFadeFilter(){


const fade =
    Number(
        fadeInput.value
    );

if(fade <= 0){

    return "";
}

return


`fade=t=in:st=0:d=${fade}`;
}

/* =========================
ZIP画像対応
========================= */

async function handleZip(file){


if(
    !file.name
    .toLowerCase()
    .endsWith(".zip")
){
    return false;
}

alert(
    "ZIP対応は JSZip を追加すると利用できます"
);

return true;


}

/* =========================
画像順番変更
========================= */

let dragIndex = -1;

function rebuildImagePreview(){


imagePreview.innerHTML = "";

imageFiles.forEach(
    (file,index)=>{

        const img =
            document.createElement(
                "img"
            );

        img.draggable = true;

        img.src =
            URL.createObjectURL(
                file
            );

        img.addEventListener(
            "dragstart",
            ()=>{

                dragIndex =
                    index;
            }
        );

        img.addEventListener(
            "dragover",
            e=>{

                e.preventDefault();
            }
        );

        img.addEventListener(
            "drop",
            ()=>{

                const item =
                    imageFiles[
                        dragIndex
                    ];

                imageFiles.splice(
                    dragIndex,
                    1
                );

                imageFiles.splice(
                    index,
                    0,
                    item
                );

                rebuildImagePreview();
            }
        );

        imagePreview
        .appendChild(img);
    }
);


}

/* =========================
設定保存拡張
========================= */

function exportSettings(){


const blob =
    new Blob(

        [
            JSON.stringify({

                resolution:
                resolutionSelect.value,

                format:
                formatSelect.value,

                volume:
                volumeSlider.value,

                lyrics:
                lyricsInput.value

            },null,2)
        ],

        {
            type:
            "application/json"
        }
    );

const a =
    document.createElement(
        "a"
    );

a.href =
    URL.createObjectURL(
        blob
    );

a.download =
    "movie-settings.json";

a.click();


}

/* =========================
プレビュー歌詞同期
========================= */

function syncLyricsPreview(){


const lines =
    lyricsInput.value
    .split("\n");

let current = 0;

clearInterval(
    window.lyricsTimer
);

window.lyricsTimer =
    setInterval(()=>{

        lyricsPreview
        .textContent =

        lines[current] || "";

        current++;

        if(
            current >=
            lines.length
        ){

            current = 0;
        }

    },5000);


}

lyricsInput.addEventListener(
"input",
syncLyricsPreview
);

syncLyricsPreview();

let mediaRecorder;
let recordedChunks = [];

const recordBtn =
    document.getElementById(
        "recordBtn"
    );

const stopRecordBtn =
    document.getElementById(
        "stopRecordBtn"
    );

const recordPreview =
    document.getElementById(
        "recordPreview"
    );

recordBtn.addEventListener(
    "click",
    startRecording
);

stopRecordBtn.addEventListener(
    "click",
    stopRecording
);

async function startRecording(){

    try{

        const stream =
            await navigator
            .mediaDevices
            .getUserMedia({

                audio:true

            });

        recordedChunks = [];

        mediaRecorder =
            new MediaRecorder(
                stream
            );

        mediaRecorder.ondataavailable =
            e=>{

                if(
                    e.data.size > 0
                ){

                    recordedChunks.push(
                        e.data
                    );
                }
            };

        mediaRecorder.onstop =
            ()=>{

                const blob =
                    new Blob(

                        recordedChunks,

                        {
                            type:
                            "audio/webm"
                        }
                    );

                const url =
                    URL.createObjectURL(
                        blob
                    );

                recordPreview.src =
                    url;

                audioPreview.src =
                    url;

                const file =
                    new File(

                        [blob],

                        "recording.webm",

                        {
                            type:
                            "audio/webm"
                        }
                    );

                const dt =
                    new DataTransfer();

                dt.items.add(file);

                audioInput.files =
                    dt.files;

                loadAudio();
            };

        mediaRecorder.start();

        recordBtn.disabled =
            true;

        stopRecordBtn.disabled =
            false;

        statusText.textContent =
            "録音中";

    }catch(err){

        alert(
            "マイクが使用できません"
        );

        console.error(
            err
        );
    }
}

function stopRecording(){

    if(mediaRecorder){

        mediaRecorder.stop();
    }

    recordBtn.disabled =
        false;

    stopRecordBtn.disabled =
        true;

    statusText.textContent =
        "録音完了";
}

/* =========================
完了
========================= */

console.log(
"Movie Creator Pro Addon Loaded"
);
