export enum ServerResponseStatus {
  Success = "success",
  Error = "error",
}

export interface BaseServerResponse {
  status: ServerResponseStatus;
}

export interface ServerError extends BaseServerResponse {
  status: ServerResponseStatus.Error;
  error: string;
}

export interface ServerSuccess<T> extends BaseServerResponse {
  status: ServerResponseStatus.Success;
  data: T;
}

export type ServerResponse<T> = ServerSuccess<T> | ServerError;
