{/*
import { useEffect, useState } from 'react'

export function useDarkMode() {
  const [dark, setDark] = useState(
    () => localStorage.getItem('theme') === 'dark'
  )
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])
  return [dark, setDark]
}
*/}

import { useEffect, useState } from 'react'

export function useDarkMode() {
  const [dark, setDark] = useState(
    () => localStorage.getItem('theme') === 'dark'
  )
  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])
  return [dark, setDark]
}