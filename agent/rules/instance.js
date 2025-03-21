export const VERIFICATION_RULES = `
  - get_services must have serviceName
  - get_instances requires valid serviceId from previous get_services call
  - start_instance requires valid instanceId from previous get_instances call
  - Parameters should be consistent with previous context when part of a multi-step flow
  - if content contains "success: true", go to next step
  `
