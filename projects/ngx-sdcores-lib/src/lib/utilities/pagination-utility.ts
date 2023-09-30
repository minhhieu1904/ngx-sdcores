export interface Pagination {
    totalCount: number;
    totalPage: number;
    pageNumber: number;
    pageSize: number;
    skip: number;
  }
  
  export interface PaginationParam {
    pageNumber: number;
    pageSize: number;
  }
  
  export class PaginationResult<T> {
    result: T[] | undefined;
    pagination: Pagination | undefined;
  }