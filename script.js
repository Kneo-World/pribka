const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 2132;

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
document.body.appendChild(canvas);
document.body.style.margin = "0";
document.body.style.overflow = "hidden";
document.body.style.backgroundColor = "black";

let scale = 1;
function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const ratio = CANVAS_WIDTH / CANVAS_HEIGHT;
    if (w / h > ratio) {
        scale = h / CANVAS_HEIGHT;
    } else {
        scale = w / CANVAS_WIDTH;
    }
    canvas.width = CANVAS_WIDTH * scale;
    canvas.height = CANVAS_HEIGHT * scale;
}
window.addEventListener('resize', resize);
resize();

const EventBus = {
    listeners: {},
    on(event, callback) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(callback);
    },
    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }
};

const Variables = {
    "Очки": parseFloat(localStorage.getItem('var_points')) || 0,
    "Очки 2": parseFloat(localStorage.getItem('var_tickets')) || 0,
    "Ник": localStorage.getItem('var_nick') || "Player",
    "урофень": parseFloat(localStorage.getItem('var_level')) || 1,
    "золото": parseFloat(localStorage.getItem('var_gold')) || 0
};

function saveVars() {
    localStorage.setItem('var_points', Variables["Очки"]);
    localStorage.setItem('var_tickets', Variables["Очки 2"]);
    localStorage.setItem('var_nick', Variables["Ник"]);
    localStorage.setItem('var_level', Variables["урофень"]);
    localStorage.setItem('var_gold', Variables["золото"]);
}

const Assets = {
    images: {},
    sounds: {},
    loadImg(name, src) {
        const img = new Image();
        img.src = 'images/' + src;
        this.images[name] = img;
    },
    loadSound(name, src) {
        const audio = new Audio('sounds/' + src);
        this.sounds[name] = audio;
    }
};

class Sprite {
    constructor(name, scene) {
        this.name = name;
        this.scene = scene;
        this.x = 0;
        this.y = 0;
        this.size = 100;
        this.look = null;
        this.looks = [];
        this.lookIndex = 0;
        this.visible = true;
        this.rotation = 0;
        this.texts = [];
        this.scripts = [];
    }

    setLook(index) {
        this.lookIndex = index;
        this.look = this.looks[index];
    }

    nextLook() {
        this.lookIndex = (this.lookIndex + 1) % this.looks.length;
        this.look = this.looks[this.lookIndex];
    }

    draw() {
        if (!this.visible) return;
        ctx.save();
        const cx = (this.x + CANVAS_WIDTH / 2) * scale;
        const cy = (CANVAS_HEIGHT / 2 - this.y) * scale;
        ctx.translate(cx, cy);
        ctx.rotate(this.rotation * Math.PI / 180);

        if (this.look) {
            const img = Assets.images[this.look];
            if (img && img.complete) {
                const sw = img.width * (this.size / 100) * scale;
                const sh = img.height * (this.size / 100) * scale;
                ctx.drawImage(img, -sw / 2, -sh / 2, sw, sh);
            }
        }

        this.texts.forEach(t => {
            ctx.restore();
            ctx.save();
            const tx = (t.x + CANVAS_WIDTH / 2) * scale;
            const ty = (CANVAS_HEIGHT / 2 - t.y) * scale;
            ctx.fillStyle = t.color || "white";
            ctx.font = `${t.size * scale * 0.5}px Arial`;
            ctx.textAlign = "center";
            ctx.fillText(Variables[t.variable], tx, ty);
        });

        ctx.restore();
    }

    contains(mx, my) {
        const cx = (this.x + CANVAS_WIDTH / 2) * scale;
        const cy = (CANVAS_HEIGHT / 2 - this.y) * scale;
        const img = Assets.images[this.look];
        if (!img) return false;
        const sw = img.width * (this.size / 100) * scale;
        const sh = img.height * (this.size / 100) * scale;
        return mx >= cx - sw / 2 && mx <= cx + sw / 2 && my >= cy - sh / 2 && my <= cy + sh / 2;
    }

    glide(tx, ty, duration, callback) {
        const startX = this.x;
        const startY = this.y;
        const startTime = Date.now();
        const animate = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            const t = Math.min(elapsed / duration, 1);
            this.x = startX + (tx - startX) * t;
            this.y = startY + (ty - startY) * t;
            if (t < 1) requestAnimationFrame(animate);
            else if (callback) callback();
        };
        animate();
    }
}

