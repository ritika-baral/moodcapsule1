export default function FloatingOrbs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-32 top-10 h-[26rem] w-[26rem] rounded-full bg-dusk-violet/25 blur-[110px] animate-float" />
      <div className="absolute -right-24 top-40 h-[22rem] w-[22rem] rounded-full bg-ember-rose/20 blur-[100px] animate-float-slow" />
      <div className="absolute bottom-0 left-1/3 h-[24rem] w-[24rem] rounded-full bg-amber-glow/[0.14] blur-[110px] animate-float" />
      <div className="absolute bottom-20 right-10 h-[16rem] w-[16rem] rounded-full bg-teal-quiet/[0.12] blur-[90px] animate-float-slow" />
      <div className="absolute inset-0 bg-void/10" />
    </div>
  )
}
