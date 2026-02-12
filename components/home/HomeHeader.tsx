"use client"

export function HomeHeader() {
  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 18) return "Good afternoon"
    return "Good evening"
  }

  return (
    <div className="mb-12 text-center">
      <h1 className="text-[48px] font-bold text-gray-900 leading-[1.1] tracking-[-0.02em]">
        {getGreeting()}
      </h1>
    </div>
  )
}