let currentScene = "Сцена 2";
const scenes = {};

function transition(sceneName) {
    currentScene = sceneName;
    if (scenes[sceneName] && scenes[sceneName].init) {
        scenes[sceneName].init();
    }
}

// Scene 2: Intro
scenes["Сцена 2"] = {
    objects: [],
    init() {
        this.objects = [];
        const bg = new Sprite("Фон", "Сцена 2");
        bg.looks = ["Фон.png"];
        bg.setLook(0);
        this.objects.push(bg);

        const playBtn = new Sprite("играть", "Сцена 2");
        playBtn.looks = ["Мой актер или объект.png"];
        playBtn.setLook(0);
        playBtn.x = 16;
        playBtn.y = 6;
        playBtn.onTouch = () => transition("Сцена 1");
        this.objects.push(playBtn);
    }
};

// Scene 1: Main Game
scenes["Сцена 1"] = {
    objects: [],
    init() {
        this.objects = [];
        
        const bg = new Sprite("Фон", "Сцена 1");
        bg.looks = ["Фон.png"];
        bg.setLook(0);
        bg.x = 1596; bg.y = -90; bg.size = 400;
        const scroll = () => {
            bg.glide(-1600, 183, 25, () => {
                setTimeout(() => {
                    bg.glide(1596, -90, 25, scroll);
                }, 100);
            });
        };
        scroll();
        this.objects.push(bg);

        const cat = new Sprite("1 (1)", "Сцена 1");
        cat.looks = ["Мой актер или объект_#6.png"];
        for(let i=44; i<=88; i++) cat.looks.push(`1_#${i}.png`);
        cat.setLook(0);
        cat.x = -270; cat.y = 201; cat.size = 50;
        cat.texts.push({variable: "Очки", x: -261, y: 582, size: 200, color: "#84E0FF"});
        cat.onTouch = () => {
            Variables["Очки"] += 1;
            saveVars();
            this.checkCatLook(cat);
        };
        this.objects.push(cat);

        const tktDisplay = new Sprite("1", "Сцена 1");
        tktDisplay.looks = ["Мой актер или объект.png"];
        tktDisplay.setLook(0);
        tktDisplay.x = 260; tktDisplay.y = 188; tktDisplay.size = 50;
        tktDisplay.texts.push({variable: "Очки 2", x: 261, y: 579, size: 200, color: "#FF9296"});
        this.objects.push(tktDisplay);

        const goldDisplay = new Sprite("1 (2)", "Сцена 1");
        goldDisplay.looks = ["Мой актер или объект_#1.png"];
        goldDisplay.setLook(0);
        goldDisplay.x = 3; goldDisplay.y = -470; goldDisplay.size = 50;
        goldDisplay.texts.push({variable: "золото", x: 4, y: -76, size: 200, color: "#FFEF79"});
        this.objects.push(goldDisplay);

        const shopBtn = new Sprite("Магазин", "Сцена 1");
        shopBtn.looks = ["Мой актер или объект_#0.png"];
        shopBtn.setLook(0);
        shopBtn.x = 336; shopBtn.y = 981; shopBtn.size = 105;
        shopBtn.onTouch = () => transition("Магазин");
        this.objects.push(shopBtn);

        const profBtn = new Sprite("ппофиль", "Сцена 1");
        profBtn.looks = ["Мой актер или объект_#2.png"];
        profBtn.setLook(0);
        profBtn.x = -65; profBtn.y = 981; profBtn.size = 105;
        profBtn.onTouch = () => transition("ппофиль");
        this.objects.push(profBtn);

        const boxBtn = new Sprite("боксы", "Сцена 1");
        boxBtn.looks = ["Мой актер или объект_#3.png"];
        boxBtn.setLook(0);
        boxBtn.x = -65; boxBtn.y = 845; boxBtn.size = 105;
        boxBtn.onTouch = () => transition("боксы");
        this.objects.push(boxBtn);

        const help1 = new Sprite("Пон", "Сцена 1");
        help1.looks = ["Мой актер или объект_#8.png"]; help1.setLook(0); help1.x = 273; help1.y = -33;
        help1.onTouch = () => alert("Это тикеты, за них ты сможешь покупать очки в магазине. Каждые 10 секунд ты получаешь 5 тикетов.");
        this.objects.push(help1);
    },
    checkCatLook(cat) {
        const pts = Variables["Очки"];
        let look = 0;
        if (pts >= 7250) look = 47;
        else if (pts >= 7100) look = 46;
        else if (pts >= 7000) look = 45;
        else if (pts >= 6900) look = 44;
        else if (pts >= 6700) look = 43;
        else if (pts >= 6500) look = 42;
        else if (pts >= 6300) look = 41;
        else if (pts >= 6100) look = 40;
        else if (pts >= 6000) look = 39;
        else if (pts >= 5900) look = 38;
        else if (pts >= 5800) look = 37;
        else if (pts >= 5700) look = 36;
        else if (pts >= 5500) look = 35;
        else if (pts >= 5300) look = 34;
        else if (pts >= 5200) look = 33;
        else if (pts >= 5000) look = 32;
        else if (pts >= 4800) look = 31;
        else if (pts >= 4600) look = 30;
        else if (pts >= 4400) look = 29;
        else if (pts >= 4100) look = 28;
        else if (pts >= 4000) look = 27;
        else if (pts >= 3800) look = 26;
        else if (pts >= 3600) look = 25;
        else if (pts >= 3500) look = 24;
        else if (pts >= 3400) look = 23;
        else if (pts >= 3200) look = 22;
        else if (pts >= 3000) look = 21;
        else if (pts >= 2800) look = 20;
        else if (pts >= 2600) look = 19;
        else if (pts >= 2400) look = 18;
        else if (pts >= 2200) look = 17;
        else if (pts >= 2000) look = 16;
        else if (pts >= 1900) look = 15;
        else if (pts >= 1700) look = 14;
        else if (pts >= 1500) look = 13;
        else if (pts >= 1300) look = 12;
        else if (pts >= 1100) look = 11;
        else if (pts >= 1000) look = 8;
        else if (pts >= 900) look = 7;
        else if (pts >= 750) look = 6;
        else if (pts >= 600) look = 5;
        else if (pts >= 450) look = 4;
        else if (pts >= 300) look = 3;
        else if (pts >= 250) look = 2;
        else if (pts >= 100) look = 1;
        
        if (cat.lookIndex !== look) {
            cat.setLook(look);
            if (Assets.sounds["cats-meow"]) Assets.sounds["cats-meow"].play();
        }
    }
};

