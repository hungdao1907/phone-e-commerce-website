import React, { useState, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(useGSAP, ScrollTrigger);

const IconPhoto = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="m12.7949 11.204c0 1.4036-1.0092 2.5032-2.2974 2.5032-1.2638 0-2.2919-1.1201-2.2924-2.4972-.0029-.6798.2525-1.3123.7191-1.7809.4296-.4314.9883-.6691 1.5734-.6691 1.2668 0 2.2974 1.0964 2.2974 2.444zm5.2051-1.704v6c0 1.3807-1.1193 2.5-2.5 2.5h-10c-1.3807 0-2.5-1.1193-2.5-2.5v-6c0-1.3807 1.1193-2.5 2.5-2.5h10c1.3807 0 2.5 1.1193 2.5 2.5zm-1 0c0-.8271-.6729-1.5-1.5-1.5h-10c-.8271 0-1.5.6729-1.5 1.5v6c0 .8271.6729 1.5 1.5 1.5h.5123c.6129-1.5259 2.363-2.6667 4.4272-2.6667 2.062 0 3.8119 1.1408 4.4279 2.6667h.6326c.8271 0 1.5-.6729 1.5-1.5zm-11.3272 9.9927c-.2661-.2158-.6729-.0338-.6728.301l.0002 1.0062h-1.2064c-1.4199 0-2.5771-1.1553-2.5801-2.5742l-.0044-2.168c-.0005-.2754-.2241-.499-.5-.499-.2778.0283-.5005.2236-.5.501l.0044 2.168c.0039 1.9697 1.6099 3.5723 3.5801 3.5723h1.2065v.8195c.0002.3347.4069.5166.6729.3008l1.7417-1.4126c.1939-.1572.1939-.4446 0-.6018l-1.7421-1.413zm15.1137-12.7202c-.0044-1.9697-1.6104-3.5723-3.5801-3.5723h-1.2068v-.8195c-.0002-.3347-.4069-.5165-.6729-.3008l-1.7417 1.4126c-.1939.1573-.1939.4446 0 .6019l1.7421 1.413c.2661.2158.6729.0338.6728-.301l-.0002-1.0061h1.2066c1.4194 0 2.5767 1.1553 2.5801 2.5742l.0044 2.168c.0005.2754.2241.499.5.499h.001c.2764-.001.4995-.2246.499-.501l-.0044-2.168z" />
  </svg>
);

const IconDual = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="m2.5 17h5.5v1h-5.5c-1.3807 0-2.5-1.1193-2.5-2.5v-9c0-1.3807 1.1193-2.5 2.5-2.5h13c1.3807 0 2.5 1.1193 2.5 2.5v3.5h-1v-3.5c0-.8271-.6729-1.5-1.5-1.5h-13c-.8271 0-1.5.6729-1.5 1.5v9c0 .8271.6729 1.5 1.5 1.5zm19.5-3.75v5.5c0 1.2426-1.0073 2.25-2.25 2.25h-8.5c-1.2426 0-2.25-1.0074-2.25-2.25v-5.5c0-1.2427 1.0074-2.25 2.25-2.25h8.5c1.2427 0 2.25 1.0073 2.25 2.25zm-1 0c0-.6893-.5607-1.25-1.25-1.25h-8.5c-.6893 0-1.25.5607-1.25 1.25v5.5c0 .6893.5607 1.25 1.25 1.25h.3428c.679-1.2318 2.1647-2.1205 3.9062-2.1205 1.7396 0 3.2249.8887 3.9061 2.1205h.3449c.6893 0 1.25-.5607 1.25-1.25zm-5.4474-.5455c-.5406 0-1.0569.2206-1.4539.6212-.4312.4351-.6672 1.0224-.6646 1.6536.0005 1.2787.9506 2.3187 2.1185 2.3187 1.1904 0 2.123-1.021 2.123-2.3243 0-1.2513-.9524-2.2693-2.123-2.2693z" />
  </svg>
);

