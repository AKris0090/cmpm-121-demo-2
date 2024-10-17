import "./style.css";

const titleObject: HTMLHeadElement = document.createElement("h1");
document.title = titleObject.textContent = "Sticker Sketchpad";
const app = document.querySelector<HTMLDivElement>("#app")!;
const canvas: HTMLCanvasElement = document.createElement("canvas");
canvas.width = canvas.height = 256;
const ctx: CanvasRenderingContext2D = canvas.getContext("2d")!;
ctx.strokeStyle = "white";
let currentThickness: number = 1;
const cursor: CursorObject = { isActive: false, 
  needsDraw: false,
  pos: {x: 0, y: 0},
  display(ctx) {
    ctx.arc(cursor.pos.x, cursor.pos.y, currentThickness, 0, 2 * Math.PI);
  }};
function notify(name: string) {
    canvas.dispatchEvent(new Event(name));
}

interface Point {
    x: number;
    y: number;
}

interface CursorObject {
    isActive: boolean;
    needsDraw: boolean;
    pos: Point;

    display(ctx: CanvasRenderingContext2D): void;
}

interface markerLine {
    points: Point[];
    thickness: number;

    display(ctx: CanvasRenderingContext2D): void;
    drag(nextPoint: Point): void;
}

interface stickerObject {
  sticker: string;
  isPlaced: boolean;
  stickerObj: markerLine;
}

const stickers: stickerObject[] = [
  {sticker: "🏢", isPlaced: false, stickerObj: createSticker({x: -100, y: -100}, "🏢")},
  {sticker: "🦖", isPlaced: false, stickerObj: createSticker({x: -100, y: -100}, "🦖")},
  {sticker: "🔥", isPlaced: false, stickerObj: createSticker({x: -100, y: -100}, "🔥")}
];

function createMarkerLine(p: Point): markerLine {
    return {points: [p], 
        thickness: currentThickness,
        display(ctx: CanvasRenderingContext2D) {  
            ctx.lineWidth = this.thickness;        
            ctx.beginPath();
            const { x, y } = this.points[0];
            ctx.moveTo(x, y);
            for (const { x, y } of this.points) {
              ctx.lineTo(x, y);
            }
            ctx.stroke();
        },
        drag(nextPoint: Point) {
            this.points.push(nextPoint);
        }
    };
}

function createSticker(p: Point, sticker: string): markerLine {
    return {points: [p], 
        thickness: currentThickness,
        display(ctx: CanvasRenderingContext2D) {  
            ctx.font = "60px monospace";
            ctx.fillText(sticker, this.points[0].x - 30, this.points[0].y + 30);
        },
        drag(nextPoint: Point) {
          this.points.pop();
          this.points.push(nextPoint);
        }
    };
}

const lines: markerLine[] = [];
const redoLines: markerLine[] = [];

function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    lines.forEach((line) => {line.display(ctx);});

    if(cursor.needsDraw) {
      ctx.beginPath();
      cursor.display(ctx);
      ctx.stroke();
    }
}

canvas.addEventListener("drawing-changed", redraw);
canvas.addEventListener("tool-moved", redraw);

let currentline: markerLine = createMarkerLine({ x: 0, y: 0 });
let currentSticker: stickerObject | null = null;

canvas.addEventListener("mouseout", () => {
  cursor.needsDraw = false;
  notify("tool-moved");
});

canvas.addEventListener("mouseenter", () => {
  cursor.needsDraw = true;
  notify("tool-moved");
});

canvas.addEventListener("mousedown", (e) => {
  cursor.isActive = true;
  cursor.pos.x = e.offsetX;
  cursor.pos.y = e.offsetY;

  if(currentSticker != null)  {
      currentSticker.isPlaced = true;
      currentline = currentSticker.stickerObj;
      currentline.drag({x: cursor.pos.x, y: cursor.pos.y});
  } else {
    currentline = createMarkerLine({ x: cursor.pos.x, y: cursor.pos.y });
  }
  lines.push(currentline);

  notify("drawing-changed");
});

