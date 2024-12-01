import {
  INVALID,
  OK,
  ParseInput,
  ParseReturnType,
  ZodType,
  ZodTypeDef,
} from 'zod';

export class ZodText extends ZodType<string, ZodTypeDef, string> {
  constructor() {
    super({
      description: 'Text',
    });
  }

  _parse(input: ParseInput): ParseReturnType<string> {
    if (typeof input.data !== 'string') {
      return INVALID;
    }

    return OK(input.data);
  }

  static create(): ZodText {
    return new ZodText();
  }
}
