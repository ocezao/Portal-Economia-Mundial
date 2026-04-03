'use client';

/**
 * Componente de upload de imagens com processamento.
 */

import { useState, useCallback, useRef } from 'react';
import { Upload, X, AlertCircle, CheckCircle2, Settings2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface UploadResult {
  success: boolean;
  file?: {
    filename: string;
    url: string;
    originalName: string;
    originalSize: string;
    processedSize: string;
    reduction: string;
    format: string;
    metadata: {
      removed: boolean;
      hadGPS: boolean;
    };
  };
  error?: string;
}

interface ImageUploaderProps {
  onUploadComplete?: (result: UploadResult) => void;
  className?: string;
  maxWidth?: number;
  maxHeight?: number;
}

export function ImageUploader({
  onUploadComplete,
  className,
  maxWidth = 1920,
  maxHeight = 1080,
}: ImageUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [quality, setQuality] = useState(85);
  const [width, setWidth] = useState<number | undefined>(maxWidth);
  const [height, setHeight] = useState<number | undefined>(maxHeight);
  const [addWatermark, setAddWatermark] = useState(false);
  const [keepMetadata, setKeepMetadata] = useState(false);
  const [detectedMetadata, setDetectedMetadata] = useState<{
    hasGPS: boolean;
    hasExif: boolean;
  } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (nextFile: File) => {
    const isSvgByExtension = nextFile.name.toLowerCase().endsWith('.svg');
    if (!nextFile.type.startsWith('image/') && !isSvgByExtension) {
      setResult({ success: false, error: 'Por favor, selecione uma imagem valida' });
      return;
    }

    setFile(nextFile);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (event) => setPreview(event.target?.result as string);
    reader.readAsDataURL(nextFile);

    setDetectedMetadata({
      hasGPS: false,
      hasExif: true,
    });
  }, []);

  const handleDrag = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.type === 'dragenter' || event.type === 'dragover') {
      setDragActive(true);
    } else if (event.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);

    if (event.dataTransfer.files?.[0]) {
      void handleFile(event.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.[0]) {
      void handleFile(event.target.files[0]);
    }
  }, [handleFile]);

  const clearFile = useCallback(() => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setDetectedMetadata(null);
    if (inputRef.current) inputRef.current.value = '';
  }, []);

  const upload = useCallback(async () => {
    if (!file) return;

    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('quality', quality.toString());
      if (width) formData.append('width', width.toString());
      if (height) formData.append('height', height.toString());
      formData.append('watermark', addWatermark.toString());
      formData.append('keepMetadata', keepMetadata.toString());

      const response = await fetch('/api/upload', {
        method: 'POST',
        credentials: 'same-origin',
        body: formData,
      });

      const data: UploadResult = await response.json();
      setResult(data);

      if (data.success) {
        onUploadComplete?.(data);
      }
    } catch {
      setResult({
        success: false,
        error: 'Erro ao fazer upload. Tente novamente.',
      });
    } finally {
      setUploading(false);
    }
  }, [file, quality, width, height, addWatermark, keepMetadata, onUploadComplete]);

  return (
    <div className={cn('space-y-4', className)}>
      {!file && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
            dragActive
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50 hover:bg-muted/50',
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleChange}
            className="hidden"
          />
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">Arraste uma imagem ou clique para selecionar</p>
          <p className="text-sm text-muted-foreground mt-1">
            JPEG, PNG, WebP, GIF, AVIF ou SVG ate 10MB
          </p>
        </div>
      )}

      {file && preview && (
        <div className="space-y-4">
          <div className="relative rounded-lg overflow-hidden bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Preview" className="max-h-[300px] w-auto mx-auto object-contain" />
            <button
              onClick={clearFile}
              className="absolute top-2 right-2 p-1 bg-background/90 rounded-full hover:bg-background"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {detectedMetadata && !keepMetadata && (
            <Alert className="bg-green-50 border-green-200">
              <Shield className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Privacidade protegida:</strong> metadados EXIF serao removidos automaticamente no upload.
              </AlertDescription>
            </Alert>
          )}

          <div className="border rounded-lg p-4 space-y-4">
            <button onClick={() => setShowOptions(!showOptions)} className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                <span className="font-medium">Opcoes de Processamento</span>
              </div>
              <span className="text-muted-foreground">{showOptions ? '▲' : '▼'}</span>
            </button>

            {showOptions && (
              <div className="space-y-4 pt-2 border-t">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Qualidade WebP</Label>
                    <span className="text-sm text-muted-foreground">{quality}%</span>
                  </div>
                  <Slider value={[quality]} onValueChange={([value]) => setQuality(value)} min={50} max={100} step={5} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Largura maxima (px)</Label>
                    <input
                      type="number"
                      value={width || ''}
                      onChange={(event) => setWidth(event.target.value ? parseInt(event.target.value, 10) : undefined)}
                      placeholder="Original"
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Altura maxima (px)</Label>
                    <input
                      type="number"
                      value={height || ''}
                      onChange={(event) => setHeight(event.target.value ? parseInt(event.target.value, 10) : undefined)}
                      placeholder="Original"
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="watermark" className="cursor-pointer">Adicionar Watermark</Label>
                    <Switch id="watermark" checked={addWatermark} onCheckedChange={setAddWatermark} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="metadata" className="cursor-pointer">Manter Metadados</Label>
                      <span className="text-xs text-amber-600">(Nao recomendado)</span>
                    </div>
                    <Switch id="metadata" checked={keepMetadata} onCheckedChange={setKeepMetadata} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <Button onClick={upload} disabled={uploading} className="w-full">
            {uploading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Processando...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Fazer Upload
              </>
            )}
          </Button>
        </div>
      )}

      {result && (
        <Alert className={result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
          {result.success ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={result.success ? 'text-green-800' : 'text-red-800'}>
            {result.success ? (
              <div className="space-y-1">
                <p><strong>Upload concluido!</strong></p>
                <p className="text-sm">
                  Tamanho: {result.file?.originalSize} → {result.file?.processedSize} ({result.file?.reduction} reducao)
                </p>
                {result.file?.metadata.hadGPS && (
                  <p className="text-sm text-amber-600">Dados GPS foram removidos para proteger a privacidade.</p>
                )}
              </div>
            ) : (
              result.error
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
