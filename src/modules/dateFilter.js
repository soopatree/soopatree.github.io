/**
 * 날짜 필터링 기능을 담당하는 모듈
 */

// 날짜 포맷 헬퍼 함수
export function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 전역 날짜 필터 상태
let globalFilterState = {
  startDate: null,
  endDate: null,
  activeFilter: 'all'
};

/**
 * 날짜가 필터 범위에 포함되는지 확인하는 함수
 * @param {string} dateStr 확인할 날짜 문자열
 * @returns {boolean} 필터 범위에 포함되는지 여부
 */
export function isDateInRange(dateStr) {
  if (!globalFilterState.startDate && !globalFilterState.endDate) {
    return true; // 필터가 없으면 모든 날짜 통과
  }
  
  // 날짜 문자열 파싱
  const dateParts = dateStr.split(' ')[0].split('-');
  if (dateParts.length !== 3) return false;
  
  const year = parseInt(dateParts[0]);
  const month = parseInt(dateParts[1]) - 1; // JavaScript 월은 0부터 시작
  const day = parseInt(dateParts[2]);
  
  const date = new Date(year, month, day);
  
  // 날짜 범위 확인
  if (globalFilterState.startDate && date < globalFilterState.startDate) {
    return false;
  }
  
  if (globalFilterState.endDate) {
    // 종료일 포함을 위해 종료일의 다음날과 비교
    const nextDay = new Date(globalFilterState.endDate);
    nextDay.setDate(nextDay.getDate() + 1);
    if (date >= nextDay) return false;
  }
  
  return true;
}

// 날짜 문자열 파싱 함수
export function parseDate(dateStr) {
  if (!dateStr) return null;
  
  try {
    const datePart = dateStr.split(' ')[0];
    const [year, month, day] = datePart.split('-').map(num => parseInt(num, 10));
    return new Date(year, month - 1, day);
  } catch (error) {
    console.error('날짜 파싱 오류:', error);
    return null;
  }
}

