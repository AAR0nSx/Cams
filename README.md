# NewTek NDI Control


NewTek NDI Control is a desktop application built with Electron for remotely controlling multiple NewTek NDI PTZ cameras from a single, unified interface. It provides comprehensive access to camera settings, movement controls, and presets by communicating directly with the cameras' CGI API.

## Features

- **Multi-Camera Management:** Control up to four cameras simultaneously, with a dedicated UI for each configured IP address.
- **Real-time Status:** A status indicator for each camera shows if it is online (green), on the wrong network segment (yellow), or offline (red).
- **Comprehensive PTZ Control:** Full pan, tilt, and zoom capabilities, including diagonal movement and a fine-grained zoom slider.
- **Exposure Settings:** Adjust exposure mode (Full Auto, Manual, Shutter/Iris Priority), shutter speed, gain, gamma, iris, and exposure compensation.
- **Focus Adjustment:** Switch between auto and manual focus modes and precisely control the manual focus range.
- **White Balance:** Configure white balance mode, trigger "One Push WB", and manually adjust red and blue gain levels.
- **Image Quality:** Fine-tune brightness, saturation, and sharpness.
- **Preset System:** Store up to four camera presets and recall them with a single click. The UI waits for the camera movement to stabilize before updating its state.
- **Persistent Configuration:** A dedicated settings panel allows you to configure camera IP addresses and toggle a dark mode theme. Settings are saved locally.
- **Web UI Access:** Quickly open a camera's native web interface by clicking its name and IP address in the UI.

## Tech Stack

- **Framework:** Electron
- **Backend/Main Process:** Node.js
- **Frontend:** HTML5, Tailwind CSS, JavaScript
- **Dependencies:**
    - `needle`: For making HTTP requests to cameras.
    - `electron-store`: For persisting application settings.

## Getting Started

### Prerequisites

- Node.js and npm must be installed on your system.
- One or more NewTek NDI compatible PTZ cameras accessible on your network.

### Installation & Running

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/aar0nsx/cams.git
    cd cams
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the application in development mode:**
    ```bash
    npm start
    ```

### Building the Application

You can create a distributable installer for Windows or macOS using Electron Builder.

```bash
npm run dist
```

The packaged application will be located in the `dist/` directory.

## Configuration

1.  Launch the application.
2.  Click the "⚙️ Einstellungen" (Settings) button in the top-right corner.
3.  In the settings window, enter the IP addresses for each camera you wish to control.
4.  Optionally, enable or disable the "Dark Mode" toggle.
5.  Click the "Speichern" (Save) button. The application will restart or update to display the control panels for the configured cameras.

## Project Structure

- `main.js`: The Electron main process. It creates the application windows, handles all IPC (Inter-Process Communication), and sends CGI commands to the cameras.
- `preload.js`: A script that securely exposes a controlled set of IPC functions from the main process to the renderer process.
- `UI/index.html`: The main application window that houses the camera control panels.
- `UI/renderer.js`: The frontend logic for `index.html`. It dynamically renders camera UIs, handles user interactions (button clicks, slider changes), and communicates with the main process.
- `UI/settings.html`: The markup and logic for the application's settings window.
- `package.json`: Defines project metadata, dependencies, and build scripts.
