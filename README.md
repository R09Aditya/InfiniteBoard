# InfiniteBoard Pro

InfiniteBoard Pro is a lightweight, browser-based **infinite whiteboard** built using pure HTML Canvas and Vanilla JavaScript.  
It works completely on the frontend — **no backend, no login, no frameworks**.

The project focuses on performance, simplicity, and a smooth drawing experience similar to modern whiteboard tools.

---

## Features

- Infinite canvas with smooth **pan and zoom**
- Drawing tools:
  - Selection
  - Pen (freehand)
  - Rectangle
  - Ellipse
  - Arrow
  - Text
- Style controls:
  - Stroke color
  - Fill color (hollow / solid)
  - Stroke width
  - Opacity
  - Stroke styles (solid, dashed, dotted)
- Background presets:
  - Light grid
  - Dark grid
  - Plain
- Undo support
- Auto-save using `localStorage`
- Export & import:
  - Save board as JSON
  - Load board from JSON
  - Export drawing as SVG
- Optimized rendering using spatial chunking for large canvases

---

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript
- HTML Canvas API

No external libraries or frameworks are used.

---

## Project Structure

```
InfinteBoard/
├── index.html # Main UI layout and toolbar
├── main.css # Styling and themes
└── app.js # Canvas engine and interaction logic

```


---

## Getting Started

1. Download or clone the repository
2. Open `index.html` in any modern web browser

No build step or server is required.

---

## Controls

- Left Click: Draw or select elements
- Drag: Move selected elements
- Mouse Wheel: Zoom in / out
- Middle Mouse or Space + Drag: Pan the canvas
- Toolbar: Switch tools, styles, and background

---

## Saving & Exporting

- The board state is automatically saved in the browser
- **Export JSON**: Save editable board data
- **Import JSON**: Restore a previously saved board
- **Save SVG**: Export the drawing as a vector image

---

## Notes

- SVG export currently supports basic shapes
- Text input uses a browser prompt
- Best experienced on desktop devices

---

## License

This project is open for learning, experimentation, and personal use.  
You are free to modify and extend it.

---

## Inspiration

Inspired by modern infinite whiteboard and diagramming tools such as Excalidraw, with a focus on understanding canvas-based rendering and editor-style interactions.
