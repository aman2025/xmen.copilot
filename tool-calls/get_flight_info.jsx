'use client'

import { Button } from '@/components/ui/button'

const get_flight_info = ({ params, onComplete }) => {
  const { originCity, destinationCity } = params || {}

  // Mock flight data - in a real application, this would come from an API
  const mockFlightData = {
    success: true,
    data: {
      airline: 'Delta',
      flight_number: 'DL123',
      flight_date: 'May 7th, 2024',
      flight_time: '10:00AM',
      origin: originCity,
      destination: destinationCity,
    },
  }

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-2">
        <div>Searching for flights:</div>
        <div className="text-sm text-gray-600">From: {originCity}</div>
        <div className="text-sm text-gray-600">To: {destinationCity}</div>
      </div>
      <Button onClick={() => onComplete(mockFlightData)} className="w-200 rounded-[10px]">
        Complete Search
      </Button>
    </div>
  )
}

export default get_flight_info
