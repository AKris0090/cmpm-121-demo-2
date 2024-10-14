import "./style.css";

const APP_NAME = "Sticker Sketchpad";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;

const title = document.createElement("h1");
title.textContent = APP_NAME;
app.append(title);

const canvas = document.createElement("canvas");
canvas.width = canvas.height = 256;
app.append(canvas);