// Game Constants

const HEX_SIZE = 40; // Radius of hexagon

// Hex Types
const HEX_TYPES = {
    EMPTY: 'empty',
    FOREST: 'forest',
    MINE: 'mine',
    FARM: 'farm',
    BARRACKS: 'barracks',
    ARCHERY_RANGE: 'archery_range',
    STABLE: 'stable',
    WATCHTOWER: 'watchtower',
    SHADOW_CAMP: 'shadow_camp',
    SPAWN_P1: 'spawn_p1',
    SPAWN_P2: 'spawn_p2'
};

// Hex colors for rendering
const HEX_COLORS = {
    [HEX_TYPES.EMPTY]: '#2d4a3e',
    [HEX_TYPES.FOREST]: '#1e5631',
    [HEX_TYPES.MINE]: '#4a4a4a',
    [HEX_TYPES.FARM]: '#7d8c1f',
    [HEX_TYPES.BARRACKS]: '#8b0000',
    [HEX_TYPES.ARCHERY_RANGE]: '#654321',
    [HEX_TYPES.STABLE]: '#c2956e',
    [HEX_TYPES.WATCHTOWER]: '#4682b4',
    [HEX_TYPES.SHADOW_CAMP]: '#2c1e4a',
    [HEX_TYPES.SPAWN_P1]: '#1a3a5c',
    [HEX_TYPES.SPAWN_P2]: '#5c1a1a'
};

// Hex type display names
const HEX_NAMES = {
    [HEX_TYPES.EMPTY]: 'Grassland',
    [HEX_TYPES.FOREST]: 'Forest',
    [HEX_TYPES.MINE]: 'Mine',
    [HEX_TYPES.FARM]: 'Farm',
    [HEX_TYPES.BARRACKS]: 'Barracks',
    [HEX_TYPES.ARCHERY_RANGE]: 'Archery Range',
    [HEX_TYPES.STABLE]: 'Stable',
    [HEX_TYPES.WATCHTOWER]: 'Watchtower',
    [HEX_TYPES.SHADOW_CAMP]: 'Shadow Camp',
    [HEX_TYPES.SPAWN_P1]: 'Player 1 Spawn',
    [HEX_TYPES.SPAWN_P2]: 'Player 2 Spawn'
};

// Abilities and what hex trains them
const ABILITIES = {
    WOODCUTTING: 'woodcutting',
    MINING: 'mining',
    FARMING: 'farming',
    MELEE_COMBAT: 'melee_combat',
    RANGED_COMBAT: 'ranged_combat',
    SWIFT: 'swift',
    SCOUTING: 'scouting',
    CLOAKING: 'cloaking'
};

// What each hex type teaches
const HEX_TEACHES = {
    [HEX_TYPES.FOREST]: ABILITIES.WOODCUTTING,
    [HEX_TYPES.MINE]: ABILITIES.MINING,
    [HEX_TYPES.FARM]: ABILITIES.FARMING,
    [HEX_TYPES.BARRACKS]: ABILITIES.MELEE_COMBAT,
    [HEX_TYPES.ARCHERY_RANGE]: ABILITIES.RANGED_COMBAT,
    [HEX_TYPES.STABLE]: ABILITIES.SWIFT,
    [HEX_TYPES.WATCHTOWER]: ABILITIES.SCOUTING,
    [HEX_TYPES.SHADOW_CAMP]: ABILITIES.CLOAKING
};

// Ability display names
const ABILITY_NAMES = {
    [ABILITIES.WOODCUTTING]: 'Woodcutting',
    [ABILITIES.MINING]: 'Mining',
    [ABILITIES.FARMING]: 'Farming',
    [ABILITIES.MELEE_COMBAT]: 'Melee Combat',
    [ABILITIES.RANGED_COMBAT]: 'Ranged Combat',
    [ABILITIES.SWIFT]: 'Swift',
    [ABILITIES.SCOUTING]: 'Scouting',
    [ABILITIES.CLOAKING]: 'Cloaking'
};

// Combat types for rock-paper-scissors
const COMBAT_TYPES = {
    MELEE: 'melee',
    RANGED: 'ranged',
    SWIFT: 'swift'
};

// Combat triangle: key beats value
const COMBAT_ADVANTAGE = {
    [COMBAT_TYPES.MELEE]: COMBAT_TYPES.RANGED,    // Melee beats Ranged
    [COMBAT_TYPES.RANGED]: COMBAT_TYPES.SWIFT,    // Ranged beats Swift
    [COMBAT_TYPES.SWIFT]: COMBAT_TYPES.MELEE      // Swift beats Melee
};

// Ability to combat type mapping
const ABILITY_TO_COMBAT_TYPE = {
    [ABILITIES.MELEE_COMBAT]: COMBAT_TYPES.MELEE,
    [ABILITIES.RANGED_COMBAT]: COMBAT_TYPES.RANGED,
    [ABILITIES.SWIFT]: COMBAT_TYPES.SWIFT
};

// Resource types
const RESOURCES = {
    WOOD: 'wood',
    ORE: 'ore',
    FOOD: 'food'
};

// Ability to resource mapping (for gathering)
const ABILITY_TO_RESOURCE = {
    [ABILITIES.WOODCUTTING]: RESOURCES.WOOD,
    [ABILITIES.MINING]: RESOURCES.ORE,
    [ABILITIES.FARMING]: RESOURCES.FOOD
};

// Game balance constants
const BALANCE = {
    MAX_ABILITY_LEVEL: 3,
    BASE_HP: 3,
    BASE_MOVE_RANGE: 2,
    SWIFT_MOVE_BONUS: 1,
    BASE_ATTACK_DAMAGE: 1,
    COUNTER_DAMAGE_BONUS: 1.5,  // 50% more damage when countering
    GANG_UP_BONUS: 0.5,         // +50% damage per additional attacker
    RANGED_ATTACK_RANGE: 2,
    RANGED_ATTACK_RANGE_L3: 3,
    SCOUT_REVEAL_RANGE: 2,
    SPAWN_COST: 5,              // Food cost to spawn a recruit
    XP_TO_LEVEL: 3,             // XP needed to level up an ability
    XP_PER_GATHER: 1,
    XP_PER_COMBAT_WIN: 2,
    XP_PER_COMBAT_SURVIVE: 1,
    STARTING_RESOURCES: {
        [RESOURCES.WOOD]: 0,
        [RESOURCES.ORE]: 0,
        [RESOURCES.FOOD]: 10
    }
};

// Turn phases
const PHASES = {
    MOVE: 'move',
    ACTION: 'action'
};
