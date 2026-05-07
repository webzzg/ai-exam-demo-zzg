"use client";

import React, { useState, useEffect } from "react";
import { standardFields } from "@/utils/excel";
import { ValidationError } from "@/utils/validation";
import * as XLSX from "xlsx";

interface DataGridProps {
  data: any[];
  errors: ValidationError[];
  onDataChange: (newData: any[]) => void;
  onRemoveRow: (index: number) => void;
  onAddRow: () => void;
}

export const DataGrid: React.FC<DataGridProps> = ({
  data,
  errors,
  onDataChange,
  onRemoveRow,
  onAddRow,
}) => {
  const [localData, setLocalData] = useState<any[]>(data);

  useEffect(() => {
    setLocalData(data);
  }, [data]);

  const handleCellChange = (index: number, field: string, value: string) => {
    const newData = [...localData];
    newData[index] = { ...newData[index], [field]: value };
    setLocalData(newData);
  };

  const handleBlur = () => {
    onDataChange(localData);
  };

  const exportExcel = () => {
    const exportData = localData.map(row => {
      const obj: any = {};
      standardFields.forEach(f => {
        obj[f.label] = row[f.key] || "";
      });
      return obj;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, "ExportedData.xlsx");
  };

  const getCellError = (rowNum: number, fieldKey: string) => {
    return errors.find(e => e.row === rowNum && e.field === fieldKey);
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">数据预览 ({localData.length} 条)</h3>
        <div className="space-x-2">
          <button
            onClick={onAddRow}
            className="px-4 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
          >
            + 新增空行
          </button>
          <button
            onClick={exportExcel}
            className="px-4 py-2 bg-green-50 text-green-600 rounded hover:bg-green-100"
          >
            导出 Excel
          </button>
        </div>
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded-lg max-h-[60vh] overflow-y-auto">
        <table className="min-w-max w-full text-sm text-left relative border-collapse">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-4 py-3 border-b border-r bg-gray-50 sticky left-0 z-20 w-16 text-center">操作</th>
              <th className="px-4 py-3 border-b border-r bg-gray-50 sticky left-16 z-20 w-12 text-center">序号</th>
              {standardFields.map((field) => (
                <th key={field.key} className="px-4 py-3 border-b border-r bg-gray-50 min-w-[150px]">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {localData.map((row, index) => {
              const rowNum = index + 1;
              const rowErrors = errors.filter(e => e.row === rowNum);
              
              return (
                <tr key={index} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-2 py-2 border-r sticky left-0 bg-white z-10 text-center">
                    <button
                      onClick={() => onRemoveRow(index)}
                      className="text-red-500 hover:text-red-700"
                      title="删除行"
                    >
                      删除
                    </button>
                  </td>
                  <td className="px-2 py-2 border-r sticky left-16 bg-white z-10 text-center text-gray-500">
                    {rowNum}
                  </td>
                  {standardFields.map((field) => {
                    const error = getCellError(rowNum, field.key);
                    return (
                      <td key={field.key} className={`border-r p-0 relative group`}>
                        <input
                          type="text"
                          value={row[field.key] || ""}
                          onChange={(e) => handleCellChange(index, field.key, e.target.value)}
                          onBlur={handleBlur}
                          className={`w-full h-full min-h-[40px] px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:inset-0 ${
                            error ? "bg-red-50 border-red-300" : "bg-transparent border-transparent"
                          }`}
                        />
                        {error && (
                          <div className="absolute hidden group-hover:block z-30 w-max max-w-xs bg-red-600 text-white text-xs rounded px-2 py-1 -top-8 left-0 shadow-lg">
                            {error.message}
                            <div className="absolute top-full left-4 -mt-1 border-4 border-transparent border-t-red-600" />
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
