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

export default function Home() {
  const [page, setPage] = useState('dashboard')
  const [sessions, setSessions] = useState<Session[]>([])
  const [forms, setForms] = useState<FormTemplate[]>([])
  const [showNewSession, setShowNewSession] = useState(false)
  const [showUploadForm, setShowUploadForm] = useState(false)
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
        <nav style={{flex:1, padding:'12px 10px'}}>
          {[
            {id:'dashboard', label:'Overview'},
            {id:'sessions', label:'Sessions'},
            {id:'reports', label:'Ready to review'},
            {id:'forms', label:'Form templates'},
            {id:'settings', label:'Settings'},
          ].map(item => (
            <button key={item.id} onClick={() => setPage(item.id)} style={{display:'flex', alignItems:'center', width:'100%', padding:'8px 10px', borderRadius:'7px', border:'none', background: page===item.id ? '#EBF3EE' : 'none', color: page===item.id ? '#3B6D54' : '#57534E', fontSize:'13px', cursor:'pointer', marginBottom:'1px', textAlign:'left'}}>
              {item.label}
            </button>
          ))}
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
        {page === 'dashboard' && <Dashboard sessions={sessions} setPage={setPage} onNewSession={() => setShowNewSession(true)} supervisor={supervisor} />}
        {page === 'sessions' && <Sessions sessions={sessions} setPage={setPage} onNewSession={() => setShowNewSession(true)} />}
        {page === 'reports' && <Reports sessions={sessions} />}
        {page === 'forms' && <Forms forms={forms} onUpload={() => setShowUploadForm(true)} />}
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
    </div>
  )
}

function Dashboard({ sessions, setPage, onNewSession, supervisor }: { sessions: Session[], setPage: (p: string) => void, onNewSession: () => void, supervisor: Supervisor | null }) {
  const upcoming = sessions.filter(s => s.status === 'scheduled')
  const live = sessions.filter(s => s.status === 'live')
  const firstName = supervisor?.full_name?.split(' ')[0] || 'there'

  return (
    <div>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'24px'}}>
        <div>
          <div style={{fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.6px', color:'#A8A29E', marginBottom:'4px'}}>Welcome</div>
          <div style={{fontSize:'24px', fontWeight:'500', color:'#1C1917'}}>Good morning, {firstName}</div>
          <div style={{fontSize:'12.5px', color:'#A8A29E', marginTop:'3px'}}>
            {sessions.length === 0 ? 'No sessions yet — create your first one to get started' : `${sessions.length} session${sessions.length > 1 ? 's' : ''} total`}
          </div>
        </div>
        <button onClick={onNewSession} style={{background:'#3B6D54', color:'white', border:'none', borderRadius:'7px', padding:'8px 16px', fontSize:'13px', fontWeight:'500', cursor:'pointer'}}>+ New session</button>
      </div>

      {live.length > 0 && (
        <div style={{background:'#F0F7F3', border:'1px solid rgba(59,109,84,0.15)', borderRadius:'10px', padding:'10px 14px', marginBottom:'18px', fontSize:'12.5px', color:'#3B6D54', cursor:'pointer'}} onClick={() => setPage('live')}>
          {live[0].name} is live now. Supervisio is recording and taking notes.
        </div>
      )}

      <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'12px', marginBottom:'24px'}}>
        {[
          {label:'Total sessions', value: sessions.length.toString()},
          {label:'Active students', value: [...new Set(sessions.flatMap(s => s.students))].length.toString()},
          {label:'Forms generated', value: sessions.filter(s => s.status === 'complete').length.toString()},
          {label:'Awaiting review', value: sessions.filter(s => s.status === 'complete').length.toString()},
        ].map(s => (
          <div key={s.label} style={{background:'white', border:'1px solid rgba(0,0,0,0.07)', borderRadius:'10px', padding:'16px 18px'}}>
            <div style={{fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.5px', color:'#A8A29E', marginBottom:'6px'}}>{s.label}</div>
            <div style={{fontSize:'28px', fontWeight:'500', color:'#1C1917', lineHeight:1}}>{s.value}</div>
          </div>
        ))}
      </div>

      {sessions.length === 0 ? (
        <EmptyState message="No sessions yet" sub="Create your first session to get started" action="Create session" onAction={onNewSession} />
      ) : (
        <div>
          <div style={{fontSize:'13px', fontWeight:'500', marginBottom:'12px'}}>Upcoming sessions</div>
          {upcoming.map(s => (
            <SessionRow key={s.id} session={s} />
          ))}
        </div>
      )}
    </div>
  )
}

