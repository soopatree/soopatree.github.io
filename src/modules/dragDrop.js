// 드래그 앤 드롭 관련 함수들

/**
 * 기본 드래그 이벤트 동작을 막는 함수
 * @param {Event} e - 이벤트 객체
 */
export function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

/**
 * 드롭존 하이라이트 처리 함수
 * @param {HTMLElement} dropZone - 드롭존 엘리먼트
 */
export function highlight(dropZone) {
  return function() {
    dropZone.classList.add("highlight");
  };
}

/**
 * 드롭존 하이라이트 제거 함수
 * @param {HTMLElement} dropZone - 드롭존 엘리먼트
 */
export function unhighlight(dropZone) {
  return function() {
    dropZone.classList.remove("highlight");
  };
}

/**
 * 드래그 앤 드롭 이벤트 설정 함수
 * @param {HTMLElement} dropZone - 드롭존 엘리먼트
 * @param {Function} handleDrop - 파일 드롭 처리 함수
 */
export function setupDragAndDrop(dropZone, handleDrop) {
  // 기본 드래그 동작 방지
  ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
    dropZone.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
  });

  // 드롭존에 드래그 시 하이라이트
  ["dragenter", "dragover"].forEach((eventName) => {
    dropZone.addEventListener(eventName, highlight(dropZone), false);
  });

  ["dragleave", "drop"].forEach((eventName) => {
    dropZone.addEventListener(eventName, unhighlight(dropZone), false);
  });

  // 파일 드롭 처리
  dropZone.addEventListener("drop", handleDrop, false);
}

/**
 * 테이블 헤더 드래그 앤 드롭 설정 함수
 * @param {HTMLElement} table - 테이블 엘리먼트
 * @param {Function} swapColumns - 컬럼 교체 함수
 * @param {Function} updateRouletteResultsOrder - 결과 순서 업데이트 함수
 */
export function setupDragDropForHeaders(table, swapColumns, updateRouletteResultsOrder) {
  const headers = table.querySelectorAll("th.draggable-header");
  let draggedHeader = null;

  headers.forEach((header) => {
    // 드래그 시작 이벤트
    header.addEventListener("dragstart", function (e) {
      draggedHeader = this;
      this.classList.add("dragging");

      // 드래그 작업을 위한 데이터 설정
      e.dataTransfer.setData("text/plain", this.textContent);
      e.dataTransfer.effectAllowed = "move";

      // 커스텀 드래그 이미지 생성
      const dragImage = this.cloneNode(true);
      dragImage.style.display = "inline-block";
      dragImage.style.opacity = "0.7";
      document.body.appendChild(dragImage);
      e.dataTransfer.setDragImage(dragImage, 0, 0);

      // 드래그 이미지 제거
      setTimeout(() => {
        document.body.removeChild(dragImage);
      }, 0);
    });

    // 드래그 종료 이벤트
    header.addEventListener("dragend", function () {
      this.classList.remove("dragging");
      draggedHeader = null;
    });

    // 드래그 오버 이벤트
    header.addEventListener("dragover", function (e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      this.classList.add("drag-over");
    });

    // 드래그 리브 이벤트
    header.addEventListener("dragleave", function () {
      this.classList.remove("drag-over");
    });

    // 드롭 이벤트
    header.addEventListener("drop", function (e) {
      e.preventDefault();
      this.classList.remove("drag-over");

      if (draggedHeader && draggedHeader !== this) {
        // 컬럼 교체
        swapColumns(table, draggedHeader, this);

        // 다운로드 순서 업데이트
        updateRouletteResultsOrder();
      }
    });
  });
}

/**
 * 테이블 컬럼 교체 함수
 * @param {HTMLElement} table - 테이블 엘리먼트
 * @param {HTMLElement} fromHeader - 시작 헤더 엘리먼트
 * @param {HTMLElement} toHeader - 목표 헤더 엘리먼트
 */
export function swapColumns(table, fromHeader, toHeader) {
  const fromIndex = parseInt(fromHeader.getAttribute("data-index"));
  const toIndex = parseInt(toHeader.getAttribute("data-index"));

  // data-index 속성 업데이트
  fromHeader.setAttribute("data-index", toIndex);
  toHeader.setAttribute("data-index", fromIndex);

  // 모든 행 가져오기 (헤더 행 포함)
  const rows = table.querySelectorAll("tr");

  // 각 행에서 지정된 인덱스의 셀 교체
  rows.forEach((row) => {
    const cells = row.querySelectorAll("th, td");

    // 셀이 충분하지 않으면 건너뛰기
    if (cells.length <= Math.max(fromIndex, toIndex)) return;

    // 셀 교체
    const fromCell = cells[fromIndex];
    const toCell = cells[toIndex];

    // 임시 마커 생성
    const temp = document.createElement("div");
    row.insertBefore(temp, fromCell);

    // 셀 이동
    row.insertBefore(fromCell, toCell);
    row.insertBefore(toCell, temp);

    // 임시 마커 제거
    row.removeChild(temp);
  });
}