const MAX_BANNER_BYTES = 2.5 * 1024 * 1024;
const MAX_BANNER_WIDTH = 1600;
const MAX_BANNER_HEIGHT = 900;

const loadImage = (file) => new Promise((resolve, reject) => {
  const objectUrl = URL.createObjectURL(file);
  const image = new Image();
  image.onload = () => resolve({ image, objectUrl });
  image.onerror = () => {
    URL.revokeObjectURL(objectUrl);
    reject(new Error("The selected banner image could not be read."));
  };
  image.src = objectUrl;
});

const canvasToBlob = (canvas, quality) => new Promise((resolve, reject) => {
  canvas.toBlob(
    (blob) => blob ? resolve(blob) : reject(new Error("The banner image could not be prepared for upload.")),
    "image/jpeg",
    quality,
  );
});

export const prepareBannerImage = async (file) => {
  if (!file) return null;
  if (!String(file.type || "").startsWith("image/")) {
    throw new Error("Please select a valid image file.");
  }

  if (file.size <= MAX_BANNER_BYTES) return file;

  const { image, objectUrl } = await loadImage(file);
  try {
    const scale = Math.min(
      1,
      MAX_BANNER_WIDTH / image.naturalWidth,
      MAX_BANNER_HEIGHT / image.naturalHeight,
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    let quality = 0.82;
    let blob = await canvasToBlob(canvas, quality);
    while (blob.size > MAX_BANNER_BYTES && quality > 0.5) {
      quality -= 0.1;
      blob = await canvasToBlob(canvas, quality);
    }

    if (blob.size > MAX_BANNER_BYTES) {
      throw new Error("The banner is still too large after resizing. Please choose a smaller image.");
    }

    const baseName = String(file.name || "course-banner").replace(/\.[^.]+$/, "");
    return new File([blob], `${baseName}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};
