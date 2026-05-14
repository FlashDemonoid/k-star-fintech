import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Exchange from './pages/Exchange';
import Transfer from './pages/Transfer';
import BullionMarket from './pages/BullionMarket';
import NachaPayment from './pages/NachaPayment';
import Account from './pages/Account';
import Layout from './components/Layout';
import { CircularProgress, Box } from '@mui/material';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh"
             sx={{ background: '#07071a' }}>
            <CircularProgress sx={{ color: '#FFD700' }} size={48} />
        </Box>
    );
    return user ? children : <Navigate to="/login" />;
};

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login"    element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/" element={
                        <ProtectedRoute><Layout /></ProtectedRoute>
                    }>
                        <Route index                element={<Navigate to="/dashboard" />} />
                        <Route path="dashboard"     element={<Dashboard />} />
                        <Route path="exchange"      element={<Exchange />} />
                        <Route path="transfer"      element={<Transfer />} />
                        <Route path="nacha"         element={<NachaPayment />} />
                        <Route path="bullion"       element={<BullionMarket />} />
                        <Route path="account"       element={<Account />} />
                    </Route>
                    <Route path="*" element={<Navigate to="/dashboard" />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}
export default App;