const IconStable = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="m12.0771 15.1194.306.1718-1.1111 2.8756a2.1908 2.1908 0 0 1 -.1853.3711 2.3719 2.3719 0 0 1 -.2464.2762l-2.7968 2.3711a.9677.9677 0 0 1 -.6687.3194.8873.8873 0 0 1 -.5826-.1985.8783.8783 0 0 1 -.29-.6044.8913.8913 0 0 1 .3062-.7079l2.9008-2.4918.9722-3.438c.0237.03.0381.0671.0635.0962a3.0662 3.0662 0 0 0 .7463.6191c.1975.1184.3938.2322.5859.3401zm8.5852-5.0068a.7827.7827 0 0 0 -1.1133-.3452l-.8835.479-1.0835.4792-.7466-1.0317-.7465-1.0315a4.2157 4.2157 0 0 0 -.3055-.3723 3.1371 3.1371 0 0 0 -1.0583-.7671 3.2285 3.2285 0 0 0 -.804-.2108c-.0918-.0136-.1948-.016-.2922-.024-.1348-.0108-.2583-.0331-.4038-.0331q-.2252 0-.4683.0174l-3.03.2158a.9276.9276 0 0 0 -.8816.8461l-.4052 3.0731a.7744.7744 0 1 0 1.5286.19l.3714-2.512 1.2176-.0865a.388.388 0 0 1 .44.5008l-.7078 2.4687c-.4175 1.1328.36 1.8568 1.2776 2.2791l3.3066 1.8559-2.0325 1.73c-.991.749.0264 2.2059 1.0966 1.2l2.8778-2.438a.91.91 0 0 0 -.1462-1.4071l-3.2381-2.1234.6387-2.2359a.35.35 0 0 1 .647-.0863l.95 1.39a.7964.7964 0 0 0 1.0015.2764l2.5361-1.2173a.7717.7717 0 0 0 .4574-1.0793zm-6.1084-3.9911a1.8837 1.8837 0 0 0 1.8876 0 1.9249 1.9249 0 0 0 .68-.68 1.8837 1.8837 0 0 0 0-1.8876 1.9422 1.9422 0 0 0 -.68-.6755 1.8837 1.8837 0 0 0 -1.8876 0 1.96 1.96 0 0 0 -.6752.6755 1.8824 1.8824 0 0 0 0 1.8876 1.9419 1.9419 0 0 0 .6752.68zm-11.7539.8785h4.4a.5023.5023 0 1 0 0-1h-4.4a.5023.5023 0 1 0 0 1zm2.4 11h-4.4a.5023.5023 0 1 0 0 1h4.4a.5023.5023 0 1 0 0-1zm-4.4083-7h5.4166a.5016.5016 0 1 0 0-1h-5.4166a.5016.5016 0 1 0 0 1zm6.9583 3.5a.5265.5265 0 0 0 -.55-.5h-4.4a.5023.5023 0 1 0 0 1h4.4a.5265.5265 0 0 0 .55-.5z" />
  </svg>
);

const IconCall = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
    <path d="m.5 9.5c-.2764 0-.5-.2236-.5-.5v-2.5c0-1.3789 1.1216-2.5 2.5-2.5h2.5c.2764 0 .5.2236.5.5s-.2236.5-.5.5h-2.5c-.8271 0-1.5.6729-1.5 1.5v2.5c0 .2764-.2236.5-.5.5zm16.5 9v-2.5c0-.2764-.2236-.5-.5-.5s-.5.2236-.5.5v2.5c0 .8271-.6729 1.5-1.5 1.5h-2.5c-.2764 0-.5.2236-.5.5s.2236.5.5.5h2.5c1.3784 0 2.5-1.1211 2.5-2.5zm-11.5 2c0-.2764-.2236-.5-.5-.5h-2.5c-.8271 0-1.5-.6729-1.5-1.5v-2.5c0-.2764-.2236-.5-.5-.5s-.5.2236-.5.5v2.5c0 1.3789 1.1216 2.5 2.5 2.5h2.5c.2764 0 .5-.2236.5-.5zm11.5-11.5v-2.5c0-1.3789-1.1216-2.5-2.5-2.5h-2.5c-.2764 0-.5.2236-.5.5s.2236.5.5.5h2.5c.8271 0 1.5.6729 1.5 1.5v2.5c0 .2764.2236.5.5.5s.5-.2236.5-.5zm-13.0323 9h9.0647c.1624 0 .2816-.0476.3554-.1437.0748-.0956.1122-.2228.1122-.3815 0-.2708-.1004-.6263-.3023-1.0658-.2008-.439-.5061-.8821-.9156-1.3281s-.9274-.821-1.5546-1.1249-1.3695-.4561-2.227-.4561c-.8516 0-1.591.1522-2.2182.4561-.6262.3039-1.146.6788-1.5585 1.1249s-.7197.8891-.9215 1.3281c-.2018.4395-.3023.795-.3023 1.0658 0 .1587.0374.2858.1122.3815.0748.0961.193.1437.3554.1437zm4.5279-5.75c.4625 0 .8836-.1213 1.2621-.3638s.68-.5726.9043-.9913c.2253-.4187.338-.8937.338-1.4246 0-.4916-.1127-.945-.338-1.3602-.2244-.4151-.5258-.7457-.9043-.9913s-.7996-.3688-1.2621-.3688c-.4635 0-.8846.1233-1.2621.3688-.3785.2456-.679.5762-.9004.9913-.2224.4151-.3331.8685-.3331 1.3602 0 .5309.1107 1.0044.3331 1.4195.2214.4151.5218.7457.9004.9913.3775.2456.7986.3688 1.2621.3688z" />
  </svg>
);

