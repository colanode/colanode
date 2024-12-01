import { compareDate, compareString } from './utils';
import {
  InteractionAttribute,
  InteractionAttributes,
} from '../types/interactions';

export const mergeInteractionAttributes = (
  attributes: InteractionAttributes | null | undefined,
  attribute: InteractionAttribute,
  value: string
): InteractionAttributes | null => {
  if (!attributes) {
    return { [attribute]: value };
  }

  if (attribute === 'firstSeenAt') {
    const date = new Date(value);

    if (
      !attributes.firstSeenAt ||
      compareDate(attributes.firstSeenAt, date) < 0
    ) {
      return { ...attributes, firstSeenAt: date };
    }
  }

  if (attribute === 'lastSeenAt') {
    const date = new Date(value);

    if (
      !attributes.lastSeenAt ||
      compareDate(attributes.lastSeenAt, date) > 0
    ) {
      return { ...attributes, lastSeenAt: date };
    }
  }

  if (attribute === 'lastReceivedTransactionId') {
    if (
      !attributes.lastReceivedTransactionId ||
      compareString(attributes.lastReceivedTransactionId, value) > 0
    ) {
      return { ...attributes, lastReceivedTransactionId: value };
    }
  }

  if (attribute === 'lastSeenTransactionId') {
    if (
      !attributes.lastSeenTransactionId ||
      compareString(attributes.lastSeenTransactionId, value) > 0
    ) {
      return { ...attributes, lastSeenTransactionId: value };
    }
  }

  return null;
};
