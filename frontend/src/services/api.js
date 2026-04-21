import axios from 'axios';

const api = axios.create({
  baseURL: '/api'
});

export const datasetAPI = {
  list: () => api.get('/datasets/'),
  create: (data) => api.post('/datasets/', data),
  getConfig: (rootPath) => api.post('/datasets/config', { root_path: rootPath }),
  updateConfig: (rootPath, config) => api.put('/datasets/config', { root_path: rootPath, ...config }),
  patchConfig: (rootPath, updates) => api.patch('/datasets/config', { root_path: rootPath, ...updates }),
  delete: (rootPath) => api.post('/datasets/delete', { root_path: rootPath })
};

export const imageAPI = {
  getList: (rootPath, params) => api.post(`/datasets/images`, { root_path: rootPath, ...params }),
  getPreview: (path) => api.post(`/datasets/images/preview`, { path }, { responseType: 'blob' }),
  delete: (path) => api.delete(`/datasets/images/${encodeURIComponent(path)}`),
  restore: (path) => api.post(`/datasets/images/${encodeURIComponent(path)}/restore`)
};

export const annotationAPI = {
  getList: (rootPath) => api.post('/datasets/annotations', { root_path: rootPath }),
  add: (rootPath, data) => api.post('/datasets/annotation', { root_path: rootPath, ...data }),
  remove: (rootPath, imagePath) => api.post('/datasets/annotation/remove', { root_path: rootPath, image_path: imagePath }),
  clear: (rootPath, paths) => api.post('/datasets/annotations/clear', { root_path: rootPath, image_paths: paths }),
  export: (rootPath) => api.post('/datasets/annotations/export', { root_path: rootPath }, { responseType: 'blob' }),
  import: (rootPath, file) => {
    const formData = new FormData();
    formData.append('file', file);
    // 注意：FastAPI 处理混合 Payload 和 File 时，通常需要从 Form 字段获取其他参数
    // 或者使用 JSON Body + Base64 文件。这里我们尝试将 root_path 也放入 FormData
    formData.append('root_path', rootPath);
    return api.post('/datasets/annotations/import', formData);
  }
};

export const inferenceAPI = {
  run: (rootPath, inferencerType = 'dummy') => api.post('/datasets/infer', { root_path: rootPath, inferencer_type: inferencerType }),
  listFiles: (rootPath) => api.post('/datasets/inference-files', { root_path: rootPath }),
  getResult: (rootPath, filename) => api.post('/datasets/inference-result', { root_path: rootPath, filename }),
  merge: (rootPath, filename) => api.post('/datasets/merge-inference', { root_path: rootPath, filename })
};

export default api;
