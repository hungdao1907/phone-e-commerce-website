type CinematicVideoSectionProps = {
  id?: string;
};

export function CinematicVideoSection({
  id,
}: CinematicVideoSectionProps) {
  return (
    <section
      id={id}
      className="cinematic-video-section relative min-h-[100svh] overflow-hidden bg-[#0b0f12] text-white"
    >
      <div className="cinematic-video-section__fallback pointer-events-none absolute inset-0 z-0" />
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="cinematic-video-section__video pointer-events-none absolute inset-0 z-[1] h-full w-full object-cover object-center"
        aria-hidden="true"
      >
        <source src="/videos/qp_4928dbd3222df0c6.mp4" type="video/mp4" />
      </video>
      <div className="cinematic-video-section__overlay pointer-events-none absolute inset-0 z-[2]" />
    </section>
  );
}
