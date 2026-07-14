class ApiFeatures {
  static buildFilter(params: Record<string, any>) {
    const filter: any = {};

    if (params.search) {
      const regex = new RegExp(params.search, "i");
      filter.$or = [
        { title: { $regex: regex } },
        { shortDescription: { $regex: regex } },
        { fullDescription: { $regex: regex } },
      ];
    }

    if (params.category) {
      filter.category = params.category;
    }

    if (params.location) {
      filter.location = { $regex: params.location, $options: "i" };
    }

    const priceFilter: any = {};
    if (params.minPrice) priceFilter.$gte = Number(params.minPrice);
    if (params.maxPrice) priceFilter.$lte = Number(params.maxPrice);
    if (Object.keys(priceFilter).length) {
      filter.price = priceFilter;
    }

    return filter;
  }

  static buildSort(sort?: string, order?: string) {
    const sortField = ["date", "price", "ratingAverage"].includes(sort || "")
      ? sort!
      : "date";
    const sortOrder = order === "desc" ? -1 : 1;
    return { [sortField]: sortOrder };
  }

  static buildPagination(page?: string, limit?: string) {
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Math.min(50, Number(limit) || 8));
    const skip = (pageNum - 1) * limitNum;
    return { pageNum, limitNum, skip };
  }

  static getPaginationInfo(
    pageNum: number,
    limitNum: number,
    totalItems: number
  ) {
    const totalPages = Math.ceil(totalItems / limitNum);
    return {
      page: pageNum,
      limit: limitNum,
      totalItems,
      totalPages,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1,
    };
  }
}

export default ApiFeatures;
