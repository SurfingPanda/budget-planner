import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// Accounts
export const getAccounts = () => api.get('/accounts');
export const createAccount = (data) => api.post('/accounts', data);
export const updateAccount = (id, data) => api.put(`/accounts/${id}`, data);
export const deleteAccount = (id) => api.delete(`/accounts/${id}`);

// Transactions
export const getTransactions = (params) => api.get('/transactions', { params });
export const getSummary = (params) => api.get('/transactions/summary', { params });
export const getMonthlyChart = () => api.get('/transactions/monthly-chart');
export const getDailyChart = (params) => api.get('/transactions/daily-chart', { params });
export const getByCategory = (params) => api.get('/transactions/by-category', { params });
export const createTransaction = (data) => api.post('/transactions', data);
export const updateTransaction = (id, data) => api.put(`/transactions/${id}`, data);
export const deleteTransaction = (id) => api.delete(`/transactions/${id}`);

// Categories
export const getCategories = (params) => api.get('/categories', { params });
export const createCategory = (data) => api.post('/categories', data);

// Budgets
export const getBudgets = (params) => api.get('/budgets', { params });
export const createBudget = (data) => api.post('/budgets', data);
export const deleteBudget = (id) => api.delete(`/budgets/${id}`);
