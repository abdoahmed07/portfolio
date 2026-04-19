/* ═══════════════════════════════════════════════════════
   HeroFight — Web Edition
   Full JS port of the C# .NET 10 console RPG
═══════════════════════════════════════════════════════ */

// ─── Utilities ───────────────────────────────────────────
function rng()          { return Math.random(); }
function rngInt(lo, hi) { return Math.floor(rng() * (hi - lo)) + lo; }
function $id(id)        { return document.getElementById(id); }

// ─── Character base ──────────────────────────────────────
class Character {
    constructor() { this.name = ''; this.health = 0; this.attack = 0; this.defense = 0; }
    setHealth(v)  { this.health = v; }
    takeDamage(d) { this.health = Math.max(0, this.health - Math.max(0, d)); }
    get isAlive() { return this.health > 0; }
}

// ─── Enemy ───────────────────────────────────────────────
class Enemy extends Character {
    constructor(name, atk, def, hp, xp, gold) {
        super();
        this.name = name; this.attack = atk; this.defense = def;
        this.health = hp; this.maxHealth = hp;
        this.xpReward = xp; this.goldReward = gold;
    }
    dealDamage() { return this.attack; }
}

// ─── Player base ─────────────────────────────────────────
class Player extends Character {
    constructor() {
        super();
        this.characterClass = ''; this.maxHealth = 0; this.gold = 0;
        this.experience = 0; this.level = 1; this.potions = 0; this.inventory = [];
    }
    heal(n)            { this.health = Math.min(this.health + n, this.maxHealth); }
    dealDamage()       { return this.attack + 2; }
    get escapeChance() { return 0.25; }
    getDamageBonus()   { return 0; }
    useSpecial(eDef, boss) { return { dmg: 0, msg: 'Nothing happens.', skip: true }; }
}

// ─── Warrior ─────────────────────────────────────────────
class Warrior extends Player {
    constructor() {
        super();
        this.characterClass = 'Warrior';
        this.maxHealth = 40; this.attack = 7; this.defense = 5;
        this.potions = 2; this.gold = 15;
    }
    getDamageBonus()   { return 1; }
    get escapeChance() { return 0.25; }
    useSpecial(eDef, boss) {
        const raw = Math.max(2, this.attack + 3 - eDef);
        const dmg = boss ? Math.round(raw * 0.8) : raw;
        this.takeDamage(2);
        return { dmg, msg: '⚔ <b>Heavy Strike!</b> You deal <b>' + dmg + '</b> damage — but take 2 self-damage.' };
    }
}

// ─── Mage ────────────────────────────────────────────────
class Mage extends Player {
    constructor() {
        super();
        this.characterClass = 'Mage';
        this.maxHealth = 28; this.attack = 10; this.defense = 2;
        this.potions = 2; this.gold = 15;
    }
    getDamageBonus()   { return 2; }
    get escapeChance() { return 0.35; }
    useSpecial(eDef, boss) {
        if (this.gold < 3) return { dmg: 0, msg: '✦ Not enough gold for Fireball (costs 3 gold).', skip: true };
        this.gold -= 3;
        const raw = Math.max(3, this.attack + 5 - Math.floor(eDef / 2));
        const dmg = boss ? Math.round(raw * 0.8) : raw;
        return { dmg, msg: '✦ <b>Fireball!</b> (−3 gold) Burns for <b>' + dmg + '</b> damage.' };
    }
}

// ─── Rogue ───────────────────────────────────────────────
class Rogue extends Player {
    constructor() {
        super();
        this.characterClass = 'Rogue';
        this.maxHealth = 32; this.attack = 8; this.defense = 3;
        this.potions = 3; this.gold = 20;
    }
    getDamageBonus()   { return rng() < 0.2 ? 4 : 0; }
    get escapeChance() { return 0.5; }
    useSpecial(eDef, boss) {
        if (rng() < 0.5) {
            const raw = Math.max(4, this.attack + 6);
            const dmg = boss ? Math.round(raw * 0.8) : raw;
            return { dmg, msg: '◈ <b>Backstab lands!</b> Deals <b>' + dmg + '</b> damage.' };
        }
        return { dmg: 1, msg: '◈ <b>Backstab missed!</b> Barely scratches for <b>1</b> damage.' };
    }
}

