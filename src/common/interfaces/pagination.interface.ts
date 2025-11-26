export interface IWhereClause {
  key: string;
  value: string;
  operator?: string;
}

export interface IPagination {
  curPage: number;
  perPage: number;
  sortBy?: string;
  direction?: 'asc' | 'desc';
  whereClause: IWhereClause[];
}

export interface IPaginatedResponse<T> {
  data: T[];
  count: number;
  curPage: number;
  perPage: number;
  totalPages: number;
}

export function paginateResponse<T>(
  list: T[],
  count: number,
  curPage: number,
  perPage: number,
): IPaginatedResponse<T> {
  return {
    data: list,
    count,
    curPage,
    perPage,
    totalPages: Math.ceil(count / perPage),
  };
}

