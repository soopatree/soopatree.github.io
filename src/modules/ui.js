/**
 * 후원 테이블 UI 업데이트 함수
 * @param {HTMLElement} donationTableBody - 후원 테이블 본문 엘리먼트
 * @param {Array} donations - 후원 데이터 배열
 */
export function updateDonationTable(donationTableBody, donations) {
  donationTableBody.innerHTML = "";
  
  // 데이터 유효성 검사
  if (!donations || !Array.isArray(donations) || donations.length === 0) {
    return;
  }
  
  donations.forEach((donation, index) => {
    const row = document.createElement("tr");

    // 여러 닉네임이 있을 경우 * 표시로 구분
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

    // 행 숨기기 컨텍스트 메뉴 추가
    row.addEventListener('contextmenu', (e) => showContextMenu(e, 'row', row));
  });
}

/**
 * 룰렛 그리드 UI 업데이트 함수
 * @param {HTMLElement} rouletteGrid - 룰렛 그리드 엘리먼트
 * @param {Object} processedRoulette - 처리된 룰렛 데이터
 * @param {Function} setupDragDropForHeaders - 헤더 드래그 앤 드롭 설정 함수
 * @param {Function} swapColumns - 컬럼 교체 함수
 * @param {Function} updateRouletteResultsOrder - 결과 순서 업데이트 함수
 */
export function updateRouletteGrid(rouletteGrid, processedRoulette, setupDragDropForHeaders, swapColumns, updateRouletteResultsOrder) {
  // 매개변수 유효성 검사
  if (!rouletteGrid) return;

  // 데이터 구조 분해 할당
  const { 
    results: sortedResults = [], 
    rouletteByDonor = {}, 
    donorsById = {}, 
    resultProbabilities = {} 
  } = processedRoulette || {};
  
  // HTML 초기화
  rouletteGrid.innerHTML = "";

  // 테이블 생성
  const table = document.createElement("table");
  table.className = "roulette-table";

  // 헤더 행 생성
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");

  // 후원자 컬럼 헤더 추가
  const donorHeader = document.createElement("th");
  donorHeader.textContent = "후원자";
  donorHeader.setAttribute("data-fixed", "true");
  headerRow.appendChild(donorHeader);

  // 각 룰렛 결과 헤더 추가
  if (sortedResults && sortedResults.length > 0) {
    sortedResults.forEach((result, index) => {
      const th = document.createElement("th");
      const probability = resultProbabilities[result] || 0;
      
      th.textContent = result;
      th.setAttribute("draggable", "true");
      th.setAttribute("data-result", result);
      th.setAttribute("data-index", index + 1);
      th.setAttribute("data-probability", probability);
      th.className = "draggable-header";
      headerRow.appendChild(th);

      // 열 숨기기 컨텍스트 메뉴 추가
      th.addEventListener('contextmenu', (e) => showContextMenu(e, 'column', th));
    });
  }

  thead.appendChild(headerRow);
  table.appendChild(thead);

  // 테이블 본문 생성
  const tbody = document.createElement("tbody");
  
  // 각 후원자에 대한 룰렛 결과 행 생성
  if (Object.keys(donorsById).length > 0 && Object.keys(rouletteByDonor).length > 0) {
    const donorIds = Object.keys(donorsById);
    
    donorIds.forEach(donorId => {
      const donor = donorsById[donorId];
      
      // 이 후원자의 룰렛 데이터가 있는지 확인
      const donorRouletteData = rouletteByDonor[donorId];
      
      // 룰렛 데이터가 없으면 건너뛰기
      if (!donorRouletteData) return;
      
      // 행 생성
      const row = document.createElement("tr");
      
      // 후원자 이름 셀 추가
      const donorCell = document.createElement("td");
      const nicknamesArray = Array.from(donor.nicknames);
      let nicknameDisplay = nicknamesArray[0] + "(" + donor.id + ")";
      
      if (nicknamesArray.length > 1) {
        nicknameDisplay += " *" + nicknamesArray.slice(1).join(", *");
      }
      
      donorCell.textContent = nicknameDisplay;
      row.appendChild(donorCell);
      
      // 각 룰렛 결과 셀 추가
      sortedResults.forEach(result => {
        const cell = document.createElement("td");
        cell.setAttribute("data-result", result);
        
        const count = donorRouletteData[result] || 0;
        
        if (count > 0) {
          cell.textContent = count;
          cell.className = "highlight";
        } else {
          cell.textContent = "-";
        }
        
        row.appendChild(cell);
      });
      
      // 행을 테이블에 추가
      tbody.appendChild(row);

      // 행 숨기기 컨텍스트 메뉴 추가
      row.addEventListener('contextmenu', (e) => showContextMenu(e, 'row', row));
    });
  }
  
  table.appendChild(tbody);
  rouletteGrid.appendChild(table);
  
  // 드래그 앤 드롭 기능 활성화
  setupDragDropForHeaders(table, swapColumns, updateRouletteResultsOrder);
}

/**
 * 룰렛 결과 순서 업데이트 함수
 */
export function updateRouletteResultsOrder() {
  const headers = document.querySelectorAll(".roulette-table th.draggable-header");
  const results = Array.from(headers).map((header) => header.getAttribute("data-result"));
  
  // 전역 데이터 업데이트
  if (window.processedData) {
    window.processedData.results = results;
  }
}

// Global variable to hold the context menu element
let contextMenu = null;

function hideContextMenu() {
  if (contextMenu && contextMenu.parentNode) {
    contextMenu.parentNode.removeChild(contextMenu);
    contextMenu = null;
  }
}

function showContextMenu(event, type, targetElement) {
  event.preventDefault(); // Prevent default browser context menu

  hideContextMenu(); // Hide any existing menu

  contextMenu = document.createElement('ul');
  contextMenu.className = 'context-menu';

  if (type === 'row') {
    const hideRowItem = document.createElement('li');
    hideRowItem.textContent = '행 숨기기';
    hideRowItem.addEventListener('click', () => {
      hideRow(targetElement);
      hideContextMenu();
    });
    contextMenu.appendChild(hideRowItem);
  } else if (type === 'column') {
    const hideColumnItem = document.createElement('li');
    hideColumnItem.textContent = '열 숨기기';
    hideColumnItem.addEventListener('click', () => {
      // Need to pass column index and table reference
      const columnIndex = Array.from(targetElement.parentNode.children).indexOf(targetElement);
      hideColumn(columnIndex, targetElement.closest('table'));
      hideContextMenu();
    });
    contextMenu.appendChild(hideColumnItem);
  }

  // Position the menu
  contextMenu.style.top = `${event.pageY}px`;
  contextMenu.style.left = `${event.pageX}px`;

  document.body.appendChild(contextMenu);

  // Hide menu when clicking anywhere else
  document.addEventListener('click', hideContextMenu, { once: true });
}

function hideRow(rowElement) {
  rowElement.classList.add('hidden-row');
}

function hideColumn(columnIndex, tableElement) {
  const rows = tableElement.querySelectorAll('tr');
  rows.forEach(row => {
    const cells = row.children;
    if (cells[columnIndex]) {
      cells[columnIndex].classList.add('hidden-column');
    }
  });
}
