"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Algorithm = "sstf" | "look" | "clook"

interface HeadMovement {
  position: number
  order: number
}

export default function DiskSchedulingPage() {
  const [diskSize, setDiskSize] = useState<number>(200)
  const [headPosition, setHeadPosition] = useState<number>(50)
  const [requestSequence, setRequestSequence] = useState<string>("98, 183, 37, 122, 14, 124, 65, 67")
  const [algorithm, setAlgorithm] = useState<Algorithm>("clook")
  const [requests, setRequests] = useState<number[]>([])
  const [headMovements, setHeadMovements] = useState<HeadMovement[]>([])
  const [totalHeadMovement, setTotalHeadMovement] = useState<number>(0)
  const [error, setError] = useState<string>("")
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Parse the request sequence into an array of numbers
  useEffect(() => {
    try {
      const parsed = requestSequence
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item !== "")
        .map((item) => Number.parseInt(item, 10))

      if (parsed.some(isNaN)) {
        setError("Invalid request sequence. Please enter comma-separated numbers.")
      } else if (parsed.some((pos) => pos < 0 || pos >= diskSize)) {
        setError(`All positions must be between 0 and ${diskSize - 1}.`)
      } else {
        setRequests(parsed)
        setError("")
      }
    } catch (e) {
      setError("Invalid request sequence format")
    }
  }, [requestSequence, diskSize])

  // Run the selected disk scheduling algorithm
  const runAlgorithm = () => {
    if (requests.length === 0) {
      setError("Please enter a valid request sequence")
      return
    }

    if (headPosition < 0 || headPosition >= diskSize) {
      setError(`Head position must be between 0 and ${diskSize - 1}.`)
      return
    }

    let movements: HeadMovement[] = []
    let totalMovement = 0

    // Start with the initial head position
    movements.push({ position: headPosition, order: 0 })

    switch (algorithm) {
      case "sstf":
        const result = sstfAlgorithm(headPosition, [...requests])
        movements = [...movements, ...result.movements]
        totalMovement = result.totalMovement
        break
      case "look":
        const lookResult = lookAlgorithm(headPosition, [...requests])
        movements = [...movements, ...lookResult.movements]
        totalMovement = lookResult.totalMovement
        break
      case "clook":
        const clookResult = clookAlgorithm(headPosition, [...requests])
        movements = [...movements, ...clookResult.movements]
        totalMovement = clookResult.totalMovement
        break
    }

    setHeadMovements(movements)
    setTotalHeadMovement(totalMovement)
  }

  // SSTF (Shortest Seek Time First) Algorithm
  const sstfAlgorithm = (start: number, requestsArray: number[]) => {
    let currentPosition = start
    const movements: HeadMovement[] = []
    let totalMovement = 0
    const remainingRequests = requestsArray.map((pos, index) => ({ position: pos, order: index }))

    for (let i = 0; i < requestsArray.length; i++) {
      // Find the request with the shortest seek time
      let shortestSeekIndex = 0
      let shortestSeekDistance = Math.abs(remainingRequests[0].position - currentPosition)

      for (let j = 1; j < remainingRequests.length; j++) {
        const distance = Math.abs(remainingRequests[j].position - currentPosition)
        if (distance < shortestSeekDistance) {
          shortestSeekDistance = distance
          shortestSeekIndex = j
        }
      }

      // Move to the request with the shortest seek time
      const nextRequest = remainingRequests[shortestSeekIndex]
      movements.push({ position: nextRequest.position, order: i + 1 })
      totalMovement += shortestSeekDistance
      currentPosition = nextRequest.position

      // Remove the processed request
      remainingRequests.splice(shortestSeekIndex, 1)
    }

    return { movements, totalMovement }
  }

  // LOOK Algorithm
  const lookAlgorithm = (start: number, requestsArray: number[]) => {
    let currentPosition = start
    const movements: HeadMovement[] = []
    let totalMovement = 0

    // Sort requests by position
    const sortedRequests = [...requestsArray].sort((a, b) => a - b)

    // Find the position where head is or would be in the sorted array
    let headIndex = sortedRequests.findIndex((pos) => pos >= currentPosition)
    if (headIndex === -1) headIndex = sortedRequests.length

    // Requests greater than or equal to the head position (moving right)
    const rightRequests = sortedRequests.slice(headIndex)

    // Requests less than the head position (moving left)
    const leftRequests = sortedRequests.slice(0, headIndex).reverse()

    // Process requests to the right first, then to the left
    const sequence = [...rightRequests, ...leftRequests]

    for (let i = 0; i < sequence.length; i++) {
      const nextPosition = sequence[i]
      movements.push({ position: nextPosition, order: i + 1 })
      totalMovement += Math.abs(nextPosition - currentPosition)
      currentPosition = nextPosition
    }

    return { movements, totalMovement }
  }

  // CLOOK (Circular LOOK) Algorithm
  const clookAlgorithm = (start: number, requestsArray: number[]) => {
    let currentPosition = start
    const movements: HeadMovement[] = []
    let totalMovement = 0

    // Sort requests by position
    const sortedRequests = [...requestsArray].sort((a, b) => a - b)

    // Find the position where head is or would be in the sorted array
    let headIndex = sortedRequests.findIndex((pos) => pos >= currentPosition)
    if (headIndex === -1) headIndex = sortedRequests.length

    // Requests greater than or equal to the head position
    const rightRequests = sortedRequests.slice(headIndex)

    // Requests less than the head position
    const leftRequests = sortedRequests.slice(0, headIndex)

    // Process requests to the right first, then wrap around to the leftmost request
    const sequence = [...rightRequests, ...leftRequests]

    for (let i = 0; i < sequence.length; i++) {
      const nextPosition = sequence[i]
      movements.push({ position: nextPosition, order: i + 1 })

      // Calculate the actual movement
      if (i > 0 && i === rightRequests.length) {
        // This is the wrap-around point - we don't count the seek time from the rightmost to leftmost
        // We only count the actual distance between consecutive requests
        totalMovement += Math.abs(nextPosition - currentPosition)
      } else {
        totalMovement += Math.abs(nextPosition - currentPosition)
      }

      currentPosition = nextPosition
    }

    return { movements, totalMovement }
  }

  // Draw the visualization on canvas
  useEffect(() => {
    if (!canvasRef.current || headMovements.length === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Set canvas dimensions
    const width = canvas.width
    const height = canvas.height
    const padding = 40
    const graphHeight = height - 80

    // Get all unique positions for the number line (including head position and requests)
    const allPositions = [...new Set([headPosition, ...requests])].sort((a, b) => a - b)

    // Draw number line
    ctx.beginPath()
    ctx.moveTo(padding, 30)
    ctx.lineTo(width - padding, 30)
    ctx.strokeStyle = "#000"
    ctx.lineWidth = 2
    ctx.stroke()

    // Draw ticks and labels on number line
    allPositions.forEach((position) => {
      const x = padding + (position / diskSize) * (width - 2 * padding)

      // Draw tick
      ctx.beginPath()
      ctx.moveTo(x, 25)
      ctx.lineTo(x, 35)
      ctx.strokeStyle = "#000"
      ctx.lineWidth = 1
      ctx.stroke()

      // Draw label
      ctx.fillStyle = "#f97316" // Orange color
      ctx.font = "12px Arial"
      ctx.textAlign = "center"
      ctx.fillText(position.toString(), x, 20)
    })

    // Draw head movement graph
    if (headMovements.length > 1) {
      ctx.beginPath()

      // Start at the initial head position
      const startX = padding + (headMovements[0].position / diskSize) * (width - 2 * padding)
      const startY = 80

      ctx.moveTo(startX, startY)

      // Draw lines to each subsequent position
      headMovements.forEach((movement, index) => {
        if (index === 0) return // Skip the first point as we already moved to it

        const x = padding + (movement.position / diskSize) * (width - 2 * padding)
        const y = startY + index * 30 // Move down for each step

        ctx.lineTo(x, y)
      })

      ctx.strokeStyle = "#000"
      ctx.lineWidth = 2
      ctx.stroke()

      // Draw dots at each position
      headMovements.forEach((movement, index) => {
        const x = padding + (movement.position / diskSize) * (width - 2 * padding)
        const y = startY + index * 30

        ctx.beginPath()
        ctx.arc(x, y, 6, 0, Math.PI * 2)
        ctx.fillStyle = "#000"
        ctx.fill()
      })
    }
  }, [headMovements, requests, headPosition, diskSize])

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Disk Scheduling Algorithms</h1>
          <Link href="/">
            <Button variant="outline" size="sm">
              <Home className="mr-2 h-4 w-4" /> Home
            </Button>
          </Link>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Algorithm Configuration</h2>

            <div className="mb-4">
              <Label htmlFor="diskSize">Disk Size (Cylinders)</Label>
              <Input
                id="diskSize"
                type="number"
                value={diskSize}
                onChange={(e) => setDiskSize(Number.parseInt(e.target.value))}
                className="mt-1"
                min={1}
              />
            </div>

            <div className="mb-4">
              <Label htmlFor="headPosition">Initial Head Position</Label>
              <Input
                id="headPosition"
                type="number"
                value={headPosition}
                onChange={(e) => setHeadPosition(Number.parseInt(e.target.value))}
                className="mt-1"
                min={0}
                max={diskSize - 1}
              />
            </div>

            <div className="mb-4">
              <Label htmlFor="requestSequence">Request Sequence</Label>
              <Input
                id="requestSequence"
                value={requestSequence}
                onChange={(e) => setRequestSequence(e.target.value)}
                className="mt-1"
                placeholder="Enter comma-separated cylinder numbers"
              />
            </div>

            <div className="mb-6">
              <Label>Select Algorithm</Label>
              <Select value={algorithm} onValueChange={(value) => setAlgorithm(value as Algorithm)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select an algorithm" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sstf">SSTF (Shortest Seek Time First)</SelectItem>
                  <SelectItem value="look">LOOK</SelectItem>
                  <SelectItem value="clook">CLOOK (Circular LOOK)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={runAlgorithm}>Run Algorithm</Button>

            {totalHeadMovement > 0 && (
              <div className="mt-6 p-4 bg-blue-50 rounded-md">
                <h3 className="font-medium mb-2">Results</h3>
                <div className="font-medium">Total Head Movement: {totalHeadMovement} cylinders</div>
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Disk Head Movement</h2>
            {headMovements.length > 0 ? (
              <div className="h-[400px] w-full">
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={400}
                  className="w-full h-full"
                  style={{ maxHeight: "400px" }}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-[400px] bg-gray-100 rounded-md">
                <p className="text-gray-500">Run an algorithm to see disk head movement</p>
              </div>
            )}

            {headMovements.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Head Movement Sequence</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Step
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cylinder
                        </th>
                        {headMovements.length > 1 && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Movement
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {headMovements.map((movement, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {index === 0 ? "Initial" : index}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{movement.position}</td>
                          {index > 0 && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {Math.abs(movement.position - headMovements[index - 1].position)}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Card>
        </div>

        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">About Disk Scheduling Algorithms</h2>

          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">SSTF (Shortest Seek Time First)</h3>
            <p className="text-gray-700">
              The Shortest Seek Time First algorithm selects the request that requires the least head movement from the
              current position. This minimizes the seek time for each individual request but may cause starvation of
              some requests.
            </p>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">LOOK</h3>
            <p className="text-gray-700">
              The LOOK algorithm moves the disk head in one direction (increasing cylinder numbers) until there are no
              more requests in that direction, then reverses direction and services requests in the opposite direction.
              This prevents the head from moving to the end of the disk unnecessarily.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">CLOOK (Circular LOOK)</h3>
            <p className="text-gray-700">
              The Circular LOOK algorithm is a variant of LOOK that moves the disk head in one direction only. When it
              reaches the end of requests in that direction, it jumps back to the lowest cylinder with pending requests
              and continues moving in the same direction. This provides more uniform servicing of requests.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
