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

    const fileInput = document.getElementById("videoFileInput");
    const processButton = document.getElementById("processVideoBtn");
    const outputFramesColumn = document.getElementById("outputFramesColumn");

    if (!fileInput.files.length) {
        alert("Please upload a video file.");
        return;
    }

    try {
        console.log("🚀 Sending video file to backend...");
        processButton.disabled = true;
        processButton.textContent = "Processing...";
        outputFramesColumn.innerHTML = '<div class="text-center">Processing video...</div>';

        const formData = new FormData();
        formData.append("video", fileInput.files[0]);

        const response = await fetch(`${ngrokUrl}/process_video`, {
            method: "POST",
            body: formData
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
        
        // Create all image containers first
        const containers = imageDataUrls.map((_, index) => {
            const imgContainer = document.createElement("div");
            imgContainer.classList.add("relative", "m-2");
            
            const loadingIndicator = document.createElement("div");
            loadingIndicator.classList.add("absolute", "inset-0", "flex", "items-center", "justify-center", "bg-black", "bg-opacity-50", "rounded-lg");
            loadingIndicator.innerHTML = '<div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>';
            
            imgContainer.appendChild(loadingIndicator);
            outputFramesColumn.appendChild(imgContainer);
            
            return { container: imgContainer, loadingIndicator };
        });

        // Load images
        imageDataUrls.forEach((dataUrl, index) => {
            const img = new Image();
            img.classList.add("w-32", "h-32", "rounded-lg", "shadow-md", "object-cover");
            
            img.onload = () => {
                console.log(`✅ Image ${index + 1} loaded successfully`);
                containers[index].loadingIndicator.remove();
                containers[index].container.appendChild(img);
            };

            img.onerror = () => {
                console.error(`❌ Failed to load image ${index + 1}`);
                containers[index].loadingIndicator.innerHTML = '<div class="text-red-500">Failed to load</div>';
            };

            // Set the data URL directly
            img.src = dataUrl;
        });

    } catch (error) {
        console.error('Error displaying images:', error);
        outputFramesColumn.innerHTML = `<div class="text-red-500">Error: ${error.message}</div>`;
    }
}

async function displayVideo(videoDataUrl) {
    const videoContainer = document.getElementById("videoContainer");
    
    try {
        // Show loading indicator
        videoContainer.innerHTML = `
            <div class="video-loading text-center py-4">
                <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                <div class="mt-2">Loading video...</div>
            </div>
        `;

        // Create video element
        const video = document.createElement('video');
        video.id = 'lipVideo';
        video.className = 'w-full rounded-lg shadow-md';
        video.controls = true;

        video.onloadeddata = () => {
            console.log("✅ Video loaded successfully");
            videoContainer.innerHTML = '';
            videoContainer.appendChild(video);
        };

        video.onerror = (error) => {
            console.error("❌ Error loading video:", error);
            videoContainer.innerHTML = '<div class="text-red-500">Failed to load video</div>';
        };

        // Set the data URL directly
        video.src = videoDataUrl;

        // Start loading the video
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