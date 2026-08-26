import { logout } from '../lib/api';
import { Button } from './ui/Button';
import { LayersIcon, LogoutIcon } from './ui/icons';

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href="/decks" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-400 to-violet-500 text-white shadow-lg shadow-indigo-950/50">
            <LayersIcon className="h-4.5 w-4.5" />
          </span>
          <span className="font-semibold tracking-tight text-slate-100">
            Mis diapositivas
          </span>
        </a>
        <Button variant="ghost" size="sm" onClick={logout}>
          <LogoutIcon className="h-4 w-4" />
          Cerrar sesión
        </Button>
      </div>
    </header>
  );
}
