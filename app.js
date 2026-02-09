class InfiniteBoard {
    constructor() {
        this.canvas = document.getElementById('drawingCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.elements = [];
        this.chunks = new Map();
        this.chunkSize = 500;
        this.history = [];
        this.selectedElements = [];

        this.pan = { x: 0, y: 0 };
        this.scale = 1;
        this.currentTool = 'selection';
        this.isDrawing = false;
        this.isDragging = false;
        this.isPanning = false;
        this.isHollow = true;
        this.currentElement = null;

        this.init();
    }

    init() {
        this.resize();
        this.setupListeners();
        this.loadFromLocal();
        this.renderLoop();
    }

    indexElement(el) {
        const x1 = Math.floor(el.x / this.chunkSize);
        const y1 = Math.floor(el.y / this.chunkSize);
        const x2 = Math.floor((el.x + (el.w || 0)) / this.chunkSize);
        const y2 = Math.floor((el.y + (el.h || 0)) / this.chunkSize);

        for (let x = x1; x <= x2; x++) {
            for (let y = y1; y <= y2; y++) {
                const key = `${x},${y}`;
                if (!this.chunks.has(key)) this.chunks.set(key, new Set());
                this.chunks.get(key).add(el);
            }
        }
    }

    rebuildChunks() {
        this.chunks.clear();
        this.elements.forEach(el => this.indexElement(el));
    }

    renderLoop() {
        this.render();
        requestAnimationFrame(() => this.renderLoop());
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save();
        this.ctx.translate(this.pan.x, this.pan.y);
        this.ctx.scale(this.scale, this.scale);

        const vX1 = -this.pan.x / this.scale;
        const vY1 = -this.pan.y / this.scale;
        const vX2 = vX1 + this.canvas.width / this.scale;
        const vY2 = vY1 + this.canvas.height / this.scale;

        const visibleElements = new Set();
        for (let x = Math.floor(vX1 / this.chunkSize); x <= Math.floor(vX2 / this.chunkSize); x++) {
            for (let y = Math.floor(vY1 / this.chunkSize); y <= Math.floor(vY2 / this.chunkSize); y++) {
                const chunk = this.chunks.get(`${x},${y}`);
                if (chunk) chunk.forEach(el => visibleElements.add(el));
            }
        }

        visibleElements.forEach(el => this.drawElement(el));
        if (this.currentElement) this.drawElement(this.currentElement);

        this.selectedElements.forEach(el => {
            this.ctx.setLineDash([5, 5]);
            this.ctx.strokeStyle = '#6965db';
            this.ctx.lineWidth = 1 / this.scale;
            this.ctx.strokeRect(el.x - 5, el.y - 5, (el.w || 0) + 10, (el.h || 0) + 10);
        });

        this.ctx.restore();
    }

    drawElement(el) {
        this.ctx.globalAlpha = el.opacity || 1;
        this.ctx.strokeStyle = el.stroke;
        this.ctx.fillStyle = el.isHollow ? 'transparent' : el.fill;
        this.ctx.lineWidth = el.width;

        if (el.style === 'dashed') this.ctx.setLineDash([10, 5]);
        else if (el.style === 'dotted') this.ctx.setLineDash([2, 4]);
        else this.ctx.setLineDash([]);

        this.ctx.beginPath();
        if (el.type === 'pen') {
            el.points.forEach((p, i) => i === 0 ? this.ctx.moveTo(p.x, p.y) : this.ctx.lineTo(p.x, p.y));
            this.ctx.stroke();
        } else if (el.type === 'rectangle') {
            this.ctx.strokeRect(el.x, el.y, el.w, el.h);
            if (!el.isHollow) this.ctx.fillRect(el.x, el.y, el.w, el.h);
        } else if (el.type === 'ellipse') {
            this.ctx.ellipse(el.x + el.w / 2, el.y + el.h / 2, Math.abs(el.w / 2), Math.abs(el.h / 2), 0, 0, Math.PI * 2);
            this.ctx.stroke();
            if (!el.isHollow) this.ctx.fill();
        } else if (el.type === 'text') {
            this.ctx.font = `${el.width * 5}px sans-serif`;
            this.ctx.textBaseline = "top";
            this.ctx.fillStyle = el.stroke;
            this.ctx.fillText(el.text, el.x, el.y);
        } else if (el.type === 'arrow') {
            this.drawArrow(el);
        }
    }

    drawArrow(el) {
        const x2 = el.x + el.w, y2 = el.y + el.h;
        const angle = Math.atan2(y2 - el.y, x2 - el.x);
        this.ctx.moveTo(el.x, el.y);
        this.ctx.lineTo(x2, y2);
        this.ctx.lineTo(x2 - 15 * Math.cos(angle - Math.PI / 6), y2 - 15 * Math.sin(angle - Math.PI / 6));
        this.ctx.moveTo(x2, y2);
        this.ctx.lineTo(x2 - 15 * Math.cos(angle + Math.PI / 6), y2 - 15 * Math.sin(angle + Math.PI / 6));
        this.ctx.stroke();
    }

    setupListeners() {
        window.onresize = () => this.resize();

        document.querySelectorAll('.tool').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.tool').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentTool = btn.dataset.tool;
            };
        });

        this.canvas.onmousedown = (e) => {
            const pos = this.getMouse(e);
            this.startPos = pos;

            if (e.button === 1 || window.event.spaceKey) { this.isPanning = true; return; }

            if (this.currentTool === 'selection') {
                const hit = this.elements.findLast(el => pos.x > el.x - 5 && pos.x < el.x + (el.w || 0) + 5 && pos.y > el.y - 5 && pos.y < el.y + (el.h || 0) + 5);
                this.selectedElements = hit ? [hit] : [];
                this.isDragging = !!hit;
            } else {
                this.isDrawing = true;
                this.currentElement = this.createElement(pos);
                if (this.currentTool === 'text') {
                    const txt = prompt("Text:");
                    if (txt) { this.currentElement.text = txt; this.elements.push(this.currentElement); this.rebuildChunks(); }
                    this.isDrawing = false; this.currentElement = null;
                }
            }
        };

        window.onmousemove = (e) => {
            const pos = this.getMouse(e);
            if (this.isPanning || (e.buttons === 1 && this.currentTool === 'panning')) {
                this.pan.x += e.movementX; this.pan.y += e.movementY;
            } else if (this.isDragging) {
                const dx = pos.x - this.startPos.x; const dy = pos.y - this.startPos.y;
                this.selectedElements.forEach(el => {
                    el.x += dx; el.y += dy;
                    if (el.points) el.points.forEach(p => { p.x += dx; p.y += dy; });
                });
                this.startPos = pos;
            } else if (this.isDrawing) {
                if (this.currentElement.type === 'pen') this.currentElement.points.push(pos);
                else { this.currentElement.w = pos.x - this.currentElement.x; this.currentElement.h = pos.y - this.currentElement.y; }
            }
        };

        window.onmouseup = () => {
            if (this.isDrawing && this.currentElement) { this.elements.push(this.currentElement); this.rebuildChunks(); this.save(); }
            if (this.isDragging) { this.rebuildChunks(); this.save(); }
            this.isDrawing = false; this.isDragging = false; this.isPanning = false; this.currentElement = null;
        };

        this.canvas.onwheel = (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            const oldS = this.scale;
            this.scale = Math.min(Math.max(0.1, this.scale + delta), 5);
            const ratio = this.scale / oldS;
            this.pan.x = e.clientX - (e.clientX - this.pan.x) * ratio;
            this.pan.y = e.clientY - (e.clientY - this.pan.y) * ratio;
        };

        document.getElementById('toggleFill').onclick = (e) => {
            this.isHollow = !this.isHollow;
            e.target.innerText = this.isHollow ? "Hollow" : "Solid";
        };

        document.getElementById('bgPreset').onchange = (e) => {
            document.getElementById('canvas-container').className = e.target.value;
        };

        document.getElementById('exportJSON').onclick = () => {
            const data = JSON.stringify({ elements: this.elements, pan: this.pan, scale: this.scale });
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = 'board.json'; a.click();
        };

        document.getElementById('importBtn').onclick = () => document.getElementById('fileInput').click();
        document.getElementById('fileInput').onchange = (e) => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const data = JSON.parse(ev.target.result);
                this.elements = data.elements; this.pan = data.pan; this.scale = data.scale;
                this.rebuildChunks();
            };
            reader.readAsText(e.target.files[0]);
        };

        document.getElementById('undoBtn').onclick = () => { if (this.elements.length) { this.elements.pop(); this.rebuildChunks(); } };

        document.getElementById('exportSVG').onclick = () => this.exportSVG();
    }

    createElement(pos) {
        return {
            type: this.currentTool,
            x: pos.x, y: pos.y, w: 0, h: 0,
            stroke: document.getElementById('strokeColor').value,
            fill: document.getElementById('fillColor').value,
            width: parseInt(document.getElementById('strokeWidth').value),
            style: document.getElementById('strokeStyle').value,
            opacity: parseFloat(document.getElementById('opacity').value),
            isHollow: this.isHollow,
            points: this.currentTool === 'pen' ? [pos] : []
        };
    }

    getMouse(e) { return { x: (e.clientX - this.pan.x) / this.scale, y: (e.clientY - this.pan.y) / this.scale }; }
    resize() { this.canvas.width = window.innerWidth; this.canvas.height = window.innerHeight; }
    save() { localStorage.setItem('ib_pro_data', JSON.stringify({ elements: this.elements, pan: this.pan, scale: this.scale })); }
    loadFromLocal() {
        const saved = localStorage.getItem('ib_pro_data');
        if (saved) {
            const data = JSON.parse(saved);
            this.elements = data.elements; this.pan = data.pan; this.scale = data.scale;
            this.rebuildChunks();
        }
    }

    exportSVG() {
        let svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${this.canvas.width}" height="${this.canvas.height}">`;
        svg += `<rect width="100%" height="100%" fill="white" />`;
        this.elements.forEach(el => {
            if (el.type === 'rectangle') svg += `<rect x="${el.x}" y="${el.y}" width="${el.w}" height="${el.h}" fill="${el.isHollow ? 'none' : el.fill}" stroke="${el.stroke}" stroke-width="${el.width}" />`;
        });
        svg += `</svg>`;
        const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
        const a = document.createElement('a'); a.href = url; a.download = 'board.svg'; a.click();
    }
}

new InfiniteBoard();