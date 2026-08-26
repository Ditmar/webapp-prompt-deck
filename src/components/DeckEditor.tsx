import { useEffect, useRef, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';
import { authFetch } from '../lib/api';
import { setIframeHtml } from '../lib/iframe';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Alert } from './ui/Alert';
import { Spinner } from './ui/Spinner';

interface Issue {
  field: string;
  message: string;
  action: string;
}

export function DeckEditor() {
  const [target, setTarget] = useState<{ userId: string; slug: string } | null>(null);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [jsonLoading, setJsonLoading] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [issues, setIssues] = useState<Issue[]>([]);
  const frameRef = useRef<HTMLIFrameElement>(null);

  async function loadPreview(userId: string, slug: string) {
    setPreviewLoading(true);
    try {
      const res = await authFetch(`/api/deck/${userId}/${slug}`);
      if (res.ok && frameRef.current) {
        setIframeHtml(frameRef.current, await res.text());
      }
    } finally {
      setPreviewLoading(false);
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const userId = params.get('u');
    const slug = params.get('s');

    if (!userId || !slug) {
      setError('Falta el deck a editar.');
      setJsonLoading(false);
      setPreviewLoading(false);
      return;
    }
    setTarget({ userId, slug });

    authFetch(`/api/deck/${userId}/${slug}/json`)
      .then(async res => {
        if (!res.ok) {
          setError('No se pudo cargar el JSON del deck.');
          return;
        }
        setValue(JSON.stringify(await res.json(), null, 2));
      })
      .catch(() => setError('No se pudo contactar la API.'))
      .finally(() => setJsonLoading(false));

    loadPreview(userId, slug);
  }, []);

  async function handleSave() {
    if (!target) return;
    setError('');
    setSaved(false);
    setIssues([]);

    let parsed: unknown;
    try {
      parsed = JSON.parse(value);
    } catch {
      setError('El JSON no es válido — revisá la sintaxis.');
      return;
    }

    setSaving(true);
    try {
      const res = await authFetch(`/api/deck/${target.userId}/${target.slug}/json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });
      if (!res.ok) {
        setError('No se pudo guardar el deck.');
        return;
      }
      const result = await res.json();
      setValue(JSON.stringify(result.deck, null, 2));
      setSaved(true);
      setIssues(result.issues ?? []);
      await loadPreview(target.userId, target.slug);
    } finally {
      setSaving(false);
    }
  }

  if (!target && error) {
    return <Alert>{error}</Alert>;
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <Alert>{error}</Alert>}

      <div className="flex items-center gap-3">
        <Button variant="primary" onClick={handleSave} disabled={saving || !target}>
          {saving && <Spinner className="h-4 w-4" />}
          Guardar
        </Button>
        {saved && <span className="text-sm text-emerald-400">Guardado.</span>}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="relative overflow-hidden p-0">
          {jsonLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center gap-3 bg-slate-950/60 text-slate-400">
              <Spinner />
              <span className="text-sm">Cargando editor…</span>
            </div>
          )}
          <div className="h-[75vh] overflow-auto">
            <CodeMirror
              value={value}
              height="100%"
              theme={oneDark}
              extensions={[json()]}
              onChange={val => {
                setValue(val);
                setSaved(false);
              }}
              basicSetup={{ foldGutter: true, autocompletion: true }}
              className="h-full text-sm [&_.cm-editor]:h-full [&_.cm-scroller]:font-mono"
            />
          </div>
        </Card>

        <Card className="relative overflow-hidden p-2">
          {previewLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center gap-3 bg-slate-950/60 text-slate-400">
              <Spinner />
              <span className="text-sm">Cargando vista previa…</span>
            </div>
          )}
          <iframe
            ref={frameRef}
            title="Vista previa de la diapositiva"
            className="h-[75vh] w-full rounded-xl border border-white/10 bg-white"
          />
        </Card>
      </div>

      {issues.length > 0 && (
        <Card className="p-4">
          <p className="text-sm font-semibold text-slate-200">
            Cambios aplicados automáticamente al validar el JSON:
          </p>
          <ul className="mt-2 flex flex-col gap-1.5">
            {issues.map((issue, i) => (
              <li key={i} className="text-sm text-slate-400">
                <code className="rounded bg-slate-950/60 px-1.5 py-0.5 font-mono text-xs text-indigo-300">
                  {issue.field}
                </code>{' '}
                {issue.message} ({issue.action})
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
