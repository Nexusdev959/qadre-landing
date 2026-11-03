import { Component, DestroyRef, HostListener, afterNextRender, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// API de Qadre: en local apunta al servidor de desarrollo
const API_URL = ['localhost', '127.0.0.1'].includes(globalThis.location?.hostname ?? '')
  ? 'http://localhost:3000/api/v1'
  : 'https://api.qadre.net/api/v1';

export interface PlanItem {
  id: string;
  name: string;
  badge?: string;
  recommended?: boolean;
  desc: string;
  priceMonthly: number;
  features: string[];
  excluded?: string[];
  cta: string;
  ctaClass: string;
}

// true = incluido, false = no incluido, texto = incluido con ese alcance
export interface CompareGroup {
  title: string;
  rows: { label: string; values: (boolean | string)[] }[];
}

export interface FaqItem {
  id: number;
  question: string;
  answer: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  // Mobile Nav
  readonly mobileMenuOpen = signal<boolean>(false);

  // Billing Cycle (monthly / annual)
  readonly billingCycle = signal<'monthly' | 'annual'>('annual');

  // FAQ Accordion
  readonly activeFaq = signal<number | null>(0);

  // Theme (light / dark); initial value is set by the inline script in index.html
  readonly theme = signal<'light' | 'dark'>('dark');

  // Navbar compact state and current section for nav highlight
  readonly scrolled = signal<boolean>(false);
  readonly activeSection = signal<string>('');

  readonly year = new Date().getFullYear();

  readonly navItems = [
    { id: 'proposito', label: '¿Para qué sirve?' },
    { id: 'funciones', label: 'Funciones' },
    { id: 'tiempos', label: 'Puesta en marcha' },
    { id: 'planes', label: 'Planes' },
    { id: 'faq', label: 'Preguntas' },
    { id: 'contacto', label: 'Contacto' },
  ];

  readonly segments = [
    'Tiendas de barrio', 'Barberías', 'Salones de belleza', 'Tecnología', 'Ropa y calzado',
    'Ferreterías', 'Droguerías', 'Spas', 'Panaderías', 'Consultorios', 'Papelerías', 'Talleres',
  ];

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      this.theme.set(document.documentElement.dataset['theme'] === 'light' ? 'light' : 'dark');
      this.onScroll();

      // Reveal-on-scroll: add .in once an element enters the viewport
      const reveal = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) {
              e.target.classList.add('in');
              reveal.unobserve(e.target);
            }
          }
        },
        { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
      );
      document.querySelectorAll('.reveal').forEach((el) => reveal.observe(el));

      // Highlight the nav link of the section in the middle of the screen
      const spy = new IntersectionObserver(
        (entries) => {
          for (const e of entries) if (e.isIntersecting) this.activeSection.set(e.target.id);
        },
        { rootMargin: '-45% 0px -50% 0px' },
      );
      this.navItems.forEach((n) => {
        const el = document.getElementById(n.id);
        if (el) spy.observe(el);
      });

      destroyRef.onDestroy(() => {
        reveal.disconnect();
        spy.disconnect();
      });
    });
  }

  @HostListener('window:scroll')
  onScroll() {
    this.scrolled.set(window.scrollY > 12);
    if (window.scrollY < 300) this.activeSection.set('');
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

  // Contact Form Model
  contactData = {
    name: '',
    business: '',
    type: 'productos',
    phone: '',
    email: '',
    message: '',
    website: '', // campo trampa para bots, oculto
    terms: false, // consentimiento previo y expreso conforme a Ley 1581 de 2012
  };

  readonly contactStatus = signal<'idle' | 'sending' | 'sent' | 'error'>('idle');
  readonly contactError = signal<string>('');
  readonly privacyModalOpen = signal<boolean>(false);

  // Planes y límites: deben coincidir con qadre_api/src/common/plans/plans.ts
  readonly plans: PlanItem[] = [
    {
      id: 'emprendedor',
      name: 'Emprendedor',
      desc: 'Para empezar a vender organizado sin pagar nada.',
      priceMonthly: 0,
      features: [
        'Punto de venta, caja y turnos de efectivo',
        'Hasta 150 ventas al mes',
        'Inventario hasta 50 productos con alertas de stock bajo',
        'Agenda de citas (negocios de servicios)',
        'Tickets en imagen y PDF para WhatsApp',
        '1 usuario',
        '3 pósters de marketing al mes',
      ],
      excluded: ['Catálogo digital y reservas en línea', 'Excel para el contador', 'Fiados y prefacturas', 'Control de asistencia'],
      cta: 'Crear cuenta gratis',
      ctaClass: 'btn-secondary',
    },
    {
      id: 'pro',
      name: 'Pro',
      badge: 'MÁS POPULAR',
      recommended: true,
      desc: 'Para vender sin límites, recibir pedidos por catálogo y fiar con control.',
      priceMonthly: 29900,
      features: [
        'Todo lo del plan Emprendedor',
        'Ventas y productos ilimitados',
        'Catálogo digital con pedidos por WhatsApp y reservas en línea',
        'Excel de renta para el contador',
        'Hasta 3 usuarios (gerente, supervisor, colaborador)',
        'Fiados y créditos con comprobante de abono',
        'Prefacturas con QR y medios de pago',
        '30 pósters de marketing al mes',
      ],
      excluded: ['Control de asistencia'],
      cta: 'Elegir Pro',
      ctaClass: 'btn-primary',
    },
    {
      id: 'total',
      name: 'Negocio Total',
      badge: '15 DÍAS GRATIS',
      desc: 'Para equipos con turnos: todo sin límites y control de asistencia.',
      priceMonthly: 59900,
      features: [
        'Todo lo del plan Pro',
        'Usuarios ilimitados',
        'Control de asistencia: entradas, salidas y novedades',
        'Reporte de horas trabajadas con recargos',
        '100 pósters de marketing al mes',
      ],
      cta: 'Probar 15 días gratis',
      ctaClass: 'btn-secondary',
    },
  ];

  // Comparison matrix; columns follow the order of `plans`
  readonly compareGroups: CompareGroup[] = [
    {
      title: 'Ventas y caja',
      rows: [
        { label: 'Punto de venta (POS)', values: [true, true, true] },
        { label: 'Ventas al mes', values: ['Hasta 150', 'Ilimitadas', 'Ilimitadas'] },
        { label: 'Apertura y cierre de caja por turnos', values: [true, true, true] },
        { label: 'Tickets en imagen y PDF para WhatsApp', values: [true, true, true] },
        { label: 'Devoluciones y cambios', values: [true, true, true] },
      ],
    },
    {
      title: 'Inventario, catálogo y marketing',
      rows: [
        { label: 'Productos en inventario', values: ['Hasta 50', 'Ilimitados', 'Ilimitados'] },
        { label: 'Catálogo digital con pedidos por WhatsApp', values: [false, true, true] },
        { label: 'Pósters de marketing al mes', values: ['3', '30', '100'] },
      ],
    },
    {
      title: 'Clientes y cobros',
      rows: [
        { label: 'Fiados y créditos con comprobante de abono', values: [false, true, true] },
        { label: 'Prefacturas con QR y medios de pago', values: [false, true, true] },
      ],
    },
    {
      title: 'Equipo y servicios',
      rows: [
        { label: 'Usuarios', values: ['1', 'Hasta 3', 'Ilimitados'] },
        { label: 'Agenda de citas (negocios de servicios)', values: [true, true, true] },
        { label: 'Reservas en línea desde el catálogo', values: [false, true, true] },
        { label: 'Control de asistencia y novedades', values: [false, false, true] },
      ],
    },
    {
      title: 'Finanzas',
      rows: [
        { label: 'Gastos y balance del mes', values: [true, true, true] },
        { label: 'Excel de renta para el contador', values: [false, true, true] },
      ],
    },
  ];

  isBool(v: boolean | string): v is boolean {
    return typeof v === 'boolean';
  }

  readonly faqs: FaqItem[] = [
    {
      id: 0,
      question: '¿Necesito instalar algún programa?',
      answer:
        'No. Qadre funciona en la nube desde el navegador de tu celular, tablet o computador. Si usas Android, también puedes instalar la app para imprimir tickets en impresora térmica.',
    },
    {
      id: 1,
      question: '¿Cómo funciona la prueba gratuita de 15 días?',
      answer:
        'Te registras gratis y revisamos tu tienda. Cuando la aprobamos, tienes 15 días de Negocio Total con todo incluido, sin tarjeta de crédito. Al terminar sigues en Emprendedor sin perder tus datos, o eliges un plan pago.',
    },
    {
      id: 2,
      question: '¿Puedo imprimir tickets en mi mostrador?',
      answer:
        'Sí. Desde la app de Android puedes imprimir en impresoras térmicas Bluetooth y abrir el cajón monedero. En cualquier dispositivo puedes compartir el ticket como imagen o PDF por WhatsApp.',
    },
    {
      id: 3,
      question: '¿Cómo funciona el catálogo digital con pedidos por WhatsApp?',
      answer:
        'Desde el plan Pro, Qadre crea un enlace y un código QR para tu tienda (app.qadre.net/c/tu-tienda). Tus clientes eligen productos, arman el carrito y el pedido te llega por WhatsApp con el total.',
    },
    {
      id: 4,
      question: '¿Qué son los fiados y comprobantes de abono?',
      answer:
        'Desde el plan Pro llevas el control de quién te debe. Cuando un cliente abona, Qadre genera un comprobante en imagen con el saldo anterior y el nuevo para enviárselo por WhatsApp.',
    },
    {
      id: 5,
      question: '¿Cómo pago mi plan?',
      answer:
        'Por ahora activamos tu plan cuando nos confirmas el pago por WhatsApp o correo. Si un plan pago vence, tu negocio pasa a Emprendedor sin perder datos.',
    },
  ];

  toggleBilling(cycle: 'monthly' | 'annual') {
    this.billingCycle.set(cycle);
  }

  toggleFaq(id: number) {
    this.activeFaq.update((curr) => (curr === id ? null : id));
  }

  toggleMobileMenu() {
    this.mobileMenuOpen.update((v) => !v);
  }

  openPrivacyModal(e?: Event) {
    if (e) e.preventDefault();
    this.privacyModalOpen.set(true);
  }

  closePrivacyModal() {
    this.privacyModalOpen.set(false);
  }

  closeMobileMenu() {
    this.mobileMenuOpen.set(false);
  }

  getPrice(plan: PlanItem): number {
    if (this.billingCycle() === 'annual') {
      // 20% discount on annual
      return Math.round(plan.priceMonthly * 0.8);
    }
    return plan.priceMonthly;
  }

  formatMoney(amount: number): string {
    return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(amount);
  }

  /** Envía la solicitud a la API, que la reenvía por correo al equipo comercial. */
  async sendContact() {
    const d = this.contactData;
    if (!d.name.trim() || !d.phone.trim() || this.contactStatus() === 'sending') return;
    if (!d.terms) {
      this.contactError.set('Debes autorizar el tratamiento de tus datos personales conforme a la ley para poder enviarte la información.');
      this.contactStatus.set('error');
      return;
    }
    this.contactStatus.set('sending');
    try {
      const res = await fetch(`${API_URL}/public/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: d.name.trim(),
          business: d.business.trim() || undefined,
          type: d.type,
          phone: d.phone.trim(),
          email: d.email.trim() || undefined,
          message: d.message.trim() || undefined,
          website: d.website || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const msg = Array.isArray(body?.message) ? body.message[0] : body?.message;
        throw new Error(msg || 'No pudimos enviar tu solicitud.');
      }
      this.contactStatus.set('sent');
    } catch (e) {
      this.contactError.set(e instanceof Error && e.message !== 'Failed to fetch' ? e.message : 'No pudimos enviar tu solicitud. Revisa tu conexión e inténtalo de nuevo.');
      this.contactStatus.set('error');
    }
  }
}
