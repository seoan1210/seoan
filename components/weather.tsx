'use client';

import cx from 'classnames';
import { format, isWithinInterval } from 'date-fns';
import { useEffect, useState } from 'react';

// WeatherAtLocation 인터페이스는 그대로 유지

// SAMPLE 데이터는 초기값으로 사용하고, 실제 데이터가 로드되면 대체될 거야!
const SAMPLE = {
  latitude: 37.763283,
  longitude: -122.41286,
  generationtime_ms: 0.027894973754882812,
  utc_offset_seconds: 0,
  timezone: 'GMT',
  timezone_abbreviation: 'GMT',
  elevation: 18,
  current_units: { time: 'iso8601', interval: 'seconds', temperature_2m: '°C' },
  current: { time: '2024-10-07T19:30', interval: 900, temperature_2m: 29.3 },
  hourly_units: { time: 'iso8601', temperature_2m: '°C' },
  hourly: {
    time: [
      '2024-10-07T00:00', '2024-10-07T01:00', '2024-10-07T02:00', '2024-10-07T03:00',
      '2024-10-07T04:00', '2024-10-07T05:00', '2024-10-07T06:00', '2024-10-07T07:00',
      '2024-10-07T08:00', '2024-10-07T09:00', '2024-10-07T10:00', '2024-10-07T11:00',
      '2024-10-07T12:00', '2024-10-07T13:00', '2024-10-07T14:00', '2024-10-07T15:00',
      '2024-10-07T16:00', '2024-10-07T17:00', '2024-10-07T18:00', '2024-10-07T19:00',
      '2024-10-07T20:00', '2024-10-07T21:00', '2024-10-07T22:00', '2024-10-07T23:00',
      '2024-10-08T00:00', '2024-10-08T01:00', '2024-10-08T02:00', '2024-10-08T03:00',
      '2024-10-08T04:00', '2024-10-08T05:00', '2024-10-08T06:00', '2024-10-08T07:00',
      '2024-10-08T08:00', '2024-10-08T09:00', '2024-10-08T10:00', '2024-10-08T11:00',
      '2024-10-08T12:00', '2024-10-08T13:00', '2024-10-08T14:00', '2024-10-08T15:00',
      '2024-10-08T16:00', '2024-10-08T17:00', '2024-10-08T18:00', '2024-10-08T19:00',
      '2024-10-08T20:00', '2024-10-08T21:00', '2024-10-08T22:00', '2024-10-08T23:00',
      '2024-10-09T00:00', '2024-10-09T01:00', '2024-10-09T02:00', '2024-10-09T03:00',
      '2024-10-09T04:00', '2024-10-09T05:00', '2024-10-09T06:00', '2024-10-09T07:00',
      '2024-10-09T08:00', '2024-10-09T09:00', '2024-10-09T10:00', '2024-10-09T11:00',
      '2024-10-09T12:00', '2024-10-09T13:00', '2024-10-09T14:00', '2024-10-09T15:00',
      '2024-10-09T16:00', '2024-10-09T17:00', '2024-10-09T18:00', '2024-10-09T19:00',
      '2024-10-09T20:00', '2024-10-09T21:00', '2024-10-09T22:00', '2024-10-09T23:00',
      '2024-10-10T00:00', '2024-10-10T01:00', '2024-10-10T02:00', '2024-10-10T03:00',
      '2024-10-10T04:00', '2024-10-10T05:00', '2024-10-10T06:00', '2024-10-10T07:00',
      '2024-10-10T08:00', '2024-10-10T09:00', '2024-10-10T10:00', '2024-10-10T11:00',
      '2024-10-10T12:00', '2024-10-10T13:00', '2024-10-10T14:00', '2024-10-10T15:00',
      '2024-10-10T16:00', '2024-10-10T17:00', '2024-10-10T18:00', '2024-10-10T19:00',
      '2024-10-10T20:00', '2024-10-10T21:00', '2024-10-10T22:00', '2024-10-10T23:00',
      '2024-10-11T00:00', '2024-10-11T01:00', '2024-10-11T02:00', '2024-10-11T03:00',
    ],
    temperature_2m: [
      36.6, 32.8, 29.5, 28.6, 29.2, 28.2, 27.5, 26.6, 26.5, 26, 25, 23.5, 23.9,
      24.2, 22.9, 21, 24, 28.1, 31.4, 33.9, 32.1, 28.9, 26.9, 25.2, 23, 21.1,
      19.6, 18.6, 17.7, 16.8, 16.2, 15.5, 14.9, 14.4, 14.2, 13.7, 13.3, 12.9,
      12.5, 13.5, 15.8, 17.7, 19.6, 21, 21.9, 22.3, 22, 20.7, 18.9, 17.9, 17.3,
      17, 16.7, 16.2, 15.6, 15.2, 15, 15, 15.1, 14.8, 14.8, 14.9, 14.7, 14.8,
      15.3, 16.2, 17.9, 19.6, 20.5, 21.6, 21, 20.7, 19.3, 18.7, 18.4, 17.9,
      17.3, 17, 17, 16.8, 16.4, 16.2, 16, 15.8, 15.7, 15.4, 15.4, 16.1, 16.7,
      17, 18.6, 19, 19.5, 19.4, 18.5, 17.9, 17.5, 16.7, 16.3, 16.1,
    ],
  },
  daily_units: {
    time: 'iso8601',
    sunrise: 'iso8601',
    sunset: 'iso8601',
  },
  daily: {
    time: [
      '2024-10-07',
      '2024-10-08',
      '2024-10-09',
      '2024-10-10',
      '2024-10-11',
    ],
    sunrise: [
      '2024-10-07T07:15',
      '2024-10-08T07:16',
      '2024-10-09T07:17',
      '2024-10-10T07:18',
      '2024-10-11T07:19',
    ],
    sunset: [
      '2024-10-07T19:00',
      '2024-10-08T18:58',
      '2024-10-09T18:57',
      '2024-10-10T18:55',
      '2024-10-11T18:54',
    ],
  },
};

