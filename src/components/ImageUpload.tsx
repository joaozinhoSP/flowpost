import { useState } from 'react';
import { X, Upload, Link as LinkIcon } from 'lucide-react';
import { useToast } from './ui/toast';

interface ImageUploadProps {
  images: string[];
  onChange: (urls: string[]) => void;
  maxFiles?: number;
}

export default function ImageUpload({ images, onChange, maxFiles = 5 }: ImageUploadProps) {
  const { toast } = useToast();
  const [urlInput, setUrlInput] = useState('');

  function addUrl() {
    const url = urlInput.trim();
    if (!url) return;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      toast('URL inválida. Use http:// ou https://', 'error');
      return;
    }
    if (images.length >= maxFiles) {
      toast(`Máximo de ${maxFiles} imagens`, 'error');
      return;
    }
    onChange([...images, url]);
    setUrlInput('');
  }

  function removeImage(index: number) {
    onChange(images.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      {images.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {images.map((url, i) => (
            <div key={i} className="relative group">
              <img
                src={url}
                alt={`Imagem ${i + 1}`}
                className="h-20 w-20 rounded-xl object-cover border border-gray-200"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect fill="%23f3f4f6" width="80" height="80"/><text x="40" y="40" text-anchor="middle" fill="%239ca3af" font-size="10">Erro</text></svg>';
                }}
              />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {images.length < maxFiles && (
        <div className="flex gap-2">
          <input
            type="text"
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addUrl(); } }}
            placeholder="URL da imagem (ex: https://exemplo.com/foto.jpg)"
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
          <button
            type="button"
            onClick={addUrl}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-accent text-white rounded-lg hover:bg-accent/90 transition"
          >
            <LinkIcon className="w-4 h-4" />
            Adicionar
          </button>
        </div>
      )}
      {!images.length && (
        <p className="text-xs text-gray-400">Cole URLs de imagens para enviar junto com o post (máx {maxFiles})</p>
      )}
    </div>
  );
}
