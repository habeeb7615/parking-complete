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

// Helper function to convert old pagination params to new format
export function convertToPaginationPayload(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): IPagination {
  const {
    page = 1,
    pageSize = 10,
    search = '',
    sortBy = 'created_on',
    sortOrder = 'desc'
  } = params;

  const whereClause: IWhereClause[] = [];

  // If search is provided, add it to whereClause as "all" search
  if (search) {
    whereClause.push({
      key: 'all',
      value: search,
      operator: 'LIKE'
    });
  }

  return {
    curPage: page,
    perPage: pageSize,
    sortBy,
    direction: sortOrder,
    whereClause
  };
}

