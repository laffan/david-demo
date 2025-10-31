// Dot positions configuration
const DOT_POSITIONS = [
    { x: 200, y: 200, videoId: 'video1' },
    { x: window.innerWidth - 200, y: 200, videoId: 'video2' },
    { x: window.innerWidth / 2, y: window.innerHeight - 200, videoId: 'video3' }
];

const DOT_RADIUS = 15;
const DOT_COLOR = '#f3b03d';

// DOM elements
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const dotsContainer = document.getElementById('dots-container');
const overlay = document.getElementById('overlay');
const backButton = document.getElementById('backButton');
const videos = {
    video1: document.getElementById('video1'),
    video2: document.getElementById('video2'),
    video3: document.getElementById('video3')
};

// State management
let state = {
    isPlaying: false,
    activeVideoId: null,
    dotsVisible: true,
    overlayActive: false,
    isRewinding: false,
    playbackRate: 1
};

// Check if device is mobile
const isMobile = () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Get canvas container for proper sizing
const canvasContainer = document.querySelector('.canvas-container');

// Initialize canvas
function initCanvas() {
    // Configure videos for mobile
    Object.values(videos).forEach(video => {
        video.muted = true;
        video.playsInline = true;
        video.setAttribute('playsinline', '');
        video.setAttribute('webkit-playsinline', '');
    });

    // Get initial frame from first video
    videos.video1.addEventListener('loadedmetadata', () => {
        // Ensure we can draw the first frame
        videos.video1.currentTime = 0;
    }, { once: true });

    videos.video1.addEventListener('canplay', () => {
        drawFrameToCanvas(videos.video1);
        // Update dots after first draw
        setTimeout(() => createDots(), 100);
    });

    videos.video1.load();
}

// Store video display dimensions for dot positioning
let videoDisplayDims = {
    width: 0,
    height: 0,
    offsetX: 0,
    offsetY: 0
};

// Draw video frame to canvas with proper aspect ratio
function drawFrameToCanvas(video) {
    if (video.readyState >= 2) {
        const containerWidth = canvasContainer.clientWidth;
        const containerHeight = canvasContainer.clientHeight;

        // Resize canvas to match container
        canvas.width = containerWidth;
        canvas.height = containerHeight;

        // Update stored dimensions for dot positioning
        videoDisplayDims = { width: containerWidth, height: containerHeight, offsetX: 0, offsetY: 0 };

        // Draw video to fill container (will stretch if aspect ratio doesn't match)
        ctx.drawImage(video, 0, 0, containerWidth, containerHeight);
    }
}

// Create SVG dots - position relative to video display area
function createDots() {
    dotsContainer.innerHTML = '';

    // Set SVG dimensions to match canvas
    dotsContainer.setAttribute('width', videoDisplayDims.width);
    dotsContainer.setAttribute('height', videoDisplayDims.height);
    dotsContainer.setAttribute('viewBox', `0 0 ${videoDisplayDims.width} ${videoDisplayDims.height}`);

    DOT_POSITIONS.forEach((pos, index) => {
        // Scale positions to video display dimensions
        const scaledX = (pos.x / 1920) * videoDisplayDims.width; // Assuming original positions are based on 1920px width
        const scaledY = (pos.y / 1080) * videoDisplayDims.height; // Assuming original positions are based on 1080px height

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', scaledX);
        circle.setAttribute('cy', scaledY);
        circle.setAttribute('r', DOT_RADIUS);
        circle.setAttribute('fill', DOT_COLOR);
        circle.setAttribute('class', 'dot');
        circle.setAttribute('data-index', index);
        circle.setAttribute('pointer-events', 'auto');
        circle.style.cursor = 'pointer';

        circle.addEventListener('click', () => handleDotClick(pos.videoId, index));
        circle.addEventListener('mouseenter', () => {
            circle.style.opacity = '0.8';
        });
        circle.addEventListener('mouseleave', () => {
            circle.style.opacity = '1';
        });

        dotsContainer.appendChild(circle);
    });
}

// Animation frame ID for rendering
let animationFrameId = null;

