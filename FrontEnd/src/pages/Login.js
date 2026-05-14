import React, { useState } from 'react';
import {
    Box, Card, CardContent, TextField, Button, Typography,
    Alert, CircularProgress, Link, InputAdornment, IconButton
} from '@mui/material';
import { Visibility, VisibilityOff, Star } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const inputSx = {
    '& .MuiOutlinedInput-root': {
        color: 'white', borderRadius: 2,
        '& fieldset':            { borderColor: 'rgba(255,215,0,0.2)' },
        '&:hover fieldset':      { borderColor: 'rgba(255,215,0,0.4)' },
        '&.Mui-focused fieldset':{ borderColor: '#FFD700' },
    },
    '& .MuiInputLabel-root': { color: '#888' },
};

export default function Login() {
    const { login } = useAuth();
    const navigate  = useNavigate();
    const [form, setForm]       = useState({ username:'', password:'' });
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState('');

    const handleChange = e => {
        setForm(f => ({...f, [e.target.name]: e.target.value}));
        setError('');
    };

    const handleSubmit = async e => {
        e.preventDefault();
        if (!form.username || !form.password) { setError('Please enter username and password'); return; }
        setLoading(true);
        try {
            await login(form.username, form.password);
            navigate('/dashboard');
        } catch (err) {
            const msg = err.response?.data?.message
                     || err.response?.data?.error
                     || 'Invalid credentials. Please try again.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{
            minHeight:'100vh',
            background:'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
            display:'flex', alignItems:'center', justifyContent:'center', p:2,
        }}>
            <Box sx={{ position:'fixed', top:-100, left:-100, width:400, height:400, borderRadius:'50%', background:'rgba(255,215,0,0.06)', filter:'blur(60px)', pointerEvents:'none' }}/>
            <Box sx={{ position:'fixed', bottom:-100, right:-100, width:500, height:500, borderRadius:'50%', background:'rgba(0,196,159,0.06)', filter:'blur(80px)', pointerEvents:'none' }}/>

            <Card sx={{
                width:'100%', maxWidth:420,
                background:'rgba(26,26,46,0.95)',
                border:'1px solid rgba(255,215,0,0.15)',
                borderRadius:4, boxShadow:'0 25px 50px rgba(0,0,0,0.5)',
            }}>
                <CardContent sx={{ p:4 }}>
                    {/* Logo */}
                    <Box sx={{ textAlign:'center', mb:4 }}>
                        <Box sx={{
                            display:'inline-flex', alignItems:'center', justifyContent:'center',
                            width:64, height:64, borderRadius:'50%',
                            background:'linear-gradient(135deg,#FFD700,#FFA500)',
                            mb:2, boxShadow:'0 0 30px rgba(255,215,0,0.4)'
                        }}>
                            <Star sx={{ fontSize:36, color:'#1a1a2e' }}/>
                        </Box>
                        <Typography variant="h4" sx={{ fontWeight:800, color:'#FFD700', letterSpacing:1 }}>
                            K Star
                        </Typography>
                        <Typography variant="body2" sx={{ color:'#aaa', mt:0.5 }}>
                            Fintech · Sign in to your account
                        </Typography>
                    </Box>

                    {error && <Alert severity="error" sx={{ mb:2, borderRadius:2 }}>{error}</Alert>}

                    <Box component="form" onSubmit={handleSubmit}>
                        <TextField fullWidth label="Username" name="username"
                            value={form.username} onChange={handleChange}
                            autoFocus autoComplete="username" sx={{ ...inputSx, mb:2 }}/>

                        <TextField fullWidth label="Password" name="password"
                            type={showPass ? 'text' : 'password'}
                            value={form.password} onChange={handleChange}
                            autoComplete="current-password" sx={inputSx}
                            InputProps={{
                                endAdornment:(
                                    <InputAdornment position="end">
                                        <IconButton onClick={()=>setShowPass(s=>!s)} edge="end" sx={{color:'#aaa'}}>
                                            {showPass ? <VisibilityOff/> : <Visibility/>}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}/>

                        <Button type="submit" fullWidth variant="contained" disabled={loading} sx={{
                            mt:3, mb:2, py:1.5, borderRadius:3, fontWeight:800, fontSize:'1rem', letterSpacing:0.5,
                            background:'linear-gradient(135deg,#FFD700,#FFA500)', color:'#1a1a2e',
                            boxShadow:'0 4px 20px rgba(255,215,0,0.3)',
                            '&:hover':{ background:'linear-gradient(135deg,#ffe033,#ffb733)', transform:'translateY(-1px)', boxShadow:'0 6px 25px rgba(255,215,0,0.5)' },
                            transition:'all 0.2s ease',
                        }}>
                            {loading ? <CircularProgress size={22} sx={{ color:'#1a1a2e' }}/> : 'Sign In'}
                        </Button>
                    </Box>

                    <Typography variant="body2" sx={{ textAlign:'center', color:'#aaa', mt:1 }}>
                        Don't have an account?{' '}
                        <Link onClick={()=>navigate('/register')} sx={{ color:'#FFD700', cursor:'pointer', fontWeight:700, textDecoration:'none', '&:hover':{ textDecoration:'underline' } }}>
                            Create Account
                        </Link>
                    </Typography>

                    {/* Feature pills */}
                    <Box sx={{ display:'flex', justifyContent:'center', gap:1, mt:3, flexWrap:'wrap' }}>
                        {['💱 Exchange','💸 Transfer','🏦 NACHA','🖼️ NFT'].map(f=>(
                            <Box key={f} sx={{ px:1.5, py:0.5, borderRadius:10, background:'rgba(255,215,0,0.08)', border:'1px solid rgba(255,215,0,0.15)', color:'#888', fontSize:'0.72rem' }}>
                                {f}
                            </Box>
                        ))}
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
}
