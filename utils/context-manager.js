export const formatUserMessage = (content, isFirstMessage, environmentDetails) => {
  let formattedContent = content;
  
  // Wrap first message with task tag
  if (isFirstMessage) {
    formattedContent = `<task>${content}</task>`;
  }
  
  // Append environment details if provided
  if (environmentDetails) {
    formattedContent = `${formattedContent}\n\n${environmentDetails}`;
  }
  
  return formattedContent;
}

export const stripContextTags = (content) => {
  // Remove task tags for UI display
  return content.replace(/<task>(.*?)<\/task>/s, '$1').trim();
}