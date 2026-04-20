'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    setMessage('')

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else window.location.href = '/'
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
      } else if (data.user) {
        await supabase.from('supervisors').insert({
          id: data.user.id,
          email,
          full_name: name,
        })
        setMessage('Account created! Please check your email to confirm your account.')
      }
    }
    setLoading(false)
  }

  return (
    <div style={{minHeight:'100vh', background:'#F9F7F4', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'system-ui, sans-serif'}}>
      <div style={{background:'white', borderRadius:'14px', padding:'36px 40px', width:'400px', maxWidth:'95vw', border:'1px solid rgba(0,0,0,0.07)'}}>
        
        <div style={{marginBottom:'28px'}}>
          <div style={{fontSize:'20px', fontWeight:'500', color:'#1C1917', marginBottom:'4px'}}>● Supervisio</div>
          <div style={{fontSize:'13px', color:'#A8A29E'}}>Clinical supervision, simplified</div>
        </div>

        <div style={{fontSize:'18px', fontWeight:'500', marginBottom:'6px'}}>{isLogin ? 'Welcome back' : 'Create your account'}</div>
        <div style={{fontSize:'13px', color:'#A8A29E', marginBottom:'24px'}}>{isLogin ? 'Sign in to your supervisor account' : 'Get started with Supervisio'}</div>

        {!isLogin && (
          <div style={{marginBottom:'14px'}}>
            <label style={{display:'block', fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.5px', color:'#57534E', fontWeight:'500', marginBottom:'5px'}}>Full name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Dr. Jane Reeves" style={{width:'100%', padding:'9px 12px', border:'1px solid rgba(0,0,0,0.12)', borderRadius:'7px', fontSize:'13.5px', fontFamily:'system-ui', outline:'none', boxSizing:'border-box'}} />
          </div>
        )}

        <div style={{marginBottom:'14px'}}>
          <label style={{display:'block', fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.5px', color:'#57534E', fontWeight:'500', marginBottom:'5px'}}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={{width:'100%', padding:'9px 12px', border:'1px solid rgba(0,0,0,0.12)', borderRadius:'7px', fontSize:'13.5px', fontFamily:'system-ui', outline:'none', boxSizing:'border-box'}} />
        </div>

        <div style={{marginBottom:'20px'}}>
          <label style={{display:'block', fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.5px', color:'#57534E', fontWeight:'500', marginBottom:'5px'}}>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={{width:'100%', padding:'9px 12px', border:'1px solid rgba(0,0,0,0.12)', borderRadius:'7px', fontSize:'13.5px', fontFamily:'system-ui', outline:'none', boxSizing:'border-box'}} />
        </div>

        {error && <div style={{background:'#FDF2F6', color:'#9D3B5B', padding:'10px 12px', borderRadius:'7px', fontSize:'13px', marginBottom:'14px'}}>{error}</div>}
        {message && <div style={{background:'#F0F7F3', color:'#3B6D54', padding:'10px 12px', borderRadius:'7px', fontSize:'13px', marginBottom:'14px'}}>{message}</div>}

        <button onClick={handleSubmit} disabled={loading} style={{width:'100%', background:'#3B6D54', color:'white', border:'none', borderRadius:'7px', padding:'10px', fontSize:'14px', fontWeight:'500', cursor:'pointer', marginBottom:'16px'}}>
          {loading ? 'Please wait...' : isLogin ? 'Sign in' : 'Create account'}
        </button>

        <div style={{textAlign:'center', fontSize:'13px', color:'#A8A29E'}}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span onClick={() => setIsLogin(!isLogin)} style={{color:'#3B6D54', cursor:'pointer', fontWeight:'500'}}>
            {isLogin ? 'Sign up' : 'Sign in'}
          </span>
        </div>
      </div>
    </div>
  )
}