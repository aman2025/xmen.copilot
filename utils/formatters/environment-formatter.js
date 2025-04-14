import useGlobalStore from '@/store/useGlobalStore'

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