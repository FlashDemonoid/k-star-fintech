import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Button, Grid,
  Select, MenuItem, FormControl, InputLabel, Alert, CircularProgress,
  Table, TableBody, TableCell, TableHead, TableRow, Chip, Divider
} from '@mui/material';
import { SwapHoriz, Refresh, CheckCircle } from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api/axios';

const CURRENCIES = ['INR','USD','EUR','GBP','JPY'];
const CSYM = { INR:'₹', USD:'$', EUR:'€', GBP:'£', JPY:'¥' };
const CCOL = { INR:'#FFD700', USD:'#00C49F', EUR:'#0088FE', GBP:'#FF8042', JPY:'#a855f7' };
const FALLBACK = { INR:1, USD:1/84.12, EUR:1/91.6, GBP:1/106.7, JPY:1/0.556 };

const cardSx = {background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:3};
const inputSx = {
  '& .MuiOutlinedInput-root':{color:'white',
    '& fieldset':{borderColor:'rgba(255,255,255,0.15)'},
    '&:hover fieldset':{borderColor:'rgba(255,215,0,0.4)'},
    '&.Mui-focused fieldset':{borderColor:'#FFD700'}},
  '& .MuiInputLabel-root':{color:'#888'},
  '& .MuiSelect-icon':{color:'#888'},
};

