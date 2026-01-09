// Combat System with Rock-Paper-Scissors Triangle and Gang-Up Mechanic

class CombatSystem {
    constructor(game) {
        this.game = game;
    }

    // Calculate damage from attacker to defender
    calculateDamage(attacker, defender) {
        let damage = attacker.getBaseDamage();

        // Counter bonus (rock-paper-scissors)
        if (attacker.hasAdvantageOver(defender)) {
            damage = Math.floor(damage * BALANCE.COUNTER_DAMAGE_BONUS);
        }

        // Gang-up bonus: defender takes more damage if already hit this turn
        if (defender.attacksReceivedThisTurn > 0) {
            const gangUpMultiplier = 1 + (defender.attacksReceivedThisTurn * BALANCE.GANG_UP_BONUS);
            damage = Math.floor(damage * gangUpMultiplier);
        }

        return Math.max(1, damage);  // Minimum 1 damage
    }

    // Execute an attack
    attack(attacker, defender) {
        const result = {
            attacker: attacker,
            defender: defender,
            damage: 0,
            hadAdvantage: false,
            gangUpBonus: false,
            defenderDied: false,
            logs: []
        };

        // Check if attack is valid
        if (!this.canAttack(attacker, defender)) {
            result.error = 'Invalid attack';
            return result;
        }

        // Calculate damage
        result.hadAdvantage = attacker.hasAdvantageOver(defender);
        result.gangUpBonus = defender.attacksReceivedThisTurn > 0;
        result.damage = this.calculateDamage(attacker, defender);

        // Log attack
        const attackerType = attacker.getCombatType() || 'untrained';
        const defenderType = defender.getCombatType() || 'untrained';

        result.logs.push(`P${attacker.owner} unit attacks P${defender.owner} unit!`);

        if (result.hadAdvantage) {
            result.logs.push(`Counter bonus! ${attackerType} beats ${defenderType}`);
        }

        if (result.gangUpBonus) {
            result.logs.push(`Gang-up bonus! (${defender.attacksReceivedThisTurn + 1} attacks this turn)`);
        }

        // Apply damage
        const damageResult = defender.takeDamage(result.damage);
        result.logs.push(`Dealt ${result.damage} damage!`);

        // Track attacks received for gang-up mechanic
        defender.attacksReceivedThisTurn++;

        if (damageResult.died) {
            result.defenderDied = true;
            result.logs.push(`P${defender.owner} unit was destroyed!`);

            // Remove unit from hex
            if (defender.hex) {
                defender.hex.unit = null;
            }

            // Award XP to attacker for kill
            const attackerCombatType = attacker.getCombatType();
            if (attackerCombatType) {
                const abilityName = this.combatTypeToAbility(attackerCombatType);
                const xpResult = attacker.addXP(abilityName, BALANCE.XP_PER_COMBAT_WIN);
                if (xpResult.leveledUp) {
                    result.logs.push(`P${attacker.owner} unit leveled up ${ABILITY_NAMES[abilityName]} to ${xpResult.newLevel}!`);
                }
            }
        } else {
            result.logs.push(`P${defender.owner} unit has ${defender.hp} HP remaining`);

            // Award XP for surviving combat
            const defenderCombatType = defender.getCombatType();
            if (defenderCombatType) {
                const abilityName = this.combatTypeToAbility(defenderCombatType);
                defender.addXP(abilityName, BALANCE.XP_PER_COMBAT_SURVIVE);
            }
        }

        // Mark attacker as having acted
        attacker.hasActed = true;

        return result;
    }

    // Convert combat type back to ability name
    combatTypeToAbility(combatType) {
        switch (combatType) {
            case COMBAT_TYPES.MELEE: return ABILITIES.MELEE_COMBAT;
            case COMBAT_TYPES.RANGED: return ABILITIES.RANGED_COMBAT;
            case COMBAT_TYPES.SWIFT: return ABILITIES.SWIFT;
            default: return null;
        }
    }

    // Check if attacker can attack defender
    canAttack(attacker, defender) {
        if (!attacker || !defender) return false;
        if (attacker.owner === defender.owner) return false;
        if (attacker.hasActed) return false;
        if (!attacker.hex || !defender.hex) return false;

        // Check range
        const distance = attacker.hex.distanceTo(defender.hex);
        const attackRange = attacker.getAttackRange();

        if (distance > attackRange) return false;

        // Check visibility (can't attack hidden units unless you have scouting)
        if (defender.isHidden) {
            const scoutRange = attacker.getScoutRange();
            if (scoutRange < distance) {
                return false;
            }
        }

        return true;
    }

    // Get all valid attack targets for a unit
    getValidTargets(attacker) {
        if (!attacker || attacker.hasActed) return [];

        const targets = [];
        const attackRange = attacker.getAttackRange();
        const hexesInRange = this.game.grid.getHexesInRange(attacker.hex, attackRange);

        for (const hex of hexesInRange) {
            if (hex.unit && this.canAttack(attacker, hex.unit)) {
                targets.push(hex);
            }
        }

        return targets;
    }

    // Simulate combat without actually doing it (for AI or preview)
    simulateAttack(attacker, defender) {
        const damage = this.calculateDamage(attacker, defender);
        const wouldKill = defender.hp <= damage;
        const hasAdvantage = attacker.hasAdvantageOver(defender);

        return {
            damage,
            wouldKill,
            hasAdvantage,
            currentDefenderHp: defender.hp,
            attackerCombatType: attacker.getCombatType(),
            defenderCombatType: defender.getCombatType()
        };
    }
}

