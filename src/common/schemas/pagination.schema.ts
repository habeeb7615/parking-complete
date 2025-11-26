export const PaginationSchema = {
  type: 'object',
  properties: {
    curPage: { type: 'number', example: 1 },
    perPage: { type: 'number', example: 10 },
    sortBy: { type: 'string', example: 'created_on', nullable: true },
    direction: { type: 'string', enum: ['asc', 'desc'], example: 'desc', nullable: true },
    whereClause: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          key: { type: 'string', example: 'string' },
          value: { type: 'string', example: 'string' },
          operator: { type: 'string', example: 'string', nullable: true },
        },
      },
    },
  },
  required: ['curPage', 'perPage', 'whereClause'],
};

