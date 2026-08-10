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

export function formatPpmServiceId(amc, liftIndex = 0, visitIndex = 0) {
  const year = amc.startDate ? new Date(amc.startDate).getFullYear() : new Date().getFullYear();
  
  let amcSeq = '';
  if (amc.contractNumber) {
    amcSeq = amc.contractNumber.replace(/^AMC-/, '').replace(/[^A-Za-z0-9]/g, '');
  } else if (amc.amcId) {
    amcSeq = amc.amcId.replace(/^AMC-/, '').replace(/[^A-Za-z0-9]/g, '');
  } else {
    amcSeq = amc._id ? amc._id.toString().slice(-6).toUpperCase() : '000001';
  }

  if (!amcSeq.includes(String(year))) {
    amcSeq = `${year}-${amcSeq.padStart(6, '0').slice(-6)}`;
  } else {
    const parts = amcSeq.split(String(year));
    const rest = (parts[1] || parts[0]).padStart(6, '0').slice(-6);
    amcSeq = `${year}-${rest}`;
  }

  const liftSeq = liftIndex + 1;
  const visitSeq = visitIndex + 1;

  return `PPM-AMC-${amcSeq}-LIFT-${liftSeq}-V${String(visitSeq).padStart(2, '0')}`;
}

export async function generatePpmServicesForAmc(ServiceModel, amc) {
  if (!amc || !amc.liftIds || amc.liftIds.length === 0) return [];

  const interval = amc.ppmInterval || (amc.planType === 'COMPREHENSIVE' ? 'MONTHLY' : 'QUARTERLY');
  const dates = generatePpmScheduleDates(amc.startDate, amc.endDate, interval);

  const createdServices = [];

  for (let liftIndex = 0; liftIndex < amc.liftIds.length; liftIndex++) {
    const liftItem = amc.liftIds[liftIndex];
    const liftId = liftItem._id ? liftItem._id : liftItem;

    for (let index = 0; index < dates.length; index++) {
      const date = dates[index];
      const serviceId = formatPpmServiceId(amc, liftIndex, index);

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
