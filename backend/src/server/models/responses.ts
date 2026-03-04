export enum ServerResponseStatus {
  SUCCESS = "success",
  ERROR = "error",
}

export interface BaseServerResponse {
  status: ServerResponseStatus;
}

export interface ServerError extends BaseServerResponse {
  status: ServerResponseStatus.ERROR;
  error: string;
}

export interface ServerSuccess<T> extends BaseServerResponse {
  status: ServerResponseStatus.SUCCESS;
  data: T;
}

export type ServerResponse<T> = ServerSuccess<T> | ServerError;
