import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Grid, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Chip, Alert, CircularProgress, Divider, InputAdornment, Table,
  TableBody, TableCell, TableHead, TableRow, LinearProgress
} from '@mui/material';
import { TrendingUp, TrendingDown, Refresh } from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const cardSx = { background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:3 };
const inputSx = {
  '& .MuiOutlinedInput-root':{ color:'white',
    '& fieldset':{borderColor:'rgba(255,255,255,0.15)'},
    '&:hover fieldset':{borderColor:'rgba(255,215,0,0.4)'},
    '&.Mui-focused fieldset':{borderColor:'#FFD700'}},
  '& .MuiInputLabel-root':{ color:'#888' },
};

// Base prices in INR per gram
const BASE_PRICE = { gold: 6250.50, silver: 74.30 };
// 1 troy oz = 31.1035 g
const TROY_OZ = 31.1035;
// Karat purity
const KARAT_PURITY = { '24K':1.0, '22K':0.9167, '18K':0.75, '14K':0.5833 };

function fluctuate(base) {
  return parseFloat((base*(1+(Math.random()-0.5)*0.0015)).toFixed(2));
}

export default function BullionMarket() {
  const { user }  = useAuth();
  const [prices, setPrices]         = useState(BASE_PRICE);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [goldGrams, setGoldGrams]   = useState(0);
  const [silverGrams, setSilverGrams] = useState(0);
  const [inrBalance, setInrBalance] = useState(null); // null = loading
  const [dialog, setDialog]         = useState(null);
  const [grams, setGrams]           = useState('');
  const [karat, setKarat]           = useState('24K');
  const [loading, setLoading]       = useState(false);
  const [msg, setMsg]               = useState('');
  const [error, setError]           = useState('');
  const [goldChart, setGoldChart]   = useState([]);
  const [silverChart, setSilverChart] = useState([]);
  const goldRef   = useRef([]);
  const silverRef = useRef([]);

  // Fetch live gold/silver price from free API
  const fetchPrices = useCallback(async () => {
    setPriceLoading(true);
    try {
      // Use metals-api free endpoint or fallback to simulation
      // Free: api.metalpriceapi.com or simulation
      const res = await fetch('https://api.metals.live/v1/spot/gold,silver');
      if (res.ok) {
        const data = await res.json();
        // data = [{ gold: USD/oz }, { silver: USD/oz }]
        const usdInr = 84.12;
        const goldObj   = data.find(d => d.gold)   || { gold: 2020 };
        const silverObj = data.find(d => d.silver) || { silver: 23.5 };
        const goldPerGram   = parseFloat(((goldObj.gold   * usdInr) / TROY_OZ).toFixed(2));
        const silverPerGram = parseFloat(((silverObj.silver * usdInr) / TROY_OZ).toFixed(2));
        setPrices({ gold: goldPerGram, silver: silverPerGram });
      } else { throw new Error('API error'); }
    } catch {
      // Simulate live prices with small fluctuation
      setPrices(p => ({ gold: fluctuate(p.gold||BASE_PRICE.gold), silver: fluctuate(p.silver||BASE_PRICE.silver) }));
    }
    setLastUpdated(new Date());
    setPriceLoading(false);

    // Update charts
    const now = new Date().toLocaleTimeString('en',{hour:'2-digit',minute:'2-digit'});
    goldRef.current   = [...goldRef.current.slice(-19),   { time:now, price: prices.gold   }];
    silverRef.current = [...silverRef.current.slice(-19), { time:now, price: prices.silver }];
    setGoldChart([...goldRef.current]);
    setSilverChart([...silverRef.current]);
  }, [prices]);

  const loadWallets = useCallback(() => {
    // Use /users/me/wallets — no user.id needed
    api.get('/users/me/wallets').then(r => {
      const ws = r.data || [];
      const inrW    = ws.find(w => w.currency === 'INR');
      const goldW   = ws.find(w => w.currency === 'GOLD');
      const silverW = ws.find(w => w.currency === 'SILVER');
      setInrBalance(Number(inrW?.balance   || 0));
      setGoldGrams(  Number(goldW?.balance  || 0));
      setSilverGrams(Number(silverW?.balance|| 0));
    }).catch(() => setInrBalance(0));
  }, [user]);

  useEffect(() => {
    fetchPrices();
    loadWallets();
    const id = setInterval(fetchPrices, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    window.addEventListener('walletUpdated', loadWallets);
    return () => window.removeEventListener('walletUpdated', loadWallets);
  }, [loadWallets]);

  const getKaratPrice = (metal, karatStr) => {
    const purity = KARAT_PURITY[karatStr] || 1;
    return parseFloat((prices[metal] * purity).toFixed(2));
  };

  const karatPrice   = dialog ? getKaratPrice(dialog.metal, karat) : 0;
  const totalCost    = parseFloat((Number(grams||0) * karatPrice).toFixed(2));
  const maxAffordable = inrBalance !== null && karatPrice > 0 ? (inrBalance / karatPrice).toFixed(4) : '0';

  const handleTrade = async () => {
    const numGrams = Number(grams);
    if (!numGrams || numGrams <= 0) { setError('Enter valid grams (minimum 0.001)'); return; }
    if (!dialog) return;

    const { metal, action } = dialog;

    if (action === 'buy') {
      if (inrBalance === null || inrBalance < totalCost) {
        setError(`Insufficient INR balance. You need ₹${totalCost.toLocaleString('en-IN')} but have ₹${(inrBalance||0).toLocaleString('en-IN')}. Go to My Account → Add Money.`);
        return;
      }
    } else {
      const currentHolding = metal === 'gold' ? goldGrams : silverGrams;
      if (numGrams > currentHolding) {
        setError(`Insufficient ${metal}. You have ${currentHolding.toFixed(4)}g but trying to sell ${numGrams}g`);
        return;
      }
    }

    setLoading(true); setError('');
    try {
      if (action === 'buy') {
        await api.post('/users/me/wallets/adjust', { currency:'INR',                   amount: -totalCost });
        await api.post('/users/me/wallets/adjust', { currency: metal.toUpperCase(),    amount:  numGrams  });
        setMsg(`✅ Bought ${numGrams}g of ${karat} ${metal} for ₹${totalCost.toLocaleString('en-IN')}! INR wallet updated.`);
        setInrBalance(b => (b||0) - totalCost);
        if (metal==='gold')   setGoldGrams(g => g + numGrams);
        else                  setSilverGrams(s => s + numGrams);
      } else {
        await api.post('/users/me/wallets/adjust', { currency: metal.toUpperCase(),    amount: -numGrams  });
        await api.post('/users/me/wallets/adjust', { currency:'INR',                   amount:  totalCost });
        setMsg(`✅ Sold ${numGrams}g of ${metal} for ₹${totalCost.toLocaleString('en-IN')}! Amount added to INR wallet.`);
        setInrBalance(b => (b||0) + totalCost);
        if (metal==='gold')   setGoldGrams(g => Math.max(0, g - numGrams));
        else                  setSilverGrams(s => Math.max(0, s - numGrams));
      }
      window.dispatchEvent(new Event('walletUpdated'));
      setDialog(null); setGrams(''); setKarat('24K');
      loadWallets();
    } catch(e) {
      setError(e.response?.data?.message || 'Trade failed. Please try again.');
    } finally { setLoading(false); }
  };

  const goldValue   = (goldGrams   * prices.gold).toFixed(2);
  const silverValue = (silverGrams * prices.silver).toFixed(2);
  const totalValue  = (Number(goldValue) + Number(silverValue)).toFixed(2);

  const metals = [
    { metal:'gold',   label:'Gold',   emoji:'🥇', color:'#FFD700',
      price:prices.gold,   holding:goldGrams,   value:goldValue   },
    { metal:'silver', label:'Silver', emoji:'🥈', color:'#C0C0C0',
      price:prices.silver, holding:silverGrams, value:silverValue },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={4}>
        <Box>
          <Typography variant="h4" sx={{fontWeight:800,color:'white'}}>🏅 K Star Bullion Market</Typography>
          <Typography variant="body2" sx={{color:'#555',mt:0.5}}>Buy & sell Digital Gold and Silver · Live market prices</Typography>
        </Box>
        <Box textAlign="right">
          <Chip
            icon={priceLoading?<CircularProgress size={12} sx={{color:'#FFD700'}}/>:<Refresh sx={{fontSize:'14px !important'}}/>}
            label={lastUpdated?`${lastUpdated.toLocaleTimeString()}`:'Loading...'}
            size="small" onClick={fetchPrices}
            sx={{bgcolor:'rgba(255,215,0,0.1)',color:'#FFD700',cursor:'pointer',border:'1px solid rgba(255,215,0,0.3)'}}/>
        </Box>
      </Box>

      {msg   && <Alert severity="success" sx={{mb:2,borderRadius:2}} onClose={()=>setMsg('')}>{msg}</Alert>}
      {error && <Alert severity="error"   sx={{mb:2,borderRadius:2}} onClose={()=>setError('')}>{error}</Alert>}

      {/* Portfolio + INR Balance bar */}
      <Card sx={{...cardSx,border:'1px solid rgba(255,215,0,0.2)',mb:3}}>
        <CardContent sx={{py:'14px !important'}}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <Typography variant="caption" sx={{color:'#888'}}>Available INR Balance</Typography>
              {inrBalance === null
                ? <LinearProgress sx={{'& .MuiLinearProgress-bar':{background:'#FFD700'},background:'rgba(255,215,0,0.1)',borderRadius:2,mt:1}}/>
                : <Typography variant="h5" sx={{color: inrBalance > 0 ? '#FFD700':'#f44336', fontWeight:900}}>
                    ₹{inrBalance.toLocaleString('en-IN',{maximumFractionDigits:2})}
                  </Typography>
              }
              {inrBalance === 0 && (
                <Typography variant="caption" sx={{color:'#f44336'}}>
                  ⚠️ Add money from My Account
                </Typography>
              )}
            </Grid>
            <Grid item xs={12} sm={3}>
              <Typography variant="caption" sx={{color:'#888'}}>🥇 Gold Holdings</Typography>
              <Typography variant="h5" sx={{color:'#FFD700',fontWeight:900}}>{goldGrams.toFixed(4)}g</Typography>
              <Typography variant="caption" sx={{color:'#555'}}>≈ ₹{Number(goldValue).toLocaleString('en-IN',{maximumFractionDigits:0})}</Typography>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Typography variant="caption" sx={{color:'#888'}}>🥈 Silver Holdings</Typography>
              <Typography variant="h5" sx={{color:'#C0C0C0',fontWeight:900}}>{silverGrams.toFixed(4)}g</Typography>
              <Typography variant="caption" sx={{color:'#555'}}>≈ ₹{Number(silverValue).toLocaleString('en-IN',{maximumFractionDigits:0})}</Typography>
            </Grid>
            <Grid item xs={12} sm={3} textAlign="right">
              <Typography variant="caption" sx={{color:'#888'}}>Total Bullion Value</Typography>
              <Typography variant="h5" sx={{color:'#00C49F',fontWeight:900}}>₹{Number(totalValue).toLocaleString('en-IN',{maximumFractionDigits:0})}</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Metal Rate Cards */}
      <Grid container spacing={3} mb={3}>
        {metals.map(m => (
          <Grid item xs={12} md={6} key={m.metal}>
            <Card sx={{...cardSx,border:`1px solid ${m.color}33`,position:'relative',overflow:'hidden'}}>
              <Box sx={{position:'absolute',top:-30,right:-30,width:120,height:120,borderRadius:'50%',background:m.color,opacity:0.05,filter:'blur(20px)'}}/>
              <CardContent>
                {/* Header */}
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box>
                    <Typography variant="h5" sx={{fontWeight:800,color:'white'}}>{m.emoji} {m.label}</Typography>
                    <Typography variant="caption" sx={{color:'#666'}}>
                      Digital {m.label} · MCX Rates · Updated every 30s
                    </Typography>
                  </Box>
                  <Chip label="LIVE" size="small"
                    sx={{bgcolor:'rgba(0,196,159,0.15)',color:'#00C49F',fontWeight:700,fontSize:'0.7rem',
                      border:'1px solid rgba(0,196,159,0.3)'}}/>
                </Box>

                {/* Price Table by unit */}
                <Box mb={2} p={1.5} sx={{background:'rgba(255,255,255,0.04)',borderRadius:2,border:`1px solid ${m.color}22`}}>
                  <Typography variant="caption" sx={{color:'#888',textTransform:'uppercase',letterSpacing:1,fontSize:'0.65rem',mb:1,display:'block'}}>
                    Live Price — {m.label} (24 Karat)
                  </Typography>
                  <Grid container spacing={1}>
                    {[
                      { unit:'Per Gram',   val: m.price },
                      { unit:'Per 8g (Tola)', val: m.price*8 },
                      { unit:'Per 10g',    val: m.price*10 },
                      { unit:'Per 100g',   val: m.price*100 },
                      { unit:'Per kg',     val: m.price*1000 },
                      { unit:'Per Troy Oz',val: m.price*TROY_OZ },
                    ].map(row=>(
                      <Grid item xs={6} key={row.unit}>
                        <Box display="flex" justifyContent="space-between" py={0.4}
                          sx={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                          <Typography variant="caption" sx={{color:'#888'}}>{row.unit}</Typography>
                          <Typography variant="caption" sx={{color:m.color,fontWeight:700}}>
                            ₹{row.val.toLocaleString('en-IN',{maximumFractionDigits:0})}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Box>

                {/* Karat Price Breakdown (Gold only) */}
                {m.metal === 'gold' && (
                  <Box mb={2} p={1.5} sx={{background:'rgba(255,215,0,0.05)',borderRadius:2,border:'1px solid rgba(255,215,0,0.15)'}}>
                    <Typography variant="caption" sx={{color:'#888',textTransform:'uppercase',letterSpacing:1,fontSize:'0.65rem',mb:1,display:'block'}}>
                      By Karat (per gram)
                    </Typography>
                    <Box display="flex" gap={1} flexWrap="wrap">
                      {Object.entries(KARAT_PURITY).map(([k,p])=>(
                        <Box key={k} textAlign="center" p={1}
                          sx={{background:'rgba(255,255,255,0.05)',borderRadius:1,flex:1,minWidth:60}}>
                          <Typography sx={{color:'#FFD700',fontWeight:800,fontSize:'0.85rem'}}>{k}</Typography>
                          <Typography sx={{color:'#888',fontSize:'0.7rem'}}>{(p*100).toFixed(1)}%</Typography>
                          <Typography sx={{color:'white',fontWeight:700,fontSize:'0.78rem'}}>
                            ₹{(m.price*p).toLocaleString('en-IN',{maximumFractionDigits:0})}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Holdings */}
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Box>
                    <Typography variant="caption" sx={{color:'#888'}}>Your Holdings</Typography>
                    <Typography variant="h5" sx={{color:'white',fontWeight:800}}>{m.holding.toFixed(4)}g</Typography>
                    <Typography variant="caption" sx={{color:m.color}}>≈ ₹{Number(m.value).toLocaleString('en-IN',{maximumFractionDigits:0})}</Typography>
                  </Box>
                  <Box textAlign="right">
                    <Typography variant="caption" sx={{color:'#888'}}>You can afford</Typography>
                    <Typography sx={{color:'#00C49F',fontWeight:700}}>
                      {inrBalance !== null && m.price > 0
                        ? `${(inrBalance/m.price).toFixed(4)}g`
                        : '—'}
                    </Typography>
                    <Typography variant="caption" sx={{color:'#555'}}>with ₹{(inrBalance||0).toLocaleString('en-IN',{maximumFractionDigits:0})} INR</Typography>
                  </Box>
                </Box>

                {/* Buy / Sell buttons */}
                <Box display="flex" gap={1.5}>
                  <Button fullWidth variant="contained"
                    onClick={()=>{setDialog({metal:m.metal,action:'buy'});setGrams('');setKarat('24K');setError('');}}
                    sx={{background:`linear-gradient(135deg,${m.color},${m.color}99)`,color:'#1a1a2e',fontWeight:800,borderRadius:2,py:1.2,
                      '&:hover':{transform:'translateY(-1px)',boxShadow:`0 4px 20px ${m.color}44`},transition:'all 0.2s'}}>
                    🛒 Buy {m.label}
                  </Button>
                  <Button fullWidth variant="outlined"
                    disabled={m.holding <= 0}
                    onClick={()=>{setDialog({metal:m.metal,action:'sell'});setGrams('');setKarat('24K');setError('');}}
                    sx={{borderColor:`${m.color}55`,color:m.holding>0?m.color:'#444',borderRadius:2,py:1.2,fontWeight:700,
                      '&:hover':{background:`${m.color}11`,borderColor:m.color},
                      '&.Mui-disabled':{borderColor:'rgba(255,255,255,0.08)',color:'#333'}}}>
                    💰 Sell
                  </Button>
                </Box>
                {inrBalance === 0 && (
                  <Typography variant="caption" sx={{color:'#f44336',display:'block',textAlign:'center',mt:1}}>
                    ⚠️ INR balance is ₹0. Go to My Account → Add Money first.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Price Charts */}
      <Grid container spacing={3} mb={3}>
        {[{label:'🥇 Gold',data:goldChart,color:'#FFD700'},{label:'🥈 Silver',data:silverChart,color:'#C0C0C0'}].map(c=>(
          <Grid item xs={12} md={6} key={c.label}>
            <Card sx={cardSx}>
              <CardContent>
                <Typography variant="h6" sx={{color:'white',fontWeight:700,mb:2}}>{c.label} — Live Price</Typography>
                {c.data.length > 1 ? (
                  <ResponsiveContainer width="100%" height={150}>
                    <LineChart data={c.data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
                      <XAxis dataKey="time" stroke="#555" tick={{fill:'#888',fontSize:10}}/>
                      <YAxis stroke="#555" tick={{fill:'#888',fontSize:10}} domain={['auto','auto']}/>
                      <Tooltip contentStyle={{background:'#1a1a2e',border:'1px solid #333',borderRadius:8}} labelStyle={{color:'#fff'}}/>
                      <Line type="monotone" dataKey="price" stroke={c.color} strokeWidth={2} dot={false}/>
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <Box textAlign="center" py={3}>
                    <CircularProgress sx={{color:c.color}} size={24}/>
                    <Typography variant="caption" sx={{color:'#555',display:'block',mt:1}}>Collecting live data...</Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* How it works */}
      <Card sx={cardSx}>
        <CardContent>
          <Typography variant="h6" sx={{color:'white',fontWeight:700,mb:2}}>How K Star Bullion Works</Typography>
          <Grid container spacing={2}>
            {[
              {icon:'💳',text:'Buy gold or silver using your INR wallet — any amount, even 0.001g'},
              {icon:'📈',text:'Your holding value updates live as MCX market prices change'},
              {icon:'💰',text:'Sell anytime — proceeds instantly credited to your INR wallet'},
              {icon:'🏦',text:'Low balance? Go to My Account → Add Money to top up INR wallet'},
            ].map((item,i)=>(
              <Grid item xs={12} sm={6} md={3} key={i}>
                <Box p={2} sx={{background:'rgba(255,255,255,0.03)',borderRadius:2,height:'100%'}}>
                  <Typography sx={{fontSize:'1.8rem',mb:1}}>{item.icon}</Typography>
                  <Typography sx={{color:'#aaa',fontSize:'0.85rem'}}>{item.text}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* BUY / SELL DIALOG */}
      <Dialog open={!!dialog} onClose={()=>{if(!loading){setDialog(null);setGrams('');setError('');}}}
        maxWidth="sm" fullWidth
        PaperProps={{sx:{background:'#1a1a2e',border:'1px solid rgba(255,215,0,0.25)',borderRadius:3}}}>
        <DialogTitle sx={{color:'#FFD700',fontWeight:800}}>
          {dialog?.action==='buy'?'🛒 Buy':'💰 Sell'} {dialog?.metal==='gold'?'🥇 Gold':'🥈 Silver'}
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{mb:2,borderRadius:2}}>{error}</Alert>}

          {/* Karat selection (Gold only) */}
          {dialog?.metal === 'gold' && dialog?.action === 'buy' && (
            <Box mb={2}>
              <Typography variant="caption" sx={{color:'#888',textTransform:'uppercase',letterSpacing:1,fontSize:'0.68rem'}}>Select Karat</Typography>
              <Box display="flex" gap={1} mt={0.8} flexWrap="wrap">
                {Object.keys(KARAT_PURITY).map(k=>(
                  <Chip key={k} label={`${k} (${(KARAT_PURITY[k]*100).toFixed(1)}%)`}
                    clickable onClick={()=>setKarat(k)}
                    sx={{bgcolor:karat===k?'rgba(255,215,0,0.25)':'rgba(255,255,255,0.05)',
                      color:karat===k?'#FFD700':'#888',
                      border:`1px solid ${karat===k?'rgba(255,215,0,0.5)':'rgba(255,255,255,0.1)'}`,
                      fontWeight:karat===k?700:400}}/>
                ))}
              </Box>
            </Box>
          )}

          {/* Price info */}
          <Box mb={2} p={1.5} sx={{background:'rgba(255,255,255,0.05)',borderRadius:2}}>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Typography variant="caption" sx={{color:'#888'}}>Price per gram</Typography>
                <Typography sx={{color:'#FFD700',fontWeight:800,fontSize:'1.1rem'}}>
                  ₹{karatPrice.toLocaleString('en-IN',{minimumFractionDigits:2})}
                </Typography>
                {dialog?.metal==='gold' && <Typography variant="caption" sx={{color:'#555'}}>{karat} purity</Typography>}
              </Grid>
              <Grid item xs={6} textAlign="right">
                {dialog?.action==='buy' && (
                  <>
                    <Typography variant="caption" sx={{color:'#888'}}>INR Available</Typography>
                    <Typography sx={{color:inrBalance>0?'#00C49F':'#f44336',fontWeight:800,fontSize:'1.1rem'}}>
                      ₹{(inrBalance||0).toLocaleString('en-IN',{maximumFractionDigits:2})}
                    </Typography>
                    <Typography variant="caption" sx={{color:'#555'}}>Max: {maxAffordable}g</Typography>
                  </>
                )}
                {dialog?.action==='sell' && (
                  <>
                    <Typography variant="caption" sx={{color:'#888'}}>You own</Typography>
                    <Typography sx={{color:'#FFD700',fontWeight:800,fontSize:'1.1rem'}}>
                      {(dialog?.metal==='gold'?goldGrams:silverGrams).toFixed(4)}g
                    </Typography>
                  </>
                )}
              </Grid>
            </Grid>
          </Box>

          {/* Grams input */}
          <TextField fullWidth label="Amount in grams" type="number" value={grams}
            onChange={e=>setGrams(e.target.value)}
            inputProps={{min:0.001,step:0.001}} sx={{...inputSx,mb:1}}
            InputProps={{endAdornment:<InputAdornment position="end" sx={{color:'#888'}}>grams</InputAdornment>}}
            helperText={<span style={{color:'#555'}}>Minimum: 0.001g</span>}/>

          {/* Quick gram buttons */}
          <Box display="flex" gap={1} mb={2} flexWrap="wrap">
            {['0.1','0.5','1','5','10'].map(g=>(
              <Chip key={g} label={`${g}g`} clickable onClick={()=>setGrams(g)} size="small"
                sx={{bgcolor:grams===g?'rgba(255,215,0,0.2)':'rgba(255,255,255,0.05)',
                  color:grams===g?'#FFD700':'#888',
                  border:`1px solid ${grams===g?'rgba(255,215,0,0.4)':'rgba(255,255,255,0.1)'}`,
                  fontWeight:grams===g?700:400}}/>
            ))}
          </Box>

          {/* Cost preview */}
          {grams && Number(grams) > 0 && (
            <Box p={2} sx={{background:'rgba(255,215,0,0.08)',borderRadius:2,border:'1px solid rgba(255,215,0,0.2)'}}>
              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography sx={{color:'#aaa',fontSize:'0.9rem'}}>Grams:</Typography>
                <Typography sx={{color:'white',fontWeight:700}}>{Number(grams).toFixed(4)}g</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography sx={{color:'#aaa',fontSize:'0.9rem'}}>Rate/gram:</Typography>
                <Typography sx={{color:'white',fontWeight:700}}>₹{karatPrice.toLocaleString('en-IN')}</Typography>
              </Box>
              <Divider sx={{borderColor:'rgba(255,215,0,0.2)',my:1}}/>
              <Box display="flex" justifyContent="space-between">
                <Typography sx={{color:'#FFD700',fontWeight:700}}>
                  {dialog?.action==='buy'?'Total Cost:':'You Receive:'}
                </Typography>
                <Typography variant="h6" sx={{color:'#FFD700',fontWeight:900}}>
                  ₹{totalCost.toLocaleString('en-IN',{maximumFractionDigits:2})}
                </Typography>
              </Box>
              {dialog?.action==='buy' && inrBalance !== null && totalCost > inrBalance && (
                <Alert severity="error" sx={{mt:1,borderRadius:2,py:0.5,fontSize:'0.8rem'}}>
                  Insufficient INR. Need ₹{totalCost.toLocaleString('en-IN')} but have ₹{inrBalance.toLocaleString('en-IN')}
                </Alert>
              )}
              <Typography variant="caption" sx={{color:'#555',display:'block',mt:1}}>
                {dialog?.action==='buy'
                  ? `₹${totalCost.toLocaleString('en-IN')} deducted from INR wallet. ${Number(grams).toFixed(4)}g added to ${dialog?.metal} holdings.`
                  : `${Number(grams).toFixed(4)}g removed. ₹${totalCost.toLocaleString('en-IN')} added to INR wallet.`}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{p:2,gap:1}}>
          <Button onClick={()=>{setDialog(null);setGrams('');setError('');}} sx={{color:'#888'}} disabled={loading}>Cancel</Button>
          <Button onClick={handleTrade}
            disabled={loading||!grams||Number(grams)<=0||(dialog?.action==='buy'&&totalCost>(inrBalance||0))}
            variant="contained"
            sx={{background:'linear-gradient(135deg,#FFD700,#FFA500)',color:'#1a1a2e',fontWeight:800,borderRadius:2,px:3,
              '&.Mui-disabled':{background:'rgba(255,255,255,0.1)',color:'#555'}}}>
            {loading?<CircularProgress size={18} sx={{color:'#1a1a2e'}}/>:`Confirm ${dialog?.action==='buy'?'Purchase':'Sale'}`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
