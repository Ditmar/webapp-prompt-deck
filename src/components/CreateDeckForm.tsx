import { useRef, useState } from 'react';
import { authFetch } from '../lib/api';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Alert } from './ui/Alert';
import { Spinner } from './ui/Spinner';
import {
  BanIcon,
  ImageIcon,
  SparklesIcon,
  UploadIcon,
  WavesIcon,
  XIcon,
} from './ui/icons';

type BackgroundAnimation = 'none' | 'gradient' | 'parallax';
type SlideTransition = 'slide' | 'fade' | 'convex' | 'concave' | 'zoom' | 'none';

const BACKGROUND_OPTIONS: {
  value: BackgroundAnimation;
  label: string;
  hint: string;
  icon: typeof BanIcon;
}[] = [
  { value: 'none', label: 'Ninguno', hint: 'Fondo simple', icon: BanIcon },
  { value: 'gradient', label: 'Gradiente animado', hint: 'Colores en movimiento', icon: WavesIcon },
  { value: 'parallax', label: 'Imagen parallax', hint: 'Tu propia imagen de fondo', icon: ImageIcon },
];

const TRANSITION_OPTIONS: { value: SlideTransition; label: string }[] = [
  { value: 'slide', label: 'Deslizar' },
  { value: 'fade', label: 'Desvanecer' },
  { value: 'zoom', label: 'Zoom' },
  { value: 'convex', label: 'Convexa' },
  { value: 'concave', label: 'Cóncava' },
  { value: 'none', label: 'Ninguna' },
];

function cn(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(' ');
}

