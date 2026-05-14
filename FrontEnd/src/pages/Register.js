import React, { useState } from 'react';
import {
    Box, Card, CardContent, TextField, Button, Typography,
    Alert, CircularProgress, Link, Grid, InputAdornment, IconButton
} from '@mui/material';
import { Visibility, VisibilityOff, Star, CheckCircle } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PASSWORD_RULES = [
    { label: 'At least 6 characters', test: p => p.length >= 6 },
    { label: 'Contains a number',     test: p => /\d/.test(p) },
    { label: 'Contains a letter',     test: p => /[a-zA-Z]/.test(p) },
];

const inputSx = {
    '& .MuiOutlinedInput-root': {
        color: 'white', borderRadius: 2,
        '& fieldset':            { borderColor: 'rgba(255,215,0,0.2)' },
        '&:hover fieldset':      { borderColor: 'rgba(255,215,0,0.4)' },
        '&.Mui-focused fieldset':{ borderColor: '#FFD700' },
    },
    '& .MuiInputLabel-root': { color: '#888' },
};

export default function Register() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [form, setForm]         = useState({ username:'', email:'', phone:'', password:'', confirmPassword:'' });
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState('');

    const handleChange = e => {
        setForm(f => ({...f, [e.target.name]: e.target.value}));
        setError('');
    };

    const validate = () => {
        if (!form.username || !form.email || !form.phone || !form.password)
            return 'All fields are required';
        if (form.username.length < 3)
            return 'Username must be at least 3 characters';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
            return 'Please enter a valid email address';
        if (!/^\d{10}$/.test(form.phone))
            return 'Phone must be exactly 10 digits';
        if (form.password.length < 6)
            return 'Password must be at least 6 characters';
        if (form.password !== form.confirmPassword)
            return 'Passwords do not match';
        return null;
    };

    const handleSubmit = async e => {
        e.preventDefault();
        const validErr = validate();
        if (validErr) { setError(validErr); return; }
        setLoading(true);
        try {
            await register({
                username: form.username,
                email:    form.email,
                phone:    form.phone,
                password: form.password,
            });
            navigate('/dashboard');
        } catch (err) {
            // Show exact message from backend GlobalExceptionHandler
            const msg = err.response?.data?.message
                     || err.response?.data?.error
                     || 'Registration failed. Please try again.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const strength = PASSWORD_RULES.filter(r => r.test(form.password)).length;

    return (
        <Box sx={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2,
        }}>
            {/* Blobs */}
            <Box sx={{ position:'fixed', top:-100, right:-100, width:400, height:400, borderRadius:'50%', background:'rgba(255,215,0,0.06)', filter:'blur(60px)', pointerEvents:'none' }}/>
            <Box sx={{ position:'fixed', bottom:-100, left:-100, width:500, height:500, borderRadius:'50%', background:'rgba(0,136,254,0.06)', filter:'blur(80px)', pointerEvents:'none' }}/>

            <Card sx={{
                width:'100%', maxWidth:480,
                background:'rgba(26,26,46,0.95)',
                border:'1px solid rgba(255,215,0,0.15)',
                borderRadius:4, boxShadow:'0 25px 50px rgba(0,0,0,0.5)',
            }}>
                <CardContent sx={{ p:4 }}>
                    {/* Logo */}
                    <Box sx={{ textAlign:'center', mb:3 }}>
                        <Box sx={{
                            display:'inline-flex', alignItems:'center', justifyContent:'center',
                            width:56, height:56, borderRadius:'50%',
                            background:'linear-gradient(135deg,#FFD700,#FFA500)',
                            mb:1.5, boxShadow:'0 0 30px rgba(255,215,0,0.4)'
                        }}>
                            <Star sx={{ fontSize:30, color:'#1a1a2e' }}/>
                        </Box>
                        <Typography variant="h5" sx={{ fontWeight:800, color:'#FFD700', letterSpacing:1 }}>
                            Create Account
                        </Typography>
                        <Typography variant="body2" sx={{ color:'#aaa', mt:0.5 }}>
                            Join K Star Fintech — your digital wallet awaits
                        </Typography>
                    </Box>

                    {error && <Alert severity="error" sx={{ mb:2, borderRadius:2 }}>{error}</Alert>}

                    <Box component="form" onSubmit={handleSubmit}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth label="Username" name="username"
                                    value={form.username} onChange={handleChange}
                                    autoFocus sx={inputSx}/>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth label="Phone (10 digits)" name="phone"
                                    value={form.phone} onChange={handleChange}
                                    inputProps={{ maxLength:10, inputMode:'numeric' }} sx={inputSx}/>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField fullWidth label="Email Address" name="email" type="email"
                                    value={form.email} onChange={handleChange} sx={inputSx}/>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField fullWidth label="Password" name="password"
                                    type={showPass ? 'text' : 'password'}
                                    value={form.password} onChange={handleChange} sx={inputSx}
                                    InputProps={{
                                        endAdornment:(
                                            <InputAdornment position="end">
                                                <IconButton onClick={()=>setShowPass(s=>!s)} edge="end" sx={{color:'#aaa'}}>
                                                    {showPass ? <VisibilityOff/> : <Visibility/>}
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    }}/>
                                {/* Password strength */}
                                {form.password && (
                                    <Box mt={1}>
                                        <Box sx={{ display:'flex', gap:0.5, mb:0.5 }}>
                                            {[0,1,2].map(i=>(
                                                <Box key={i} sx={{
                                                    flex:1, height:3, borderRadius:2,
                                                    bgcolor: i<strength
                                                        ? strength===1?'#f44336':strength===2?'#ff9800':'#4caf50'
                                                        : 'rgba(255,255,255,0.1)',
                                                    transition:'background 0.3s'
                                                }}/>
                                            ))}
                                        </Box>
                                        {PASSWORD_RULES.map(r=>(
                                            <Box key={r.label} sx={{ display:'flex', alignItems:'center', gap:0.5 }}>
                                                <CheckCircle sx={{ fontSize:12, color: r.test(form.password)?'#4caf50':'rgba(255,255,255,0.2)' }}/>
                                                <Typography variant="caption" sx={{ color: r.test(form.password)?'#aaa':'rgba(255,255,255,0.3)' }}>
                                                    {r.label}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                )}
                            </Grid>
                            <Grid item xs={12}>
                                <TextField fullWidth label="Confirm Password" name="confirmPassword"
                                    type="password" value={form.confirmPassword} onChange={handleChange}
                                    sx={{
                                        ...inputSx,
                                        '& .MuiOutlinedInput-root':{ ...inputSx['& .MuiOutlinedInput-root'],
                                            '& fieldset':{ borderColor: form.confirmPassword
                                                ? form.confirmPassword===form.password ? 'rgba(76,175,80,0.5)' : 'rgba(244,67,54,0.5)'
                                                : 'rgba(255,215,0,0.2)' }
                                        }
                                    }}/>
                            </Grid>
                        </Grid>

                        {/* Wallet preview */}
                        <Box sx={{ mt:2, p:1.5, borderRadius:2, background:'rgba(255,215,0,0.06)', border:'1px solid rgba(255,215,0,0.12)' }}>
                            <Typography variant="caption" sx={{ color:'#888' }}>🎁 On registration you receive:</Typography>
                            <Box sx={{ display:'flex', gap:1, mt:0.5, flexWrap:'wrap' }}>
                                {[{label:'₹10,000 INR',color:'#FFD700'},{label:'$0 USD',color:'#00C49F'},{label:'€0 EUR',color:'#0088FE'}].map(w=>(
                                    <Box key={w.label} sx={{ px:1.5, py:0.3, borderRadius:10, bgcolor:`${w.color}18`, color:w.color, fontSize:'0.75rem', fontWeight:700 }}>
                                        {w.label}
                                    </Box>
                                ))}
                            </Box>
                        </Box>

                        <Button type="submit" fullWidth variant="contained" disabled={loading} sx={{
                            mt:2.5, mb:2, py:1.5, borderRadius:3, fontWeight:800, fontSize:'1rem',
                            background:'linear-gradient(135deg,#FFD700,#FFA500)', color:'#1a1a2e',
                            boxShadow:'0 4px 20px rgba(255,215,0,0.3)',
                            '&:hover':{ background:'linear-gradient(135deg,#ffe033,#ffb733)', transform:'translateY(-1px)', boxShadow:'0 6px 25px rgba(255,215,0,0.5)' },
                            transition:'all 0.2s ease',
                        }}>
                            {loading ? <CircularProgress size={22} sx={{ color:'#1a1a2e' }}/> : 'Create Account'}
                        </Button>
                    </Box>

                    <Typography variant="body2" sx={{ textAlign:'center', color:'#aaa' }}>
                        Already have an account?{' '}
                        <Link onClick={()=>navigate('/login')} sx={{ color:'#FFD700', cursor:'pointer', fontWeight:700, textDecoration:'none', '&:hover':{ textDecoration:'underline' } }}>
                            Sign In
                        </Link>
                    </Typography>
                </CardContent>
            </Card>
        </Box>
    );
}
