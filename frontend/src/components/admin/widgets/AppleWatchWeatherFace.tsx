import React, { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Calendar, MapPin, Sparkles } from 'lucide-react';

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
  const user = useAuthStore((state) => state.user);

  const userDisplayName = user?.fullName || user?.username || 'Admin';
  const userInitial = (userDisplayName[0] || 'A').toUpperCase();

  const currentHour = time.getHours();
  const greeting = useMemo(() => {
    if (currentHour >= 5 && currentHour < 12) {
      return { text: 'Chào buổi sáng', icon: '🌅', sub: 'Chúc bạn một ngày làm việc tràn đầy năng lượng!' };
    } else if (currentHour >= 12 && currentHour < 18) {
      return { text: 'Chào buổi chiều', icon: '☀️', sub: 'Chúc bạn một buổi chiều làm việc hiệu quả!' };
    } else {
      return { text: 'Chào buổi tối', icon: '🌙', sub: 'Chúc bạn một buổi tối thư thái và an lành!' };
    }
  }, [currentHour]);

  const formattedDate = useMemo(() => {
    const str = time.toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    return str.charAt(0).toUpperCase() + str.slice(1);
  }, [time]);

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

  const weatherDescription = weather?.description
    ? weather.description.charAt(0).toUpperCase() + weather.description.slice(1)
    : '...';

  return (
    <div
      className="w-full h-full relative select-none flex items-stretch overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #28D882 0%, #157A54 45%, #0C291E 100%)',
      }}
    >
      {/* ── Radiant Emerald Mesh Overlay ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(circle at 85% 15%, rgba(255,255,255,0.22) 0%, transparent 45%),
            radial-gradient(circle at 15% 85%, rgba(0,0,0,0.5) 0%, transparent 60%)
          `,
        }}
      />

      {/* ── Left Column: Apple Watch Clock Face (Strict aspect-ratio so circle NEVER stretches) ── */}
      <div className="relative h-full aspect-[180/220] shrink-0 select-none">
        {/* Background Circles (Outer for numbers, Middle for icons, Inner for temp) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ top: '4%' }}>
          {/* Outer Ring Background (for numbers) */}
          <div
            className="absolute rounded-full"
            style={{
              width: '75%', // tightened to wrap numbers exactly
              aspectRatio: '1',
              background: 'rgba(0, 0, 0, 0.12)',
            }}
          />
          {/* Middle Ring Background (for icons) */}
          <div
            className="absolute rounded-full"
            style={{
              width: '64%',
              aspectRatio: '1',
              background: 'rgba(0, 0, 0, 0.20)',
            }}
          />
          {/* Inner Circle Background (for temp) */}
          <div
            className="absolute rounded-full"
            style={{
              width: '45%',
              aspectRatio: '1',
              background: 'rgba(255, 255, 255, 0.08)',
            }}
          />
        </div>

        {/* Top Bar: Spacer | Time | Weather Icon */}
        <div
          className="absolute z-30 flex justify-between items-center"
          style={{ top: '7%', left: '8%', right: '8%' }}
        >
          {/* Empty spacer to keep time centered */}
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

        {/* Hour Dial: 12 positions */}
        {hourPositions.map(({ hour, numX, numY, iconX, iconY }) => {
          const isCurrent = hour === currentHour12;

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
                    color: isCurrent ? '#000' : 'rgba(255,255,255,0.95)',
                    display: 'inline-block',
                    transform: `rotate(${rotation}deg)`,
                    ...(isCurrent ? {
                      background: 'rgba(255, 255, 255, 0.75)',
                      borderRadius: '7px',
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
                  transform: `translate(-50%, -50%) ${isCurrent ? `rotate(${hour * 30}deg)` : ''}`,
                  ...(isCurrent ? {
                    background: 'linear-gradient(to right, transparent 40%, rgba(255, 255, 255, 0.08) 100%)',
                    borderRadius: '25px',
                    padding: '0.5px 5px',
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
                    transform: isCurrent ? `rotate(${-(hour * 30)}deg)` : 'none',
                  }}
                >
                  {getHourIcon(hour, isCurrent ? 15 : 14)}
                </div>
              </div>
            </React.Fragment>
          );
        })}

        {/* Center Temperature Display */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none"
          style={{ top: '4%' }}
        >
          <span className="text-white font-light leading-none" style={{ fontSize: 32 }}>
            {weather ? weather.temp : '--'}°
          </span>
          <span className="text-white/70 font-medium mt-1" style={{ fontSize: 8 }}>
            H:{weather ? weather.tempMax : '--'}° L:{weather ? weather.tempMin : '--'}°
          </span>
        </div>

        {/* Bottom Text (Condition) */}
        <div className="absolute bottom-3 left-0 right-0 flex justify-center">
          <span className="text-white font-medium text-[11px] px-3 py-1 bg-black/10 rounded-full backdrop-blur-md">
            {weatherDescription}
          </span>
        </div>
      </div>

      {/* ── Right Column: Welcome User Section (Xin chào người dùng) ── */}
      <div className="flex-1 h-full min-w-0 py-3 pr-3.5 pl-0.5 z-20 flex flex-col justify-center">
        <div className="w-full h-full rounded-[22px] bg-black/25 hover:bg-black/30 transition-colors backdrop-blur-md border border-white/20 p-4 flex flex-col justify-between shadow-xl relative overflow-hidden group">
          {/* Subtle Ambient light glow */}
          <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-white/15 blur-2xl pointer-events-none group-hover:bg-white/25 transition-all duration-500" />

          {/* Top Row: User Avatar + Name + Role Badge */}
          <div className="flex items-start justify-between gap-2.5 relative z-10">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative shrink-0">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={userDisplayName}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-white/40 shadow-md"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#2EE88A] via-[#157A54] to-[#0A1F17] flex items-center justify-center font-bold text-[#06120E] text-sm shadow-md ring-2 ring-white/40">
                    {userInitial}
                  </div>
                )}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#2EE88A] rounded-full ring-2 ring-[#06120E] shadow-sm" />
              </div>

              <div className="min-w-0">
                <span className="text-[11px] font-medium text-white/80 flex items-center gap-1">
                  <span>{greeting.icon}</span>
                  <span>{greeting.text}</span>
                </span>
                <p className="text-white font-bold text-sm leading-tight truncate drop-shadow-sm">
                  {userDisplayName}
                </p>
              </div>
            </div>

            <span className="text-[9px] uppercase font-bold tracking-wider text-[#06120E] bg-[#2EE88A] px-2.5 py-0.5 rounded-full shadow-[0_0_10px_rgba(46,232,138,0.4)] shrink-0">
              {user?.role || 'Admin'}
            </span>
          </div>

          {/* Middle Row: Date & Inspiring Message */}
          <div className="space-y-1 relative z-10 my-1">
            <div className="flex items-center gap-1.5 text-white/90 text-xs font-semibold">
              <Calendar className="w-3.5 h-3.5 text-white/80 shrink-0" />
              <span>{formattedDate}</span>
            </div>
            <p className="text-white/80 text-[11px] leading-relaxed line-clamp-2">
              {greeting.sub}
            </p>
          </div>

          {/* Bottom Row: Location & Status */}
          <div className="flex items-center gap-2 pt-2 border-t border-white/15 relative z-10">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/30 text-[10px] text-white/90 font-medium backdrop-blur-sm border border-white/10">
              <MapPin className="w-3 h-3 text-white/80" />
              <span className="truncate max-w-[90px]">TP. HCM</span>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#2EE88A]/25 text-[10px] text-white font-medium border border-[#2EE88A]/40 backdrop-blur-sm shadow-[0_0_8px_rgba(46,232,138,0.2)]">
              <Sparkles className="w-3 h-3 text-[#2EE88A]" />
              <span>Trực tuyến</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
