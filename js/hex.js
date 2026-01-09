// Hexagon Grid System
// Using axial coordinates (q, r) for hex positioning

class Hex {
    constructor(q, r, type = HEX_TYPES.EMPTY) {
        this.q = q;
        this.r = r;
        this.type = type;
        this.unit = null;  // Reference to unit on this hex
    }

    // Get the third coordinate (s) for cube coordinates
    get s() {
        return -this.q - this.r;
    }

    // Convert hex to unique key for storage
    get key() {
        return `${this.q},${this.r}`;
    }

    // Get pixel position for this hex (center point)
    toPixel(size, offsetX = 0, offsetY = 0) {
        const x = size * (Math.sqrt(3) * this.q + Math.sqrt(3) / 2 * this.r) + offsetX;
        const y = size * (3 / 2 * this.r) + offsetY;
        return { x, y };
    }

    // Get all 6 corner points of this hex
    getCorners(size, offsetX = 0, offsetY = 0) {
        const center = this.toPixel(size, offsetX, offsetY);
        const corners = [];
        for (let i = 0; i < 6; i++) {
            const angle = Math.PI / 180 * (60 * i - 30);
            corners.push({
                x: center.x + size * Math.cos(angle),
                y: center.y + size * Math.sin(angle)
            });
        }
        return corners;
    }

    // Get neighboring hex coordinates
    static getNeighborDirections() {
        return [
            { q: 1, r: 0 },   // East
            { q: 1, r: -1 },  // Northeast
            { q: 0, r: -1 },  // Northwest
            { q: -1, r: 0 },  // West
            { q: -1, r: 1 },  // Southwest
            { q: 0, r: 1 }    // Southeast
        ];
    }

    getNeighborCoords() {
        return Hex.getNeighborDirections().map(dir => ({
            q: this.q + dir.q,
            r: this.r + dir.r
        }));
    }

    // Calculate distance to another hex
    distanceTo(other) {
        return (Math.abs(this.q - other.q) +
                Math.abs(this.q + this.r - other.q - other.r) +
                Math.abs(this.r - other.r)) / 2;
    }

    // Check if coordinates are equal
    equals(other) {
        return this.q === other.q && this.r === other.r;
    }
}

class HexGrid {
    constructor(radius) {
        this.radius = radius;
        this.hexes = new Map();  // Key: "q,r", Value: Hex
        this.generateGrid();
    }

    // Generate a hexagonal-shaped grid
    generateGrid() {
        for (let q = -this.radius; q <= this.radius; q++) {
            const r1 = Math.max(-this.radius, -q - this.radius);
            const r2 = Math.min(this.radius, -q + this.radius);
            for (let r = r1; r <= r2; r++) {
                const hex = new Hex(q, r);
                this.hexes.set(hex.key, hex);
            }
        }
        this.placeSpecialHexes();
    }

