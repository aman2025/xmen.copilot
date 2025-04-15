import useGlobalStore from '@/store/useGlobalStore'
export const formatUserMessage = (content, isFirstMessage, environmentDetails) => {
  let formattedContent = content

  // Wrap first message with task tag
  if (isFirstMessage) {
    formattedContent = `<task>${content}</task>`
  }

  // Append environment details if provided
  if (environmentDetails) {
    formattedContent = `${formattedContent}\n\n${environmentDetails}`
  }

  return formattedContent
}

export const formatEnvironmentDetails = () => {
  const { userInfo, systemInfo } = useGlobalStore.getState()
  return `<environment_details>
# User info
Name: ${userInfo.username}
Email: ${userInfo.email}

# System info
Mode: ${systemInfo.mode}
Version: ${systemInfo.version}
</environment_details>`
}

export const formatAnswerTag = (answer) => {
  return `<answer>${answer}</answer>`
}

export const stripContextTags = (content) => {
  // Remove task, environment_details, and answer tags for UI display
  return content
    .replace(/<task>(.*?)<\/task>/s, '$1')
    .replace(/<environment_details>[\s\S]*?<\/environment_details>/s, '')
    .replace(/<answer>(.*?)<\/answer>/s, '$1')
    .trim()
}