function Sessions({ sessions, setPage, onNewSession }: { sessions: Session[], setPage: (p: string) => void, onNewSession: () => void }) {
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
        sessions.map(s => <SessionRow key={s.id} session={s} />)
      )}
    </div>
  )
}

function SessionRow({ session }: { session: Session }) {
  const statusColors: Record<string, {bg: string, color: string}> = {
    live: {bg:'#EBF3EE', color:'#3B6D54'},
    scheduled: {bg:'#FEF3C7', color:'#B45309'},
    complete: {bg:'#F2EFE9', color:'#A8A29E'},
  }
  const indicatorColors: Record<string, string> = {
    live: '#5A9E7A',
    scheduled: '#EF9F27',
    complete: '#D4D0CA',
  }
  return (
    <div style={{background:'white', border:'1px solid rgba(0,0,0,0.07)', borderRadius:'10px', padding:'14px 18px', display:'flex', alignItems:'center', gap:'14px', marginBottom:'8px', cursor:'pointer'}}>
      <div style={{width:'3px', height:'40px', borderRadius:'2px', background: indicatorColors[session.status], flexShrink:0}}></div>
      <div style={{flex:1}}>
        <div style={{fontSize:'13.5px', fontWeight:'500'}}>{session.name}</div>
        <div style={{fontSize:'12px', color:'#A8A29E'}}>{session.date} · {session.time} · {session.students.join(', ')}</div>
      </div>
      <span style={{fontSize:'11px', padding:'3px 10px', borderRadius:'20px', fontWeight:'500', background: statusColors[session.status].bg, color: statusColors[session.status].color}}>
        {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
      </span>
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
        <EmptyState message="No forms yet" sub="Forms will appear here after sessions are completed" />
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

function SettingsPage() {
  const [toggles, setToggles] = useState({
    autoJoin: true,
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
        {title:'Session behaviour', items:[
          {key:'autoJoin', label:'Auto-join Zoom sessions', desc:'Bot joins automatically when a session starts'},
          {key:'speakerDetection', label:'Speaker detection', desc:'Identify each person by their opening introduction'},
          {key:'autoGenerate', label:'Auto-generate forms after session', desc:'Forms are drafted the moment the call ends'},
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
    if (!name || !date || !time) return
    onCreate({
      name,
      date,
      time,
      zoom_link: zoomLink,
      students: students.split(',').map(s => s.trim()).filter(Boolean),
      status: 'scheduled',
    })
  }

  return (
    <div style={{position:'fixed', inset:0, background:'rgba(28,25,23,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100}} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{background:'white', borderRadius:'14px', padding:'26px 28px', width:'460px', maxWidth:'95vw'}}>
        <div style={{fontSize:'19px', fontWeight:'500', marginBottom:'4px'}}>New supervision session</div>
        <div style={{fontSize:'12.5px', color:'#A8A29E', marginBottom:'22px'}}>Supervisio will join automatically and handle the notes</div>

        {[
          {label:'Session name', value:name, setter:setName, placeholder:'e.g. Group supervision — session 1', type:'text'},
          {label:'Zoom link', value:zoomLink, setter:setZoomLink, placeholder:'https://zoom.us/j/...', type:'url'},
          {label:'Students (up to 3, comma separated)', value:students, setter:setStudents, placeholder:'e.g. Maya Adeyemi, Jordan Bassett', type:'text'},
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

function UploadFormModal({ onClose, onUpload }: { onClose: () => void, onUpload: (form: Omit<FormTemplate, 'id'>) => void }) {
  const [name, setName] = useState('')

  const handleUpload = () => {
    if (!name) return
    onUpload({
      name,
      fields: ['Student name', 'Session date', 'Duration', 'Case presented', 'Theoretical approach', 'Supervisor observations', 'Goals for next session', 'Supervisor signature'],
    })
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