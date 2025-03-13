    document.getElementById("convertTextButton").addEventListener("click", async () => {
    const text = document.getElementById("textInput").value.trim();
    const language = document.getElementById("languageSelect").value;
    const statusText = document.getElementById("textStatus");

    if (!text) {
        statusText.textContent = "Please enter text to convert.";
        return;
    }

    statusText.textContent = "Converting text to speech...";

    try {
        const ngrokUrl = localStorage.getItem("ngrokUrl");
        if (!ngrokUrl) {
            alert("Please go to the dashboard and enter the server URL first!");
            return;
        }

        const response = await fetch(`${ngrokUrl}/text_to_speech`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, language }),
        });

        if (!response.ok) {
            throw new Error("Failed to generate speech.");
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "speech.mp3";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        statusText.textContent = "Download complete!";
    } catch (error) {
        console.error("Error:", error);
        statusText.textContent = "Error converting text to speech.";
    }
});


function convertVideoFrameRate() {
            const ngrokUrl = localStorage.getItem("ngrokUrl");

            if (!ngrokUrl) {
                alert("Please go to the dashboard and enter the server URL first!");
                return;
            }

            const fileInput = document.getElementById('videoFile');
            const frameRate = document.getElementById('frameRate').value.trim();

            if (!fileInput.files.length || !frameRate) {
                document.getElementById('convertStatus').textContent = "Please select a file and enter a frame rate!";
                return;
            }

            const videoFile = fileInput.files[0];
            const formData = new FormData();
            formData.append("video", videoFile);
            formData.append("frame_rate", frameRate);

            document.getElementById('convertStatus').textContent = "Processing... Please wait.";

            fetch(`${ngrokUrl}/convert_fps`, {
                method: "POST",
                body: formData
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error("Failed to convert video");
                }
                return response.blob();
            })
            .then(blob => {
                const videoUrl = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = videoUrl;
                a.download = "converted_video.mp4";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                document.getElementById('convertStatus').textContent = "Download ready!";
            })
            .catch(error => {
                document.getElementById('convertStatus').textContent = "Error: " + error.message;
            });
        }

        document.addEventListener("DOMContentLoaded", function () {
            document.getElementById("convertButton").addEventListener("click", convertVideoFrameRate);
        });
        
        function downloadTrimmedVideo() {
    // Get ngrok URL from localStorage
    const ngrokUrl = localStorage.getItem("ngrokUrl");

    if (!ngrokUrl) {
        alert("Please go to the dashboard and enter the server URL first!");
        return;
    }

    const url = document.getElementById('youtubeUrl').value.trim();
    const startTime = document.getElementById('startTime').value.trim();
    const duration = document.getElementById('duration').value.trim();

    if (!url || !startTime || !duration) {
        document.getElementById('downloadStatus').textContent = "Please fill all fields!";
        return;
    }

    document.getElementById('downloadStatus').textContent = "Processing... Please wait.";

    console.log("Sending request to:", `${ngrokUrl}/download_youtube`);
    console.log("Data being sent:", JSON.stringify({ youtube_url: url, start_time: startTime, duration: duration }));

    fetch(`${ngrokUrl}/download_youtube`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ youtube_url: url, start_time: startTime, duration: duration })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error("Failed to process video");
        }
        return response.blob();
    })
    .then(blob => {
        const videoUrl = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = videoUrl;
        a.download = "trimmed_video.mp4";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        document.getElementById('downloadStatus').textContent = "Download ready!";
    })
    .catch(error => {
        document.getElementById('downloadStatus').textContent = "Error: " + error.message;
    });
}

        // Attach event listener to the button
        document.addEventListener("DOMContentLoaded", function () {
            document.getElementById("downloadButton").addEventListener("click", downloadTrimmedVideo);
        });