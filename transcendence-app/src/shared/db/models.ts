export enum table {
  USERS = 'Users',
  LOCAL_FILE = 'LocalFile',
  AUTH_PROVIDER = 'AuthProvider',
}

export interface Query {
  text: string;
  values: any[];
}

export interface MappedQuery {
  cols: string[];
  params: string[];
  values: any[];
}
