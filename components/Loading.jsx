/**
 * Loading component that displays animated dots
 * @param {Object} props
 * @param {string} [props.className] - Additional CSS classes
 * @returns {JSX.Element} Loading indicator with animated dots
 */
// Import the loading.css file for loading dot styles
import '@/styles/loading.css'

const Loading = ({ className = '' }) => {
  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <span className="loading-dot"></span>
      <span className="loading-dot"></span>
      <span className="loading-dot"></span>
    </div>
  )
}

export default Loading
