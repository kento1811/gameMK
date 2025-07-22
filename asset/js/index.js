const canvas = document.getElementById("blabla");
const ctx = canvas.getContext("2d");
const CANVAS_CENTER_X = canvas.width / 2;
const CANVAS_CENTER_Y = canvas.height / 2;
const IMAGE_ENLARGE = 11;
const HEART_COLOR = "#f76070";
const FRAME_COUNT = 60;

function heartFunction(t, shrinkRatio = IMAGE_ENLARGE) {
    let x = 16 * Math.pow(Math.sin(t), 3);
    let y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));

    x *= shrinkRatio;
    y *= shrinkRatio;
    x += CANVAS_CENTER_X;
    y += CANVAS_CENTER_Y;

    return [x, y];
}

function scatterInside(x, y, beta = 0.15) {
    const ratioX = -beta * Math.log(Math.random());
    const ratioY = -beta * Math.log(Math.random());
    const dx = ratioX * (x - CANVAS_CENTER_X);
    const dy = ratioY * (y - CANVAS_CENTER_Y);
    return [x - dx, y - dy];
}

function shrink(x, y, ratio) {
    const force = -1 / Math.pow((Math.pow(x - CANVAS_CENTER_X, 2) + Math.pow(y - CANVAS_CENTER_Y, 2)), 0.6);
    const dx = ratio * force * (x - CANVAS_CENTER_X);
    const dy = ratio * force * (y - CANVAS_CENTER_Y);
    return [x - dx, y - dy];
}

function curve(p) {
    return 2 * (2 * Math.sin(4 * p)) / (2 * Math.PI);
}

class Heart {
    constructor() {
        this.points = new Set();
        this.edgeDiffusionPoints = new Set();
        this.centerDiffusionPoints = new Set();
        this.allFrames = [];
        this.build(2000);
        for (let i = 0; i < FRAME_COUNT; i++) {
            this.calc(i);
        }
    }

    build(number) {
        for (let i = 0; i < number; i++) {
            const t = Math.random() * 2 * Math.PI;
            this.points.add(heartFunction(t).toString());
        }

        for (let p of this.points) {
            const [x, y] = p.split(",").map(Number);
            for (let i = 0; i < 3; i++) {
                this.edgeDiffusionPoints.add(scatterInside(x, y).toString());
            }
        }

        const pointList = Array.from(this.points);
        for (let i = 0; i < 4000; i++) {
            const [x, y] = pointList[Math.floor(Math.random() * pointList.length)].split(",").map(Number);
            this.centerDiffusionPoints.add(scatterInside(x, y, 0.17).toString());
        }
    }

    calc(frameIndex) {
        const ratio = 10 * curve(frameIndex / 10 * Math.PI);
        const haloRadius = 4 + 6 * (1 + curve(frameIndex / 10 * Math.PI));
        const haloNumber = 3000 + 4000 * Math.pow(curve(frameIndex / 10 * Math.PI), 2);

        const allPoints = [];
        const haloSet = new Set();

        for (let i = 0; i < haloNumber; i++) {
            const t = Math.random() * 2 * Math.PI;
            let [x, y] = heartFunction(t, 11.6);
            [x, y] = shrink(x, y, haloRadius);
            const key = `${Math.round(x)},${Math.round(y)}`;
            if (!haloSet.has(key)) {
                haloSet.add(key);
                x += Math.floor(Math.random() * 29 - 14);
                y += Math.floor(Math.random() * 29 - 14);
                const size = Math.random() < 0.33 ? 1 : 2;
                allPoints.push([x, y, size]);
            }
        }

        for (let p of this.points) {
            let [x, y] = p.split(",").map(Number);
            [x, y] = this.calcPosition(x, y, ratio);
            const size = Math.floor(Math.random() * 3) + 1;
            allPoints.push([x, y, size]);
        }

        for (let p of this.edgeDiffusionPoints) {
            let [x, y] = p.split(",").map(Number);
            [x, y] = this.calcPosition(x, y, ratio);
            const size = Math.random() < 0.5 ? 1 : 2;
            allPoints.push([x, y, size]);
        }

        for (let p of this.centerDiffusionPoints) {
            let [x, y] = p.split(",").map(Number);
            [x, y] = this.calcPosition(x, y, ratio);
            const size = Math.random() < 0.5 ? 1 : 2;
            allPoints.push([x, y, size]);
        }

        this.allFrames.push(allPoints);
    }

    calcPosition(x, y, ratio) {
        const force = 1 / Math.pow((Math.pow(x - CANVAS_CENTER_X, 2) + Math.pow(y - CANVAS_CENTER_Y, 2)), 0.52);
        const dx = ratio * force * (x - CANVAS_CENTER_X) + (Math.random() * 3 - 1);
        const dy = ratio * force * (y - CANVAS_CENTER_Y) + (Math.random() * 3 - 1);
        return [x - dx, y - dy];
    }

    render(frameIndex) {
        for (let [x, y, size] of this.allFrames[frameIndex % FRAME_COUNT]) {
            ctx.fillStyle = HEART_COLOR;
            ctx.fillRect(x, y, size, size);
        }
    }
}

let lastBeatTime = performance.now();
const BEAT_INTERVAL = 100;
let currentFrame = 0;
const heart = new Heart();
let lastTime = performance.now();

function animate() {
    const now = performance.now();
    if (now - lastTime >= BEAT_INTERVAL) {
        currentFrame = (currentFrame + 1) % FRAME_COUNT;
        lastTime = now;
    }

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    heart.render(currentFrame);

    requestAnimationFrame(animate);
}

animate();