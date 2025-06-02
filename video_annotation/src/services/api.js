const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

// Video Config
export const getVideoConfig = async () => {
  const response = await fetch(`${API_BASE_URL}/video/config`);
  if (!response.ok) {
    throw new Error(`Failed to fetch video config: ${response.statusText}`);
  }
  return response.json();
};

// Annotations CRUD
export const getAnnotations = async (/* videoId */) => {
  // const url = videoId ? `${API_BASE_URL}/annotations?videoId=${videoId}` : `${API_BASE_URL}/annotations`;
  const url = `${API_BASE_URL}/annotations`; // Simplified for now
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch annotations: ${response.statusText}`);
  }
  return response.json();
};

export const createAnnotation = async (annotationData) => {
  const response = await fetch(`${API_BASE_URL}/annotations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(annotationData),
  });
  if (!response.ok) {
    // Try to parse error message from backend if available
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(`Failed to create annotation: ${errorData.message || response.statusText}`);
  }
  return response.json();
};

export const updateAnnotation = async (id, annotationData) => {
  const response = await fetch(`${API_BASE_URL}/annotations/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(annotationData),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(`Failed to update annotation ${id}: ${errorData.message || response.statusText}`);
  }
  return response.json();
};

export const deleteAnnotation = async (id) => {
  const response = await fetch(`${API_BASE_URL}/annotations/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    // For 204 No Content, response.ok might be true but no json body
    if (response.status === 204) return; // Successful deletion
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(`Failed to delete annotation ${id}: ${errorData.message || response.statusText}`);
  }
  // DELETE often returns 204 No Content, so no JSON to parse for success
  if (response.status === 204) return; 
  return response.json(); // Should not happen for a 204, but as a fallback
}; 