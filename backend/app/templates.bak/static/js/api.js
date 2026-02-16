const api = {
    getInitData: () => axios.get('/api/init-data').then(res => res.data),
    getCalendar: (year, month) => axios.get('/api/calendar', { params: { year, month } }).then(res => res.data),
    getDayDetail: (dayId) => axios.get(`/api/days/${dayId}`).then(res => res.data),
    getTodayTraining: () => axios.get('/api/training/today').then(res => res.data),
    createSet: (data) => axios.post('/api/fitness-sets', data).then(res => res.data),
    updateSet: (setId, data) => axios.put(`/api/fitness-sets/${setId}`, data).then(res => res.data),
    deleteSet: (setId) => axios.delete(`/api/fitness-sets/${setId}`).then(res => res.data),
    finishDay: (dayId) => axios.post(`/api/fitness-days/${dayId}/finish`).then(res => res.data),
    startToday: (payload) => axios.post('/api/fitness-days/today/start', payload).then(res => res.data),
    getLogs: (params) => axios.get('/api/logs', { params }).then(res => res.data),
    listExercises: () => axios.get('/api/exercises').then(res => res.data),
    createExercise: (payload) => axios.post('/api/exercises', payload).then(res => res.data),
    updateExercise: (id, payload) => axios.put(`/api/exercises/${id}`, payload).then(res => res.data),
    deleteExercise: (id) => axios.delete(`/api/exercises/${id}`).then(res => res.data),
};

export default api;
