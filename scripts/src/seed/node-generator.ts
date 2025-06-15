import { faker } from '@faker-js/faker';

import {
  Block,
  generateId,
  IdType,
  NodeAttributes,
  NodeRole,
  generateNodeIndex,
  FieldAttributes,
  SelectOptionAttributes,
  DatabaseAttributes,
  FieldValue,
  DatabaseViewFilterAttributes,
  Mutation,
  CreateNodeMutationData,
  DocumentContent,
  documentContentSchema,
  UpdateDocumentMutationData,
  NodeModel,
  spaceModel,
  channelModel,
  chatModel,
  pageModel,
  messageModel,
  databaseModel,
  databaseViewModel,
  recordModel,
} from '@colanode/core';
import { encodeState, YDoc } from '@colanode/crdt';

import { User } from './types';

const MESSAGES_PER_CONVERSATION = 500;
const RECORDS_PER_DATABASE = 500;

export class NodeGenerator {
  constructor(
    private readonly workspaceId: string,
    private readonly users: User[]
  ) {}

  public generate() {
    this.buildGeneralSpace();
    this.buildProductSpace();
    this.buildBusinessSpace();
    this.buildChats();
  }

  private buildGeneralSpace() {
    const spaceId = this.buildSpace(
      'General',
      'The general space',
      '01jhzbzq5d9why53gcew16ybh6es'
    );

    this.buildPage('Welcome', spaceId, '01jhzbzt92e67eva4ptspwtx7xes');
    this.buildPage('Resources', spaceId, '01jhzbzt96tp281z0tqtc0mg0tes');
    this.buildPage('Guide', spaceId, '01jhzbzta4qewnx5kn8jv3d3nyes');
    this.buildChannel('Announcements', spaceId, '01jhzbzspgp8r6tj9k3733bw24es');
  }

  private buildProductSpace() {
    const spaceId = this.buildSpace(
      'Product',
      'The product space',
      '01jhzbzves59xk8zqpzsaj7jmhes'
    );
    this.buildChannel('Discussions', spaceId, '01jhzbzkw7e9khk5p32rxj1q31es');
    this.buildChannel('Alerts', spaceId, '01jhzbzr7m2zrjxe60d88v6ryyes');
    this.buildPage('Roadmap', spaceId, '01jhzbzrctc3zbj7542a3pfdzves');
    this.buildTasksDatabase(spaceId);
  }

  private buildBusinessSpace() {
    const spaceId = this.buildSpace(
      'Business',
      'The business space',
      '01jhzbzv0xhvx0dzx63qv6ahkzes'
    );
    this.buildPage('Notes', spaceId, '01jhzbztvzghvzhnt6wh75c0x8es');
    this.buildClientsDatabase(spaceId);
    this.buildMeetingsDatabase(spaceId);
  }

  private buildChats() {
    for (let i = 1; i < this.users.length; i++) {
      const user = this.users[i]!;
      this.buildChat(user);
    }
  }

  private buildSpace(name: string, description: string, avatar: string) {
    const spaceId = generateId(IdType.Space);
    const collaborators: Record<string, NodeRole> = {};
    for (const user of this.users) {
      collaborators[user.userId] = 'admin';
    }

    const spaceAttributes: NodeAttributes = {
      type: 'space',
      name,
      description,
      collaborators,
      avatar,
      visibility: 'private',
    };

    const user = this.getMainUser();
    const createSpaceMutation = this.buildCreateNodeMutation(
      spaceId,
      spaceAttributes,
      spaceModel
    );
    user.mutations.push(createSpaceMutation);

    return spaceId;
  }

  private buildChannel(name: string, parentId: string, avatar: string) {
    const channelId = generateId(IdType.Channel);
    const channelAttributes: NodeAttributes = {
      type: 'channel',
      name,
      parentId,
      avatar,
    };

    const user = this.getMainUser();
    const createChannelMutation = this.buildCreateNodeMutation(
      channelId,
      channelAttributes,
      channelModel
    );
    user.mutations.push(createChannelMutation);

    this.buidMessages(channelId, MESSAGES_PER_CONVERSATION, this.users);
  }

