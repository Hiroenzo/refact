import { RootState } from "../../app/store";
import { parseOrElse } from "../../utils";
import { AT_COMMAND_COMPLETION, AT_COMMAND_PREVIEW } from "./consts";
import { type ChatContextFile } from "./types";

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export type CompletionArgs = {
  query: string;
  cursor: number;
  top_n?: number;
  port: number;
};

export const commandsApi = createApi({
  reducerPath: "commands",
  baseQuery: fetchBaseQuery({
    prepareHeaders: (headers, api) => {
      const getState = api.getState as () => RootState;
      const state = getState();
      const token = state.config.apiKey;
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    getCommandCompletion: builder.query<
      CommandCompletionResponse,
      CompletionArgs
    >({
      query: (args: CompletionArgs) => {
        return {
          url: `http://127.0.0.1:${args.port}${AT_COMMAND_COMPLETION}`,
          method: "POST",
          credentials: "same-origin",
          redirect: "follow",
          body: {
            query: args.query,
            cursor: args.cursor,
            top_n: args.top_n ?? 5,
          },
        };
      },
      transformResponse: (response) => {
        if (
          !isCommandCompletionResponse(response) &&
          !isDetailMessage(response)
        ) {
          throw new Error("Invalid response from command completion");
        }

        if (isDetailMessage(response)) {
          return {
            completions: [],
            replace: [0, 0],
            is_cmd_executable: false,
          };
        }
        return response;
      },
    }),
    getCommandPreview: builder.query<
      ChatContextFile[],
      { query: string; port: number }
    >({
      query: ({ query, port }) => {
        return {
          url: `http://127.0.0.1:${port}${AT_COMMAND_PREVIEW}`,
          method: "POST",
          credentials: "same-origin",
          redirect: "follow",
          body: { query },
        };
      },
      transformResponse: (response) => {
        if (!isCommandPreviewResponse(response) && !isDetailMessage(response)) {
          throw new Error("Invalid response from command preview");
        }

        if (isDetailMessage(response)) {
          return [];
        }

        const files = response.messages.reduce<ChatContextFile[]>(
          (acc, { content }) => {
            const fileData = parseOrElse<ChatContextFile[]>(content, []);
            return [...acc, ...fileData];
          },
          [],
        );

        return files;
      },
    }),
  }),
  refetchOnMountOrArgChange: true,
});

export type CommandCompletionResponse = {
  completions: string[];
  replace: [number, number];
  is_cmd_executable: boolean;
};

export function isCommandCompletionResponse(
  json: unknown,
): json is CommandCompletionResponse {
  if (!json) return false;
  if (typeof json !== "object") return false;
  if (!("completions" in json)) return false;
  if (!("replace" in json)) return false;
  if (!("is_cmd_executable" in json)) return false;
  return true;
}
export type DetailMessage = {
  detail: string;
};
export function isDetailMessage(json: unknown): json is DetailMessage {
  if (!json) return false;
  if (typeof json !== "object") return false;
  if (!("detail" in json)) return false;
  return true;
}

export type CommandPreviewContent = {
  content: string;
  role: "context_file";
};
export type CommandPreviewResponse = {
  messages: CommandPreviewContent[];
};

export function isCommandPreviewResponse(
  json: unknown,
): json is CommandPreviewResponse {
  if (!json) return false;
  if (typeof json !== "object") return false;
  if (!("messages" in json)) return false;
  if (!Array.isArray(json.messages)) return false;

  if (!json.messages.length) return true;

  const firstMessage: unknown = json.messages[0];
  if (!firstMessage) return false;
  if (typeof firstMessage !== "object") return false;
  if (!("role" in firstMessage)) return false;
  if (firstMessage.role !== "context_file") return false;
  if (!("content" in firstMessage)) return false;
  if (typeof firstMessage.content !== "string") return false;

  return true;
}
