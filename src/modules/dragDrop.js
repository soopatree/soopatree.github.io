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
  // Prevent default drag behaviors
  ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
    dropZone.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
  });

  // Highlight drop zone when dragging over it
  ["dragenter", "dragover"].forEach((eventName) => {
    dropZone.addEventListener(eventName, highlight(dropZone), false);
  });

  ["dragleave", "drop"].forEach((eventName) => {
    dropZone.addEventListener(eventName, unhighlight(dropZone), false);
  });

  // Handle dropped files
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

/**
 * 테이블 컬럼 교체 함수
 * @param {HTMLElement} table - 테이블 엘리먼트
 * @param {HTMLElement} fromHeader - 시작 헤더 엘리먼트
 * @param {HTMLElement} toHeader - 목표 헤더 엘리먼트
 */
export function swapColumns(table, fromHeader, toHeader) {
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