export default function Exchange() {
  const [from, setFrom]       = useState('INR');
  const [to, setTo]           = useState('USD');
  const [amount, setAmount]   = useState('');
  const [loading, setLoading] = useState(false);
  const [rateLoading, setRateLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [history, setHistory] = useState([]);
  const [liveRates, setLiveRates] = useState({});
  const [wallets, setWallets] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [chartData, setChartData] = useState([]);
  const chartRef = useRef([]);

  // Load wallet balances using /me/wallets (no user.id needed)
  const loadWallets = useCallback(() => {
    api.get('/users/me/wallets')
      .then(r => setWallets(r.data || []))
      .catch(() => {});
  }, []);

  // Fetch live rates from open.er-api.com
  const fetchRates = useCallback(async () => {
    setRateLoading(true);
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/INR');
      if (res.ok) {
        const data = await res.json();
        if (data.rates) {
          setLiveRates(data.rates);
          setLastUpdated(new Date());
          const usdRate = data.rates['USD'] ? parseFloat((1/data.rates['USD']).toFixed(4)) : 84.12;
          const pt = { time: new Date().toLocaleTimeString('en',{hour:'2-digit',minute:'2-digit'}), rate: usdRate };
          chartRef.current = [...chartRef.current.slice(-19), pt];
          setChartData([...chartRef.current]);
        }
      }
    } catch { /* use fallback */ }
    finally { setRateLoading(false); }
  }, []);

  useEffect(() => {
    fetchRates();
    loadWallets();
    const id = setInterval(fetchRates, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    window.addEventListener('walletUpdated', loadWallets);
    return () => window.removeEventListener('walletUpdated', loadWallets);
  }, [loadWallets]);

  useEffect(() => {
    api.get('/exchange/history').then(r => setHistory(r.data||[])).catch(()=>{});
  }, [success]);

  // 1 `from` = ? `to`
  const getRate = (f, t) => {
    if (f === t) return 1;
    const rates = Object.keys(liveRates).length ? liveRates : FALLBACK;
    const fRate = rates[f] || FALLBACK[f] || 1;
    const tRate = rates[t] || FALLBACK[t] || 1;
    return tRate / fRate;
  };

  const currentRate = getRate(from, to);
  const toAmount    = amount && !isNaN(amount) ? (Number(amount)*currentRate).toFixed(6) : '';
  const fromBalance = Number(wallets.find(w=>w.currency===from)?.balance || 0);

  const handleConvert = async () => {
    const numAmt = Number(amount);
    if (!numAmt || numAmt <= 0) { setError('Enter a valid amount'); return; }
    if (fromBalance < numAmt) {
      setError(`Insufficient ${from} balance. Available: ${CSYM[from]}${fromBalance.toFixed(4)}. Please add money from My Account.`);
      return;
    }

    setLoading(true); setError(''); setSuccess('');
    let convertedAmt = parseFloat((numAmt * currentRate).toFixed(6));

    try {
      // Step 1: Record conversion history
      try {
        const res = await api.post('/exchange/convert', { from, to, amount: numAmt });
        if (res.data?.toAmount) convertedAmt = Number(res.data.toAmount);
      } catch { /* continue with frontend rate */ }

      // Step 2: Deduct from source wallet
      await api.post('/users/me/wallets/adjust', { currency: from, amount: -numAmt });

      // Step 3: Add to destination wallet
      await api.post('/users/me/wallets/adjust', { currency: to, amount: convertedAmt });

      setSuccess(`✅ ${CSYM[from]}${numAmt.toLocaleString()} → ${CSYM[to]}${convertedAmt.toFixed(4)} at rate ${currentRate.toFixed(6)}`);
      setAmount('');
      loadWallets();
      window.dispatchEvent(new Event('walletUpdated'));
      api.get('/exchange/history').then(r=>setHistory(r.data||[])).catch(()=>{});
    } catch(e) {
      const msg = e.response?.data?.message || e.message || 'Unknown error';
      setError(`Conversion failed: ${msg}`);
    } finally { setLoading(false); }
  };

  const usdInrRate = liveRates['USD'] ? (1/liveRates['USD']).toFixed(4) : '84.12';

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={4}>
        <Box>
          <Typography variant="h4" sx={{fontWeight:800,color:'white'}}>💱 Currency Exchange</Typography>
          <Typography variant="body2" sx={{color:'#555',mt:0.5}}>Live rates · open.er-api.com · Updates every 30s</Typography>
        </Box>
        <Box textAlign="right">
          <Chip icon={rateLoading?<CircularProgress size={12} sx={{color:'#00C49F'}}/>:<Refresh sx={{fontSize:'14px !important'}}/>}
            label={lastUpdated?`Updated ${lastUpdated.toLocaleTimeString()}`:'Fetching...'}
            size="small" sx={{bgcolor:'rgba(0,196,159,0.12)',color:'#00C49F',border:'1px solid rgba(0,196,159,0.3)'}}/>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Rate Board */}
        <Grid item xs={12} md={4}>
          <Card sx={{...cardSx,border:'1px solid rgba(255,215,0,0.2)'}}>
            <CardContent>
              <Typography variant="caption" sx={{color:'#888',textTransform:'uppercase',letterSpacing:1}}>
                Live Rates (1 {from} =)
              </Typography>
              <Typography variant="h3" sx={{fontWeight:900,color:'#FFD700',my:1}}>
                {currentRate >= 1 ? currentRate.toFixed(4) : currentRate.toFixed(6)}
              </Typography>
              <Typography variant="body2" sx={{color:'#888',mb:2}}>
                1 {from} = {currentRate.toFixed(6)} {to}
              </Typography>
              <Divider sx={{borderColor:'rgba(255,255,255,0.08)',mb:2}}/>
              {CURRENCIES.filter(c=>c!==from).map(c=>(
                <Box key={c} display="flex" justifyContent="space-between" py={0.8}
                  sx={{borderRadius:1,px:0.5,'&:hover':{background:'rgba(255,255,255,0.03)'}}}>
                  <Typography variant="body2" sx={{color:'#888'}}>1 {from}</Typography>
                  <Typography variant="body2" sx={{color:CCOL[c]||'#aaa',fontWeight:700}}>
                    = {CSYM[c]}{getRate(from,c).toFixed(c==='JPY'?2:4)} {c}
                  </Typography>
                </Box>
              ))}
              <Box mt={2} p={1} sx={{background:'rgba(0,196,159,0.07)',borderRadius:2,border:'1px solid rgba(0,196,159,0.2)'}}>
                <Typography variant="caption" sx={{color:'#00C49F'}}>🌐 open.er-api.com (real-time)</Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Your Balances */}
          <Card sx={{...cardSx,mt:2}}>
            <CardContent>
              <Typography variant="caption" sx={{color:'#888',textTransform:'uppercase',letterSpacing:1,fontSize:'0.7rem'}}>
                Your Balances
              </Typography>
              {wallets.filter(w=>CURRENCIES.includes(w.currency)).map(w=>(
                <Box key={w.currency} display="flex" justifyContent="space-between" py={0.7}
                  sx={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                  <Chip label={w.currency} size="small"
                    sx={{bgcolor:`${CCOL[w.currency]||'#888'}22`,color:CCOL[w.currency]||'#888',fontWeight:700,fontSize:'0.7rem'}}/>
                  <Typography sx={{color: w.currency===from&&Number(w.balance)<=0?'#f44336':'white',fontWeight:600,fontSize:'0.88rem'}}>
                    {CSYM[w.currency]||''}{Number(w.balance||0).toFixed(2)}
                  </Typography>
                </Box>
              ))}
              {wallets.length===0 && <Typography variant="caption" sx={{color:'#555'}}>Loading...</Typography>}
            </CardContent>
          </Card>
        </Grid>

        {/* Converter */}
        <Grid item xs={12} md={8}>
          <Card sx={cardSx}>
            <CardContent>
              <Typography variant="h6" sx={{color:'white',fontWeight:700,mb:3}}>Convert & Update Wallet</Typography>
              {error   && <Alert severity="error"   sx={{mb:2,borderRadius:2}} onClose={()=>setError('')}>{error}</Alert>}
              {success && <Alert severity="success" icon={<CheckCircle/>}
                sx={{mb:2,borderRadius:2,background:'rgba(0,196,159,0.1)',border:'1px solid rgba(0,196,159,0.3)',color:'white'}}
                onClose={()=>setSuccess('')}>{success}</Alert>}

              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth sx={inputSx}>
                    <InputLabel>From</InputLabel>
                    <Select value={from} label="From" sx={{color:'white'}}
                      onChange={e=>{setFrom(e.target.value);setError('');setSuccess('');}}>
                      {CURRENCIES.map(c=>(
                        <MenuItem key={c} value={c}>
                          <Box display="flex" justifyContent="space-between" width="100%">
                            <span>{CSYM[c]} {c}</span>
                            <span style={{color:CCOL[c],fontSize:'0.8rem'}}>
                              {CSYM[c]}{Number(wallets.find(w=>w.currency===c)?.balance||0).toFixed(2)}
                            </span>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Typography variant="caption" sx={{color:fromBalance>0?'#00C49F':'#f44336',display:'block',mt:0.5}}>
                    Balance: {CSYM[from]}{fromBalance.toFixed(4)}
                    {fromBalance===0 && ' (Add money first)'}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={1} textAlign="center">
                  <Button onClick={()=>{const t=from;setFrom(to);setTo(t);setError('');setSuccess('');}}
                    sx={{minWidth:40,p:1,color:'#FFD700',border:'1px solid rgba(255,215,0,0.3)',
                      borderRadius:2,'&:hover':{background:'rgba(255,215,0,0.1)'}}}>
                    <SwapHoriz/>
                  </Button>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth sx={inputSx}>
                    <InputLabel>To</InputLabel>
                    <Select value={to} label="To" sx={{color:'white'}}
                      onChange={e=>{setTo(e.target.value);setError('');setSuccess('');}}>
                      {CURRENCIES.map(c=><MenuItem key={c} value={c}>{CSYM[c]} {c}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={3}>
                  <TextField fullWidth label={`Amount (${from})`} value={amount}
                    onChange={e=>{setAmount(e.target.value);setError('');setSuccess('');}}
                    type="number" inputProps={{min:0,step:0.01}} sx={inputSx}
                    error={!!amount && Number(amount) > fromBalance}/>
                </Grid>
              </Grid>

              {/* Preview */}
              {amount && !isNaN(amount) && Number(amount)>0 && (
                <Box mt={2} p={2} sx={{background:'rgba(255,215,0,0.06)',borderRadius:2,border:'1px solid rgba(255,215,0,0.15)'}}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={5} textAlign="center">
                      <Typography variant="caption" sx={{color:'#888'}}>You Pay</Typography>
                      <Typography variant="h5" sx={{color:'#f44336',fontWeight:900}}>
                        -{CSYM[from]}{Number(amount).toLocaleString()}
                      </Typography>
                      <Typography variant="caption" sx={{color:'#666'}}>{from} wallet</Typography>
                    </Grid>
                    <Grid item xs={2} textAlign="center">
                      <Typography sx={{color:'#FFD700',fontSize:'1.8rem'}}>→</Typography>
                    </Grid>
                    <Grid item xs={5} textAlign="center">
                      <Typography variant="caption" sx={{color:'#888'}}>You Get</Typography>
                      <Typography variant="h5" sx={{color:'#00C49F',fontWeight:900}}>
                        +{CSYM[to]}{Number(toAmount).toFixed(4)}
                      </Typography>
                      <Typography variant="caption" sx={{color:'#666'}}>{to} wallet</Typography>
                    </Grid>
                  </Grid>
                  <Divider sx={{borderColor:'rgba(255,255,255,0.08)',my:1}}/>
                  <Typography variant="caption" sx={{color:'#555'}}>
                    Rate: 1 {from} = {currentRate.toFixed(6)} {to} · Source: open.er-api.com
                  </Typography>
                </Box>
              )}

              {Number(amount) > fromBalance && fromBalance >= 0 && (
                <Alert severity="warning" sx={{mt:1,borderRadius:2,py:0.5}}>
                  Insufficient balance. Go to <strong>My Account → Add Money</strong> to top up your {from} wallet.
                </Alert>
              )}

              <Button fullWidth variant="contained" onClick={handleConvert}
                disabled={loading || !amount || Number(amount)<=0 || Number(amount)>fromBalance}
                sx={{mt:3,py:1.5,borderRadius:3,fontWeight:800,fontSize:'1rem',
                  background:'linear-gradient(135deg,#FFD700,#FFA500)',color:'#1a1a2e',
                  '&:hover':{background:'linear-gradient(135deg,#ffe033,#ffb733)',transform:'translateY(-1px)'},
                  '&.Mui-disabled':{background:'rgba(255,255,255,0.1)',color:'#555'},
                  boxShadow:'0 4px 20px rgba(255,215,0,0.3)',transition:'all 0.2s'}}>
                {loading?<CircularProgress size={22} sx={{color:'#1a1a2e'}}/>:'🔄 Convert & Update Wallets'}
              </Button>
            </CardContent>
          </Card>

          {/* Live Chart */}
          <Card sx={{...cardSx,mt:3}}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" sx={{color:'white',fontWeight:700}}>📈 USD/INR Live</Typography>
                <Chip label={`₹${usdInrRate}`} sx={{bgcolor:'rgba(255,215,0,0.1)',color:'#FFD700',fontWeight:700}}/>
              </Box>
              {chartData.length > 1 ? (
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
                    <XAxis dataKey="time" stroke="#555" tick={{fill:'#888',fontSize:11}}/>
                    <YAxis stroke="#555" tick={{fill:'#888',fontSize:11}} domain={['auto','auto']}/>
                    <Tooltip contentStyle={{background:'#1a1a2e',border:'1px solid #333',borderRadius:8}} labelStyle={{color:'#fff'}}/>
                    <Line type="monotone" dataKey="rate" stroke="#FFD700" strokeWidth={2} dot={false}/>
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Box textAlign="center" py={3}>
                  <CircularProgress sx={{color:'#FFD700'}} size={28}/>
                  <Typography variant="caption" sx={{color:'#555',display:'block',mt:1}}>Loading live chart...</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* History */}
        {history.length>0 && (
          <Grid item xs={12}>
            <Card sx={cardSx}>
              <CardContent>
                <Typography variant="h6" sx={{color:'white',fontWeight:700,mb:2}}>🕑 Conversion History</Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>{['Status','From','To','You Paid','You Got','Rate','Date'].map(h=>(
                      <TableCell key={h} sx={{color:'#888',border:'none',fontWeight:700,fontSize:'0.75rem'}}>{h}</TableCell>
                    ))}</TableRow>
                  </TableHead>
                  <TableBody>
                    {history.slice(0,10).map((h,i)=>(
                      <TableRow key={i} sx={{'&:hover':{background:'rgba(255,255,255,0.02)'}}}>
                        <TableCell sx={{border:'none'}}><CheckCircle sx={{color:'#00C49F',fontSize:18}}/></TableCell>
                        <TableCell sx={{border:'none'}}>
                          <Chip label={h.fromCurrency} size="small" sx={{bgcolor:`${CCOL[h.fromCurrency]||'#888'}22`,color:CCOL[h.fromCurrency]||'#888',fontWeight:700,fontSize:'0.7rem'}}/>
                        </TableCell>
                        <TableCell sx={{border:'none'}}>
                          <Chip label={h.toCurrency} size="small" sx={{bgcolor:`${CCOL[h.toCurrency]||'#888'}22`,color:CCOL[h.toCurrency]||'#888',fontWeight:700,fontSize:'0.7rem'}}/>
                        </TableCell>
                        <TableCell sx={{color:'#f44336',border:'none',fontWeight:700}}>-{CSYM[h.fromCurrency]}{Number(h.fromAmount).toFixed(4)}</TableCell>
                        <TableCell sx={{color:'#00C49F',border:'none',fontWeight:700}}>+{CSYM[h.toCurrency]}{Number(h.toAmount).toFixed(4)}</TableCell>
                        <TableCell sx={{color:'#888',border:'none',fontSize:'0.78rem'}}>{Number(h.rateUsed).toFixed(6)}</TableCell>
                        <TableCell sx={{color:'#555',border:'none',fontSize:'0.75rem'}}>{h.convertedAt?new Date(h.convertedAt).toLocaleString():'—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
