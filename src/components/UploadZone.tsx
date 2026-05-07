"use client";

import React, { useCallback, useRef, useState } from "react";

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onFileSelect, isLoading }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      
      if (isLoading) return;

      const files = Array.from(e.dataTransfer.files);
      const excelFile = files.find(
        (f) => f.name.endsWith(".xlsx") || f.name.endsWith(".xls")
      );

      if (excelFile) {
        onFileSelect(excelFile);
      } else {
        alert("请上传有效的 Excel 文件 (.xlsx 或 .xls)");
      }
    },
    [onFileSelect, isLoading]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isLoading) return;
    
    const file = e.target.files?.[0];
    if (file) {
      if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        onFileSelect(file);
      } else {
        alert("请上传有效的 Excel 文件 (.xlsx 或 .xls)");
      }
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !isLoading && fileInputRef.current?.click()}
      className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors duration-200 ${
        isDragging
          ? "border-blue-500 bg-blue-50"
          : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
      } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".xlsx,.xls"
        className="hidden"
      />
      <div className="flex flex-col items-center justify-center space-y-4">
        <svg
          className="w-12 h-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <div className="text-xl font-medium text-gray-700">
          点击或拖拽 Excel 文件到此处上传
        </div>
        <p className="text-sm text-gray-500">支持 .xlsx 和 .xls 格式，最大支持 1000+ 条数据</p>
      </div>
    </div>
  );
};
