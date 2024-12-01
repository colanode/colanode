import { shell } from 'electron';

import { CommandHandler } from '@/main/types';
import { UrlOpenCommandInput } from '@/shared/commands/url-open';

export class UrlOpenCommandHandler
  implements CommandHandler<UrlOpenCommandInput>
{
  public async handleCommand(input: UrlOpenCommandInput): Promise<void> {
    shell.openExternal(input.url);
  }
}
