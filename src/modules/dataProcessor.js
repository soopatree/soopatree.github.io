import { extractProbability } from './csvParser';
import { parseDate, formatDate } from './dateFilter';

/**
 * CSV 데이터를 처리하는 함수
 * @param {string} csv - CSV 파일 내용
 * @param {Object} options - 처리 옵션
 * @param {Function} options.isDateInRange - 날짜 필터링 함수
 * @returns {Object} - 처리된 데이터 객체
 */
export function processCSVData(csv, options = {}) {
  console.log('CSV 처리 시작');
  
  // 파일 형식 분석 및 라인 분리
  const lines = csv.split(/\\r?\\n/);
  console.log(`총 ${lines.length}개의 라인 발견`);
  
  // 패턴 정의
  const pattern = /별풍선,"([^"]+)",([^,]+),([^,]+),([^,]*),([^,]*)/g;
  console.log('패턴 매칭 방식으로 데이터 처리 중...');
  
  // 처리 통계 변수
  let totalProcessed = 0; // 실제 처리된 행 수
  let skippedRows = 0;    // 필터링으로 건너뛰 행 수
  let errorRows = 0;      // 오류 발생 행 수
  
  // 총 데이터 개수 초기화 - 만약 이미 처리가 진행된 경우 식별
  let totalRows = 0;
  
  // Process data - group by user ID
  const donorsById = {};
  const rouletteByDonor = {};
  const allRouletteResults = new Set();
  const resultProbabilities = {}; // 각 룰렛 결과별 확률
  
  // 먼저 패턴에 맞는 총 행수 가져오기
  const tmpPattern = new RegExp(pattern.source, pattern.flags);
  let tmpMatch;
  while ((tmpMatch = tmpPattern.exec(csv)) !== null) {
    totalRows++;
  }
  
  console.log(`총 패턴 일치 건수: ${totalRows}`);

  // 모든 매치 처리
  let match;
  let rowCount = 0; // 총 행 수
  while ((match = pattern.exec(csv)) !== null) {
    try {
      rowCount++; // 처리 시도한 행 수 증가
      
      const dateWithDays = match[1].trim();
      // 날짜 정보 추출 및 저장
      const date = parseDate(dateWithDays);
      
      // 날짜 필터링 적용 (옵션으로 제공된 경우)
      if (typeof options.isDateInRange === 'function') {
        // 이 후원이 필터 범위에 포함되는지 확인
        if (!options.isDateInRange(dateWithDays)) {
          skippedRows++;
          if (rowCount <= 5 || rowCount % 50 === 0) {
            console.log(`필터링: 제외됨 - ${dateWithDays}`);
          }
          continue; // 필터 범위에 포함되지 않으면 건너뛔
        }
      }
      
      // 필터링을 통과한 행만 실제 처리됨
      totalProcessed++;
      
      const donorFull = match[2].trim();
      const amountText = match[3].trim();
      const message = match[4].trim();
      const rouletteResult = match[5] ? match[5].trim() : '';
      
      // 주기적 로깅
      if (totalProcessed <= 5 || totalProcessed % 50 === 0) {
        console.log(`처리 #${totalProcessed}:`, { donorFull, amountText, message, rouletteResult });
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
          dates: [],  // 날짜 정보 추가
        };
      }

      // Add nickname and update totals
      donorsById[donorId].nicknames.add(nickname);
      donorsById[donorId].totalAmount += amount;

      // 날짜 정보 추가
      if (date) {
        donorsById[donorId].dates.push({
          date: date,
          amount: amount,
          message: message,
          rouletteResult: rouletteResult
        });
      }

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
      console.error(`처리 #${rowCount}: 데이터 처리 중 오류 발생`, e);
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

  // 통계 정보 로깅
  console.log('CSV 처리 완료:', {
    처리된행수: totalProcessed, // 필터링을 통과한 후 실제 처리된 행 수
    건너뛴행수: skippedRows,  // 필터링으로 제외된 행 수
    오류행수: errorRows,         // 처리 중 오류 발생 행 수
    후원자수: Object.keys(donorsById).length,  // 고유한 후원자 수
    룰렛결과종류: allRouletteResults.size // 룰렛 결과 유형 수
  });
  
  // 각 결과별 확률 로깅
  console.log('룰렛 결과별 확률:', resultProbabilities);

  // 날짜 범위 찾기
  let minDate = null;
  let maxDate = null;
  
  // 날짜 가째오기
  Object.values(donorsById).forEach(donor => {
    if (donor.dates && donor.dates.length > 0) {
      donor.dates.forEach(dateInfo => {
        if (dateInfo.date) {
          if (minDate === null || dateInfo.date < minDate) {
            minDate = dateInfo.date;
          }
          if (maxDate === null || dateInfo.date > maxDate) {
            maxDate = dateInfo.date;
          }
        }
      });
    }
  });

  // 처리된 데이터 반환
  return {
    donations,
    rouletteByDonor,  // 후원자별 룰렛 결과
    donors: rouletteByDonor,  // 이전 코드와의 호환성을 위해 추가
    results: sortedResults,
    donorsById,
    resultProbabilities,
    stats: {
      totalRows,                             // 총 데이터 수
      processedRows: totalProcessed,         // 처리된 데이터 수 (기존 키 유지)
      totalProcessed,                        // 처리된 데이터 수 (일관성을 위해 추가)
      skippedRows,                          // 필터링으로 건너뛰 데이터 수
      minDate,                              // 최소 날짜
      maxDate                               // 최대 날짜
    }
  };
}

/**
 * 후원 순위 데이터에서 CSV 내용 생성
 * @param {Array} donations - 후원 데이터 배열
 * @returns {string} - CSV 형식 문자열
 */
export function generateDonationCSV(donations) {
  if (donations.length === 0) {
    return '';
  }

  // Create CSV header
  let csvContent = "순위,후원자,아이디,닉네임,후원개수\n";

  // Add data rows
  donations.forEach((donation, index) => {
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

  return csvContent;
}

/**
 * 룰렛 통계 데이터에서 CSV 내용 생성
 * @param {Object} processedRoulette - 룰렛 데이터 객체
 * @returns {string} - CSV 형식 문자열
 */
export function generateRouletteCSV(processedRoulette) {
  if (!processedRoulette.results || processedRoulette.results.length === 0) {
    return '';
  }

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

  return csvContent;
}
