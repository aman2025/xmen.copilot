/**
 * Presents the final result of a task to the user
 * @param {Object} params - Parameters for the completion
 * @param {string} params.result - The final result description
 * @returns {Object} The completion result
 */
const attempt_completion = async ({ result }) => {
  return {
    success: true,
    data: {
      result
    }
  }
}

export default attempt_completion