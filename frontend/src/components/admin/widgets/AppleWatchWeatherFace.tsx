import React, { useState, useEffect, useMemo } from 'react';

const WEATHER_API_KEY = '95f1dbef8e3f8588cf54ea22cf595c33';
const CITY = 'Ho Chi Minh City';

/* ───────── Weather Icon Components ───────── */
function SunIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="4.5" fill="#FFD600" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
        <line
          key={angle}
          x1="12" y1="3.5" x2="12" y2="5.5"
          stroke="#FFD600" strokeWidth="2" strokeLinecap="round"
          transform={`rotate(${angle} 12 12)`}
        />
      ))}
    </svg>
  );
}

function MoonIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="#E0E0E0" />
      <circle cx="7" cy="7" r="0.7" fill="#FFF" opacity="0.8" />
      <circle cx="5" cy="13" r="0.5" fill="#FFF" opacity="0.6" />
    </svg>
  );
}

function SmallCloudIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M18 10a5 5 0 0 0-9.66-1.4A3.5 3.5 0 1 0 5 14.5h13a3.5 3.5 0 0 0 0-7z" fill="white" opacity="0.9" />
    </svg>
  );
}

function RainIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M18 10a5 5 0 0 0-9.66-1.4A3.5 3.5 0 1 0 5 14h13a3.5 3.5 0 0 0 0-7z" fill="#B0C4DE" />
      <line x1="9" y1="17" x2="8" y2="20" stroke="#6CB4EE" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="13" y1="17" x2="12" y2="20" stroke="#6CB4EE" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/* Map OpenWeatherMap icon codes to components */
function getWeatherIconComponent(iconCode: string, size: number = 14) {
  const code = iconCode.substring(0, 2);
  const isDay = iconCode.includes('d');
  switch (code) {
    case '01': return isDay ? <SunIcon size={size} /> : <MoonIcon size={size} />;
    case '02': return isDay ? <SunIcon size={size} /> : <MoonIcon size={size} />;
    case '03':
    case '04': return <SmallCloudIcon size={size} />;
    case '09':
    case '10':
    case '11': return <RainIcon size={size} />;
    default: return isDay ? <SunIcon size={size} /> : <MoonIcon size={size} />;
  }
}

/* ───────── Weather Data Interface ───────── */
interface WeatherData {
  temp: number;
  tempMax: number;
  tempMin: number;
  description: string;
  icon: string;
  sunrise: number;
  sunset: number;
  hourlyIcons: Map<number, string>;
}

