import "./style.css";

const titleObject: HTMLHeadElement = document.createElement("h1");
document.title = titleObject.textContent = "Sticker Sketchpad";
const app = document.querySelector<HTMLDivElement>("#app")!;

const canvas: HTMLCanvasElement = document.createElement("canvas");
canvas.width = canvas.height = 256;

interface Point {
    x: number;
    y: number;
}

interface CursorObject {
    isActive: boolean;
    pos: Point;
}

const ctx: CanvasRenderingContext2D = canvas.getContext("2d")!;
ctx.strokeStyle = "white";
const cursor: CursorObject = { isActive: false, pos: {x: 0, y: 0} };

const lines: Point[][] = [];
const redoLines: Point[][] = [];

function notify(name: string) {
    canvas.dispatchEvent(new Event(name));
}

function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const line of lines) {
      if (line.length > 1) {
        ctx.beginPath();
        const { x, y } = line[0];
        ctx.moveTo(x, y);
        for (const { x, y } of line) {
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }
  }

canvas.addEventListener("drawing-changed", redraw);

let currentline: Point[] = [];

canvas.addEventListener("mousedown", (e) => {
  cursor.isActive = true;
  cursor.pos.x = e.offsetX;
  cursor.pos.y = e.offsetY;

  currentline = [];
  lines.push(currentline);
  currentline.push({ x: cursor.pos.x, y: cursor.pos.y });

  notify("drawing-changed");
});

canvas.addEventListener("mousemove", (e) => {
  if (cursor.isActive) {
    cursor.pos.x = e.offsetX;
    cursor.pos.y = e.offsetY;

    currentline.push({ x: cursor.pos.x, y: cursor.pos.y });
  }

  notify("drawing-changed");
});

canvas.addEventListener("mouseup", () => {
  cursor.isActive = false;
  currentline = [];

  notify("drawing-changed");
});

const clearButton: HTMLButtonElement = document.createElement("button");
clearButton.textContent = "Clear";
clearButton.addEventListener("click", () => {
    lines.splice(0, lines.length);
    notify("drawing-changed");
});

const undoButon: HTMLButtonElement = document.createElement("button");
undoButon.textContent = "Undo";
undoButon.addEventListener("click", () => {
  redoLines.push(lines.pop() as Point[]);
  notify("drawing-changed");
});

const redoButton: HTMLButtonElement = document.createElement("button");
redoButton.textContent = "Redo";
redoButton.addEventListener("click", () => {
  lines.push(redoLines.pop() as Point[]);
  notify("drawing-changed");
});

app.append(titleObject);
app.append(canvas);
app.append(clearButton);
app.append(undoButon);
app.append(redoButton);