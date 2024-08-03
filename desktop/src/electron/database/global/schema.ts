export interface AccountsTableSchema {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  token: string;
}

export interface WorkspacesTableSchema {
  id: string;
  name: string;
  description: string | null;
  avatar: string | null;
  version_id: string;
  account_id: string;
  role: number;
  user_node_id: string;
}

export interface TransactionsTableSchema {
  id: string;
  workspace_id: string;
  account_id: string;
  type: string;
  node_id: string;
  input: string;
  created_at: string;
}

export interface GlobalDatabaseSchema {
  accounts: AccountsTableSchema;
  workspaces: WorkspacesTableSchema;
  transactions: TransactionsTableSchema;
}