import React from "react";

interface ProgressBarProps {
  progress: number;
  label: string;
  current?: number;
  total?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, label, current, total }) => {
  return (
    <div className="w-full">
      <div className="flex justify-between text-sm font-medium mb-1">
        <span className="text-gray-700">{label}</span>
        <span className="text-gray-600">
          {Math.round(progress)}%
          {total !== undefined && current !== undefined && ` (${current}/${total})`}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
        ></div>
      </div>
    </div>
  );
};
