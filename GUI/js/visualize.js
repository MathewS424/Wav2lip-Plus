function getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        input: params.get("input"),
        output: params.get("output")
    };
}

function loadVideos() {
    const { input, output } = getQueryParams();

    const inputVideo = document.getElementById("inputVideo");
    const outputVideo = document.getElementById("outputVideo");

    if (input) inputVideo.src = input;
    if (output) outputVideo.src = output;

    inputVideo.addEventListener("loadedmetadata", () => console.log("Input video loaded"));
    outputVideo.addEventListener("loadedmetadata", () => console.log("Output video loaded"));
}

// Store the last extracted second for each video
let lastExtractedTime = {
    inputVideo: 0,
    outputVideo: 0
};

// Extracts frames in segments of 2 seconds
function extractFrames(videoId, containerId, referenceVideoId = null) {
    const videoElement = document.getElementById(videoId);
    const container = document.getElementById(containerId);

    if (!videoElement.videoWidth || !videoElement.videoHeight) {
        console.error("Video metadata not loaded yet.");
        return;
    }

    const referenceVideo = referenceVideoId ? document.getElementById(referenceVideoId) : videoElement;
    const segmentDuration = 2; // Process 2-second chunks
    const fps = 5; // Frames per second
    const totalFrames = segmentDuration * fps; // Number of frames in the segment
    const interval = 1 / fps; // Time between frames

    let startTime = lastExtractedTime[videoId];

    if (startTime >= videoElement.duration) {
        alert("Reached the end! Restarting from the beginning.");
        lastExtractedTime[videoId] = 0;
        startTime = 0;
    }

    let endTime = Math.min(startTime + segmentDuration, videoElement.duration);
    console.log(`Extracting frames from ${startTime}s to ${endTime}s`);

    const width = referenceVideo.videoWidth / 2;
    const height = referenceVideo.videoHeight / 2;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = width;
    canvas.height = height;

    let currentFrameTime = startTime;
    container.innerHTML = ""; // Clear previous frames

    function captureFrame() {
        if (currentFrameTime >= endTime) {
            lastExtractedTime[videoId] = endTime;
            console.log(`Finished extracting frames up to ${endTime}s`);
            return;
        }

        videoElement.currentTime = currentFrameTime;
        videoElement.addEventListener("seeked", function drawFrame() {
            setTimeout(() => {  // Small delay to ensure frame is loaded
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

                const img = new Image();
                img.src = canvas.toDataURL("image/png");
                img.classList.add("rounded-lg", "shadow-md", "w-full");
                container.appendChild(img);

                videoElement.removeEventListener("seeked", drawFrame);
                currentFrameTime += interval;
                requestAnimationFrame(captureFrame); // More efficient frame processing
            }, 50);
        }, { once: true });
    }

    captureFrame(); // Start extracting frames
}

window.onload = () => {
    loadVideos();

    document.getElementById("compareInputBtn").addEventListener("click", () => {
        extractFrames("inputVideo", "inputFramesColumn");
    });

    document.getElementById("compareOutputBtn").addEventListener("click", () => {
        extractFrames("outputVideo", "outputFramesColumn", "inputVideo");
    });
};