// Handle dot click
function handleDotClick(videoId, index) {
    if (state.isPlaying || state.isRewinding) return;

    state.isPlaying = true;
    state.activeVideoId = videoId;
    state.dotsVisible = false;

    // Hide dots
    hideDots();

    // Hide overlay if active
    if (state.overlayActive) {
        overlay.classList.remove('active');
        state.overlayActive = false;
    }

    // Stop all videos
    Object.values(videos).forEach(video => video.pause());

    // Reset and play selected video
    const activeVideo = videos[videoId];
    activeVideo.currentTime = 0;
    activeVideo.play();

    // Use requestAnimationFrame for smooth rendering
    const renderFrame = () => {
        drawFrameToCanvas(activeVideo);

        if (state.isPlaying && activeVideo.currentTime < activeVideo.duration) {
            animationFrameId = requestAnimationFrame(renderFrame);
        }
    };

    // Cancel any existing animation frame
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    animationFrameId = requestAnimationFrame(renderFrame);

    // Handle video end
    const endHandler = () => {
        state.isPlaying = false;
        state.activeVideoId = videoId;
        state.dotsVisible = false; // Keep dots hidden

        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }

        activeVideo.removeEventListener('ended', endHandler);

        // Show overlay
        setTimeout(() => {
            state.overlayActive = true;
            overlay.classList.add('active');
        }, 300);
    };

    activeVideo.removeEventListener('ended', endHandler);
    activeVideo.addEventListener('ended', endHandler);
}

// Hide dots
function hideDots() {
    dotsContainer.classList.add('hidden');
}

// Show dots
function showDots() {
    dotsContainer.classList.remove('hidden');
}

// Handle back button click
backButton.addEventListener('click', () => {
    if (state.isRewinding) return;

    state.isRewinding = true;
    state.overlayActive = false;
    overlay.classList.remove('active');

    const activeVideo = videos[state.activeVideoId];
    activeVideo.pause();

    // Rewind video
    const rewindHandler = () => {
        drawFrameToCanvas(activeVideo);

        if (activeVideo.currentTime <= 0) {
            activeVideo.pause();
            activeVideo.removeEventListener('timeupdate', rewindHandler);
            state.isRewinding = false;
            state.isPlaying = false;
            state.activeVideoId = null; // Reset to initial state
            state.dotsVisible = true;
            showDots();
        }
    };

    activeVideo.removeEventListener('timeupdate', rewindHandler);
    activeVideo.addEventListener('timeupdate', rewindHandler);

    // Play in reverse by manually decreasing currentTime
    const rewindInterval = setInterval(() => {
        if (activeVideo.currentTime > 0) {
            activeVideo.currentTime = Math.max(0, activeVideo.currentTime - 0.033); // ~30fps
        } else {
            clearInterval(rewindInterval);
        }
    }, 33);
});

// Animation loop for continuous rendering
let animationLoopId = null;
function animationLoop() {
    // Redraw current frame only if playing or if we're showing the initial frame
    if (state.isPlaying && state.activeVideoId) {
        drawFrameToCanvas(videos[state.activeVideoId]);
    } else if (!state.activeVideoId && !state.overlayActive) {
        // Only draw video1 if we're in initial state (no video has been played)
        drawFrameToCanvas(videos.video1);
    }
    animationLoopId = requestAnimationFrame(animationLoop);
}

// Handle window resize
window.addEventListener('resize', () => {
    // Recreate dots with new scaling
    createDots();
});

// Initialize
initCanvas();
createDots();

// Start animation loop
animationLoopId = requestAnimationFrame(animationLoop);

// Draw initial frame on load - add retries
window.addEventListener('load', () => {
    let retries = 0;
    const tryDrawFrame = () => {
        if (videos.video1.readyState >= 2) {
            drawFrameToCanvas(videos.video1);
        } else if (retries < 10) {
            retries++;
            setTimeout(tryDrawFrame, 100);
        }
    };
    tryDrawFrame();
});

// Also try to draw frame after a short delay
setTimeout(() => {
    if (videos.video1.readyState >= 2) {
        drawFrameToCanvas(videos.video1);
    }
}, 500);