  private buildChat(user: User) {
    const mainUser = this.getMainUser();
    const chatId = generateId(IdType.Chat);
    const chatAttributes: NodeAttributes = {
      type: 'chat',
      collaborators: {
        [mainUser.userId]: 'admin',
        [user.userId]: 'admin',
      },
    };

    const createChatMutation = this.buildCreateNodeMutation(
      chatId,
      chatAttributes,
      chatModel
    );
    mainUser.mutations.push(createChatMutation);

    this.buidMessages(chatId, MESSAGES_PER_CONVERSATION, [mainUser, user]);
  }

  private buildPage(name: string, parentId: string, avatar: string) {
    const pageId = generateId(IdType.Page);
    const pageAttributes: NodeAttributes = {
      type: 'page',
      name,
      parentId,
      avatar,
    };

    const documentContent: DocumentContent = {
      type: 'rich_text',
      blocks: this.buildDocumentBlocks(pageId),
    };

    const user = this.getMainUser();

    const createPageMutation = this.buildCreateNodeMutation(
      pageId,
      pageAttributes,
      pageModel
    );
    user.mutations.push(createPageMutation);

    const createDocumentMutation = this.buildCreateDocumentMutation(
      pageId,
      documentContent
    );
    user.mutations.push(createDocumentMutation);
  }

  private buidMessages(conversationId: string, count: number, users: User[]) {
    for (let i = 0; i < count; i++) {
      this.buildMessage(conversationId, users);
    }
  }

  private buildMessage(conversationId: string, users: User[]) {
    const messageId = generateId(IdType.Message);
    const user = this.getRandomUser(users);

    const messageAttributes: NodeAttributes = {
      type: 'message',
      parentId: conversationId,
      subtype: 'standard',
      content: this.buildMessageContent(messageId),
    };

    const createMessageMutation = this.buildCreateNodeMutation(
      messageId,
      messageAttributes,
      messageModel
    );
    user.mutations.push(createMessageMutation);
  }

