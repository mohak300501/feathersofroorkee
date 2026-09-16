import { Quote } from 'lucide-react'

const Poems = () => {
  return (
    <div className='max-w-2xl mx-auto px-4 py-8'>
      <div className='border-2 border-gray-800 rounded-lg p-6 bg-white'>
        <div className='flex justify-between items-center mb-4'>
          <h2 className='text-2xl font-bold font-display'>Birds of Roorkee</h2>
          <Quote className='w-6 h-6 text-gray-500' />
        </div>
        <p className='text-gray-700 leading-relaxed'>
          In Roorkee's realm, where nature's hues reside,<br/>
          A feathered choir, with wings spread far and wide.<br/>
          From emerald trees to skies so vast and blue,<br/>
          A symphony of birds, a breathtaking view.
        </p>
      </div>
    </div>
  )
}

export default Poems
