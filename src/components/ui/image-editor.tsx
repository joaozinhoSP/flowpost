import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Check } from 'lucide-react';

interface ImageEditorProps {
  src: string;
  onSave: (croppedDataUrl: string) => void;
  onClose: () => void;
}

export default function ImageEditor({ src, onSave, onClose }: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.onload = () => { imageRef.current = img; setImgLoaded(true); drawImage(img); };
    img.src = src;
  }, [src]);

  const drawImage = useCallback((img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cw = canvas.width = 400;
    const ch = canvas.height = 400;

    ctx.clearRect(0, 0, cw, ch);
    ctx.save();
    ctx.translate(cw / 2 + offset.x, ch / 2 + offset.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);

    const imgW = img.width;
    const imgH = img.height;
    const maxDim = Math.max(imgW, imgH);
    const drawW = (imgW / maxDim) * 350;
    const drawH = (imgH / maxDim) * 350;

    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    ctx.strokeStyle = '#14B8A6';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(50, 50, cw - 100, ch - 100);
    ctx.setLineDash([]);
  }, [scale, rotation, offset]);

  useEffect(() => {
    if (imgLoaded && imageRef.current) drawImage(imageRef.current);
  }, [scale, rotation, offset, imgLoaded, drawImage]);

  function handleWheel(e: React.WheelEvent<HTMLCanvasElement>) {
    e.preventDefault();
    setScale(s => Math.max(0.2, Math.min(3, s - e.deltaY * 0.001)));
  }

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    setDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!dragging) return;
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  }

  function handleMouseUp() { setDragging(false); }

  function handleSave() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cropCanvas = document.createElement('canvas');
    const ctx = cropCanvas.getContext('2d');
    if (!ctx) return;
    cropCanvas.width = 300;
    cropCanvas.height = 300;
    ctx.drawImage(canvas, 50, 50, 300, 300, 0, 0, 300, 300);
    onSave(cropCanvas.toDataURL('image/jpeg', 0.9));
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Ajustar Imagem</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg" aria-label="Fechar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-gray-100 flex items-center justify-center p-4">
          <canvas
            ref={canvasRef}
            className="rounded-xl bg-white shadow-inner cursor-grab active:cursor-grabbing max-w-full"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        </div>

        <div className="px-5 py-4 border-t border-gray-100 space-y-3">
          <div className="flex items-center justify-center gap-4">
            <button onClick={() => setScale(s => s - 0.1)} className="p-2 hover:bg-gray-100 rounded-lg" aria-label="Menos zoom">
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-gray-600 w-16 text-center">{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale(s => s + 0.1)} className="p-2 hover:bg-gray-100 rounded-lg" aria-label="Mais zoom">
              <ZoomIn className="w-4 h-4" />
            </button>
            <div className="w-px h-6 bg-gray-200 mx-2" />
            <button onClick={() => setRotation(r => r + 90)} className="p-2 hover:bg-gray-100 rounded-lg" aria-label="Rotacionar">
              <RotateCw className="w-4 h-4" />
            </button>
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition text-sm">
              Cancelar
            </button>
            <button onClick={handleSave} className="flex-1 py-2.5 bg-accent text-white font-medium rounded-xl hover:bg-accent/90 transition flex items-center justify-center gap-2 text-sm">
              <Check className="w-4 h-4" /> Aplicar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
