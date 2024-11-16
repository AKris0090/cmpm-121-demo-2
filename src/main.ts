import "./style.css";

// HTML CONSTANTS

const titleObject: HTMLHeadElement = document.createElement("h1");
const canvas: HTMLCanvasElement = document.createElement("canvas");
const initialSpacer: HTMLDivElement = document.createElement("div");
const secondSpacer: HTMLDivElement = document.createElement("div");
const customSpacer: HTMLDivElement = document.createElement("div");
const slider: HTMLInputElement = document.createElement("input");
const app = document.querySelector<HTMLDivElement>("#app")!;
const ctx: CanvasRenderingContext2D = canvas.getContext("2d")!;

// CANVAS CONSTANTS

const CANVAS_SIZE = 256;
const EXPORT_SIZE = 1024;
const THIN_STROKE = 2;
const THICK_STROKE = 5;
let STROKE_COLOR = "hsl(360, 100%, 50%)";

document.title = titleObject.textContent = "Sticker Sketchpad";
canvas.width = canvas.height = CANVAS_SIZE;
ctx.strokeStyle = STROKE_COLOR;
let currentThickness: number = THIN_STROKE;

// PREVIEW SQUARE SETUP

const square: HTMLDivElement = document.createElement("div");
square.className = "square";
square.style.backgroundColor = STROKE_COLOR;

// SLIDER SETUP

const sliderSpacer: HTMLDivElement = document.createElement("div");
const sliderText: HTMLDivElement = document.createElement("div");
slider.type = "range";
slider.min = "0";
slider.max = "360";
slider.value = "360";
slider.classList.add("slider");
slider.oninput = updateSliderText;
sliderSpacer.append(slider);
sliderSpacer.append(square);

function updateSliderText() {
  sliderText.innerHTML = `Color Value (Hue): ${slider.value}`;
  STROKE_COLOR = `hsl(${slider.value}, 100%, 50%)`;
  square.style.backgroundColor = STROKE_COLOR;
  ctx.strokeStyle = STROKE_COLOR;
}

// INTERFACES

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
  color: string;

  display(ctx: CanvasRenderingContext2D): void;
  drag(nextPoint: Point): void;
}

interface stickerObject {
  sticker: string;
  isPlaced: boolean;
  button: HTMLButtonElement;
  stickerObj: markerLine;
}

// GLOBAL CURRENT VARIABLES

let currentline: markerLine = createMarkerLine({ x: 0, y: 0 });
let currentSticker: stickerObject | null = null;
const lines: markerLine[] = [];
const redoLines: markerLine[] = [];

const cursor: CursorObject = {
  isActive: false,
  needsDraw: false,
  pos: { x: 0, y: 0 },
  display(ctx) {
    ctx.rect(cursor.pos.x, cursor.pos.y, currentThickness/100, currentThickness/100);
  },
};

function notify(name: string) {
  canvas.dispatchEvent(new Event(name));
}

// STICKERS 

const stickerKeys = ["🏢", "🦖", "🔥"];

const stickers: stickerObject[] = [];
stickerKeys.forEach((key) => {
  addSticker(key);
});

function addSticker(sticker: string) {
  const currentStickerObject: stickerObject = {
    sticker: sticker,
    isPlaced: false,
    button: document.createElement("button"),
    stickerObj: createSticker({ x: -100, y: -100 }, sticker),
  };
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
  cursor.display = () => {
    ctx.font = "60px monospace";
    ctx.fillText(sticker, cursor.pos.x - 30, cursor.pos.y + 30);
  };
}

function createMarkerLine(p: Point): markerLine {
  return {
    points: [p],
    thickness: currentThickness,
    color: STROKE_COLOR,
    display(ctx: CanvasRenderingContext2D) {
      ctx.strokeStyle = this.color;
      ctx.lineWidth = this.thickness;
      ctx.beginPath();
      const { x, y } = this.points[0];
      ctx.moveTo(x, y);
      for (const { x, y } of this.points) ctx.lineTo(x, y);
      ctx.stroke();
    },
    drag(nextPoint: Point) {
      this.points.push(nextPoint);
    },
  };
}

function createSticker(p: Point, sticker: string): markerLine {
  return {
    points: [p],
    thickness: currentThickness,
    color: STROKE_COLOR,
    display(ctx: CanvasRenderingContext2D) {
      ctx.font = "60px monospace";
      ctx.fillText(sticker, this.points[0].x - 30, this.points[0].y + 30);
    },
    drag(nextPoint: Point) {
      this.points.pop();
      this.points.push(nextPoint);
    },
  };
}

