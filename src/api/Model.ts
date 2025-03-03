export interface Result<T> {
  code: number;
  msg: string;
  data: T;
}

export interface Page<T> {
  records: T[];
  total: number;
  size: number;
  current: number;
  pages: number;
}