canvas.addEventListener("mousemove", (e) => {
  notify("tool-moved");
  cursor.pos.x = e.offsetX;
  cursor.pos.y = e.offsetY;
  if (cursor.isActive) {
      currentline.drag({ x: cursor.pos.x, y: cursor.pos.y });
  }

  notify("drawing-changed");
});

canvas.addEventListener("mouseup", () => {
  cursor.isActive = false;

  notify("drawing-changed");
});

function setStroke(stroke: number) {
  currentThickness = stroke;
}

const clearButton: HTMLButtonElement = document.createElement("button");
clearButton.textContent = "Clear";
clearButton.addEventListener("click", () => {
    lines.splice(0, lines.length);
    notify("drawing-changed");
});

const undoButon: HTMLButtonElement = document.createElement("button");
undoButon.textContent = "Undo";
undoButon.addEventListener("click", () => {
  lines.length > 0 ? redoLines.push(lines.pop() as markerLine) : null;
  notify("drawing-changed");
});

const redoButton: HTMLButtonElement = document.createElement("button");
redoButton.textContent = "Redo";
redoButton.addEventListener("click", () => {
  redoLines.length > 0 ? lines.push(redoLines.pop() as markerLine): null;
  notify("drawing-changed");
});

const thickButton: HTMLButtonElement = document.createElement("button");
thickButton.textContent = "Thick";
thickButton.addEventListener("click", () => {
  notify("stroke-thick");
  currentSticker = null;
  cursor.display = () => {
    ctx.arc(cursor.pos.x, cursor.pos.y, currentThickness, 0, 2 * Math.PI);
  };
});

const thinButton: HTMLButtonElement = document.createElement("button");
thinButton.textContent = "Thin";
thinButton.addEventListener("click", () => {
  notify("stroke-thin");
  currentSticker = null;
  cursor.display = () => {
    ctx.arc(cursor.pos.x, cursor.pos.y, currentThickness, 0, 2 * Math.PI);
  };
});
thinButton.classList.add("buttonSelected");

function toggleButtons() {
  thinButton.classList.toggle("buttonSelected");
  thickButton.classList.toggle("buttonSelected");
}

canvas.addEventListener("stroke-thick", () => {setStroke(5); toggleButtons()});
canvas.addEventListener("stroke-thin", () => {setStroke(1); toggleButtons()});

const buildingButton: HTMLButtonElement = document.createElement("button");
buildingButton.textContent = "🏢";
buildingButton.addEventListener("click", () => {
  cursor.display = () =>{ctx.font = "60px monospace";
  ctx.fillText("🏢", cursor.pos.x - 30, cursor.pos.y + 30);};
  currentSticker = stickers[0];
  notify("tool-moved");
});

const dinoButton: HTMLButtonElement = document.createElement("button");
dinoButton.textContent = "🦖";
dinoButton.addEventListener("click", () => {
  cursor.display = () =>{ctx.font = "60px monospace";
  ctx.fillText("🦖", cursor.pos.x - 30, cursor.pos.y + 30);};
  currentSticker = stickers[1];
  notify("tool-moved");
});

const fireButton: HTMLButtonElement = document.createElement("button");
fireButton.textContent = "🔥";
fireButton.addEventListener("click", () => {
  cursor.display = () =>{ctx.font = "60px monospace";
  ctx.fillText("🔥", cursor.pos.x - 30, cursor.pos.y + 30);};
  currentSticker = stickers[2];
  notify("tool-moved");
});

const initialSpacer: HTMLDivElement = document.createElement("div");
const secondSpacer: HTMLDivElement = document.createElement("div");

app.append(titleObject);
app.append(canvas);
app.append(initialSpacer);
initialSpacer.append(clearButton);
initialSpacer.append(undoButon);
initialSpacer.append(redoButton);
initialSpacer.append(thickButton);
initialSpacer.append(thinButton);
app.append(secondSpacer);
secondSpacer.append(buildingButton);
secondSpacer.append(dinoButton);
secondSpacer.append(fireButton);