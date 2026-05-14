import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Avatar, Chip, Divider,
  Button, Alert, CircularProgress, Table, TableBody, TableCell,
  TableHead, TableRow, Select, MenuItem, FormControl, InputLabel,
  TextField, InputAdornment, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, Radio, RadioGroup, FormControlLabel
} from '@mui/material';
import {
  Add, AccountBalanceWallet, ContentCopy, Visibility, VisibilityOff,
  AddCard, AccountBalance, PhoneAndroid
} from '@mui/icons-material';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const CSYM  = { INR:'₹', USD:'$', EUR:'€', GBP:'£', JPY:'¥', GOLD:'g', SILVER:'g' };
const CCOL  = { INR:'#FFD700', USD:'#00C49F', EUR:'#0088FE', GBP:'#FF8042', JPY:'#a855f7', GOLD:'#FFD700', SILVER:'#C0C0C0' };
const RATES = { INR:1, USD:84, EUR:90, GBP:107, JPY:0.56, GOLD:6250, SILVER:74 };
const CURRENCIES = ['INR','USD','EUR','GBP','JPY'];

const cardSx = { background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:3 };
const inputSx = {
  '& .MuiOutlinedInput-root':{ color:'white',
    '& fieldset':{borderColor:'rgba(255,255,255,0.15)'},
    '&:hover fieldset':{borderColor:'rgba(255,215,0,0.4)'},
    '&.Mui-focused fieldset':{borderColor:'#FFD700'}},
  '& .MuiInputLabel-root':{ color:'#888' },
};