// ─── Data tables ─────────────────────────────────────────
const TEMPLATES = [
    { name: 'Wild Boar', atk: 4, def: 1, hp: 18, xp: 6,  gold: 4 },
    { name: 'Skeleton',  atk: 5, def: 2, hp: 20, xp: 7,  gold: 5 },
    { name: 'Bandit',    atk: 6, def: 1, hp: 16, xp: 8,  gold: 6 },
    { name: 'Slime',     atk: 3, def: 0, hp: 14, xp: 5,  gold: 3 },
    { name: 'Dark Elf',  atk: 7, def: 2, hp: 22, xp: 10, gold: 8 },
];

const ROOMS = [
    { type: 'battle',   name: 'Forest Path',         icon: '⚔' },
    { type: 'treasure', name: 'Old Chest',            icon: '◈' },
    { type: 'shop',     name: 'Travelling Merchant',  icon: '✦' },
    { type: 'battle',   name: 'Cave Entrance',        icon: '⚔' },
    { type: 'rest',     name: 'Campfire',             icon: '○' },
    { type: 'battle',   name: 'Cave Depths',          icon: '⚔' },
    { type: 'boss',     name: 'The Ancient Dragon',   icon: '★' },
];

// ─── Game state ──────────────────────────────────────────
const S = {
    player:        null,
    roomIdx:       0,
    enemy:         null,
    isBoss:        false,
    selectedClass: 'warrior',
};

// ─── Screen management ───────────────────────────────────
function showScreen(id) {
    document.querySelectorAll('.g-screen').forEach(function(s) {
        s.classList.remove('g-screen--active');
    });
    $id(id).classList.add('g-screen--active');
}

// ─── Battle log ──────────────────────────────────────────
function log(html, cls) {
    cls = cls || 'g-log-info';
    var el = document.createElement('p');
    el.className = cls;
    el.innerHTML = html;
    var logEl = $id('g-log');
    logEl.appendChild(el);
    logEl.scrollTop = logEl.scrollHeight;
}

function clearLog() { $id('g-log').innerHTML = ''; }

// ─── Action button renderer ──────────────────────────────
function actions(arr) {
    var area = $id('g-actions');
    area.innerHTML = '';
    arr.forEach(function(b) {
        var btn = document.createElement('button');
        btn.className = 'g-btn'
            + (b.accent ? ' g-btn--accent' : '')
            + (b.off    ? ' g-btn--off'    : '');
        btn.innerHTML = b.label;
        if (!b.off) btn.addEventListener('click', b.fn);
        area.appendChild(btn);
    });
}

// ─── UI refresh helpers ──────────────────────────────────
function refreshPlayer() {
    var p = S.player;
    $id('g-class-label').textContent = p.characterClass;
    $id('g-level').textContent       = 'Lv. ' + p.level;
    $id('g-player-name').textContent = p.name;
    $id('g-hp-text').textContent     = p.health + ' / ' + p.maxHealth;

    var pct = Math.max(0, (p.health / p.maxHealth) * 100);
    var bar = $id('g-hp-bar');
    bar.style.width      = pct + '%';
    bar.style.background = pct < 25 ? '#dd4444' : pct < 50 ? '#e87d2a' : 'var(--accent)';

    $id('g-atk').textContent  = p.attack;
    $id('g-def').textContent  = p.defense;
    $id('g-gold').textContent = p.gold;
    $id('g-pots').textContent = p.potions;
    $id('g-xp').textContent   = p.experience;

    var invEl = $id('g-inv-items');
    if (p.inventory.length === 0) {
        invEl.innerHTML = '<span class="g-inv-empty">Empty</span>';
    } else {
        // Count duplicates
        var counts = {};
        p.inventory.forEach(function(i) { counts[i] = (counts[i] || 0) + 1; });
        invEl.innerHTML = Object.keys(counts)
            .map(function(k) {
                return '<span class="g-inv-item">'
                    + k + (counts[k] > 1 ? ' ×' + counts[k] : '')
                    + '</span>';
            }).join('');
    }
}

function refreshEnemy(show) {
    var card = $id('g-enemy-card');
    if (!show || !S.enemy) { card.classList.add('g-hidden'); return; }
    card.classList.remove('g-hidden');
    var e = S.enemy;
    $id('g-enemy-name').textContent = e.name;
    $id('g-enemy-hp-txt').textContent = e.health + ' HP';

    var pct = Math.max(0, (e.health / e.maxHealth) * 100);
    var bar = $id('g-enemy-hp-bar');
    bar.style.width      = pct + '%';
    bar.style.background = pct < 25 ? '#dd4444' : pct < 50 ? '#e87d2a' : '#e55';

    $id('g-enemy-stats').textContent = 'ATK ' + e.attack + '  ·  DEF ' + e.defense;
}