/* ─────────── DATA ─────────── */
const TABS = [
  {
    id: 'photo',
    label: 'Center Stage\ncho ảnh',
    icon: IconPhoto,
    type: 'video',
    src: '/videos/centerspace.mp4',
    description: 'Cảm biến vuông hoàn toàn mới hỗ trợ các tùy chọn thu phóng và xoay, mang lại thêm nhiều cách linh hoạt để chụp selfie và quay video. Và tự động thu hết hình ảnh mọi người vào khung hình khi chụp nhóm.',
  },
  {
    id: 'dual',
    label: 'Video\nGhi Hình Kép',
    icon: IconDual,
    type: 'video',
    src: '/videos/videokep.mp4',
    description: 'Chế độ quay video kép cho phép bạn ghi hình đồng thời bằng camera trước và sau, lưu giữ trọn vẹn cả sự kiện lẫn cảm xúc của người quay.',
  },
  {
    id: 'stable',
    label: 'Quay video\ncực ổn định',
    icon: IconStable,
    type: 'video',
    src: '/videos/videoondinh.mp4',
    description: 'Quay video siêu ổn định ngay cả khi đang di chuyển mạnh nhờ thuật toán chống rung quang học tiên tiến thế hệ mới mang lại.',
  },
  {
    id: 'call',
    label: 'Center Stage\ncho cuộc gọi',
    icon: IconCall,
    type: 'image',
    src: '/images/centestage.jpg',
    description: 'Công nghệ theo dõi khuôn mặt tự động canh chỉnh bạn và những người xung quanh luôn ở vị trí trung tâm trong các cuộc gọi FaceTime sắc nét.',
  }
];