export default function Account() {
  const { user } = useAuth();
  const [wallets, setWallets]       = useState([]);
  const [upiInfo, setUpiInfo]       = useState(null);
  const [showPin, setShowPin]       = useState(false);
  const [newCur, setNewCur]         = useState('');
  const [loading, setLoading]       = useState(false);
  const [msg, setMsg]               = useState('');
  const [error, setError]           = useState('');
  const [copied, setCopied]         = useState('');

  // Add Money Modal state
  const [addMoneyOpen, setAddMoneyOpen]     = useState(false);
  const [addCurrency, setAddCurrency]       = useState('INR');
  const [addAmount, setAddAmount]           = useState('');
  const [addMethod, setAddMethod]           = useState('upi');
  const [addLoading, setAddLoading]         = useState(false);
  const [addStep, setAddStep]               = useState(1); // 1=form, 2=payment, 3=success
  const [upiInput, setUpiInput]             = useState('');
  const [bankDetails, setBankDetails]       = useState({ accountNo:'', ifsc:'', holderName:'' });

  const loadAll = useCallback(() => {
    api.get('/users/me/wallets').then(r => setWallets(r.data||[])).catch(()=>{});
    api.get('/users/me/upi').then(r => setUpiInfo(r.data)).catch(()=>{});
  }, [user]);

  useEffect(() => {
    loadAll();
    window.addEventListener('walletUpdated', loadAll);
    return () => window.removeEventListener('walletUpdated', loadAll);
  }, [loadAll]);

  const addWallet = async () => {
    if (!newCur) { setError('Select a currency'); return; }
    if (wallets.find(w=>w.currency===newCur)) { setError(`${newCur} wallet already exists`); return; }
    setLoading(true); setError('');
    try {
      await api.post(`/users/me/wallets`, null, { params: { currency: newCur } });
      setMsg(`✅ ${newCur} wallet added!`);
      setNewCur(''); loadAll();
    } catch(e) { setError(e.response?.data?.message||'Failed'); }
    finally { setLoading(false); }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(''), 2000);
    });
  };

  const handleAddMoneySubmit = async () => {
    if (!addAmount || Number(addAmount) <= 0) { setError('Enter valid amount'); return; }
    setAddLoading(true); setError('');
    try {
      // Simulate payment processing (in real app: Razorpay/PayU gateway)
      await new Promise(r => setTimeout(r, 1500));
      // Credit wallet
      await api.post('/users/me/wallets/adjust', {
        currency: addCurrency,
        amount: Number(addAmount)
      });
      setAddStep(3);
      loadAll();
      window.dispatchEvent(new Event('walletUpdated'));
    } catch(e) {
      setError(e.response?.data?.message || 'Payment failed. Try again.');
    } finally { setAddLoading(false); }
  };

  const resetAddMoney = () => {
    setAddMoneyOpen(false); setAddStep(1); setAddAmount('');
    setUpiInput(''); setError('');
    setBankDetails({accountNo:'',ifsc:'',holderName:''});
  };

  const displayWallets = wallets.length ? wallets : [
    { currency:'INR', balance:10000, upiId: upiInfo?.upiId || '' },
    { currency:'USD', balance:0 }, { currency:'EUR', balance:0 },
  ];
  const currencyWallets = displayWallets.filter(w => !['GOLD','SILVER'].includes(w.currency));
  const bullionWallets  = displayWallets.filter(w => ['GOLD','SILVER'].includes(w.currency));
  const missingCurrencies = CURRENCIES.filter(c => !wallets.find(w=>w.currency===c));
  const upiPin = user?.phone?.length >= 4 ? user.phone.slice(-4) : '****';
  const totalINR = displayWallets.reduce((s,w) => s + (Number(w.balance)||0) * (RATES[w.currency]||1), 0);

  return (
    <Box>
      <Typography variant="h4" sx={{fontWeight:800,color:'white',mb:0.5}}>👤 My Account</Typography>
      <Typography variant="body2" sx={{color:'#555',mb:4}}>Profile, UPI details, wallets and holdings</Typography>

      {msg   && <Alert severity="success" sx={{mb:2,borderRadius:2}} onClose={()=>setMsg('')}>{msg}</Alert>}
      {error && <Alert severity="error"   sx={{mb:2,borderRadius:2}} onClose={()=>setError('')}>{error}</Alert>}
      {copied && <Alert severity="info"   sx={{mb:2,borderRadius:2}}>✅ {copied} copied!</Alert>}

      <Grid container spacing={3}>

        {/* Profile Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{...cardSx,border:'1px solid rgba(255,215,0,0.15)'}}>
            <CardContent sx={{textAlign:'center',pt:4}}>
              <Avatar sx={{width:80,height:80,bgcolor:'#FFD700',color:'#1a1a2e',
                fontSize:'2rem',fontWeight:900,mx:'auto',mb:2,boxShadow:'0 0 30px rgba(255,215,0,0.4)'}}>
                {user?.username?.[0]?.toUpperCase()}
              </Avatar>
              <Typography variant="h5" sx={{color:'white',fontWeight:800}}>{user?.username}</Typography>
              <Typography variant="body2" sx={{color:'#888',mb:0.5}}>{user?.email}</Typography>
              <Chip label={user?.role||'USER'} sx={{bgcolor:'rgba(255,215,0,0.15)',color:'#FFD700',fontWeight:700,mb:2}}/>

              <Divider sx={{borderColor:'rgba(255,255,255,0.08)',mb:2}}/>

              {/* Mobile Number — prominent */}
              <Box mb={2} p={1.5} sx={{background:'rgba(255,215,0,0.06)',borderRadius:2,border:'1px solid rgba(255,215,0,0.2)',textAlign:'left'}}>
                <Box display="flex" alignItems="center" gap={1} mb={0.3}>
                  <PhoneAndroid sx={{color:'#FFD700',fontSize:18}}/>
                  <Typography variant="caption" sx={{color:'#888',textTransform:'uppercase',letterSpacing:1,fontSize:'0.65rem'}}>Mobile Number</Typography>
                </Box>
                <Typography sx={{color:'#FFD700',fontWeight:800,fontSize:'1.1rem',letterSpacing:1}}>
                  {user?.phone || 'Not set'}
                </Typography>
                <Typography variant="caption" sx={{color:'#555'}}>Registered mobile number</Typography>
              </Box>

              <Divider sx={{borderColor:'rgba(255,255,255,0.08)',mb:2}}/>
              <Box sx={{background:'rgba(255,215,0,0.06)',borderRadius:2,p:2,border:'1px solid rgba(255,215,0,0.15)'}}>
                <Typography variant="caption" sx={{color:'#888'}}>Total Portfolio</Typography>
                <Typography variant="h5" sx={{color:'#FFD700',fontWeight:900}}>
                  ₹{totalINR.toLocaleString('en-IN',{maximumFractionDigits:0})}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* UPI Card */}
          <Card sx={{...cardSx,border:'1px solid rgba(0,196,159,0.2)',mt:2}}>
            <CardContent>
              <Typography variant="h6" sx={{color:'white',fontWeight:700,mb:2}}>💳 UPI Details</Typography>
              <Box mb={2}>
                <Typography variant="caption" sx={{color:'#888',textTransform:'uppercase',letterSpacing:1,fontSize:'0.65rem'}}>Your UPI ID</Typography>
                <Box display="flex" alignItems="center" gap={1} mt={0.5}
                  sx={{background:'rgba(0,196,159,0.08)',borderRadius:2,p:1.5,border:'1px solid rgba(0,196,159,0.2)'}}>
                  <Typography sx={{color:'#00C49F',fontWeight:700,flex:1,fontSize:'0.95rem',wordBreak:'break-all'}}>
                    {upiInfo?.upiId || (user?.phone ? user.phone+'@kstar' : '...')}
                  </Typography>
                  <IconButton size="small"
                    onClick={()=>copyToClipboard(upiInfo?.upiId||user?.phone+'@kstar','UPI ID')}
                    sx={{color:'#00C49F'}}>
                    <ContentCopy sx={{fontSize:16}}/>
                  </IconButton>
                </Box>
              </Box>
              <Box>
                <Typography variant="caption" sx={{color:'#888',textTransform:'uppercase',letterSpacing:1,fontSize:'0.65rem'}}>UPI PIN</Typography>
                <Box display="flex" alignItems="center" gap={1} mt={0.5}
                  sx={{background:'rgba(255,215,0,0.06)',borderRadius:2,p:1.5,border:'1px solid rgba(255,215,0,0.2)'}}>
                  <Typography sx={{color:'#FFD700',fontWeight:900,flex:1,fontSize:'1.2rem',letterSpacing:6}}>
                    {showPin ? upiPin : '••••'}
                  </Typography>
                  <IconButton size="small" onClick={()=>setShowPin(s=>!s)} sx={{color:'#FFD700'}}>
                    {showPin ? <VisibilityOff sx={{fontSize:16}}/> : <Visibility sx={{fontSize:16}}/>}
                  </IconButton>
                </Box>
                <Typography variant="caption" sx={{color:'#555',display:'block',mt:0.5}}>
                  Last 4 digits of your phone: {upiPin}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Wallets */}
        <Grid item xs={12} md={8}>
          <Card sx={cardSx}>
            <CardContent>
              {/* Header with Add Wallet + Add Money */}
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={1}>
                <Typography variant="h6" sx={{color:'white',fontWeight:700}}>💳 My Wallets</Typography>
                <Box display="flex" gap={1.5} alignItems="center" flexWrap="wrap">
                  {/* Add Currency Wallet */}
                  <Box display="flex" gap={1} alignItems="center">
                    <FormControl size="small" sx={{minWidth:140,...inputSx}}>
                      <InputLabel sx={{color:'#888',fontSize:'0.85rem'}}>Add currency</InputLabel>
                      <Select value={newCur} onChange={e=>setNewCur(e.target.value)} label="Add currency" sx={{color:'white',fontSize:'0.85rem'}}>
                        {missingCurrencies.map(c=><MenuItem key={c} value={c}>{CSYM[c]} {c}</MenuItem>)}
                      </Select>
                    </FormControl>
                    <Button variant="outlined" size="small"
                      startIcon={loading?<CircularProgress size={14} sx={{color:'#FFD700'}}/>:<Add/>}
                      onClick={addWallet} disabled={loading||!newCur}
                      sx={{borderColor:'rgba(255,215,0,0.4)',color:'#FFD700',
                        '&:hover':{background:'rgba(255,215,0,0.1)'},borderRadius:2,whiteSpace:'nowrap'}}>
                      Add
                    </Button>
                  </Box>

                  {/* ADD MONEY — Highlighted Green Button */}
                  <Button variant="contained" size="medium"
                    startIcon={<AddCard/>}
                    onClick={()=>{setAddMoneyOpen(true);setAddStep(1);setError('');}}
                    sx={{
                      background:'linear-gradient(135deg,#00C49F,#00a085)',
                      color:'white', fontWeight:800, borderRadius:3,
                      px:2.5, py:1,
                      boxShadow:'0 4px 20px rgba(0,196,159,0.4)',
                      '&:hover':{background:'linear-gradient(135deg,#00ddb5,#00b89a)',
                        transform:'translateY(-1px)',boxShadow:'0 6px 25px rgba(0,196,159,0.5)'},
                      transition:'all 0.2s',
                      border:'1px solid rgba(0,196,159,0.5)',
                    }}>
                    + Add Money
                  </Button>
                </Box>
              </Box>

              {/* Wallet Cards */}
              <Grid container spacing={2} mb={3}>
                {currencyWallets.map(w => {
                  const sym = CSYM[w.currency]||w.currency;
                  const col = CCOL[w.currency]||'#aaa';
                  const inrEq = (Number(w.balance)||0)*(RATES[w.currency]||1);
                  return (
                    <Grid item xs={12} sm={6} key={w.currency}>
                      <Box sx={{p:2,borderRadius:2,
                        background:`linear-gradient(135deg,${col}0d,${col}05)`,
                        border:`1px solid ${col}33`,position:'relative',overflow:'hidden'}}>
                        <Box sx={{position:'absolute',top:-20,right:-20,width:70,height:70,
                          borderRadius:'50%',background:col,opacity:0.06,filter:'blur(12px)'}}/>
                        <Box display="flex" justifyContent="space-between">
                          <Chip label={w.currency} size="small" sx={{bgcolor:`${col}22`,color:col,fontWeight:700,border:`1px solid ${col}44`}}/>
                          <AccountBalanceWallet sx={{color:`${col}55`,fontSize:18}}/>
                        </Box>
                        <Typography variant="h4" sx={{color:col,fontWeight:900,my:1,fontSize:'1.8rem'}}>
                          {sym}{Number(w.balance||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}
                        </Typography>
                        <Typography variant="caption" sx={{color:'#555'}}>
                          ≈ ₹{inrEq.toLocaleString('en-IN',{maximumFractionDigits:0})}
                        </Typography>
                        {w.upiId && (
                          <Box mt={1} display="flex" alignItems="center" gap={0.5}>
                            <Chip label={w.upiId} size="small" sx={{bgcolor:'rgba(255,215,0,0.1)',color:'#FFD700',fontSize:'0.68rem'}}/>
                            <IconButton size="small" onClick={()=>copyToClipboard(w.upiId,'UPI ID')} sx={{color:'#FFD700',p:0.3}}>
                              <ContentCopy sx={{fontSize:12}}/>
                            </IconButton>
                          </Box>
                        )}
                        {/* Quick Add Money for this wallet */}
                        <Button size="small" variant="outlined"
                          onClick={()=>{setAddCurrency(w.currency);setAddMoneyOpen(true);setAddStep(1);setError('');}}
                          sx={{mt:1,borderColor:`${col}44`,color:col,fontSize:'0.72rem',borderRadius:2,
                            '&:hover':{background:`${col}11`}}}>
                          + Add {w.currency}
                        </Button>
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>

              {/* Bullion if any */}
              {bullionWallets.length > 0 && (
                <>
                  <Typography variant="subtitle2" sx={{color:'#888',mb:1.5,textTransform:'uppercase',letterSpacing:1,fontSize:'0.72rem'}}>
                    🏅 Bullion Holdings
                  </Typography>
                  <Grid container spacing={2} mb={2}>
                    {bullionWallets.map(w => {
                      const col = CCOL[w.currency]||'#aaa';
                      return (
                        <Grid item xs={12} sm={6} key={w.currency}>
                          <Box sx={{p:2,borderRadius:2,background:`${col}0d`,border:`1px solid ${col}33`}}>
                            <Typography sx={{color:col,fontWeight:700}}>{w.currency==='GOLD'?'🥇 Gold':'🥈 Silver'}</Typography>
                            <Typography variant="h5" sx={{color:col,fontWeight:900}}>{Number(w.balance||0).toFixed(4)}g</Typography>
                            <Typography variant="caption" sx={{color:'#555'}}>
                              ≈ ₹{((Number(w.balance)||0)*(RATES[w.currency]||1)).toLocaleString('en-IN',{maximumFractionDigits:0})}
                            </Typography>
                          </Box>
                        </Grid>
                      );
                    })}
                  </Grid>
                </>
              )}

              {/* Summary Table */}
              <Divider sx={{borderColor:'rgba(255,255,255,0.06)',mb:2}}/>
              <Table size="small">
                <TableHead>
                  <TableRow>{['Asset','Balance','INR Value','UPI ID'].map(h=>(
                    <TableCell key={h} sx={{color:'#666',border:'none',fontWeight:700,fontSize:'0.72rem'}}>{h}</TableCell>
                  ))}</TableRow>
                </TableHead>
                <TableBody>
                  {displayWallets.map(w=>{
                    const col=CCOL[w.currency]||'#888';
                    const inrEq=(Number(w.balance)||0)*(RATES[w.currency]||1);
                    return (
                      <TableRow key={w.currency} sx={{'&:hover':{background:'rgba(255,255,255,0.02)'}}}>
                        <TableCell sx={{border:'none'}}>
                          <Chip label={w.currency} size="small" sx={{bgcolor:`${col}22`,color:col,fontWeight:700,fontSize:'0.7rem'}}/>
                        </TableCell>
                        <TableCell sx={{color:'white',border:'none',fontWeight:600,fontSize:'0.85rem'}}>
                          {['GOLD','SILVER'].includes(w.currency)
                            ? `${Number(w.balance||0).toFixed(4)}g`
                            : `${CSYM[w.currency]||''}${Number(w.balance||0).toFixed(2)}`}
                        </TableCell>
                        <TableCell sx={{color:'#FFD700',border:'none'}}>
                          ₹{inrEq.toLocaleString('en-IN',{maximumFractionDigits:0})}
                        </TableCell>
                        <TableCell sx={{color:'#888',border:'none',fontSize:'0.78rem'}}>{w.upiId||'—'}</TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow>
                    <TableCell colSpan={2} sx={{color:'#888',border:'none',fontWeight:700,borderTop:'1px solid rgba(255,255,255,0.08)'}}>TOTAL</TableCell>
                    <TableCell sx={{color:'#FFD700',border:'none',fontWeight:900,fontSize:'1rem',borderTop:'1px solid rgba(255,255,255,0.08)'}}>
                      ₹{totalINR.toLocaleString('en-IN',{maximumFractionDigits:0})}
                    </TableCell>
                    <TableCell sx={{border:'none',borderTop:'1px solid rgba(255,255,255,0.08)'}}/>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ADD MONEY DIALOG */}
      <Dialog open={addMoneyOpen} onClose={resetAddMoney} maxWidth="sm" fullWidth
        PaperProps={{sx:{background:'#1a1a2e',border:'1px solid rgba(0,196,159,0.3)',borderRadius:3}}}>

        {addStep === 1 && (
          <>
            <DialogTitle sx={{color:'#00C49F',fontWeight:800,pb:1}}>
              💰 Add Money to Wallet
            </DialogTitle>
            <DialogContent>
              {error && <Alert severity="error" sx={{mb:2,borderRadius:2}}>{error}</Alert>}

              {/* Currency Select */}
              <FormControl fullWidth sx={{...inputSx,mb:2,mt:1}}>
                <InputLabel>Select Wallet Currency</InputLabel>
                <Select value={addCurrency} onChange={e=>setAddCurrency(e.target.value)}
                  label="Select Wallet Currency" sx={{color:'white'}}>
                  {CURRENCIES.map(c=>(
                    <MenuItem key={c} value={c}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Chip label={c} size="small" sx={{bgcolor:`${CCOL[c]||'#888'}22`,color:CCOL[c]||'#888',fontWeight:700,fontSize:'0.7rem'}}/>
                        <span>{CSYM[c]} {c}</span>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Amount */}
              <TextField fullWidth label={`Amount (${addCurrency})`} type="number"
                value={addAmount} onChange={e=>setAddAmount(e.target.value)}
                sx={{...inputSx,mb:2}}
                InputProps={{startAdornment:<InputAdornment position="start" sx={{color:`${CCOL[addCurrency]||'#FFD700'}`,fontWeight:700}}>{CSYM[addCurrency]||''}</InputAdornment>}}
                inputProps={{min:1,step:0.01}}/>

              {/* Quick amount buttons */}
              <Box display="flex" gap={1} mb={3} flexWrap="wrap">
                <Typography variant="caption" sx={{color:'#888',width:'100%'}}>Quick amounts:</Typography>
                {['100','500','1000','5000','10000'].map(amt=>(
                  <Chip key={amt} label={`${CSYM[addCurrency]||''}${amt}`} clickable
                    onClick={()=>setAddAmount(amt)} size="small"
                    sx={{bgcolor: addAmount===amt?'rgba(0,196,159,0.3)':'rgba(255,255,255,0.06)',
                      color: addAmount===amt?'#00C49F':'#aaa',
                      border:`1px solid ${addAmount===amt?'rgba(0,196,159,0.5)':'rgba(255,255,255,0.1)'}`,
                      cursor:'pointer',fontWeight:addAmount===amt?700:400}}/>
                ))}
              </Box>

              {/* Payment Method */}
              <Typography variant="caption" sx={{color:'#888',textTransform:'uppercase',letterSpacing:1,fontSize:'0.68rem'}}>
                Payment Method
              </Typography>
              <RadioGroup value={addMethod} onChange={e=>setAddMethod(e.target.value)}>
                <Box display="flex" gap={1.5} mt={1} flexWrap="wrap">
                  {[
                    {val:'upi',    label:'UPI / QR',        icon:'📱', color:'#FFD700'},
                    {val:'bank',   label:'Net Banking',      icon:'🏦', color:'#0088FE'},
                    {val:'card',   label:'Debit/Credit Card',icon:'💳', color:'#00C49F'},
                  ].map(m=>(
                    <Box key={m.val} flex={1} minWidth={130}
                      onClick={()=>setAddMethod(m.val)}
                      sx={{p:1.5,borderRadius:2,cursor:'pointer',
                        background: addMethod===m.val?`${m.color}18`:'rgba(255,255,255,0.03)',
                        border:`1px solid ${addMethod===m.val?m.color+'55':'rgba(255,255,255,0.1)'}`,
                        transition:'all 0.2s'}}>
                      <Typography sx={{fontSize:'1.2rem',mb:0.5}}>{m.icon}</Typography>
                      <Typography sx={{color:addMethod===m.val?m.color:'#aaa',fontWeight:addMethod===m.val?700:400,fontSize:'0.82rem'}}>
                        {m.label}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </RadioGroup>

              {/* Method-specific fields */}
              {addMethod === 'upi' && (
                <Box mt={2}>
                  <TextField fullWidth label="Your UPI ID or phone@bank" value={upiInput}
                    onChange={e=>setUpiInput(e.target.value)}
                    sx={inputSx} placeholder="e.g. 9876543210@paytm"
                    helperText={<span style={{color:'#555'}}>Enter your bank UPI ID to pull funds from</span>}/>
                </Box>
              )}
              {addMethod === 'bank' && (
                <Box mt={2}>
                  <Grid container spacing={1.5}>
                    <Grid item xs={12}>
                      <TextField fullWidth label="Account Holder Name" value={bankDetails.holderName}
                        onChange={e=>setBankDetails(b=>({...b,holderName:e.target.value}))} sx={inputSx}/>
                    </Grid>
                    <Grid item xs={6}>
                      <TextField fullWidth label="Account Number" value={bankDetails.accountNo}
                        onChange={e=>setBankDetails(b=>({...b,accountNo:e.target.value}))} sx={inputSx}/>
                    </Grid>
                    <Grid item xs={6}>
                      <TextField fullWidth label="IFSC Code" value={bankDetails.ifsc}
                        onChange={e=>setBankDetails(b=>({...b,ifsc:e.target.value.toUpperCase()}))} sx={inputSx}/>
                    </Grid>
                  </Grid>
                </Box>
              )}
              {addMethod === 'card' && (
                <Box mt={2}>
                  <Typography sx={{color:'#888',fontSize:'0.85rem',p:1.5,
                    background:'rgba(0,136,254,0.08)',borderRadius:2,border:'1px solid rgba(0,136,254,0.2)'}}>
                    💳 You will be redirected to a secure payment gateway (Razorpay/PayU) to complete card payment.
                  </Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{p:2,gap:1}}>
              <Button onClick={resetAddMoney} sx={{color:'#888'}}>Cancel</Button>
              <Button onClick={()=>setAddStep(2)} disabled={!addAmount||Number(addAmount)<=0}
                variant="contained"
                sx={{background:'linear-gradient(135deg,#00C49F,#00a085)',color:'white',fontWeight:800,borderRadius:2,px:3,
                  '&:hover':{background:'linear-gradient(135deg,#00ddb5,#00b89a)'},
                  '&.Mui-disabled':{background:'rgba(255,255,255,0.1)',color:'#555'}}}>
                Continue →
              </Button>
            </DialogActions>
          </>
        )}

        {addStep === 2 && (
          <>
            <DialogTitle sx={{color:'#00C49F',fontWeight:800}}>Confirm Payment</DialogTitle>
            <DialogContent>
              {error && <Alert severity="error" sx={{mb:2,borderRadius:2}}>{error}</Alert>}
              <Box p={2} sx={{background:'rgba(255,255,255,0.05)',borderRadius:2,mb:2}}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography sx={{color:'#888'}}>Adding to</Typography>
                  <Chip label={addCurrency} size="small" sx={{bgcolor:`${CCOL[addCurrency]||'#888'}22`,color:CCOL[addCurrency]||'#888',fontWeight:700}}/>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography sx={{color:'#888'}}>Amount</Typography>
                  <Typography sx={{color:'#00C49F',fontWeight:900,fontSize:'1.2rem'}}>
                    {CSYM[addCurrency]||''}{Number(addAmount).toLocaleString()}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography sx={{color:'#888'}}>Method</Typography>
                  <Typography sx={{color:'white',textTransform:'capitalize'}}>{addMethod==='upi'?'UPI':addMethod==='bank'?'Net Banking':'Card'}</Typography>
                </Box>
                <Divider sx={{borderColor:'rgba(255,255,255,0.08)',my:1}}/>
                <Typography variant="caption" sx={{color:'#555'}}>
                  ⚠️ Demo mode: Money will be credited directly to your wallet (simulation)
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions sx={{p:2,gap:1}}>
              <Button onClick={()=>setAddStep(1)} sx={{color:'#888'}}>Back</Button>
              <Button onClick={handleAddMoneySubmit} disabled={addLoading} variant="contained"
                sx={{background:'linear-gradient(135deg,#00C49F,#00a085)',color:'white',fontWeight:800,borderRadius:2,px:3}}>
                {addLoading?<CircularProgress size={20} sx={{color:'white'}}/>:'Confirm & Pay'}
              </Button>
            </DialogActions>
          </>
        )}

        {addStep === 3 && (
          <>
            <DialogTitle sx={{color:'#00C49F',fontWeight:800,textAlign:'center'}}>✅ Money Added!</DialogTitle>
            <DialogContent sx={{textAlign:'center',pb:2}}>
              <Typography sx={{fontSize:'3rem',mb:1}}>🎉</Typography>
              <Typography variant="h5" sx={{color:'#00C49F',fontWeight:900,mb:1}}>
                {CSYM[addCurrency]||''}{Number(addAmount).toLocaleString()} Added
              </Typography>
              <Typography sx={{color:'#888'}}>Your {addCurrency} wallet has been updated.</Typography>
            </DialogContent>
            <DialogActions sx={{justifyContent:'center',p:2}}>
              <Button onClick={resetAddMoney} variant="contained"
                sx={{background:'linear-gradient(135deg,#FFD700,#FFA500)',color:'#1a1a2e',fontWeight:800,borderRadius:2,px:4}}>
                Done
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