export function CreateDeckForm() {
  const [prompt, setPrompt] = useState('');
  const [totalSlides, setTotalSlides] = useState('');
  const [backgroundAnimation, setBackgroundAnimation] = useState<BackgroundAnimation>('none');
  const [transition, setTransition] = useState<SlideTransition>('slide');
  const [parallaxImageUrl, setParallaxImageUrl] = useState('');
  const [imageMode, setImageMode] = useState<'upload' | 'url'>('upload');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('La imagen no puede superar los 5MB.');
      return;
    }

    setUploadError('');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await authFetch('/api/media/images', { method: 'POST', body: formData });
      if (!res.ok) {
        setUploadError('No se pudo subir la imagen.');
        return;
      }
      const { url } = await res.json();
      setParallaxImageUrl(url);
    } catch {
      setUploadError('No se pudo contactar la API.');
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!prompt.trim()) {
      setError('Contame qué querés que tenga la presentación.');
      return;
    }
    if (backgroundAnimation === 'parallax' && !parallaxImageUrl) {
      setError('Subí una imagen para el fondo parallax, o elegí otro estilo.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await authFetch('/api/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          totalSlides: totalSlides ? Number(totalSlides) : undefined,
          backgroundAnimation,
          parallaxImageUrl: backgroundAnimation === 'parallax' ? parallaxImageUrl : undefined,
          transition,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? 'No se pudo generar la presentación.');
        setSubmitting(false);
        return;
      }
      const { url } = await res.json();
      const [, , userId, slug] = new URL(url, location.origin).pathname.split('/');
      window.location.href = `/decks/view?u=${encodeURIComponent(userId)}&s=${encodeURIComponent(slug)}`;
    } catch {
      setError('No se pudo contactar la API.');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-50">Nueva diapositiva</h1>
        <p className="mt-1 text-sm text-slate-400">
          Describí el tema y la IA arma la presentación por vos.
        </p>
      </div>

      {error && <Alert>{error}</Alert>}

      <Card className="flex flex-col gap-5 p-6">
        <div className="flex flex-col gap-2">
          <label htmlFor="prompt" className="text-sm font-medium text-slate-200">
            ¿De qué querés que trate?
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Ej: Introducción a arquitectura hexagonal, con ejemplos en TypeScript…"
            rows={5}
            disabled={submitting}
            className="w-full resize-y rounded-lg border border-white/15 bg-slate-950/50 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-colors focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-400/20 disabled:opacity-60"
          />
        </div>

        <div className="flex flex-col gap-2 sm:w-56">
          <label htmlFor="totalSlides" className="text-sm font-medium text-slate-200">
            Cantidad de diapositivas
          </label>
          <Input
            id="totalSlides"
            type="number"
            min={1}
            max={60}
            placeholder="Automático"
            value={totalSlides}
            disabled={submitting}
            onChange={e => setTotalSlides(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-200">Fondo</span>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {BACKGROUND_OPTIONS.map(opt => {
              const Icon = opt.icon;
              const selected = backgroundAnimation === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={submitting}
                  onClick={() => setBackgroundAnimation(opt.value)}
                  className={cn(
                    'flex flex-col items-start gap-2 rounded-xl border px-4 py-3.5 text-left transition-colors disabled:opacity-60',
                    selected
                      ? 'border-indigo-400/60 bg-indigo-500/10 ring-2 ring-indigo-400/30'
                      : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]'
                  )}
                >
                  <Icon className={cn('h-5 w-5', selected ? 'text-indigo-300' : 'text-slate-400')} />
                  <span className="text-sm font-medium text-slate-100">{opt.label}</span>
                  <span className="text-xs text-slate-500">{opt.hint}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-200">Transición entre diapositivas</span>
          <div className="flex flex-wrap gap-2">
            {TRANSITION_OPTIONS.map(opt => {
              const selected = transition === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={submitting}
                  onClick={() => setTransition(opt.value)}
                  className={cn(
                    'rounded-full border px-3.5 py-1.5 text-sm transition-colors disabled:opacity-60',
                    selected
                      ? 'border-indigo-400/60 bg-indigo-500/10 text-indigo-300 ring-2 ring-indigo-400/30'
                      : 'border-white/10 bg-white/[0.02] text-slate-300 hover:border-white/20 hover:bg-white/[0.05]'
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {backgroundAnimation === 'parallax' && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-200">Imagen de fondo</span>
              <div className="flex rounded-lg border border-white/10 p-0.5 text-xs">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setImageMode('upload')}
                  className={cn(
                    'rounded-md px-2.5 py-1 transition-colors',
                    imageMode === 'upload' ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400 hover:text-slate-200'
                  )}
                >
                  Subir archivo
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setImageMode('url')}
                  className={cn(
                    'rounded-md px-2.5 py-1 transition-colors',
                    imageMode === 'url' ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400 hover:text-slate-200'
                  )}
                >
                  Pegar URL
                </button>
              </div>
            </div>

            {uploadError && <Alert>{uploadError}</Alert>}

            {imageMode === 'url' ? (
              <div className="flex flex-col gap-2">
                <Input
                  type="url"
                  placeholder="https://..."
                  value={parallaxImageUrl}
                  disabled={submitting}
                  onChange={e => setParallaxImageUrl(e.target.value)}
                />
                {parallaxImageUrl && (
                  <div className="overflow-hidden rounded-xl border border-white/10">
                    <img
                      src={parallaxImageUrl}
                      alt="Fondo parallax elegido"
                      className="h-40 w-full object-cover"
                      onError={e => (e.currentTarget.style.display = 'none')}
                    />
                  </div>
                )}
              </div>
            ) : !parallaxImageUrl ? (
              <button
                type="button"
                disabled={uploading || submitting}
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/[0.02] px-4 py-10 text-slate-400 transition-colors hover:border-indigo-400/40 hover:text-indigo-300 disabled:opacity-60"
              >
                {uploading ? (
                  <>
                    <Spinner />
                    <span className="text-sm">Subiendo…</span>
                  </>
                ) : (
                  <>
                    <UploadIcon className="h-6 w-6" />
                    <span className="text-sm">Hacé click para elegir una imagen</span>
                    <span className="text-xs text-slate-500">JPG, PNG o WEBP · máx. 5MB</span>
                  </>
                )}
              </button>
            ) : (
              <div className="relative overflow-hidden rounded-xl border border-white/10">
                <img src={parallaxImageUrl} alt="Fondo parallax elegido" className="h-40 w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setParallaxImageUrl('')}
                  title="Quitar imagen"
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-slate-950/80 text-slate-200 hover:bg-slate-950"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        )}
      </Card>

      {submitting && (
        <Card className="flex items-center gap-3 p-4 text-slate-300">
          <Spinner />
          <span className="text-sm">
            Generando tu presentación… esto puede tardar hasta un minuto.
          </span>
        </Card>
      )}

      <div>
        <Button
          type="submit"
          variant="primary"
          disabled={submitting || uploading}
        >
          {submitting ? <Spinner className="h-4 w-4" /> : <SparklesIcon className="h-4 w-4" />}
          Generar diapositivas
        </Button>
      </div>
    </form>
  );
}