function refreshRoomBar() {
    var bar = $id('g-room-bar');
    bar.innerHTML = '';
    ROOMS.forEach(function(r, i) {
        var dot = document.createElement('div');
        dot.className = 'g-room-dot'
            + (i <  S.roomIdx ? ' is-done'    : '')
            + (i === S.roomIdx ? ' is-current' : '')
            + (r.type === 'boss' ? ' is-boss' : '');
        dot.innerHTML =
            '<span class="g-room-dot-icon">' + r.icon + '</span>' +
            '<span class="g-room-dot-name">' + r.name + '</span>';
        bar.appendChild(dot);
    });
}

function setRoomBadge(type, name) {
    var badge = $id('g-room-badge');
    badge.textContent = type.charAt(0).toUpperCase() + type.slice(1);
    badge.className   = 'g-room-badge g-badge-' + type;
    $id('g-room-name').textContent = name;
}

// ─── New game ────────────────────────────────────────────
function startGame(name, cls) {
    var p;
    if      (cls === 'mage')  p = new Mage();
    else if (cls === 'rogue') p = new Rogue();
    else                       p = new Warrior();

    p.name = name || 'Hero';
    p.setHealth(p.maxHealth);
    p.inventory = ['Wooden Sword', 'Cloth Armor'];
    S.player = p; S.roomIdx = 0; S.enemy = null;

    clearLog();
    refreshPlayer();
    refreshRoomBar();
    log('Welcome, <b>' + p.name + '</b> the <b>' + p.characterClass + '</b>! Your adventure begins.', 'g-log-sys');
    showScreen('g-main');
    enterRoom();
}

// ─── Room entry ──────────────────────────────────────────
function enterRoom() {
    if (S.roomIdx >= ROOMS.length) { endGame(true); return; }
    var room = ROOMS[S.roomIdx];
    setRoomBadge(room.type, room.name);
    refreshRoomBar();
    log('— Room ' + (S.roomIdx + 1) + ' / 7 : <b>' + room.name + '</b> —', 'g-log-sys');

    if      (room.type === 'battle'  ) startBattle(false);
    else if (room.type === 'boss'    ) startBattle(true);
    else if (room.type === 'treasure') doTreasure();
    else if (room.type === 'shop'    ) doShop();
    else if (room.type === 'rest'    ) doRest();
}

function advance() { S.roomIdx++; enterRoom(); }

// ─── Battle ──────────────────────────────────────────────
function makeEnemy(boss) {
    if (boss) return new Enemy('Ancient Dragon', 9, 4, 55, 30, 50);
    var t = TEMPLATES[Math.floor(rng() * TEMPLATES.length)];
    return new Enemy(
        t.name,
        t.atk  + rngInt(0, 2),
        t.def  + rngInt(0, 2),
        t.hp   + rngInt(-1, 3),
        t.xp   + rngInt(0, 3),
        t.gold + rngInt(0, 3)
    );
}

function startBattle(boss) {
    S.isBoss = boss;
    S.enemy  = makeEnemy(boss);
    refreshEnemy(true);
    log(
        'A <b>' + S.enemy.name + '</b> appears! &nbsp; HP ' + S.enemy.health +
        ' · ATK ' + S.enemy.attack + ' · DEF ' + S.enemy.defense,
        'g-log-enemy'
    );
    if (boss) log('⚠ You cannot escape from the boss!', 'g-log-sys');
    showCombatActions();
}

function showCombatActions() {
    var p = S.player;
    actions([
        { label: '⚔ Attack',                       fn: doAttack,  accent: true },
        { label: '✦ ' + classSpecialName(p),        fn: doSpecial },
        { label: '♥ Potion (' + p.potions + ')',    fn: doPotion,  off: p.potions <= 0 },
        { label: '↩ Run',                           fn: doRun,     off: S.isBoss },
    ]);
}

function classSpecialName(p) {
    if (p.characterClass === 'Mage')  return 'Fireball';
    if (p.characterClass === 'Rogue') return 'Backstab';
    return 'Heavy Strike';
}

function calcPlayerDmg() {
    var p     = S.player;
    var base  = Math.max(1, p.attack - Math.floor(S.enemy.defense / 2));
    var bonus = p.getDamageBonus();
    var roll  = rngInt(0, 3);
    return { total: Math.max(1, base + bonus + roll), crit: bonus >= 4 };
}

