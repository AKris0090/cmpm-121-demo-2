import "./style.css";

const APP_NAME = "Sticker Sketchpad";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;

const title: HTMLHeadElement = document.createElement("h1");
title.textContent = APP_NAME;
app.append(title);

const canvas: HTMLCanvasElement = document.createElement("canvas");
canvas.width = canvas.height = 256;
app.append(canvas);

const clearButton: HTMLButtonElement = document.createElement("button");
clearButton.textContent = "Clear";
app.append(clearButton);

const ctx: CanvasRenderingContext2D = canvas.getContext("2d")!;
const cursor = { isActive: false, x: 0, y: 0 };

canvas.addEventListener("mousedown", (e) => {
  cursor.isActive = true;
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;
});

canvas.addEventListener("mousemove", (e) => {
  if (cursor.isActive) {
    ctx.beginPath();
    ctx.moveTo(cursor.x, cursor.y);
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
  }
});

canvas.addEventListener("mouseup", () => {
  cursor.isActive = false;
});

clearButton.addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});