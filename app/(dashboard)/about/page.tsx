import type { JSX } from 'react'

export default function AboutPage(): JSX.Element {
  return (
    <div className="p-8 max-w-2xl mx-auto text-slate-100 mt-10">
      <div className="border border-slate-800 rounded-2xl bg-[#121724] p-8 shadow-xl text-center space-y-4">
        <h1 className="text-3xl font-bold text-amber-400">About Me</h1>
        <p className="text-lg text-slate-300">
          My name is PM and I am a CS student who likes making stuff.
        </p>
      </div>
    </div>
  )
}