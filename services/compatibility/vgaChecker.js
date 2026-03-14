const { pcieRank } = require('../../utils/pcieHelper');

module.exports = (components, errors, warnings) => {
  const { vga, mainboard, pcCase } = components;

  if (vga && pcCase) {
    if (vga.lengthMm > pcCase.maxVgaLengthMm) {
      errors.push(`Chiều dài VGA (${vga.lengthMm}mm) vượt quá giới hạn của Case (${pcCase.maxVgaLengthMm}mm)`);
    }
  }

  if (vga && mainboard) {
    const vgaRank = pcieRank(vga.pcieVersion?.name);
    const mainboardRank = pcieRank(mainboard.pcieVgaVersion?.name);

    if (mainboardRank < vgaRank) {
      warnings.push(`PCIe của Mainboard (${mainboard.pcieVgaVersion?.name}) thấp hơn VGA (${vga.pcieVersion?.name}). VGA sẽ chạy ở tốc độ thấp hơn.`);
    }
  }
};
