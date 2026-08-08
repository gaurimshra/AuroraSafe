import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 15000
});


export const getHeatmap = () => api.get('/safety/heatmap').then(r => r.data)
export const getIncidents = (params?: any) => api.get('/incidents/', { params }).then(r => r.data)
export const getIncidentById = (id: string) => api.get(`/incidents/${id}`).then(r => r.data)
export const getNewsIncidents = (limit = 6) => api.get('/incidents/', { params: { source: 'newsapi,gnews', limit } }).then(r => r.data)
export const createIncident = (data: any) => api.post('/incidents/', data).then(r => r.data)
export const voteIncident = (id: string, vote: 'up' | 'down') => api.put(`/incidents/${id}/vote`, { vote }).then(r => r.data)
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
export const getSOSHistory = (user_id?: string) => 
  api.get('/sos/history', { params: { user_id } }).then(r => r.data)
export const getSOSContacts = (user_id: string) => api.get(`/sos/contacts/${user_id}`).then(r => r.data)
export const addSOSContact = (data: any) => api.post('/sos/contacts', data).then(r => r.data)
export const deleteSOSContact = (id: string) => api.delete(`/sos/contacts/${id}`).then(r => r.data)

export const getSavedRoutes = (user_id: string) => api.get(`/saved-routes/${user_id}`).then(r => r.data)
export const addSavedRoute = (data: any) => api.post('/saved-routes/', data).then(r => r.data)
export const deleteSavedRoute = (id: string) => api.delete(`/saved-routes/${id}`).then(r => r.data)

// Live Data Sources
export const getLiveFactors = (lat: number, lng: number, city?: string) => 
  api.get('/data-sources/live-factors', { params: { lat, lng, city } }).then(r => r.data)
export const getWeather = (city?: string) => 
  api.get('/data-sources/weather', { params: { city } }).then(r => r.data)
export const getAllWeather = () => api.get('/data-sources/weather/all').then(r => r.data)
export const getTriggerNews = () => api.post('/data-sources/trigger/news').then(r => r.data)
export const getDataSourceStatus = () => api.get('/data-sources/status').then(r => r.data)
export const getPoliceStations = () => api.get('/data-sources/police-stations').then(r => r.data)
export const getNGOs = () => api.get('/data-sources/ngos').then(r => r.data)
export const getNearbyPOIs = (lat: number, lng: number) => api.get('/data-sources/nearby-pois', { params: { lat, lng } }).then(r => r.data)