    // Place training hexes and spawn points
    placeSpecialHexes() {
        const hexArray = Array.from(this.hexes.values());

        // Place spawn points on opposite sides
        const p1Spawn = this.getHex(-this.radius + 1, 0) || this.getHex(-this.radius, 0);
        const p2Spawn = this.getHex(this.radius - 1, 0) || this.getHex(this.radius, 0);

        if (p1Spawn) p1Spawn.type = HEX_TYPES.SPAWN_P1;
        if (p2Spawn) p2Spawn.type = HEX_TYPES.SPAWN_P2;

        // Place training hexes somewhat randomly but balanced
        const trainingTypes = [
            HEX_TYPES.FOREST,
            HEX_TYPES.MINE,
            HEX_TYPES.FARM,
            HEX_TYPES.BARRACKS,
            HEX_TYPES.ARCHERY_RANGE,
            HEX_TYPES.STABLE,
            HEX_TYPES.WATCHTOWER,
            HEX_TYPES.SHADOW_CAMP
        ];

        // Get empty hexes (not spawn points)
        const emptyHexes = hexArray.filter(h => h.type === HEX_TYPES.EMPTY);

        // Shuffle empty hexes
        this.shuffleArray(emptyHexes);

        // Place each training type twice (for balance - one per "side")
        let placedCount = 0;
        const numEachType = Math.max(1, Math.floor(this.radius / 2));

        for (const type of trainingTypes) {
            for (let i = 0; i < numEachType && placedCount < emptyHexes.length; i++) {
                emptyHexes[placedCount].type = type;
                placedCount++;
            }
        }
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // Get hex by coordinates
    getHex(q, r) {
        return this.hexes.get(`${q},${r}`);
    }

    // Get hex from pixel coordinates
    pixelToHex(x, y, size, offsetX = 0, offsetY = 0) {
        const adjustedX = x - offsetX;
        const adjustedY = y - offsetY;

        const q = (Math.sqrt(3) / 3 * adjustedX - 1 / 3 * adjustedY) / size;
        const r = (2 / 3 * adjustedY) / size;

        return this.roundHex(q, r);
    }

    // Round fractional hex coordinates to nearest hex
    roundHex(q, r) {
        const s = -q - r;

        let rq = Math.round(q);
        let rr = Math.round(r);
        let rs = Math.round(s);

        const qDiff = Math.abs(rq - q);
        const rDiff = Math.abs(rr - r);
        const sDiff = Math.abs(rs - s);

        if (qDiff > rDiff && qDiff > sDiff) {
            rq = -rr - rs;
        } else if (rDiff > sDiff) {
            rr = -rq - rs;
        }

        return this.getHex(rq, rr);
    }

    // Get all hexes within range of a hex
    getHexesInRange(centerHex, range) {
        const results = [];
        for (let q = -range; q <= range; q++) {
            for (let r = Math.max(-range, -q - range); r <= Math.min(range, -q + range); r++) {
                const hex = this.getHex(centerHex.q + q, centerHex.r + r);
                if (hex && !hex.equals(centerHex)) {
                    results.push(hex);
                }
            }
        }
        return results;
    }

    // Get neighbors of a hex
    getNeighbors(hex) {
        return hex.getNeighborCoords()
            .map(coord => this.getHex(coord.q, coord.r))
            .filter(h => h !== undefined);
    }

    // Find path between two hexes (BFS for now)
    findPath(startHex, endHex, maxRange, canPassThrough = () => true) {
        if (startHex.distanceTo(endHex) > maxRange) {
            return null;
        }

        const queue = [{ hex: startHex, path: [] }];
        const visited = new Set([startHex.key]);

        while (queue.length > 0) {
            const { hex, path } = queue.shift();

            if (hex.equals(endHex)) {
                return path;
            }

            if (path.length >= maxRange) {
                continue;
            }

            for (const neighbor of this.getNeighbors(hex)) {
                if (!visited.has(neighbor.key) && canPassThrough(neighbor)) {
                    visited.add(neighbor.key);
                    queue.push({
                        hex: neighbor,
                        path: [...path, neighbor]
                    });
                }
            }
        }

        return null;
    }

    // Get all hexes a unit can move to
    getReachableHexes(startHex, moveRange, canPassThrough = () => true) {
        const reachable = new Map();
        const queue = [{ hex: startHex, distance: 0 }];
        const visited = new Set([startHex.key]);

        while (queue.length > 0) {
            const { hex, distance } = queue.shift();

            if (distance > 0) {
                reachable.set(hex.key, hex);
            }

            if (distance >= moveRange) {
                continue;
            }

            for (const neighbor of this.getNeighbors(hex)) {
                if (!visited.has(neighbor.key) && canPassThrough(neighbor)) {
                    visited.add(neighbor.key);
                    queue.push({
                        hex: neighbor,
                        distance: distance + 1
                    });
                }
            }
        }

        return Array.from(reachable.values());
    }
}

// Hex Renderer
class HexRenderer {
    constructor(canvas, grid) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.grid = grid;
        this.hexSize = HEX_SIZE;
        this.offsetX = 0;
        this.offsetY = 0;
        this.hoveredHex = null;
        this.selectedHex = null;
        this.highlightedHexes = [];  // For showing valid moves/attacks
        this.highlightColor = 'rgba(255, 255, 255, 0.3)';

        this.calculateDimensions();
    }

    calculateDimensions() {
        // Calculate canvas size needed
        const width = this.hexSize * Math.sqrt(3) * (2 * this.grid.radius + 1);
        const height = this.hexSize * 2 * (2 * this.grid.radius + 1);

        this.canvas.width = width + 40;
        this.canvas.height = height + 40;

        this.offsetX = this.canvas.width / 2;
        this.offsetY = this.canvas.height / 2;
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw all hexes
        for (const hex of this.grid.hexes.values()) {
            this.drawHex(hex);
        }

        // Draw highlighted hexes (valid moves/attacks)
        for (const hex of this.highlightedHexes) {
            this.drawHexHighlight(hex, this.highlightColor);
        }

        // Draw selected hex
        if (this.selectedHex) {
            this.drawHexHighlight(this.selectedHex, 'rgba(255, 215, 0, 0.5)');
        }

        // Draw hovered hex
        if (this.hoveredHex) {
            this.drawHexHighlight(this.hoveredHex, 'rgba(255, 255, 255, 0.2)');
        }

        // Draw units
        for (const hex of this.grid.hexes.values()) {
            if (hex.unit) {
                this.drawUnit(hex, hex.unit);
            }
        }
    }

