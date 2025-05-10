"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"

interface Page {
  id: number
  referenceBit: boolean
}

interface PageReference {
  pageId: number
  action: "hit" | "fault"
  replacedPage?: number
}

interface FrameState {
  pageId: number | null
  referenceBit: boolean
  isNew?: boolean
  isReplaced?: boolean
}

export default function SecondChancePage() {
  const [frameCount, setFrameCount] = useState<number>(3)
  const [frames, setFrames] = useState<Page[]>([])
  const [pageSequence, setPageSequence] = useState<string>("0, 4, 1, 4, 2, 4, 3, 4, 2, 4, 0, 4, 1, 4, 2, 4, 3, 4")
  const [pageReferences, setPageReferences] = useState<number[]>([])
  const [currentStep, setCurrentStep] = useState<number>(-1)
  const [tableData, setTableData] = useState<FrameState[][]>([])
  const [hitMissData, setHitMissData] = useState<("hit" | "fault")[]>([])
  const [pointer, setPointer] = useState<number>(0)
  const [error, setError] = useState<string>("")
  const [autoPlay, setAutoPlay] = useState<boolean>(false)
  const [autoPlaySpeed, setAutoPlaySpeed] = useState<number>(1000)
  const [showReferenceBits, setShowReferenceBits] = useState<boolean>(true)
  const [pageHistory, setPageHistory] = useState<Set<number>>(new Set())

  // Parse the page sequence into an array of numbers
  useEffect(() => {
    try {
      const parsed = pageSequence
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item !== "")
        .map((item) => Number.parseInt(item, 10))

      if (parsed.some(isNaN)) {
        setError("Invalid page sequence. Please enter comma-separated numbers.")
      } else {
        setPageReferences(parsed)
        setError("")
      }
    } catch (e) {
      setError("Invalid page sequence format")
    }
  }, [pageSequence])

  // Initialize frames and table data
  useEffect(() => {
    initializeFrames(frameCount)
  }, [frameCount])

  const initializeFrames = (count: number) => {
    setFrames(Array(count).fill(null))
    setTableData([])
    setHitMissData([])
    setPointer(0)
    setCurrentStep(-1)
    setPageHistory(new Set())
    setError("")
  }

  const handleFrameCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value)
    if (!isNaN(value) && value > 0) {
      setFrameCount(value)
    }
  }

  // Run the Second Chance algorithm for the entire page sequence
  const runFullSimulation = () => {
    if (pageReferences.length === 0) {
      setError("Please enter a valid page sequence")
      return
    }

    // Reset state
    let currentFrames: (Page | null)[] = Array(frameCount).fill(null)
    let currentPointer = 0
    const newTableData: FrameState[][] = []
    const newHitMissData: ("hit" | "fault")[] = []
    const seenPages = new Set<number>()

    // Process each page reference
    pageReferences.forEach((pageId) => {
      // Create a deep copy of the current frames for this step
      const framesCopy = currentFrames.map((frame) => (frame ? { ...frame } : null))

      // Check if page is already in a frame (page hit)
      const existingFrameIndex = framesCopy.findIndex((frame) => frame !== null && frame.id === pageId)

      if (existingFrameIndex !== -1) {
        // Page hit - set reference bit to 1 (giving it a second chance)
        if (framesCopy[existingFrameIndex]) {
          framesCopy[existingFrameIndex]!.referenceBit = true
        }
        newHitMissData.push("hit")
      } else {
        // Page fault - need to find a frame using Second Chance algorithm
        newHitMissData.push("fault")

        // If there's an empty frame, use it
        const emptyFrameIndex = framesCopy.findIndex((frame) => frame === null)
        if (emptyFrameIndex !== -1) {
          // New pages start with reference bit 0
          framesCopy[emptyFrameIndex] = { id: pageId, referenceBit: false }
        } else {
          // No empty frames, use Second Chance algorithm
          let replacementFound = false
          while (!replacementFound) {
            if (framesCopy[currentPointer]!.referenceBit) {
              // Give second chance
              framesCopy[currentPointer]!.referenceBit = false
              currentPointer = (currentPointer + 1) % frameCount
            } else {
              // Replace this page
              framesCopy[currentPointer] = { id: pageId, referenceBit: false }
              currentPointer = (currentPointer + 1) % frameCount
              replacementFound = true
            }
          }
        }
      }

      // If this page has been seen before and is being referenced again, set its reference bit to 1
      if (seenPages.has(pageId)) {
        const pageIndex = framesCopy.findIndex((frame) => frame !== null && frame.id === pageId)
        if (pageIndex !== -1) {
          framesCopy[pageIndex]!.referenceBit = true
        }
      } else {
        // Add to seen pages
        seenPages.add(pageId)
      }

      // Convert to FrameState format for the table
      const frameState = framesCopy.map((frame): FrameState => {
        if (frame === null) {
          return { pageId: null, referenceBit: false }
        }
        return {
          pageId: frame.id,
          referenceBit: frame.referenceBit,
          isNew: frame.id === pageId && newHitMissData[newHitMissData.length - 1] === "fault",
          isReplaced: false, // We don't track this in the full simulation
        }
      })

      newTableData.push(frameState)
      currentFrames = framesCopy
    })

    setTableData(newTableData)
    setHitMissData(newHitMissData)
    setCurrentStep(pageReferences.length - 1)
  }

  // Step through the algorithm one page reference at a time
  const stepForward = () => {
    if (currentStep >= pageReferences.length - 1) return

    const nextStep = currentStep + 1
    const pageId = pageReferences[nextStep]

    // Create a copy of the current frames
    const framesCopy = [...frames]
    let currentPointer = pointer
    let action: "hit" | "fault" = "fault"
    const newPageHistory = new Set(pageHistory)

    // Check if page is already in a frame (page hit)
    const existingFrameIndex = framesCopy.findIndex((frame) => frame !== null && frame?.id === pageId)

    if (existingFrameIndex !== -1) {
      // Page hit - set reference bit to 1 (giving it a second chance)
      if (framesCopy[existingFrameIndex]) {
        framesCopy[existingFrameIndex] = {
          ...framesCopy[existingFrameIndex]!,
          referenceBit: true,
        }
      }
      action = "hit"
    } else {
      // Page fault - need to find a frame using Second Chance algorithm
      action = "fault"

      // If there's an empty frame, use it
      const emptyFrameIndex = framesCopy.findIndex((frame) => frame === null)
      if (emptyFrameIndex !== -1) {
        // New pages start with reference bit 0
        framesCopy[emptyFrameIndex] = { id: pageId, referenceBit: false }
      } else {
        // No empty frames, use Second Chance algorithm
        let replacementFound = false
        while (!replacementFound) {
          if (framesCopy[currentPointer]?.referenceBit) {
            // Give second chance
            framesCopy[currentPointer] = {
              ...framesCopy[currentPointer]!,
              referenceBit: false,
            }
            currentPointer = (currentPointer + 1) % frameCount
          } else {
            // Replace this page
            framesCopy[currentPointer] = { id: pageId, referenceBit: false }
            currentPointer = (currentPointer + 1) % frameCount
            replacementFound = true
          }
        }
      }
    }

    // If this page has been seen before and is being referenced again, set its reference bit to 1
    if (pageHistory.has(pageId)) {
      const pageIndex = framesCopy.findIndex((frame) => frame !== null && frame.id === pageId)
      if (pageIndex !== -1) {
        framesCopy[pageIndex].referenceBit = true
      }
    } else {
      // Add to page history
      newPageHistory.add(pageId)
    }

    // Update frames and pointer
    setFrames(framesCopy)
    setPointer(currentPointer)
    setPageHistory(newPageHistory)

    // Update table data
    const newFrameState = framesCopy.map((frame): FrameState => {
      if (frame === null) {
        return { pageId: null, referenceBit: false }
      }
      return {
        pageId: frame.id,
        referenceBit: frame.referenceBit,
        isNew: frame.id === pageId && action === "fault",
        isReplaced: false,
      }
    })

    const newTableData = [...tableData]
    newTableData[nextStep] = newFrameState

    // Update hit/miss data
    const newHitMissData = [...hitMissData]
    newHitMissData[nextStep] = action

    setTableData(newTableData)
    setHitMissData(newHitMissData)
    setCurrentStep(nextStep)
  }

  // Reset the simulation
  const resetSimulation = () => {
    initializeFrames(frameCount)
  }

  // Auto-play effect
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null

    if (autoPlay && currentStep < pageReferences.length - 1) {
      timer = setTimeout(() => {
        stepForward()
      }, autoPlaySpeed)
    }

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [autoPlay, currentStep, pageReferences.length, autoPlaySpeed])

  // Calculate page faults
  const pageFaults = hitMissData.filter((action) => action === "fault").length

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Second Chance Page Replacement</h1>
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
              <Label htmlFor="frameCount">Number of Page Frames</Label>
              <div className="flex mt-1">
                <Input
                  id="frameCount"
                  type="number"
                  value={frameCount}
                  onChange={handleFrameCountChange}
                  className="mr-2"
                  min={1}
                />
                <Button onClick={() => initializeFrames(frameCount)}>Initialize</Button>
              </div>
            </div>

            <div className="mb-4">
              <Label htmlFor="pageSequence">Page Reference Sequence</Label>
              <Input
                id="pageSequence"
                value={pageSequence}
                onChange={(e) => setPageSequence(e.target.value)}
                className="mt-1"
                placeholder="Enter comma-separated page numbers"
              />
            </div>

            <div className="flex space-x-2 mb-4">
              <Button onClick={runFullSimulation}>Run Full Simulation</Button>
              <Button onClick={stepForward} disabled={currentStep >= pageReferences.length - 1}>
                Step Forward
              </Button>
              <Button onClick={resetSimulation}>Reset</Button>
            </div>

            <div className="flex items-center space-x-2 mb-4">
              <Checkbox
                id="autoPlay"
                checked={autoPlay}
                onCheckedChange={(checked) => setAutoPlay(checked as boolean)}
              />
              <Label htmlFor="autoPlay">Auto Play</Label>
              {autoPlay && (
                <Input
                  type="number"
                  value={autoPlaySpeed}
                  onChange={(e) => setAutoPlaySpeed(Number(e.target.value))}
                  className="w-24 ml-2"
                  min={100}
                  max={5000}
                  step={100}
                />
              )}
              {autoPlay && <span className="text-sm text-gray-500">ms</span>}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="showReferenceBits"
                checked={showReferenceBits}
                onCheckedChange={(checked) => setShowReferenceBits(checked as boolean)}
              />
              <Label htmlFor="showReferenceBits">Show Reference Bits</Label>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-md">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Simulation Results</h3>
                <div className="text-sm">
                  Step: {currentStep + 1} / {pageReferences.length}
                </div>
              </div>
              <div className="mt-2">
                <div className="font-medium">Page Faults: {pageFaults}</div>
                <div className="font-medium">
                  Hit Ratio:{" "}
                  {hitMissData.length > 0
                    ? (((hitMissData.length - pageFaults) / hitMissData.length) * 100).toFixed(2)
                    : 0}
                  %
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Visualization</h2>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border border-purple-300 bg-purple-200 p-2">p/F</th>
                    {pageReferences.map((page, index) => (
                      <th
                        key={index}
                        className={`border border-purple-300 ${
                          index <= currentStep ? "bg-purple-500 text-white" : "bg-purple-200"
                        } p-2 min-w-[40px]`}
                      >
                        {page}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: frameCount }).map((_, frameIndex) => (
                    <tr key={frameIndex}>
                      <td className="border border-purple-300 bg-purple-100 p-2 font-medium">F{frameIndex + 1}</td>
                      {pageReferences.map((_, pageIndex) => {
                        const frameData = tableData[pageIndex]?.[frameIndex]
                        const isCurrentStep = pageIndex === currentStep

                        return (
                          <td
                            key={pageIndex}
                            className={`border border-purple-300 p-2 text-center ${
                              pageIndex > currentStep
                                ? "bg-gray-50"
                                : frameData?.isNew
                                  ? "bg-green-100"
                                  : frameData?.isReplaced
                                    ? "bg-red-100"
                                    : "bg-purple-50"
                            }`}
                          >
                            {pageIndex <= currentStep && frameData?.pageId !== null && (
                              <div className="flex flex-col items-center">
                                <span>{frameData?.pageId}</span>
                                {showReferenceBits && (
                                  <span className="text-xs text-gray-500">
                                    {frameData?.referenceBit ? "R:1" : "R:0"}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                  <tr>
                    <td className="border border-purple-300 bg-purple-100 p-2 font-medium">H/M</td>
                    {pageReferences.map((_, index) => (
                      <td
                        key={index}
                        className={`border border-purple-300 p-2 text-center ${
                          index > currentStep
                            ? "bg-gray-50"
                            : hitMissData[index] === "hit"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {index <= currentStep && (hitMissData[index] === "hit" ? "H" : "M")}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">How Second Chance Works</h2>
          <p className="mb-4">
            The Second Chance algorithm is an improvement over the First-In-First-Out (FIFO) page replacement algorithm.
            It uses a reference bit to give pages that have been referenced a second chance before being replaced.
          </p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>When a page is first loaded into memory, its reference bit is set to 0.</li>
            <li>When a page is referenced again, its reference bit is set to 1 (giving it a "second chance").</li>
            <li>
              When a page fault occurs and all frames are full, the algorithm checks the reference bit of the oldest
              page.
            </li>
            <li>If the reference bit is 0, the page is replaced.</li>
            <li>
              If the reference bit is 1, it's given a second chance: the bit is set to 0, and the algorithm moves to the
              next page.
            </li>
            <li>This continues until a page with a reference bit of 0 is found.</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
