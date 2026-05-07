import React from "react";
import { ValidationError } from "@/utils/validation";

interface ErrorPanelProps {
  errors: ValidationError[];
}

export const ErrorPanel: React.FC<ErrorPanelProps> = ({ errors }) => {
  if (errors.length === 0) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-60 overflow-y-auto">
      <div className="flex items-center space-x-2 text-red-700 mb-2 sticky top-0 bg-red-50 py-1">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
        <h3 className="font-medium">发现 {errors.length} 处错误，请修复后再提交</h3>
      </div>
      <ul className="list-disc list-inside space-y-1 text-sm text-red-600">
        {errors.map((error, idx) => (
          <li key={idx}>
            <span className="font-medium">第 {error.row} 行</span>，
            {error.fieldLabel}：{error.message}
          </li>
        ))}
      </ul>
    </div>
  );
};
