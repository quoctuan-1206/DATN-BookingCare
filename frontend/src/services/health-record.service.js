import axiosClient from "../api/axios";

const base = (patientId) => `/health-records/${patientId}`;
const unwrap = (request) => request.then((response) => response.data?.data);

export const healthRecordService = {
  summary: (patientId) => unwrap(axiosClient.get(`${base(patientId)}/summary`)),
  timeline: (patientId, params = {}) => unwrap(axiosClient.get(`${base(patientId)}/timeline`, { params })),
  medications: (patientId) => unwrap(axiosClient.get(`${base(patientId)}/medications`)),
  tests: (patientId) => unwrap(axiosClient.get(`${base(patientId)}/tests`)),
  list: (patientId, kind) => unwrap(axiosClient.get(`${base(patientId)}/${kind}`)),
  create: (patientId, kind, data) => unwrap(axiosClient.post(`${base(patientId)}/${kind}`, data)),
  update: (patientId, kind, id, data) => unwrap(axiosClient.put(`${base(patientId)}/${kind}/${id}`, data)),
  remove: (patientId, kind, id) => unwrap(axiosClient.delete(`${base(patientId)}/${kind}/${id}`)),
};

export default healthRecordService;
