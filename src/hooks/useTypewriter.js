import { useEffect, useState } from 'react'

export default function useTypewriter(text, speed = 25) {
  const [output, setOutput] = useState('')

  useEffect(() => {
    let index = 0
    const timer = setInterval(() => {
      index += 1
      setOutput(text.slice(0, index))
      if (index >= text.length) clearInterval(timer)
    }, speed)
    return () => clearInterval(timer)
  }, [text, speed])

  return output
}
