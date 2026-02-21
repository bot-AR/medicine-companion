import {
  getMedicines,
  saveMedicine,
  getSchedules,
  saveSchedule,
  getDoseLogs,
  saveDoseLog,
} from '../../services/storage';

export async function handleSchedule(
  action: 'save' | 'load',
  payload: Record<string, unknown>,
) {
  if (action === 'save') {
    if (payload.medicine) await saveMedicine(payload.medicine as Record<string, unknown>);
    if (payload.schedule) await saveSchedule(payload.schedule as Record<string, unknown>);
    return { success: true };
  }

  const medicines = await getMedicines();
  const schedules = await getSchedules();
  const doseLogs = await getDoseLogs();
  return { medicines, schedules, doseLogs };
}

export async function handleDoseLog(payload: Record<string, unknown>) {
  await saveDoseLog(payload);
}
