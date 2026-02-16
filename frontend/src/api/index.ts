import axios from 'axios';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import type {
  InitData,
  FitnessDay,
  FitnessSet,
  FitnessLogDay,
  Exercise,
  CreateFitnessSetPayload,
  UpdateFitnessSetPayload,
  CreateExercisePayload,
  GetLogsParams
} from '@/types/fitness';

dayjs.extend(utc);
dayjs.extend(timezone);

const apiInstance = axios.create({
  baseURL: '/',
});

// Add timezone header
const resolveTimeZone = () => {
  let tz: string | undefined;
  try {
    if (dayjs.tz && typeof dayjs.tz.guess === 'function') {
      tz = dayjs.tz.guess();
    }
  } catch (err) {
    tz = undefined;
  }

  if (!tz) {
    try {
      tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (err) {
      tz = undefined;
    }
  }

  return tz || 'UTC';
};

apiInstance.defaults.headers.common['X-Timezone'] = resolveTimeZone();

// Helpers for camelCase mapping
const mapExercise = (ex: any): Exercise => ({
  ...ex,
  targetMuscle: ex.target_muscle || ex.targetMuscle
});

const mapSet = (s: any): FitnessSet => ({
  ...s,
  fitnessDayId: s.fitness_day_id || s.fitnessDayId,
  exerciseId: s.exercise_id || s.exerciseId,
  setType: s.set_type || s.setType,
  unitId: s.unit_id || s.unitId,
  createdAt: s.created_at || s.createdAt,
  exercise: s.exercise ? (typeof s.exercise === 'object' ? mapExercise(s.exercise) : s.exercise) : undefined,
});

const mapFitnessDay = (d: any): FitnessDay => ({
  ...d,
  primaryMuscles: d.primary_muscles || d.primaryMuscles,
  isFinished: d.is_finished || d.isFinished,
  createdAt: d.created_at || d.createdAt,
  exercises: d.exercises ? d.exercises.map((group: any) => ({
    ...group,
    exercise: mapExercise(group.exercise),
    sets: group.sets.map(mapSet)
  })) : []
});

const api = {
  getInitData: (): Promise<InitData> => apiInstance.get('/api/fitness/init-data').then(res => {
    const data = res.data;
    return {
      ...data,
      exercises: data.exercises.map(mapExercise),
      set_types: data.set_types // Keep snake_case for raw options as they are mapped in store
    };
  }),
  getFitnessDaysByMonth: (year?: number, month?: number): Promise<{ training_days: Record<number, number> }> =>
    apiInstance.get('/api/fitness/fitness_day', { params: { year, month } }).then(res => res.data),
  getFitnessDay: (dayId: string | number): Promise<FitnessDay> => apiInstance.get(`/api/fitness/fitness_day/${dayId}`).then(res => mapFitnessDay(res.data)),
  getTodayFitnessDay: (date?: string): Promise<FitnessDay> => apiInstance.get('/api/fitness/fitness_day', { params: { date } }).then(res => mapFitnessDay(res.data)),
  createFitnessSet: (data: CreateFitnessSetPayload): Promise<FitnessSet> => apiInstance.post('/api/fitness/fitness_set/create', data).then(res => mapSet(res.data)),
  updateFitnessSet: (setId: string | number, data: UpdateFitnessSetPayload): Promise<FitnessSet> => apiInstance.put(`/api/fitness/fitness_set/${setId}`, data).then(res => mapSet(res.data)),
  deleteFitnessSet: (setId: string | number): Promise<void> => apiInstance.delete(`/api/fitness/fitness_set/${setId}`).then(res => res.data),
  finishFitnessDay: (dayId: string | number): Promise<void> => apiInstance.put(`/api/fitness/fitness_day/${dayId}/end`).then(res => res.data),
  getLogs: (params: GetLogsParams): Promise<FitnessLogDay[]> => apiInstance.get('/api/fitness/fitness_logs', { params }).then(res => res.data.map((d: any) => ({
    ...d,
    sets: d.sets.map(mapSet)
  }))),
  listExercises: (): Promise<Exercise[]> => apiInstance.get('/api/masterdata/exercises').then(res => res.data.map(mapExercise)),
  createExercise: (payload: CreateExercisePayload): Promise<Exercise> => apiInstance.post('/api/masterdata/exercise/create', payload).then(res => mapExercise(res.data)),
  updateExercise: (id: string | number, payload: CreateExercisePayload): Promise<Exercise> => apiInstance.put(`/api/masterdata/exercise/${id}`, payload).then(res => mapExercise(res.data)),
  deleteExercise: (id: string | number): Promise<void> => apiInstance.delete(`/api/masterdata/exercise/${id}`).then(res => res.data),
};

export default api;
export { apiInstance };
