//const { page = 1, limit = 10, fields, sort, ...filters } = this.query;

class ApiFeatures {
  constructor(query, queryStr) {
    this.query = query;
    this.queryStr = queryStr;
  }
  // filtering
  filter() {
    const queryObj = { ...this.queryStr }; // Shallow copy
    const excludedFields = ["page", "limit", "sort", "fields"];
    excludedFields.forEach((field) => delete queryObj[field]); // Remove special query params

    let queryString = JSON.stringify(queryObj);
    queryString = queryString.replace(
      /\b(gte|gt|lte|lt)\b/g,
      (match) => `$${match}`
    );

    const filteredQuery = JSON.parse(queryString);
    this.query = this.query.find(filteredQuery); // Apply filters
    return this;
  }

  // sorting
  sort() {
    if (this.queryStr.sort) {
      // query = query.sort(req.query.sort);
      const sortField = this.queryStr.sort.split(",").join(" ");
      this.query = this.query.sort(sortField);
    } else {
      this.query = this.query.sort("-createdAt");
    }
    return this;
  }

  // field limit
  limitFields() {
    if (this.queryStr.fields) {
      const fields = this.queryStr.fields.split(",").join(" ");
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select("-__v");
    }
    return this;
  }

  pagination() {
    const page = parseInt(this.queryStr.page, 10) || 1;
    const limit = parseInt(this.queryStr.limit, 10) || 10;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    // const pageNum = parseInt(page, 10);
    // const limitNum = parseInt(limit, 10);

    // const skip = (pageNum - 1) * limitNum;
    // this.query = this.query.skip(skip).limit(limitNum);

    // if (req.query.page) {
    //   const moviesCount = await Movie.countDocuments();
    //   if (skip >= moviesCount) {
    //     throw new Error("This page is not found my bro!");
    //   }
    // }
    return this;
  }
}

module.exports = ApiFeatures;
