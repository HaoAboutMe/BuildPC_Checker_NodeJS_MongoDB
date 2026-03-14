module.exports = (components, errors, warnings) => {
  const { ssds, hdds, mainboard, pcCase } = components;

  if (!mainboard) return;

  let m2Used = 0;
  let sataUsed = 0;
  let drive25Used = 0;
  let drive35Used = 0;

  ssds.forEach(ssd => {
    const interfaceName = ssd.interfaceType?.name?.toUpperCase() || "";
    const formFactorName = ssd.formFactor?.name?.toUpperCase() || "";

    if (interfaceName.includes("M.2") || interfaceName.includes("NVME") || formFactorName.includes("M.2")) {
      m2Used++;
    } else if (interfaceName.includes("SATA")) {
      sataUsed++;
      drive25Used++; // Assuming SATA SSD is 2.5"
    }
  });

  hdds.forEach(hdd => {
    sataUsed++;
    // HDD usually 3.5", but let's check form factor if available
    const formFactorName = hdd.formFactor?.name?.toUpperCase() || "";
    if (formFactorName.includes("2.5")) {
      drive25Used++;
    } else {
      drive35Used++;
    }
  });

  // Check Mainboard slots
  if (m2Used > (mainboard.m2Slot || 0)) {
    errors.push(`Số lượng SSD M.2 (${m2Used}) vượt quá số khe cắm M.2 trên Mainboard (${mainboard.m2Slot || 0})`);
  }

  if (sataUsed > (mainboard.sataSlot || 0)) {
    errors.push(`Số lượng thiết bị SATA (${sataUsed}) vượt quá số khe cắm SATA trên Mainboard (${mainboard.sataSlot || 0})`);
  }

  // Check Case bays if pcCase is selected
  if (pcCase) {
    if (drive35Used > (pcCase.drive35Slot || 0)) {
       errors.push(`Số lượng HDD/Drive 3.5" (${drive35Used}) vượt quá số khay 3.5" trên Case (${pcCase.drive35Slot || 0})`);
    }
    if (drive25Used > (pcCase.drive25Slot || 0)) {
       errors.push(`Số lượng SSD/Drive 2.5" (${drive25Used}) vượt quá số khay 2.5" trên Case (${pcCase.drive25Slot || 0})`);
    }
  }
};
