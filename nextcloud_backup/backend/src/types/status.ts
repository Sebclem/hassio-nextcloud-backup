
export interface Status {
  status: string;
  progress: number;
  last_backup?: string;
  next_backup?: string;
  message?: string;
  error_code?: number;

}