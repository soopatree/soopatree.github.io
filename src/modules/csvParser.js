/**
 * CSV 파일을 파싱하는 함수
 * @param {File} file - 업로드된 CSV 파일
 * @param {Function} processCSVData - CSV 데이터 처리 함수
 */
export function parseCSV(file, processCSVData) {
  const reader = new FileReader();

  reader.onload = function (e) {
    try {
      // 파일 내용 가져오기
      let contents = e.target.result;
      
      // BOM(Byte Order Mark) 제거
      if (contents.charCodeAt(0) === 0xFEFF) {
        contents = contents.slice(1);
      }
      
      // 파일에 '별풍선' 문자열이 포함되어 있는지 확인
      if (contents.indexOf('별풍선') === -1) {
        alert("지원되는 CSV 형식이 아닙니다. '별풍선' 항목이 포함된 CSV 파일을 업로드해주세요.");
        return;
      }
      
      // CSV 파싱 메소드 호출
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

  // UTF-8 인코딩으로 파일 읽기
  reader.readAsText(file, "UTF-8");
}

/**
 * 소괄호 안의 확률 정보를 추출하는 함수
 * @param {string} text - 확률 정보가 포함된 텍스트
 * @returns {number} - 추출된 확률 (없으면 0)
 */
export function extractProbability(text) {
  const match = text.match(/\(([0-9.]+)%\)/);
  return match && match[1] ? parseFloat(match[1]) : 0;
}

/**
 * 향상된 CSV 행 파싱 함수 - 큰따옴표로 묶인 필드 내의 쉼표를 올바르게 처리
 * @param {string} line - CSV 행 텍스트
 * @returns {string[]} - 파싱된 필드 배열
 */
export function parseCSVLine(line) {
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
    field = field.trim();
    if (field.startsWith('"') && field.endsWith('"')) {
      field = field.substring(1, field.length - 1);
    }
    return field;
  });
}

/**
 * CSV 내용을 다운로드 가능한 파일로 생성
 * @param {string} csvContent - CSV 내용
 * @param {string} fileName - 생성할 파일 이름
 */
export function downloadCSV(csvContent, fileName) {
  try {
    // BOM 추가하여 UTF-8로 인코딩 (Excel에서 한글 인코딩 문제 해결)
    const csvUTF8 = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvContent], { type: "text/csv;charset=utf-8;" });

    // 다운로드 링크 생성
    const link = document.createElement("a");
    link.href = URL.createObjectURL(csvUTF8);
    link.download = fileName;

    // 다운로드 트리거
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error("CSV 다운로드 중 오류 발생:", err);
    alert("CSV 파일 다운로드 중 오류가 발생했습니다.");
  }
}