  private buildTasksDatabase(parentId: string) {
    const databaseId = generateId(IdType.Database);

    const newStatusOption: SelectOptionAttributes = {
      id: generateId(IdType.SelectOption),
      name: 'New',
      color: 'gray',
      index: generateNodeIndex(),
    };

    const activeStatusOption: SelectOptionAttributes = {
      id: generateId(IdType.SelectOption),
      name: 'Active',
      color: 'blue',
      index: generateNodeIndex(newStatusOption.index),
    };

    const toTestStatusOption: SelectOptionAttributes = {
      id: generateId(IdType.SelectOption),
      name: 'To Test',
      color: 'yellow',
      index: generateNodeIndex(activeStatusOption.index),
    };

    const closedStatusOption: SelectOptionAttributes = {
      id: generateId(IdType.SelectOption),
      name: 'Closed',
      color: 'red',
      index: generateNodeIndex(toTestStatusOption.index),
    };

    const statusField: FieldAttributes = {
      id: generateId(IdType.Field),
      type: 'select',
      name: 'Status',
      index: generateNodeIndex(),
      options: {
        [newStatusOption.id]: newStatusOption,
        [activeStatusOption.id]: activeStatusOption,
        [toTestStatusOption.id]: toTestStatusOption,
        [closedStatusOption.id]: closedStatusOption,
      },
    };

    const apiTeamSelectOption: SelectOptionAttributes = {
      id: generateId(IdType.SelectOption),
      name: 'api',
      color: 'blue',
      index: generateNodeIndex(),
    };

    const devopsTeamSelectOption: SelectOptionAttributes = {
      id: generateId(IdType.SelectOption),
      name: 'devops',
      color: 'green',
      index: generateNodeIndex(apiTeamSelectOption.index),
    };

    const frontendTeamSelectOption: SelectOptionAttributes = {
      id: generateId(IdType.SelectOption),
      name: 'frontend',
      color: 'purple',
      index: generateNodeIndex(devopsTeamSelectOption.index),
    };

    const aiTeamSelectOption: SelectOptionAttributes = {
      id: generateId(IdType.SelectOption),
      name: 'ai',
      color: 'pink',
      index: generateNodeIndex(frontendTeamSelectOption.index),
    };

    const otherTeamSelectOption: SelectOptionAttributes = {
      id: generateId(IdType.SelectOption),
      name: 'other',
      color: 'gray',
      index: generateNodeIndex(aiTeamSelectOption.index),
    };

    const teamsField: FieldAttributes = {
      id: generateId(IdType.Field),
      type: 'multi_select',
      name: 'Teams',
      index: generateNodeIndex(statusField.index),
      options: {
        [apiTeamSelectOption.id]: apiTeamSelectOption,
        [devopsTeamSelectOption.id]: devopsTeamSelectOption,
        [frontendTeamSelectOption.id]: frontendTeamSelectOption,
        [aiTeamSelectOption.id]: aiTeamSelectOption,
        [otherTeamSelectOption.id]: otherTeamSelectOption,
      },
    };

    const assignedField: FieldAttributes = {
      id: generateId(IdType.Field),
      type: 'collaborator',
      name: 'Assigned',
      index: generateNodeIndex(teamsField.index),
    };

    const priorityField: FieldAttributes = {
      id: generateId(IdType.Field),
      type: 'number',
      name: 'Priority',
      index: generateNodeIndex(assignedField.index),
    };

    const approvedField: FieldAttributes = {
      id: generateId(IdType.Field),
      type: 'boolean',
      name: 'Approved',
      index: generateNodeIndex(priorityField.index),
    };

    const releaseDateField: FieldAttributes = {
      id: generateId(IdType.Field),
      type: 'date',
      name: 'Release Date',
      index: generateNodeIndex(approvedField.index),
    };

    const commentsField: FieldAttributes = {
      id: generateId(IdType.Field),
      type: 'text',
      name: 'Comment',
      index: generateNodeIndex(releaseDateField.index),
    };

    const databaseAttributes: NodeAttributes = {
      type: 'database',
      parentId,
      name: 'Tasks',
      avatar: '01jhzbztaackk799qwrm744q15es',
      fields: {
        [statusField.id]: statusField,
        [teamsField.id]: teamsField,
        [assignedField.id]: assignedField,
        [priorityField.id]: priorityField,
        [approvedField.id]: approvedField,
        [releaseDateField.id]: releaseDateField,
        [commentsField.id]: commentsField,
      },
    };

    const user = this.getMainUser();

    const createDatabaseMutation = this.buildCreateNodeMutation(
      databaseId,
      databaseAttributes,
      databaseModel
    );
    user.mutations.push(createDatabaseMutation);

    const allTasksViewAttributes: NodeAttributes = {
      type: 'database_view',
      layout: 'table',
      name: 'All Tasks',
      index: generateNodeIndex(),
      parentId: databaseId,
    };

    const createAllTasksViewMutation = this.buildCreateNodeMutation(
      generateId(IdType.DatabaseView),
      allTasksViewAttributes,
      databaseViewModel
    );
    user.mutations.push(createAllTasksViewMutation);

    const activeTasksFilter: DatabaseViewFilterAttributes = {
      id: generateId(IdType.ViewFilter),
      type: 'field',
      fieldId: statusField.id,
      value: [activeStatusOption.id],
      operator: 'is_in',
    };

    const activeTasksViewAttributes: NodeAttributes = {
      type: 'database_view',
      layout: 'table',
      name: 'Active Tasks',
      filters: {
        [activeTasksFilter.id]: activeTasksFilter,
      },
      index: generateNodeIndex(),
      parentId: databaseId,
    };

    const createActiveTasksViewMutation = this.buildCreateNodeMutation(
      generateId(IdType.DatabaseView),
      activeTasksViewAttributes,
      databaseViewModel
    );
    user.mutations.push(createActiveTasksViewMutation);

    const kanbanViewAttributes: NodeAttributes = {
      type: 'database_view',
      layout: 'board',
      name: 'Kanban',
      index: generateNodeIndex(),
      parentId: databaseId,
      groupBy: statusField.id,
    };

    const createKanbanViewMutation = this.buildCreateNodeMutation(
      generateId(IdType.DatabaseView),
      kanbanViewAttributes,
      databaseViewModel
    );
    user.mutations.push(createKanbanViewMutation);

    this.buildRecords(databaseId, databaseAttributes, RECORDS_PER_DATABASE);
  }