// 한국어 날짜 표시 형식
export function formatKoreanDate(date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}년 ${month}월 ${day}일`;
}

/**
 * 날짜 필터링 초기화 및 이벤트 설정 함수
 * @param {Object} options - 필터링 옵션
 * @param {Function} options.onFilterChange - 필터 변경 시 호출될 콜백
 */
export function initDateFilter(options = {}) {
  // DOM 요소 참조
  const startDateInput = document.getElementById('startDate');
  const endDateInput = document.getElementById('endDate');
  const filterAllBtn = document.getElementById('filterAll');
  const filter1DayBtn = document.getElementById('filter1Day');
  const filter7DaysBtn = document.getElementById('filter7Days');
  const filter30DaysBtn = document.getElementById('filter30Days');
  const filter90DaysBtn = document.getElementById('filter90Days');
  const filter365DaysBtn = document.getElementById('filter365Days');
  const filterCustomRangeBtn = document.getElementById('filterCustomRange');
  const applyFilterBtn = document.getElementById('applyFilter');
  const dateInfoEl = document.getElementById('dateInfo');

  // 날짜 필터 상태 객체
  const filterState = {
    startDate: null,
    endDate: null,
    activeFilter: 'all'
  };

  // 현재 날짜
  const today = new Date();
  
  // 필터 버튼 활성화 함수
  function setActiveFilter(filterId) {
    // 모든 버튼에서 active 클래스 제거
    [filterAllBtn, filter1DayBtn, filter7DaysBtn, filter30DaysBtn, filter90DaysBtn, filter365DaysBtn, filterCustomRangeBtn].forEach(btn => {
      btn.classList.remove('active');
    });
    
    // 선택된 버튼만 active 클래스 추가
    document.getElementById(filterId).classList.add('active');
    filterState.activeFilter = filterId.replace('filter', '').toLowerCase();
    
    // 기간지정 버튼을 누르면 날짜 선택 필드에 포커스
    if (filterId === 'filterCustomRange') {
      startDateInput.focus();
    }
  }

  // 날짜 필터 적용 함수
  function applyDateFilter() {
    let startDate, endDate;
    
    // 액티브 필터에 따라 날짜 범위 설정
    switch (filterState.activeFilter) {
      case 'all':
        startDate = null;
        endDate = null;
        break;
      case '1day':
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        startDate = yesterday;
        endDate = today;
        break;
      case '7days':
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        startDate = weekAgo;
        endDate = today;
        break;
      case '30days':
        const monthAgo = new Date(today);
        monthAgo.setDate(today.getDate() - 30);
        startDate = monthAgo;
        endDate = today;
        break;
      case '90days':
        const threeMonthsAgo = new Date(today);
        threeMonthsAgo.setDate(today.getDate() - 90);
        startDate = threeMonthsAgo;
        endDate = today;
        break;
      case '365days':
        const oneYearAgo = new Date(today);
        oneYearAgo.setDate(today.getDate() - 365);
        startDate = oneYearAgo;
        endDate = today;
        break;
      case 'customrange':
        if (!startDateInput.value && !endDateInput.value) {
          return;
        }
        startDate = startDateInput.value ? new Date(startDateInput.value) : null;
        endDate = endDateInput.value ? new Date(endDateInput.value) : null;
        break;
      default:
        startDate = startDateInput.value ? new Date(startDateInput.value) : null;
        endDate = endDateInput.value ? new Date(endDateInput.value) : null;
    }
    
    // 날짜 입력란 업데이트
    if (startDate) {
      startDateInput.value = formatDate(startDate);
    } else {
      startDateInput.value = '';
    }
    
    if (endDate) {
      endDateInput.value = formatDate(endDate);
    } else {
      endDateInput.value = '';
    }
    
    // 상태 업데이트
    filterState.startDate = startDate;
    filterState.endDate = endDate;
    
    // 전역 필터 상태 업데이트
    globalFilterState.startDate = startDate;
    globalFilterState.endDate = endDate;
    globalFilterState.activeFilter = filterState.activeFilter;
    
    // 날짜 정보 표시
    updateDateInfo();
    
    // 콜백 호출
    if (typeof options.onFilterChange === 'function') {
      options.onFilterChange({
        startDate: filterState.startDate,
        endDate: filterState.endDate,
        activeFilter: filterState.activeFilter
      });
    }
  }
  
  // 날짜 정보 텍스트 업데이트
  function updateDateInfo(filteredCount, totalCount, minDate, maxDate) {
    if (filterState.startDate && filterState.endDate) {
      const startDateStr = formatKoreanDate(filterState.startDate);
      const endDateStr = formatKoreanDate(filterState.endDate);
      
      // 필터링 타입에 따른 메시지
      let filterTypeText = '';
      switch (filterState.activeFilter) {
        case '1day': filterTypeText = '(최근 1일)'; break;
        case '7days': filterTypeText = '(최근 1주일)'; break;
        case '30days': filterTypeText = '(최근 1개월)'; break;
        case '90days': filterTypeText = '(최근 3개월)'; break;
        case '365days': filterTypeText = '(최근 1년)'; break;
        case 'customrange': filterTypeText = '(지정 기간)'; break;
        default: filterTypeText = '';
      }
      
      // 필터링된 개수 표시
      let countText = '';
      if (filteredCount !== undefined && totalCount !== undefined) {
        countText = ` [${filteredCount}/${totalCount} 개]`;
      }
      
      dateInfoEl.textContent = `현재 통계: ${startDateStr} ~ ${endDateStr} ${filterTypeText}${countText}`;
    } else {
      // 전체 기간일 때 최대/최소 날짜 표시
      let dateRangeText = '';
      if (minDate && maxDate) {
        const minDateStr = formatKoreanDate(minDate);
        const maxDateStr = formatKoreanDate(maxDate);
        dateRangeText = ` (${minDateStr} ~ ${maxDateStr})`;
      }
      
      // 필터링된 개수 표시
      let countText = '';
      if (filteredCount !== undefined && totalCount !== undefined) {
        countText = ` [${filteredCount}/${totalCount} 개]`;
      }
      
      dateInfoEl.textContent = `현재 통계: 전체 기간${dateRangeText}${countText}`;
    }
  }
  
  // 이벤트 리스너 등록
  filterAllBtn.addEventListener('click', () => {
    setActiveFilter('filterAll');
    applyDateFilter();
  });
  
  filter1DayBtn.addEventListener('click', () => {
    setActiveFilter('filter1Day');
    applyDateFilter();
  });
  
  filter7DaysBtn.addEventListener('click', () => {
    setActiveFilter('filter7Days');
    applyDateFilter();
  });
  
  filter30DaysBtn.addEventListener('click', () => {
    setActiveFilter('filter30Days');
    applyDateFilter();
  });
  
  filter90DaysBtn.addEventListener('click', () => {
    setActiveFilter('filter90Days');
    applyDateFilter();
  });
  
  filter365DaysBtn.addEventListener('click', () => {
    setActiveFilter('filter365Days');
    applyDateFilter();
  });
  
  filterCustomRangeBtn.addEventListener('click', () => {
    setActiveFilter('filterCustomRange');
  });
  
  applyFilterBtn.addEventListener('click', () => {
    // 직접 입력한 경우
    if (filterState.activeFilter !== 'customrange') {
      filterState.activeFilter = 'custom';
      // 모든 버튼에서 active 클래스 제거
      [filterAllBtn, filter1DayBtn, filter7DaysBtn, filter30DaysBtn, filter90DaysBtn, filter365DaysBtn, filterCustomRangeBtn].forEach(btn => {
        btn.classList.remove('active');
      });
    }
    applyDateFilter();
  });
  
  // 날짜 필드 변경 이벤트 리스너
  startDateInput.addEventListener('change', () => {
    if (!endDateInput.value && startDateInput.value) {
      // 시작일만 설정했을 때 종료일을 현재로 자동 설정
      endDateInput.value = formatDate(today);
    }
  });
  
  // 초기 날짜 정보 표시
  updateDateInfo();
  
  // 인터페이스 반환
  return {
    applyFilter: applyDateFilter,
    isDateInRange,
    getFilterState: () => ({ ...filterState }),
    updateDateInfo,
    resetFilter: () => {
      setActiveFilter('filterAll');
      applyDateFilter();
    }
  };
}