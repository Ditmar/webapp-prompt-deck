import { useEffect, useState, type FormEvent } from 'react';
import { API_URL, getTokens, setTokens } from '../lib/api';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Alert } from './ui/Alert';
import { LayersIcon } from './ui/icons';
import { Spinner } from './ui/Spinner';

export function LoginForm() {
  const [email, setEmail] = useState('admin@admin.com');
  const [password, setPassword] = useState('admin');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getTokens()) window.location.href = '/decks';
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? 'Credenciales inválidas');
        return;
      }
      setTokens(await res.json());
      window.location.href = '/decks';
    } catch {
      setError('No se pudo contactar la API');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute -top-40 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-violet-600/10 blur-[120px]" />
      </div>

      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl shadow-black/30 backdrop-blur-sm"
      >
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 text-white shadow-lg shadow-indigo-950/50">
            <LayersIcon className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-slate-50">
              Iniciar sesión
            </h1>
            <p className="mt-1 text-sm text-slate-400">Accedé a tus diapositivas</p>
          </div>
        </div>

        <div className="flex flex-col gap-3.5">
          <Input
            type="email"
            name="email"
            placeholder="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            name="password"
            placeholder="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />

          {error && <Alert>{error}</Alert>}

          <Button type="submit" variant="primary" disabled={loading} className="mt-1 w-full">
            {loading && <Spinner className="h-4 w-4" />}
            Entrar
          </Button>

          <p className="text-center text-xs text-slate-500">
            Usuario por defecto: admin@admin.com / admin
          </p>
        </div>
      </form>
    </div>
  );
}