function enemyTurn() {
    if (!S.enemy || !S.enemy.isAlive) return;
    var p      = S.player, e = S.enemy;
    var glance = rng() < 0.1;
    var dmg    = Math.max(1, e.dealDamage() - Math.floor(p.defense / 2)) + rngInt(0, 3);
    if (glance) dmg = Math.max(1, dmg - 2);
    p.takeDamage(dmg);
    log(
        e.name + ' attacks for <b>' + dmg + '</b> damage' + (glance ? ' <i>(glancing blow)</i>' : '') + '.',
        'g-log-enemy'
    );
    refreshPlayer();
    if (!p.isAlive) { refreshEnemy(false); endGame(false); }
}

function afterPlayerAction() {
    refreshPlayer();
    refreshEnemy(true);

    if (!S.enemy.isAlive) {
        var xp   = S.enemy.xpReward;
        var gold = S.enemy.goldReward;
        S.player.gold += gold;
        addXP(xp);
        log('✓ Victory!  +' + xp + ' XP  +' + gold + ' gold.', 'g-log-ok');
        maybeLoot();
        refreshPlayer();
        refreshEnemy(false);
        actions([{ label: 'Continue →', fn: advance, accent: true }]);
        return;
    }
    enemyTurn();
    if (S.player.isAlive) showCombatActions();
}

function doAttack() {
    var r = calcPlayerDmg();
    S.enemy.takeDamage(r.total);
    var crit = r.crit ? ' <span class="g-crit">CRIT!</span>' : '';
    log('You attack for <b>' + r.total + '</b> damage.' + crit, 'g-log-atk');
    afterPlayerAction();
}

function doSpecial() {
    var res = S.player.useSpecial(S.enemy.defense, S.isBoss);
    if (!res.skip) S.enemy.takeDamage(res.dmg);
    log(res.msg, res.skip ? 'g-log-sys' : 'g-log-atk');
    afterPlayerAction();
}

function doPotion() {
    if (S.player.potions <= 0) return;
    var before = S.player.health;
    S.player.heal(12);
    S.player.potions--;
    log('♥ You drink a potion and recover <b>' + (S.player.health - before) + '</b> HP.', 'g-log-ok');
    refreshPlayer();
    enemyTurn();
    if (S.player.isAlive) showCombatActions();
}

function doRun() {
    if (S.isBoss) return;
    if (rng() < S.player.escapeChance) {
        log('You escaped!', 'g-log-sys');
        refreshEnemy(false);
        actions([{ label: 'Continue →', fn: advance, accent: true }]);
    } else {
        log('Failed to escape!', 'g-log-sys');
        enemyTurn();
        if (S.player.isAlive) showCombatActions();
    }
}

function addXP(n) {
    S.player.experience += n;
    var p = S.player;
    var thresholds = [0, 10, 25, 45, 70, 100];
    var next = thresholds[p.level] !== undefined ? thresholds[p.level] : p.level * 20;
    if (p.experience >= next) {
        p.level++;
        if      (p.characterClass === 'Warrior') { p.maxHealth += 6; p.attack += 2; p.defense += 2; }
        else if (p.characterClass === 'Mage')    { p.maxHealth += 4; p.attack += 4; p.defense += 1; }
        else if (p.characterClass === 'Rogue')   { p.maxHealth += 5; p.attack += 3; p.defense += 1; }
        p.setHealth(p.maxHealth);
        log('★ <b>Level Up!</b> You are now Level ' + p.level + '! Stats increased and HP restored.', 'g-log-ok');
    }
}

function maybeLoot() {
    if (rng() < 0.35) {
        var item = S.enemy.name.includes('Dragon') ? 'Dragon Scale' : 'Minor Gem';
        S.player.inventory.push(item);
        log('Item dropped: <b>' + item + '</b> added to bag.', 'g-log-sys');
    }
}

// ─── Non-combat rooms ────────────────────────────────────
function doTreasure() {
    refreshEnemy(false);
    if (rng() < 0.5) {
        var g = rngInt(8, 15);
        S.player.gold += g;
        log('You open the chest… <b>' + g + ' gold!</b>', 'g-log-ok');
    } else {
        var opts = ['Iron Dagger', 'Oak Staff', 'Leather Vest', 'Healing Herb'];
        var item = opts[Math.floor(rng() * opts.length)];
        S.player.inventory.push(item);
        log('You open the chest… You find <b>' + item + '</b>!', 'g-log-ok');
    }
    refreshPlayer();
    actions([{ label: 'Continue →', fn: advance, accent: true }]);
}

function doShop() {
    refreshEnemy(false);
    log('A merchant offers their wares. Gold: <b>' + S.player.gold + '</b>', 'g-log-sys');
    showShopActions();
}

