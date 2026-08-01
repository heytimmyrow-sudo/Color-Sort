import { writeFile } from "node:fs/promises";
import QRCode from "qrcode";

const qrUrl = "https://color-sort.timmyrow.chatgpt.site";
let svg = await QRCode.toString(qrUrl, {
  type: "svg",
  margin: 4,
  width: 328,
  color: {
    dark: "#201a16",
    light: "#fffdf8"
  }
});

svg = svg
  .replace("<svg", "<svg role=\"img\" aria-labelledby=\"qrTitle qrDesc\"")
  .replace("<path ", `<title id="qrTitle">QR code for Token Columns</title><desc id="qrDesc">Scan to open ${qrUrl}</desc><path `);

await writeFile("qr-code.svg", svg);