function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  lines.forEach((line) => {
    line.display(ctx);
  });

  if (cursor.needsDraw) {
    ctx.beginPath();
    cursor.display(ctx);
    ctx.stroke();
  }
}

// CANVAS BEHAVIOR

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

  if (currentSticker != null) {
    currentSticker.isPlaced = true;
    currentline = currentSticker.stickerObj;
    currentline.drag({ x: cursor.pos.x, y: cursor.pos.y });
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
  if (cursor.isActive) currentline.drag({ x: cursor.pos.x, y: cursor.pos.y });

  notify("drawing-changed");
});

canvas.addEventListener("mouseup", () => {
  cursor.isActive = false;

  notify("drawing-changed");
});

function setStroke(stroke: number) {
  currentThickness = stroke;
}

// BUTTON CREATION HELPER FUNCTION (CREDITS TO BRACE)
function createButton(
  text: string,
  onClick: () => void,
  selected: boolean = false
): HTMLButtonElement {
  const button = document.createElement("button");
  button.textContent = text;
  button.addEventListener("click", onClick);
  if (selected) button.classList.add("buttonSelected");
  return button;
}

const clearButton = createButton("Clear", () => {
  lines.splice(0, lines.length);
  notify("drawing-changed");
});

const undoButton = createButton("Undo", () => {
  lines.length > 0 ? redoLines.push(lines.pop() as markerLine) : null;
  notify("drawing-changed");
});

const redoButton = createButton("Redo", () => {
  redoLines.length > 0 ? lines.push(redoLines.pop() as markerLine) : null;
  notify("drawing-changed");
});

const thickButton = createButton("Thick", () => {
  notify("stroke-thick");
  currentSticker = null;
  cursor.display = () => {
    ctx.lineWidth = currentThickness;
    ctx.rect(cursor.pos.x, cursor.pos.y, currentThickness/100, currentThickness/100);
  };
});

const thinButton = createButton(
  "Thin",
  () => {
    notify("stroke-thin");
    currentSticker = null;
    cursor.display = () => {
      ctx.lineWidth = currentThickness;
      ctx.rect(cursor.pos.x, cursor.pos.y, currentThickness/100, currentThickness/100);
    };
  },
  true
);

// CUSTOM STICKER BUTTON SETUP

function addCustomSticker() {
  const key: string | null = prompt(
    "Enter a single character to use as a sticker"
  );

  if (key === null || key.trim() === "") {
    console.error("Invalid input. Please enter a single character.");
    return;
  }

  addSticker(key);
}

const customButton: HTMLButtonElement = createButton(
  "Custom Sticker",
  addCustomSticker,
  false
);

function toggleButtons() {
  thinButton.classList.toggle("buttonSelected");
  thickButton.classList.toggle("buttonSelected");
}

canvas.addEventListener("stroke-thick", () => {
  setStroke(THICK_STROKE);
  toggleButtons();
});
canvas.addEventListener("stroke-thin", () => {
  setStroke(THIN_STROKE);
  toggleButtons();
});

// EXPORT BUTTON SETUP

function exportCanvas() {
  const newCanvas: HTMLCanvasElement = document.createElement("canvas");
  newCanvas.width = newCanvas.height = EXPORT_SIZE;
  const newContext: CanvasRenderingContext2D = newCanvas.getContext("2d")!;
  newContext.strokeStyle = STROKE_COLOR;
  newContext.scale(4, 4);
  lines.forEach((line) => {
    line.display(newContext);
  });

  const link: HTMLAnchorElement = document.createElement("a");
  link.href = newCanvas.toDataURL();
  link.download = "sticker.png";
  link.click();
}

const exportButton: HTMLButtonElement = createButton(
  "Export",
  exportCanvas,
  false
);

// APPEND ELEMENTS TO HTML

app.append(
  titleObject,
  canvas,
  initialSpacer,
  secondSpacer,
  customSpacer,
  sliderSpacer
);
customSpacer.append(customButton, exportButton);
initialSpacer.append(
  clearButton,
  undoButton,
  redoButton,
  thickButton,
  thinButton
);
app.append(sliderText);
updateSliderText();
