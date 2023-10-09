import { Pagination } from "../interfaces";

export class PaginationResult<T> {
  result: T[] | undefined;
  pagination: Pagination | undefined;
}
