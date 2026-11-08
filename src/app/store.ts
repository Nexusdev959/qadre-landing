import { Component, afterNextRender, computed, signal } from '@angular/core';
import { API_URL, POS_APK_URL } from './app';

export interface StoreApp {
  id: string;
  name: string;
  tagline: string;
  category: string;
  icon: string;
  /** Sin URL de descarga = se muestra como "Próximamente". */
  downloadUrl?: string;
  version?: string;
  /** Ruta pública de la API que devuelve { version, url }; si existe, pisa version y downloadUrl. */
  versionApi?: string;
  requirements: string;
  about: string[];
  highlights: { icon: string; title: string; text: string }[];
  screenshots: string[];
}

// Catálogo de la tienda: una app nueva es una entrada más en esta lista
export const STORE_APPS: StoreApp[] = [
  {
    id: 'pos',
    name: 'Qadre POS',
    tagline: 'Punto de venta físico para Android',
    category: 'Punto de venta',
    icon: 'brand/logo-512.png',
    downloadUrl: POS_APK_URL,
    version: '1.0.0',
    versionApi: '/public/pos-version',
    requirements: 'Android 8.0 o superior',
    about: [
      'Convierte tu teléfono, tablet o terminal Android en un punto de venta físico de alta velocidad.',
      'Reutiliza todo tu catálogo e inventario de Qadre, con soporte nativo para impresión térmica ESC/POS (Bluetooth y red, 58/80 mm) y apertura de cajón monedero.',
    ],
    highlights: [
      { icon: 'i-zap', title: 'Ventas al instante', text: 'Cobra en segundos con tu mismo catálogo e inventario.' },
      { icon: 'i-card', title: 'Impresión térmica', text: 'Tickets ESC/POS por Bluetooth o red, 58 y 80 mm.' },
      { icon: 'i-wallet', title: 'Cajón monedero', text: 'Apertura automática al cobrar en efectivo.' },
      { icon: 'i-trend', title: 'Siempre al día', text: 'Te avisa cuando hay una versión nueva para instalar.' },
    ],
    screenshots: ['img/app-inicio-dark.webp', 'img/app-inicio-light.webp'],
  },
];

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './store.html',
  styleUrls: ['./app.css', './store.css'],
})
export class Store {
  readonly apps = signal(STORE_APPS);
  readonly query = signal('');
  readonly category = signal('Todas');
  readonly theme = signal<'light' | 'dark'>('dark');
  readonly year = new Date().getFullYear();

  readonly categories = computed(() => ['Todas', ...new Set(this.apps().map((a) => a.category))]);
  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const c = this.category();
    return this.apps().filter(
      (a) => (c === 'Todas' || a.category === c) && (!q || `${a.name} ${a.tagline} ${a.category}`.toLowerCase().includes(q)),
    );
  });
  readonly selectedId = signal(STORE_APPS[0].id);
  readonly selected = computed(() => this.apps().find((a) => a.id === this.selectedId()) ?? this.apps()[0]);

  constructor() {
    afterNextRender(() => {
      document.title = 'Tienda de apps · Qadre';
      this.theme.set(document.documentElement.dataset['theme'] === 'light' ? 'light' : 'dark');
      // Versión publicada de cada app (misma fuente que su actualizador); si falla se queda la local
      for (const app of STORE_APPS) {
        if (!app.versionApi) continue;
        fetch(`${API_URL}${app.versionApi}`)
          .then((r) => (r.ok ? r.json() : null))
          .then((v: { version?: string; url?: string } | null) => {
            if (!v) return;
            this.apps.update((list) =>
              list.map((a) => (a.id === app.id ? { ...a, version: v.version || a.version, downloadUrl: v.url || a.downloadUrl } : a)),
            );
          })
          .catch(() => {});
      }
    });
  }

  select(app: StoreApp) {
    this.selectedId.set(app.id);
    document.getElementById('detalle')?.scrollIntoView({ behavior: 'smooth' });
  }

  toggleTheme() {
    const next = this.theme() === 'dark' ? 'light' : 'dark';
    const apply = () => {
      document.documentElement.dataset['theme'] = next;
      this.theme.set(next);
    };
    try {
      localStorage.setItem('qadre-theme', next);
    } catch {}
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
    if (doc.startViewTransition) doc.startViewTransition(apply);
    else apply();
  }
}
