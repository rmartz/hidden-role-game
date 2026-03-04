/* tslint:disable */
/* eslint-disable */
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import type { TsoaRoute } from "@tsoa/runtime";
import { fetchMiddlewares, ExpressTemplateService } from "@tsoa/runtime";
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { LobbyController } from "./controllers/LobbyController";
import type {
  Request as ExRequest,
  Response as ExResponse,
  RequestHandler,
  Router,
} from "express";

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

const models: TsoaRoute.Models = {
  "ServerResponseStatus.Success": {
    dataType: "refEnum",
    enums: ["success"],
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  LobbyPlayer: {
    dataType: "refObject",
    properties: {
      id: { dataType: "string", required: true },
      name: { dataType: "string", required: true },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  "GameStatus.Starting": {
    dataType: "refEnum",
    enums: ["Starting"],
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  StartingGameStatus: {
    dataType: "refObject",
    properties: {
      type: { ref: "GameStatus.Starting", required: true },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  "GameStatus.Playing": {
    dataType: "refEnum",
    enums: ["Playing"],
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  PlayingGameStatus: {
    dataType: "refObject",
    properties: {
      type: { ref: "GameStatus.Playing", required: true },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  "GameStatus.Finished": {
    dataType: "refEnum",
    enums: ["Finished"],
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  FinishedGameStatus: {
    dataType: "refObject",
    properties: {
      type: { ref: "GameStatus.Finished", required: true },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  GameStatusState: {
    dataType: "refAlias",
    type: {
      dataType: "union",
      subSchemas: [
        { ref: "StartingGameStatus" },
        { ref: "PlayingGameStatus" },
        { ref: "FinishedGameStatus" },
      ],
      validators: {},
    },
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  Game: {
    dataType: "refObject",
    properties: {
      status: { ref: "GameStatusState", required: true },
      players: {
        dataType: "array",
        array: { dataType: "refObject", ref: "LobbyPlayer" },
        required: true,
      },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  Lobby: {
    dataType: "refObject",
    properties: {
      id: { dataType: "string", required: true },
      players: {
        dataType: "array",
        array: { dataType: "refObject", ref: "LobbyPlayer" },
        required: true,
      },
      game: { ref: "Game" },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  ServerResponseStatus: {
    dataType: "refEnum",
    enums: ["success", "error"],
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  ServerSuccess_Lobby_: {
    dataType: "refObject",
    properties: {
      status: { ref: "ServerResponseStatus.Success", required: true },
      data: { ref: "Lobby", required: true },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  "ServerResponseStatus.Error": {
    dataType: "refEnum",
    enums: ["error"],
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  ServerError: {
    dataType: "refObject",
    properties: {
      status: { ref: "ServerResponseStatus.Error", required: true },
      error: { dataType: "string", required: true },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  ServerResponse_Lobby_: {
    dataType: "refAlias",
    type: {
      dataType: "union",
      subSchemas: [{ ref: "ServerSuccess_Lobby_" }, { ref: "ServerError" }],
      validators: {},
    },
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  JoinLobbyRequest: {
    dataType: "refObject",
    properties: {
      playerName: { dataType: "string", required: true },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
};
const templateService = new ExpressTemplateService(models, {
  noImplicitAdditionalProperties: "throw-on-extras",
  bodyCoercion: true,
});

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

export function RegisterRoutes(app: Router) {
  // ###########################################################################################################
  //  NOTE: If you do not see routes for all of your controllers in this file, then you might not have informed tsoa of where to look
  //      Please look into the "controllerPathGlobs" config option described in the readme: https://github.com/lukeautry/tsoa
  // ###########################################################################################################

  const argsLobbyController_createLobby: Record<
    string,
    TsoaRoute.ParameterSchema
  > = {};
  app.post(
    "/lobby/create",
    ...fetchMiddlewares<RequestHandler>(LobbyController),
    ...fetchMiddlewares<RequestHandler>(LobbyController.prototype.createLobby),

    async function LobbyController_createLobby(
      request: ExRequest,
      response: ExResponse,
      next: any,
    ) {
      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      let validatedArgs: any[] = [];
      try {
        validatedArgs = templateService.getValidatedArgs({
          args: argsLobbyController_createLobby,
          request,
          response,
        });

        const controller = new LobbyController();

        await templateService.apiHandler({
          methodName: "createLobby",
          controller,
          response,
          next,
          validatedArgs,
          successStatus: undefined,
        });
      } catch (err) {
        return next(err);
      }
    },
  );
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  const argsLobbyController_getLobby: Record<
    string,
    TsoaRoute.ParameterSchema
  > = {
    lobbyId: {
      in: "path",
      name: "lobbyId",
      required: true,
      dataType: "string",
    },
  };
  app.get(
    "/lobby/:lobbyId",
    ...fetchMiddlewares<RequestHandler>(LobbyController),
    ...fetchMiddlewares<RequestHandler>(LobbyController.prototype.getLobby),

    async function LobbyController_getLobby(
      request: ExRequest,
      response: ExResponse,
      next: any,
    ) {
      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      let validatedArgs: any[] = [];
      try {
        validatedArgs = templateService.getValidatedArgs({
          args: argsLobbyController_getLobby,
          request,
          response,
        });

        const controller = new LobbyController();

        await templateService.apiHandler({
          methodName: "getLobby",
          controller,
          response,
          next,
          validatedArgs,
          successStatus: undefined,
        });
      } catch (err) {
        return next(err);
      }
    },
  );
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  const argsLobbyController_joinLobby: Record<
    string,
    TsoaRoute.ParameterSchema
  > = {
    lobbyId: {
      in: "path",
      name: "lobbyId",
      required: true,
      dataType: "string",
    },
    body: { in: "body", name: "body", required: true, ref: "JoinLobbyRequest" },
  };
  app.post(
    "/lobby/:lobbyId/join",
    ...fetchMiddlewares<RequestHandler>(LobbyController),
    ...fetchMiddlewares<RequestHandler>(LobbyController.prototype.joinLobby),

    async function LobbyController_joinLobby(
      request: ExRequest,
      response: ExResponse,
      next: any,
    ) {
      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      let validatedArgs: any[] = [];
      try {
        validatedArgs = templateService.getValidatedArgs({
          args: argsLobbyController_joinLobby,
          request,
          response,
        });

        const controller = new LobbyController();

        await templateService.apiHandler({
          methodName: "joinLobby",
          controller,
          response,
          next,
          validatedArgs,
          successStatus: undefined,
        });
      } catch (err) {
        return next(err);
      }
    },
  );
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
}

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
