import { useState, useRef } from 'react'
import Icons from './Icons'
import Modal from './Modal'

function FileBoard({ mini = false }) {
  const [viewMode, setViewMode] = useState('grid')
  const [activeTab, setActiveTab] = useState('files')
  const [files, setFiles] = useState([
    { id: 1, name: '브랜드 가이드라인.pdf', type: 'pdf', size: '2.4 MB', modified: '2시간 전', pinned: true },
    { id: 2, name: '1분기 보고서.xlsx', type: 'spreadsheet', size: '856 KB', modified: '어제', pinned: false },
    { id: 3, name: '히어로 이미지.png', type: 'image', size: '1.2 MB', modified: '3일 전', pinned: false },
    { id: 4, name: '프로젝트 에셋', type: 'folder', size: '파일 12개', modified: '1주일 전', pinned: false },
  ])
  const [posts, setPosts] = useState([
    { id: 1, title: '4월 업데이트 공지사항', author: '홍길동', date: '2024-04-22', views: 24, comments: 3, pinned: true },
    { id: 2, title: '스프린트 회고 결과 공유', author: '김사라', date: '2024-04-20', views: 18, comments: 5, pinned: false },
    { id: 3, title: '신규 입사자 온보딩 가이드', author: '이민준', date: '2024-04-18', views: 42, comments: 1, pinned: false },
  ])
  const [showFileModal, setShowFileModal] = useState(false)
  const [showPostModal, setShowPostModal] = useState(false)
  const [newPost, setNewPost] = useState({ title: '', content: '' })
  const [selectedFile, setSelectedFile] = useState(null)
  const [openFileMenuId, setOpenFileMenuId] = useState(null)
  const fileInputRef = useRef(null)

  const FileIcon = ({ type }) => {
    switch (type) {
      case 'pdf': return <Icons.FileText className={`xl file-icon ${type}`} />
      case 'spreadsheet': return <Icons.FileSpreadsheet className={`xl file-icon ${type}`} />
      case 'image': return <Icons.Image className={`xl file-icon ${type}`} />
      case 'folder': return <Icons.Folder className={`xl file-icon ${type}`} />
      default: return <Icons.FileText className="xl file-icon" />
    }
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    let type = 'pdf'
    if (['xlsx','csv'].includes(ext)) type = 'spreadsheet'
    else if (['png','jpg','jpeg','gif','webp'].includes(ext)) type = 'image'
    const newFile = {
      id: Date.now(),
      name: file.name,
      type,
      size: `${(file.size / 1024).toFixed(0)} KB`,
      modified: '방금',
      pinned: false,
    }
    setFiles(prev => [...prev, newFile])
    setShowFileModal(false)
  }

  const deleteFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id))
    setOpenFileMenuId(null)
  }

  const togglePin = (id) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, pinned: !f.pinned } : f))
    setOpenFileMenuId(null)
  }

  const addPost = () => {
    if (!newPost.title.trim()) return
    const post = {
      id: Date.now(),
      title: newPost.title,
      author: '홍길동',
      date: new Date().toISOString().split('T')[0],
      views: 0,
      comments: 0,
      pinned: false,
    }
    setPosts(prev => [...prev, post])
    setNewPost({ title: '', content: '' })
    setShowPostModal(false)
  }

  const sortedFiles = [...files].sort((a, b) => b.pinned - a.pinned)

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-header-left">
          <h3>게시판·자료실</h3>
          <p>{activeTab === 'files' ? '파일 및 폴더 관리' : '게시판 글 목록'}</p>
        </div>
        <div className="files-header-actions">
          {!mini && (
            <div className="tab-pills">
              <button className={`tab-pill ${activeTab==='files'?'active':''}`} onClick={() => setActiveTab('files')}>자료실</button>
              <button className={`tab-pill ${activeTab==='board'?'active':''}`} onClick={() => setActiveTab('board')}>게시판</button>
            </div>
          )}
          {activeTab === 'files' ? (
            <>
              {!mini && (
                <div className="view-toggle">
                  <button className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}><Icons.Grid className="sm" /></button>
                  <button className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}><Icons.List className="sm" /></button>
                </div>
              )}
              <button className="btn btn-outline btn-sm" onClick={() => setShowFileModal(true)}>
                <Icons.Upload className="sm" />업로드
              </button>
            </>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={() => setShowPostModal(true)}>
              <Icons.Plus className="sm" />글쓰기
            </button>
          )}
        </div>
      </div>

      <div className="card-content">
        {activeTab === 'files' ? (
          viewMode === 'grid' ? (
            <div className="files-grid">
              {sortedFiles.map((file) => (
                <div key={file.id} className="file-card" style={{position:'relative'}}>
                  {file.pinned && <div className="pin-badge"><Icons.Pin className="xs" /></div>}
                  <div className={`file-icon-wrapper ${file.type}`}><FileIcon type={file.type} /></div>
                  <p className="file-name">{file.name}</p>
                  <p className="file-meta">{file.size} - {file.modified}</p>
                  <div className="file-card-actions">
                    <button className="btn btn-icon btn-ghost xs" onClick={() => setOpenFileMenuId(openFileMenuId === file.id ? null : file.id)}><Icons.MoreHorizontal className="xs" /></button>
                    {openFileMenuId === file.id && (
                      <div className="dropdown-menu file-dropdown">
                        <button className="dropdown-item" onClick={() => togglePin(file.id)}><Icons.Pin className="sm" /> {file.pinned ? '고정 해제' : '고정'}</button>
                        <button className="dropdown-item" onClick={() => {}}><Icons.Download className="sm" /> 다운로드</button>
                        <button className="dropdown-item danger" onClick={() => deleteFile(file.id)}><Icons.Trash className="sm" /> 삭제</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="files-list">
              {sortedFiles.map((file) => (
                <div key={file.id} className="file-list-item">
                  {file.pinned && <Icons.Pin className="sm" style={{color:'var(--primary)',marginRight:'4px'}} />}
                  <div className={`file-list-icon file-icon-wrapper ${file.type}`}><FileIcon type={file.type} /></div>
                  <div className="file-list-content">
                    <p className="file-name">{file.name}</p>
                    <p className="file-meta">{file.size}</p>
                  </div>
                  <span className="file-list-date">{file.modified}</span>
                  <button className="btn btn-icon btn-ghost sm" onClick={() => {}}><Icons.Download className="sm" /></button>
                  <div className="dropdown-wrapper">
                    <button className="btn btn-icon btn-ghost sm file-list-more" onClick={() => setOpenFileMenuId(openFileMenuId === file.id ? null : file.id)}><Icons.MoreHorizontal className="sm" /></button>
                    {openFileMenuId === file.id && (
                      <div className="dropdown-menu">
                        <button className="dropdown-item" onClick={() => togglePin(file.id)}><Icons.Pin className="sm" /> {file.pinned ? '고정 해제' : '고정'}</button>
                        <button className="dropdown-item danger" onClick={() => deleteFile(file.id)}><Icons.Trash className="sm" /> 삭제</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="board-list">
            {posts.map(post => (
              <div key={post.id} className="board-item">
                {post.pinned && <Icons.Pin className="sm pin-icon" />}
                <div className="board-item-content">
                  <p className="board-title">{post.title}</p>
                  <div className="board-meta">
                    <span>{post.author}</span>
                    <span>·</span>
                    <span>{post.date}</span>
                    <span>·</span>
                    <span>조회 {post.views}</span>
                    <span>·</span>
                    <span><Icons.MessageSquare className="xs" /> {post.comments}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 파일 업로드 모달 */}
      <Modal isOpen={showFileModal} onClose={() => setShowFileModal(false)} title="파일 업로드">
        <div className="upload-area" onClick={() => fileInputRef.current?.click()}>
          <Icons.Upload />
          <p>클릭하여 파일 선택</p>
          <p className="file-meta">PDF, Excel, 이미지 등 지원</p>
          <input ref={fileInputRef} type="file" style={{display:'none'}} onChange={handleFileUpload} />
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={() => setShowFileModal(false)}>취소</button>
        </div>
      </Modal>

      {/* 게시글 작성 모달 */}
      <Modal isOpen={showPostModal} onClose={() => setShowPostModal(false)} title="새 글 작성">
        <div className="form-group">
          <label>제목 *</label>
          <input className="form-input" placeholder="제목을 입력하세요" value={newPost.title} onChange={e => setNewPost({...newPost, title: e.target.value})} />
        </div>
        <div className="form-group">
          <label>내용</label>
          <textarea className="form-input form-textarea" placeholder="내용을 입력하세요" value={newPost.content} onChange={e => setNewPost({...newPost, content: e.target.value})} rows={5} />
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={() => setShowPostModal(false)}>취소</button>
          <button className="btn btn-primary" onClick={addPost}>등록</button>
        </div>
      </Modal>
    </div>
  )
}

export default FileBoard