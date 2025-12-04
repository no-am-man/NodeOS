# WebFrameOS

WebFrameOS is a simulated desktop environment that runs entirely in your web browser. It features a fully functional windowing system, a taskbar, an application launcher, and several built-in and web-based applications. The project is designed to showcase modern web technologies and provide a flexible platform for building and integrating web-based tools in a familiar desktop interface.

The application state, including the position of open windows and the current desktop background, is persisted in real-time using Firebase.

![WebFrameOS Screenshot](https://storage.googleapis.com/stedi-assets/misc/webframeos-screenshot.png)

## Features

- **Window Management**: Draggable, resizable, and focus-aware windows with minimize, maximize, and close controls.
- **Persistent State**: Window layouts and the desktop background are saved to Firebase Realtime Database, so your session is restored on reload.
- **App Launcher & Taskbar**: Easily launch applications and manage open windows from a familiar taskbar interface.
- **Theming**: Seamlessly switch between light and dark modes.
- **AI-Powered Backgrounds**: Generate unique, abstract desktop wallpapers on-demand using generative AI.
- **Built-in Applications**:
  - **Welcome**: A simple welcome screen.
  - **Settings**: Customize the OS appearance.
  - **Calculator**: A basic calculator for quick math.
  - **Terminal**: A mock terminal with a few commands (`help`, `ps`, `date`, `echo`, `clear`).
  - **AI Assistant**: A chat interface powered by a generative AI model.
  - **Contacts**: A video-conferencing app using WebRTC for real-time communication.
- **Embedded Web Apps**: Demonstrates embedding third-party web applications like a code editor (StackBlitz), a whiteboard (tldraw), and more.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [ShadCN UI](https://ui.shadcn.com/)
- **State Management**: React Context with `useReducer` for OS-level state.
- **Database**: [Firebase Realtime Database](https://firebase.google.com/docs/database) for session persistence.
- **Generative AI**: [Genkit](https://firebase.google.com/docs/genkit) with Google's Gemini models for AI features.
- **Real-time Communication**: [WebRTC](https://webrtc.org/) for the Contacts video calling feature.

## Getting Started

This project is set up to run in a cloud-based development environment like Firebase Studio.

### Prerequisites

- Node.js
- npm (or a compatible package manager)
- A Firebase project with Realtime Database enabled.

### Installation & Running Locally

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd <your-repo-directory>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    Create a `.env.local` file in the root of the project and populate it with your Firebase and Genkit API keys.

    ```env
    # Firebase Config
    NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
    NEXT_PUBLIC_FIREBASE_DATABASE_URL=your-database-url
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
    NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

    # Genkit - Google AI
    GEMINI_API_KEY=your-gemini-api-key
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

The application will be available at `http://localhost:9002`.

## Project Structure

- `src/app/`: The root of the Next.js application.
- `src/components/apps/`: Contains the React components for each built-in application.
- `src/components/system/`: Core UI components for the OS, such as `Desktop`, `Window`, and `Taskbar`.
- `src/components/ui/`: Auto-generated ShadCN UI components.
- `src/contexts/OsContext.tsx`: The heart of the application, containing the state reducer and logic for managing windows and OS-level actions.
- `src/lib/apps.ts`: A registry file that defines all available applications, their icons, components, and default sizes.
- `src/lib/firebase.ts`: Firebase initialization and configuration.
- `src/hooks/`: Custom React hooks used throughout the application.
- `src/ai/`: Contains Genkit flows for generative AI features.
  - `flows/`: Specific AI flows, like generating the desktop background.
- `public/`: Static assets.
