import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Button, Grid,
  Alert, CircularProgress, Table, TableBody, TableCell, TableHead,
  TableRow, Chip, InputAdornment, Divider
} from '@mui/material';
import { Send, CheckCircle, ArrowUpward, ArrowDownward, ContentCopy } from '@mui/icons-material';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const cardSx = { background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:3 };
const inputSx = {
  '& .MuiOutlinedInput-root':{ color:'white','& fieldset':{borderColor:'rgba(255,255,255,0.15)'},
    '&:hover fieldset':{borderColor:'rgba(255,215,0,0.4)'},'&.Mui-focused fieldset':{borderColor:'#FFD700'}},
  '& .MuiInputLabel-root':{ color:'#888' },
};
const STATUS_COLOR = { COMPLETED:'#00C49F', PENDING:'#FFD700', FAILED:'#f44336', PROCESSING:'#0088FE' };

export default function Transfer() {
  const { user } = useAuth();
  const [form, setForm]         = useState({ fromUpiId:'', toUpiId:'', amount:'', upiPin:'', description:'' });
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState('');
  const [error, setError]       = useState('');
  const [history, setHistory]   = useState([]);
  const [balance, setBalance]   = useState(null);
  const [upiInfo, setUpiInfo]   = useState(null);
  const [copied, setCopied]     = useState(false);

  const myUpiId = upiInfo?.upiId || (user?.phone ? user.phone + '@kstar' : '');
  const defaultPin = user?.phone?.length >= 4 ? user.phone.slice(-4) : '';

  const loadData = useCallback(() => {
    api.get('/users/me/upi').then(r => {
      setUpiInfo(r.data);
      setForm(f => ({...f, fromUpiId: r.data.upiId}));
      loadHistory(r.data.upiId);
    }).catch(() => {
      if (user?.phone) {
        const id = user.phone + '@kstar';
        setForm(f => ({...f, fromUpiId: id}));
        loadHistory(id);
      }
    });
    api.get('/users/me/balance').then(r => setBalance(r.data)).catch(() => {});
  }, [user]);

  const loadHistory = (upiId) => {
    if (upiId) api.get(`/transfer/history?upiId=${upiId}`)
      .then(r => setHistory(r.data || [])).catch(() => {});
  };

  useEffect(() => {
    loadData();
    window.addEventListener('walletUpdated', loadData);
    return () => window.removeEventListener('walletUpdated', loadData);
  }, [loadData]);

  const handleChange = e => {
    setForm(f => ({...f, [e.target.name]: e.target.value}));
    setError(''); setSuccess('');
  };

  const handleTransfer = async () => {
    if (!form.toUpiId)                        { setError('Enter recipient UPI ID (e.g. 9876543211@kstar)'); return; }
    if (!form.toUpiId.endsWith('@kstar'))      { setError('Recipient UPI ID must end with @kstar'); return; }
    if (!form.amount || Number(form.amount)<=0){ setError('Enter a valid amount greater than 0'); return; }
    if (form.upiPin.length !== 4)             { setError('UPI PIN must be exactly 4 digits'); return; }
    if (form.fromUpiId === form.toUpiId)       { setError('You cannot transfer money to yourself'); return; }

    setLoading(true); setError(''); setSuccess('');
    try {
      const res = await api.post('/transfer/upi', {
        fromUpiId:   form.fromUpiId,
        toUpiId:     form.toUpiId,
        amount:      Number(form.amount),
        upiPin:      form.upiPin,
        description: form.description,
      });
      setSuccess(`✅ ₹${form.amount} sent to ${form.toUpiId} successfully! Transaction ID: ${res.data?.transactionId || 'TXN-XXX'}`);
      setForm(f => ({...f, toUpiId:'', amount:'', upiPin:'', description:''}));
      loadData();
      window.dispatchEvent(new Event('walletUpdated'));
    } catch(e) {
      setError(e.response?.data?.message || 'Transfer failed. Check UPI ID, balance and PIN.');
    } finally { setLoading(false); }
  };

  const copyUpiId = () => {
    navigator.clipboard.writeText(myUpiId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Box>
      <Typography variant="h4" sx={{fontWeight:800,color:'white',mb:0.5}}>💸 Send Money (UPI)</Typography>
      <Typography variant="body2" sx={{color:'#555',mb:4}}>Instant P2P transfers between K Star accounts</Typography>

      <Grid container spacing={3}>

        {/* My UPI Info Banner */}
        <Grid item xs={12}>
          <Card sx={{...cardSx,border:'1px solid rgba(0,196,159,0.25)'}}>
            <CardContent sx={{py:'14px !important'}}>
              <Grid container alignItems="center" spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" sx={{color:'#888'}}>Your UPI ID (share to receive money)</Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography sx={{color:'#00C49F',fontWeight:800,fontSize:'1rem'}}>{myUpiId}</Typography>
                    <Button size="small" startIcon={<ContentCopy sx={{fontSize:14}}/>}
                      onClick={copyUpiId}
                      sx={{color: copied?'#00C49F':'#888',fontSize:'0.7rem',minWidth:0,p:0.5,
                        '&:hover':{color:'#00C49F'}}}>
                      {copied ? 'Copied!' : 'Copy'}
                    </Button>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" sx={{color:'#888'}}>Your UPI PIN</Typography>
                  <Typography sx={{color:'#FFD700',fontWeight:800,fontSize:'1rem',letterSpacing:4}}>
                    {defaultPin ? `${defaultPin}` : '••••'}
                  </Typography>
                  <Typography variant="caption" sx={{color:'#555'}}>Last 4 digits of your phone</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" sx={{color:'#888'}}>Available Balance</Typography>
                  <Typography sx={{color:'#FFD700',fontWeight:900,fontSize:'1.2rem'}}>
                    ₹{balance !== null ? Number(balance).toLocaleString('en-IN',{maximumFractionDigits:2}) : '...'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Transfer Form */}
        <Grid item xs={12} md={6}>
          <Card sx={{...cardSx,border:'1px solid rgba(255,215,0,0.15)'}}>
            <CardContent>
              <Typography variant="h6" sx={{color:'white',fontWeight:700,mb:3}}>Send Money</Typography>

              {error   && <Alert severity="error"   sx={{mb:2,borderRadius:2}}>{error}</Alert>}
              {success && (
                <Alert severity="success" icon={<CheckCircle/>}
                  sx={{mb:2,borderRadius:2,background:'rgba(0,196,159,0.1)',border:'1px solid rgba(0,196,159,0.3)',color:'white'}}>
                  {success}
                </Alert>
              )}

              {/* From UPI */}
              <TextField fullWidth label="From (Your UPI ID)" name="fromUpiId"
                value={form.fromUpiId} disabled
                sx={{...inputSx, mb:2,
                  '& .Mui-disabled':{ color:'#00C49F !important', WebkitTextFillColor:'#00C49F !important' }}}/>

              {/* To UPI */}
              <TextField fullWidth label="To (Recipient UPI ID)" name="toUpiId"
                value={form.toUpiId} onChange={handleChange}
                placeholder="e.g. 9876543211@kstar"
                sx={{...inputSx, mb:2}}
                helperText={<span style={{color:'#555'}}>Enter the other person's phone number followed by @kstar</span>}/>

              {/* Amount */}
              <TextField fullWidth label="Amount (₹)" name="amount"
                value={form.amount} onChange={handleChange}
                type="number" inputProps={{min:1}}
                sx={{...inputSx, mb:2}}
                InputProps={{startAdornment:<InputAdornment position="start" sx={{color:'#FFD700',fontWeight:700}}>₹</InputAdornment>}}/>

              {/* Note */}
              <TextField fullWidth label="Note (optional)" name="description"
                value={form.description} onChange={handleChange}
                placeholder="e.g. Rent, Food, Birthday gift"
                sx={{...inputSx, mb:2}}/>

              {/* UPI PIN */}
              <TextField fullWidth label="Your UPI PIN (4 digits)" name="upiPin"
                value={form.upiPin} onChange={handleChange}
                type="password" inputProps={{maxLength:4}}
                sx={{...inputSx, mb:1}}/>
              <Typography variant="caption" sx={{color:'#555',display:'block',mb:3}}>
                Hint: Your PIN is the last 4 digits of your registered phone number ({defaultPin||'****'})
              </Typography>

              {/* Preview */}
              {form.amount && Number(form.amount) > 0 && form.toUpiId && (
                <Box mb={2} p={1.5} sx={{background:'rgba(255,215,0,0.06)',borderRadius:2,border:'1px solid rgba(255,215,0,0.15)'}}>
                  <Typography sx={{color:'#aaa',fontSize:'0.85rem',mb:0.5}}>Transfer Summary</Typography>
                  <Box display="flex" justifyContent="space-between">
                    <Box>
                      <Typography variant="caption" sx={{color:'#888'}}>From</Typography>
                      <Typography sx={{color:'#f44336',fontWeight:700}}>-₹{Number(form.amount).toLocaleString('en-IN')}</Typography>
                      <Typography variant="caption" sx={{color:'#555'}}>{form.fromUpiId}</Typography>
                    </Box>
                    <Typography sx={{color:'#FFD700',fontSize:'1.5rem',alignSelf:'center'}}>→</Typography>
                    <Box textAlign="right">
                      <Typography variant="caption" sx={{color:'#888'}}>To</Typography>
                      <Typography sx={{color:'#00C49F',fontWeight:700}}>+₹{Number(form.amount).toLocaleString('en-IN')}</Typography>
                      <Typography variant="caption" sx={{color:'#555'}}>{form.toUpiId}</Typography>
                    </Box>
                  </Box>
                </Box>
              )}

              <Button fullWidth variant="contained" onClick={handleTransfer}
                disabled={loading} endIcon={loading ? null : <Send/>}
                sx={{py:1.5,borderRadius:3,fontWeight:800,fontSize:'1rem',
                  background:'linear-gradient(135deg,#FFD700,#FFA500)',color:'#1a1a2e',
                  '&:hover':{transform:'translateY(-1px)',boxShadow:'0 6px 25px rgba(255,215,0,0.4)'},
                  transition:'all 0.2s'}}>
                {loading ? <CircularProgress size={22} sx={{color:'#1a1a2e'}}/> : 'Send Money Now'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* How it works */}
        <Grid item xs={12} md={6}>
          <Card sx={cardSx}>
            <CardContent>
              <Typography variant="h6" sx={{color:'white',fontWeight:700,mb:3}}>How to Send Money</Typography>
              {[
                {icon:'1️⃣', title:'Get UPI ID', desc:`Your UPI ID is: ${myUpiId}. Share it with anyone to receive money.`, color:'#FFD700'},
                {icon:'2️⃣', title:'Enter Recipient UPI ID', desc:"Ask the other person for their UPI ID (phone@kstar format)", color:'#FFA500'},
                {icon:'3️⃣', title:'Enter Amount', desc:'Type the amount in ₹ you want to send', color:'#00C49F'},
                {icon:'4️⃣', title:'Enter PIN & Confirm', desc:`Your 4-digit PIN is the last 4 digits of your phone (${defaultPin||'****'})`, color:'#0088FE'},
                {icon:'✅', title:'Done!', desc:'Money leaves your account instantly and arrives in the recipient account', color:'#00C49F'},
              ].map(s=>(
                <Box key={s.title} display="flex" gap={2} mb={2} p={1.5}
                  sx={{background:'rgba(255,255,255,0.03)',borderRadius:2}}>
                  <Typography sx={{fontSize:'1.3rem',mt:0.2}}>{s.icon}</Typography>
                  <Box>
                    <Typography sx={{color:s.color,fontWeight:700,fontSize:'0.88rem'}}>{s.title}</Typography>
                    <Typography variant="caption" sx={{color:'#888'}}>{s.desc}</Typography>
                  </Box>
                </Box>
              ))}
              <Box p={1.5} sx={{background:'rgba(244,67,54,0.08)',borderRadius:2,border:'1px solid rgba(244,67,54,0.2)',mt:1}}>
                <Typography variant="caption" sx={{color:'#f44336',fontWeight:700,display:'block'}}>⚠️ Important</Typography>
                <Typography variant="caption" sx={{color:'#888'}}>
                  Transfers are instant and cannot be reversed. Always verify the UPI ID before sending.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Transaction History */}
        <Grid item xs={12}>
          <Card sx={cardSx}>
            <CardContent>
              <Typography variant="h6" sx={{color:'white',fontWeight:700,mb:2}}>Transaction History</Typography>
              {history.length === 0 ? (
                <Box textAlign="center" py={5}>
                  <Typography sx={{fontSize:'2.5rem',mb:1}}>💸</Typography>
                  <Typography sx={{color:'#555'}}>No transactions yet</Typography>
                  <Typography variant="caption" sx={{color:'#444'}}>Your sent and received money will appear here</Typography>
                </Box>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {['','From / To','Amount','Note','Status','Date'].map(h=>(
                        <TableCell key={h} sx={{color:'#888',border:'none',fontWeight:700,fontSize:'0.75rem'}}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {history.slice(0,15).map((t,i)=>{
                      const isSent = t.fromUpiId === myUpiId;
                      return (
                        <TableRow key={i} sx={{'&:hover':{background:'rgba(255,255,255,0.03)'}}}>
                          <TableCell sx={{border:'none',width:32}}>
                            {isSent
                              ? <ArrowUpward sx={{color:'#f44336',fontSize:18}}/>
                              : <ArrowDownward sx={{color:'#00C49F',fontSize:18}}/>}
                          </TableCell>
                          <TableCell sx={{border:'none'}}>
                            <Typography sx={{color:'white',fontSize:'0.82rem',fontWeight:600}}>
                              {isSent ? 'Sent to' : 'Received from'}
                            </Typography>
                            <Typography sx={{color:'#888',fontSize:'0.75rem'}}>
                              {isSent ? t.toUpiId : t.fromUpiId}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{border:'none',fontWeight:800,fontSize:'0.95rem',
                            color: isSent ? '#f44336' : '#00C49F'}}>
                            {isSent ? '-' : '+'} ₹{Number(t.amount).toLocaleString('en-IN')}
                          </TableCell>
                          <TableCell sx={{color:'#888',border:'none',fontSize:'0.78rem'}}>{t.description||'—'}</TableCell>
                          <TableCell sx={{border:'none'}}>
                            <Chip label={t.status||'COMPLETED'} size="small"
                              sx={{bgcolor:(STATUS_COLOR[t.status]||'#00C49F')+'22',
                                color:STATUS_COLOR[t.status]||'#00C49F',fontWeight:700,fontSize:'0.68rem'}}/>
                          </TableCell>
                          <TableCell sx={{color:'#555',border:'none',fontSize:'0.72rem'}}>
                            {t.createdAt ? new Date(t.createdAt).toLocaleString() : '—'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