  private buildClientsDatabase(parentId: string) {
    const databaseId = generateId(IdType.Database);

    const newLeadStatusOption: SelectOptionAttributes = {
      id: generateId(IdType.SelectOption),
      name: 'New Lead',
      color: 'gray',
      index: generateNodeIndex(),
    };

    const contactedStatusOption: SelectOptionAttributes = {
      id: generateId(IdType.SelectOption),
      name: 'Contacted',
      color: 'blue',
      index: generateNodeIndex(newLeadStatusOption.index),
    };

    const qualifiedStatusOption: SelectOptionAttributes = {
      id: generateId(IdType.SelectOption),
      name: 'Qualified',
      color: 'yellow',
      index: generateNodeIndex(contactedStatusOption.index),
    };

    const proposalSentStatusOption: SelectOptionAttributes = {
      id: generateId(IdType.SelectOption),
      name: 'Proposal Sent',
      color: 'red',
      index: generateNodeIndex(qualifiedStatusOption.index),
    };

    const negotiatingStatusOption: SelectOptionAttributes = {
      id: generateId(IdType.SelectOption),
      name: 'Negotiating',
      color: 'orange',
      index: generateNodeIndex(proposalSentStatusOption.index),
    };

    const convertedStatusOption: SelectOptionAttributes = {
      id: generateId(IdType.SelectOption),
      name: 'Converted',
      color: 'green',
      index: generateNodeIndex(negotiatingStatusOption.index),
    };

    const statusField: FieldAttributes = {
      id: generateId(IdType.Field),
      type: 'select',
      name: 'Status',
      index: generateNodeIndex(),
      options: {
        [newLeadStatusOption.id]: newLeadStatusOption,
        [contactedStatusOption.id]: contactedStatusOption,
        [qualifiedStatusOption.id]: qualifiedStatusOption,
        [proposalSentStatusOption.id]: proposalSentStatusOption,
        [negotiatingStatusOption.id]: negotiatingStatusOption,
        [convertedStatusOption.id]: convertedStatusOption,
      },
    };

    const techSectorSelectOption: SelectOptionAttributes = {
      id: generateId(IdType.SelectOption),
      name: 'Tech',
      color: 'blue',
      index: generateNodeIndex(),
    };

    const financeSectorSelectOption: SelectOptionAttributes = {
      id: generateId(IdType.SelectOption),
      name: 'Finance',
      color: 'green',
      index: generateNodeIndex(techSectorSelectOption.index),
    };

    const marketingSectorSelectOption: SelectOptionAttributes = {
      id: generateId(IdType.SelectOption),
      name: 'Marketing',
      color: 'purple',
      index: generateNodeIndex(financeSectorSelectOption.index),
    };

    const salesSectorSelectOption: SelectOptionAttributes = {
      id: generateId(IdType.SelectOption),
      name: 'Sales',
      color: 'pink',
      index: generateNodeIndex(marketingSectorSelectOption.index),
    };

    const educationSectorSelectOption: SelectOptionAttributes = {
      id: generateId(IdType.SelectOption),
      name: 'Education',
      color: 'purple',
      index: generateNodeIndex(salesSectorSelectOption.index),
    };

    const nonprofitSectorSelectOption: SelectOptionAttributes = {
      id: generateId(IdType.SelectOption),
      name: 'Nonprofit',
      color: 'gray',
      index: generateNodeIndex(educationSectorSelectOption.index),
    };

    const otherSectorSelectOption: SelectOptionAttributes = {
      id: generateId(IdType.SelectOption),
      name: 'other',
      color: 'gray',
      index: generateNodeIndex(nonprofitSectorSelectOption.index),
    };

    const sectorField: FieldAttributes = {
      id: generateId(IdType.Field),
      type: 'multi_select',
      name: 'Sector',
      index: generateNodeIndex(statusField.index),
      options: {
        [techSectorSelectOption.id]: techSectorSelectOption,
        [financeSectorSelectOption.id]: financeSectorSelectOption,
        [marketingSectorSelectOption.id]: marketingSectorSelectOption,
        [salesSectorSelectOption.id]: salesSectorSelectOption,
        [educationSectorSelectOption.id]: educationSectorSelectOption,
        [nonprofitSectorSelectOption.id]: nonprofitSectorSelectOption,
        [otherSectorSelectOption.id]: otherSectorSelectOption,
      },
    };

    const assignedField: FieldAttributes = {
      id: generateId(IdType.Field),
      type: 'collaborator',
      name: 'Assigned',
      index: generateNodeIndex(sectorField.index),
    };

    const revenueField: FieldAttributes = {
      id: generateId(IdType.Field),
      type: 'number',
      name: 'Revenue',
      index: generateNodeIndex(assignedField.index),
    };

    const archivedField: FieldAttributes = {
      id: generateId(IdType.Field),
      type: 'boolean',
      name: 'Archived',
      index: generateNodeIndex(revenueField.index),
    };

    const startDateField: FieldAttributes = {
      id: generateId(IdType.Field),
      type: 'date',
      name: 'Start Date',
      index: generateNodeIndex(archivedField.index),
    };

    const commentsField: FieldAttributes = {
      id: generateId(IdType.Field),
      type: 'text',
      name: 'Comment',
      index: generateNodeIndex(startDateField.index),
    };

    const databaseAttributes: NodeAttributes = {
      type: 'database',
      parentId,
      name: 'Clients',
      avatar: '01jhzbzpdgkmnx5e7y31c0bzpfes',
      fields: {
        [statusField.id]: statusField,
        [sectorField.id]: sectorField,
        [assignedField.id]: assignedField,
        [revenueField.id]: revenueField,
        [archivedField.id]: archivedField,
        [startDateField.id]: startDateField,
        [commentsField.id]: commentsField,
      },
    };

    const user = this.getMainUser();

    const createDatabaseMutation = this.buildCreateNodeMutation(
      databaseId,
      databaseAttributes,
      databaseModel
    );
    user.mutations.push(createDatabaseMutation);

    const allClientsViewAttributes: NodeAttributes = {
      type: 'database_view',
      layout: 'table',
      name: 'All Clients',
      index: generateNodeIndex(),
      parentId: databaseId,
    };

    const createAllClientsViewMutation = this.buildCreateNodeMutation(
      generateId(IdType.DatabaseView),
      allClientsViewAttributes,
      databaseViewModel
    );
    user.mutations.push(createAllClientsViewMutation);

    const activeClientsFilter: DatabaseViewFilterAttributes = {
      id: generateId(IdType.ViewFilter),
      type: 'field',
      fieldId: statusField.id,
      value: [newLeadStatusOption.id],
      operator: 'is_in',
    };

    const activeClientsViewAttributes: NodeAttributes = {
      type: 'database_view',
      layout: 'table',
      name: 'Active Clients',
      filters: {
        [activeClientsFilter.id]: activeClientsFilter,
      },
      index: generateNodeIndex(),
      parentId: databaseId,
    };

    const createActiveClientsViewMutation = this.buildCreateNodeMutation(
      generateId(IdType.DatabaseView),
      activeClientsViewAttributes,
      databaseViewModel
    );
    user.mutations.push(createActiveClientsViewMutation);

    const kanbanViewAttributes: NodeAttributes = {
      type: 'database_view',
      layout: 'board',
      name: 'Board',
      index: generateNodeIndex(),
      parentId: databaseId,
      groupBy: statusField.id,
    };

    const createKanbanViewMutation = this.buildCreateNodeMutation(
      generateId(IdType.DatabaseView),
      kanbanViewAttributes,
      databaseViewModel
    );
    user.mutations.push(createKanbanViewMutation);

    this.buildRecords(databaseId, databaseAttributes, RECORDS_PER_DATABASE);
  }

