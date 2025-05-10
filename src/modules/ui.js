/**
 * 후원 테이블 UI 업데이트 함수
 * @param {HTMLElement} donationTableBody - 후원 테이블 본문 엘리먼트
 * @param {Array} donations - 후원 데이터 배열
 */
export function updateDonationTable(donationTableBody, donations) {
  donationTableBody.innerHTML = "";
  
  // null 체크
  if (!donations || !Array.isArray(donations) || donations.length === 0) {
    console.log('후원 데이터가 없거나 유효하지 않습니다:', donations);
    return;
  }
  
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
  if (!rouletteGrid) {
    console.error('rouletteGrid 엘리먼트가 유효하지 않습니다');
    return;
  }

  // 객체 구조 분해 할당
  const { 
    results: sortedResults = [], 
    rouletteByDonor = {}, 
    donors: donorsByResult = {}, 
    donorsById = {}, 
    resultProbabilities = {} 
  } = processedRoulette || {};

  // 디버깅 정보 출력
  console.log('룰렛 데이터 디버깅:', {
    '결과 수': sortedResults.length,
    '후원자별 룰렛 데이터 키 수': Object.keys(rouletteByDonor).length,
    '후원자 데이터 키 수': Object.keys(donorsById).length,
    '확률 데이터 키 수': Object.keys(resultProbabilities).length
  });
  
  console.log('후원자 ID들:', Object.keys(donorsById).slice(0, 5), '...');
  console.log('룰렛 데이터 키들:', Object.keys(rouletteByDonor).slice(0, 5), '...');
  
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
    });
  }

  thead.appendChild(headerRow);
  table.appendChild(thead);

  // 테이블 본문 생성
  const tbody = document.createElement("tbody");
  
  // 각 후원자에 대한 룰렛 결과 행 생성
  if (Object.keys(donorsById).length > 0 && Object.keys(rouletteByDonor).length > 0) {
    // 테이블 데이터 생성 - 원본 코드와 다른 접근 방식
    const donorIds = Object.keys(donorsById);
    
    console.log(`테이블 행 추가 시작: ${donorIds.length}명의 후원자`);
    
    donorIds.forEach((donorId, idx) => {
      const donor = donorsById[donorId];
      
      // 이 후원자의 룰렛 데이터가 있는지 확인
      const donorRouletteData = rouletteByDonor[donorId];
      
      // 디버깅을 위한 조건부 로깅
      if (idx < 3 || idx === donorIds.length - 1) {
        console.log(`[${idx+1}/${donorIds.length}] ${donorId}의 룰렛 데이터:`, donorRouletteData);
      }
      
      // 룰렛 데이터가 없으면 건너뛰기
      if (!donorRouletteData) {
        console.log(`[${idx+1}/${donorIds.length}] ${donorId}의 룰렛 데이터가 없습니다`);
        return;
      }
      
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
        
        // donorRouletteData[result]가 undefined일 수 있음
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
    });
    
    console.log('테이블 행 추가 완료');
  } else {
    console.log('표시할 룰렛 데이터가 없습니다:', {
      donorsById: Object.keys(donorsById).length,
      rouletteByDonor: Object.keys(rouletteByDonor).length
    });
  }
  
  table.appendChild(tbody);
  rouletteGrid.appendChild(table);
  
  // 드래그 앤 드롭 기능 활성화
  setupDragDropForHeaders(table, swapColumns, updateRouletteResultsOrder);
  
  console.log('룰렛 그리드 업데이트 완료');
}