// Training System
class TrainingSystem {
    constructor(game) {
        this.game = game;
    }

    // Process training at start of turn for all units
    processTraining(player) {
        const logs = [];

        for (const hex of this.game.grid.hexes.values()) {
            if (hex.unit && hex.unit.owner === player) {
                const result = this.processUnitTraining(hex.unit);
                if (result.trained) {
                    logs.push(result.message);
                }
            }
        }

        return logs;
    }

    // Process training for a single unit
    processUnitTraining(unit) {
        const hex = unit.hex;
        const teachableAbility = HEX_TEACHES[hex.type];

        if (!teachableAbility) {
            // Not a training hex, reset counter
            unit.turnsOnCurrentHex = 0;
            return { trained: false };
        }

        // Unit is on a training hex
        unit.turnsOnCurrentHex++;

        // Only train if unit has been here for a full turn
        if (unit.turnsOnCurrentHex >= 1) {
            const result = unit.learnAbility(teachableAbility);

            if (result.learned) {
                return {
                    trained: true,
                    message: `P${unit.owner} unit learned ${ABILITY_NAMES[teachableAbility]}!`
                };
            } else if (result.leveled) {
                return {
                    trained: true,
                    message: `P${unit.owner} unit's ${ABILITY_NAMES[teachableAbility]} increased to level ${result.newLevel}!`
                };
            } else if (result.maxed) {
                return {
                    trained: false,
                    message: `${ABILITY_NAMES[teachableAbility]} is already maxed out`
                };
            }
        }

        return { trained: false };
    }

    // Check if unit can train on current hex
    canTrain(unit) {
        if (!unit || !unit.hex) return false;
        const teachableAbility = HEX_TEACHES[unit.hex.type];
        if (!teachableAbility) return false;

        const currentLevel = unit.getAbilityLevel(teachableAbility);
        return currentLevel < BALANCE.MAX_ABILITY_LEVEL;
    }

    // Get training info for a hex
    getTrainingInfo(hex) {
        const teachableAbility = HEX_TEACHES[hex.type];
        if (!teachableAbility) {
            return null;
        }

        return {
            ability: teachableAbility,
            abilityName: ABILITY_NAMES[teachableAbility],
            description: this.getAbilityDescription(teachableAbility)
        };
    }

    getAbilityDescription(ability) {
        const descriptions = {
            [ABILITIES.WOODCUTTING]: 'Gather wood from forests. Higher levels gather more.',
            [ABILITIES.MINING]: 'Mine ore from mines. Higher levels gather more.',
            [ABILITIES.FARMING]: 'Harvest food from farms. Higher levels gather more.',
            [ABILITIES.MELEE_COMBAT]: 'Close combat. Beats Ranged. Higher levels deal more damage.',
            [ABILITIES.RANGED_COMBAT]: 'Attack from distance. Beats Swift. Higher levels increase range.',
            [ABILITIES.SWIFT]: 'Fast movement and hit-run. Beats Melee. Higher levels move further.',
            [ABILITIES.SCOUTING]: 'Reveal hidden units. Higher levels see further.',
            [ABILITIES.CLOAKING]: 'Become hidden. Can ambush enemies.'
        };
        return descriptions[ability] || '';
    }
}

// Resource/Gathering System
class GatheringSystem {
    constructor(game) {
        this.game = game;
    }

    // Check if unit can gather on current hex
    canGather(unit) {
        if (!unit || !unit.hex || unit.hasActed) return false;

        const hex = unit.hex;
        const teachableAbility = HEX_TEACHES[hex.type];

        // Can only gather on resource hexes (Forest, Mine, Farm)
        if (![HEX_TYPES.FOREST, HEX_TYPES.MINE, HEX_TYPES.FARM].includes(hex.type)) {
            return false;
        }

        // Must have the corresponding gathering ability
        return unit.hasAbility(teachableAbility);
    }

    // Execute gathering action
    gather(unit) {
        if (!this.canGather(unit)) {
            return { success: false, error: 'Cannot gather here' };
        }

        const hex = unit.hex;
        const ability = HEX_TEACHES[hex.type];
        const resource = ABILITY_TO_RESOURCE[ability];
        const amount = unit.getGatherRate(ability);

        // Add resources to player
        this.game.addResource(unit.owner, resource, amount);

        // Mark unit as having acted
        unit.hasActed = true;

        // Add XP for gathering
        const xpResult = unit.addXP(ability, BALANCE.XP_PER_GATHER);

        const result = {
            success: true,
            resource: resource,
            amount: amount,
            message: `Gathered ${amount} ${resource}!`
        };

        if (xpResult.leveledUp) {
            result.leveledUp = true;
            result.message += ` ${ABILITY_NAMES[ability]} leveled up to ${xpResult.newLevel}!`;
        }

        return result;
    }

    // Get gathering preview
    getGatherPreview(unit) {
        if (!this.canGather(unit)) return null;

        const hex = unit.hex;
        const ability = HEX_TEACHES[hex.type];
        const resource = ABILITY_TO_RESOURCE[ability];
        const amount = unit.getGatherRate(ability);

        return {
            resource,
            amount,
            ability,
            abilityLevel: unit.getAbilityLevel(ability)
        };
    }
}
