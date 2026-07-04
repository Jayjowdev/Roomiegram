type PrepareImageOptions = {
  width: number;
  height: number;
  quality?: number;
  background?: string;
};

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("No se pudo preparar la imagen."));
    image.src = source;
  });
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
    reader.readAsDataURL(file);
  });
}

export async function prepareImageForUpload(file: File, options: PrepareImageOptions) {
  const source = await readFileAsDataUrl(file);
  const image = await loadImage(source);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("No se pudo preparar la imagen.");
  }

  const { width, height, quality = 0.9, background = "#f6faf8" } = options;
  canvas.width = width;
  canvas.height = height;

  context.fillStyle = background;
  context.fillRect(0, 0, width, height);

  const ratio = Math.min(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = Math.round(image.naturalWidth * ratio);
  const drawHeight = Math.round(image.naturalHeight * ratio);
  const dx = Math.round((width - drawWidth) / 2);
  const dy = Math.round((height - drawHeight) / 2);

  context.drawImage(image, dx, dy, drawWidth, drawHeight);
  return canvas.toDataURL("image/jpeg", quality);
}
