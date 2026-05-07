import React, { useState } from "react";
import { standardFields } from "@/utils/excel";

interface MappingModalProps {
  isOpen: boolean;
  headers: string[];
  initialMapping: Record<string, string>;
  onConfirm: (mapping: Record<string, string>) => void;
  onCancel: () => void;
}

export const MappingModal: React.FC<MappingModalProps> = ({
  isOpen,
  headers,
  initialMapping,
  onConfirm,
  onCancel,
}) => {
  const [mapping, setMapping] = useState<Record<string, string>>(initialMapping);

  if (!isOpen) return null;

  const handleChange = (header: string, standardKey: string) => {
    setMapping((prev) => {
      const newMapping = { ...prev };
      // Check if this standard field is already mapped to another header
      // If so, we could clear it, but let's allow 1-to-1 mapping logic loosely or handle it
      newMapping[header] = standardKey;
      return newMapping;
    });
  };

  const handleConfirm = () => {
    // Basic validation: ensure required fields are mapped or warn?
    // According to requirements, if missing optional fields, it should not fail.
    // We just return whatever user mapped.
    onConfirm(mapping);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium">请确认 Excel 模板映射关系</h3>
          <p className="text-sm text-gray-500 mt-1">系统未能完全自动识别，请手动指定对应关系。您的调整将被记录并自动应用于后续相同模板。</p>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="font-medium text-gray-700 bg-gray-50 p-2 rounded">Excel 表头</div>
            <div className="font-medium text-gray-700 bg-gray-50 p-2 rounded">系统对应字段</div>
            
            {headers.map((header, idx) => (
              <React.Fragment key={idx}>
                <div className="flex items-center px-2 py-1 border-b">
                  <span className="truncate" title={header}>{header}</span>
                </div>
                <div className="py-1">
                  <select
                    className="w-full border rounded px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                    value={mapping[header] || ""}
                    onChange={(e) => handleChange(header, e.target.value)}
                  >
                    <option value="">-- 忽略此列 --</option>
                    {standardFields.map((field) => (
                      <option key={field.key} value={field.key}>
                        {field.label} {field.required ? "(*)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
        
        <div className="px-6 py-4 border-t flex justify-end space-x-3 bg-gray-50">
          <button
            onClick={onCancel}
            className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            确认映射
          </button>
        </div>
      </div>
    </div>
  );
};
