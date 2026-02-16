export enum SetType {
    WARMUP = '热身组',
    WORKING = '正式组',
    FAILURE = '失败组',
    DROP = '递减组'
}

export enum TargetMuscleGroup {
    CHEST = '胸',
    BACK = '背',
    SHOULDER = '肩',
    ARM = '臂',
    LEG = '腿',
    ABS = '腹',
    UNKNOWN = '未分类'
}

export interface Exercise {
    id: number;
    name: string;
    targetMuscle: TargetMuscleGroup | string;
    createdAt?: string;
}

export interface Unit {
    id: number;
    name: string;
}

export interface SetTypeOption {
    value: string;
    label: string;
}

export interface FitnessSet {
    id: number;
    fitnessDayId: number;
    exerciseId: number;
    exercise?: Exercise | string;
    setType: SetType | string;
    weight: number;
    reps: number;
    unitId: number;
    unit: Unit | string;
    remark: string;
    createdAt: string;
}

export interface ExerciseGroup {
    exercise: Exercise;
    sets: FitnessSet[];
}

export interface FitnessDay {
    id: number;
    date: string;
    primaryMuscles: (TargetMuscleGroup | string)[];
    exercises: ExerciseGroup[];
    isFinished: boolean;
    createdAt: string;
}

export interface FitnessLogDay {
    date: string;
    id?: number;
    sets: FitnessSet[];
}

export interface InitData {
    exercises: any[];
    units: Unit[];
    set_types: SetTypeOption[];
    muscle_groups: string[];
    timezone: string;
}

// API Payloads
export interface CreateFitnessSetPayload {
    fitness_day_id?: number;
    exercise_id: number;
    set_type: SetType | string;
    weight: number;
    reps: number;
    unit_id: number;
    remark?: string;
    date?: string;
    primary_muscles?: (TargetMuscleGroup | string)[];
}

export interface UpdateFitnessSetPayload {
    set_type?: SetType | string;
    weight?: number;
    reps?: number;
    unit_id?: number;
    remark?: string;
}

export interface CreateExercisePayload {
    name: string;
    target_muscle: TargetMuscleGroup | string;
}


export interface GetLogsParams {
    from_date?: string;
    to_date?: string;
    exercise_name?: string;
}
