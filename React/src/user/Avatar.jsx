import { useState } from 'react'

function Avatar({ src, name, size = 'md', className = '' }) {
  const [imgError, setImgError] = useState(false)
  return (
    <div className={`avatar ${size} ${className}`}>
      {src && !imgError ? (
        <img src={src} alt={name} onError={() => setImgError(true)} />
      ) : (
        name?.[0] || '?'
      )}
    </div>
  )
}

export default Avatar