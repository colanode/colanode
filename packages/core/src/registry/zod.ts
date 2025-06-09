import { z } from 'zod/v4';

export class ZodText extends z.ZodString {
  constructor() {
    super(z.string());
  }
}
