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
  form_template_id: string
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
  created_at: string
}

const QUOTES = [
  "The supervisory relationship is itself a therapeutic relationship.",
  "Good supervision creates the conditions for good therapy.",
  "Supervision is where clinical wisdom is passed from one generation to the next.",
  "The goal of supervision is not to make the supervisee dependent, but to foster independence.",
  "Reflective practice is the cornerstone of clinical growth.",
]

export default function Home() {
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [page, setPage] = useState('dashboard')
  const [sessions, setSessions] = useState<Session[]>([])
  const [forms, setForms] = useState<FormTemplate[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [generatedForms, setGeneratedForms] = useState<GeneratedForm[]>([])
  const [showNewSession, setShowNewSession] = useState(false)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [showNewStudent, setShowNewStudent] = useState(false)
  const [supervisor, setSupervisor] = useState<Supervisor | null>(null)
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => { checkUser() }, [])

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setAuthed(false); return }
    setAuthed(true)
    const { data: supervisorData } = await supabase.from('supervisors').select('*').eq('id', session.user.id).single()
    setSupervisor(supervisorData)
    loadSessions(session.user.id)
    loadForms(session.user.id)
    loadStudents(session.user.id)
    loadGeneratedForms(session.user.id)
    setupRealtime(session.user.id)
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

  const setupRealtime = (userId: string) => {
    supabase
      .channel('generated_forms_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'generated_forms' }, async () => { await loadGeneratedForms(userId) })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sessions' }, async () => { await loadSessions(userId) })
      .subscribe()
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setAuthed(false)
  }

  if (authed === null) {
    return (
      <div style={{minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#1A3C2E'}}>
        <div style={{color:'#C8DDD4', fontSize:'14px', fontFamily:'system-ui'}}>Loading...</div>
      </div>
    )
  }

  if (authed === false) return <LandingPage />

  const d = darkMode
  const theme = {
    sidebar: d ? '#0D1F17' : '#1A3C2E',
    sidebarActive: d ? '#2D5A42' : '#3D7A5A',
    sidebarText: '#E8F5EE',
    sidebarTextMuted: '#A8D5BC',
    sidebarBorder: 'rgba(255,255,255,0.12)',
    bg: d ? '#0F1A14' : '#EDE8DF',
    surface: d ? '#162119' : '#FFFFFF',
    surface2: d ? '#1C2D23' : '#F0EBE1',
    border: d ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)',
    border2: d ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.18)',
    text: d ? '#F0EBE1' : '#1A1614',
    text2: d ? '#C8DDD4' : '#3D3530',
    text3: d ? '#6B9B82' : '#6B6259',
    accent: '#2D7A52',
    accentLight: d ? '#1A3C2E' : '#DFF0E8',
    accentText: d ? '#6BCF94' : '#1A5C35',
    gold: '#B8922E',
    goldLight: d ? '#2A2210' : '#FBF3DC',
    rose: '#9D3B5B',
    roseLight: d ? '#2A1020' : '#FCEDF3',
  }

  const NavItem = ({ id, label, badge }: { id: string, label: string, badge?: number }) => (
    <button onClick={() => setPage(id)} style={{display:'flex', alignItems:'center', width:'100%', padding:'9px 12px', borderRadius:'8px', border:'none', background: page===id ? theme.sidebarActive : 'transparent', color: page===id ? '#FFFFFF' : theme.sidebarText, fontSize:'13.5px', fontWeight: page===id ? '700' : '500', cursor:'pointer', marginBottom:'2px', textAlign:'left', transition:'all 0.15s', letterSpacing:'0.1px'}}>
      {label}
      {badge && badge > 0 ? <span style={{marginLeft:'auto', background:'#C9A84C', color:'#1C1917', fontSize:'10px', padding:'1px 7px', borderRadius:'10px', fontWeight:'700'}}>{badge}</span> : null}
    </button>
  )

  return (
    <div style={{display:'flex', minHeight:'100vh', fontFamily:'system-ui, sans-serif', background: theme.bg, color: theme.text}}>
      <style>{`
        @media (max-width: 768px) {
          .app-sidebar { width: 100% !important; height: 60px !important; bottom: auto !important; flex-direction: row !important; padding: 0 !important; border-right: none !important; border-bottom: 1px solid rgba(255,255,255,0.1) !important; z-index: 50 !important; }
          .app-logo { display: none !important; }
          .app-nav { flex-direction: row !important; padding: 0 8px !important; overflow-x: auto !important; overflow-y: hidden !important; align-items: center !important; flex: 1 !important; }
          .app-nav-label { display: none !important; }
          .app-footer { display: none !important; }
          .app-main { margin-left: 0 !important; padding: 16px !important; margin-top: 60px !important; }
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; }
          .two-col { grid-template-columns: 1fr !important; }
          .three-col { grid-template-columns: 1fr !important; }
          .four-col { grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; }
          .form-grid { grid-template-columns: 1fr !important; }
          .student-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <aside className="app-sidebar" style={{width:'240px', background: theme.sidebar, display:'flex', flexDirection:'column', flexShrink:0, position:'fixed', top:0, left:0, bottom:0}}>
        <div className="app-logo" style={{padding:'24px 20px 20px', borderBottom:`1px solid ${theme.sidebarBorder}`}}>
          <div style={{fontSize:'20px', fontWeight:'800', color:'#FFFFFF', letterSpacing:'-0.3px'}}>Supervisio</div>
          <div style={{fontSize:'11px', color: theme.sidebarTextMuted, marginTop:'3px', letterSpacing:'0.3px'}}>Clinical supervision, simplified</div>
        </div>

        <nav className="app-nav" style={{flex:1, padding:'14px 10px', overflowY:'auto'}}>
          <div className="app-nav-label" style={{fontSize:'10px', textTransform:'uppercase', letterSpacing:'1px', color: theme.sidebarTextMuted, padding:'8px 12px 6px', fontWeight:'700'}}>Workspace</div>
          <NavItem id="dashboard" label="Overview" />
          <NavItem id="sessions" label="Sessions" />
          <NavItem id="reports" label="Ready to review" badge={generatedForms.filter(f => f.status === 'pending').length} />
          <NavItem id="forms" label="Form templates" />
          <div className="app-nav-label" style={{fontSize:'10px', textTransform:'uppercase', letterSpacing:'1px', color: theme.sidebarTextMuted, padding:'14px 12px 6px', fontWeight:'700'}}>Students</div>
          <NavItem id="students" label="All students" />
          {students.map(student => (
            <button key={student.id} onClick={() => setPage(`student-${student.id}`)} style={{display:'flex', alignItems:'center', width:'100%', padding:'7px 12px 7px 24px', borderRadius:'8px', border:'none', background: page===`student-${student.id}` ? theme.sidebarActive : 'transparent', color: page===`student-${student.id}` ? '#FFFFFF' : theme.sidebarText, fontSize:'13px', fontWeight:'500', cursor:'pointer', marginBottom:'2px', textAlign:'left'}}>
              {student.name}
            </button>
          ))}
          <div className="app-nav-label" style={{fontSize:'10px', textTransform:'uppercase', letterSpacing:'1px', color: theme.sidebarTextMuted, padding:'14px 12px 6px', fontWeight:'700'}}>Account</div>
          <NavItem id="settings" label="Settings" />
        </nav>

        <div className="app-footer" style={{padding:'12px 10px', borderTop:`1px solid ${theme.sidebarBorder}`}}>
          <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 12px'}}>
            <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
              <div style={{width:'32px', height:'32px', borderRadius:'50%', background: theme.sidebarActive, color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:'700'}}>
                {supervisor?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'S'}
              </div>
              <div>
                <div style={{fontSize:'13px', fontWeight:'600', color:'white'}}>{supervisor?.full_name || 'Supervisor'}</div>
                <div style={{fontSize:'11px', color: theme.sidebarTextMuted, cursor:'pointer'}} onClick={handleSignOut}>Sign out</div>
              </div>
            </div>
            <button onClick={() => setDarkMode(!darkMode)} style={{background:'transparent', border:`1px solid ${theme.sidebarBorder}`, borderRadius:'6px', padding:'5px 8px', cursor:'pointer', color: theme.sidebarText, fontSize:'14px'}}>
              {darkMode ? '☀' : '☾'}
            </button>
          </div>
        </div>
      </aside>

      <main className="app-main" style={{marginLeft:'240px', flex:1, padding:'32px 40px'}}>
        {page === 'dashboard' && <Dashboard sessions={sessions} students={students} generatedForms={generatedForms} setPage={setPage} onNewSession={() => setShowNewSession(true)} supervisor={supervisor} theme={theme} />}
        {page === 'sessions' && <Sessions sessions={sessions} setSessions={setSessions} forms={forms} onNewSession={() => setShowNewSession(true)} theme={theme} />}
        {page === 'reports' && <Reports generatedForms={generatedForms} sessions={sessions} setGeneratedForms={setGeneratedForms} theme={theme} />}
        {page === 'forms' && <Forms forms={forms} setForms={setForms} onUpload={() => setShowUploadForm(true)} theme={theme} />}
        {page === 'students' && <StudentsPage students={students} sessions={sessions} onNewStudent={() => setShowNewStudent(true)} setPage={setPage} theme={theme} />}
        {page.startsWith('student-') && (
          <StudentFile
            student={students.find(s => s.id === page.replace('student-', '')) || null}
            sessions={sessions.filter(s => {
              const student = students.find(st => st.id === page.replace('student-', ''))
              return student ? s.students.includes(student.name) : false
            })}
            generatedForms={generatedForms}
            theme={theme}
          />
        )}
        {page === 'settings' && <SettingsPage theme={theme} />}
      </main>

      {showNewSession && (
        <NewSessionModal onClose={() => setShowNewSession(false)} theme={theme} onCreate={async (session) => {
          const { data: { session: authSession } } = await supabase.auth.getSession()
          if (!authSession) return
          const { data } = await supabase.from('sessions').insert({ ...session, supervisor_id: authSession.user.id }).select().single()
          if (data) setSessions(prev => [data, ...prev])
          setShowNewSession(false)
          setPage('sessions')
        }} />
      )}

      {showUploadForm && (
        <UploadFormModal onClose={() => setShowUploadForm(false)} theme={theme} onUpload={async (form) => {
          const { data: { session: authSession } } = await supabase.auth.getSession()
          if (!authSession) return
          const { data } = await supabase.from('form_templates').insert({ ...form, supervisor_id: authSession.user.id }).select().single()
          if (data) setForms(prev => [data, ...prev])
          setShowUploadForm(false)
        }} />
      )}

      {showNewStudent && (
        <NewStudentModal onClose={() => setShowNewStudent(false)} theme={theme} onCreate={async (student) => {
          const { data: { session: authSession } } = await supabase.auth.getSession()
          if (!authSession) return
          const { data } = await supabase.from('students').insert({ ...student, supervisor_id: authSession.user.id }).select().single()
          if (data) setStudents(prev => [data, ...prev])
          setShowNewStudent(false)
        }} />
      )}
    </div>
  )
}

function Dashboard({ sessions, students, generatedForms, setPage, onNewSession, supervisor, theme }: { sessions: Session[], students: Student[], generatedForms: GeneratedForm[], setPage: (p: string) => void, onNewSession: () => void, supervisor: Supervisor | null, theme: Record<string, string> }) {
  const firstName = supervisor?.full_name?.split(' ')[0] || 'there'
  const upcoming = sessions.filter(s => s.status === 'scheduled').slice(0, 3)
  const pendingForms = generatedForms.filter(f => f.status === 'pending')
  const recentForms = generatedForms.slice(0, 3)
  const processing = sessions.filter(s => s.status === 'processing')
  const today = new Date().toISOString().split('T')[0]
  const todaySessions = sessions.filter(s => s.date === today)
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const quote = QUOTES[new Date().getDay() % QUOTES.length]

  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay())
  const weekSessions = sessions.filter(s => new Date(s.date) >= weekStart)
  const weekComplete = weekSessions.filter(s => s.status === 'complete')
  const weekForms = generatedForms.filter(f => new Date((f as any).created_at) >= weekStart)

  const studentsNearComplete = students.filter(student => {
    const hrs = sessions.filter(s => s.students.includes(student.name) && s.status === 'complete').length
    return hrs >= 24 && hrs < 30
  })

  const studentsNoRecentSession = students.filter(student => {
    const studentSessions = sessions.filter(s => s.students.includes(student.name) && s.status === 'scheduled')
    return studentSessions.length === 0
  })

  const outstanding = [
    ...pendingForms.map(f => ({ type: 'form', text: `Review form — ${f.student_name}`, action: () => setPage('reports') })),
    ...sessions.filter(s => s.status === 'failed').map(s => ({ type: 'error', text: `Recording failed — ${s.name}`, action: () => setPage('sessions') })),
    ...studentsNoRecentSession.slice(0, 2).map(s => ({ type: 'student', text: `No upcoming session — ${s.name}`, action: () => setPage('students') })),
  ].slice(0, 5)

  return (
    <div>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'28px'}}>
        <div>
          <div style={{fontSize:'12px', color: theme.text3, marginBottom:'4px', letterSpacing:'0.3px'}}>{new Date().toLocaleDateString('en-US', {weekday:'long', month:'long', day:'numeric', year:'numeric'})}</div>
          <div style={{fontSize:'30px', fontWeight:'700', color: theme.text, letterSpacing:'-0.5px'}}>{greeting}, {firstName}</div>
          <div style={{fontSize:'14px', color: theme.text2, marginTop:'5px'}}>
            {todaySessions.length > 0 ? `${todaySessions.length} session${todaySessions.length > 1 ? 's' : ''} today` : 'No sessions today'}
            {pendingForms.length > 0 ? ` · ${pendingForms.length} form${pendingForms.length > 1 ? 's' : ''} awaiting review` : ''}
          </div>
        </div>
        <button onClick={onNewSession} style={{background: theme.accent, color:'white', border:'none', borderRadius:'9px', padding:'10px 20px', fontSize:'13.5px', fontWeight:'600', cursor:'pointer'}}>+ New session</button>
      </div>

      {pendingForms.length > 0 && (
        <div onClick={() => setPage('reports')} style={{background: theme.goldLight, border:`1px solid ${theme.gold}40`, borderLeft:`4px solid ${theme.gold}`, borderRadius:'10px', padding:'13px 16px', marginBottom:'16px', fontSize:'13.5px', color: theme.gold, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between', fontWeight:'500'}}>
          <span>📋 {pendingForms.length} form{pendingForms.length > 1 ? 's' : ''} ready for your review and signature</span>
          <span style={{fontSize:'16px'}}>→</span>
        </div>
      )}

      {processing.length > 0 && (
        <div style={{background: theme.accentLight, border:`1px solid ${theme.accent}40`, borderLeft:`4px solid ${theme.accent}`, borderRadius:'10px', padding:'13px 16px', marginBottom:'16px', fontSize:'13px', color: theme.accentText, display:'flex', alignItems:'center', gap:'10px'}}>
          <div style={{width:'8px', height:'8px', borderRadius:'50%', background: theme.accent, flexShrink:0}}></div>
          {processing.length} recording{processing.length > 1 ? 's' : ''} being transcribed — forms will appear automatically when ready
        </div>
      )}

      <div className="stats-grid" style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'14px', marginBottom:'24px'}}>
        {[
          {label:'Total students', value: students.length.toString()},
          {label:'Total sessions', value: sessions.length.toString()},
          {label:'Hours supervised', value: sessions.filter(s => s.status === 'complete').length.toString()},
          {label:'Forms pending', value: pendingForms.length.toString()},
        ].map(s => (
          <div key={s.label} style={{background: theme.surface, border:`1px solid ${theme.border}`, borderRadius:'12px', padding:'18px 20px'}}>
            <div style={{fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.7px', color: theme.text3, marginBottom:'10px', fontWeight:'600'}}>{s.label}</div>
            <div style={{fontSize:'32px', fontWeight:'700', color: theme.text, lineHeight:1, letterSpacing:'-1px'}}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="two-col" style={{display:'grid', gridTemplateColumns:'1.4fr 0.6fr', gap:'22px', marginBottom:'22px'}}>
        <div>
          <div style={{fontSize:'14px', fontWeight:'600', color: theme.text, marginBottom:'14px'}}>Student progress</div>
          {students.length === 0 ? (
            <div style={{background: theme.surface, border:`1px solid ${theme.border}`, borderRadius:'12px', padding:'32px', textAlign:'center'}}>
              <div style={{fontSize:'13px', color: theme.text3}}>No students yet — <span onClick={() => setPage('students')} style={{color: theme.accent, cursor:'pointer', fontWeight:'500'}}>add your first student</span></div>
            </div>
          ) : (
            <div style={{background: theme.surface, border:`1px solid ${theme.border}`, borderRadius:'12px', padding:'22px 24px'}}>
              {students.map((student, i) => {
                const hrs = sessions.filter(s => s.students.includes(student.name) && s.status === 'complete').length
                const percent = Math.round(Math.min((hrs / 30) * 100, 100))
                const color = percent >= 80 ? '#2D7A52' : percent >= 50 ? '#5A9E7A' : '#C9A84C'
                return (
                  <div key={student.id} style={{marginBottom: i < students.length - 1 ? '20px' : '0'}}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'7px'}}>
                      <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                        <div style={{width:'30px', height:'30px', borderRadius:'50%', background: theme.accentLight, color: theme.accentText, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:'700'}}>
                          {student.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </div>
                        <span style={{fontSize:'14px', fontWeight:'500', cursor:'pointer', color: theme.text}} onClick={() => setPage(`student-${student.id}`)}>{student.name}</span>
                      </div>
                      <span style={{fontSize:'12px', color: theme.text2, fontWeight:'500'}}>{hrs} / 30 hrs</span>
                    </div>
                    <div style={{height:'6px', background: theme.surface2, borderRadius:'3px', overflow:'hidden'}}>
                      <div style={{height:'100%', width:`${percent}%`, background: color, borderRadius:'3px', transition:'width 0.6s ease'}}></div>
                    </div>
                    <div style={{fontSize:'11.5px', color: theme.text3, marginTop:'4px'}}>{student.program}</div>
                    {i < students.length - 1 && <div style={{height:'1px', background: theme.border, margin:'18px 0 0'}}></div>}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div>
          <div style={{fontSize:'14px', fontWeight:'600', color: theme.text, marginBottom:'14px'}}>Upcoming</div>
          {upcoming.length === 0 ? (
            <div style={{background: theme.surface, border:`1px solid ${theme.border}`, borderRadius:'12px', padding:'32px', textAlign:'center'}}>
              <div style={{fontSize:'13px', color: theme.text3}}>No upcoming sessions</div>
              <span onClick={onNewSession} style={{fontSize:'13px', color: theme.accent, cursor:'pointer', fontWeight:'500', display:'block', marginTop:'4px'}}>schedule one</span>
            </div>
          ) : (
            upcoming.map(s => (
              <div key={s.id} style={{background: theme.surface, border:`1px solid ${theme.border}`, borderRadius:'12px', padding:'14px 16px', marginBottom:'10px'}}>
                <div style={{fontSize:'13.5px', fontWeight:'500', color: theme.text, marginBottom:'4px'}}>{s.name}</div>
                <div style={{fontSize:'12px', color: theme.text2}}>{s.date} · {s.time}</div>
                <div style={{fontSize:'12px', color: theme.text3, marginTop:'2px'}}>{s.students.join(', ')}</div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="two-col" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'22px', marginBottom:'22px'}}>
        <div>
          <div style={{fontSize:'14px', fontWeight:'600', color: theme.text, marginBottom:'14px'}}>This week</div>
          <div style={{background: theme.surface, border:`1px solid ${theme.border}`, borderRadius:'12px', padding:'20px 22px'}}>
            <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'12px', marginBottom:'16px'}}>
              {[
                {label:'Sessions', value: weekSessions.length.toString()},
                {label:'Completed', value: weekComplete.length.toString()},
                {label:'Forms', value: weekForms.length.toString()},
              ].map(s => (
                <div key={s.label} style={{textAlign:'center'}}>
                  <div style={{fontSize:'22px', fontWeight:'700', color: theme.text, letterSpacing:'-0.5px'}}>{s.value}</div>
                  <div style={{fontSize:'11px', color: theme.text3, textTransform:'uppercase', letterSpacing:'0.5px', marginTop:'3px'}}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{height:'1px', background: theme.border, marginBottom:'14px'}}></div>
            <div style={{fontSize:'12px', color: theme.text3, fontStyle:'italic', lineHeight:'1.6', textAlign:'center'}}>"{quote}"</div>
          </div>
        </div>

        <div>
          <div style={{fontSize:'14px', fontWeight:'600', color: theme.text, marginBottom:'14px'}}>Needs attention</div>
          {outstanding.length === 0 ? (
            <div style={{background: theme.surface, border:`1px solid ${theme.border}`, borderRadius:'12px', padding:'32px', textAlign:'center'}}>
              <div style={{fontSize:'22px', marginBottom:'8px'}}>✓</div>
              <div style={{fontSize:'13px', color: theme.text3}}>All caught up</div>
            </div>
          ) : (
            <div style={{background: theme.surface, border:`1px solid ${theme.border}`, borderRadius:'12px', overflow:'hidden'}}>
              {outstanding.map((item, i) => (
                <div key={i} onClick={item.action} style={{display:'flex', alignItems:'center', gap:'12px', padding:'12px 16px', borderBottom: i < outstanding.length - 1 ? `1px solid ${theme.border}` : 'none', cursor:'pointer'}}>
                  <div style={{width:'6px', height:'6px', borderRadius:'50%', background: item.type === 'form' ? theme.gold : item.type === 'error' ? theme.rose : theme.accent, flexShrink:0}}></div>
                  <div style={{fontSize:'13px', color: theme.text, flex:1}}>{item.text}</div>
                  <div style={{fontSize:'12px', color: theme.text3}}>→</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {studentsNearComplete.length > 0 && (
        <div style={{marginBottom:'22px'}}>
          <div style={{fontSize:'14px', fontWeight:'600', color: theme.text, marginBottom:'14px'}}>Almost there 🎯</div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'14px'}}>
            {studentsNearComplete.map(student => {
              const hrs = sessions.filter(s => s.students.includes(student.name) && s.status === 'complete').length
              return (
                <div key={student.id} onClick={() => setPage(`student-${student.id}`)} style={{background: theme.surface, border:`2px solid ${theme.accent}40`, borderRadius:'12px', padding:'16px 18px', cursor:'pointer'}}>
                  <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px'}}>
                    <div style={{width:'32px', height:'32px', borderRadius:'50%', background: theme.accentLight, color: theme.accentText, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:'700'}}>
                      {student.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <div>
                      <div style={{fontSize:'13.5px', fontWeight:'500', color: theme.text}}>{student.name}</div>
                      <div style={{fontSize:'11.5px', color: theme.accentText, fontWeight:'600'}}>{30 - hrs} hours to go</div>
                    </div>
                  </div>
                  <div style={{height:'5px', background: theme.surface2, borderRadius:'3px', overflow:'hidden'}}>
                    <div style={{height:'100%', width:`${Math.round((hrs/30)*100)}%`, background: theme.accent, borderRadius:'3px'}}></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {recentForms.length > 0 && (
        <div>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px'}}>
            <div style={{fontSize:'14px', fontWeight:'600', color: theme.text}}>Recent forms</div>
            <button onClick={() => setPage('reports')} style={{background:'none', border:'none', fontSize:'13px', color: theme.accent, cursor:'pointer', fontWeight:'500'}}>View all →</button>
          </div>
          <div style={{background: theme.surface, border:`1px solid ${theme.border}`, borderRadius:'12px', overflow:'hidden'}}>
            {recentForms.map((f, i) => (
              <div key={f.id} onClick={() => setPage('reports')} style={{display:'flex', alignItems:'center', gap:'14px', padding:'13px 18px', borderBottom: i < recentForms.length - 1 ? `1px solid ${theme.border}` : 'none', cursor:'pointer'}}>
                <div style={{width:'36px', height:'36px', borderRadius:'8px', background: f.status === 'signed' ? theme.accentLight : theme.roseLight, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
                  <svg width="14" height="14" fill="none" stroke={f.status === 'signed' ? theme.accentText : theme.rose} strokeWidth="1.5" viewBox="0 0 16 16">
                    {f.status === 'signed' ? <polyline points="3,8 6.5,11.5 13,5"/> : <><path d="M4 2h8v12H4z"/><line x1="6.5" y1="6" x2="9.5" y2="6"/><line x1="6.5" y1="9" x2="9.5" y2="9"/></>}
                  </svg>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:'13.5px', fontWeight:'500', color: theme.text}}>{f.student_name}</div>
                  <div style={{fontSize:'12px', color: theme.text3, marginTop:'1px'}}>{new Date((f as any).created_at).toLocaleDateString('en-US', {month:'short', day:'numeric'})}</div>
                </div>
                <span style={{fontSize:'11.5px', padding:'3px 10px', borderRadius:'20px', fontWeight:'600', background: f.status === 'signed' ? theme.accentLight : theme.roseLight, color: f.status === 'signed' ? theme.accentText : theme.rose}}>
                  {f.status === 'signed' ? 'Signed' : 'Review'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Sessions({ sessions, setSessions, forms, onNewSession, theme }: { sessions: Session[], setSessions: (s: Session[]) => void, forms: FormTemplate[], onNewSession: () => void, theme: Record<string, string> }) {
  const [uploadingFor, setUploadingFor] = useState<string | null>(null)
  const [recordingUrl, setRecordingUrl] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [processing, setProcessing] = useState<string | null>(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this session?')) return
    const { error } = await supabase.from('sessions').delete().eq('id', id)
    if (!error) setSessions(sessions.filter(s => s.id !== id))
  }

  const handleUploadRecording = async (sessionId: string) => {
    if (!recordingUrl && !selectedFile) { alert('Please enter a recording URL or select a file'); return }
    if (!selectedTemplateId && forms.length > 0) { alert('Please select a form template'); setProcessing(null); return }
    setProcessing(sessionId)
    try {
      const formData = new FormData()
      formData.append('sessionId', sessionId)
      formData.append('templateId', selectedTemplateId)
      if (selectedFile) { formData.append('file', selectedFile) } else { formData.append('recordingUrl', recordingUrl) }
      const response = await fetch('/api/process-recording', { method: 'POST', body: formData })
      const data = await response.json()
      if (data.success) {
        setSessions(sessions.map(s => s.id === sessionId ? { ...s, status: 'processing' } : s))
        setUploadingFor(null)
        setRecordingUrl('')
        setSelectedFile(null)
        setSelectedTemplateId('')
        alert('Recording submitted! Your forms will be ready within 15-20 minutes.')
      } else { alert('Submission failed: ' + (data.error || 'Unknown error')) }
    } catch { alert('Submission failed. Please try again.') }
    setProcessing(null)
  }

  const statusConfig: Record<string, { bg: string, color: string, label: string }> = {
    scheduled: { bg: theme.goldLight, color: theme.gold, label: 'Scheduled' },
    processing: { bg: theme.accentLight, color: theme.accentText, label: 'Processing' },
    complete: { bg: theme.accentLight, color: theme.accentText, label: 'Complete' },
    live: { bg: theme.accentLight, color: theme.accentText, label: 'Live' },
    failed: { bg: theme.roseLight, color: theme.rose, label: 'Failed' },
  }

  const indicatorColor: Record<string, string> = {
    scheduled: theme.gold, processing: theme.accent, complete: '#2D7A52', live: '#5A9E7A', failed: theme.rose,
  }

  return (
    <div>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'28px'}}>
        <div>
          <div style={{fontSize:'12px', color: theme.text3, marginBottom:'4px', textTransform:'uppercase', letterSpacing:'0.6px'}}>All sessions</div>
          <div style={{fontSize:'28px', fontWeight:'700', color: theme.text, letterSpacing:'-0.5px'}}>Sessions</div>
        </div>
        <button onClick={onNewSession} style={{background: theme.accent, color:'white', border:'none', borderRadius:'9px', padding:'10px 20px', fontSize:'13.5px', fontWeight:'600', cursor:'pointer'}}>+ New session</button>
      </div>
      {sessions.length === 0 ? (
        <EmptyState message="No sessions yet" sub="Sessions you create will appear here" action="Create your first session" onAction={onNewSession} theme={theme} />
      ) : (
        sessions.map(s => (
          <div key={s.id}>
            <div style={{background: theme.surface, border:`1px solid ${theme.border}`, borderRadius:'12px', padding:'16px 20px', display:'flex', alignItems:'center', gap:'14px', marginBottom: uploadingFor === s.id ? '0' : '10px', borderBottomLeftRadius: uploadingFor === s.id ? '0' : '12px', borderBottomRightRadius: uploadingFor === s.id ? '0' : '12px'}}>
              <div style={{width:'3px', height:'46px', borderRadius:'2px', background: indicatorColor[s.status] || theme.gold, flexShrink:0}}></div>
              <div style={{flex:1}}>
                <div style={{fontSize:'14px', fontWeight:'500', color: theme.text}}>{s.name}</div>
                <div style={{fontSize:'12.5px', color: theme.text2, marginTop:'2px'}}>{s.date} · {s.time} · {s.students.join(', ')}</div>
                {s.status === 'processing' && <div style={{fontSize:'11.5px', color: theme.accentText, marginTop:'3px'}}>Transcribing — forms will appear automatically when ready</div>}
                {s.status === 'failed' && <div style={{fontSize:'11.5px', color: theme.rose, marginTop:'3px'}}>Processing failed — try uploading the recording again</div>}
              </div>
              <span style={{fontSize:'11.5px', padding:'4px 12px', borderRadius:'20px', fontWeight:'600', background: statusConfig[s.status]?.bg || theme.goldLight, color: statusConfig[s.status]?.color || theme.gold}}>
                {statusConfig[s.status]?.label || s.status}
              </span>
              {(s.status === 'scheduled' || s.status === 'failed') && (
                <button onClick={() => setUploadingFor(uploadingFor === s.id ? null : s.id)} style={{background: theme.accentLight, border:'none', borderRadius:'8px', padding:'7px 14px', fontSize:'12.5px', color: theme.accentText, cursor:'pointer', fontWeight:'600', whiteSpace:'nowrap'}}>
                  + Add recording
                </button>
              )}
              <button onClick={() => handleDelete(s.id)} style={{background:'none', border:'none', cursor:'pointer', color: theme.text3, padding:'4px', borderRadius:'4px', flexShrink:0}}>
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 16 16"><polyline points="2,4 14,4"/><path d="M5 4V2h6v2"/><path d="M3 4l1 10h8l1-10"/></svg>
              </button>
            </div>
            {uploadingFor === s.id && (
              <div style={{background: theme.surface2, border:`1px solid ${theme.border}`, borderTop:'none', borderBottomLeftRadius:'12px', borderBottomRightRadius:'12px', padding:'18px 20px', marginBottom:'10px'}}>
                <div style={{fontSize:'13px', fontWeight:'600', color: theme.text, marginBottom:'14px'}}>Add session recording</div>
                {forms.length > 0 ? (
                  <div style={{marginBottom:'14px'}}>
                    <div style={{fontSize:'12px', color: theme.text2, marginBottom:'6px', fontWeight:'500'}}>Select form template:</div>
                    <select value={selectedTemplateId} onChange={e => setSelectedTemplateId(e.target.value)} style={{width:'100%', padding:'9px 12px', border:`1px solid ${theme.border2}`, borderRadius:'8px', fontSize:'13px', fontFamily:'system-ui', outline:'none', color: theme.text, background: theme.surface}}>
                      <option value="">Choose a template...</option>
                      {forms.map(f => <option key={f.id} value={f.id}>{f.name} — {f.fields.length} fields</option>)}
                    </select>
                  </div>
                ) : (
                  <div style={{background: theme.goldLight, border:`1px solid ${theme.gold}40`, borderRadius:'8px', padding:'10px 14px', marginBottom:'14px', fontSize:'12.5px', color: theme.gold}}>
                    No form templates yet — upload one in Form templates first
                  </div>
                )}
                <div style={{fontSize:'12px', color: theme.text2, marginBottom:'8px', fontWeight:'500'}}>Upload recording file:</div>
                <div style={{border:`1.5px dashed ${theme.border2}`, borderRadius:'8px', padding:'18px', textAlign:'center', background: theme.surface, cursor:'pointer', marginBottom:'12px'}} onClick={() => document.getElementById(`file-input-${s.id}`)?.click()}>
                  <div style={{fontSize:'13px', color: theme.text2, fontWeight:'500'}}>{selectedFile ? `✓ ${selectedFile.name}` : 'Click to select recording file'}</div>
                  <div style={{fontSize:'11.5px', color: theme.text3, marginTop:'2px'}}>MP4, MOV, M4A, MP3, or WAV</div>
                  <input id={`file-input-${s.id}`} type="file" accept=".mp4,.mov,.m4a,.mp3,.wav" style={{display:'none'}} onChange={e => { const file = e.target.files?.[0]; if (file) { setSelectedFile(file); setRecordingUrl('') } }} />
                </div>
                <div style={{fontSize:'12px', color: theme.text2, marginBottom:'8px', fontWeight:'500'}}>Or paste a direct link:</div>
                <input value={recordingUrl} onChange={e => { setRecordingUrl(e.target.value); setSelectedFile(null) }} placeholder="Paste direct audio/video URL..." style={{width:'100%', padding:'9px 12px', border:`1px solid ${theme.border2}`, borderRadius:'8px', fontSize:'13px', fontFamily:'system-ui', outline:'none', color: theme.text, background: theme.surface, marginBottom:'12px', boxSizing:'border-box'}} />
                <button onClick={() => handleUploadRecording(s.id)} disabled={processing === s.id} style={{background: theme.accent, color:'white', border:'none', borderRadius:'8px', padding:'10px 20px', fontSize:'13.5px', fontWeight:'600', cursor:'pointer', opacity: processing === s.id ? 0.7 : 1}}>
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

function Reports({ generatedForms, sessions, setGeneratedForms, theme }: { generatedForms: GeneratedForm[], sessions: Session[], setGeneratedForms: (f: GeneratedForm[]) => void, theme: Record<string, string> }) {
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
      const response = await fetch('/api/export-form', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ studentName: form.student_name, sessionName, formData: form.form_data }) })
      if (!response.ok) throw new Error('Export failed')
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${form.student_name}-supervision-form.docx`
      a.click()
      URL.revokeObjectURL(url)
    } catch { alert('Download failed. Please try again.') }
    setDownloading(false)
  }

  const getSessionName = (sessionId: string) => sessions.find(s => s.id === sessionId)?.name || 'Session'

  if (selectedForm) {
    return (
      <div>
        <button onClick={() => setSelectedForm(null)} style={{background:'none', border:'none', cursor:'pointer', color: theme.text2, fontSize:'13.5px', marginBottom:'20px', display:'flex', alignItems:'center', gap:'6px', padding:0}}>← Back to forms</button>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'24px'}}>
          <div>
            <div style={{fontSize:'12px', color: theme.text3, marginBottom:'4px', textTransform:'uppercase', letterSpacing:'0.6px'}}>{getSessionName(selectedForm.session_id)}</div>
            <div style={{fontSize:'26px', fontWeight:'700', color: theme.text, letterSpacing:'-0.5px'}}>{selectedForm.student_name}</div>
            <div style={{fontSize:'13.5px', color: theme.text2, marginTop:'3px'}}>Auto-filled supervision form</div>
          </div>
          <div style={{display:'flex', gap:'10px'}}>
            <button onClick={() => handleDownload(selectedForm)} disabled={downloading} style={{background: theme.surface, color: theme.accent, border:`1.5px solid ${theme.accent}`, borderRadius:'9px', padding:'10px 18px', fontSize:'13.5px', fontWeight:'600', cursor:'pointer', opacity: downloading ? 0.7 : 1}}>
              {downloading ? 'Preparing...' : '↓ Download Word doc'}
            </button>
            {selectedForm.status === 'pending' && (
              <button onClick={() => handleSign(selectedForm.id)} style={{background: theme.accent, color:'white', border:'none', borderRadius:'9px', padding:'10px 18px', fontSize:'13.5px', fontWeight:'600', cursor:'pointer'}}>✓ Mark as reviewed</button>
            )}
          </div>
        </div>
        <div style={{background: theme.surface, border:`1px solid ${theme.border}`, borderRadius:'12px', padding:'26px 28px'}}>
          {Object.entries(selectedForm.form_data).map(([key, value], i, arr) => (
            <div key={key} style={{marginBottom: i < arr.length - 1 ? '22px' : '0', paddingBottom: i < arr.length - 1 ? '22px' : '0', borderBottom: i < arr.length - 1 ? `1px solid ${theme.border}` : 'none'}}>
              <div style={{fontSize:'10.5px', textTransform:'uppercase', letterSpacing:'0.8px', color: theme.text3, fontWeight:'700', marginBottom:'7px'}}>{key}</div>
              <div style={{fontSize:'14.5px', color: theme.text, lineHeight:'1.7'}}>{value}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{fontSize:'12px', color: theme.text3, marginBottom:'4px', textTransform:'uppercase', letterSpacing:'0.6px'}}>Documents</div>
      <div style={{fontSize:'28px', fontWeight:'700', color: theme.text, marginBottom:'6px', letterSpacing:'-0.5px'}}>Ready to review</div>
      <div style={{fontSize:'13.5px', color: theme.text2, marginBottom:'24px'}}>Auto-filled forms — review on screen or download as a Word document</div>
      {pending.length === 0 && signed.length === 0 ? (
        <EmptyState message="No forms yet" sub="Forms will appear here after session recordings are processed" theme={theme} />
      ) : (
        <>
          {pending.length > 0 && (
            <>
              <div style={{fontSize:'13px', fontWeight:'600', color: theme.text, marginBottom:'12px'}}>Awaiting review</div>
              {pending.map(f => (
                <div key={f.id} style={{background: theme.surface, border:`1px solid ${theme.border}`, borderRadius:'12px', padding:'16px 20px', display:'flex', alignItems:'center', gap:'14px', marginBottom:'10px'}}>
                  <div style={{width:'40px', height:'40px', borderRadius:'9px', background: theme.roseLight, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
                    <svg width="16" height="16" fill="none" stroke={theme.rose} strokeWidth="1.5" viewBox="0 0 16 16"><path d="M4 2h8v12H4z"/><line x1="6.5" y1="6" x2="9.5" y2="6"/><line x1="6.5" y1="9" x2="9.5" y2="9"/></svg>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:'14px', fontWeight:'500', color: theme.text}}>{f.student_name}</div>
                    <div style={{fontSize:'12.5px', color: theme.text2, marginTop:'2px'}}>{getSessionName(f.session_id)}</div>
                  </div>
                  <button onClick={() => handleDownload(f)} style={{background:'none', border:`1px solid ${theme.border2}`, borderRadius:'8px', padding:'7px 14px', fontSize:'12.5px', color: theme.text2, cursor:'pointer', fontWeight:'500'}}>↓ Download</button>
                  <button onClick={() => setSelectedForm(f)} style={{background: theme.roseLight, border:'none', borderRadius:'8px', padding:'7px 14px', fontSize:'12.5px', color: theme.rose, cursor:'pointer', fontWeight:'600'}}>Review</button>
                </div>
              ))}
            </>
          )}
          {signed.length > 0 && (
            <>
              <div style={{fontSize:'13px', fontWeight:'600', color: theme.text, margin:'22px 0 12px'}}>Reviewed</div>
              {signed.map(f => (
                <div key={f.id} style={{background: theme.surface, border:`1px solid ${theme.border}`, borderRadius:'12px', padding:'16px 20px', display:'flex', alignItems:'center', gap:'14px', marginBottom:'10px'}}>
                  <div style={{width:'40px', height:'40px', borderRadius:'9px', background: theme.accentLight, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
                    <svg width="16" height="16" fill="none" stroke={theme.accentText} strokeWidth="1.5" viewBox="0 0 16 16"><polyline points="3,8 6.5,11.5 13,5"/></svg>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:'14px', fontWeight:'500', color: theme.text}}>{f.student_name}</div>
                    <div style={{fontSize:'12.5px', color: theme.text2, marginTop:'2px'}}>{getSessionName(f.session_id)}</div>
                  </div>
                  <button onClick={() => handleDownload(f)} style={{background:'none', border:`1px solid ${theme.border2}`, borderRadius:'8px', padding:'7px 14px', fontSize:'12.5px', color: theme.text2, cursor:'pointer', fontWeight:'500'}}>↓ Download</button>
                  <button onClick={() => setSelectedForm(f)} style={{background:'none', border:`1px solid ${theme.border2}`, borderRadius:'8px', padding:'7px 14px', fontSize:'12.5px', color: theme.text2, cursor:'pointer', fontWeight:'500'}}>View</button>
                </div>
              ))}
            </>
          )}
        </>
      )}
    </div>
  )
}