export function FrontCameraSection() {
  const [activeTab, setActiveTab] = useState(0);
  const containerRef = useRef<HTMLElement>(null);
  
  useGSAP(() => {
    // Fade in text
    gsap.from('.fc-text-anim', {
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 75%',
      },
      y: 40,
      opacity: 0,
      duration: 1,
      stagger: 0.2,
      ease: 'power3.out',
    });
    
    // Fade up frame
    gsap.from('.fc-frame-anim', {
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 60%',
      },
      y: 60,
      opacity: 0,
      duration: 1.2,
      stagger: 0.2,
      ease: 'power3.out',
    });
  }, { scope: containerRef });

  return (
    <section ref={containerRef} className="w-full bg-black text-[#f5f5f7] py-24 md:py-32 overflow-hidden relative z-20">
      <div className="max-w-[980px] mx-auto px-6 md:px-12 flex flex-col items-center">
        
        {/* Header Text */}
        <div className="text-center mb-16 md:mb-20 space-y-6 w-full px-4">
          
          {/* Title: Forces exact 2 lines on desktop */}
          <h2 className="fc-text-anim text-[40px] lg:text-[56px] font-semibold leading-[1.07] tracking-[-0.01em] text-white flex flex-col items-center">
            <span className="md:whitespace-nowrap">Camera trước 18MP Center Stage.</span>
            <span className="md:whitespace-nowrap text-center">Đưa căn chỉnh khung hình lên đẳng cấp mới.</span>
          </h2>
          
          {/* Paragraph Desktop: Exact 4 lines */}
          <p className="fc-text-anim text-[19px] lg:text-[21px] font-medium text-[#86868b] leading-[1.381] tracking-[0.011em] mx-auto hidden md:flex flex-col items-center">
            <span className="whitespace-nowrap">Camera trước mới mang đến cho bạn những cách linh hoạt để căn chỉnh khung hình khi</span>
            <span className="whitespace-nowrap">chụp ảnh và quay video – và hơn thế nữa. Chạm để mở rộng trường ảnh và xoay từ khung</span>
            <span className="whitespace-nowrap">hình dọc sang khung hình ngang <span className="text-white">mà không cần di chuyển iPhone</span>. Và khi bạn bè góp mặt</span>
            <span className="whitespace-nowrap">vào khung hình, trường ảnh sẽ mở rộng để ghi hình được nhiều người hơn trong ảnh selfie.</span>
          </p>

          {/* Paragraph Mobile: Auto wrap */}
          <p className="fc-text-anim text-[17px] font-medium text-[#86868b] leading-[1.4] tracking-[0.011em] mx-auto md:hidden block max-w-[90%]">
            Camera trước mới mang đến cho bạn những cách linh hoạt để căn chỉnh khung hình khi chụp ảnh và quay video – và hơn thế nữa. Chạm để mở rộng trường ảnh và xoay từ khung hình dọc sang khung hình ngang <span className="text-white">mà không cần di chuyển iPhone</span>. Và khi bạn bè góp mặt vào khung hình, trường ảnh sẽ mở rộng để ghi hình được nhiều người hơn trong ảnh selfie.
          </p>
          
        </div>

        {/* The Frame & Media */}
        <div className="fc-frame-anim relative w-[300px] md:w-[340px] aspect-[460/940] mx-auto z-10 flex flex-col items-center mt-8">
          
          {/* Phone Frame Mask */}
          <img 
            src="/images/frameFrontCam.png" 
            alt="iPhone Frame" 
            className="absolute inset-0 w-full h-full object-cover z-20 pointer-events-none drop-shadow-2xl"
          />

          {/* Media Content Container (Behind Frame) 
              Dùng padding chuẩn xác để video nằm lọt lòng và bo góc tròn khớp với viền điện thoại */}
          <div className="absolute top-[1.2%] bottom-[1.2%] left-[3%] right-[3%] rounded-[2.8rem] md:rounded-[3.2rem] overflow-hidden z-10 bg-black">
            {TABS.map((tab, idx) => (
              <div 
                key={tab.id}
                className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${activeTab === idx ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
              >
                {tab.type === 'video' ? (
                  <video 
                    ref={(el) => {
                      if (el) {
                        if (activeTab === idx) {
                          el.play().catch(() => {});
                        } else {
                          el.pause();
                        }
                      }
                    }}
                    src={tab.src}
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-contain bg-black"
                  />
                ) : (
                  <img 
                    src={tab.src}
                    alt={tab.label}
                    className="w-full h-full object-contain bg-black"
                  />
                )}
              </div>
            ))}
          </div>

        </div>

        {/* Interactive Tabs (Below the phone) */}
        <div className="fc-frame-anim mt-10 md:mt-12 w-full px-4 md:px-0 md:max-w-[520px] z-30 flex justify-center mx-auto">
          <div className="bg-[#3a3a3c] rounded-[2rem] p-1.5 flex items-center justify-between w-full shadow-2xl relative">
            
            {/* Sliding White Background */}
            <div className="absolute inset-1.5 z-0 flex pointer-events-none">
              <div 
                className="w-1/4 h-full bg-white rounded-[1.5rem] shadow-md transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{ transform: `translateX(${activeTab * 100}%)` }}
              />
            </div>

            {TABS.map((tab, idx) => {
              const Icon = tab.icon;
              const isActive = activeTab === idx;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(idx)}
                  className={`relative z-10 flex-1 flex flex-col items-center justify-center py-3.5 px-1.5 rounded-[1.5rem] transition-colors duration-400 ease-out ${
                    isActive ? 'text-black' : 'text-[#d2d2d7] hover:text-white'
                  }`}
                >
                  <Icon className={`w-[22px] h-[22px] mb-1.5 transition-colors duration-300 ${isActive ? 'text-black' : 'text-[#d2d2d7]'}`} />
                  <span className="text-[11px] md:text-[12px] font-semibold text-center whitespace-pre-line leading-tight">
                    {tab.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab Description (Below tabs) */}
        <div className="fc-frame-anim mt-10 relative text-center w-full max-w-[650px] mx-auto min-h-[120px] md:min-h-[90px]">
          {TABS.map((tab, idx) => (
            <p 
              key={tab.id}
              className={`absolute top-0 left-0 w-full text-[17px] md:text-[19px] text-[#86868b] font-medium transition-opacity duration-700 ease-in-out ${
                activeTab === idx ? 'opacity-100 pointer-events-auto z-10' : 'opacity-0 pointer-events-none z-0'
              }`}
            >
              {tab.description}
            </p>
          ))}
        </div>

      </div>
    </section>
  );
}
