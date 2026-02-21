'use client';

import { useRouter } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import MedicineFormComponent from '@/components/medicines/MedicineForm';
import { useMedicines } from '@/hooks/useMedicines';
import { showToast } from '@/components/shared/Toast';

export default function AddMedicinePage() {
  const router = useRouter();
  const { saveMedicineWithSchedule } = useMedicines();

  const handleSubmit = async (
    med: { name: string; brandName: string; strength: number; unit: string; form: 'tablet' | 'capsule' | 'liquid' | 'injection' | 'patch' | 'other'; frequency: 'daily' | 'weekly' | 'as_needed'; instructions: string; prescribedBy: string; startDate: string; endDate: string },
    times: string[],
  ) => {
    await saveMedicineWithSchedule(
      {
        name: med.name,
        brandName: med.brandName || undefined,
        strength: med.strength,
        unit: med.unit,
        form: med.form,
        instructions: med.instructions || undefined,
        prescribedBy: med.prescribedBy || undefined,
      },
      {
        frequency: med.frequency,
        scheduledTimes: times,
        startDate: med.startDate,
        endDate: med.endDate || undefined,
      },
    );
    showToast('Medicine added successfully');
    router.push('/medicines');
  };

  return (
    <div>
      <PageHeader title="Add Medicine" back />
      <div className="p-4">
        <MedicineFormComponent onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
