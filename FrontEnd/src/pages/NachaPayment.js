import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Button, Grid,
  Select, MenuItem, FormControl, InputLabel, Alert, CircularProgress,
  Table, TableBody, TableCell, TableHead, TableRow, Chip, Divider,
  Tooltip, IconButton
} from '@mui/material';
import { AccountBalance, CheckCircle, Info } from '@mui/icons-material';
import api from '../api/axios';

const cardSx = { background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:3 };
const inputSx = {
  '& .MuiOutlinedInput-root':{ color:'white','& fieldset':{borderColor:'rgba(255,255,255,0.15)'},
    '&:hover fieldset':{borderColor:'rgba(255,215,0,0.4)'},'&.Mui-focused fieldset':{borderColor:'#FFD700'}},
  '& .MuiInputLabel-root':{ color:'#888' }, '& .MuiSelect-icon':{ color:'#888' },
};

const STATUS_COLOR = { PENDING:'#FFD700', SUBMITTED:'#0088FE', SETTLED:'#00C49F', FAILED:'#f44336', RETURNED:'#FF8042', PROCESSING:'#a855f7' };

const SEC_CODES = [
  { value:'PPD', label:'PPD — Prearranged Payment & Deposit', desc:'Consumer personal accounts (salary, rent, utilities)' },
  { value:'CCD', label:'CCD — Corporate Credit or Debit',    desc:'Business-to-business payments' },
  { value:'WEB', label:'WEB — Internet-Initiated Entry',     desc:'Online payments initiated via internet' },
  { value:'TEL', label:'TEL — Telephone-Initiated Entry',    desc:'Payments authorized over phone' },
  { value:'CTX', label:'CTX — Corporate Trade Exchange',     desc:'B2B with EDI addenda records' },
];

const RETURN_CODES = [
  {code:'R01', reason:'Insufficient Funds (NSF)',      desc:'Sender does not have enough money'},
  {code:'R02', reason:'Bank Account Closed',           desc:'Receiver account is closed'},
  {code:'R03', reason:'No Account / Unable to Locate', desc:'Account number does not exist'},
  {code:'R04', reason:'Invalid Account Number',        desc:'Account number format is wrong'},
  {code:'R06', reason:'Returned per ODFI Request',     desc:'Originating bank recalled payment'},
  {code:'R07', reason:'Authorization Revoked',         desc:'Customer revoked payment authorization'},
  {code:'R09', reason:'Uncollected Funds',             desc:'Funds not yet cleared in account'},
  {code:'R10', reason:'Customer Advises Not Authorized',desc:'Customer did not authorize transaction'},
  {code:'R16', reason:'Account Frozen',                desc:'Account temporarily restricted'},
  {code:'R20', reason:'Non-Transaction Account',       desc:'Savings account withdrawal limit exceeded'},
  {code:'R29', reason:'Corporate Customer Advises Not Authorized', desc:'For CCD/CTX only'},
];

