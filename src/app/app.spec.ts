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

  it('sends the contact request to the API and reports the result', async () => {
    const app = TestBed.createComponent(App).componentInstance;
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);
    Object.assign(app.contactData, { name: 'Ana', phone: '3001234567' });
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
