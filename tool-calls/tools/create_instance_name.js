/**
 * Creates a random instance name or ID
 * @param {Object} params - Parameters for name generation
 * @param {string} [params.prefix='inst'] - Optional prefix for the name
 * @param {boolean} [params.includeTimestamp=true] - Whether to include timestamp
 * @returns {Object} The generated instance name and ID
 */
const create_instance_name = async (params = {}) => {
  const { 
    prefix = 'inst', 
    includeTimestamp = true 
  } = params;
  
  // Generate random alphanumeric string
  const randomString = Math.random().toString(36).substring(2, 8);
  
  // Add timestamp if requested
  const timestamp = includeTimestamp ? `-${Date.now().toString().slice(-6)}` : '';
  
  // Combine parts to create instance name
  const instanceName = `${prefix}-${randomString}${timestamp}`;
  
  // Generate a numeric ID
  const instanceId = Math.floor(100000 + Math.random() * 900000).toString();
  
  return {
    instanceName,
    instanceId
  };
};

export default create_instance_name; 