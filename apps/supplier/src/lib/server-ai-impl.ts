// Bridge module: re-exports from REST API client instead of createServerFn
// This enables static site deployment without server-side rendering

export { askOmniMindServer as askOmniMindServerImpl } from './api-ai';

// Type re-export
export type AIResponseContract = {
  summary: string;
  details?: string;
  recommendations?: string[];
  data?: any;
};
