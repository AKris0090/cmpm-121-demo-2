import "./style.css";

const titleObject: HTMLHeadElement = document.createElement("h1");
document.title = titleObject.textContent = "Sticker Sketchpad";
const app = document.querySelector<HTMLDivElement>("#app")!;
const canvas: HTMLCanvasElement = document.createElement("canvas");
canvas.width = canvas.height = 256;
const ctx: CanvasRenderingContext2D = canvas.getContext("2d")!;
ctx.strokeStyle = "white";
const cursor: CursorObject = { isActive: false, 
  needsDraw: false,
  pos: {x: 0, y: 0},
  display(ctx) {
    ctx.beginPath();
    ctx.arc(cursor.pos.x, cursor.pos.y, currentThickness, 0, 2 * Math.PI);
    ctx.stroke();
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

let currentThickness: number = 1;

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

const lines: markerLine[] = [];
const redoLines: markerLine[] = [];

function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    lines.forEach((line) => {line.display(ctx);});

    if(cursor.needsDraw) {
      cursor.display(ctx);
    }
}

canvas.addEventListener("drawing-changed", redraw);
canvas.addEventListener("tool-moved", redraw);

let currentline: markerLine = createMarkerLine({ x: 0, y: 0 });

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

  currentline = createMarkerLine({ x: cursor.pos.x, y: cursor.pos.y });
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
});

const thinButton: HTMLButtonElement = document.createElement("button");
thinButton.textContent = "Thin";
thinButton.addEventListener("click", () => {
  notify("stroke-thin");
});
thinButton.classList.add("buttonSelected");

function toggleButtons() {
  thinButton.classList.toggle("buttonSelected");
  thickButton.classList.toggle("buttonSelected");
}

canvas.addEventListener("stroke-thick", () => {setStroke(5); toggleButtons()});
canvas.addEventListener("stroke-thin", () => {setStroke(1); toggleButtons()});

app.append(titleObject);
app.append(canvas);
app.append(clearButton);
app.append(undoButon);
app.append(redoButton);
app.append(thickButton);
app.append(thinButton);