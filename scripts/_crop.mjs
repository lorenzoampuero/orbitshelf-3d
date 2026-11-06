import sharp from "sharp";
const [,, file, top, h, out] = process.argv;
const img = sharp(file);
const m = await img.metadata();
await sharp(file).extract({ left: 0, top: +top, width: m.width, height: Math.min(+h, m.height - +top) }).toFile(out);
