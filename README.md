# Proxy Browser

A full-featured web proxy browser with a Chrome-like interface, built with Next.js and Shadcn UI. Browse the web securely through a server-side proxy with built-in ad blocking and page darkening features.

## Features

- 🌐 **Proxy Browsing**: Route all web traffic through a server-side proxy to bypass CORS restrictions
- 🎨 **Chrome-like UI**: Familiar browser interface with tabs, address bar, and navigation controls
- 🚫 **Ad Blocking**: Built-in ad blocking using domain and pattern filtering
- 🌙 **Page Darkening**: Apply dark mode to any website
- ⚡ **Fast & Modern**: Built with Next.js 14+ and React
- 🎯 **Tab Management**: Multiple tabs with persistent state
- ⚙️ **Customizable Settings**: Configure ad blocking and page darkening preferences

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **UI Components**: Shadcn UI
- **Styling**: TailwindCSS
- **State Management**: Zustand
- **Icons**: Lucide React
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd proxy-browser
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment

### Vercel (Recommended)

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

The `vercel.json` configuration is already set up with optimized function timeouts.

### Netlify

1. Install Netlify CLI:
```bash
npm i -g netlify-cli
```

2. Deploy:
```bash
netlify deploy --prod
```

The `netlify.toml` configuration is already included.

## Usage

### Basic Browsing

1. Click the "+" button or press Ctrl+T to open a new tab
2. Enter a URL or search query in the address bar
3. Press Enter to navigate

### Settings

Access settings from the browser menu (three dots) to:
- Toggle ad blocking on/off
- Enable/disable page darkening by default
- View information about the browser

### Keyboard Shortcuts

- **New Tab**: Click the + button
- **Close Tab**: Click the X on any tab
- **Navigate**: Enter URL or search in address bar

## Known Limitations

Due to serverless platform constraints (Vercel/Netlify):

- **Timeout Limits**: Pages that take longer than 60 seconds to load may timeout
- **Payload Size**: Pages larger than 4.5MB may fail to load
- **Streaming Content**: Videos and large downloads may not work reliably
- **Anti-Bot Protection**: Some sites with aggressive bot protection may block proxy requests
- **JavaScript-Heavy Sites**: Some modern SPAs may not work perfectly through the proxy

## Architecture

```
proxy-browser/
├── app/
│   ├── api/proxy/          # Proxy API endpoint
│   ├── settings/           # Settings page
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # New tab page
│   └── globals.css         # Global styles
├── components/
│   └── browser/            # Browser UI components
│       ├── browser-chrome.tsx
│       ├── tab-bar.tsx
│       ├── address-bar.tsx
│       ├── browser-menu.tsx
│       └── content-frame.tsx
├── hooks/
│   └── use-browser-state.ts  # Browser state management
├── lib/
│   └── proxy/
│       ├── url-rewriter.ts    # URL rewriting utilities
│       └── content-filter.ts  # Ad blocking logic
└── components/ui/          # Shadcn UI components
```

## How It Works

1. **Proxy Backend**: The `/api/proxy` endpoint fetches external URLs server-side
2. **URL Rewriting**: All URLs in HTML are rewritten to route through the proxy
3. **Ad Blocking**: Requests to known ad domains are blocked, and ad elements are removed from HTML
4. **Page Darkening**: CSS filters are injected into pages to apply dark mode
5. **State Management**: Zustand manages tab state and settings with localStorage persistence

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for any purpose.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [Shadcn UI](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