  private buildMeetingsDatabase(parentId: string) {
    const databaseId = generateId(IdType.Database);

    const techTagSelectOption: SelectOptionAttributes = {
      id: generateId(IdType.SelectOption),
      name: 'tech',
      color: 'blue',
      index: generateNodeIndex(),
    };

    const productTagSelectOption: SelectOptionAttributes = {
      id: generateId(IdType.SelectOption),
      name: 'product',
      color: 'green',
      index: generateNodeIndex(techTagSelectOption.index),
    };

    const designTagSelectOption: SelectOptionAttributes = {
      id: generateId(IdType.SelectOption),
      name: 'design (ui/ux)',
      color: 'purple',
      index: generateNodeIndex(productTagSelectOption.index),
    };

    const clientTagSelectOption: SelectOptionAttributes = {
      id: generateId(IdType.SelectOption),
      name: 'client',
      color: 'pink',
      index: generateNodeIndex(designTagSelectOption.index),
    };

    const hiringSectorSelectOption: SelectOptionAttributes = {
      id: generateId(IdType.SelectOption),
      name: 'hiring',
      color: 'purple',
      index: generateNodeIndex(clientTagSelectOption.index),
    };

    const otherSectorSelectOption: SelectOptionAttributes = {
      id: generateId(IdType.SelectOption),
      name: 'other',
      color: 'gray',
      index: generateNodeIndex(hiringSectorSelectOption.index),
    };

    const tagsField: FieldAttributes = {
      id: generateId(IdType.Field),
      type: 'multi_select',
      name: 'Tags',
      index: generateNodeIndex(),
      options: {
        [techTagSelectOption.id]: techTagSelectOption,
        [productTagSelectOption.id]: productTagSelectOption,
        [designTagSelectOption.id]: designTagSelectOption,
        [clientTagSelectOption.id]: clientTagSelectOption,
        [hiringSectorSelectOption.id]: hiringSectorSelectOption,
        [otherSectorSelectOption.id]: otherSectorSelectOption,
      },
    };

    const attendeesField: FieldAttributes = {
      id: generateId(IdType.Field),
      type: 'collaborator',
      name: 'Attendees',
      index: generateNodeIndex(tagsField.index),
    };

    const dateField: FieldAttributes = {
      id: generateId(IdType.Field),
      type: 'date',
      name: 'Date',
      index: generateNodeIndex(attendeesField.index),
    };

    const databaseAttributes: NodeAttributes = {
      type: 'database',
      parentId,
      name: 'Meetings',
      avatar: '01jhzbzv3sx8c66vdr0e98b7f1es',
      fields: {
        [tagsField.id]: tagsField,
        [attendeesField.id]: attendeesField,
        [dateField.id]: dateField,
      },
    };

    const user = this.getMainUser();
    const createDatabaseMutation = this.buildCreateNodeMutation(
      databaseId,
      databaseAttributes,
      databaseModel
    );
    user.mutations.push(createDatabaseMutation);

    const calendarViewAttributes: NodeAttributes = {
      type: 'database_view',
      layout: 'calendar',
      name: 'Calendar',
      index: generateNodeIndex(),
      parentId: databaseId,
      groupBy: dateField.id,
    };

    const createCalendarViewMutation = this.buildCreateNodeMutation(
      generateId(IdType.DatabaseView),
      calendarViewAttributes,
      databaseViewModel
    );
    user.mutations.push(createCalendarViewMutation);

    const tableViewAttributes: NodeAttributes = {
      type: 'database_view',
      layout: 'table',
      name: 'Table',
      index: generateNodeIndex(calendarViewAttributes.index),
      parentId: databaseId,
    };

    const createTableViewMutation = this.buildCreateNodeMutation(
      generateId(IdType.DatabaseView),
      tableViewAttributes,
      databaseViewModel
    );
    user.mutations.push(createTableViewMutation);

    this.buildRecords(databaseId, databaseAttributes, RECORDS_PER_DATABASE);
  }

