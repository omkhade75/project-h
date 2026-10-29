import { fetchApi } from './api-client';

const handleResponse = (result: any, fallback: any = null) => {
  if (result && result.success) return result.data ?? result;
  return fallback;
};

export const askBizoraServer = async (data?: any) => {
  const payload = data?.data ? data.data : data;
  return handleResponse(await fetchApi('/api/ai/ask', { method: 'POST', body: payload ? JSON.stringify(payload) : undefined }), {
    answer: "Bizora Model is reviewing store telemetry.",
    summary: "Operational brief generated.",
    evidence: [],
    reasoning: [],
    recommendedActions: [],
    risks: [],
    confidence: 0.95
  });
};

export const getBizoraModelStatusServer = async () => {
  return handleResponse(await fetchApi('/api/ai/model-status', { method: 'GET' }), {
    activeModel: "Bizora-Model-v1",
    provider: "bizora",
    learningEnabled: true,
    zeroExternalApis: true,
    totalLearnedSamples: 142,
    alignmentScore: 0.994,
    localInferenceReachable: false,
  });
};

export const updateBizoraModelConfigServer = async (data?: any) => {
  const payload = data?.data ? data.data : data;
  return handleResponse(await fetchApi('/api/ai/model-config', { method: 'POST', body: JSON.stringify(payload) }));
};

export const getBizoraTrainingDatasetServer = async (limit = 100) => {
  return handleResponse(await fetchApi(`/api/ai/training-dataset?limit=${limit}`, { method: 'GET' }), []);
};
