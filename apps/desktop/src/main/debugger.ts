import debug from 'debug';

export const createDebugger = (namespace: string) => {
  return debug(`colanode:${namespace}`);
};