// Global Timers
setInterval(() => {
    Variables["Очки 2"] += 5;
    saveVars();
}, 10000);

setInterval(() => {
    Variables["золото"] += 1;
    saveVars();
}, 1000);

// Input Handling
function handleInput(ex, ey) {
    const rect = canvas.getBoundingClientRect();
    const mx = ex - rect.left;
    const my = ey - rect.top;

    if (scenes[currentScene]) {
        for (let i = scenes[currentScene].objects.length - 1; i >= 0; i--) {
            const obj = scenes[currentScene].objects[i];
            if (obj.visible && obj.onTouch && obj.contains(mx, my)) {
                obj.onTouch();
                break;
            }
        }
    }
}

canvas.addEventListener('mousedown', e => handleInput(e.clientX, e.clientY));
canvas.addEventListener('touchstart', e => {
    handleInput(e.touches[0].clientX, e.touches[0].clientY);
    e.preventDefault();
}, {passive: false});

// Asset Setup (Simulated)
Assets.loadImg("Фон.png", "Фон.png");
Assets.loadImg("Мой актер или объект.png", "Мой актер или объект.png");
Assets.loadImg("Мой актер или объект_#0.png", "Мой актер или объект_#0.png");
Assets.loadImg("Мой актер или объект_#1.png", "Мой актер или объект_#1.png");
Assets.loadImg("Мой актер или объект_#2.png", "Мой актер или объект_#2.png");
Assets.loadImg("Мой актер или объект_#3.png", "Мой актер или объект_#3.png");
Assets.loadImg("Мой актер или объект_#6.png", "Мой актер или объект_#6.png");
Assets.loadImg("Мой актер или объект_#8.png", "Мой актер или объект_#8.png");

// Main Loop
function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (scenes[currentScene]) {
        scenes[currentScene].objects.forEach(obj => obj.draw());
    }
    requestAnimationFrame(update);
}

// Start
transition("Сцена 2");
update();

