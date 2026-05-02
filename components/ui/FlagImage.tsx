import { FLAG_PATHS } from '@/lib/data/countries'

interface Props {
  country: string
  size?: number
  className?: string
}

export function FlagImage({ country, size = 20, className = '' }: Props) {
  const path = FLAG_PATHS[country]
  if (!path) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-full bg-[#333] text-[10px] font-bold text-[#888] ${className}`}
        style={{ width: size, height: size, minWidth: size }}
      >
        {country.slice(0, 2).toUpperCase()}
      </span>
    )
  }
  return (
    <img
      src={path}
      alt={country}
      width={size}
      height={size}
      className={`rounded-full object-cover inline-block ${className}`}
      style={{ minWidth: size }}
    />
  )
}
