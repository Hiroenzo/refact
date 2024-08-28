import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { DIFF_STATE_URL, DIFF_APPLY_URL } from "./consts";
import { DiffChunk } from "./types";
import { RootState } from "../../app/store";

export type DiffAppliedStateArgs = {
  chunks: DiffChunk[];
  toolCallId: string;
};

export type DiffOperationArgs = {
  chunks: DiffChunk[];
  toApply: boolean[];
  toolCallId: string;
};
export const diffApi = createApi({
  reducerPath: "diffs",
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
  tagTypes: ["diffs"],
  endpoints: (builder) => ({
    diffState: builder.query<
      DiffAppliedStateResponse,
      DiffAppliedStateArgs & { port: number }
    >({
      query: ({ chunks, port }) => ({
        url: `http://127.0.0.1:${port}${DIFF_STATE_URL}`,
        method: "POST",
        credentials: "same-origin",
        redirect: "follow",
        body: { chunks },
      }),

      providesTags: (_result, _error, args) => {
        return [{ type: "diffs", id: args.toolCallId }];
      },
      transformResponse: (response: unknown) => {
        // TODO: type check
        return response as DiffAppliedStateResponse;
      },
    }),
    diffApply: builder.mutation<
      DiffOperationResponse,
      DiffOperationArgs & { port: number }
    >({
      query: ({ chunks, toApply, port }) => ({
        url: `http://127.0.0.1:${port}${DIFF_APPLY_URL}`,
        method: "POST",
        body: { chunks, apply: toApply },
      }),
      transformResponse: (response: unknown) => {
        // TODO: type check
        return response as DiffOperationResponse;
      },
      invalidatesTags: (_result, _error, args) => {
        return [{ type: "diffs", id: args.toolCallId }];
      },
    }),
  }),
  refetchOnMountOrArgChange: true,
});

export interface DiffAppliedStateResponse {
  id: number;
  state: boolean[];
  can_apply: boolean[];
}

// export async function checkDiff(
//   chunks: DiffChunk[],
//   lspUrl?: string,
// ): Promise<DiffAppliedStateResponse> {
//   const addr = lspUrl
//     ? `${lspUrl.replace(/\/*$/, "")}${DEFF_STATE_URL}`
//     : DEFF_STATE_URL;

//   const apiKey = getApiKey();

//   const response = await fetch(addr, {
//     method: "POST",
//     body: JSON.stringify({ chunks }),
//     credentials: "same-origin",
//     redirect: "follow",
//     cache: "no-cache",
//     referrer: "no-referrer",
//     headers: {
//       accept: "application/json",
//       ...(apiKey ? { Authorization: "Bearer " + apiKey } : {}),
//     },
//   });

//   if (!response.ok) {
//     throw new Error(response.statusText);
//   }

//   const text = await response.text();

//   const json = parseOrElse<DiffAppliedStateResponse>(text, {
//     id: 0,
//     state: [],
//     can_apply: [],
//   });

//   return json;
// }

export interface DiffOperationResponse {
  fuzzy_results: {
    chunk_id: number;
    fuzzy_n_used: number;
  }[];

  state: (0 | 1 | 2)[];
}

export type DiffApplyResponse = {
  chunk_id: number;
  applied: boolean;
  can_unapply: boolean;
  success: boolean;
  detail: null | string;
}[];

export interface DiffPreviewResponse {
  state: DiffApplyResponse;
  results: {
    file_text: string;
    file_name_edit: string;
    file_name_delete: null | string;
    file_name_add: null | string;
  }[];
}

// TODO: delete this
// export async function doDiff(
//   chunks: DiffChunk[],
//   toApply: boolean[],
//   lspUrl?: string,
// ): Promise<DiffOperationResponse> {
//   const addr = lspUrl
//     ? `${lspUrl.replace(/\/*$/, "")}${DIFF_APPLY_URL}`
//     : DIFF_APPLY_URL;

//   const apiKey = getApiKey();

//   const response = await fetch(addr, {
//     method: "POST",
//     body: JSON.stringify({
//       apply: toApply,
//       chunks,
//     }),
//     credentials: "same-origin",
//     redirect: "follow",
//     cache: "no-cache",
//     referrer: "no-referrer",
//     headers: {
//       accept: "application/json",
//       ...(apiKey ? { Authorization: "Bearer " + apiKey } : {}),
//     },
//   });

//   if (!response.ok) {
//     throw new Error(response.statusText);
//   }

//   const text = await response.text();

//   const json = parseOrElse<DiffOperationResponse>(text, {
//     fuzzy_results: [],
//     state: [],
//   });

//   return json;
// }
