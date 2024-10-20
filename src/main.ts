import "./style.css";

const CANVAS_SIZE = 256;
const THIN_STROKE = 1;
const THICK_STROKE = 5;
const STROKE_COLOR = "white";

const titleObject: HTMLHeadElement = document.createElement("h1");
const canvas: HTMLCanvasElement = document.createElement("canvas");
const initialSpacer: HTMLDivElement = document.createElement("div");
const secondSpacer: HTMLDivElement = document.createElement("div");
const customSpacer: HTMLDivElement = document.createElement("div");
const app = document.querySelector<HTMLDivElement>("#app")!;
const ctx: CanvasRenderingContext2D = canvas.getContext("2d")!;

document.title = titleObject.textContent = "Sticker Sketchpad";
canvas.width = canvas.height = CANVAS_SIZE;
ctx.strokeStyle = STROKE_COLOR;
let currentThickness: number = THIN_STROKE;

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
  button: HTMLButtonElement;
  stickerObj: markerLine;
}

let currentline: markerLine = createMarkerLine({ x: 0, y: 0 });
let currentSticker: stickerObject | null = null;
const lines: markerLine[] = [];
const redoLines: markerLine[] = [];

const cursor: CursorObject = { 
  isActive: false, 
  needsDraw: false,
  pos: {x: 0, y: 0},
  display(ctx) {
    ctx.arc(cursor.pos.x, cursor.pos.y, currentThickness, 0, 2 * Math.PI);
  }
}

function notify(name: string) {
  canvas.dispatchEvent(new Event(name));
}

const stickerKeys = ["🏢", "🦖", "🔥"];

const stickers: stickerObject[] = [];
stickerKeys.forEach((key) => {
  addButton(key);
});

function addButton(sticker: string) {
  const currentStickerObject: stickerObject = {sticker: sticker, isPlaced: false, button: document.createElement("button"), stickerObj: createSticker({x: -100, y: -100}, sticker)};
  currentStickerObject.button.textContent = currentStickerObject.sticker;
  currentStickerObject.button.addEventListener("click", () => {
    cursorSticker(currentStickerObject.sticker);
    currentSticker = currentStickerObject;
    notify("tool-moved");
  });
  stickers.push(currentStickerObject);
  secondSpacer.append(currentStickerObject.button);
}

function cursorSticker(sticker: string) {
  cursor.display = () =>{
    ctx.font = "60px monospace";
    ctx.fillText(sticker, cursor.pos.x - 30, cursor.pos.y + 30);
  }
}

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
initialSpacer.append(clearButton);

const undoButon: HTMLButtonElement = document.createElement("button");
undoButon.textContent = "Undo";
undoButon.addEventListener("click", () => {
  lines.length > 0 ? redoLines.push(lines.pop() as markerLine) : null;
  notify("drawing-changed");
});
initialSpacer.append(undoButon);

const redoButton: HTMLButtonElement = document.createElement("button");
redoButton.textContent = "Redo";
redoButton.addEventListener("click", () => {
  redoLines.length > 0 ? lines.push(redoLines.pop() as markerLine): null;
  notify("drawing-changed");
});
initialSpacer.append(redoButton);

const thickButton: HTMLButtonElement = document.createElement("button");
thickButton.textContent = "Thick";
thickButton.addEventListener("click", () => {
  notify("stroke-thick");
  currentSticker = null;
  cursor.display = () => {
    ctx.arc(cursor.pos.x, cursor.pos.y, currentThickness, 0, 2 * Math.PI);
  };
});
initialSpacer.append(thickButton);

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
initialSpacer.append(thinButton);

function addCustomSticker() {
  const key: string | null = prompt("Enter a single character to use as a sticker");

  if (key === null || key.trim() === "") {
    console.error("Invalid input. Please enter a single character.");
    return;
  }

  addButton(key);
}

const customButton: HTMLButtonElement = document.createElement("button");
customButton.textContent = "Custom Sticker";
customButton.addEventListener("click", addCustomSticker);
customSpacer.append(customButton);

function toggleButtons() {
  thinButton.classList.toggle("buttonSelected");
  thickButton.classList.toggle("buttonSelected");
}

canvas.addEventListener("stroke-thick", () => {setStroke(THICK_STROKE); toggleButtons()});
canvas.addEventListener("stroke-thin", () => {setStroke(THIN_STROKE); toggleButtons()});

app.append(titleObject);
app.append(canvas);
app.append(initialSpacer);
app.append(secondSpacer);
app.append(customSpacer);