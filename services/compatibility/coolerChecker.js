module.exports = (components, errors, warnings) => {
  const { cooler, cpu, pcCase } = components;

  if (!cooler) return;

  // Check CPU TDP Support
  if (cpu && cooler.tdpSupport < cpu.tdp) {
    warnings.push(`Tản nhiệt (${cooler.tdpSupport}W) có công suất làm mát thấp hơn TDP của CPU (${cpu.tdp}W). Có thể gây nóng máy.`);
  }

  if (pcCase) {
    const coolerTypeName = cooler.coolerType?.name?.toUpperCase() || "";
    
    // Check height for Air Cooler
    if (coolerTypeName.includes("AIR") || cooler.heightMm > 0) {
      if (cooler.heightMm > pcCase.maxCoolerHeightMm) {
        errors.push(`Chiều cao tản nhiệt (${cooler.heightMm}mm) vượt quá giới hạn của Case (${pcCase.maxCoolerHeightMm}mm)`);
      }
    }

    // Check radiator size for AIO
    if (coolerTypeName.includes("AIO") || cooler.radiatorSize > 0) {
      if (cooler.radiatorSize > pcCase.maxRadiatorSize) {
        errors.push(`Kích thước Radiator (${cooler.radiatorSize}mm) vượt quá giới hạn của Case (${pcCase.maxRadiatorSize}mm)`);
      }
    }
  }
};
