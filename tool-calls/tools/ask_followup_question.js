/**
 * Asks the user a follow-up question with optional choices
 * @param {Object} params - Parameters for the question
 * @param {string} params.question - The question to ask
 * @param {string[]} [params.options] - Optional array of choices
 * @returns {Object} The question result
 */
const ask_followup_question = async ({ question, options }) => {
  return {
    success: true,
    data: {
      question,
      options
    }
  }
}

export default ask_followup_question