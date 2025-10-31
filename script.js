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

// Initialize canvas
function initCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Set up canvas background color
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Get initial frame from first video
    videos.video1.addEventListener('loadedmetadata', () => {
        // Ensure we can draw the first frame
        videos.video1.currentTime = 0;
    }, { once: true });

    videos.video1.addEventListener('canplay', () => {
        drawFrameToCanvas(videos.video1);
    });

    videos.video1.load();
}

// Draw video frame to canvas
function drawFrameToCanvas(video) {
    if (video.readyState >= 2) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }
}

// Create SVG dots
function createDots() {
    dotsContainer.innerHTML = '';

    DOT_POSITIONS.forEach((pos, index) => {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', pos.x);
        circle.setAttribute('cy', pos.y);
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
    const dots = dotsContainer.querySelectorAll('.dot');
    dots.forEach(dot => {
        dot.style.opacity = '0';
        dot.style.pointerEvents = 'none';
    });
}

// Show dots
function showDots() {
    const dots = dotsContainer.querySelectorAll('.dot');
    dots.forEach(dot => {
        dot.style.opacity = '1';
        dot.style.pointerEvents = 'auto';
    });
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

// Handle window resize
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    createDots();

    // Update dot positions for responsive design
    DOT_POSITIONS[1].x = window.innerWidth - 200;
    DOT_POSITIONS[2].x = window.innerWidth / 2;
});

// Initialize
initCanvas();
createDots();

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
