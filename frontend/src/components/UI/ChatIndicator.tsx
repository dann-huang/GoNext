'use client';

import { Pointer } from 'lucide-react';

export default function ChatIndicator() {

  return <div className='fixed bottom-15 right-15 z-50 animate-bounce'>
    <Pointer
      className='w-16 h-16 text-error'
      style={{ transform: 'rotate(135deg)' }}
    />
  </div>;
}
