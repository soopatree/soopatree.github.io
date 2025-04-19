document.addEventListener("DOMContentLoaded", function () {
  const dropZone = document.getElementById("dropZone");
  const results = document.getElementById("results");
  const donationTableBody = document.getElementById("donationTableBody");
  const rouletteGrid = document.getElementById("rouletteGrid");
  const downloadDonationBtn = document.getElementById("downloadDonationBtn");
  const downloadRouletteBtn = document.getElementById("downloadRouletteBtn");

  // Store data globally for download
  let processedDonations = [];
  let processedRoulette = {
    donors: {},
    results: [],
    resultProbabilities: {} // 각 결과별 확률을 저장하기 위한 객체 추가
  };

  // 드래그 앤 드롭 이벤트 설정
  function setupDragAndDrop() {
    // Prevent default drag behaviors
    ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
      dropZone.addEventListener(eventName, preventDefaults, false);
      document.body.addEventListener(eventName, preventDefaults, false);
    });

    // Highlight drop zone when dragging over it
    ["dragenter", "dragover"].forEach((eventName) => {
      dropZone.addEventListener(eventName, highlight, false);
    });

    ["dragleave", "drop"].forEach((eventName) => {
      dropZone.addEventListener(eventName, unhighlight, false);
    });

    // Handle dropped files
    dropZone.addEventListener("drop", handleDrop, false);
  }
  
  // 드래그 앤 드롭 이벤트 초기화
  setupDragAndDrop();

  // Add download event listeners
  downloadDonationBtn.addEventListener("click", downloadDonationCSV);
  downloadRouletteBtn.addEventListener("click", downloadRouletteCSV);

  // Add click event to open file input dialog
  dropZone.addEventListener("click", function () {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".csv";
    fileInput.style.display = "none";

    fileInput.addEventListener("change", function (event) {
      const file = event.target.files[0];
      if (file && (file.type === "text/csv" || file.name.endsWith(".csv"))) {
        parseCSV(file);
      } else {
        alert("CSV 파일만 지원됩니다.");
      }
    });

    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
  });

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  function highlight() {
    dropZone.classList.add("highlight");
  }

  function unhighlight() {
    dropZone.classList.remove("highlight");
  }

  function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;

    if (files.length) {
      const file = files[0];
      if (file.type === "text/csv" || file.name.endsWith(".csv")) {
        parseCSV(file);
      } else {
        alert("CSV 파일만 지원됩니다.");
      }
    }
  }

  function parseCSV(file) {
    console.log('파일 파싱 시작:', file.name);
    const reader = new FileReader();

    reader.onload = function (e) {
      try {
        // 파일 인코딩 처리 (UTF-8 혹은 EUC-KR)
        let contents = e.target.result;
        
        // BOM(Byte Order Mark) 제거
        if (contents.charCodeAt(0) === 0xFEFF) {
          contents = contents.slice(1);
        }
        
        console.log('파일 내용 샘플:', contents.substring(0, 200));
        
        // 파일에 '별풍선' 문자열이 포함되어 있는지 확인
        if (contents.indexOf('별풍선') === -1) {
          // 형식이 맞지 않을 경우 알림
          alert("지원되는 CSV 형식이 아닙니다. '별풍선' 항목이 포함된 CSV 파일을 업로드해주세요.");
          return;
        }
        
        // 개선된 CSV 파싱 메소드 호출
        processCSVData(contents);
      } catch (err) {
        console.error("CSV 파싱 중 오류 발생:", err);
        alert("CSV 파일 처리 중 오류가 발생했습니다. 파일 형식을 확인해주세요.");
      }
    };

    reader.onerror = function(err) {
      console.error("파일 읽기 오류:", err);
      alert("파일을 읽는 중 오류가 발생했습니다.");
    };

    // 먼저 UTF-8로 시도
    reader.readAsText(file, "UTF-8");
    console.log('파일 읽기 요청 완료');
  }

  // 소괄호 안의 확률 정보를 추출하는 함수
  function extractProbability(text) {
    const match = text.match(/\(([0-9.]+)%\)/);
    if (match && match[1]) {
      return parseFloat(match[1]);
    }
    return 0; // 확률 정보가 없으면 0으로 처리
  }

  // 향상된 CSV 행 파싱 함수 - 큰따옴표로 묶인 필드 내의 쉼표를 올바르게 처리
  function parseCSVLine(line) {
    const result = [];
    let inQuotes = false;
    let currentField = '';
    
    for (let i = 0; i < line.length; i++) {
      const char = line.charAt(i);
      
      if (char === '"') {
        // 따옴표를 만났을 때 상태 전환
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        // 필드 구분자를 만났고 따옴표 밖에 있을 때
        result.push(currentField);
        currentField = '';
      } else {
        // 일반 문자는 현재 필드에 추가
        currentField += char;
      }
    }
    
    // 마지막 필드 추가
    result.push(currentField);
    
    // 따옴표 제거 및 트림 처리
    return result.map(field => {
      // 필드 앞뒤 따옴표 제거 및 공백 제거
      field = field.trim();
      if (field.startsWith('"') && field.endsWith('"')) {
        field = field.substring(1, field.length - 1);
      }
      return field;
    });
  }

  // 개선된 CSV 파싱 함수
  function processCSVData(csv) {
    console.log('CSV 처리 시작');
    
    // 파일 형식 분석 및 라인 분리
    const lines = csv.split(/\\r?\\n/);
    console.log(`총 ${lines.length}개의 라인 발견`);
    
    // 패턴 매칭 기반 처리 방식으로 변경 (test.js 방식 참고)
    const pattern = /별풍선,"([^"]+)",([^,]+),([^,]+),([^,]*),([^,]*)/g;
    console.log('패턴 매칭 방식으로 데이터 처리 중...');
    
    // Process data - group by user ID
    const donorsById = {};
    const rouletteByDonor = {};
    const allRouletteResults = new Set();
    const resultProbabilities = {}; // 각 룰렛 결과별 확률

    // 처리 통계 변수
    let processedRows = 0;
    let skippedRows = 0;
    let errorRows = 0;
    
    // 모든 매치 처리
    let match;
    while ((match = pattern.exec(csv)) !== null) {
      try {
        processedRows++;
        
        const dateWithDays = match[1].trim();
        const donorFull = match[2].trim();
        const amountText = match[3].trim();
        const message = match[4].trim();
        const rouletteResult = match[5] ? match[5].trim() : '';
        
        // 주기적 로깅
        if (processedRows <= 5 || processedRows % 50 === 0) {
          console.log(`처리 #${processedRows}:`, { donorFull, amountText, message, rouletteResult });
        }
        
        // 후원 개수 추출 (숫자만)
        const amount = parseInt(amountText.replace(/[^0-9]/g, ""), 10) || 0;
        
        // ID 추출 (괄호 안의 문자)
        const idMatch = donorFull.match(/\(([^)]+)\)/);
        const donorId = idMatch ? idMatch[1] : donorFull.replace(/\s+/g, '_');
        
        // 닉네임 추출 (괄호를 포함한 부분만 지우기)
        let nickname = donorFull;
        if (idMatch) {
          // 괄호와 ID만 제거하고 원래 닉네임만 남기기
          nickname = donorFull.split('(')[0].trim();
        }

        // Initialize donor data if not exists
        if (!donorsById[donorId]) {
          donorsById[donorId] = {
            id: donorId,
            nicknames: new Set(),
            totalAmount: 0,
            messages: [],
          };
        }

        // Add nickname and update totals
        donorsById[donorId].nicknames.add(nickname);
        donorsById[donorId].totalAmount += amount;

        if (message) {
          donorsById[donorId].messages.push(message);
        }

        // Track roulette results by donor
        if (rouletteResult && rouletteResult.trim()) {
          // 룰렛 결과 정규화 - 앞뒤 공백 제거
          const normalizedRoulette = rouletteResult.trim();
          
          if (!rouletteByDonor[donorId]) {
            rouletteByDonor[donorId] = {};
          }

          if (!rouletteByDonor[donorId][normalizedRoulette]) {
            rouletteByDonor[donorId][normalizedRoulette] = 0;
          }

          rouletteByDonor[donorId][normalizedRoulette]++;
          allRouletteResults.add(normalizedRoulette);
          
          // 확률 정보 추출 (소괄호 안의 숫자%)
          const probability = extractProbability(normalizedRoulette);
          if (probability > 0 && !resultProbabilities[normalizedRoulette]) {
            resultProbabilities[normalizedRoulette] = probability;
          }
        }
      } catch (e) {
        console.error(`처리 #${processedRows}: 데이터 처리 중 오류 발생`, e);
        errorRows++;
        continue;
      }
    }

    // Convert to array and sort by total amount
    const donations = Object.values(donorsById);
    donations.sort((a, b) => b.totalAmount - a.totalAmount);

    // 결과를 확률 기준으로 내림차순 정렬
    const rouletteResultsWithProbabilities = Array.from(allRouletteResults).map(result => ({
      result: result,
      probability: resultProbabilities[result] || 0
    }));
    
    // 확률 기준으로 내림차순 정렬
    rouletteResultsWithProbabilities.sort((a, b) => b.probability - a.probability);
    
    // 정렬된 결과 추출
    const sortedResults = rouletteResultsWithProbabilities.map(item => item.result);

    // Store data for downloads
    processedDonations = donations;
    processedRoulette.donors = rouletteByDonor;
    processedRoulette.results = sortedResults; // 정렬된 결과로 저장
    processedRoulette.donorsById = donorsById;
    processedRoulette.resultProbabilities = resultProbabilities; // 결과별 확률 저장

    // Display donations
    donationTableBody.innerHTML = "";
    donations.forEach((donation, index) => {
      const row = document.createElement("tr");

      // Format nicknames with asterisks for multiple names
      const nicknamesArray = Array.from(donation.nicknames);
      let nicknameDisplay = nicknamesArray[0] + "(" + donation.id + ")";

      if (nicknamesArray.length > 1) {
        nicknameDisplay += " *" + nicknamesArray.slice(1).join(", *");
      }

      row.innerHTML = `
                  <td><span class="rank">${index + 1}</span></td>
                  <td>${nicknameDisplay}</td>
                  <td><span class="donation-amount">${donation.totalAmount}</span></td>
              `;
      donationTableBody.appendChild(row);
    });

    // Display roulette results in a table
    rouletteGrid.innerHTML = "";

    // Create table for roulette results
    const table = document.createElement("table");
    table.className = "roulette-table";

    // Create header row
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");

    // Add donor column header (not draggable)
    const donorHeader = document.createElement("th");
    donorHeader.textContent = "후원자";
    donorHeader.setAttribute("data-fixed", "true");
    headerRow.appendChild(donorHeader);

    // Add column for each roulette result (draggable)
    sortedResults.forEach((result, index) => {
      const th = document.createElement("th");
      const probability = resultProbabilities[result] || 0;
      
      th.textContent = result; // 원래 텍스트 (확률 포함) 그대로 표시
      th.setAttribute("draggable", "true");
      th.setAttribute("data-result", result);
      th.setAttribute("data-index", index + 1); // +1 because donor column is at index 0
      th.setAttribute("data-probability", probability);
      th.className = "draggable-header";
      headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create table body
    const tbody = document.createElement("tbody");

    // Add row for each donor
    Object.keys(rouletteByDonor).forEach((userId) => {
      const donor = donorsById[userId];
      if (!donor) return;

      const row = document.createElement("tr");

      // Add donor name cell
      const donorCell = document.createElement("td");
      const nicknamesArray = Array.from(donor.nicknames);
      let nicknameDisplay = nicknamesArray[0] + "(" + donor.id + ")";

      if (nicknamesArray.length > 1) {
        nicknameDisplay += " *" + nicknamesArray.slice(1).join(", *");
      }

      donorCell.textContent = nicknameDisplay;
      row.appendChild(donorCell);

      // Add count cell for each result
      sortedResults.forEach((result) => {
        const cell = document.createElement("td");
        cell.setAttribute("data-result", result);
        const count = rouletteByDonor[userId][result] || 0;

        if (count > 0) {
          cell.textContent = count;
          cell.className = "highlight";
        } else {
          cell.textContent = "-";
        }

        row.appendChild(cell);
      });

      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    rouletteGrid.appendChild(table);

    // Enable drag and drop for table headers
    setupDragDropForHeaders(table);

    // 통계 정보 로깅
    console.log('CSV 처리 완료:', {
      처리된행수: processedRows,
      건너뛴행수: skippedRows,
      오류행수: errorRows,
      후원자수: Object.keys(donorsById).length,
      룰렛결과종류: allRouletteResults.size
    });
    
    // 각 결과별 확률 로깅
    console.log('룰렛 결과별 확률:', resultProbabilities);
    
    // Show results
    results.style.display = "block";

    // Enable download buttons
    downloadDonationBtn.disabled = false;
    downloadRouletteBtn.disabled = false;
  }

  // Function to setup drag and drop for table headers
  function setupDragDropForHeaders(table) {
    const headers = table.querySelectorAll("th.draggable-header");
    let draggedHeader = null;
    let placeholder = null;

    headers.forEach((header) => {
      // Dragstart event
      header.addEventListener("dragstart", function (e) {
        draggedHeader = this;
        this.classList.add("dragging");

        // Create a placeholder element for the dragged header
        placeholder = document.createElement("div");
        placeholder.classList.add("header-placeholder");
        placeholder.textContent = this.textContent;

        // Set some data for the drag operation
        e.dataTransfer.setData("text/plain", this.textContent);
        e.dataTransfer.effectAllowed = "move";

        // Create a custom drag image (optional)
        const dragImage = this.cloneNode(true);
        dragImage.style.display = "inline-block";
        dragImage.style.opacity = "0.7";
        document.body.appendChild(dragImage);
        e.dataTransfer.setDragImage(dragImage, 0, 0);

        // Remove the drag image after it's no longer needed
        setTimeout(() => {
          document.body.removeChild(dragImage);
        }, 0);
      });

      // Dragend event
      header.addEventListener("dragend", function () {
        this.classList.remove("dragging");
        draggedHeader = null;
      });

      // Dragover event
      header.addEventListener("dragover", function (e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        this.classList.add("drag-over");
      });

      // Dragleave event
      header.addEventListener("dragleave", function () {
        this.classList.remove("drag-over");
      });

      // Drop event
      header.addEventListener("drop", function (e) {
        e.preventDefault();
        this.classList.remove("drag-over");

        if (draggedHeader && draggedHeader !== this) {
          // Swap the columns
          swapColumns(table, draggedHeader, this);

          // Update the download order
          updateRouletteResultsOrder();
        }
      });
    });
  }

  // Function to swap columns in the table
  function swapColumns(table, fromHeader, toHeader) {
    const fromIndex = parseInt(fromHeader.getAttribute("data-index"));
    const toIndex = parseInt(toHeader.getAttribute("data-index"));

    // Update the data-index attributes
    fromHeader.setAttribute("data-index", toIndex);
    toHeader.setAttribute("data-index", fromIndex);

    // Get all rows (including the header row)
    const rows = table.querySelectorAll("tr");

    // For each row, swap the cells at the given indices
    rows.forEach((row) => {
      const cells = row.querySelectorAll("th, td");

      // Skip if there aren't enough cells
      if (cells.length <= Math.max(fromIndex, toIndex)) return;

      // Swap the cells
      const fromCell = cells[fromIndex];
      const toCell = cells[toIndex];

      // Create a temporary marker
      const temp = document.createElement("div");
      row.insertBefore(temp, fromCell);

      // Move the cells
      row.insertBefore(fromCell, toCell);
      row.insertBefore(toCell, temp);

      // Remove the temporary marker
      row.removeChild(temp);
    });
  }

  // Function to update the roulette results order for downloads
  function updateRouletteResultsOrder() {
    if (!processedRoulette.results || processedRoulette.results.length === 0) return;

    // Get the headers in their current order
    const headers = document.querySelectorAll(".roulette-table th.draggable-header");
    const newOrder = Array.from(headers).map((header) => header.getAttribute("data-result"));

    // Update the results array with the new order
    processedRoulette.results = newOrder;
  }

  // Function to download donation ranking as CSV
  function downloadDonationCSV() {
    if (processedDonations.length === 0) {
      alert("다운로드할 데이터가 없습니다. CSV 파일을 먼저 업로드해주세요.");
      return;
    }

    // Create CSV header
    let csvContent = "순위,후원자,아이디,닉네임,후원개수\n";

    // Add data rows
    processedDonations.forEach((donation, index) => {
      const rank = index + 1;
      const id = donation.id;
      const nicknamesArray = Array.from(donation.nicknames);
      const primaryNickname = nicknamesArray[0];
      const amount = donation.totalAmount;

      // Format the full donor name for display
      const donorFull = primaryNickname + "(" + id + ")";

      // Add row to CSV content - 원본 test.js 형식과 일치하도록 변경
      csvContent += `${rank},"${donorFull}","${id}","${primaryNickname}",${amount}\n`;
    });

    // Create and download the file
    downloadCSV(csvContent, "후원순위.csv");
  }

  // Function to download roulette statistics as CSV
  function downloadRouletteCSV() {
    if (!processedRoulette.results || processedRoulette.results.length === 0) {
      alert("다운로드할 데이터가 없습니다. CSV 파일을 먼저 업로드해주세요.");
      return;
    }

    // Get the latest order of results from the DOM
    updateRouletteResultsOrder();

    // Create header row with all roulette results
    let header = "후원자,아이디,닉네임";
    processedRoulette.results.forEach((result) => {
      header += `,${result.replace(/,/g, ";")}`;  // 쉼표를 세미콜론으로 대체하여 CSV 형식 오류 방지
    });
    let csvContent = header + "\n";

    // Add data for each donor
    Object.keys(processedRoulette.donors).forEach((userId) => {
      const donor = processedRoulette.donorsById[userId];
      if (!donor) return;

      const nicknamesArray = Array.from(donor.nicknames);
      const primaryNickname = nicknamesArray[0];
      const donorFull = primaryNickname + "(" + userId + ")";

      // Start building the row - 원본 test.js 형식과 일치하도록 변경
      let row = `"${donorFull.replace(/"/g, '""')}","${userId}","${primaryNickname.replace(/"/g, '""')}"`;

      // Add count for each roulette result in the current order
      processedRoulette.results.forEach((result) => {
        const count = processedRoulette.donors[userId][result] || 0;
        // 원본 test.js와 같이 카운트가 0인 경우 셀을 비워둠
        row += count > 0 ? `,${count}` : `,`;
      });

      // Add the row to CSV content
      csvContent += row + "\n";
    });

    // Create and download the file
    downloadCSV(csvContent, "룰렛결과통계.csv");
  }

  // Helper function to create and download a CSV file
  function downloadCSV(csvContent, fileName) {
    try {
      // BOM 추가하여 UTF-8로 인코딩 (Excel에서 한글 인코딩 문제 해결)
      const csvUTF8 = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvContent], { type: "text/csv;charset=utf-8;" });

      // Create a download link
      const link = document.createElement("a");
      link.href = URL.createObjectURL(csvUTF8);
      link.download = fileName;

      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log(`파일 다운로드 성공: ${fileName}`);
    } catch (err) {
      console.error("CSV 다운로드 중 오류 발생:", err);
      alert("CSV 파일 다운로드 중 오류가 발생했습니다.");
    }
  }
});