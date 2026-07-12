import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

/**
 * Sends a chat message and processes the Server-Sent Events stream.
 * @param {string} message - User's message
 * @param {number|null} sessionId - Optional session ID
 * @param {function} onChunk - Callback fired with new text chunks
 * @param {function} onDone - Callback fired when stream finishes (receives sessionId)
 * @param {function} onError - Callback fired on error
 */
export const streamChatResponse = async (message, sessionId, onChunk, onDone, onError, abortSignal = null) => {
  try {
    const response = await fetch(`${API_BASE_URL}/chat/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, session_id: sessionId }),
      signal: abortSignal,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      
      const lines = buffer.split('\n');
      buffer = lines.pop(); // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6).trim();
          if (dataStr) {
            try {
              const data = JSON.parse(dataStr);
              if (data.error) {
                onError(data.error);
              } else if (data.done) {
                // Final special event sent by our backend
                onDone(data.session_id);
              } else if (data.message && data.message.content) {
                onChunk(data.message.content);
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e, dataStr);
            }
          }
        }
      }
    }
    
    // Fallback if the special final event wasn't caught (e.g. backend error)
    if (!buffer.includes('"done": true')) {
        // onDone(sessionId); // let the caller handle completion if needed, though usually handled by event
    }

  } catch (err) {
    onError(err.message);
  }
};

/**
 * Uploads a PDF file to the backend
 * @param {File} file - The PDF file object
 * @returns {Promise<Object>} - The server response containing doc_id and summary
 */
export const uploadPDF = async (file, abortSignal = null) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await apiClient.post('/pdf/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    signal: abortSignal,
  });
  return response.data;
};

/**
 * Generates flashcards based on a topic
 * @param {string} topic - The topic to generate flashcards for
 * @param {number} numCards - The number of cards to generate
 * @returns {Promise<Array>} - Array of flashcard objects {question, answer}
 */
export const generateFlashcards = async (topic, numCards = 5, abortSignal = null) => {
  const response = await apiClient.post('/flashcards/', { topic, num_cards: numCards }, {
    signal: abortSignal,
  });
  return response.data;
};

/**
 * Generates a quiz based on a topic and options
 * @param {Object} options - {topic, quiz_type, difficulty, total_questions}
 * @returns {Promise<Object>} - The quiz data structure
 */
export const generateQuiz = async (options, abortSignal = null) => {
  const response = await apiClient.post('/quiz/', options, {
    signal: abortSignal,
  });
  return response.data;
};

/**
 * Submits the user's quiz answers to the backend
 * @param {number} quizId - The ID of the quiz
 * @param {Object} answers - { question_id: "selected option" }
 */
export const submitQuiz = async (quizId, answers) => {
  const response = await apiClient.post(`/quiz/${quizId}/submit`, { answers });
  return response.data;
};

/**
 * Streams enhanced smart notes based on raw user text
 * @param {string} rawText - The rough notes to enhance
 * @param {Function} onChunk - Callback for each piece of generated text
 * @param {Function} onDone - Callback when streaming finishes
 * @param {Function} onError - Callback for errors
 */
export const streamNotesResponse = async (rawText, onChunk, onDone, onError, abortSignal = null) => {
  try {
    const response = await fetch(`${API_BASE_URL}/notes/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw_text: rawText }),
      signal: abortSignal,
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.replace('data: ', '').trim();
          if (dataStr) {
            try {
              const data = JSON.parse(dataStr);
              if (data.error) {
                const streamErr = new Error(data.error);
                streamErr.noteId = data.note_id;
                throw streamErr;
              }
              if (data.message && data.message.content) {
                onChunk(data.message.content);
              }
              if (data.done) {
                onDone(data.note_id);
              }
            } catch (e) {
              if (e.noteId !== undefined) throw e; // Propagate the streamErr
              console.error('Error parsing JSON chunk', e);
            }
          }
        }
      }
    }

    if (!buffer.includes('"done": true')) {
        onDone(); 
    }

  } catch (err) {
    onError(err.message, err.noteId);
  }
};

/**
 * Fetch unified history of all tools
 */
export const getHistory = async () => {
  const response = await apiClient.get('/history/');
  return response.data;
};

/**
 * Delete a history item
 */
export const deleteHistoryItem = async (type, id) => {
  const response = await apiClient.delete(`/history/${type}/${id}`);
  return response.data;
};

/**
 * Fetch chat session messages
 */
export const getChatSessionMessages = async (sessionId) => {
  const response = await apiClient.get(`/chat/${sessionId}/messages`);
  return response.data;
};

/**
 * Fetch flashcard set by ID
 */
export const getFlashcardSet = async (setId) => {
  const response = await apiClient.get(`/flashcards/${setId}`);
  return response.data;
};

/**
 * Fetch quiz by ID
 */
export const getQuiz = async (quizId) => {
  const response = await apiClient.get(`/quiz/${quizId}`);
  return response.data;
};

/**
 * Fetch smart note by ID
 */
export const getNote = async (noteId) => {
  const response = await apiClient.get(`/notes/${noteId}`);
  return response.data;
};

/**
 * Update flashcard feedback status and bookmark
 * @param {number} cardId 
 * @param {Object} feedbackData - { status: 'Easy', is_bookmarked: true }
 */
export const updateFlashcardFeedback = async (cardId, feedbackData) => {
  const response = await apiClient.put(`/flashcards/card/${cardId}/feedback`, feedbackData);
  return response.data;
};
