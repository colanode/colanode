import { shell } from 'electron';

import { CommandHandler } from '../../lib/types';
import { UrlOpenCommandInput } from '../../commands/url-open';

export class UrlOpenCommandHandler
  implements CommandHandler<UrlOpenCommandInput>
{
  public async handleCommand(input: UrlOpenCommandInput): Promise<void> {
    shell.openExternal(input.url);
  }
}
