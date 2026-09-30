// Shrinks a picture in the browser before it is saved.
//
// Phone photos are often 3–8 MB, which is far too big for a book cover and
// slow to load. This draws the picture onto a canvas at a smaller size and
// saves it as WebP (or JPEG if the browser is older), which usually brings a
// 4 MB photo down to around 30–60 KB with no visible loss at the size we show.

export const COVER_MAX_WIDTH = 400;
export const COVER_MAX_HEIGHT = 600;
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB before shrinking

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Works out the new size while keeping the original proportions
export function fitWithin(width, height, maxWidth = COVER_MAX_WIDTH, maxHeight = COVER_MAX_HEIGHT) {
  const scale = Math.min(maxWidth / width, maxHeight / height, 1);
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That file couldn't be opened as an image."));
    };
    img.src = url;
  });
}

export async function makeCover(file) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Choose an image file, such as a JPG or PNG.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`That image is ${formatBytes(file.size)}. Please choose one under 10 MB.`);
  }

  const img = await loadImage(file);
  const { width, height } = fitWithin(img.naturalWidth, img.naturalHeight);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, width, height);

  // WebP is smaller than JPEG at the same quality; fall back if unsupported
  let dataUrl = canvas.toDataURL("image/webp", 0.8);
  let type = "image/webp";
  if (!dataUrl.startsWith("data:image/webp")) {
    dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    type = "image/jpeg";
  }

  // A data URL is base64, which is about 4 bytes for every 3 bytes of image
  const bytes = Math.round((dataUrl.length - dataUrl.indexOf(",") - 1) * 0.75);

  return { dataUrl, width, height, type, bytes, originalBytes: file.size };
}