function n(num: number): number {
  return Math.ceil(num);
}

export function Weather() { // weatherAtLocation prop 제거
  const [weatherAtLocation, setWeatherAtLocation] = useState<WeatherAtLocation | null>(null); // null로 초기화
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // 모바일 상태 감지 로직
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    // ✨ ✨ ✨ 위치 정보 가져오기 및 날씨 데이터 로드 로직 추가! ✨ ✨ ✨
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            
            // Open-Meteo API 호출 (무료이고 키가 필요 없어서 사용하기 편해!)
            const response = await fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&hourly=temperature_2m&daily=sunrise,sunset&timezone=auto&forecast_days=5`
            );
            
            if (!response.ok) {
              throw new Error('Failed to fetch weather data'); // 내부 오류 처리
            }
            
            const data: WeatherAtLocation = await response.json();
            setWeatherAtLocation(data);
          } catch (err) {
            console.error('날씨 API 호출 중 오류 발생:', err);
            setError('날씨 정보를 불러오는 중 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주시기 바랍니다.');
          } finally {
            setLoading(false);
          }
        },
        (err) => {
          console.error('위치 정보 접근 중 오류 발생:', err);
          setError('위치 정보를 가져오는 데 실패했습니다. 정확한 날씨 정보를 위해 브라우저의 위치 접근 권한을 허용해 주시면 감사하겠습니다.');
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 } // 옵션 추가: 정확도 높이고 타임아웃 설정
      );
    } else {
      setError('현재 사용하시는 브라우저에서는 위치 정보 기능을 지원하지 않습니다. 다른 브라우저를 이용해 주시거나, 수동으로 지역을 입력해 주시기 바랍니다.');
      setLoading(false);
    }
    // ✨ ✨ ✨ 로직 추가 끝! ✨ ✨ ✨

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 로딩 중이거나 에러가 발생했을 때 UI
  if (loading) {
    return <div className="flex flex-col gap-4 rounded-2xl p-4 skeleton-bg max-w-[500px]">현재 위치의 날씨 정보를 확인하고 있습니다. 잠시만 기다려 주십시오.</div>;
  }
  
  if (error || !weatherAtLocation) { // weatherAtLocation이 null이면 에러 처리
    return (
      <div className="flex flex-col gap-4 rounded-2xl p-4 skeleton-bg max-w-[500px] text-blue-50">
        <p className="text-xl font-bold">⚠️ 오류 발생 ⚠️</p>
        <p>{error || '날씨 정보를 불러올 수 없습니다.'}</p>
        <p className="text-sm">오류가 지속되거나 추가 문의사항이 있으시면 언제든지 알려주시기 바랍니다.</p>
      </div>
    );
  }

  // 이제 weatherAtLocation은 확실히 WeatherAtLocation 타입이므로 타입 단언
  const currentWeather = weatherAtLocation as WeatherAtLocation; 

  const currentHigh = Math.max(
    ...currentWeather.hourly.temperature_2m.slice(0, 24),
  );
  const currentLow = Math.min(
    ...currentWeather.hourly.temperature_2m.slice(0, 24),
  );

  const isDay = isWithinInterval(new Date(currentWeather.current.time), {
    start: new Date(currentWeather.daily.sunrise[0]),
    end: new Date(currentWeather.daily.sunset[0]),
  });

  const hoursToShow = isMobile ? 5 : 6;

  // Find the index of the current time or the next closest time
  const currentTimeIndex = currentWeather.hourly.time.findIndex(
    (time) => new Date(time) >= new Date(currentWeather.current.time),
  );

  // Slice the arrays to get the desired number of items
  const displayTimes = currentWeather.hourly.time.slice(
    currentTimeIndex,
    currentTimeIndex + hoursToShow,
  );
  const displayTemperatures = currentWeather.hourly.temperature_2m.slice(
    currentTimeIndex,
    currentTimeIndex + hoursToShow,
  );

  return (
    <div
      className={cx(
        'flex flex-col gap-4 rounded-2xl p-4 skeleton-bg max-w-[500px]',
        {
          'bg-blue-400': isDay,
        },
        {
          'bg-indigo-900': !isDay,
        },
      )}
    >
      <div className="flex flex-row justify-between items-center">
        <div className="flex flex-row gap-2 items-center">
          <div
            className={cx(
              'size-10 rounded-full skeleton-div',
              {
                'bg-yellow-300': isDay,
              },
              {
                'bg-indigo-100': !isDay,
              },
            )}
          />
          <div className="text-4xl font-medium text-blue-50">
            {n(currentWeather.current.temperature_2m)}
            {currentWeather.current_units.temperature_2m}
          </div>
        </div>

        <div className="text-blue-50">{`H:${n(currentHigh)}° L:${n(currentLow)}°`}</div>
      </div>

      <div className="flex flex-row justify-between">
        {displayTimes.map((time, index) => (
          <div key={time} className="flex flex-col items-center gap-1">
            <div className="text-blue-100 text-xs">
              {format(new Date(time), 'ha')}
            </div>
            <div
              className={cx(
                'size-6 rounded-full skeleton-div',
                {
                  'bg-yellow-300': isDay,
                },
                {
                  'bg-indigo-200': !isDay,
                },
              )}
            />
            <div className="text-blue-50 text-sm">
              {n(displayTemperatures[index])}
              {currentWeather.hourly_units.temperature_2m}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}