/* ───────── Main Component ───────── */
export function AppleWatchWeatherFace() {
  const [time, setTime] = useState(new Date());
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function fetchWeather() {
      try {
        const [currentRes, forecastRes] = await Promise.all([
          fetch(`https://api.openweathermap.org/data/2.5/weather?q=${CITY}&appid=${WEATHER_API_KEY}&units=metric&lang=vi`),
          fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${CITY}&appid=${WEATHER_API_KEY}&units=metric&lang=vi`)
        ]);
        const currentData = await currentRes.json();
        const forecastData = await forecastRes.json();
        const hourlyIcons = new Map<number, string>();
        if (forecastData.list) {
          forecastData.list.slice(0, 8).forEach((item: any) => {
            const date = new Date(item.dt * 1000);
            hourlyIcons.set(date.getHours(), item.weather[0].icon);
          });
        }
        setWeather({
          temp: Math.round(currentData.main.temp),
          tempMax: Math.round(currentData.main.temp_max),
          tempMin: Math.round(currentData.main.temp_min),
          description: currentData.weather[0].description,
          icon: currentData.weather[0].icon,
          sunrise: currentData.sys.sunrise,
          sunset: currentData.sys.sunset,
          hourlyIcons,
        });
      } catch (error) {
        console.error('Weather fetch failed:', error);
        setWeather({
          temp: 32, tempMax: 35, tempMin: 26,
          description: 'Nắng', icon: '01d',
          sunrise: 0, sunset: 0,
          hourlyIcons: new Map(),
        });
      }
    }
    fetchWeather();
    const interval = setInterval(fetchWeather, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const currentHour12 = time.getHours() % 12 || 12;
  const isPM = time.getHours() >= 12;
  const timeStr = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;

  function isDayHour(dialHour: number): boolean {
    let h24 = isPM ? (dialHour === 12 ? 12 : dialHour + 12) : (dialHour === 12 ? 0 : dialHour);
    if (h24 >= 24) h24 -= 24;
    return h24 >= 6 && h24 < 18;
  }

  function getHourIcon(dialHour: number, iconSize: number) {
    let h24 = isPM ? (dialHour === 12 ? 12 : dialHour + 12) : (dialHour === 12 ? 0 : dialHour);
    if (h24 >= 24) h24 -= 24;
    if (weather?.hourlyIcons.has(h24)) {
      return getWeatherIconComponent(weather.hourlyIcons.get(h24)!, iconSize);
    }
    return isDayHour(dialHour) ? <SunIcon size={iconSize} /> : <MoonIcon size={iconSize} />;
  }

  /* 
    ASPECT = 180 / 220 ≈ 0.818
  */
  const ASPECT = 180 / 220;
  const CX = 50;  // center X in %
  const CY = 52;  // center Y in % (shifted down slightly)

  const R_NUM = 34.5; // radius for hour numbers (moved closer to fit tight)
  const R_ICON = 27; // radius for weather icons

  const hourPositions = useMemo(() => {
    const result = [];
    for (let i = 1; i <= 12; i++) {
      const angleDeg = i * 30 - 90;
      const angleRad = (angleDeg * Math.PI) / 180;
      result.push({
        hour: i,
        numX: CX + R_NUM * Math.cos(angleRad),
        numY: CY + R_NUM * Math.sin(angleRad) * ASPECT,
        iconX: CX + R_ICON * Math.cos(angleRad),
        iconY: CY + R_ICON * Math.sin(angleRad) * ASPECT,
      });
    }
    return result;
  }, []);

  const weatherDescription = weather
    ? weather.description.charAt(0).toUpperCase() + weather.description.slice(1)
    : '...';

  return (
    <div
      className="w-full h-full relative select-none"
      style={{
        backgroundImage: "url('/images/bgWatch.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        overflow: 'hidden',
      }}
    >
      {/* ── Sky texture overlay ── */}
      <div className="absolute inset-0" style={{
        background: `
          radial-gradient(ellipse at 20% 10%, rgba(255,255,255,0.12) 0%, transparent 55%),
          radial-gradient(ellipse at 80% 90%, rgba(255,255,255,0.06) 0%, transparent 45%)
        `,
      }} />

      {/* ── Background Circles (Outer for numbers, Middle for icons, Inner for temp) ── */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ top: '4%' }}>
        {/* Outer Ring Background (for numbers) */}
        <div
          className="absolute rounded-full"
          style={{
            width: '75%', // tightened to wrap numbers exactly
            aspectRatio: '1',
            background: 'rgba(0, 0, 0, 0.04)', // subtle base circle
          }}
        />
        {/* Middle Ring Background (for icons) */}
        <div
          className="absolute rounded-full"
          style={{
            width: '64%',
            aspectRatio: '1',
            background: 'rgba(0, 0, 0, 0.08)', // slightly darker than sky
          }}
        />
        {/* Inner Circle Background (for temp) */}
        <div
          className="absolute rounded-full"
          style={{
            width: '45%',
            aspectRatio: '1',
            background: 'rgba(255, 255, 255, 0.04)', // Làm sáng lên để tiệp màu với vòng ngoài cùng (vòng số giờ) và trong suốt nhẹ
          }}
        />
      </div>

      {/* ── Top Bar: Menu | Time | Weather Icon ── */}
      <div
        className="absolute z-30 flex justify-between items-center"
        style={{ top: '7%', left: '8%', right: '3%' }}
      >
        {/* Empty spacer to keep time centered after removing menu icon */}
        <div style={{ width: 11 }} />

        {/* Current time */}
        <span className="text-white font-semibold tracking-wide" style={{ fontSize: 20 }}>
          {timeStr}
        </span>

        {/* Current weather icon */}
        <div className="opacity-90">
          {weather ? getWeatherIconComponent(weather.icon, 18) : <SmallCloudIcon size={18} />}
        </div>
      </div>

      {/* ── Hour Dial: 12 positions ── */}
      {hourPositions.map(({ hour, numX, numY, iconX, iconY }) => {
        const isCurrent = hour === currentHour12;

        // Xoay số theo độ cong, lật ngược các số từ 4 đến 8 để dễ đọc
        let rotation = hour * 30;
        if (hour >= 4 && hour <= 8) {
          rotation -= 180;
        }

        return (
          <React.Fragment key={hour}>
            {/* Hour Number (Outer ring) */}
            <div
              className="absolute z-20 flex items-center justify-center"
              style={{
                left: `${numX}%`,
                top: `${numY}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <span
                className="leading-none text-center"
                style={{
                  fontSize: isCurrent ? 10 : 8,
                  fontWeight: isCurrent ? 700 : 600,
                  color: isCurrent ? '#000' : 'rgba(255,255,255,0.95)', // dark text for current hour pill
                  display: 'inline-block',
                  transform: `rotate(${rotation}deg)`,
                  ...(isCurrent ? {
                    background: 'rgba(255, 255, 255, 0.75)', // Màu nhạt lại và trong suốt (chỉnh số 0.75 để thay đổi độ trong suốt)
                    borderRadius: '7px', // <--- CHỈNH ĐỘ BO GÓC CỦA VIÊN THUỐC SỐ GIỜ Ở ĐÂY
                    padding: '0px 7px',
                  } : {}),
                }}
              >
                {hour}
              </span>
            </div>

            {/* Weather Icon (Middle ring) */}
            <div
              className="absolute z-20 flex items-center justify-center"
              style={{
                left: `${iconX}%`,
                top: `${iconY}%`,
                // Dùng hour * 30 thay vì rotation để luôn thuận chiều kim đồng hồ (không bị ảnh hưởng bởi lật số 4->8)
                transform: `translate(-50%, -50%) ${isCurrent ? `rotate(${hour * 30}deg)` : ''}`,
                ...(isCurrent ? {
                  background: 'linear-gradient(to right, transparent 40%, rgba(255, 255, 255, 0.08) 100%)', // Đổi sang 'to right' để hoà nền dọc theo chiều kim đồng hồ
                  borderRadius: '25px',
                  padding: '0.5px 5px',
                  // Bóng lệch X (8px) và Y (0px) để hắt bóng về phía giờ tiếp theo
                  boxShadow: '8px 0px 6px -4px rgba(0, 0, 0, 0.4)',
                } : {
                  width: 18,
                  height: 18,
                }),
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  filter: 'none',
                  // Giữ cho icon luôn đứng thẳng
                  transform: isCurrent ? `rotate(${-(hour * 30)}deg)` : 'none',
                }}
              >
                {getHourIcon(hour, isCurrent ? 15 : 14)}
              </div>
            </div>
          </React.Fragment>
        );
      })}

      {/* ── Center Temperature Display ── */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none"
        style={{ top: '4%' }} // align with CY
      >
        <span className="text-white font-light leading-none" style={{ fontSize: 32 }}>
          {weather ? weather.temp : '--'}°
        </span>
        <span className="text-white/70 font-medium mt-1" style={{ fontSize: 8 }}>
          H:{weather ? weather.tempMax : '--'}° L:{weather ? weather.tempMin : '--'}°
        </span>
      </div>

      {/* ── Bottom Text (Weather Description) ── */}
      <div
        className="absolute w-full text-center"
        style={{ bottom: '6%' }}
      >
        <span className="text-white font-medium tracking-wide" style={{ fontSize: 13, opacity: 0.75 }}>
          {weatherDescription}
        </span>
      </div>
    </div>
  );
}
