import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import handlebars from 'handlebars';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templatesDir = path.join(__dirname, './');

export const emailVerifyTemplate = handlebars.compile(
  fs.readFileSync(path.join(templatesDir, 'email-verify.html'), 'utf8')
);

export const emailPasswordResetTemplate = handlebars.compile(
  fs.readFileSync(path.join(templatesDir, 'email-password-reset.html'), 'utf8')
);

export const homeTemplate = handlebars.compile(
  fs.readFileSync(path.join(templatesDir, 'home.html'), 'utf8')
);
