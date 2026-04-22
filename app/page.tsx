'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

type Session = {
  id: string
  name: string
  date: string
  time: string
  zoom_link: string
  recording_url: string
  transcript_id: string
  students: string[]
  status: 'scheduled' | 'live' | 'complete' | 'processing' | 'failed'
}

type FormTemplate = {
  id: string
  name: string
  fields: string[]
}

type Supervisor = {
  id: string
  email: string
  full_name: string
}

type Student = {
  id: string
  name: string
  program: string
  supervisor_id: string
  created_at: string
}

type GeneratedForm = {
  id: string
  session_id: string
  student_name: string
  form_data: Record<string, string>
  status: string
}

export default function Home() {
  const [page, setPage] = useState('dashboard')
  const [sessions, setSessions] = useState<Session[]>([])
  const [forms, setForms] = useState<FormTemplate[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [generatedForms, setGeneratedForms] = useState<GeneratedForm[]>([])
  const [showNewSession, setShowNewSession] = useState(false)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [showNewStudent, setShowNewStudent] = useState(false)
  const [supervisor, setSupervisor] = useState<Supervisor | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { checkUser() }, [])

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { window.location.href = '/auth'; return }
    const { data: supervisorData } = await supabase.from('supervisors').select('*').eq('id', session.user.id).single()
    setSupervisor(supervisorData)
    loadSessions(session.user.id)
    loadForms(session.user.id)
    loadStudents(session.user.id)
    loadGeneratedForms(session.user.id)
    setLoading(false)
  }

  const loadSessions = async (userId: string) => {
    const { data } = await supabase.from('sessions').select('*').eq('supervisor_id', userId).order('created_at', { ascending: false })
    if (data) setSessions(data)
  }

  const loadForms = async (userId: string) => {
    const { data } = await supabase.from('form_templates').select('*').eq('supervisor_id', userId).order('created_at', { ascending: false })
    if (data) setForms(data)
  }

  const loadStudents = async (userId: string) => {
    const { data } = await supabase.from('students').select('*').eq('supervisor_id', userId).order('created_at', { ascending: false })
    if (data) setStudents(data)
  }

  const loadGeneratedForms = async (userId: string) => {
    const { data } = await supabase
      .from('generated_forms')
      .select('*, sessions!inner(supervisor_id, name)')
      .eq('sessions.supervisor_id', userId)
      .order('created_at', { ascending: false })
    if (data) setGeneratedForms(data)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/auth'
  }

  if (loading) {
    return (
      <div style={{minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#F9F7F4', fontFamily:'system-ui'}}>
        <div style={{color:'#57534E', fontSize:'14px'}}>Loading...</div>
      </div>
    )
  }

  return (
    <div style={{display:'flex', minHeight:'100vh', fontFamily:'system-ui, sans-serif', background:'#F9F7F4', color:'#1C1917'}}>
      <aside style={{width:'230px', background:'white', borderRight:'1px solid #E8E3DB', display:'flex', flexDirection:'column', flexShrink:0, position:'fixed', top:0, left:0, bottom:0}}>
        <div style={{padding:'22px 20px 18px', borderBottom:'1px solid #E8E3DB'}}>
          <div style={{fontSize:'18px', fontWeight:'600', color:'#1C1917', display:'flex', alignItems:'center', gap:'8px'}}>
            <div style={{width:'8px', height:'8px', borderRadius:'50%', background:'#2D5A42'}}></div>
            Supervisio
          </div>
          <div style={{fontSize:'11px', color:'#78716C', marginTop:'3px'}}>Clinical supervision, simplified</div>
        </div>
        <nav style={{flex:1, padding:'12px 10px', overflowY:'auto'}}>
          <div style={{fontSize:'10px', textTransform:'uppercase', letterSpacing:'0.8px', color:'#78716C', padding:'8px 10px 4px', fontWeight:'600'}}>Workspace</div>
          {[
            {id:'dashboard', label:'Overview'},
            {id:'sessions', label:'Sessions'},
            {id:'reports', label:'Ready to review'},
            {id:'forms', label:'Form templates'},
          ].map(item => (
            <button key={item.id} onClick={() => setPage(item.id)} style={{display:'flex', alignItems:'center', width:'100%', padding:'8px 10px', borderRadius:'7px', border:'none', background: page===item.id ? '#EBF3EE' : 'none', color: page===item.id ? '#1C5C3E' : '#44403C', fontSize:'13.5px', fontWeight: page===item.id ? '500' : '400', cursor:'pointer', marginBottom:'1px', textAlign:'left'}}>
              {item.label}
              {item.id === 'reports' && generatedForms.filter(f => f.status === 'pending').length > 0 && (
                <span style={{marginLeft:'auto', background:'#7D2A48', color:'white', fontSize:'10px', padding:'1px 6px', borderRadius:'10px', fontWeight:'600'}}>
                  {generatedForms.filter(f => f.status === 'pending').length}
                </span>
              )}
            </button>
          ))}
          <div style={{fontSize:'10px', textTransform:'uppercase', letterSpacing:'0.8px', color:'#78716C', padding:'12px 10px 4px', fontWeight:'600'}}>Students</div>
          <button onClick={() => setPage('students')} style={{display:'flex', alignItems:'center', width:'100%', padding:'8px 10px', borderRadius:'7px', border:'none', background: page==='students' ? '#EBF3EE' : 'none', color: page==='students' ? '#1C5C3E' : '#44403C', fontSize:'13.5px', fontWeight: page==='students' ? '500' : '400', cursor:'pointer', marginBottom:'1px', textAlign:'left'}}>
            All students
          </button>
          {students.map(student => (
            <button key={student.id} onClick={() => setPage(`student-${student.id}`)} style={{display:'flex', alignItems:'center', width:'100%', padding:'7px 10px 7px 22px', borderRadius:'7px', border:'none', background: page===`student-${student.id}` ? '#EBF3EE' : 'none', color: page===`student-${student.id}` ? '#1C5C3E' : '#57534E', fontSize:'12.5px', cursor:'pointer', marginBottom:'1px', textAlign:'left'}}>
              {student.name}
            </button>
          ))}
          <div style={{fontSize:'10px', textTransform:'uppercase', letterSpacing:'0.8px', color:'#78716C', padding:'12px 10px 4px', fontWeight:'600'}}>Account</div>
          <button onClick={() => setPage('settings')} style={{display:'flex', alignItems:'center', width:'100%', padding:'8px 10px', borderRadius:'7px', border:'none', background: page==='settings' ? '#EBF3EE' : 'none', color: page==='settings' ? '#1C5C3E' : '#44403C', fontSize:'13.5px', cursor:'pointer', marginBottom:'1px', textAlign:'left'}}>
            Settings
          </button>
        </nav>
        <div style={{padding:'14px 10px', borderTop:'1px solid #E8E3DB'}}>
          <div style={{display:'flex', alignItems:'center', gap:'10px', padding:'8px 10px'}}>
            <div style={{width:'34px', height:'34px', borderRadius:'50%', background:'#EBF3EE', color:'#1C5C3E', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:'600'}}>
              {supervisor?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'S'}
            </div>
            <div>
              <div style={{fontSize:'13px', fontWeight:'500', color:'#1C1917'}}>{supervisor?.full_name || 'Supervisor'}</div>
              <div style={{fontSize:'11px', color:'#78716C', cursor:'pointer'}} onClick={handleSignOut}>Sign out</div>
            </div>
          </div>
        </div>
      </aside>

      <main style={{marginLeft:'230px', flex:1, padding:'32px 36px'}}>
        {page === 'dashboard' && <Dashboard sessions={sessions} students={students} generatedForms={generatedForms} setPage={setPage} onNewSession={() => setShowNewSession(true)} supervisor={supervisor} />}
        {page === 'sessions' && <Sessions sessions={sessions} setSessions={setSessions} onNewSession={() => setShowNewSession(true)} />}
        {page === 'reports' && <Reports generatedForms={generatedForms} sessions={sessions} setGeneratedForms={setGeneratedForms} />}
        {page === 'forms' && <Forms forms={forms} setForms={setForms} onUpload={() => setShowUploadForm(true)} />}
        {page === 'students' && <StudentsPage students={students} sessions={sessions} onNewStudent={() => setShowNewStudent(true)} setPage={setPage} />}
        {page.startsWith('student-') && (
          <StudentFile
            student={students.find(s => s.id === page.replace('student-', '')) || null}
            sessions={sessions.filter(s => {
              const student = students.find(st => st.id === page.replace('student-', ''))
              return student ? s.students.includes(student.name) : false
            })}
            generatedForms={generatedForms}
          />
        )}
        {page === 'settings' && <SettingsPage />}
      </main>

      {showNewSession && (
        <NewSessionModal
          onClose={() => setShowNewSession(false)}
          onCreate={async (session) => {
            const { data: { session: authSession } } = await supabase.auth.getSession()
            if (!authSession) return
            const { data } = await supabase.from('sessions').insert({
              ...session,
              supervisor_id: authSession.user.id,
            }).select().single()
            if (data) setSessions(prev => [data, ...prev])
            setShowNewSession(false)
            setPage('sessions')
          }}
        />
      )}

      {showUploadForm && (
        <UploadFormModal
          onClose={() => setShowUploadForm(false)}
          onUpload={async (form) => {
            const { data: { session: authSession } } = await supabase.auth.getSession()
            if (!authSession) return
            const { data } = await supabase.from('form_templates').insert({
              ...form,
              supervisor_id: authSession.user.id,
            }).select().single()
            if (data) setForms(prev => [data, ...prev])
            setShowUploadForm(false)
          }}
        />
      )}

      {showNewStudent && (
        <NewStudentModal
          onClose={() => setShowNewStudent(false)}
          onCreate={async (student) => {
            const { data: { session: authSession } } = await supabase.auth.getSession()
            if (!authSession) return
            const { data } = await supabase.from('students').insert({
              ...student,
              supervisor_id: authSession.user.id,
            }).select().single()
            if (data) setStudents(prev => [data, ...prev])
            setShowNewStudent(false)
          }}
        />
      )}
    </div>
  )
}

function Dashboard({ sessions, students, generatedForms, setPage, onNewSession, supervisor }: { sessions: Session[], students: Student[], generatedForms: GeneratedForm[], setPage: (p: string) => void, onNewSession: () => void, supervisor: Supervisor | null }) {
  const firstName = supervisor?.full_name?.split(' ')[0] || 'there'
  const upcoming = sessions.filter(s => s.status === 'scheduled').slice(0, 3)
  const pendingForms = generatedForms.filter(f => f.status === 'pending')
  const today = new Date().toISOString().split('T')[0]
  const todaySessions = sessions.filter(s => s.date === today)
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'24px'}}>
        <div>
          <div style={{fontSize:'12px', color:'#78716C', marginBottom:'4px'}}>{new Date().toLocaleDateString('en-US', {weekday:'long', month:'long', day:'numeric', year:'numeric'})}</div>
          <div style={{fontSize:'28px', fontWeight:'600', color:'#1C1917'}}>{greeting}, {firstName}</div>
          <div style={{fontSize:'14px', color:'#57534E', marginTop:'4px'}}>
            {todaySessions.length > 0 ? `${todaySessions.length} session${todaySessions.length > 1 ? 's' : ''} today` : 'No sessions today'}
            {pendingForms.length > 0 ? ` · ${pendingForms.length} form${pendingForms.length > 1 ? 's' : ''} awaiting review` : ''}
          </div>
        </div>
        <button onClick={onNewSession} style={{background:'#2D5A42', color:'white', border:'none', borderRadius:'8px', padding:'9px 18px', fontSize:'13.5px', fontWeight:'500', cursor:'pointer'}}>+ New session</button>
      </div>

      {pendingForms.length > 0 && (
        <div onClick={() => setPage('reports')} style={{background:'#FDF2F6', border:'1px solid #F4C0D1', borderRadius:'10px', padding:'12px 16px', marginBottom:'20px', fontSize:'13px', color:'#7D2A48', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between', fontWeight:'500'}}>
          <span>📋 {pendingForms.length} form{pendingForms.length > 1 ? 's' : ''} ready for your review and signature</span>
          <span>→</span>
        </div>
      )}

      {sessions.filter(s => s.status === 'processing').length > 0 && (
        <div style={{background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:'10px', padding:'12px 16px', marginBottom:'20px', fontSize:'13px', color:'#1E40AF', display:'flex', alignItems:'center', gap:'10px'}}>
          <div style={{width:'8px', height:'8px', borderRadius:'50%', background:'#3B82F6', flexShrink:0}}></div>
          {sessions.filter(s => s.status === 'processing').length} recording{sessions.filter(s => s.status === 'processing').length > 1 ? 's' : ''} being transcribed — forms will appear automatically when ready
        </div>
      )}

      <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'12px', marginBottom:'28px'}}>
        {[
          {label:'Total students', value: students.length.toString()},
          {label:'Total sessions', value: sessions.length.toString()},
          {label:'Hours supervised', value: sessions.filter(s => s.status === 'complete').length.toString()},
          {label:'Forms pending', value: pendingForms.length.toString()},
        ].map(s => (
          <div key={s.label} style={{background:'white', border:'1px solid #E8E3DB', borderRadius:'10px', padding:'16px 18px'}}>
            <div style={{fontSize:'11.5px', textTransform:'uppercase', letterSpacing:'0.5px', color:'#78716C', marginBottom:'8px', fontWeight:'500'}}>{s.label}</div>
            <div style={{fontSize:'30px', fontWeight:'600', color:'#1C1917', lineHeight:1}}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1.3fr 0.7fr', gap:'20px'}}>
        <div>
          <div style={{fontSize:'14px', fontWeight:'600', color:'#1C1917', marginBottom:'12px'}}>Student progress</div>
          {students.length === 0 ? (
            <div style={{background:'white', border:'1px solid #E8E3DB', borderRadius:'10px', padding:'28px', textAlign:'center'}}>
              <div style={{fontSize:'13px', color:'#78716C'}}>No students yet —</div>
              <span onClick={() => setPage('students')} style={{fontSize:'13px', color:'#2D5A42', cursor:'pointer', fontWeight:'500'}}>add your first student</span>
            </div>
          ) : (
            <div style={{background:'white', border:'1px solid #E8E3DB', borderRadius:'10px', padding:'20px 22px'}}>
              {students.map((student, i) => {
                const studentSessions = sessions.filter(s => s.students.includes(student.name) && s.status === 'complete')
                const hours = studentSessions.length
                const percent = Math.round(Math.min((hours / 30) * 100, 100))
                return (
                  <div key={student.id} style={{marginBottom: i < students.length - 1 ? '18px' : '0'}}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'6px'}}>
                      <div style={{display:'flex', alignItems:'center', gap:'9px'}}>
                        <div style={{width:'28px', height:'28px', borderRadius:'50%', background:'#EBF3EE', color:'#1C5C3E', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:'600'}}>
                          {student.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </div>
                        <span style={{fontSize:'13.5px', fontWeight:'500', cursor:'pointer', color:'#1C1917'}} onClick={() => setPage(`student-${student.id}`)}>{student.name}</span>
                      </div>
                      <span style={{fontSize:'12px', color:'#57534E', fontWeight:'500'}}>{hours} / 30 hrs</span>
                    </div>
                    <div style={{height:'6px', background:'#F2EFE9', borderRadius:'3px', overflow:'hidden'}}>
                      <div style={{height:'100%', width:`${percent}%`, background: percent >= 80 ? '#2D5A42' : percent >= 50 ? '#5A9E7A' : '#D97706', borderRadius:'3px'}}></div>
                    </div>
                    <div style={{fontSize:'11.5px', color:'#78716C', marginTop:'3px'}}>{student.program}</div>
                    {i < students.length - 1 && <div style={{height:'1px', background:'#F2EFE9', margin:'16px 0 0'}}></div>}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div>
          <div style={{fontSize:'14px', fontWeight:'600', color:'#1C1917', marginBottom:'12px'}}>Upcoming sessions</div>
          {upcoming.length === 0 ? (
            <div style={{background:'white', border:'1px solid #E8E3DB', borderRadius:'10px', padding:'28px', textAlign:'center'}}>
              <div style={{fontSize:'13px', color:'#78716C'}}>No upcoming sessions</div>
              <span onClick={onNewSession} style={{fontSize:'13px', color:'#2D5A42', cursor:'pointer', fontWeight:'500', display:'block', marginTop:'4px'}}>schedule one</span>
            </div>
          ) : (
            upcoming.map(s => (
              <div key={s.id} style={{background:'white', border:'1px solid #E8E3DB', borderRadius:'10px', padding:'14px 16px', marginBottom:'8px'}}>
                <div style={{fontSize:'13.5px', fontWeight:'500', color:'#1C1917', marginBottom:'3px'}}>{s.name}</div>
                <div style={{fontSize:'12px', color:'#57534E'}}>{s.date} · {s.time}</div>
                <div style={{fontSize:'12px', color:'#78716C', marginTop:'2px'}}>{s.students.join(', ')}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function Sessions({ sessions, setSessions, onNewSession }: { sessions: Session[], setSessions: (s: Session[]) => void, onNewSession: () => void }) {
  const [uploadingFor, setUploadingFor] = useState<string | null>(null)
  const [recordingUrl, setRecordingUrl] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [processing, setProcessing] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this session?')) return
    const { error } = await supabase.from('sessions').delete().eq('id', id)
    if (!error) setSessions(sessions.filter(s => s.id !== id))
  }

  const handleUploadRecording = async (sessionId: string) => {
    if (!recordingUrl && !selectedFile) {
      alert('Please enter a recording URL or select a file')
      return
    }
    setProcessing(sessionId)

    try {
      const formData = new FormData()
      formData.append('sessionId', sessionId)
      if (selectedFile) {
        formData.append('file', selectedFile)
      } else {
        formData.append('recordingUrl', recordingUrl)
      }

      const response = await fetch('/api/process-recording', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        setSessions(sessions.map(s => s.id === sessionId ? { ...s, status: 'processing' } : s))
        setUploadingFor(null)
        setRecordingUrl('')
        setSelectedFile(null)
        alert('Recording submitted! Your forms will be ready within 15-20 minutes.')
      } else {
        alert('Submission failed: ' + (data.error || 'Unknown error'))
      }
    } catch {
      alert('Submission failed. Please try again.')
    }

    setProcessing(null)
  }

  const statusConfig: Record<string, { bg: string, color: string, label: string }> = {
    scheduled: { bg: '#FEF3C7', color: '#92400E', label: 'Scheduled' },
    processing: { bg: '#EFF6FF', color: '#1E40AF', label: 'Processing' },
    complete: { bg: '#EBF3EE', color: '#1C5C3E', label: 'Complete' },
    live: { bg: '#EBF3EE', color: '#1C5C3E', label: 'Live' },
    failed: { bg: '#FEF2F2', color: '#991B1B', label: 'Failed' },
  }

  const indicatorConfig: Record<string, string> = {
    scheduled: '#D97706',
    processing: '#3B82F6',
    complete: '#2D5A42',
    live: '#5A9E7A',
    failed: '#EF4444',
  }

  return (
    <div>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'24px'}}>
        <div>
          <div style={{fontSize:'12px', color:'#78716C', marginBottom:'4px', textTransform:'uppercase', letterSpacing:'0.6px'}}>All sessions</div>
          <div style={{fontSize:'26px', fontWeight:'600', color:'#1C1917'}}>Sessions</div>
        </div>
        <button onClick={onNewSession} style={{background:'#2D5A42', color:'white', border:'none', borderRadius:'8px', padding:'9px 18px', fontSize:'13.5px', fontWeight:'500', cursor:'pointer'}}>+ New session</button>
      </div>
      {sessions.length === 0 ? (
        <EmptyState message="No sessions yet" sub="Sessions you create will appear here" action="Create your first session" onAction={onNewSession} />
      ) : (
        sessions.map(s => (
          <div key={s.id}>
            <div style={{background:'white', border:'1px solid #E8E3DB', borderRadius:'10px', padding:'14px 18px', display:'flex', alignItems:'center', gap:'14px', marginBottom: uploadingFor === s.id ? '0' : '10px', borderBottomLeftRadius: uploadingFor === s.id ? '0' : '10px', borderBottomRightRadius: uploadingFor === s.id ? '0' : '10px'}}>
              <div style={{width:'3px', height:'44px', borderRadius:'2px', background: indicatorConfig[s.status] || '#D97706', flexShrink:0}}></div>
              <div style={{flex:1}}>
                <div style={{fontSize:'14px', fontWeight:'500', color:'#1C1917'}}>{s.name}</div>
                <div style={{fontSize:'12.5px', color:'#57534E', marginTop:'2px'}}>{s.date} · {s.time} · {s.students.join(', ')}</div>
                {s.status === 'processing' && (
                  <div style={{fontSize:'11.5px', color:'#1E40AF', marginTop:'3px'}}>Transcribing recording — forms will appear in Ready to review when done</div>
                )}
                {s.status === 'failed' && (
                  <div style={{fontSize:'11.5px', color:'#991B1B', marginTop:'3px'}}>Processing failed — please try uploading the recording again</div>
                )}
              </div>
              <span style={{fontSize:'11.5px', padding:'4px 10px', borderRadius:'20px', fontWeight:'500', background: statusConfig[s.status]?.bg || '#FEF3C7', color: statusConfig[s.status]?.color || '#92400E'}}>
                {statusConfig[s.status]?.label || s.status}
              </span>
              {(s.status === 'scheduled' || s.status === 'failed') && (
                <button onClick={() => setUploadingFor(uploadingFor === s.id ? null : s.id)} style={{background:'#EBF3EE', border:'none', borderRadius:'7px', padding:'6px 12px', fontSize:'12px', color:'#1C5C3E', cursor:'pointer', fontWeight:'500', whiteSpace:'nowrap'}}>
                  + Add recording
                </button>
              )}
              <button onClick={() => handleDelete(s.id)} style={{background:'none', border:'none', cursor:'pointer', color:'#A8A29E', padding:'4px', borderRadius:'4px', flexShrink:0}} title="Delete session">
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 16 16">
                  <polyline points="2,4 14,4"/>
                  <path d="M5 4V2h6v2"/>
                  <path d="M3 4l1 10h8l1-10"/>
                </svg>
              </button>
            </div>
            {uploadingFor === s.id && (
              <div style={{background:'#F9F7F4', border:'1px solid #E8E3DB', borderTop:'none', borderBottomLeftRadius:'10px', borderBottomRightRadius:'10px', padding:'16px 18px', marginBottom:'10px'}}>
                <div style={{fontSize:'13px', fontWeight:'500', color:'#1C1917', marginBottom:'10px'}}>Add session recording</div>
                <div style={{fontSize:'12px', color:'#78716C', marginBottom:'8px'}}>Option 1 — Upload a file directly from your computer:</div>
                <div
                  style={{border:'1.5px dashed #D4CFC8', borderRadius:'7px', padding:'16px', textAlign:'center', background:'white', cursor:'pointer', marginBottom:'12px'}}
                  onClick={() => document.getElementById(`file-input-${s.id}`)?.click()}
                >
                  <div style={{fontSize:'13px', color:'#57534E', fontWeight:'500'}}>
                    {selectedFile ? `✓ ${selectedFile.name}` : 'Click to select recording file'}
                  </div>
                  <div style={{fontSize:'11.5px', color:'#78716C', marginTop:'2px'}}>MP4, MOV, M4A, MP3, or WAV</div>
                  <input
                    id={`file-input-${s.id}`}
                    type="file"
                    accept=".mp4,.mov,.m4a,.mp3,.wav"
                    style={{display:'none'}}
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (file) { setSelectedFile(file); setRecordingUrl('') }
                    }}
                  />
                </div>
                <div style={{fontSize:'12px', color:'#78716C', marginBottom:'8px'}}>Option 2 — Paste a direct recording link:</div>
                <div style={{display:'flex', gap:'8px', marginBottom:'12px'}}>
                  <input
                    value={recordingUrl}
                    onChange={e => { setRecordingUrl(e.target.value); setSelectedFile(null) }}
                    placeholder="Paste direct audio/video URL..."
                    style={{flex:1, padding:'8px 12px', border:'1px solid #D4CFC8', borderRadius:'7px', fontSize:'13px', fontFamily:'system-ui', outline:'none', color:'#1C1917'}}
                  />
                </div>
                <button
                  onClick={() => handleUploadRecording(s.id)}
                  disabled={processing === s.id}
                  style={{background:'#2D5A42', color:'white', border:'none', borderRadius:'7px', padding:'9px 18px', fontSize:'13px', fontWeight:'500', cursor:'pointer', opacity: processing === s.id ? 0.7 : 1}}
                >
                  {processing === s.id ? 'Submitting...' : 'Submit recording'}
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}

function Reports({ generatedForms, sessions, setGeneratedForms }: { generatedForms: GeneratedForm[], sessions: Session[], setGeneratedForms: (f: GeneratedForm[]) => void }) {
  const [selectedForm, setSelectedForm] = useState<GeneratedForm | null>(null)
  const [downloading, setDownloading] = useState(false)
  const pending = generatedForms.filter(f => f.status === 'pending')
  const signed = generatedForms.filter(f => f.status === 'signed')

  const handleSign = async (formId: string) => {
    await supabase.from('generated_forms').update({ status: 'signed' }).eq('id', formId)
    setGeneratedForms(generatedForms.map(f => f.id === formId ? { ...f, status: 'signed' } : f))
  }

  const handleDownload = async (form: GeneratedForm) => {
    setDownloading(true)
    try {
      const sessionName = sessions.find(s => s.id === form.session_id)?.name || 'Session'
      const response = await fetch('/api/export-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: form.student_name,
          sessionName,
          formData: form.form_data,
        }),
      })

      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${form.student_name}-supervision-form.docx`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Download failed. Please try again.')
    }
    setDownloading(false)
  }

  const getSessionName = (sessionId: string) => {
    return sessions.find(s => s.id === sessionId)?.name || 'Session'
  }

  if (selectedForm) {
    return (
      <div>
        <button onClick={() => setSelectedForm(null)} style={{background:'none', border:'none', cursor:'pointer', color:'#57534E', fontSize:'13.5px', marginBottom:'20px', display:'flex', alignItems:'center', gap:'6px', padding:0}}>
          ← Back to forms
        </button>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'24px'}}>
          <div>
            <div style={{fontSize:'12px', color:'#78716C', marginBottom:'4px', textTransform:'uppercase', letterSpacing:'0.6px'}}>{getSessionName(selectedForm.session_id)}</div>
            <div style={{fontSize:'26px', fontWeight:'600', color:'#1C1917'}}>{selectedForm.student_name}</div>
            <div style={{fontSize:'13.5px', color:'#57534E', marginTop:'3px'}}>Auto-filled supervision form — review, download or sign off</div>
          </div>
          <div style={{display:'flex', gap:'10px'}}>
            <button
              onClick={() => handleDownload(selectedForm)}
              disabled={downloading}
              style={{background:'white', color:'#2D5A42', border:'1px solid #2D5A42', borderRadius:'8px', padding:'9px 18px', fontSize:'13.5px', fontWeight:'500', cursor:'pointer', opacity: downloading ? 0.7 : 1}}
            >
              {downloading ? 'Preparing...' : '↓ Download Word doc'}
            </button>
            {selectedForm.status === 'pending' && (
              <button onClick={() => handleSign(selectedForm.id)} style={{background:'#2D5A42', color:'white', border:'none', borderRadius:'8px', padding:'9px 18px', fontSize:'13.5px', fontWeight:'500', cursor:'pointer'}}>
                ✓ Mark as reviewed
              </button>
            )}
          </div>
        </div>
        <div style={{background:'white', border:'1px solid #E8E3DB', borderRadius:'10px', padding:'24px 26px'}}>
          {Object.entries(selectedForm.form_data).map(([key, value], i, arr) => (
            <div key={key} style={{marginBottom: i < arr.length - 1 ? '20px' : '0', paddingBottom: i < arr.length - 1 ? '20px' : '0', borderBottom: i < arr.length - 1 ? '1px solid #F2EFE9' : 'none'}}>
              <div style={{fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.6px', color:'#78716C', fontWeight:'600', marginBottom:'6px'}}>{key}</div>
              <div style={{fontSize:'14px', color:'#1C1917', lineHeight:'1.7'}}>{value}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{fontSize:'12px', color:'#78716C', marginBottom:'4px', textTransform:'uppercase', letterSpacing:'0.6px'}}>Documents</div>
      <div style={{fontSize:'26px', fontWeight:'600', color:'#1C1917', marginBottom:'6px'}}>Ready to review</div>
      <div style={{fontSize:'13.5px', color:'#57534E', marginBottom:'20px'}}>Auto-filled forms — review on screen or download as a Word document</div>

      {pending.length === 0 && signed.length === 0 ? (
        <EmptyState message="No forms yet" sub="Forms will appear here after session recordings are processed" />
      ) : (
        <>
          {pending.length > 0 && (
            <>
              <div style={{fontSize:'13px', fontWeight:'600', color:'#1C1917', marginBottom:'10px'}}>Awaiting review</div>
              {pending.map(f => (
                <div key={f.id} style={{background:'white', border:'1px solid #E8E3DB', borderRadius:'10px', padding:'14px 18px', display:'flex', alignItems:'center', gap:'14px', marginBottom:'10px'}}>
                  <div style={{width:'38px', height:'38px', borderRadius:'8px', background:'#FDF2F6', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
                    <svg width="16" height="16" fill="none" stroke="#7D2A48" strokeWidth="1.5" viewBox="0 0 16 16"><path d="M4 2h8v12H4z"/><line x1="6.5" y1="6" x2="9.5" y2="6"/><line x1="6.5" y1="9" x2="9.5" y2="9"/></svg>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:'14px', fontWeight:'500', color:'#1C1917'}}>{f.student_name}</div>
                    <div style={{fontSize:'12.5px', color:'#57534E', marginTop:'2px'}}>{getSessionName(f.session_id)}</div>
                  </div>
                  <button onClick={() => handleDownload(f)} style={{background:'none', border:'1px solid #E8E3DB', borderRadius:'7px', padding:'6px 12px', fontSize:'12px', color:'#57534E', cursor:'pointer', fontWeight:'500', whiteSpace:'nowrap'}}>
                    ↓ Download
                  </button>
                  <button onClick={() => setSelectedForm(f)} style={{background:'#FDF2F6', border:'none', borderRadius:'7px', padding:'6px 12px', fontSize:'12px', color:'#7D2A48', cursor:'pointer', fontWeight:'500', whiteSpace:'nowrap'}}>
                    Review
                  </button>
                </div>
              ))}
            </>
          )}

          {signed.length > 0 && (
            <>
              <div style={{fontSize:'13px', fontWeight:'600', color:'#1C1917', margin:'20px 0 10px'}}>Reviewed</div>
              {signed.map(f => (
                <div key={f.id} style={{background:'white', border:'1px solid #E8E3DB', borderRadius:'10px', padding:'14px 18px', display:'flex', alignItems:'center', gap:'14px', marginBottom:'10px'}}>
                  <div style={{width:'38px', height:'38px', borderRadius:'8px', background:'#EBF3EE', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
                    <svg width="16" height="16" fill="none" stroke="#1C5C3E" strokeWidth="1.5" viewBox="0 0 16 16"><polyline points="3,8 6.5,11.5 13,5"/></svg>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:'14px', fontWeight:'500', color:'#1C1917'}}>{f.student_name}</div>
                    <div style={{fontSize:'12.5px', color:'#57534E', marginTop:'2px'}}>{getSessionName(f.session_id)}</div>
                  </div>
                  <button onClick={() => handleDownload(f)} style={{background:'none', border:'1px solid #E8E3DB', borderRadius:'7px', padding:'6px 12px', fontSize:'12px', color:'#57534E', cursor:'pointer', fontWeight:'500', whiteSpace:'nowrap'}}>
                    ↓ Download
                  </button>
                  <button onClick={() => setSelectedForm(f)} style={{background:'none', border:'1px solid #E8E3DB', borderRadius:'7px', padding:'6px 12px', fontSize:'12px', color:'#57534E', cursor:'pointer', fontWeight:'500', whiteSpace:'nowrap'}}>
                    View
                  </button>
                </div>
              ))}
            </>
          )}
        </>
      )}
    </div>
  )
}

function Forms({ forms, setForms, onUpload }: { forms: FormTemplate[], setForms: (f: FormTemplate[]) => void, onUpload: () => void }) {
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this form template?')) return
    await supabase.from('form_templates').delete().eq('id', id)
    setForms(forms.filter(f => f.id !== id))
  }

  return (
    <div>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'20px'}}>
        <div>
          <div style={{fontSize:'12px', color:'#78716C', marginBottom:'4px', textTransform:'uppercase', letterSpacing:'0.6px'}}>Templates</div>
          <div style={{fontSize:'26px', fontWeight:'600', color:'#1C1917'}}>Form templates</div>
          <div style={{fontSize:'13.5px', color:'#57534E', marginTop:'3px'}}>Upload your supervision form — Supervisio reads the fields and fills them automatically</div>
        </div>
        <button onClick={onUpload} style={{background:'#2D5A42', color:'white', border:'none', borderRadius:'8px', padding:'9px 18px', fontSize:'13.5px', fontWeight:'500', cursor:'pointer'}}>+ Upload form</button>
      </div>
      {forms.length === 0 ? (
        <EmptyState message="No form templates yet" sub="Upload your supervision form and Supervisio will learn what to fill in" action="Upload a form" onAction={onUpload} />
      ) : (
        <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'14px'}}>
          {forms.map(f => (
            <div key={f.id} style={{background:'white', border:'1px solid #E8E3DB', borderRadius:'10px', padding:'18px 20px'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'12px'}}>
                <div style={{width:'36px', height:'36px', borderRadius:'8px', background:'#EBF3EE', display:'flex', alignItems:'center', justifyContent:'center'}}>
                  <svg width="16" height="16" fill="none" stroke="#1C5C3E" strokeWidth="1.5" viewBox="0 0 16 16"><path d="M9 2H4a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V6L9 2z"/><polyline points="9,2 9,6 13,6"/></svg>
                </div>
                <button onClick={() => handleDelete(f.id)} style={{background:'none', border:'none', cursor:'pointer', color:'#A8A29E', padding:'2px'}}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 16 16"><polyline points="2,4 14,4"/><path d="M5 4V2h6v2"/><path d="M3 4l1 10h8l1-10"/></svg>
                </button>
              </div>
              <div style={{fontSize:'14px', fontWeight:'500', color:'#1C1917', marginBottom:'3px'}}>{f.name}</div>
              <div style={{fontSize:'12px', color:'#78716C'}}>{f.fields.length} fields detected</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StudentsPage({ students, sessions, onNewStudent, setPage }: { students: Student[], sessions: Session[], onNewStudent: () => void, setPage: (p: string) => void }) {
  return (
    <div>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'24px'}}>
        <div>
          <div style={{fontSize:'12px', color:'#78716C', marginBottom:'4px', textTransform:'uppercase', letterSpacing:'0.6px'}}>All students</div>
          <div style={{fontSize:'26px', fontWeight:'600', color:'#1C1917'}}>Students</div>
        </div>
        <button onClick={onNewStudent} style={{background:'#2D5A42', color:'white', border:'none', borderRadius:'8px', padding:'9px 18px', fontSize:'13.5px', fontWeight:'500', cursor:'pointer'}}>+ Add student</button>
      </div>
      {students.length === 0 ? (
        <EmptyState message="No students yet" sub="Add your first student to get started" action="Add student" onAction={onNewStudent} />
      ) : (
        <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'14px'}}>
          {students.map(student => {
            const studentSessions = sessions.filter(s => s.students.includes(student.name))
            const completedSessions = studentSessions.filter(s => s.status === 'complete')
            const hours = completedSessions.length
            const percent = Math.round(Math.min((hours / 30) * 100, 100))
            const nextSession = studentSessions.find(s => s.status === 'scheduled')
            return (
              <div key={student.id} onClick={() => setPage(`student-${student.id}`)} style={{background:'white', border:'1px solid #E8E3DB', borderRadius:'10px', padding:'18px 20px', cursor:'pointer'}}>
                <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px'}}>
                  <div style={{width:'40px', height:'40px', borderRadius:'50%', background:'#EBF3EE', color:'#1C5C3E', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:'600'}}>
                    {student.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </div>
                  <div>
                    <div style={{fontSize:'14px', fontWeight:'500', color:'#1C1917'}}>{student.name}</div>
                    <div style={{fontSize:'12px', color:'#78716C'}}>{student.program}</div>
                  </div>
                </div>
                <div style={{marginBottom:'8px'}}>
                  <div style={{display:'flex', justifyContent:'space-between', marginBottom:'5px'}}>
                    <span style={{fontSize:'12px', color:'#57534E'}}>Supervision hours</span>
                    <span style={{fontSize:'12px', fontWeight:'500', color:'#1C1917'}}>{hours} / 30</span>
                  </div>
                  <div style={{height:'5px', background:'#F2EFE9', borderRadius:'3px', overflow:'hidden'}}>
                    <div style={{height:'100%', width:`${percent}%`, background: percent >= 80 ? '#2D5A42' : percent >= 50 ? '#5A9E7A' : '#D97706', borderRadius:'3px'}}></div>
                  </div>
                </div>
                <div style={{fontSize:'12px', color:'#78716C'}}>
                  {nextSession ? `Next: ${nextSession.date} · ${nextSession.time}` : 'No upcoming sessions'}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function StudentFile({ student, sessions, generatedForms }: { student: Student | null, sessions: Session[], generatedForms: GeneratedForm[] }) {
  if (!student) return <EmptyState message="Student not found" sub="This student may have been removed" />
  const completedSessions = sessions.filter(s => s.status === 'complete')
  const hours = completedSessions.length
  const percent = Math.round(Math.min((hours / 30) * 100, 100))
  const studentForms = generatedForms.filter(f => f.student_name === student.name)

  return (
    <div>
      <div style={{display:'flex', alignItems:'center', gap:'16px', marginBottom:'28px'}}>
        <div style={{width:'52px', height:'52px', borderRadius:'50%', background:'#EBF3EE', color:'#1C5C3E', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', fontWeight:'600'}}>
          {student.name.split(' ').map(n => n[0]).join('').toUpperCase()}
        </div>
        <div>
          <div style={{fontSize:'26px', fontWeight:'600', color:'#1C1917'}}>{student.name}</div>
          <div style={{fontSize:'13.5px', color:'#57534E'}}>{student.program}</div>
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'12px', marginBottom:'24px'}}>
        {[
          {label:'Hours completed', value:`${hours}`},
          {label:'Hours remaining', value:`${Math.max(30 - hours, 0)}`},
          {label:'Sessions total', value:`${sessions.length}`},
          {label:'Forms generated', value:`${studentForms.length}`},
        ].map(s => (
          <div key={s.label} style={{background:'white', border:'1px solid #E8E3DB', borderRadius:'10px', padding:'16px 18px'}}>
            <div style={{fontSize:'11.5px', textTransform:'uppercase', letterSpacing:'0.5px', color:'#78716C', marginBottom:'8px', fontWeight:'500'}}>{s.label}</div>
            <div style={{fontSize:'30px', fontWeight:'600', color:'#1C1917', lineHeight:1}}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{background:'white', border:'1px solid #E8E3DB', borderRadius:'10px', padding:'20px 22px', marginBottom:'24px'}}>
        <div style={{display:'flex', justifyContent:'space-between', marginBottom:'8px'}}>
          <span style={{fontSize:'13.5px', fontWeight:'500', color:'#1C1917'}}>Progress toward 30 hours</span>
          <span style={{fontSize:'13.5px', color:'#57534E', fontWeight:'500'}}>{percent}%</span>
        </div>
        <div style={{height:'8px', background:'#F2EFE9', borderRadius:'4px', overflow:'hidden'}}>
          <div style={{height:'100%', width:`${percent}%`, background: percent >= 80 ? '#2D5A42' : percent >= 50 ? '#5A9E7A' : '#D97706', borderRadius:'4px'}}></div>
        </div>
        <div style={{fontSize:'12.5px', color:'#78716C', marginTop:'6px'}}>{hours} of 30 hours completed · {Math.max(30 - hours, 0)} hours remaining</div>
      </div>

      <div style={{fontSize:'14px', fontWeight:'600', color:'#1C1917', marginBottom:'12px'}}>Session history</div>
      {sessions.length === 0 ? (
        <EmptyState message="No sessions yet" sub="Sessions with this student will appear here" />
      ) : (
        sessions.map(s => (
          <div key={s.id} style={{background:'white', border:'1px solid #E8E3DB', borderRadius:'10px', padding:'14px 18px', display:'flex', alignItems:'center', gap:'14px', marginBottom:'10px'}}>
            <div style={{width:'3px', height:'44px', borderRadius:'2px', background: s.status === 'complete' ? '#2D5A42' : '#D97706', flexShrink:0}}></div>
            <div style={{flex:1}}>
              <div style={{fontSize:'14px', fontWeight:'500', color:'#1C1917'}}>{s.name}</div>
              <div style={{fontSize:'12.5px', color:'#57534E', marginTop:'2px'}}>{s.date} · {s.time}</div>
            </div>
            <span style={{fontSize:'12px', padding:'4px 10px', borderRadius:'20px', fontWeight:'500', background: s.status === 'complete' ? '#EBF3EE' : '#FEF3C7', color: s.status === 'complete' ? '#1C5C3E' : '#92400E'}}>
              {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
            </span>
          </div>
        ))
      )}
    </div>
  )
}

function SettingsPage() {
  const [toggles, setToggles] = useState({
    speakerDetection: true,
    autoGenerate: true,
    emailForms: false,
    reminders: true,
    formAlerts: true,
  })
  const toggle = (key: keyof typeof toggles) => setToggles(prev => ({ ...prev, [key]: !prev[key] }))

  return (
    <div>
      <div style={{fontSize:'12px', color:'#78716C', marginBottom:'4px', textTransform:'uppercase', letterSpacing:'0.6px'}}>Account</div>
      <div style={{fontSize:'26px', fontWeight:'600', color:'#1C1917', marginBottom:'20px'}}>Settings</div>
      {[
        {title:'Processing', items:[
          {key:'speakerDetection', label:'Speaker detection', desc:'Identify each person by their opening introduction'},
          {key:'autoGenerate', label:'Auto-generate forms after upload', desc:'Forms are drafted as soon as recording is processed'},
          {key:'emailForms', label:'Email draft forms for review', desc:'Receive a copy at your registered email address'},
        ]},
        {title:'Notifications', items:[
          {key:'reminders', label:'Session reminders', desc:'30 minutes before each scheduled session'},
          {key:'formAlerts', label:'Form ready alerts', desc:'Notified as soon as forms are ready to review'},
        ]},
      ].map(section => (
        <div key={section.title} style={{background:'white', border:'1px solid #E8E3DB', borderRadius:'10px', marginBottom:'14px', overflow:'hidden'}}>
          <div style={{fontSize:'11.5px', textTransform:'uppercase', letterSpacing:'0.7px', color:'#78716C', fontWeight:'600', padding:'16px 20px 12px', borderBottom:'1px solid #E8E3DB'}}>{section.title}</div>
          {section.items.map((item, i) => (
            <div key={item.key} style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom: i < section.items.length - 1 ? '1px solid #F2EFE9' : 'none'}}>
              <div>
                <div style={{fontSize:'14px', fontWeight:'500', color:'#1C1917'}}>{item.label}</div>
                <div style={{fontSize:'12.5px', color:'#78716C', marginTop:'2px'}}>{item.desc}</div>
              </div>
              <div onClick={() => toggle(item.key as keyof typeof toggles)} style={{width:'38px', height:'22px', borderRadius:'11px', background: toggles[item.key as keyof typeof toggles] ? '#2D5A42' : '#D4CFC8', position:'relative', cursor:'pointer', flexShrink:0, transition:'background 0.2s'}}>
                <div style={{width:'16px', height:'16px', background:'white', borderRadius:'50%', position:'absolute', top:'3px', right: toggles[item.key as keyof typeof toggles] ? '3px' : 'auto', left: toggles[item.key as keyof typeof toggles] ? 'auto' : '3px', transition:'all 0.2s'}}></div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

function EmptyState({ message, sub, action, onAction }: { message: string, sub: string, action?: string, onAction?: () => void }) {
  return (
    <div style={{textAlign:'center', padding:'64px 20px'}}>
      <div style={{width:'48px', height:'48px', borderRadius:'50%', border:'2px solid #E8E3DB', margin:'0 auto 16px', display:'flex', alignItems:'center', justifyContent:'center'}}>
        <div style={{width:'8px', height:'8px', borderRadius:'50%', background:'#D4CFC8'}}></div>
      </div>
      <div style={{fontSize:'15px', fontWeight:'500', color:'#44403C', marginBottom:'6px'}}>{message}</div>
      <div style={{fontSize:'13.5px', color:'#78716C', marginBottom: action ? '20px' : '0'}}>{sub}</div>
      {action && onAction && (
        <button onClick={onAction} style={{background:'#2D5A42', color:'white', border:'none', borderRadius:'8px', padding:'9px 20px', fontSize:'13.5px', fontWeight:'500', cursor:'pointer'}}>{action}</button>
      )}
    </div>
  )
}

function NewSessionModal({ onClose, onCreate }: { onClose: () => void, onCreate: (session: Omit<Session, 'id'>) => void }) {
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [students, setStudents] = useState('')

  const handleCreate = () => {
    if (!name || !date || !time) { alert('Please fill in session name, date and time'); return }
    onCreate({ name, date, time, zoom_link: '', recording_url: '', transcript_id: '', students: students.split(',').map(s => s.trim()).filter(Boolean), status: 'scheduled' })
    onClose()
  }

  return (
    <div style={{position:'fixed', inset:0, background:'rgba(28,25,23,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100}} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{background:'white', borderRadius:'14px', padding:'28px 30px', width:'460px', maxWidth:'95vw'}}>
        <div style={{fontSize:'20px', fontWeight:'600', color:'#1C1917', marginBottom:'4px'}}>New supervision session</div>
        <div style={{fontSize:'13px', color:'#78716C', marginBottom:'24px'}}>Schedule a session and add the recording afterwards</div>
        <div style={{marginBottom:'16px'}}>
          <label style={{display:'block', fontSize:'11.5px', textTransform:'uppercase', letterSpacing:'0.5px', color:'#44403C', fontWeight:'600', marginBottom:'6px'}}>Session name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Group supervision — session 1" style={{width:'100%', padding:'10px 12px', border:'1px solid #D4CFC8', borderRadius:'8px', fontSize:'14px', fontFamily:'system-ui', outline:'none', color:'#1C1917', boxSizing:'border-box'}} />
        </div>
        <div style={{marginBottom:'16px'}}>
          <label style={{display:'block', fontSize:'11.5px', textTransform:'uppercase', letterSpacing:'0.5px', color:'#44403C', fontWeight:'600', marginBottom:'6px'}}>Students (comma separated)</label>
          <input value={students} onChange={e => setStudents(e.target.value)} placeholder="e.g. Maya Adeyemi, Jordan Bassett" style={{width:'100%', padding:'10px 12px', border:'1px solid #D4CFC8', borderRadius:'8px', fontSize:'14px', fontFamily:'system-ui', outline:'none', color:'#1C1917', boxSizing:'border-box'}} />
        </div>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'16px'}}>
          <div>
            <label style={{display:'block', fontSize:'11.5px', textTransform:'uppercase', letterSpacing:'0.5px', color:'#44403C', fontWeight:'600', marginBottom:'6px'}}>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{width:'100%', padding:'10px 12px', border:'1px solid #D4CFC8', borderRadius:'8px', fontSize:'14px', fontFamily:'system-ui', outline:'none', color:'#1C1917', boxSizing:'border-box'}} />
          </div>
          <div>
            <label style={{display:'block', fontSize:'11.5px', textTransform:'uppercase', letterSpacing:'0.5px', color:'#44403C', fontWeight:'600', marginBottom:'6px'}}>Time</label>
            <input type="time" value={time} onChange={e => setTime(e.target.value)} style={{width:'100%', padding:'10px 12px', border:'1px solid #D4CFC8', borderRadius:'8px', fontSize:'14px', fontFamily:'system-ui', outline:'none', color:'#1C1917', boxSizing:'border-box'}} />
          </div>
        </div>
        <div style={{display:'flex', gap:'10px', justifyContent:'flex-end', marginTop:'20px', paddingTop:'20px', borderTop:'1px solid #F2EFE9'}}>
          <button onClick={onClose} style={{background:'none', border:'1px solid #D4CFC8', borderRadius:'8px', padding:'9px 16px', fontSize:'13.5px', cursor:'pointer', color:'#44403C'}}>Cancel</button>
          <button onClick={handleCreate} style={{background:'#2D5A42', color:'white', border:'none', borderRadius:'8px', padding:'9px 18px', fontSize:'13.5px', fontWeight:'500', cursor:'pointer'}}>Create session</button>
        </div>
      </div>
    </div>
  )
}

function NewStudentModal({ onClose, onCreate }: { onClose: () => void, onCreate: (student: Omit<Student, 'id' | 'created_at'>) => void }) {
  const [name, setName] = useState('')
  const [program, setProgram] = useState('')

  const handleCreate = () => {
    if (!name || !program) { alert('Please fill in student name and program'); return }
    onCreate({ name, program, supervisor_id: '' })
    onClose()
  }

  return (
    <div style={{position:'fixed', inset:0, background:'rgba(28,25,23,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100}} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{background:'white', borderRadius:'14px', padding:'28px 30px', width:'420px', maxWidth:'95vw'}}>
        <div style={{fontSize:'20px', fontWeight:'600', color:'#1C1917', marginBottom:'4px'}}>Add student</div>
        <div style={{fontSize:'13px', color:'#78716C', marginBottom:'24px'}}>Create a file for a new student</div>
        <div style={{marginBottom:'16px'}}>
          <label style={{display:'block', fontSize:'11.5px', textTransform:'uppercase', letterSpacing:'0.5px', color:'#44403C', fontWeight:'600', marginBottom:'6px'}}>Full name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Maya Adeyemi" style={{width:'100%', padding:'10px 12px', border:'1px solid #D4CFC8', borderRadius:'8px', fontSize:'14px', fontFamily:'system-ui', outline:'none', color:'#1C1917', boxSizing:'border-box'}} />
        </div>
        <div style={{marginBottom:'16px'}}>
          <label style={{display:'block', fontSize:'11.5px', textTransform:'uppercase', letterSpacing:'0.5px', color:'#44403C', fontWeight:'600', marginBottom:'6px'}}>Program</label>
          <input value={program} onChange={e => setProgram(e.target.value)} placeholder="e.g. Yorkville MACP" style={{width:'100%', padding:'10px 12px', border:'1px solid #D4CFC8', borderRadius:'8px', fontSize:'14px', fontFamily:'system-ui', outline:'none', color:'#1C1917', boxSizing:'border-box'}} />
        </div>
        <div style={{display:'flex', gap:'10px', justifyContent:'flex-end', marginTop:'20px', paddingTop:'20px', borderTop:'1px solid #F2EFE9'}}>
          <button onClick={onClose} style={{background:'none', border:'1px solid #D4CFC8', borderRadius:'8px', padding:'9px 16px', fontSize:'13.5px', cursor:'pointer', color:'#44403C'}}>Cancel</button>
          <button onClick={handleCreate} style={{background:'#2D5A42', color:'white', border:'none', borderRadius:'8px', padding:'9px 18px', fontSize:'13.5px', fontWeight:'500', cursor:'pointer'}}>Add student</button>
        </div>
      </div>
    </div>
  )
}

function UploadFormModal({ onClose, onUpload }: { onClose: () => void, onUpload: (form: Omit<FormTemplate, 'id'>) => void }) {
  const [name, setName] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [parsing, setParsing] = useState(false)

  const handleUpload = async () => {
    if (!name) { alert('Please enter a program name'); return }
    setParsing(true)

    try {
      if (selectedFile) {
        const formData = new FormData()
        formData.append('file', selectedFile)

        const response = await fetch('/api/parse-form', {
          method: 'POST',
          body: formData,
        })

        const data = await response.json()

        if (data.fields && data.fields.length > 0) {
          onUpload({ name, fields: data.fields })
          alert(`Form parsed successfully — ${data.fields.length} fields detected`)
        } else {
          alert('Could not detect fields from the document. Using default fields.')
          onUpload({ name, fields: ['Student name', 'Session date', 'Duration', 'Case presented', 'Theoretical approach', 'Supervisor observations', 'Goals for next session', 'Supervisor signature'] })
        }
      } else {
        onUpload({ name, fields: ['Student name', 'Session date', 'Duration', 'Case presented', 'Theoretical approach', 'Supervisor observations', 'Goals for next session', 'Supervisor signature'] })
      }
    } catch {
      alert('Upload failed. Using default fields.')
      onUpload({ name, fields: ['Student name', 'Session date', 'Duration', 'Case presented', 'Theoretical approach', 'Supervisor observations', 'Goals for next session', 'Supervisor signature'] })
    }

    setParsing(false)
    onClose()
  }

  return (
    <div style={{position:'fixed', inset:0, background:'rgba(28,25,23,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100}} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{background:'white', borderRadius:'14px', padding:'28px 30px', width:'460px', maxWidth:'95vw'}}>
        <div style={{fontSize:'20px', fontWeight:'600', color:'#1C1917', marginBottom:'4px'}}>Upload form template</div>
        <div style={{fontSize:'13px', color:'#78716C', marginBottom:'24px'}}>Upload your Word doc — Supervisio reads the fields automatically</div>
        <div style={{marginBottom:'16px'}}>
          <label style={{display:'block', fontSize:'11.5px', textTransform:'uppercase', letterSpacing:'0.5px', color:'#44403C', fontWeight:'600', marginBottom:'6px'}}>Program name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Yorkville MACP" style={{width:'100%', padding:'10px 12px', border:'1px solid #D4CFC8', borderRadius:'8px', fontSize:'14px', fontFamily:'system-ui', outline:'none', color:'#1C1917', boxSizing:'border-box'}} />
        </div>
        <div
          style={{border:'1.5px dashed #D4CFC8', borderRadius:'8px', padding:'24px', textAlign:'center', background:'#F9F7F4', cursor:'pointer', marginBottom:'16px'}}
          onClick={() => document.getElementById('form-file-input')?.click()}
        >
          <div style={{width:'36px', height:'36px', borderRadius:'8px', background:'#EBF3EE', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 10px'}}>
            <svg width="16" height="16" fill="none" stroke="#1C5C3E" strokeWidth="1.5" viewBox="0 0 16 16"><path d="M8 2v8M5 5l3-3 3 3"/><path d="M3 11v2h10v-2"/></svg>
          </div>
          <div style={{fontSize:'13.5px', fontWeight:'500', color:'#44403C'}}>
            {selectedFile ? `✓ ${selectedFile.name}` : 'Click to upload your form'}
          </div>
          <div style={{fontSize:'12px', color:'#78716C', marginTop:'3px'}}>Word doc (.docx) — fields detected automatically</div>
          <input
            id="form-file-input"
            type="file"
            accept=".docx"
            style={{display:'none'}}
            onChange={e => {
              const file = e.target.files?.[0]
              if (file) setSelectedFile(file)
            }}
          />
        </div>
        {!selectedFile && (
          <div style={{fontSize:'12px', color:'#78716C', marginBottom:'16px', textAlign:'center'}}>
            Don't have the form yet? We'll use 8 default fields for now.
          </div>
        )}
        <div style={{display:'flex', gap:'10px', justifyContent:'flex-end', marginTop:'20px', paddingTop:'20px', borderTop:'1px solid #F2EFE9'}}>
          <button onClick={onClose} style={{background:'none', border:'1px solid #D4CFC8', borderRadius:'8px', padding:'9px 16px', fontSize:'13.5px', cursor:'pointer', color:'#44403C'}}>Cancel</button>
          <button onClick={handleUpload} disabled={parsing} style={{background:'#2D5A42', color:'white', border:'none', borderRadius:'8px', padding:'9px 18px', fontSize:'13.5px', fontWeight:'500', cursor:'pointer', opacity: parsing ? 0.7 : 1}}>
            {parsing ? 'Reading form...' : 'Save template'}
          </button>
        </div>
      </div>
    </div>
  )
}