'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

type Session = {
  id: string
  name: string
  date: string
  time: string
  zoom_link: string
  students: string[]
  status: 'scheduled' | 'live' | 'complete'
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

export default function Home() {
  const [page, setPage] = useState('dashboard')
  const [sessions, setSessions] = useState<Session[]>([])
  const [forms, setForms] = useState<FormTemplate[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [showNewSession, setShowNewSession] = useState(false)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [showNewStudent, setShowNewStudent] = useState(false)
  const [supervisor, setSupervisor] = useState<Supervisor | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      window.location.href = '/auth'
      return
    }
    const { data: supervisorData } = await supabase
      .from('supervisors')
      .select('*')
      .eq('id', session.user.id)
      .single()
    setSupervisor(supervisorData)
    loadSessions(session.user.id)
    loadForms(session.user.id)
    loadStudents(session.user.id)
    setLoading(false)
  }

  const loadSessions = async (userId: string) => {
    const { data } = await supabase
      .from('sessions')
      .select('*')
      .eq('supervisor_id', userId)
      .order('created_at', { ascending: false })
    if (data) setSessions(data)
  }

  const loadForms = async (userId: string) => {
    const { data } = await supabase
      .from('form_templates')
      .select('*')
      .eq('supervisor_id', userId)
      .order('created_at', { ascending: false })
    if (data) setForms(data)
  }

  const loadStudents = async (userId: string) => {
    const { data } = await supabase
      .from('students')
      .select('*')
      .eq('supervisor_id', userId)
      .order('created_at', { ascending: false })
    if (data) setStudents(data)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/auth'
  }

  if (loading) {
    return (
      <div style={{minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#F9F7F4', fontFamily:'system-ui'}}>
        <div style={{color:'#A8A29E', fontSize:'14px'}}>Loading...</div>
      </div>
    )
  }

  return (
    <div style={{display:'flex', minHeight:'100vh', fontFamily:'system-ui, sans-serif', background:'#F9F7F4'}}>
      <aside style={{width:'220px', background:'white', borderRight:'1px solid rgba(0,0,0,0.07)', display:'flex', flexDirection:'column', flexShrink:0, position:'fixed', top:0, left:0, bottom:0}}>
        <div style={{padding:'22px 20px 18px', borderBottom:'1px solid rgba(0,0,0,0.07)'}}>
          <div style={{fontSize:'18px', fontWeight:'500', color:'#1C1917'}}>● Supervisio</div>
          <div style={{fontSize:'11px', color:'#A8A29E', marginTop:'3px'}}>Clinical supervision, simplified</div>
        </div>
        <nav style={{flex:1, padding:'12px 10px', overflowY:'auto'}}>
          <div style={{fontSize:'10px', textTransform:'uppercase', letterSpacing:'0.8px', color:'#A8A29E', padding:'8px 10px 4px', fontWeight:'500'}}>Workspace</div>
          {[
            {id:'dashboard', label:'Overview'},
            {id:'sessions', label:'Sessions'},
            {id:'reports', label:'Ready to review'},
            {id:'forms', label:'Form templates'},
          ].map(item => (
            <button key={item.id} onClick={() => setPage(item.id)} style={{display:'flex', alignItems:'center', width:'100%', padding:'8px 10px', borderRadius:'7px', border:'none', background: page===item.id ? '#EBF3EE' : 'none', color: page===item.id ? '#3B6D54' : '#57534E', fontSize:'13px', cursor:'pointer', marginBottom:'1px', textAlign:'left'}}>
              {item.label}
            </button>
          ))}
          <div style={{fontSize:'10px', textTransform:'uppercase', letterSpacing:'0.8px', color:'#A8A29E', padding:'12px 10px 4px', fontWeight:'500'}}>Students</div>
          <button onClick={() => setPage('students')} style={{display:'flex', alignItems:'center', width:'100%', padding:'8px 10px', borderRadius:'7px', border:'none', background: page==='students' ? '#EBF3EE' : 'none', color: page==='students' ? '#3B6D54' : '#57534E', fontSize:'13px', cursor:'pointer', marginBottom:'1px', textAlign:'left'}}>
            All students
          </button>
          {students.map(student => (
            <button key={student.id} onClick={() => setPage(`student-${student.id}`)} style={{display:'flex', alignItems:'center', width:'100%', padding:'7px 10px 7px 20px', borderRadius:'7px', border:'none', background: page===`student-${student.id}` ? '#EBF3EE' : 'none', color: page===`student-${student.id}` ? '#3B6D54' : '#57534E', fontSize:'12.5px', cursor:'pointer', marginBottom:'1px', textAlign:'left'}}>
              {student.name}
            </button>
          ))}
          <div style={{fontSize:'10px', textTransform:'uppercase', letterSpacing:'0.8px', color:'#A8A29E', padding:'12px 10px 4px', fontWeight:'500'}}>Account</div>
          <button onClick={() => setPage('settings')} style={{display:'flex', alignItems:'center', width:'100%', padding:'8px 10px', borderRadius:'7px', border:'none', background: page==='settings' ? '#EBF3EE' : 'none', color: page==='settings' ? '#3B6D54' : '#57534E', fontSize:'13px', cursor:'pointer', marginBottom:'1px', textAlign:'left'}}>
            Settings
          </button>
        </nav>
        <div style={{padding:'14px 10px', borderTop:'1px solid rgba(0,0,0,0.07)'}}>
          <div style={{display:'flex', alignItems:'center', gap:'10px', padding:'8px 10px'}}>
            <div style={{width:'32px', height:'32px', borderRadius:'50%', background:'#EBF3EE', color:'#3B6D54', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:'500'}}>
              {supervisor?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'S'}
            </div>
            <div>
              <div style={{fontSize:'13px', fontWeight:'500'}}>{supervisor?.full_name || 'Supervisor'}</div>
              <div style={{fontSize:'11px', color:'#A8A29E', cursor:'pointer'}} onClick={handleSignOut}>Sign out</div>
            </div>
          </div>
        </div>
      </aside>

      <main style={{marginLeft:'220px', flex:1, padding:'28px 32px'}}>
        {page === 'dashboard' && <Dashboard sessions={sessions} students={students} setPage={setPage} onNewSession={() => setShowNewSession(true)} supervisor={supervisor} />}
        {page === 'sessions' && <Sessions sessions={sessions} setSessions={setSessions} setPage={setPage} onNewSession={() => setShowNewSession(true)} />}
        {page === 'reports' && <Reports sessions={sessions} />}
        {page === 'forms' && <Forms forms={forms} onUpload={() => setShowUploadForm(true)} />}
        {page === 'students' && <StudentsPage students={students} sessions={sessions} onNewStudent={() => setShowNewStudent(true)} setPage={setPage} />}
        {page.startsWith('student-') && (
          <StudentFile
            student={students.find(s => s.id === page.replace('student-', '')) || null}
            sessions={sessions.filter(s => {
              const student = students.find(st => st.id === page.replace('student-', ''))
              return student ? s.students.includes(student.name) : false
            })}
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

function Dashboard({ sessions, students, setPage, onNewSession, supervisor }: { sessions: Session[], students: Student[], setPage: (p: string) => void, onNewSession: () => void, supervisor: Supervisor | null }) {
  const firstName = supervisor?.full_name?.split(' ')[0] || 'there'
  const upcoming = sessions.filter(s => s.status === 'scheduled').slice(0, 3)
  const pendingReview = sessions.filter(s => s.status === 'complete')
  const today = new Date().toISOString().split('T')[0]
  const todaySessions = sessions.filter(s => s.date === today)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'24px'}}>
        <div>
          <div style={{fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.6px', color:'#A8A29E', marginBottom:'4px'}}>{new Date().toLocaleDateString('en-US', {weekday:'long', month:'long', day:'numeric', year:'numeric'})}</div>
          <div style={{fontSize:'26px', fontWeight:'500', color:'#1C1917'}}>{greeting}, {firstName}</div>
          <div style={{fontSize:'13px', color:'#A8A29E', marginTop:'3px'}}>
            {todaySessions.length > 0 ? `You have ${todaySessions.length} session${todaySessions.length > 1 ? 's' : ''} today` : 'No sessions today'}
            {pendingReview.length > 0 ? ` · ${pendingReview.length} form${pendingReview.length > 1 ? 's' : ''} awaiting review` : ''}
          </div>
        </div>
        <button onClick={onNewSession} style={{background:'#3B6D54', color:'white', border:'none', borderRadius:'7px', padding:'8px 16px', fontSize:'13px', fontWeight:'500', cursor:'pointer'}}>+ New session</button>
      </div>

      {pendingReview.length > 0 && (
        <div onClick={() => setPage('reports')} style={{background:'#FDF2F6', border:'1px solid rgba(157,59,91,0.15)', borderRadius:'10px', padding:'10px 14px', marginBottom:'18px', fontSize:'12.5px', color:'#9D3B5B', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
          <span>{pendingReview.length} form{pendingReview.length > 1 ? 's' : ''} ready for your review and signature</span>
          <span>→</span>
        </div>
      )}

      <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'12px', marginBottom:'24px'}}>
        {[
          {label:'Total students', value: students.length.toString()},
          {label:'Total sessions', value: sessions.length.toString()},
          {label:'Hours supervised', value: sessions.filter(s => s.status === 'complete').length.toString()},
          {label:'Forms pending', value: pendingReview.length.toString()},
        ].map(s => (
          <div key={s.label} style={{background:'white', border:'1px solid rgba(0,0,0,0.07)', borderRadius:'10px', padding:'16px 18px'}}>
            <div style={{fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.5px', color:'#A8A29E', marginBottom:'6px'}}>{s.label}</div>
            <div style={{fontSize:'28px', fontWeight:'500', color:'#1C1917', lineHeight:1}}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1.2fr 0.8fr', gap:'16px'}}>
        <div>
          <div style={{fontSize:'13px', fontWeight:'500', marginBottom:'12px', color:'#1C1917'}}>Student progress</div>
          {students.length === 0 ? (
            <div style={{background:'white', border:'1px solid rgba(0,0,0,0.07)', borderRadius:'10px', padding:'24px', textAlign:'center', color:'#A8A29E', fontSize:'13px'}}>
              No students yet — <span onClick={() => setPage('students')} style={{color:'#3B6D54', cursor:'pointer'}}>add your first student</span>
            </div>
          ) : (
            <div style={{background:'white', border:'1px solid rgba(0,0,0,0.07)', borderRadius:'10px', padding:'18px 20px'}}>
              {students.map((student, i) => {
                const studentSessions = sessions.filter(s => s.students.includes(student.name) && s.status === 'complete')
                const hours = studentSessions.length
                const percent = Math.round(Math.min((hours / 30) * 100, 100))
                return (
                  <div key={student.id} style={{marginBottom: i < students.length - 1 ? '16px' : '0'}}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'5px'}}>
                      <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                        <div style={{width:'26px', height:'26px', borderRadius:'50%', background:'#EBF3EE', color:'#3B6D54', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:'500'}}>
                          {student.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </div>
                        <span style={{fontSize:'13px', fontWeight:'500', cursor:'pointer', color:'#1C1917'}} onClick={() => setPage(`student-${student.id}`)}>{student.name}</span>
                      </div>
                      <span style={{fontSize:'12px', color:'#A8A29E'}}>{hours} / 30 hrs</span>
                    </div>
                    <div style={{height:'5px', background:'#F2EFE9', borderRadius:'3px', overflow:'hidden'}}>
                      <div style={{height:'100%', width:`${percent}%`, background: percent >= 80 ? '#3B6D54' : percent >= 50 ? '#5A9E7A' : '#EF9F27', borderRadius:'3px', transition:'width 0.5s'}}></div>
                    </div>
                    <div style={{fontSize:'11px', color:'#A8A29E', marginTop:'3px'}}>{student.program}</div>
                    {i < students.length - 1 && <div style={{height:'1px', background:'rgba(0,0,0,0.05)', margin:'14px 0 0'}}></div>}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div>
          <div style={{fontSize:'13px', fontWeight:'500', marginBottom:'12px', color:'#1C1917'}}>Upcoming sessions</div>
          {upcoming.length === 0 ? (
            <div style={{background:'white', border:'1px solid rgba(0,0,0,0.07)', borderRadius:'10px', padding:'24px', textAlign:'center', color:'#A8A29E', fontSize:'13px'}}>
              No upcoming sessions — <span onClick={onNewSession} style={{color:'#3B6D54', cursor:'pointer'}}>schedule one</span>
            </div>
          ) : (
            upcoming.map(s => (
              <div key={s.id} style={{background:'white', border:'1px solid rgba(0,0,0,0.07)', borderRadius:'10px', padding:'12px 16px', marginBottom:'8px'}}>
                <div style={{fontSize:'13px', fontWeight:'500', marginBottom:'2px'}}>{s.name}</div>
                <div style={{fontSize:'11.5px', color:'#A8A29E'}}>{s.date} · {s.time}</div>
                <div style={{fontSize:'11.5px', color:'#A8A29E', marginTop:'2px'}}>{s.students.join(', ')}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function Sessions({ sessions, setSessions, setPage, onNewSession }: { sessions: Session[], setSessions: (s: Session[]) => void, setPage: (p: string) => void, onNewSession: () => void }) {
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this session?')) return
    const { error } = await supabase.from('sessions').delete().eq('id', id)
    if (!error) setSessions(sessions.filter(s => s.id !== id))
  }

  return (
    <div>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'24px'}}>
        <div>
          <div style={{fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.6px', color:'#A8A29E', marginBottom:'4px'}}>All sessions</div>
          <div style={{fontSize:'24px', fontWeight:'500'}}>Sessions</div>
        </div>
        <button onClick={onNewSession} style={{background:'#3B6D54', color:'white', border:'none', borderRadius:'7px', padding:'8px 16px', fontSize:'13px', fontWeight:'500', cursor:'pointer'}}>+ New session</button>
      </div>
      {sessions.length === 0 ? (
        <EmptyState message="No sessions yet" sub="Sessions you create will appear here" action="Create your first session" onAction={onNewSession} />
      ) : (
        sessions.map(s => (
          <div key={s.id} style={{background:'white', border:'1px solid rgba(0,0,0,0.07)', borderRadius:'10px', padding:'14px 18px', display:'flex', alignItems:'center', gap:'14px', marginBottom:'8px'}}>
            <div style={{width:'3px', height:'40px', borderRadius:'2px', background: s.status === 'complete' ? '#D4D0CA' : s.status === 'live' ? '#5A9E7A' : '#EF9F27', flexShrink:0}}></div>
            <div style={{flex:1}}>
              <div style={{fontSize:'13.5px', fontWeight:'500'}}>{s.name}</div>
              <div style={{fontSize:'12px', color:'#A8A29E'}}>{s.date} · {s.time} · {s.students.join(', ')}</div>
            </div>
            <span style={{fontSize:'11px', padding:'3px 10px', borderRadius:'20px', fontWeight:'500', background: s.status === 'complete' ? '#F2EFE9' : s.status === 'live' ? '#EBF3EE' : '#FEF3C7', color: s.status === 'complete' ? '#A8A29E' : s.status === 'live' ? '#3B6D54' : '#B45309'}}>
              {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
            </span>
            {s.status === 'scheduled' && (
              <button onClick={() => handleDelete(s.id)} style={{background:'none', border:'none', cursor:'pointer', color:'#A8A29E', padding:'4px', borderRadius:'4px'}} title="Delete session">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 16 16">
                  <polyline points="2,4 14,4"/>
                  <path d="M5 4V2h6v2"/>
                  <path d="M3 4l1 10h8l1-10"/>
                </svg>
              </button>
            )}
          </div>
        ))
      )}
    </div>
  )
}

function Reports({ sessions }: { sessions: Session[] }) {
  const completed = sessions.filter(s => s.status === 'complete')
  return (
    <div>
      <div style={{fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.6px', color:'#A8A29E', marginBottom:'4px'}}>Documents</div>
      <div style={{fontSize:'24px', fontWeight:'500', marginBottom:'6px'}}>Ready to review</div>
      <div style={{fontSize:'12.5px', color:'#A8A29E', marginBottom:'20px'}}>Auto-filled forms waiting for your signature</div>
      {completed.length === 0 ? (
        <EmptyState message="No forms yet" sub="Forms will appear here after sessions are completed and processed" />
      ) : (
        completed.map(s => (
          <div key={s.id} style={{background:'white', border:'1px solid rgba(0,0,0,0.07)', borderRadius:'10px', padding:'14px 18px', display:'flex', alignItems:'center', gap:'14px', marginBottom:'8px', cursor:'pointer'}}>
            <div style={{width:'36px', height:'36px', borderRadius:'7px', background:'#FDF2F6', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:'16px'}}>📋</div>
            <div style={{flex:1}}>
              <div style={{fontSize:'13.5px', fontWeight:'500'}}>{s.name}</div>
              <div style={{fontSize:'12px', color:'#A8A29E'}}>{s.students.join(', ')} · {s.date}</div>
            </div>
            <span style={{fontSize:'11px', padding:'3px 10px', borderRadius:'20px', background:'#FDF2F6', color:'#9D3B5B', fontWeight:'500'}}>Review</span>
          </div>
        ))
      )}
    </div>
  )
}

function Forms({ forms, onUpload }: { forms: FormTemplate[], onUpload: () => void }) {
  return (
    <div>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'20px'}}>
        <div>
          <div style={{fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.6px', color:'#A8A29E', marginBottom:'4px'}}>Templates</div>
          <div style={{fontSize:'24px', fontWeight:'500'}}>Form templates</div>
          <div style={{fontSize:'12.5px', color:'#A8A29E', marginTop:'3px'}}>Upload any program's form — Supervisio learns the fields automatically</div>
        </div>
        <button onClick={onUpload} style={{background:'#3B6D54', color:'white', border:'none', borderRadius:'7px', padding:'8px 16px', fontSize:'13px', fontWeight:'500', cursor:'pointer'}}>+ Upload form</button>
      </div>
      {forms.length === 0 ? (
        <EmptyState message="No form templates yet" sub="Upload your supervision form and Supervisio will learn what to fill in" action="Upload a form" onAction={onUpload} />
      ) : (
        <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'12px'}}>
          {forms.map(f => (
            <div key={f.id} style={{background:'white', border:'1px solid rgba(0,0,0,0.07)', borderRadius:'10px', padding:'16px 18px', cursor:'pointer'}}>
              <div style={{fontSize:'24px', marginBottom:'10px'}}>📄</div>
              <div style={{fontSize:'13px', fontWeight:'500', marginBottom:'2px'}}>{f.name}</div>
              <div style={{fontSize:'11.5px', color:'#A8A29E'}}>{f.fields.length} fields detected</div>
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
          <div style={{fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.6px', color:'#A8A29E', marginBottom:'4px'}}>All students</div>
          <div style={{fontSize:'24px', fontWeight:'500'}}>Students</div>
        </div>
        <button onClick={onNewStudent} style={{background:'#3B6D54', color:'white', border:'none', borderRadius:'7px', padding:'8px 16px', fontSize:'13px', fontWeight:'500', cursor:'pointer'}}>+ Add student</button>
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
              <div key={student.id} onClick={() => setPage(`student-${student.id}`)} style={{background:'white', border:'1px solid rgba(0,0,0,0.07)', borderRadius:'10px', padding:'18px 20px', cursor:'pointer', transition:'all 0.12s'}}>
                <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px'}}>
                  <div style={{width:'38px', height:'38px', borderRadius:'50%', background:'#EBF3EE', color:'#3B6D54', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:'500'}}>
                    {student.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </div>
                  <div>
                    <div style={{fontSize:'14px', fontWeight:'500'}}>{student.name}</div>
                    <div style={{fontSize:'11.5px', color:'#A8A29E'}}>{student.program}</div>
                  </div>
                </div>
                <div style={{marginBottom:'8px'}}>
                  <div style={{display:'flex', justifyContent:'space-between', marginBottom:'4px'}}>
                    <span style={{fontSize:'11.5px', color:'#A8A29E'}}>Supervision hours</span>
                    <span style={{fontSize:'11.5px', fontWeight:'500'}}>{hours} / 30</span>
                  </div>
                  <div style={{height:'4px', background:'#F2EFE9', borderRadius:'2px', overflow:'hidden'}}>
                    <div style={{height:'100%', width:`${percent}%`, background: percent >= 80 ? '#3B6D54' : percent >= 50 ? '#5A9E7A' : '#EF9F27', borderRadius:'2px'}}></div>
                  </div>
                </div>
                <div style={{fontSize:'11.5px', color:'#A8A29E'}}>
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

function StudentFile({ student, sessions }: { student: Student | null, sessions: Session[] }) {
  if (!student) return <EmptyState message="Student not found" sub="This student may have been removed" />
  
  const completedSessions = sessions.filter(s => s.status === 'complete')
  const hours = completedSessions.length
  const percent = Math.round(Math.min((hours / 30) * 100, 100))

  return (
    <div>
      <div style={{display:'flex', alignItems:'center', gap:'14px', marginBottom:'24px'}}>
        <div style={{width:'48px', height:'48px', borderRadius:'50%', background:'#EBF3EE', color:'#3B6D54', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:'500'}}>
          {student.name.split(' ').map(n => n[0]).join('').toUpperCase()}
        </div>
        <div>
          <div style={{fontSize:'24px', fontWeight:'500'}}>{student.name}</div>
          <div style={{fontSize:'13px', color:'#A8A29E'}}>{student.program}</div>
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'12px', marginBottom:'24px'}}>
        {[
          {label:'Hours completed', value:`${hours}`},
          {label:'Hours remaining', value:`${30 - hours}`},
          {label:'Sessions total', value:`${sessions.length}`},
          {label:'Forms generated', value:`${completedSessions.length}`},
        ].map(s => (
          <div key={s.label} style={{background:'white', border:'1px solid rgba(0,0,0,0.07)', borderRadius:'10px', padding:'16px 18px'}}>
            <div style={{fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.5px', color:'#A8A29E', marginBottom:'6px'}}>{s.label}</div>
            <div style={{fontSize:'28px', fontWeight:'500', color:'#1C1917', lineHeight:1}}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{background:'white', border:'1px solid rgba(0,0,0,0.07)', borderRadius:'10px', padding:'18px 20px', marginBottom:'20px'}}>
        <div style={{display:'flex', justifyContent:'space-between', marginBottom:'8px'}}>
          <span style={{fontSize:'13px', fontWeight:'500'}}>Progress toward 30 hours</span>
          <span style={{fontSize:'13px', color:'#A8A29E'}}>{percent}%</span>
        </div>
        <div style={{height:'8px', background:'#F2EFE9', borderRadius:'4px', overflow:'hidden'}}>
          <div style={{height:'100%', width:`${percent}%`, background: percent >= 80 ? '#3B6D54' : percent >= 50 ? '#5A9E7A' : '#EF9F27', borderRadius:'4px', transition:'width 0.5s'}}></div>
        </div>
        <div style={{fontSize:'11.5px', color:'#A8A29E', marginTop:'6px'}}>{hours} of 30 hours completed · {30 - hours} hours remaining</div>
      </div>

      <div style={{fontSize:'13px', fontWeight:'500', marginBottom:'12px'}}>Session history</div>
      {sessions.length === 0 ? (
        <EmptyState message="No sessions yet" sub="Sessions with this student will appear here" />
      ) : (
        sessions.map(s => (
          <div key={s.id} style={{background:'white', border:'1px solid rgba(0,0,0,0.07)', borderRadius:'10px', padding:'14px 18px', display:'flex', alignItems:'center', gap:'14px', marginBottom:'8px'}}>
            <div style={{width:'3px', height:'40px', borderRadius:'2px', background: s.status === 'complete' ? '#5A9E7A' : '#EF9F27', flexShrink:0}}></div>
            <div style={{flex:1}}>
              <div style={{fontSize:'13.5px', fontWeight:'500'}}>{s.name}</div>
              <div style={{fontSize:'12px', color:'#A8A29E'}}>{s.date} · {s.time}</div>
            </div>
            <span style={{fontSize:'11px', padding:'3px 10px', borderRadius:'20px', fontWeight:'500', background: s.status === 'complete' ? '#EBF3EE' : '#FEF3C7', color: s.status === 'complete' ? '#3B6D54' : '#B45309'}}>
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

  const toggle = (key: keyof typeof toggles) => {
    setToggles(prev => ({...prev, [key]: !prev[key]}))
  }

  return (
    <div>
      <div style={{fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.6px', color:'#A8A29E', marginBottom:'4px'}}>Account</div>
      <div style={{fontSize:'24px', fontWeight:'500', marginBottom:'20px'}}>Settings</div>
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
        <div key={section.title} style={{background:'white', border:'1px solid rgba(0,0,0,0.07)', borderRadius:'10px', marginBottom:'14px', overflow:'hidden'}}>
          <div style={{fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.7px', color:'#A8A29E', fontWeight:'500', padding:'16px 20px 10px', borderBottom:'1px solid rgba(0,0,0,0.07)'}}>{section.title}</div>
          {section.items.map((item, i) => (
            <div key={item.key} style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', borderBottom: i < section.items.length-1 ? '1px solid rgba(0,0,0,0.07)' : 'none'}}>
              <div>
                <div style={{fontSize:'13.5px', fontWeight:'500'}}>{item.label}</div>
                <div style={{fontSize:'12px', color:'#A8A29E', marginTop:'1px'}}>{item.desc}</div>
              </div>
              <div onClick={() => toggle(item.key as keyof typeof toggles)} style={{width:'36px', height:'20px', borderRadius:'10px', background: toggles[item.key as keyof typeof toggles] ? '#5A9E7A' : '#E8E3DB', position:'relative', cursor:'pointer', flexShrink:0, transition:'background 0.2s'}}>
                <div style={{width:'14px', height:'14px', background:'white', borderRadius:'50%', position:'absolute', top:'3px', right: toggles[item.key as keyof typeof toggles] ? '3px' : 'auto', left: toggles[item.key as keyof typeof toggles] ? 'auto' : '3px', transition:'all 0.2s'}}></div>
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
    <div style={{textAlign:'center', padding:'60px 20px', color:'#A8A29E'}}>
      <div style={{fontSize:'32px', marginBottom:'12px'}}>○</div>
      <div style={{fontSize:'15px', fontWeight:'500', color:'#57534E', marginBottom:'6px'}}>{message}</div>
      <div style={{fontSize:'13px', marginBottom: action ? '20px' : '0'}}>{sub}</div>
      {action && onAction && (
        <button onClick={onAction} style={{background:'#3B6D54', color:'white', border:'none', borderRadius:'7px', padding:'8px 18px', fontSize:'13px', fontWeight:'500', cursor:'pointer'}}>{action}</button>
      )}
    </div>
  )
}

function NewSessionModal({ onClose, onCreate }: { onClose: () => void, onCreate: (session: Omit<Session, 'id'>) => void }) {
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [zoomLink, setZoomLink] = useState('')
  const [students, setStudents] = useState('')

  const handleCreate = () => {
    if (!name || !date || !time) {
      alert('Please fill in session name, date and time')
      return
    }
    onCreate({
      name,
      date,
      time,
      zoom_link: zoomLink,
      students: students.split(',').map(s => s.trim()).filter(Boolean),
      status: 'scheduled',
    })
    onClose()
  }

  return (
    <div style={{position:'fixed', inset:0, background:'rgba(28,25,23,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100}} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{background:'white', borderRadius:'14px', padding:'26px 28px', width:'460px', maxWidth:'95vw'}}>
        <div style={{fontSize:'19px', fontWeight:'500', marginBottom:'4px'}}>New supervision session</div>
        <div style={{fontSize:'12.5px', color:'#A8A29E', marginBottom:'22px'}}>Schedule a session and upload the recording afterwards</div>
        {[
          {label:'Session name', value:name, setter:setName, placeholder:'e.g. Group supervision — session 1', type:'text'},
          {label:'Students (comma separated)', value:students, setter:setStudents, placeholder:'e.g. Maya Adeyemi, Jordan Bassett', type:'text'},
        ].map(field => (
          <div key={field.label} style={{marginBottom:'15px'}}>
            <label style={{display:'block', fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.5px', color:'#57534E', fontWeight:'500', marginBottom:'5px'}}>{field.label}</label>
            <input type={field.type} value={field.value} onChange={e => field.setter(e.target.value)} placeholder={field.placeholder} style={{width:'100%', padding:'9px 12px', border:'1px solid rgba(0,0,0,0.12)', borderRadius:'7px', fontSize:'13.5px', fontFamily:'system-ui', outline:'none', boxSizing:'border-box'}} />
          </div>
        ))}
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'15px'}}>
          <div>
            <label style={{display:'block', fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.5px', color:'#57534E', fontWeight:'500', marginBottom:'5px'}}>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{width:'100%', padding:'9px 12px', border:'1px solid rgba(0,0,0,0.12)', borderRadius:'7px', fontSize:'13.5px', fontFamily:'system-ui', outline:'none', boxSizing:'border-box'}} />
          </div>
          <div>
            <label style={{display:'block', fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.5px', color:'#57534E', fontWeight:'500', marginBottom:'5px'}}>Time</label>
            <input type="time" value={time} onChange={e => setTime(e.target.value)} style={{width:'100%', padding:'9px 12px', border:'1px solid rgba(0,0,0,0.12)', borderRadius:'7px', fontSize:'13.5px', fontFamily:'system-ui', outline:'none', boxSizing:'border-box'}} />
          </div>
        </div>
        <div style={{display:'flex', gap:'9px', justifyContent:'flex-end', marginTop:'20px', paddingTop:'18px', borderTop:'1px solid rgba(0,0,0,0.07)'}}>
          <button onClick={onClose} style={{background:'none', border:'1px solid rgba(0,0,0,0.12)', borderRadius:'7px', padding:'8px 16px', fontSize:'13px', cursor:'pointer', color:'#57534E'}}>Cancel</button>
          <button onClick={handleCreate} style={{background:'#3B6D54', color:'white', border:'none', borderRadius:'7px', padding:'8px 16px', fontSize:'13px', fontWeight:'500', cursor:'pointer'}}>Create session</button>
        </div>
      </div>
    </div>
  )
}

function NewStudentModal({ onClose, onCreate }: { onClose: () => void, onCreate: (student: Omit<Student, 'id' | 'created_at'>) => void }) {
  const [name, setName] = useState('')
  const [program, setProgram] = useState('')

  const handleCreate = () => {
    if (!name || !program) {
      alert('Please fill in student name and program')
      return
    }
    onCreate({ name, program, supervisor_id: '' })
    onClose()
  }

  return (
    <div style={{position:'fixed', inset:0, background:'rgba(28,25,23,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100}} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{background:'white', borderRadius:'14px', padding:'26px 28px', width:'420px', maxWidth:'95vw'}}>
        <div style={{fontSize:'19px', fontWeight:'500', marginBottom:'4px'}}>Add student</div>
        <div style={{fontSize:'12.5px', color:'#A8A29E', marginBottom:'22px'}}>Create a file for a new student</div>
        <div style={{marginBottom:'15px'}}>
          <label style={{display:'block', fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.5px', color:'#57534E', fontWeight:'500', marginBottom:'5px'}}>Full name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Maya Adeyemi" style={{width:'100%', padding:'9px 12px', border:'1px solid rgba(0,0,0,0.12)', borderRadius:'7px', fontSize:'13.5px', fontFamily:'system-ui', outline:'none', boxSizing:'border-box'}} />
        </div>
        <div style={{marginBottom:'15px'}}>
          <label style={{display:'block', fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.5px', color:'#57534E', fontWeight:'500', marginBottom:'5px'}}>Program</label>
          <input value={program} onChange={e => setProgram(e.target.value)} placeholder="e.g. Yorkville MACP" style={{width:'100%', padding:'9px 12px', border:'1px solid rgba(0,0,0,0.12)', borderRadius:'7px', fontSize:'13.5px', fontFamily:'system-ui', outline:'none', boxSizing:'border-box'}} />
        </div>
        <div style={{display:'flex', gap:'9px', justifyContent:'flex-end', marginTop:'20px', paddingTop:'18px', borderTop:'1px solid rgba(0,0,0,0.07)'}}>
          <button onClick={onClose} style={{background:'none', border:'1px solid rgba(0,0,0,0.12)', borderRadius:'7px', padding:'8px 16px', fontSize:'13px', cursor:'pointer', color:'#57534E'}}>Cancel</button>
          <button onClick={handleCreate} style={{background:'#3B6D54', color:'white', border:'none', borderRadius:'7px', padding:'8px 16px', fontSize:'13px', fontWeight:'500', cursor:'pointer'}}>Add student</button>
        </div>
      </div>
    </div>
  )
}

function UploadFormModal({ onClose, onUpload }: { onClose: () => void, onUpload: (form: Omit<FormTemplate, 'id'>) => void }) {
  const [name, setName] = useState('')

  const handleUpload = () => {
    if (!name) return
    onUpload({
      name,
      fields: ['Student name', 'Session date', 'Duration', 'Case presented', 'Theoretical approach', 'Supervisor observations', 'Goals for next session', 'Supervisor signature'],
    })
    onClose()
  }

  return (
    <div style={{position:'fixed', inset:0, background:'rgba(28,25,23,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100}} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{background:'white', borderRadius:'14px', padding:'26px 28px', width:'420px', maxWidth:'95vw'}}>
        <div style={{fontSize:'19px', fontWeight:'500', marginBottom:'4px'}}>Upload form template</div>
        <div style={{fontSize:'12.5px', color:'#A8A29E', marginBottom:'22px'}}>Supervisio will learn the fields and fill them automatically</div>
        <div style={{marginBottom:'15px'}}>
          <label style={{display:'block', fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.5px', color:'#57534E', fontWeight:'500', marginBottom:'5px'}}>Program name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Yorkville MACP" style={{width:'100%', padding:'9px 12px', border:'1px solid rgba(0,0,0,0.12)', borderRadius:'7px', fontSize:'13.5px', fontFamily:'system-ui', outline:'none', boxSizing:'border-box'}} />
        </div>
        <div style={{border:'1.5px dashed rgba(0,0,0,0.12)', borderRadius:'7px', padding:'24px', textAlign:'center', background:'#F9F7F4', cursor:'pointer', marginBottom:'15px'}}>
          <div style={{fontSize:'24px', marginBottom:'8px'}}>📄</div>
          <div style={{fontSize:'13px', fontWeight:'500', color:'#57534E'}}>Drop your form here or click to browse</div>
          <div style={{fontSize:'11.5px', color:'#A8A29E', marginTop:'3px'}}>PDF or Word — fields detected automatically</div>
        </div>
        <div style={{display:'flex', gap:'9px', justifyContent:'flex-end', marginTop:'20px', paddingTop:'18px', borderTop:'1px solid rgba(0,0,0,0.07)'}}>
          <button onClick={onClose} style={{background:'none', border:'1px solid rgba(0,0,0,0.12)', borderRadius:'7px', padding:'8px 16px', fontSize:'13px', cursor:'pointer', color:'#57534E'}}>Cancel</button>
          <button onClick={handleUpload} style={{background:'#3B6D54', color:'white', border:'none', borderRadius:'7px', padding:'8px 16px', fontSize:'13px', fontWeight:'500', cursor:'pointer'}}>Save template</button>
        </div>
      </div>
    </div>
  )
}