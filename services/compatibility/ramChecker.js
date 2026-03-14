module.exports = (components, errors, warnings, ramQuantity = 1) => {
  const { ram, mainboard } = components;

  if (!ram || !mainboard) return;

  // Check RAM Type
  if (ram.ramType?._id?.toString() !== mainboard.ramType?._id?.toString()) {
    errors.push(`Loại RAM (${ram.ramType?.name}) không tương thích với Mainboard (${mainboard.ramType?.name})`);
  }

  // Check RAM Bus (Warning if RAM bus > Mainboard bus max)
  if (ram.ramBus > mainboard.ramBusMax) {
    warnings.push(`RAM Bus (${ram.ramBus}MHz) cao hơn mức hỗ trợ tối đa của Mainboard (${mainboard.ramBusMax}MHz). RAM sẽ tự động giảm bus.`);
  }

  // Performance optimization warnings
  const ramTypeName = ram.ramType?.name?.toUpperCase() || "";
  if (ramTypeName.includes("DDR4") && ram.ramBus < 3200) {
    warnings.push(`RAM DDR4 Bus ${ram.ramBus}MHz chưa tối ưu hiệu suất (nên ≥ 3200MHz).`);
  } else if (ramTypeName.includes("DDR5") && ram.ramBus < 6000) {
    warnings.push(`RAM DDR5 Bus ${ram.ramBus}MHz chưa tối ưu hiệu suất (nên ≥ 6000MHz).`);
  }

  const totalSticks = ramQuantity * (ram.quantity || 1);
  if (totalSticks === 1) {
    warnings.push(`Chạy Single Channel chưa tối ưu hiệu suất, nên dùng 2 thanh (Dual Channel).`);
  }

  // Check RAM slot
  if (totalSticks > mainboard.ramSlot) {
    errors.push(`Số thanh RAM (${totalSticks}) vượt quá số khe cắm trên Mainboard (${mainboard.ramSlot})`);
  }

  // Check Max Capacity
  const totalCapacity = totalSticks * ram.capacityPerStick;
  if (totalCapacity > mainboard.ramMaxCapacity) {
    errors.push(`Tổng dung lượng RAM (${totalCapacity}GB) vượt quá mức hỗ trợ tối đa của Mainboard (${mainboard.ramMaxCapacity}GB)`);
  }
};
