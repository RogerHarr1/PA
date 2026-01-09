// Main Game Controller

class Game {
    constructor() {
        this.grid = null;
        this.renderer = null;
        this.combat = new CombatSystem(this);
        this.training = new TrainingSystem(this);
        this.gathering = new GatheringSystem(this);

        this.currentPlayer = 1;
        this.turnNumber = 1;
        this.phase = PHASES.MOVE;
        this.selectedUnit = null;
        this.gameStarted = false;

        // Player resources
        this.resources = {
            1: { ...BALANCE.STARTING_RESOURCES },
            2: { ...BALANCE.STARTING_RESOURCES }
        };

        // Player units
        this.units = {
            1: [],
            2: []
        };

        this.combatLog = [];
        this.maxLogEntries = 50;

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Board size selection
        document.querySelectorAll('.size-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const size = parseInt(e.target.dataset.size);
                this.startGame(size);
            });
        });

        // Action buttons
        document.getElementById('btn-spawn').addEventListener('click', () => this.trySpawnUnit());
        document.getElementById('btn-end-turn').addEventListener('click', () => this.endTurn());
        document.getElementById('btn-train').addEventListener('click', () => this.tryTrain());
        document.getElementById('btn-gather').addEventListener('click', () => this.tryGather());
        document.getElementById('btn-attack').addEventListener('click', () => this.enterAttackMode());
    }

    startGame(boardSize) {
        // Create grid
        this.grid = new HexGrid(boardSize);

        // Setup canvas and renderer
        const canvas = document.getElementById('game-board');
        canvas.classList.add('visible');
        document.getElementById('board-size-selector').classList.add('hidden');

        this.renderer = new HexRenderer(canvas, this.grid);

        // Setup canvas event listeners
        this.setupCanvasEvents(canvas);

        // Spawn starting units
        this.spawnStartingUnits();

        this.gameStarted = true;
        this.updateUI();
        this.renderer.render();

        this.addLog('Game started!', 'info');
        this.addLog('Player 1\'s turn', 'info');
    }

    setupCanvasEvents(canvas) {
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const hex = this.renderer.getHexAtPoint(x, y);
            this.renderer.setHoveredHex(hex);
            this.updateHexInfo(hex);
            this.renderer.render();
        });

        canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const hex = this.renderer.getHexAtPoint(x, y);
            this.handleHexClick(hex);
        });

        canvas.addEventListener('mouseleave', () => {
            this.renderer.setHoveredHex(null);
            this.renderer.render();
        });
    }

    spawnStartingUnits() {
        // Find spawn hexes and create starting units
        for (const hex of this.grid.hexes.values()) {
            if (hex.type === HEX_TYPES.SPAWN_P1) {
                this.createUnit(1, hex);
            } else if (hex.type === HEX_TYPES.SPAWN_P2) {
                this.createUnit(2, hex);
            }
        }
    }

    createUnit(player, hex) {
        if (hex.unit) return null;  // Hex occupied

        const unit = new Unit(player, hex);
        hex.unit = unit;
        this.units[player].push(unit);
        return unit;
    }

    handleHexClick(hex) {
        if (!hex || !this.gameStarted) return;

        // If in attack mode
        if (this.attackMode && this.selectedUnit) {
            this.handleAttackClick(hex);
            return;
        }

        // If we have a selected unit and click a valid move destination
        if (this.selectedUnit && !hex.unit) {
            const validMoves = this.getValidMoves(this.selectedUnit);
            if (validMoves.some(h => h.equals(hex))) {
                this.moveUnit(this.selectedUnit, hex);
                return;
            }
        }

        // Select unit on this hex
        if (hex.unit) {
            this.selectUnit(hex.unit);
        } else {
            this.deselectUnit();
        }
    }

    handleAttackClick(hex) {
        if (!hex.unit || hex.unit.owner === this.currentPlayer) {
            this.exitAttackMode();
            return;
        }

        // Check if this is a valid target
        const validTargets = this.combat.getValidTargets(this.selectedUnit);
        if (validTargets.some(h => h.equals(hex))) {
            const result = this.combat.attack(this.selectedUnit, hex.unit);
            for (const log of result.logs) {
                this.addLog(log, result.defenderDied ? 'death' : 'damage');
            }
            this.exitAttackMode();
            this.updateUI();
            this.renderer.render();
            this.checkWinCondition();
        }
    }

    selectUnit(unit) {
        this.selectedUnit = unit;
        this.renderer.setSelectedHex(unit.hex);

        // Show valid moves if it's this player's unit
        if (unit.owner === this.currentPlayer && unit.canMove()) {
            const validMoves = this.getValidMoves(unit);
            this.renderer.setHighlightedHexes(validMoves, 'rgba(100, 200, 100, 0.4)');
        } else {
            this.renderer.setHighlightedHexes([]);
        }

        this.updateSelectedUnitPanel();
        this.renderer.render();
    }

    deselectUnit() {
        this.selectedUnit = null;
        this.renderer.clearHighlights();
        this.updateSelectedUnitPanel();
        this.renderer.render();
    }

    getValidMoves(unit) {
        if (!unit.canMove()) return [];

        const moveRange = unit.getMoveRange();
        return this.grid.getReachableHexes(
            unit.hex,
            moveRange,
            (hex) => !hex.unit  // Can't pass through other units
        );
    }

    moveUnit(unit, toHex) {
        if (!unit.canMove()) return false;

        const fromHex = unit.hex;

        // Clear old hex
        fromHex.unit = null;

        // Move to new hex
        toHex.unit = unit;
        unit.hex = toHex;
        unit.hasMoved = true;

        // Reset training counter if hex changed
        if (!fromHex.equals(toHex)) {
            unit.turnsOnCurrentHex = 0;
        }

        // Uncloak if hidden
        if (unit.isHidden) {
            unit.isHidden = false;
            this.addLog(`P${unit.owner} unit revealed!`, 'info');
        }

        this.deselectUnit();
        this.selectUnit(unit);  // Re-select to update valid moves
        this.updateUI();
        this.renderer.render();

        return true;
    }

    enterAttackMode() {
        if (!this.selectedUnit || !this.selectedUnit.canAct()) return;

        this.attackMode = true;
        const validTargets = this.combat.getValidTargets(this.selectedUnit);
        this.renderer.setHighlightedHexes(validTargets, 'rgba(255, 100, 100, 0.5)');
        this.renderer.render();
        this.addLog('Select a target to attack', 'info');
    }

    exitAttackMode() {
        this.attackMode = false;
        if (this.selectedUnit) {
            this.selectUnit(this.selectedUnit);  // Reset highlights
        }
    }

    trySpawnUnit() {
        if (this.resources[this.currentPlayer][RESOURCES.FOOD] < BALANCE.SPAWN_COST) {
            this.addLog('Not enough food to spawn!', 'info');
            return;
        }

        // Find spawn hex for current player
        const spawnType = this.currentPlayer === 1 ? HEX_TYPES.SPAWN_P1 : HEX_TYPES.SPAWN_P2;
        let spawnHex = null;

        for (const hex of this.grid.hexes.values()) {
            if (hex.type === spawnType && !hex.unit) {
                spawnHex = hex;
                break;
            }
        }

        if (!spawnHex) {
            this.addLog('Spawn point is occupied!', 'info');
            return;
        }

        // Deduct cost and spawn
        this.resources[this.currentPlayer][RESOURCES.FOOD] -= BALANCE.SPAWN_COST;
        this.createUnit(this.currentPlayer, spawnHex);
        this.addLog(`P${this.currentPlayer} spawned a new recruit!`, 'info');
        this.updateUI();
        this.renderer.render();
    }

    tryTrain() {
        if (!this.selectedUnit || this.selectedUnit.owner !== this.currentPlayer) return;

        const unit = this.selectedUnit;
        const trainingInfo = this.training.getTrainingInfo(unit.hex);

        if (!trainingInfo) {
            this.addLog('This hex doesn\'t train anything', 'info');
            return;
        }

        if (!this.training.canTrain(unit)) {
            this.addLog(`${trainingInfo.abilityName} is already maxed!`, 'info');
            return;
        }

        this.addLog(`Training... Stay here next turn to learn ${trainingInfo.abilityName}`, 'info');
    }

    tryGather() {
        if (!this.selectedUnit || this.selectedUnit.owner !== this.currentPlayer) return;

        const result = this.gathering.gather(this.selectedUnit);
        if (result.success) {
            this.addLog(result.message, result.leveledUp ? 'level-up' : 'info');
            this.updateUI();
            this.renderer.render();
        } else {
            this.addLog(result.error || 'Cannot gather here', 'info');
        }
    }

    endTurn() {
        // Process end of turn for current player
        for (const unit of this.units[this.currentPlayer]) {
            unit.resetTurn();
        }

        // Switch player
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;

        // If back to player 1, increment turn
        if (this.currentPlayer === 1) {
            this.turnNumber++;
        }

        // Process training at start of turn
        const trainingLogs = this.training.processTraining(this.currentPlayer);
        for (const log of trainingLogs) {
            this.addLog(log, 'level-up');
        }

        // Reset attacks received for gang-up mechanic
        for (const unit of this.units[this.currentPlayer]) {
            unit.attacksReceivedThisTurn = 0;
        }

        this.deselectUnit();
        this.addLog(`Turn ${this.turnNumber} - Player ${this.currentPlayer}'s turn`, 'info');
        this.updateUI();
        this.renderer.render();
    }

    addResource(player, resource, amount) {
        this.resources[player][resource] += amount;
    }

    checkWinCondition() {
        // Remove dead units from lists
        this.units[1] = this.units[1].filter(u => u.hp > 0);
        this.units[2] = this.units[2].filter(u => u.hp > 0);

        if (this.units[1].length === 0) {
            this.addLog('PLAYER 2 WINS!', 'death');
            this.gameStarted = false;
        } else if (this.units[2].length === 0) {
            this.addLog('PLAYER 1 WINS!', 'death');
            this.gameStarted = false;
        }
    }

    // UI Updates
    updateUI() {
        // Update turn info
        document.getElementById('current-player').textContent = `Player ${this.currentPlayer}`;
        document.getElementById('current-player').className = this.currentPlayer === 1 ? 'player1' : 'player2';

        // Update resources for current player
        const res = this.resources[this.currentPlayer];
        document.getElementById('wood-count').textContent = res[RESOURCES.WOOD];
        document.getElementById('ore-count').textContent = res[RESOURCES.ORE];
        document.getElementById('food-count').textContent = res[RESOURCES.FOOD];

        // Update spawn button
        const spawnBtn = document.getElementById('btn-spawn');
        spawnBtn.disabled = res[RESOURCES.FOOD] < BALANCE.SPAWN_COST;

        this.updateSelectedUnitPanel();
    }

    updateSelectedUnitPanel() {
        const noSelection = document.getElementById('no-selection');
        const unitDetails = document.getElementById('unit-details');
        const trainBtn = document.getElementById('btn-train');
        const gatherBtn = document.getElementById('btn-gather');
        const attackBtn = document.getElementById('btn-attack');

        if (!this.selectedUnit) {
            noSelection.classList.remove('hidden');
            unitDetails.classList.add('hidden');
            return;
        }

        noSelection.classList.add('hidden');
        unitDetails.classList.remove('hidden');

        const unit = this.selectedUnit;

        // Owner
        document.getElementById('unit-owner').textContent = `Player ${unit.owner}'s Unit`;
        document.getElementById('unit-owner').className = unit.owner === 1 ? 'player1' : 'player2';

        // HP
        document.getElementById('unit-hp').textContent = `HP: ${unit.hp}/${unit.maxHp}`;

        // Abilities
        const abilitiesDiv = document.getElementById('unit-abilities');
        const abilities = unit.getAbilityList();
        if (abilities.length === 0) {
            abilitiesDiv.innerHTML = '<div class="ability-item"><span class="ability-name">Untrained Recruit</span></div>';
        } else {
            abilitiesDiv.innerHTML = abilities.map(a => `
                <div class="ability-item">
                    <span class="ability-name">${a.name}</span>
                    <span class="ability-level">${'★'.repeat(a.level)}${'☆'.repeat(3 - a.level)}</span>
                </div>
            `).join('');
        }

        // Action buttons
        const isOwned = unit.owner === this.currentPlayer;

        // Train button
        if (isOwned && this.training.canTrain(unit)) {
            trainBtn.classList.remove('hidden');
            const info = this.training.getTrainingInfo(unit.hex);
            trainBtn.textContent = `Train ${info.abilityName}`;
        } else {
            trainBtn.classList.add('hidden');
        }

        // Gather button
        if (isOwned && this.gathering.canGather(unit)) {
            gatherBtn.classList.remove('hidden');
            const preview = this.gathering.getGatherPreview(unit);
            gatherBtn.textContent = `Gather ${preview.amount} ${preview.resource}`;
        } else {
            gatherBtn.classList.add('hidden');
        }

        // Attack button
        const validTargets = this.combat.getValidTargets(unit);
        if (isOwned && unit.canAct() && validTargets.length > 0) {
            attackBtn.classList.remove('hidden');
        } else {
            attackBtn.classList.add('hidden');
        }
    }

    updateHexInfo(hex) {
        const hexType = document.getElementById('hex-type');
        const hexCoords = document.getElementById('hex-coords');
        const hexTraining = document.getElementById('hex-training-info');

        if (!hex) {
            hexType.textContent = 'Hover over a hex';
            hexCoords.textContent = '';
            hexTraining.textContent = '';
            return;
        }

        hexType.textContent = HEX_NAMES[hex.type] || 'Unknown';
        hexCoords.textContent = `(${hex.q}, ${hex.r})`;

        const trainingInfo = this.training.getTrainingInfo(hex);
        if (trainingInfo) {
            hexTraining.textContent = `Teaches: ${trainingInfo.abilityName}`;
        } else {
            hexTraining.textContent = '';
        }
    }

    addLog(message, type = 'info') {
        this.combatLog.unshift({ message, type, turn: this.turnNumber });
        if (this.combatLog.length > this.maxLogEntries) {
            this.combatLog.pop();
        }
        this.updateCombatLog();
    }

    updateCombatLog() {
        const logDiv = document.getElementById('combat-log');
        logDiv.innerHTML = this.combatLog.slice(0, 15).map(entry => `
            <div class="log-entry ${entry.type}">${entry.message}</div>
        `).join('');
    }
}

// Start the game when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});
