import { useRef, useState } from "react";
import type { PointerEvent } from "react";

type Selection = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type ImageCropperProps = {
  aspect?: number;
  outputWidth?: number;
  outputHeight?: number;
  source: string;
  title?: string;
  onCancel: () => void;
  onSave: (image: string) => void;
};

const defaultSelection: Selection = {
  x: 20,
  y: 20,
  width: 60,
  height: 60,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function buildSelection(startX: number, startY: number, currentX: number, currentY: number) {
  const x = Math.min(startX, currentX);
  const y = Math.min(startY, currentY);
  const width = Math.abs(currentX - startX);
  const height = Math.abs(currentY - startY);

  return {
    x: clamp(x, 0, 100),
    y: clamp(y, 0, 100),
    width: clamp(width, 3, 100 - x),
    height: clamp(height, 3, 100 - y),
  };
}

function cropImage(source: string, selection: Selection, outputWidth: number) {
  return new Promise<string>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      if (!context) {
        reject(new Error("No se pudo preparar el recorte."));
        return;
      }

      const sx = (selection.x / 100) * image.naturalWidth;
      const sy = (selection.y / 100) * image.naturalHeight;
      const sw = (selection.width / 100) * image.naturalWidth;
      const sh = (selection.height / 100) * image.naturalHeight;
      const safeWidth = Math.max(sw, 1);
      const safeHeight = Math.max(sh, 1);
      const outputHeight = Math.round(outputWidth * (safeHeight / safeWidth));

      canvas.width = outputWidth;
      canvas.height = outputHeight;
      context.drawImage(image, sx, sy, safeWidth, safeHeight, 0, 0, outputWidth, outputHeight);
      resolve(canvas.toDataURL("image/jpeg", 0.9));
    };
    image.onerror = () => reject(new Error("No se pudo cargar la imagen."));
    image.src = source;
  });
}

export function ImageCropper({
  outputWidth = 900,
  source,
  title = "Recortar foto",
  onCancel,
  onSave,
}: ImageCropperProps) {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const [selection, setSelection] = useState<Selection>(defaultSelection);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const getPoint = (clientX: number, clientY: number) => {
    const rect = imageRef.current?.getBoundingClientRect();
    if (!rect) return null;

    return {
      x: clamp(((clientX - rect.left) / rect.width) * 100, 0, 100),
      y: clamp(((clientY - rect.top) / rect.height) * 100, 0, 100),
    };
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const point = getPoint(event.clientX, event.clientY);
    if (!point) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStartRef.current = point;
    setSelection({ x: point.x, y: point.y, width: 3, height: 3 });
    setIsDragging(true);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStartRef.current) return;
    const point = getPoint(event.clientX, event.clientY);
    if (!point) return;

    event.preventDefault();
    setSelection(buildSelection(dragStartRef.current.x, dragStartRef.current.y, point.x, point.y));
  };

  const stopDragging = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const cropped = await cropImage(source, selection, outputWidth);
      onSave(cropped);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="cropper-backdrop" role="dialog" aria-modal="true" aria-label={title}>
      <div className="cropper-panel">
        <div className="section-heading-row">
          <div>
            <h3>{title}</h3>
            <p>Arrastra sobre la imagen para seleccionar el area que quieres guardar.</p>
          </div>
          <button type="button" className="btn btn-outline-success btn-sm" onClick={onCancel}>
            Cancelar
          </button>
        </div>

        <div
          className="cropper-select-area"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={stopDragging}
          onPointerCancel={stopDragging}
        >
          <img ref={imageRef} src={source} alt="Seleccion para recortar" draggable={false} />
          <div
            className="cropper-selection"
            style={{
              left: `${selection.x}%`,
              top: `${selection.y}%`,
              width: `${selection.width}%`,
              height: `${selection.height}%`,
            }}
          />
        </div>

        <div className="create-actions">
          <button type="button" className="btn btn-outline-success" onClick={onCancel}>
            Cancelar
          </button>
          <button type="button" className="btn btn-success" disabled={isSaving} onClick={handleSave}>
            {isSaving ? "Guardando..." : "Usar recorte"}
          </button>
        </div>
      </div>
    </div>
  );
}
