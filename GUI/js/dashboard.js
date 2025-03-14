let wavesurfer;

function initWaveSurfer() {
    wavesurfer = WaveSurfer.create({
        container: '#waveform',
        waveColor: '#4f46e5',
        progressColor: '#818cf8',
        cursorColor: '#312e81',
        barWidth: 2,
        barRadius: 3,
        cursorWidth: 1,
        height: 80,
        barGap: 2
    });
}

// Extract frames from video
async function extractFrames(video, numFrames = 10) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const frameContainer = document.getElementById('framePreview');
    frameContainer.innerHTML = '';

    const interval = video.duration / numFrames;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    for (let i = 0; i < numFrames; i++) {
        video.currentTime = i * interval;
        await new Promise(resolve => video.addEventListener('seeked', resolve, { once: true }));
        
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const frameImage = document.createElement('img');
        frameImage.src = canvas.toDataURL();
        frameImage.className = 'w-full h-auto rounded';
        frameContainer.appendChild(frameImage);
    }
}

// File input handlers
document.getElementById('video').addEventListener('change', async function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const video = document.getElementById('previewVideo');
    video.src = URL.createObjectURL(file);
    document.getElementById('videoPreview').classList.remove('hidden');
    
    video.onloadedmetadata = function() {
        const fps = Math.round(video.videoWidth * video.videoHeight / (video.duration * 1000));
        document.getElementById('videoInfo').textContent = 
            `${video.videoWidth}x${video.videoHeight} @ ${fps}fps, ${Math.round(video.duration)}s`;
        extractFrames(video);
    }; 
});

document.getElementById('audio').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!wavesurfer) {
        initWaveSurfer();
    }
    
    wavesurfer.loadBlob(file);
    document.getElementById('audioInfo').textContent = 
        `${(file.size / (1024 * 1024)).toFixed(2)}MB, ${file.type}`;
});

// Utility functions
function showDebug(message) {
    const debug = document.getElementById('debug');
    debug.innerHTML += `<div>${new Date().toISOString()}: ${message}</div>`;
    debug.scrollTop = debug.scrollHeight;
}

function updateStatus(message, type) {
    const status = document.getElementById('status');
    status.textContent = message;
    status.className = `mt-4 p-3 rounded-md ${
        type === 'error' ? 'bg-red-100 text-red-700' :
        type === 'success' ? 'bg-green-100 text-green-700' :
        'bg-blue-100 text-blue-700'
    }`;
    status.style.display = 'block';
    showDebug(message);
}

function updateProgress(percent) {
    document.getElementById('progressContainer').style.display = 'block';
    document.getElementById('progressBar').style.width = `${percent}%`;
    document.getElementById('progressText').textContent = `Processing: ${percent}%`;
}

