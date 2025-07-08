import './style.css';

import { 
  setupDragAndDrop, 
  setupDragDropForHeaders, 
  swapColumns 
} from './modules/dragDrop';
import { parseCSV, downloadCSV } from './modules/csvParser';
import { 
  processCSVData, 
  generateDonationCSV, 
  generateRouletteCSV 
} from './modules/dataProcessor';
import { updateDonationTable, updateRouletteGrid } from './modules/ui';
import { initDateFilter } from './modules/dateFilter';
import { initBalloonFilter } from './modules/balloonFilter';

document.addEventListener("DOMContentLoaded", function () {
  // DOM 요소 참조
  const dropZone = document.getElementById("dropZone");
  const mockup = document.getElementById("mockup");
  const results = document.getElementById("results");
  const donationTableBody = document.getElementById("donationTableBody");
  const rouletteGrid = document.getElementById("rouletteGrid");
  const downloadDonationBtn = document.getElementById("downloadDonationBtn");
  const downloadRouletteBtn = document.getElementById("downloadRouletteBtn");

  // 전역 데이터 저장소
  let processedData = {
    donations: [],
    rouletteByDonor: {},
    results: [],
    donorsById: {},
    resultProbabilities: {}
  };
  
  // 원본 CSV 데이터 저장
  let originalCSVContent = '';
  
  // 날짜 필터 인스턴스 저장
  let dateFilterInstance = null;

  // 풍선 필터 인스턴스 저장
  let balloonFilterInstance = null;

  // 전역 필터링 함수 정의
  function checkDateInRange(dateStr) {
    return !dateFilterInstance ? true : dateFilterInstance.isDateInRange(dateStr);
  }

  function checkBalloonInRange(amount) {
    return !balloonFilterInstance ? true : balloonFilterInstance.isBalloonInRange(amount);
  }

  // 파일 드롭 처리 함수
  function handleDrop(e) {
    const file = e.dataTransfer.files[0];
    if (file && (file.type === "text/csv" || file.name.endsWith(".csv"))) {
      handleCSVFile(file);
    } else {
      alert("CSV 파일만 지원됩니다.");
    }
  }

  // CSV 파일 처리 함수
  function handleCSVFile(file) {
    parseCSV(file, handleProcessedCSVData);
  }
  
  // 처리된 CSV 데이터 핸들링 함수
  function handleProcessedCSVData(csvContent) {
    // 원본 CSV 데이터 저장
    originalCSVContent = csvContent;
    
    // CSV 데이터 처리
    processFilteredData(csvContent);
    
    // 날짜 필터링 초기화
    dateFilterInstance = initDateFilter({
      csvContent: originalCSVContent,
      onFilterChange: () => processFilteredData(originalCSVContent)
    });

    balloonFilterInstance = initBalloonFilter({
      onFilterChange: () => processFilteredData(originalCSVContent)
    });
    
    // 목업 영역 숨기기
    mockup.style.display = "none";
    
    // 결과 표시
    results.style.display = "block";
  }

  // 필터링된 데이터 처리 함수
  function processFilteredData(csvContent) {
    // CSV 데이터 처리 (필터링 함수 설정)
    processedData = processCSVData(csvContent, {
      isDateInRange: checkDateInRange,
      isBalloonInRange: checkBalloonInRange
    });
    
    // UI 업데이트
    updateDonationTable(donationTableBody, processedData.donations);
    updateRouletteGrid(
      rouletteGrid, 
      processedData, 
      setupDragDropForHeaders, 
      swapColumns, 
      updateRouletteResultsOrder
    );
    
    // 다운로드 버튼 활성화
    downloadDonationBtn.disabled = false;
    downloadRouletteBtn.disabled = false;
    
    // 날짜 정보 표시 업데이트
    if (dateFilterInstance) {
      dateFilterInstance.updateDateInfo(
        processedData.stats.totalProcessed,
        processedData.stats.totalRows,
        processedData.stats.minDate,
        processedData.stats.maxDate
      );
    }
  }

  // 룰렛 결과 순서 업데이트 함수
  function updateRouletteResultsOrder() {
    if (!processedData.results || processedData.results.length === 0) return;

    // 헤더의 현재 순서 가져오기
    const headers = document.querySelectorAll(".roulette-table th.draggable-header");
    processedData.results = Array.from(headers).map((header) => header.getAttribute("data-result"));
  }

  // 후원 데이터 CSV 다운로드 함수
  function downloadDonationCSV() {
    if (processedData.donations.length === 0) {
      alert("다운로드할 데이터가 없습니다. CSV 파일을 먼저 업로드해주세요.");
      return;
    }

    const csvContent = generateDonationCSV(processedData.donations);
    downloadCSV(csvContent, "후원순위.csv");
  }

  // 룰렛 데이터 CSV 다운로드 함수
  function downloadRouletteCSV() {
    if (!processedData.results || processedData.results.length === 0) {
      alert("다운로드할 데이터가 없습니다. CSV 파일을 먼저 업로드해주세요.");
      return;
    }

    updateRouletteResultsOrder();
    const csvContent = generateRouletteCSV(processedData);
    downloadCSV(csvContent, "룰렛결과통계.csv");
  }

  // 이벤트 리스너 설정
  setupDragAndDrop(dropZone, handleDrop);
  downloadDonationBtn.addEventListener("click", downloadDonationCSV);
  downloadRouletteBtn.addEventListener("click", downloadRouletteCSV);

  // 파일 선택 다이얼로그 클릭 이벤트
  dropZone.addEventListener("click", function () {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".csv";
    fileInput.style.display = "none";

    fileInput.addEventListener("change", function (event) {
      const file = event.target.files[0];
      if (file && (file.type === "text/csv" || file.name.endsWith(".csv"))) {
        handleCSVFile(file);
      } else {
        alert("CSV 파일만 지원됩니다.");
      }
    });

    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
  });
});