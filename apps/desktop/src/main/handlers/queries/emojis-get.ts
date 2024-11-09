import { assetManager } from '@/main/asset-manager';
import {
  MutationChange,
  ChangeCheckResult,
  QueryHandler,
  QueryResult,
} from '@/main/types';
import { EmojisGetQueryInput } from '@/operations/queries/emojis-get';

export class EmojisGetQueryHandler
  implements QueryHandler<EmojisGetQueryInput>
{
  public async handleQuery(
    _: EmojisGetQueryInput
  ): Promise<QueryResult<EmojisGetQueryInput>> {
    const data = assetManager.getEmojiData();

    return {
      output: data,
      state: {},
    };
  }

  public async checkForChanges(
    _: MutationChange[],
    __: EmojisGetQueryInput,
    ___: Record<string, any>
  ): Promise<ChangeCheckResult<EmojisGetQueryInput>> {
    return {
      hasChanges: false,
    };
  }
}