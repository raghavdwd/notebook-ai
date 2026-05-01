import React from 'react'

const DocAttachModal = ({onClose}) => {
  return (
    <div className='doc-attach-modal'>
        <h2>Document Attachment</h2>
        <div className="upload-pdf">
            <input type="file" accept="application/pdf" />
            <button>Upload PDF</button>
        </div>
        <div className="attach-yt">
            <input type="text" placeholder="Enter YouTube URL" />
            <button>Attach YouTube Video</button>
        </div>
        <button onClick={onClose}>Close</button>
    </div>
  )
}

export default DocAttachModal