    drawHex(hex) {
        const corners = hex.getCorners(this.hexSize, this.offsetX, this.offsetY);

        this.ctx.beginPath();
        this.ctx.moveTo(corners[0].x, corners[0].y);
        for (let i = 1; i < 6; i++) {
            this.ctx.lineTo(corners[i].x, corners[i].y);
        }
        this.ctx.closePath();

        // Fill with type color
        this.ctx.fillStyle = HEX_COLORS[hex.type] || HEX_COLORS[HEX_TYPES.EMPTY];
        this.ctx.fill();

        // Draw border
        this.ctx.strokeStyle = '#1a1a2e';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Draw hex type icon/indicator
        this.drawHexIcon(hex);
    }

    drawHexIcon(hex) {
        const center = hex.toPixel(this.hexSize, this.offsetX, this.offsetY);
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = 'rgba(255,255,255,0.7)';

        const icons = {
            [HEX_TYPES.FOREST]: '🌲',
            [HEX_TYPES.MINE]: '⛏️',
            [HEX_TYPES.FARM]: '🌾',
            [HEX_TYPES.BARRACKS]: '⚔️',
            [HEX_TYPES.ARCHERY_RANGE]: '🏹',
            [HEX_TYPES.STABLE]: '🐎',
            [HEX_TYPES.WATCHTOWER]: '👁️',
            [HEX_TYPES.SHADOW_CAMP]: '🌑',
            [HEX_TYPES.SPAWN_P1]: 'P1',
            [HEX_TYPES.SPAWN_P2]: 'P2'
        };

        if (icons[hex.type]) {
            this.ctx.font = '16px Arial';
            this.ctx.fillText(icons[hex.type], center.x, center.y + this.hexSize * 0.3);
        }
    }

    drawHexHighlight(hex, color) {
        const corners = hex.getCorners(this.hexSize, this.offsetX, this.offsetY);

        this.ctx.beginPath();
        this.ctx.moveTo(corners[0].x, corners[0].y);
        for (let i = 1; i < 6; i++) {
            this.ctx.lineTo(corners[i].x, corners[i].y);
        }
        this.ctx.closePath();

        this.ctx.fillStyle = color;
        this.ctx.fill();
    }

    drawUnit(hex, unit) {
        const center = hex.toPixel(this.hexSize, this.offsetX, this.offsetY);
        const radius = this.hexSize * 0.4;

        // Draw unit circle
        this.ctx.beginPath();
        this.ctx.arc(center.x, center.y - 5, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = unit.owner === 1 ? '#4da6ff' : '#ff6b6b';
        this.ctx.fill();
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Draw rank indicator (number of abilities)
        const rank = unit.getRank();
        if (rank > 0) {
            this.ctx.font = 'bold 10px Arial';
            this.ctx.fillStyle = '#fff';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(rank.toString(), center.x, center.y - 5);
        }

        // Draw HP bar
        const hpBarWidth = this.hexSize * 0.6;
        const hpBarHeight = 4;
        const hpPercent = unit.hp / unit.maxHp;

        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(
            center.x - hpBarWidth / 2,
            center.y - 5 - radius - 8,
            hpBarWidth,
            hpBarHeight
        );

        this.ctx.fillStyle = hpPercent > 0.5 ? '#4caf50' : hpPercent > 0.25 ? '#ff9800' : '#f44336';
        this.ctx.fillRect(
            center.x - hpBarWidth / 2,
            center.y - 5 - radius - 8,
            hpBarWidth * hpPercent,
            hpBarHeight
        );

        // Draw action indicator if unit has acted
        if (unit.hasActed) {
            this.ctx.globalAlpha = 0.5;
            this.ctx.beginPath();
            this.ctx.arc(center.x, center.y - 5, radius, 0, Math.PI * 2);
            this.ctx.fillStyle = '#000';
            this.ctx.fill();
            this.ctx.globalAlpha = 1.0;
        }
    }

    // Convert canvas coordinates to hex
    getHexAtPoint(canvasX, canvasY) {
        return this.grid.pixelToHex(canvasX, canvasY, this.hexSize, this.offsetX, this.offsetY);
    }

    setHoveredHex(hex) {
        this.hoveredHex = hex;
    }

    setSelectedHex(hex) {
        this.selectedHex = hex;
    }

    setHighlightedHexes(hexes, color = 'rgba(255, 255, 255, 0.3)') {
        this.highlightedHexes = hexes;
        this.highlightColor = color;
    }

    clearHighlights() {
        this.highlightedHexes = [];
        this.selectedHex = null;
    }
}
