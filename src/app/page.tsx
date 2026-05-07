"use client";

import React, { useState } from "react";
import Link from "next/link";
import { UploadZone } from "@/components/UploadZone";
import { MappingModal } from "@/components/MappingModal";
import { DataGrid } from "@/components/DataGrid";
import { ErrorPanel } from "@/components/ErrorPanel";
import { ProgressBar } from "@/components/ProgressBar";
import { parseExcelFile, guessMapping, generateFingerprint, standardFields } from "@/utils/excel";
import { validateData, ValidationError } from "@/utils/validation";

export default function Home() {
  const [step, setStep] = useState<"upload" | "mapping" | "preview" | "submitting" | "result">("upload");
  
  // Data state
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawData, setRawData] = useState<any[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [fingerprint, setFingerprint] = useState<string>("");
  
  // Preview state
  const [validData, setValidData] = useState<any[]>([]);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  
  // Progress & status state
  const [progress, setProgress] = useState({ percent: 0, current: 0, total: 0, label: "" });
  const [submitResult, setSubmitResult] = useState({ success: 0, fail: 0 });

  const simulateProgress = (total: number, label: string, onComplete: () => void) => {
    let current = 0;
    const batchSize = Math.max(1, Math.ceil(total / 100)); // Update ~100 times
    
    const timer = setInterval(() => {
      current += batchSize;
      if (current >= total) {
        current = total;
        clearInterval(timer);
        setProgress({ percent: 100, current, total, label });
        setTimeout(onComplete, 300);
      } else {
        setProgress({ percent: (current / total) * 100, current, total, label });
      }
    }, 20); // Fast simulation for parsing
  };

  const handleFileSelect = async (file: File) => {
    try {
      setProgress({ percent: 0, current: 0, total: 0, label: "正在读取文件..." });
      
      const parsed = await parseExcelFile(file);
      if (parsed.sheets.length === 0 || parsed.sheets[0].data.length === 0) {
        alert("文件为空或无有效数据");
        return;
      }
      
      // Find the sheet with the most matching columns
      let bestSheet = parsed.sheets[0];
      let maxMatches = -1;
      
      for (const sheet of parsed.sheets) {
        const mapped = guessMapping(sheet.headers);
        const matchCount = Object.keys(mapped).length;
        if (matchCount > maxMatches) {
          maxMatches = matchCount;
          bestSheet = sheet;
        }
      }
      
      const headers = bestSheet.headers;
      const data = bestSheet.data;
      
      const fp = generateFingerprint(headers);
      setRawHeaders(headers);
      setRawData(data);
      setFingerprint(fp);

      // Check for saved mapping rule
      try {
        const res = await fetch(`/api/mapping?fingerprint=${encodeURIComponent(fp)}`);
        const result = await res.json();
        
        if (result.rule && result.rule.mappings) {
          const savedMapping = JSON.parse(result.rule.mappings);
          applyMappingAndPreview(data, savedMapping, headers);
          return;
        }
      } catch (err) {
        console.error("Failed to fetch mapping", err);
      }

      // No saved rule, guess mapping
      const guessed = guessMapping(headers);
      
      // Check if guessed mapping has all required fields mapped
      const requiredKeys = standardFields.filter(f => f.required).map(f => f.key);
      const mappedKeys = Object.values(guessed);
      const missingRequired = requiredKeys.filter(k => !mappedKeys.includes(k));
      
      if (missingRequired.length > 0) {
        // Need manual mapping
        setMapping(guessed);
        setStep("mapping");
      } else {
        // Auto mapped completely
        applyMappingAndPreview(data, guessed, headers);
      }
      
    } catch (error) {
      console.error(error);
      alert("解析文件失败，请检查文件格式。");
    }
  };

  const handleMappingConfirm = async (confirmedMapping: Record<string, string>) => {
    setStep("upload"); // Intermediate step for progress bar
    
    // Save the mapping
    try {
      await fetch("/api/mapping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fingerprint, mappings: confirmedMapping, templateName: "Manual Template" })
      });
    } catch (err) {
      console.error("Failed to save mapping", err);
    }

    applyMappingAndPreview(rawData, confirmedMapping, rawHeaders);
  };

  const applyMappingAndPreview = (data: any[], mapped: Record<string, string>, headers: string[]) => {
    setProgress({ percent: 0, current: 0, total: data.length, label: "正在处理和校验数据..." });
    
    simulateProgress(data.length, "数据处理中", () => {
      const { validData, errors } = validateData(data, mapped, headers);
      setValidData(validData);
      setErrors(errors);
      setMapping(mapped);
      setStep("preview");
    });
  };

  const handleDataChange = (newData: any[]) => {
    const { validData: newValidData, errors: newErrors } = validateData(
      newData.map(row => {
        // Reconstruct original row format temporarily to reuse validateData logic easily
        // Actually, since DataGrid edits the *mapped* validData directly, we need a modified validator
        // But for simplicity in this demo, let's just do a reverse map or direct validation.
        const originalFormatRow: any = {};
        for (const [header, key] of Object.entries(mapping)) {
          if (key) {
            originalFormatRow[header] = row[key];
          }
        }
        return originalFormatRow;
      }),
      mapping,
      rawHeaders
    );
    
    setValidData(newValidData);
    setErrors(newErrors);
  };

  const handleRemoveRow = (index: number) => {
    const newData = [...validData];
    newData.splice(index, 1);
    handleDataChange(newData);
  };

  const handleAddRow = () => {
    const newRow: any = {};
    standardFields.forEach(f => { newRow[f.key] = ""; });
    const newData = [...validData, newRow];
    handleDataChange(newData);
  };

  const handleSubmit = async () => {
    if (errors.length > 0) {
      alert("请先修复所有错误再提交！");
      return;
    }
    
    if (validData.length === 0) {
      alert("没有可提交的数据。");
      return;
    }

    setStep("submitting");
    setProgress({ percent: 0, current: 0, total: validData.length, label: "正在提交到服务器..." });

    try {
      const res = await fetch("/api/waybills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: validData })
      });
      
      const result = await res.json();
      
      if (res.ok) {
        setProgress({ percent: 100, current: validData.length, total: validData.length, label: "提交成功" });
        setSubmitResult({ success: result.count, fail: 0 });
        setStep("result");
      } else {
        alert("提交失败: " + (result.error || "未知错误"));
        setStep("preview");
      }
    } catch (err) {
      console.error(err);
      alert("提交失败，网络异常");
      setStep("preview");
    }
  };

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">批量下单导入系统</h1>
          <p className="text-gray-500 text-sm mt-1">支持多模板自动识别，智能纠错</p>
        </div>
        <Link href="/history" className="text-blue-600 hover:text-blue-800 font-medium bg-blue-50 px-4 py-2 rounded-lg transition-colors">
          查看已导入历史
        </Link>
      </div>

      {step === "upload" && (
        <div className="max-w-3xl mx-auto mt-12">
          {progress.percent > 0 ? (
            <div className="p-8 border rounded-lg bg-white shadow-sm">
              <ProgressBar 
                progress={progress.percent} 
                label={progress.label} 
                current={progress.current} 
                total={progress.total} 
              />
            </div>
          ) : (
            <UploadZone onFileSelect={handleFileSelect} />
          )}
        </div>
      )}

      {step === "mapping" && (
        <MappingModal
          isOpen={true}
          headers={rawHeaders}
          initialMapping={mapping}
          onConfirm={handleMappingConfirm}
          onCancel={() => { setStep("upload"); setProgress({percent:0, current:0, total:0, label:""}); }}
        />
      )}

      {step === "preview" && (
        <div className="space-y-6">
          <ErrorPanel errors={errors} />
          
          <DataGrid 
            data={validData} 
            errors={errors}
            onDataChange={handleDataChange}
            onRemoveRow={handleRemoveRow}
            onAddRow={handleAddRow}
          />
          
          <div className="flex justify-end space-x-4 border-t pt-4">
            <button
              onClick={() => { setStep("upload"); setProgress({percent:0, current:0, total:0, label:""}); }}
              className="px-6 py-2 border rounded shadow-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              重新上传
            </button>
            <button
              onClick={handleSubmit}
              disabled={errors.length > 0}
              className={`px-8 py-2 rounded shadow-sm text-white font-medium transition-colors ${
                errors.length > 0 
                  ? "bg-gray-400 cursor-not-allowed" 
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              提交下单 ({validData.length} 条)
            </button>
          </div>
        </div>
      )}

      {step === "submitting" && (
        <div className="max-w-xl mx-auto mt-20 p-8 border rounded-lg bg-white shadow-sm text-center">
          <div className="mb-6">
            <svg className="animate-spin h-10 w-10 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <ProgressBar 
            progress={progress.percent} 
            label={progress.label} 
            current={progress.current} 
            total={progress.total} 
          />
        </div>
      )}

      {step === "result" && (
        <div className="max-w-lg mx-auto mt-20 text-center space-y-6">
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-500">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">上传成功！</h2>
          <div className="bg-gray-50 p-6 rounded-lg text-lg">
            <p className="text-gray-600 mb-2">本次共成功处理</p>
            <p className="text-3xl font-bold text-blue-600">{submitResult.success} <span className="text-base font-normal text-gray-500">条运单</span></p>
          </div>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => { setStep("upload"); setProgress({percent:0, current:0, total:0, label:""}); }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              继续上传
            </button>
            <Link
              href="/history"
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              查看历史记录
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