  private buildRecords(
    databaseId: string,
    databaseAttributes: DatabaseAttributes,
    count: number
  ) {
    for (let i = 0; i < count; i++) {
      this.buildRecord(databaseId, databaseAttributes);
    }
  }

  private buildRecord(
    databaseId: string,
    databaseAttributes: DatabaseAttributes
  ) {
    const recordId = generateId(IdType.Record);
    const recordAttributes: NodeAttributes = {
      type: 'record',
      parentId: databaseId,
      databaseId,
      name: faker.lorem.sentence(),
      fields: {},
    };

    for (const field of Object.values(databaseAttributes.fields)) {
      const fieldValue = this.buildFieldValue(field);
      if (fieldValue) {
        recordAttributes.fields[field.id] = fieldValue;
      }
    }

    const user = this.getRandomUser(this.users);
    const createRecordMutation = this.buildCreateNodeMutation(
      recordId,
      recordAttributes,
      recordModel
    );
    user.mutations.push(createRecordMutation);

    const documentContent: DocumentContent = {
      type: 'rich_text',
      blocks: this.buildDocumentBlocks(recordId),
    };

    const createDocumentMutation = this.buildCreateDocumentMutation(
      recordId,
      documentContent
    );
    user.mutations.push(createDocumentMutation);
  }

