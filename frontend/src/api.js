import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

export async function fetchAnnotations(videoId) {
  // assuming each video has an ID; for now, use a hardcoded ID or omit
  const res = await axios.get(`${API_BASE}/annotations?video=${videoId}`);
  return res.data;
}

export async function createAnnotation(annotation) {
  const res = await axios.post(`${API_BASE}/annotations`, annotation);
  return res.data;
}

export async function updateAnnotation(id, annotation) {
  const res = await axios.put(`${API_BASE}/annotations/${id}`, annotation);
  return res.data;
}

export async function deleteAnnotation(id) {
  const res = await axios.delete(`${API_BASE}/annotations/${id}`);
  return res.data;
} 