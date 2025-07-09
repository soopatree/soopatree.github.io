import { extractProbability } from './csvParser';
import { parseDate } from './dateFilter';

/**
 * CSV 데이터를 처리하는 함수
 * @param {string} csv - CSV 파일 내용
 * @param {Object} options - 처리 옵션
 * @param {Function} options.isDateInRange - 날짜 필터링 함수
 * @param {Function} options.isBalloonInRange - 풍선 개수 필터링 함수
 * @returns {Object} - 처리된 데이터 객체
 */
export function processCSVData(csv, options = {}) {
  // 파일 형식 분석 및 라인 분리
  const lines = csv.split(/\\r?\\n/);
  
  // 패턴 정의
  const pattern = /별풍선,"([^"]+)",([^,]+),([^,]+),([^,]*),([^,]*)/g;
  
  // 처리 통계 변수
  let finalProcessedCount = 0;
  let skippedRows = 0;
  let errorRows = 0;
  let totalRows = 0;
  
  // 데이터 처리 객체
  const donorsById = {};
  const rouletteByDonor = {};
  const allRouletteResults = new Set();
  const resultProbabilities = {};
  
  // 먼저 패턴에 맞는 총 행수 가져오기
  const tmpPattern = new RegExp(pattern.source, pattern.flags);
  let tmpMatch;
  while ((tmpMatch = tmpPattern.exec(csv)) !== null) {
    totalRows++;
  }

  // 모든 매치 처리
  let match;
  let rowCount = 0;
  while ((match = pattern.exec(csv)) !== null) {
    try {
      rowCount++;
      
      const dateWithDays = match[1].trim();
      const date = parseDate(dateWithDays);
      
      // 날짜 필터링 적용
      if (typeof options.isDateInRange === 'function' && !options.isDateInRange(dateWithDays)) {
        skippedRows++;
        continue;
      }
      
      // 필터링을 통과한 행만 실제 처리됨
      // totalProcessed++; // 이 위치에서 제거
      
      const donorFull = match[2].trim();
      const amountText = match[3].trim();
      const message = match[4].trim();
      const rouletteResult = match[5] ? match[5].trim() : '';
      
      // 후원 개수 추출 (숫자만)
      const amount = parseInt(amountText.replace(/[^0-9]/g, ""), 10) || 0;

      // 풍선 개수 필터링 적용
      if (typeof options.isBalloonInRange === 'function' && !options.isBalloonInRange(amount)) {
        skippedRows++;
        continue;
      }
      
      // 모든 필터를 통과한 경우에만 finalProcessedCount 증가
      finalProcessedCount++; // 이 위치로 이동
      
      // ID 추출 (괄호 안의 문자)
      const idMatch = donorFull.match(/\(([^)]+)\)/);
      const donorId = idMatch ? idMatch[1] : donorFull.replace(/\s+/g, '_');
      
      // 닉네임 추출 (괄호를 포함한 부분만 지우기)
      let nickname = donorFull;
      if (idMatch) {
        nickname = donorFull.split('(')[0].trim();
      }

      // 후원자 데이터 초기화
      if (!donorsById[donorId]) {
        donorsById[donorId] = {
          id: donorId,
          nicknames: new Set(),
          totalAmount: 0,
          messages: [],
          dates: [],
        };
      }

      // 닉네임과 총액 업데이트
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

      // 룰렛 결과 처리
      if (rouletteResult && rouletteResult.trim()) {
        // 룰렛 결과 정규화
        const normalizedRoulette = rouletteResult.trim();
        
        if (!rouletteByDonor[donorId]) {
          rouletteByDonor[donorId] = {};
        }

        if (!rouletteByDonor[donorId][normalizedRoulette]) {
          rouletteByDonor[donorId][normalizedRoulette] = 0;
        }

        rouletteByDonor[donorId][normalizedRoulette]++;
        allRouletteResults.add(normalizedRoulette);
        
        // 확률 정보 추출
        const probability = extractProbability(normalizedRoulette);
        if (probability > 0 && !resultProbabilities[normalizedRoulette]) {
          resultProbabilities[normalizedRoulette] = probability;
        }
      }
    } catch (e) {
      console.error(`데이터 처리 중 오류:`, e);
      errorRows++;
      continue;
    }
  }

  // 배열로 변환하고 총액 기준으로 정렬
  const donations = Object.values(donorsById);
  donations.sort((a, b) => b.totalAmount - a.totalAmount);

  // 결과를 확률 기준으로 내림차순 정렬
  const rouletteResultsWithProbabilities = Array.from(allRouletteResults).map(result => ({
    result: result,
    probability: resultProbabilities[result] || 0
  }));
  
  rouletteResultsWithProbabilities.sort((a, b) => b.probability - a.probability);
  const sortedResults = rouletteResultsWithProbabilities.map(item => item.result);

  // 날짜 범위 찾기
  let minDate = null;
  let maxDate = null;
  
  // 각 후원자의 날짜 정보에서 최소/최대 날짜 찾기
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
    rouletteByDonor,
    donors: rouletteByDonor,  // 이전 코드와의 호환성을 위해 추가
    results: sortedResults,
    donorsById,
    resultProbabilities,
    stats: {
      totalRows,
      processedRows: finalProcessedCount,
      totalProcessed: finalProcessedCount,
      skippedRows,
      minDate,
      maxDate
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

  // CSV 헤더 생성
  let csvContent = "순위,후원자,아이디,닉네임,후원개수\n";

  // 데이터 행 추가
  donations.forEach((donation, index) => {
    const rank = index + 1;
    const id = donation.id;
    const nicknamesArray = Array.from(donation.nicknames);
    const primaryNickname = nicknamesArray[0];
    const amount = donation.totalAmount;

    // 후원자 전체 이름 형식화
    const donorFull = primaryNickname + "(" + id + ")";

    // CSV 내용에 행 추가
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

  // 헤더 행 생성
  let header = "후원자,아이디,닉네임";
  processedRoulette.results.forEach((result) => {
    header += `,${result.replace(/,/g, ";")}`;  // 쉼표를 세미콜론으로 대체
  });
  let csvContent = header + "\n";

  // 각 후원자에 대한 데이터 추가
  Object.keys(processedRoulette.donors).forEach((userId) => {
    const donor = processedRoulette.donorsById[userId];
    if (!donor) return;

    const nicknamesArray = Array.from(donor.nicknames);
    const primaryNickname = nicknamesArray[0];
    const donorFull = primaryNickname + "(" + userId + ")";

    // 행 시작 부분 구성
    let row = `"${donorFull.replace(/"/g, '""')}","${userId}","${primaryNickname.replace(/"/g, '""')}"`;

    // 현재 순서대로 각 룰렛 결과 카운트 추가
    processedRoulette.results.forEach((result) => {
      const count = processedRoulette.donors[userId][result] || 0;
      // 카운트가 0인 경우 셀을 비워둠
      row += count > 0 ? `,${count}` : `,`;
    });

    // CSV 내용에 행 추가
    csvContent += row + "\n";
  });

  return csvContent;
}