const audio = document.querySelector("#soundscape");
const playButton = document.querySelector("#play-button");
const timeline = document.querySelector("#timeline");
const volume = document.querySelector("#volume");
const currentTimeText = document.querySelector("#current-time");
const totalTimeText = document.querySelector("#total-time");
const scene = document.querySelector("#scene");
const cityImage = document.querySelector("#city-image");
const sunGlow = document.querySelector("#sun-glow");
const sceneNumber = document.querySelector("#scene-number");
const sceneTitle = document.querySelector("#scene-title");
const sceneText = document.querySelector("#scene-text");
const chapterButtons = document.querySelectorAll(".chapter-button");
const bars = document.querySelectorAll("#sound-bars span");

let audioContext;
let analyser;
let audioSource;
let animationId;

const chapters = [
    {
        start: 0,
        number: "SCENE 01",
        title: "CITY STREETS",
        text: "Traffic moves past while birds and a streetcar bell cut through the city hum.",
        className: "city"
    },
    {
        start: 25,
        number: "SCENE 02",
        title: "PARK PATH",
        text: "Footsteps lead away from the road and the open-air sounds become clearer.",
        className: "park"
    },
    {
        start: 50,
        number: "SCENE 03",
        title: "WATERFRONT",
        text: "The lake softens the busy city as the afternoon walk reaches the shore.",
        className: "waterfront"
    }
];

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return String(minutes).padStart(2, "0") + ":" + String(remainingSeconds).padStart(2, "0");
}

function setChapter(chapterIndex) {
    const chapter = chapters[chapterIndex];

    sceneNumber.textContent = chapter.number;
    sceneTitle.textContent = chapter.title;
    sceneText.textContent = chapter.text;
    scene.classList.remove("city", "park", "waterfront");
    scene.classList.add(chapter.className);

    chapterButtons.forEach(function (button, index) {
        button.classList.toggle("active", index === chapterIndex);
    });
}

function chapterFromTime(time) {
    if (time >= 50) {
        return 2;
    }

    if (time >= 25) {
        return 1;
    }

    return 0;
}

function prepareAudioVisuals() {
    if (audioContext) {
        return;
    }

    audioContext = new AudioContext();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 64;
    audioSource = audioContext.createMediaElementSource(audio);
    audioSource.connect(analyser);
    analyser.connect(audioContext.destination);
}

function animateSound() {
    if (!analyser) {
        return;
    }

    const soundData = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(soundData);

    let total = 0;

    bars.forEach(function (bar, index) {
        const soundValue = soundData[index + 2] || 0;
        const height = 10 + soundValue * 0.22;
        bar.style.height = height + "px";
        total += soundValue;
    });

    const average = total / bars.length;
    const brightness = 1 + average / 1100;
    const scale = 1 + average / 7000;

    cityImage.style.filter = "brightness(" + brightness + ") saturate(1.08)";
    cityImage.style.transform = "scale(" + scale + ")";
    sunGlow.style.opacity = 0.35 + average / 320;

    animationId = requestAnimationFrame(animateSound);
}

function stopSoundAnimation() {
    cancelAnimationFrame(animationId);
    bars.forEach(function (bar) {
        bar.style.height = "12px";
    });
    cityImage.style.filter = "";
    cityImage.style.transform = "";
    sunGlow.style.opacity = "";
}

playButton.addEventListener("click", function () {
    prepareAudioVisuals();

    if (audio.paused) {
        audioContext.resume();
        audio.play();
    } else {
        audio.pause();
    }
});

audio.addEventListener("play", function () {
    playButton.textContent = "PAUSE SOUNDSCAPE";
    scene.classList.add("is-playing");
    animateSound();
});

audio.addEventListener("pause", function () {
    playButton.textContent = "PLAY SOUNDSCAPE";
    scene.classList.remove("is-playing");
    stopSoundAnimation();
});

audio.addEventListener("loadedmetadata", function () {
    timeline.max = audio.duration;
    totalTimeText.textContent = formatTime(audio.duration);
});

audio.addEventListener("timeupdate", function () {
    timeline.value = audio.currentTime;
    currentTimeText.textContent = formatTime(audio.currentTime);
    setChapter(chapterFromTime(audio.currentTime));
});

audio.addEventListener("ended", function () {
    timeline.value = 0;
    currentTimeText.textContent = "00:00";
    setChapter(0);
});

timeline.addEventListener("input", function () {
    setChapter(chapterFromTime(Number(timeline.value)));

    if (audio.seekable.length > 0) {
        audio.currentTime = timeline.value;
    }
});

volume.addEventListener("input", function () {
    audio.volume = volume.value;
});

chapterButtons.forEach(function (button) {
    button.addEventListener("click", function () {
        const chapterIndex = Number(button.dataset.chapter);
        setChapter(chapterIndex);

        if (audio.seekable.length > 0) {
            audio.currentTime = chapters[chapterIndex].start;
        }
    });
});

audio.volume = volume.value;
setChapter(0);
