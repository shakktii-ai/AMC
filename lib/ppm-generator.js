export function generatePpmScheduleDates(startDate, endDate, planInterval = 'MONTHLY') {
  const dates = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  let stepMonths = 1;
  if (planInterval === 'QUARTERLY') stepMonths = 3;
  if (planInterval === 'BI_MONTHLY') stepMonths = 2;
  if (planInterval === 'CUSTOM') stepMonths = 1;

  let current = new Date(start);

  while (current <= end) {
    dates.push(new Date(current));
    current.setMonth(current.getMonth() + stepMonths);
  }

  return dates;
}

export async function generatePpmServicesForAmc(ServiceModel, amc) {
  if (!amc || !amc.liftIds || amc.liftIds.length === 0) return [];

  const interval = amc.ppmInterval || (amc.planType === 'COMPREHENSIVE' ? 'MONTHLY' : 'QUARTERLY');
  const dates = generatePpmScheduleDates(amc.startDate, amc.endDate, interval);

  const createdServices = [];

  for (const liftId of amc.liftIds) {
    for (let index = 0; index < dates.length; index++) {
      const date = dates[index];
      const serviceId = `PPM-${amc.amcId || amc._id.toString().substring(0, 6)}-L${liftId.toString().substring(0, 4)}-${index + 1}`;
      
      const existing = await ServiceModel.findOne({
        amcId: amc._id,
        liftId,
        scheduledStartTime: date,
      });

      if (!existing) {
        const endTime = new Date(date.getTime() + 2 * 60 * 60 * 1000); // 2 hours slot
        const newService = await ServiceModel.create({
          serviceId,
          customerId: amc.customerId,
          liftId,
          amcId: amc._id,
          serviceSource: 'PPM',
          scheduledStartTime: date,
          scheduledEndTime: endTime,
          status: 'SCHEDULED',
          notes: `PPM Service Visit #${index + 1} under AMC ${amc.contractNumber || amc.amcId}`,
        });
        createdServices.push(newService);
      }
    }
  }

  return createdServices;
}
