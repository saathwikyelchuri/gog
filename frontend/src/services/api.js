import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 60000 // 60s for Gemini calls
})

/**
 * Upload CSV or XLSX dataset file
 * @param {File} file
 */
export async function uploadDataset(file) {
  const formData = new FormData()
  formData.append('file', file)
  const response = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return response.data
}

/**
 * Send a natural language query with conversation history
 * @param {string} question
 * @param {Array} conversationHistory
 */
export async function sendQuery(question, conversationHistory = []) {
  const response = await api.post('/query', { question, conversationHistory })
  return response.data
}

/**
 * Preload Nykaa Digital Marketing.csv from server disk
 */
export async function preloadDataset() {
  const response = await api.get('/preload')
  return response.data
}

export default api
