export const paginationPipeline = (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  return [
    {
      $facet: {
        data: [{ $skip: skip }, { $limit: limit }],
        totalCount: [{ $count: 'count' }],
      },
    },
    {
      $project: {
        data: 1,
        total: { $arrayElemAt: ['$totalCount.count', 0] },
        page: { $literal: page },
        limit: { $literal: limit },
        pages: {
          $ceil: {
            $divide: [{ $arrayElemAt: ['$totalCount.count', 0] }, limit],
          },
        },
      },
    },
  ];
};

export const dateRangePipeline = (startDate, endDate, dateField = 'createdAt') => ({
  [dateField]: {
    $gte: new Date(startDate),
    $lte: new Date(endDate),
  },
});

export const lookupPipeline = (from, localField, foreignField, as) => ({
  $lookup: {
    from,
    localField,
    foreignField,
    as,
  },
});

export default { paginationPipeline, dateRangePipeline, lookupPipeline };
