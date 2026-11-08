import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { Store } from './app/store';

// La tienda de apps vive en /tienda como página aparte; el resto es la landing
const root = location.pathname.startsWith('/tienda') ? Store : App;
bootstrapApplication(root, appConfig).catch((err) => console.error(err));
