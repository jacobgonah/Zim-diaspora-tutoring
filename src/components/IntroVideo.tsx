export function IntroVideo({ src }: { src: string }) {
  return (
    <video
      controls
      playsInline
      preload="metadata"
      src={src}
      className="mt-2 aspect-[9/16] w-[180px] max-w-full rounded-lg bg-black object-contain"
    />
  )
}