// Server communication
async function makeRequest(url, options) {
    showDebug(`Request to: ${url}`);
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server error: ${response.status} - ${errorText}`);
        }
        return response;
    } catch (error) {
        showDebug(`Error: ${error.message}`);
        throw error;
    }
}

async function testConnection() {
    const serverUrl = document.getElementById('serverUrl').value.trim();
    if (!serverUrl) {
        updateStatus('Please enter the server URL', 'error');
        return;
    }

    try {
        updateStatus('Testing connection...', 'processing');
        await makeRequest(`${serverUrl}/health`, { method: 'GET', mode: 'cors' });
        updateStatus('Connection successful!', 'success');
    } catch (error) {
        updateStatus(`Connection failed: ${error.message}`, 'error');
    }
}

// Process video with Wav2Lip
document.getElementById('submitBtn').onclick = async function() {
    const serverUrl = document.getElementById('serverUrl').value.trim();
    const videoFile = document.getElementById('video').files[0];
    const audioFile = document.getElementById('audio').files[0];

    if (!serverUrl) {
        updateStatus('Please enter the server URL', 'error');
        return;
    }

    if (!videoFile || !audioFile) {
        updateStatus('Please upload both video and audio files', 'error');
        return;
    }

    const submitBtn = this;
    const outputContainer = document.getElementById('outputContainer');

    try {
        submitBtn.disabled = true;
        outputContainer.style.display = 'none';
        updateStatus('Processing files...', 'processing');
        updateProgress(0);

        const formData = new FormData();
        formData.append('video', videoFile);
        formData.append('audio', audioFile);

        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += 5;
            if (progress <= 90) {
                updateProgress(progress);
            }
        }, 2000);

        const response = await makeRequest(`${serverUrl}/process`, {
            method: 'POST',
            mode: 'cors',
            body: formData
        });

        clearInterval(progressInterval);
        updateProgress(100);

        const blob = await response.blob();
        document.getElementById('outputVideo').src = URL.createObjectURL(blob);
        outputContainer.style.display = 'block';
        document.getElementById('enhanceBtn').classList.remove('hidden'); // Show the Enhance button
        updateStatus('Processing complete!', 'success');

    } catch (error) {
        updateStatus(`Error: ${error.message}`, 'error');
    } finally {
        submitBtn.disabled = false;
    }
};

// Enhance video with CodeFormer
document.getElementById('enhanceBtn').onclick = async function () {
    const serverUrl = document.getElementById('serverUrl').value.trim();

    if (!serverUrl) {
        updateStatus('Please enter the server URL', 'error');
        return;
    }

    updateStatus('Enhancing video with CodeFormer...', 'processing');
    this.disabled = true;

    try {
        const response = await makeRequest(`${serverUrl}/enhance`, {
            method: 'POST',
            mode: 'cors'
        });

        const blob = await response.blob();
        document.getElementById('enhancedVideo').src = URL.createObjectURL(blob);
        document.getElementById('enhancedContainer').classList.remove('hidden');
        updateStatus('Enhancement complete!', 'success');

    } catch (error) {
        updateStatus(`Enhancement failed: ${error.message}`, 'error');
    } finally {
        this.disabled = false;
    }
};



document.getElementById("visualizeBtn").addEventListener("click", function (event) {
    event.preventDefault(); // Prevent default action

    const inputVideo = document.getElementById("previewVideo").src;
    const outputVideo = document.getElementById("outputVideo").src;

    if (!inputVideo || !outputVideo) {
        alert("Please upload a video and process it before visualization!");
        return;
    }



    // Pass input & output video URLs via query parameters
    const visualizeURL = `visualize.html?input=${encodeURIComponent(inputVideo)}&output=${encodeURIComponent(outputVideo)}`;
    window.open(visualizeURL, "_blank"); // Open in a new window
});

// Face Detection Button Click Handler
document.getElementById("faceDetectBtn").addEventListener("click", function (event) {
    event.preventDefault(); // Prevent default button action

    const serverUrl = document.getElementById("serverUrl").value.trim();

    if (!serverUrl) {
        alert("Please enter and save the Ngrok server URL before proceeding!");
        return;
    }

    if (!document.getElementById("outputVideo").src) {  // Prevent empty page
        alert("Please process a video first!");
        return;
    }

    // Pass server URL via query parameters
    const faceDetectURL = `face_detect.html?server=${encodeURIComponent(serverUrl)}`;
    window.open(faceDetectURL, "_blank"); // Open in a new window
});



// Save and load server URL from local storage
function saveServerUrl() {
    const serverUrl = document.getElementById("serverUrl").value.trim();
    if (serverUrl) {
        localStorage.setItem("ngrokUrl", serverUrl);
        console.log("Server URL saved:", serverUrl);
        alert("Server URL saved!");
    } else {
        console.log("No server URL entered!");
    }
}

// Combined window.onload to initialize everything
window.onload = function() {
    // Initialize Wavesurfer
    initWaveSurfer();

    // Load saved server URL from local storage
    const savedUrl = localStorage.getItem("ngrokUrl");
    if (savedUrl) {
        document.getElementById("serverUrl").value = savedUrl;
    }

    console.log("Page loaded, WaveSurfer initialized, and server URL (if any) set.");
};
