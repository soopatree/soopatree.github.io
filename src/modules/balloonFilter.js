/**
 * 풍선 개수 필터링 기능을 담당하는 모듈
 */

// 전역 풍선 필터 상태
let globalFilterState = {
  minBalloons: null,
  maxBalloons: null,
};

/**
 * 풍선 개수가 필터 범위에 포함되는지 확인하는 함수
 * @param {number} amount 풍선 개수
 * @returns {boolean} 필터 범위에 포함되는지 여부
 */
export function isBalloonInRange(amount) {
  if (globalFilterState.minBalloons !== null && amount < globalFilterState.minBalloons) {
    return false;
  }
  if (globalFilterState.maxBalloons !== null && amount > globalFilterState.maxBalloons) {
    return false;
  }
  return true;
}

/**
 * 풍선 필터링 초기화 및 이벤트 설정 함수
 * @param {Object} options - 필터링 옵션
 * @param {Function} options.onFilterChange - 필터 변경 시 호출될 콜백
 */
export function initBalloonFilter(options = {}) {
  const minBalloonsInput = document.getElementById('minBalloons');
  const maxBalloonsInput = document.getElementById('maxBalloons');

  const filterState = {
    minBalloons: null,
    maxBalloons: null,
  };

  function applyBalloonFilter() {
    const minBalloons = minBalloonsInput.value ? parseInt(minBalloonsInput.value, 10) : null;
    const maxBalloons = maxBalloonsInput.value ? parseInt(maxBalloonsInput.value, 10) : null;

    filterState.minBalloons = minBalloons;
    filterState.maxBalloons = maxBalloons;

    globalFilterState.minBalloons = minBalloons;
    globalFilterState.maxBalloons = maxBalloons;

    // if (typeof options.onFilterChange === 'function') {
    //   options.onFilterChange(filterState);
    // }
  }

  // applyFilterBtn.addEventListener('click', applyBalloonFilter);

  return {
    applyFilter: applyBalloonFilter,
    isBalloonInRange,
    getFilterState: () => ({ ...filterState }),
    resetFilter: () => {
      minBalloonsInput.value = '';
      maxBalloonsInput.value = '';
      // applyBalloonFilter(); // 통합 적용 버튼으로 인해 제거
    },
  };
}
