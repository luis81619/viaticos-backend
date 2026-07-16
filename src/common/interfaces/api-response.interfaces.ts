export interface ApiResponse<T> {
  success: boolean;
  status: number;
  message: string;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    totalRecords?: number;
    totalPages?: number;
  };
}