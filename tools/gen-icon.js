const sharp = require("sharp");
const path = require("path");

const GREEN = "#2E6F40";
const GREEN_DARK = "#1F5230";
const GREEN_LIGHT = "#A9DCB8";

function glyphGroup({ scale = 1, includeStar = true, monochrome = null }) {
  const cx = 512;
  const cy = 512;
  const frontFill = monochrome ?? "#FFFFFF";
  const backLeftFill = monochrome ?? GREEN_DARK;
  const backRightFill = monochrome ?? GREEN_LIGHT;
  const starFill = monochrome ?? GREEN;
  const dotColors = monochrome ? [monochrome, monochrome, monochrome, monochrome] : ["#3B82F6", "#8B5CF6", "#F59E0B", "#EC4899"];

  return `
  <g transform="translate(${cx} ${cy}) scale(${scale}) translate(${-cx} ${-cy})">
    <g transform="rotate(-16 ${cx} ${cy})">
      <rect x="382" y="332" width="260" height="360" rx="40" fill="${backLeftFill}"/>
    </g>
    <g transform="rotate(16 ${cx} ${cy})">
      <rect x="382" y="332" width="260" height="360" rx="40" fill="${backRightFill}"/>
    </g>
    <g>
      <rect x="372" y="322" width="280" height="380" rx="44" fill="${frontFill}"/>
      ${includeStar ? `<path transform="translate(0 -6)" d="M512 380 l24 50 55 8 -40 39 10 55 -49 -26 -49 26 10 -55 -40 -39 55 -8 z" fill="${starFill}"/>` : ""}
      <circle cx="437" cy="642" r="16" fill="${dotColors[0]}"/>
      <circle cx="487" cy="642" r="16" fill="${dotColors[1]}"/>
      <circle cx="537" cy="642" r="16" fill="${dotColors[2]}"/>
      <circle cx="587" cy="642" r="16" fill="${dotColors[3]}"/>
    </g>
  </g>`;
}

function svgFull() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
    <rect width="1024" height="1024" fill="${GREEN}"/>
    ${glyphGroup({ scale: 1 })}
  </svg>`;
}

function svgForeground() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
    ${glyphGroup({ scale: 0.62 })}
  </svg>`;
}

function svgMonochrome() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
    ${glyphGroup({ scale: 0.62, includeStar: true, monochrome: "#FFFFFF" })}
  </svg>`;
}

function svgBackground() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
    <rect width="1024" height="1024" fill="${GREEN}"/>
  </svg>`;
}

const outDir = path.resolve(__dirname, "../app/assets");

async function run() {
  await sharp(Buffer.from(svgFull())).resize(1024, 1024).png().toFile(path.join(outDir, "icon.png"));
  await sharp(Buffer.from(svgForeground())).resize(1024, 1024).png().toFile(path.join(outDir, "android-icon-foreground.png"));
  await sharp(Buffer.from(svgMonochrome())).resize(1024, 1024).png().toFile(path.join(outDir, "android-icon-monochrome.png"));
  await sharp(Buffer.from(svgBackground())).resize(1024, 1024).png().toFile(path.join(outDir, "android-icon-background.png"));
  await sharp(Buffer.from(svgForeground())).resize(1024, 1024).png().toFile(path.join(outDir, "splash-icon.png"));
  await sharp(Buffer.from(svgFull())).resize(196, 196).png().toFile(path.join(outDir, "favicon.png"));
  console.log("Icone generate in", outDir);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
