import { useEffect, useState } from 'react';
import { API_URL, authFetch } from '../lib/api';
import { Card } from './ui/Card';
import { Button, LinkButton } from './ui/Button';
import { Spinner } from './ui/Spinner';
import { Alert } from './ui/Alert';
import { CalendarIcon, EyeIcon, InboxIcon, LinkIcon, PencilIcon, TrashIcon } from './ui/icons';

interface DeckSummary {
  id: string;
  title: string;
  url: string;
  createdAt: string;
}

function parseUrl(url: string): { userId: string; slug: string } {
  const parts = url.split('/').filter(Boolean);
  return { userId: parts[2], slug: parts[3] };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function DecksGrid() {
  const [decks, setDecks] = useState<DeckSummary[] | null>(null);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);

  async function load() {
    setError('');
    try {
      const res = await authFetch('/api/deck');
      if (!res.ok) {
        setError('No se pudieron cargar las diapositivas.');
        return;
      }
      setDecks(await res.json());
    } catch {
      setError('No se pudo contactar la API.');
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(deck: DeckSummary) {
    if (!confirm('¿Borrar esta diapositiva? No se puede deshacer.')) return;
    const { userId, slug } = parseUrl(deck.url);
    setDeletingId(deck.id);
    try {
      const res = await authFetch(`/api/deck/${userId}/${slug}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) {
        setError('No se pudo borrar la diapositiva.');
        return;
      }
      setDecks(prev => (prev ? prev.filter(d => d.id !== deck.id) : prev));
    } finally {
      setDeletingId(null);
    }
  }

  async function handleOpenDeck(deck: DeckSummary) {
    const { userId, slug } = parseUrl(deck.url);
    // Open the tab synchronously (before any await) so browsers don't treat it as a blocked popup.
    const win = window.open('', '_blank');
    setOpeningId(deck.id);
    try {
      const res = await authFetch(`/api/deck/${userId}/${slug}`);
      if (!res.ok) {
        setError('No se pudo abrir la diapositiva.');
        win?.close();
        return;
      }
      const html = await res.text();
      const blobUrl = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
      if (win) win.location.href = blobUrl;
    } catch {
      setError('No se pudo contactar la API.');
      win?.close();
    } finally {
      setOpeningId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
            Mis diapositivas
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Todas tus presentaciones generadas, en un solo lugar.
          </p>
        </div>
        {decks && decks.length > 0 && (
          <span className="whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
            {decks.length} {decks.length === 1 ? 'diapositiva' : 'diapositivas'}
          </span>
        )}
      </div>

      {error && <Alert>{error}</Alert>}

      {decks === null && !error && (
        <div className="flex items-center justify-center gap-3 py-24 text-slate-400">
          <Spinner />
          <span className="text-sm">Cargando diapositivas…</span>
        </div>
      )}

      {decks !== null && decks.length === 0 && !error && (
        <Card className="flex flex-col items-center gap-3 px-6 py-20 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-slate-400">
            <InboxIcon className="h-6 w-6" />
          </span>
          <p className="text-sm text-slate-400">
            Todavía no generaste ninguna diapositiva.
          </p>
        </Card>
      )}

      {decks !== null && decks.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {decks.map(deck => {
            const { userId, slug } = parseUrl(deck.url);
            const isDeleting = deletingId === deck.id;
            return (
              <Card
                key={deck.id}
                className="group flex flex-col gap-4 p-5 transition-colors hover:border-white/20 hover:bg-white/[0.06]"
              >
                <h2 className="line-clamp-2 text-base font-semibold text-slate-100">
                  {deck.title}
                </h2>

                <button
                  type="button"
                  onClick={() => handleOpenDeck(deck)}
                  disabled={openingId === deck.id}
                  title="Abrir diapositiva en una ventana nueva"
                  className="flex items-center gap-1.5 overflow-hidden rounded-md border border-white/10 bg-slate-950/50 px-2.5 py-1.5 text-xs text-slate-500 transition-colors hover:border-indigo-400/40 hover:text-indigo-300 disabled:opacity-60"
                >
                  {openingId === deck.id ? (
                    <Spinner className="h-3.5 w-3.5 shrink-0" />
                  ) : (
                    <LinkIcon className="h-3.5 w-3.5 shrink-0" />
                  )}
                  <span className="truncate font-mono">{`${API_URL}${deck.url}`}</span>
                </button>

                <div className="mt-auto flex items-center justify-between gap-3 border-t border-white/10 pt-3.5">
                  <span className="flex items-center gap-1.5 text-xs text-slate-500">
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {formatDate(deck.createdAt)}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <LinkButton
                      variant="ghost"
                      size="sm"
                      title="Ver"
                      href={`/decks/view?u=${encodeURIComponent(userId)}&s=${encodeURIComponent(slug)}`}
                    >
                      <EyeIcon className="h-4 w-4" />
                    </LinkButton>
                    <LinkButton
                      variant="ghost"
                      size="sm"
                      title="Editar"
                      href={`/decks/edit?u=${encodeURIComponent(userId)}&s=${encodeURIComponent(slug)}`}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </LinkButton>
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Borrar"
                      disabled={isDeleting}
                      onClick={() => handleDelete(deck)}
                      className="hover:!bg-red-500/10 hover:!text-red-400"
                    >
                      {isDeleting ? <Spinner className="h-4 w-4" /> : <TrashIcon className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
