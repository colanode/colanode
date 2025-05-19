// import { shell } from 'electron';

import { UrlOpenCommandInput } from '@colanode/client/commands/url-open';
import { CommandHandler } from '@colanode/client/lib/types';

export class UrlOpenCommandHandler
  implements CommandHandler<UrlOpenCommandInput>
{
  public async handleCommand(_input: UrlOpenCommandInput): Promise<void> {
    // shell.openExternal(input.url);
    throw new Error('Not implemented');
  }
}