function Forms({ forms, setForms, onUpload, theme }: { forms: FormTemplate[], setForms: (f: FormTemplate[]) => void, onUpload: () => void, theme: Record<string, string> }) {
  const [selectedForm, setSelectedForm] = useState<FormTemplate | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this form template?')) return
    await supabase.from('form_templates').delete().eq('id', id)
    setForms(forms.filter(f => f.id !== id))
  }

  if (selectedForm) {
    return (
      <div>
        <button onClick={() => setSelectedForm(null)} style={{background:'none', border:'none', cursor:'pointer', color: theme.text2, fontSize:'13.5px', marginBottom:'20px', display:'flex', alignItems:'center', gap:'6px', padding:0}}>← Back to templates</button>
        <div style={{marginBottom:'24px'}}>
          <div style={{fontSize:'12px', color: theme.text3, marginBottom:'4px', textTransform:'uppercase', letterSpacing:'0.6px'}}>Form template</div>
          <div style={{fontSize:'28px', fontWeight:'700', color: theme.text, letterSpacing:'-0.5px'}}>{selectedForm.name}</div>
          <div style={{fontSize:'13.5px', color: theme.text2, marginTop:'3px'}}>{selectedForm.fields.length} fields detected</div>
        </div>
        <div style={{background: theme.surface, border:`1px solid ${theme.border}`, borderRadius:'12px', padding:'24px 26px'}}>
          <div style={{fontSize:'13px', fontWeight:'600', color: theme.text, marginBottom:'16px'}}>Detected fields</div>
          {selectedForm.fields.map((field, i) => (
            <div key={i} style={{display:'flex', alignItems:'center', gap:'12px', padding:'12px 0', borderBottom: i < selectedForm.fields.length - 1 ? `1px solid ${theme.border}` : 'none'}}>
              <div style={{width:'26px', height:'26px', borderRadius:'50%', background: theme.accentLight, color: theme.accentText, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:'700', flexShrink:0}}>{i + 1}</div>
              <div style={{fontSize:'14px', color: theme.text, flex:1}}>{field}</div>
              <div style={{fontSize:'11.5px', color: theme.text3, background: theme.surface2, padding:'3px 10px', borderRadius:'20px'}}>AI will fill this</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'28px'}}>
        <div>
          <div style={{fontSize:'12px', color: theme.text3, marginBottom:'4px', textTransform:'uppercase', letterSpacing:'0.6px'}}>Templates</div>
          <div style={{fontSize:'28px', fontWeight:'700', color: theme.text, letterSpacing:'-0.5px'}}>Form templates</div>
          <div style={{fontSize:'13.5px', color: theme.text2, marginTop:'3px'}}>Upload your supervision form — Supervisio reads the fields and fills them automatically</div>
        </div>
        <button onClick={onUpload} style={{background: theme.accent, color:'white', border:'none', borderRadius:'9px', padding:'10px 20px', fontSize:'13.5px', fontWeight:'600', cursor:'pointer'}}>+ Upload form</button>
      </div>
      {forms.length === 0 ? (
        <EmptyState message="No form templates yet" sub="Upload your supervision form and Supervisio will learn what to fill in" action="Upload a form" onAction={onUpload} theme={theme} />
      ) : (
        <div className="form-grid" style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'14px'}}>
          {forms.map(f => (
            <div key={f.id} style={{background: theme.surface, border:`1px solid ${theme.border}`, borderRadius:'12px', padding:'20px 22px', cursor:'pointer'}} onClick={() => setSelectedForm(f)}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'14px'}}>
                <div style={{width:'38px', height:'38px', borderRadius:'9px', background: theme.accentLight, display:'flex', alignItems:'center', justifyContent:'center'}}>
                  <svg width="16" height="16" fill="none" stroke={theme.accentText} strokeWidth="1.5" viewBox="0 0 16 16"><path d="M9 2H4a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V6L9 2z"/><polyline points="9,2 9,6 13,6"/></svg>
                </div>
                <button onClick={e => { e.stopPropagation(); handleDelete(f.id) }} style={{background:'none', border:'none', cursor:'pointer', color: theme.text3, padding:'2px'}}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 16 16"><polyline points="2,4 14,4"/><path d="M5 4V2h6v2"/><path d="M3 4l1 10h8l1-10"/></svg>
                </button>
              </div>
              <div style={{fontSize:'14px', fontWeight:'500', color: theme.text, marginBottom:'4px'}}>{f.name}</div>
              <div style={{fontSize:'12px', color: theme.text3}}>{f.fields.length} fields · Click to view</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StudentsPage({ students, sessions, onNewStudent, setPage, theme }: { students: Student[], sessions: Session[], onNewStudent: () => void, setPage: (p: string) => void, theme: Record<string, string> }) {
  return (
    <div>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'28px'}}>
        <div>
          <div style={{fontSize:'12px', color: theme.text3, marginBottom:'4px', textTransform:'uppercase', letterSpacing:'0.6px'}}>All students</div>
          <div style={{fontSize:'28px', fontWeight:'700', color: theme.text, letterSpacing:'-0.5px'}}>Students</div>
        </div>
        <button onClick={onNewStudent} style={{background: theme.accent, color:'white', border:'none', borderRadius:'9px', padding:'10px 20px', fontSize:'13.5px', fontWeight:'600', cursor:'pointer'}}>+ Add student</button>
      </div>
      {students.length === 0 ? (
        <EmptyState message="No students yet" sub="Add your first student to get started" action="Add student" onAction={onNewStudent} theme={theme} />
      ) : (
        <div className="student-grid" style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'14px'}}>
          {students.map(student => {
            const studentSessions = sessions.filter(s => s.students.includes(student.name))
            const completedSessions = studentSessions.filter(s => s.status === 'complete')
            const hours = completedSessions.length
            const percent = Math.round(Math.min((hours / 30) * 100, 100))
            const nextSession = studentSessions.find(s => s.status === 'scheduled')
            return (
              <div key={student.id} onClick={() => setPage(`student-${student.id}`)} style={{background: theme.surface, border:`1px solid ${theme.border}`, borderRadius:'12px', padding:'20px 22px', cursor:'pointer'}}>
                <div style={{display:'flex', alignItems:'center', gap:'12px', marginBottom:'16px'}}>
                  <div style={{width:'42px', height:'42px', borderRadius:'50%', background: theme.accentLight, color: theme.accentText, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:'700'}}>
                    {student.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </div>
                  <div>
                    <div style={{fontSize:'14px', fontWeight:'500', color: theme.text}}>{student.name}</div>
                    <div style={{fontSize:'12px', color: theme.text3}}>{student.program}</div>
                  </div>
                </div>
                <div style={{marginBottom:'8px'}}>
                  <div style={{display:'flex', justifyContent:'space-between', marginBottom:'6px'}}>
                    <span style={{fontSize:'12px', color: theme.text2}}>Supervision hours</span>
                    <span style={{fontSize:'12px', fontWeight:'600', color: theme.text}}>{hours} / 30</span>
                  </div>
                  <div style={{height:'5px', background: theme.surface2, borderRadius:'3px', overflow:'hidden'}}>
                    <div style={{height:'100%', width:`${percent}%`, background: percent >= 80 ? '#2D7A52' : percent >= 50 ? '#5A9E7A' : theme.gold, borderRadius:'3px'}}></div>
                  </div>
                </div>
                <div style={{fontSize:'12px', color: theme.text3}}>{nextSession ? `Next: ${nextSession.date} · ${nextSession.time}` : 'No upcoming sessions'}</div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function StudentFile({ student, sessions, generatedForms, theme }: { student: Student | null, sessions: Session[], generatedForms: GeneratedForm[], theme: Record<string, string> }) {
  if (!student) return <EmptyState message="Student not found" sub="This student may have been removed" theme={theme} />
  const completedSessions = sessions.filter(s => s.status === 'complete')
  const hours = completedSessions.length
  const percent = Math.round(Math.min((hours / 30) * 100, 100))
  const studentForms = generatedForms.filter(f => f.student_name === student.name)

  return (
    <div>
      <div style={{display:'flex', alignItems:'center', gap:'18px', marginBottom:'30px'}}>
        <div style={{width:'56px', height:'56px', borderRadius:'50%', background: theme.accentLight, color: theme.accentText, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'17px', fontWeight:'700'}}>
          {student.name.split(' ').map(n => n[0]).join('').toUpperCase()}
        </div>
        <div>
          <div style={{fontSize:'28px', fontWeight:'700', color: theme.text, letterSpacing:'-0.5px'}}>{student.name}</div>
          <div style={{fontSize:'13.5px', color: theme.text2}}>{student.program}</div>
        </div>
      </div>
      <div className="four-col" style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'14px', marginBottom:'26px'}}>
        {[
          {label:'Hours completed', value:`${hours}`},
          {label:'Hours remaining', value:`${Math.max(30 - hours, 0)}`},
          {label:'Sessions total', value:`${sessions.length}`},
          {label:'Forms generated', value:`${studentForms.length}`},
        ].map(s => (
          <div key={s.label} style={{background: theme.surface, border:`1px solid ${theme.border}`, borderRadius:'12px', padding:'18px 20px'}}>
            <div style={{fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.7px', color: theme.text3, marginBottom:'10px', fontWeight:'600'}}>{s.label}</div>
            <div style={{fontSize:'32px', fontWeight:'700', color: theme.text, lineHeight:1, letterSpacing:'-1px'}}>{s.value}</div>
          </div>
        ))}
      </div>
      <div style={{background: theme.surface, border:`1px solid ${theme.border}`, borderRadius:'12px', padding:'22px 24px', marginBottom:'26px'}}>
        <div style={{display:'flex', justifyContent:'space-between', marginBottom:'10px'}}>
          <span style={{fontSize:'13.5px', fontWeight:'600', color: theme.text}}>Progress toward 30 hours</span>
          <span style={{fontSize:'13.5px', color: theme.text2, fontWeight:'500'}}>{percent}%</span>
        </div>
        <div style={{height:'8px', background: theme.surface2, borderRadius:'4px', overflow:'hidden'}}>
          <div style={{height:'100%', width:`${percent}%`, background: percent >= 80 ? '#2D7A52' : percent >= 50 ? '#5A9E7A' : theme.gold, borderRadius:'4px'}}></div>
        </div>
        <div style={{fontSize:'12.5px', color: theme.text3, marginTop:'7px'}}>{hours} of 30 hours completed · {Math.max(30 - hours, 0)} hours remaining</div>
      </div>
      <div style={{fontSize:'14px', fontWeight:'600', color: theme.text, marginBottom:'14px'}}>Session history</div>
      {sessions.length === 0 ? (
        <EmptyState message="No sessions yet" sub="Sessions with this student will appear here" theme={theme} />
      ) : (
        sessions.map(s => (
          <div key={s.id} style={{background: theme.surface, border:`1px solid ${theme.border}`, borderRadius:'12px', padding:'14px 20px', display:'flex', alignItems:'center', gap:'14px', marginBottom:'10px'}}>
            <div style={{width:'3px', height:'46px', borderRadius:'2px', background: s.status === 'complete' ? '#2D7A52' : theme.gold, flexShrink:0}}></div>
            <div style={{flex:1}}>
              <div style={{fontSize:'14px', fontWeight:'500', color: theme.text}}>{s.name}</div>
              <div style={{fontSize:'12.5px', color: theme.text2, marginTop:'2px'}}>{s.date} · {s.time}</div>
            </div>
            <span style={{fontSize:'12px', padding:'4px 12px', borderRadius:'20px', fontWeight:'600', background: s.status === 'complete' ? theme.accentLight : theme.goldLight, color: s.status === 'complete' ? theme.accentText : theme.gold}}>
              {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
            </span>
          </div>
        ))
      )}
    </div>
  )
}

function SettingsPage({ theme }: { theme: Record<string, string> }) {
  const [toggles, setToggles] = useState({ autoGenerate: true, emailForms: false, reminders: true, formAlerts: true })
  const toggle = (key: keyof typeof toggles) => setToggles(prev => ({ ...prev, [key]: !prev[key] }))

  return (
    <div>
      <div style={{fontSize:'12px', color: theme.text3, marginBottom:'4px', textTransform:'uppercase', letterSpacing:'0.6px'}}>Account</div>
      <div style={{fontSize:'28px', fontWeight:'700', color: theme.text, marginBottom:'24px', letterSpacing:'-0.5px'}}>Settings</div>
      {[
        {title:'Processing', items:[
          {key:'autoGenerate', label:'Auto-generate forms after upload', desc:'Forms are drafted as soon as recording is processed'},
          {key:'emailForms', label:'Email draft forms for review', desc:'Receive a copy at your registered email address'},
        ]},
        {title:'Notifications', items:[
          {key:'reminders', label:'Session reminders', desc:'30 minutes before each scheduled session'},
          {key:'formAlerts', label:'Form ready alerts', desc:'Notified as soon as forms are ready to review'},
        ]},
      ].map(section => (
        <div key={section.title} style={{background: theme.surface, border:`1px solid ${theme.border}`, borderRadius:'12px', marginBottom:'14px', overflow:'hidden'}}>
          <div style={{fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.8px', color: theme.text3, fontWeight:'700', padding:'16px 22px 12px', borderBottom:`1px solid ${theme.border}`}}>{section.title}</div>
          {section.items.map((item, i) => (
            <div key={item.key} style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 22px', borderBottom: i < section.items.length - 1 ? `1px solid ${theme.border}` : 'none'}}>
              <div>
                <div style={{fontSize:'14px', fontWeight:'500', color: theme.text}}>{item.label}</div>
                <div style={{fontSize:'12.5px', color: theme.text3, marginTop:'2px'}}>{item.desc}</div>
              </div>
              <div onClick={() => toggle(item.key as keyof typeof toggles)} style={{width:'40px', height:'23px', borderRadius:'12px', background: toggles[item.key as keyof typeof toggles] ? theme.accent : theme.border2, position:'relative', cursor:'pointer', flexShrink:0, transition:'background 0.2s'}}>
                <div style={{width:'17px', height:'17px', background:'white', borderRadius:'50%', position:'absolute', top:'3px', right: toggles[item.key as keyof typeof toggles] ? '3px' : 'auto', left: toggles[item.key as keyof typeof toggles] ? 'auto' : '3px', transition:'all 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)'}}></div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

function EmptyState({ message, sub, action, onAction, theme }: { message: string, sub: string, action?: string, onAction?: () => void, theme: Record<string, string> }) {
  return (
    <div style={{textAlign:'center', padding:'72px 20px'}}>
      <div style={{width:'52px', height:'52px', borderRadius:'50%', border:`2px solid ${theme.border2}`, margin:'0 auto 18px', display:'flex', alignItems:'center', justifyContent:'center'}}>
        <div style={{width:'10px', height:'10px', borderRadius:'50%', background: theme.border2}}></div>
      </div>
      <div style={{fontSize:'16px', fontWeight:'600', color: theme.text, marginBottom:'7px'}}>{message}</div>
      <div style={{fontSize:'13.5px', color: theme.text3, marginBottom: action ? '22px' : '0'}}>{sub}</div>
      {action && onAction && (
        <button onClick={onAction} style={{background: theme.accent, color:'white', border:'none', borderRadius:'9px', padding:'10px 22px', fontSize:'13.5px', fontWeight:'600', cursor:'pointer'}}>{action}</button>
      )}
    </div>
  )
}

function NewSessionModal({ onClose, onCreate, theme }: { onClose: () => void, onCreate: (session: Omit<Session, 'id'>) => void, theme: Record<string, string> }) {
  const [name, setName] = useState('')
  const [students, setStudents] = useState('')
  const [selectedDay, setSelectedDay] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedHour, setSelectedHour] = useState('')
  const [selectedMinute, setSelectedMinute] = useState('')
  const [selectedAmPm, setSelectedAmPm] = useState('AM')

  const months = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const currentYear = new Date().getFullYear()
  const years = Array.from({length: 3}, (_, i) => currentYear + i)
  const days = Array.from({length: 31}, (_, i) => i + 1)
  const hours = Array.from({length: 12}, (_, i) => i + 1)
  const minutes = ['00', '15', '30', '45']

  const handleCreate = () => {
    if (!name || !selectedDay || !selectedMonth || !selectedYear || !selectedHour || !selectedMinute) {
      alert('Please fill in all fields including date and time')
      return
    }
    const monthNum = (months.indexOf(selectedMonth) + 1).toString().padStart(2, '0')
    const dayNum = selectedDay.padStart(2, '0')
    const date = `${selectedYear}-${monthNum}-${dayNum}`
    let hour = parseInt(selectedHour)
    if (selectedAmPm === 'PM' && hour !== 12) hour += 12
    if (selectedAmPm === 'AM' && hour === 12) hour = 0
    const time = `${hour.toString().padStart(2, '0')}:${selectedMinute}`
    onCreate({ name, date, time, zoom_link: '', recording_url: '', transcript_id: '', form_template_id: '', students: students.split(',').map(s => s.trim()).filter(Boolean), status: 'scheduled' })
    onClose()
  }

  const selectStyle = {
    padding:'10px 13px', border:`1px solid ${theme.border2}`, borderRadius:'9px', fontSize:'14px',
    fontFamily:'system-ui', outline:'none', color: theme.text, background: theme.surface, cursor:'pointer'
  }

  return (
    <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100}} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{background: theme.surface, borderRadius:'14px', padding:'30px 32px', width:'500px', maxWidth:'95vw', border:`1px solid ${theme.border}`}}>
        <div style={{fontSize:'21px', fontWeight:'700', color: theme.text, marginBottom:'4px', letterSpacing:'-0.3px'}}>New supervision session</div>
        <div style={{fontSize:'13px', color: theme.text3, marginBottom:'26px'}}>Schedule a session and add the recording afterwards</div>

        <div style={{marginBottom:'16px'}}>
          <label style={{display:'block', fontSize:'11.5px', textTransform:'uppercase', letterSpacing:'0.5px', color: theme.text2, fontWeight:'700', marginBottom:'6px'}}>Session name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Group supervision — session 1" style={{width:'100%', padding:'10px 13px', border:`1px solid ${theme.border2}`, borderRadius:'9px', fontSize:'14px', fontFamily:'system-ui', outline:'none', color: theme.text, background: theme.surface, boxSizing:'border-box'}} />
        </div>

        <div style={{marginBottom:'16px'}}>
          <label style={{display:'block', fontSize:'11.5px', textTransform:'uppercase', letterSpacing:'0.5px', color: theme.text2, fontWeight:'700', marginBottom:'6px'}}>Students (comma separated)</label>
          <input value={students} onChange={e => setStudents(e.target.value)} placeholder="e.g. Maya Adeyemi, Jordan Bassett" style={{width:'100%', padding:'10px 13px', border:`1px solid ${theme.border2}`, borderRadius:'9px', fontSize:'14px', fontFamily:'system-ui', outline:'none', color: theme.text, background: theme.surface, boxSizing:'border-box'}} />
        </div>

        <div style={{marginBottom:'16px'}}>
          <label style={{display:'block', fontSize:'11.5px', textTransform:'uppercase', letterSpacing:'0.5px', color: theme.text2, fontWeight:'700', marginBottom:'6px'}}>Date</label>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1.5fr 1fr', gap:'8px'}}>
            <select value={selectedDay} onChange={e => setSelectedDay(e.target.value)} style={selectStyle}>
              <option value="">Day</option>
              {days.map(d => <option key={d} value={d.toString()}>{d}</option>)}
            </select>
            <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} style={selectStyle}>
              <option value="">Month</option>
              {months.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} style={selectStyle}>
              <option value="">Year</option>
              {years.map(y => <option key={y} value={y.toString()}>{y}</option>)}
            </select>
          </div>
        </div>

        <div style={{marginBottom:'16px'}}>
          <label style={{display:'block', fontSize:'11.5px', textTransform:'uppercase', letterSpacing:'0.5px', color: theme.text2, fontWeight:'700', marginBottom:'6px'}}>Time</label>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px'}}>
            <select value={selectedHour} onChange={e => setSelectedHour(e.target.value)} style={selectStyle}>
              <option value="">Hour</option>
              {hours.map(h => <option key={h} value={h.toString()}>{h}</option>)}
            </select>
            <select value={selectedMinute} onChange={e => setSelectedMinute(e.target.value)} style={selectStyle}>
              <option value="">Minute</option>
              {minutes.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select value={selectedAmPm} onChange={e => setSelectedAmPm(e.target.value)} style={selectStyle}>
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
          </div>
        </div>

        <div style={{display:'flex', gap:'10px', justifyContent:'flex-end', marginTop:'22px', paddingTop:'20px', borderTop:`1px solid ${theme.border}`}}>
          <button onClick={onClose} style={{background:'none', border:`1px solid ${theme.border2}`, borderRadius:'9px', padding:'10px 18px', fontSize:'13.5px', cursor:'pointer', color: theme.text2}}>Cancel</button>
          <button onClick={handleCreate} style={{background: theme.accent, color:'white', border:'none', borderRadius:'9px', padding:'10px 20px', fontSize:'13.5px', fontWeight:'600', cursor:'pointer'}}>Create session</button>
        </div>
      </div>
    </div>
  )
}

function NewStudentModal({ onClose, onCreate, theme }: { onClose: () => void, onCreate: (student: Omit<Student, 'id' | 'created_at'>) => void, theme: Record<string, string> }) {
  const [name, setName] = useState('')
  const [program, setProgram] = useState('')

  const handleCreate = () => {
    if (!name || !program) { alert('Please fill in student name and program'); return }
    onCreate({ name, program, supervisor_id: '' })
    onClose()
  }

  return (
    <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100}} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{background: theme.surface, borderRadius:'14px', padding:'30px 32px', width:'440px', maxWidth:'95vw', border:`1px solid ${theme.border}`}}>
        <div style={{fontSize:'21px', fontWeight:'700', color: theme.text, marginBottom:'4px', letterSpacing:'-0.3px'}}>Add student</div>
        <div style={{fontSize:'13px', color: theme.text3, marginBottom:'26px'}}>Create a file for a new student</div>
        <div style={{marginBottom:'16px'}}>
          <label style={{display:'block', fontSize:'11.5px', textTransform:'uppercase', letterSpacing:'0.5px', color: theme.text2, fontWeight:'700', marginBottom:'6px'}}>Full name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Maya Adeyemi" style={{width:'100%', padding:'10px 13px', border:`1px solid ${theme.border2}`, borderRadius:'9px', fontSize:'14px', fontFamily:'system-ui', outline:'none', color: theme.text, background: theme.surface, boxSizing:'border-box'}} />
        </div>
        <div style={{marginBottom:'16px'}}>
          <label style={{display:'block', fontSize:'11.5px', textTransform:'uppercase', letterSpacing:'0.5px', color: theme.text2, fontWeight:'700', marginBottom:'6px'}}>Program</label>
          <input value={program} onChange={e => setProgram(e.target.value)} placeholder="e.g. Yorkville MACP" style={{width:'100%', padding:'10px 13px', border:`1px solid ${theme.border2}`, borderRadius:'9px', fontSize:'14px', fontFamily:'system-ui', outline:'none', color: theme.text, background: theme.surface, boxSizing:'border-box'}} />
        </div>
        <div style={{display:'flex', gap:'10px', justifyContent:'flex-end', marginTop:'22px', paddingTop:'20px', borderTop:`1px solid ${theme.border}`}}>
          <button onClick={onClose} style={{background:'none', border:`1px solid ${theme.border2}`, borderRadius:'9px', padding:'10px 18px', fontSize:'13.5px', cursor:'pointer', color: theme.text2}}>Cancel</button>
          <button onClick={handleCreate} style={{background: theme.accent, color:'white', border:'none', borderRadius:'9px', padding:'10px 20px', fontSize:'13.5px', fontWeight:'600', cursor:'pointer'}}>Add student</button>
        </div>
      </div>
    </div>
  )
}

function UploadFormModal({ onClose, onUpload, theme }: { onClose: () => void, onUpload: (form: Omit<FormTemplate, 'id'>) => void, theme: Record<string, string> }) {
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
        const response = await fetch('/api/parse-form', { method: 'POST', body: formData })
        const data = await response.json()
        if (data.fields && data.fields.length > 0) {
          onUpload({ name, fields: data.fields })
          alert(`Form parsed — ${data.fields.length} fields detected`)
        } else {
          onUpload({ name, fields: ['Student name', 'Session date', 'Duration', 'Case presented', 'Theoretical approach', 'Supervisor observations', 'Goals for next session', 'Supervisor signature'] })
        }
      } else {
        onUpload({ name, fields: ['Student name', 'Session date', 'Duration', 'Case presented', 'Theoretical approach', 'Supervisor observations', 'Goals for next session', 'Supervisor signature'] })
      }
    } catch {
      onUpload({ name, fields: ['Student name', 'Session date', 'Duration', 'Case presented', 'Theoretical approach', 'Supervisor observations', 'Goals for next session', 'Supervisor signature'] })
    }
    setParsing(false)
    onClose()
  }

  return (
    <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100}} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{background: theme.surface, borderRadius:'14px', padding:'30px 32px', width:'480px', maxWidth:'95vw', border:`1px solid ${theme.border}`}}>
        <div style={{fontSize:'21px', fontWeight:'700', color: theme.text, marginBottom:'4px', letterSpacing:'-0.3px'}}>Upload form template</div>
        <div style={{fontSize:'13px', color: theme.text3, marginBottom:'26px'}}>Upload your Word doc — Supervisio reads the fields automatically</div>
        <div style={{marginBottom:'16px'}}>
          <label style={{display:'block', fontSize:'11.5px', textTransform:'uppercase', letterSpacing:'0.5px', color: theme.text2, fontWeight:'700', marginBottom:'6px'}}>Program name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Yorkville MACP" style={{width:'100%', padding:'10px 13px', border:`1px solid ${theme.border2}`, borderRadius:'9px', fontSize:'14px', fontFamily:'system-ui', outline:'none', color: theme.text, background: theme.surface, boxSizing:'border-box'}} />
        </div>
        <div style={{border:`1.5px dashed ${theme.border2}`, borderRadius:'9px', padding:'26px', textAlign:'center', background: theme.surface2, cursor:'pointer', marginBottom:'16px'}} onClick={() => document.getElementById('form-file-input')?.click()}>
          <div style={{width:'38px', height:'38px', borderRadius:'9px', background: theme.accentLight, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px'}}>
            <svg width="16" height="16" fill="none" stroke={theme.accentText} strokeWidth="1.5" viewBox="0 0 16 16"><path d="M8 2v8M5 5l3-3 3 3"/><path d="M3 11v2h10v-2"/></svg>
          </div>
          <div style={{fontSize:'13.5px', fontWeight:'500', color: theme.text}}>{selectedFile ? `✓ ${selectedFile.name}` : 'Click to upload your form'}</div>
          <div style={{fontSize:'12px', color: theme.text3, marginTop:'3px'}}>Word doc (.docx) — fields detected automatically</div>
          <input id="form-file-input" type="file" accept=".docx" style={{display:'none'}} onChange={e => { const file = e.target.files?.[0]; if (file) setSelectedFile(file) }} />
        </div>
        {!selectedFile && <div style={{fontSize:'12px', color: theme.text3, marginBottom:'16px', textAlign:'center'}}>Don't have the form yet? We'll use 8 default fields for now.</div>}
        <div style={{display:'flex', gap:'10px', justifyContent:'flex-end', marginTop:'22px', paddingTop:'20px', borderTop:`1px solid ${theme.border}`}}>
          <button onClick={onClose} style={{background:'none', border:`1px solid ${theme.border2}`, borderRadius:'9px', padding:'10px 18px', fontSize:'13.5px', cursor:'pointer', color: theme.text2}}>Cancel</button>
          <button onClick={handleUpload} disabled={parsing} style={{background: theme.accent, color:'white', border:'none', borderRadius:'9px', padding:'10px 20px', fontSize:'13.5px', fontWeight:'600', cursor:'pointer', opacity: parsing ? 0.7 : 1}}>
            {parsing ? 'Reading form...' : 'Save template'}
          </button>
        </div>
      </div>
    </div>
  )
}

function LandingPage() {
  return (
    <div style={{fontFamily:'system-ui, sans-serif', color:'#1A1614', minHeight:'100vh'}}>
      <style>{`
        @media (max-width: 768px) {
          .l-nav { padding: 0 20px !important; }
          .l-hero { padding: 60px 24px 70px !important; }
          .l-hero-h1 { font-size: 32px !important; letter-spacing: -0.5px !important; }
          .l-hero-p { font-size: 15px !important; }
          .l-hero-btns { flex-direction: column !important; align-items: stretch !important; text-align: center !important; }
          .l-section { padding: 56px 24px !important; }
          .l-h2 { font-size: 26px !important; letter-spacing: -0.3px !important; }
          .l-grid-3 { grid-template-columns: 1fr !important; }
          .l-grid-2 { grid-template-columns: 1fr !important; }
          .l-steps { grid-template-columns: 1fr !important; gap: 36px !important; }
          .l-footer { padding: 24px 20px !important; flex-direction: column !important; gap: 8px !important; text-align: center !important; }
          .l-cta-h2 { font-size: 28px !important; }
        }
      `}</style>

      <nav className="l-nav" style={{background:'#1A3C2E', padding:'0 60px', display:'flex', alignItems:'center', justifyContent:'space-between', height:'64px', position:'sticky', top:0, zIndex:50}}>
        <div style={{fontSize:'20px', fontWeight:'700', color:'white', letterSpacing:'-0.3px'}}>Supervisio</div>
        <div style={{display:'flex', alignItems:'center', gap:'16px'}}>
          <a href="/auth" style={{color:'#C8DDD4', fontSize:'14px', textDecoration:'none', fontWeight:'500'}}>Sign in</a>
          <a href="/auth" style={{background:'#2D7A52', color:'white', padding:'8px 20px', borderRadius:'8px', fontSize:'14px', fontWeight:'600', textDecoration:'none'}}>Get started</a>
        </div>
      </nav>

      <div className="l-hero" style={{background:'#1A3C2E', padding:'100px 60px 110px', textAlign:'center'}}>
        <div style={{display:'inline-block', background:'rgba(255,255,255,0.1)', color:'#A8D5BC', fontSize:'12px', fontWeight:'600', padding:'6px 16px', borderRadius:'20px', letterSpacing:'0.8px', textTransform:'uppercase', marginBottom:'28px'}}>
          Built for clinical supervisors
        </div>
        <h1 className="l-hero-h1" style={{fontSize:'56px', fontWeight:'800', color:'white', lineHeight:'1.1', letterSpacing:'-1.5px', margin:'0 auto 24px', maxWidth:'760px'}}>
          Supervision paperwork,<br />
          <span style={{color:'#6BCF94'}}>done automatically.</span>
        </h1>
        <p className="l-hero-p" style={{fontSize:'19px', color:'#A8D5BC', lineHeight:'1.7', maxWidth:'560px', margin:'0 auto 44px'}}>
          Upload your session recording. Supervisio transcribes it, fills in your supervision forms per student, and generates a Word document ready to submit — automatically.
        </p>
        <div className="l-hero-btns" style={{display:'flex', gap:'14px', justifyContent:'center', alignItems:'center'}}>
          <a href="/auth" style={{background:'#6BCF94', color:'#1A3C2E', padding:'14px 32px', borderRadius:'10px', fontSize:'16px', fontWeight:'700', textDecoration:'none'}}>Start for free →</a>
          <a href="#how" style={{color:'#A8D5BC', fontSize:'15px', fontWeight:'500', textDecoration:'none'}}>See how it works ↓</a>
        </div>
      </div>

      <div className="l-section" style={{background:'#EDE8DF', padding:'80px 60px', textAlign:'center'}}>
        <div style={{maxWidth:'680px', margin:'0 auto'}}>
          <h2 className="l-h2" style={{fontSize:'34px', fontWeight:'700', color:'#1A1614', letterSpacing:'-0.8px', marginBottom:'20px'}}>
            Designed to reduce administrative burden
          </h2>
          <p style={{fontSize:'17px', color:'#6B6259', lineHeight:'1.8', marginBottom:'48px'}}>
            Clinical supervision involves meaningful documentation requirements. Supervisio handles the time-consuming parts — transcription, organization, and form completion — so supervisors can focus on what matters most: the supervisory relationship.
          </p>
          <div className="l-grid-3" style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'20px'}}>
            {[
              {icon:'🎙', label:'Automatic transcription', desc:'Session recordings are transcribed with speaker identification'},
              {icon:'📋', label:'Form auto-completion', desc:'Supervision form fields are filled based on session content'},
              {icon:'📥', label:'Document export', desc:'Download a completed Word document ready for submission'},
            ].map(s => (
              <div key={s.label} style={{background:'white', borderRadius:'12px', padding:'28px 24px', border:'1px solid rgba(0,0,0,0.08)', textAlign:'left'}}>
                <div style={{fontSize:'24px', marginBottom:'12px'}}>{s.icon}</div>
                <div style={{fontSize:'15px', fontWeight:'600', color:'#1A1614', marginBottom:'8px'}}>{s.label}</div>
                <div style={{fontSize:'13.5px', color:'#6B6259', lineHeight:'1.6'}}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div id="how" className="l-section" style={{background:'white', padding:'90px 60px', textAlign:'center'}}>
        <div style={{maxWidth:'800px', margin:'0 auto'}}>
          <div style={{fontSize:'12px', color:'#2D7A52', fontWeight:'700', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'16px'}}>How it works</div>
          <h2 className="l-h2" style={{fontSize:'36px', fontWeight:'700', color:'#1A1614', letterSpacing:'-0.8px', marginBottom:'56px'}}>Simple from start to finish</h2>
          <div className="l-steps" style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'32px'}}>
            {[
              {step:'01', title:'Upload your form', desc:"Start by uploading your program's supervision form. Supervisio reads the fields and learns what information to capture."},
              {step:'02', title:'Add a session recording', desc:'After each supervision session, upload the recording. Supervisio transcribes it and identifies each participant.'},
              {step:'03', title:'Review and download', desc:'A completed form is generated per student. Review it on screen, download the Word document, and submit.'},
            ].map(s => (
              <div key={s.step} style={{textAlign:'left'}}>
                <div style={{fontSize:'13px', fontWeight:'700', color:'#2D7A52', letterSpacing:'1px', marginBottom:'14px'}}>{s.step}</div>
                <div style={{width:'40px', height:'2px', background:'#2D7A52', marginBottom:'20px', borderRadius:'2px'}}></div>
                <h3 style={{fontSize:'19px', fontWeight:'700', color:'#1A1614', marginBottom:'12px', letterSpacing:'-0.2px'}}>{s.title}</h3>
                <p style={{fontSize:'14.5px', color:'#6B6259', lineHeight:'1.75'}}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="l-section" style={{background:'#1A3C2E', padding:'90px 60px'}}>
        <div style={{maxWidth:'900px', margin:'0 auto'}}>
          <div style={{textAlign:'center', marginBottom:'56px'}}>
            <div style={{fontSize:'12px', color:'#6BCF94', fontWeight:'700', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'16px'}}>Capabilities</div>
            <h2 className="l-h2" style={{fontSize:'36px', fontWeight:'700', color:'white', letterSpacing:'-0.8px'}}>Built for clinical practice</h2>
          </div>
          <div className="l-grid-2" style={{display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:'20px'}}>
            {[
              {icon:'🎙', title:'Session transcription', desc:'Supports Zoom, Teams, and standard audio/video formats. Speaker identification included.'},
              {icon:'📋', title:'Custom form support', desc:"Upload your program's specific supervision form. Fields are detected and filled accordingly."},
              {icon:'👥', title:'Group supervision', desc:'Multiple students in one session are handled individually. A separate form is generated for each.'},
              {icon:'📥', title:'Word document export', desc:'Download a completed document formatted for submission. Editable before sending.'},
              {icon:'📊', title:'Student progress', desc:'Track supervision hours and session history for each student in one place.'},
              {icon:'⚡', title:'Automatic updates', desc:'Forms appear as soon as processing is complete. No manual refresh required.'},
            ].map(f => (
              <div key={f.title} style={{background:'rgba(255,255,255,0.06)', borderRadius:'12px', padding:'24px 26px', border:'1px solid rgba(255,255,255,0.1)'}}>
                <div style={{fontSize:'20px', marginBottom:'12px'}}>{f.icon}</div>
                <div style={{fontSize:'15px', fontWeight:'600', color:'white', marginBottom:'8px'}}>{f.title}</div>
                <div style={{fontSize:'14px', color:'#A8D5BC', lineHeight:'1.7'}}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="l-section" style={{background:'#EDE8DF', padding:'100px 60px', textAlign:'center'}}>
        <div style={{maxWidth:'540px', margin:'0 auto'}}>
          <h2 className="l-cta-h2" style={{fontSize:'38px', fontWeight:'800', color:'#1A1614', letterSpacing:'-1px', marginBottom:'18px', lineHeight:'1.15'}}>
            Ready to get started?
          </h2>
          <p style={{fontSize:'17px', color:'#6B6259', lineHeight:'1.7', marginBottom:'40px'}}>
            Supervisio is free to start. No credit card required.
          </p>
          <a href="/auth" style={{display:'inline-block', background:'#1A3C2E', color:'white', padding:'16px 40px', borderRadius:'10px', fontSize:'17px', fontWeight:'700', textDecoration:'none'}}>
            Create your account →
          </a>
        </div>
      </div>

      <div className="l-footer" style={{background:'#1A3C2E', padding:'32px 60px', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
        <div style={{fontSize:'16px', fontWeight:'700', color:'white'}}>Supervisio</div>
        <div style={{fontSize:'13px', color:'#6B9B82'}}>Clinical supervision documentation, simplified</div>
      </div>
    </div>
  )
}