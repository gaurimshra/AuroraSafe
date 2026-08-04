import axios from 'axios'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const api = axios.create({ baseURL: API_BASE })

export const getHeatmap = () => api.get('/safety/heatmap').then(r => r.data)
export const getIncidents = (params?: any) => api.get('/incidents/', { params }).then(r => r.data)
export const createIncident = (data: any) => api.post('/incidents/', data).then(r => r.data)
export const getRiskScore = (lat: number, lng: number) => 
  api.get('/safety/risk-score', { params: { lat, lng } }).then(r => r.data)
export const getSafeRoute = (origin: {lat:number,lng:number}, destination: {lat:number,lng:number}) =>
  api.post('/routes/safe', { origin, destination }).then(r => r.data)
export const getZones = () => api.get('/safety/zones').then(r => r.data)
export const getNearbyAlerts = (lat: number, lng: number, radius_km = 2.0) =>
  api.get('/safety/nearby-alerts', { params: { lat, lng, radius_km } }).then(r => r.data)
export const getDashboardStats = () => api.get('/dashboard/stats').then(r => r.data)
export const getDashboardTrends = () => api.get('/dashboard/trends').then(r => r.data)
export const getDashboardCategories = () => api.get('/dashboard/categories').then(r => r.data)
export const triggerSOS = (data: any) => api.post('/sos/trigger', data).then(r => r.data)
