import React from 'react'

export default function Placeholder({ children }: { children?: React.ReactNode }) {
  return <div className="p-4 bg-white border rounded">{children}</div>
}