  private getRandomUser(users: User[]): User {
    const user = users[Math.floor(Math.random() * users.length)];
    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  private getMainUser(): User {
    return this.users[0]!;
  }

  private buildCreateNodeMutation(
    nodeId: string,
    attributes: NodeAttributes,
    model: NodeModel
  ): Mutation {
    const ydoc = new YDoc();
    const update = ydoc.update(model.attributesSchema, attributes);
    if (!update) {
      throw new Error('Failed to create transaction');
    }

    const data: CreateNodeMutationData = {
      nodeId: nodeId,
      updateId: generateId(IdType.Update),
      createdAt: new Date().toISOString(),
      data: encodeState(update),
    };

    return {
      id: generateId(IdType.Mutation),
      type: 'node.create',
      data: data,
      createdAt: new Date().toISOString(),
    };
  }

  private buildCreateDocumentMutation(
    documentId: string,
    content: DocumentContent
  ): Mutation {
    const ydoc = new YDoc();
    const update = ydoc.update(documentContentSchema, content);
    if (!update) {
      throw new Error('Failed to create transaction');
    }

    const data: UpdateDocumentMutationData = {
      documentId,
      updateId: generateId(IdType.Update),
      createdAt: new Date().toISOString(),
      data: encodeState(update),
    };

    return {
      id: generateId(IdType.Mutation),
      type: 'document.update',
      data: data,
      createdAt: new Date().toISOString(),
    };
  }

  private buildMessageContent(messageId: string): Record<string, Block> {
    const paragraphBlock = this.buildParagraphBlock(
      messageId,
      generateNodeIndex()
    );
    return {
      [paragraphBlock.id]: paragraphBlock,
    };
  }

  private buildDocumentBlocks(pageId: string): Record<string, Block> {
    const nrOfParagraphs = Math.floor(Math.random() * 10) + 1;
    const blocks: Record<string, Block> = {};
    for (let i = 0; i < nrOfParagraphs; i++) {
      const block = this.buildParagraphBlock(pageId, generateNodeIndex());
      blocks[block.id] = block;
    }

    return blocks;
  }

  private buildParagraphBlock(parentId: string, index: string): Block {
    const blockId = generateId(IdType.Block);
    return {
      type: 'paragraph',
      parentId,
      content: [{ type: 'text', text: faker.lorem.sentence() }],
      id: blockId,
      index,
    };
  }

  private buildFieldValue(field: FieldAttributes): FieldValue | null {
    if (field.type === 'boolean') {
      return {
        type: 'boolean',
        value: faker.datatype.boolean(),
      };
    } else if (field.type === 'collaborator') {
      return {
        type: 'string_array',
        value: [this.getRandomUser(this.users).userId],
      };
    } else if (field.type === 'date') {
      return {
        type: 'string',
        value: faker.date.past().toISOString(),
      };
    } else if (field.type === 'email') {
      return {
        type: 'string',
        value: faker.internet.email(),
      };
    } else if (field.type === 'multi_select') {
      const options = Object.values(field.options ?? {});
      const randomOption = options[Math.floor(Math.random() * options.length)];
      if (!randomOption) {
        return null;
      }

      return {
        type: 'string_array',
        value: [randomOption.id],
      };
    } else if (field.type === 'number') {
      return {
        type: 'number',
        value: Math.floor(Math.random() * 1000),
      };
    } else if (field.type === 'phone') {
      return {
        type: 'string',
        value: faker.phone.number(),
      };
    } else if (field.type === 'select') {
      const options = Object.values(field.options ?? {});
      const randomOption = options[Math.floor(Math.random() * options.length)];
      if (!randomOption) {
        return null;
      }

      return {
        type: 'string',
        value: randomOption.id,
      };
    } else if (field.type === 'text') {
      return {
        type: 'text',
        value: faker.lorem.sentence(),
      };
    } else if (field.type === 'url') {
      return {
        type: 'string',
        value: faker.internet.url(),
      };
    }

    return null;
  }
}
