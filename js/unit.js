// Unit System with Abilities and Leveling

class Unit {
    constructor(owner, hex) {
        this.owner = owner;  // 1 or 2
        this.hex = hex;      // Reference to current hex
        this.hp = BALANCE.BASE_HP;
        this.maxHp = BALANCE.BASE_HP;
        this.abilities = new Map();  // ability name -> { level: 1-3, xp: 0 }
        this.turnsOnCurrentHex = 0;  // For training
        this.hasActed = false;       // Has taken action this turn
        this.hasMoved = false;       // Has moved this turn
        this.isHidden = false;       // Cloaking
        this.attacksReceivedThisTurn = 0;  // For gang-up mechanic
    }

    // Get total rank (sum of all ability levels)
    getRank() {
        let total = 0;
        for (const ability of this.abilities.values()) {
            total += ability.level;
        }
        return total;
    }

    // Get level of a specific ability (0 if not learned)
    getAbilityLevel(abilityName) {
        const ability = this.abilities.get(abilityName);
        return ability ? ability.level : 0;
    }

    // Check if unit has an ability
    hasAbility(abilityName) {
        return this.abilities.has(abilityName);
    }

    // Learn or level up an ability
    learnAbility(abilityName) {
        if (this.abilities.has(abilityName)) {
            const ability = this.abilities.get(abilityName);
            if (ability.level < BALANCE.MAX_ABILITY_LEVEL) {
                ability.level++;
                ability.xp = 0;
                return { leveled: true, newLevel: ability.level };
            }
            return { leveled: false, maxed: true };
        } else {
            this.abilities.set(abilityName, { level: 1, xp: 0 });
            return { learned: true, newLevel: 1 };
        }
    }

    // Add XP to an ability (for learning by doing)
    addXP(abilityName, amount) {
        if (!this.abilities.has(abilityName)) {
            return { leveledUp: false };
        }

        const ability = this.abilities.get(abilityName);
        if (ability.level >= BALANCE.MAX_ABILITY_LEVEL) {
            return { leveledUp: false, maxed: true };
        }

        ability.xp += amount;
        if (ability.xp >= BALANCE.XP_TO_LEVEL) {
            ability.level++;
            ability.xp = 0;
            return { leveledUp: true, newLevel: ability.level };
        }

        return { leveledUp: false, currentXP: ability.xp };
    }

    // Get movement range
    getMoveRange() {
        let range = BALANCE.BASE_MOVE_RANGE;
        const swiftLevel = this.getAbilityLevel(ABILITIES.SWIFT);
        if (swiftLevel > 0) {
            range += Math.ceil(swiftLevel * BALANCE.SWIFT_MOVE_BONUS);
        }
        return range;
    }

    // Get attack range
    getAttackRange() {
        const rangedLevel = this.getAbilityLevel(ABILITIES.RANGED_COMBAT);
        if (rangedLevel >= 3) {
            return BALANCE.RANGED_ATTACK_RANGE_L3;
        } else if (rangedLevel > 0) {
            return BALANCE.RANGED_ATTACK_RANGE;
        }
        // Melee only
        return 1;
    }

    // Get base damage
    getBaseDamage() {
        const meleeLevel = this.getAbilityLevel(ABILITIES.MELEE_COMBAT);
        const rangedLevel = this.getAbilityLevel(ABILITIES.RANGED_COMBAT);
        const swiftLevel = this.getAbilityLevel(ABILITIES.SWIFT);

        // Use highest combat ability level
        const maxCombatLevel = Math.max(meleeLevel, rangedLevel, swiftLevel);
        if (maxCombatLevel === 0) {
            return BALANCE.BASE_ATTACK_DAMAGE;
        }
        return BALANCE.BASE_ATTACK_DAMAGE * maxCombatLevel;
    }

    // Get primary combat type
    getCombatType() {
        const meleeLevel = this.getAbilityLevel(ABILITIES.MELEE_COMBAT);
        const rangedLevel = this.getAbilityLevel(ABILITIES.RANGED_COMBAT);
        const swiftLevel = this.getAbilityLevel(ABILITIES.SWIFT);

        // Return type with highest level
        if (rangedLevel >= meleeLevel && rangedLevel >= swiftLevel && rangedLevel > 0) {
            return COMBAT_TYPES.RANGED;
        } else if (swiftLevel >= meleeLevel && swiftLevel > 0) {
            return COMBAT_TYPES.SWIFT;
        } else if (meleeLevel > 0) {
            return COMBAT_TYPES.MELEE;
        }
        return null;  // No combat training
    }

    // Check if this unit's combat type beats another
    hasAdvantageOver(otherUnit) {
        const myType = this.getCombatType();
        const theirType = otherUnit.getCombatType();

        if (!myType || !theirType) {
            return false;
        }

        return COMBAT_ADVANTAGE[myType] === theirType;
    }

    // Get gathering rate for a resource
    getGatherRate(abilityName) {
        const level = this.getAbilityLevel(abilityName);
        return level;  // Level 1 = 1, Level 2 = 2, Level 3 = 3
    }

    // Get scouting range
    getScoutRange() {
        const level = this.getAbilityLevel(ABILITIES.SCOUTING);
        return level > 0 ? BALANCE.SCOUT_REVEAL_RANGE + level - 1 : 0;
    }

    // Check if can cloak
    canCloak() {
        return this.hasAbility(ABILITIES.CLOAKING);
    }

    // Take damage
    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp = 0;
            return { died: true };
        }
        return { died: false, remainingHp: this.hp };
    }

    // Heal
    heal(amount) {
        this.hp = Math.min(this.hp + amount, this.maxHp);
    }

    // Reset for new turn
    resetTurn() {
        this.hasActed = false;
        this.hasMoved = false;
        this.attacksReceivedThisTurn = 0;
    }

    // Check if can do anything this turn
    canAct() {
        return !this.hasActed;
    }

    canMove() {
        return !this.hasMoved && !this.hasActed;
    }

    // Get ability list for display
    getAbilityList() {
        const list = [];
        for (const [name, data] of this.abilities) {
            list.push({
                name: ABILITY_NAMES[name] || name,
                level: data.level,
                xp: data.xp,
                maxLevel: data.level >= BALANCE.MAX_ABILITY_LEVEL
            });
        }
        return list;
    }

    // Serialize for saving
    serialize() {
        return {
            owner: this.owner,
            hp: this.hp,
            maxHp: this.maxHp,
            abilities: Array.from(this.abilities.entries()),
            turnsOnCurrentHex: this.turnsOnCurrentHex,
            hasActed: this.hasActed,
            hasMoved: this.hasMoved,
            isHidden: this.isHidden
        };
    }

    // Deserialize
    static deserialize(data, hex) {
        const unit = new Unit(data.owner, hex);
        unit.hp = data.hp;
        unit.maxHp = data.maxHp;
        unit.abilities = new Map(data.abilities);
        unit.turnsOnCurrentHex = data.turnsOnCurrentHex;
        unit.hasActed = data.hasActed;
        unit.hasMoved = data.hasMoved;
        unit.isHidden = data.isHidden;
        return unit;
    }
}
