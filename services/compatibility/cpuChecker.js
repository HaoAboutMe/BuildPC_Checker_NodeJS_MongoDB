module.exports = (components, errors, warnings) => {
  const { cpu, mainboard } = components;

  if (!cpu || !mainboard) return;

  // Check socket compatibility
  if (cpu.socket?._id?.toString() !== mainboard.socket?._id?.toString()) {
    errors.push(`CPU socket (${cpu.socket?.name}) không khớp với Mainboard socket (${mainboard.socket?.name})`);
  }

  // Check VRM Phase (Warning or Error?) Let's follow md: Fail -> build fail.
  if (mainboard.vrmPhase < cpu.vrmMin) {
    errors.push(`Mainboard có Phase VRM (${mainboard.vrmPhase}) thấp hơn yêu cầu tối thiểu của CPU (${cpu.vrmMin})`);
  }

  // Check CPU TDP Support
  if (mainboard.cpuTdpSupport < cpu.tdp) {
    errors.push(`Mainboard chỉ hỗ trợ CPU có TDP tối đa ${mainboard.cpuTdpSupport}W, trong khi CPU này có TDP ${cpu.tdp}W`);
  }
};
