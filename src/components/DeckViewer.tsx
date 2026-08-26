import { useEffect, useRef, useState } from 'react';
import { authFetch } from '../lib/api';
import { Card } from './ui/Card';
import { Spinner } from './ui/Spinner';
import { Alert } from './ui/Alert';

export function DeckViewer() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const userId = params.get('u');
    const slug = params.get('s');

    if (!userId || !slug) {
      setError('Falta el deck a mostrar.');
      setLoading(false);
      return;
    }

    authFetch(`/api/deck/${userId}/${slug}`)
      .then(async res => {
        if (!res.ok) {
          setError('No se pudo cargar la diapositiva.');
          return;
        }
        const html = await res.text();
        if (frameRef.current) frameRef.current.srcdoc = html;
      })
      .catch(() => setError('No se pudo contactar la API.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {error && <Alert>{error}</Alert>}
      <Card className="relative overflow-hidden p-2">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center gap-3 bg-slate-950/60 text-slate-400">
            <Spinner />
            <span className="text-sm">Cargando diapositiva…</span>
          </div>
        )}
        <iframe
          ref={frameRef}
          title="Vista de la diapositiva"
          className="h-[80vh] w-full rounded-xl border border-white/10 bg-white"
        />
      </Card>
    </div>
  );
}
