import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('en un solo lugar.');
  });

  it('shows the steps of the chosen guide, and a video only when it has one', async () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    const el = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
    expect(el.querySelector('#guide-panel h3')?.textContent).toContain('Abrir caja y vender');
    expect(el.querySelector('.guide-video')).toBeNull();

    app.activeGuide.set('fiados');
    app.guides.find((g) => g.id === 'fiados')!.video = 'abc123';
    fixture.detectChanges();
    expect(el.querySelectorAll('.guide-steps li').length).toBe(5);
    expect(el.querySelector('.guide-video iframe')?.getAttribute('src')).toBe('https://www.youtube-nocookie.com/embed/abc123');
  });

  it('sends the contact request to the API and reports the result', async () => {
    const app = TestBed.createComponent(App).componentInstance;
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);
    Object.assign(app.contactData, { name: 'Ana', phone: '3001234567' });
    // Sin la autorización de datos no se envía nada
    await app.sendContact();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(app.contactStatus()).toBe('error');

    app.contactData.terms = true;
    await app.sendContact();
    expect(fetchMock.mock.calls[0][0]).toContain('/public/contact');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ name: 'Ana', phone: '3001234567', type: 'productos' });
    expect(app.contactStatus()).toBe('sent');

    fetchMock.mockResolvedValue({ ok: false, json: async () => ({ message: ['phone inválido'] }) });
    await app.sendContact();
    expect(app.contactStatus()).toBe('error');
    expect(app.contactError()).toBe('phone inválido');
    vi.unstubAllGlobals();
  });
});