export default function NachaPayment() {
  const [tab, setTab] = useState('transfer'); // 'transfer' | 'return' | 'history'
  const [form, setForm] = useState({
    secCode:'PPD', type:'CREDIT',
    originatorName:'', originatorRoutingNumber:'', originatorAccountNumber:'',
    receiverName:'', receiverRoutingNumber:'', receiverAccountNumber:'',
    accountType:'CHECKING', amount:'', description:''
  });
  const [returnForm, setReturnForm] = useState({ paymentId:'', returnCode:'R01', reason:'' });
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(null);
  const [error, setError]       = useState('');
  const [history, setHistory]   = useState([]);

  const loadHistory = () => {
    api.get('/nacha/payments').then(r => setHistory(r.data || [])).catch(() => {});
  };

  useEffect(() => {
    loadHistory();
  }, [success]);

  const handleChange = e => { setForm(f=>({...f,[e.target.name]:e.target.value})); setError(''); };

  const validate = () => {
    if (!form.originatorName) return 'Originator Name is required';
    if (!/^\d{9}$/.test(form.originatorRoutingNumber)) return 'Originator Routing Number must be exactly 9 digits';
    if (!form.originatorAccountNumber) return 'Originator Account Number is required';
    if (!form.receiverName) return 'Receiver Name is required';
    if (!/^\d{9}$/.test(form.receiverRoutingNumber)) return 'Receiver Routing Number must be exactly 9 digits';
    if (!form.receiverAccountNumber) return 'Receiver Account Number is required';
    if (!form.amount || Number(form.amount) <= 0) return 'Amount must be greater than 0';
    return null;
  };

  const handleSubmit = async () => {
    const err = validate(); if (err) { setError(err); return; }
    setLoading(true); setError('');
    try {
      const res = await api.post('/nacha/payments', { ...form, amount: Number(form.amount) });
      setSuccess(res.data);
      setForm(f=>({...f, originatorName:'', originatorRoutingNumber:'', originatorAccountNumber:'',
        receiverName:'', receiverRoutingNumber:'', receiverAccountNumber:'', amount:'', description:''}));
    } catch(e) { setError(e.response?.data?.message||'Payment failed. Check details.'); }
    finally { setLoading(false); }
  };

  const handleReturn = async () => {
    if (!returnForm.paymentId) { setError('Enter Payment ID to return'); return; }
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams({ returnCode: returnForm.returnCode });
      if (returnForm.reason) params.append('reason', returnForm.reason);
      const res = await api.post(`/nacha/payments/${returnForm.paymentId}/return?${params}`);
      setSuccess(res.data);
      setReturnForm(f => ({ ...f, paymentId: '', reason: '' }));
    } catch(e) { setError(e.response?.data?.message || 'Return failed. Check Payment ID.'); }
    finally { setLoading(false); }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{fontWeight:800,color:'white',mb:0.5}}>🏦 NACHA / ACH Payment System</Typography>
      <Typography variant="body2" sx={{color:'#555',mb:3}}>US Automated Clearing House — Direct Bank Account Transfers</Typography>

      {/* Tab buttons */}
      <Box display="flex" gap={1} mb={3}>
        {[{key:'transfer',label:'Initiate Payment'},{key:'return',label:'Return Payment'},{key:'returns',label:'Return Codes'}].map(t=>(
          <Button key={t.key} variant={tab===t.key?'contained':'outlined'} onClick={()=>setTab(t.key)}
            sx={tab===t.key
              ? {background:'linear-gradient(135deg,#FFD700,#FFA500)',color:'#1a1a2e',fontWeight:800,borderRadius:2}
              : {borderColor:'rgba(255,215,0,0.3)',color:'#888',borderRadius:2,'&:hover':{background:'rgba(255,215,0,0.08)'}}}>
            {t.label}
          </Button>
        ))}
      </Box>

      {success && (
        <Alert severity="success" icon={<CheckCircle/>}
          sx={{mb:2,borderRadius:2,background:'rgba(0,196,159,0.1)',border:'1px solid rgba(0,196,159,0.3)',color:'white'}}
          onClose={()=>setSuccess(null)}>
          Payment ID: <strong>{success.paymentId}</strong> | Status: {success.status} | Trace: {success.traceNumber}<br/>
          <Typography variant="caption">Effective Date: {success.effectiveDate ? new Date(success.effectiveDate).toLocaleDateString() : 'Next Business Day (T+1)'}</Typography>
        </Alert>
      )}
      {error && <Alert severity="error" sx={{mb:2,borderRadius:2}} onClose={()=>setError('')}>{error}</Alert>}

      {/* INITIATE PAYMENT TAB */}
      {tab === 'transfer' && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card sx={{...cardSx,border:'1px solid rgba(255,215,0,0.15)'}}>
              <CardContent>
                <Typography variant="h6" sx={{color:'white',fontWeight:700,mb:3}}>New NACHA Payment Entry</Typography>

                {/* Entry Class & Type */}
                <Grid container spacing={2} mb={2}>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth sx={inputSx}>
                      <InputLabel sx={{color:'#888'}}>SEC Code</InputLabel>
                      <Select name="secCode" value={form.secCode} onChange={handleChange} label="SEC Code" sx={{color:'white'}}>
                        {SEC_CODES.map(s=>(
                          <MenuItem key={s.value} value={s.value}>
                            <Box>
                              <Typography sx={{fontSize:'0.85rem',fontWeight:700}}>{s.value}</Typography>
                              <Typography variant="caption" sx={{color:'#888'}}>{s.desc}</Typography>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <Typography variant="caption" sx={{color:'#666',mt:0.5,display:'block'}}>
                      {SEC_CODES.find(s=>s.value===form.secCode)?.desc}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth sx={inputSx}>
                      <InputLabel>Transaction Type</InputLabel>
                      <Select name="type" value={form.type} onChange={handleChange} label="Transaction Type" sx={{color:'white'}}>
                        <MenuItem value="CREDIT">CREDIT — Push funds to receiver</MenuItem>
                        <MenuItem value="DEBIT">DEBIT — Pull funds from receiver</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth sx={inputSx}>
                      <InputLabel>Account Type</InputLabel>
                      <Select name="accountType" value={form.accountType} onChange={handleChange} label="Account Type" sx={{color:'white'}}>
                        <MenuItem value="CHECKING">CHECKING (DDA)</MenuItem>
                        <MenuItem value="SAVINGS">SAVINGS (SDA)</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                {/* Originator (ODFI side) */}
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <Typography variant="caption" sx={{color:'#FFD700',fontWeight:700,letterSpacing:1,textTransform:'uppercase'}}>
                    Originator Details (ODFI)
                  </Typography>
                  <Tooltip title="ODFI = Originating Depository Financial Institution — your bank"><Info sx={{color:'#555',fontSize:16}}/></Tooltip>
                </Box>
                <Divider sx={{mb:1.5,borderColor:'rgba(255,215,0,0.1)'}}/>
                <Grid container spacing={2} mb={2}>
                  <Grid item xs={12}><TextField fullWidth label="Originator Name" name="originatorName" value={form.originatorName} onChange={handleChange} sx={inputSx} helperText={<span style={{color:'#555'}}>Company or individual sending the payment</span>}/></Grid>
                  <Grid item xs={6}><TextField fullWidth label="ABA Routing Number (9 digits)" name="originatorRoutingNumber" value={form.originatorRoutingNumber} onChange={handleChange} inputProps={{maxLength:9}} sx={inputSx} helperText={<span style={{color:'#555'}}>9-digit transit/routing number of originator's bank</span>}/></Grid>
                  <Grid item xs={6}><TextField fullWidth label="DDA Account Number" name="originatorAccountNumber" value={form.originatorAccountNumber} onChange={handleChange} sx={inputSx} helperText={<span style={{color:'#555'}}>Demand Deposit Account number</span>}/></Grid>
                </Grid>

                {/* Receiver (RDFI side) */}
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <Typography variant="caption" sx={{color:'#00C49F',fontWeight:700,letterSpacing:1,textTransform:'uppercase'}}>
                    Receiver Details (RDFI)
                  </Typography>
                  <Tooltip title="RDFI = Receiving Depository Financial Institution — receiver's bank"><Info sx={{color:'#555',fontSize:16}}/></Tooltip>
                </Box>
                <Divider sx={{mb:1.5,borderColor:'rgba(0,196,159,0.1)'}}/>
                <Grid container spacing={2} mb={2}>
                  <Grid item xs={12}><TextField fullWidth label="Individual / Company Name" name="receiverName" value={form.receiverName} onChange={handleChange} sx={inputSx} helperText={<span style={{color:'#555'}}>Name appearing on receiver's bank account</span>}/></Grid>
                  <Grid item xs={6}><TextField fullWidth label="ABA Routing Number (9 digits)" name="receiverRoutingNumber" value={form.receiverRoutingNumber} onChange={handleChange} inputProps={{maxLength:9}} sx={inputSx}/></Grid>
                  <Grid item xs={6}><TextField fullWidth label="DDA/SDA Account Number" name="receiverAccountNumber" value={form.receiverAccountNumber} onChange={handleChange} sx={inputSx}/></Grid>
                  <Grid item xs={6}>
                    <TextField fullWidth label="Amount (USD)" type="number" name="amount" value={form.amount}
                      onChange={handleChange} sx={inputSx}
                      InputProps={{startAdornment:<Box component="span" sx={{color:'#FFD700',mr:1,fontWeight:700}}>$</Box>}}/>
                  </Grid>
                  <Grid item xs={6}>
                    <TextField fullWidth label="Individual Entry Description" name="description" value={form.description}
                      onChange={handleChange} inputProps={{maxLength:10}} sx={inputSx}
                      helperText={<span style={{color:'#555'}}>Max 10 chars — appears on bank statement</span>}/>
                  </Grid>
                </Grid>

                <Button fullWidth variant="contained" onClick={handleSubmit} disabled={loading}
                  startIcon={<AccountBalance/>} sx={{
                    py:1.5,borderRadius:3,fontWeight:800,fontSize:'1rem',
                    background:'linear-gradient(135deg,#FFD700,#FFA500)',color:'#1a1a2e',
                    '&:hover':{transform:'translateY(-1px)',boxShadow:'0 6px 25px rgba(255,215,0,0.4)'},transition:'all 0.2s'
                  }}>
                  {loading?<CircularProgress size={22} sx={{color:'#1a1a2e'}}/>:'Submit NACHA Entry'}
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Side info */}
          <Grid item xs={12} md={4}>
            <Card sx={cardSx}>
              <CardContent>
                <Typography variant="h6" sx={{color:'white',fontWeight:700,mb:2}}>NACHA File Structure</Typography>
                {[
                  {label:'File Header (1)', desc:'IAT, EFF date, company info'},
                  {label:'Batch Header (5)', desc:'SEC code, company entry desc'},
                  {label:'Entry Detail (6)', desc:'Routing, account, amount'},
                  {label:'Addenda (7)',      desc:'Additional payment info'},
                  {label:'Batch Control (8)',desc:'Batch totals & hash'},
                  {label:'File Control (9)', desc:'File totals'},
                ].map(item=>(
                  <Box key={item.label} mb={1} p={1} sx={{background:'rgba(255,255,255,0.03)',borderRadius:1}}>
                    <Typography sx={{color:'#FFD700',fontWeight:700,fontSize:'0.82rem'}}>{item.label}</Typography>
                    <Typography variant="caption" sx={{color:'#777'}}>{item.desc}</Typography>
                  </Box>
                ))}
                <Divider sx={{my:2,borderColor:'rgba(255,255,255,0.08)'}}/>
                <Typography variant="caption" sx={{color:'#888',display:'block',mb:1}}>Settlement: <strong style={{color:'#00C49F'}}>T+1 (next business day)</strong></Typography>
                <Typography variant="caption" sx={{color:'#888',display:'block'}}>Same Day ACH: <strong style={{color:'#FFD700'}}>SACH for eligible entries</strong></Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Payment History */}
          {history.length > 0 && (
            <Grid item xs={12}>
              <Card sx={cardSx}>
                <CardContent>
                  <Typography variant="h6" sx={{color:'white',fontWeight:700,mb:2}}>Payment History</Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow>{['Payment ID','SEC','Type','Receiver','Amount','Status','Trace #','Eff. Date'].map(h=>(
                        <TableCell key={h} sx={{color:'#888',border:'none',fontWeight:700,fontSize:'0.72rem'}}>{h}</TableCell>
                      ))}</TableRow>
                    </TableHead>
                    <TableBody>
                      {history.slice(0,8).map((p,i)=>(
                        <TableRow key={i} sx={{'&:hover':{background:'rgba(255,255,255,0.02)'}}}>
                          <TableCell sx={{color:'#555',border:'none',fontSize:'0.7rem'}}>{p.paymentId}</TableCell>
                          <TableCell sx={{border:'none'}}><Chip label={p.secCode} size="small" sx={{bgcolor:'rgba(255,215,0,0.1)',color:'#FFD700',fontSize:'0.65rem'}}/></TableCell>
                          <TableCell sx={{color:'white',border:'none',fontSize:'0.8rem'}}>{p.type}</TableCell>
                          <TableCell sx={{color:'white',border:'none',fontSize:'0.8rem'}}>{p.receiverName}</TableCell>
                          <TableCell sx={{color:'#FFD700',border:'none',fontWeight:700}}>${p.amount}</TableCell>
                          <TableCell sx={{border:'none'}}>
                            <Chip label={p.status} size="small" sx={{bgcolor:(STATUS_COLOR[p.status]||'#888')+'22',color:STATUS_COLOR[p.status]||'#888',fontWeight:700,fontSize:'0.65rem'}}/>
                          </TableCell>
                          <TableCell sx={{color:'#555',border:'none',fontSize:'0.7rem'}}>{p.traceNumber}</TableCell>
                          <TableCell sx={{color:'#555',border:'none',fontSize:'0.7rem'}}>{p.effectiveDate?new Date(p.effectiveDate).toLocaleDateString():'T+1'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}

      {/* RETURN PAYMENT TAB */}
      {tab === 'return' && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{...cardSx,border:'1px solid rgba(255,130,66,0.2)'}}>
              <CardContent>
                <Typography variant="h6" sx={{color:'white',fontWeight:700,mb:1}}>Return an ACH Entry</Typography>
                <Typography variant="body2" sx={{color:'#888',mb:3}}>
                  RDFI can return an entry within 2 banking days. ODFI has up to 60 days for unauthorized returns.
                </Typography>
                <TextField fullWidth label="Original Payment ID" value={returnForm.paymentId}
                  onChange={e=>setReturnForm(f=>({...f,paymentId:e.target.value}))}
                  sx={{...inputSx,mb:2}} placeholder="e.g. NACHA-20241115-000001"/>
                <FormControl fullWidth sx={{...inputSx,mb:2}}>
                  <InputLabel>Return Reason Code</InputLabel>
                  <Select value={returnForm.returnCode} onChange={e=>setReturnForm(f=>({...f,returnCode:e.target.value}))} label="Return Reason Code" sx={{color:'white'}}>
                    {RETURN_CODES.map(r=>(
                      <MenuItem key={r.code} value={r.code}>
                        <Box>
                          <Typography sx={{fontWeight:700,fontSize:'0.85rem'}}>{r.code} — {r.reason}</Typography>
                          <Typography variant="caption" sx={{color:'#888'}}>{r.desc}</Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField fullWidth label="Additional Notes" value={returnForm.reason}
                  onChange={e=>setReturnForm(f=>({...f,reason:e.target.value}))}
                  sx={{...inputSx,mb:3}} multiline rows={2}/>
                <Button fullWidth variant="contained" onClick={handleReturn} disabled={loading} sx={{
                  py:1.5,borderRadius:3,fontWeight:800,
                  background:'linear-gradient(135deg,#FF8042,#f44336)',color:'white',
                  '&:hover':{transform:'translateY(-1px)'},transition:'all 0.2s'
                }}>
                  {loading?<CircularProgress size={22} sx={{color:'white'}}/>:'Submit Return Entry'}
                </Button>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={cardSx}>
              <CardContent>
                <Typography variant="h6" sx={{color:'white',fontWeight:700,mb:2}}>Return Entry Rules</Typography>
                {[
                  {title:'RDFI Return Window', val:'2 business days'},
                  {title:'ODFI Unauthorized Return', val:'60 calendar days'},
                  {title:'Contested Dishonored Return', val:'Within 1 business day'},
                  {title:'Return Entry Format', val:'Same as original + Addenda (Record 7)'},
                  {title:'Dishonored Return Code', val:'R61, R67, R68, R69, R70, R71, R72'},
                ].map(item=>(
                  <Box key={item.title} display="flex" justifyContent="space-between" mb={1.5} pb={1.5}
                    sx={{borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
                    <Typography sx={{color:'#888',fontSize:'0.85rem'}}>{item.title}</Typography>
                    <Typography sx={{color:'#FFD700',fontWeight:700,fontSize:'0.85rem'}}>{item.val}</Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* RETURN CODES TAB */}
      {tab === 'returns' && (
        <Card sx={cardSx}>
          <CardContent>
            <Typography variant="h6" sx={{color:'white',fontWeight:700,mb:2}}>NACHA ACH Return Codes</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>{['Code','Reason','Description','Who Returns','Timeframe'].map(h=>(
                  <TableCell key={h} sx={{color:'#888',border:'none',fontWeight:700}}>{h}</TableCell>
                ))}</TableRow>
              </TableHead>
              <TableBody>
                {[
                  {code:'R01',reason:'Insufficient Funds',      desc:'Account lacks funds',            who:'RDFI','time':'2 days'},
                  {code:'R02',reason:'Account Closed',          desc:'Account no longer active',       who:'RDFI','time':'2 days'},
                  {code:'R03',reason:'No Account / Not Found',  desc:'Account number invalid',         who:'RDFI','time':'2 days'},
                  {code:'R04',reason:'Invalid Account #',       desc:'Account # format error',         who:'RDFI','time':'2 days'},
                  {code:'R06',reason:'Returned per ODFI Request',desc:'ODFI requested return',          who:'RDFI','time':'2 days'},
                  {code:'R07',reason:'Authorization Revoked',   desc:'Customer stopped authorization', who:'RDFI','time':'60 days'},
                  {code:'R08',reason:'Payment Stopped',         desc:'Stop payment requested',         who:'RDFI','time':'2 days'},
                  {code:'R09',reason:'Uncollected Funds',       desc:'Funds not yet cleared',          who:'RDFI','time':'2 days'},
                  {code:'R10',reason:'Customer Advises Not Auth.',desc:'Consumer says unauthorized',    who:'RDFI','time':'60 days'},
                  {code:'R16',reason:'Account Frozen',          desc:'Regulatory hold on account',     who:'RDFI','time':'2 days'},
                  {code:'R20',reason:'Non-Transaction Account', desc:'Savings withdrawal limit hit',   who:'RDFI','time':'2 days'},
                  {code:'R29',reason:'Corp. Not Authorized',    desc:'CCD/CTX not authorized',         who:'RDFI','time':'2 days'},
                ].map((r,i)=>(
                  <TableRow key={i} sx={{'&:hover':{background:'rgba(255,255,255,0.02)'}}}>
                    <TableCell sx={{border:'none'}}><Chip label={r.code} size="small" sx={{bgcolor:'rgba(244,67,54,0.15)',color:'#f44336',fontWeight:700,fontSize:'0.72rem'}}/></TableCell>
                    <TableCell sx={{color:'white',border:'none',fontWeight:600,fontSize:'0.82rem'}}>{r.reason}</TableCell>
                    <TableCell sx={{color:'#888',border:'none',fontSize:'0.8rem'}}>{r.desc}</TableCell>
                    <TableCell sx={{border:'none'}}><Chip label={r.who} size="small" sx={{bgcolor:'rgba(0,136,254,0.15)',color:'#0088FE',fontSize:'0.68rem'}}/></TableCell>
                    <TableCell sx={{color:'#FFD700',border:'none',fontSize:'0.8rem'}}>{r.time}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
