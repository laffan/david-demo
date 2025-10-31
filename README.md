# Video Canvas Demonstration

An interactive web-based video player that showcases three overlaid videos with clickable navigation dots and smooth animations.

## Project Structure

```
├── index.html          # Main HTML file
├── script.js           # JavaScript logic
├── README.md           # This file
└── videos/
    ├── c1.mp4          # First video (required)
    ├── c2.mp4          # Second video (required)
    └── c3.mp4          # Third video (required)
```

## Setup Instructions

### 1. Clone the Repository

Open your terminal and run:

```bash
git clone <repository-url>
cd site
```

Replace `<repository-url>` with the actual repository URL.

### 2. Run a Local Web Server

Python comes pre-installed on most computers. Run this command in the project directory:

```bash
python3 -m http.server 8080
```

You should see output like:
```
Serving HTTP on 0.0.0.0 port 8080 (http://0.0.0.0:8080/) ...
```

### 3. Open in Your Browser

Open your web browser and navigate to:

```
http://localhost:8080
```

You should see the demonstration with three clickable dots and your video displayed on the canvas.

## Using Claude Code

If you have Claude Code installed, you can work on this project directly:

### 1. Open Claude Code

From your terminal, navigate to the project directory and run:

```bash
cd /path/to/site
claude
```