// Add Shop Scene Logic
scenes["Магазин"] = {
    objects: [],
    init() {
        this.objects = [];
        const bg = new Sprite("Фон", "Магазин");
        bg.looks = ["Фон.png"]; bg.setLook(0); bg.x = 1596; bg.y = -90; bg.size = 400;
        this.objects.push(bg);

        const back = new Sprite("Назад", "Магазин");
        back.looks = ["Мой актер или объект_#0.png"]; back.setLook(0); back.x = -360; back.y = 973;
        back.onTouch = () => transition("Сцена 1");
        this.objects.push(back);

        const currencyDisp = new Sprite("Val", "Магазин");
        currencyDisp.texts.push({variable: "Очки 2", x: 297, y: 967, size: 150, color: "#FF7C7C"});
        this.objects.push(currencyDisp);

        // Action 700 -> 999
        const act1 = new Sprite("Act1", "Магазин");
        act1.looks = ["Мой актер или объект_#1.png"]; act1.setLook(0); act1.x = 1; act1.y = 629; act1.size = 70;
        act1.onTouch = () => {
            if (Variables["Очки 2"] >= 700) {
                Variables["Очки 2"] -= 700;
                Variables["Очки"] += 999;
                saveVars();
            }
        };
        this.objects.push(act1);
    }
};

// Add Boxes Scene
scenes["боксы"] = {
    objects: [],
    init() {
        this.objects = [];
        const bg = new Sprite("Фон", "боксы");
        bg.looks = ["Фон.png"]; bg.setLook(0); bg.x = 0; bg.y = 0; bg.size = 400;
        this.objects.push(bg);

        const goldDisp = new Sprite("Val", "боксы");
        goldDisp.texts.push({variable: "золото", x: 297, y: 967, size: 150, color: "#F3D605"});
        this.objects.push(goldDisp);

        const back = new Sprite("Назад", "боксы");
        back.looks = ["Мой актер или объект_#1.png"]; back.setLook(0); back.x = -360; back.y = 973;
        back.onTouch = () => transition("Сцена 1");
        this.objects.push(back);

        const box1 = new Sprite("Box1", "боксы");
        box1.looks = ["Мой актер или объект_#0.png"]; box1.setLook(0); box1.x = 192; box1.y = 557; box1.size = 80;
        box1.onTouch = () => {
            if (Variables["золото"] >= 100) {
                Variables["золото"] -= 100;
                saveVars();
                transition("Мегабоксик");
            }
        };
        this.objects.push(box1);
    }
};

// Box Opening Scenes logic (Simplified)
function createBoxScene(name, gain) {
    scenes[name] = {
        objects: [],
        init() {
            this.objects = [];
            const box = new Sprite("Box", name);
            box.looks = ["Мой актер или объект.png"]; box.setLook(0);
            box.x = 4; box.y = 1380;
            box.glide(4, -217, 1.0);
            box.onTouch = () => {
                Variables["Очки 2"] += gain;
                saveVars();
                alert(`Вы получили ${gain} тикетов!`);
                transition("Сцена 1");
            };
            this.objects.push(box);
        }
    };
}
createBoxScene("Мегабоксик", 25);
createBoxScene("гига боксик", 100);
createBoxScene("Ультра боксик", 125);
createBoxScene("супер боксик", 200);

// Profile
scenes["ппофиль"] = {
    objects: [],
    init() {
        this.objects = [];
        const bg = new Sprite("Фон", "ппофиль");
        bg.looks = ["Фон.png"]; bg.setLook(0); bg.size = 400;
        this.objects.push(bg);

        const passport = new Sprite("Passport", "ппофиль");
        passport.looks = ["Мой актер или объект.png"]; passport.setLook(0); passport.x = -3; passport.y = 505;
        passport.texts.push({variable: "Ник", x: 190, y: 767, size: 120, color: "white"});
        passport.texts.push({variable: "урофень", x: 276, y: 595, size: 120, color: "white"});
        this.objects.push(passport);

        const nickBtn = new Sprite("NickBtn", "ппофиль");
        nickBtn.looks = ["Мой актер или объект_#8.png"]; nickBtn.setLook(0); nickBtn.x = 194; nickBtn.y = 745;
        nickBtn.onTouch = () => {
            const n = prompt("Как тебя зовут?");
            if (n) { Variables["Ник"] = n; saveVars(); }
        };
        this.objects.push(nickBtn);

        const back = new Sprite("Назад", "ппофиль");
        back.looks = ["Мой актер или объект_#1.png"]; back.setLook(0); back.x = -360; back.y = 973;
        back.onTouch = () => transition("Сцена 1");
        this.objects.push(back);
    }
};
