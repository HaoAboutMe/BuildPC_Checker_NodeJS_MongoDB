/**
 * Bottleneck Service
 * Logic for calculating CPU-GPU bottleneck based on benchmark scores
 */

const RESOLUTIONS = {
  "1080p": { weight: 1.1, label: "1080p" },
  "1440p": { weight: 1.0, label: "2K (1440p)" },
  "4K": { weight: 0.9, label: "4K" }
};

const getSeverity = (adjustedRatio) => {
  if (adjustedRatio >= 0.95 && adjustedRatio <= 1.10) {
    return { type: "NONE", severity: "NONE", label: "Balanced" };
  } else if (adjustedRatio < 0.95) {
    if (adjustedRatio < 0.75) return { type: "CPU", severity: "HIGH", label: "CPU bottleneck nặng" };
    if (adjustedRatio < 0.85) return { type: "CPU", severity: "MEDIUM", label: "CPU bottleneck trung bình" };
    return { type: "CPU", severity: "LOW", label: "CPU bottleneck nhẹ" };
  } else {
    if (adjustedRatio <= 1.40) return { type: "GPU", severity: "LOW", label: "GPU bottleneck nhẹ" };
    if (adjustedRatio <= 1.80) return { type: "GPU", severity: "MEDIUM", label: "GPU bottleneck trung bình" };
    return { type: "GPU", severity: "HIGH", label: "GPU bottleneck nặng" };
  }
};



const getMessage = (type, severity, cpuName, gpuName, resolutionLabel) => {
  if (type === "NONE") {
    return `Cấu hình cân bằng tuyệt vời. CPU ${cpuName} và GPU ${gpuName} phối hợp rất tốt ở độ phân giải ${resolutionLabel}.`;
  }

  if (type === "CPU") {
    switch (severity) {
      case "LOW":
        return `CPU ${cpuName} có thể chưa phát huy hết tiềm năng của ${gpuName} ở độ phân giải ${resolutionLabel}. Sự chênh lệch này là không đáng kể.`;
      case "MEDIUM":
        return `CPU ${cpuName} có thể giới hạn hiệu năng của ${gpuName} khi chơi game ở độ phân giải ${resolutionLabel}. Bạn có thể cân nhắc một CPU mạnh hơn để tối ưu hóa FPS.`;
      case "HIGH":
        return `Hiệu năng của ${gpuName} đang bị giới hạn đáng kể bởi CPU ${cpuName} ở độ phân giải ${resolutionLabel}. Việc nâng cấp CPU sẽ giúp hệ thống đạt hiệu suất cao hơn nhiều.`;
      default:
        return "";
    }
  }

  if (type === "GPU") {
    switch (severity) {
      case "LOW":
        return `Ở độ phân giải ${resolutionLabel}, GPU ${gpuName} hoạt động hết công suất trong khi CPU ${cpuName} vẫn còn nhiều tài nguyên dư thừa. Bạn có thể nâng cấp GPU để trải nghiệm đồ họa tốt hơn.`;
      case "MEDIUM":
        return `GPU ${gpuName} đang là yếu tố chính giới hạn FPS ở độ phân giải ${resolutionLabel}. Cấu hình này đang thiên về sức mạnh tính toán của CPU hơn là hiệu năng đồ họa.`;
      case "HIGH":
        return `GPU ${gpuName} chưa tương xứng với sức mạnh của CPU ${cpuName} ở độ phân giải ${resolutionLabel}. Để tận dụng hết khả năng của CPU, một GPU cao cấp hơn sẽ là lựa chọn phù hợp.`;
      default:
        return "";
    }
  }

  return "";
};


exports.calculateBottleneck = (cpu, gpu) => {
  const results = {};
  
  if (!cpu.score || !gpu.score || cpu.score === 0 || gpu.score === 0) {
    Object.keys(RESOLUTIONS).forEach(resKey => {
      results[resKey] = {
        bottleneck: false,
        type: "UNKNOWN",
        severity: "NONE",
        ratio: 0,
        message: "Không thể xác định bottleneck do thiếu dữ liệu benchmark của linh kiện."
      };
    });
    return results;
  }

  const baseRatio = (cpu.score * 0.7) / gpu.score;

  Object.entries(RESOLUTIONS).forEach(([key, res]) => {
    const adjustedRatio = baseRatio * res.weight;
    const { type, severity } = getSeverity(adjustedRatio);
    
    results[key] = {
      bottleneck: severity !== "NONE",
      type: type,
      severity: severity,
      ratio: Number(adjustedRatio.toFixed(2)),
      message: getMessage(type, severity, cpu.name, gpu.name, res.label)
    };
  });

  return results;
};
