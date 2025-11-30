# CrowdLens Frontend

A modern photo organization and visualization app built with Next.js, React, TypeScript, and Tailwind CSS.

## Features

- 📸 **Photo Upload**: Drag-and-drop or browse to upload photos (single files or entire folders)
- 📁 **Event Organization**: Group photos into events (e.g., "Summer Vacation 2024")
- 📅 **Timeline View**: Photos organized by date with EXIF metadata extraction
- 🗺️ **Map Visualization**: View photos on a world map based on GPS coordinates
- 🌙 **Dark Mode**: Toggle between light and dark themes
- 🔍 **Search & Filter**: Filter events by name, year, or search

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Maps**: React Leaflet + OpenStreetMap
- **EXIF Parsing**: exifr

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

The app will be available at `http://localhost:3000` (or 3001 if 3000 is in use).

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── globals.css         # Global styles + Tailwind
│   ├── layout.tsx          # Root layout with providers
│   └── page.tsx            # Home page
├── components/             # React components
│   ├── AppShell.tsx        # Main app layout
│   ├── Header.tsx          # App header with branding
│   ├── TabSwitcher.tsx     # Navigation tabs
│   ├── UploadArea.tsx      # Drag-and-drop upload
│   ├── EventSelector.tsx   # Modal for choosing event
│   ├── EventList.tsx       # Grid of event cards
│   ├── EventCard.tsx       # Individual event preview
│   ├── EventDetail.tsx     # Expanded event view
│   ├── PhotoGrid.tsx       # Photo thumbnail grid
│   ├── PhotoThumbnail.tsx  # Individual photo preview
│   ├── PhotoModal.tsx      # Full-screen photo viewer
│   ├── PhotoFilters.tsx    # Search and filter controls
│   ├── MapView.tsx         # Map tab container
│   ├── MapContainer.tsx    # Leaflet map (SSR-safe)
│   ├── MapFilters.tsx      # Event filter for map
│   ├── PhotoMapMarker.tsx  # Map marker with popup
│   ├── HelpPanel.tsx       # Help/info panel
│   └── PhotosTab.tsx       # Photos tab container
├── context/                # React Context providers
│   ├── PhotoContext.tsx    # Photos & events state
│   └── ThemeContext.tsx    # Dark mode state
├── types/                  # TypeScript types
│   └── index.ts            # Photo, Event, etc.
└── utils/                  # Utility functions
    ├── helpers.ts          # General utilities
    └── exif.ts             # EXIF extraction
```

## Data Model

### Photo
- `id`: Unique identifier
- `fileName`: Original filename
- `eventId`: Reference to parent event
- `takenAt`: Date photo was taken (from EXIF)
- `uploadedAt`: Date photo was uploaded
- `gpsLat/gpsLng`: GPS coordinates (from EXIF)
- `thumbnailUrl`: Object URL for display

### Event
- `id`: Unique identifier
- `name`: User-defined name
- `createdAt`: Date event was created

## Metadata Extraction

The app automatically extracts EXIF metadata from uploaded photos:
- **Date/Time**: Used to organize photos chronologically
- **GPS Coordinates**: Used to display photos on the map

Photos without metadata still work - they just won't appear on the map and will use upload time instead of capture time.

## State Management

The app uses React Context for state management:
- `PhotoContext`: Manages photos, events, upload state, and filters
- `ThemeContext`: Manages dark mode preference

All data is stored in memory (no backend required for MVP).

## Design Principles

1. **Clean & Minimal**: Subtle shadows, rounded corners, plenty of whitespace
2. **Responsive**: Works on desktop and tablet
3. **Accessible**: Keyboard navigation, ARIA labels, focus states
4. **Performant**: Lazy loading, optimized renders, smooth animations
5. **Modular**: Small, focused components with clear responsibilities

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

Note: Folder upload uses `webkitdirectory` which may not be supported in all browsers.

## License

MIT
