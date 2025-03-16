function getNgrokUrl() {
    const ngrokUrl = localStorage.getItem("ngrokUrl");
    if (!ngrokUrl || ngrokUrl.trim() === "") {
        alert("Go to dashboard and enter server URL first!");
        return null;
    }
    return ngrokUrl.replace(/\/$/, ""); // Remove trailing slash
}

async function processVideo() {
    const ngrokUrl = getNgrokUrl();
    if (!ngrokUrl) return;

    const processButton = document.getElementById("processVideoBtn");
    const outputFramesColumn = document.getElementById("outputFramesColumn");
    const videoContainer = document.getElementById("videoContainer");

    try {
        console.log("🚀 Sending process request to backend...");
        processButton.disabled = true;
        processButton.textContent = "Processing...";
        
        // Add satisfying loading animation
        outputFramesColumn.innerHTML = `
            <div class="flex justify-center items-center py-6">
                <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid"></div>
            </div>
            <div class="text-center text-gray-300">Processing your video, please wait...</div>
        `;
        
        videoContainer.innerHTML = `
            <div class="flex justify-center items-center py-6">
                <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid"></div>
            </div>
            <div class="text-center text-gray-300">Preparing video output...</div>
        `;

        const response = await fetch(`${ngrokUrl}/process_video`, {
            method: "POST"
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.statusText}`);
        }

        const responseData = await response.json();
        console.log("✅ Response from backend:", responseData);

        // Clear previous results
        outputFramesColumn.innerHTML = "";
        
        // Display images using data URLs
        if (responseData.face_frames?.length) {
            await displayImages(responseData.face_frames);
        } else {
            outputFramesColumn.innerHTML = '<div class="text-center text-red-500">No face frames detected</div>';
        }

        // Display video using data URL
        if (responseData.lip_mapped_video) {
            await displayVideo(responseData.lip_mapped_video);
        }

    } catch (error) {
        console.error("❌ Error processing video:", error);
        outputFramesColumn.innerHTML = `<div class="text-center text-red-500">Error: ${error.message}</div>`;
    } finally {
        processButton.disabled = false;
        processButton.textContent = "Process Video";
    }
}

async function displayImages(imageDataUrls) {
    const outputFramesColumn = document.getElementById("outputFramesColumn");
    outputFramesColumn.innerHTML = '<div class="text-center">Loading images...</div>';

    try {
        outputFramesColumn.innerHTML = ''; // Clear loading message
        
        imageDataUrls.forEach((dataUrl, index) => {
            const img = new Image();
            img.classList.add("w-32", "h-32", "rounded-lg", "shadow-md", "object-cover");
            img.src = dataUrl;
            outputFramesColumn.appendChild(img);
        });

    } catch (error) {
        console.error('Error displaying images:', error);
        outputFramesColumn.innerHTML = `<div class="text-red-500">Error: ${error.message}</div>`;
    }
}

async function displayVideo(videoDataUrl) {
    const videoContainer = document.getElementById("videoContainer");
    
    try {
        videoContainer.innerHTML = `<div class="flex justify-center items-center py-6">
            <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid"></div>
        </div>
        <div class="text-center text-gray-300">Loading video...</div>`;

        const video = document.createElement('video');
        video.id = 'lipVideo';
        video.className = 'w-full rounded-lg shadow-md';
        video.controls = true;
        video.src = videoDataUrl;
        
        video.onloadeddata = () => {
            console.log("✅ Video loaded successfully");
            videoContainer.innerHTML = '';
            videoContainer.appendChild(video);
        };

        video.onerror = () => {
            console.error("❌ Error loading video");
            videoContainer.innerHTML = '<div class="text-red-500">Failed to load video</div>';
        };

        video.load();
    } catch (error) {
        console.error('Error displaying video:', error);
        videoContainer.innerHTML = `<div class="text-red-500">Error: ${error.message}</div>`;
    }
}

// Event listener for the "Process Video" button
document.addEventListener("DOMContentLoaded", function () {
    const processButton = document.getElementById("processVideoBtn");
    if (processButton) {
        processButton.addEventListener("click", processVideo);
    } else {
        console.error("❌ Button with ID 'processVideoBtn' not found.");
    }
});
