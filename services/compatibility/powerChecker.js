module.exports = (components, errors, warnings, ramQuantity = 1) => {
  const { psu, cpu, vga, ram, ssds, hdds } = components;

  let totalTdp = 0;

  if (cpu) totalTdp += cpu.tdp || 0;
  if (vga) totalTdp += vga.tdp || 0;
  if (ram) totalTdp += (ram.tdp || 5) * (ramQuantity * ram.quantity);
  
  if (ssds) {
    ssds.forEach(ssd => {
        totalTdp += ssd.tdp || 3;
    });
  }

  if (hdds) {
    hdds.forEach(hdd => {
        totalTdp += hdd.tdp || 10;
    });
  }

  // Add overhead
  totalTdp += 50;

  const recommendedPsuWattage = Math.ceil((totalTdp * 1.2) / 50) * 50; // Round up to nearest 50

  if (psu) {
    if (psu.wattage < recommendedPsuWattage) {
       errors.push(`Công suất Nguồn (${psu.wattage}W) thấp hơn mức đề xuất (${recommendedPsuWattage}W) cho cấu hình này`);
    }

    // Optional: Check GPU power connector
    if (vga && vga.powerConnector) {
        const vgaConnectorId = vga.powerConnector._id?.toString();
        const psuConnectors = psu.pcieConnectors?.map(c => c._id?.toString()) || [];
        
        if (!psuConnectors.includes(vgaConnectorId)) {
            warnings.push(`Nguồn có thể không có đầu cắm VGA tương ứng (${vga.powerConnector.name}). Vui lòng kiểm tra kỹ.`);
        }
    }
  }

  return recommendedPsuWattage;
};