function showShopActions() {
    var p = S.player;
    actions([
        { label: '♥ Potion +1  (10g)',    fn: function() { buyItem(10, function() { p.potions++;    log('You buy a potion.', 'g-log-ok'); }); }, off: p.gold < 10 },
        { label: '⚔ Weapon +2 ATK (25g)', fn: function() { buyItem(25, function() { p.attack  += 2; log('New weapon: +2 ATK.', 'g-log-ok'); }); }, off: p.gold < 25 },
        { label: '🛡 Armor  +2 DEF (25g)', fn: function() { buyItem(25, function() { p.defense += 2; log('New armor: +2 DEF.', 'g-log-ok'); }); }, off: p.gold < 25 },
        { label: '◈ Sell Gems (+5g ea)',   fn: sellGems },
        { label: 'Leave Shop →',           fn: advance, accent: true },
    ]);
}

function buyItem(cost, applyFn) {
    if (S.player.gold < cost) { log('Not enough gold.', 'g-log-sys'); return; }
    S.player.gold -= cost;
    applyFn();
    refreshPlayer();
    showShopActions();
}

function sellGems() {
    var gems = S.player.inventory.filter(function(i) { return i === 'Minor Gem'; }).length;
    if (gems === 0) { log('No Minor Gems to sell.', 'g-log-sys'); return; }
    S.player.inventory = S.player.inventory.filter(function(i) { return i !== 'Minor Gem'; });
    S.player.gold += gems * 5;
    log('Sold ' + gems + ' Minor Gem(s) for <b>' + (gems * 5) + '</b> gold.', 'g-log-ok');
    refreshPlayer();
    showShopActions();
}

function doRest() {
    refreshEnemy(false);
    S.player.setHealth(S.player.maxHealth);
    log('You rest at the campfire… HP fully restored!', 'g-log-ok');
    refreshPlayer();
    actions([{ label: 'Continue →', fn: advance, accent: true }]);
}

// ─── End game ────────────────────────────────────────────
function endGame(victory) {
    var p      = S.player;
    var screen = $id('g-end');
    screen.className = 'g-screen g-end--' + (victory ? 'victory' : 'defeat');
    $id('g-end-eyebrow').textContent = victory ? '★  Victory!' : 'Game Over';
    $id('g-end-title').textContent   = victory ? 'You Slew the Dragon!' : 'You Have Fallen';
    $id('g-end-stats').innerHTML     =
        '<b>' + p.name + '</b> the <b>' + p.characterClass + '</b>' +
        ' &nbsp;·&nbsp; Lv. ' + p.level +
        ' &nbsp;·&nbsp; ' + p.experience + ' XP' +
        ' &nbsp;·&nbsp; ' + p.gold + ' gold';
    showScreen('g-end');
}

// ─── Boot ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {

    // Class card selection
    document.querySelectorAll('.g-class-card').forEach(function(card) {
        card.addEventListener('click', function() {
            document.querySelectorAll('.g-class-card').forEach(function(c) {
                c.classList.remove('g-class-card--active');
            });
            card.classList.add('g-class-card--active');
            S.selectedClass = card.dataset.class;
        });
    });

    // New Game button
    $id('g-btn-newgame').addEventListener('click', function() {
        showScreen('g-select');
        setTimeout(function() { $id('g-name-input').focus(); }, 80);
    });

    // Start adventure
    $id('g-btn-start').addEventListener('click', function() {
        var name = ($id('g-name-input').value || '').trim();
        startGame(name, S.selectedClass);
    });

    // Enter key in name field
    $id('g-name-input').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') $id('g-btn-start').click();
    });

    // Retry
    $id('g-btn-retry').addEventListener('click', function() {
        showScreen('g-title');
        $id('g-name-input').value = '';
        S.selectedClass = 'warrior';
        document.querySelectorAll('.g-class-card').forEach(function(c) { c.classList.remove('g-class-card--active'); });
        var first = document.querySelector('.g-class-card');
        if (first) first.classList.add('g-class-card--active');
    });

    // Code tab switching (source code section below the game)
    document.querySelectorAll('.tab').forEach(function(tab) {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active'); });
            document.querySelectorAll('.code-panel').forEach(function(p) { p.classList.remove('active'); });
            tab.classList.add('active');
            var panel = document.getElementById('tab-' + tab.dataset.tab);
            if (panel) panel.classList.add('active');
        });
    });

    // Syntax highlighting for the source code section
    if (typeof hljs !== 'undefined') {
        document.querySelectorAll('pre code').forEach(function(block) {
            hljs.highlightElement(block);
        });
    }
});
